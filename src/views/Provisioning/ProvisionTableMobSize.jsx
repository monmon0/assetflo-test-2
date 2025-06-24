import React, { useEffect, useState, createRef } from 'react';
import {
  List,
  ListItem,
  Divider,
  IconButton,
  TextField,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
  CircularProgress,
  Box,
  Checkbox,
  Chip,
  Input,
  Tooltip,
  Badge
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Fuse from 'fuse.js';
import { connect } from 'react-redux';
import moment from 'moment';
import arraySort from 'array-sort';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import AddBoxIcon from '@mui/icons-material/AddBox';
import RemoveIcon from '@mui/icons-material/Remove';
import SendIcon from '@mui/icons-material/Send';
import { Switch, withStyles } from '@mui/material';
import ReactDOM from 'react-dom';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import variables from '../../variables.json';
import { hasAccess } from '../../util/hasAccess';
import LocationOffIcon from '@mui/icons-material/LocationOff';
import MapIcon from '@mui/icons-material/Map';
import { filterByGroup } from '../../util/filters';
import { flattenLatLng } from '../../util/format';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CustomSwitch from '../Common/CustomSwitch';
import LabelIcon from '@mui/icons-material/Label';

import { transformDevice } from '../../util/transformer';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

const PREFIX = 'ProvisionTableMobSize';

const classes = {
  root: `${PREFIX}-select`,
  addForm: `${PREFIX}-addForm`,
  inline: `${PREFIX}-inline`,
  searchBar: `${PREFIX}-searchBar`,
  organizationInput: `${PREFIX}-organizationInput`,
  title: `${PREFIX}-title`,
  bodyValue: `${PREFIX}-bodyValue`,
  iconColor: `${PREFIX}-iconColor`,
  formControl: `${PREFIX}-formControl`,
  searchSortStyle: `${PREFIX}-searchSortStyle`,
  searchTopBox: `${PREFIX}-searchTopBox`,
  searchBottomBox: `${PREFIX}-searchBottomBox`,
  grayItemBackground: `${PREFIX}-grayItemBackground`,
  whiteItemBackgrund: `${PREFIX}-whiteItemBackgrund`,
  addIcon: `${PREFIX}-addIcon`,
  organizationInputForm: `${PREFIX}-organizationInputForm`,
  orgnizationSubmitIcon: `${PREFIX}-orgnizationSubmitIcon`,
  checkBoxStyle: `${PREFIX}-checkBoxStyle`,
  deviceDataField: `${PREFIX}-deviceDataField`,
  sortIcon: `${PREFIX}-sortIcon`
};

const Root = styled('div')(({ theme, ...props }) => ({
  [`& .${classes.root}`]: {
    height: '67vh',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflowX: 'hidden',
    margin: '5px',
    boxShadow: '0 4px 8px 0 rgba(0,0,0,0.07)',
    backgroundColor: theme.palette.background.paper,
    scrollBehavior: 'smooth'
  },
  [`& .${classes.addForm}`]: {
    margin: '5px',
    backgroundColor: theme.palette.background.paper
  },
  [`& .${classes.inline}`]: {
    display: 'inline'
  },
  [`& .${classes.searchBar}`]: { marginTop: '8px', width: '100px' },
  [`& .${classes.organizationInput}`]: { marginTop: '8px', width: '100px' },
  [`& .${classes.title}`]: {
    color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
    fontWeight: 'bold',
    margin: '0 2px'
  },
  [`& .${classes.bodyValue}`]: {
    color: variables.DARK_GRAY_COLOR,
    marginLeft: '2px',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden'
  },
  [`& .${classes.iconColor}`]: {
    color: variables.DARK_GRAY_COLOR,
    marginTop: '45px'
  },
  [`& .${classes.formControl}`]: {
    margin: theme.spacing(1),
    minWidth: 120
  },
  [`& .${classes.searchSortStyle}`]: {
    display: 'flex',
    flexDirection: 'column',
    background: '#fff',
    margin: '5px',
    boxShadow: '0 4px 8px 0 rgba(0,0,0,0.15)'
  },
  [`& .${classes.searchTopBox}`]: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  [`& .${classes.searchBottomBox}`]: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  [`& .${classes.sortIcon}`]: {
    marginTop: '25px',
    color: variables.DARK_GRAY_COLOR,
    cursor: 'pointer'
  },
  [`& .${classes.grayItemBackground}`]: {
    background: '#E4E5E6',
    cursor: 'pointer'
  },
  [`& .${classes.whiteItemBackgrund}`]: {
    background: '#FFF',
    cursor: 'pointer'
  },
  [`& .${classes.addIcon}`]: {
    marginTop: '35px',
    marginRight: '5px',
    color: variables.DARK_GRAY_COLOR,
    cursor: 'pointer'
  },
  [`& .${classes.organizationInputForm}`]: {
    display: 'flex',
    margin: '5px 30px 0 0',
    alignItems: 'center'
  },
  [`& .${classes.orgnizationSubmitIcon}`]: {
    color: variables.DARK_GRAY_COLOR,
    marginRight: '5px',
    cursor: 'pointer'
  },
  [`& .${classes.checkBoxStyle}`]: {
    marginTop: '45px'
  },
  [`& .${classes.deviceDataField}`]: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
    display: 'flex'
  }
}));

function ProvisionTableMobSize(props) {
  // Filters
  const [sortBy, setSortBy] = React.useState(props.tableSearch?.sortBy || '');
  const [sort, setSort] = React.useState(props.tableSearch?.sort || 'asc');
  const [searchString, setSearchString] = useState(props.tableSearch?.searchString || '');

  const [checkedConfigList, setCheckedConfigList] = useState({});
  const [assetTypeModal, setAssetTypeModal] = useState({ open: false, rowData: null });

  let listRef = createRef();

  useEffect(() => {
    let credentials = {
      database: props.database
    };
    // props.getAllFacilityDevices(credentials);
    props.getDevices();
    props.getGeotabDevices({ groups: ['GroupVehicleId'] });
    // if (props.database === "assetflo") payload.database = "";
  }, []);

  const handleSortBy = (event) => {
    setSortBy(event.target.value);
  };

  let result;
  let devicesList = [];
  if (
    props &&
    (props.provisionType === 'Tag' || props.provisionType === 'Locator' || props.provisionType === 'Ancher') &&
    props.devStates &&
    props.devStates.length > 0
  ) {
    // console.log(props.allFacilityDevices);
    devicesList = props.devStates.filter((device) => device.deviceType && device.deviceType === props.provisionType);
  } else if (
    props &&
    props.provisionType === 'Provision' &&
    props.provisionDevices &&
    props.provisionDevices.length > 0
  ) {
    devicesList = props && props.provisionDevices;
  }

  // filtering by groups
  if (props.groupFilter.length > 0) {
    devicesList = filterByGroup(devicesList, props.groupFilter);
  }
  if (searchString.trim() !== '') {
    let options = {
      shouldSort: true,
      threshold: 0.1,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: ['assetName', 'deviceId']
    };
    let fuse = new Fuse(devicesList, options);
    result = fuse.search(searchString);
    devicesList = result;
  }

  switch (sortBy) {
    case 'Asset name':
      devicesList = arraySort(devicesList, 'assetName', {
        reverse: sort === 'asc' ? false : true
      });
      break;
    case 'MAC':
      devicesList = arraySort(devicesList, 'deviceId', {
        reverse: sort === 'asc' ? false : true
      });
      break;
    case 'Active since':
      devicesList = arraySort(devicesList, 'createdAt', {
        reverse: sort === 'asc' ? false : true
      });
      break;

    default:
      break;
  }

  function handleSearchChange(e) {
    e.preventDefault();
    setSearchString(e.target.value);
  }

  const [selected, setSelected] = useState({});

  function handleSelectedListItem(item) {
    setSelected(item);
  }

  const [edit, setEdit] = useState(false);
  const [deleteItem, setDeleteItem] = useState(false);
  const [editedDevice, setEditedDevice] = useState({});

  const validateMac = (mac) => {
    const reg = new RegExp('^[A-Fa-f0-9]+$');
    return reg.test(mac);
  };

  const validateNumber = (num) => {
    const reg = new RegExp('^-?[0-9]*[.]?[0-9]+$');
    return reg.test(num);
  };

  function isValidLocation(device) {
    if (props.provisionType === 'Tag' && !editedDevice.isAnchor) return true;
    if (
      props.provisionType === 'Locator' ||
      props.provisionType === 'Ancher' ||
      (props.provisionType === 'Tag' && editedDevice.isAnchor)
    ) {
      if (!editedDevice.location && !device.location) {
        props.setNote({ message: 'Location is required' });
        return false;
      }
      if (
        editedDevice.location.lat === undefined ||
        !validateNumber(editedDevice.location.lat) ||
        Number(editedDevice.location.lat) < -90 ||
        Number(editedDevice.location.lat) > 90
      ) {
        props.setNote({ message: 'Invalid latitude' });
        return false;
      } else if (
        editedDevice.location.lng === undefined ||
        !validateNumber(editedDevice.location.lng) ||
        Number(editedDevice.location.lng) < -180 ||
        Number(editedDevice.location.lng) > 180
      ) {
        props.setNote({ message: 'Invalid longtitude' });
        return false;
      } else if (editedDevice.location.alt === undefined || !validateNumber(editedDevice.location.alt)) {
        props.setNote({ message: 'Invalid altitude' });
        return false;
      }
    }
    return true;
  }

  function handleSubmitEdit(device) {
    // console.log(device);
    // console.log('editedDevice', editedDevice);
    if (!isValidLocation(device)) return;

    let payload = {
      deviceId: editedDevice.deviceId ? editedDevice.deviceId.trim() : device.deviceId,
      organization: props.database
      // uuid: editedDevice.deviceId ? editedDevice.deviceId.trim() : device.deviceId
    };
    payload.assetName = editedDevice.assetName.trim() || device.assetName;
    payload.groups = editedDevice.groups.length === 0 ? device.groups : editedDevice.groups;
    payload.createdAt = device.createdAt;
    payload.deviceType = device.deviceType;
    payload.status = device.status;

    if (
      props.provisionType === 'Locator' ||
      props.provisionType === 'Ancher' ||
      (props.provisionType === 'Tag' && editedDevice.isAnchor)
    ) {
      payload.location = editedDevice.location || device.location;
      payload.location.alt = 1;
    }
    // console.log('payload.location', payload.location);
    payload.database = props.database;
    payload.protocol = (editedDevice && editedDevice.protocol) || device.protocol;
    if (device.configurationId) {
      payload.configurationId = device.configurationId;
    }
    if (props.provisionType === 'Provision') {
      payload.isProvisioned = editedDevice.isProvisioned;
      payload.database = props.database === 'assetflo' ? '' : props.database;
      payload.organization = editedDevice.organization || device.organization;
      payload.deviceType = editedDevice.deviceType || device.deviceType;
      payload.status = 'Active';
      // console.log(payload);
      props.updateProvisionDevice(payload);
    } else {
      delete payload.createdAt;
      console.log('payload', payload);

      props.updateDeviceData(payload);
      if (payload.deviceType === 'Locator') props.getLocators();
    }
    setEdit(false);
    setEditedDevice({});
  }

  const [addDevice, setAddDevice] = useState(false);

  function handleAddDevice() {
    setAddDevice(!addDevice);
  }

  const renderSwitcher = (item) => {
    return (
      <CustomSwitch
        checked={editedDevice.isProvisioned}
        onChange={(e) => {
          setEditedDevice({
            ...editedDevice,
            isProvisioned: e.currentTarget.checked
          });
        }}
        name="checkedIsProvisioned"
      />
    );
  };

  function handleEditItem(item) {
    return (
      <form
        key={item.deviceId}
        // className={classes.root}
        noValidate
        autoComplete="off"
        style={{ maxWidth: '100%', overflow: 'hidden' }}
      >
        <ListItem alignItems="flex-start">
          <div style={{ maxWidth: '20%' }}>
            <IconButton
              className={classes.iconColor}
              size="small"
              color="primary"
              aria-label="upload picture"
              component="span"
              onClick={() => handleSubmitEdit(item)}
            >
              <CheckIcon />
            </IconButton>
            <IconButton
              className={classes.iconColor}
              size="small"
              color="primary"
              aria-label="upload picture"
              component="span"
              onClick={() => {
                setEdit(false);
                setEditedDevice({});
              }}
            >
              <CancelIcon />
            </IconButton>
          </div>

          <Box style={{ maxWidth: '80%' }}>
            {props.provisionType !== 'Provision' && (
              <Box display="flex" alignItems="center">
                <span className={classes.title}>Asset Name:</span>
                <TextField
                  required
                  id={item.assetName}
                  defaultValue={item.assetName}
                  onChange={(e) =>
                    setEditedDevice({
                      ...editedDevice,
                      assetName: e.target.value
                    })
                  }
                />
              </Box>
            )}
            <Box>
              <span className={classes.title}>MAC:</span>
              <span className={classes.bodyValue}>{item.deviceId}</span>
            </Box>
            {props.provisionType !== 'Provision' && (
              <Box display="flex" alignItems="center">
                <span className={classes.title}>Groups:</span>
                <FormControl style={{ maxWidth: '80%', overflow: 'hidden' }}>
                  <Select
                    multiple
                    value={Array.isArray(editedDevice.groups) ? editedDevice.groups : [editedDevice.groups]}
                    onChange={(e) => {
                      setEditedDevice({
                        ...editedDevice,
                        groups: e.target.value
                      });
                    }}
                    input={<Input />}
                  >
                    {props.groupObjects &&
                      props.groupObjects.map((group) => (
                        <MenuItem key={group._id} value={group.groupId}>
                          {group.name || group.groupId}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Box>
            )}
            {props.provisionType === 'Provision' && (
              <Box display="flex" alignItems="center">
                <span className={classes.title}>Type:</span>
                <TextField
                  id={item.deviceId}
                  select
                  defaultValue={item.deviceType}
                  onChange={(e) =>
                    setEditedDevice({
                      ...editedDevice,
                      deviceType: e.target.value,
                      ...(props.provisionType === 'Provision' && {
                        protocol: e.target.value === 'Tag' ? 'BLE' : 'WIFI'
                      })
                    })
                  }
                >
                  <MenuItem key={'Tag'} value={'Tag'}>
                    Tag
                  </MenuItem>
                  <MenuItem key={'Locator'} value="Locator">
                    Locator
                  </MenuItem>
                </TextField>
              </Box>
            )}
            {props.provisionType === 'Provision' ? (
              <Box display="flex" alignItems="center">
                <span className={classes.title}>Protocol:</span>
                <TextField
                  select
                  value={(editedDevice && editedDevice.protocol) || (item && item.protocol)}
                  onChange={(e) =>
                    setEditedDevice({
                      ...editedDevice,
                      protocol: e.target.value
                    })
                  }
                >
                  {editedDevice && editedDevice.deviceType && editedDevice.deviceType === 'Locator'
                    ? ['WIFI', 'LTE'].map((val) => {
                        return (
                          <MenuItem key={val} value={val}>
                            {val}
                          </MenuItem>
                        );
                      })
                    : ['BLE', 'LTE'].map((val) => {
                        return (
                          <MenuItem key={val} value={val}>
                            {val}
                          </MenuItem>
                        );
                      })}
                </TextField>
              </Box>
            ) : (
              <Box>
                <span className={classes.title}>Protocol:</span>
                <span className={classes.bodyValue}>{item.protocol}</span>
              </Box>
            )}

            {props.provisionType === 'Provision' && (
              <Box display="flex" alignItems="center">
                <span className={classes.title}>Organization:</span>
                <Select
                  // labelId="demo-simple-select-label"
                  // id="organization-select"
                  defaultValue={item.organization}
                  onChange={(e) => {
                    setEditedDevice({
                      ...editedDevice,
                      organization: e.target.value
                    });
                  }}
                >
                  {props.allTenants &&
                    props.allTenants.map((tenant) => (
                      <MenuItem key={tenant.organization} value={tenant.organization}>
                        {tenant.organization}
                      </MenuItem>
                    ))}
                </Select>
              </Box>
            )}
            {props.provisionType === 'Provision' && (
              <Box display="flex" alignItems="center">
                <span className={classes.title}>Provisioned:</span>
                {renderSwitcher(item)}
              </Box>
            )}

            {props.provisionType === 'Locator' && (
              <>
                <Box display="flex" alignItems="center">
                  <span className={classes.title}>Lat:</span>
                  {/* <span className={classes.bodyValue}>
                  {item.location && item.location.lat}
                </span> */}
                  <TextField
                    required
                    defaultValue={item.location && item.location.lat}
                    onChange={(e) =>
                      setEditedDevice({
                        ...editedDevice,
                        location: {
                          ...editedDevice.location,
                          lat: e.target.value
                        }
                      })
                    }
                  />
                </Box>
                <Box display="flex" alignItems="center">
                  <span className={classes.title}>Lng:</span>
                  <TextField
                    required
                    defaultValue={item.location && item.location.lng}
                    onChange={(e) =>
                      setEditedDevice({
                        ...editedDevice,
                        location: {
                          ...editedDevice.location,
                          lng: e.target.value
                        }
                      })
                    }
                  />
                </Box>
              </>
            )}
          </Box>
        </ListItem>
        <Divider />
      </form>
    );
  }

  function handleDeleteItem(item) {
    return (
      <div key={item.deviceId}>
        <ListItem alignItems="center">
          <div>
            <IconButton
              className={classes.iconColor}
              style={{ margin: '45px 0' }}
              size="small"
              color="primary"
              aria-label="upload picture"
              component="span"
              onClick={() => handleDeleteDeviceData(item)}
            >
              <CheckIcon />
            </IconButton>
            <IconButton
              className={classes.iconColor}
              style={{ margin: '45px 0' }}
              size="small"
              color="primary"
              aria-label="upload picture"
              component="span"
              onClick={() => {
                setDeleteItem(false);
              }}
            >
              <CancelIcon />
            </IconButton>
          </div>

          <Box>
            <span className={classes.title}>Delete this item?</span>
          </Box>
        </ListItem>
        <Divider />
      </div>
    );
  }

  const handleSubmitAddNewDevice = () => {
    console.log(editedDevice.deviceId.trim().length);
    if (
      // !editedDevice.assetName ||
      !editedDevice.deviceId ||
      // !editedDevice.deviceType ||
      // editedDevice.assetName.trim() === '' ||
      editedDevice.deviceId.trim() === ''
    ) {
      props.setNote({ message: 'MAC is required' });
      return;
    } else if (!validateMac(editedDevice.deviceId)) {
      props.setNote({ message: 'Invalid MAC' });
      return;
    } else if (editedDevice.deviceId && editedDevice.deviceId.trim().length !== 12) {
      props.setNote({ message: 'MAC must be 12 characters' });
      return;
    }
    let payload = {
      // assetName: editedDevice.assetName.trim() || '',
      deviceId: editedDevice.deviceId.trim() || '',
      deviceType: editedDevice.deviceType || 'Tag',
      organization: editedDevice.organization ? editedDevice.organization : 'assetflo'
      // uuid: editedDevice.deviceId.trim() || '',
      // status: 'New'
    };
    // let isProvisioned = payload.organization === 'assetflo' ? false : true;
    let isProvisioned = editedDevice.isProvisioned || false;
    let status = isProvisioned ? 'Active' : 'New';
    payload.isProvisioned = isProvisioned;
    payload.status = status;
    payload.protocol = editedDevice.protocol || (payload.deviceType === 'Tag' ? 'BLE' : 'WIFI');

    console.log(payload);

    props.updateProvisionDevice(payload);

    setAddDevice(false);
    setEditedDevice({});
  };

  function handleAddItem() {
    return (
      <form className={classes.addForm} noValidate autoComplete="off">
        <ListItem alignItems="flex-start">
          <div>
            <IconButton
              className={classes.iconColor}
              size="small"
              color="primary"
              aria-label="update-add"
              component="span"
              onClick={() => {
                handleSubmitAddNewDevice();
              }}
            >
              <CheckIcon />
            </IconButton>
            <IconButton
              className={classes.iconColor}
              size="small"
              color="primary"
              aria-label="cancel"
              component="span"
              onClick={() => {
                setAddDevice(false);
                setEditedDevice({});
              }}
            >
              <CancelIcon />
            </IconButton>
          </div>

          <Box>
            {/* <Box display="flex" alignItems="center">
              <span className={classes.title}>Asset Name:</span>
              <TextField
                required
                // id={item.assetName}
                // defaultValue={item.assetName}
                onChange={(e) =>
                  setEditedDevice({
                    ...editedDevice,
                    assetName: e.target.value
                  })
                }
              />
            </Box> */}
            <Box display="flex" alignItems="center">
              <span className={classes.title}>MAC:</span>
              <TextField
                required
                onChange={(e) =>
                  setEditedDevice({
                    ...editedDevice,
                    deviceId: e.target.value
                  })
                }
              />
            </Box>
            <Box display="flex" alignItems="center">
              <span className={classes.title}>Type:</span>
              <TextField
                select
                defaultValue={'Tag'}
                onChange={(e) =>
                  setEditedDevice({
                    ...editedDevice,
                    deviceType: e.target.value,
                    protocol: e.target.value === 'Tag' ? 'BLE' : 'WIFI'
                  })
                }
              >
                <MenuItem key={'Tag'} value={'Tag'}>
                  Tag
                </MenuItem>
                <MenuItem key={'Locator'} value="Locator">
                  Locator
                </MenuItem>
              </TextField>
            </Box>
            <Box display="flex" alignItems="center">
              <span className={classes.title}>Protocol:</span>
              <TextField
                select
                value={(editedDevice && editedDevice.protocol) || 'BLE'}
                onChange={(e) =>
                  setEditedDevice({
                    ...editedDevice,
                    protocol: e.target.value
                  })
                }
              >
                {editedDevice && editedDevice.deviceType && editedDevice.deviceType === 'Locator'
                  ? ['WIFI', 'LTE'].map((val) => {
                      return (
                        <MenuItem key={val} value={val}>
                          {val}
                        </MenuItem>
                      );
                    })
                  : ['BLE', 'LTE'].map((val) => {
                      return (
                        <MenuItem key={val} value={val}>
                          {val}
                        </MenuItem>
                      );
                    })}
              </TextField>
            </Box>
            <Box display="flex" alignItems="center">
              <span className={classes.title}>Organization:</span>
              <Select
                defaultValue={props.allTenants[0].organization}
                onChange={(e) => {
                  console.log(e.target.value);
                  setEditedDevice({
                    ...editedDevice,
                    organization: e.target.value
                  });
                }}
                name="selectOrganization"
              >
                {props.allTenants &&
                  props.allTenants.map((tenant) => (
                    <MenuItem key={tenant.organization} value={tenant.organization}>
                      {tenant.organization}
                    </MenuItem>
                  ))}
              </Select>
            </Box>
            <Box display="flex" alignItems="center">
              <span className={classes.title}>Provisioned:</span>
              {renderSwitcher()}
            </Box>
            {/* 
            <Box>
              <span className={classes.title}>Status:</span>
              <TextField
                // id={item.deviceId}
                select
                // value={item.deviceId}
                onChange={(e) =>
                  setEditedDevice({
                    ...editedDevice,
                    status: e.target.value,
                  })
                }
              >
                <MenuItem key={"New"} value={"New"}>
                  New
                </MenuItem>
                <MenuItem key={"Active"} value="Active">
                  Active
                </MenuItem>
              </TextField>
            </Box> */}
          </Box>
        </ListItem>
        <Divider />
      </form>
    );
  }

  const handleChange = (event, device) => {
    props.checkSelected({ device, checkSelected: event.target.checked });
  };

  const [organizationInput, setOrganizationInput] = useState('assetflo');

  const handleOrganizationChange = (e) => {
    setOrganizationInput(e.target.value);
  };

  const handleAssignOrganization = () => {
    // if (organizationInput.length === 0) return;
    let updatedCheckedList = props.checkedDevicesList.map((device) => {
      delete device.createdAt;
      device.isProvisioned = true;
      device.status = 'Active';
      return device;
    });

    let payload = {
      organization: organizationInput,
      devices: updatedCheckedList
    };
    props.assignOrganization(payload);
    setOrganizationInput('assetflo');
    // setSearchResult([]);
  };

  function handleDeleteDeviceData(device) {
    // console.log("mobsize delete device",device);
    delete device._id;
    delete device.createdAt;
    let payload = {
      device,
      database: props.database
    };
    // console.log("mobsize delete device",payload);
    props.deleteDeviceData(payload);
    setDeleteItem(false);
  }

  const [displayDevice, setDisplayDevice] = React.useState('');

  const handleOpenConfig = (rowData) => {
    setDisplayDevice(rowData);
    props.setSelectedRow(rowData);

    // get configuration
    if (rowData.deviceType === 'Tag') {
      getConfigurationForTag(rowData);
    } else {
      getConfigurationForLocator(rowData);
    }

    // Save Search string, sort by and sort order
    props.setTableSearch({
      searchString: searchString || '',
      sortBy: sortBy || '',
      sort: sort || 'asc'
    });

    props.renderComponent('configuration');
  };

  // Clear search string on component mount
  useEffect(() => {
    props.setTableSearch('');
  }, []);

  const handleOpenAlerts = (rowData) => {
    setDisplayDevice(rowData);

    props.setSelectedRow(rowData);
    props.getDeviceState({ deviceId: rowData.deviceId });
    props.getDistributionList();

    props.renderComponent('rules');
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

  const calculateSelectedConfig = () => {
    let length = 0;
    for (let key in checkedConfigList) {
      if (checkedConfigList[key] === true) ++length;
    }
    return length;
  };

  const handleOpenConfigForMultiple = () => {
    props.renderComponent('configuration');
  };

  const renderSortByFiled = () => {
    return (
      <>
        <FormControl className={classes.formControl}>
          <InputLabel>Sort by</InputLabel>
          <Select
            // labelId="demo-simple-select-label"
            // id="demo-simple-select"
            value={sortBy}
            onChange={handleSortBy}
          >
            <MenuItem value={'MAC'}>MAC</MenuItem>
            <MenuItem value={'Active since'}>Active since</MenuItem>
          </Select>
        </FormControl>
        <Box className={classes.sortIcon}>
          {sort === 'asc' ? (
            <ArrowUpwardIcon onClick={() => setSort('des')} />
          ) : (
            <ArrowDownwardIcon onClick={() => setSort('asc')} />
          )}
        </Box>
      </>
    );
  };

  const renderOrganizationSelerctor = () => {
    return (
      <Box className={classes.organizationInputForm}>
        <Box>
          <SendIcon
            className={classes.orgnizationSubmitIcon}
            onClick={() => {
              handleAssignOrganization();
            }}
          />
        </Box>

        <Select
          // labelId="demo-simple-select-label"
          id="organization-select"
          defaultValue={'assetflo'}
          onChange={(e) => handleOrganizationChange(e)}
        >
          {props.allTenants &&
            props.allTenants.map((tenant) => (
              <MenuItem key={tenant.organization} value={tenant.organization}>
                {tenant.organization}
              </MenuItem>
            ))}
        </Select>
      </Box>
    );
  };

  const renderAssignConfigurationToMultiDevice = () => {
    return (
      <Box
        style={{
          display: 'inline-flex',
          margin: '5px 0'
        }}
        onClick={() => {
          handleOpenConfigForMultiple();
          setDisplayDevice('');
        }}
      >
        <Chip
          size="small"
          style={{
            display: 'inline-flex',
            margin: '5px',
            backgroundColor: 'green',
            color: variables.WHITE_COLOR
          }}
          label={'Edit selected devices configuration'}
          onClick={() => {
            setDisplayDevice('');
          }}
          disabled
        />
      </Box>
    );
  };

  const renderIsProvisioned = (device) => {
    if (device.isProvisioned) {
      return <CheckIcon />;
    } else {
      return <RemoveIcon />;
    }
  };

  const handleAttachBLEDevices = (rowData) => {
    // Get all attached BLE devices
    const attachedBLEDevices = props.devStates.filter(
      (device) => device.attachedState && device.attachedState.attachedTo === rowData.deviceId
    );

    // Update the selected row with the attached BLE devices
    const updatedRowData = {
      ...rowData,
      attachedTags: attachedBLEDevices || []
    };

    // setAttachDevicesModal({ open: true, rowData: updatedRowData });

    // Save Search string, sort by and sort order
    props.setTableSearch({
      searchString: searchString || '',
      sortBy: sortBy || '',
      sort: sort || 'asc'
    });

    // Set the selected row and render the AddDeviceToTrailer component
    props.setSelectedRow(updatedRowData);
    props.renderComponent('AssignBLETags');
  };

  async function handleUpdateData(newData, oldData) {
    const updatedDeviceData = {
      ...newData,
      groups: newData.groups && newData.groups.length === 0 ? oldData.groups || ['GroupCompanyId'] : newData.groups
    };
    const updates = transformDevice(updatedDeviceData, updatedDeviceData);

    console.log('updates', updates);
    await props.updateDeviceData(updates);
    if (newData.deviceType === 'Locator') await props.getLocators();
    return;
  }

  const renderAttachedTo = (device) => {
    const attached = device.attachedState?.configured ? device.attachedState.attachedTo : null;
    const idParts = attached?.split('.') || [];
    const id = idParts.pop() || attached;

    const attachedTo = idParts.length === 1 ? props.geotabDevices?.find((dev) => dev.id === id)?.name || null : id;

    const position = device.attachedState?.position;

    return (
      <Tooltip title={attachedTo ? `Attached to ${attachedTo}` : ''}>
        <Chip
          size="small"
          style={{
            backgroundColor: variables.LIGHT_GREEN_COLOR,
            color: variables.WHITE_COLOR,
            paddingLeft: '8px',
            borderRadius: '10px',
            lineHeight: 'normal'
          }}
          label={position}
          icon={<LabelIcon style={{ color: variables.WHITE_COLOR }} />}
          aria-controls="asset-type-menu"
          aria-haspopup="true"
          onDelete={() => {
            const oldData = device;
            const updatedData = {
              ...oldData,
              assetName: `${oldData.assetName}`,
              isAnchor: false,
              fixAsset: false,
              ...(oldData.attachedState?.configured && {
                attachedState: {
                  configured: false,
                  state: 'Detached',
                  time: moment().valueOf(),
                  correctionRssi: variables.DEFAULT_RSSI,
                  rssi: variables.DEFAULT_RSSI,
                  attachedTo: null
                }
              })
            };
            props.setSelectedRow(device);
            handleUpdateData(updatedData, oldData);
          }}
        />
      </Tooltip>
    );
  };

  const render5gAttachButton = (device) => {
    const fixedAsset = device.fixAsset || device.isAnchor;
    const attachedDevices = props.devStates
      .filter(
        (dev) =>
          (dev.protocol === 'BLE' || dev.protocol === 'OTS.BLE') && dev.attachedState?.attachedTo === device.deviceId
      )
      .map((device) => ({
        id: device.deviceId,
        position: device.attachedState.position
      }));

    const tooltipContent =
      attachedDevices.length > 0 ? (
        <div>
          <ul style={{ padding: 0, margin: 0 }}>
            {attachedDevices.slice(0, 5).map((device, index) => (
              <li key={index} style={{ padding: '4px 0', listStyle: 'none' }}>
                {device.id} - {device.position}
              </li>
            ))}
            {attachedDevices.length > 5 && (
              <li style={{ padding: '4px 0', listStyle: 'none' }}>... and {attachedDevices.length - 5} more</li>
            )}
          </ul>
        </div>
      ) : (
        'Attach devices to this 5G device'
      );

    return (
      <Tooltip title={!fixedAsset ? tooltipContent : ''}>
        <Chip
          size="small"
          style={{
            backgroundColor: fixedAsset ? variables.DISABLED_GRAY_COLOR : variables.LIGHT_GREEN_COLOR,
            color: variables.WHITE_COLOR,
            padding: '10px',
            borderRadius: '10px',
            fontSize: 'inherit'
          }}
          icon={<LocalShippingIcon style={{ color: 'white' }} />}
          label={attachedDevices.length || '+'}
          onClick={(e) => {
            if (
              !hasAccess(props.userPermissions, variables.ALL_DEVICES_FEATURE, props.role, props.database, props.group)
            )
              return;
            handleAttachBLEDevices(device);
          }}
          // deleteIcon={<AddBoxIcon style={{ color: 'white' }} />}
          // onDelete={(e) => {
          //   if (
          //     !hasAccess(
          //       props.userPermissions,
          //       variables.ALL_DEVICES_FEATURE,
          //       props.role,
          //       props.database,
          //       props.group
          //     )
          //   )
          //     return;
          //   handleAttachBLEDevices(device);
          // }}
        />
      </Tooltip>
    );
  };

  return (
    <Root style={{ width: '100%' }}>
      <Box className={classes.searchSortStyle}>
        <Box className={classes.searchTopBox}>
          {/* provision new deivce */}
          {props.provisionType === 'Provision' && (
            <IconButton onClick={handleAddDevice} style={{ padding: '0 20px', marginTop: '20px' }}>
              <AddBoxIcon />
            </IconButton>
          )}
          {/* search input */}
          <TextField
            className={classes.searchBar}
            // id="standard-basic"
            value={searchString}
            label="Search"
            onChange={(e) => handleSearchChange(e)}
          />
          {renderSortByFiled()}
        </Box>
        <Box className={classes.searchBottomBox}>
          {props.checkedDevicesList &&
            props.checkedDevicesList.length > 0 &&
            props.provisionType === 'Provision' &&
            renderOrganizationSelerctor()}
          {calculateSelectedConfig() >= 2 &&
            props.provisionType === 'Locator' &&
            renderAssignConfigurationToMultiDevice()}
        </Box>
      </Box>

      {!props.isProvisionLoading ? (
        <Box>
          {hasAccess(props.userPermissions, variables.ALL_DEVICES_FEATURE, props.role, props.database, props.group) &&
            addDevice &&
            handleAddItem()}
          <List className={classes.root} ref={listRef}>
            <div
              style={{
                position: 'fixed',
                width: 'auto',
                height: 'auto',
                right: '10px',
                bottom: '120px',
                zIndex: '99'
              }}
            >
              <IconButton
                className={classes.iconColor}
                size="small"
                color="primary"
                component="button"
                onClick={() => {
                  ReactDOM.findDOMNode(listRef.current).scrollTo(0, 0);
                }}
              >
                <ArrowUpwardIcon />
              </IconButton>
            </div>
            {devicesList &&
              devicesList.map((device) => {
                if (edit && selected.deviceId === device.deviceId) {
                  return handleEditItem(device);
                } else if (deleteItem && selected.deviceId === device.deviceId) {
                  return handleDeleteItem(device);
                } else {
                  const batterylevel = device?.telemetry?.batterylevel
                    ? device?.telemetry?.batterylevel > 100
                      ? 100 + '%'
                      : device?.telemetry?.batterylevel + '%'
                    : device?.protocol == 'IOX'
                    ? 'N/A'
                    : 'Unknown';

                  const lastSeen = device?.lastSeen ? moment(device.lastSeen).startOf('minute').fromNow(true) : 'N/A';
                  const firmwareList = device?.firmware || [];
                  const firmware = firmwareList.find((fw) => fw && fw.protocol === device?.protocol);
                  let fwVersion = 'Unknown';
                  if (firmware && (firmware?.version > device?.fwVersion || !device?.fwVersion))
                    fwVersion = firmware.version + ' pending';
                  else if (firmware && firmware?.version == device?.fwVersion) fwVersion = firmware.version;
                  else if (!firmware && device?.fwVersion) fwVersion = device?.fwVersion;

                  return (
                    !device.archived && (
                      <div
                        id={device.deviceId}
                        className={
                          device.deviceId === selected.deviceId
                            ? classes.grayItemBackground
                            : classes.whiteItemBackgrund
                        }
                        onClick={() => handleSelectedListItem(device)}
                        key={device.deviceId}
                      >
                        <ListItem alignItems="flex-start">
                          <div style={{ display: 'flex', width: props.provisionType === 'Tag' ? '20%' : '30%' }}>
                            {hasAccess(
                              props.userPermissions,
                              variables.ALL_PROVISION_FEATURE,
                              props.role,
                              props.database,
                              props.group
                            ) &&
                              props.provisionType === 'Provision' && (
                                <Checkbox
                                  className={classes.checkBoxStyle}
                                  size="small"
                                  checked={device.checkSelected || false}
                                  onChange={(e) => handleChange(e, device)}
                                  inputProps={{
                                    'aria-label': 'uncontrolled-checkbox'
                                  }}
                                />
                              )}
                            {hasAccess(
                              props.userPermissions,
                              variables.ALL_DEVICES_FEATURE,
                              props.role,
                              props.database,
                              props.group
                            ) &&
                              props.provisionType === 'Locator' && (
                                <Checkbox
                                  className={classes.checkBoxStyle}
                                  size="small"
                                  checked={checkedConfigList[device.deviceId] || false}
                                  onChange={(e) => {
                                    setCheckedConfigList({
                                      ...checkedConfigList,
                                      [device.deviceId]: e.target.checked
                                    });
                                    props.setSelectedDeviceList([...props.deviceList, device]);
                                  }}
                                  inputProps={{
                                    'aria-label': 'uncontrolled-checkbox'
                                  }}
                                />
                              )}
                            {hasAccess(
                              props.userPermissions,
                              variables.ALL_DEVICES_FEATURE,
                              props.role,
                              props.database,
                              props.group
                            ) && (
                              <IconButton
                                className={classes.iconColor}
                                size="small"
                                color="primary"
                                component="span"
                                disabled={!!device.serialNo}
                                onClick={() => {
                                  setEdit(true);
                                  setEditedDevice(device);
                                  handleEditItem(device);
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                            )}
                            {hasAccess(
                              props.userPermissions,
                              variables.ALL_DEVICES_FEATURE,
                              props.role,
                              props.database,
                              props.group
                            ) &&
                              props.provisionType !== 'Provision' && (
                                <IconButton
                                  className={classes.iconColor}
                                  size="small"
                                  color="primary"
                                  component="span"
                                  onClick={() => {
                                    setDeleteItem(true);
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              )}
                          </div>

                          <Box style={{ width: '70%' }}>
                            {props.provisionType !== 'Provision' && (
                              <Box className={classes.deviceDataField}>
                                <span className={classes.title}>Asset Name:</span>
                                <span className={classes.bodyValue}>{device.assetName}</span>
                              </Box>
                            )}
                            <Box className={classes.deviceDataField}>
                              <span className={classes.title}>MAC:</span>
                              <span className={classes.bodyValue}>{device.deviceId}</span>
                            </Box>
                            {props.provisionType !== 'Provision' && (
                              <Box className={classes.deviceDataField}>
                                <span className={classes.title}>Group:</span>
                                <span className={classes.bodyValue}>{props.renderGroupNames(device.groups)}</span>
                              </Box>
                            )}
                            <Box className={classes.deviceDataField}>
                              <span className={classes.title}>Protocol:</span>
                              <span className={classes.bodyValue}>{device.protocol}</span>
                            </Box>
                            <Box className={classes.deviceDataField}>
                              <span className={classes.title}>Battery:</span>
                              <span className={classes.bodyValue}>{batterylevel}</span>
                            </Box>
                            <Box className={classes.deviceDataField}>
                              <span className={classes.title}>Firmware:</span>
                              <span className={classes.bodyValue}>{fwVersion}</span>
                            </Box>
                            <Box className={classes.deviceDataField}>
                              <span className={classes.title}>Last seen:</span>
                              <span className={classes.bodyValue}>{lastSeen}</span>
                            </Box>
                            {(props.provisionType === 'Locator' || props.provisionType === 'Tag') && device.serialNo && (
                              <Box className={classes.deviceDataField}>
                                <span className={classes.title}>Serial №:</span>
                                <span className={classes.bodyValue}>{device.serialNo}</span>
                              </Box>
                            )}
                            {device.isAnchor && (
                              <Box className={classes.deviceDataField}>
                                <span className={classes.title}>isAnchor:</span>
                                <span className={classes.bodyValue}>
                                  {device.isAnchor && <CheckCircleOutlineOutlinedIcon />}
                                </span>
                              </Box>
                            )}
                            {device.fixAsset && (
                              <Box className={classes.deviceDataField}>
                                <span className={classes.title}>Fixed Asset:</span>
                                <span className={classes.bodyValue}>
                                  {device.fixAsset && <CheckCircleOutlineOutlinedIcon />}
                                </span>
                              </Box>
                            )}
                            {/* Attach Devices to Trailer */}
                            {props.provisionType === 'Tag' &&
                              device.protocol === 'LTE' &&
                              !device.isAnchor &&
                              !device.fixAsset && (
                                <Box className={classes.deviceDataField}>
                                  <span className={classes.title}>Trailer Attachments: </span>
                                  <span className={classes.bodyValue}>{render5gAttachButton(device)}</span>
                                </Box>
                              )}
                            {/* Attached Device (BLE or OTS.BLE) to Trailer */}
                            {props.provisionType === 'Tag' &&
                              (device.protocol === 'BLE' || device.protocol === 'OTS.BLE') &&
                              device.attachedState?.configured && (
                                <Box className={classes.deviceDataField}>
                                  <span className={classes.title}>Attached To: </span>
                                  <span className={classes.bodyValue}>{renderAttachedTo(device)}</span>
                                </Box>
                              )}
                            {(props.provisionType === 'Locator' ||
                              props.provisionType === 'Ancher' ||
                              device.isAnchor) && (
                              <Box className={classes.deviceDataField}>
                                <span className={classes.title}>Lat:</span>
                                <span className={classes.bodyValue}>
                                  {device.location &&
                                    device.location.lat &&
                                    Number.parseFloat(device.location.lat).toFixed(6)}
                                </span>
                              </Box>
                            )}
                            {(props.provisionType === 'Locator' ||
                              props.provisionType === 'Ancher' ||
                              device.isAnchor) && (
                              <Box className={classes.deviceDataField}>
                                <span className={classes.title}>Lng:</span>
                                <span className={classes.bodyValue}>
                                  {
                                    device.location &&
                                      device.location.lng &&
                                      Number.parseFloat(device.location.lng).toFixed(6)
                                    // device.location.lng.toFixed(6)
                                  }
                                </span>
                              </Box>
                            )}
                            {(props.provisionType === 'Locator' ||
                              props.provisionType === 'Ancher' ||
                              device.isAnchor) &&
                              hasAccess(
                                props.userPermissions,
                                variables.ALL_DEVICES_FEATURE,
                                props.role,
                                props.database,
                                props.group
                              ) && (
                                <Box style={{ display: 'flex', marginTop: '1px' }}>
                                  <span className={classes.title}>Position:</span>
                                  {device.location && device.location.lat && device.location.lng ? (
                                    <span
                                      onClick={() => {
                                        props.setSelectedRow(flattenLatLng(device));
                                        props.renderComponent('draggable');
                                      }}
                                      className={classes.bodyValue}
                                    >
                                      <Chip
                                        size="small"
                                        style={{
                                          backgroundColor: props.wrldMapOnly
                                            ? variables.GEOTAB_PRIMARY_COLOR
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
                                    </span>
                                  ) : (
                                    <span className={classes.bodyValue}>
                                      <Chip
                                        size="small"
                                        style={{
                                          backgroundColor: variables.RED_COLOR,
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
                                    </span>
                                  )}
                                </Box>
                              )}
                            {props.provisionType !== 'Provision' &&
                              props.provisionType !== 'Ancher' &&
                              hasAccess(
                                props.userPermissions,
                                variables.ALL_DEVICES_FEATURE,
                                props.role,
                                props.database,
                                props.group
                              ) && (
                                <Box style={{ margin: '1px 0' }}>
                                  <span className={classes.title}>Advanced:</span>
                                  <span
                                    onClick={() => {
                                      handleOpenConfig(device);
                                    }}
                                    className={classes.bodyValue}
                                  >
                                    {
                                      <Chip
                                        size="small"
                                        style={{
                                          backgroundColor: '#98c494',
                                          color: variables.WHITE_COLOR,
                                          paddingLeft: '8px',
                                          marginRight: 5
                                        }}
                                        label={''}
                                        icon={
                                          <SettingsIcon
                                            style={{
                                              color: variables.WHITE_COLOR
                                            }}
                                          />
                                        }
                                      />
                                    }
                                  </span>
                                </Box>
                              )}
                          </Box>
                        </ListItem>
                        <Divider />
                      </div>
                    )
                  );
                }
              })}
          </List>
        </Box>
      ) : (
        <CircularProgress size={30} style={{ color: variables.ORANGE_COLOR, fontSize: '10px' }} />
      )}
    </Root>
  );
}

const mapStateToProps = ({ dashboard, provision, user, map }) => ({
  isDevicesLoading: dashboard.isDevicesLoading,
  allFacilityDevices: dashboard.allFacilityDevices,
  provisionType: provision.provisionType,
  provisionDevices: provision.provisionDevices,
  allTenants: provision.allTenants,
  isProvisionLoading: provision.isProvisionLoading,
  selectedListItem: provision.selectedListItem,
  checkedDevicesList: provision.checkedDevicesList,
  database: user.database,
  role: user.role,
  userPermissions: user.userPermissions,
  deviceConfigList: provision.deviceConfigList,
  groupObjects: user.groupObjects,
  groupFilter: user.groupFilter,
  deviceList: provision.selectedDeviceList,
  group: user.group,
  devStates: provision.states,
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount',
  geotabDevices: provision.geotabDevices,
  tableSearch: provision.tableSearch
});

const mapDispatch = ({
  dashboard: { getAllFacilityDevicesAction, getMetricsPerDeviceAction },
  provision: {
    updateDeviceDataAction,
    deleteDeviceDataAction,
    getProvisionDevicesAction,
    updateProvisionDeviceAction,
    checkSelectedAction,
    assignOrganizationAction,
    getAllTenantsAction,
    getConfigAction,
    getLocatorConfigAction,
    getAllDeviceCalibrationAction,
    setSelectedRowAction,
    setSelectedDeviceListAction,
    getDeviceStatesAction,
    getGeotabDevicesAction,
    setTableSearchAction
  },
  location: { renderComponentAction },
  notifications: { setNoteAction },
  configuration: { getDeviceStateAction, getDistributionListAction }
}) => ({
  getAllFacilityDevices: getAllFacilityDevicesAction,
  getProvisionDevices: getProvisionDevicesAction,
  updateDeviceData: updateDeviceDataAction,
  deleteDeviceData: deleteDeviceDataAction,
  updateProvisionDevice: updateProvisionDeviceAction,
  checkSelected: checkSelectedAction,
  assignOrganization: assignOrganizationAction,
  getMetricsPerDevice: getMetricsPerDeviceAction,
  getAllTenants: getAllTenantsAction,
  getConfig: getConfigAction,
  getLocatorConfig: getLocatorConfigAction,
  renderComponent: renderComponentAction,
  getAllDeviceCalibration: getAllDeviceCalibrationAction,
  setSelectedRow: setSelectedRowAction,
  setSelectedDeviceList: setSelectedDeviceListAction,
  setNote: setNoteAction,
  getDeviceState: getDeviceStateAction,
  getDistributionList: getDistributionListAction,
  getDevices: getDeviceStatesAction,
  getGeotabDevices: getGeotabDevicesAction,
  setTableSearch: setTableSearchAction
});

export default connect(mapStateToProps, mapDispatch)(ProvisionTableMobSize);
