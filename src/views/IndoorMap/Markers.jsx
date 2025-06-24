import { useState, useEffect, useRef, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as turf from '@turf/turf';
import { isValidLocation } from '../../util/validation';
import variables from '../../variables.json';
import Supercluster from 'supercluster';
import { MarkerContext } from '../../context/Map/MarkerContext';
import { createPoint } from '../../util/transformer';
import { findMainDevice } from '../../util/mapUtils';

const Markers = ({ mapRef, mapLoaded, styleLoaded, displayedDevices, setInCluster }) => {
  const dispatch = useDispatch();

  // Selectors
  const devices = useSelector((state) => state.map.devices);
  const deviceSelected = useSelector((state) => state.map.deviceSelected);
  const deviceToFollow = useSelector((state) => state.map.deviceToFollow);
  // const userTenant = useSelector((state) => state.provision.userTenant);
  const distanceMeasurementSelected = useSelector((state) => state.location.distanceMeasurementSelected);
  const loginType = useSelector((state) => state.user.loginType);

  // Dispatch actions
  const setDeviceSelected = (device) => dispatch.map.setDeviceSelectedAction(device);
  const setDeviceToFollow = (device) => dispatch.map.setDeviceToFollowAction(device);
  const setDistancePoints = (points) => dispatch.map.setDistancePointsAction(points);

  // State
  const [markersLoaded, setMarkersLoaded] = useState(false);
  const { selectedDeviceList, setSelectedDeviceList, accuracyThreshold } = useContext(MarkerContext);

  // refs
  const distanceMeasureRef = useRef(distanceMeasurementSelected);
  const clusterRef = useRef(null);
  const selectedDeviceListRef = useRef(selectedDeviceList);

  // UEffects
  useEffect(() => {
    distanceMeasureRef.current = distanceMeasurementSelected;
  }, [distanceMeasurementSelected]);

  useEffect(() => {
    selectedDeviceListRef.current = selectedDeviceList;
  }, [selectedDeviceList]);

  useEffect(() => {
    if (markersLoaded) {
      mapRef.on('move', recalculate);
      mapRef.on('click', 'marker-layer', handleMarkerClick);
      mapRef.on('click', 'clusters', handleClusterClick);
      mapRef.on('click', handleMapClick);
      mapRef.on('moveend', handleMapMoveEnd);
    }

    return () => {
      // Clean up: remove the markers layer and source when the component unmounts
      clearMarkers();
      // Cleanup event listener on component unmount
      mapRef?.off('move', recalculate);
      mapRef?.off('click', 'marker-layer', handleMarkerClick);
      mapRef?.off('click', 'clusters', handleClusterClick);
      mapRef?.off('click', handleMapClick);
      mapRef?.off('moveend', handleMapMoveEnd);
      clusterRef.current = null;
    };
  }, [markersLoaded]);

  useEffect(() => {
    if (mapRef && mapLoaded && styleLoaded) {
      // update markers on every location call
      updateMarkers();
      // follow selected device
      if (
        isValidLocation(deviceToFollow?.location) &&
        // deviceToFollow.organization === userTenant.organization &&
        deviceToFollow.location.speed &&
        deviceToFollow?.telemetry?.isMoving
      ) {
        mapRef.easeTo({
          center: [deviceToFollow.location.lng, deviceToFollow.location.lat]
        });
      }
    }
  }, [displayedDevices, deviceSelected, selectedDeviceList, accuracyThreshold]);

  useEffect(() => {
    if (mapRef && mapLoaded && styleLoaded && devices?.length) {
      addMarkers();
    }
  }, [mapRef, mapLoaded, styleLoaded, devices]);

  // Functions
  const clearMarkers = () => {
    if (mapRef) {
      const layerIds = ['clusters', 'cluster-count', 'marker-layer'];
      layerIds.forEach((layerId) => mapRef.getLayer(layerId) && mapRef.removeLayer(layerId));
      mapRef.getSource('marker-source') && mapRef.removeSource('marker-source');
    }
  };

  const recalculate = () => {
    if (!clusterRef.current) return;
    // recalculate clusters and update cluster layer
    const zoom = mapRef.getZoom();
    const bounds = mapRef.getBounds().toArray();
    const bbox = bounds[0].concat(bounds[1]);

    const updatedClusters = clusterRef.current.getClusters(bbox, Math.floor(zoom));
    // console.log('updatedClusters', updatedClusters);
    const data = turf.featureCollection(updatedClusters);
    mapRef?.getSource('marker-source')?.setData(data);
  };

  const addMarkers = () => {
    // create marker/cluster source and layers
    const existingMarkerSource = mapRef.getSource('marker-source');
    const markerSource = existingMarkerSource ? existingMarkerSource : createMarkerSource();

    if (!markerSource || existingMarkerSource) return;

    !existingMarkerSource &&
      mapRef.addSource('marker-source', {
        type: 'geojson',
        data: markerSource
      });

    ['clusters', 'cluster-count'].forEach((layerId) => {
      if (!mapRef.getLayer(layerId)) {
        mapRef.addLayer({
          id: layerId,
          type: layerId === 'clusters' ? 'circle' : 'symbol',
          source: 'marker-source',
          filter: layerId === 'clusters' ? ['has', 'point_count'] : ['has', 'point_count'],
          paint:
            layerId === 'clusters'
              ? {
                  'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
                  'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
                }
              : {},
          layout:
            layerId === 'cluster-count'
              ? {
                  'text-field': ['get', 'point_count_abbreviated'],
                  'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                  'text-size': 12
                }
              : {}
        });
      }
    });

    if (!mapRef.getLayer('marker-layer')) {
      mapRef.addLayer({
        id: 'marker-layer',
        type: 'symbol',
        source: 'marker-source',
        layout: {
          'icon-image': ['get', 'icon'],
          'icon-allow-overlap': true,
          'icon-anchor': ['match', ['get', 'isArrow'], 'true', 'center', 'bottom'],
          'icon-rotate': ['get', 'heading'],
          'icon-size': ['get', 'iconSize'],
          'symbol-sort-key': ['get', 'sortKey']
        },
        filter: ['!', ['has', 'point_count']]
      });
    }
    !markersLoaded && setMarkersLoaded(true);
  };

  const handleMapMoveEnd = (e) => {
    // console.log('moveEnd', deviceSelected.deviceId);
    const zoom = mapRef.getZoom();
    if (!deviceSelected || !clusterRef.current) return;
    const allClusters = clusterRef.current.getClusters([-180, -85, 180, 85], Math.floor(zoom));

    let markerInCurrCluster = null;
    // find marker in on of the cluster
    for (const cluster of allClusters) {
      if (!cluster.id) continue;
      const leaves = clusterRef.current.getLeaves(cluster.id, Infinity);
      markerInCurrCluster = leaves.find((leaf) => leaf.properties.deviceId === deviceSelected.deviceId);

      if (markerInCurrCluster) {
        markerInCurrCluster = {
          deviceId: deviceSelected.deviceId,
          id: cluster.id,
          location: {
            lat: cluster.geometry.coordinates[1],
            lng: cluster.geometry.coordinates[0]
          }
        };
        // console.log('markerInCurrCluster', markerInCurrCluster);
        break; // exit the loop once marker is found
      }
    }
    // console.log('markerInCurrCluster', markerInCurrCluster);
    // if marker is in the cluster then set popup coordinates to cluster coordinates
    setInCluster(markerInCurrCluster ? markerInCurrCluster : null);
  };
  const createFeatureMap = (features) => {
    const featureMap = {};
    features.forEach((feature) => {
      const deviceId = feature.properties.deviceId;
      featureMap[deviceId] = feature.properties;
    });
    return featureMap;
  };

  const handleMarkerClick = (e) => {
    if (!devices?.length) return;
    let properties = e.features[0].properties;
    if (e.features.length > 1) {
      // if clicked on overlapping markers store their data for popup
      const featureMap = createFeatureMap(e.features);
      const mainDevice = findMainDevice(e.features);
      if (mainDevice) {
        properties = mainDevice.properties;
      } else {
        const selectedList = devices?.filter((device) => featureMap[device.deviceId]);
        selectedList && setSelectedDeviceList(selectedList);
      }
    } else {
      // reset selectedList if click on non-overlapping marker
      setSelectedDeviceList([]);
    }
    // selectedDevice
    const selected = devices.find((device) => device.deviceId === properties.deviceId);

    setDeviceSelected(selected);
    distanceMeasureRef.current && setDistancePoints({ device: selected });
    e.clickOnLayer = true;
  };

  const handleClusterClick = (e) => {
    const features = mapRef?.queryRenderedFeatures(e.point, { layers: ['clusters'] });
    const clusterId = features[0].properties.cluster_id;
    const leaves = clusterRef.current?.getLeaves(clusterId, Infinity);
    if (!leaves) return;
    clusterZoom(leaves);
    e.clickOnLayer = true;
  };

  const handleMapClick = (e) => {
    if (e.clickOnLayer) return;
    distanceMeasureRef.current &&
      setDistancePoints({
        device: {
          location: e.lngLat.wrap(),
          assetName: 'Selected Point on the Map'
        }
      });
    setDeviceSelected('');
    setDeviceToFollow('');
    setSelectedDeviceList([]);
    setInCluster(null);
  };

  const clusterZoom = (leaves) => {
    // zoom in to next cluster level
    const bbox = turf.bbox(turf.featureCollection(leaves));
    mapRef.fitBounds(bbox, {
      padding: 50,
      bearing: mapRef.getBearing(),
      duration: 0
    });
  };

  const createMarkerSource = () => {
    const points = [];
    const clusterObj = new Supercluster({
      radius: 50,
      maxZoom: 16
    });

    displayedDevices?.forEach((device) => {
      if (device.location && isValidLocation(device.location)) {
        const point = createPoint(device, deviceSelected, loginType, mapRef, accuracyThreshold);
        points.push(point);
      }
    });
    const zoom = mapRef?.getZoom();
    const bounds = mapRef.getBounds().toArray();
    const bbox = bounds[0].concat(bounds[1]);
    // Load your features into the supercluster instance
    clusterObj.load(points);
    clusterRef.current = clusterObj;
    const cluster = clusterObj.getClusters(bbox, zoom);

    return turf.featureCollection(cluster);
  };

  const updateMarkers = () => {
    const sourceData = createMarkerSource();
    mapRef?.getSource('marker-source')?.setData(sourceData);
  };
  return null;
};

export default Markers;
