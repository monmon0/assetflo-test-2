import React, { Component } from 'react';
import L from 'leaflet';
// import wrld3d from 'wrld.js';
import { connect } from 'react-redux';
import moment from 'moment';
import * as turf from '@turf/turf';
import async from 'async';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

import NavigationButtons from './NavigationButtons';
import variables from '../../variables.json';
import 'leaflet/dist/leaflet.css';
import './wrld3d.css';
import '../../App.scss';
// import 'leaflet.markercluster/dist/leaflet.markercluster';
// import 'leaflet.markercluster/dist/MarkerCluster.css';
// import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { filterByGroup } from '../../util/filters';
import { Button } from '@mui/material';
import { getZIndex } from '../../util/statusColor';
import { isArrayEqual } from '../../util/updateArray';
import BeatLoader from 'react-spinners/BeatLoader';
import List from './List';
import { isValidLocation } from '../../util/validation';

const OverlappingMarkerSpiderfier = window.OverlappingMarkerSpiderfier;
const locatorIcon = variables.LOCATOR_ICON;
const tagIconRed = variables.TAG_ICON_RED;
const tagIconBlack = variables.TAG_ICON_BLACK;
const tagIconGreen = variables.TAG_ICON_GREEN;
const tagIconBlue = variables.TAG_ICON_BLUE;
const tagIconGrey = variables.TAG_ICON_GREY;
const tagIconYellow = variables.TAG_ICON_YELLOW;
const ancherIcon = variables.ANCHER_ICON;
let map, mainLayer, tagLayer, locatorLayer, circleLayer;
let markerList = {};
let mounted = false;

// Archived code
class Wrld3d extends Component {
  state = {
    editMood: false,
    spider: false,
    distancePoints: [],
    polygon: null,
    rotation: 0,
    entered: false,
    searchString: ''
  };

  addMap = () => {
    if (!this.props.pois || this.props.pois.length === 0) return;
    const { location, provider, zoom, offset } = this.props.pois[0];
    if (
      !provider.apikey ||
      !provider.providerURL ||
      !location.lat ||
      !location.lng ||
      !zoom ||
      typeof offset !== 'number'
    )
      return;

    map = L.Wrld.map('map', provider.apikey, {
      center: [location.lat, location.lng],
      zoom: zoom,
      maxZoom: 21,
      minZoom: 16,
      trafficEnabled: false,
      coverageTreeManifest: provider.providerURL,
      indoorsEnabled: true,
      frameRateThrottleWhenIdleEnabled: true,
      throttledTargetFrameIntervalMilliseconds: 500,
      idleSecondsBeforeFrameRateThrottle: 15.0,
      viewVerticallyLocked: true,
      headingDegrees: offset,
      drawClearColor: variables.DARK_GRAY_COLOR,
      indoorMapBackgroundColor: variables.DARK_GRAY_COLOR,
      targetVSyncInterval: 0.5,
      headingDegrees: 0
    }).on('click', () => this.props.setDeviceSelected(''));

    L.Wrld.indoorMapFloorOutlines.indoorMapFloorOutlineInformation(provider.indoorId, 0).addTo(map);

    map.on('initialstreamingcomplete', this.onInitialStreamingComplete);

    map.indoors.on('indoormapenter', (e) => {
      if (!mounted) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const angle = h > w ? 0 : -90;
      // rotate view horizontally
      map.setView([location.lat, location.lng], zoom, {
        headingDegrees: this.props.isSplitScreen ? offset : this.state.rotation + angle,
        animate: false
      });
      // set state to entered after animation
      setTimeout(() => {
        this.setState({ ...this.state, entered: true });
      }, 300);
      // check if map empty
      setTimeout(async () => {
        if (!this.props.devices || !this.props.devices.length) {
          await this.props.getAllDevices();
          // this.setTagInterval();
          if (
            this.props.email &&
            this.props.userTenant &&
            this.props.userTenant.activation &&
            this.props.userTenant.activation.isAccepted &&
            this.props.eula
          ) {
            this.props.getTags(true);
            this.intervalDevices = setInterval(async () => {
              this.props.updateSearchResult({
                searchResultDevices: this.props.searchResult ? this.props.searchResult : []
              });
              // this.followDevice();
              // console.log(this.mapbox.getCenter());
            }, 2000);
          }
        }
      }, 1500);
    });
    // map.indoors.on('indoormapexit', () => {
    //   map.setView(
    //     this.props.deviceSelected && [this.props.deviceSelected.location.lat, this.props.deviceSelected.location.lng],
    //     zoom,
    //     { headingDegrees: offset }
    //   );
    // });
    const context = this;
    // get indoor map outline info
    map.indoorMapFloorOutlines.on('indoormapflooroutlineinformationloaded', (e) => this.getIndoorInfo(e, context));
  };

  onInitialStreamingComplete = () => {
    // console.log('onInitialStreamingComplete');
    const { provider } = this.props.pois[0];
    map.indoors.enter(provider.indoorId);
  };

  getIndoorInfo = (event, context) => {
    const outlineInformation = event.indoorMapFloorOutlineInformation;

    const polygons = outlineInformation.getIndoorMapFloorOutlinePolygons();
    // TODO: handle mutliple indoors
    // get first indoor outline (for now)
    const indoorOutline = polygons[0];

    const polyPoints = [];
    const ring = indoorOutline.getOuterRing().getLatLngPoints();
    ring.map((point) => {
      polyPoints.push([point.lng, point.lat]);
    });
    polyPoints.push([ring[0].lng, ring[0].lat]);
    // create turf polygon
    const poly = turf.polygon([polyPoints]);
    const scaledPoly = turf.transformScale(poly, 1.2);
    // console.log(poly, scaledPoly);
    // find longest side to decide on rotation -90degrees
    const longestSide = this.findLongestSide(poly);
    const bearing = turf.bearing(longestSide.pointA, longestSide.pointB);
    // console.log('bearing', bearing);
    mounted && this.setState({ rotation: bearing });
    mounted && context.setState({ polygon: scaledPoly });
  };

  findLongestSide = (poly) => {
    const geometry = poly.geometry.coordinates[0];

    const options = { units: 'meters' };

    const pointA = turf.point(geometry[0]);
    const pointB = turf.point(geometry[1]);
    // distance between first 2 points
    const initD = turf.distance(pointA, pointB, options);
    const init = { distance: initD, pointA: geometry[0], pointB: geometry[1] };
    let longest = { distance: initD, pointA: geometry[0], pointB: geometry[1] };
    // compare & find longest distance between points in polygon
    geometry.reduce((prev, curr) => {
      const a = turf.point(prev.pointB);
      const b = turf.point(curr);

      const d = turf.distance(a, b, options);

      if (d > longest.distance) longest = { distance: d, pointA: prev.pointB, pointB: curr };
      return { distance: d, pointA: prev.pointB, pointB: curr };
    }, init);
    return longest;
  };

  createIcons = () => {
    let assetFloIcon = L.Icon.extend({
      options: {
        iconSize: [35, 41],
        iconAnchor: [17, 41],
        popupAnchor: [0.5, -41]
      }
    });
    let assetFloTagIcon = L.Icon.extend({
      options: {
        iconSize: [25, 41],
        iconAnchor: [12.5, 41],
        popupAnchor: [0.25, -41]
      }
    });
    let assetFloAnchorIcon = L.Icon.extend({
      options: {
        iconSize: [40, 41],
        iconAnchor: [12, 41],
        popupAnchor: [9, -41]
      }
    });
    this.locatorIcon = new assetFloIcon({
      iconUrl: locatorIcon
    });

    this.tagIconRed = new assetFloTagIcon({
      iconUrl: tagIconRed
    });
    this.tagIconBlack = new assetFloTagIcon({
      iconUrl: tagIconBlack
    });
    this.tagIconGreen = new assetFloTagIcon({
      iconUrl: tagIconGreen
    });
    this.tagIconBlue = new assetFloTagIcon({
      iconUrl: tagIconBlue
    });
    this.tagIconGrey = new assetFloTagIcon({
      iconUrl: tagIconGrey
    });
    this.tagIconYellow = new assetFloTagIcon({
      iconUrl: tagIconYellow
    });
    this.ancherIcon = new assetFloIcon({
      iconUrl: ancherIcon
    });
    this.anchorIcon = new assetFloAnchorIcon({
      iconUrl: ancherIcon
    });
  };

  iconColor(device) {
    let userTenant = this.props.userTenant;
    if (userTenant.organization !== this.props.database) {
      const selectedTenant =
        this.props.allTenants && this.props.allTenants.find((t) => t.organization === this.props.database);
      selectedTenant && (userTenant = selectedTenant);
    }
    // const fixIOXSubscription = userTenant && userTenant.subscriptions && userTenant.subscriptions.fixIOX;
    const now = moment().valueOf();
    if (device.deviceType === 'Locator' || (device.fixAsset && device.protocol === 'IOX')) {
      return this.locatorIcon;
    } else if (device.deviceType === 'Tag' && device.isAnchor) {
      return this.anchorIcon;
      // } else if (
      //   device.deviceType === 'Tag' &&
      //   fixIOXSubscription &&
      //   now - moment(device.locTime || device.eventTime).valueOf() > variables.OUT_OF_RANGE_DELAY
      //   // (device.scanDrops || now - moment(device.locTime || device.eventTime).valueOf() > variables.OUT_OF_RANGE_DELAY) // more than 15 min
      // ) {
      //   return this.tagIconBlack; // black out of range icon
    } else if (
      device.deviceType === 'Tag' &&
      device.telemetry &&
      device.telemetry.isMoving &&
      device.telemetry.isMoving !== 'false' &&
      now - moment(device.locTime).valueOf() <= 120000 // less than 2 min
    ) {
      return this.tagIconGreen; // moving without arrow
    } else if (
      device.deviceType === 'Tag' &&
      device.telemetry !== undefined &&
      now - moment(device.locTime).valueOf() > 2419200000 // more than 28 days
    ) {
      return this.tagIconRed;
    } else if (
      device.deviceType === 'Tag' &&
      device.telemetry !== undefined &&
      now - moment(device.locTime).valueOf() > 86400000 // more than 24hours
    ) {
      return this.tagIconGrey;
    } else if (
      device.deviceType === 'Tag' &&
      device.telemetry !== undefined &&
      (!device.telemetry.isMoving || now - moment(device.locTime).valueOf() > 120000) // more than 2 min
    ) {
      return this.tagIconBlue;
    }
    // else if (
    //   device.deviceType === 'Tag' &&
    //   device.telemetry &&
    //   (!device.telemetry.isMoving || device.telemetry.isMoving === 'false') &&
    //   moment(device.locTime).valueOf() < moment() - 60 * 10 * 1000 && // 10 min
    //   moment(device.locTime).valueOf() > moment() - 60 * 60 * 1000 // 1 hours
    // ) {
    //   return this.tagIconRed;
    // }
    else if (device.deviceType === 'Ancher') {
      return this.ancherIcon;
    } else {
      return this.tagIconGrey;
    }
  }

  popupContent(device) {
    let lastSeen = moment(device.locTime || device.updatedAt)
      .startOf('minute')
      .fromNow();

    if (!this.props.showAdvanceTool) {
      return `
    <h3 style="margin-bottom:5px; background-color: #F8931C; color: white; padding: 3px; border-radius: 10px; position: center">${
      device.assetName || `${device.deviceType}-${device.deviceId}`
    }</h3>
    <span ><strong style="color: #F8931C" >MAC: </strong>${device.deviceId}</span><br/>
    <span><strong style="color: #F8931C" >Type: </strong> ${device.deviceType}</span><br/>
    <span><strong style="color: #F8931C" >Location: </strong>${device.location.lat}, ${device.location.lng}</span><br/>
    <span><strong style="color: #F8931C" >Last seen: </strong>${lastSeen}</span><br/>
    `;
    } else {
      return `
      <span style="padding:-5px"><strong style="color: #F8931C">name:</strong>${
        device.assetName || `${device.deviceType}-${device.deviceId}`
      }
      <br/> <strong style="color: #F8931C">mac:</strong>${device && device.deviceId}
      </span>`;
    }
  }

  // <span><strong style="color: #F8931C" >heading: </strong> ${
  //   device.location.heading && Math.round(device.location.heading)
  // }</span>

  popupCluster(tags, locators) {
    return `
      <p>Number of Tags: ${tags}</p>
      <p>Number of Locators: ${locators}</p>
    `;
  }

  inOutMarker(device) {
    let markerCoor = turf.point([device.location.lng, device.location.lat]);
    let position = '';
    this.state.polygon &&
      async.eachOf(
        this.props.pois,
        async (poi, index, callback) => {
          let inPoly = turf.booleanPointInPolygon(markerCoor, this.state.polygon);
          // console.log('inside', device.deviceId, inPoly);
          if (inPoly) {
            // console.log(inPoly ? poi.provider.indoorId : null, device.assetName);
            return (position = poi.provider.indoorId);
          }
          callback(true);
        },
        (e, result) => {}
      );

    return position;
  }

  clearLayer = () => {
    if (!map) return;
    try {
      // oms = new OverlappingMarkerSpiderfier(map);
      tagLayer && tagLayer.clearLayers();
      locatorLayer && locatorLayer.clearLayers();
      circleLayer && circleLayer.clearLayers();
      mainLayer && mainLayer.clearLayers();
      markerList = {};
    } catch (e) {
      console.log('Clear layer', e);
    }
  };

  getMapDevicesList = (devices, searchResult) => {
    let mapDevices = [];
    if (searchResult && searchResult.length > 0 && this.props.syncFilterWithMap) {
      mapDevices = searchResult.filter((result) => !result.poiId);
    } else {
      mapDevices = devices;
    }
    // filtering by groups
    if (this.props.groupFilter && mapDevices && this.props.groupFilter.length > 0) {
      mapDevices = filterByGroup(mapDevices, this.props.groupFilter);
    }

    let displayedDevices = [];
    const filter = this.props.filter;
    if (
      filter.indexOf('Tag') > -1 &&
      filter.indexOf('IOX') > -1 &&
      filter.indexOf('Fixed') > -1 &&
      filter.indexOf('Locator') > -1 &&
      filter.indexOf('Anchor') > -1
    ) {
      displayedDevices = mapDevices;
    } else {
      mapDevices &&
        mapDevices.map((marker) => {
          if (this.props.filter.indexOf('Anchor') > -1 && marker.isAnchor) {
            displayedDevices.push(marker);
          }
          if (filter.indexOf('IOX') > -1 && marker.protocol === 'IOX' && !marker.fixAsset) {
            displayedDevices.push(marker);
          }
          if (filter.indexOf('Fixed') > -1 && marker.fixAsset) {
            displayedDevices.push(marker);
          }
          if (filter.indexOf('Tag') > -1 && marker.deviceType === 'Tag' && !marker.isAnchor && !marker.fixAsset) {
            displayedDevices.push(marker);
          }
          if (filter.indexOf('Locator') > -1 && marker.deviceType === 'Locator') {
            displayedDevices.push(marker);
          }
        });
    }

    // console.log('filter applied', filter, displayedDevices.length);
    return displayedDevices;
  };

  getDeviceElevation = (device) => {
    let elevation = 0;
    if (device.deviceType === 'Locator') {
      elevation = device.location.alt;
    }
    if (device.deviceType === 'Tag') {
      elevation = device.locators && device.locators.length > 0 && device.locators[0].coordinates.alt;
    }
    return elevation;
  };

  markerZindex = (device) => {
    let zIndex = 1;
    if (device && device.deviceType === 'Tag') zIndex = 2;
    // if (device && device.telemetry && device.telemetry.isMoving) zIndex = 3;
    if (device.deviceId === this.props.deviceSelected.deviceId) zIndex = 3;
    return zIndex;
  };

  createMarker = (device) => {
    let marker = new L.marker([device.location.lat, device.location.lng], {
      title: device.assetName,
      id: device.deviceId,
      deviceType: device.deviceType,
      isAnchor: device.isAnchor,
      filter: this.props.filter,
      location: device.location,
      indoorMapId: this.inOutMarker(device),
      indoorMapFloorId: 0,
      elevation: this.getDeviceElevation(device), //device.locators && device.locators[0].coordinates.alt,
      // draggable:
      //   this.props.map.editMood && device.deviceType === "Locator",
      icon: this.iconColor(device),
      zIndexOffset: getZIndex(device, this.props.deviceSelected) //device.deviceId === this.props.deviceSelected.deviceId ? 2 : 1
    })
      // .addTo(circleLayer)
      // we can add constom option object for styling
      .on('click', (e) => {
        if (this.props.distanceMeasurementSelected) {
          this.props.setDistancePoints({ device: device });
        }
        this.props.setDeviceSelected(device);
        // this.props.map.deviceSelected = device;
      });
    marker.bindPopup(this.popupContent(device), {
      minWidth: 5,
      closeButton: false
    });
    if (device.deviceId === this.props.deviceSelected.deviceId) {
      // console.log('open popup');
      marker.openPopup();
    }
    return marker;
  };

  updateMarkers = (devices, searchResult) => {
    if (!map) return;
    // console.log(
    //   'updateMarkers',
    //   this.props.displayedMap,
    //   this.props.isSplitScreen,
    //   this.props.wrldMapOnly,
    //   this.props.routerLocation,
    //   this.props.displayedMap === 'mapbox' && !this.props.isSplitScreen && !this.props.wrldMapOnly,
    //   this.props.routerLocation !== 'wrld3d'
    // );
    // console.log(this.props.isSplitScreen, this.props.displayedMap);
    if (
      this.props.displayedMap === 'mapbox' &&
      !this.props.isSplitScreen &&
      !this.props.wrldMapOnly &&
      this.props.routerLocation !== 'wrld3d'
    )
      return;

    // console.log('wrld marker updated called');
    // this.clearLayer();
    let mapDevices = this.getMapDevicesList(devices, searchResult);
    // map && map._zoom === 0 ? (map._zoom = 18.5) : (map._zoom = map._zoom);
    const list = { ...markerList };
    try {
      // console.log("map", map.indoors.getActiveIndoorMap());
      // console.log("L", L);
      // (!map.indoors.isIndoors() || map.indoors.isIndoors()) &&
      // console.log('updateMarkers', mapDevices);
      tagLayer &&
        locatorLayer &&
        mapDevices &&
        mapDevices.map((device) => {
          if (device.status !== 'New' && isValidLocation(device.location)) {
            if (markerList[device.deviceId]) {
              const icon = this.iconColor(device);
              if (icon) {
                markerList[device.deviceId].setIcon(icon);
                markerList[device.deviceId].setLatLng(device.location);
                // console.log(this.iconColor(device));
                // markerList[device.deviceId].
                markerList[device.deviceId].closePopup();
                markerList[device.deviceId].bindPopup(this.popupContent(device), {
                  minWidth: 5,
                  closeButton: false
                });
                markerList[device.deviceId].setZIndexOffset(getZIndex(device, this.props.deviceSelected));
                if (device.deviceId === this.props.deviceSelected.deviceId) {
                  markerList[device.deviceId].openPopup();
                }
              }
            } else {
              let marker = this.createMarker(device);
              marker.addTo(device.deviceType === 'Tag' ? tagLayer : locatorLayer);
              list[device.deviceId] = marker;
            }
          }
        });
      markerList = list;
    } catch (error) {
      console.log(error);
      // toast.error("Please initiate the server for updated events", {
      //   position: toast.POSITION.TOP_RIGHT
      // });
    }
  };

  addLayers = () => {
    circleLayer = L.layerGroup().addTo(map);
    locatorLayer = L.layerGroup().addTo(map);
    tagLayer = L.layerGroup().addTo(map);
    mainLayer = L.layerGroup().addTo(map);
  };

  initMapFunctions = () => {
    this.props.pois && this.addMap();
    if (!map) return;
    // this.addIndoorControl();
    if (this.props.pois) {
      const { indoorId } = this.props.pois[0];
      // map && map.setView([location.lat, location.lng]);

      this.enterBuildingTimer();
    }
    this.addLayers();
    this.createIcons();
    // this.addControlLayer();
    // this.updateMarkers(this.props.devices, this.props.searchResult && this.props.searchResult);
  };

  enterBuildingTimer = () => {
    if (map && map.indoors && !map.indoors.isIndoors()) {
      this.checkIfBuildingToEnter();
      setTimeout(() => {
        this.enterBuildingTimer();
      }, 2000);
    }
  };

  setTagInterval = () => {
    const { routerLocation, isSplitScreen, deviceSelected, showCircle } = this.props;

    if (
      routerLocation === 'wrld3d' &&
      this.props.email &&
      this.props.userTenant &&
      this.props.userTenant.activation &&
      this.props.userTenant.activation.isAccepted &&
      this.props.eula
    ) {
      this.props.getTags(true);
      this.intervalDevices = setInterval(async () => {
        this.props.updateSearchResult({ searchResultDevices: this.props.searchResult ? this.props.searchResult : [] });
        // this.followDevice();
        // console.log(this.mapbox.getCenter());
      }, 2000);
    }
  };

  componentDidMount = async () => {
    mounted = true;
    if (!this.props.wrldMapOnly && this.props.routerLocation === 'wrld3d') {
      this.props.openIndoor({ displayIndoor: 'none', displayedMap: 'mapbox' });
      this.props.renderComponent('mapbox');
    }
    this.initMapFunctions();
    if (this.props.wrldMapOnly || (!this.props.wrldMapOnly && this.props.routerLocation === 'wrld3d')) {
      await this.props.getAllDevices();
      this.setTagInterval();
    }
    // await this.props.getPois();
    // this.setTagInterval();

    // this.props.updateSearchResult({searchResultDevices:this.props.searchResult && this.props.searchResult});
  };

  componentWillUnmount = () => {
    mounted = false;
    clearInterval(this.intervalDevices);
    this.clearLayer();
    // clearInterval(this.intervalMetrics);
  };

  checkIfBuildingToEnter = () => {
    // console.log('checkIfBuildingToEnter');
    let selected = this.props.deviceSelected;
    if (!selected || !selected.poiId) {
      selected = this.props.pois[0];
    }

    if (selected && selected.type) {
      const { location, type, provider, zoom, offset } = selected;
      // const { indoorId } =
      //   this.props.deviceSelected && this.props.deviceSelected.provider;
      // console.log(indoorId, deviceType);
      if ((type === 'Building' || type === 'Yard' || type === 'Parking') && provider && provider.indoorId) {
        if (!map || !map.indoors) return;
        if (!map.indoors.isIndoors()) {
          map.indoors.enter(provider.indoorId);
        }
      } else {
        map && map.setView([location.lat, location.lng]);
      }
    } else {
      this.props.deviceSelected &&
        this.props.deviceSelected.deviceType &&
        this.props.handlePopup({
          layout: mainLayer,
          showCircle: this.props.showCircle,
          circleLayer: circleLayer,
          wMap: map,
          device: this.props.deviceSelected
        });
    }
  };

  componentDidUpdate(prevProps, prevState) {
    // (this.props.displayedMap === 'wrld' || this.props.isSplitScreen) &&
    //   map &&
    //   map.indoors &&
    //   !map.indoors.isIndoors() &&
    //   this.checkIfBuildingToEnter(); // if not indoor enter building

    if (
      prevProps.filter !== this.props.filter ||
      prevProps.groupFilter !== this.props.groupFilter ||
      !isArrayEqual(prevProps.searchResult, this.props.searchResult)
    ) {
      // clear layers on filter and group filter or search
      this.clearLayer();
    }
    // console.log('componentDidUpdate');
    this.state.entered &&
      // map &&
      // map.indoors &&
      // map.indoors.isIndoors() &&
      this.state.polygon &&
      this.updateMarkers(this.props.devices, this.props.searchResult && this.props.searchResult);

    const { offset } = this.props.pois[0];
    const w = window.innerWidth;
    const h = window.innerHeight;
    const angle = h > w ? 0 : -90;
    const headingDegrees = this.props.isSplitScreen ? offset : this.state.rotation + angle;
    if (map && this.state.entered && prevState.rotation !== this.state.rotation && !this.props.isSplitScreen) {
      // rotate view horizontally
      map.setView(map.options.center, map.options.zoom, {
        headingDegrees: headingDegrees,
        animate: false
      });
    }

    if (map && this.state.entered && prevProps.isSplitScreen !== this.props.isSplitScreen) {
      // rotate view horizontally
      map.setView(map.options.center, map.options.zoom, {
        headingDegrees: headingDegrees,
        animate: false
      });
    }

    // check selected marker
    if (
      this.props.deviceSelected &&
      prevProps.deviceSelected.deviceId !== this.props.deviceSelected.deviceId &&
      isValidLocation(this.props.deviceSelected.location)
    ) {
      map.setView([this.props.deviceSelected.location.lat, this.props.deviceSelected.location.lng]);
    }
  }

  // shouldComponentUpdate = async (nextProps, nextState) => {
  //   // if (!this.props.deviceSelected) return;
  //   !this.state.spider && FFAF2143FB9C
  //     // (this.props.searchResult && this.props.searchResult.length > 0) &&
  //     nextProps.map &&
  //     this.updateMarkers(this.props.devices, this.props.searchResult && this.props.searchResult);
  //   // this.displayGrid();
  // };
  handleExitIndoorMap = () => {
    this.props.setDeviceSelected('');
  };

  minMaxButton() {
    if (this.props.resizeChilds && this.props.resizeChilds[0].width === 0) {
      // console.log('case 1', this.props.resizeChilds[0]);
      !this.props.expandIndoorSize && this.props.setExpandIndoorSize({ expand: true, mapbox: this.props.mapbox });
      return (
        <Button
          style={{ backgroundColor: variables.ORANGE_COLOR, color: variables.WHITE_COLOR }}
          onClick={() => {
            this.props.mapbox && this.props.mapbox.resize();
            this.props.setExpandIndoorSize({ expand: false, mapbox: this.props.mapbox });
            this.props.resizeChilds[0].width = null;
          }}
        >
          <FullscreenExitIcon />
        </Button>
      );
    }
    // else if (this.props.resizeChilds && this.props.resizeChilds[1].width === 500) {
    //   // console.log('case 2', this.props.resizeChilds[1]);
    //   this.props.expandIndoorSize && this.props.setExpandIndoorSize({ expand: false, mapbox: this.props.mapbox });
    //   return (
    //     <Button
    //       style={{ backgroundColor: variables.ORANGE_COLOR, color: variables.LIGHT_GRAY_COLOR }}
    //       onClick={() => {
    //         this.props.mapbox && this.props.mapbox.resize();
    //         this.props.setExpandIndoorSize({ expand: true, mapbox: this.props.mapbox });
    //         this.props.resizeChilds[1].width = null;
    //       }}
    //     >
    //       {'Maximize'}
    //     </Button>
    //   );
    // }
    else {
      // console.log('case 3 no resizeChilds');

      return (
        <Button
          style={{ backgroundColor: variables.ORANGE_COLOR, color: variables.WHITE_COLOR }}
          onClick={() => {
            this.props.mapbox && this.props.mapbox.resize();
            this.props.setExpandIndoorSize({ expand: !this.props.expandIndoorSize, mapbox: this.props.mapbox });
          }}
        >
          {this.props.expandIndoorSize ? <FullscreenExitIcon /> : <FullscreenIcon />}
        </Button>
      );
    }
  }

  renderLoader() {
    return !this.state.entered ? (
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          zIndex: 99,
          backgroundColor: variables.WHITE_COLOR
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            zIndex: 100
          }}
        >
          <div
            style={{
              position: 'relative',
              left: '-50%',
              textAlign: 'center'
            }}
          >
            <BeatLoader
              size={50}
              color={this.props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR}
            />
            <div>Loading map...</div>
          </div>
        </div>
      </div>
    ) : (
      <div
        style={{
          position: 'absolute',
          visibility: 'hidden'
        }}
      ></div>
    );
  }

  render = () => {
    // console.log('Render entered', this.state.entered);

    return (
      <div
        style={{
          height: '100vh',
          width: '100%'
        }}
      >
        {this.renderLoader()}
        {/* this div for the indoor exit control */}
        {/* <div
          style={{ marginRight: '100px' }}
          id="widget-container"
          className="wrld-widget-container"
          onClick={() => this.handleExitIndoorMap()}
        ></div> */}
        <div
          id="map"
          style={{
            height: '100%'
          }}
        >
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: 60,
              right: 30
            }}
          >
            {this.props.isSplitScreen && <div style={{ zIndex: 100 }}>{this.minMaxButton()}</div>}
          </div>

          {/* {!this.props.isSplitScreen && <List wMap={map} layout={mainLayer} />} */}
        </div>
        <NavigationButtons wMap={map} mapbox={this.props.mapbox} />
        {this.props.wrldMapOnly && this.state.entered && (
          <List
            // mapbox={this.mapbox}
            displayIndoor={this.props.displayIndoor}
            displayedMap={this.props.displayedMap}
            searchString={this.state.searchString}
            setSearchedString={(searchString) => this.setState({ searchString })}
          />
        )}
        {/* {this.props.distanceMeasurementSelected && !this.props.isSplitScreen && (
          <DistanceInfo points={this.state.distancePoints} />
        )} */}
      </div>
    );
  };
}

const mapStateToProps = ({ map, user, location, provision }) => ({
  map,
  tags: map.tags,
  email: user.email,
  eula: user.eula,
  userTenant: provision.userTenant,
  allTenants: provision.allTenants,
  locators: map.locators,
  devices: map.devices,
  pois: map.pois,
  searchResult: map.searchResult,
  syncFilterWithMap: map.syncFilterWithMap,
  database: user.database,
  loginType: user.loginType,
  deviceSelected: map.deviceSelected,
  routerLocation: location.routerLocation,
  isSplitScreen: location.isSplitScreen,
  showAdvanceTool: location.showAdvanceTool,
  distanceMeasurementSelected: location.distanceMeasurementSelected,
  showCircle: location.showCircle,
  expandIndoorSize: location.expandIndoorSize,
  groupFilter: user.groupFilter,
  filter: location.filter,
  tenant: provision.userTenant,
  locationPause: map.locationPause,
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount'
});

const mapDispatch = ({
  map: {
    handlePopupAction,
    getTagsAction,
    updateSearchResultAction,
    setDeviceSelectedAction,
    setDistancePointsAction,
    getPoisAction,
    getAllDevicesAction
  },
  location: { renderComponentAction, setExpandIndoorSizeAction }
}) => ({
  getAllDevices: getAllDevicesAction,
  handlePopup: handlePopupAction,
  getTags: getTagsAction,
  updateSearchResult: updateSearchResultAction,
  setDeviceSelected: setDeviceSelectedAction,
  renderComponent: renderComponentAction,
  setDistancePoints: setDistancePointsAction,
  getPois: getPoisAction,
  setExpandIndoorSize: setExpandIndoorSizeAction
});

export default connect(mapStateToProps, mapDispatch)(Wrld3d);
