import { isValidLocation } from './validation';
export const filterByGroup = (devices, groupFilter) => {
  return (
    devices &&
    devices.filter((device) => {
      return (
        groupFilter &&
        groupFilter.find((group) => {
          return filterArray(device.groups, group);
        })
      );
    })
  );
};

export const filterDeviceTypeByGroup = (devices, groupFilter, type) => {
  return (
    devices &&
    devices.filter((device) => {
      return (
        device.deviceType === type &&
        groupFilter &&
        groupFilter.find((group) => {
          return filterArray(device.groups, group);
        })
      );
    })
  );
};

export const filterArray = (deviceGroups, group) => {
  return (
    deviceGroups &&
    deviceGroups.some((deviceGroup) => {
      return deviceGroup === group;
    })
  );
};

export const applyFilters = (
  devices,
  searchResult,
  groupFilter,
  filterByActivityAdapter,
  filterByType,
  accuracyFilter,
  searchString
) => {
  if (!devices) return [];
  let devs = devices;
  if (searchResult?.length > 0 || searchString) {
    const searchResultDeviceIds = searchResult.map((result) => result.deviceId);
    devs = devices.filter((device) => searchResultDeviceIds.includes(device.deviceId) && !device?.poiId);
    devs.sort((a, b) => searchResultDeviceIds.indexOf(a.deviceId) - searchResultDeviceIds.indexOf(b.deviceId));
  }
  // filtering by groups
  if (groupFilter.length > 0) {
    devs = filterByGroup(devs, groupFilter);
  }
  // filter by activity (last seen)
  devs = filterByActivityAdapter?.applyFilterByActivity(devs);

  // filter by device type 'Tag', 'IOX', 'Fixed', 'Locator', 'Anchor'
  let displayedDevices = filterByDeviceType(devs, filterByType);
  displayedDevices = filterBasedOnAccuracy(displayedDevices, accuracyFilter);
  // devs = devs && devs.filter((dev) => !!dev.location && dev.location.lat && dev.location.lng);
  return displayedDevices;
};

const filterBasedOnAccuracy = (devs, accuracyFilter) => {
  if (!accuracyFilter) return devs;
  return devs.filter((device) => !device.fixAsset || (device.fixAsset && device.locError?.accuracy >= accuracyFilter));
};

const filterByDeviceType = (devices, filter) => {
  const filterSet = new Set(filter);

  // Check if all filter types are present
  if (['Tag', 'IOX', 'Fixed', 'Locator', 'Anchor'].every((type) => filterSet.has(type))) {
    return devices;
  }

  // Helper function to evaluate filtering conditions
  const shouldInclude = (marker) => {
    if (marker.poiId) return true;

    return (
      (filterSet.has('Anchor') && marker.isAnchor) ||
      (filterSet.has('IOX') && marker.protocol === 'IOX' && !marker.fixAsset) ||
      (filterSet.has('Fixed') && marker.fixAsset) ||
      (filterSet.has('Tag') &&
        marker.deviceType === 'Tag' &&
        !marker.isAnchor &&
        !marker.fixAsset &&
        marker.protocol !== 'IOX') ||
      (filterSet.has('Locator') && marker.deviceType === 'Locator')
    );
  };

  // Filter devices using the helper function
  return devices?.filter(shouldInclude) || [];
};
