import React, { Component } from 'react';
import * as turf from '@turf/turf';
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
  ListItem,
  Accordion,
  AccordionSummary,
  Badge,
  AccordionDetails,
  TablePagination
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import SortIcon from '@mui/icons-material/Sort';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import ClearIcon from '@mui/icons-material/Clear';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CellTowerIcon from '@mui/icons-material/CellTower';
import PinDropIcon from '@mui/icons-material/PinDrop';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HistoryIcon from '@mui/icons-material/History';
import HomeIcon from '@mui/icons-material/Home';
import { connect } from 'react-redux';
import Fuse from 'fuse.js';
import moment from 'moment';
import arraySort from 'array-sort';
import variables from '../../variables.json';
import { applyFilters } from '../../util/filters';
import MarkerFilterButton from './MarkerFilterButton';
import { statusColor } from '../../util/statusColor';
import { getLastSeenMoment, getLastSeen } from '../../util/getLastSeen';
import FilterByStatusButton from './FilterByStatusButton';
import { fitBuilding } from '../../util/mapUtils';
import { MarkerContext } from '../../context/Map/MarkerContext';

let result;

const searchOptions = {
  shouldSort: true,
  threshold: 0.01,
  location: 0,
  distance: 999999999,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: ['assetName', 'name', 'deviceId']
};
class MapList extends Component {
  state = {
    custom: [true, false],
    collapseList: {},
    listOpen: false,
    selected: {},
    editMood: false,
    dropdownOpen: false,
    sortSelected: null,
    searchBarOpen: false,
    syncFilterWithMap: true,
    anchorSortEl: null,
    collapseAll: false,
    currentPage: 0
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

  handleCollapseAll(collapse) {
    let list = { ...this.state.collapseList };
    this.props.pois.map((poi) => {
      list = { ...list, [poi.poiId]: collapse };
    });
    this.props.devices.map((device) => {
      list = { ...list, [device.deviceId]: collapse };
    });
    this.setState({ ...this.state, collapseList: list, collapseAll: collapse });
  }

  handleSearchChange(e) {
    e.preventDefault();

    const fuse = new Fuse([...this.props.devices, ...this.props.pois], searchOptions);
    result = fuse.search(e.target.value);

    this.setState({ ...this.state, result });
    this.props.setSearchString(e.target.value);
    this.props.getSearchResult(result);
    this.props.setDeviceSelected('');
  }

  utilizationColor(device) {
    // console.log(device);
    // let { utilization } = device.metrics;
    // utilization = utilization * 100;
    // console.log(device);
    let utilization = device.utilization * 100;
    // console.log(utilization);
    if (utilization && utilization > 70) {
      return '#28a745'; // success
    } else if (utilization >= 50 && utilization <= 70) {
      return '#ffc107'; // warning
    } else {
      return '#f86c6b'; // danger
    }
  }

  async handleSelectedDevice(e, device, setSelectedDeviceList) {
    e.preventDefault();

    // Get current map bearing
    const bearing = this.props.mapbox?.getBearing();

    // Jump to device location on the map if the device is not a POI item
    if (this.props.mapbox && device?.location?.lng && device?.location?.lat && device.deviceId) {
      this.props.setViewState
        ? this.props.setViewState({ latitude: device.location.lat, longitude: device.location.lng, zoom: 20 })
        : this.props.mapbox.jumpTo({
            center: [device.location.lng, device.location.lat],
            zoom: 20,
            ...(bearing && { bearing: bearing })
          });
    }

    // Check if the selected device is a POI item
    if (device.type) {
      // Notify the parent component about the selected POI (Image)
      if (device.type === 'Image') {
        this.props.onPoiSelected(device);
      }
    }

    // Handle exit from indoor if marker is outside indoor
    // Fit building if the device type is 'Building'
    if (device.poiId && device.type && device.type === 'Building') {
      fitBuilding(device, this.props.mapbox);
    }
    setSelectedDeviceList && setSelectedDeviceList([]);

    // Check if device has a valid location
    if (!device.location || !device.location?.lat || !device.location.lng) return;

    // Update state and set the selected device
    this.setState({ selected: device });
    this.props.setDeviceSelected(device);
    device.deviceType === 'Tag' ? this.props.setDeviceToFollow(device) : this.props.setDeviceToFollow('');
  }

  msToTime(duration) {
    let minutes = parseInt((duration / (1000 * 60)) % 60),
      hours = parseInt((duration / (1000 * 60 * 60)) % 24);

    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return hours + ':' + minutes;
  }

  lastLoc(device) {
    if (!device.location || device.location.lat === undefined || device.location.lng === undefined) return 'N/A';
    // const locationTime = getLastSeenMoment(device);
    const locationTime = moment(device.locTime || device.stateTime || device.eventTime || device.updatedAt);
    return locationTime.startOf('minute').fromNow(true);
  }

  movingStopOutOfRangeStatus(device) {
    const now = moment().valueOf();
    if (device.deviceType === 'Locator' || device.isAnchor) {
      return `${device.status || 'Active'}`;
    } else if (
      !device.location ||
      device.location.lat === undefined ||
      device.location.lng === undefined ||
      (device.fixAsset && device.protocol === 'LTE')
    ) {
      return 'Activated';
      // } else if (
      //   device.deviceType === 'Tag' &&
      //   fixIOXSubscription &&
      //   now - moment(device.lastSeen || device.eventTime).valueOf() > variables.OUT_OF_RANGE_DELAY
      //   // (device.scanDrops || now - moment(device.locTime || device.eventTime).valueOf() > variables.OUT_OF_RANGE_DELAY) // more than 15 min
      // ) {
      //   return 'Out of range';
    } else if (
      device.telemetry &&
      device.telemetry.isMoving &&
      device.telemetry.isMoving !== 'false' &&
      moment().valueOf() - moment(device.lastSeen || device.eventTime).valueOf() <= 120000
    ) {
      return 'Moving';
    } else {
      return 'Stopped';
    }
  }

  async goToFindPage(device) {
    // console.log(
    //   navigator.geolocation.getCurrentPosition((position) => {
    //     console.log(position);
    //   })
    // );
    this.props.setDeviceSelected(device);
    this.props.renderComponent('locate');
  }
  detectMob() {
    const toMatch = [/Android/i, /webOS/i, /iPhone/i, /iPad/i, /iPod/i, /BlackBerry/i, /Windows Phone/i];

    return toMatch.some((toMatchItem) => {
      return navigator.userAgent.match(toMatchItem);
    });
  }

  deviceRow(device) {
    if (!device || !device.deviceId) return;
    let userTenant = this.props.userTenant;
    if (userTenant.organization !== this.props.database) {
      const selectedTenant =
        this.props.allTenants && this.props.allTenants.find((t) => t.organization === this.props.database);
      selectedTenant && (userTenant = selectedTenant);
    }
    // Last Seen
    const timeProp = getLastSeen(device);
    const lastSeen = moment(timeProp).startOf('minute').fromNow(true);
    // Last Location (stopped: " ")
    const lastLoc = this.lastLoc(device);
    // Fix IOX Subscription
    // const fixIOXSubscription = userTenant && userTenant.subscriptions && userTenant.subscriptions.fixIOX;
    // Status
    const status = this.movingStopOutOfRangeStatus(device);
    const colourStatus = statusColor(device, timeProp);
    try {
      return (
        <ListItem
          style={{
            background:
              device.deviceId === this.props.deviceSelected.deviceId
                ? this.props.wrldMapOnly
                  ? variables.SELECTED_GEOTAB_COLOR
                  : variables.SELECTED_ORANGE_COLOR
                : variables.WHITE_COLOR,
            padding: 0
          }}
          className="list-group-item list-group-item-action"
          key={device.deviceId}
        >
          <MarkerContext.Consumer>
            {({ setSelectedDeviceList }) => (
              <Accordion
                expanded={!this.state.collapseList[device.deviceId]}
                style={{
                  width: '100%',
                  maxWidth: 'inherit',
                  borderRadius: 0,
                  border: '1px solid rgba(0,0,0,.125)',
                  padding: 10,
                  background:
                    device.deviceId === this.props.deviceSelected.deviceId
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
                    this.handleToggle(device);
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center' }}
                    onClick={(e) => {
                      this.handleSelectedDevice(e, device, setSelectedDeviceList);
                    }}
                  >
                    {device.deviceType === 'Tag' && !device.isAnchor && !device.fixAsset ? (
                      <LocationOnIcon fontSize="large" />
                    ) : device.deviceType === 'Tag' && device.isAnchor ? (
                      <div style={{ width: '35px', display: 'flex', justifyContent: 'center' }}>
                        <i className="fas fa-map-pin fa-3x"></i>
                      </div>
                    ) : device.deviceType === 'Tag' && device.fixAsset ? (
                      <PinDropIcon fontSize="large" />
                    ) : (
                      <CellTowerIcon fontSize="large" />
                    )}
                    <strong
                      style={{
                        color: this.props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
                        marginLeft: 10
                      }}
                    >
                      {(device.assetName && device.assetName.toUpperCase()) ||
                        `${device.deviceType}-${device.deviceId}`}
                    </strong>
                  </div>
                </AccordionSummary>
                <AccordionDetails
                  style={{ fontSize: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', padding: 0 }}
                  onClick={(e) => {
                    this.handleSelectedDevice(e, device, setSelectedDeviceList);
                  }}
                >
                  <span>
                    <strong>Status: </strong>
                    <Chip
                      style={{
                        backgroundColor: colourStatus,
                        color: colourStatus === '#c8ced3' || !colourStatus ? '#000' : '#fff',
                        height: 16,
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 5
                      }}
                      size="small"
                      label={status}
                    />
                  </span>
                  {this.props.tagsWithMetricsData &&
                    this.props.tagsWithMetricsData.map((tag) => {
                      if (tag.deviceId === device.deviceId && !device.isAnchor) {
                        // console.log(tag);
                        // console.log(device);
                        return (
                          <span key={tag.deviceId}>
                            <strong>Utilization: </strong>
                            <Chip
                              size="small"
                              label={tag && !isNaN(tag.utilization) && `${Math.abs(tag.utilization * 100).toFixed(2)}%`}
                              style={{
                                backgroundColor: this.utilizationColor(tag),
                                color: this.utilizationColor(tag) === '#ffc107' ? '#000' : '#fff',
                                height: 16,
                                fontSize: 11,
                                fontWeight: 700,
                                borderRadius: 5
                              }}
                            />
                          </span>
                        );
                      }
                    })}
                  {((lastSeen !== lastLoc && !device.isAnchor && !device.fixAsset) ||
                    (['BLE', 'OTS.BLE'].includes(device) &&
                      !device.isAnchor &&
                      !device.fixAsset &&
                      lastLoc === 'N/A')) && (
                    <span>
                      <strong>Stopped: </strong>
                      {lastLoc}
                    </span>
                  )}
                  {/* hide last seen for anchors */}
                  {!device.isAnchor && (
                    <span>
                      <strong>Last seen: </strong>
                      {lastSeen}
                    </span>
                  )}
                  {/* <span>
                  <strong>Coordinate: </strong>
                  <span>
                    {device.location && device.location.lat && device.location.lat.toFixed(5)},{' '}
                    {device.location && device.location.lng && device.location.lng.toFixed(5)}
                  </span>
                  <strong style={{ marginLeft: 5 }}>
                    {' '}
                    {device.deviceType === 'Tag' && device.location && 'Elevation:'}{' '}
                  </strong>{' '}
                  {device.deviceType === 'Tag' && device.location && device.location.alt
                    ? device.location.alt.toFixed(2)
                    : device.deviceType === 'Tag'
                    ? 0
                    : ''}
                </span>
                <br /> */}
                  {device.deviceType === 'Tag' && this.props.showAdvanceTool && (
                    <>
                      <div style={{ display: 'flex' }}>
                        <strong style={{ marginRight: 3 }}>{device.locators && 'Locs: '}</strong>
                        {device.locators && device.locators.length}

                        {device.fixAsset && (
                          <div style={{ marginLeft: 10 }}>
                            <strong>{'Accuracy: '}</strong>
                            {device.locError && device.locError.accuracy !== null
                              ? device.locError.accuracy.toFixed(2)
                              : 'N/A'}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </AccordionDetails>
                {/* <div>
                {this.props.screenWidth < 1000 && device.deviceType === 'Tag' && (
                  // {this.detectMob() && device.deviceType === 'Tag' && (
                  <span>
                    <Button
                      component="button"
                      style={{
                        fontWeight: 600,
                        backgroundColor: variables.ORANGE_COLOR,
                        padding: '3px',
                        fontSize: '12px',
                        color: variables.WHITE_COLOR
                      }}
                      onClick={() => this.goToFindPage(device)}
                    >
                      Locate
                    </Button>
                  </span>
                )}
              </div> */}
              </Accordion>
            )}
          </MarkerContext.Consumer>
        </ListItem>
      );
    } catch (e) {
      console.log('Device row error', e);
    }
  }

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
            value={this.props.searchString}
            onChange={(e) => this.handleSearchChange(e)}
            height={100}
            style={{ width: '100%' }}
            sx={{ border: 'none', '& fieldset': { border: 'none' } }}
            InputProps={{
              endAdornment: this.props.searchString && (
                <InputAdornment position="end">
                  <Tooltip title="Clear search">
                    <ClearIcon
                      style={{ color: variables.LIGHT_GRAY_COLOR, cursor: 'pointer' }}
                      onClick={() => {
                        this.props.setSearchString('');
                        this.setState({ result: [] });
                        this.props.getSearchResult([]);
                      }}
                    />
                  </Tooltip>
                </InputAdornment>
              )
            }}
          />

          {this.historyButton()}
        </div>
      );
    } catch (e) {
      // console.log("serchBar", e);
    }
  }

  openListButton() {
    return (
      <Badge
        style={{
          position: 'fixed',
          marginTop: '50px',
          marginLeft: this.props.hideHeaderFooter
            ? -100
            : this.props.isListOpen
            ? this.props.screenWidth < 1000
              ? 170
              : 320
            : 0,
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
          top: this.props.wrldMapOnly || this.props.loginType === 'verifyGeotabAddinAccount' ? 50 : 0
        }}
        onClick={() => {
          this.props.setIsListOpen(!this.props.isListOpen);
        }}
      >
        <i
          style={{
            color: this.props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
            fontSize: '26px'
          }}
          className={this.props.isListOpen ? 'fa fa-caret-left' : 'fa fa-caret-right'}
        ></i>
      </Badge>
    );
  }

  handleSortOpen(event) {
    this.setState({ ...this.state, anchorSortEl: event.currentTarget });
  }
  handleSortClose() {
    this.setState({ ...this.state, anchorSortEl: null });
  }

  dropdownSortingButton() {
    const open = Boolean(this.state.anchorSortEl);
    return (
      <div>
        <Tooltip
          title={
            this.state.sortSelected === 'Last seen'
              ? 'Sorted by last seen'
              : this.state.sortSelected === 'utilization'
              ? 'Sorted by utilization'
              : 'Sort'
          }
          aria-label="sort"
        >
          <IconButton
            aria-label="sort"
            onClick={(e) => this.handleSortOpen(e)}
            style={{
              color: this.state.sortSelected
                ? variables.GREEN_COLOR
                : this.props.wrldMapOnly
                ? variables.GEOTAB_PRIMARY_COLOR
                : variables.ORANGE_COLOR,
              zIndex: '10'
            }}
            size="small"
          >
            <SortIcon />
          </IconButton>
        </Tooltip>
        <Menu
          id="sort-menu"
          anchorEl={this.state.anchorSortEl}
          keepMounted
          open={open}
          onClose={() => this.handleSortClose()}
        >
          <MenuItem
            key="lastSeen"
            onClick={async () => {
              await this.setState({ sortSelected: 'Last seen' });
              await this.handleSortClose();
            }}
            selected={this.state.sortSelected === 'Last seen'}
          >
            Last seen
          </MenuItem>
        </Menu>
      </div>
    );
  }

  async handleRefreshClicked() {
    await this.props.getDevices({
      database: this.props.database
    });

    // await this.props.getMetrics();
    await this.props.getPois({
      database: this.props.database,
      token: this.props.token
    });
    // Only get zones if the filter includes 'Zones'
    if (this.props.filter.indexOf('Zones') > -1) {
      await this.props.getZones();
    }
  }

  refreshButton() {
    return (
      <div style={{ display: 'flex' }}>
        <Tooltip title={'Refresh'} aria-label="refresh">
          <IconButton
            aria-label="refresh"
            onClick={() => this.handleRefreshClicked()}
            style={{
              color: this.props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
              zIndex: '10'
            }}
            size="small"
          >
            <SyncIcon />
          </IconButton>
        </Tooltip>
      </div>
    );
  }

  renderBuildingItem(poiItem) {
    try {
      return (
        <ListItem
          style={{
            padding: 0
          }}
          className="list-group-item list-group-item-action"
          key={poiItem.poiId}
        >
          <Accordion
            expanded={!this.state.collapseList[poiItem.poiId]}
            style={{
              width: '100%',
              borderRadius: 0,
              border: '1px solid rgba(0,0,0,.125)',
              padding: 10,
              background:
                this.props.deviceSelected &&
                this.props.deviceSelected.poiId &&
                poiItem.poiId === this.props.deviceSelected.poiId
                  ? this.props.wrldMapOnly
                    ? variables.SELECTED_GEOTAB_COLOR
                    : variables.SELECTED_ORANGE_COLOR
                  : variables.WHITE_COLOR
            }}
          >
            <AccordionSummary
              style={{ height: 35, minHeight: 35, padding: 0 }}
              expandIcon={<ExpandMoreIcon fontSize="small" />}
              name="summary"
              onClick={(e) => {
                const isDiv = e.target.localName === 'div';
                const classname = isDiv && e.target.className.split(' ');
                if (!classname || !classname.includes('MuiAccordionSummary-content')) return;
                this.handleToggle(poiItem);
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center' }}
                onClick={(e) => {
                  this.handleSelectedDevice(e, poiItem);
                }}
              >
                <HomeIcon fontSize="large" />
                <strong
                  style={{
                    color: this.props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
                    marginLeft: 10
                  }}
                >
                  {poiItem.name.toUpperCase()}
                </strong>
              </div>
            </AccordionSummary>
            <AccordionDetails
              style={{ fontSize: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', padding: 0 }}
              onClick={(e) => {
                this.handleSelectedDevice(e, poiItem);
              }}
            >
              <span>
                <strong>Address: </strong>
                <span>{poiItem.address}</span>
              </span>
              <span>
                <strong>Coordinate: </strong>
                <span>
                  {poiItem.location && poiItem.location.lat.toFixed(6)},{' '}
                  {poiItem.location && poiItem.location.lng.toFixed(6)}
                </span>
              </span>
            </AccordionDetails>
          </Accordion>
        </ListItem>
      );
    } catch (error) {}
  }

  clearFilterOrSorting() {
    return (
      <div style={{ margin: 'auto', display: 'flex', justifyContent: 'space-evenly' }}>
        {this.state.sortSelected && (
          <Chip
            style={{ margin: '8px 0' }}
            label={`Sorted by ${this.state.sortSelected}`}
            size="small"
            icon={<ClearIcon />}
            onClick={() => {
              this.setState({ ...this.state, sortSelected: null });
            }}
          />
        )}
      </div>
    );
  }

  listHeader() {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
          background: variables.WHITE_COLOR,
          paddingLeft: '5px',
          borderRadius: 2,
          boxShadow: '0 4px 8px 0 rgba(0,0,0,0.10)',
          marginLeft: 1,
          width: this.props.screenWidth < 1000 ? 166 : 316,
          top: this.props.hideHeaderFooter && !this.props.wrldMapOnly ? 47 : 'auto'
        }}
      >
        <div
          style={{
            marginTop: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>{this.searchBarAndButton()}</div>
          <Divider />
          <div
            style={{
              display: 'flex',
              width: this.props.screenWidth < 1000 ? 146 : 316,
              justifyContent: 'space-evenly'
            }}
          >
            {this.dropdownSortingButton()}
            {this.filterByStatusButton()}
            {this.filterButton()}
            {this.refreshButton()}
            {/* {this.syncButton()} */}
            {this.collapseButton()}
          </div>
          {this.clearFilterOrSorting()}
        </div>
      </div>
    );
  }

  historyButton() {
    return (
      <Tooltip title={`View trip history`}>
        <IconButton
          style={{
            color: this.props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
            zIndex: '10',
            marginRight: 16
          }}
          aria-label="history"
          onClick={() => {
            // this.props.setDeviceSelected(device);
            const currDevice = this.props.deviceSelected;
            this.props.getTripHistory({
              ...(currDevice
                ? currDevice
                : {
                    deviceId: '',
                    organization: this.props.database,
                    groups: [this.props.group]
                  }),
              isNormalized: false,
              isGrouped: true
            });
            this.props.renderComponent('trip');
          }}
          size="large"
        >
          <HistoryIcon />
        </IconButton>
      </Tooltip>
    );
  }

  handleChangePage = (event, newPage) => {
    this.setState({ currentPage: newPage });
  };

  collapseButton() {
    return (
      <div
        style={{ display: 'flex', width: '30px', height: '30px', justifyContent: 'center' }}
        onClick={() => {
          this.handleCollapseAll(!this.state.collapseAll);
        }}
      >
        <Tooltip title={this.state.collapseAll ? 'Expand all' : 'Collapse all'} aria-label="collapse">
          <IconButton
            aria-label="collapse"
            component="span"
            size="small"
            style={{
              color: this.props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
              width: '100%'
            }}
          >
            {this.state.collapseAll ? <i className="fas fa-expand-alt"></i> : <i className="fas fa-compress-alt"></i>}
          </IconButton>
        </Tooltip>
      </div>
    );
  }

  filterButton() {
    return (
      <div>
        <MarkerFilterButton />
      </div>
    );
  }

  filterByStatusButton() {
    return (
      <div>
        <FilterByStatusButton
          routerLocation={this.props.routerLocation}
          wrldMapOnly={this.props.wrldMapOnly}
          {...this.props.filterByActivityAdapter}
        />
      </div>
    );
  }

  syncButton() {
    return (
      <div
        onClick={() => {
          this.props.syncFilterWithMapState();
          this.setState({
            syncFilterWithMap: !this.state.syncFilterWithMap
          });
        }}
      >
        <Tooltip
          title={this.props.syncFilterWithMap ? 'Show all devices on map' : 'Show search result on map'}
          aria-label="sync-with-map"
        >
          <IconButton
            style={{
              color: this.props.syncFilterWithMap
                ? variables.GREEN_COLOR
                : this.props.wrldMapOnly
                ? variables.GEOTAB_PRIMARY_COLOR
                : variables.ORANGE_COLOR
            }}
            aria-label="sync-with-map"
            component="span"
            size="small"
          >
            <SyncAltIcon />
          </IconButton>
        </Tooltip>
      </div>
    );
  }

  compareTime(prop) {
    return (a, b) => {
      const diff = moment.duration(
        moment(a[prop] || a.locTime || a.updatedAt).diff(moment(b[prop] || b.locTime || b.updatedAt))
      );
      return diff;
    };
  }
  sortDataByLastSeen(devices) {
    const tags = devices.filter((device) => device.deviceType === 'Tag');
    const sortedMetrics = arraySort(tags, this.compareTime('lastSeen'), { reverse: true });
    // console.log('sortedMetrcis:', sortedMetrics);
    // let sortedMetrcis = arraySort(tags, 'locTime', { reverse: true });
    let filterLocatorsWithLocTime = this.props.locators.filter((loc) => loc.lastSeen);
    // console.log('filterLocatorsWithLocTime:', filterLocatorsWithLocTime);
    let filterLocatorsWithNoLocTime = this.props.locators.filter((loc) => !loc.lastSeen);
    // console.log('filterLocatorsWithNoLocTime:', filterLocatorsWithNoLocTime);
    filterLocatorsWithLocTime = arraySort(filterLocatorsWithLocTime, 'lastSeen', { reverse: true });
    filterLocatorsWithNoLocTime = arraySort(filterLocatorsWithNoLocTime, 'updatedAt', { reverse: true });
    return [...sortedMetrics, ...filterLocatorsWithLocTime, ...filterLocatorsWithNoLocTime];
  }

  // Unused function to sort tags by utilization
  // sortDataByUtilization() {
  //   let tagUtilization = {};
  //   this.props.tagsWithMetricsData.map((tag) => (tagUtilization[tag.deviceId] = tag.utilization));
  //   let tags = [];
  //   this.props.devices.map(
  //     (device) => device.deviceType === 'Tag' && tags.push({ ...device, utilization: tagUtilization[device.deviceId] })
  //   );
  //   return arraySort([...tags, ...this.props.locators], 'utilization');
  // }

  // Unused function to sort search result devices by last seen or utilization
  // sortSearcResultDevices(sortBy) {
  //   let sortedResult = [];
  //   let tagsSearchResult = [];
  //   let locatorsSearchResult = [];
  //   if (sortBy === 'lastSeen') {
  //     this.props.searchResult.forEach((result) =>
  //       result.deviceType === 'Tag' ? tagsSearchResult.push(result) : locatorsSearchResult.push(result)
  //     );
  //     arraySort(tagsSearchResult, this.compareTime('lastSeen'), { reverse: true });
  //     let filterLocatorsWithLocTime = locatorsSearchResult.filter((loc) => loc.lastSeen);
  //     let filterLocatorsWithNoLocTime = locatorsSearchResult.filter((loc) => !loc.lastSeen);
  //     filterLocatorsWithLocTime = arraySort(filterLocatorsWithLocTime, 'lastSeen', { reverse: true });
  //     filterLocatorsWithNoLocTime = arraySort(filterLocatorsWithNoLocTime, 'updatedAt', { reverse: true });
  //     sortedResult = [...tagsSearchResult, ...filterLocatorsWithLocTime, ...filterLocatorsWithNoLocTime];
  //   } else if (sortBy === 'utilization') {
  //     this.props.searchResult.forEach((result) => {
  //       if (result.deviceType === 'Locator') locatorsSearchResult.push(result);
  //     });
  //     this.props.tagsWithMetricsData &&
  //       this.props.tagsWithMetricsData.forEach((devWithMetrics) => {
  //         this.props.searchResult.forEach((result) => {
  //           if (result.deviceId === devWithMetrics.deviceId) tagsSearchResult.push(devWithMetrics);
  //         });
  //       });
  //     arraySort(tagsSearchResult, 'utilization');
  //     sortedResult = [...tagsSearchResult, ...locatorsSearchResult];
  //   } else {
  //     sortedResult = this.props.searchResult;
  //   }
  //   return sortedResult;
  // }

  getListDevices(sortBy) {
    if (!this.props.devices) return [];
    let devices = [...(this.props.pois ?? []), ...this.props.devices];

    let displayedDevices = applyFilters(
      devices,
      this.props.searchResult,
      this.props.groupFilter,
      this.props.filterByActivityAdapter,
      this.props.filter,
      this.props.accuracyFilter,
      this.props.searchString
    );

    // Prioritize the selected device if it exist ds
    if (this.props.deviceSelected) {
      const selectedDeviceIndex = displayedDevices.findIndex(
        (device) => device.deviceId === this.props.deviceSelected.deviceId
      );
      if (selectedDeviceIndex !== -1) {
        // Move the selected device to the top
        const [selectedDevice] = displayedDevices.splice(selectedDeviceIndex, 1);
        displayedDevices.unshift(selectedDevice);
      }
    }

    if (sortBy === 'lastSeen') {
      displayedDevices.sort((a, b) => {
        const lastSeenA = getLastSeen(a);
        const lastSeenB = getLastSeen(b);
        return lastSeenB - lastSeenA;
      });
      // displayedDevices = this.sortDataByLastSeen(displayedDevices);
    }

    // If pagination is needed, ensure the current page is valid based on the filtered devices
    const itemsPerPage = 100;
    const totalDevices = displayedDevices.length;
    const maxPage = Math.max(0, Math.floor((totalDevices - 1) / itemsPerPage));
    if (this.state.currentPage > maxPage) {
      this.setState({ currentPage: maxPage });
    }

    return displayedDevices || [];
  }

  filterDisplayedDevices(devices) {
    const filter = this.props.filter;
    if (['Tag', 'IOX', 'Fixed', 'Locator', 'Anchor'].every((type) => filter.includes(type))) {
      return devices;
    }

    return devices?.filter((marker) => {
      if (marker.poiId) return true;
      return (
        (filter.includes('Anchor') && marker.isAnchor) ||
        (filter.includes('IOX') && marker.protocol === 'IOX' && !marker.fixAsset) ||
        (filter.includes('Fixed') && marker.fixAsset) ||
        (filter.includes('Tag') &&
          marker.deviceType === 'Tag' &&
          !marker.isAnchor &&
          !marker.fixAsset &&
          marker.protocol !== 'IOX') ||
        (filter.includes('Locator') && marker.deviceType === 'Locator')
      );
    });
  }

  devicesList(sortBy) {
    try {
      let devices = this.getListDevices(sortBy);
      const { currentPage } = this.state;
      const itemsPerPage = 100;
      const paginatedDevices = devices.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

      if (!devices) {
        return (
          <div
            style={{
              display: 'flex',
              position: 'fixed',
              zIndex: 10,
              background: variables.LIGHT_GRAY_COLOR,
              margin: this.props.screenWidth < 1000 ? '100px 20px' : '100px',
              alignItems: 'center'
            }}
          >
            {this.refreshButton()}
            <div>
              <strong>No data provided!</strong>
            </div>
          </div>
        );
      }
      return (
        <div style={{ height: '100%', width: '100%' }}>
          <div
            style={{
              height: '47px',
              zIndex: '10',
              width: '320px',
              top: this.props.loginType === 'verifyGeotabAddinAccount' ? '90px' : '50px',
              overflow: 'hidden'
            }}
          ></div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              height: 'calc(100% - 47px)',
              width: '100%'
            }}
          >
            {this.listHeader()}
            {devices.length === 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '95px', width: '100%' }}>
                <strong>Filtered data is empty</strong>
              </div>
            )}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <List
                style={{
                  marginTop: this.props.hideHeaderFooter && !this.props.wrldMapOnly ? 37 : 0,
                  marginBottom: this.props.loginType === 'verifyGeotabAddinAccount' ? '120px' : '0px',
                  paddingTop: 0,
                  width: '100%'
                }}
                className="list-group"
              >
                {paginatedDevices &&
                  paginatedDevices.map((device) => {
                    if (
                      device.type === 'Building' ||
                      device.type === 'Yard' ||
                      device.type === 'Parking' ||
                      device.type === 'Image'
                    ) {
                      return this.renderBuildingItem(device);
                    } else {
                      return this.deviceRow(device);
                    }
                  })}
              </List>
            </div>
            {this.getListDevices().length > 100 && (
              <TablePagination
                rowsPerPageOptions={[]}
                labelRowsPerPage=""
                component="div"
                count={this.getListDevices().length} // Corrected count
                page={this.state.currentPage}
                onPageChange={this.handleChangePage}
                rowsPerPage={100}
                style={{ borderTop: '2px solid rgba(0, 0, 0, 0.2)', background: variables.WHITE_COLOR }}
                // variant="outlined" shape="rounded"
              />
            )}
          </div>
        </div>
      );
    } catch (e) {
      console.log('Devices list error', e);
      this.props.setIsListOpen(false);
    }
  }

  createMetricsInterval(time) {
    this.intervalMetrics = setInterval(() => {
      this.props.getMetrics();
    }, time);
    // console.log(this.intervalMetrics);
  }

  createZoneInterval(time) {
    this.intervalZone = setInterval(() => {
      this.props.getZones();
    }, time);
    // console.log(this.intervalMetrics);
  }

  componentDidMount() {
    // open list if not full screen indoor addin or mobile
    this.props.screenWidth >= 1000 &&
      this.props.displayIndoor &&
      this.props.displayedMap !== 'wrld' &&
      this.props.setIsListOpen(true);

    if (this.props.filter.indexOf('Zones') > -1) {
      this.props.getZones();
      // this.createMetricsInterval(5 * 60 * 1000);
      this.createZoneInterval(15 * 60 * 1000);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // change the api call based on sorting
    if (prevState.sortSelected !== this.state.sortSelected && this.state.sortSelected === null) {
      clearInterval(this.intervalMetrics);
      // this.createMetricsInterval(5 * 60 * 1000);
    } else if (prevState.sortSelected !== this.state.sortSelected && this.state.sortSelected !== null) {
      clearInterval(this.intervalMetrics);
    }

    // Check if `filter` changed
    if (prevProps.filter !== this.props.filter) {
      const hadZones = prevProps.filter.indexOf('Zones') > -1;
      const hasZones = this.props.filter.indexOf('Zones') > -1;

      // If the filter changed from having zones to not having zones (or vice versa)
      if (hadZones !== hasZones) {
        if (hasZones) {
          this.props.getZones();
          this.createZoneInterval(15 * 60 * 1000);
        } else {
          clearInterval(this.intervalZone);
        }
      }
    }
  }

  componentWillUnmount() {
    // console.log("mapbox List interval cleard");
    clearInterval(this.intervalMetrics);
    clearInterval(this.intervalZone);
  }

  render() {
    return (
      <div>
        <div
          style={{
            display: 'flex',
            padding: '1px',
            width: this.props.screenWidth < 1000 ? '170px' : '320px',
            height: '100vh',
            position: 'fixed',
            overflowY: 'hidden',
            overflowX: 'hidden',
            background: variables.LIGHT_GRAY_COLOR,
            zIndex: '100',
            // left: this.props.isListOpen ? '0' : '-320px',
            marginLeft: this.props.isListOpen ? '0px' : '-320px',
            transition: 'all 100ms ease',
            top: this.props.wrldMapOnly || this.props.loginType === 'verifyGeotabAddinAccount' ? 50 : 0
          }}
        >
          {this.state.sortSelected === 'Last seen'
            ? this.devicesList('lastSeen')
            : this.state.sortSelected === 'utilization'
            ? this.devicesList('utilization')
            : this.devicesList()}
        </div>

        {this.openListButton()}
      </div>
    );
  }
}

const mapStateToProps = ({ dashboard, map, user, location, provision }) => ({
  // map,
  allDevices: dashboard.allFacilityDevices,
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
  isListOpen: map.isListOpen,
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
    getPoisAction,
    syncFilterWithMapAction,
    setDeviceSelectedAction,
    setIsListOpenAction,
    getZonesAction,
    getTripHistoryAction,
    setDeviceToFollowAction
  },
  location: { renderComponentAction }
}) => ({
  getDevices: getAllDevicesAction,
  getSearchResult: getSearchResultAction,
  getPois: getPoisAction,
  syncFilterWithMapState: syncFilterWithMapAction,
  setDeviceSelected: setDeviceSelectedAction,
  setIsListOpen: setIsListOpenAction,
  renderComponent: renderComponentAction,
  getZones: getZonesAction,
  getTripHistory: getTripHistoryAction,
  setDeviceToFollow: setDeviceToFollowAction
});

export default React.memo(connect(mapStateToProps, mapDispatch)(MapList));
