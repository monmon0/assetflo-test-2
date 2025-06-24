import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as turf from '@turf/turf';
import { isValidLocation } from '../../util/validation';
import variables from '../../variables.json';
// import indoorMapImage from '../../assets/Maps/indoorMapImage.png';
// import outdoorMapImage from '../../assets/Maps/outdoorMapImage.png';

const IndoorOutdoorSwitch = ({ mapRef, mapLoaded, displayedDevices }) => {
  const deviceSelected = useSelector((state) => state.map.deviceSelected);
  const loginType = useSelector((state) => state.user.loginType);
  const screenWidth = useSelector((state) => state.location.screenWidth);
  const routerLocation = useSelector((state) => state.location.routerLocation);
  const dispatch = useDispatch();

  return (
    <div
      style={{
        position: 'fixed',
        top: loginType === 'verifyGeotabAddinAccount' ? 110 : 60,
        right: screenWidth < 900 ? 15 : 30,
        transition: 'all 800ms ease',
        zIndex: 10,
        cursor: 'pointer',
        textAlign: 'center',
        color: routerLocation !== 'indoors' ? variables.WHITE_COLOR : variables.DARK_GRAY_COLOR
      }}
      onClick={() => {
        dispatch.map.clearMapDataAction();
        dispatch.location.renderComponentAction(routerLocation !== 'indoors' ? 'indoors' : 'mapbox');
      }}
    >
      <img
        style={{
          height: screenWidth < 900 ? 60 : 75,
          width: screenWidth < 900 ? 60 : 75,
          zIndex: 100,
          borderRadius: '5px',
          boxShadow: '0 4px 8px 0 rgba(0,0,0,0.15)'
        }}
        src={
          routerLocation !== 'indoors' ? '/assets/img/map/indoorMapImage.png' : '/assets/img/map/outdoorMapImage.png'
        }
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        {routerLocation !== 'indoors' ? 'Indoor' : 'Outdoor'}
      </div>
    </div>
  );
};

export default IndoorOutdoorSwitch;
