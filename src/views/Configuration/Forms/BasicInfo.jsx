import React, { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { useDispatch } from 'react-redux';
import {
  Button,
  Grid,
  TextField,
  Menu,
  MenuItem,
  CircularProgress,
  Select,
  Input,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardActions,
  FormControlLabel,
  IconButton,
  Tooltip,
  Box,
  Typography
} from '@mui/material';

// Library Imports
import LoopIcon from '@mui/icons-material/Loop';
import { isNaN } from 'lodash';
import { connect } from 'react-redux';
import moment from 'moment';

// Imports from utility files
import { groupTree } from '../../../util/groupTree.js';
import { handleGroupList, arr_diff, getGroupChildren, handleParentGroupSelection } from '../../../util/handleGroups.js';
import { hasAccess } from '../../../util/hasAccess.js';
import { isValidLocation, isValidLat, isValidLng } from '../../../util/validation.js';
import { transformDevice } from '../../../util/transformer.js';

// Custom Components
import CustomSwitch from '../../Common/CustomSwitch.jsx';
import variables from '../../../variables.json';

const PREFIX = 'BasicInfo';

const classes = {
  switchBase: `${PREFIX}-switchBase`,
  checked: `${PREFIX}-checked`,
  track: `${PREFIX}-track`,
  paper: `${PREFIX}-paper`,
  doneButton: `${PREFIX}-doneButton`,
  header: `${PREFIX}-header`,
  headerRow: `${PREFIX}-headerRow`,
  content: `${PREFIX}-content`,
  actions: `${PREFIX}-actions`,
  row: `${PREFIX}-row`,
  cell: `${PREFIX}-cell`,
  textField: `${PREFIX}-textField`,
  formControl: `${PREFIX}-formControl`,
  label: `${PREFIX}-label`,
  inputLabel: `${PREFIX}-inputLabel`,
  select: `${PREFIX}-select`,
  selectItem: `${PREFIX}-selectItem`,
  switch: `${PREFIX}-switch`,
  batteryBox: `${PREFIX}-batteryBox`
};

const StyledCard = styled(Card)(({ theme, ...props }) => ({
  [`&.${classes.paper}`]: {
    overflow: 'auto',
    width: '100%',
    padding: '8px'
  },

  [`& .${classes.doneButton}`]: {
    color: variables.LIGHT_GRAY_COLOR,
    background: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
    '&:hover': {
      textDecoration: 'none',
      backgroundColor: 'rgba(0, 0, 0, 0.04)'
    }
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
    padding: '0px 30px',
    overflow: 'hidden',
    margin: 0,
    // [theme.breakpoints.down('md')]: {
    padding: '5px 20px'
    // }
  },

  [`& .${classes.cell}`]: {
    alignItems: 'baseline',
    [theme.breakpoints.down('md')]: {
      paddingRight: '15px'
    },
    padding: 15
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

  [`& .${classes.label}`]: {
    // color: 'rgba(0, 0, 0, 0.54)',
    // fontSize: '12px',
    color: variables.DARK_GRAY_COLOR,
    '& label.Mui-focused': {
      color: variables.DARK_GRAY_COLOR
    }
  },

  [`& .${classes.inputLabel}`]: {
    '&.Mui-focused': {
      color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR
    },
    color: 'rgba(0, 0, 0, 0.38)'
  },

  [`& .${classes.select}`]: {
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: variables.DARK_GRAY_COLOR
    },
    '&.MuiInputBase-root.Mui-disabled': {
      color: 'black'
    }
  },

  [`& .${classes.selectItem}`]: {
    '&.Mui-selected': {
      backgroundColor: 'rgb(248, 147, 28, 0.5)'
    }
  },

  [`& .${classes.switch}`]: {
    marginLeft: 0,
    '& .MuiFormControlLabel-label': {
      color: 'rgba(0, 0, 0, 0.38)'
    },
    color: '#E4E5E6'
  },

  [`& .${classes.batteryBox}`]: {
    display: 'flex',
    alignItems: 'center'
  }
}));

const BasicInfo = (props) => {
  const [editedDevice, setEditedDevice] = useState('');
  const [groupsTree, setGroupsTree] = useState('');
  const [hasLocation, setHasLocation] = useState(false);
  const [sim, setSim] = useState('');
  const [odometer, setOdometer] = useState(null);
  const dispatch = useDispatch();

  // const OrangeSwitch = Switch;

  useEffect(() => {
    // props.getDeviceState({ deviceId: props.device.deviceId });
    if (props.device.lat && props.device.lng) setHasLocation(true);
  }, []);

  useEffect(() => {
    if (props.lastStatus && props.lastStatus.eventData && props.lastStatus.eventData['LTE Debug Data']) {
      setSim(props.lastStatus.eventData['LTE Debug Data'].SIM);
      console.log(props.lastStatus.eventData['LTE Debug Data'].SIM);
    }
  }, [JSON.stringify(props.lastStatus)]);

  // useEffect(() => {
  //   if (props.allDevices) {
  //     let dev = props.allDevices.find((x) => x.deviceId === props.device.deviceId);
  //     dev && dev.location && dev.location.lat && dev.location.lng && setHasLocation(true);
  //   }
  // }, [props.allDevices]);

  useEffect(() => {
    if (props.lastStatus) {
      const simNum =
        props.lastStatus.eventData &&
        props.lastStatus.eventData['LTE Debug Data'] &&
        props.lastStatus.eventData['LTE Debug Data'].SIM;
      setSim(simNum ? simNum : '');
    }
  }, [props.lastStatus]);

  useEffect(() => {
    if (props.state) {
      let dev = props.state;
      if (props.state.location) {
        dev.lat = props.state.location.lat;
        dev.lng = props.state.location.lng;
        dev.alt = props.state.location.alt;
        (props.provisionType === 'Locator' || dev.isAnchor) && setHasLocation(true);
      }
      // console.log('device', dev);
      setEditedDevice(dev);
    }
  }, [props.state]);

  useEffect(() => {
    // create a tree
    if (props.groupObjects) {
      const { generatedTree } = groupTree(props.groupObjects, props.database, props.groups);
      let groupsList = [];
      handleGroupList(groupsList, Object.values(generatedTree), 18);
      setGroupsTree(groupsList);
    }
  }, [props.groupObjects]);

  const getGroupNamesByIds = (groupIds, groupsTree) => {
    return groupIds.map((groupId) => {
      const group = groupsTree.find((group) => group.groupId === groupId);
      return group ? group.name : ['Unknown Group'];
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setEditedDevice({
      ...editedDevice,
      [name]: value
    });
  };

  const handleUpdate = async () => {
    const updatedDevice = transformDevice(editedDevice, editedDevice);
    console.log('----- payload -----', updatedDevice);
    props.updateDeviceData(updatedDevice);
    if (odometer || (updatedDevice.vin && updatedDevice.vin !== props.state.vin)) {
      // call updateGeotab
      dispatch.provision.updateGeotabVinAndOdometerAction({
        deviceId: updatedDevice.deviceId,
        ...(updatedDevice.vin && { vin: updatedDevice.vin }),
        ...(odometer && { odometer: +odometer * 1000 })
      });
    }
  };

  const handleGroupSelection = (prevGroups, currentlySelected) => {
    let res = currentlySelected;
    let selected = arr_diff(prevGroups, res)[0];

    if (selected !== 'GroupCompanyId' && res.length > prevGroups.length) {
      //new group selected
      const index = res.indexOf('GroupCompanyId');
      if (index > -1) {
        res.splice(index, 1);
      }
      // select children of selected element
      res &&
        res.map((groupId) => {
          let currentGroup = groupsTree.find((group) => group.groupId === groupId);
          currentGroup && getGroupChildren(currentGroup, res);
        });
      res = handleParentGroupSelection(selected, true, res, groupsTree);
    } else if (selected === 'GroupCompanyId' && res.length > prevGroups.length) {
      // GroupCompanyId selected
      res = ['GroupCompanyId'];
    } else if (selected !== 'GroupCompanyId' && res.length < prevGroups.length) {
      // group removed
      let removed = [selected];
      let removedGroup = groupsTree.find((group) => group.groupId === selected);
      removedGroup && getGroupChildren(removedGroup, removed);
      res = arr_diff(prevGroups, removed);
      res = handleParentGroupSelection(selected, false, res, groupsTree);
    }
    return res;
  };

  const groupsListForSelect = (groups) => {
    return (
      groups &&
      groups.map((group) => {
        return (
          <MenuItem
            key={group._id || JSON.stringify(group)}
            value={group.groupId}
            style={{ paddingLeft: group.paddingLeft }}
            className={classes.selectItem}
          >
            {group.groupId === 'GroupCompanyId' ? 'Admin' : group.name}
          </MenuItem>
        );
      })
    );
  };

  const handleSetAnchor = () => {
    // set selected device with updated isAnchor/fixAsset
    const selectedDevice = {
      ...editedDevice,
      renderComponent: 'configuration'
    };
    props.setSelectedRow(selectedDevice);
    //open draggable map for positioning
    props.renderComponent('draggable');
  };

  const handleSwitchChange = (event) => {
    const secondField = event.target.name === 'isAnchor' ? 'fixAsset' : 'isAnchor';
    const enabled = event.target.checked === true;

    setEditedDevice({
      ...editedDevice,
      [event.target.name]: enabled,
      [secondField]: enabled ? !enabled : false
    });
    console.log(event.target.name, secondField, {
      ...editedDevice,
      [event.target.name]: enabled,
      [secondField]: enabled ? !enabled : false
    });
    // fetch state location
    if (!props.device.fixAsset && !props.device.isAnchor && enabled) {
      (!props.state || props.state.deviceId !== props.device.deviceId) &&
        props.getDeviceState({ deviceId: props.device.deviceId });
    }
  };

  const handleLifecycleChange = (event) => {
    setEditedDevice({
      ...editedDevice,
      lifecycle: event.target.value
    });
  };

  const handleSwitchChangeATP = (event) => {
    setEditedDevice({
      ...editedDevice,
      atp: !editedDevice.atp
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
    getContentAnchorEl: null
  };

  const adminAccess = hasAccess(
    props.userPermissions,
    variables.ADVANCETOOL,
    props.role,
    props.adminDatabase || props.database,
    props.group
  );

  return (
    <StyledCard className={classes.paper} variant="outlined">
      <CardContent className={classes.content}>
        {!editedDevice ? (
          <CircularProgress style={{ margin: 'auto' }} />
        ) : (
          <div>
            <Grid container>
              <Grid container justifyContent="center" className={classes.headerRow}>
                <Grid container item sm={6} xs={6} justifyContent="center" className={classes.header}>
                  <Tooltip title={'Refresh'}>
                    <IconButton aria-controls="reset-menu" aria-haspopup="true" onClick={props.refresh} size="large">
                      <LoopIcon />
                    </IconButton>
                  </Tooltip>
                  Device Info
                </Grid>
                <Grid container item sm={6} xs={6} justifyContent="center" className={classes.header}></Grid>
              </Grid>
              <Grid container>
                <Grid container className={classes.row}>
                  <Grid container item sm={4} xs={12} justifyContent="center" className={classes.cell}>
                    <Grid container sm={12} xs={12}>
                      <TextField
                        className={classes.textField}
                        label="Name"
                        type="text"
                        name="assetName"
                        value={props.device.assetName}
                        disabled={true}
                        onChange={handleInputChange}
                        // error={
                        //   editedConfig.wifiSSID1 !== undefined &&
                        //   (editedConfig.wifiSSID1.trim() === '' || editedConfig.wifiSSID1.length > 19)
                        // }
                        // helperText={
                        //   editedConfig.wifiSSID1 !== undefined && editedConfig.wifiSSID1.trim() === ''
                        //     ? 'field required'
                        //     : editedConfig.wifiSSID1 !== undefined && editedConfig.wifiSSID1.length > 19
                        //     ? "SSID length can't be greater than 19"
                        //     : ''
                        // }
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

                  <Grid container item sm={4} xs={12} justifyContent="center" className={classes.cell}>
                    <Grid container sm={12} xs={12}>
                      <TextField
                        className={classes.textField}
                        label="MAC"
                        type="text"
                        name="deviceId"
                        value={props.device.deviceId}
                        disabled={true}
                      />
                    </Grid>
                  </Grid>

                  <Grid container item sm={4} xs={12} justifyContent="center" className={classes.cell}>
                    <Grid container sm={12} xs={12}>
                      <TextField
                        className={classes.textField}
                        label="Type"
                        type="text"
                        name="deviceType"
                        value={`${props.device.protocol} ${props.device.deviceType}`}
                        disabled={true}
                      />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid container className={classes.row}>
                  <Grid container item sm={sim ? 3 : 4} xs={12} justifyContent="center" className={classes.cell}>
                    <Grid container item sm={12} xs={12}>
                      {/* <FormControl style={{ maxWidth: '100%', minWidth: '100%' }}>
                        <InputLabel className={classes.inputLabel}>Groups</InputLabel> */}
                      <TextField
                        className={classes.textField}
                        label="Groups"
                        type="text"
                        multiple
                        disabled={true}
                        value={
                          editedDevice.groups && editedDevice.groups.length > 0
                            ? getGroupNamesByIds(editedDevice.groups, groupsTree).join(', ')
                            : 'No groups assigned'
                        }
                        MenuProps={MenuProps}
                        iconComponent={() => <div></div>}
                        onChange={(e) => {
                          let prevGroups = editedDevice.groups;
                          let currentlySelected = e.target.value;
                          let res = handleGroupSelection(prevGroups, currentlySelected);
                          // groups can't be empty
                          if (res.length === 0) return;
                          setEditedDevice({ ...editedDevice, groups: res });
                        }}
                        input={<Input style={{ overflow: 'hidden' }} />}
                      >
                        {groupsListForSelect(groupsTree)}
                      </TextField>
                      {/* </FormControl> */}
                    </Grid>
                  </Grid>

                  <Grid container item sm={sim ? 3 : 4} xs={12} justifyContent="center" className={classes.cell}>
                    <Grid container item sm={12} xs={12}>
                      <TextField
                        className={classes.textField}
                        label="Status"
                        type="text"
                        name="status"
                        value={props.device.status}
                        disabled={true}
                      />
                    </Grid>
                  </Grid>

                  <Grid container item sm={sim ? 3 : 4} xs={12} justifyContent="center" className={classes.cell}>
                    <Grid container item sm={12} xs={12}>
                      <TextField
                        className={classes.textField}
                        label="Active since"
                        type="text"
                        name="activeSince"
                        value={moment(props.state.createdAt).format('DD/MM/YY')}
                        disabled={true}
                      />
                    </Grid>
                  </Grid>
                  {sim && (
                    <Grid container item sm={3} xs={12} justifyContent="center" className={classes.cell}>
                      <Grid container item sm={12} xs={12}>
                        <TextField
                          className={classes.textField}
                          label="SIM"
                          type="text"
                          name="sim"
                          value={sim}
                          disabled={true}
                        />
                      </Grid>
                    </Grid>
                  )}
                </Grid>

                {props.state?.serialNo && (
                  <Grid container className={classes.row} justify="center">
                    <Grid container item sm={6} xs={12} justify="center" className={classes.cell}>
                      <Grid container item sm={12} xs={12} justify="center">
                        <TextField
                          className={classes.textField}
                          label="VIN"
                          type="text"
                          name="vin"
                          value={editedDevice.vin !== undefined && editedDevice.vin !== null ? editedDevice.vin : ''}
                          onChange={handleInputChange}
                          error={editedDevice && editedDevice.lat !== undefined ? !isValidLat(editedDevice.lat) : false}
                        />
                      </Grid>
                    </Grid>
                    <Grid container item sm={6} xs={12} justify="center" className={classes.cell}>
                      <Grid container item sm={12} xs={12} justify="center">
                        <TextField
                          className={classes.textField}
                          label="Odometer(km)"
                          type="number"
                          name="odometer"
                          value={odometer || ''}
                          onChange={(evt) => setOdometer(evt.target.value)}
                          error={editedDevice && editedDevice.lat !== undefined ? !isValidLat(editedDevice.lat) : false}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                )}
                {props.battery !== undefined && ['BLE', 'LTE'].includes(props.device.protocol) && (
                  <Grid
                    container
                    item
                    sm={12}
                    xs={12}
                    className={classes.cell}
                    style={{
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      flexDirection: 'column',
                      margin: '5px 0 30px 0'
                    }}
                  >
                    <Box className={classes.batteryBox}>
                      <Box
                        position="relative"
                        display="inline-flex"
                        style={{ color: 'rgba(0, 0, 0, 0.54)', marginRight: '10px' }}
                      >
                        Current battery level
                      </Box>
                      <Box position="relative" display="inline-flex">
                        <CircularProgress
                          variant="determinate"
                          value={props.battery ? (props.battery > 100 ? 100 : props.battery) : 0}
                          sx={{
                            color:
                              props.battery > 20
                                ? variables.GREEN_COLOR
                                : props.battery > 10
                                ? '#f1c631'
                                : variables.RED_COLOR
                          }}
                        />
                        <Box
                          position="absolute"
                          top="50%"
                          left="50%"
                          sx={{
                            transform: 'translate(-50%, -50%)', // Ensures perfect centering
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Typography variant="caption" component="div" color="textSecondary" lineHeight={0}>
                            {`${Math.round(props.battery ? (props.battery > 100 ? 100 : props.battery) : 0)}%`}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    {/* <Box position="relative" display="inline-flex" style={{ textAlign: 'center', fontSize: '13px' }}>
              {usageLifeInMonths()}
            </Box> */}
                  </Grid>
                )}
                {adminAccess && ['WIFI', 'LTE'].includes(props.device.protocol) && (
                  <Grid container className={classes.row} justifyContent="center">
                    <Grid container item sm={4} xs={12} className={classes.cell}>
                      <FormControl fullWidth>
                        <InputLabel className={classes.label}>Lifecycle</InputLabel>
                        <Select
                          className={classes.select}
                          value={editedDevice?.lifecycle || 'production'}
                          MenuProps={{
                            disableScrollLock: true
                          }}
                          label="Lifecycle"
                          onChange={handleLifecycleChange}
                        >
                          {['production', 'staging', 'dev'].map((val) => (
                            <MenuItem key={val} value={val}>
                              {val}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                )}

                <Grid container className={classes.row}>
                  {props.provisionType === 'Tag' && (
                    <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
                      {props.device.protocol === 'BLE' && !editedDevice.atp && (
                        <Grid container item sm={6} xs={12} justifyContent="center">
                          <FormControl style={{ maxWidth: '100%' }}>
                            <FormControlLabel
                              control={
                                <CustomSwitch
                                  checked={Boolean(editedDevice.isAnchor)}
                                  onChange={handleSwitchChange}
                                  name="isAnchor"
                                  classes={{
                                    switchBase: classes.switch,
                                    checked: classes.checked,
                                    track: classes.track
                                  }}
                                />
                              }
                              className={classes.switch}
                              label="is Anchor"
                              labelPlacement="top"
                            />
                          </FormControl>
                        </Grid>
                      )}
                      {!editedDevice.atp && (
                        <Grid
                          container
                          item
                          sm={props.device.protocol === 'BLE' ? 6 : 12}
                          xs={12}
                          justifyContent="center"
                        >
                          <FormControl style={{ maxWidth: '100%' }}>
                            <FormControlLabel
                              control={
                                <CustomSwitch
                                  checked={Boolean(editedDevice.fixAsset)}
                                  onChange={handleSwitchChange}
                                  name="fixAsset"
                                  classes={{
                                    switchBase: classes.switch,
                                    checked: classes.checked,
                                    track: classes.track
                                  }}
                                />
                              }
                              className={classes.switch}
                              label="is Fixed Asset"
                              labelPlacement="top"
                            />
                          </FormControl>
                        </Grid>
                      )}
                      {props.adminAccess &&
                        !editedDevice.fixAsset &&
                        !editedDevice.isAnchor &&
                        editedDevice.protocol !== 'IOX' && (
                          <Grid
                            container
                            item
                            sm={props.device.protocol === 'BLE' ? 6 : 12}
                            xs={12}
                            justifyContent="center"
                          >
                            <FormControl style={{ maxWidth: '100%' }}>
                              <FormControlLabel
                                control={
                                  <CustomSwitch
                                    checked={Boolean(editedDevice.atp)}
                                    onChange={handleSwitchChangeATP}
                                    name="atp"
                                    classes={{
                                      switchBase: classes.switch,
                                      checked: classes.checked,
                                      track: classes.track
                                    }}
                                  />
                                }
                                className={classes.switch}
                                label="ATP"
                                labelPlacement="top"
                              />
                            </FormControl>
                          </Grid>
                        )}
                    </Grid>
                  )}
                </Grid>

                {(props.provisionType === 'Locator' ||
                  (props.provisionType === 'Tag' && (editedDevice.isAnchor || editedDevice.fixAsset))) && (
                  <Grid container className={classes.row} spacing={5}>
                    <Grid container item sm={4} xs={12} justifyContent="center" className={classes.cell}>
                      <Grid container item sm={12} xs={12} justifyContent="center">
                        <TextField
                          className={classes.textField}
                          label="Latitude"
                          type="text"
                          name="lat"
                          value={editedDevice.lat !== undefined ? editedDevice.lat : ''}
                          onChange={handleInputChange}
                          error={editedDevice && editedDevice.lat !== undefined ? !isValidLat(editedDevice.lat) : false}
                        />
                      </Grid>
                    </Grid>
                    <Grid container item sm={4} xs={12} justifyContent="center" className={classes.cell}>
                      <Grid container item sm={12} xs={12} justifyContent="center">
                        <TextField
                          className={classes.textField}
                          label="Longitude"
                          type="text"
                          name="lng"
                          value={editedDevice.lng !== undefined ? editedDevice.lng : ''}
                          onChange={handleInputChange}
                          error={editedDevice && editedDevice.lng !== undefined ? !isValidLng(editedDevice.lng) : false}
                        />
                      </Grid>
                    </Grid>
                    <Grid container item sm={2} xs={12} justifyContent="center" className={classes.cell}>
                      <Grid container item sm={12} xs={12} justifyContent="center">
                        <TextField
                          className={classes.textField}
                          label="Altitude"
                          type="text"
                          name="alt"
                          value={editedDevice.alt !== undefined ? editedDevice.alt : ''}
                          onChange={handleInputChange}
                          error={editedDevice && editedDevice.alt !== undefined ? isNaN(editedDevice.alt) : false}
                        />
                      </Grid>
                    </Grid>
                    <Grid container item sm={2} xs={12} justifyContent="center" className={classes.cell}>
                      <Grid container item sm={12} xs={12} justifyContent="center">
                        <Button
                          onClick={handleUpdate}
                          className={classes.doneButton}
                          disabled={
                            editedDevice
                              ? !isValidLocation({ lat: editedDevice.lat, lng: editedDevice.lng }) ||
                                isNaN(editedDevice.alt)
                              : true
                          }
                        >
                          {'Save'}
                        </Button>
                      </Grid>
                    </Grid>

                    {hasLocation && (
                      <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
                        or
                      </Grid>
                    )}
                  </Grid>
                )}
              </Grid>
            </Grid>
          </div>
        )}
      </CardContent>
      {editedDevice &&
        (editedDevice.isAnchor || editedDevice.fixAsset || props.provisionType === 'Locator') &&
        hasLocation && (
          <CardActions className={classes.actions}>
            {/* SUBMIT BUTTON */}
            <Grid container className={classes.row}>
              <Grid container item sm={12} justifyContent="center">
                <Button onClick={handleSetAnchor} className={classes.doneButton}>
                  {'Position on map'}
                </Button>
              </Grid>
            </Grid>
          </CardActions>
        )}
      {editedDevice &&
        props.device.deviceType !== 'Locator' &&
        !editedDevice.isAnchor &&
        !editedDevice.fixAsset &&
        ((!editedDevice.isAnchor && !props.device.isAnchor) || (!editedDevice.fixAsset && !props.device.fixAsset)) && (
          <CardActions className={classes.actions}>
            {/* SUBMIT BUTTON */}
            <Grid container className={classes.row}>
              <Grid container item sm={12} justifyContent="center">
                <Button onClick={handleUpdate} className={classes.doneButton}>
                  {'Save'}
                </Button>
              </Grid>
            </Grid>
          </CardActions>
        )}
    </StyledCard>
  );
};

const mapStateToProps = ({ user, provision, location, map, configuration }) => ({
  loginType: user.loginType,
  provisionType: provision.provisionType,
  database: user.database,
  device: provision.selectedRow,
  groupObjects: user.groupObjects,
  groups: user.groups,
  screenWidth: location.screenWidth,
  lastStatus: provision.lastDeviceStatus && provision.lastDeviceStatus[0],
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount',
  state: configuration.deviceState,
  battery: configuration.battery,
  userPermissions: user.userPermissions,
  role: user.role,
  adminDatabase: user.adminDatabase,
  group: user.group
});

const mapDispatch = ({
  location: { renderComponentAction },
  provision: { updateDeviceDataAction, setSelectedRowAction, getDeviceStatesAction },
  configuration: { getDeviceStateAction },
  dashboard: { getAllFacilityDevicesAction }
}) => ({
  renderComponent: renderComponentAction,
  updateDeviceData: updateDeviceDataAction,
  getAllFacilityDevices: getAllFacilityDevicesAction,
  setSelectedRow: setSelectedRowAction,
  getDeviceState: getDeviceStateAction,
  getDevices: getDeviceStatesAction
});

export default connect(mapStateToProps, mapDispatch)(BasicInfo);
