import BatteryCharging50Icon from '@mui/icons-material/BatteryCharging50';
import PowerOffIcon from '@mui/icons-material/PowerOff';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import BatteryUnknownIcon from '@mui/icons-material/BatteryUnknown';

export const batteryIcons = {
  charging: <BatteryCharging50Icon fontSize="small" />,
  notCharging: <PowerOffIcon fontSize="small" />,
  notChargingBatteryFull: <BatteryChargingFullIcon fontSize="small" />,
  notChargingTemporaryFault: <BatteryUnknownIcon fontSize="small" />,
  notChargingBatteryFault: <BatteryUnknownIcon fontSize="small" />
};
