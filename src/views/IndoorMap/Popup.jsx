import React, { useState, useEffect, useContext, useRef } from 'react';
import { useDispatch } from 'react-redux';
import ReactDOM from 'react-dom';
import { useSelector } from 'react-redux';
import mapboxgl from 'mapbox-gl';
import variables from '../../variables.json';
import moment from 'moment';
import { isValidLocation } from '../../util/validation';
import { iconColor } from '../../util/statusColor';
import { batteryIcons } from '../../util/batteryUtil';
import { copyToClipBoard } from '../../util/clipboard';
import BatteryStdIcon from '@mui/icons-material/BatteryStd';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import { Divider, Chip, Tooltip } from '@mui/material';
import { MarkerContext } from '../../context/Map/MarkerContext';
import { findAttachedDevices } from '../../util/mapUtils';
import { getLocationToUse } from '../../util/format';
import { getLastSeenMoment } from '../../util/getLastSeen';

const tagIconMoving = variables.TAG_ICON_MOVING;

const Popup = ({ mapRef, mapLoaded, displayedDevices, inCluster }) => {
  const [popup, setPopup] = useState(null);
  const deviceSelected = useSelector((state) => state.map.deviceSelected);
  const showAdvanceTool = useSelector((state) => state.location.showAdvanceTool);
  const [attachmentListSize, setAttachmentListSize] = useState(0);
  const { selectedDeviceList, setSelectedDeviceList } = useContext(MarkerContext);
  const prevDeviceListRef = useRef([]);
  const dispatch = useDispatch();

  useEffect(() => {
    if (mapLoaded && deviceSelected?.deviceId) {
      const { selected, attachedDevices } = findAttachedDevices(deviceSelected, displayedDevices);
      // console.log(selected, attachedDevices);
      const isMarkerInsideCluster = inCluster && inCluster.deviceId === deviceSelected.deviceId;
      if (!selected || !selected.location) return;

      const locationToUse = getLocationToUse(isMarkerInsideCluster, inCluster, selected, selectedDeviceList);
      // for cluster popup (list of selectable devices)
      // do not refresh the popup which resets the list(bad for scrolling)
      const clusterPersisted = checkClusterChange(prevDeviceListRef.current, selectedDeviceList);
      // console.log('cluster is the same', clusterPersisted, selectedDeviceList);
      if (!clusterPersisted) popup?.remove();
      // console.log('clusterPersisted && popup.isOpen()', clusterPersisted && popup.isOpen());
      // do not update popup if list is shown (may cause issues for a moving cluster)
      if (!isValidLocation(locationToUse) || (clusterPersisted && popup?.isOpen())) return;

      const coordinates = [locationToUse.lng, locationToUse.lat];
      const container = document.createElement('div');
      ReactDOM.render(
        <PopupContent
          device={selected}
          selectedDeviceList={selectedDeviceList}
          attachedDevices={attachedDevices}
          showAdvanceTool={showAdvanceTool}
        />,
        container
      );
      const mPopup = getPopup(isMarkerInsideCluster);
      mPopup.setLngLat(coordinates).setDOMContent(container).addTo(mapRef);

      const popupElement = mPopup?.getElement();
      if (popupElement) popupElement.style.opacity = showAdvanceTool ? 0.8 : 1;
      setPopup(mPopup);
      prevDeviceListRef.current = selectedDeviceList;
    } else if (mapLoaded && !deviceSelected) {
      popup?.remove();
    }
    prevDeviceListRef.current = selectedDeviceList;
  }, [deviceSelected, mapLoaded, showAdvanceTool, inCluster, attachmentListSize, selectedDeviceList, displayedDevices]);

  const checkClusterChange = (prevList, currentList) => {
    if (!currentList.length) return false;
    // Convert both arrays to sets of ids
    const prevSet = new Set(prevList.map((item) => item.deviceId));
    const currSet = new Set(currentList.map((item) => item.deviceId));

    const areKeysSame = prevSet.size === currSet.size && [...prevSet].every((deviceId) => currSet.has(deviceId));
    return areKeysSame;
  };

  const getPopup = (isMarkerInsideCluster) => {
    if (!popup) {
      return new mapboxgl.Popup({
        offset: [0, isMarkerInsideCluster ? -20 : -45],
        closeButton: false,
        maxWidth: 500,
        anchor: 'bottom'
      });
    }
    return popup;
  };

  const PopupContent = ({ device, selectedDeviceList, showAdvanceTool, attachedDevices }) => {
    const lastLoc = moment(device.locTime).startOf('minute').fromNow();
    const lastSeen = getLastSeenMoment(device).startOf('minute').fromNow();
    let rad = 0;

    if (device.protocol === 'LTE' && device.gpsWeight) {
      const weight = device.gpsWeight > 1 ? 1 : device.gpsWeight;
      const dist = -147.5 * weight + 150;
      rad = dist > 150 ? 150 : dist;
      rad = Math.round(rad * 100) / 100;
    }

    const accuracy =
      device.fixAsset && device.locError && device.locError.accuracy ? device.locError.accuracy.toFixed(2) : 'N/A';
    const telemetry = device.telemetry ? telemetryContent(device) : '';

    if (selectedDeviceList.length > 0) {
      return (
        <div style={{ maxHeight: 105, overflowY: 'auto' }}>
          {selectedDeviceList.map((feature, index) => {
            return (
              <div key={feature.deviceId}>
                <button
                  className="assetflo-popup-btn"
                  onClick={() => {
                    const selected = displayedDevices.find((dev) => feature.deviceId === dev.deviceId);
                    console.log('selected', selected);
                    dispatch.map.setDeviceSelectedAction(selected);
                    setSelectedDeviceList([]);
                  }}
                >
                  {feature.assetName}
                </button>
                <br />
              </div>
            );
          })}
        </div>
      );
    } else if (showAdvanceTool) {
      // Advanced Tool Popup Content
      return (
        <div>
          <span>
            <strong style={{ color: variables.ORANGE_COLOR }}>Name: </strong>
            {device.assetName}
          </span>
          <br />
          <span>
            <strong style={{ color: variables.ORANGE_COLOR }}>MAC: </strong>
            {device.deviceId}{' '}
            <button
              onClick={() => copyToClipBoard(device.deviceId, 'MAC address')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: variables.ORANGE_COLOR }}
            >
              <i className="fas fa-copy"></i>
            </button>
          </span>
          <br />
          {device.gpsWeight && !device?.locators.length && (
            <>
              <span>
                <strong style={{ color: variables.ORANGE_COLOR }}>Weight: </strong>
                {Math.round(device.gpsWeight * 100) / 100}
              </span>
              <br />
            </>
          )}
          <span>
            <strong style={{ color: variables.ORANGE_COLOR }}>Distance: </strong>
            {accuracy}
          </span>
          <br />
        </div>
      );
    } else {
      // Default Popup Content
      const lat = parseFloat(device.location.lat.toFixed(6));
      const lng = parseFloat(device.location.lng.toFixed(6));
      return (
        <div>
          <h3
            style={{
              marginBottom: '3px',
              backgroundColor: variables.ORANGE_COLOR,
              color: 'white',
              padding: '3px',
              borderRadius: '5px',
              textAlign: 'center'
            }}
          >
            {device.assetName || `${device.deviceType}-${device.deviceId}`}
          </h3>
          <span>
            <strong style={{ color: variables.ORANGE_COLOR }}>MAC: </strong>
            {device.deviceId}{' '}
            <button
              onClick={() => copyToClipBoard(device.deviceId, 'MAC address')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: variables.ORANGE_COLOR }}
            >
              <i className="fas fa-copy"></i>
            </button>
          </span>
          <br />
          <span>
            <strong style={{ color: variables.ORANGE_COLOR }}>Location: </strong>
            {lat}, {lng}{' '}
            <button
              onClick={() => copyToClipBoard(`${lat}, ${lng}`, 'Location')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: variables.ORANGE_COLOR }}
            >
              <i className="fas fa-copy"></i>
            </button>
          </span>
          <br />
          {telemetry}
          {((lastSeen !== lastLoc && !device.isAnchor && !device.fixAsset) ||
            (['BLE', 'OTS.BLE'].includes(device) && !device.isAnchor && !device.fixAsset && lastLoc === 'N/A')) && (
            <>
              <span>
                <strong style={{ color: variables.ORANGE_COLOR }}>Stopped: </strong>
                {lastLoc}
              </span>
              <br />
            </>
          )}
          {/* {device.protocol === 'LTE' && !device.locators?.length && device.gpsWeight && rad && (
            <>
              <span>
                <strong style={{ color: variables.ORANGE_COLOR }}>Accuracy: </strong>
                &lt; {rad} meters {lastSeen !== lastLoc ? lastLoc : ''}
              </span>
              <br />
            </>
          )} */}
          <span>
            <strong style={{ color: variables.ORANGE_COLOR }}>Last seen: </strong>
            {lastSeen}
          </span>
          <br />
          {iconColor(device) === tagIconMoving && (
            <span>
              <strong style={{ color: variables.ORANGE_COLOR }}>Heading: </strong>
              {Math.round(device.location.heading)}
            </span>
          )}
          {displayAttachment(device, attachedDevices)}
        </div>
      );
    }
  };

  const telemetryContent = (device) => {
    const hasHumidity = device.telemetry.humidity || device.telemetry.humidity === 0;
    const icon = device.telemetry.batteryChargeStatus ? batteryIcons[device.telemetry.batteryChargeStatus] : null;

    return (
      <div>
        <>
          {device.telemetry.temperature != null && (
            <span>
              <strong style={{ color: variables.ORANGE_COLOR }}>Temperature: </strong>
              {device.telemetry.temperature + '°C'}
            </span>
          )}
          {hasHumidity && (
            <>
              <span style={{ marginLeft: 5 }}>
                <strong style={{ color: variables.ORANGE_COLOR }}>Humidity: </strong>
                {device.telemetry.humidity + '%'}
              </span>
            </>
          )}
          {device.telemetry.temperature != null || hasHumidity ? <br /> : null}
        </>
        {device.telemetry.batterylevel != null && (
          <div style={{ display: 'flex', maxHeight: 20 }}>
            <span>
              <strong style={{ color: variables.ORANGE_COLOR }}>Battery: </strong>
              {device.telemetry.batterylevel + '%'}
            </span>
            <span style={{ marginLeft: 5 }}>{icon}</span>

            <br />
          </div>
        )}
      </div>
    );
  };
  const displayAttachmentSummary = (attachedDevices) => {
    if (!attachedDevices?.length) return null;
    const devicesWithHumidity = [];
    const devicesWithTemp = [];
    attachedDevices.map((dev) => {
      if (dev.telemetry?.temperature != null) devicesWithTemp.push(dev);
      if (dev.telemetry?.humidity != null) devicesWithHumidity.push(dev);
    });
    const formatValue = (value) => (value % 1 === 0 ? value : value.toFixed(2));
    const avgTemp = formatValue(
      devicesWithTemp.reduce((acc, dev) => acc + dev.telemetry.temperature, 0) / devicesWithTemp.length
    );
    const avgHumidity = formatValue(
      devicesWithHumidity.reduce((acc, dev) => acc + dev.telemetry.humidity, 0) / devicesWithHumidity.length
    );
    return (
      <>
        {(devicesWithHumidity.length > 0 || devicesWithTemp.length > 0) && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <strong style={{ color: variables.ORANGE_COLOR }}>Inside Trailer: </strong>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <ThermostatIcon fontSize="small" />
              {avgTemp + '°C, '}
            </span>
            {devicesWithHumidity.length > 0 && (
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <WaterDropIcon fontSize="small" />
                {avgHumidity + '%,'}
              </span>
            )}
            <br />
          </div>
        )}
      </>
    );
  };

  const displayAttachment = (device, attachedDevices) => {
    if (device.attachedState?.attachedTo) {
      const attachedTo = displayedDevices.find((dev) => dev.deviceId === device.attachedState.attachedTo);

      return (
        <div>
          <span>
            <strong style={{ color: variables.ORANGE_COLOR }}>Attached to: </strong>
            {attachedTo.assetName}
          </span>
        </div>
      );
    } else if (attachedDevices?.length) {
      return (
        <div>
          {!attachmentListSize && attachedDevices?.length > 1 && displayAttachmentSummary(attachedDevices)}
          {(attachmentListSize > 0 || attachedDevices?.length === 1) && (
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {attachedDevices.map((dev, i) => {
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                    <Tooltip title={dev.deviceId} placement="left-start">
                      <strong>{dev.attachedState.position || dev.assetName} - </strong>
                    </Tooltip>
                    {dev.telemetry?.batterylevel != null && (
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <BatteryStdIcon fontSize="small" />
                        {dev.telemetry.batterylevel + '%, '}
                      </span>
                    )}
                    {dev.telemetry?.temperature != null && (
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <ThermostatIcon fontSize="small" />
                        {dev.telemetry.temperature + '°C, '}
                      </span>
                    )}
                    {dev.telemetry?.humidity != null && (
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <WaterDropIcon fontSize="small" />
                        {dev.telemetry.humidity + '%,'}
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', marginLeft: 2 }}>
                      {moment(dev.lastSeen).fromNow()}
                    </span>

                    <br />
                  </div>
                );
              })}
            </div>
          )}
          {attachedDevices.length && (
            <div>
              <Divider style={{ marginTop: 3 }}>
                <Chip
                  label={attachedDevices.length > attachmentListSize ? 'Show details' : 'Hide details'}
                  size="small"
                  onClick={expandPopup}
                />
              </Divider>
            </div>
          )}
        </div>
      );
    }
  };

  const expandPopup = () => {
    if (!attachmentListSize) return setAttachmentListSize(1000);
    setAttachmentListSize(0);
  };

  return null;
};

export default Popup;
