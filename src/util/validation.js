import _ from 'lodash';
export const isValidLocation = (location) => {
  if (
    !_.isUndefined(location) &&
    !_.isUndefined(location.lat) &&
    !_.isUndefined(location.lng) &&
    !isNaN(location.lat) &&
    !isNaN(location.lng) &&
    Number(location.lat) !== 0 &&
    Number(location.lng) !== 0 &&
    Number(location.lat) >= -90 &&
    Number(location.lat) <= 90 &&
    Number(location.lng) >= -180 &&
    Number(location.lng) <= 180
  )
    return true;
  return false;
};

export const isValidLat = (lat) => {
  if (!_.isUndefined(lat) && !isNaN(lat) && Number(lat) !== 0 && Number(lat) >= -90 && Number(lat) <= 90) return true;
  return false;
};

export const isValidLng = (lng) => {
  if (!_.isUndefined(lng) && !isNaN(lng) && Number(lng) !== 0 && Number(lng) >= -180 && Number(lng) <= 180) return true;
  return false;
};

export const isValidEmail = (email) => {
  email = email && email.trim();
  const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
  const res = regex.test(email);
  return res;
};
