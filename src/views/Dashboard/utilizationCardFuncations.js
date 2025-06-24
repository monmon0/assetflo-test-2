let totalUtilizationDataForCard = (devices) => {
  let reduceTotalUtilization =
    devices &&
    devices.reduce((acc, cur) => {
      if (cur && cur.totalUtilization) {
        acc += cur.totalUtilization;
      }
      return acc;
    }, 0);
  // console.log("reduceTotalUtilization", ((reduceTotalUtilization / metricsDevicesArray.length) * 100).toFixed(2))
  let totalUtiltization =
    devices && devices.length > 0
      ? ((reduceTotalUtilization && reduceTotalUtilization / devices.length) * 100).toFixed(2)
      : 0;
  return totalUtiltization;
};

let utilizationDataForPie = (devices) => {
  let reduceUtilization =
    devices &&
    devices.reduce((acc, cur) => {
      if (cur && cur.utilization) {
        acc += cur.utilization;
      }
      return acc;
    }, 0);
  let utilization =
    devices && devices.length > 0 ? ((reduceUtilization && reduceUtilization / devices.length) * 100).toFixed(2) : 0;
  return utilization;
};

module.exports.totalUtilizationDataForCard = totalUtilizationDataForCard;
module.exports.utilizationDataForPie = utilizationDataForPie;
