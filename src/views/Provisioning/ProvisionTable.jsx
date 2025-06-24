import React, { useState, useEffect, createRef } from 'react';
import MaterialTable, { MTableEditField } from '@material-table/core';
import CustomSwitch from '../Common/CustomSwitch';
import { connect } from 'react-redux';
import moment from 'moment';
import {
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Tooltip,
  TextField,
  Radio,
  Badge,
  IconButton,
  Select,
  MenuItem
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Alert from '@mui/material/Alert';
import variables from '../../variables.json';
import { hasAccess } from '../../util/hasAccess';
import ReactDOM from 'react-dom';
import SettingsIcon from '@mui/icons-material/Settings';
import LocationOffIcon from '@mui/icons-material/LocationOff';
import QueueIcon from '@mui/icons-material/Queue';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import MapIcon from '@mui/icons-material/Map';
import ContentCopy from '@mui/icons-material/ContentCopy';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import BatteryCharging50Icon from '@mui/icons-material/BatteryCharging50';
import BatteryUnknownIcon from '@mui/icons-material/BatteryUnknown';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import RefreshIcon from '@mui/icons-material/Refresh';

import { filterByGroup } from '../../util/filters';
import GeoProvisionModal from './ProvisionTableModals/GeoProvisionModal';
import AssetTypeModal from './ProvisionTableModals/AssetTypeModal';
import AttachDevicesModal from './ProvisionTableModals/AttachDevicesModal';
import ConfirmRemove from './ProvisionTableModals/ConfirmRemove';

import { isValidLocation } from '../../util/validation';
import { handleGeoGroupSelection, handleGroupList } from '../../util/handleGroups';
import { groupTree } from '../../util/groupTree';
import { getLastSeen } from '../../util/getLastSeen';
import { transformDevice } from '../../util/transformer';
import { getVersionWithoutReleaseType } from '../../util/versionUtils';
import { createTheme } from '@mui/material/styles';
import { ThemeProvider } from '@mui/material/styles';

import FilterListIcon from '@mui/icons-material/FilterList';
import FilterByStatus from '../Common/FilterByStatus';
import useFilterByActivity from '../../hooks/useFilterByActivity';

import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';

const PREFIX = 'ProvisionTable';

const classes = {
  select: `${PREFIX}-select`,
  dialogReplaceWrap: `${PREFIX}-dialogReplaceWrap`,
  textField: `${PREFIX}-textField`,
  chipFont: `${PREFIX}-chipFont`
};

const Root = styled('div')(({ theme, ...props }) => ({
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
  [`& .${classes.chipFont}`]: {
    '& .MuiChip-label': { fontSize: 11 }
  }
}));

function ProvisionTable(props) {
  let tableRef = createRef();

  const theme = createTheme({
    palette: {
      secondary: {
        main: variables.LIGHT_ORANGE_COLOR
      }
    }
  });

  const [alert, setAlert] = useState({
    type: '',
    msg: ''
  });
  const [productType, setProductType] = useState(null);
  const [provisionModal, setProvisionModal] = useState({ open: false, device: null, name: null });
  const [geopushModal, setGeopushModal] = useState({ open: false, rowData: null, delete: false });
  const [geoProvisionType, setGeoProvisionType] = useState(0);
  const [snDevices, setSnDevices] = useState([]);
  const [selectedSerialNo, setSelectedSerialNo] = useState('');
  const [assetTypeModal, setAssetTypeModal] = useState({ open: false, rowData: null });
  const [assetType, setAssetType] = useState(null);
  const [archiveOldDevice, setArchiveOldDevice] = useState('archive');
  const [assetTypeGroup, setAssetTypeGroup] = useState('GroupTrailerId');
  const [selectedGroups, setSelectedGroups] = useState(['GroupCompanyId']);
  const [attachDevicesModal, setAttachDevicesModal] = useState({ open: false, rowData: null });
  const [confirmRemove, setConfirmRemove] = useState({ open: false, rowData: null });
  const [getGeotabData, setGetgeotabData] = useState(false);
  const [isRefreshDisabled, setIsRefreshDisabled] = useState(false);
  const {
    dropDownAnchor,
    openDropDown,
    closeDropDown,
    filterByActivity,
    updateActivityFilter,
    applyFilterByActivity
  } = useFilterByActivity();
  const productTypeList = variables.SUBSCRIPTION;

  const [isSaving, setIsSaving] = useState(false); // Add loading state

  useEffect(() => {
    if (!props.devStates?.length || props.devStates[0].organization !== props.database) props.getDevices();
  }, [props.groupFilter]);

  // Restore filters and sort order on component mount
  useEffect(() => {
    if (tableRef?.current) {
      tableRef.current.dataManager.orderByCollection = props.tableOrderByCollection || [];
    }
  }, [tableRef]);

  // Get Geotab devices
  useEffect(() => {
    if (getGeotabData) {
      const hasAttachedDevice = props.devStates?.some(
        (device) =>
          device.attachedState?.configured === true && device.attachedState?.attachedTo?.includes(props.database)
      );

      if (hasAttachedDevice) {
        props.getGeotabGroupVehicleId({ groups: ['GroupVehicleId'] });
      }
    }
  }, [getGeotabData]);

  const handleOpenConfig = (rowData) => {
    // Save current table state
    let search = tableRef?.current?.state?.searchText;
    let orderByCollection = tableRef?.current?.state?.orderByCollection;

    search && props.setTableSearch(search);
    orderByCollection && props.setTableOrderByCollection(orderByCollection);

    props.setTablePage(tableRef?.current?.dataManager?.currentPage);
    const deviceWithLoc = getDeviceLocation(rowData);
    props.setSelectedRow(deviceWithLoc);

    // get configuration
    if (rowData.deviceType === 'Tag') {
      getConfigurationForTag(rowData);
    } else {
      getConfigurationForLocator(rowData);
    }
    props.renderComponent('configuration');
  };

  const handleGeotabProvisionAction = (rowData) => {
    // only admin can provision devices to Geotab
    if (!hasAccess(props.userPermissions, variables.ALL_DEVICES_FEATURE, props.role, props.database, props.group))
      return;
    // set default value
    setArchiveOldDevice('archive');
    rowData.protocol === 'IOX' ? setAssetTypeGroup('GroupVehicleId') : setAssetTypeGroup('GroupTrailerId');
    // filter all devices by group
    const allDevices =
      props.groupFilter && props.groupFilter.length && props.groupFilter.length > 0
        ? filterByGroup(props.devStates, props.groupFilter)
        : props.devStates;
    // filter by deviceType protocol
    const filtered =
      allDevices &&
      allDevices.filter(
        (dev) => dev.serialNo && dev.deviceType === props.provisionType && dev.protocol === rowData.protocol
      );

    // filtered devices
    setSnDevices(filtered);
    //open modal and set selected device
    setProvisionModal({ open: true, device: rowData, name: rowData.assetName });
    // set initial selected device from reassign list
    filtered && filtered.length > 0 && setSelectedSerialNo(filtered[0]);
    // set productType
    if (productTypeList) {
      const productType = productTypeList[`${rowData.deviceType}-${rowData.protocol}`];
      // Ensure productType is an array, and exists
      if (productType && productType.length > 0) {
        setProductType(productType[0]);
      }
    }
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

  const handleOpenConfigForMultiple = (data) => {
    props.setTablePage(tableRef.current.dataManager.currentPage);
    props.setSelectedDeviceList(data);

    props.renderComponent('configuration');
  };

  // console.log(displayDevice);

  const validNumber = (num) => {
    const reg = new RegExp('^-?[0-9]*[.]?[0-9]+$');
    return reg.test(num);
  };

  const OrangeRadio = styled(Radio)(({ theme, wrldMapOnly }) => ({
    '&.Mui-checked': {
      color: wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR
    }
  }));

  const assetNameColumn = {
    title: 'Name',
    field: 'assetName',
    filtering: false,
    align: 'center',
    headerStyle: {
      color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      fontWeight: 'bold'
    },
    cellStyle: {
      color: variables.DARK_GRAY_COLOR,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      // padding: props.provisionType === 'Tag' ? '16px 3px 16px 15px' : '16px 3px'
      padding: '3px 16px 3px 3px',
      maxWidth: 150
    },
    validate: (rowData) =>
      rowData.assetName === '' || (rowData.assetName && rowData.assetName.trim() === '')
        ? { isValid: false, helperText: 'required field' }
        : true,
    editComponent: (fieldProps) => {
      return (
        <TextField
          name="assetName"
          InputProps={{
            style: {
              fontSize: 13
            }
          }}
          onChange={(e) => {
            if (fieldProps.rowData.serialNo) {
              props.setNote({
                message: 'Devices with Serial № can be edited on Geotab portal only',
                variant: 'warning'
              });
              return;
            }
            fieldProps.onChange(e.target.value);
          }}
          value={fieldProps.value || ''}
        ></TextField>
      );
    }
  };

  const MACColumn = {
    title: 'MAC',
    field: 'deviceId',
    filtering: false,
    align: 'center',
    headerStyle: {
      color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      fontWeight: 'bold'
    },
    cellStyle: {
      color: variables.DARK_GRAY_COLOR,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      padding: '3px 16px 3px 3px'
    },
    editable: 'onAdd'
  };

  const GroupsColumn = {
    title: 'Groups',
    field: 'groups',
    filtering: false,
    align: 'center',
    headerStyle: {
      color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      fontWeight: 'bold',
      padding: '16px 3px 16px 16px'
    },
    cellStyle: {
      color: variables.DARK_GRAY_COLOR,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      padding: '3px 16px 3px 3px',
      maxWidth: 120
    },
    render: (rowData) => {
      return props.renderGroupNames(rowData.groups);
    },
    editComponent: (fieldProps) => {
      let groupsArray = fieldProps.value
        ? Array.isArray(fieldProps.value)
          ? fieldProps.value
          : [fieldProps.value]
        : [props.groupObjects && props.groupObjects.length > 0 && props.groupObjects[0].groupId];
      // console.log(props.groupObjects && props.groupObjects);
      return props.groupsEditComponent(groupsArray, fieldProps);
    }
  };

  const ActiveSinceColumn = {
    title: 'Active Since',
    field: 'createdAt',
    filtering: false,
    render: (rowData) => {
      return rowData && moment(rowData.createdAt).format('DD/MM/YY');
    },
    align: 'center',
    headerStyle: {
      color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      fontWeight: 'bold'
    },
    cellStyle: {
      color: variables.DARK_GRAY_COLOR,
      wordBreak: 'break-word',
      padding: '3px 29px 3px 3px'
    },
    editable: 'never'
  };

  const StatusColumn = {
    title: 'Status',
    field: 'status',
    filtering: false,
    align: 'center',
    headerStyle: {
      color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      fontWeight: 'bold'
    },
    cellStyle: {
      color: variables.DARK_GRAY_COLOR,
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    editable: 'never'
  };

  const ConfigIdColumn = {
    title: 'ConfigId',
    field: 'configurationId',
    filtering: false,
    editable: 'never',
    hidden: true
  };

  const GoIdColumn = {
    title: 'GoId',
    field: 'goId',
    filtering: false,
    editable: 'never',
    hidden: true
  };

  const FirmwareColumn = {
    title: 'Firmware',
    field: 'firmware',
    filtering: false,
    editable: 'never',
    hidden: true
  };

  const SerialNoColumn = {
    title: 'Serial №',
    field: 'serialNo',
    filtering: false,
    align: 'center',
    headerStyle: {
      color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      fontWeight: 'bold',
      whiteSpace: 'nowrap',
      padding: '16px 3px 16px 3px'
    },
    cellStyle: {
      color: variables.DARK_GRAY_COLOR,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      padding: '3px 16px 3px 3px'
    },
    render: (rowData) => {
      return rowData && rowData.serialNo ? (
        <Chip
          size="small"
          style={{
            backgroundColor: rowData.isPush ? variables.LIGHT_GREEN_COLOR : variables.DISABLED_GRAY_COLOR,
            color: variables.WHITE_COLOR,
            maxWidth: '100%',
            display: 'flex'
          }}
          sx={{ userSelect: 'unset' }}
          className={classes.chipFont}
          icon={
            rowData.isPush ? (
              <IconButton>
                <Tooltip title={'Data push is active'}>
                  <PlayArrowIcon
                    style={{
                      color: variables.WHITE_COLOR,
                      cursor: 'pointer'
                    }}
                    fontSize="inherit"
                    onClick={() => {
                      hasAccess(
                        props.userPermissions,
                        variables.ALL_DEVICES_FEATURE,
                        props.role,
                        props.database,
                        props.group
                      ) && setGeopushModal({ open: true, rowData: rowData, delete: false });
                      // const newData = { ...rowData, isPush: !rowData.isPush };
                      // console.log('update isPush', newData);
                      // handleUpdateData(newData, rowData);
                    }}
                  />
                </Tooltip>
              </IconButton>
            ) : (
              <IconButton>
                <Tooltip title={'Data push is paused'}>
                  <PauseIcon
                    style={{
                      color: variables.WHITE_COLOR,
                      cursor: 'pointer'
                    }}
                    fontSize="inherit"
                    onClick={() => {
                      hasAccess(
                        props.userPermissions,
                        variables.ALL_DEVICES_FEATURE,
                        props.role,
                        props.database,
                        props.group
                      ) && setGeopushModal({ open: true, rowData: rowData, delete: false });
                      // const newData = { ...rowData, isPush: !rowData.isPush };
                      // console.log('update isPush', newData);
                      // handleUpdateData(newData, rowData);
                    }}
                  />
                </Tooltip>
              </IconButton>
            )
          }
          onDelete={() => {
            hasAccess(props.userPermissions, variables.ALL_DEVICES_FEATURE, props.role, props.database, props.group) &&
              setGeopushModal({ open: true, rowData: rowData, delete: true });
          }}
          label={
            <div>
              {rowData.serialNo}
              <IconButton
                size="small"
                onClick={() => {
                  navigator.clipboard.writeText(rowData.serialNo);
                  props.setNote({
                    message: 'Text copied to clipboard',
                    variant: 'outlined'
                  });
                }}
              >
                <Tooltip title={'Copy to clipboard'}>
                  <ContentCopy fontSize="inherit" style={{ color: variables.WHITE_COLOR }} />
                </Tooltip>
              </IconButton>
            </div>
          }
        />
      ) : (
        <Tooltip title="Device is not provisioned on Geotab">
          <Chip
            size="small"
            style={{
              backgroundColor: props.wrldMapOnly ? variables.DISABLED_GEOTAB_COLOR : variables.DISABLED_ORANGE_COLOR,
              color: variables.WHITE_COLOR
            }}
            onClick={() => handleGeotabProvisionAction(rowData)}
            label={
              hasAccess(props.userPermissions, variables.ALL_DEVICES_FEATURE, props.role, props.database, props.group)
                ? 'Add to Geotab'
                : 'Not available'
            }
            // title={"Device is not provisioned on Geotab"}
          />
        </Tooltip>
      );
    },
    editable: 'never'
  };

  const ProtocolColumn = {
    title: 'Protocol',
    field: 'protocol',
    filtering: false,
    align: 'center',
    headerStyle: {
      color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      fontWeight: 'bold',
      padding: '16px 3px 16px 3px'
    },
    cellStyle: {
      color: variables.DARK_GRAY_COLOR,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      padding: '3px 16px 3px 3px'
    },
    editable: 'never'
  };

  const tooltips = {
    charging: 'Charging',
    notCharging: 'Not Powered',
    notChargingBatteryFull: 'Battery Full',
    notChargingTemporaryFault: 'Temporary Fault',
    notChargingBatteryFault: 'Battery Fault'
  };

  const getBatteryIcon = (status) => {
    const icons = {
      charging: <BatteryCharging50Icon />,
      notCharging: null,
      notChargingBatteryFull: <BatteryChargingFullIcon />,
      notChargingTemporaryFault: <BatteryUnknownIcon style={{ color: 'orange' }} />,
      notChargingBatteryFault: <BatteryUnknownIcon style={{ color: 'red' }} />
    };

    return status in tooltips ? <Tooltip title={tooltips[status]}>{icons[status]}</Tooltip> : icons[status] || null;
  };

  const BatteryColumn = {
    title: 'Battery',
    field: 'telemetry.batterylevel',
    filtering: true,
    render: (rowData) => {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {rowData?.telemetry?.batterylevel != null
            ? rowData?.telemetry?.batterylevel > 100
              ? 100 + '%'
              : rowData?.telemetry?.batterylevel + '%'
            : rowData?.protocol == 'IOX'
            ? 'N/A'
            : 'Unknown'}
          {props.showAdvanceTool &&
            rowData?.protocol === 'LTE' &&
            getBatteryIcon(rowData?.telemetry?.batteryChargeStatus)}
        </div>
      );
    },
    customSort: (a, b) => {
      if (tableRef?.current?.dataManager?.orderDirection == 'asc') {
        const aVal = a?.telemetry?.batterylevel
          ? a.telemetry.batterylevel
          : a?.protocol == 'IOX'
          ? 1000 // N/A
          : 1001; // Unknown
        const bVal = b?.telemetry?.batterylevel
          ? b.telemetry.batterylevel
          : b?.protocol == 'IOX'
          ? 1000 // N/A
          : 1001; // Unknown
        return aVal - bVal;
      } else {
        const aVal = a?.telemetry?.batterylevel
          ? a.telemetry.batterylevel
          : a?.protocol == 'IOX'
          ? -1 // N/A
          : -2; // Unknown
        const bVal = b?.telemetry?.batterylevel
          ? b.telemetry.batterylevel
          : b?.protocol == 'IOX'
          ? -1 // N/A
          : -2; // Unknown
        return aVal - bVal;
      }
    },
    customFilterAndSearch: (term, rowData) => {
      const formatBatteryLevel = (rowData) => {
        if (rowData?.telemetry?.batterylevel != null) {
          return rowData.telemetry.batterylevel > 100 ? '100%' : rowData.telemetry.batterylevel + '%';
        } else if (rowData?.protocol == 'IOX') {
          return 'N/A';
        } else {
          return 'Unknown';
        }
      };

      const batteryLevel = formatBatteryLevel(rowData);
      const tooltipIcon = rowData?.telemetry?.batteryChargeStatus;

      const tooltipText = tooltips[tooltipIcon];

      if (batteryLevel && batteryLevel.toString().includes(term)) {
        return true;
      }

      // Only Search for Battery Charge Status if the Advanced Tool is enabled
      if (props.showAdvanceTool) {
        if (tooltipText && tooltipText.toLowerCase().includes(term.toLowerCase())) {
          return true;
        }
      }

      return false;
    },
    align: 'center',
    headerStyle: {
      color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      fontWeight: 'bold',
      padding: '16px 3px 16px 3px'
    },
    cellStyle: {
      color: variables.DARK_GRAY_COLOR,
      wordBreak: 'break-word',
      padding: '3px 16px 3px 3px'
    },
    editable: 'never'
  };

  const FirmwareVersionColumn = {
    title: 'Firmware',
    field: 'fwVersion',
    filtering: true,
    render: (rowData) => {
      // fwVersion is the device's current firmware version
      // firmware is the available firmware for the device (may be pending)

      // Get the available firmware for the device
      const firmwareList = rowData?.firmware || [];
      const firmware = firmwareList.find((fw) => fw && fw.protocol === rowData?.protocol);

      // Get the current version without the release type
      const rowDataVersion = getVersionWithoutReleaseType(rowData?.fwVersion);

      // If a new firmware is not null, check the version
      if (firmware && firmware.version) {
        const firmwareVersion = getVersionWithoutReleaseType(firmware.version);

        // If the firmware version is different from the device version, display 'pending'
        if (rowDataVersion !== firmwareVersion) {
          return `${firmwareVersion} pending`;
        } else {
          // Otherwise, display the current firmware version
          return firmwareVersion;
        }
      } else if (rowData?.fwVersion) {
        // If a new firmware is not available, display the original firmware version
        return rowDataVersion;
      } else {
        return <HorizontalRuleIcon fontSize="medium" style={{ display: 'block', margin: '0 auto' }} />;
      }
    },
    customSort: (a, b) => {
      const aFirmwareList = a?.firmware || [];
      const aFirmware = aFirmwareList.find((fw) => fw && fw.protocol === a?.protocol);
      const bFirmwareList = b?.firmware || [];
      const bFirmware = bFirmwareList.find((fw) => fw && fw.protocol === b?.protocol);

      const aVal = String(a?.fwVersion || (aFirmware ? aFirmware.version : '-1'));
      const bVal = String(b?.fwVersion || (bFirmware ? bFirmware.version : '-1'));

      if (tableRef?.current?.dataManager?.orderDirection == 'asc') {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    },
    align: 'center',
    headerStyle: {
      color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      fontWeight: 'bold',
      padding: '16px 3px 16px 3px'
    },
    cellStyle: {
      color: variables.DARK_GRAY_COLOR,
      wordBreak: 'break-word',
      padding: '3px 16px 3px 3px'
    },
    editable: 'never'
  };

  const handleMapPosition = (rowData) => {
    const data = rowData;
    const location = getDeviceLocation(data, props.devStates);

    const updatedRowData = {
      ...data,
      lat: location.lat,
      lng: location.lng,
      alt: location.alt || 1,
      provisionType: props.provisionType
    };

    // Update the selected row and trigger inline map rendering
    props.setSelectedRow(updatedRowData);

    props.renderComponent('draggable');
  };

  const LastSeenColumn = {
    title: 'Last seen',
    field: 'locTime',
    filtering: true,
    render: (rowData) => {
      return rowData?.lastSeen ? moment(rowData.lastSeen).startOf('minute').fromNow(true) : 'N/A';
    },
    customSort: (a, b) => {
      if (tableRef?.current?.dataManager?.orderDirection == 'asc') {
        if (!a?.lastSeen) return 1;
        if (!b?.lastSeen) return -1;
        return moment(a.lastSeen).isSameOrAfter(b.lastSeen) ? -1 : 1;
      } else {
        if (!a?.lastSeen) return -1;
        if (!b?.lastSeen) return 1;
        return moment(a.lastSeen).isSameOrAfter(b.lastSeen) ? -1 : 1;
      }
    },
    align: 'center',
    headerStyle: {
      color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      fontWeight: 'bold',
      whiteSpace: 'nowrap',
      padding: '16px 3px 16px 3px'
    },
    cellStyle: {
      color: variables.DARK_GRAY_COLOR,
      wordBreak: 'break-word',
      padding: '3px 16px 3px 3px'
    },
    editable: 'never'
  };

  const FixedAssetColumn = {
    title: 'Fixed',
    field: 'fixAsset',
    filtering: false,
    align: 'center',
    headerStyle: {
      color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      fontWeight: 'bold',
      padding: '16px 3px 16px 3px',
      whiteSpace: 'nowrap'
    },
    cellStyle: {
      color: '#576574',
      padding: '3px 16px 3px 3px'
    },
    type: 'boolean',
    editComponent: (fieldProps) => {
      let isDisabled = false;
      if (fieldProps.rowData.attachedState?.configured) {
        // if the device is attached to a trailer or geotab device disable the switch
        isDisabled = true;
      } else if (fieldProps.rowData.protocol === 'LTE') {
        // find if there is any device attached to this device, if so, disable the switch
        isDisabled = props.devStates.some(
          (device) =>
            (device.protocol === 'BLE' || device.protocol === 'OTS.BLE') &&
            device.attachedState?.attachedTo === fieldProps.rowData.deviceId
        );
      }
      return (
        <Tooltip title={isDisabled ? 'Unattach to convert to Fixed Asset' : 'Convert to Fixed Asset'}>
          <span>
            <CustomSwitch
              checked={!!fieldProps.value}
              onChange={(e) => {
                fieldProps.onChange(e.target.checked);
              }}
              size="small"
              // color="primary"
              disabled={isDisabled}
            />
          </span>
        </Tooltip>
      );
    },
    customSort: (a, b) => {
      const aVal = a?.fixAsset ? 2 : a?.isAnchor ? 1 : 0;
      const bVal = b?.fixAsset ? 2 : b?.isAnchor ? 1 : 0;
      return aVal - bVal;
    },
    render: (rowData) => {
      const renderButton = () => (
        <Tooltip title={rowData.fixAsset ? 'Position on Map' : ''}>
          <IconButton
            style={{
              backgroundColor: rowData.fixAsset ? variables.LIGHT_GREEN_COLOR : variables.LIGHT_GRAY_COLOR,
              color: 'white',
              padding: '2px',
              borderRadius: '50%'
            }}
            onClick={(e) => {
              e.preventDefault(); // Prevent any default navigation or page reload
              handleMapPosition(rowData); // Trigger the map position logic
            }}
            disabled={!rowData.fixAsset}
          >
            {rowData.fixAsset ? <AddLocationIcon /> : <LocationOffIcon />}
          </IconButton>
        </Tooltip>
      );

      return <div style={{ paddingRight: '8px' }}>{renderButton()}</div>;
    }
  };

  const AttachedColumn = {
    title: 'Attached',
    field: 'attached',
    filtering: false,
    align: 'center',
    headerStyle: {
      color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      fontWeight: 'bold',
      padding: '16px 3px 16px 3px',
      whiteSpace: 'nowrap'
    },
    cellStyle: {
      color: '#576574',
      padding: '3px 16px 3px 3px'
    },
    editable: 'never',

    // Custom Sorting Logic
    // Sort by LTE devices with attached devices on top
    // Sort other devices with attached states above those without
    customSort: (a, b) => {
      const aIsLTE = a.protocol === 'LTE' ? 1 : 0;
      const bIsLTE = b.protocol === 'LTE' ? 1 : 0;

      const aAttached = a?.attachedState?.configured ? 1 : 0;
      const bAttached = b?.attachedState?.configured ? 1 : 0;

      const aFixedAsset = a.fixAsset || a.isAnchor ? 1 : 0;
      const bFixedAsset = b.fixAsset || b.isAnchor ? 1 : 0;

      if (aIsLTE !== bIsLTE) return bIsLTE - aIsLTE;
      if (aAttached !== bAttached) return bAttached - aAttached;
      if (aFixedAsset !== bFixedAsset) return aFixedAsset - bFixedAsset;
      return 0;
    },

    render: (rowData) => {
      const attached = rowData.attachedState?.configured ? rowData.attachedState.attachedTo : null;
      const idParts = attached?.split('.') || [];
      const id = idParts.pop() || attached;

      // Get geotabGroupVehicleid if not already set, ensure we are not running multiple fetches
      if (!props.geotabGroupVehicleId && !getGeotabData) {
        setGetgeotabData(true);
      }

      // Ensure props.geotabGroupVehicleId is an array before using find
      const attachedTo = Array.isArray(props.geotabGroupVehicleId)
        ? idParts.length === 1
          ? props.geotabGroupVehicleId.find((dev) => dev.id === id)?.name || null
          : id
        : null;

      const fixedAsset = rowData.fixAsset || rowData.isAnchor;

      const renderAttachedChip = (rowData) => (
        <Tooltip title={attachedTo ? `Attached to ${attachedTo}` : ''}>
          <Chip
            size="small"
            sx={{
              backgroundColor: variables.LIGHT_GREEN_COLOR,
              color: variables.WHITE_COLOR,
              padding: '2px 5px',
              borderRadius: '8px',
              lineHeight: 'normal'
            }}
            label={rowData.attachedState?.position}
            icon={<LocalShippingIcon style={{ color: variables.WHITE_COLOR }} />}
            aria-controls="asset-type-menu"
            aria-haspopup="true"
            onDelete={() => setConfirmRemove({ open: true, rowData })}
          />
        </Tooltip>
      );

      const render5gAttachButton = () => {
        const attachedDevices = props.devStates.filter(
          (device) =>
            (device.protocol === 'BLE' || device.protocol === 'OTS.BLE') &&
            device.attachedState?.attachedTo === rowData.deviceId
        );

        const allDevices = [
          ...attachedDevices.map((device) => ({
            id: device.deviceId,
            position: device.attachedState.position
          }))
        ];

        const tooltipContent =
          allDevices.length > 0 ? (
            <div>
              <ul style={{ padding: 0, margin: 0 }}>
                {allDevices.slice(0, 5).map((device, index) => (
                  <li key={index} style={{ padding: '4px 0', listStyle: 'none' }}>
                    {device.id} - {device.position}
                  </li>
                ))}
                {allDevices.length > 5 && (
                  <li style={{ padding: '4px 0', listStyle: 'none' }}>... and {allDevices.length - 5} more</li>
                )}
              </ul>
            </div>
          ) : (
            'Attach devices to this 5G device'
          );

        return (
          <Tooltip title={!fixedAsset ? tooltipContent : ''}>
            <IconButton
              size="small"
              style={{
                backgroundColor: fixedAsset ? variables.DISABLED_GRAY_COLOR : variables.LIGHT_GREEN_COLOR,
                color: variables.WHITE_COLOR,
                padding: '3px 8px',
                borderRadius: '8px'
              }}
              disabled={fixedAsset}
              aria-controls="asset-type-menu"
              onClick={(e) => {
                if (
                  !hasAccess(
                    props.userPermissions,
                    variables.ALL_DEVICES_FEATURE,
                    props.role,
                    props.database,
                    props.group
                  )
                )
                  return;
                handleAttachBLEDevices(rowData);
              }}
            >
              <Badge
                badgeContent={attachedDevices.length}
                invisible={fixedAsset}
                color={'error'}
                max={99}
                // showZero
                sx={{
                  '& .MuiBadge-badge': {
                    color: variables.WHITE_COLOR,
                    backgroundColor: '#C49498'
                  },
                  position: 'absolute',
                  top: '-1px',
                  right: '-1px'
                }}
              />
              <LocalShippingIcon style={{ color: 'white', fontSize: 'inherit' }} />
            </IconButton>
          </Tooltip>
        );
      };

      const renderBLEAttachChip = () => (
        <Tooltip title={fixedAsset ? '' : 'Attach this device to a vehicle'}>
          <IconButton
            size="small"
            style={{
              backgroundColor:
                rowData.isAnchor || rowData.fixAsset ? variables.DISABLED_GRAY_COLOR : variables.LIGHT_GREEN_COLOR,
              color: 'white',
              padding: '4px',
              borderRadius: '10px'
            }}
            disabled={fixedAsset}
            aria-controls="asset-type-menu"
            aria-haspopup="true"
            onClick={(e) => {
              if (
                !hasAccess(
                  props.userPermissions,
                  variables.ALL_DEVICES_FEATURE,
                  props.role,
                  props.database,
                  props.group
                )
              )
                return;
              props.setSelectedRow(rowData);
              setAssetType('configured');
              setAssetTypeModal({ open: true, rowData: rowData });
            }}
          >
            <QueueIcon style={{ color: variables.WHITE_COLOR, fontSize: 'inherit', padding: 0 }} />
          </IconButton>
        </Tooltip>
      );

      const hasLTEAttachButton = rowData.protocol === 'LTE';
      const hasBLEAttachChip = (rowData.protocol === 'BLE' || rowData.protocol === 'OTS.BLE') && !attached;

      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {attached && renderAttachedChip(rowData)}
          {hasLTEAttachButton && render5gAttachButton()}
          {hasBLEAttachChip && renderBLEAttachChip()}
        </div>
      );
    }
  };

  const latColumn = {
    title: 'lat',
    field: 'lat',
    filtering: false,
    align: 'center',
    headerStyle: {
      color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      fontWeight: 'bold'
    },
    cellStyle: {
      color: variables.DARK_GRAY_COLOR,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      padding: '3px 29px 3px 3px'
    },
    sorting: false,
    hidden: true,
    validate: (rowData) =>
      rowData.lat &&
      rowData.lat !== undefined &&
      rowData.lat.trim() !== '' &&
      (isNaN(Number(rowData.lat)) || Number(rowData.lat) < -90 || Number(rowData.lat) > 90)
        ? { isValid: false, helperText: 'invalid' }
        : (rowData.lat && rowData.lat.trim() === '') || rowData.lat === ''
        ? { isValid: false, helperText: 'required' }
        : rowData.lat === undefined && rowData.lng !== undefined
        ? { isValid: false, helperText: '' }
        : true,
    editComponent: (fieldProps) => {
      if (fieldProps.rowData.isAnchor || props.provisionType !== 'Tag') {
        return <MTableEditField {...fieldProps} />;
      }
      return <div></div>;
    },
    render: (rowData) => {
      return rowData.lat ? Number(Number.parseFloat(rowData.lat).toFixed(6)) : rowData.lng;
    }
  };

  const lngColumn = {
    title: 'lng',
    field: 'lng',
    filtering: false,
    align: 'center',
    headerStyle: {
      color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      fontWeight: 'bold'
    },
    cellStyle: {
      color: variables.DARK_GRAY_COLOR,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      padding: '3px 29px 3px 3px'
    },
    sorting: false,
    hidden: true,
    validate: (rowData) =>
      rowData.lng !== undefined &&
      rowData.lng &&
      rowData.lng.trim() !== '' &&
      (isNaN(Number(rowData.lng)) ||
        Number(rowData.lng) < -180 ||
        Number(rowData.lng) > 180 ||
        !validNumber(rowData.lng))
        ? { isValid: false, helperText: 'invalid' }
        : (rowData.lng && rowData.lng.trim() === '') || rowData.lng === ''
        ? { isValid: false, helperText: 'required' }
        : rowData.lat !== undefined && rowData.lng === undefined
        ? { isValid: false, helperText: '' }
        : true,
    editComponent: (fieldProps) => {
      if (fieldProps.rowData.isAnchor || props.provisionType !== 'Tag') {
        return <MTableEditField {...fieldProps} />;
      }
      return <div></div>;
    },
    render: (rowData) => {
      return rowData.lng ? Number(Number.parseFloat(rowData.lng).toFixed(6)) : rowData.lng;
    }
  };

  const altColumn = {
    title: 'alt',
    field: 'alt',
    filtering: false,
    align: 'center',
    headerStyle: {
      color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      fontWeight: 'bold'
    },
    cellStyle: {
      color: variables.DARK_GRAY_COLOR
      // width: '50px'
    },
    sorting: false,
    hidden: true
  };

  const LifecycleColumn = {
    title: 'Lifecycle',
    field: 'lifecycle',
    filtering: false,
    align: 'center',
    headerStyle: {
      color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      fontWeight: 'bold'
    },
    cellStyle: {
      color: variables.DARK_GRAY_COLOR,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      padding: '3px 16px 3px 3px'
    },
    render: (rowData) => {
      const lifecycleMap = {
        production: 'prod',
        staging: 'staging',
        dev: 'dev'
      };
      return lifecycleMap[rowData.lifecycle] || 'prod';
    },
    customSort: (a, b) => {
      const lifecycleOrder = {
        production: 0,
        staging: 1,
        dev: 2
      };
      const aVal = a.lifecycle && lifecycleOrder[a.lifecycle] !== undefined ? lifecycleOrder[a.lifecycle] : 3;
      const bVal = b.lifecycle && lifecycleOrder[b.lifecycle] !== undefined ? lifecycleOrder[b.lifecycle] : 3;
      return aVal - bVal;
    },
    editComponent: (fieldProps) => {
      const { protocol, deviceType, lifecycle } = fieldProps.rowData;

      // Check if the user has access to update lifecycle
      const canEditLifecycle = hasAccess(
        props.userPermissions,
        variables.ADVANCETOOL,
        props.role,
        props.adminDatabase || props.database,
        props.group
      );

      // If it's not LTE, not a Locator, or the user lacks permissions, show "Production"
      if (!canEditLifecycle || (protocol !== 'LTE' && deviceType !== 'Locator')) {
        return (
          <div style={{ display: 'flex', justifyContent: 'center', fontSize: '1rem' }}>{lifecycle || 'Production'}</div>
        );
      }

      return (
        <Select
          value={fieldProps.value || 'production'}
          onChange={(e) => {
            fieldProps.onChange(e.target.value);
          }}
          style={{ width: '100%' }}
          fontSize="1rem"
          size={'medium'}
        >
          {Object.entries({ production: 'production', staging: 'staging', dev: 'dev' }).map(([key, value]) => (
            <MenuItem key={key} value={key}>
              {value}
            </MenuItem>
          ))}
        </Select>
      );
    }
  };

  let displayDeviceColumn = {
    title: 'Position',
    field: 'display',
    editable: 'never',
    render: (rowData) => {
      return rowData && rowData.lat && rowData.lng ? (
        <div
          style={{ cursor: 'pointer' }}
          onClick={() => {
            handleMapPosition(rowData);
          }}
        >
          {
            <Chip
              size="small"
              style={{
                backgroundColor:
                  props.selectedRow?.deviceId === rowData.deviceId
                    ? variables.LIGHT_GREEN_COLOR
                    : variables.ORANGE_COLOR,
                color: variables.WHITE_COLOR,
                paddingLeft: '8px'
              }}
              label={''}
              icon={
                <MapIcon
                  style={{
                    color: variables.WHITE_COLOR
                  }}
                />
              }
              disabled
            />
          }
        </div>
      ) : (
        <div
          // allows user to edit location for devices that do not have a location
          style={{ cursor: 'pointer' }}
          onClick={() => {
            const editedRowData = rowData;
            editedRowData.zoomOut = true;
            handleMapPosition(editedRowData);
          }}
        >
          <Chip
            size="small"
            style={{
              backgroundColor: 'grey',
              color: variables.WHITE_COLOR,
              paddingLeft: '8px'
            }}
            label={''}
            icon={
              <LocationOffIcon
                style={{
                  color: variables.WHITE_COLOR
                }}
              />
            }
            disabled
          />
        </div>
      );
    },
    filtering: false,
    align: 'center',
    headerStyle: {
      color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      fontWeight: 'bold'
    },
    cellStyle: {
      color: variables.DARK_GRAY_COLOR
    },
    sorting: false
  };

  let editConfigColumn = {
    title: 'Advanced',
    field: 'advanced',
    editable: 'never',
    render: (rowData) => {
      return (
        <div
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'center'
          }}
          // onClick={() => {
          //   handleOpenConfig(rowData);
          // }}
        >
          <Chip
            size="small"
            style={{
              backgroundColor: '#98c494',
              color: variables.WHITE_COLOR,
              paddingLeft: '8px'
            }}
            onClick={() => {
              handleOpenConfig(rowData);
            }}
            label={''}
            icon={
              <SettingsIcon
                style={{
                  color: variables.WHITE_COLOR
                }}
              />
            }
            // disabled
          />
          {/* {props.provisionType === 'Tag' && (
            <Chip
              size="small"
              style={{
                backgroundColor: '#98c494',
                color: variables.WHITE_COLOR,
                paddingLeft: '8px'
              }}
              onClick={() => {
                handleOpenAlerts(rowData);
              }}
              label={''}
              icon={
                <NotificationsActiveIcon
                  style={{
                    color: variables.WHITE_COLOR
                  }}
                />
              }
            />
          )} */}
        </div>
      );
    },
    filtering: false,
    align: 'center',
    headerStyle: {
      color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      fontWeight: 'bold',
      padding: '16px 3px 16px 3px'
    },
    cellStyle: {
      color: variables.DARK_GRAY_COLOR,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      padding: '3px 16px 3px 3px'
    },
    sorting: false
  };

  function tableData() {
    let tempColumns = [
      assetNameColumn,
      MACColumn,
      GroupsColumn,
      ConfigIdColumn,
      GoIdColumn,
      FirmwareColumn,
      ProtocolColumn,
      LifecycleColumn
    ];

    let columns = [...tempColumns, SerialNoColumn];

    if (props.provisionType === 'Tag') {
      columns = [
        ...tempColumns,
        BatteryColumn,
        FirmwareVersionColumn,
        LastSeenColumn,
        SerialNoColumn,
        FixedAssetColumn,
        AttachedColumn
      ];
    }

    columns = [...columns, latColumn, lngColumn, altColumn];

    if (props.provisionType === 'Locator') {
      if (hasAccess(props.userPermissions, variables.ALL_DEVICES_FEATURE, props.role, props.database, props.group)) {
        columns = [...columns, displayDeviceColumn];
      }
    }

    if (
      hasAccess(props.userPermissions, variables.ALL_DEVICES_FEATURE, props.roles, props.database) &&
      props.provisionType !== 'Ancher'
    ) {
      columns = [...columns, editConfigColumn];
    }

    let data = [];

    // list of devices
    const fullDeviceList = [...(props.devStates ?? [])];
    // convert list of states to hashmap
    // const stateMap = arrayToMap(props.devStates ?? [], 'deviceId');

    fullDeviceList.map((dev) => {
      let tableRowData = [];
      // get state from state hashmap based on deviceId or use device itself
      const device = dev;
      const lastSeen = getLastSeen(device);
      // console.log('device', device);
      tableRowData = {
        assetName: props.screenWidth > 700 ? device.assetName : device.assetName.substring(0, 10),
        groups: device.groups,
        deviceId: device.deviceId,
        createdAt: device.createdAt ? device.createdAt : device.updatedAt,
        status: device.status,
        deviceType: device.deviceType,
        lat: device.location && device.location.lat && device.location.lat.toString(),
        lng: device.location && device.location.lng && device.location.lng.toString(),
        alt: device.location && device.location.alt && device.location.alt.toString(),
        organization: device.organization,
        configurationId: device.configurationId,
        isAnchor: device.isAnchor,
        fixAsset: device.fixAsset,
        protocol: device.protocol || dev.protocol,
        firmware: device.firmware,
        serialNo: device.serialNo,
        isPush: !!device.isPush,
        goId: device.goId,
        geotabId: device.geotabId,
        attachedState: device.attachedState,
        layout: device.layout,
        atp: device.atp,
        locTime: device.locTime,
        lastSeen: lastSeen,
        telemetry: device.telemetry,
        fwVersion: device.fwVersion,
        lifecycle: device.lifecycle,
        attachments: device.attachments
      };
      if (!device.archived && device.deviceType && device.deviceType === props.provisionType) data.push(tableRowData);
    });

    if (props.groupFilter.length > 0) {
      data = filterByGroup(data, props.groupFilter);
    }
    data = applyFilterByActivity(data);
    return { columns, data };
  }

  const handleSwitchType = (event, newValue) => {
    setGeoProvisionType(newValue);
  };

  const handleChangeSerialNo = (e, newInputValue) => {
    setSelectedSerialNo(newInputValue);
  };

  const handleAssetTypeSelected = (rowData, updates) => {
    if (
      // (rowData.isAnchor || rowData.fixAsset) &&
      hasAccess(props.userPermissions, variables.ALL_DEVICES_FEATURE, props.role, props.database, props.group)
    ) {
      console.log('handleAssetTypeSelected', rowData);
      const deviceWithLoc = getDeviceLocation(rowData);
      // console.log(deviceWithLoc);
      props.setSelectedRow({ ...deviceWithLoc, ...updates });
      props.renderComponent('draggable');
    }
  };

  const getDeviceLocation = (rowData) => {
    // 1. is anchor or fixed asset and should have lat lng
    if (
      (rowData.protocol !== 'WIFI' && !rowData.isAnchor && !rowData.fixAsset) ||
      (rowData.protocol === 'WIFI' && (!rowData.lat || !rowData.lng))
    ) {
      // default lat lng
      rowData.lat = 49.310371;
      rowData.lng = -96.989527;
      rowData.alt = 1;
      // 2. use location from devicestate
      let deviceData =
        props.devStates &&
        props.devStates.find(
          (dev) => dev.deviceId === rowData.deviceId && dev.location && dev.location.lat && dev.location.lng
        );

      if (!deviceData) rowData.noLocation = 'default';
      // 3. else use other device location
      deviceData = deviceData ? deviceData : props.devStates?.find((dev) => dev.location && dev.location.lat);

      if (deviceData) {
        rowData.lat = deviceData.location.lat;
        rowData.lng = deviceData.location.lng;
        rowData.alt = deviceData.location.alt;
        rowData.noLocation = 'used';
      }
    } else if ((rowData.isAnchor || rowData.fixAsset) && !isValidLocation(rowData)) {
      rowData.lat = 49.310371;
      rowData.lng = -96.989527;
      rowData.alt = 1;
    }
    return rowData;
  };

  const filterGroups = (assetTypeGroup, selectedGroups) => {
    const { generatedTree } = groupTree(props.groupObjects, props.database, props.groups);
    let groupsList = [];
    handleGroupList(groupsList, Object.values(generatedTree), 16);
    const filtered = handleGeoGroupSelection(
      selectedGroups.filter((item) => item !== 'GroupCompanyId'),
      groupsList
    );
    const groups = [...(filtered?.length ? filtered : ['GroupCompanyId'])];
    // console.log('filtered', filtered, groups);
    return groups;
  };

  const handleProvisionToGeotab = (name, geotabDevice, optionalParams) => {
    // provision new device
    if (!geoProvisionType) {
      const isIOX = provisionModal.device && provisionModal.device.protocol === 'IOX';
      const assetName = name.trim();
      const groups = filterGroups(assetTypeGroup, selectedGroups);

      const payload = {
        assetName: assetName ? assetName : provisionModal.name,
        deviceId: provisionModal.device.deviceId,
        productId: productType.productId,
        groups: groups,
        assetTypeGroup: assetTypeGroup,
        ...(geotabDevice && {
          geotabId: geotabDevice.id
        }),
        ...(isIOX && {
          goId: provisionModal.device.goId
        }),
        ...optionalParams
      };

      console.log('handleProvisionToGeotab', payload);
      props.provisionToMyAdmin(payload);
    } else {
      // reassign existing
      const deviceNoSn = props.devStates.filter(
        (dev) => dev.deviceId === provisionModal.device.deviceId && !dev.archived
      );
      if (!deviceNoSn || !deviceNoSn[0] || !selectedSerialNo) return;
      // add serialNo to new device
      // TODO: toAssign & toRemove need to be validated with device transformer
      // const { _id, createdAt, ...toAssign } = deviceNoSn[0];
      const toAssign = transformDevice(deviceNoSn[0], null);
      // assign null serialNo to old device
      // const { _id: ID, createdAt: createdDate, ...toRemove } = selectedSerialNo;
      const toRemove = transformDevice(selectedSerialNo, null);
      console.log('relink', toAssign, toRemove);
      props.relinkSerialNo({ toAssign: toAssign, toRemove: toRemove, archive: archiveOldDevice === 'archive' });
    }

    setProvisionModal({ open: false, device: null, name: null });
    setSelectedSerialNo('');
    setProductType(null);
    setGeoProvisionType(0);
  };

  async function handleUpdateData(newData, oldData) {
    setIsSaving(true); // Start loading spinner
    const updatedDeviceData = {
      ...newData,
      groups: newData.groups && newData.groups.length === 0 ? oldData.groups || ['GroupCompanyId'] : newData.groups
    };
    const updates = transformDevice(updatedDeviceData, updatedDeviceData);

    console.log('updates', updates);
    await props.updateDeviceData(updates);
    setIsSaving(false); // Stop loading spinner
  }

  async function handleBatchUpdateData(updates) {
    setIsSaving(true); // Start loading spinner
    const transformedUpdates = updates.map((update) => transformDevice(update, update));
    await props.updateMultipleDevices(transformedUpdates);
    if (updates.some((update) => update.deviceType === 'Locator')) await props.getLocators();
    setIsSaving(false); // Stop loading spinner
  }

  const geotabDeviceAlreadyAttached = (selectedDevice) => {
    const fullDeviceList = [...(props.provisionType === 'Locator' ? props.devStates ?? [] : props.devStates ?? [])];
    let deviceExists = false;
    fullDeviceList.forEach((device) => {
      if (device?.serialNo && selectedDevice?.serialNumber && device?.serialNo === selectedDevice?.serialNumber)
        deviceExists = true;
    });
    return deviceExists;
  };

  const handleAddNewData = (newData) => {
    let payload = {
      assetName: newData.assetName,
      groups: newData.groups,
      organization: props.database,
      deviceId: newData.deviceId,
      deviceType: 'Ancher',
      icon: 'ancherIcon',
      status: 'Active',
      isProvisioned: true,
      archived: false,
      database: props.database
      // uuid: newData.deviceId
    };

    payload.location = {
      lat: Number(newData.lat),
      lng: Number(newData.lng),
      alt: Number(newData.alt) || 1
    };
    props.updateDeviceData(payload);
    let credentials = {
      database: props.database
    };
  };

  const handleAttachBLEDevices = (rowData) => {
    // Fetch the updated current device details using the rowData.deviceId through an API call
    let attachedDevices;
    if (rowData.attachments?.length) {
      // Use a Set for faster lookups
      const attachmentSet = new Set(rowData.attachments);
      attachedDevices = props.devStates.filter((device) => attachmentSet.has(device.deviceId));
    } else {
      // Get all attached BLE devices
      attachedDevices = props.devStates.filter((device) => device.attachedState?.attachedTo === rowData.deviceId);
    }

    // Update the selected row with the attached BLE devices
    const updatedRowData = {
      ...rowData,
      attachedTags: attachedDevices || []
    };

    // Save the current search, orderByCollection, and page
    let search = tableRef?.current?.state?.searchText;
    let orderByCollection = tableRef?.current?.state?.orderByCollection;
    search && props.setTableSearch(search);
    orderByCollection && props.setTableOrderByCollection(orderByCollection);
    props.setTablePage(tableRef?.current?.dataManager?.currentPage);

    // Set the selected row and render the AddDeviceToTrailer component
    props.setSelectedRow(updatedRowData);
    props.renderComponent('AssignBLETags');
  };

  const handleRefresh = () => {
    if (isRefreshDisabled || props.isDevicesLoading) return;

    setIsRefreshDisabled(true);
    props.getDevices().then(() => {
      // setAlert({ type: 'success', msg: 'Devices refreshed successfully' });
      // Re-enable the button after a timeout
      setTimeout(() => {
        setIsRefreshDisabled(false);
      }, 10000); // 10 seconds timeout
    });
  };

  return (
    <Root style={{ width: '100%' }}>
      {alert.type !== '' && (
        <div
          style={{
            position: 'absolute',
            marginLeft: 'auto',
            marginRight: 'auto',
            left: 0,
            right: 0,
            top: '90px',
            textAlign: 'center',
            zIndex: 1,
            width: '30%',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <Alert severity={alert.type}>{alert.msg}</Alert>
        </div>
      )}
      {geopushModal.open && (
        <Dialog
          open={geopushModal.open}
          onClose={() => {
            setGeopushModal({ open: false, rowData: null, delete: false });
          }}
        >
          <DialogTitle id="geopush-dialog-title">
            {geopushModal.delete
              ? 'Remove serial number from this device? '
              : geopushModal.rowData.isPush
              ? 'Pause data push to Geotab for this device?'
              : 'Activate data push to Geotab for this device?'}
          </DialogTitle>
          {geopushModal.delete && (
            <DialogContent>
              <DialogContentText>
                You will not be able to assign this Serial Number to another device.
              </DialogContentText>
            </DialogContent>
          )}
          <DialogActions>
            <Button
              onClick={() => {
                setGeopushModal({ open: false, rowData: null, delete: false });
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!!(geoProvisionType && !selectedSerialNo)}
              onClick={() => {
                const newData = {
                  ...geopushModal.rowData,
                  ...(geopushModal.delete
                    ? { serialNo: null, isPush: false, geotabId: null, vin: null, unitId: null }
                    : { isPush: !geopushModal.rowData.isPush })
                };
                // console.log('update isPush', newData);
                handleUpdateData(newData, geopushModal.rowData);
                setGeopushModal({ open: false, rowData: null, delete: false });
              }}
              style={{ color: variables.GREEN_COLOR }}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {assetTypeModal.open && (
        <AssetTypeModal
          assetTypeModal={assetTypeModal}
          setAssetTypeModal={setAssetTypeModal}
          handleAssetTypeSelected={handleAssetTypeSelected}
          handleUpdateData={handleUpdateData}
          assetType={assetType}
          setAssetType={setAssetType}
        />
      )}
      {provisionModal.open && (
        <GeoProvisionModal
          {...{
            provisionModal,
            setProvisionModal,
            geoProvisionType,
            setGeoProvisionType,
            selectedSerialNo,
            setSelectedSerialNo,
            productType,
            setProductType,
            archiveOldDevice,
            setArchiveOldDevice,
            productTypeList,
            snDevices,
            handleSwitchType,
            handleChangeSerialNo,
            handleProvisionToGeotab,
            OrangeRadio,
            assetTypeGroup,
            setAssetTypeGroup,
            selectedGroups,
            setSelectedGroups,
            geotabDeviceAlreadyAttached
          }}
        />
      )}
      {attachDevicesModal.open && (
        <AttachDevicesModal
          attachDevicesModal={attachDevicesModal}
          setAttachDevicesModal={setAttachDevicesModal}
          handleUpdateData={handleBatchUpdateData}
        />
      )}
      {confirmRemove.open && (
        <ConfirmRemove
          confirmRemove={confirmRemove}
          setConfirmRemove={setConfirmRemove}
          handleUpdateData={handleUpdateData}
        />
      )}
      <FilterByStatus
        dropDownAnchor={dropDownAnchor}
        closeDropDown={closeDropDown}
        filterByActivity={filterByActivity}
        updateActivityFilter={updateActivityFilter}
      />
      <ThemeProvider theme={theme}>
        <MaterialTable
          tableRef={tableRef}
          key={props.provisionType}
          style={{
            marginLeft: '30px',
            marginRight: '30px',
            outline: 'none'
          }}
          localization={{ body: { editRow: { deleteText: 'Delete?' } } }}
          stickyHeader
          options={{
            headerStyle: {
              width: 'auto'
            },
            tableLayout: 'auto',
            selection: false,
            search: true,
            maxBodyHeight: props.screenWidth > 700 ? '65vh' : '55vh',
            thirdSortClick: false,
            pageSize: 20,
            pageSizeOptions: [20, 40, 60, 80, 100],
            addRowPosition: 'first',
            draggable: false,
            rowStyle: (rowData) => ({
              backgroundColor:
                rowData.tableData &&
                props.selectedRow.tableData &&
                rowData.tableData.id === props.selectedRow.tableData.id
                  ? props.wrldMapOnly
                    ? variables.DISABLED_GEOTAB_COLOR
                    : variables.ORANGE_COLOR
                  : variables.WHITE_COLOR,
              maxHeight: '50px'
            }),
            initialPage: props.tablePage || 0,
            searchText: props.tableSearch || '',
            orderByCollection: props.tableOrderByCollection || []
          }}
          components={props.customComponents}
          onChangePage={(e, page) => {
            ReactDOM.findDOMNode(tableRef.current).children[1].children[0].children[0].scrollTo(0, 0);
          }}
          title={
            <div className="text-value-sm" style={{ color: variables.DARK_GRAY_COLOR }}>
              Manage {props.provisionType === 'Ancher' ? 'Anchor' : props.provisionType}s
            </div>
          }
          actions={[
            {
              // tooltip: 'Refresh Device State',
              isFreeAction: true,
              icon: () => <RefreshIcon />,
              onClick: handleRefresh,
              disabled: isRefreshDisabled || props.isDevicesLoading
            },
            ...(['Tag', 'Locator'].includes(props.provisionType)
              ? [
                  {
                    tooltip: 'Filter by status',
                    isFreeAction: true,
                    icon: () => <FilterListIcon />,
                    onClick: (evt, data) => openDropDown(evt)
                  }
                ]
              : [])
          ]}
          columns={tableData().columns}
          data={tableData().data}
          isLoading={props.isDevicesLoading || isSaving}
          editable={
            hasAccess(props.userPermissions, variables.ALL_DEVICES_FEATURE, props.role, props.database, props.group)
              ? {
                  onRowUpdate: (newData, oldData) =>
                    new Promise((resolve, reject) => {
                      newData.assetName = newData.assetName.trim();
                      newData.deviceId = newData.deviceId.trim().toLowerCase();
                      newData.lat && (newData.lat = newData.lat.trim());
                      newData.lng && (newData.lng = newData.lng.trim());
                      if (
                        (newData.lat !== undefined && newData.lng === undefined) ||
                        (newData.lng !== undefined && newData.lat === undefined) ||
                        (newData.lat !== undefined && isNaN(newData.lat)) ||
                        (newData.lng !== undefined && isNaN(newData.lng)) ||
                        newData.lng === '' ||
                        newData.lat === ''
                      ) {
                        reject();
                        return;
                      }

                      handleUpdateData(newData, oldData);
                      resolve();
                      return;
                    }),
                  onRowDelete: (oldData) =>
                    new Promise((resolve, reject) => {
                      // handleDeleteData(oldData);
                      oldData.archived = true;
                      handleUpdateData(oldData);
                      resolve();
                    })
                }
              : {}
          }
        />
      </ThemeProvider>
    </Root>
  );
}

const mapStateToProps = ({ dashboard, provision, user, location, map }) => ({
  isDevicesLoading: dashboard.isDevicesLoading,
  allFacilityDevices: dashboard.allFacilityDevices,
  provisionType: provision.provisionType,
  database: user.database,
  adminDatabase: user.adminDatabase,
  role: user.role,
  userPermissions: user.userPermissions,
  screenWidth: location.screenWidth,
  mapboxStyle: map.mapboxStyle,
  editableMap: map.editableMap,
  allTenants: provision.allTenants,
  groupObjects: user.groupObjects,
  groupFilter: user.groupFilter,
  tablePage: provision.tablePage,
  selectedRow: provision.selectedRow,
  tableSearch: provision.tableSearch,
  group: user.group,
  groups: user.groups,
  devStates: provision.states,
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount',
  geoProvisionLoading: provision.geoProvisionLoading,
  geotabGroupVehicleId: provision.geotabGroupVehicleId,
  showAdvanceTool: location.showAdvanceTool,
  tableOrderByCollection: provision.tableOrderByCollection
});

const mapDispatch = ({
  dashboard: { getAllFacilityDevicesAction, getMetricsPerDeviceAction },
  provision: {
    updateDeviceDataAction,
    updateMultipleDevicesAction,
    setTablePageAction,
    setSelectedRowAction,
    setSelectedDeviceListAction,
    getConfigAction,
    getLocatorConfigAction,
    setTableSearchAction,
    provisionToMyAdminAction,
    relinkSerialNoAction,
    getGeotabGroupVehicleIdAction,
    getDeviceStatesAction,
    setTableOrderByCollectionAction
  },
  location: { renderComponentAction },
  notifications: { setNoteAction }
}) => ({
  getAllFacilityDevices: getAllFacilityDevicesAction,
  updateDeviceData: updateDeviceDataAction,
  updateMultipleDevices: updateMultipleDevicesAction,
  getMetricsPerDevice: getMetricsPerDeviceAction,
  setTableSearch: setTableSearchAction,
  renderComponent: renderComponentAction,
  setTablePage: setTablePageAction,
  setSelectedRow: setSelectedRowAction,
  setSelectedDeviceList: setSelectedDeviceListAction,
  getConfig: getConfigAction,
  getLocatorConfig: getLocatorConfigAction,
  provisionToMyAdmin: provisionToMyAdminAction,
  relinkSerialNo: relinkSerialNoAction,
  getDevices: getDeviceStatesAction,
  setNote: setNoteAction,
  getGeotabGroupVehicleId: getGeotabGroupVehicleIdAction,
  setTableOrderByCollection: setTableOrderByCollectionAction
});

export default connect(mapStateToProps, mapDispatch)(ProvisionTable);
