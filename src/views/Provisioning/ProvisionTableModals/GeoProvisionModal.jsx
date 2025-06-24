import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import Autocomplete from '@mui/material/Autocomplete';
import { styled } from '@mui/material/styles';
import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Select,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  FormControlLabel,
  RadioGroup,
  Input,
  Tooltip,
  CircularProgress
} from '@mui/material';
import variables from '../../../variables.json';
import CustomCheckBox from '../../Common/CustomCheckBox';
import RefreshIcon from '@mui/icons-material/Refresh';
import { groupTree } from '../../../util/groupTree';
import { handleGroupList, arr_diff, getGroupChildren, handleParentGroupSelection } from '../../../util/handleGroups';

const PREFIX = 'GeoProvisionModal';

const classes = {
  select: `${PREFIX}-select`,
  dialogReplaceWrap: `${PREFIX}-dialogReplaceWrap`,
  textField: `${PREFIX}-textField`,
  searchField: `${PREFIX}-searchField`,
  modalRow: `${PREFIX}-modalRow`,
  autoComplete: `${PREFIX}-autoComplete`,
  assignBox: `${PREFIX}-assignBox`
};

const StyledDialog = styled(Dialog)(({ theme, ...props }) => ({
  [`& .${classes.select}`]: {
    textAlign: 'center',
    '&:before': {
      borderBottomColor: variables.DARK_GRAY_COLOR
    },
    '&:after': {
      borderBottomColor: variables.DARK_GRAY_COLOR
    }
  },
  [`& .${classes.dialogReplaceWrap}`]: {
    display: 'flex',
    alignItems: 'baseline'
  },
  [`& .${classes.textField}`]: {
    marginLeft: 10,
    maxWidth: 200,
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
  [`& .${classes.searchField}`]: {
    marginLeft: 10,
    maxWidth: 430,
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
  [`& .${classes.modalRow}`]: {
    marginBottom: 10
  },
  [`& .${classes.autoComplete}`]: { width: 300 },
  [`& .${classes.assignBox}`]: { display: 'flex', alignItems: 'center' }
}));

function GeoProvisionModal(props) {
  const {
    geoProvisionType,
    productTypeList,
    provisionModal,
    setProvisionModal,
    productType,
    setProductType,
    selectedSerialNo,
    setSelectedSerialNo,
    handleSwitchType,
    setGeoProvisionType,
    archiveOldDevice,
    setArchiveOldDevice,
    handleChangeSerialNo,
    snDevices,
    handleProvisionToGeotab,
    assetTypeGroup,
    setAssetTypeGroup,
    selectedGroups,
    setSelectedGroups
  } = props;

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

  const assetTypeGroups = ['GroupVehicleId', 'GroupTrailerId', 'GroupEquipmentId', 'GroupContainerId'];

  const [name, setName] = useState(provisionModal.name);
  const [assign, setAssign] = useState(false);
  const [assignTo, setAssignTo] = useState(null);
  const [groups, setGroups] = useState('');
  const [groupNames, setGroupNames] = useState(['Company Group']);
  const [geotabDeviceAttached, setGeotabDeviceAttached] = useState(false);
  const [vin, setVin] = useState('');
  const [odometer, setOdometer] = useState('');
  const [refreshDisabled, setRefreshDisabled] = useState(false);

  useEffect(() => {
    if (!props.geotabDevices || !props.geotabDevices.length) {
      props.getGeotabDevices({ groups: [] });
    }
    if (props.groupObjects) {
      const { generatedTree } = groupTree(props.groupObjects, props.database, props.groups);
      let groupsList = [];
      handleGroupList(groupsList, Object.values(generatedTree), 16);
      setGroups(groupsList);
    }
  }, []);

  const handleRefreshDevices = () => {
    setRefreshDisabled(true);
    props.getGeotabDevices({ groups: [] }).then(() => {
      setRefreshDisabled(false);
    });
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
    const { generatedTree } = groupTree(props.groupObjects, props.database, props.groups);

    // console.log('setSelectedGroups', generatedTree, Object.values(props.groupObjects));
    const names = res.map((groupId) => {
      const group = props.groupObjects.find((group) => group.groupId === groupId);
      return group.name;
    });
    setGroupNames(names);
    setSelectedGroups(res);
  };

  const handleChange = (e, newInputValue) => {
    // setName(newInputValue.name);
    setAssignTo(newInputValue);
    setGeotabDeviceAttached(props.geotabDeviceAlreadyAttached(newInputValue));
    newInputValue && setName(newInputValue.name);
    if (newInputValue && newInputValue.groups && newInputValue.groups.length) {
      const groups = [];
      newInputValue.groups.map((group) => {
        if (['GroupVehicleId', 'GroupTrailerId'].includes(group.id)) {
          setAssetTypeGroup(group.id);
        } else {
          groups.push(group.id);
        }
      });
      if (!groups.length) groups.push('GroupCompanyId');
      // console.log('groups', groups);
      // const { generatedTree } = groupTree(props.groupObjects, props.database, props.groups);
      const names = groups.map((groupId) => {
        const group = props.groupObjects.find((group) => group.groupId === groupId);
        return group.name;
      });
      setGroupNames(names);
      setSelectedGroups(groups);
    }
  };

  return (
    <StyledDialog
      open={provisionModal.open}
      onClose={() => {
        setProvisionModal({ open: false, device: null, name: null });
        setSelectedSerialNo('');
        setProductType(null);
        setGeoProvisionType(0);
        setSelectedGroups(['GroupCompanyId']);
      }}
      PaperProps={{
        style: {
          minHeight: 280
        }
      }}
    >
      <Tabs
        value={geoProvisionType}
        onChange={handleSwitchType}
        TabIndicatorProps={{
          style: {
            backgroundColor: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR
          }
        }}
        style={{ width: 600 }}
      >
        <Tab
          label={
            <span
              style={{
                color: !geoProvisionType
                  ? props.wrldMapOnly
                    ? variables.GEOTAB_PRIMARY_COLOR
                    : variables.ORANGE_COLOR
                  : '#575757'
              }}
            >
              Provision new
            </span>
          }
        />
        {/* {provisionModal.device.protocol !== 'IOX' && ( */}
        <Tab
          label={
            <span
              style={{
                color: geoProvisionType
                  ? props.wrldMapOnly
                    ? variables.GEOTAB_PRIMARY_COLOR
                    : variables.ORANGE_COLOR
                  : '#575757'
              }}
            >
              Replace existing
            </span>
          }
        />
        {/* )} */}
      </Tabs>
      <DialogContent style={{ height: 150 }}>
        {!geoProvisionType ? (
          <div>
            <div className={classes.assignBox}>
              {/* <span>Product type </span>
              <Select
                className={classes.select}
                value={productType.name}
                onChange={(e) => {
                  const product = productTypeList[
                    `${provisionModal.device.deviceType}-${provisionModal.device.protocol}`
                  ].find((product) => product.name === e.target.value);
                  console.log('productId', product);
                  setProductType(product);
                }}
                // input={<Input />}
              >
                {productTypeList &&
                  productTypeList[`${provisionModal.device.deviceType}-${provisionModal.device.protocol}`].map(
                    (productType) => {
                      return (
                        <MenuItem key={productType.name} value={productType.name}>
                          {productType.name}
                        </MenuItem>
                      );
                    }
                  )}
              </Select> */}
              <span>Asset name </span>
              <TextField
                className={classes.textField}
                value={name}
                error={!name.trim()}
                onChange={(e) => setName(e.target.value)}
                // size="small"
                variant="standard"
              />
            </div>
            <div className={classes.assignBox}>
              <span style={{ marginRight: 10 }}>Asset type group</span>
              <Select
                className={classes.select}
                value={assetTypeGroup}
                disabled={!!assignTo}
                input={<Input />}
                onChange={(e) => {
                  setAssetTypeGroup(e.target.value);
                }}
                // input={<Input />}
              >
                {assetTypeGroups &&
                  assetTypeGroups.map((type) => {
                    return (
                      <MenuItem key={type} value={type}>
                        {type.replace(/Group|Id/g, '')}
                      </MenuItem>
                    );
                  })}
              </Select>
              <span style={{ marginLeft: 20, marginRight: 10 }}>Groups</span>
              <Tooltip placement="top-start" title={groupNames.join(', ')}>
                <Select
                  multiple
                  className={classes.textField}
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
                        {group.groupId === 'GroupCompanyId' ? 'Company Group' : group.name}
                      </MenuItem>
                    ))}
                </Select>
              </Tooltip>
            </div>
            <div className={classes.assignBox}>
              <span style={{ marginRight: 10 }}>VIN</span>
              <TextField
                className={classes.textField}
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                // size="small"
                variant="standard"
              />
              <span style={{ marginLeft: 20 }}>Odometer(km)</span>
              <TextField
                className={classes.textField}
                value={odometer}
                type="number"
                onChange={(e) => setOdometer(e.target.value)}
                variant="standard"
                // size="small"
              />
            </div>
            <div className={classes.assignBox}>
              <span>Assign to existing Geotab device </span>
              <CustomCheckBox
                checked={assign}
                onChange={(e) => {
                  setAssign(e.target.checked);
                }}
              />
              {assign && props.geotabDevices && props.geotabDevices.length && (
                <>
                  <Autocomplete
                    blurOnSelect
                    style={{ width: 210 }}
                    options={props.geotabDevices.filter(
                      (device) => !device.serialNumber || !device.serialNumber.startsWith('G')
                    )}
                    getOptionLabel={(option) =>
                      option && option.serialNumber
                        ? `${option.name || option.id} - ${option.serialNumber}`
                        : option && !option.serialNumber
                        ? option.name || option.id
                        : ''
                    }
                    value={assignTo}
                    ListboxProps={{ style: { minHeight: 100, maxHeight: 200, overflow: 'auto' } }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        className={classes.textField}
                        variant="standard"
                        helperText={
                          props.geotabDeviceAlreadyAttached(assignTo)
                            ? 'disconnect existing assetflo device before assigning new one'
                            : ''
                        }
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {refreshDisabled ? <CircularProgress size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                    onChange={handleChange}
                  />
                  <Button onClick={handleRefreshDevices} disabled={refreshDisabled} style={{ marginLeft: 0 }}>
                    <RefreshIcon
                      style={{ color: refreshDisabled ? variables.DISABLED_GRAY_COLOR : variables.GREEN_COLOR }}
                    />
                  </Button>
                </>
              )}
            </div>
            <div></div>
          </div>
        ) : (
          <>
            {snDevices?.length ? (
              <>
                <div className={classes.dialogReplaceWrap}>
                  <DialogContentText>Assign serial number of</DialogContentText>{' '}
                  <Autocomplete
                    options={snDevices}
                    style={{ width: 320 }}
                    getOptionLabel={(option) => `${option.assetName} - ${option.serialNo}`}
                    name="selectedSerialNo"
                    onChange={handleChangeSerialNo}
                    value={selectedSerialNo || ''}
                    renderInput={(params) => (
                      <TextField {...params} className={classes.searchField} variant="standard" />
                    )}
                    disableClearable
                  />
                </div>
                <div>
                  {selectedSerialNo && (
                    <RadioGroup
                      aria-label="replace_action"
                      name="replace_action"
                      value={archiveOldDevice || ''}
                      onChange={(e) => {
                        setArchiveOldDevice(e.target.value);
                      }}
                    >
                      <FormControlLabel
                        value={'archive'}
                        control={<props.OrangeRadio />}
                        label={<span style={{ color: 'rgba(0, 0, 0, 0.54)' }}>{`Archive replaced device`}</span>}
                      />
                      <FormControlLabel
                        value={'keep'}
                        control={<props.OrangeRadio />}
                        label={<span style={{ color: 'rgba(0, 0, 0, 0.54)' }}>{`Keep replaced device`}</span>}
                      />
                    </RadioGroup>
                  )}
                </div>
              </>
            ) : (
              <div>
                <div className={classes.dialogReplaceWrap}>
                  <DialogContentText>
                    No active devices available to replace. Please provision a device first.
                  </DialogContentText>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
      {/* <DialogTitle style={{ color: variables.DARK_GRAY_COLOR }}>
            Provision device {provisionModal.name}?
          </DialogTitle>
          <DialogContent>
            <DialogContentText>Generate serial number that you can use to provision asset on Geotab</DialogContentText>
          </DialogContent> */}
      <DialogActions>
        <Button
          onClick={() => {
            setProvisionModal({ open: false, device: null, name: null });
            setSelectedSerialNo('');
            setGeoProvisionType(0);
          }}
        >
          Cancel
        </Button>
        <Button
          disabled={
            !!(geoProvisionType && !selectedSerialNo) || !name.trim() || (assign && !assignTo) || geotabDeviceAttached
          }
          onClick={() => {
            setSelectedGroups(['GroupCompanyId']);
            const odometerValue = odometer?.replace(/\..*$/, '');
            const vinValue = vin?.trim();
            handleProvisionToGeotab(name, assign && assignTo, {
              ...(vinValue && { vin: vinValue }),
              ...(odometerValue && { odometer: +odometerValue * 1000 })
            });
          }}
          style={{ color: geotabDeviceAttached ? variables.RED_COLOR : variables.GREEN_COLOR }}
        >
          Confirm
        </Button>
      </DialogActions>
    </StyledDialog>
  );
}

const mapStateToProps = ({ user, map, provision }) => ({
  database: user.database,
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount',
  geotabDevices: provision.geotabDevices,
  groups: user.groups,
  groupObjects: user.groupObjects
});

const mapDispatch = ({ provision: { getGeotabDevicesAction } }) => ({
  getGeotabDevices: getGeotabDevicesAction
});

export default connect(mapStateToProps, mapDispatch)(GeoProvisionModal);
