export const flattenLatLng = (device) => {
  return {
    ...device,
    lat: device.location.lat,
    lng: device.location.lng,
    alt: device.location.alt || 1
  };
};

export const getLocationToUse = (isMarkerInsideCluster, inCluster, selected, selectedDeviceList) => {
  const locationToUse = isMarkerInsideCluster
    ? inCluster.location
    : selectedDeviceList?.length > 0
    ? selectedDeviceList[0].location
    : selected.location;
  return locationToUse;
};
