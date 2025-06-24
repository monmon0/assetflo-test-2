import React, { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { Grid, Typography, CircularProgress, Card, IconButton, Button, TextField, Fade } from '@mui/material';
import { connect } from 'react-redux';

import EditableMapSwitcher from './EditableMapSwitcher';
import DraggableMapbox from './DraggableMapbox';

import CloseIcon from '@mui/icons-material/Close';

import variables from '../../../variables.json';
import { isValidLocation, isValidLat, isValidLng } from '../../../util/validation';

const PREFIX = 'MainDraggableForm';

const classes = {
  paper: `${PREFIX}-paper`,
  head: `${PREFIX}-head`,
  card: `${PREFIX}-card`,
  badge: `${PREFIX}-badge`,
  returnButton: `${PREFIX}-returnButton`,
  txtField: `${PREFIX}-txtField`,
  setButton: `${PREFIX}-setButton`,
  input: `${PREFIX}-input`
};

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.paper}`]: {
    // margin: '45px auto',
    width: '100%',
    outline: 'none'
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
    width: '100%',
    height: '70vh',
    boxShadow: '0 4px 8px 4px rgba(0,0,0,0.15)'
  },

  [`& .${classes.badge}`]: {
    backgroundColor: '#0078d3',
    color: variables.LIGHT_GRAY_COLOR
  },

  [`& .${classes.returnButton}`]: {
    position: 'absolute',
    left: 0
  },

  [`& .${classes.txtField}`]: {
    margin: '5px 5px',
    '& label.Mui-focused': {
      color: '#0078d3'
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
    background: '#0078d3'
  },

  [`& .${classes.input}`]: {
    height: 32,
    fontSize: 12
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
    if (props.allDevices && props.selectedRow && !props.selectedRow.lat && !props.selectedRow.lng) {
      currentDevice = props.allDevices.find((x) => x.deviceId === props.selectedRow.deviceId);
      if (currentDevice) {
        currentDevice.lat = Number(currentDevice.location.lat);
        currentDevice.lng = Number(currentDevice.location.lng);
        currentDevice.alt = Number(currentDevice.location.alt);
      }
    } else if (props.selectedRow && props.selectedRow.lat && props.selectedRow.lng) {
      currentDevice = {
        ...props.selectedRow,
        location: {
          lat: Number(props.selectedRow.lat),
          lng: Number(props.selectedRow.lng),
          alt: Number(props.selectedRow.alt)
        }
      };
    }
    setCurrentDevice({ ...currentDevice, fixAsset: props.selectedRow.fixAsset, isAnchor: props.selectedRow.isAnchor });
    // console.log('currentDevice', currentDevice, props.selectedRow);
  }, []);

  const handleReturnBack = () => {
    props.renderComponent('provision');
    props.setEditableMap('editableMapbox');
  };

  const handleInputChange = (e) => {
    let dev = { ...currentDevice, location: { ...currentDevice.location, [e.target.name]: e.target.value } };
    setCurrentDevice(dev);
    setInputChanged(true);
  };

  return (
    <Root className={classes.paper}>
      <Grid container>
        <Grid
          container
          item
          md={12}
          sm={12}
          alignItems="center"
          style={{
            padding: '5px 10px',
            display: 'flex',
            // justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
          }}
        >
          {/* {props.provisionType !== 'Tenant' &&
            props.provisionType !== 'Poi' &&
            props.pois &&
            props.pois.length > 0 &&
            props.pois[0] &&
            props.pois[0].provider &&
            props.pois[0].provider.indoorId &&
            props.pois[0].provider.apikey && <EditableMapSwitcher />} */}
          <TextField
            className={classes.txtField}
            label="lat"
            variant="outlined"
            margin="dense"
            name="lat"
            InputProps={{
              className: classes.input
            }}
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
            InputProps={{
              className: classes.input
            }}
            value={(currentDevice && currentDevice.location && currentDevice.location.lng) || ''}
            onChange={handleInputChange}
            error={currentDevice ? !isValidLng(currentDevice.location.lng) : false}
          />
          {/* <Fade in={inputChanged}> */}
          <Button
            onClick={() => {
              setMove(true);
              setInputChanged(false);
            }}
            className="geo-button geo-button--action fullWidth"
            disabled={currentDevice ? !isValidLocation(currentDevice.location) : true}
          >
            {'Set'}
          </Button>
          {/* </Fade> */}
          <IconButton
            aria-label="close"
            onClick={props.handleClose}
            style={{
              position: 'absolute',
              right: 0
            }}
            size="large"
          >
            <CloseIcon />
          </IconButton>
        </Grid>

        <Grid container item md={12} sm={12} justifyContent="center">
          {!currentDevice ? (
            <CircularProgress style={{ margin: '20px auto' }} />
          ) : (
            <Card raise="true" variant="outlined" className={classes.card}>
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
  // selectedRow: provision.selectedRow,
  screenWidth: location.screenWidth
});

const mapDispatch = ({
  location: { renderComponentAction },
  user: { logoutAction },
  map: { setEditableMapAction }
}) => ({
  renderComponent: renderComponentAction,
  setEditableMap: setEditableMapAction
});

export default connect(mapStateToProps, mapDispatch)(MainDraggableForm);
