import { useState, useEffect } from 'react';
import { useSelector, connect } from 'react-redux';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import Supercluster from 'supercluster';
import { isValidLocation } from '../../util/validation';
import variables from '../../variables.json';
import { fitBoundsWithPadding, fitBuilding, calculatePoiCorners } from '../../util/mapUtils';

const Pois = ({
  mapRef,
  mapLoaded,
  displayedDevices,
  styleLoaded,
  selectedPoi,
  setDeviceSelected,
  isListOpen,
  screenWidth,
  selectedPoiId,
  setSelectedPoiId
}) => {
  const [layersOrdered, setLayersOrdered] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [supercluster, setSupercluster] = useState(null);
  const [move, setMove] = useState(0);

  const pois = useSelector((state) => state.map.pois);

  // Initialize Supercluster
  useEffect(() => {
    if (mapLoaded && pois) {
      if (pois.length) {
        const index = new Supercluster({
          radius: 800,
          maxZoom: 19,
          minZoom: 18
        });
        index.load(
          pois.map((poi) => ({
            type: 'Feature',
            properties: { ...poi },
            geometry: {
              type: 'Point',
              coordinates: [poi.location.lng, poi.location.lat]
            }
          }))
        );
        setSupercluster(index);
      }
    }
  }, [mapLoaded, pois]);

  useEffect(() => {
    if (mapLoaded && pois?.length) {
      if (mapRef && styleLoaded) {
        if (pois[0].provider?.apikey) {
          fitBuilding(pois[0], mapRef);
          selectedPoiId !== pois[0].poiId && setSelectedPoiId(pois[0].poiId);
        }
      }
    }
  }, [mapLoaded, styleLoaded, mapRef, pois]);

  // Add markers when map is loaded and POIs are available
  // Will update markers when POIs change (e.g. refresh is clicked)
  useEffect(() => {
    if (mapLoaded && pois) {
      if (!selectedPoiId) {
        addAllMarkers();
      } else {
        // Hide POI images if the selected POI is not in the list of POIs
        const selectedPoiExists = pois.some((poi) => poi.poiId === selectedPoiId);
        if (!selectedPoiExists) {
          hideAllPoiImages();
          addAllMarkers();
        }
      }
    }
  }, [mapLoaded, pois, supercluster, move, selectedPoiId]);

  // Handle POI selection from the <List> component
  useEffect(() => {
    const handlePoiSelection = async () => {
      if (mapLoaded && mapRef) {
        if (selectedPoi && selectedPoi.location) {
          removeAllMarkers();
          setSelectedPoiId(selectedPoi.poiId);
          addPoiImage(selectedPoi);
          setShowCloseButton(true);
        }
      }
    };
    handlePoiSelection();
  }, [mapLoaded, selectedPoi]);

  // Update markers when zoom changes
  // Causes a lot of re-renders, may need to be optimized (or use moveend event)
  useEffect(() => {
    if (mapRef && mapLoaded) {
      const handleMovehange = () => {
        setMove(mapRef.getBounds());
      };

      mapRef.on('move', handleMovehange);

      return () => {
        mapRef.off('move', handleMovehange);
      };
    }
  }, [mapRef, mapLoaded]);

  // Set the selected Device, on the List component
  useEffect(() => {
    if (selectedPoiId) {
      const selectedPoi = pois.find((poi) => poi.poiId === selectedPoiId);
      setDeviceSelected(selectedPoi);
    }
  }, [selectedPoiId]);

  // Adjust layer ordering
  useEffect(() => {
    if (mapLoaded && mapRef && !layersOrdered) {
      const markerLayer = mapRef?.getLayer('marker-layer');
      const clusterLayer = mapRef?.getLayer('clusters');
      const clusterCount = mapRef?.getLayer('cluster-count');
      const poiLayer = mapRef?.getLayer('poi-layer');

      if (clusterLayer && poiLayer) mapRef.moveLayer('poi-layer', 'clusters');
      if (markerLayer && clusterLayer && clusterCount) {
        setLayersOrdered(true);
      }
    }
  }, [displayedDevices, mapRef, mapLoaded, layersOrdered]);

  // Update building icons when zoommed out enough
  useEffect(() => {
    if (mapRef && mapLoaded) {
      let lastZoomLevel = mapRef.getZoom();

      // Add a zoom event listener to the map
      const handleZoomChange = () => {
        const zoomLevel = mapRef.getZoom();
        if (zoomLevel < 15 && lastZoomLevel >= 15) {
          // Hide all POI images if zoom level is below 15
          hideAllPoiImages();
          if (!pois[0]?.provider?.apikey) {
            // Show building icons if the device type is not 'Building'
            setSelectedPoiId(null);
            setShowCloseButton(false);
          }
        }
        lastZoomLevel = zoomLevel;
      };

      // Add the event listener to the map, using 'zoomend' to ensure no updates are made during zooming
      mapRef.on('zoom', handleZoomChange);

      // Cleanup the event listener when the component is unmounted
      return () => {
        mapRef.off('zoom', handleZoomChange);
      };
    }
  }, [mapRef, mapLoaded]);

  // Add all building markers using Supercluster
  const addAllMarkers = async () => {
    if (!supercluster) return;

    removeAllMarkers();

    const bounds = mapRef.getBounds().toArray().flat();
    const clusters = supercluster.getClusters(bounds, Math.round(mapRef.getZoom()));

    const newMarkers = await Promise.all(
      clusters.map(async (cluster) => {
        const [lng, lat] = cluster.geometry.coordinates;
        const isCluster = cluster.properties.cluster;
        if (isCluster) {
          return await addClusterMarker(lng, lat, cluster);
        } else {
          return await addBuildingIconMarker(lng, lat, cluster.properties);
        }
      })
    );
    setMarkers(newMarkers);
  };

  // Add a cluster marker
  const addClusterMarker = async (lng, lat, cluster) => {
    // Create a marker element
    const markerElement = document.createElement('div');
    markerElement.style.width = '30px';
    markerElement.style.height = '30px';
    markerElement.style.backgroundImage = `url(${variables.BUILDINGS_ICON})`;
    markerElement.style.backgroundSize = 'cover';
    markerElement.style.cursor = 'default';

    // Display the number of points on the cluster marker
    markerElement.innerText = cluster.properties.point_count;
    markerElement.style.display = 'flex';
    markerElement.style.alignItems = 'center';
    markerElement.style.justifyContent = 'center';
    markerElement.style.color = 'white';
    markerElement.style.fontWeight = 'bold';

    // Add marker to the map
    const marker = new mapboxgl.Marker(markerElement).setLngLat([lng, lat]).addTo(mapRef);

    // MaxBuildings = Number of buildings to show in the popup
    const MaxBuildings = 3;

    // Get the children of the cluster
    const children = supercluster.getLeaves(cluster.id, MaxBuildings);

    // Display the children of the cluster in a popup
    const popupElement = document.createElement('div');

    // Updated part of addClusterMarker
    popupElement.innerHTML = ''; // Clear the popup container
    popupElement.style.margin = '5px'; // Add some space around the popup

    children.forEach((child) => {
      const childElement = createPopupChildElement(child);
      popupElement.appendChild(childElement);
    });

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: true,
      closeOnMove: true,
      interactive: true,
      offset: [0, -30] // Offset the popup slightly to the top of the marker
    })
      .setLngLat([lng, lat])
      .setDOMContent(popupElement);

    // add popup to marker (marker will auto delete the popup when removed)
    marker.setPopup(popup);

    let popupTimeout;

    // Show the popup on hover
    const showPopup = () => {
      clearTimeout(popupTimeout);
      if (!popup.isOpen()) {
        popup.addTo(mapRef);
      }
    };

    // Hide the popup with a slight delay to handle flickering
    const hidePopup = () => {
      popupTimeout = setTimeout(() => {
        if (popup.isOpen()) {
          popup.remove();
        }
      }, 300);
    };

    markerElement.addEventListener('mouseenter', showPopup);
    markerElement.addEventListener('mouseleave', hidePopup);

    popupElement.addEventListener('mouseenter', showPopup);
    popupElement.addEventListener('mouseleave', hidePopup);

    // Handle marker click event (stop propagation to prevent map click event)
    markerElement.addEventListener('click', async (event) => {
      event.stopPropagation();
      //   const expansionZoom = Math.min(
      //     supercluster.getClusterExpansionZoom(cluster.id),
      //     20
      //   );

      //   mapRef.flyTo({
      //     center: [lng, lat],
      //     zoom: expansionZoom,
      //     essential: true,
      //   });

      //   // Wait until the zoom is completed, otherwise this cluster will not be removed
      //   await new Promise((resolve) => {
      //     mapRef.once('moveend', resolve);
      //   });
    });

    return marker;
  };

  // Create a popup child element
  const createPopupChildElement = (child) => {
    const childElement = document.createElement('div');
    childElement.classList.add('popup-child');
    childElement.dataset.poiId = child.properties.poiId;
    childElement.textContent = child.properties.name;

    // Add a click event listener to handle interactions
    childElement.addEventListener('click', async (event) => {
      event.stopPropagation();
      onPopupChildClick(child);
    });

    return childElement;
  };

  const onPopupChildClick = (child) => {
    const poi = child.properties;
    if (poi && typeof poi.name !== 'undefined') {
      if (poi.location && mapRef) {
        removeAllMarkers();
        setSelectedPoiId(poi.poiId);

        addPoiImage(poi);
        setShowCloseButton(true);
      }
    } else {
      console.error("Error: poi is undefined or does not have a 'name' property", poi);
    }
  };

  // Add a single building marker
  const addBuildingIconMarker = async (lng, lat, poi) => {
    // Create a marker element
    const markerElement = document.createElement('div');
    markerElement.style.width = '30px';
    markerElement.style.height = '30px';
    markerElement.style.backgroundImage = `url(${variables.BUILDINGS_ICON})`;
    markerElement.style.backgroundSize = 'cover';
    markerElement.style.cursor = 'pointer';

    // Add marker to the map
    const marker = new mapboxgl.Marker(markerElement).setLngLat([lng, lat]).addTo(mapRef);
    // Create a popup but don't add it to the map yet
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      closeOnMove: true,
      offset: [0, -30] // Offset the popup slightly to the top of the marker
    })
      .setLngLat([lng, lat])
      .setHTML(`<div>${poi.name}</div>`);

    // add popup to marker
    marker.setPopup(popup);

    // Show the popup on hover
    markerElement.addEventListener('mouseenter', () => {
      popup.addTo(mapRef);
    });
    // Hide the popup when the mouse leaves the marker
    markerElement.addEventListener('mouseleave', () => {
      popup.remove();
    });

    // Handle marker click event
    markerElement.addEventListener('click', async (event) => {
      event.stopPropagation();

      if (poi && typeof poi.name !== 'undefined') {
        if (poi.location && mapRef) {
          // Remove all markers (popups will be removed automatically)
          removeAllMarkers();

          // Stop updating the building icons when a POI is selected
          setSelectedPoiId(poi.poiId);

          // Fly to the POI location
          // mapRef.flyTo({ center: [poi.location.lng, poi.location.lat], zoom: 20, essential: true });
          // await new Promise((resolve) => {
          //   mapRef.once('moveend', resolve);
          // });

          // Add POI image to the map
          addPoiImage(poi);

          // Handle exit from indoor if marker is outside indoor
          // Fit building if the device type is 'Building'
          if (poi.provider?.apikey) {
            fitBuilding(poi, mapRef);
          }

          setShowCloseButton(true);
        }
      } else {
        console.error("Error: poi is undefined or does not have a 'name' property", poi);
      }
    });
    return marker; // Return the created marker
  };

  // Remove all markers from the map
  const removeAllMarkers = () => {
    setMarkers((currentMarkers) => {
      currentMarkers.forEach((marker) => marker.remove());
      return [];
    });
  };

  // Add POI image to the map
  const addPoiImage = async (poi) => {
    hideAllPoiImages();
    removeAllMarkers();

    // Check if the POI has a valid location and image
    if (!poi.imageUrl || poi.offset === null || !poi.imgWidth || !poi.imgHeight) return;

    // Extract dimensions and location of the POI
    const { corners, offset } = calculatePoiCorners(poi);

    // Create the POI image source, layer, and fit the map to the image
    const poiImg = createRaster(poi, corners);
    const poisImgLayer = mapRef.getLayer(`${poi.poiId}-layer`);
    const poisImgSource = mapRef.getSource(`${poi.poiId}-source`);

    // Add or update the POI image source
    if (!poisImgSource) {
      mapRef.addSource(`${poi.poiId}-source`, poiImg);
    } else {
      poisImgSource.setCoordinates(corners);
    }

    // Add or update the POI image layer
    if (!poisImgLayer) {
      mapRef.addLayer(
        {
          id: `${poi.poiId}-layer`,
          type: 'raster',
          source: `${poi.poiId}-source`,
          paint: {
            'raster-opacity': 0.65
          }
        },
        'marker-layer'
      );
    }

    // Check viewport width and ignore isListOpen if less than 1000px
    const shouldFitBounds = screenWidth >= 1000 ? isListOpen : false;

    // Fit the map to the POI image
    fitBoundsWithPadding(corners[1], corners[3], mapRef, offset, shouldFitBounds);
  };

  // Hide all POI images
  const hideAllPoiImages = () => {
    pois.forEach((poi) => removePoiImage(poi));
  };

  // Remove POI image from the map
  const removePoiImage = (poi) => {
    const poisImgLayer = mapRef.getLayer(`${poi.poiId}-layer`);
    const poisImgSource = mapRef.getSource(`${poi.poiId}-source`);

    if (poisImgLayer) {
      mapRef.removeLayer(`${poi.poiId}-layer`);
    }
    if (poisImgSource) {
      mapRef.removeSource(`${poi.poiId}-source`);
    }
  };

  // Handle close button click
  const handleCloseButtonClick = () => {
    // removing markers (popups will be removed automatically)
    removeAllMarkers();

    // fly to the center of the map
    mapRef.jumpTo({ center: mapRef.getCenter(), zoom: 14, essential: true });
    hideAllPoiImages();
    setShowCloseButton(false);
    setSelectedPoiId(null);
  };
  // Create raster source for POI image
  const createRaster = (poi, coordinates) => {
    const rasterSource = {
      type: 'image',
      url: poi.imageUrl,
      coordinates: coordinates
    };

    return rasterSource;
  };

  return (
    <>
      {showCloseButton && (
        <button
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '5px',
            padding: '5px 10px',
            cursor: 'pointer'
          }}
          onClick={handleCloseButtonClick}
        >
          Close
        </button>
      )}
    </>
  );
};

const mapStateToProps = (state) => ({
  isListOpen: state.map.isListOpen,
  screenWidth: state.location.screenWidth
});

const mapDispatch = ({ map: { setDeviceSelectedAction } }) => ({
  setDeviceSelected: setDeviceSelectedAction
});

export default connect(mapStateToProps, mapDispatch)(Pois);
