import React, { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import {
  Switch,
  Button,
  Grid,
  TextField,
  Menu,
  MenuItem,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Select,
  Input,
  FormControl,
  InputLabel,
  InputAdornment,
  IconButton,
  FormHelperText,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import { groupTree } from '../../../util/groupTree';
import { handleGroupList, arr_diff, getGroupChildren, handleParentGroupSelection } from '../../../util/handleGroups';
import { connect } from 'react-redux';
import moment from 'moment';

import variables from '../../../variables.json';

const PREFIX = 'WifiForm';

const classes = {
  root: `${PREFIX}-root`,
  checked: `${PREFIX}-checked`,
  paper: `${PREFIX}-paper`,
  doneButton: `${PREFIX}-doneButton`,
  applyButton: `${PREFIX}-applyButton`,
  header: `${PREFIX}-header`,
  headerRow: `${PREFIX}-headerRow`,
  content: `${PREFIX}-content`,
  actions: `${PREFIX}-actions`,
  row: `${PREFIX}-row`,
  cell: `${PREFIX}-cell`,
  textField: `${PREFIX}-textField`,
  label: `${PREFIX}-label`,
  slider: `${PREFIX}-slider`,
  selectItem: `${PREFIX}-selectItem`
};

const StyledCard = styled(Card)(({ theme, ...props }) => ({
  [`&.${classes.paper}`]: {
    overflow: 'scroll',
    width: '100%',
    padding: '8px'
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
    height: '36px',
    alignItems: 'center'
  },

  [`& .${classes.headerRow}`]: {
    borderBottom: '1px solid #E4E5E6',
    alignItems: 'center',
    padding: '0px 30px 10px 30px',
    overflow: 'hidden',
    marginTop: '0px'
  },

  [`& .${classes.content}`]: {
    padding: 0
  },

  [`& .${classes.actions}`]: {
    flexDirection: 'column'
  },

  [`& .${classes.row}`]: {
    // borderColor: variables.LIGHT_GRAY_COLOR,
    fontSize: '1rem',
    alignItems: 'baseline',
    padding: '8px 30px 8px 30px',
    overflow: 'hidden',
    margin: 0,
    [theme.breakpoints.down('md')]: {
      padding: '5px 20px'
    }
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

  [`& .${classes.label}`]: {
    color: 'rgba(0, 0, 0, 0.54)',
    fontSize: '12px'
  },

  [`& .${classes.slider}`]: {
    color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR
  },

  [`& .${classes.selectItem}`]: {
    '&.Mui-selected': {
      backgroundColor: 'rgb(248, 147, 28, 0.5)'
    }
  }
}));

const WifiForm = (props) => {
  const OrangeCheckbox = (props) => <Checkbox color="default" {...props} />;

  const [editedConfig, setEditedConfig] = useState({});
  // groups
  const [groups, setGroups] = useState('');
  //
  const [applyToMany, setApplyToMany] = useState(false);
  // selected groups from multiselect
  const [selectedGroups, setSelectedGroups] = useState([props.groups && props.groups[0]]);
  const [mqttError, setMqttError] = useState('');

  const [resetAnchor, setResetAnchor] = useState(null);
  //
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    props.deviceConfig && setEditedConfig(props.deviceConfig.profile);
  }, [props.deviceConfig]);

  useEffect(() => {
    if (props.groupObjects) {
      const { generatedTree } = groupTree(props.groupObjects, props.database, props.groups);
      let groupsList = [];
      handleGroupList(groupsList, Object.values(generatedTree), 16);
      setGroups(groupsList);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // const reg = new RegExp('^[0-9.:]*$');
    // if (name === 'mqttIp' && !reg.test(value)) {
    //   return;
    // }
    setEditedConfig({
      ...editedConfig,
      [name]: value
    });
    setMqttError('');
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
    // if (verifyMqttIp()) {
    //   setMqttError('invalid MQTT IP');
    //   return;
    // }
    let config = props.deviceConfig;

    let payload = {
      database: props.database,
      data: {
        deviceId: props.device.deviceId,
        assetName: props.device.assetName,
        organization: props.device.organization,
        // configurationId: initialConfigurationId,
        industry: config.industry,
        deviceType: config.deviceType,
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
    console.log('----- payload -----', payload.data);
    let configurationId = await props.updateDeviceConfig(payload);
    // update other configuration as well
    if (props.provisionType === 'Locator') {
      updateLocatoPartConfig(configurationId, payload.data.name);
    }
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

  const applyDefaultClick = () => {
    setEditedConfig({
      wifiSSID1: 'Afwifi',
      wifiPass1: 'AssetCustomer!1'
    });
    setResetAnchor(null);
  };

  const updateLocatoPartConfig = async (configurationId, name) => {
    if (!configurationId) return;
    let config = props.deviceConfig;

    let profile = props.bleLocatorConfig.profile;

    if (profile.bleMac !== undefined) {
      profile.bleMac = profile.bleMac || '';
    }

    // create or update by device configurationID that was created
    let payload = {
      database: props.database,
      data: {
        deviceId: props.device.deviceId,
        assetName: props.device.assetName,
        organization: props.device.organization,
        configurationId: configurationId,
        industry: config.industry,
        deviceType: config.deviceType,
        isDefault: false,
        protocol: 'BLE',
        name: `configuration-${props.device.deviceType}-${Date.now()}`,
        profile: {
          ...profile
        },
        groups: props.device.groups,
        deviceProtocol: props.device.protocol
      }
    };
    console.log('----- payload -----', payload.data);
    await props.updateDeviceConfig(payload);
  };

  const handleDisableSave = () => {
    // const reg = new RegExp(
    //   '^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)[.,:](25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)[.,:](25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)[.,:](25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'
    // );
    let disabled =
      (editedConfig.wifiSSID1 !== undefined &&
        (editedConfig.wifiSSID1.trim() === '' || editedConfig.wifiSSID1.length > 19)) ||
      (editedConfig.wifiPass1 !== undefined &&
        (editedConfig.wifiPass1.trim() === '' || editedConfig.wifiPass1.length > 19));
    return disabled;
  };

  const handleClickShowPassword = () => {
    setShowPass(!showPass);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const isApplied = () => {
    let status = props.lastStatus;
    let configuration = status && status.eventData.configurationId;
    return (
      status &&
      status.eventData &&
      props.deviceConfig &&
      props.deviceConfig.configurationId &&
      configuration === props.deviceConfig.configurationId
    );
  };

  const handleSwitchChange = (event) => {
    setEditedConfig({
      ...editedConfig,
      [event.target.name]: event.target.checked
    });
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

  return (
    <StyledCard className={classes.paper} variant="outlined">
      <CardContent className={classes.content}>
        {!props.device ? (
          <CircularProgress style={{ margin: 'auto' }} />
        ) : (
          <div>
            <Grid container>
              <Grid container justifyContent="center" className={classes.headerRow}>
                <Grid container item sm={6} xs={6} justifyContent="center" className={classes.header}>
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
                  WIFI Settings
                </Grid>
                <Grid container item sm={6} xs={6} justifyContent="center" className={classes.header}>
                  {isApplied() && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleOutlineOutlinedIcon style={{ color: variables.GREEN_COLOR }} />
                      {props.lastStatus && props.lastStatus.configuration && props.screenWidth > 1000 && (
                        <>
                          <div style={{ margin: '5px' }}>Applied at </div>

                          <div>{moment(props.lastStatus.configuration.appliedAt).format('YYYY-MM-DD hh:mm a')}</div>
                        </>
                      )}
                    </div>
                  )}
                </Grid>
              </Grid>
              <Grid container>
                <Grid container className={classes.row} spacing={5}>
                  <Grid container item sm={6} xs={12} justifyContent="center" className={classes.cell}>
                    <Grid container item sm={12} xs={12}>
                      <TextField
                        className={classes.textField}
                        label="Wifi SSID 1"
                        type="text"
                        name="wifiSSID1"
                        value={editedConfig.wifiSSID1 !== undefined ? editedConfig.wifiSSID1 : ''}
                        onChange={handleInputChange}
                        error={
                          editedConfig.wifiSSID1 !== undefined &&
                          (editedConfig.wifiSSID1.trim() === '' || editedConfig.wifiSSID1.length > 19)
                        }
                        helperText={
                          editedConfig.wifiSSID1 !== undefined && editedConfig.wifiSSID1.trim() === ''
                            ? 'field required'
                            : editedConfig.wifiSSID1 !== undefined && editedConfig.wifiSSID1.length > 19
                            ? "SSID length can't be greater than 19"
                            : ''
                        }
                        disabled={!props.adminAccess}
                        InputLabelProps={{
                          formlabelclasses: {
                            root: `
                              &.focused {
                                color: red;
                              }
                            `,
                            focused: 'focused',
                            shrink: true
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                  <Grid container item sm={6} xs={12} justifyContent="center" className={classes.cell}>
                    <Grid container item sm={12} xs={12}>
                      <FormControl className={classes.textField}>
                        <InputLabel htmlFor="wifiPass1">Wifi Password 1</InputLabel>
                        <Input
                          id="wifiPass1"
                          name="wifiPass1"
                          type={showPass ? 'text' : 'password'}
                          value={editedConfig.wifiPass1 !== undefined ? editedConfig.wifiPass1 : ''}
                          onChange={handleInputChange}
                          error={
                            editedConfig.wifiPass1 !== undefined &&
                            (editedConfig.wifiPass1.trim() === '' || editedConfig.wifiPass1.length > 19)
                          }
                          disabled={!props.adminAccess}
                          endAdornment={
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleClickShowPassword}
                                onMouseDown={handleMouseDownPassword}
                                size="large"
                              >
                                {showPass ? <Visibility /> : <VisibilityOff />}
                              </IconButton>
                            </InputAdornment>
                          }
                        />
                        <FormHelperText
                          error={
                            editedConfig.wifiPass1 !== undefined &&
                            (editedConfig.wifiPass1.trim() === '' || editedConfig.wifiPass1.length > 19)
                          }
                        >
                          {editedConfig.wifiPass1 !== undefined && editedConfig.wifiPass1.trim() === ''
                            ? 'field required'
                            : editedConfig.wifiPass1 !== undefined && editedConfig.wifiPass1.length > 19
                            ? "Password length can't be greater than 19"
                            : ''}
                        </FormHelperText>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </div>
        )}
      </CardContent>
      {props.adminAccess && (
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
                style={{ marginBottom: 0 }}
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
                      {group.name === '' ? `all ${props.device.protocol}  ${props.device.deviceType}s` : group.name}
                    </MenuItem>
                  ))}
              </Select>
            </Grid>
          </Grid>
          {/* SUBMIT BUTTON */}

          <Grid container className={classes.row}>
            <Grid container item sm={12} justifyContent="center">
              <Button onClick={handleUpdate} className={classes.doneButton} disabled={handleDisableSave()}>
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

const mapStateToProps = ({ user, provision, location, map }) => ({
  loginType: user.loginType,
  provisionType: provision.provisionType,
  database: user.database,
  deviceConfig: provision.deviceConfig,
  bleLocatorConfig: provision.bleLocatorConfig,
  isConfigLoading: provision.isConfigLoading,
  device: provision.selectedRow,
  groupObjects: user.groupObjects,
  groups: user.groups,
  screenWidth: location.screenWidth,
  lastStatus: provision.lastDeviceStatus && provision.lastDeviceStatus[0],
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount'
});

const mapDispatch = ({ location: { renderComponentAction }, provision: { updateDeviceConfigAction } }) => ({
  renderComponent: renderComponentAction,
  updateDeviceConfig: updateDeviceConfigAction
});

export default connect(mapStateToProps, mapDispatch)(WifiForm);
