import React, { useState, useRef, useEffect } from 'react';
import { connect } from 'react-redux';
import { IconButton } from '@mui/material';
import CropLandscapeIcon from '@mui/icons-material/CropLandscape';
import CropPortraitIcon from '@mui/icons-material/CropPortrait';

import variables from '../../variables.json';
import { fitBuilding, fitBoundsWithPadding, calculatePoiCorners } from '../../util/mapUtils';

const NavigationButtons = (props) => {
  const [view, setView] = useState('3D');
  // default = 0, 90 degree rotation = 1 (in mobile view default = portrait, desktop = landscape)
  const [orientation, setOrientation] = useState(0);
  const [bearing, setBearing] = useState(0);

  // Rotation states
  const [isRotating, setIsRotating] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(5);
  // Use a ref to store the interval ID so we can clear it later
  const accelerationIntervalRef = useRef(null);

  // Configuration: adjust these values to control acceleration
  const accelerationStep = 1.5; // how much to increase speed per interval
  const accelerationIntervalTime = 100; // interval time in milliseconds

  const changeView = () => {
    const map = props.mapbox;
    if (map) {
      if (view === '3D') {
        setView('2D');
        map.setPitch(60);
      } else {
        setView('3D');
        map.setPitch(0);
      }
    }
  };

  // When selectedDevice changes, reset the orientation and bearing
  useEffect(() => {
    setBearing(0);
    setOrientation(0);
  }, [props.deviceSelected]);

  const changeOrientation = () => {
    const newOrientation = !orientation;
    setOrientation(newOrientation);

    const map = props.mapbox;
    if (map) {
      if (props.selectedPoiId) {
        const poi = props.pois.find((poi) => poi.poiId === props.selectedPoiId);

        // Fit the building to map (using the provider's API key)
        if (poi?.provider?.apikey) {
          fitBuilding(props.pois[0], map, newOrientation, 300);
        }

        // Fit the image to the map (internal image)
        if (poi.type === 'Image') {
          // Calculate the corners of the image
          const { corners, offset } = calculatePoiCorners(poi);

          // Check viewport width and ignore isListOpen if less than 1000px
          const shouldFitBounds = props.screenWidth >= 1000 ? props.isListOpen : false;
          const isPortrait = newOrientation;

          // Fit the image to the map
          fitBoundsWithPadding(corners[1], corners[3], map, offset, shouldFitBounds, 300, isPortrait);
        }
      } else {
        console.error('No selected POI');
      }

      // Rotate the map 90 degrees, save current bearing and new bearing,
      // if user clicks rotate again then rotate 90 degrees from the new bearing
      // const currentBearing = (map.getBearing() + 360) % 360;

      // if (bearing === currentBearing) {
      //   const newBearing = (currentBearing - 90 + 360) % 360;
      //   setBearing(0);
      //   map.rotateTo(newBearing);
      // } else {
      //   const newBearing = (currentBearing + 90) % 360;
      //   setBearing(newBearing);
      //   map.rotateTo(newBearing);
      // }
    }
  };

  const rotateLeftRight = (direction, angleIncrement = 5) => {
    // console.log(`Rotating ${direction} at speed: ${angleIncrement}`);
    if (!props.mapbox) return;

    const map = props.mapbox;
    const currentBearing = map.getBearing?.() || 0;
    const newDirection = direction === 'left' ? currentBearing + angleIncrement : currentBearing - angleIncrement;

    // map.rotateTo(newDirection);
    map.rotateTo(newDirection, { duration: 500, easing: (t) => t * (2 - t) }); // Ease-in-out
  };

  const startRotation = (direction) => {
    if (isRotating) return; // Prevent starting if already rotating
    // console.log('bearing', props.mapbox.getBearing());

    setIsRotating(true);
    setRotationSpeed(5);
    // Start the rotation at an initial speed
    rotateLeftRight(direction, 8);

    // Start an interval to accelerate the rotation
    accelerationIntervalRef.current = setInterval(() => {
      setRotationSpeed((prevSpeed) => {
        const newSpeed = Math.min(25, prevSpeed + accelerationStep);
        // Update the rotation with the new speed
        rotateLeftRight(direction, newSpeed);
        return newSpeed;
      });
    }, accelerationIntervalTime);
  };

  const stopRotation = () => {
    // Clear the acceleration interval so speed stops increasing
    if (accelerationIntervalRef.current) {
      clearInterval(accelerationIntervalRef.current);
      accelerationIntervalRef.current = null;
    }

    // Optionally, you can delay the stop (as in your original code)
    setTimeout(() => {
      setIsRotating(false);
      setRotationSpeed(5);

      if (props.mapbox) {
        props.mapbox.stop();
      }
    }, 100);
  };

  const zoomInOutButtons = (zoomType) => {
    if (props.routerLocation === 'mapbox') {
      let map = props.wMap;
      if (map) {
        map._zoom = zoomType === '+' ? map._zoom + 0.5 : map._zoom - 0.5;
        map.setZoom(map._zoom);
      }
      if (!props.isSplitScreen && props.mapbox) {
        zoomType === '+'
          ? props.mapbox.zoomIn({ level: props.mapbox.getZoom() + 0.5 })
          : props.mapbox.zoomOut({ level: props.mapbox.getZoom() - 0.5 });
      }
    } else {
      props.mapbox && (zoomType === '+' ? props.mapbox.zoomIn() : props.mapbox.zoomOut());
    }
  };

  let bottom = 150;
  if (props.loginType === 'verifyGeotabAddinAccount') {
    if (props.screenWidth <= 750) {
      bottom = props.isOutdoor ? 280 : 122;
    } else {
      props.isOutdoor && (bottom = 200);
    }
  } else {
    if (props.screenWidth <= 750) {
      bottom = props.isOutdoor ? 200 : 92;
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        width: '40px',
        right: props.screenWidth < 1000 ? 15 : 30,
        zIndex: 100,
        marginBottom: '76px',
        bottom: '0px'
      }}
    >
      {props.showAdvanceTool && (
        <>
          <button
            style={{
              border: 'none',
              background: variables.LIGHT_GRAY_COLOR,
              color: variables.ORANGE_COLOR,
              marginBottom: '10px',
              boxShadow: '0 4px 8px 0 rgba(0,0,0,0.15)',
              width: 40,
              height: 33,
              borderRadius: '0.25rem',
              fontSize: '0.875rem'
            }}
            onClick={() => props.setDistanceMeasurementSelected()}
          >
            <i className={props.distanceMeasurementSelected ? 'fas fa-times' : 'fas fa-tape'} aria-hidden="true"></i>
          </button>
          <button
            style={{
              border: 'none',
              background: variables.LIGHT_GRAY_COLOR,
              color: variables.ORANGE_COLOR,
              marginBottom: '10px',
              boxShadow: '0 4px 8px 0 rgba(0,0,0,0.15)',
              width: 40,
              height: 33,
              borderRadius: '0.25rem',
              fontSize: '0.875rem'
            }}
            onClick={() => props.setShowCircle()}
          >
            {props.showCircle ? (
              <i className="fa fa-eye-slash" aria-hidden="true"></i>
            ) : (
              <i className="far fa-circle" aria-hidden="true"></i>
            )}
          </button>
        </>
      )}
      {/* Zoom In Button */}
      <button
        style={{
          border: 'none',
          background: variables.LIGHT_GRAY_COLOR,
          color:
            props.routerLocation !== 'wrldAddin' && !props.wrldMapOnly
              ? variables.ORANGE_COLOR
              : variables.GEOTAB_PRIMARY_COLOR,
          boxShadow: '0 4px 8px 0 rgba(0,0,0,0.15)',
          width: 40,
          height: 33,
          borderRadius: '0.25rem',
          fontSize: '0.875rem'
        }}
        onClick={() => zoomInOutButtons('+')}
      >
        <i className="fa fa-plus" aria-hidden="true"></i>
      </button>
      {/* Zoom Out Button */}
      <button
        style={{
          marginTop: '2px',
          marginLeft: '0px',
          marginBottom: '10px',
          border: 'none',
          background: variables.LIGHT_GRAY_COLOR,
          color:
            props.routerLocation !== 'wrldAddin' && !props.wrldMapOnly
              ? variables.ORANGE_COLOR
              : variables.GEOTAB_PRIMARY_COLOR,
          boxShadow: '0 4px 8px 0 rgba(0,0,0,0.15)',
          width: 40,
          height: 33,
          borderRadius: '0.25rem',
          fontSize: '0.875rem'
        }}
        onClick={() => zoomInOutButtons('-')}
      >
        <i className="fa fa-minus" aria-hidden="true"></i>
      </button>
      {/* Spin Left Button */}
      <button
        style={{
          border: 'none',
          background: variables.LIGHT_GRAY_COLOR,
          color:
            props.routerLocation !== 'wrldAddin' && !props.wrldMapOnly
              ? variables.ORANGE_COLOR
              : variables.GEOTAB_PRIMARY_COLOR,
          marginBottom: '2px',
          boxShadow: '0 4px 8px 0 rgba(0,0,0,0.15)',
          width: 40,
          height: 33,
          borderRadius: '0.25rem',
          fontSize: '0.875rem'
        }}
        onMouseDown={() => startRotation('left')}
        onMouseUp={stopRotation}
        onMouseLeave={stopRotation}
        onTouchStart={() => startRotation('left')}
        onTouchEnd={stopRotation}
        onTouchCancel={stopRotation}
      >
        <i className="fas fa-undo"> </i>
      </button>
      {/* 2D/3D Switch */}
      {props.pois?.length > 0 && (
        <button
          style={{
            border: 'none',
            background: variables.LIGHT_GRAY_COLOR,
            color:
              props.routerLocation !== 'wrldAddin' && !props.wrldMapOnly
                ? variables.ORANGE_COLOR
                : variables.GEOTAB_PRIMARY_COLOR,
            boxShadow: '0 4px 8px 0 rgba(0,0,0,0.15)',
            width: 40,
            height: 33,
            borderRadius: '0.25rem',
            fontSize: '0.875rem'
          }}
          onClick={changeView}
        >
          {view}
        </button>
      )}
      <button
        style={{
          border: 'none',
          background: variables.LIGHT_GRAY_COLOR,
          color:
            props.routerLocation !== 'wrldAddin' && !props.wrldMapOnly
              ? variables.ORANGE_COLOR
              : variables.GEOTAB_PRIMARY_COLOR,
          marginTop: '2px',
          boxShadow: '0 4px 8px 0 rgba(0,0,0,0.15)',
          width: 40,
          height: 33,
          borderRadius: '0.25rem',
          fontSize: '0.875rem'
        }}
        onMouseDown={() => startRotation('right')}
        onMouseUp={stopRotation}
        onMouseLeave={stopRotation}
        onTouchStart={() => startRotation('right')}
        onTouchEnd={stopRotation}
        onTouchCancel={stopRotation}
      >
        <i className="fas fa-redo"> </i>
      </button>
      {props.pois?.length > 0 && props.selectedPoiId && (
        <IconButton
          style={{
            border: 'none',
            background: variables.LIGHT_GRAY_COLOR,
            color: variables.ORANGE_COLOR,
            marginTop: '10px',
            boxShadow: '0 4px 8px 0 rgba(0,0,0,0.15)',
            width: 40,
            height: 33,
            borderRadius: '0.25rem',
            fontSize: '0.875rem'
          }}
          onClick={changeOrientation}
        >
          {/* <ScreenRotationIcon
            sx={{
              // transform: orientation === 'vertical' ? 'rotate(135deg)' : 'rotate(45deg)',
              // transform: orientation === 'vertical' ? 'rotate(45deg)' : 'rotate(-45deg)',
              // transform: orientation === 'vertical' ? 'rotate(-45deg)' : 'rotate(45deg)',
              transform: `rotate(${orientation === 'vertical' ? 45 : -45}deg)`,
              transition: 'transform 0.3s ease'
            }}
          /> */}

          {props.screenWidth < 1000 ? (
            orientation ? (
              <CropLandscapeIcon />
            ) : (
              <CropPortraitIcon />
            )
          ) : orientation ? (
            <CropPortraitIcon />
          ) : (
            <CropLandscapeIcon />
          )}
        </IconButton>
      )}
    </div>
  );
};

const mapStateToProps = ({ map, user, location }) => ({
  showAdvanceTool: location.showAdvanceTool,
  showCircle: location.showCircle,
  showGrid: location.showGrid,
  isSplitScreen: location.isSplitScreen,
  loginType: user.loginType,
  distanceMeasurementSelected: location.distanceMeasurementSelected,
  routerLocation: location.routerLocation,
  expandIndoorSize: location.expandIndoorSize,
  screenWidth: location.screenWidth,
  pois: map.pois,
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount',
  deviceSelected: map.deviceSelected,
  isListOpen: map.isListOpen
});

const mapDispatch = ({
  map: { getGridBoxAction, setGridHeadingAction },
  location: { setShowCircleAction, setShowGridAction, setDistanceMeasurementSelectedAction }
}) => ({
  setShowCircle: setShowCircleAction,
  setShowGrid: setShowGridAction,
  getGridBox: getGridBoxAction,
  setGridHeading: setGridHeadingAction,
  setDistanceMeasurementSelected: setDistanceMeasurementSelectedAction
});

export default connect(mapStateToProps, mapDispatch)(NavigationButtons);
