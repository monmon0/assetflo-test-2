import React, { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  Button,
  Grid,
  TextField,
  MenuItem,
  FormControlLabel,
  Radio,
  RadioGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { connect } from 'react-redux';
import moment from 'moment';

import variables from '../../variables.json';
import RSSIList from './RSSIList';
import { isUndefined } from 'lodash';
import ApplyToManySelect from '../Common/ApplyToManySelect';
import { filterByGroup } from '../../util/filters';

const PREFIX = 'DeviceCalibration';

const classes = {
  root: `${PREFIX}-root`,
  checked: `${PREFIX}-checked`,
  paper: `${PREFIX}-paper`,
  doneButton: `${PREFIX}-doneButton`,
  applyButton: `${PREFIX}-applyButton`,
  header: `${PREFIX}-header`,
  headerRow: `${PREFIX}-headerRow`,
  row: `${PREFIX}-row`,
  abcRow: `${PREFIX}-abcRow`,
  cell: `${PREFIX}-cell`,
  kalmanRQ: `${PREFIX}-kalmanRQ`,
  textField: `${PREFIX}-textField`,
  centerOnMobile: `${PREFIX}-centerOnMobile`
};

const StyledBox = styled(Box)(({ theme, ...props }) => ({
  [`&.${classes.paper}`]: {
    overflowY: 'auto',
    overflowX: 'hidden',
    width: '100%'
  },

  [`& .${classes.doneButton}`]: {
    color: variables.LIGHT_GRAY_COLOR,
    background: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
    maxHeight: '36px'
  },

  [`& .${classes.applyButton}`]: {
    color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
    background: variables.WHITE_COLOR,
    margin: '0 10px'
  },

  [`& .${classes.header}`]: {
    fontSize: '1.09375rem',
    fontWeight: '600',
    color: 'rgb(87, 101, 116)'
  },

  [`& .${classes.headerRow}`]: {
    borderBottom: '1px solid #E4E5E6',
    alignItems: 'baseline',
    padding: '8px 30px 20px 30px',
    overflow: 'hidden',
    marginTop: '10px'
  },

  [`& .${classes.row}`]: {
    // borderColor: variables.LIGHT_GRAY_COLOR,
    fontSize: '1rem',
    alignItems: 'baseline',
    padding: '8px 30px 8px 30px',
    overflow: 'hidden',
    [theme.breakpoints.down('md')]: {
      padding: '5px 20px'
    }
  },

  [`& .${classes.abcRow}`]: {
    fontSize: '1rem',
    alignItems: 'baseline',
    padding: '20px 30px',
    overflow: 'hidden'
  },

  [`& .${classes.cell}`]: {
    alignItems: 'baseline',
    [theme.breakpoints.down('md')]: {
      paddingRight: '15px'
    }
  },

  [`& .${classes.kalmanRQ}`]: {
    [theme.breakpoints.down('md')]: {
      paddingRight: '15px'
    }
  },

  [`& .${classes.textField}`]: {
    width: '100%',
    '& label.Mui-focused': {
      color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      borderColor: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR
    },
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR
      }
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

  [`& .${classes.centerOnMobile}`]: {
    [theme.breakpoints.down('md')]: {
      justifyContent: 'center'
    }
  }
}));

const DeviceCalibration = (props) => {
  const OrangeRadio = (props) => <Radio color="default" {...props} />;

  const [inputs, setInputs] = useState({
    allowAuto: '',
    isNormalized: '',
    normalizer: '',
    R: '',
    Q: '',
    updatedAt: '',
    rssiBase: '',
    rssi: []
  });
  const [refreshing, setRefreshing] = useState(false);
  const [applyToMany, setApplyToMany] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([props.groups && props.groups[0]]);

  const algorithmName = () => {
    if (!props.deviceCalibration) return;
    const algo = props.deviceCalibration.calibration.algorithm;
    if (algo === 0) {
      return 'Kalman on measured RSSI';
    } else if (algo === 1) {
      return 'Kalman on computed distance';
    } else {
      return '';
    }
  };

  const methodName = () => {
    if (!props.deviceCalibration) return;
    const method = props.deviceCalibration.calibration.method;
    if (method === 1) {
      return 'WCL using ratio of shortest to longest distance from each anchor';
    } else if (method === 2) {
      return 'WCL using the longest distance between anchors minus the distance to each anchors';
    } else if (method === 3) {
      return 'WCL using the distance to each anchors minus the shortest between each anchors';
    } else if (method === 4) {
      return 'WCL using the surface between anchors as weight';
    } else if (method === 5) {
      return 'WCL using the SQRT of the surface to anchors as weight';
    } else if (method === 6) {
      return 'WCL using the SQRT of the surface between anchors minus distand to each anchor';
    } else if (method === 7) {
      return 'Custom Weight + Corrected to centroid of nearest base';
    } else {
      return 'Basic WCL';
    }
  };

  useEffect(() => {
    // populate input fields with values from calibration/get
    if (props.deviceCalibration) {
      const default_calibration = getDefaultCalibration();
      const calibration = props.deviceCalibration.calibration;
      const calibrated = !isUndefined(calibration.a) && !isUndefined(calibration.b) && !isUndefined(calibration.c);

      setInputs({
        isNormalized: calibration.isNormalized || false,
        normalizer: calibration.normalizer,
        R: calibration.kalmanFilter.R,
        Q: calibration.kalmanFilter.Q,
        updatedAt: moment(props.deviceCalibration.updatedAt).format('lll'),
        rssiBase:
          calibration.rssiBase && calibration.rssiBase !== 0 ? calibration.rssiBase : default_calibration.rssiBase,
        rssi: calibration.rssi || [],
        a: !isUndefined(calibration.a) ? calibration.a : '',
        b: !isUndefined(calibration.b) ? calibration.b : '',
        c: !isUndefined(calibration.c) ? calibration.c : ''
      });
    }

    // fetch calibration every 1min if allowAuto enabled
    let interval = '';
    if (props.deviceCalibration.allowAuto) {
      const payload = {
        database: props.database,
        device: {
          deviceId: props.device.deviceId
        }
      };
      interval =
        props.deviceCalibration.allowAuto &&
        setInterval(() => {
          setRefreshing(true);
          setTimeout(() => {
            props.getDeviceCalibration(payload);
            setRefreshing(false);
          }, 3000);
        }, 60000);
    } else {
      clearInterval(interval);
    }
    return () => {
      clearInterval(interval);
    };
  }, [props.deviceCalibration]);

  const getDefaultCalibration = () => {
    let defCal = variables.CALIBRATION_BLE;
    switch (props.device.protocol) {
      case 'LTE':
        defCal = variables.CALIBRATION_LTE;
        break;
      case 'IOX':
        defCal = variables.CALIBRATION_IOX;
        break;
      default:
        defCal = defCal;
        break;
    }
    return defCal;
  };

  const handleInputChange = (event) => {
    // only digits +-. allowed
    const reg = new RegExp('^-?[0-9]*[.]?[0-9]+$');
    let value = event.target.value.trim();
    if (
      event.target.name !== 'allowAuto' &&
      value !== '' &&
      value !== '-' &&
      value !== '.' &&
      !reg.test(Number(value))
    ) {
      return;
    }
    // set input
    setInputs({
      ...inputs,
      [event.target.name]: value
    });
    // console.log(inputs);
  };

  const handleDropDownChange = (event) => {
    setInputs({
      ...inputs,
      [event.target.name]: event.target.value
    });
  };

  const handleRssiChange = (rssiArray) => {
    setInputs({ ...inputs, rssi: rssiArray });
  };

  const updateMultipleCalibrations = () => {
    console.log('updateMultipleCalibrations', selectedGroups);
    const calibration = props.deviceCalibration.calibration;

    const payload = {
      database: props.database,
      data: {
        devicesToUpdate: [],
        newCalibration: {}
      }
    };

    // get id's of devices to update
    const idArrayToUpdate = selectedGroups?.length ? filterByGroup(props.deviceList, selectedGroups) : props.deviceList;

    payload.data.devicesToUpdate = idArrayToUpdate.map((dev) => {
      return { deviceId: dev.deviceId, deviceType: dev.deviceType };
    });
    // calibration payload
    const deviceCalibration = {
      isNormalized: inputs.isNormalized !== undefined ? inputs.isNormalized : calibration.isNormalized,
      normalizer: inputs.normalizer !== undefined ? inputs.normalizer : calibration.normalizer,
      kalmanFilter: {
        R: inputs.R !== undefined ? Number(inputs.R) : calibration.kalmanFilter.R,
        Q: inputs.Q !== undefined ? Number(inputs.Q) : calibration.kalmanFilter.Q
      },
      rssiBase: inputs.rssiBase !== undefined ? Number(inputs.rssiBase) : calibration.rssiBase,
      algorithm: 1,
      method: 0,
      ...(inputs.a &&
        !isNaN(inputs.a) &&
        inputs.b &&
        !isNaN(inputs.b) &&
        inputs.c &&
        !isNaN(inputs.c) && { a: +inputs.a, b: +inputs.b, c: +inputs.c, useABC: true })
    };
    // add allowAuto to payload if user edited it
    payload.data.newCalibration.allowAuto = false;
    // add rssi array if array is not empty

    // deviceCalibration.calibration.rssi = rssiArr ? rssiArr : calibration.rssi || [];

    payload.data.newCalibration.calibration = deviceCalibration;

    console.log(payload);
    props.updateMultipleDeviceCalibration(payload);
  };

  const updateCalibration = () => {
    let calibration = props.deviceCalibration.calibration;
    // update single device config
    let rssiArr = [];
    inputs.rssi &&
      inputs.rssi.map((el) => {
        rssiArr.push({
          rssi: Number(el.rssi),
          distance: Number(el.distance),
          calibratorId: el.calibratorId,
          calDistance: Number(el.calDistance)
        });
      });
    const deviceCalibration = {
      deviceId: props.device.deviceId,
      organization: props.device.organization,
      calibration: {
        isNormalized: inputs.isNormalized !== undefined ? inputs.isNormalized : calibration.isNormalized,
        normalizer: inputs.normalizer !== undefined ? inputs.normalizer : calibration.normalizer,
        kalmanFilter: {
          R: inputs.R !== undefined ? Number(inputs.R) : calibration.kalmanFilter.R,
          Q: inputs.Q !== undefined ? Number(inputs.Q) : calibration.kalmanFilter.Q
        },
        rssiBase: inputs.rssiBase !== undefined ? Number(inputs.rssiBase) : calibration.rssiBase,
        algorithm: 1,
        method: 0,
        ...(inputs.a &&
          !isNaN(inputs.a) &&
          inputs.b &&
          !isNaN(inputs.b) &&
          inputs.c &&
          !isNaN(inputs.c) && { a: +inputs.a, b: +inputs.b, c: +inputs.c, useABC: true })
      }
      // version: props.deviceCalibration.version + 0.1,
    };
    // add allowAuto to payload if user edited it
    props.allowAuto !== '' && (deviceCalibration.allowAuto = props.allowAuto);
    // add rssi array if array is not empty

    deviceCalibration.calibration.rssi = rssiArr ? rssiArr : calibration.rssi || [];

    const payload = {
      device: deviceCalibration
    };
    console.log(payload.device);
    props.updateDeviceCalibration(payload);
  };

  const handleUpdate = () => {
    // validating input
    if (handleDisableSave()) {
      return;
    }
    if (applyToMany) {
      updateMultipleCalibrations();
    } else {
      updateCalibration();
    }
  };

  const applyDefaultClick = () => {
    const default_calibration = getDefaultCalibration();
    setInputs({
      isNormalized: true,
      normalizer: 'kalman',
      R: 0.15,
      Q: 3,
      rssiBase: default_calibration.rssiBase,
      a: default_calibration.a,
      b: default_calibration.b,
      c: default_calibration.c
    });
  };

  const handleDisableSave = () => {
    let disable = false;
    // disable save button
    if (props.deviceList?.length > 0) {
      // for multiple devices
      if ((inputs.R !== '' && inputs.Q === '') || (inputs.R === '' && inputs.Q !== '')) {
        // kalman filter R and Q are required together
        return true;
      }
      if (inputs.R !== '' && Number(inputs.R) < 0) return true;
      if (inputs.Q !== '' && Number(inputs.Q) < 0) return true;
      if (inputs.rssiBase !== '' && Number(inputs.rssiBase) >= 0) return true;
    } else {
      // for single device
      if (inputs.R !== '' && (inputs.R === '' || isNaN(inputs.R) || Number(inputs.R) < 0)) return true;
      if (inputs.Q !== '' && (inputs.Q === '' || isNaN(inputs.Q) || Number(inputs.Q) < 0)) return true;
      if (inputs.rssiBase !== '' && (inputs.rssiBase === '' || isNaN(inputs.rssiBase) || Number(inputs.rssiBase) >= 0))
        return true;
    }
    // validate rssi array
    if (inputs.rssi && inputs.rssi.length > 0) {
      inputs.rssi.map((element) => {
        if (
          element.rssi === '' ||
          Number(element.rssi) >= 0 ||
          isNaN(element.rssi) ||
          element.calibratorId.trim() === '' ||
          element.distance === '' ||
          Number(element.distance) <= 0 ||
          isNaN(element.distance) ||
          element.calDistance === '' ||
          Number(element.calDistance) <= 0 ||
          isNaN(element.calDistance)
        ) {
          disable = true;
        }
      });
    }
    return disable;
  };

  return (
    <StyledBox className={classes.paper}>
      <Box className={classes.body}>
        <form>
          <Grid container>
            {props.device && (
              <>
                {(props.device.fixAsset || props.device.protocol === 'WIFI' || props.device.isAnchor) && (
                  <>
                    <Grid container>
                      <Grid container item sm={12} justifyContent="center">
                        <Accordion style={{ width: '100%', borderTop: '1px solid lightgrey' }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography className={classes.heading}>RSSI</Typography>
                          </AccordionSummary>
                          <AccordionDetails style={{ padding: 0 }}>
                            <RSSIList
                              data={props.deviceCalibration && inputs.rssi}
                              handleRssiChange={handleRssiChange.bind(this)}
                              deviceId={props.device && props.device.deviceId}
                            />
                          </AccordionDetails>
                        </Accordion>
                      </Grid>
                    </Grid>

                    <Grid container>
                      <Grid
                        container
                        item
                        sm={12}
                        xs={12}
                        justifyContent="flex-end"
                        className={classes.cell}
                        style={{ padding: '0 20px' }}
                      >
                        <Chip
                          label="Refreshing..."
                          style={{
                            marginTop: '10px',
                            color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
                            borderColor: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
                            display: !refreshing ? 'none' : ''
                          }}
                          variant="outlined"
                        />
                      </Grid>
                    </Grid>
                  </>
                )}
                <Grid container style={{ margin: '10px 0' }} spacing={5}>
                  <Grid container item sm={4} xs={12} justifyContent="center" className={classes.cell}>
                    <TextField
                      label="A"
                      className={classes.textField}
                      name="a"
                      error={props.deviceCalibration && inputs && (inputs.a < 0 || inputs.a > 5)}
                      onChange={handleInputChange}
                      value={inputs && (!isNaN(inputs.a) || inputs.a === '-') ? inputs.a : ''}
                      variant="outlined"
                      disabled={props.device.protocol === 'LTE' && !props.device.fixAsset}
                    />
                  </Grid>
                  <Grid container item sm={4} xs={12} justifyContent="center" className={classes.cell}>
                    <TextField
                      label="B"
                      className={classes.textField}
                      name="b"
                      error={props.deviceCalibration && inputs && (inputs.b < 0 || inputs.b > 10)}
                      onChange={handleInputChange}
                      value={inputs && (!isNaN(inputs.b) || inputs.b === '-') ? inputs.b : ''}
                      variant="outlined"
                      disabled={props.device.protocol === 'LTE' && !props.device.fixAsset}
                    />
                  </Grid>
                  <Grid container item sm={4} xs={12} justifyContent="center" className={classes.cell}>
                    <TextField
                      label="C"
                      className={classes.textField}
                      name="c"
                      error={props.deviceCalibration && inputs && (inputs.c < -2 || inputs.c > 2)}
                      onChange={handleInputChange}
                      value={inputs && (!isNaN(inputs.c) || inputs.c === '-') ? inputs.c : ''}
                      variant="outlined"
                      disabled={props.device.protocol === 'LTE' && !props.device.fixAsset}
                    />
                  </Grid>
                </Grid>
              </>
            )}
            <Grid container className={classes.row}>
              <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
                {!props.device && (
                  <>
                    <Grid container item sm={6} xs={6} justifyContent="center">
                      Auto-calibration:
                    </Grid>
                    <Grid container item sm={6} xs={6}>
                      <RadioGroup
                        aria-label="allowAuto"
                        name="allowAuto"
                        defaultValue={''}
                        onChange={handleInputChange}
                      >
                        <FormControlLabel
                          value="true"
                          control={
                            <OrangeRadio
                              classes={{
                                root: classes.root,
                                checked: classes.checked
                              }}
                            />
                          }
                          label={<span style={{ color: '#000' }}>True</span>}
                        />
                        <FormControlLabel
                          value="false"
                          control={
                            <OrangeRadio
                              classes={{
                                root: classes.root,
                                checked: classes.checked
                              }}
                            />
                          }
                          label={<span style={{ color: '#000' }}>False</span>}
                        />
                      </RadioGroup>
                    </Grid>
                  </>
                )}
              </Grid>
            </Grid>
            <Grid container>
              {(props.device.fixAsset || props.device.protocol === 'WIFI' || props.device.isAnchor) && (
                <>
                  <Grid container className={classes.row} spacing={5}>
                    {!props.device.isAnchor && (
                      <>
                        <Grid container item sm={6} xs={12} justifyContent="center" className={classes.cell}>
                          <Grid container item sm={12} xs={12}>
                            <TextField
                              className={classes.textField}
                              label={'Normalizer'}
                              select
                              name="normalizer"
                              onChange={handleDropDownChange}
                              value={inputs.normalizer || ''}
                            >
                              <MenuItem key={'kalman'} value={'kalman'}>
                                Kalman
                              </MenuItem>
                              <MenuItem key={'decay'} value={'decay'}>
                                Decay
                              </MenuItem>
                            </TextField>
                          </Grid>
                        </Grid>
                        <Grid container item sm={6} xs={12} justifyContent="center" className={classes.cell}>
                          <Grid container item sm={12} xs={12}>
                            <TextField
                              className={classes.textField}
                              id="isNormalized"
                              label={'Is normalized'}
                              select
                              name="isNormalized"
                              onChange={handleDropDownChange}
                              value={inputs.isNormalized || false}
                            >
                              <MenuItem key={true} value={true}>
                                True
                              </MenuItem>
                              <MenuItem key={false} value={false}>
                                False
                              </MenuItem>
                            </TextField>
                          </Grid>
                        </Grid>
                      </>
                    )}
                  </Grid>
                  {!props.device.isAnchor && (
                    <>
                      <Grid container className={classes.row} spacing={5}>
                        <Grid container item sm={6} xs={12} justifyContent="center" className={classes.cell}>
                          <Grid container item sm={12} xs={12}>
                            <TextField
                              className={classes.textField}
                              onChange={handleInputChange}
                              id="rValue"
                              name="R"
                              label="Kalman filter R"
                              value={inputs.R || ''}
                              error={(inputs.R === '' && inputs.Q !== '') || Number(inputs.R) < 0}
                              helperText={
                                inputs.R === '' && inputs.Q !== ''
                                  ? 'invalid input'
                                  : Number(inputs.R) < 0
                                  ? "can't be less than 0"
                                  : ''
                              }
                              InputLabelProps={{
                                shrink: true
                              }}
                            />
                          </Grid>
                        </Grid>
                        <Grid container item sm={6} xs={12} justifyContent="center" className={classes.cell}>
                          <Grid container item sm={12} xs={12}>
                            <TextField
                              className={classes.textField}
                              onChange={handleInputChange}
                              id="qValue"
                              name="Q"
                              label="Kalman filter Q"
                              value={inputs.Q || ''}
                              error={(inputs.Q === '' && inputs.R !== '') || Number(inputs.Q) < 0}
                              helperText={
                                inputs.Q === '' && inputs.R !== ''
                                  ? 'invalid input'
                                  : Number(inputs.Q) < 0
                                  ? "can't be less than 0"
                                  : ''
                              }
                              InputLabelProps={{
                                shrink: true
                              }}
                            />
                          </Grid>
                        </Grid>
                      </Grid>
                    </>
                  )}
                </>
              )}
              <Grid container className={classes.row} spacing={5}>
                <Grid container item sm={6} xs={12} justifyContent="center" className={classes.cell}>
                  <Grid container item sm={12} xs={12}>
                    <TextField
                      className={classes.textField}
                      onChange={handleInputChange}
                      id="rssiBase"
                      type="text"
                      label="RSSI base"
                      name="rssiBase"
                      value={inputs.rssiBase || ''}
                      error={inputs.rssiBase === '' || (inputs.rssiBase !== '' && Number(inputs.rssiBase) >= 0)}
                      helperText={
                        inputs.rssiBase === ''
                          ? 'invalid input'
                          : inputs.rssiBase !== '' && Number(inputs.rssiBase) >= 0
                          ? "can't be greater than or equal to 0"
                          : ''
                      }
                      InputLabelProps={{
                        shrink: true
                      }}
                    />
                  </Grid>
                </Grid>
                <Grid container item sm={6} xs={12} justifyContent="center" className={classes.cell}>
                  {
                    <Grid container item sm={12} xs={12}>
                      <TextField
                        className={classes.textField}
                        onChange={handleInputChange}
                        id="updatedAt"
                        type="text"
                        name="updatedAt"
                        label="Date updated"
                        value={
                          (props.deviceCalibration && moment(props.deviceCalibration.updatedAt).format('lll')) || ''
                        }
                        disabled
                        InputLabelProps={{
                          shrink: true
                        }}
                      />
                    </Grid>
                  }
                </Grid>
              </Grid>
              {props.device && (props.device.fixAsset || props.device.protocol === 'WIFI') && (
                <Grid container className={classes.row} spacing={5}>
                  <Grid container item sm={6} xs={12} justifyContent="center" className={classes.cell}>
                    <Grid container item sm={12} xs={12}>
                      <TextField
                        className={classes.textField}
                        onChange={handleInputChange}
                        id="algorithm"
                        type="text"
                        label="Algorithm"
                        name="algorithm"
                        multiline
                        maxRows={2}
                        value={algorithmName()}
                        InputLabelProps={{
                          shrink: true
                        }}
                        disabled
                      />
                    </Grid>
                  </Grid>
                  <Grid container item sm={6} xs={12} justifyContent="center" className={classes.cell}>
                    <Grid container item sm={12} xs={12}>
                      <TextField
                        className={classes.textField}
                        onChange={handleInputChange}
                        id="method"
                        multiline
                        type="text"
                        label="Method"
                        name="method"
                        value={methodName()}
                        InputLabelProps={{
                          shrink: true
                        }}
                        disabled
                      />
                    </Grid>
                  </Grid>
                </Grid>
              )}
              <ApplyToManySelect
                applyToMany={applyToMany}
                setApplyToMany={setApplyToMany}
                selectedGroups={selectedGroups}
                setSelectedGroups={setSelectedGroups}
              />
              <Grid container className={classes.row}>
                <Grid container item sm={12} justifyContent="center">
                  <Button onClick={handleUpdate} className={classes.doneButton} disabled={handleDisableSave()}>
                    {'Save Settings'}
                  </Button>
                  <Button onClick={applyDefaultClick} variant="outlined" className={classes.applyButton}>
                    {'Apply default'}
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </form>
      </Box>
    </StyledBox>
  );
};

const mapStateToProps = ({ user, map, provision }) => ({
  loginType: user.loginType,
  editableMap: map.editableMap,
  provisionType: provision.provisionType,
  database: user.database,
  groups: user.groups,
  deviceCalibration: provision.deviceCalibration,
  isConfigLoading: provision.isConfigLoading,
  device: provision.selectedRow,
  deviceList: provision.states,
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount'
});

const mapDispatch = ({
  provision: {
    updateDeviceCalibrationAction,
    updateMultipleDeviceCalibrationAction,
    setSelectedDeviceListAction,
    getDeviceCalibrationAction
  },
  location: { renderComponentAction }
}) => ({
  updateDeviceCalibration: updateDeviceCalibrationAction,
  updateMultipleDeviceCalibration: updateMultipleDeviceCalibrationAction,
  renderComponent: renderComponentAction,
  setSelectedDeviceList: setSelectedDeviceListAction,
  getDeviceCalibration: getDeviceCalibrationAction
});

export default connect(mapStateToProps, mapDispatch)(DeviceCalibration);
