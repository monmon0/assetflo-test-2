import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import * as turf from '@turf/turf';
import variables from '../../variables.json';

const LocatorSignals = ({ mapRef, mapLoaded, displayedDevices }) => {
  const deviceSelected = useSelector((state) => state.map.deviceSelected);
  const showCircle = useSelector((state) => state.location.showCircle);

  useEffect(() => {
    if (mapLoaded && deviceSelected) {
      loadData();
    }
    if (!deviceSelected || !showCircle) {
      mapRef?.getLayer('signals-txt-layer') && mapRef.removeLayer('signals-txt-layer');
      mapRef?.getLayer('locator-signals-layer') && mapRef.removeLayer('locator-signals-layer');
      mapRef?.getSource('locator-signals-source') && mapRef.removeSource('locator-signals-source');
      mapRef?.getLayer('locator-polygon-layer') && mapRef.removeLayer('locator-polygon-layer');
      mapRef?.getSource('locator-polygon-source') && mapRef.removeSource('locator-polygon-source');
      clearLayers();
    }
  }, [displayedDevices, deviceSelected, mapLoaded, showCircle]);

  useEffect(() => {
    return () => {
      if (mapRef) {
        mapRef?.getLayer('signals-txt-layer') && mapRef.removeLayer('signals-txt-layer');
        mapRef?.getLayer('locator-signals-layer') && mapRef.removeLayer('locator-signals-layer');
        mapRef?.getSource('locator-signals-source') && mapRef.removeSource('locator-signals-source');
        mapRef?.getLayer('locator-polygon-layer') && mapRef.removeLayer('locator-polygon-layer');
        mapRef?.getSource('locator-polygon-source') && mapRef.removeSource('locator-polygon-source');
        clearLayers();
      }
    };
  }, []);

  const loadData = () => {
    const currDevice = displayedDevices.find((device) => device.deviceId === deviceSelected.deviceId);
    let { locators } = currDevice || {};

    if (!locators || locators.length === 0 || deviceSelected?.deviceType !== 'Tag' || !showCircle) {
      clearPolygonLayer(); // Clear polygon layer if no valid shape can be created
      clearCirclesLayer(); // Clear circles layer
      return;
    }

    loadCircles(locators);

    // Load polygon only if there are 3 or more locators
    if (locators.length >= 3) {
      loadPolygon(locators);
    } else {
      clearPolygonLayer(); // Ensure polygon layer is cleared if not enough points
    }
  };

  const clearLayers = () => {
    // Clear all relevant layers and sources
    clearPolygonLayer();
    clearCirclesLayer();
    mapRef?.getLayer('signals-txt-layer') && mapRef.removeLayer('signals-txt-layer');
    mapRef?.getLayer('locator-signals-layer') && mapRef.removeLayer('locator-signals-layer');
    mapRef?.getSource('locator-signals-source') && mapRef.removeSource('locator-signals-source');
  };

  const clearPolygonLayer = () => {
    // Clear only the polygon layer and source
    mapRef?.getLayer('locator-polygon-layer') && mapRef.removeLayer('locator-polygon-layer');
    mapRef?.getSource('locator-polygon-source') && mapRef.removeSource('locator-polygon-source');
  };

  const clearCirclesLayer = () => {
    // Clear only the circles layer and source
    if (mapRef?.getLayer('locator-signals-layer')) {
      mapRef.removeLayer('locator-signals-layer');
    }
    if (mapRef?.getLayer('signals-txt-layer')) {
      mapRef.removeLayer('signals-txt-layer');
    }

    // Now remove the source
    if (mapRef?.getSource('locator-signals-source')) {
      mapRef.removeSource('locator-signals-source');
    }
  };

  const loadPolygon = (locators) => {
    const locatorPolygonLayer = mapRef.getLayer('locator-polygon-layer');
    const locatorPolygonSource = mapRef.getSource('locator-polygon-source');

    const polygonData = createPolygonSource(locators);
    if (!polygonData) {
      clearPolygonLayer(); // Clear the polygon layer if no valid polygon data
      return;
    }

    !locatorPolygonSource
      ? mapRef.addSource('locator-polygon-source', {
          type: 'geojson',
          data: polygonData
        })
      : locatorPolygonSource.setData(polygonData);

    !locatorPolygonLayer &&
      mapRef.addLayer({
        id: 'locator-polygon-layer',
        type: 'fill',
        source: 'locator-polygon-source',
        paint: {
          'fill-color': variables.GEOTAB_PRIMARY_COLOR,
          'fill-opacity': 0.4,
          'fill-outline-color': variables.GEOTAB_PRIMARY_COLOR
        }
      });
  };

  const createPolygonSource = (locators) => {
    const coordinates = locators.map((locator) => [locator.coordinates.lng, locator.coordinates.lat]);
    if (coordinates.length < 3) return null; // A polygon requires at least 3 points
    const points = turf.featureCollection(coordinates.map((coord) => turf.point(coord)));

    // Create a single enclosing polygon using turf.convex or turf.concave
    const polygon = turf.convex(points, { units: 'kilometers' });
    // For a concave polygon, use turf.concave(points, { maxEdge: <distance_in_kilometers> });

    if (!polygon) return null;

    return polygon;
  };

  const loadCircles = (locators) => {
    const locatorSignalsLayer = mapRef.getLayer('locator-signals-layer');
    const signalsTxtLayer = mapRef.getLayer('signals-txt-layer');
    const locatorSignalsSource = mapRef.getSource('locator-signals-source');
    const circles = createCircleSource(locators);

    if (!circles) {
      clearCirclesLayer(); // Clear the circles layer if no valid circles
      return;
    }

    !locatorSignalsSource
      ? mapRef.addSource('locator-signals-source', {
          type: 'geojson',
          data: circles
        })
      : locatorSignalsSource.setData(circles);

    !locatorSignalsLayer &&
      mapRef.addLayer({
        id: 'locator-signals-layer',
        type: 'line',
        source: 'locator-signals-source',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-opacity': 1
        }
      });

    !signalsTxtLayer &&
      mapRef.addLayer({
        id: 'signals-txt-layer',
        type: 'symbol',
        source: 'locator-signals-source',
        layout: {
          'text-field': ['get', 'rssi'],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-offset': [0, 0],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#000000'
        }
      });
    const markerLayer = mapRef?.getLayer('marker-layer');
    if (markerLayer) {
      mapRef.moveLayer('locator-signals-layer', 'marker-layer');
    }
  };

  const createCircleSource = (locators) => {
    const circlesArray = [];
    const options = {
      units: 'kilometers'
    };

    locators.forEach((locator) => {
      if (Number(locator.distance) && locator.coordinates && locator.coordinates.lat && locator.coordinates.lng) {
        const circle = turf.circle([locator.coordinates.lng, locator.coordinates.lat], 1 / 1000, options);
        const line = turf.lineString([...circle.geometry.coordinates[0]]);
        line.properties = {
          rssi: +locator?.rssi?.toFixed(2),
          color: locator.color || variables.ORANGE_COLOR
        };
        circlesArray.push(line);
      }
    });
    return turf.featureCollection(circlesArray);
  };

  return null;
};

export default LocatorSignals;
