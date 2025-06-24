import React from 'react';
import { useSelector } from 'react-redux';
import { Popup } from 'react-map-gl';
import moment from 'moment';
import { iconColor } from '../../util/statusColor';
import variables from '../../variables.json';

const DevicePopup = (props) => {
  const { device, inCluster, tagIconMoving } = props;
  const showCircle = useSelector((state) => state.location.showCircle);
  const showAdvanceTool = useSelector((state) => state.location.showAdvanceTool);

  if (!device || device.type === 'Building' || !device.location) {
    return null;
  }

  // Function to copy MAC address and show toast notification
  const copyMacAddress = () => {
    navigator.clipboard
      .writeText(device.deviceId)
      .then(() => {
        showToastMessage('MAC address copied!');
      })
      .catch(() => {
        showToastMessage('Failed to copy MAC address');
      });
  };

  // Function to display the toast message
  const showToastMessage = (message) => {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'show';
    setTimeout(() => {
      toast.className = toast.className.replace('show', '');
    }, 3000); // Toast will disappear after 3 seconds
  };

  let lastLoc = moment(device.locTime).startOf('minute').fromNow();
  let lastSeen = moment(device.lastSeen || device.eventTime || device.locTime)
    .startOf('minute')
    .fromNow();
  let rad = 0;

  if (device.protocol === 'LTE' && device.gpsWeight) {
    const weight = device.gpsWeight > 1 ? 1 : device.gpsWeight;
    const dist = -147.5 * weight + 150;
    rad = dist > 150 ? 150 : dist;
    rad = Math.round(rad * 100) / 100;
  }

  return (
    <>
      {/* Toast Container */}
      <div id="toast"></div>

      <Popup
        style={{
          // opacity: showCircle ? 1 : 0.8,
          backgroundColor: 'white',
          zIndex: 12,
          maxWidth: 500,
          fontSize: '10px',
          borderRadius: '8px', // Rounded corners for consistency
          padding: '8px', // Added padding for spacing
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
        }}
        key={device.deviceId}
        longitude={device?.location?.lng}
        latitude={device?.location?.lat}
        anchor={'bottom'}
        closeButton={false}
        closeOnClick={false}
        offset={{
          'bottom-left': iconColor(device) === tagIconMoving ? [12, -53] : [12, -46],
          bottom: inCluster ? [0, -25] : iconColor(device) === tagIconMoving ? [0, -53] : [0, -46],
          'bottom-right': iconColor(device) === tagIconMoving ? [12, -53] : [12, -46]
        }}
        borderRadius="20px"
      >
        {!showAdvanceTool ? (
          <>
            <h3
              style={{
                marginBottom: '5px',
                backgroundColor: variables.ORANGE_COLOR,
                color: 'white',
                padding: '5px',
                borderRadius: '5px',
                textAlign: 'center',
                fontSize: '1.2rem',
                fontWeight: 500
              }}
            >
              <div>{device.assetName || `${device.deviceType}-${device.deviceId}`}</div>
            </h3>

            {device.deviceId && (
              <span>
                <strong style={{ color: variables.ORANGE_COLOR }}>MAC: </strong>
                {device.deviceId}{' '}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(device.deviceId);
                    alert('MAC address copied!');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: variables.ORANGE_COLOR
                  }}
                >
                  <i className="fas fa-copy"></i>
                </button>
              </span>
            )}
            {device.deviceType && (
              <span>
                <strong style={{ color: variables.ORANGE_COLOR }}>Type: </strong>
                <span>{device.deviceType}</span>
                <br />
              </span>
            )}
            <span>
              <strong style={{ color: variables.ORANGE_COLOR }}>Location: </strong>
              {device.location && device.location.lat}, {device.location && device.location.lng}
            </span>
            <br />
            {device.protocol === 'LTE' && lastSeen !== lastLoc && device.locators?.length > 0 && (
              <>
                <span>
                  <strong style={{ color: variables.ORANGE_COLOR }}>Last known location: </strong>
                  {lastLoc}
                </span>
                <br />
              </>
            )}
            {device.protocol === 'LTE' && !device.locators?.length && device.gpsWeight && rad && (
              <>
                <span>
                  <strong style={{ color: variables.ORANGE_COLOR }}>Accuracy: </strong>
                  {`< ${rad} meters ${lastSeen !== lastLoc ? lastLoc : ''}`}
                </span>
                <br />
              </>
            )}
            <span>
              <strong style={{ color: variables.ORANGE_COLOR }}>Last seen: </strong>
              {lastSeen}
            </span>
            <br />
            {iconColor(device) === tagIconMoving && (
              <>
                <span>
                  <strong style={{ color: variables.ORANGE_COLOR }}>Heading: </strong>
                  {Math.round(device.location.heading)}
                </span>
                <br />
              </>
            )}
          </>
        ) : (
          <div style={{ padding: '0px' }}>
            <span>
              <strong style={{ color: variables.ORANGE_COLOR }}>name: </strong>
              {device.assetName || `${device.deviceType}-${device.deviceId}`}
            </span>
            <br />
            <span>
              <strong style={{ color: variables.ORANGE_COLOR }}>mac: </strong>
              {device.deviceId}
            </span>
            {device.gpsWeight && !device?.locators.length && (
              <>
                <br />
                <span>
                  <strong style={{ color: variables.ORANGE_COLOR }}>weight: </strong>
                  {Math.round(device.gpsWeight * 100) / 100}
                </span>
              </>
            )}
            {device.attachedState && (
              <>
                <br />
                {device.attachedState.state === 'Attached' ? (
                  <span>
                    Attached to
                    <strong style={{ marginLeft: 5 }}>{device.attachedState.attachedTo} </strong>
                  </span>
                ) : (
                  <span>
                    <strong>Detached </strong>
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </Popup>
    </>
  );
};

export default DevicePopup;
