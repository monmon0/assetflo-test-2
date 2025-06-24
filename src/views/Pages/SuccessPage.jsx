import React, { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { connect } from 'react-redux';
import { Box, Button } from '@mui/material';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';

import variables from '../../variables.json';
const PREFIX = 'SuccessPage';

const classes = {
  continer: `${PREFIX}-continer`,
  image: `${PREFIX}-image`,
  body: `${PREFIX}-body`,
  buttonStyle: `${PREFIX}-buttonStyle`
};

const StyledBox = styled(Box)(({ theme }) => ({
  [`&.${classes.continer}`]: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },

  [`& .${classes.image}`]: {
    width: 100,
    height: 100,
    marginTop: '20px'
  },

  [`& .${classes.body}`]: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '30px',
    color: variables.DARK_GRAY_COLOR
  },

  [`& .${classes.buttonStyle}`]: {
    backgroundColor: variables.ORANGE_COLOR,
    color: variables.WHITE_COLOR,
    width: '20%'
  }
}));

function SuccessPage({ firstTimeLogin, setFirstTimeLogin, role, checkDevicesNumber, renderComponent, screenWidth }) {
  //   const getDevicesNumber = async () => {
  //     let number = await checkDevicesNumber(database);
  //     return number;
  //   };

  const [showInstructions, setshowInstructions] = useState(false);
  const [showDoneButton, setshowDoneButton] = useState(true);
  // const [devicesNum, setDevicesNum] = useState(null);

  const checkToDisplayInstructionsAndDone = async () => {
    let totalDevices = await checkDevicesNumber();
    // console.log(totalDevices);
    // setDevicesNum(totalDevices);
    // console.log(role, totalDevices);
    // if (role === 'admin') {
    //   setshowInstructions(true);
    //   setshowDoneButton(true);
    // }
    // if (role === 'user' && totalDevices > 0) {
    //   setshowInstructions(false);
    //   setshowDoneButton(true);
    // }
    // if (role === 'user' && totalDevices === 0) {
    //   setshowInstructions(false);
    //   setshowDoneButton(true);
    // }
  };

  useEffect(() => {
    // checkToDisplayInstructionsAndDone();
    setFirstTimeLogin(true);
  }, []);

  const handleSubmitContinueButton = async () => {
    setFirstTimeLogin(false);
    renderComponent('mapbox');
  };

  return (
    <StyledBox className={classes.continer} style={{ height: 'calc(100vh - 50px)' }}>
      <h1 style={{ marginTop: '250px' }}>{variables.SUCCESS_LOGIN_MESSAGE}</h1>
      <CheckCircleOutlineOutlinedIcon style={{ width: 50, height: 50, color: variables.GREEN_COLOR }} />
      <p className={classes.body}>{variables.WELCOME_TO_ASSETFLO}</p>
      {/* {!showInstructions && (
        <p className={classes.body}>
          No devices assigned to your organization yet, contact your adminstrator for assisstance.
        </p>
      )} */}
      {showDoneButton && (
        <Button variant="contained" className={classes.buttonStyle} onClick={handleSubmitContinueButton}>
          Done
        </Button>
      )}
    </StyledBox>
  );
}

const mapStateToProps = ({ user, location }) => ({
  firstTimeLogin: user.firstTimeLogin,
  role: user.role,
  database: user.database,
  devicesNumber: user.devicesNumber,
  screenWidth: location.screenWidth
});

const mapDispatch = ({
  user: { setFirstTimeLoginAction, checkDevicesNumberAction },
  location: { renderComponentAction }
}) => ({
  setFirstTimeLogin: setFirstTimeLoginAction,
  checkDevicesNumber: checkDevicesNumberAction,
  renderComponent: renderComponentAction
  // setShowInstructions: setShowInstructionsAction
});

// connect(mapStateToProps, mapDispatch)(Note)
export default connect(mapStateToProps, mapDispatch)(SuccessPage);
