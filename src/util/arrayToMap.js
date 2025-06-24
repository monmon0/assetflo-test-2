export const arrayToMap = (array, keyProperty = 'deviceId') => {
  // console.log('arrayToMap', array);
  return array.reduce((map, currentElement) => {
    const key = currentElement[keyProperty];
    map[key] = currentElement;
    return map;
  }, {});
};
