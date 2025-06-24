import React, { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { Grid, Typography, CircularProgress, Card, IconButton, Button, TextField, Fade } from '@mui/material';
import { connect } from 'react-redux';

import EditableMapSwitcher from './EditableMapSwitcher';
import DraggableMapbox from '../Map2/DraggableMapbox';

import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

import variables from '../../variables.json';
import { isValidLocation, isValidLat, isValidLng } from '../../util/validation';

const PREFIX = 'MainDraggableForm';

const classes = {
  paper: `${PREFIX}-paper`,
  head: `${PREFIX}-head`,
  card: `${PREFIX}-card`,
  badge: `${PREFIX}-badge`,
  returnButton: `${PREFIX}-returnButton`,
  txtField: `${PREFIX}-txtField`,
  setButton: `${PREFIX}-setButton`
};

const Root = styled('div')(({ theme, ...props }) => ({
  [`&.${classes.paper}`]: {
    margin: '0 auto',
    width: '90%',
    outline: 'none',
    [theme.breakpoints.down('md')]: {
      margin: '0 5px ',
      width: 'auto'
    }
  },

  [`& .${classes.head}`]: {
    overflowX: 'hidden',
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    height: '50px',
    padding: '0 10px'
  },

  [`& .${classes.card}`]: {
    overflowX: 'hidden',
    margin: '20px 0',
    width: '100%',
    height: '75vh',
    boxShadow: '0 4px 8px 4px rgba(0,0,0,0.15)'
  },

  [`& .${classes.badge}`]: {
    backgroundColor: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
    color: variables.LIGHT_GRAY_COLOR
  },

  [`& .${classes.returnButton}`]: {
    position: 'absolute',
    left: 0
  },

  [`& .${classes.txtField}`]: {
    margin: '5px 5px',
    '& label.Mui-focused': {
      color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR
    },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: variables.DARK_GRAY_COLOR
    },
    '& .MuiInput-underline:after': {
      borderBottomColor: variables.DARK_GRAY_COLOR
    },
    '& .MuiInput-underline.Mui-error:after': {
      borderBottomColor: 'red'
    },
    '& .MuiFormLabel-root.Mui-error': {
      color: 'red'
    },
    '& .MuiInputBase-root.Mui-disabled': {
      color: 'black'
    }
  },

  [`& .${classes.setButton}`]: {
    color: variables.LIGHT_GRAY_COLOR,
    background: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR
  }
}));

const MainDraggableForm = (props) => {
  const [currentDevice, setCurrentDevice] = useState('');
  const [move, setMove] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [inputChanged, setInputChanged] = useState(false);
  //   useEffect(() => {
  //     let credential = {
  //       database: props.database
  //     };

  useEffect(() => {
    let currentDevice;

    if (props.selectedRow) {
      // Map center: [-96.989527, 49.310371],
      // const defaultLocation = { lng: -96.989527, lat: 49.310371, alt: 1000 };
      const defaultLocation = { lng: 0, lat: 0, alt: 0 };
      const getLocation = (device) => ({
        lat: Number(device.lat || device.location?.lat || 0),
        lng: Number(device.lng || device.location?.lng || 0),
        alt: Number(device.alt || device.location?.alt || 0)
      });

      if (props.selectedRow.lat && props.selectedRow.lng) {
        currentDevice = {
          ...props.selectedRow,
          location: getLocation(props.selectedRow)
        };
      } else {
        currentDevice = {
          ...props.selectedRow,
          location: defaultLocation,
          zoomOut: true
        };
      }
    }

    if (!currentDevice) {
      handleReturnBack();
    }
    setCurrentDevice(currentDevice);
  }, []);

  const handleReturnBack = () => {
    if (props.selectedRow?.renderComponent) {
      props.renderComponent(props.selectedRow.renderComponent);
    } else {
      props.renderComponent('provision');
    }

    if (props.selectedRow?.provisionType) {
      props.setProvisionType(props.selectedRow.provisionType);
    } else {
      props.setProvisionType('Locator');
    }
    props.setEditableMap('editableMapbox');
  };

  const handleInputChange = (e) => {
    let dev = { ...currentDevice, location: { ...currentDevice.location, [e.target.name]: e.target.value } };
    setCurrentDevice(dev);
    setInputChanged(true);
  };

  return (
    <Root
      className={classes.paper}
      style={{
        minHeight: props.loginType === 'verifyGeotabAddinAccount' ? 'calc(100vh - 100px)' : 'calc(100vh - 50px)'
      }}
    >
      <Grid container>
        <Grid container item md={12} sm={12} justifyContent="center" className={classes.head}>
          <IconButton onClick={handleReturnBack} className={classes.returnButton} size="large">
            <ArrowBackIosIcon />
          </IconButton>
          <Typography
            variant="h5"
            component="h5"
            style={{
              marginRight: 10,
              color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR
            }}
          >
            {'Position your device '}
          </Typography>
          {props.provisionType !== 'Tenant' &&
            props.provisionType !== 'Poi' &&
            props.pois &&
            props.pois.length > 0 &&
            props.pois[0] &&
            props.pois[0].provider &&
            props.pois[0].provider.indoorId &&
            props.pois[0].provider.apikey && <EditableMapSwitcher />}
        </Grid>

        <Grid container item md={12} sm={12} justifyContent="center" alignItems="center" style={{ marginTop: 10 }}>
          <TextField
            className={classes.txtField}
            name="deviceId"
            label="current device"
            variant="outlined"
            margin="dense"
            style={{ display: props.screenWidth <= 700 ? 'none' : 'inline-block' }}
            value={currentDevice ? currentDevice.deviceId || currentDevice.poiId : ''}
          />
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <TextField
              className={classes.txtField}
              label="lat"
              variant="outlined"
              margin="dense"
              name="lat"
              value={(currentDevice && currentDevice.location && currentDevice.location.lat) || ''}
              onChange={handleInputChange}
              error={currentDevice ? !isValidLat(currentDevice.location.lat) : false}
            />
            <TextField
              className={classes.txtField}
              label="lng"
              variant="outlined"
              margin="dense"
              name="lng"
              value={(currentDevice && currentDevice.location && currentDevice.location.lng) || ''}
              onChange={handleInputChange}
              error={currentDevice ? !isValidLng(currentDevice.location.lng) : false}
            />
          </div>
          <Fade in={inputChanged}>
            <Button
              onClick={() => {
                setMove(true);
                setInputChanged(false);
              }}
              style={{ display: props.screenWidth <= 700 ? 'none' : 'inline-block' }}
              className={classes.setButton}
              disabled={currentDevice ? !isValidLocation(currentDevice.location) : true}
            >
              {'Set'}
            </Button>
          </Fade>
        </Grid>

        <Grid container item md={12} sm={12} justifyContent="center">
          {!currentDevice ? (
            <CircularProgress style={{ margin: '20px auto' }} />
          ) : (
            <Card
              raise="true"
              variant="outlined"
              className={classes.card}
              style={{ height: props.loginType === 'verifyGeotabAddinAccount' ? '70vh' : '75vh' }}
            >
              {/* {props.editableMap === 'editableMapbox' ? ( */}
              <DraggableMapbox
                currentDevice={currentDevice}
                setCurrentDevice={setCurrentDevice}
                move={move}
                setMove={setMove}
                showAll={showAll}
                setShowAll={setShowAll}
              />
            </Card>
          )}
        </Grid>
      </Grid>
    </Root>
  );
};

const mapStateToProps = ({ location, user, provision, map }) => ({
  allDevices: map.devices,
  editableMap: map.editableMap,
  routerLocation: location.routerLocation,
  fullScreen: location.fullScreen,
  screenWidth: location.screenWidth,
  database: user.database,
  provisionType: provision.provisionType,
  pois: map.pois,
  selectedRow: provision.selectedRow,
  screenWidth: location.screenWidth,
  loginType: user.loginType,
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount'
});

const mapDispatch = ({
  location: { renderComponentAction },
  user: { logoutAction },
  map: { setEditableMapAction },
  provision: { setProvisionTypeAction }
}) => ({
  renderComponent: renderComponentAction,
  setEditableMap: setEditableMapAction,
  setProvisionType: setProvisionTypeAction
});

export default connect(mapStateToProps, mapDispatch)(MainDraggableForm);
