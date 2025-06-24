import React from 'react';
import { styled } from '@mui/material/styles';
import { Grid, MenuItem, Slider, TextField, Switch } from '@mui/material';
import { connect } from 'react-redux';
import variables from '../../../../variables.json';

const PREFIX = 'TemperatureForm';

const classes = {
  row: `${PREFIX}-row`,
  cell: `${PREFIX}-cell`,
  textField: `${PREFIX}-textField`,
  label: `${PREFIX}-label`,
  slider: `${PREFIX}-slider`
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')(({ theme, ...props }) => ({
  [`& .${classes.row}`]: {
    // borderColor: variables.LIGHT_GRAY_COLOR,
    fontSize: '1rem',
    alignItems: 'baseline',
    padding: '8px 30px 8px 30px',
    margin: 0,
    overflow: 'hidden',
    [theme.breakpoints.down('md')]: {
      padding: '5px 20px'
    }
  },

  [`& .${classes.cell}`]: {
    alignItems: 'baseline',
    [theme.breakpoints.down('md')]: {
      paddingRight: '15px'
    },
    padding: 15
  },

  [`& .${classes.textField}`]: {
    width: '100%',
    '& label.Mui-focused': {
      color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR
    },
    '& .MuiInput-underline:after': {
      borderBottomColor: variables.DARK_GRAY_COLOR
    },
    '& .MuiInput-underline.Mui-error:after': {
      borderBottomColor: 'red'
    },
    '& .MuiFormLabel-root.Mui-error': {
      color: 'red'
    },
    '& .MuiInputBase-root.Mui-disabled': {
      color: 'black'
    }
  },

  [`& .${classes.label}`]: {
    color: 'rgba(0, 0, 0, 0.54)',
    fontSize: '12px'
  },

  [`& .${classes.slider}`]: {
    color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR
  }
}));

const TemperatureForm = (props) => {
  return (
    <Root>
      <Grid container className={classes.row} style={{ alignItems: 'flex-start' }}>
        <Grid container item sm={8} xs={12} justifyContent="center" className={classes.cell}>
          <Grid container item sm={12} xs={12}>
            <TextField
              className={classes.textField}
              label={'Storage Condition'}
              select
              name="range"
              onChange={props.handleCalibrationChange}
              value={props.editedCalibration ? props.editedCalibration.range : ''}
              disabled={!props.adminAccess}
              SelectProps={{
                MenuProps: {
                  disableScrollLock: true
                }
              }}
            >
              <MenuItem key={1} value={1}>
                Room Temperature Storage (20°C to 25°C)
              </MenuItem>
              <MenuItem key={2} value={2}>
                Refrigirator Storage (2°C to 8°C)
              </MenuItem>
              <MenuItem key={3} value={3}>
                Freezer Storage (-25°C to -10°C)
              </MenuItem>
            </TextField>
          </Grid>
        </Grid>
        <Grid container item sm={2} xs={6} justifyContent="center" className={classes.cell}>
          <Grid container item sm={12} xs={12}>
            <TextField
              className={classes.textField}
              label="Low"
              type="number"
              name="caliLow"
              value={
                props.editedCalibration && props.editedCalibration.caliLow !== undefined
                  ? props.editedCalibration.caliLow
                  : 0
              }
              onChange={props.handleCalibrationChange}
              // error={
              //   editedConfig.wifiSSID1 !== undefined &&
              //   (editedConfig.wifiSSID1.trim() === '' || editedConfig.wifiSSID1.length > 19)
              // }
              // helperText={
              //   editedConfig.wifiSSID1 !== undefined && editedConfig.wifiSSID1.trim() === ''
              //     ? 'field required'
              //     : editedConfig.wifiSSID1 !== undefined && editedConfig.wifiSSID1.length > 19
              //     ? "SSID length can't be greater than 19"
              //     : ''
              // }
              disabled={!props.adminAccess}
              InputLabelProps={{
                formlabelclasses: {
                  root: `
                              &.focused {
                                color: red;
                              }
                            `,
                  focused: 'focused',
                  shrink: true
                }
              }}
            />
          </Grid>
        </Grid>
        <Grid container item sm={2} xs={6} justifyContent="center" className={classes.cell}>
          <Grid container item sm={12} xs={12}>
            <TextField
              className={classes.textField}
              label="High"
              type="number"
              name="caliHigh"
              value={
                props.editedCalibration && props.editedCalibration.caliHigh !== undefined
                  ? props.editedCalibration.caliHigh
                  : 0
              }
              onChange={props.handleCalibrationChange}
              // error={
              //   editedConfig.wifiSSID1 !== undefined &&
              //   (editedConfig.wifiSSID1.trim() === '' || editedConfig.wifiSSID1.length > 19)
              // }
              // helperText={
              //   editedConfig.wifiSSID1 !== undefined && editedConfig.wifiSSID1.trim() === ''
              //     ? 'field required'
              //     : editedConfig.wifiSSID1 !== undefined && editedConfig.wifiSSID1.length > 19
              //     ? "SSID length can't be greater than 19"
              //     : ''
              // }
              disabled={!props.adminAccess}
              InputLabelProps={{
                formlabelclasses: {
                  root: `
                              &.focused {
                                color: red;
                              }
                            `,
                  focused: 'focused',
                  shrink: true
                }
              }}
            />
          </Grid>
        </Grid>
      </Grid>
    </Root>
  );
};

const mapStateToProps = ({ user, provision, map }) => ({
  provisionType: provision.provisionType,
  bleLocatorConfig: provision.bleLocatorConfig,
  deviceCalibration: provision.deviceCalibration,
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount'
});

const mapDispatch = () => ({});

export default connect(mapStateToProps, mapDispatch)(TemperatureForm);
