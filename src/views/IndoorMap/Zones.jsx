import { useEffect, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import * as turf from '@turf/turf';
import { filterArray } from '../../util/filters';
import mapboxgl from 'mapbox-gl';

const Zones = ({ mapRef, mapLoaded, showZones }) => {
  const [zone, setZone] = useState(null);
  const zones = useSelector((state) => state.map.zones);
  const groupFilter = useSelector((state) => state.user.groupFilter);
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: true
  });

  useEffect(() => {
    if (mapLoaded && mapRef) {
      if (showZones) {
        addLayer();
        // map.setLayerZoomRange('zone-layer', 17);

        mapRef.on('click', 'zone-layer', zoneClick);
      } else if (!showZones) {
        mapRef?.getLayer('zone-layer') && mapRef.removeLayer('zone-layer');
      }
    }

    return () => {
      // Clean up: remove the layer and source when the component unmounts
      if (mapRef) {
        mapRef.getLayer('zone-layer') && mapRef.removeLayer('zone-layer');
        mapRef.getLayer('zone-source') && mapRef.removeSource('zone-source');

        mapRef.off('click', 'zone-layer', zoneClick);
      }
    };
  }, [groupFilter, showZones, mapLoaded, mapRef, zones]);

  const zoneClick = (e) => {
    const layers = ['zone-layer', 'marker-layer', 'clusters'];
    const features = mapRef.queryRenderedFeatures(e.point, { layers });
    const multiLayerSelect = features.find((feature) => feature.layer.id !== 'zone-layer');
    if (multiLayerSelect) return;
    // console.log('Multiple layers clicked', multiLayerSelect);
    const zonesClicked = e.features;
    const sorted = zonesClicked.sort((a, b) => a.properties.area - b.properties.area);

    const properties = sorted[0].properties;
    const popupContent = `<div style="margin: 6px 7px">${properties.zoneName}</div>`;
    popup.setLngLat(e.lngLat).setHTML(popupContent).addTo(mapRef);
  };

  const addLayer = () => {
    const zoneLayer = mapRef.getLayer('zone-layer');
    const zoneSource = mapRef.getSource('zone-source');

    const source = createSources();

    // console.log('source', source);
    if (!source) return;
    !zoneSource
      ? mapRef.addSource('zone-source', {
          type: 'geojson',
          data: source
        })
      : zoneSource.setData(source);

    !zoneLayer &&
      mapRef.addLayer({
        id: 'zone-layer',
        type: 'fill',
        source: 'zone-source',
        paint: {
          'fill-color': ['get', 'fillColor'],
          'fill-opacity': ['get', 'fillOpacity']
        },
        minzoom: 14
      });

    const markerLayer = mapRef?.getLayer('marker-layer');
    if (markerLayer) {
      mapRef.moveLayer('zone-layer', 'marker-layer');
    }
  };

  const createSources = () => {
    const filteredZones = zones.filter((zone) => {
      if (!zone.points || zone.points.length === 0) return false;
      // if (groupFilter && groupFilter.length > 0 && !zone.groups.find((group) => filterArray(groupFilter, group))) {
      //   return false;
      // }
      return true;
    });
    const zoneList = [];
    filteredZones.forEach((zone) => {
      const { fillColor } = zone;

      const coordinates = zone.points.map((coordinate) => [coordinate.x, coordinate.y]);

      const polygon = turf.polygon([coordinates], {
        fillColor: `rgb(${fillColor.r}, ${fillColor.g}, ${fillColor.b})`,
        fillOpacity: Math.round((fillColor.a / 255) * 100) / 100,
        zoneName: zone.name,
        zoneId: zone.zoneId
      });
      const area = turf.area(polygon);
      polygon.properties = { ...polygon.properties, area };
      zoneList.push(polygon);
    });
    // console.log('create source', filteredZones, zoneList);
    return zoneList.length && turf.featureCollection(zoneList);
  };

  const onHover = useCallback((event) => {
    // get hover layer features
    const { features, lngLat: loc } = event;
    const layer = features && features[0];

    setZone(
      layer && {
        id: layer.properties.zoneId,
        name: layer.properties.zoneName,
        location: {
          lat: loc.lat,
          lng: loc.lng
        }
      }
    );
  }, []);
  return null;
};

export default Zones;
