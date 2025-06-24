import React, { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { Grid, IconButton, Typography } from '@mui/material';
import { connect } from 'react-redux';
import BasicCalibration from '../Calibration/BasicCalibration';

import { BasicInfo, MainForm, FirmwareForm, WifiForm } from './Forms';

import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { hasAccess } from '../../util/hasAccess';
import variables from '../../variables.json';

const PREFIX = 'MainConfiguration';

const classes = {
  wrapper: `${PREFIX}-wrapper`,
  paper: `${PREFIX}-paper`,
  head: `${PREFIX}-head`,
  card: `${PREFIX}-card`,
  badge: `${PREFIX}-badge`,
  returnButton: `${PREFIX}-returnButton`
};

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.wrapper}`]: {
    height: 'auto',
    width: '100%',
    backgroundColor: '#e4e5e6'
  },

  [`& .${classes.paper}`]: {
    margin: '0px auto',
    width: '960px',
    outline: 'none',
    [theme.breakpoints.down('md')]: {
      margin: '0px 5px 80px 5px',
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
    margin: '20px 0'
  },

  [`& .${classes.badge}`]: {
    backgroundColor: variables.ORANGE_COLOR,
    color: variables.LIGHT_GRAY_COLOR
  },

  [`& .${classes.returnButton}`]: {
    position: 'absolute',
    left: 0
  }
}));

const MainConfiguration = (props) => {
  const adminAccess = hasAccess(
    props.userPermissions,
    variables.ADVANCETOOL,
    props.role,
    props.adminDatabase || props.database,
    props.group
  );
  const [calibrationFetched, setCalibrationFetched] = useState(false);

  useEffect(() => {
    // fetch status to get configuration & firmware status

    !props.selectedDeviceList ||
      (props.selectedDeviceList.length === 0 &&
        ['WIFI', 'LTE'].includes(props.selectedRow.protocol) &&
        props.getLastDeviceStatus({ query: { deviceId: props.selectedRow.deviceId } }));

    if (props.selectedRow) {
      props.setDeviceState();
    } else {
      // return to the main page if no device selected
      props.renderComponent('provision');
    }

    // fetch calibration
    const fetchData = async () => {
      await props.getDeviceCalibration({ device: props.selectedRow });
      setCalibrationFetched(true);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (
      props.selectedRow &&
      calibrationFetched &&
      (props.provisionType === 'Locator' ||
        props.selectedRow.protocol === 'BLE' ||
        props.selectedRow.protocol === 'LTE' ||
        (props.selectedRow.protocol === 'IOX' && props.selectedRow.fixAsset))
    ) {
      if (props.deviceCalibration) {
        // display existing calibration
        props.setDeviceCalibration(props.deviceCalibration);
      } else {
        const payload = {
          database: props.database,
          device: {
            deviceId: props.selectedRow.deviceId,
            deviceType: props.provisionType,
            organization: props.selectedRow.organization
          },
          isCreate: true
        };
        // create new one
        props.updateDeviceCalibration(payload);
      }
    }
  }, [props.deviceCalibration, calibrationFetched]);

  const refresh = async () => {
    // get/refresh device (name/groups, configId, firmware)
    const device = ['BLE', 'LTE'].includes(props.selectedRow.protocol)
      ? await props.getDeviceState({ deviceId: props.selectedRow.deviceId })
      : await props.getDeviceData({ deviceId: props.selectedRow.deviceId });
    if (!device) return;
    props.setSelectedRow({ ...props.selectedRow, ...device });
    // get/refresh configuration
    if (device.deviceType === 'Tag') {
      getConfigurationForTag(device);
    } else {
      getConfigurationForLocator(device);
    }
    // get/refresh calibration
    props.getDeviceCalibration({ device: device });
  };

  const getConfigurationForTag = (rowData) => {
    const defaultData = {
      deviceType: props.provisionType,
      protocol: rowData.protocol,
      forUI: true
    };

    // get device configuration by id if available or default by protocol and devicetype
    props.getConfig({
      database: props.database,
      data: rowData.configurationId
        ? {
            configurationId: rowData.configurationId,
            protocol: rowData.protocol,
            forUI: true
          }
        : defaultData
    });
  };

  const getConfigurationForLocator = (rowData) => {
    const defaultData = {
      deviceType: props.provisionType,
      protocol: 'BLE',
      forUI: true
    };

    props.getLocatorConfig({
      database: props.database,
      data: rowData.configurationId
        ? {
            configurationId: rowData.configurationId,
            protocol: rowData.protocol,
            forUI: true
          }
        : { deviceType: rowData.deviceType, protocol: rowData.protocol, forUI: true }
    });
  };

  const handleReturnBack = () => {
    props.renderComponent('provision');
    props.resetConfiguration();
    props.clearDeviceMetrics();
    props.resetFirmwareAndStatus();
    props.resetDeviceState();
  };

  const hasContent =
    props.selectedRow.protocol === 'WIFI' ||
    (props.selectedRow.protocol === 'LTE' && props.deviceConfig) ||
    (props.selectedRow.protocol === 'BLE' &&
      !props.selectedRow.isAnchor &&
      props.tenant.subscriptions &&
      props.tenant.subscriptions.temperature_calibration);

  return (
    <Root className={classes.wrapper}>
      <div className={classes.paper}>
        <Grid container>
          <Grid container item md={12} sm={12} justifyContent="center" className={classes.head}>
            <IconButton onClick={handleReturnBack} className={classes.returnButton} size="large">
              <ArrowBackIosIcon />
            </IconButton>
            <Typography
              variant="h5"
              component="h5"
              style={{ color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR }}
            >
              {!props.selectedDeviceList || props.selectedDeviceList.length === 0
                ? props.screenWidth < 1000
                  ? `${props.selectedRow.deviceType} ${props.selectedRow.deviceId}`
                  : `Advanced Settings for ${props.selectedRow.deviceType} ${props.selectedRow.deviceId}`
                : 'Configure Multiple Devices'}
            </Typography>
          </Grid>
          {(!props.selectedDeviceList || props.selectedDeviceList.length === 0) && (
            <>
              <Grid container item md={12} sm={12} justifyContent="center" className={classes.card}>
                <BasicInfo refresh={refresh} adminAccess={adminAccess} />
              </Grid>

              {hasContent && (
                <Grid container item md={12} sm={12} justifyContent="center" className={classes.card}>
                  {props.selectedRow.protocol === 'WIFI' && <WifiForm adminAccess={adminAccess} />}
                  {props.selectedRow.protocol === 'LTE' && props.deviceConfig && (
                    <MainForm type={'lte'} adminAccess={adminAccess} />
                  )}
                  {props.selectedRow.protocol === 'BLE' &&
                    !props.selectedRow.isAnchor &&
                    props.tenant.subscriptions &&
                    props.tenant.subscriptions.temperature_calibration && (
                      <MainForm type={'temperature'} adminAccess={adminAccess} />
                    )}
                </Grid>
              )}
              {props.selectedRow.protocol !== 'IOX' && (
                <Grid container item md={12} sm={12} justifyContent="center" className={classes.card}>
                  <FirmwareForm adminAccess={adminAccess} />
                </Grid>
              )}
            </>
          )}
          {(((props.provisionType === 'Locator' ||
            (props.selectedRow.protocol === 'LTE' && !props.deviceConfig?.profile?.gpsOnly) ||
            (props.selectedRow.protocol === 'IOX' && props.selectedRow.fixAsset)) &&
            adminAccess) || // only assetflo admin can access locator/5g/fixedIOX calibration
            (props.selectedRow.protocol === 'BLE' && props.selectedRow.isAnchor)) && (
            <Grid container item md={12} sm={12} justifyContent="center" className={classes.card}>
              <BasicCalibration />
            </Grid>
          )}
        </Grid>
      </div>
    </Root>
  );
};

const mapStateToProps = ({ location, user, provision, map }) => ({
  routerLocation: location.routerLocation,
  fullScreen: location.fullScreen,
  email: user.email,
  loginType: user.loginType,
  screenWidth: location.screenWidth,
  role: user.role,
  userPermissions: user.userPermissions,
  database: user.database,
  adminDatabase: user.adminDatabase,
  group: user.group,
  provisionType: provision.provisionType,
  selectedDeviceList: provision.selectedDeviceList,
  selectedRow: provision.selectedRow,
  deviceCalibration: provision.deviceCalibration,
  screenWidth: location.screenWidth,
  deviceConfig: provision.deviceConfig,
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount'
});

const mapDispatch = ({
  location: { renderComponentAction, fullScreenAction },
  dashboard: { setSelectedCardAction, clearDeviceMetricsAction },
  user: { logoutAction },
  provision: {
    getDeviceCalibrationAction,
    setDeviceCalibrationAction,
    updateDeviceCalibrationAction,
    resetConfigurationAction,
    getConfigAction,
    getLocatorConfigAction,
    getLastDeviceStatusAction,
    resetFirmwareAndStatusAction,
    getDeviceDataAction,
    setSelectedRowAction
  },
  configuration: { resetDeviceStateAction, getDeviceStateAction, setDeviceStateAction }
}) => ({
  renderComponent: renderComponentAction,
  fullScreenAction: fullScreenAction,
  setSelectedCard: setSelectedCardAction,
  logout: logoutAction,
  setDeviceCalibration: setDeviceCalibrationAction,
  updateDeviceCalibration: updateDeviceCalibrationAction,
  resetConfiguration: resetConfigurationAction,
  getConfig: getConfigAction,
  getLocatorConfig: getLocatorConfigAction,
  getLastDeviceStatus: getLastDeviceStatusAction,
  clearDeviceMetrics: clearDeviceMetricsAction,
  resetFirmwareAndStatus: resetFirmwareAndStatusAction,
  resetDeviceState: resetDeviceStateAction,
  getDeviceData: getDeviceDataAction,
  setSelectedRow: setSelectedRowAction,
  getDeviceCalibration: getDeviceCalibrationAction,
  getDeviceState: getDeviceStateAction,
  setDeviceState: setDeviceStateAction
});

export default connect(mapStateToProps, mapDispatch)(MainConfiguration);
