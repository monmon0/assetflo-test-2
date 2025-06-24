import { useEffect, useContext } from 'react';
import { useSelector } from 'react-redux';
import * as turf from '@turf/turf';
import { isValidLocation } from '../../util/validation';
import variables from '../../variables.json';

const GpsQuality = ({ mapRef, mapLoaded, displayedDevices }) => {
  const deviceSelected = useSelector((state) => state.map.deviceSelected);
  const showAdvanceTool = useSelector((state) => state.location.showAdvanceTool);

  useEffect(() => {
    if (mapLoaded && deviceSelected) {
      const gpsCircleLayer = mapRef.getLayer('gps-circle-layer');
      const gpsCircleSource = mapRef.getSource('gps-circle-source');
      const gpsLineLayer = mapRef.getLayer('gps-line-layer');
      const gpsLineSource = mapRef.getSource('gps-line-source');
      const errorTxtLayer = mapRef.getLayer('error-txt-layer');
      const { circle, line } = createSources();
      if (!circle || !line) return;
      // create circle layer

      !gpsCircleSource
        ? mapRef.addSource('gps-circle-source', {
            type: 'geojson',
            data: circle
          })
        : gpsCircleSource.setData(circle);

      !gpsCircleLayer &&
        mapRef.addLayer({
          id: 'gps-circle-layer',
          type: 'fill',
          source: 'gps-circle-source',
          paint: {
            'fill-color': variables.GEOTAB_PRIMARY_COLOR,
            'fill-opacity': 0.2
          },

          minzoom: 17
        });

      !gpsLineSource
        ? mapRef.addSource(
            'gps-line-source',
            {
              type: 'geojson',
              data: line
            },
            'marker-layer'
          )
        : gpsLineSource.setData(line);

      !gpsLineLayer &&
        mapRef.addLayer({
          id: 'gps-line-layer',
          type: 'line',
          source: 'gps-line-source',
          paint: {
            'line-color': variables.GEOTAB_PRIMARY_COLOR,
            'line-width': 2,
            'line-opacity': 1
          },

          minzoom: 17
        });
      !errorTxtLayer &&
        mapRef.addLayer({
          id: 'error-txt-layer',
          type: 'symbol',
          source: 'gps-circle-source',
          layout: {
            //'text-field': ['get', 'dist'],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'text-offset': [0, 0],
            'text-anchor': 'center'
          },
          paint: {
            'text-color': '#000000'
          }
        });
      const markerLayer = mapRef?.getLayer('marker-layer');
      if (markerLayer) {
        mapRef.moveLayer('gps-circle-layer', 'marker-layer');
        mapRef.moveLayer('gps-line-layer', 'marker-layer');
      }

      // create line layer
    } else if (!deviceSelected) {
      mapRef?.getLayer('error-txt-layer') && mapRef.removeLayer('error-txt-layer');
      mapRef?.getLayer('gps-circle-layer') && mapRef.removeLayer('gps-circle-layer');
      mapRef?.getLayer('gps-line-layer') && mapRef.removeLayer('gps-line-layer');
    }
    return () => {
      // Clean up: remove the layer and source when the component unmounts
      if (mapRef) {
        mapRef?.getLayer('error-txt-layer') && mapRef.removeLayer('error-txt-layer');
        mapRef.getLayer('gps-circle-layer') && mapRef.removeLayer('gps-circle-layer');
        mapRef.getLayer('gps-circle-source') && mapRef.removeSource('gps-circle-source');
        mapRef.getLayer('gps-line-layer') && mapRef.removeLayer('gps-line-layer');
        mapRef.getLayer('gps-line-source') && mapRef.removeSource('gps-line-source');
      }
    };
  }, [displayedDevices, deviceSelected, mapLoaded, showAdvanceTool]);

  const createSources = () => {
    const currDevice = displayedDevices.find((device) => device.deviceId === deviceSelected.deviceId);
    // TODO: compare deviceId, location & radius to decide if update needed
    if (
      currDevice &&
      isValidLocation(currDevice?.location) &&
      currDevice.protocol === 'LTE' &&
      currDevice.gpsWeight &&
      !currDevice.locators?.length
    ) {
      const weight = currDevice.gpsWeight > 1 ? 1 : currDevice.gpsWeight;
      const dist = -147.5 * weight + 150;
      const rad = dist > 150 ? 150 : dist;
      const options = {
        units: 'meters',
        deviceId: currDevice.deviceId,
        location: currDevice.location,
        rad: rad
      };
      const circle = turf.circle([currDevice.location.lng, currDevice.location.lat], rad, options);
      const line = turf.lineString([...circle.geometry.coordinates[0]]);
      return { circle, line };
    } else if (
      currDevice &&
      showAdvanceTool &&
      isValidLocation(currDevice?.location) &&
      currDevice.fixAsset &&
      isValidLocation(currDevice.locError?.location)
    ) {
      // console.log('cluster data', locErrorCluster.location);
      const locErrorData = currDevice.locError;
      // console.log('locErrorData', locErrorData);
      // const locErrorData = currDevice.locError;
      const options = {
        units: 'meters',
        deviceId: currDevice.deviceId,
        location: currDevice.location,
        rad: 1
      };
      // console.log(locErrorData);
      const circle = turf.circle([locErrorData.location.lng, locErrorData.location.lat], 1, options);
      circle.properties = { dist: locErrorData?.accuracy?.toFixed(2) + ' m' };
      const line = turf.lineString([...circle.geometry.coordinates[0]]);
      return { circle, line };
    }
    return {};
  };

  return null;
};

export default GpsQuality;
