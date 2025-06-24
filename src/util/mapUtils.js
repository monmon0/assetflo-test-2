import * as turf from '@turf/turf';
import { isValidLocation } from './validation';

// Function to get bounding box of all devices
export const getAllDevicesBoundingBox = (devices) => {
  let points = [];
  devices.map((device) => {
    if (device.deviceType === 'Tag' && device.location && isValidLocation(device.location)) {
      points.push(turf.point([device.location.lng, device.location.lat]));
    }
  });
  if (points.length === 0) return;
  // Get bounding box
  const bbox = turf.bbox(turf.featureCollection(points));
  return bbox;
};

// fitBuilding for 3D maps
export const fitBuilding = async (poi, mapRef, orientation, duration = 0) => {
  try {
    const buildingId = poi.provider.indoorId;
    const building = await mapsindoors.services.VenuesService.getBuilding(buildingId);

    if (!building || !mapRef) return;
    const longestSide = findLongestSide(building);
    const bearing = turf.bearing(longestSide.pointA, longestSide.pointB);
    const w = window.innerWidth;
    const h = window.innerHeight;
    const angle = orientation ? (orientation ? 0 : 90) : h > w ? 0 : 90;

    mapRef.fitBounds(building.geometry.bbox, {
      bearing: bearing + angle,
      zoom: poi.zoom,
      linear: true,
      duration: duration
    });
  } catch (error) {
    console.error('Error in fitBuilding:', error);
  }
};

// Utility function to find the longest side of a polygon
export const findLongestSide = (poly) => {
  const geometry = poly.geometry.coordinates[0];
  const options = { units: 'meters' };

  const pointA = turf.point(geometry[0]);
  const pointB = turf.point(geometry[1]);
  const initD = turf.distance(pointA, pointB, options);
  const init = { distance: initD, pointA: geometry[0], pointB: geometry[1] };
  let longest = { distance: initD, pointA: geometry[0], pointB: geometry[1] };

  geometry.reduce((prev, curr) => {
    const a = turf.point(prev.pointB);
    const b = turf.point(curr);
    const d = turf.distance(a, b, options);

    if (d > longest.distance) longest = { distance: d, pointA: prev.pointB, pointB: curr };
    return { distance: d, pointA: prev.pointB, pointB: curr };
  }, init);
  return longest;
};

/**
 * Calculates the corners of a Point of Interest (POI) image on a map.
 *
 * @param {Object} poi - The POI object containing details about the image and location.
 * @param {number} poi.imgWidth - The width of the POI image in pixels.
 * @param {number} poi.imgHeight - The height of the POI image in pixels.
 * @param {Object} poi.location - The geographical location of the POI.
 * @param {number} poi.location.lat - The latitude of the POI.
 * @param {number} poi.location.lng - The longitude of the POI.
 * @param {number} poi.pixelsPerMeter - The number of pixels per meter for the POI image.
 * @param {string} poi.organization - The organization associated with the POI.
 * @param {number} poi.offset - The offset angle for the POI image.
 * @returns {Object} An object containing the calculated corners and the offset.
 * @returns {Array<Array<number>>} corners - An array of coordinates representing the corners of the POI image.
 * @returns {number} offset - The adjusted offset angle for the POI image.
 */
export function calculatePoiCorners(poi) {
  const { imgWidth: width, imgHeight: height } = poi;
  const { lat, lng } = poi.location;

  // Calculate half dimensions in meters
  const pixelsPerMeter = poi.pixelsPerMeter;
  const halfWidthMeters = width / pixelsPerMeter / 2;
  const halfHeightMeters = height / pixelsPerMeter / 2;

  // Adjust offset for specific organizations
  const offset = ['texas-instruments', 'indoor-assetio'].includes(poi.organization) ? poi.offset + 1.3 : poi.offset;

  // Create a center point using Turf.js
  const centerPoint = turf.point([lng, lat]);
  const options = { units: 'meters' };

  // Calculate the corners of the POI image
  const topSide = turf.destination(centerPoint, halfHeightMeters, offset, options);
  const topLeft = turf.destination(topSide, halfWidthMeters, offset - 90, options);
  const topRight = turf.destination(topLeft, halfWidthMeters * 2, offset + 90, options);
  const bottomRight = turf.destination(topRight, halfHeightMeters * 2, offset + 180, options);
  const bottomLeft = turf.destination(topLeft, halfHeightMeters * 2, offset + 180, options);

  const corners = [
    topLeft.geometry.coordinates,
    topRight.geometry.coordinates,
    bottomRight.geometry.coordinates,
    bottomLeft.geometry.coordinates
  ];
  return { corners, offset };
}

/**
 * Adjusts the map view to fit the given bounds with padding, taking into account the visibility of a side menu.
 *
 * @param {Array<number>} topRight - The coordinates [longitude, latitude] of the top-right corner of the bounds.
 * @param {Array<number>} bottomLeft - The coordinates [longitude, latitude] of the bottom-left corner of the bounds.
 * @param {Object} mapRef - The reference to the Mapbox map instance.
 * @param {number} offset - The initial bearing offset for the map view.
 * @param {boolean} isListOpen - Flag indicating whether the left-side menu is open.
 * @param {number} [dur=0] - The duration of the animation in milliseconds.
 * @param {number} [mode=0] - The mode to adjust the bearing (0 for default, 1 for alternative orientation).
 * @returns {Promise<void>} A promise that resolves when the map has finished fitting the bounds.
 */
export const fitBoundsWithPadding = async (topRight, bottomLeft, mapRef, offset, isListOpen, dur = 0, mode = 0) => {
  const w = window.innerWidth;
  const h = window.innerHeight;

  // If the left-side menu is open, adjust the visible width
  const menuWidth = isListOpen ? 320 : 0;
  const visibleWidth = w - menuWidth; // Adjusted visible width

  // Get width & height in meters
  const widthMeters = turf.distance(bottomLeft, [topRight[0], bottomLeft[1]], { units: 'meters' });
  const heightMeters = turf.distance(bottomLeft, [bottomLeft[0], topRight[1]], { units: 'meters' });

  // Use Mapbox's project() to get pixel positions
  const bounds = new mapboxgl.LngLatBounds(topRight, bottomLeft);
  const nw = mapRef.project(bounds.getNorthWest());
  const se = mapRef.project(bounds.getSouthEast());

  const widthPixels = Math.abs(nw.x - se.x);
  const heightPixels = Math.abs(nw.y - se.y);

  const padding = 50;
  const duration = dur;
  let bearing = offset;
  let isPortrait = false;

  // Determine the angle to fit the longest side
  if (h > w) {
    // If height and width differ by more than 20%, show the longest side vertically
    if (Math.abs(heightMeters - widthMeters) / Math.max(heightMeters, widthMeters) > 0.2) {
      bearing -= 90;
      isPortrait = true;
    }
  }

  // Adjust the bearing based on the orientation
  if (isPortrait) {
    bearing += 90 * mode;
  } else {
    bearing -= 90 * mode;
  }

  // console.log("coords", topRight, bottomLeft);
  // console.log("Meters (Width x Height):", widthMeters, heightMeters);
  // console.log("Pixels (Width x Height):", widthPixels, heightPixels);
  // console.log("Aspect Ratio (Meters):", aspectRatioMeters, "Portrait Mode:", isPortrait);

  if (widthPixels > visibleWidth || heightPixels > h) {
    const scale = Math.abs(Math.min(visibleWidth / widthPixels, h / heightPixels));
    const newPadding = padding * scale;
    await mapRef.fitBounds([topRight, bottomLeft], {
      padding: { top: padding, bottom: padding, left: newPadding + menuWidth, right: newPadding },
      duration,
      bearing
    });
  } else {
    await mapRef.fitBounds([topRight, bottomLeft], {
      padding: { top: padding, bottom: padding, left: padding + menuWidth, right: padding },
      duration,
      bearing
    });
  }
};

/**
 * Maps the rotation value to a range of 0 to 360 degrees.
 * @param {number} rotation - The rotation value (could be negative).
 * @returns {number} - The mapped rotation value in the range of 0 to 360 degrees.
 */
export const mapRotation = (rotation) => {
  return (rotation + 360) % 360;
};

/**
 * Aligns the marker rotation with the map rotation.
 * @param {number} heading - The heading value of the marker.
 * @param {number} mapBearing - The current bearing of the map.
 * @returns {number} - The aligned rotation value.
 */
export const alignMarkerRotation = (heading, mapBearing) => {
  const rotation = heading - mapBearing;
  return mapRotation(rotation);
};

/**
 * Finds selected device and devices attached to it
 * @param {object} deviceSelected - The heading value of the marker.
 * @param {array} allDevices - List of all deviceStates
 * @returns {object} - returns selected device state and list of attached devices
 */

export const findAttachedDevices = (deviceSelected, allDevices) => {
  let selected = null;
  const attachedDevices = [];
  allDevices?.map((dev) => {
    if (dev.deviceId === deviceSelected.deviceId) selected = dev;
    if (dev.attachedState?.attachedTo === deviceSelected.deviceId) attachedDevices.push(dev);
  });

  return { selected, attachedDevices };
};

/**
 * Finds if selected cluster(markers with the same location) connected to each other
 * @param {array} features - The heading value of the marker.
 * @param {array} allDevices - List of all deviceStates
 * @returns {object} - returns main device (vehicle/trailer)
 */
export const findMainDevice = (features) => {
  const mainDeviceSet = {};
  const attachedSet = {};
  for (const device of features) {
    // find devices without attached state or detached
    const attachedState = device?.properties.attachedState ? JSON.parse(device?.properties.attachedState) : null;
    if (!attachedState?.attachedTo) mainDeviceSet[device.properties.deviceId] = device;
    // find attached devices
    if (attachedState?.attachedTo) attachedSet[attachedState.attachedTo] = device;
  }
  const mainDeviceKeys = Object.keys(mainDeviceSet);
  const attachedKeys = Object.keys(attachedSet);

  if (mainDeviceKeys.length === attachedKeys.length && mainDeviceKeys[0] === attachedKeys[0])
    return mainDeviceSet[mainDeviceKeys[0]];
  return null;
};
