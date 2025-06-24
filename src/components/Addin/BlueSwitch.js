import variables from '../../variables.json';
import { Switch } from '@mui/material';
import withStyles from '@mui/styles/withStyles';
const BlueSwitch = withStyles({
  switchBase: {
    color: variables.LIGHT_GRAY_COLOR,
    '&$checked': {
      color: '#0078d3'
    },
    '&$checked + $track': {
      backgroundColor: '#0078d3'
    }
  },
  checked: {},
  track: {}
})(Switch);

export default BlueSwitch;
