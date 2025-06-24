import React, { useState, useEffect } from 'react';
import { Button, IconButton, Tooltip } from '@mui/material';

import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { connect } from 'react-redux';
import async from 'async';

import variables from '../../../variables.json';
import { hasAccess } from '../../../util/hasAccess';
import { flattenLatLng } from '../../../util/format';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

mapboxgl.accessToken = variables.MAPBOX_ACCESS_TOKEN;

let map, opendPopup, geocoder;
let updatedDragedDevicesList = [];
let deviceMarkers = {};

// const dragableLocatorIcon = variables.DRAGABLE_LOCATOR_ICON;
const dragableLocatorIcon = variables.LOCATOR_ICON;
const dragableAncherIcon = variables.ANCHER_ICON;
const dragableBuildingIcon = variables.BUILDINGS_ICON;
const dragableTagIcon = variables.TAG_ICON_BLUE;

function DraggableMapbox(props) {
  const [displayedDevices, setDisplayedDevices] = useState([]);
  const [marker, setMarker] = useState(props.currentDevice);
  const [displaySaveButton, setDisplaySaveButton] = useState(false);
  const [markerLoaded, setMarkerLoaded] = useState(false);
  const [poi, setPoi] = useState(props.pois && props.pois.length > 0 ? props.pois[0] : null);
  const [moveToView, setMoveToView] = useState(false);
  const id = props.provisionType === 'Poi' ? 'poiId' : 'deviceId';
  useEffect(() => {
    updatedDragedDevicesList = [];
    deviceMarkers = {};
    let devs;
    if (props.provisionType === 'Tag') {
      let allDevice = props.allFacilityDevices && [...props.allFacilityDevices];
      let anchorTags =
        allDevice &&
        allDevice.filter(
          (device) =>
            device.deviceType === 'Tag' &&
            device[props.currentDevice.isAnchor ? 'isAnchor' : 'fixAsset'] === true &&
            device.location
        );

      devs = anchorTags;
      // devices = props.locators;
    } else if (props.provisionType === 'Poi') {
      devs = props.pois;
      // devices = props.locators;
    } else {
      let allDevice = props.allFacilityDevices && [...props.allFacilityDevices];
      let devicesByType = allDevice.filter((device) => device.deviceType === props.provisionType && device.location);
      devs = devicesByType;
    }
    let ind = devs.findIndex((x) => x.deviceId === marker.deviceId);
    ind < 0 && devs.push(marker);
    setDisplayedDevices(devs);
  }, []);

  useEffect(() => {
    setMarkerLoaded(false);
    map = new mapboxgl.Map({
      container: 'map1',
      style: props.mapboxStyle === 'satellite' ? variables.SATELLITE_STYLE : variables.STREETS_STYLE,
      center: [props.currentDevice.lng, props.currentDevice.lat],
      zoom: poi ? poi.zoom : 18.5,
      bearing: poi ? poi.offset : 0
    }).setMaxZoom(24);

    geocoder = new MapboxGeocoder({
      accessToken: variables.MAPBOX_ACCESS_TOKEN,
      marker: false,
      placeholder: 'Search...',
      mapboxgl: mapboxgl
    });
    map.addControl(geocoder);

    marker &&
      (opendPopup = new mapboxgl.Popup({ offset: props.provisionType !== 'Poi' ? 45 : 55 })
        .setLngLat([marker.lng, marker.lat])
        .setHTML(popupHTML(marker))
        .addTo(map));
    map.on('moveend', ({ originalEvent }) => {
      if (originalEvent) {
        map.fire('usermoveend');
      } else {
        map.fire('flyend');
      }
    });
    map.on('flyend', () => {
      setMoveToView(true);
    });
  }, []);

  useEffect(() => {
    if (props.move) {
      opendPopup.remove();
      map.setCenter([props.currentDevice.location.lng, props.currentDevice.location.lat]);
      moveToCenter(props.currentDevice.location);
      props.setMove(false);
      setMoveToView(false);
      setDisplaySaveButton(true);
    }
  }, [props.move]);

  useEffect(() => {
    if (props.showAll) {
      for (let k in deviceMarkers) {
        deviceMarkers[k].addTo(map);
      }
    } else {
      for (let k in deviceMarkers) {
        if (k !== props.currentDevice[id] && !updatedDragedDevicesList.find((dev) => dev[id] === k)) {
          deviceMarkers[k].remove();
          // deviceMarkers[k]._lngLat === opendPopup._lngLat && opendPopup.remove();
        }
      }
    }
  }, [props.showAll]);

  const iconStyle = () => {
    switch (props.provisionType) {
      case 'Ancher':
        return { icon: dragableAncherIcon, width: '35px', height: '41px' };
      case 'Poi':
        return { icon: dragableBuildingIcon, width: '60px', height: '60px' };
      case 'Tag':
        return { icon: dragableAncherIcon, width: '40px', height: '41px' };
      default:
        return { icon: dragableLocatorIcon, width: '35px', height: '41px' };
    }
  };

  const generateLocatorAncherPayload = (location, device) => {
    let payload = {
      assetName: device.assetName,
      deviceType: device.deviceType,
      deviceId: device.deviceId,
      uuid: device.deviceId,
      groups: device.groups,
      status: 'Active',
      location: {
        lat: Number(location.lat),
        lng: Number(location.lng),
        alt: Number(device.location.alt) || 1
      },
      organization: props.database,
      database: props.database,
      configurationId: device.configurationId,
      protocol: device.protocol,
      fixAsset: props.currentDevice.fixAsset,
      isAnchor: props.currentDevice.isAnchor
    };
    return payload;
  };

  const generatePoiPayload = (location, device) => {
    let payload = {
      poiId: device.poiId,
      name: device.name && device.name,
      address: device.address && device.address,
      groups: device.groups, // must be array as poi services
      organization: props.database,
      type: device.type,
      archived: device.archived,
      polygonPoints: device.polygonPoints
    };

    payload.provider = {
      apikey: device.provider.apikey && device.provider.apikey,
      providerId: device.provider.providerId && device.provider.providerId,
      indoorId: device.provider.indoorId && device.provider.indoorId,
      providerURL: device.provider.providerURL && device.provider.providerURL
    };

    payload.geocoordinates = {
      // this geocoordinates equal to location in locator
      lat: Number(location.lat),
      lng: Number(location.lng),
      alt: Number(device.location.alt) || 1
    };

    payload.location = {
      lat: Number(location.lat),
      lng: Number(location.lng),
      alt: Number(device.location.alt) || 1
    };
    return payload;
  };

  const handleDragEnd = (data, device) => {
    const loc = { lat: data.target._lngLat.lat, lng: data.target._lngLat.lng };
    if (props.provisionType === 'Locator' || props.provisionType === 'Ancher' || props.provisionType === 'Tag') {
      let locatorAncherPayload = generateLocatorAncherPayload(loc, device);
      props.setCurrentDevice(flattenLatLng(locatorAncherPayload));
      handleUpdateDragedDevicesList(locatorAncherPayload);
      return;
    } else if (props.provisionType === 'Poi') {
      let poiPayload = generatePoiPayload(loc, device);
      props.setCurrentDevice(poiPayload);
      handleUpdateDragedPoiList(poiPayload);
      return;
    }
  };

  const moveToCenter = (location) => {
    const id = props.provisionType === 'Poi' ? 'poiId' : 'deviceId';
    let dev =
      props.provisionType === 'Poi'
        ? generatePoiPayload(location, {
            ...props.currentDevice,
            provider: props.currentDevice.provider
              ? props.currentDevice.provider
              : {
                  apikey: props.currentDevice.apikey,
                  providerId: props.currentDevice.providerId,
                  indoorId: props.currentDevice.indoorId,
                  providerURL: props.currentDevice.providerURL
                }
          })
        : generateLocatorAncherPayload(location, props.currentDevice);
    props.setCurrentDevice(flattenLatLng(dev));
    // set marker location
    deviceMarkers[dev[id]].setLngLat([dev.location.lng, dev.location.lat]);
    // display new popup
    opendPopup = new mapboxgl.Popup({ offset: props.provisionType !== 'Poi' ? 45 : 55 })
      .setLngLat([dev.location.lng, dev.location.lat])
      .setHTML(popupHTML(dev))
      .addTo(map);

    // find device in updatedDragedDevicesList and push/update
    let index = updatedDragedDevicesList.findIndex((x) => x.deviceId == dev.deviceId);
    index >= 0 ? (updatedDragedDevicesList[index] = dev) : updatedDragedDevicesList.push(dev);
  };

  const handleUpdateDragedPoiList = (payload) => {
    let displayedPoiCopy = displayedDevices;
    let filteredList = displayedPoiCopy.filter((poi) => poi.poiId !== payload.poiId);
    let updatedDisplyedPoi = [...filteredList, payload];
    // updatedDragedDevicesList = [...dragedDevicesList];
    let filteredDragedDevicesList = updatedDragedDevicesList.filter((dd) => dd.poiId !== payload.poiId);
    updatedDragedDevicesList = [...filteredDragedDevicesList, payload];
    // console.log(updatedDisplyedDevices);
    setDisplayedDevices(updatedDisplyedPoi);
    // console.log(updatedDragedDevicesList);
    return updatedDragedDevicesList;
  };

  const handleUpdateDragedDevicesList = (device) => {
    let displayedDevicesCopy = displayedDevices;
    let filteredList = displayedDevicesCopy.filter((d) => d.deviceId !== device.deviceId);

    let updatedDisplyedDevices = [...filteredList, device];

    // updatedDragedDevicesList = [...dragedDevicesList];
    let filteredDragedDevicesList = updatedDragedDevicesList.filter((dd) => dd.deviceId !== device.deviceId);

    updatedDragedDevicesList = [...filteredDragedDevicesList, device];
    // console.log(updatedDisplyedDevices);
    // console.log(updatedDragedDevicesList);
    setDisplayedDevices(updatedDisplyedDevices);
    return updatedDragedDevicesList;
  };

  const handleSaveNewLocation = async () => {
    setDisplaySaveButton(false);
    if (props.provisionType === 'Locator' || props.provisionType === 'Ancher') {
      async.each(updatedDragedDevicesList, async (device, callback) => {
        await props.updateDeviceData(device);
        callback(true);
      });
    } else if (props.provisionType === 'Tag') {
      async.each(updatedDragedDevicesList, async (device, callback) => {
        // device.isAnchor = true;
        device.isAnchor = props.currentDevice.isAnchor;
        device.fixAsset = props.currentDevice.fixAsset;
        device.uuid = device.deviceId;
        await props.updateDeviceData(device);
        callback(true);
      });
    } else if (props.provisionType === 'Poi') {
      for (let poi of updatedDragedDevicesList)
        await props.addAndUpdatePoi({ data: { ...poi }, database: props.database });
    }
    // props.updateDeviceData(deviceWithNewCoordinate);
    await props.getDevices({
      database: props.database
    });

    setDisplayedDevices(displayedDevices);
    updatedDragedDevicesList = [];
  };

  const popupHTML = (device) => {
    return `<div>
    <span>
      <strong>Name: </strong>
      ${device.assetName || device.name}
    </span>
    <br />
    ${
      hasAccess(props.userPermissions, variables.ALL_DEVICES_FEATURE, props.role, props.database, props.group)
        ? `<span>Drag to change location</span>`
        : ''
    }
  </div>`;
  };

  // let markerIcon;
  const draggableMarkers = () => {
    const id = props.provisionType === 'Poi' ? 'poiId' : 'deviceId';
    setMarkerLoaded(true);
    displayedDevices &&
      props.currentDevice &&
      displayedDevices.forEach((device) => {
        // create a DOM element for the marker
        const popup = new mapboxgl.Popup({ offset: props.provisionType !== 'Poi' ? 45 : 55 }).setHTML(
          popupHTML(device)
        );
        const el = document.createElement('img');
        el.className = 'marker';
        // console.log('el===>', el);
        el.src = iconStyle().icon;
        el.style.width = iconStyle().width;
        el.style.height = iconStyle().height;
        el.onclick = () => {
          const id = props.provisionType === 'Poi' ? 'poiId' : 'deviceId';
          const index = updatedDragedDevicesList.findIndex((x) => x[id] === device[id]);
          const currDevice =
            index > -1
              ? updatedDragedDevicesList[index]
              : {
                  ...device,
                  location: {
                    ...device.location,
                    lat: deviceMarkers[device[id]]._lngLat.lat,
                    lng: deviceMarkers[device[id]]._lngLat.lng
                  }
                };
          props.setCurrentDevice(flattenLatLng(currDevice));
        };
        // add marker to map
        let markerIcon = new mapboxgl.Marker(el, {
          draggable: hasAccess(
            props.userPermissions,
            variables.ALL_DEVICES_FEATURE,
            props.role,
            props.database,
            props.group
          ),
          anchor: 'bottom',
          scale: 0
        })
          .setLngLat([device.location.lng, device.location.lat])
          .setPopup(popup)
          .on('dragstart', (e) => {
            opendPopup.remove();
            setDisplaySaveButton(true);
            setMarker('');
          })
          .on('dragend', (data) => handleDragEnd(data, device));
        device[id] === props.currentDevice[id] && markerIcon.addTo(map);
        deviceMarkers[device[id]] = markerIcon;

        return markerIcon;
      });
  };

  return (
    <div id="map1" style={{ position: 'relative', width: '100%', height: '70vh' }}>
      {map && !markerLoaded && draggableMarkers()}
      <Button
        style={{
          zIndex: 10,
          position: 'absolute',
          left: displaySaveButton ? 10 : -150,
          transition: 'all 800ms ease',
          ...(props.screenWidth <= 700 && { bottom: 55 }),
          ...(props.screenWidth > 700 && { top: 10 })
        }}
        className="geo-button geo-button--action fullWidth"
        onClick={() => {
          handleSaveNewLocation();
        }}
      >
        Save changes
      </Button>
      <Button
        style={{
          zIndex: 10,
          position: 'absolute',
          top: props.screenWidth <= 700 ? 70 : 50,
          right: moveToView ? 10 : -150,
          transition: 'all 800ms ease'
        }}
        className="geo-button geo-button--action fullWidth"
        onClick={() => {
          opendPopup.remove();
          setDisplaySaveButton(true);
          moveToCenter(map.getCenter());
          setMoveToView(false);
        }}
      >
        Move here
      </Button>
      <Tooltip
        title={
          props.showAll
            ? 'Hide other devices'
            : `Show all ${
                props.provisionType === 'Tag' ? 'anchors' : props.provisionType === 'Locator' ? 'locators' : 'POIs'
              }`
        }
      >
        <IconButton
          style={{
            position: 'absolute',
            zIndex: 10,
            top: 8,
            color: 'black',
            ...(props.screenWidth <= 700 && { left: 10 }),
            ...(props.screenWidth > 700 && { right: 260 })
          }}
          onClick={() => {
            props.setShowAll(!props.showAll);
          }}
          size="large"
        >
          {props.showAll ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    </div>
  );
}

const mapStateToProps = ({ map, user, location, provision, dashboard }) => ({
  allFacilityDevices: dashboard.allFacilityDevices,
  locators: map.locators,
  pois: map.pois,
  screenWidth: location.screenWidth,
  mapboxStyle: map.mapboxStyle,
  database: user.database,
  role: user.role,
  userPermissions: user.userPermissions,
  provisionType: provision.provisionType,
  group: user.group
});

const mapDispatch = ({
  provision: { updateDeviceDataAction },
  map: { getAllDevicesAction, addAndUpdatePoiAction }
}) => ({
  updateDeviceData: updateDeviceDataAction,
  getDevices: getAllDevicesAction,
  addAndUpdatePoi: addAndUpdatePoiAction
});

export default connect(mapStateToProps, mapDispatch)(DraggableMapbox);
