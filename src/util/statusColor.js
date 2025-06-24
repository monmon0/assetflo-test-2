import moment from 'moment';
import variables from '../variables.json';

const locatorIcon = variables.LOCATOR_ICON;
const tagIconGreen = variables.TAG_ICON_GREEN;
const tagIconBlue = variables.TAG_ICON_BLUE;
const tagIconGrey = variables.TAG_ICON_GREY;
const tagIconRed = variables.TAG_ICON_RED;
const tagIconBlack = variables.TAG_ICON_BLACK;
const fixedTagGreen = variables.FIXED_TAG_GREEN;
const fixedTagLightGreen = variables.FIXED_TAG_LIGHT_GREEN;
const fixedTagYellow = variables.FIXED_TAG_YELLOW;
const fixedTagOrange = variables.FIXED_TAG_ORANGE;
const tagIconFixed = variables.FIXED_TAG_ICON;
const tagIconMoving = variables.TAG_ICON_MOVING;
const anchorIcon = variables.ANCHER_ICON;

const localIcons = [tagIconMoving, tagIconFixed, fixedTagGreen, fixedTagLightGreen, fixedTagOrange, fixedTagYellow];

const outOfRangeDelay = variables.OUT_OF_RANGE_DELAY;

// Local Colours
const primaryBlue = '#20a8d8';
const successGreen = '#28a745';
const dangerRed = '#f86c6b';
const secondaryGrey = '#c8ced3';

const twoMinutes = 120000; // 2 minutes in milliseconds
const twentyFourHours = 86400000; // 24 hours in milliseconds
const twentyEightDays = 2419200000; // 28 days in milliseconds

export const statusColor = (device, timeProp) => {
  const now = moment().valueOf();
  const timeVal = timeProp || (device.lastSeen ? device.lastSeen : device.eventTime);
  if (!timeVal) return '';

  const deviceTime = moment(timeVal).valueOf();

  // Return grey if device location is missing
  if (!device.location || device.location.lat === undefined || device.location.lng === undefined) {
    return secondaryGrey;
  }

  if (device.deviceType === 'Tag') {
    // Return empty string for anchor tags
    if (device.isAnchor) {
      return ''; // anchor
    }

    // Out of range condition (if enabled by fixIOXSubscription)
    // if (fixIOXSubscription) {
    //   const lastSeenOrEventTime = moment(device.lastSeen || device.eventTime).valueOf();
    //   if (now - lastSeenOrEventTime > outOfRangeDelay) {
    //     return secondaryGrey;
    //   }
    // }

    // if device is currently moving
    if (device.telemetry?.isMoving) {
      // Recently active (within 2 minutes)
      if (now - deviceTime <= twoMinutes) {
        return successGreen;
      }
      // Active (more than 2 minutes ago but less than 24 hours)
      if (now - deviceTime > twoMinutes && now - deviceTime <= twentyFourHours) {
        return primaryBlue;
      }
    }

    // Inactive for more than 28 days
    if (now - deviceTime > twentyEightDays) {
      return dangerRed;
      // Inactive for more than 24 hours
    } else if (now - deviceTime > twentyFourHours) {
      return secondaryGrey;
      // Stationary or not updated in last 24 hours
    } else {
      return primaryBlue;
    }
  }

  // Default: return empty string (for POIs, locators, etc.)
  return '';
};

export const iconColor_ = (device, fixIOXSubscription) => {
  const now = moment().valueOf();
  // const prop = device.stateTime ? 'stateTime' : 'eventTime';
  // const hasBadLocation = device.stateTime !== device.locTime;
  const prop = device.lastSeen ? 'lastSeen' : 'eventTime';
  const hasBadLocation = device.lastSeen !== device.locTime;
  if (device.deviceType === 'Locator' || (device.fixAsset && device.protocol === 'IOX')) {
    return locatorIcon; // locator
  } else if (device.deviceType === 'Tag' && device.isAnchor) {
    return anchorIcon; // anchor
  } else if (device.deviceType !== 'Tag') return tagIconGrey;

  if (
    //   fixIOXSubscription &&
    //   now - moment(device.lastSeen || device.eventTime).valueOf() > outOfRangeDelay
    //   // (device.scanDrops || now - moment(device.locTime || device.eventTime).valueOf() > outOfRangeDelay) // more than 15 min
    // ) {
    //   return tagIconBlack; // black out of range icon
    // } else if (
    device.telemetry?.isMoving !== 'false' &&
    (hasBadLocation || !device.location?.heading) &&
    now - moment(device[prop]).valueOf() <= 120000 // less than 2 min
  ) {
    return tagIconGreen; // moving without arrow
  } else if (
    device.telemetry?.isMoving !== 'false' &&
    device.location?.heading &&
    now - moment(device[prop]).valueOf() <= 120000 // less than 2 min
  ) {
    return tagIconMoving; // moving with arrow
  } else if (
    now - moment(device[prop]).valueOf() >
    2419200000 // more than 28 days
  ) {
    return tagIconRed;
  } else if (
    now - moment(device[prop]).valueOf() >
    86400000 // more than 24hours
  ) {
    return tagIconGrey;
  } else if (
    !device.telemetry?.isMoving ||
    now - moment(device[prop]).valueOf() > 120000 // more than 2 min
  ) {
    return tagIconBlue;
  }
};
export const iconColor = (device, fixIOXSubscription, accuracyThreshold = { near: 2, far: 5.9 }) => {
  const now = moment().valueOf();
  // const prop = device.stateTime ? 'stateTime' : 'eventTime';
  // const hasBadLocation = device.stateTime !== device.locTime;
  const prop = device.lastSeen ? 'lastSeen' : 'eventTime';
  const hasBadLocation = device.lastSeen !== device.locTime;
  const isAttached = device.attachedState?.attachedTo;
  if (device.deviceType === 'Locator' || (device.fixAsset && device.protocol === 'IOX')) {
    return locatorIcon; // locator
  } else if (device.deviceType === 'Tag' && device.isAnchor) {
    return anchorIcon; // anchor
  } else if (device.deviceType === 'Tag' && device.fixAsset && (device.protocol === 'LTE' || !device.locError)) {
    return tagIconFixed; // fixed asset
  } else if (device.deviceType === 'Tag' && device.fixAsset && device.locError?.accuracy <= accuracyThreshold.near) {
    return fixedTagGreen; // fixed asset
  } else if (device.deviceType === 'Tag' && device.fixAsset && device.locError?.accuracy <= accuracyThreshold.far) {
    return fixedTagLightGreen; // fixed asset
  } else if (device.deviceType === 'Tag' && device.fixAsset && device.locError?.accuracy > accuracyThreshold.far) {
    return fixedTagYellow; // fixed asset
    // } else if (
    //   device.deviceType === 'Tag' &&
    //   fixIOXSubscription &&
    //   now - moment(device.lastSeen || device.eventTime).valueOf() > outOfRangeDelay
    //   // (device.scanDrops || now - moment(device.locTime || device.eventTime).valueOf() > outOfRangeDelay) // more than 15 min
    // ) {
    //   return tagIconBlack; // block out of range icon
  } else if (
    device.deviceType === 'Tag' &&
    device.telemetry &&
    device.telemetry.isMoving &&
    device.telemetry.isMoving !== 'false' &&
    ((hasBadLocation && !isAttached) || !device.location.heading) &&
    now - moment(device[prop]).valueOf() <= 120000 // less than 2 min
  ) {
    return tagIconGreen; // moving without arrow
  } else if (
    device.deviceType === 'Tag' &&
    device.telemetry &&
    device.telemetry.isMoving &&
    device.telemetry.isMoving !== 'false' &&
    device.location.heading &&
    now - moment(device[prop]).valueOf() <= 120000 // less than 2 min
  ) {
    return tagIconMoving; // moving with arrow
  } else if (
    device.deviceType === 'Tag' &&
    device.telemetry !== undefined &&
    device.telemetry !== null &&
    now - moment(device[prop]).valueOf() > 2419200000 // more than 28 days
  ) {
    return tagIconRed;
  } else if (
    device.deviceType === 'Tag' &&
    device.telemetry !== undefined &&
    device.telemetry !== null &&
    now - moment(device[prop]).valueOf() > 86400000 // more than 24hours
  ) {
    return tagIconGrey;
  } else if (
    device.deviceType === 'Tag' &&
    device.telemetry !== undefined &&
    device.telemetry !== null &&
    (!device.telemetry.isMoving || now - moment(device[prop]).valueOf() > 120000) // more than 2 min
  ) {
    return tagIconBlue;
  } else {
    return tagIconGrey;
  }
};

export const iconPrefix = (icon, isGeotabAddin) => {
  if (!localIcons.includes(icon)) return icon;
  const prefix = process.env.NODE_ENV === 'production' ? variables.PRODUCTION_URL_IMAGE : variables.STAGING_URL_IMAGE;
  return isGeotabAddin ? prefix + icon : icon;
};

export const getZIndex = (device, deviceSelected) => {
  if (deviceSelected && deviceSelected.deviceId === device.deviceId) return 10;
  let zIndex = 5;
  switch (device.protocol) {
    case 'BLE':
      zIndex = 8;
      break;
    case 'LTE':
      zIndex = 7;
      break;
    case 'IOX':
      zIndex = 6;
      break;
    case 'WIFI':
    default:
      break;
  }
  return zIndex;
};
