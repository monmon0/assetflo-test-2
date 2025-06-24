import React, { useState, useEffect, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { Marker, Popup } from 'react-map-gl';
import { connect } from 'react-redux';

import './wrld3d.css';
import '../../App.scss';
import variables from '../../variables.json';
import { filterByGroup } from '../../util/filters';
import { getZIndex } from '../../util/statusColor';
import { isValidLocation } from '../../util/validation';
import MapCluster from './MapCluster';
import MapClusterGroup from './MapClusterGroup';

const tagIconMoving =
  process.env.NODE_ENV === 'production'
    ? variables.PRODUCTION_URL_IMAGE + variables.TAG_ICON_MOVING
    : variables.STAGING_URL_IMAGE + variables.TAG_ICON_MOVING;
const tagIconMovingPin =
  process.env.NODE_ENV === 'production'
    ? variables.PRODUCTION_URL_IMAGE + variables.TAG_ICON_MOVING_PIN
    : variables.STAGING_URL_IMAGE + variables.TAG_ICON_MOVING_PIN;

const Markers = ({
  devices,
  searchResult,
  syncFilterWithMap,
  handleMarkerSelected,
  iconColor,
  filter,
  deviceSelected,
  map,
  groupFilter,
  inCluster,
  setInCluster,
  screenWidth,
  setDeviceSelected,
  setViewState,
  filterByActivityAdapter
}) => {
  const [mapDevices, setMapDevices] = useState([]);
  const [deviceHM, setDeviceHM] = useState({});
  useEffect(() => {
    let allMarkers = devices && [...devices];
    let markersHM = {};
    // filter by search from list
    let devs =
      searchResult && searchResult.length > 0 && syncFilterWithMap
        ? searchResult.filter((result) => !result?.poiId)
        : allMarkers;

    // filtering by groups
    if (groupFilter.length > 0) {
      devs = filterByGroup(devs, groupFilter);
    }
    devs = filterByActivityAdapter?.applyFilterByActivity(devs);

    let displayedDevices = [];

    if (
      filter.indexOf('Tag') > -1 &&
      filter.indexOf('IOX') > -1 &&
      filter.indexOf('Fixed') > -1 &&
      filter.indexOf('Locator') > -1 &&
      filter.indexOf('Anchor') > -1
    ) {
      displayedDevices = devs;
      devs &&
        devs.map((marker) => {
          markersHM[marker.deviceId] = marker;
        });
    } else {
      devs &&
        devs.map((marker) => {
          if (!marker || !marker.location || !isValidLocation(marker.location)) return;
          if (filter.indexOf('Anchor') > -1 && marker.isAnchor) {
            displayedDevices.push(marker);
            markersHM[marker.deviceId] = marker;
          }
          if (filter.indexOf('IOX') > -1 && marker.protocol === 'IOX' && !marker.fixAsset) {
            displayedDevices.push(marker);
            markersHM[marker.deviceId] = marker;
          }
          if (filter.indexOf('Fixed') > -1 && marker.fixAsset) {
            displayedDevices.push(marker);
            markersHM[marker.deviceId] = marker;
          }
          if (
            filter.indexOf('Tag') > -1 &&
            marker.deviceType === 'Tag' &&
            !marker.isAnchor &&
            marker.protocol !== 'IOX' &&
            !marker.fixAsset
          ) {
            displayedDevices.push(marker);
            markersHM[marker.deviceId] = marker;
          }
          if (filter.indexOf('Locator') > -1 && marker.deviceType === 'Locator') {
            displayedDevices.push(marker);
            markersHM[marker.deviceId] = marker;
          }
        });
    }
    // }
    // devs = devs && devs.filter((dev) => !!dev.location && dev.location.lat && dev.location.lng);
    displayedDevices && setMapDevices(displayedDevices);

    displayedDevices &&
      !displayedDevices.find((dev) => dev.deviceId === deviceSelected.deviceId) &&
      setDeviceSelected('');
    // console.log(Object.values(markersHM).length, devs.length);

    markersHM && setDeviceHM(markersHM);

    // console.log("",mapDevices);
  }, [devices, groupFilter, syncFilterWithMap, searchResult, filter]);

  const markerList = useMemo(
    () =>
      mapDevices?.map((device, key) => {
        if (!device.location) return;
        // device.deviceId === '70bb9972025c' && console.log(device.deviceId);
        const isMovingIcon = iconColor(device) === tagIconMoving;
        const width =
          device.deviceType === 'Locator' || (device.fixAsset && device.protocol === 'IOX') || isMovingIcon
            ? '35px'
            : device.isAnchor
            ? '41px'
            : '25px';
        return (
          <Marker
            // draggable={true}
            key={device.deviceId}
            longitude={device.location.lng}
            latitude={device.location.lat}
            anchor="bottom"
            onClick={(e) => handleMarkerSelected(e, device)}
            style={{
              cursor: 'pointer',
              zIndex: getZIndex(device, deviceSelected),
              width: width
            }}
          >
            {isMovingIcon ? (
              <React.Fragment>
                <img
                  style={{
                    width: '34px',
                    height: '48px',
                    transform: `rotate(0deg)`,
                    transition: 'all 0.3s linear'
                  }}
                  src={tagIconMovingPin}
                />
                <img
                  style={{
                    width: '11px',
                    height: '19px',
                    marginBottom: '23px',
                    marginLeft: '-23px',
                    transform: `rotate(${device.location?.heading}deg)`,
                    transition: 'all 0.3s linear'
                  }}
                  src={tagIconMoving}
                />
              </React.Fragment>
            ) : (
              <img
                style={{
                  width:
                    device.deviceType === 'Locator' || (device.fixAsset && device.protocol === 'IOX')
                      ? '35px'
                      : device.isAnchor
                      ? '41px'
                      : '25px',
                  height: '41px',
                  transform:
                    iconColor(device) === tagIconMoving ? `rotate(${device.location.heading}deg)` : `rotate(0deg)`,
                  transition: 'all 0.3s linear'
                }}
                src={iconColor(device)}
              />
            )}
          </Marker>
        );
      }),
    [mapDevices]
  );

  return (
    <>
      {/* {markerList} */}
      {map && (
        <>
          <MapCluster
            map={map?.getMap()}
            radius={70}
            extent={512}
            nodeSize={40}
            element={(clusterProps) => (
              <MapClusterGroup
                onMove={(evt) => setViewState(evt.viewState)}
                map={map?.getMap()}
                deviceHM={deviceHM}
                filter={filter}
                inCluster={inCluster}
                setInCluster={setInCluster}
                screenWidth={screenWidth}
                setViewState={setViewState}
                deviceSelected={deviceSelected}
                {...clusterProps}
              />
            )}
          >
            {markerList}
          </MapCluster>
        </>
      )}
    </>
  );
};

const mapStateToProps = ({ location, user, map }) => ({
  filter: location.filter,
  groupFilter: user.groupFilter,
  searchResult: map.searchResult,
  screenWidth: location.screenWidth,
  loginType: user.loginType,
  devices: map.devices,
  syncFilterWithMap: map.syncFilterWithMap,
  deviceSelected: map.deviceSelected
});

const mapDispatch = ({ map: { setDeviceSelectedAction }, location: { setShowCircleAction } }) => ({
  setShowCircle: setShowCircleAction,
  setDeviceSelected: setDeviceSelectedAction
});

export default connect(mapStateToProps, mapDispatch)(Markers);
