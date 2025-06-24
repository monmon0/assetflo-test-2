import React, { useState, useEffect } from 'react';
import { Button, IconButton, Tooltip } from '@mui/material';

import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { connect } from 'react-redux';
import async from 'async';
import * as turf from '@turf/turf';

import variables from '../../variables.json';
import { hasAccess } from '../../util/hasAccess';
import { flattenLatLng } from '../../util/format';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { fitBuilding } from '../../util/mapUtils';
import { isValidLocation } from '../../util/validation';
import FloorList from './FloorList';
import { transformDevice } from '../../util/transformer';

mapboxgl.accessToken = variables.MAPBOX_ACCESS_TOKEN;

let map, opendPopup, geocoder;
let updatedDragedDevicesList = [];
let deviceMarkers = {};
let timeoutId;

// const dragableLocatorIcon = variables.DRAGABLE_LOCATOR_ICON;
const dragableLocatorIcon = variables.LOCATOR_ICON;
const dragableAnchorIcon = variables.ANCHER_ICON;
const dragableBuildingIcon = variables.BUILDINGS_ICON;
const dragableTagIcon = variables.TAG_ICON_BLUE;

function DraggableMapbox(props) {
  const [displayedDevices, setDisplayedDevices] = useState([]);
  const [marker, setMarker] = useState(props.currentDevice);
  const [displaySaveButton, setDisplaySaveButton] = useState(false);
  const [markerLoaded, setMarkerLoaded] = useState(false);
  const [poi, setPoi] = useState(props.pois && props.pois.length > 0 ? props.pois[0] : null);
  const [moveToView, setMoveToView] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const id = props.provisionType === 'Poi' ? 'poiId' : 'deviceId';
  useEffect(() => {
    updatedDragedDevicesList = [];
    deviceMarkers = {};
    let devs;
    props.getPois();
    props.getZones();
    if (props.provisionType === 'Tag') {
      let allDevice = props.devStates && [...props.devStates];
      let anchorTags =
        allDevice &&
        allDevice.filter(
          (device) =>
            device.deviceType === 'Tag' &&
            device[props.currentDevice.isAnchor ? 'isAnchor' : 'fixAsset'] === true &&
            device.location &&
            !device.archived
        );

      devs = anchorTags;
      // devices = props.locators;
    } else if (props.provisionType === 'Poi') {
      devs = props.pois;
      // devices = props.locators;
    } else {
      let allDevice = props.devStates && [...props.devStates];
      let devicesByType =
        allDevice &&
        allDevice.filter((device) => device.deviceType === props.provisionType && device.location && !device.archived);
      devs = devicesByType;
    }
    let ind = devs?.findIndex((x) => x.deviceId === marker.deviceId);
    ind < 0 && devs.push(marker);
    setDisplayedDevices(devs);
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    setMarkerLoaded(false);
    setLoaded(false);
    map = null;
    if (props.editableMap === 'editableMapbox') {
      const lng = props.currentDevice.lng || -96.989527;
      const lat = props.currentDevice.lat || 49.310371;
      const zoomOut = props.currentDevice.zoomOut;
      map = new mapboxgl.Map({
        container: 'dragMap',
        style: props.mapboxStyle === 'satellite' ? variables.SATELLITE_STYLE : variables.STREETS_STYLE,
        center: [lng, lat],
        zoom: zoomOut ? 3 : 18.5,
        bearing: 0
      }).setMaxZoom(24);
    } else {
      if (!props.pois) return;
      const { location, zoom, offset } = props.pois[0];
      const mapViewOptions = {
        accessToken: variables.MAPBOX_ACCESS_TOKEN,
        element: document.getElementById('dragMap'),
        bearing: 0,
        zoom: 18.5,
        center: [props.currentDevice.lng || -96.989527, props.currentDevice.lat || 49.310371],
        maxZoom: 24
      };
      mapsindoors.MapsIndoors.setMapsIndoorsApiKey(props.pois[0]?.provider?.apikey);
      const mapViewInstance = new mapsindoors.mapView.MapboxView(mapViewOptions);
      const mapsIndoorsInstance = new mapsindoors.MapsIndoors({
        mapView: mapViewInstance
      });
      map = mapViewInstance.getMap();
      props.pois[0] && map && fitBuilding(props.pois[0], map);
    }

    geocoder = new MapboxGeocoder({
      accessToken: variables.MAPBOX_ACCESS_TOKEN,
      marker: false,
      placeholder: 'Search address...',
      mapboxgl: mapboxgl,
      flyTo: false
    });
    map.addControl(geocoder);

    // On result, instead of flyTo (which is set to false), we jump to the result
    geocoder.on('result', function (ev) {
      map.jumpTo({
        center: ev.result.center
      });
    });

    if (marker) {
      opendPopup = new mapboxgl.Popup({ offset: props.provisionType !== 'Poi' ? 45 : 55 })
        .setLngLat([marker.location.lng, marker.location.lat])
        .setHTML(popupHTML(marker))
        .addTo(map);
    }
    map.on('moveend', ({ originalEvent }) => {
      if (originalEvent) {
        map?.fire('usermoveend');
      } else {
        map?.fire('flyend');
      }
    });
    map.on('flyend', () => {
      setMoveToView(true);
    });
    map.once('style.load', () => {
      timeoutId = setTimeout(() => setLoaded(true), 1500);
    });

    return () => {
      map = null;
    };
  }, [props.editableMap, props.pois]);

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

  useEffect(() => {
    if (map && loaded && props.zones && props.zones.length > 0) {
      props.zones.map((zone) => displayZone(zone));
    }
  }, [props.zones, map, loaded]);

  useEffect(() => {
    return () => {
      // cleanup
      props.zones && props.zones.map((zone) => cleanZone(zone));
      setLoaded(false);
    };
  }, []);

  const displayZone = (zone) => {
    if (!loaded) return;
    // console.log('display zone');
    const { fillColor } = zone;

    !map.getSource(`${zone.organization}.${zone.zoneId}`) &&
      map.addSource(`${zone.organization}.${zone.zoneId}`, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            // These coordinates outline Maine.
            coordinates: zone.geometry.coordinates
          }
        }
      });

    // Add a new layer to visualize the polygon.

    !map.getLayer(`${zone.organization}.main.${zone.zoneId}`) &&
      map.addLayer({
        id: `${zone.organization}.main.${zone.zoneId}`,
        type: 'fill',
        source: `${zone.organization}.${zone.zoneId}`,
        layout: {},
        paint: {
          'fill-color': `rgb(${fillColor.r}, ${fillColor.g}, ${fillColor.b})`, // blue color fill
          'fill-opacity': Math.round((fillColor.a / 255) * 100) / 100
        }
      });
    // Add a black outline around the polygon.

    !map.getLayer(`${zone.organization}.outline.${zone.zoneId}`) &&
      map.addLayer({
        id: `${zone.organization}.outline.${zone.zoneId}`,
        type: 'line',
        source: `${zone.organization}.${zone.zoneId}`,
        layout: {},
        paint: {
          'line-color': `rgb(${fillColor.r}, ${fillColor.g}, ${fillColor.b})`,
          'line-width': 1
        }
      });
  };

  const cleanZone = (zone) => {
    if (map) {
      map.getLayer(`${zone.organization}.outline.${zone.zoneId}`) &&
        map.removeLayer(`${zone.organization}.outline.${zone.zoneId}`);

      map.getLayer(`${zone.organization}.main.${zone.zoneId}`) &&
        map.removeLayer(`${zone.organization}.main.${zone.zoneId}`);

      map.getSource(`${zone.organization}.${zone.zoneId}`) && map.removeSource(`${zone.organization}.${zone.zoneId}`);
    }
  };

  const iconStyle = () => {
    switch (props.provisionType) {
      case 'Ancher':
        return { icon: dragableAnchorIcon, width: '35px', height: '41px' };
      case 'Poi':
        return { icon: dragableBuildingIcon, width: '60px', height: '60px' };
      case 'Tag':
        // if (isAnchor) return { icon: dragableAnchorIcon, width: '40px', height: '41px' };
        return { icon: dragableAnchorIcon, width: '40px', height: '41px' };
      default:
        return { icon: dragableLocatorIcon, width: '35px', height: '41px' };
    }
  };

  const generateLocatorAnchorPayload = (location, device) => {
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
      let locatorAncherPayload = generateLocatorAnchorPayload(loc, device);
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
        : generateLocatorAnchorPayload(location, props.currentDevice);
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
      // async.each(updatedDragedDevicesList, async (device, callback) => {
      //   await props.updateDeviceData(device);
      //   callback && callback(true);
      // });
      const transformedList = transformForBulkUpdate(updatedDragedDevicesList);
      console.log('transformedList', transformedList);
      props.updateDeviceBulk({ updates: transformedList });
    } else if (props.provisionType === 'Tag') {
      // async.each(updatedDragedDevicesList, async (device, callback) => {
      //   device.uuid = device.deviceId;
      //   await props.updateDeviceData(device);
      //   callback && callback(true);
      // });
      const transformedList = transformForBulkUpdate(updatedDragedDevicesList);
      console.log('transformedList', transformedList);
      props.updateDeviceBulk({ updates: transformedList });
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

  const transformForBulkUpdate = (devices) => {
    const transformedList = devices.map((device) => {
      return transformDevice(device, device.location);
    });
    return transformedList;
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

        // Handle case where lat and lng are 0
        const markerLng = device.location.lng === 0 ? map.getCenter().lng : device.location.lng;
        const markerLat = device.location.lat === 0 ? map.getCenter().lat : device.location.lat;

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
          .setLngLat([markerLng, markerLat])
          .setPopup(popup)
          .on('dragstart', (e) => {
            opendPopup.remove();
            setDisplaySaveButton(true);
            setMarker('');
          })
          .on('dragend', (data) => handleDragEnd(data, device));
        (device[id] === props.currentDevice[id] || props.showAll) && markerIcon.addTo(map);
        deviceMarkers[device[id]] = markerIcon;

        return markerIcon;
      });
  };

  return (
    <div id="dragMap" style={{ position: 'relative', width: '100%', height: '75vh' }}>
      {map && !markerLoaded && draggableMarkers()}
      <FloorList map={map} loaded={loaded} />
      <Button
        style={{
          color: variables.LIGHT_GRAY_COLOR,
          background: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
          zIndex: 10,
          position: 'absolute',
          left: displaySaveButton ? 10 : -150,
          transition: 'all 800ms ease',
          ...(props.screenWidth <= 700 && { bottom: 55 }),
          ...(props.screenWidth > 700 && { top: 50 })
        }}
        onClick={() => {
          handleSaveNewLocation();
        }}
      >
        Save changes
      </Button>
      <Button
        style={{
          color: variables.LIGHT_GRAY_COLOR,
          background: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
          zIndex: 10,
          position: 'absolute',
          top: props.screenWidth <= 700 ? 70 : 50,
          right: moveToView ? 10 : -150,
          transition: 'all 800ms ease'
        }}
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

const mapStateToProps = ({ map, user, location, provision }) => ({
  devStates: provision.states,
  locators: map.locators,
  pois: map.pois,
  editableMap: map.editableMap,
  screenWidth: location.screenWidth,
  mapboxStyle: map.mapboxStyle,
  database: user.database,
  role: user.role,
  userPermissions: user.userPermissions,
  provisionType: provision.provisionType,
  group: user.group,
  zones: map.zones,
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount'
});

const mapDispatch = ({
  provision: { updateDeviceDataAction, updateDeviceBulkAction },
  map: { getAllDevicesAction, addAndUpdatePoiAction, getZonesAction, getPoisAction }
}) => ({
  updateDeviceBulk: updateDeviceBulkAction,
  updateDeviceData: updateDeviceDataAction,
  getDevices: getAllDevicesAction,
  addAndUpdatePoi: addAndUpdatePoiAction,
  getZones: getZonesAction,
  getPois: getPoisAction
});

export default connect(mapStateToProps, mapDispatch)(DraggableMapbox);
