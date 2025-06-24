import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import { Chip, Box, List, ListItem, TextField, Grid, Divider, IconButton } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import variables from '../../variables.json';
import { connect } from 'react-redux';
import * as turf from '@turf/turf';
import Autocomplete from '@mui/material/Autocomplete';
import { filterByGroup } from '../../util/filters';

const PREFIX = 'RSSIList';

const classes = {
  container: `${PREFIX}-container`,
  row: `${PREFIX}-row`,
  rssiListItem: `${PREFIX}-rssiListItem`,
  textContainer: `${PREFIX}-textContainer`,
  textField: `${PREFIX}-textField`
};

const StyledBox = styled(Box)(({ theme }) => ({
  [`&.${classes.container}`]: {
    width: '100%'
  },

  [`& .${classes.row}`]: { alignItems: 'baseline' },

  [`& .${classes.rssiListItem}`]: {
    display: 'flex',
    flexDirection: 'column'
  },

  [`& .${classes.textContainer}`]: {
    [theme.breakpoints.down('md')]: {
      justifyContent: 'center'
    }
  },

  [`& .${classes.textField}`]: {
    '& .MuiInput-underline:after': {
      borderBottomColor: variables.DARK_GRAY_COLOR
    },
    width: '70%'
  }
}));

function RSSIList(props) {
  const [rssiArray, setRssiArray] = useState([]);
  const [displayAdd, setDisplayAdd] = useState(false);
  const [touched, setTouched] = useState({
    rssi: false,
    distance: false,
    calibratorId: false,
    calDistance: false
  });
  const [newRssi, setNewRssi] = useState({
    rssi: '',
    distance: '',
    calibratorId: '',
    calDistance: ''
  });
  const [confirmDelete, setConfirmDelete] = useState('');

  useEffect(() => {
    props.data && setRssiArray(props.data);
  }, [props.data]);

  const handleAddNewData = (newData) => {
    let arr = rssiArray;
    for (let key in newData) {
      if (key !== 'calibratorId') {
        newData[key] = Number(newData[key]);
      }
    }
    arr.push(newData);
    props.handleRssiChange(arr);
  };

  const handleDeleteData = (data) => {
    let arr = rssiArray;
    arr = arr.filter((el) => el.calibratorId !== data.calibratorId);
    props.handleRssiChange(arr);
  };

  const handleInputChange = (event, index) => {
    // only digits +-. allowed
    const reg = new RegExp('^-?[0-9]*[.]?[0-9]+$');
    if (event.target.value !== '' && event.target.value !== '-' && !reg.test(Number(event.target.value))) {
      return;
    }
    if (displayAdd) {
      // input change for new rssi object on add
      setNewRssi({
        ...newRssi,
        [event.target.name]: event.target.value
      });
    } else {
      // input change for existing rssi object
      let rssiList = rssiArray;
      rssiList[index][event.target.name] = event.target.value;
      props.handleRssiChange(rssiList);
    }
    setTouched({
      ...touched,
      [event.target.name]: true
    });
  };

  const calculateDistance = (id) => {
    // if current locator id === chosed locator id return distance 1
    if (id === props.deviceId) {
      return 1;
    }
    let firstDevice, secondDevice;

    // find precise lat lng for locators
    props.devStates.map((loc) => {
      if (loc.deviceId === props.deviceId) {
        firstDevice = loc;
      } else if (loc.deviceId === id) {
        secondDevice = loc;
      }
    });
    let distance;
    // if locators have lat lng then calculate distance
    if (firstDevice && secondDevice && firstDevice.location && secondDevice.location) {
      let from = turf.point([firstDevice.location.lng, firstDevice.location.lat]);
      let to = turf.point([secondDevice.location.lng, secondDevice.location.lat]);
      const options = { units: 'kilometers' };

      distance = turf.distance(from, to, options) * 1000;
    }
    return distance;
  };

  const handleIdChange = (newValue, index) => {
    // calculate distance from current locator to chosen locator
    let distance = calculateDistance(newValue);
    if (displayAdd) {
      // input change for new rssi object on add
      let newValues = newRssi;
      newValues.calibratorId = newValue;
      newValues.distance = distance || '';
      setNewRssi({
        ...newValues
      });
    } else {
      // input change for existing rssi object
      let rssiList = rssiArray;
      rssiList[index].calibratorId = newValue;
      rssiList[index].distance = distance || '';
      props.handleRssiChange(rssiList);
    }
    setTouched({
      ...touched,
      calibratorId: true,
      distance: true
    });
  };

  const handleDisableAdd = () => {
    if (
      newRssi.rssi === '' ||
      Number(newRssi.rssi) >= 0 ||
      isNaN(newRssi.rssi) ||
      newRssi.calibratorId.trim() === '' ||
      newRssi.distance === '' ||
      Number(newRssi.distance) < 0 ||
      isNaN(newRssi.distance) ||
      newRssi.calDistance === '' ||
      Number(newRssi.calDistance) < 0 ||
      isNaN(newRssi.calDistance)
    ) {
      return true;
    }
    return false;
  };

  const resetTouched = () => {
    let touchedObj = touched;
    for (let key in touchedObj) {
      touched[key] = false;
    }
    setTouched(touchedObj);
  };

  const getOptionsList = () => {
    let list = props.devStates.filter((device) => {
      return props.device.deviceType === 'Locator' ? device.deviceType === 'Locator' : device.isAnchor;
    });
    if (props.groupFilter.length > 0) {
      list = filterByGroup(list, props.groupFilter);
    }
    return list;
  };

  const editItem = (item, index, isAdd) => {
    return (
      <div key={index}>
        <ListItem>
          <Grid container>
            <Grid container className={classes.row}>
              <Grid container item sm={6} justifyContent="center">
                Calibrator ID:
              </Grid>
              <Grid container item sm={6} justifyContent="flex-start" className={classes.textContainer}>
                <Autocomplete
                  freeSolo
                  options={getOptionsList()}
                  getOptionLabel={(option) => option.deviceId}
                  onChange={(e, values) => {
                    handleIdChange(values ? values.deviceId : '', index);
                  }}
                  className={classes.textField}
                  value={{ deviceId: props.device.deviceType === 'Locator' ? item.calibratorId : item.locatorId }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      onChange={(e) => {
                        handleIdChange(e.target.value, index);
                      }}
                      error={touched.calibratorId && item.calibratorId.trim() === ''}
                      helperText={touched.calibratorId && item.calibratorId.trim() === '' ? 'field required' : ''}
                    />
                  )}
                />
              </Grid>
            </Grid>
            <Grid container className={classes.row}>
              <Grid container item sm={6} justifyContent="center">
                RSSI:
              </Grid>
              <Grid container item sm={6} justifyContent="flex-start" className={classes.textContainer}>
                <TextField
                  type="text"
                  name="rssi"
                  className={classes.textField}
                  onChange={(e) => {
                    handleInputChange(e, index);
                  }}
                  error={touched.rssi && (item.rssi === '' || Number(item.rssi) >= 0)}
                  helperText={
                    touched.rssi &&
                    (item.rssi === ''
                      ? 'field required'
                      : Number(item.rssi) >= 0
                      ? "can't be greater than or equal to 0"
                      : '')
                  }
                  value={item.rssi}
                  InputLabelProps={{
                    shrink: true
                  }}
                  disabled={index >= 0 && displayAdd}
                />
              </Grid>
            </Grid>
            <Grid container className={classes.row}>
              <Grid container item sm={6} justifyContent="center">
                Distance:
              </Grid>
              <Grid container item sm={6} justifyContent="flex-start" className={classes.textContainer}>
                <TextField
                  type="text"
                  className={classes.textField}
                  name="distance"
                  onChange={(e) => {
                    handleInputChange(e, index);
                  }}
                  error={touched.distance && (item.distance === '' || Number(item.distance) <= 0)}
                  helperText={
                    touched.distance && item.distance === ''
                      ? 'field required'
                      : touched.distance && Number(item.distance) <= 0
                      ? 'should be greater than 0'
                      : ''
                  }
                  value={item.distance}
                  InputLabelProps={{
                    shrink: true
                  }}
                  disabled={index >= 0 && displayAdd}
                />
              </Grid>
            </Grid>
            <Grid container className={classes.row}>
              <Grid container item sm={6} justifyContent="center">
                Calibration Distance:
              </Grid>
              <Grid container item sm={6} justifyContent="flex-start" className={classes.textContainer}>
                <TextField
                  type="text"
                  name="calDistance"
                  className={classes.textField}
                  onChange={(e) => {
                    handleInputChange(e, index);
                  }}
                  error={touched.calDistance && (item.calDistance === '' || Number(item.calDistance) <= 0)}
                  helperText={
                    touched.calDistance && item.calDistance === ''
                      ? 'field required'
                      : touched.calDistance && Number(item.calDistance) <= 0
                      ? 'should be greater than 0'
                      : ''
                  }
                  value={item.calDistance}
                  InputLabelProps={{
                    shrink: true
                  }}
                  disabled={index >= 0 && displayAdd}
                />
              </Grid>
            </Grid>
            <Grid container style={{ margin: '10px 0' }}>
              {
                isAdd && (
                  <>
                    <Grid container item sm={6} justifyContent="center">
                      <Chip
                        size="small"
                        style={{
                          backgroundColor: variables.ORANGE_COLOR,
                          color: variables.WHITE_COLOR,
                          cursor: 'pointer'
                        }}
                        label={'Add'}
                        disabled={handleDisableAdd()}
                        onClick={() => {
                          handleAddNewData(newRssi);
                          setNewRssi({
                            rssi: '',
                            distance: '',
                            calibratorId: '',
                            calDistance: ''
                          });
                          resetTouched();
                          setDisplayAdd(!displayAdd);
                        }}
                      />
                    </Grid>
                    <Grid container item sm={6} justifyContent="center">
                      <Chip
                        size="small"
                        style={{
                          backgroundColor: variables.ORANGE_COLOR,
                          color: variables.WHITE_COLOR,
                          cursor: 'pointer'
                        }}
                        label={'Cancel'}
                        onClick={() => {
                          setNewRssi({
                            rssi: '',
                            distance: '',
                            calibratorId: '',
                            calDistance: ''
                          });
                          resetTouched();
                          setDisplayAdd(!displayAdd);
                        }}
                      />
                    </Grid>{' '}
                  </>
                )
                // (<>
                //   <Grid container item sm={6} justify="center">
                //     {confirmDelete === index && <span style={{ color: variables.ORANGE_COLOR }}>Delete Item?</span>}
                //   </Grid>
                //   <Grid container item sm={6} justify="center">
                //     {confirmDelete !== index ? (
                //       <Chip
                //         size="small"
                //         style={{
                //           backgroundColor: variables.ORANGE_COLOR,
                //           color: variables.WHITE_COLOR,
                //           cursor: 'pointer'
                //         }}
                //         label={'Remove'}
                //         onClick={() => {
                //           setConfirmDelete(index);
                //         }}
                //       />
                //     ) : (
                //       <>
                //         <IconButton
                //           size="small"
                //           aria-label="delete"
                //           component="span"
                //           onClick={() => {
                //             handleDeleteData(item);
                //             setConfirmDelete('');
                //           }}
                //         >
                //           <CheckIcon />
                //         </IconButton>
                //         <IconButton
                //           size="small"
                //           aria-label="cancel"
                //           component="span"
                //           onClick={() => {
                //             setConfirmDelete('');
                //           }}
                //         >
                //           <CancelIcon />
                //         </IconButton>
                //       </>
                //     )}
                //   </Grid>
                // </>
              }
            </Grid>
          </Grid>
        </ListItem>
        <Divider />
      </div>
    );
  };

  return (
    <StyledBox className={classes.container}>
      <List>
        <ListItem key={'listItem'}>
          <Chip
            size="small"
            style={{
              backgroundColor: variables.ORANGE_COLOR,
              color: variables.WHITE_COLOR,
              cursor: 'pointer'
            }}
            label={!displayAdd ? 'Add New' : 'Cancel'}
            onClick={() => {
              if (displayAdd) {
                setNewRssi({
                  rssi: '',
                  distance: '',
                  calibratorId: '',
                  calDistance: ''
                });
                resetTouched();
              }
              setDisplayAdd(!displayAdd);
            }}
          />
        </ListItem>
        <Divider />
        {displayAdd && editItem(newRssi, -1, true)}
        {rssiArray.length !== 0 ? (
          rssiArray.map((rssi, index) => {
            return editItem(rssi, index, false);
          })
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span>RSSI array is empty</span>
          </div>
        )}
      </List>
    </StyledBox>
  );
}

const mapStateToProps = ({ user, provision }) => ({
  groupFilter: user.groupFilter,
  device: provision.selectedRow,
  devStates: provision.states
});

const mapDispatch = () => ({});

export default connect(mapStateToProps, mapDispatch)(RSSIList);
