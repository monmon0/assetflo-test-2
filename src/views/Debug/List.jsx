import React, { Component } from 'react';
import {
  TextField,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  InputAdornment,
  Chip,
  Divider,
  List,
  Modal,
  ListItem,
  Accordion,
  AccordionSummary,
  Badge,
  AccordionDetails
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ListIcon from '@mui/icons-material/List';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import SaveIcon from '@mui/icons-material/Save';
import ControlPointDuplicateIcon from '@mui/icons-material/ControlPointDuplicate';
import EditIcon from '@mui/icons-material/Edit';
import HighlightOff from '@mui/icons-material/HighlightOff';
import SlowMotionVideoIcon from '@mui/icons-material/SlowMotionVideo';
import { connect } from 'react-redux';
import Fuse from 'fuse.js';
import moment from 'moment';
import arraySort from 'array-sort';

import variables from '../../variables.json';
import { filterByGroup } from '../../util/filters';
import { statusColor } from '../../util/statusColor';

let result;

// format the time from date object, to string form with milliseconds
const formatWithMilliseconds = (date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const milliseconds = date.getMilliseconds();

  const dateString = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  const timeString = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}:${milliseconds.toString().padStart(3, '0')}`;

  return `${dateString}, ${timeString}`;
};

class DevList extends Component {
  state = {
    custom: [true, false],
    collapseList: {},
    listOpen: true,
    selected: {},
    editMood: false,
    dropdownOpen: false,
    sortSelected: null,
    searchBarOpen: false,
    syncFilterWithMap: true,
    selectedPoiItem: '',
    searchString: '',
    anchorSortEl: null,
    collapseAll: false
  };

  handleToggle(item) {
    let collapse = { ...this.state.collapseList };
    if (item.poiId) {
      collapse = { ...collapse, [item.poiId]: !this.state.collapseList[item.poiId] };
    } else {
      collapse = { ...collapse, [item.deviceId]: !this.state.collapseList[item.deviceId] };
    }
    this.setState({ ...this.state, collapseList: collapse });
  }

  // allow events to be searched by name or deviceId
  handleSearchChange(e) {
    e.preventDefault();
    var options = {
      shouldSort: true,
      threshold: 0.1,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: ['assetName', 'name', 'deviceId']
    };
    let fuse = new Fuse([...this.props.pois, ...this.props.devices], options);
    result = fuse.search(e.target.value);
    this.setState({ ...this.state, searchString: e.target.value, result });
    this.props.getSearchResult(result);
    this.props.setDeviceSelected('');
  }

  // set selected event and zoom into it when selected
  async handleSelectedDevice(e, event) {
    e.preventDefault();

    if (event.type) {
      this.setState({ ...this.state, selectedPoiItem: event });
    } else {
      this.setState({
        ...this.state,
        selectedPoiItem: ''
      });
    }

    // set selected event in props
    this.setState({ selected: event });
    this.props.setDeviceSelected(event);

    // if the event has a set point, zoom to it on the map
    if (event.setPoint) {
      this.props.mapbox.flyTo({
        center: [event.longitude, event.latitude],
        speed: 4.5,
        curve: 3,
        easing(t) {
          return t;
        }
      });
    }
  }

  // function to display contents of an event
  eventRow(event) {
    let userTenant = this.props.userTenant;
    if (userTenant.organization !== this.props.database) {
      const selectedTenant =
        this.props.allTenants && this.props.allTenants.find((t) => t.organization === this.props.database);
      selectedTenant && (userTenant = selectedTenant);
    }

    try {
      return (
        <ListItem
          key={(Math.random() + 1).toString(36).substring(7)}
          style={{
            background:
              // use new event id to identify event selected and change color if selected
              event.newEventId === this.props.deviceSelected.newEventId
                ? this.props.wrldMapOnly
                  ? variables.SELECTED_GEOTAB_COLOR
                  : variables.SELECTED_ORANGE_COLOR
                : variables.WHITE_COLOR,
            padding: 0
          }}
          className="list-group-item list-group-item-action"
        >
          <Accordion
            expanded={!this.state.collapseList[event.deviceId]}
            style={{
              width: '100%',
              borderRadius: 0,
              border: '1px solid rgba(0,0,0,.125)',
              padding: 10,
              background:
                // use new event id to identify event selected and change color if selected
                event.newEventId === this.props.deviceSelected.newEventId
                  ? this.props.wrldMapOnly
                    ? variables.SELECTED_GEOTAB_COLOR
                    : variables.SELECTED_ORANGE_COLOR
                  : variables.WHITE_COLOR
            }}
          >
            <AccordionSummary
              style={{ height: 35, minHeight: 35, padding: 0 }}
              expandIcon={<ExpandMoreIcon fontSize="small" />}
              onClick={(e) => {
                const isDiv = e.target.localName === 'div';
                const classname = isDiv && e.target.className.split(' ');
                if (!classname || !classname.includes('MuiAccordionSummary-content')) return;
                this.handleToggle(event);
              }}
            >
              {/* if event is clicked on, set it as selected */}
              <div
                style={{ display: 'flex', alignItems: 'center' }}
                onClick={(e) => {
                  this.handleSelectedDevice(e, event);
                }}
              >
                {/*Display new event id and device id for each event as the title*/}
                <strong>{`${event.newEventId}. ${event.deviceId}`}</strong>
                <strong
                  style={{
                    color: this.props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
                    marginLeft: 10
                  }}
                ></strong>
                <span style={{ marginLeft: this.props.screenWidth < 1000 ? 0 : 5 }}>
                  {/*duplicate event button*/}
                  <Tooltip title="Duplicate Event">
                    <IconButton
                      aria-label="Duplicate Event"
                      onClick={() => {
                        this.props.handleDuplicateEvent(event);
                      }}
                      style={{
                        zIndex: 9,
                        padding: 0
                      }}
                      size="small"
                    >
                      <ControlPointDuplicateIcon />
                    </IconButton>
                  </Tooltip>
                  {/*edit event button*/}
                  <Tooltip title="Edit Event">
                    <IconButton
                      aria-label="Edit Event"
                      onClick={() => {
                        this.props.handleOpenEditEvent(event);
                      }}
                      style={{
                        zIndex: 9,
                        padding: 0
                      }}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  {/*remove event button*/}
                  <Tooltip title="Remove Event">
                    <IconButton
                      aria-label="Remove Event"
                      onClick={() => {
                        this.props.handleRemoveEvent(event.newEventId, event);
                      }}
                      style={{
                        zIndex: 9,
                        padding: 0
                      }}
                      size="small"
                    >
                      <HighlightOff />
                    </IconButton>
                  </Tooltip>
                </span>
              </div>
            </AccordionSummary>
            <AccordionDetails
              style={{ fontSize: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', padding: 0 }}
              onClick={(e) => {
                this.handleSelectedDevice(e, event);
              }}
            >
              {/* display event contents */}
              <span>
                <strong>Date: </strong>
                {/* if date is a string from processed event, convert to object, then format */}
                {typeof event.selectedDate === 'string'
                  ? formatWithMilliseconds(new Date(event.selectedDate))
                  : formatWithMilliseconds(event.selectedDate)}
              </span>

              <span>
                <strong>Device Type: </strong>
                {event.deviceType}
              </span>

              <span>
                <strong>Event Type: </strong>
                {event.eventType}
              </span>

              {(event.eventType !== 'scans' || (event.eventType !== 'gps' && event.deviceType === '5G')) && (
                <span>
                  <strong>Device Is Moving: </strong>
                  {event.deviceIsMoving ? 'true' : 'false'}
                </span>
              )}

              {event.locationAccuracy && (
                <span>
                  <strong>Location Accuracy (0 - 1): </strong>
                  {event.locationAccuracy}
                </span>
              )}

              {event.hdop && (
                <span>
                  <strong>hdop (0 - 12): </strong>
                  {event.hdop}
                </span>
              )}

              {event.satsUsed && (
                <span>
                  <strong>satsUsed (0 - 12): </strong>
                  {event.satsUsed}
                </span>
              )}

              {event.deviceSpeed && (
                <span>
                  <strong>Device Speed: </strong>
                  {event.deviceSpeed}
                </span>
              )}

              {event.longitude && (
                <span>
                  <strong>Longitude: </strong>
                  {event.longitude}
                </span>
              )}

              {event.latitude && (
                <span>
                  <strong>Latitude: </strong>
                  {event.latitude}
                </span>
              )}

              {event.scanData && event.scanData.length > 0 && (
                <div>
                  <strong>Number of Scans: </strong> {event.numberOfScans}
                  {event.scanData.map((scan, index) => (
                    <div key={index}>
                      {/* format scanTime for each scan from milliseconds to hours, minutes, seconds, milliseconds format */}
                      <strong>{`${index + 1}. Scan Time:`}</strong> {moment(scan.scanTime).format('HH:mm:ss:SSS')}
                      <br />
                      <strong>RSSI:</strong> {scan.rssi}
                      <br />
                      <strong>Scan Is Moving:</strong> {scan.isMoving ? 'true' : 'false'}
                      <br />
                      <strong>Scan Device Id:</strong> {scan.deviceId}
                      <br />
                    </div>
                  ))}
                </div>
              )}
            </AccordionDetails>
          </Accordion>
        </ListItem>
      );
    } catch (e) {
      console.log('Event row error', e);
    }
  }

  // button for searching for event in list of new events
  searchBarAndButton() {
    try {
      return (
        <div
          style={{
            backgroundColor: variables.WHITE_COLOR,
            display: 'flex',
            width: '100%',
            zIndex: '10',
            top: this.props.loginType === 'verifyGeotabAddinAccount' ? '90px' : '50px',
            alignItems: 'center'
          }}
        >
          <TextField
            // type="search"
            autoComplete="off"
            id="searchbar"
            placeholder="Search"
            value={this.state.searchString}
            onChange={(e) => this.handleSearchChange(e)}
            height={100}
            style={{ width: '100%' }}
            InputProps={{
              endAdornment: this.state.searchString && (
                <InputAdornment position="end">
                  <Tooltip title="Clear search">
                    <ClearIcon
                      style={{ color: variables.LIGHT_GRAY_COLOR, cursor: 'pointer' }}
                      onClick={() => {
                        this.setState({ searchString: '', result: [] });
                        this.props.getSearchResult([]);
                      }}
                    />
                  </Tooltip>
                </InputAdornment>
              ),
              disableUnderline: true
            }}
          />
        </div>
      );
    } catch (e) {
      // console.log("serchBar", e);
    }
  }

  // button to open the list of new events
  openListButton() {
    return (
      <Badge
        style={{
          position: 'fixed',
          marginTop: '50px',
          marginLeft: this.state.listOpen ? 240 : 0,
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
          borderRadius: '0 5px 5px 0',
          top: this.props.wrldMapOnly ? 50 : 'auto'
        }}
        onClick={() => {
          this.setState({ ...this.state, listOpen: !this.state.listOpen });
        }}
      >
        <i
          style={{
            color: this.props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
            fontSize: '26px'
          }}
          className={this.state.listOpen ? 'fa fa-caret-left' : 'fa fa-caret-right'}
        ></i>
      </Badge>
    );
  }

  // header displayed above the list of new header containing search and tool bar
  listHeader() {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          zIndex: 10,
          background: variables.WHITE_COLOR,
          paddingLeft: '5px',
          borderRadius: 4,
          boxShadow: '0 4px 8px 0 rgba(0,0,0,0.10)',
          marginLeft: 0,
          width: 240,
          top: this.props.hideHeaderFooter && !this.props.wrldMapOnly ? 47 : 'auto'
        }}
      >
        <div
          style={{
            marginTop: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', height: 48 }}>{this.searchBarAndButton()}</div>
          {/* tool bar containing add event, quick edit, run, save, and manage tests buttons */}
          <Divider />
          <div
            style={{
              display: 'flex',
              width: 236,
              justifyContent: 'space-evenly'
            }}
          >
            {this.addEventsButton()}
            {this.quickEditButton()}
            {this.runEventsButton()}
            {this.saveEventsButton()}
            {this.manageTestsButton()}
          </div>
        </div>
      </div>
    );
  }

  // add events button to add to new events list
  addEventsButton() {
    return (
      <div>
        <Tooltip title="Add Events" aria-label="add-events">
          <IconButton
            aria-label="add-events"
            onClick={() => this.props.handleOpenAddEvent()}
            style={{
              color: variables.ORANGE_COLOR,
              zIndex: '10'
            }}
            size="small"
          >
            <AddCircleIcon />
          </IconButton>
        </Tooltip>
        {/* if button is pressed, open modal for adding events */}
        <Modal open={this.props.openEvent} onClose={this.props.handleClickEvent}>
          {this.props.manageEventsBody}
        </Modal>
      </div>
    );
  }

  // quick edit events button for editing events in new events list
  quickEditButton() {
    return (
      <div>
        <Tooltip title="Quick Edit" aria-label="quick-edit-events">
          <IconButton
            aria-label="quick-edit-events"
            onClick={() => this.props.handleOpenQuickEdit()}
            style={{
              color: variables.ORANGE_COLOR,
              zIndex: '10'
            }}
            size="small"
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
        {/* if button is pressed, open modal for quick editing events */}
        <Modal open={this.props.openQuickEdit} onClose={this.props.handleClickQuickEdit}>
          {this.props.quickEditBody}
        </Modal>
      </div>
    );
  }

  // run events button to simulate events in new events list
  runEventsButton() {
    let events = this.props.newEvents.events;
    return (
      <div style={{ display: 'flex' }}>
        <Tooltip title={'Run Events in Real time'} aria-label="submit-test">
          <IconButton
            aria-label="submit-test"
            onClick={() => events.length > 0 && this.props.submitTest(true)}
            style={{
              color: variables.ORANGE_COLOR,
              zIndex: '10'
            }}
            size="small"
          >
            <PlayCircleFilledWhiteIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={'Run Events Based on Time'} aria-label="submit-test">
          <IconButton
            aria-label="submit-test"
            onClick={() => events.length > 0 && this.props.submitTest(false)}
            style={{
              color: variables.ORANGE_COLOR,
              zIndex: '10'
            }}
            size="small"
          >
            <SlowMotionVideoIcon />
          </IconButton>
        </Tooltip>
      </div>
    );
  }

  // save events button to save test case
  saveEventsButton() {
    return (
      <div>
        <Tooltip title="Save" aria-label="save">
          <IconButton
            aria-label="save"
            onClick={() => this.props.handleOpenSaveTest()}
            style={{
              color: variables.ORANGE_COLOR,
              zIndex: '10'
            }}
            size="small"
          >
            <SaveIcon />
          </IconButton>
        </Tooltip>
        {/* if button is pressed, open modal for saving events */}
        <Modal open={this.props.openSaveTest} onClose={this.props.handleClickSaveTest}>
          {this.props.saveTestBody}
        </Modal>
      </div>
    );
  }

  // manage tests button to go back to manage test page
  manageTestsButton() {
    return (
      <div>
        <Tooltip title="Manage Tests" aria-label="manage-tests">
          <IconButton
            aria-label="manage-tests"
            onClick={() => this.handleManageTestsClick()}
            style={{
              color: variables.ORANGE_COLOR,
              zIndex: '10'
            }}
            size="small"
          >
            <ListIcon />
          </IconButton>
        </Tooltip>
      </div>
    );
  }

  // reset selected event and go to manage tests page
  handleManageTestsClick() {
    this.props.setDeviceSelected('');
    this.props.handleManageTests();
  }

  compareTime(prop) {
    return (a, b) => {
      let diff = moment.duration(moment(a[prop]).diff(moment(b[prop])));
      return diff.asMinutes() < -2 ? -1 : diff.asMinutes() > 2 ? 1 : 0;
    };
  }
  sortDataByLastSeen() {
    let tags = this.props.devices.filter((device) => device.deviceType === 'Tag');
    let sortedMetrcis = arraySort(tags, this.compareTime('locTime'), { reverse: true });
    // let sortedMetrcis = arraySort(tags, 'locTime', { reverse: true });
    let filterLocatorsWithLocTime = this.props.locators.filter((loc) => loc.locTime);
    let filterLocatorsWithNoLocTime = this.props.locators.filter((loc) => !loc.locTime);
    filterLocatorsWithLocTime = arraySort(filterLocatorsWithLocTime, 'locTime', { reverse: true });
    filterLocatorsWithNoLocTime = arraySort(filterLocatorsWithNoLocTime, 'updatedAt', { reverse: true });
    return [...sortedMetrcis, ...filterLocatorsWithLocTime, ...filterLocatorsWithNoLocTime];
  }

  sortDataByUtilization() {
    let tagUtilization = {};
    this.props.tagsWithMetricsData.map((tag) => (tagUtilization[tag.deviceId] = tag.utilization));
    let tags = [];
    this.props.devices.map(
      (device) => device.deviceType === 'Tag' && tags.push({ ...device, utilization: tagUtilization[device.deviceId] })
    );
    return arraySort([...tags, ...this.props.locators], 'utilization');
  }

  sortSearcResultDevices(sortBy) {
    let sortedResult = [];
    let tagsSearchResult = [];
    let locatorsSearchResult = [];
    if (sortBy === 'locTime') {
      this.props.searchResult.forEach((result) =>
        result.deviceType === 'Tag' ? tagsSearchResult.push(result) : locatorsSearchResult.push(result)
      );
      arraySort(tagsSearchResult, this.compareTime('locTime'), { reverse: true });
      let filterLocatorsWithLocTime = locatorsSearchResult.filter((loc) => loc.locTime);
      let filterLocatorsWithNoLocTime = locatorsSearchResult.filter((loc) => !loc.locTime);
      filterLocatorsWithLocTime = arraySort(filterLocatorsWithLocTime, 'locTime', { reverse: true });
      filterLocatorsWithNoLocTime = arraySort(filterLocatorsWithNoLocTime, 'updatedAt', { reverse: true });
      sortedResult = [...tagsSearchResult, ...filterLocatorsWithLocTime, ...filterLocatorsWithNoLocTime];
    } else if (sortBy === 'utilization') {
      this.props.searchResult.forEach((result) => {
        if (result.deviceType === 'Locator') locatorsSearchResult.push(result);
      });
      this.props.tagsWithMetricsData &&
        this.props.tagsWithMetricsData.forEach((devWithMetrics) => {
          this.props.searchResult.forEach((result) => {
            if (result.deviceId === devWithMetrics.deviceId) tagsSearchResult.push(devWithMetrics);
          });
        });
      arraySort(tagsSearchResult, 'utilization');
      sortedResult = [...tagsSearchResult, ...locatorsSearchResult];
    } else {
      sortedResult = this.props.searchResult;
    }
    return sortedResult;
  }

  getListDevices(sortBy) {
    let devices;
    // console.log('sortBy', sortBy);
    if (sortBy) {
      devices =
        this.props.searchResult && this.props.searchResult.length !== 0
          ? this.sortSearcResultDevices(sortBy) //this.props.searchResult
          : sortBy === 'locTime'
          ? this.sortDataByLastSeen()
          : sortBy === 'utilization'
          ? this.sortDataByUtilization()
          : null;
    } else {
      // console.log(this.props.searchResult);
      devices =
        this.props.searchResult && this.state.searchString
          ? this.props.searchResult
          : this.props.devices && this.props.pois && [...this.props.pois, ...this.props.devices];
    }
    // filtering by groups
    if (this.props.groupFilter.length > 0) {
      devices = filterByGroup(devices, this.props.groupFilter);
    }

    const filter = this.props.filter;
    let displayedDevices = [];

    if (
      filter.indexOf('Tag') > -1 &&
      filter.indexOf('IOX') > -1 &&
      filter.indexOf('Fixed') > -1 &&
      filter.indexOf('Locator') > -1 &&
      filter.indexOf('Anchor') > -1
    ) {
      displayedDevices = devices;
    } else {
      devices.map((marker) => {
        if (filter.indexOf('IOX') > -1 && marker.protocol === 'IOX' && !marker.fixAsset) {
          displayedDevices.push(marker);
        }
        if (
          filter.indexOf('Tag') > -1 &&
          marker.deviceType === 'Tag' &&
          !marker.isAnchor &&
          !marker.fixAsset &&
          ['BLE', 'LTE'].includes(marker.protocol)
        ) {
          displayedDevices.push(marker);
        }
      });
    }

    return displayedDevices;
  }

  // display list contents
  eventsList(sortBy) {
    try {
      // display list of new events in the list
      let events = this.props.newEvents.events;
      return (
        <div>
          <div
            style={{
              height: '47px',
              zIndex: '10',
              width: '320px',
              top: this.props.loginType === 'verifyGeotabAddinAccount' ? '90px' : '50px'
            }}
          ></div>
          {this.listHeader()}
          {events.length === 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '95px' }}>
              <strong>No events added!</strong>
            </div>
          )}
          <div style={{ width: 240 }}>
            <List
              style={{
                marginTop:
                  this.props.hideHeaderFooter && !this.props.wrldMapOnly
                    ? 37
                    : this.state.sortSelected
                    ? '128px'
                    : '87px', //this.props.loginType === 'verifyGeotabAddinAccount' ? '115px' : '65px',
                marginBottom: this.props.loginType === 'verifyGeotabAddinAccount' ? '120px' : '200px',
                paddingTop: 0
              }}
              className="list-group"
            >
              {/* list each event as a row in event list */}
              {events.map((event) => {
                return this.eventRow(event);
              })}
            </List>
          </div>
        </div>
      );
    } catch (e) {
      console.log('Devices list error');
    }
  }

  render() {
    return (
      <div>
        <div
          style={{
            padding: '1px',
            width: 240, //this.props.loginType === 'verifyGeotabAddinAccount' ? '330px' : '305px',
            height: '100vh',
            position: 'fixed',
            overflowY: 'scroll',
            overflowX: 'hidden',
            background: variables.LIGHT_GRAY_COLOR,
            zIndex: '100',
            // left: this.state.listOpen ? '0' : '-320px',
            marginLeft: this.state.listOpen ? '0px' : '-320px',
            transition: 'all 100ms ease',
            top: this.props.wrldMapOnly ? 50 : 'auto'
          }}
        >
          {this.state.sortSelected === 'Last seen'
            ? this.eventsList('locTime')
            : this.state.sortSelected === 'utilization'
            ? this.eventsList('utilization')
            : this.eventsList()}
        </div>

        {this.openListButton()}
      </div>
    );
  }
}

const mapStateToProps = ({ map, user, location, provision }) => ({
  // map,
  devices: map.devices,
  locators: map.locators,
  pois: map.pois,
  metrics: map.metrics,
  wrldMap: map.wrldMap,
  syncFilterWithMap: map.syncFilterWithMap,
  tags: map.tags,
  tagsWithMetricsData: map.tagsWithMetricsData,
  locatorsWithLocTime: map.locatorsWithLocTime,
  searchResult: map.searchResult,
  database: user.database,
  routerLocation: location.routerLocation,
  loginType: user.loginType,
  showAdvanceTool: location.showAdvanceTool,
  group: user.group,
  groupFilter: user.groupFilter,
  deviceSelected: map.deviceSelected,
  filter: location.filter,
  screenWidth: location.screenWidth,
  hideHeaderFooter: map.hideHeaderFooter,
  userTenant: provision.userTenant,
  allTenants: provision.allTenants,
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount'
});

const mapDispatch = ({
  map: {
    getAllDevicesAction,
    getSearchResultAction,
    getMetricsAction,
    getPoisAction,
    syncFilterWithMapAction,
    setDeviceSelectedAction,
    getZonesAction,
    getTripHistoryAction,
    setDeviceToFollowAction
  },
  location: { renderComponentAction }
}) => ({
  getDevices: getAllDevicesAction,
  getSearchResult: getSearchResultAction,
  getMetrics: getMetricsAction,
  getPois: getPoisAction,
  syncFilterWithMapState: syncFilterWithMapAction,
  setDeviceSelected: setDeviceSelectedAction,
  renderComponent: renderComponentAction,
  getZones: getZonesAction,
  getTripHistory: getTripHistoryAction,
  setDeviceToFollow: setDeviceToFollowAction
});

export default React.memo(connect(mapStateToProps, mapDispatch)(DevList));
