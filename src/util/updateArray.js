import _ from 'lodash';
export function updateArrayData(newArray, oldArray) {
  if (!newArray || !oldArray) return;

  //convert oldArray to object
  let oldArrayObject = oldArray.reduce((acc, cur) => {
    let { deviceId } = cur;
    return { ...acc, [deviceId]: cur };
  }, {});

  //convert newArray to object
  let newArrayObject = newArray.reduce((acc, cur) => {
    let { deviceId } = cur;
    return {
      ...acc,
      [deviceId]: { ...cur, ...(oldArrayObject[deviceId] && oldArrayObject[deviceId].isAnchor && { isAnchor: true }) }
    };
  }, {});
  // creating object by adding the updated value from newArrayObject
  // let updatedArray = _.merge(oldArrayObject, newArrayObject);
  let updatedArray = { ...oldArrayObject, ...newArrayObject };
  // convert updatedArray to array
  updatedArray = Object.values(updatedArray);
  return updatedArray;
}

export function isArrayEqual(x, y) {
  return _(x).differenceWith(y, _.isEqual).isEmpty();
}
