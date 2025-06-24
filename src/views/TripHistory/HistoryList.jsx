import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import {
  Divider,
  List,
  ListSubheader,
  ListItem,
  Grid,
  FormControl,
  Select,
  Input,
  MenuItem,
  IconButton,
  Switch,
  FormControlLabel,
  Tooltip,
  TextField,
  Badge,
  Button
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import MapIcon from '@mui/icons-material/Map';
import SyncIcon from '@mui/icons-material/Sync';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { connect } from 'react-redux';
import moment from 'moment';
import * as turf from '@turf/turf';
import Autocomplete from '@mui/material/Autocomplete';

import variables from '../../variables.json';
import { filterByGroup } from '../../util/filters';
import CustomSwitch from '../Common/CustomSwitch';

const PREFIX = 'HistoryList';

const classes = {
  switchBase: `${PREFIX}-switchBase`,
  checked: `${PREFIX}-checked`,
  track: `${PREFIX}-track`,
  list: `${PREFIX}-list`,
  header: `${PREFIX}-header`,
  headerItem: `${PREFIX}-headerItem`,
  dateRow: `${PREFIX}-dateRow`,
  listItem: `${PREFIX}-listItem`,
  itemData: `${PREFIX}-itemData`,
  iconWrap: `${PREFIX}-iconWrap`,
  icon: `${PREFIX}-icon`,
  strong: `${PREFIX}-strong`,
  formControl: `${PREFIX}-formControl`,
  auto: `${PREFIX}-auto`
};

const Root = styled('div')(({ theme, ...props }) => ({
  [`& .${classes.list}`]: {
    height: '85%',
    position: 'fixed',
    overflowY: 'scroll',
    overflowX: 'hidden',
    background: variables.LIGHT_GRAY_COLOR,
    zIndex: '100',
    marginLeft: 0,
    transition: 'all 100ms ease',
    padding: '50px 0'
  },

  [`& .${classes.header}`]: {
    width: '100%',
    padding: 0
  },

  [`& .${classes.headerItem}`]: {
    backgroundColor: variables.WHITE_COLOR,
    padding: '8px 4px 8px 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },

  [`& .${classes.dateRow}`]: {
    width: '100%',
    display: 'flex',
    alignItems: 'center'
  },

  [`& .${classes.listItem}`]: {
    backgroundColor: variables.WHITE_COLOR,
    cursor: 'pointer'
  },

  [`& .${classes.itemData}`]: {
    display: 'flex',
    flexDirection: 'column',
    height: 100,
    justifyContent: 'space-around',
    color: '#5c6873'
  },

  [`& .${classes.iconWrap}`]: {
    display: 'flex',
    flexDirection: 'column',
    height: 80,
    justifyContent: 'space-evenly'
  },

  [`& .${classes.icon}`]: {
    fontSize: 25
  },

  [`& .${classes.strong}`]: {
    color: variables.ORANGE_COLOR
  },

  [`& .${classes.formControl}`]: {
    marginLeft: 10,
    '& .MuiInput-underline:after': {
      borderBottomColor: variables.DARK_GRAY_COLOR
    },
    maxWidth: 260
  },
  [`& .${classes.auto}`]: {
    width: 230,
    display: 'flex'
  }
}));

const HistoryList = (props) => {
  const [deviceList, setDeviceList] = useState([]);
  // const [devicesSelected, setDevicesSelected] = useState([props.device.deviceId]);
  const [currentDevice, setCurrentDevice] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const TRIP_DURATION = 600000;

  useEffect(() => {
    if (props.allDevices && props.allDevices.length > 0) {
      let devices = props.allDevices.filter(
        (device) => device.deviceType === 'Tag' && !device.isAnchor && !device.archived
      );
      if (props.groupFilter.length > 0) {
        devices = filterByGroup(devices, props.groupFilter);
      }

      setDeviceList(devices);
      setLoaded(true);
    }
  }, [props.allDevices, props.groupFilter]);

  useEffect(() => {
    const search = deviceList && deviceList.find((dev) => dev.deviceId === currentDevice);
    if (!search && deviceList) {
      if (deviceList.length > 0 && currentDevice) {
        props.getTripHistory({
          deviceId: deviceList[0].deviceId,
          organization: deviceList[0].organization,
          groups: deviceList[0].groups,
          isGrouped: true,
          ...(props.shortTrips && { minTravel: props.minTravel, minDuration: props.minDuration })
        });
        setCurrentDevice(deviceList[0].deviceId);
      } else if (deviceList.length === 0 && loaded) {
        props.getTripHistory({
          deviceId: '',
          organization: props.database,
          groups: [props.group],
          isGrouped: true
        });
        setCurrentDevice('No devices in selected groups');
      }
    }
  }, [deviceList]);

  useEffect(() => {
    // console.log('set current device', props.device);
    props.device && setCurrentDevice(props.device.deviceId);
  }, [props.device]);

  const handleDateChange = (rawdate) => {
    const date = rawdate.toDate();
    const formatedDate = moment.utc(date).local().format('MM/DD/YYYY');
    console.log('formatedDate', date);
    const fromDate = moment(formatedDate).startOf('day').valueOf();
    const toDate = moment(fromDate).add(1, 'days').valueOf();
    console.log('formatedDate', formatedDate, fromDate, toDate);
    const currDevice = getDeviceData(currentDevice);
    // alert(`from ${fromDate} to ${toDate}`);
    props.getTripHistory({
      deviceId: currDevice.deviceId,
      organization: currDevice.organization,
      groups: currDevice.groups,
      fromDate: fromDate,
      toDate: toDate,
      isNormalized: props.normalized,
      isGrouped: true,
      ...(props.shortTrips && { minTravel: props.minTravel, minDuration: props.minDuration })
    });
    props.setSelectedDate(fromDate);
  };

  const getDeviceData = (deviceId) => {
    const device = deviceList && deviceList.find((dev) => dev.deviceId === deviceId);
    return device || {};
  };

  const getDuration = (duration) => {
    const hour = moment.duration(duration, 'milliseconds').hours();
    const min = moment.duration(duration, 'milliseconds').minutes();
    const sec = moment.duration(duration, 'milliseconds').seconds();
    const durationTxt =
      (hour ? hour + 'h ' : '') + (min ? min + 'm ' : '') + (sec === 0 && (hour !== 0 || min !== 0) ? '' : sec + 's ');
    return durationTxt;
  };

  const openListButton = () => {
    return (
      <Badge
        style={{
          position: 'fixed',
          marginTop: '50px',
          marginLeft: props.isListOpen ? (props.screenWidth < 600 ? '60%' : 320) : 0,
          background: variables.LIGHT_GRAY_COLOR,
          height: '54px',
          width: '30px',
          zIndex: '100',
          cursor: 'pointer',
          transition: 'all 100ms ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '2px 2px 3px 0 rgb(0 0 0 / 20%)',
          borderRadius: '0 5px 5px 0'
        }}
        onClick={() => {
          props.setIsListOpen(!props.isListOpen);
        }}
      >
        <i
          style={{
            color: variables.ORANGE_COLOR,
            fontSize: '26px'
          }}
          className={props.isListOpen ? 'fa fa-caret-left' : 'fa fa-caret-right'}
        ></i>
      </Badge>
    );
  };

  // const handleMultiSelect = (e) => {
  //   setDevicesSelected(e.target.value);
  // };

  const handleDeviceSelect = (e) => {
    const fromDate = moment(props.selectedDate).valueOf();
    const toDate = moment(props.selectedDate).add(1, 'days').valueOf();
    const currDevice = getDeviceData(e.target.value);
    // console.log(currentDevice);
    props.getTripHistory({
      deviceId: currDevice.deviceId,
      organization: currDevice.organization,
      groups: currDevice.groups,
      fromDate: fromDate,
      toDate: toDate,
      isNormalized: props.normalized,
      isGrouped: true,
      ...(props.shortTrips && { minTravel: props.minTravel, minDuration: props.minDuration })
    });

    props.setDeviceSelected(currDevice);
  };

  const handleChange = (e, newInputValue) => {
    if (!newInputValue) return;
    const fromDate = moment(props.selectedDate).valueOf();
    const toDate = moment(props.selectedDate).add(1, 'days').valueOf();
    const currDevice = getDeviceData(newInputValue.deviceId);
    // console.log(currentDevice);
    props.getTripHistory({
      deviceId: currDevice.deviceId,
      organization: currDevice.organization,
      groups: currDevice.groups,
      fromDate: fromDate,
      toDate: toDate,
      isNormalized: props.normalized,
      isGrouped: true,
      ...(props.shortTrips && { minTravel: props.minTravel, minDuration: props.minDuration })
    });

    props.setDeviceSelected(currDevice);
  };

  const handleRefreshClicked = (reqParams) => {
    console.log('props.selectedDate', props.selectedDate);
    const fromDate = moment(props.selectedDate).valueOf();
    const toDate = moment(props.selectedDate).add(1, 'days').valueOf();
    const currDevice = getDeviceData(currentDevice);

    props.getTripHistory({
      deviceId: currDevice.deviceId,
      organization: currDevice.organization,
      groups: currDevice.groups,
      fromDate: fromDate,
      toDate: toDate,
      isNormalized: false,
      isGrouped: true,
      ...(props.shortTrips && { minTravel: props.minTravel, minDuration: props.minDuration })
    });
  };

  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: 300,
        width: 250
      }
    },
    getContentAnchorEl: null
  };

  const calcDistance = (trip) => {
    const lineCoordinates = trip.path.map((point) => {
      return [point[1], point[0]];
    });
    if (!lineCoordinates || lineCoordinates.length < 2) return;

    const line = turf.lineString(lineCoordinates);
    const dist = turf.length(line, { units: 'meters' });

    return dist;
  };

  const returnToMap = () => {
    props.renderComponent('mapbox');
  };

  const handleSelection = (trip) => {
    const { tripId } = trip;
    const allTrips = [...props.trips];
    if (props.displayedTripIds === '') {
      props.setDisplayedTrips([trip]);
      props.setDisplayedTripIds([tripId]);
      return props.switchLine([trip], [tripId]);
    } else {
      let selected = [...props.displayedTripIds];
      const index = selected.indexOf(tripId);
      if (index >= 0) {
        selected.splice(index, 1);
      } else {
        selected.push(tripId);
      }
      let trips = [];
      allTrips.map((trip) => {
        if (selected.includes(trip.tripId)) trips.push(trip);
      });
      if (selected.length === 0) selected = '';
      props.setDisplayedTrips(trips);
      props.setDisplayedTripIds(selected);
      return props.switchLine(trips, selected);
    }
  };

  const isNumeric = (number) => {
    const regex = new RegExp('^[0-9]*$');
    return regex.test(number);
  };

  const handleNumChange = (e) => {
    const { name, value } = e.target;
    if (!isNumeric(value)) return;
    if (name === 'minDuration') {
      props.setminDuration(Number(value) * 60000);
    } else {
      props.setMinTravel(Number(value));
    }
  };
  console.log('currentDevice', currentDevice);
  return (
    <Root>
      <List
        className={classes.list}
        style={{
          marginLeft: props.isListOpen ? 0 : -320,
          width: props.screenWidth < 600 ? '60%' : 320,
          paddingBottom: 150,
          height: '100%'
        }}
      >
        <ListSubheader className={classes.header}>
          <div className={classes.headerItem} style={{ height: 54 }}>
            <div className={classes.dateRow} style={{ height: 54, justifyContent: 'space-between' }}>
              <FormControl
                className={classes.formControl}
                style={{ width: props.screenWidth < 600 ? '100%' : 'auto', display: 'flex' }}
              >
                {/* <Select
                  id="device"
                  // multiple
                  // value={devicesSelected}
                  // onChange={handleMultiSelect}
                  style={{
                    fontSize: props.screenWidth < 600 ? 'auto' : 20
                  }}
                  value={deviceList && deviceList.length === 0 ? '' : currentDevice || ''}
                  onChange={handleDeviceSelect}
                  input={<Input />}
                  MenuProps={MenuProps}
                >
                  {currentDevice === 'Select Device' && (
                    <MenuItem key={'Select Device'} value={'Select Device'} disabled>
                      Select Device
                    </MenuItem>
                  )}
                  {currentDevice === 'No devices in selected groups' && (
                    <MenuItem key={'No devices in selected groups'} value={'No devices in selected groups'} disabled>
                      No devices in selected groups
                    </MenuItem>
                  )}
                  {deviceList &&
                    deviceList.map((device) => {
                      return (
                        <MenuItem key={device.deviceId} value={device.deviceId}>
                          {device.assetName}
                        </MenuItem>
                      );
                    })}
                </Select> */}
                <Autocomplete
                  blurOnSelect
                  className={classes.auto}
                  options={deviceList}
                  getOptionLabel={(option) => option.assetName || option.deviceId || ''}
                  value={currentDevice ? deviceList.find((d) => d.deviceId === currentDevice) : ''}
                  ListboxProps={{ style: { minHeight: 100, maxHeight: 200, overflow: 'auto' } }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      className={classes.textField}
                      variant="standard"
                      // label={'Select Device'}
                      //   helperText={attachTo && attachTo.serialNumber ? 'replace serial number' : ''}
                    />
                  )}
                  onChange={handleChange}
                />
              </FormControl>
              <Tooltip title={`Back to live map`}>
                <IconButton
                  aria-label="refresh"
                  onClick={() => returnToMap(props.normalized)}
                  style={{
                    color: variables.ORANGE_COLOR,
                    zIndex: 9
                  }}
                >
                  <MapIcon />
                </IconButton>
              </Tooltip>
            </div>
          </div>
          <Divider component="div" />
          <div className={classes.headerItem} style={{ flexDirection: 'column' }}>
            <div className={classes.dateRow}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                {/* <DatePicker sx={{ width: 260 }} onChange={handleDateChange}  /> */}
                <DatePicker disableFuture={true} value={dayjs(props.selectedDate)} onChange={handleDateChange} />
              </LocalizationProvider>
              <Tooltip title={`Refresh`}>
                <IconButton
                  aria-label="refresh"
                  onClick={() => handleRefreshClicked()}
                  style={{
                    color: variables.ORANGE_COLOR,
                    zIndex: 9
                  }}
                >
                  <SyncIcon />
                </IconButton>
              </Tooltip>
            </div>

            <div className={classes.dateRow} style={{ marginLeft: 15 }}>
              <div style={{ height: '100%' }}>
                <div style={{ display: 'flex' }}>
                  <FormControlLabel
                    control={
                      <CustomSwitch
                        checked={Boolean(props.showAllPoints)}
                        onChange={() => {
                          props.setShowAllPoints(!props.showAllPoints);
                          handleRefreshClicked();
                        }}
                        name="raw"
                        size="small"
                        classes={{
                          switchBase: classes.switchBase,
                          checked: classes.checked,
                          track: classes.track
                        }}
                        wrldMapOnly={props.wrldMapOnly}
                      />
                    }
                    label="raw data"
                  />
                  <FormControlLabel
                    control={
                      <CustomSwitch
                        checked={Boolean(props.heatmap)}
                        onChange={() => {
                          props.setHeatmap(!props.heatmap);
                          handleRefreshClicked();
                        }}
                        name="heatmap"
                        size="small"
                        classes={{
                          switchBase: classes.switchBase,
                          checked: classes.checked,
                          track: classes.track
                        }}
                        wrldMapOnly={props.wrldMapOnly}
                      />
                    }
                    label="heatmap"
                  />
                </div>
                <FormControlLabel
                  control={
                    <CustomSwitch
                      checked={Boolean(props.shortTrips)}
                      onChange={() => {
                        const value = !props.shortTrips;
                        props.setShortTrips(value);
                      }}
                      name="hide"
                      size="small"
                      classes={{
                        switchBase: classes.switchBase,
                        checked: classes.checked,
                        track: classes.track
                      }}
                      wrldMapOnly={props.wrldMapOnly}
                    />
                  }
                  label="hide small trips"
                />
                {props.shortTrips && (
                  <Grid container spacing={1}>
                    <Grid item sm={6} xs={12}>
                      <TextField
                        label="min distance(m)"
                        // variant="outlined"
                        value={props.minTravel}
                        size="small"
                        name="minTravel"
                        onChange={handleNumChange}
                      />
                    </Grid>
                    <Grid item sm={6} xs={12}>
                      <TextField
                        label="min duration(min)"
                        // variant="outlined"
                        value={props.minDuration / 60000}
                        onChange={handleNumChange}
                        size="small"
                        name="minDuration"
                      />
                    </Grid>
                  </Grid>
                )}
              </div>
            </div>
          </div>
          <Divider component="div" />
        </ListSubheader>
        <Divider component="li" />
        {props.data && Object.keys(props.data).length > 0 ? (
          Object.values(props.data).map((trip) => {
            const key = trip.tripId;
            const tripsList = trip.trips;
            const first = tripsList[0];
            const last = tripsList[tripsList.length - 1];
            const duration = getDuration(trip.duration);
            const distance = trip.length;
            const startTime = moment(first.locTime || first.updatedAt).format('hh:mm A');
            const endTime = moment(last.locTime || last.updatedAt).format('hh:mm A');

            const selected = props.displayedTripIds && props.displayedTripIds.includes(key);
            return (
              <div key={key}>
                <ListItem
                  button
                  alignItems="center"
                  className={classes.listItem}
                  onClick={() => handleSelection(trip)}
                  style={{
                    borderLeft: selected ? '5px solid orange' : '5px solid white',
                    borderRight: selected ? '5px solid orange' : '5px solid white',
                    padding: props.screenWidth < 600 ? 0 : 'auto',
                    background: selected ? '#FBE1C2' : variables.WHITE_COLOR
                  }}
                >
                  <Grid container>
                    <Grid container justifyContent="space-around" direction="column" item sm={1} xs={1}>
                      <RadioButtonUncheckedIcon className={classes.icon} fontSize="small" />
                      <MoreVertIcon className={classes.icon} fontSize="small" />
                      <RadioButtonCheckedIcon className={classes.icon} fontSize="small" />
                    </Grid>
                    {/* <Grid container justify="space-around" direction="column" item sm={5} xs={11}>
                      <div style={{ textAlign: props.screenWidth < 600 ? 'center' : 'left' }}>
                        {first.path ? (
                          <strong className={classes.strong}>{first.path[0] + ', ' + first.path[1]}</strong>
                        ) : (
                          <strong className={classes.strong}>{first.location.lat + ', ' + first.location.lng}</strong>
                        )}
                      </div>
                      <div style={{ textAlign: props.screenWidth < 600 ? 'center' : 'left' }}>
                        {last.path ? (
                          <strong className={classes.strong}>{last.path[0] + ', ' + last.path[1]}</strong>
                        ) : (
                          <strong className={classes.strong}>{last.location.lat + ', ' + last.location.lng}</strong>
                        )}
                      </div>
                    </Grid> */}
                    <Grid
                      container
                      justifyContent="space-around"
                      item
                      sm={11}
                      xs={11}
                      style={{ fontSize: props.screenWidth < 600 ? 10 : 'auto' }}
                    >
                      <div className={classes.itemData}>
                        <div>Start</div>
                        <div>Duration</div>
                        <div>Distance</div>
                        <div>End</div>
                      </div>
                      <div className={classes.itemData}>
                        <div>
                          <strong className={classes.strong}>{startTime}</strong>
                        </div>
                        <div>
                          <strong className={classes.strong}>{duration}</strong>
                        </div>
                        <div>
                          <strong className={classes.strong}>{distance}m</strong>
                        </div>
                        <div>
                          <strong className={classes.strong}>{endTime}</strong>
                        </div>
                      </div>
                    </Grid>
                  </Grid>
                </ListItem>
                <Divider component="li" />
              </div>
            );
          })
        ) : (
          <ListItem button alignItems="center" className={classes.listItem}>
            <strong>No Activity at this date</strong>
          </ListItem>
        )}
      </List>
      {openListButton()}
    </Root>
  );
};

const mapStateToProps = ({ map, location, provision, user }) => ({
  device: map.deviceSelected,
  screenWidth: location.screenWidth,
  trips: map.currentTrips,
  tags: map.tags,
  allDevices: provision.states,
  showAdvanceTool: location.showAdvanceTool,
  groupFilter: user.groupFilter,
  database: user.database,
  group: user.group,
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount'
});

const mapDispatch = ({
  map: { getTripHistoryAction, setDeviceSelectedAction },
  location: { renderComponentAction }
}) => ({
  getTripHistory: getTripHistoryAction,
  setDeviceSelected: setDeviceSelectedAction,
  renderComponent: renderComponentAction
});

export default React.memo(connect(mapStateToProps, mapDispatch)(HistoryList));
