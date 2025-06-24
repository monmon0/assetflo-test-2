let totalLiftDataForCard = (devices) => {
  let reduceTotalLifts =
    devices &&
    devices.reduce((acc, cur) => {
      if (cur && cur.totalLifts) {
        acc += cur.totalLifts;
      }
      return acc;
    }, 0);
  return reduceTotalLifts;
};

let averageLiftDataForCard = (devices) => {
  let reduceAverageLifts =
    devices &&
    devices.reduce((acc, cur) => {
      if (cur && cur.totalLifts) {
        acc += cur.totalLifts;
      }
      return acc;
    }, 0);
  return devices && devices.length > 0 ? (reduceAverageLifts / devices.length).toFixed(1) : 0;
};

module.exports.totalLiftDataForCard = totalLiftDataForCard;
module.exports.averageLiftDataForCard = averageLiftDataForCard;
