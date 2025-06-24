import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import { Grid, Slider, TextField } from '@mui/material';
import { connect } from 'react-redux';
import variables from '../../../../variables.json';
import CustomSwitch from '../../../Common/CustomSwitch';

const PREFIX = 'LteForm';

const classes = {
  switchBase: `${PREFIX}-switchBase`,
  checked: `${PREFIX}-checked`,
  track: `${PREFIX}-track`,
  row: `${PREFIX}-row`,
  cell: `${PREFIX}-cell`,
  textField: `${PREFIX}-textField`,
  formControl: `${PREFIX}-formControl`,
  label: `${PREFIX}-label`,
  slider: `${PREFIX}-slider`,
  colorPrimary: `${PREFIX}-colorPrimary`,
  barColorPrimary: `${PREFIX}-barColorPrimary`,
  chip: `${PREFIX}-chip`
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')(({ theme, ...props }) => ({
  [`& .${classes.row}`]: {
    // borderColor: variables.LIGHT_GRAY_COLOR,
    fontSize: '1rem',
    padding: '10px 30px 10px 30px',
    overflow: 'hidden',
    margin: 0,
    [theme.breakpoints.down('md')]: {
      padding: '5px 20px'
    }
  },

  [`& .${classes.cell}`]: {
    alignItems: 'baseline',
    [theme.breakpoints.down('md')]: {
      padding: '0 15px'
    }
  },

  [`& .${classes.textField}`]: {
    // width: '90%',
    '& label.Mui-focused': {
      color: variables.ORANGE_COLOR
    },
    '& .MuiOutlinedInput-root.Mui-focused fieldset': {
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

  [`& .${classes.formControl}`]: {
    width: '100%',
    '& label.Mui-focused': {
      color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR
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

  [`& .${classes.label}`]: {
    color: 'rgba(0, 0, 0, 0.54)',
    fontSize: '12px',
    marginBottom: !props.adminAccess ? 0 : '16px'
  },

  [`& .${classes.slider}`]: {
    color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR
  },

  [`& .${classes.colorPrimary}`]: {
    backgroundColor: '#B2DFDB'
  },

  [`& .${classes.barColorPrimary}`]: {
    backgroundColor: variables.GREEN_COLOR
  },

  [`& .${classes.chip}`]: {
    backgroundColor: '#ffc107'
  }
}));

const lteFreqMarks = [
  {
    value: 0
  },
  {
    value: 1
  },
  {
    value: 2
  },
  {
    value: 3
  },
  {
    value: 4
  },
  {
    value: 5
  },
  {
    value: 6
  },
  {
    value: 7
  },
  {
    value: 8
  },
  {
    value: 9
  },
  {
    value: 10
  },
  {
    value: 11
  },
  {
    value: 12
  },
  {
    value: 13
  },
  {
    value: 14
  },
  {
    value: 15
  }
];
//                 24,12, 8, 6, 4, 3,  2,  1,.30,.15,  .5,  .2,   .1, in hours
const realValues = [1, 2, 3, 4, 6, 8, 12, 24, 48, 96, 288, 720, 1440, 2880, 5760, 17280, 28800];
const motionValueRange = [60, 30, 15, 10, 5, 2, 1, 2880, 5760, 17280, 28800];

const motionSensitivityMarks = [
  { value: 150, label: '150' },
  { value: 300, label: '300' },
  { value: 450, label: '450' },
  { value: 600, label: '600' },
  { value: 750, label: '750' },
  { value: 900, label: '900' }
];

const gpsTimeoutMarks = [
  { value: 30, label: '30' },
  { value: 60, label: '60' },
  { value: 90, label: '90' },
  { value: 120, label: '120' },
  { value: 150, label: '150' },
  { value: 180, label: '180' },
  { value: 210, label: '210' },
  { value: 240, label: '240' },
  { value: 270, label: '270' },
  { value: 300, label: '300' }
];

const LteForm = (props) => {
  const [prevMotionSensitivity, setPrevMotionSensitivity] = useState(motionSensitivityMarks[0].value);
  const [prevGpsTimeout, setPrevGpsTimeout] = useState(gpsTimeoutMarks[0].value);

  // const OrangeSwitch = Switch;

  // const batteryLevel = 100;
  const [maxMotion, setMaxMotion] = useState(60);
  const [maxMotionRate, setMaxMotionRate] = useState(24);

  const batteryCharge = 10800;

  const lteCharge = 0.045395;
  const lteSleepCurrent = 0.000004;
  const gpsCurrent = 0.055;
  const acqTime = 25;
  const bleAdvCurrent = 0.000022;
  const bleScanCurrent = 0.0114;
  const bleSleepCurrent = 0.000011;
  const sensorCurrent = 0.000028;
  const batteryDegradation = 0.8;
  const advDuration = 5;

  useEffect(() => {
    if (props.editedConfig && props.editedConfig.lteFrequency) {
      const index = realValues.indexOf(props.editedConfig.lteFrequency);
      setMaxMotionRate(realValues[index + 1]);
    }
  }, [props.editedConfig]);

  const calculateTotalCharge = () => {
    if (!props.editedConfig.lteFrequency) return;

    let lteEvents = props.editedConfig.lteFrequency;

    let lteActive = lteCharge * lteEvents;

    let lteSleep = lteSleepCurrent * (24 * 3600 - lteEvents * 4.5);

    let gps = gpsCurrent * acqTime * lteEvents;

    let bleAdv = bleAdvCurrent * advDuration * lteEvents;

    let bleScan = bleScanCurrent * advDuration * lteEvents;

    let bleSleep = bleSleepCurrent * (24 * 3600 - advDuration * lteEvents);

    let totalCharge = lteActive + lteSleep + gps + bleAdv + bleScan + bleSleep + sensorCurrent;
    // console.log(totalCharge);
    return 1.25 * totalCharge;
  };

  const usageLifeInMonths = () => {
    if (props.metrics && props.metrics.length < 1) return;
    if (isNaN(props.metrics[0].telemetry.batterylevel)) return;
    let currentBatteryLeve =
      props.metrics[0].telemetry.batterylevel > 100 ? 100 : props.metrics[0].telemetry.batterylevel;

    const lifeInDays =
      (((currentBatteryLeve / 100) * batteryCharge * batteryDegradation) / calculateTotalCharge()) * 0.5;

    const lifeInMonths = lifeInDays / 30;

    let res, end;
    if (lifeInMonths < 1) {
      res = Math.round(lifeInDays);
      end = res > 1 ? 's' : '';
      return `~${res} day${end} remaining`;
    }
    res = Math.round(lifeInMonths);
    end = res > 1 ? 's' : '';
    return `~${res} month${end} remaining`;
  };

  const valueText = (value) => {
    return realValues[value];
  };

  const valueTextMotion = (value) => {
    return motionValueRange[value];
  };

  const displayFreqMessage = (value) => {
    if (value === null || value === undefined) return;
    let res = 1440 / value;
    let units = res >= 60 ? 'hour' : res < 1 ? 'second' : 'minute';
    // console.log(res);
    res = res >= 60 ? res / 60 : res < 60 && value > 1440 ? res * 60 : res;
    res > 1 && (units = units + 's');
    return ` - every ${res} ${units}`;
  };

  const calculateFreq = (value) => {
    return realValues.indexOf(value);
  };

  const displayMotionFreqMessage = (value) => {
    if (value === 60) {
      return ` - every hour`;
    } else if (value > 60) {
      const res = 86400 / value;
      return ` - every ${res} seconds`;
    } else if (value === 1) {
      return ` - every minute`;
    } else {
      return ` - every ${value} minutes`;
    }
  };

  const handleIdleFrequencyChange = (value) => {
    // idle freq in min
    const idle = 1440 / realValues[value];
    // current set motionFreq
    const { motionFrequency = 10, motionRate } = props.editedConfig || {};
    // if idle 15min => max motion 5min
    const step = idle === 15 ? 2 : 1;
    // motion freq value depending on idle freq
    const motion = motionValueRange[motionValueRange.indexOf(idle >= 1 ? idle : realValues[value]) + step];

    setMaxMotion(motion);
    setMaxMotionRate(realValues[value + 1]);
    if (!motionRate && (idle <= motionFrequency || (idle === 15 && motionFrequency === 10))) {
      // props.setEditedConfig({ ...props.editedConfig, lteFrequency: realValues[value], motionFrequency: motion });
      props.setEditedConfig({
        ...props.editedConfig,
        lteFrequency: realValues[value],
        motionFrequency: 1,
        motionRate: realValues[value + 1]
      });
    } else if (motionRate && realValues[value] >= motionRate) {
      props.setEditedConfig({
        ...props.editedConfig,
        lteFrequency: realValues[value],
        motionFrequency: 1,
        motionRate: realValues[value + 1]
      });
    } else {
      props.setEditedConfig({
        ...props.editedConfig,
        lteFrequency: realValues[value],
        motionFrequency: 1,
        ...(!motionRate && { motionFrequency: 1, motionRate: 1440 / motionFrequency })
      });
      // props.handleSliderChange(realValues[value], 'lteFrequency');
    }
  };

  const handleMotionRateChange = (value) => {
    // motion freq in min
    const motion = realValues[value];
    const { lteFrequency } = props.editedConfig;

    props.setEditedConfig({
      ...props.editedConfig,
      motionRate: motion <= lteFrequency ? maxMotionRate : realValues[value]
    });
  };

  const [initialMotion, setInitialMotion] = useState(true);
  const [initialGps, setInitialGps] = useState(true);

  useEffect(() => {
    if (initialMotion) {
      // set initial prev motion sensitivity and gps timeout
      if (props.editedConfig && props.editedConfig.accMgThreshold) {
        setPrevMotionSensitivity(props.editedConfig.accMgThreshold);
      }
    }

    if (initialGps) {
      if (props.editedConfig && props.editedConfig.gpsTimeout) {
        setPrevGpsTimeout(props.editedConfig.gpsTimeout);
      }
    }
  }, [props.editedConfig]);

  return (
    <Root style={{ width: '100%' }}>
      <Grid
        container
        item
        xs={12}
        sm={12}
        style={{ alignItems: 'flex-start' }}
        mt={1}
        px={props.screenWidth <= 600 ? 4 : 6}
        spacing={props.screenWidth <= 600 ? 0 : 5}
      >
        <Grid
          container
          item
          sm={6}
          xs={12}
          className={classes.cell}
          style={{ alignItems: 'center', justifyContent: 'center', height: !props.adminAccess ? 30 : 100 }}
        >
          <label className={classes.label}>
            Idle Frequency <strong>{displayFreqMessage(props.editedConfig && props.editedConfig.lteFrequency)}</strong>
          </label>
          {props.adminAccess && (
            <Slider
              valueLabelDisplay={'off'}
              valueLabelFormat={(value) => valueText(value)}
              value={
                props.editedConfig && props.editedConfig.lteFrequency !== undefined
                  ? props.editedConfig && calculateFreq(props.editedConfig.lteFrequency)
                  : calculateFreq(
                      (props.lteConfig && props.lteConfig.profile && props.lteConfig.profile.lteFrequency) || 24
                    )
              }
              step={null}
              min={0}
              max={14}
              marks={lteFreqMarks}
              className={classes.slider}
              onChange={(e, value) => handleIdleFrequencyChange(value)}
            />
          )}
        </Grid>
        <Grid
          container
          item
          sm={6}
          xs={12}
          className={classes.cell}
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            height: !props.adminAccess ? 30 : 100,
            position: 'relative'
          }}
        >
          <label className={classes.label}>
            Motion Frequency{' '}
            {props.editedConfig.motionRate ? (
              <strong>{displayFreqMessage(props.editedConfig && props.editedConfig.motionRate)}</strong>
            ) : (
              <strong>
                {displayMotionFreqMessage((props.editedConfig && props.editedConfig.motionFrequency) || 5)}
              </strong>
            )}
          </label>
          {props.adminAccess && !props.editedConfig.motionRate && props.editedConfig.motionFrequency && (
            <Slider
              valueLabelDisplay={'off'}
              valueLabelFormat={(value) => valueTextMotion(value)}
              value={
                props.editedConfig && props.editedConfig.motionFrequency !== undefined
                  ? props.editedConfig &&
                    props.editedConfig.motionFrequency &&
                    motionValueRange.indexOf(props.editedConfig.motionFrequency)
                  : (props.lteConfig &&
                      props.lteConfig.profile &&
                      props.lteConfig.profile.motionFrequency &&
                      motionValueRange.indexOf(props.lteConfig.profile.motionFrequency)) ||
                    2
              }
              step={null}
              min={0}
              max={9}
              marks={lteFreqMarks}
              className={classes.slider}
              onChange={(e, value) => {
                const timesPerDay =
                  motionValueRange[value] <= 60 ? 1440 / motionValueRange[value] : motionValueRange[value];
                const freq =
                  timesPerDay <= maxMotionRate && motionValueRange[value] <= 60 ? maxMotionRate : timesPerDay;
                console.log('freq', value, motionValueRange[value], freq);
                props.handleSliderChange(freq, 'motionFrequency');
              }}
            />
          )}
          {props.adminAccess && props.editedConfig.motionRate && (
            <Slider
              valueLabelDisplay={'off'}
              valueLabelFormat={(value) => valueText(value)}
              value={
                props.editedConfig && props.editedConfig.motionRate !== undefined
                  ? props.editedConfig && calculateFreq(props.editedConfig.motionRate)
                  : calculateFreq(
                      (props.lteConfig && props.lteConfig.profile && props.lteConfig.profile.motionRate) || 96
                    )
              }
              step={1}
              min={7}
              max={16}
              marks={lteFreqMarks}
              className={classes.slider}
              onChange={(e, value) => handleMotionRateChange(value)}
            />
          )}
        </Grid>
        {/* motion sensitivity slider */}
        {props.adminAccess ? (
          <Grid
            container
            item
            xs={12}
            className={classes.cell}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              height: props.adminAccess ? 100 : 30,
              position: 'relative'
            }}
          >
            <label className={classes.label}>Motion Sensitivity</label>
            <Slider
              valueLabelDisplay="auto"
              value={
                isNaN(props.editedConfig?.accMgThreshold) ? prevMotionSensitivity : props.editedConfig.accMgThreshold
              }
              step={150}
              min={150}
              max={900}
              marks={motionSensitivityMarks}
              className={classes.slider}
              onChange={(e, value) => {
                setInitialMotion(false);
                setPrevMotionSensitivity(value);
                props.handleSliderChange(value, 'accMgThreshold');
              }}
            />
          </Grid>
        ) : null}
        {/* GPS Timeout slider */}
        {props.adminAccess ? (
          <Grid
            container
            item
            xs={12}
            className={classes.cell}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              height: !props.adminAccess ? 30 : 100,
              position: 'relative'
            }}
          >
            <label className={classes.label}>GPS Timeout</label>
            <Slider
              valueLabelDisplay="auto"
              value={isNaN(props.editedConfig?.gpsTimeout) ? prevGpsTimeout : props.editedConfig.gpsTimeout}
              step={30}
              min={30}
              max={300}
              marks={gpsTimeoutMarks}
              className={classes.slider}
              onChange={(e, value) => {
                setInitialGps(false);
                setPrevGpsTimeout(value);
                props.handleSliderChange(value, 'gpsTimeout');
              }}
            />
          </Grid>
        ) : null}
      </Grid>

      {props.adminAccess && (
        <Grid
          container
          className={classes.row}
          style={{ alignItems: 'center', justifyContent: 'center', marginTop: 30 }}
        >
          {/* <Grid
            container
            item
            sm={6}
            xs={12}
            className={classes.cell}
            style={{ alignItems: 'center', justifyContent: 'start', height: 80 }}
          >
            <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
              <TextField
                label="RSSI Scan Filter"
                // name="rssiScanFilter"
                name="txPower"
                type="number"
                className={classes.textField}
                value={props.editedConfig?.rssiScanFilter ?? props.editedConfig?.txPower}
                onChange={props.handleInputChange}
                InputLabelProps={{
                  shrink: true
                }}
                // sx={{ width: '90%' }}
              />
            </Grid>
          </Grid> */}
          <Grid
            container
            item
            sm={6}
            xs={12}
            className={classes.cell}
            style={{ alignItems: 'center', justifyContent: 'start', height: 80 }}
          >
            <Grid
              container
              item
              sm={12}
              xs={12}
              justifyContent="center"
              className={classes.cell}
              style={{ display: 'flex', alignContent: 'flex-end' }}
            >
              <TextField
                label="Number Of Beacons To Scan"
                // name="numOfBeaconsToScan"
                name="configurationNumber"
                type="number"
                className={classes.textField}
                value={props.editedConfig?.numOfBeaconsToScan ?? props.editedConfig?.configurationNumber}
                onChange={props.handleInputChange}
                InputLabelProps={{
                  shrink: true
                }}
                // sx={{ width: '90%' }}
              />
            </Grid>
          </Grid>
        </Grid>
      )}
      <Grid container className={classes.row} style={{ alignItems: 'center', justifyContent: 'center' }} spacing={3}>
        <Grid
          container
          item
          sm={6}
          xs={12}
          className={classes.cell}
          style={{ alignItems: 'center', justifyContent: 'start', height: 80 }}
        >
          <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
            <div style={{ marginRight: '10px' }}>GPS only:</div>
            <Grid item>Off</Grid>
            <Grid item>
              {props.adminAccess ? (
                <CustomSwitch
                  checked={
                    props.editedConfig && props.editedConfig.gpsOnly !== undefined
                      ? Boolean(props.editedConfig.gpsOnly)
                      : false
                  }
                  onChange={props.handleSwitchChange}
                  name="gpsOnly"
                  disabled={!props.adminAccess}
                  classes={{
                    switchBase: classes.switchBase,
                    checked: classes.checked,
                    track: classes.track
                  }}
                />
              ) : (
                <CustomSwitch
                  checked={false}
                  name="gpsOnly"
                  disabled={!props.adminAccess}
                  classes={{
                    switchBase: classes.switchBase,
                    checked: classes.checked,
                    track: classes.track
                  }}
                />
              )}
            </Grid>
            <Grid item>On</Grid>
          </Grid>
        </Grid>
        <Grid
          container
          item
          sm={6}
          xs={12}
          className={classes.cell}
          style={{ alignItems: 'center', justifyContent: 'start', height: 80 }}
        >
          <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
            <div style={{ marginRight: '10px' }}>Enable GPS:</div>
            <Grid item>Off</Grid>
            <Grid item>
              {/*Only allow to disable gps if not gpsOnly*/}
              {props.adminAccess && props.editedConfig && !props.editedConfig.gpsOnly ? (
                <CustomSwitch
                  checked={
                    props.editedConfig && props.editedConfig.gpsEnabled !== undefined
                      ? Boolean(props.editedConfig.gpsEnabled)
                      : true
                  }
                  onChange={props.handleSwitchChange}
                  name="gpsEnabled"
                  disabled={!props.adminAccess}
                  classes={{
                    switchBase: classes.switchBase,
                    checked: classes.checked,
                    track: classes.track
                  }}
                />
              ) : (
                <CustomSwitch
                  checked={true}
                  name="gpsEnabled"
                  disabled={true}
                  classes={{
                    switchBase: classes.switchBase,
                    checked: classes.checked,
                    track: classes.track
                  }}
                />
              )}
            </Grid>
            <Grid item>On</Grid>
          </Grid>
        </Grid>
        {props.adminAccess ? (
          <Grid
            container
            item
            sm={6}
            xs={12}
            className={classes.cell}
            style={{ alignItems: 'center', justifyContent: 'start', height: 80 }}
          >
            <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
              <div style={{ marginRight: '10px' }}>Debug Output:</div>
              <Grid item>Off</Grid>
              <Grid item>
                <CustomSwitch
                  checked={
                    props.editedConfig && props.editedConfig.debugOutput !== undefined
                      ? Boolean(props.editedConfig.debugOutput)
                      : false
                  }
                  onChange={props.handleSwitchChange}
                  name="debugOutput"
                  disabled={!props.adminAccess}
                  classes={{
                    switchBase: classes.switchBase,
                    checked: classes.checked,
                    track: classes.track
                  }}
                />
              </Grid>
              <Grid item>On</Grid>
            </Grid>
          </Grid>
        ) : null}
        {props.adminAccess ? (
          <Grid
            container
            item
            sm={6}
            xs={12}
            className={classes.cell}
            style={{ alignItems: 'center', justifyContent: 'start', height: 80 }}
          >
            <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
              <div style={{ marginRight: '10px' }}>Mqtt url:</div>
              <Grid item>Stag</Grid>
              <Grid item>
                <CustomSwitch
                  checked={
                    props.editedConfig && props.editedConfig.mqtturl !== undefined
                      ? Boolean(props.editedConfig.mqtturl)
                      : false
                  }
                  onChange={props.handleSwitchChange}
                  name="mqtturl"
                  disabled={!props.adminAccess}
                  classes={{
                    switchBase: classes.switchBase,
                    checked: classes.checked,
                    track: classes.track
                  }}
                />
              </Grid>
              <Grid item>Prod</Grid>
            </Grid>
          </Grid>
        ) : null}
      </Grid>
    </Root>
  );
};

const mapStateToProps = ({ user, map, provision, dashboard, location }) => ({
  loginType: user.loginType,
  editableMap: map.editableMap,
  provisionType: provision.provisionType,
  token: user.token,
  database: user.database,
  lteConfig: provision.deviceConfig,
  isConfigLoading: provision.isConfigLoading,
  device: provision.selectedRow,
  metrics: dashboard.deviceMetrics,
  lastStatus: provision.lastDeviceStatus && provision.lastDeviceStatus[0],
  screenWidth: location.screenWidth,
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount'
});

const mapDispatch = ({ location: { renderComponentAction } }) => ({
  renderComponent: renderComponentAction
});

export default connect(mapStateToProps, mapDispatch)(LteForm);
