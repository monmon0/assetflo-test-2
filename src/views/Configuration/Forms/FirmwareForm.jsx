import React, { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import {
  Button,
  Grid,
  TextField,
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
import { groupTree } from '../../../util/groupTree';
import { handleGroupList, arr_diff, getGroupChildren, handleParentGroupSelection } from '../../../util/handleGroups';
import { connect } from 'react-redux';
import moment from 'moment';
import { transformDevice } from '../../../util/transformer';

import variables from '../../../variables.json';
import { getVersionWithoutReleaseType } from '../../../util/versionUtils';

const PREFIX = 'FirmwareForm';

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
  versionItem: `${PREFIX}-versionItem`,
  versionDates: `${PREFIX}-versionDates`,
  versionNotes: `${PREFIX}-versionNotes`,
  selectItem: `${PREFIX}-selectItem`
};

const StyledCard = styled(Card)(({ theme, ...props }) => ({
  [`&.${classes.paper}`]: {
    overflowY: 'auto',
    overflowX: 'hidden',
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
    alignItems: 'center'
  },

  [`& .${classes.headerRow}`]: {
    borderBottom: '1px solid #E4E5E6',
    alignItems: 'baseline',
    padding: '0px 30px 10px 30px',
    overflow: 'hidden',
    marginTop: '10px'
  },

  [`& .${classes.content}`]: {
    padding: 0,
    textAlign: 'center'
  },

  [`& .${classes.actions}`]: {
    flexDirection: 'column'
  },

  [`& .${classes.row}`]: {
    // borderColor: variables.LIGHT_GRAY_COLOR,
    fontSize: '1rem',
    alignItems: 'center',
    padding: '8px 30px 8px 30px',
    overflow: 'hidden',
    [theme.breakpoints.down('md')]: {
      padding: '5px 20px'
    },
    justifyContent: 'center',
    margin: '0'
  },

  [`& .${classes.cell}`]: {
    alignItems: 'baseline',
    [theme.breakpoints.down('md')]: {
      paddingRight: '15px'
    }
  },

  [`& .${classes.textField}`]: {
    width: '100%',
    textAlign: 'center',
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

  [`& .${classes.versionItem}`]: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  },

  [`& .${classes.versionDates}`]: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '12px',
    color: 'grey'
  },

  [`& .${classes.versionNotes}`]: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '12px',
    color: 'grey',
    width: '100%',
    whiteSpace: 'pre-wrap'
  },

  [`& .${classes.selectItem}`]: {
    '&.Mui-selected': {
      backgroundColor: props.wrldMapOnly ? variables.DISABLED_GEOTAB_COLOR : variables.DISABLED_ORANGE_COLOR
    }
  }
}));

const FirmwareForm = (props) => {
  const OrangeCheckbox = (props) => <Checkbox color="default" {...props} />;

  // groups
  const [groups, setGroups] = useState('');
  // apply to many is checked
  const [applyToMany, setApplyToMany] = useState(false);
  // selected groups from multiselect
  const [selectedGroups, setSelectedGroups] = useState([props.groups && props.groups[0]]);
  // firmwareVersion
  const [mainFirmwareList, setMainFirmwareList] = useState([]);
  const [bleFirmwareList, setBleFirmwareList] = useState([]);
  const [firmware, setFirmware] = useState({
    mainVersion: 1
  });

  const [resetAnchor, setResetAnchor] = useState(null);

  useEffect(() => {
    if (props.groupObjects) {
      const { generatedTree } = groupTree(props.groupObjects, props.database, props.groups);
      let groupsList = [];
      handleGroupList(groupsList, Object.values(generatedTree), 16);
      setGroups(groupsList);
    }
    !props.firmwareList && props.getFirmwareList({ query: {} });
  }, []);

  useEffect(() => {
    assignInitialFirmware();
    if (props.firmwareList && props.firmwareList.length > 0) {
      // firmware list by device.protocol
      let mainFirmwareList =
        props.firmwareList && props.firmwareList.filter((fw) => fw.protocol === props.device.protocol && !fw.archived);
      // add firmware version from device collection
      mainFirmwareList = populateFirmwareList(props.device.firmware, mainFirmwareList, props.device.protocol);
      // add firmware version from submitted status
      props.lastStatus &&
        (mainFirmwareList = populateFirmwareList(
          props.lastStatus.eventData.firmware,
          mainFirmwareList,
          props.device.protocol
        ));

      setMainFirmwareList(mainFirmwareList);
      if (props.device.protocol !== 'BLE') {
        // BLE firmware list for locators
        let bleFirmwareList = props.firmwareList && props.firmwareList.filter((fw) => fw.protocol === 'BLE');

        // add ble firmware version from device collection
        bleFirmwareList = populateFirmwareList(props.device.firmware, bleFirmwareList, 'BLE');
        // add ble firmware version from submitted status
        props.lastStatus &&
          (bleFirmwareList = populateFirmwareList(props.lastStatus.eventData.firmware, bleFirmwareList, 'BLE'));
        setBleFirmwareList(bleFirmwareList);
      }
    }
  }, [JSON.stringify(props.firmwareList), JSON.stringify(props.lastStatus), props.device]);

  const populateFirmwareList = (firmwareList, listToDisplay, protocol) => {
    if (!firmwareList) return listToDisplay;
    // firmware index
    let deviceFwIndex = firmwareList.findIndex((fw) => fw.protocol === protocol);
    // add to the firmwarelist firmware from device collection or lastStatus
    deviceFwIndex >= 0 &&
      !listToDisplay.find(
        (fw) =>
          getVersionWithoutReleaseType(fw.version) ===
            getVersionWithoutReleaseType(firmwareList[deviceFwIndex].version) && fw.protocol === protocol
      ) &&
      listToDisplay.push(firmwareList[deviceFwIndex]);
    return listToDisplay;
  };

  const assignInitialFirmware = () => {
    let protocol = props.device.protocol;
    let deviceFirmware = props.device.firmware;
    let firmware;
    if (deviceFirmware) {
      // display firmware from device collection
      let mainFwIndex = deviceFirmware.findIndex((fw) => fw.protocol === protocol);
      firmware = {
        mainVersion: deviceFirmware[mainFwIndex].version,
        ...(props.device.protocol !== 'BLE' && {
          secondaryVersion: deviceFirmware[1 - mainFwIndex].version
        })
      };
    } else if (
      !deviceFirmware &&
      props.lastStatus &&
      props.lastStatus.eventData.firmware &&
      props.lastStatus.eventData.firmware.length > 0
    ) {
      // display firmware from device collection
      let mainFwIndex = props.lastStatus.eventData.firmware.findIndex((fw) => fw.protocol === protocol);
      firmware = {
        mainVersion: props.lastStatus.eventData.firmware[mainFwIndex].version,
        ...(props.device.protocol !== 'BLE' && {
          secondaryVersion: props.lastStatus.eventData.firmware[1 - mainFwIndex].version
        })
      };
    } else if (!deviceFirmware && props.firmwareList && props.firmwareList.length > 0) {
      // display latest from firmware.list
      let latestMain = props.firmwareList
        .filter((fw) => fw.protocol === protocol && fw.isDefault)
        .sort((a, b) => b.version - a.version)[0];

      let latestSecondary =
        props.device.protocol !== 'BLE'
          ? props.firmwareList
              .filter((fw) => fw.protocol === 'BLE' && fw.isDefault)
              .sort((a, b) => b.version - a.version)[0]
          : null;
      firmware = {
        mainVersion: (latestMain && latestMain.version) || 1,
        ...(props.device.protocol !== 'BLE' && {
          secondaryVersion: (latestSecondary && latestSecondary.version) || 1
        })
      };
    } else {
      // display default
      firmware = {
        mainVersion: 1,
        ...(props.device.protocol !== 'BLE' && { secondaryVersion: 1 })
      };
    }
    setFirmware(firmware);
  };

  const handleUpdate = async () => {
    let firmwareArray = [];

    for (let key in firmware) {
      if (key === 'mainVersion') {
        let mainFirmwareObj = props.firmwareList.find(
          (fw) => fw.protocol === props.device.protocol && fw.version === firmware.mainVersion
        );
        mainFirmwareObj
          ? firmwareArray.push({
              firmwareId: mainFirmwareObj.firmwareId,
              protocol: mainFirmwareObj.protocol,
              version: mainFirmwareObj.version,
              fileName: mainFirmwareObj.fileName,
              awsUrl: mainFirmwareObj.awsUrl
            })
          : firmwareArray.push({
              protocol: props.device.protocol,
              version: firmware.mainVersion
            });
      } else {
        let secondaryFirmwareObj = props.firmwareList.find(
          (fw) => fw.protocol === 'BLE' && fw.version === firmware.secondaryVersion
        );
        secondaryFirmwareObj
          ? firmwareArray.push({
              firmwareId: secondaryFirmwareObj.firmwareId,
              protocol: secondaryFirmwareObj.protocol,
              version: secondaryFirmwareObj.version,
              fileName: secondaryFirmwareObj.fileName,
              awsUrl: secondaryFirmwareObj.awsUrl
            })
          : firmwareArray.push({
              protocol: 'BLE',
              version: firmware.secondaryVersion
            });
      }
    }

    if (applyToMany) {
      updateBatch(firmwareArray);
    } else {
      updateSingleDevice(firmwareArray);
    }
  };

  const updateSingleDevice = async (firmwareArray) => {
    const payload = { ...props.device, firmware: firmwareArray };
    const updatedDevice = transformDevice(payload);

    console.log('----- firmware payload -----', updatedDevice);
    props.updateDeviceData(updatedDevice);
  };

  const updateBatch = async (firmwareArray) => {
    let payload = {
      filter: {
        deviceType: props.device.deviceType,
        protocol: props.device.protocol,
        organization: props.database,
        ...(selectedGroups.length > 0 &&
          !selectedGroups.includes('GroupCompanyId') && { ...{ groups: selectedGroups } })
      },
      updateValues: {
        firmware: firmwareArray
      }
    };
    console.log('----- firmware batch payload -----', payload);
    props.updateDeviceBatch(payload);
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

  const handleChange = (e) => {
    setFirmware({ ...firmware, [e.target.name]: e.target.value });
  };
  const isFirmwareApplied = (protocol, version) => {
    if (props.lastStatus) {
      let index =
        props.lastStatus &&
        props.lastStatus.eventData &&
        props.lastStatus.eventData.firmware &&
        props.lastStatus.eventData.firmware.findIndex((fw) => fw.protocol === protocol && fw.version === version);

      return Number.isInteger(index) ? index > -1 : false;
    }
    return false;
  };

  const applyDefaultClick = () => {
    let main = { version: 0 },
      secondary = { version: 0 };
    props.firmwareList.map((f) => {
      if (f.protocol === props.device.protocol && f.isDefault && f.version > main.version) {
        main = f;
      }
      if (
        props.device.deviceType === 'Locator' &&
        f.protocol === 'BLE' &&
        f.isDefault &&
        f.version > secondary.version
      ) {
        secondary = f;
      }
    });
    // const main = props.firmwareList.find((f) => f.protocol === props.device.protocol && f.isDefault);
    // const secondary = props.firmwareList.find((f) => f.protocol === 'BLE' && f.isDefault);
    // console.log('firmware versions', main, secondary);
    setFirmware({
      mainVersion: main ? main.version : 1,
      ...((props.device.deviceType === 'Locator' || props.device.protocol === 'LTE') && {
        secondaryVersion: secondary ? secondary.version : 1
      })
    });
    setResetAnchor(null);
  };

  const displayFirmwareOption = (item, showNotes = true) => {
    let currentFw =
      props.lastStatus &&
      props.lastStatus.firmware &&
      props.lastStatus.firmware.find((fw) => fw.protocol === item.protocol && fw.version === item.version);

    const releasedDate = item.releaseDate ? moment(item.releaseDate).format('YYYY-MM-DD hh:mm a') : 'beta version';

    const fwVersion = getVersionWithoutReleaseType(item.version);

    const returnItem = (
      <div className={classes.versionItem} style={{ maxWidth: 'inherit' }}>
        <div>Version {fwVersion}</div>
        {showNotes && item.notes && item.notes.length > 0 && (
          <div
            className={classes.versionNotes}
            style={{ fontSize: '0.875rem', color: 'gray', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            Notes: {item.notes}
          </div>
        )}
        <div className={classes.versionDates} style={{ fontSize: '0.875rem', color: 'gray' }}>
          {releasedDate}
          {props.lastStatus && currentFw && isFirmwareApplied(item.protocol, item.version) && (
            <div>
              Applied:{' '}
              {props.lastStatus.firmware && currentFw && moment(currentFw.appliedAt).format('YYYY-MM-DD hh:mm a')}
            </div>
          )}
        </div>
      </div>
    );

    if (showNotes) {
      return (
        <MenuItem key={item.version} value={item.version}>
          {returnItem}
        </MenuItem>
      );
    } else {
      return returnItem;
    }
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
        {!props.firmwareList ? (
          <CircularProgress
            style={{
              margin: '0 auto',
              color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR
            }}
          />
        ) : (
          <div>
            <Grid container>
              <Grid container justifyContent="center" className={classes.headerRow}>
                <Grid container item sm={6} xs={6} justifyContent="center" className={classes.header}>
                  {/* {props.device.protocol !== 'BLE' && (
                    <>
                      <IconButton
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
                      </Menu>
                    </>
                  )} */}
                  Firmware Settings
                </Grid>
                <Grid container item sm={6} xs={6} justifyContent="center" className={classes.header}></Grid>
              </Grid>
              <Grid container>
                <Grid container className={classes.row} spacing={3}>
                  <Grid container item sm={6} xs={12} justifyContent="center" className={classes.cell}>
                    <Grid container item sm={12} xs={12} justifyContent="center">
                      <TextField
                        className={classes.textField}
                        label={`Change ${props.device.protocol} version`}
                        select
                        disabled={props.device.protocol === 'BLE' || !props.adminAccess}
                        name="mainVersion"
                        onChange={handleChange}
                        value={firmware.mainVersion && firmware.mainVersion}
                        SelectProps={{
                          renderValue: (selected) => {
                            const selectedFirmware = mainFirmwareList.find((item) => item.version === selected);
                            return selectedFirmware ? displayFirmwareOption(selectedFirmware, false) : '';
                          },
                          MenuProps: {
                            PaperProps: {
                              sx: {
                                maxWidth: 'min-content'
                              }
                            }
                          }
                        }}
                      >
                        {mainFirmwareList && mainFirmwareList.length > 0
                          ? mainFirmwareList.map((item) => displayFirmwareOption(item))
                          : [
                              <MenuItem key={1} value={1}>
                                <div className={classes.versionItem}>
                                  <div>Version 1*</div>
                                  <div className={classes.versionDates}>
                                    <div>outdated</div>
                                  </div>
                                </div>
                              </MenuItem>
                            ]}
                      </TextField>
                    </Grid>
                  </Grid>
                  {(props.device.deviceType === 'Locator' || props.device.protocol === 'LTE') && (
                    <Grid container item sm={6} xs={12} justifyContent="center" className={classes.cell}>
                      <Grid container item sm={12} xs={12} justifyContent="center">
                        <TextField
                          className={classes.textField}
                          label={`Change BLE version`}
                          select
                          name="secondaryVersion"
                          onChange={handleChange}
                          value={firmware.secondaryVersion && firmware.secondaryVersion}
                          disabled={!props.adminAccess}
                          SelectProps={{
                            renderValue: (selected) => {
                              const selectedFirmware = bleFirmwareList.find((item) => item.version === selected);
                              return selectedFirmware ? displayFirmwareOption(selectedFirmware, false) : '';
                            },
                            MenuProps: {
                              PaperProps: {
                                sx: {
                                  maxWidth: 'min-content'
                                }
                              }
                            }
                          }}
                        >
                          {bleFirmwareList && bleFirmwareList.length > 0
                            ? bleFirmwareList.map((item) => displayFirmwareOption(item))
                            : [
                                <MenuItem key={1} value={1}>
                                  <div className={classes.versionItem}>
                                    <div>Version 1</div>
                                    <div className={classes.versionDates}>
                                      <div>outdated</div>
                                    </div>
                                  </div>
                                </MenuItem>
                              ]}
                        </TextField>
                      </Grid>
                    </Grid>
                  )}
                </Grid>
              </Grid>
            </Grid>
          </div>
        )}
      </CardContent>
      {props.device.protocol !== 'BLE' && props.adminAccess && (
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
                MenuProps={MenuProps}
                name="selectedGroups"
                value={selectedGroups}
                onChange={handleMultiSelect}
                input={<Input />}
              >
                {groups &&
                  groups.map((group) => (
                    <MenuItem
                      key={group.groupId}
                      value={group.groupId}
                      className={classes.selectItem}
                      style={{ paddingLeft: group.paddingLeft }}
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
            <Grid container item sm={12} justifyContent="center">
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

const mapStateToProps = ({ user, provision, map }) => ({
  provisionType: provision.provisionType,
  database: user.database,
  device: provision.selectedRow,
  groupObjects: user.groupObjects,
  groups: user.groups,
  firmwareList: provision.firmwareList,
  lastStatus: provision.lastDeviceStatus && provision.lastDeviceStatus[0],
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount'
});

const mapDispatch = ({
  location: { renderComponentAction },
  provision: {
    updateDeviceConfigAction,
    setSelectedDeviceListAction,
    getFirmwareListAction,
    updateDeviceDataAction,
    updateDeviceBatchAction
  }
}) => ({
  renderComponent: renderComponentAction,
  updateDeviceConfig: updateDeviceConfigAction,
  setSelectedDeviceList: setSelectedDeviceListAction,
  getFirmwareList: getFirmwareListAction,
  updateDeviceData: updateDeviceDataAction,
  updateDeviceBatch: updateDeviceBatchAction
});

export default connect(mapStateToProps, mapDispatch)(FirmwareForm);
