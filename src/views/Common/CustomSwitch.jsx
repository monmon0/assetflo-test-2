import Switch from '@mui/material/Switch';
import { styled } from '@mui/system';
import variables from '../../variables.json';

const CustomSwitch = styled(Switch)(({ theme, wrldMapOnly }) => ({
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    // backgroundColor: wrldMapOnly ? theme.palette.primary.main : theme.palette.secondary.main,
    backgroundColor: wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR
  },
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR
  }
}));

export default CustomSwitch;
