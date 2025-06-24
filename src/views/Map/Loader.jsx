import React from 'react';
import { BeatLoader } from 'react-spinners';
import { useSelector } from 'react-redux';
import variables from '../../variables.json';

const Loader = (props) => {
  const wrldMapOnly = useSelector((state) => state.map.wrldMapOnly);
  const loginType = useSelector((state) => state.user.loginType);
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: variables.LIGHT_GRAY_COLOR,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100
      }}
    >
      <div
        style={{
          position: 'relative',
          textAlign: 'center'
        }}
      >
        <BeatLoader
          size={50}
          color={
            wrldMapOnly && loginType === 'verifyGeotabAddinAccount'
              ? variables.GEOTAB_PRIMARY_COLOR
              : variables.ORANGE_COLOR
          }
        />
        <div>Loading map...</div>
      </div>
    </div>
  );
};

export default Loader;
