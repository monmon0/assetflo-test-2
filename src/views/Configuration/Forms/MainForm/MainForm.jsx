import React, { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import {
  Button,
  Grid,
  MenuItem,
  CircularProgress,
  Select,
  FormControlLabel,
  Checkbox,
  Input,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import { groupTree } from '../../../../util/groupTree';
import { filterByGroup } from '../../../../util/filters';
import { handleGroupList, arr_diff, getGroupChildren, handleParentGroupSelection } from '../../../../util/handleGroups';
import { connect } from 'react-redux';
import moment from 'moment';

// Importing components
// import AdvancedBLE from './BleForm';
import AdvancedLTE from './LteForm';
import TemperatureForm from './TemperatureForm';
import variables from '../../../../variables.json';

const PREFIX = 'MainForm';

const classes = {
  root: `${PREFIX}-root`,
  checked: `${PREFIX}-checked`,
  paper: `${PREFIX}-paper`,
  doneButton: `${PREFIX}-doneButton`,
  applyButton: `${PREFIX}-applyButton`,
  header: `${PREFIX}-header`,
  headerRow: `${PREFIX}-headerRow`,
  row: `${PREFIX}-row`,
  content: `${PREFIX}-content`,
  actions: `${PREFIX}-actions`,
  cell: `${PREFIX}-cell`,
  textField: `${PREFIX}-textField`,
  formControl: `${PREFIX}-formControl`,
  selectItem: `${PREFIX}-selectItem`
};

const StyledCard = styled(Card)(({ theme, ...props }) => ({
  [`&.${classes.paper}`]: {
    overflowY: 'auto',
    overflowX: 'hidden',
    width: '100%'
  },

  [`& .${classes.doneButton}`]: {
    color: variables.LIGHT_GRAY_COLOR,
    background: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR
  },

  [`& .${classes.applyButton}`]: {
    color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
    background: variables.WHITE_COLOR,
    margin: '0 10px'
  },

  [`& .${classes.header}`]: {
    fontSize: '1.09375rem',
    fontWeight: '600',
    color: 'rgb(87, 101, 116)',
    height: '26px'
  },

  [`& .${classes.headerRow}`]: {
    borderBottom: '1px solid #E4E5E6',
    alignItems: 'center',
    padding: '0px 30px 20px 30px',
    overflow: 'hidden',
    margin: '18px 8px 0 8px'
  },

  [`& .${classes.row}`]: {
    // borderColor: variables.LIGHT_GRAY_COLOR,
    fontSize: '1rem',
    padding: '8px 30px 8px 30px',
    overflow: 'hidden',
    margin: 0,
    [theme.breakpoints.down('md')]: {
      padding: '5px 20px'
    }
  },

  [`& .${classes.content}`]: {
    padding: 0,
    textAlign: 'center'
  },

  [`& .${classes.actions}`]: {
    flexDirection: 'column'
  },

  [`& .${classes.cell}`]: {
    alignItems: 'baseline',
    [theme.breakpoints.down('md')]: {
      paddingRight: '15px'
    }
  },

  [`& .${classes.textField}`]: {
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

  [`& .${classes.selectItem}`]: {
    '&.Mui-selected': {
      backgroundColor: props.wrldMapOnly ? variables.DISABLED_GEOTAB_COLOR : variables.DISABLED_ORANGE_COLOR
    }
  }
}));

const tempConstSettings = [
  { tempLow: 20, tempHigh: 25 },
  { tempLow: 2, tempHigh: 8 },
  { tempLow: -25, tempHigh: -10 }
];
const tempSettings = [
  { range: 1, caliLow: 0, caliHigh: 0 },
  { range: 2, caliLow: 0, caliHigh: 0 },
  { range: 3, caliLow: 0, caliHigh: 0 }
];

const MainForm = (props) => {
  const OrangeCheckbox = (props) => <Checkbox color="default" {...props} />;

  // configuration that we are editing
  const [config, setConfig] = useState('');
  // configuration profile that we are editing
  const [editedConfig, setEditedConfig] = useState({});
  // configuration sensors
  const [sensors, setSensors] = useState('');
  // current configuration ID
  const [configId, setConfigId] = useState('');
  // groups
  const [groups, setGroups] = useState('');
  //
  const [applyToMany, setApplyToMany] = useState(false);
  // selected groups from multiselect
  const [selectedGroups, setSelectedGroups] = useState(['GroupCompanyId']);

  const [resetAnchor, setResetAnchor] = useState(null);
  //
  const [editedCalibration, setEditedCalibration] = useState('');

  const [motionFrequencyMessage, setMotionFrequencyMessage] = useState('');
  const [idleFrequencyMessage, setIdleFrequencyMessage] = useState('');

  useEffect(() => {
    // set configuration object
    (props.deviceConfig || (props.provisionType === 'Locator' && props.bleLocatorConfig)) &&
      (props.provisionType === 'Tag' || props.type !== 'ble'
        ? setConfig(props.deviceConfig)
        : setConfig(props.bleLocatorConfig));

    if (config && config.protocol === props.device.protocol) {
      // set initialdeviceProtocol configuration profile to edit
      setEditedConfig(config.profile);
      const secondConfig = config.protocol === 'BLE' ? props.deviceConfig : props.bleLocatorConfig;
      // set initial configuration ID
      setConfigId(
        !config.isDefault
          ? config.configurationId
          : secondConfig && !secondConfig.isDefault
          ? secondConfig.configurationId
          : config.configurationId
      );

      // set initial sensors
      let defaultSensorsObject =
        config.profile &&
        config.profile.sensors &&
        config.profile.sensors.reduce((acc, cur) => {
          let { sensorId } = cur;
          return { ...acc, [sensorId]: cur };
        }, {});

      setSensors(defaultSensorsObject);
    } else if (config && (config.protocol === props.device.protocol || !config.configurationId)) {
      // console.log('wrong config', config);
      // call default configuration
      resetConfig();
    }
  }, [props.deviceConfig, props.bleLocatorConfig, props.type, config]);

  useEffect(() => {
    if (props.groupObjects) {
      const { generatedTree } = groupTree(props.groupObjects, props.database, props.groups);
      let groupsList = [];
      handleGroupList(groupsList, Object.values(generatedTree), 16);
      setGroups(groupsList);
    }
  }, []);

  useEffect(() => {
    if (props.deviceCalibration) {
      let calib = props.deviceCalibration.calibration && props.deviceCalibration.calibration.temperature;
      if (!calib) {
        calib = tempSettings[0];
      }
      // console.log('received cali', calib);
      setEditedCalibration(calib);
    }
  }, [props.deviceCalibration]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setEditedConfig({
      ...editedConfig,
      [name]: +value
    });
  };

  const resetConfig = () => {
    props.getConfig({
      database: props.database,
      data: { deviceType: props.device.deviceType, protocol: props.device.protocol, forUI: true }
    });
  };

  const handleSliderChange = (value, name) => {
    if (name === 'motionFrequency') {
      setEditedConfig({
        ...editedConfig,
        // motionFrequency: 1,
        motionRate: value
      });
    } else if (name === 'accMgThreshold') {
      setEditedConfig({
        ...editedConfig,
        accMgThreshold: value
      });
    } else if (name === 'gpsTimeout') {
      setEditedConfig({
        ...editedConfig,
        gpsTimeout: value
      });
    } else {
      setEditedConfig({
        ...editedConfig,
        [name]: name === 'bleAdvFreq' ? value * 1000 : value
      });
    }
  };

  const handleSwitchChange = (event) => {
    // if turn on gps only, must be gps enabled
    if (event.target.name == 'gpsOnly' && event.target.checked) {
      setEditedConfig({
        ...editedConfig,
        [event.target.name]: event.target.checked,
        gpsEnabled: true
      });
    } else {
      setEditedConfig({
        ...editedConfig,
        [event.target.name]: event.target.checked
      });
    }
  };

  const handleConfigName = () => {
    if (applyToMany) {
      if (selectedGroups.length > 0 && !selectedGroups.includes('GroupCompanyId')) {
        return `configuration-${props.device.deviceType}-${Date.now()}`;
      } else {
        return `configuration-${props.device.deviceType}-${props.device.protocol} - ${props.device.deviceType}`;
      }
    }
    return `configuration-${props.device.deviceId}`;
  };

  const handleUpdate = async () => {
    if (props.type === 'temperature') return updateCalibration();
    // sensors
    if (sensors && Object.keys(sensors).length > 0) {
      editedConfig.sensors = Object.values(sensors);
    }
    if (editedConfig.motionRate) {
      editedConfig.motionFrequency = editedConfig.motionRate <= 1440 ? 1440 / editedConfig.motionRate : 1;
    }
    // empty string becomes 0 validation
    if (editedConfig.bleMac !== undefined) {
      editedConfig.bleMac = editedConfig.bleMac || '';
    }

    let payload = {
      database: props.database,
      data: {
        deviceId: props.device.deviceId,
        organization: props.device.organization,
        assetName: props.device.assetName,
        industry: config.industry,
        deviceType: config.deviceType || 'Tag',
        isDefault: false,
        protocol: config.protocol,
        name: handleConfigName(),
        profile: {
          ...editedConfig
        },
        groups: props.device.groups,
        deviceProtocol: props.device.protocol,
        ...(applyToMany && {
          applyTo: {
            ...(selectedGroups.length > 0 &&
              !selectedGroups.includes('GroupCompanyId') && { ...{ groups: selectedGroups } })
          }
        })
      }
    };

    // props.provisionType === 'Tag' &&
    //   config.protocol === 'BLE' &&
    //   (payload.data.profile.configurationNumber = props.deviceConfig.profile.configurationNumber + 1);

    console.log('----- payload -----', payload.data);
    let configurationId = await props.updateDeviceConfig(payload);
    // update other configuration as well
    if (props.provisionType === 'Locator') {
      updateLocatoPartConfig(configurationId, payload.data.name, payload.data.profile.sensors);
    }
  };

  const updateLocatoPartConfig = async (configurationId, name, sensors) => {
    if (!configurationId) return;

    const protocol = config.protocol === 'BLE' ? props.device.protocol : 'BLE';
    let profile = config.protocol === 'BLE' ? props.deviceConfig.profile : props.bleLocatorConfig.profile;

    if (profile.bleMac !== undefined) {
      profile.bleMac = profile.bleMac || '';
    }
    // sensors in BLE && LTE configurations must be the same
    profile.sensors =
      (config.protocol === 'BLE' && props.device.protocol === 'LTE') || config.protocol === 'LTE'
        ? sensors
        : profile.sensors;

    // create or update by device configurationID that was created
    let payload = {
      database: props.database,
      data: {
        deviceId: props.device.deviceId,
        organization: props.device.organization,
        assetName: props.device.assetName,
        configurationId: configurationId,
        industry: config.industry,
        deviceType: config.deviceType,
        isDefault: false,
        protocol: protocol,
        name: `configuration-${props.device.deviceType}-${Date.now()}`,
        profile: {
          ...profile
        },
        groups: props.device.groups,
        deviceProtocol: props.device.protocol
      }
    };
    console.log('----- config payload -----', payload.data);
    await props.updateDeviceConfig(payload);
  };

  const handleMultiSelect = (e) => {
    let res = e.target.value;
    // new selected group
    let selected = arr_diff(selectedGroups, res)[0];
    // if new selected group is not GroupCompanyId then remove GroupCompanyId from selected groups
    // else if GroupCompanyId was not selected and user selects GroupCompanyId
    // then only GroupCompanyId (all) should be selected
    if (selected !== 'GroupCompanyId' && res.length > selectedGroups.length) {
      //new group selected
      const index = res.indexOf('GroupCompanyId');
      if (index > -1) {
        res.splice(index, 1);
      }
      // select children groups of selected group
      res.map((groupId) => {
        let currentGroup = groups.find((group) => group.groupId === groupId);
        currentGroup && getGroupChildren(currentGroup, res);
      });
      // select parent group of current group if
      // all children of this group are selcted
      res = handleParentGroupSelection(selected, true, res, groups);
    } else if (selected === 'GroupCompanyId' && res.length > selectedGroups.length) {
      // GroupCompanyId selected
      res = ['GroupCompanyId'];
    } else if (selected !== 'GroupCompanyId' && res.length < selectedGroups.length) {
      // group removed
      let removed = [selected];
      let removedGroup = groups.find((group) => group.groupId === selected);
      // unselect children groups of current group
      removedGroup && getGroupChildren(removedGroup, removed);
      res = arr_diff(selectedGroups, removed);

      // unselect parent group of current group
      res = handleParentGroupSelection(selected, false, res, groups);
    }
    if (res.length === 0) return;
    setSelectedGroups(res);
  };

  const updateCalibration = () => {
    if (applyToMany) {
      const filteredByGroups = filterByGroup(props.allDevices, selectedGroups);

      const deviceList = filteredByGroups.filter((device) => {
        return device.deviceType === 'Tag' && device.protocol === 'BLE' && !device.isAnchor && !device.archived;
      });
      console.log(deviceList);
      const idArrayToUpdate = [];
      const payload = {
        database: props.database,
        data: {
          devicesToUpdate: [],
          newCalibration: {}
        }
      };

      // get id's of devices to update
      deviceList.map((device) => {
        idArrayToUpdate.push({ deviceId: device.deviceId, deviceType: device.deviceType });
      });
      payload.data.devicesToUpdate = idArrayToUpdate;
      const { _id, createdAt, ...deviceCalibration } = props.deviceCalibration;
      payload.data.newCalibration = { ...deviceCalibration.calibration, temperature: editedCalibration };
      console.log(payload);
      props.updateMultipleDeviceCalibration(payload);
    } else {
      const { _id, createdAt, ...deviceCalibration } = props.deviceCalibration;
      const payload = {
        database: props.database,
        device: {
          ...deviceCalibration,
          calibration: { ...deviceCalibration.calibration, temperature: editedCalibration }
        }
      };
      console.log(payload.device);
      props.updateDeviceCalibration(payload);
    }
  };

  const isApplied = () => {
    let status = props.lastStatus;
    let configuration = status && status.eventData.configurationId;
    return status && status.eventData && configuration === config.configurationId;
  };

  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 250
      }
    },
    variant: 'menu',
    getContentAnchorEl: null,
    disableScrollLock: true
  };

  const handleCalibrationChange = (e) => {
    const tempCali = { ...editedCalibration };
    tempCali[e.target.name] = +e.target.value;
    const m =
      (tempCali.caliHigh - tempCali.caliLow) /
      (tempConstSettings[tempCali.range - 1].tempHigh - tempConstSettings[tempCali.range - 1].tempLow);
    const b = tempCali.caliLow - m * tempConstSettings[tempCali.range - 1].tempLow;

    console.log('calibr m: %s, b: %s, fullObj: ', m, b, tempCali);
    setEditedCalibration({ ...tempCali, m: +m, b: +b });
  };

  const applyDefaultClick = () => {
    if (props.type === 'temperature') {
      const calib = tempSettings[0];
      // console.log('received cali', calib);
      setEditedCalibration(calib);
    } else {
      resetConfig();
    }
    setResetAnchor(null);
  };

  return (
    <StyledCard className={classes.paper} variant="outlined">
      <CardContent className={classes.content}>
        {!props.device || !config ? (
          <CircularProgress style={{ margin: '1.5rem auto', color: variables.ORANGE_COLOR }} />
        ) : (
          <div>
            <Grid container>
              <Grid container justifyContent="center" className={classes.headerRow}>
                <Grid container item sm={6} xs={6} justifyContent="center" className={classes.header}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {/* <IconButton
                      aria-controls="reset-menu"
                      aria-haspopup="true"
                      onClick={(e) => setResetAnchor(e.currentTarget)}
                      aria-label="More"
                      title="More"
                    >
                      <SettingsIcon />
                    </IconButton>
                    <Menu
                      anchorEl={resetAnchor}
                      keepMounted
                      elevation={1}
                      open={Boolean(resetAnchor)}
                      onClose={() => setResetAnchor(null)}
                      getContentAnchorEl={null}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center'
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'center'
                      }}
                    >
                      <MenuItem onClick={applyDefaultClick} key={'set_default'}>
                        Apply default settings
                      </MenuItem>
                    </Menu> */}
                    {`${props.type !== 'temperature' ? props.type.toUpperCase() : 'Temperature'} Settings`}
                  </div>
                </Grid>
                <Grid container item sm={6} xs={6} justifyContent="center" className={classes.header}>
                  {isApplied() && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleOutlineOutlinedIcon style={{ color: variables.GREEN_COLOR }} />
                      {props.lastStatus && props.lastStatus.configuration && props.screenWidth > 1000 && (
                        <>
                          <div style={{ margin: '5px' }}>Applied at </div>

                          <div>{moment(props.lastStatus.configuration.appliedAt).format('lll')}</div>
                        </>
                      )}
                      {props.lastStatus && !props.lastStatus.configuration && props.screenWidth > 1000 && (
                        <>
                          <div style={{ margin: '5px' }}>Applied </div>
                        </>
                      )}
                    </div>
                  )}
                </Grid>
              </Grid>
              <Grid container item xs={12} sm={12} justifyContent="center">
                {/* check if device is 5g */}
                {props.type === 'lte' && (
                  <AdvancedLTE
                    editedConfig={editedConfig && editedConfig}
                    handleInputChange={handleInputChange}
                    handleSliderChange={handleSliderChange}
                    handleSwitchChange={handleSwitchChange}
                    motionFrequencyMessage={motionFrequencyMessage}
                    idleFrequencyMessage={idleFrequencyMessage}
                    setMotionFrequencyMessage={setMotionFrequencyMessage}
                    setIdleFrequencyMessage={setIdleFrequencyMessage}
                    setEditedConfig={setEditedConfig}
                    adminAccess={props.adminAccess}
                  />
                )}
                {props.type !== 'lte' && editedCalibration && (
                  <TemperatureForm
                    editedCalibration={editedCalibration && editedCalibration}
                    handleCalibrationChange={handleCalibrationChange}
                    adminAccess={props.adminAccess}
                  />
                )}
              </Grid>
            </Grid>
          </div>
        )}
      </CardContent>
      {!props.device ||
      !props.adminAccess ||
      !config ||
      (props.device && config && props.device.protocol !== config.protocol) ? (
        <div></div>
      ) : (
        <CardActions className={classes.actions}>
          <Grid container className={classes.row}>
            <Grid container item sm={12} justifyContent="center" alignItems="center">
              <FormControlLabel
                checked={applyToMany}
                name="applyToMany"
                control={
                  <OrangeCheckbox
                    color="primary"
                    classes={{
                      root: classes.root,
                      checked: classes.checked
                    }}
                  />
                }
                label={
                  <span style={{ color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR }}>
                    Apply to
                  </span>
                }
                style={{
                  marginBottom: 0
                }}
                onChange={(e) => setApplyToMany(e.target.checked)}
              />
              <Select
                multiple
                name="selectedGroups"
                value={selectedGroups}
                onChange={handleMultiSelect}
                input={<Input />}
                MenuProps={MenuProps}
              >
                {groups &&
                  groups.map((group) => (
                    <MenuItem
                      key={group.groupId}
                      value={group.groupId}
                      style={{ paddingLeft: group.paddingLeft }}
                      className={classes.selectItem}
                    >
                      {group.groupId === 'GroupCompanyId'
                        ? `All ${props.device.protocol}  ${props.device.deviceType}s`
                        : group.name}
                    </MenuItem>
                  ))}
              </Select>
            </Grid>
          </Grid>
          {/* SUBMIT BUTTON */}
          <Grid container className={classes.row}>
            <Grid container item sm={12} justifyContent="center" style={{ alignItems: 'baseline' }}>
              <Button onClick={handleUpdate} className={classes.doneButton}>
                {'Save'}
              </Button>
              <Button onClick={applyDefaultClick} variant="outlined" className={classes.applyButton}>
                {'Apply default'}
              </Button>
            </Grid>
          </Grid>
        </CardActions>
      )}
    </StyledCard>
  );
};

const mapStateToProps = ({ user, provision, location, dashboard, map }) => ({
  loginType: user.loginType,
  provisionType: provision.provisionType,
  database: user.database,
  isConfigLoading: provision.isConfigLoading,
  device: provision.selectedRow,
  deviceConfig: provision.deviceConfig,
  bleLocatorConfig: provision.bleLocatorConfig,
  groupObjects: user.groupObjects,
  groups: user.groups,
  screenWidth: location.screenWidth,
  lastStatus: provision.lastDeviceStatus && provision.lastDeviceStatus[0],
  deviceCalibration: provision.deviceCalibration,
  allDevices: dashboard.allFacilityDevices,
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount'
});

const mapDispatch = ({
  location: { renderComponentAction },
  provision: {
    updateDeviceConfigAction,
    setSelectedDeviceListAction,
    updateDeviceCalibrationAction,
    updateMultipleDeviceCalibrationAction,
    getConfigAction
  }
}) => ({
  renderComponent: renderComponentAction,
  updateDeviceConfig: updateDeviceConfigAction,
  setSelectedDeviceList: setSelectedDeviceListAction,
  updateDeviceCalibration: updateDeviceCalibrationAction,
  updateMultipleDeviceCalibration: updateMultipleDeviceCalibrationAction,
  getConfig: getConfigAction
});

export default connect(mapStateToProps, mapDispatch)(MainForm);
