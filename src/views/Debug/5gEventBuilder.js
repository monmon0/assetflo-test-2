const moment = require('moment');

// build 5g events used in ManageTestsTable.jsx
const build5gEvent = (deviceData, location, speed, isMoving, scanTime, scanData, evt) => {
  evt.batterylevel = evt.batterylevel == null ? 13 : +evt.batterylevel || 13;
  evt.temperature = evt.temperature == null ? 12 : +evt.temperature || 12;
  const event = {
    deviceId: deviceData.deviceId,
    eventTime: new Date(scanTime),
    eventId: `${deviceData.deviceId}_${scanTime}`,
    assetName: deviceData.assetName,
    deviceType: deviceData.deviceType,
    protocol: deviceData.protocol,
    groups: deviceData.groups,
    source: 'GPS',
    organization: deviceData.organization,
    location: {
      ...location,
      lat: +location.lat,
      lng: +location.lng,
      speed: +speed,
      ...(evt.heading && evt.heading !== '' && { heading: +evt.heading })
    },
    telemetry: {
      ...deviceData.telemetry,
      isMoving: isMoving,
      satsUsed: evt.satsUsed,
      hdop: evt.hdop,
      isCached: evt.isCached || false,
      batterylevel: +evt.batterylevel,
      temperature: +evt.temperature,
      powerConnected: evt.powerConnected || false
    },
    scanTime: scanTime
  };
  if (scanData) {
    scanData = scanData.map((scan) => {
      return { ...scan, rssi: scan.rssi, scanTime: scan.scanTime };
    });
  }
  return { ...event, blescans: scanData || [] };
};

export { build5gEvent };
