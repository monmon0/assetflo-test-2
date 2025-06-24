let msToTime = (duration) => {
  if (duration) {
    let minutes = parseInt((duration / (1000 * 60)) % 60),
      hours = parseInt((duration / (1000 * 60 * 60)) % 24);

    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return hours + ':' + minutes;
  }
  return 0;
};

let msToHours = (duration) => {
  if (duration) {
    // let minutes = parseInt((duration / (1000 * 60)) % 60),
    let hours = parseInt((duration / (1000 * 60 * 60)) % 24);

    hours = hours < 10 ? '0' + hours : hours;

    return hours;
  }
  return 0;
};

let workingHourDataForCard = (pieData, devices) => {
  let reduceWorkingHours =
    devices &&
    devices.reduce((acc, cur) => {
      if (cur && cur.totalWorkHours) {
        acc += cur.totalWorkHours;
      }
      return acc;
    }, 0);
  return pieData ? reduceWorkingHours : msToTime(reduceWorkingHours);
};

let todayTotalWorkingHourDataForCard = (pieData, devices) => {
  let reduceTotalWorkingHours =
    devices &&
    devices.reduce((acc, cur) => {
      if (cur && cur.workHours) {
        acc += cur.workHours;
      }
      return acc;
    }, 0);
  return pieData ? reduceTotalWorkingHours : msToTime(reduceTotalWorkingHours);
};
module.exports.msToTime = msToTime;
module.exports.msToHours = msToHours;
module.exports.workingHourDataForCard = workingHourDataForCard;
module.exports.todayTotalWorkingHourDataForCard = todayTotalWorkingHourDataForCard;
