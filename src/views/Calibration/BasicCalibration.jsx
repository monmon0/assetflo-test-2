import React, { useEffect, useState, useRef } from 'react';
import { styled } from '@mui/material/styles';
import { Grid, Switch, CircularProgress, Card, CardContent } from '@mui/material';
import { connect } from 'react-redux';
import variables from '../../variables.json';

import CalibrationSwitch from './CalibrationSwitch.js';
import CalibrationStatus from './CalibrationStatus.js';
import AdvancedSettings from './AdvancedSettings.js';

import { hasAccess } from '../../util/hasAccess.js';
import CustomSwitch from '../Common/CustomSwitch';
import ApplyToManyButton from '../Common/ApplyToManyButton';
import ApplyToManySelect from '../Common/ApplyToManySelect';

import { filterByGroup } from '../../util/filters';

const PREFIX = 'BasicCalibration';

const classes = {
  switchBase: `${PREFIX}-switchBase`,
  checked: `${PREFIX}-checked`,
  track: `${PREFIX}-track`,
  paper: `${PREFIX}-paper`,
  doneButton: `${PREFIX}-doneButton`,
  header: `${PREFIX}-header`,
  headerRow: `${PREFIX}-headerRow`,
  content: `${PREFIX}-content`,
  row: `${PREFIX}-row`,
  abcRow: `${PREFIX}-abcRow`,
  cell: `${PREFIX}-cell`,
  kalmanRQ: `${PREFIX}-kalmanRQ`,
  textField: `${PREFIX}-textField`,
  marginSides: `${PREFIX}-marginSides`,
  centerOnMobile: `${PREFIX}-centerOnMobile`,
  card: `${PREFIX}-card`
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')(({ theme }) => ({
  [`& .${classes.paper}`]: {
    overflowY: 'auto',
    overflowX: 'hidden',
    width: '100%',
    padding: '8px'
  },

  [`& .${classes.doneButton}`]: {
    color: variables.LIGHT_GRAY_COLOR,
    background: variables.ORANGE_COLOR,
    maxHeight: '36px'
  },

  [`& .${classes.header}`]: {
    fontSize: '1.09375rem',
    fontWeight: '600',
    color: 'rgb(87, 101, 116)'
  },

  [`& .${classes.headerRow}`]: {
    borderBottom: '1px solid #E4E5E6',
    alignItems: 'baseline',
    padding: '0px 30px 20px 30px',
    overflow: 'hidden',
    marginTop: '10px'
  },

  [`& .${classes.content}`]: {
    padding: 0,
    textAlign: 'center'
  },

  [`& .${classes.row}`]: {
    fontSize: '1rem',
    alignItems: 'baseline',
    padding: '8px 30px 8px 30px',
    overflow: 'hidden',
    [theme.breakpoints.down('lg')]: {
      padding: '5px 20px'
    },
    transition: '1s'
  },

  [`& .${classes.abcRow}`]: {
    fontSize: '1rem',
    alignItems: 'baseline',
    padding: '20px 30px',
    overflow: 'hidden'
  },

  [`& .${classes.cell}`]: {
    marginTop: '10px',
    alignItems: 'baseline',
    [theme.breakpoints.down('lg')]: {
      paddingRight: '15px'
    }
  },

  [`& .${classes.kalmanRQ}`]: {
    [theme.breakpoints.down('lg')]: {
      paddingRight: '15px'
    }
  },

  [`& .${classes.textField}`]: {
    width: '100%',
    '& label.Mui-focused': {
      color: variables.ORANGE_COLOR
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

  [`& .${classes.marginSides}`]: {
    margin: '0 10px'
  },

  [`& .${classes.centerOnMobile}`]: {
    [theme.breakpoints.down('lg')]: {
      justifyContent: 'center'
    }
  },

  [`& .${classes.card}`]: {
    height: '380px',
    width: '100%',
    overflow: 'hidden',
    position: 'relative'
  }
}));

const OrangeSwitch = CustomSwitch;

const BasicCalibration = (props) => {
  const [allowAuto, setAllowAuto] = useState((props.deviceCalibration && props.deviceCalibration.allowAuto) || false);
  const [confirmation, setConfirmation] = useState(false);
  const [text, setText] = useState('');
  const [applyToMany, setApplyToMany] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([props.device?.groups[0]]);

  useEffect(() => {
    props.deviceCalibration && setAllowAuto(props.deviceCalibration.allowAuto);
  }, [props.deviceCalibration]);

  const openConfirmation = () => {
    setConfirmation(true);
  };
  const closeConfirmation = () => {
    setConfirmation(false);
  };

  const handleSwitchChange = (event) => {
    setAllowAuto(event.target.checked);
    const payload = { allowAuto: event.target.checked };
    applyToMany ? updateMultipleCalibrations(payload) : updateCalibration(event.target.checked);
  };

  const updateCalibration = (value) => {
    const payload = {
      database: props.database,
      device: {
        deviceId: props.device.deviceId,
        allowAuto: value,
        organization: props.device.organization
      }
    };
    // console.log(payload.device);
    props.updateDeviceCalibration(payload);

    setConfirmation(false);
  };

  const updateMultipleCalibrations = (newCalib) => {
    const payload = {
      database: props.database,
      data: {
        devicesToUpdate: [],
        newCalibration: {}
      }
    };
    const devicesToCheck = props.allDevices.filter((dev) => dev.deviceType === props.device.deviceType);
    // get id's of devices to update
    const idArrayToUpdate =
      selectedGroups?.length && !selectedGroups.includes('GroupCompanyId')
        ? filterByGroup(devicesToCheck, selectedGroups)
        : devicesToCheck;

    payload.data.devicesToUpdate = idArrayToUpdate.map((dev) => {
      return { deviceId: dev.deviceId, deviceType: dev.deviceType };
    });
    payload.data.newCalibration = newCalib;
    console.log(payload);
    props.updateMultipleDeviceCalibration(payload);
  };

  const resetCalibration = () => {
    if (applyToMany) {
      const payload = { isReset: true };
      updateMultipleCalibrations(payload);
    } else {
      // reset abc and rssi array
      const payload = {
        database: props.database,
        device: {
          deviceId: props.device.deviceId,
          isReset: true,
          organization: props.device.organization
        }
      };
      // console.log(payload.device);
      props.updateDeviceCalibration(payload);
    }
    setConfirmation(false);
  };
  const displayText = () => {
    setText('(not recommended to change)');
  };

  const abcValid = () => {
    const calibration = props.deviceCalibration.calibration;
    if (
      calibration.a < 0 ||
      calibration.a > 10 ||
      calibration.b < 0 ||
      calibration.b > 20 ||
      calibration.c < -10 ||
      calibration.c > 10
    ) {
      return false;
    }
    return true;
  };

  const adminAccess = hasAccess(
    props.userPermissions,
    variables.ADVANCETOOL,
    props.role,
    props.adminDatabase || props.database,
    props.group
  );

  return (
    <Root>
      {(!props.device || !props.deviceCalibration) && props.deviceList.length === 0 ? (
        <CircularProgress style={{ margin: '0 auto', color: variables.ORANGE_COLOR }} />
      ) : (
        <Card className={classes.paper} variant="outlined">
          <CardContent className={classes.content}>
            <Grid container>
              <Grid container justifyContent="center" className={classes.headerRow}>
                <Grid container item sm={6} xs={6} justifyContent="center" className={classes.header}>
                  Calibration
                </Grid>
                <Grid container item sm={6} xs={6} justifyContent="center" className={classes.header}></Grid>
              </Grid>
              <Grid container>
                {/* CALIBRATION SWITCH */}
                {props.deviceList.length === 0 &&
                  props.device &&
                  (props.device.fixAsset || props.device.protocol === 'WIFI') && (
                    <CalibrationSwitch
                      classes={classes}
                      OrangeSwitch={OrangeSwitch}
                      handleSwitchChange={handleSwitchChange}
                      allowAuto={allowAuto}
                      updateMultipleCalibrations={updateMultipleCalibrations}
                    />
                  )}

                {props.device && (props.device.fixAsset || props.device.protocol === 'WIFI') && (
                  <ApplyToManySelect
                    allowAuto={allowAuto}
                    applyToMany={applyToMany}
                    setApplyToMany={setApplyToMany}
                    selectedGroups={selectedGroups}
                    setSelectedGroups={setSelectedGroups}
                  />
                )}
                {/* CALIBRATION STATUS */}
                {props.deviceList.length === 0 && (
                  <CalibrationStatus
                    abcValid={abcValid}
                    classes={classes}
                    allowAuto={allowAuto}
                    confirmation={confirmation}
                    openConfirmation={openConfirmation}
                    resetCalibration={resetCalibration}
                    closeConfirmation={closeConfirmation}
                    applyToMany={applyToMany}
                    setApplyToMany={setApplyToMany}
                    selectedGroups={selectedGroups}
                    setSelectedGroups={setSelectedGroups}
                    props={props}
                  />
                )}
                {/* ADVANCED SETTINGS  */}
                {/* Only accounts with superadmin access can change advanced settings*/}
                {adminAccess && (
                  <AdvancedSettings
                    displayText={displayText}
                    classes={classes}
                    text={text}
                    allowAuto={allowAuto}
                    props={props}
                  />
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Root>
  );
};

const mapStateToProps = ({ user, provision }) => ({
  loginType: user.loginType,
  provisionType: provision.provisionType,
  database: user.database,
  deviceCalibration: provision.deviceCalibration,
  isConfigLoading: provision.isConfigLoading,
  device: provision.selectedRow,
  deviceList: provision.selectedDeviceList,
  allDevices: provision.states,
  userPermissions: user.userPermissions,
  role: user.role,
  adminDatabase: user.adminDatabase,
  group: user.group,
  groups: user.groups
});

const mapDispatch = ({ provision: { updateDeviceCalibrationAction, updateMultipleDeviceCalibrationAction } }) => ({
  updateDeviceCalibration: updateDeviceCalibrationAction,
  updateMultipleDeviceCalibration: updateMultipleDeviceCalibrationAction
});

export default connect(mapStateToProps, mapDispatch)(BasicCalibration);
