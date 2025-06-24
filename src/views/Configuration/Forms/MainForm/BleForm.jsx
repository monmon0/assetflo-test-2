import React from 'react';
import { styled } from '@mui/material/styles';
import { Grid, MenuItem, Slider, TextField, Switch } from '@mui/material';
import { connect } from 'react-redux';
import variables from '../../../../variables.json';

const PREFIX = 'BleForm';

const classes = {
  switchBase: `${PREFIX}-switchBase`,
  checked: `${PREFIX}-checked`,
  track: `${PREFIX}-track`,
  row: `${PREFIX}-row`,
  cell: `${PREFIX}-cell`,
  textField: `${PREFIX}-textField`,
  label: `${PREFIX}-label`,
  slider: `${PREFIX}-slider`
};

// TODO jss-to-styled: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')(({ theme }) => ({
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
    }
  },

  [`& .${classes.textField}`]: {
    width: '100%',
    '& label.Mui-focused': {
      color: variables.ORANGE_COLOR
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
    color: variables.ORANGE_COLOR
  }
}));

const marks = (isForScanInterval) => {
  let marksArray = [];
  let to = isForScanInterval ? 16 : 10;
  for (let i = 2; i <= to; i += 2) {
    marksArray.push({ value: i, label: `${i}s` });
  }
  return marksArray;
};

const txPwrMarks = () => {
  let marksArray = [];
  for (let i = -50; i <= -20; i += 10) {
    marksArray.push({ value: i, label: `${i}` });
  }
  return marksArray;
};

// const OrangeSwitch = Switch;

const BleForm = (props) => {
  const displayFreqMsg = () => {
    let freq =
      (props.editedConfig && props.editedConfig.bleAdvFreq / 1000) || props.bleConfig.profile.bleAdvFreq / 1000;
    if (freq === 1) {
      return 'every second';
    }
    return `every ${freq} seconds`;
  };

  return (
    <Root>
      <Grid container className={classes.row} style={{ alignItems: 'flex-start' }} spacing={5}>
        <Grid container item sm={6} xs={12} justifyContent="center" className={classes.cell}>
          <Grid container item sm={12} xs={12}>
            <label className={classes.label}>
              Advertisement Frequency <strong>({displayFreqMsg()})</strong>
            </label>
            <Slider
              value={
                (props.editedConfig && props.editedConfig.bleAdvFreq / 1000) ||
                props.bleConfig.profile.bleAdvFreq / 1000
              }
              step={0.5}
              valueLabelDisplay="auto"
              min={1}
              max={10}
              marks={marks(false)}
              className={classes.slider}
              onChange={(e, value) => props.handleSliderChange(value, 'bleAdvFreq')}
            />
          </Grid>
        </Grid>
        <Grid container item sm={6} xs={12} justifyContent="center" className={classes.cell}>
          <Grid container item sm={12} xs={12}>
            <label className={classes.label}>
              TX Power{' '}
              <strong>
                ({(props.editedConfig && props.editedConfig.txPower) || props.bleConfig.profile.txPower} dbm)
              </strong>
            </label>
            <Slider
              value={(props.editedConfig && props.editedConfig.txPower) || props.bleConfig.profile.txPower}
              step={1}
              valueLabelDisplay="auto"
              min={-55}
              max={-20}
              marks={txPwrMarks()}
              className={classes.slider}
              onChange={(e, value) => props.handleSliderChange(value, 'txPower')}
            />
          </Grid>
        </Grid>
      </Grid>
      <Grid container className={classes.row} style={{ alignItems: 'flex-start' }} spacing={5}>
        <Grid container item sm={6} xs={12} justifyContent="center" className={classes.cell}>
          <Grid container item sm={12} xs={12}>
            <TextField
              className={classes.textField}
              onChange={props.handleInputChange}
              name="advertisingName"
              label="Advertising Name"
              value={(props.editedConfig && props.editedConfig.advertisingName) || ''}
            />
          </Grid>
        </Grid>
        <Grid container item sm={6} xs={12} justifyContent="center" className={classes.cell}>
          <Grid container item sm={12} xs={12}>
            <TextField
              className={classes.textField}
              label={'Advertisement Packet Version'}
              select
              name="advPacketVer"
              onChange={props.handleInputChange}
              value={
                props.editedConfig && props.editedConfig.advPacketVer !== undefined && props.editedConfig.advPacketVer
              }
            >
              <MenuItem key={0} value={0}>
                Geotab
              </MenuItem>
              <MenuItem key={1} value={1}>
                Assetflo
              </MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Grid>
    </Root>
  );
};

const mapStateToProps = ({ user, provision }) => ({
  provisionType: provision.provisionType,
  bleLocatorConfig: provision.bleLocatorConfig
});

const mapDispatch = () => ({});

export default connect(mapStateToProps, mapDispatch)(BleForm);
