import _ from 'lodash';
import * as turf from '@turf/turf';
import { iconColor, iconPrefix } from './statusColor';
import { alignMarkerRotation } from './mapUtils';
import variables from '../variables.json';
const tagIconMoving = variables.TAG_ICON_MOVING;

/*
  API transformers
*/
export const transformDevice = (editedDevice, location) => {
  return {
    deviceId: editedDevice.deviceId,
    archived: editedDevice.archived || false,
    assetName: editedDevice.assetName,
    groups: editedDevice.groups,
    organization: editedDevice.organization,
    deviceType: editedDevice.deviceType,
    groups: editedDevice.groups,
    status: editedDevice.status,
    protocol: editedDevice.protocol,
    ...(editedDevice.deviceType === 'Tag' && { isAnchor: editedDevice.isAnchor, fixAsset: editedDevice.fixAsset }),
    ...((editedDevice.isAnchor || editedDevice.fixAsset || editedDevice.deviceType === 'Locator') &&
      location && {
        location: {
          lat: Number(location.lat),
          lng: Number(location.lng),
          alt: Number(location.alt) || 1
        }
      }),
    ...(editedDevice.isPush !== undefined && { isPush: editedDevice.isPush }),
    ...(editedDevice.serialNo !== undefined && { serialNo: editedDevice.serialNo }),
    ...(editedDevice.geotabId !== undefined && { geotabId: editedDevice.geotabId }),
    ...(editedDevice.vin !== undefined && { vin: editedDevice.vin }),
    ...(editedDevice.unitId !== undefined && { unitId: editedDevice.unitId }),
    ...(editedDevice.atp !== undefined && { atp: editedDevice.atp }),
    ...(editedDevice.firmware && { firmware: editedDevice.firmware }),
    ...(editedDevice.attachedState && { attachedState: editedDevice.attachedState }),
    ...(editedDevice.lifecycle && { lifecycle: editedDevice.lifecycle }),
    ...(editedDevice.layout && { layout: editedDevice.layout }),
    ...(editedDevice.attachments && { attachments: editedDevice.attachments })
  };
};

// update state list after update api
export const updateDevice = (updated, list) => {
  const updatedList = list?.map((item) => (item.deviceId === updated.deviceId ? { ...item, ...updated } : item));
  return updatedList || list;
};

// update state list after configuration update api
export const updateConfig = (payload, config, list) => {
  const applyToMany = payload.applyTo;
  const updatedList = list?.map((item) => {
    // update configurationID based on groups filter(update many) or deviceId(update one)
    const applyConfig = applyToMany
      ? applyToMany.groups // if groups submitted
        ? // apply to devices in the group(s). must match deviceType & protocol
          _.intersection(item.groups, applyToMany.groups).length > 0 &&
          item.protocol === payload.deviceProtocol &&
          item.deviceType === payload.deviceType
        : // apply to all devices with the same deviceType & protocol
          item.protocol === payload.deviceProtocol && item.deviceType === payload.deviceType
      : // else apply based on deviceId
        item.deviceId === payload.deviceId;
    return applyConfig ? { ...item, configurationId: config.configurationId } : item;
  });
  return updatedList || list;
};

// update state list after update/many api
export const updateDevices = (payload, list) => {
  const { filter, updateValues } = payload;
  const updatedList = list?.map((item) => {
    const apply = filter.groups // if groups submitted
      ? // apply to devices in the group(s). must match deviceType & protocol
        _.intersection(item.groups, filter.groups).length > 0 &&
        item.protocol === filter.protocol &&
        item.deviceType === filter.deviceType
      : // apply to all devices with the same deviceType & protocol
        item.protocol === filter.protocol && item.deviceType === filter.deviceType;
    // apply && console.log('apply', item, { ...item, ...updateValues });
    return apply ? { ...item, ...updateValues } : item;
  });
  return updatedList || list;
};

// update state list after bulk update api
export const bulkUpdateDevices = (updates, list) => {
  const updatesMap = new Map(updates?.map((item) => [item.deviceId, item]));
  return list?.map((item) => (updatesMap?.has(item.deviceId) ? { ...item, ...updatesMap.get(item.deviceId) } : item));
};

/*
  MAP transformers
*/
export const createPoint = (device, deviceSelected, loginType, mapRef, accuracyThreshold) => {
  const {
    deviceId,
    assetName,
    groups,
    location,
    lastSeen,
    locTime,
    isAnchor,
    fixAsset,
    protocol,
    deviceType,
    attachedState
  } = device;

  const icon = iconColor(device, false, accuracyThreshold);
  // const icon = iconColor(device);
  const sortKey =
    device.fixAsset && device.locError?.accuracy
      ? 1 / device.locError?.accuracy
      : device.deviceId === deviceSelected.deviceId
      ? 1000
      : 100;

  const props = {
    deviceId,
    assetName,
    groups,
    lastSeen,
    locTime,
    protocol,
    icon: iconPrefix(icon, loginType === 'verifyGeotabAddinAccount'),
    isAnchor,
    fixAsset,
    deviceType,
    iconSize: getIconSize(device),
    heading: icon === tagIconMoving ? alignMarkerRotation(location.heading, mapRef.getBearing()) : 0,
    isArrow: icon === tagIconMoving ? 'true' : 'false',
    accuracy: device.fixAsset && device.locError?.accuracy !== null ? device.locError?.accuracy : null,
    sortKey: sortKey,
    attachedState
  };

  const point = turf.point([location.lng, location.lat], props);
  return point;
};

const getIconSize = (device) => {
  if (device.deviceType === 'Locator' || (device.fixAsset && device.protocol === 'IOX')) return 0.055;
  if (device.isAnchor) return 0.31;
  if (device.fixAsset && device.protocol === 'LTE') return 0.9;
  if (device.fixAsset && device.locError?.accuracy !== null && device.locError?.accuracy !== undefined) return 0.6;

  return 1;
};
