import React, { useState } from 'react';
import { connect } from 'react-redux';

import variables from '../../variables';
// import satelliteMapeImage from '../../assets/Maps/satelliteMapeImage.jpg';
// import streetsMapImage from '../../assets/Maps/streetsMapImage.png';

const STAGING_URL = variables.STAGING_URL_IMAGE;
const PRODUCTION_URL = variables.PRODUCTION_URL_IMAGE;

const SwitchMapButton = (props) => {
  const [tripStyle, setTripStyle] = useState('streets');

  const satelliteImg = '/assets/img/map/satelliteMapImage.jpg';
  const streetImg = '/assets/img/map/streetsMapImage.png';

  const handleSwitchMapClicked = (mapType, mapStyle) => {
    if (props.isTrip) {
      // for trip map
      props.clearMap();
      const style = tripStyle === 'streets' ? 'satellite' : 'streets';
      props.mapbox.setStyle(tripStyle === 'streets' ? variables.SATELLITE_STYLE : variables.STREETS_STYLE);
      // props.mapbox.setStyle('mapbox://styles/mapbox/satellite-streets-v12');
      setTripStyle(style);
    } else {
      // for main map
      const mapStyle = props.mapboxStyle === 'streets' ? 'satellite' : 'streets';
      mapStyle === 'satellite' && props.mapbox.getZoom() > 18.5 && props.mapbox.setZoom(18.5);
      // props.mapbox.setMaxZoom(mapStyle === 'satellite' ? 18.5 : 24);
      props.setMapLoaded && props.setMapLoaded(false);
      // props.setStyleLoaded && props.setStyleLoaded(false);
      props.setMapboxStyle(mapStyle);
      props.renderComponent(props.routerLocation);
    }
  };

  const handleIconUrl = () => {
    const isStreetStyle = props.isTrip ? tripStyle === 'streets' : props.mapboxStyle === 'streets';
    if (props.loginType === 'verifyGeotabAddinAccount') {
      // PRODUCTION_URL + satelliteMapeImage
      //     : STAGING_URL + satelliteMapeImage
      const hash = window.location.hash;
      const addinName = hash?.split('-');
      const isProd = addinName === 'assetflo';
      const baseUrl = isProd ? PRODUCTION_URL : STAGING_URL;
      return isStreetStyle ? baseUrl + satelliteImg : baseUrl + streetImg;
    } else {
      return isStreetStyle ? '/assets/img/map/satelliteMapImage.jpg' : '/assets/img/map/streetsMapImage.png';
    }
  };

  const handleText = () => {
    if (props.isTrip) {
      return tripStyle === 'streets' ? 'satellite' : 'streets';
    } else {
      return props.mapboxStyle === 'streets' ? 'satellite' : 'streets';
    }
  };

  const handleTextColor = () => {
    if (props.isTrip) {
      return tripStyle === 'streets' ? variables.WHITE_COLOR : variables.DARK_GRAY_COLOR;
    } else {
      return props.mapboxStyle === 'streets' ? variables.WHITE_COLOR : variables.DARK_GRAY_COLOR;
    }
  };

  return (
    <>
      <div
        style={{
          textAlign: 'center',
          color: handleTextColor(),
          zIndex: 100,
          cursor: 'pointer',
          marginTop: 5
        }}
        onClick={() => handleSwitchMapClicked('mapbox')}
      >
        <img
          style={{
            height: props.screenWidth < 900 ? 60 : 75,
            width: props.screenWidth < 900 ? 60 : 75,
            zIndex: 100,
            borderRadius: '5px',
            boxShadow: '0 4px 8px 0 rgba(0,0,0,0.15)'
          }}
          src={handleIconUrl()}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          {handleText()}
        </div>
      </div>
    </>
  );
};
const mapStateToProps = ({ location, user, map }) => ({
  routerLocation: location.routerLocation,
  // isSplitScreen: location.isSplitScreen,
  loginType: user.loginType,
  screenWidth: location.screenWidth,
  mapboxStyle: map.mapboxStyle
});

const mapDispatch = ({ location: { renderComponentAction }, map: { setMapboxStyleAction } }) => ({
  renderComponent: renderComponentAction,
  setMapboxStyle: setMapboxStyleAction
});

export default connect(mapStateToProps, mapDispatch)(SwitchMapButton);
