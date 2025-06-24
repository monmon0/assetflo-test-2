const moment = require('moment');

// build IOX events used in ManageTestsTable.jsx
/*
  We use 2 seperate buildIOXEvent functions for ManageTestsTable.jsx and Simulation.jsx
  since in the context of ManageTestTable.jsx, there is no props.devices needed for the 
  getPosition function that buildIOXEvent uses. So for ManageTestsTable, we pass an additional
  param to buildIoxEvent called devices, which is a substitute list of devices. 
*/
const buildIoxEvent = (
  devices,
  deviceData,
  location,
  speed,
  isMoving,
  selectedTime,
  eventType,
  scanData,
  locationAccuracy
) => {
  const scanTime = scanData ? moment(scanData.scanTime).valueOf() : selectedTime;
  const eventId = `${deviceData.deviceId}.${scanTime}`;
  const goId = deviceData.deviceId.split('.')[1];
  const isAnchorScan = (scanData && scanData.isAnchor) || false;
  const isFixedAsset = deviceData.fixAsset;
  const locatorLoc = getPosition(isAnchorScan ? scanData.deviceId : isFixedAsset ? deviceData.deviceId : null, devices);

  const event = {
    locatorId: eventType === 'scans' && isAnchorScan ? scanData.deviceId : deviceData.deviceId,
    goId: goId,
    eventTime: new Date(scanTime),
    eventId: eventId,
    organization: deviceData.organization,
    receivedAt: scanTime,
    assetName: deviceData.assetName,
    deviceId: (eventType === 'scans' && isAnchorScan) || eventType === 'gps' ? deviceData.deviceId : scanData.deviceId,
    isLogRec: eventType === 'scans' ? false : true,
    isBleScan: eventType === 'scans' ? true : false,
    feedSource: eventType === 'scans' ? 'IOXScan' : 'LogRecord',
    scanTime: scanTime,
    telemetry: {
      isMoving: eventType === 'scans' ? scanData.isMoving || false : isMoving
    },
    requestDate: scanTime,
    rssi: eventType === 'scans' ? +scanData.rssi : -48,
    measuredPower: -48,
    beaconType: 'assetfloNearable',
    protocol: eventType === 'scans' && !isAnchorScan ? 'BLE' : 'IOX',
    localization: eventType === 'scans' && !isAnchorScan ? 'asset' : 'own',
    ...(eventType !== 'scans' && {
      location: {
        ...location,
        lat: +location.lat,
        lng: +location.lng,
        alt: 1,
        speed: +speed || 0,
        eventId: eventId,
        goId: goId,
        eventTime: new Date(scanTime),
        accuracy: locationAccuracy
      }
    }),

    locatorLoc: locatorLoc || {
      ...location,
      alt: 1,
      speed: speed,
      eventId: eventId,
      goId: goId,
      eventTime: new Date(scanTime),
      accuracy: locationAccuracy
    },
    ...(eventType === 'scans' && {
      locatorName: deviceData.assetName
    })
  };
  return event;
};

// find position of device given device id
const getPosition = (deviceId, devices) => {
  if (!deviceId) return null;
  const device = devices.find((dev) => dev.deviceId === deviceId);
  return device.location;
};

export { buildIoxEvent };
