export function lineChartColor(device, selectedCard) {
  if (selectedCard === 'utilization') {
    if (device && device.utilization * 100 > 70) {
      return '#2ecc71';
    } else if (device.utilization * 100 >= 50 && device.utilization * 100 <= 70) {
      return '#FFC104';
    } else {
      return '#F86C6B';
    }
  } else if (selectedCard === 'workHours') {
    return '#3498db';
  } else {
    return '#3498db';
  }
}
