import React from 'react';
import { useSelector } from 'react-redux';
import { Source, Layer } from 'react-map-gl';
import * as turf from '@turf/turf';
import variables from '../../variables.json';

const LocatorCircles = (props) => {
  const { locators } = props.deviceSelected || {};
  const showCircle = useSelector((state) => state.location.showCircle);
  if (!locators || props.deviceSelected?.deviceType !== 'Tag' || !showCircle) {
    return null;
  }

  let circlesArray = [];
  let options = {
    units: 'kilometers'
  };

  locators.forEach((locator) => {
    if (Number(locator.distance) && locator.coordinates && locator.coordinates.lat && locator.coordinates.lng) {
      let circle = turf.circle([locator.coordinates.lng, locator.coordinates.lat], locator.distance / 1000, options);
      circlesArray.push(circle);
    }
  });

  return (
    <>
      <Source id="locatorCircleSource" type="geojson" data={{ type: 'FeatureCollection', features: circlesArray }}>
        <Layer
          id="locatorCircleLayer"
          type="line"
          paint={{
            'line-color': variables.ORANGE_COLOR,
            'line-width': 2,
            'line-opacity': 1
          }}
        />
      </Source>
    </>
  );
};

export default LocatorCircles;
