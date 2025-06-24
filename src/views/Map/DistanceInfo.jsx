import React from 'react';
import { connect } from 'react-redux';
import * as turf from '@turf/turf';
import { Button } from '@mui/material';

import variables from '../../variables.json';

const DistanceInfo = (props) => {
  let distancePoints;
  let distance;
  if (props.distanceMeasurementSelected) {
    distancePoints = props.distancePoints;
    if (distancePoints.length === 2) {
      const from = turf.point([distancePoints[0].location.lng, distancePoints[0].location.lat]);
      const to = turf.point([distancePoints[1].location.lng, distancePoints[1].location.lat]);
      const options = { units: 'kilometers' };

      distance = (turf.distance(from, to, options) * 1000).toFixed(3) || 0;
    } else {
      distance = 0;
    }
  }

  const handleClearDisatancePoint = () => {
    props.clearDistancePoints();
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: 350,
        top: '60px',
        padding: '5px',
        borderRadius: '5px',
        color: variables.ORANGE_COLOR,
        background: variables.LIGHT_GRAY_COLOR,
        zIndex: 10000
      }}
    >
      <div style={{ width: '100%' }}>
        {props.distanceMeasurementSelected && (
          <strong style={{ color: variables.DARK_GRAY_COLOR }}>Select two points to measure distance</strong>
        )}
        {distancePoints && distancePoints.length > 0 && (
          <div>
            <div>
              <strong style={{ color: variables.DARK_GRAY_COLOR }}>First point:</strong>{' '}
              <span>{distancePoints[0].assetName}</span>
            </div>
            {distancePoints[1] && (
              <div>
                <strong style={{ color: variables.DARK_GRAY_COLOR }}>Second point:</strong>{' '}
                <span>{distancePoints[1].assetName}</span>
              </div>
            )}
            <div>
              <strong style={{ color: variables.DARK_GRAY_COLOR }}>Distance:</strong> <span>{distance} M</span>
            </div>
          </div>
        )}
      </div>
      {distancePoints.length > 0 && (
        <Button
          style={{
            color: variables.ORANGE_COLOR
          }}
          onClick={handleClearDisatancePoint}
          size="small"
        >
          Clear
        </Button>
      )}
    </div>
  );
};

const mapStateToProps = ({ map, user, location }) => ({
  distancePoints: map.distancePoints,

  distanceMeasurementSelected: location.distanceMeasurementSelected
});

const mapDispatch = ({ map }) => ({
  clearDistancePoints: map.clearDistancePointsAction
});

export default connect(mapStateToProps, mapDispatch)(DistanceInfo);
