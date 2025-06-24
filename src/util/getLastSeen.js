import moment from 'moment';

export const getLastSeen = (device) => {
  return device.lastSeen || (device.eventTime && moment(device.eventTime).valueOf()) || device.locTime;
};

// moment Last Seen
export const getLastSeenMoment = (device) => {
  return moment(getLastSeen(device));
};
