import React from 'react';
import { Source, Layer } from 'react-map-gl';
import * as turf from '@turf/turf';
import variables from '../../variables.json';

const GpsQuality = ({ deviceSelected, mapbox }) => {
  const device = deviceSelected && deviceSelected;
  let circle = null;
  let line = null;

  if (
    !device ||
    // (!device.locWeight || device.locWeight.nWeight === undefined) &&
    (device.locators && device.locators.length > 0) ||
    !device.gpsWeight ||
    device.protocol !== 'LTE' ||
    mapbox?.getZoom() < 13
  ) {
    return null;
  } else {
    const weight = device.gpsWeight > 1 ? 1 : device.gpsWeight;
    const dist = -147.5 * weight + 150;
    const rad = dist > 150 ? 150 : dist;

    let options = {
      units: 'meters',
      deviceId: device.deviceId
    };
    if (device?.location && device.location.lat && device.location.lng) {
      circle = turf.circle([device.location.lng, device.location.lat], rad, options);
      line = turf.lineString([...circle.geometry.coordinates[0]]);
    }
  }

  return (
    <>
      <Source id="locationCircleSource" type="geojson" data={circle}>
        <Layer
          id="locationCircleLayer"
          type="fill"
          paint={{
            'fill-color': variables.GEOTAB_PRIMARY_COLOR,
            'fill-opacity': 0.2
          }}
          visibility={circle ? 'visible' : 'none'}
        />
      </Source>
      <Source id="locationLineSource" type="geojson" data={line}>
        <Layer
          id="locationLineLayer"
          type="line"
          paint={{
            'line-color': variables.GEOTAB_PRIMARY_COLOR,
            'line-width': 2,
            'line-opacity': 1
          }}
        />
      </Source>
    </>
  );
};

export default GpsQuality;
