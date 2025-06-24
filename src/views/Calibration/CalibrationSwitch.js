import React from 'react';

import { Grid } from '@mui/material';

const CalibrationSwitch = ({ classes, OrangeSwitch, handleSwitchChange, allowAuto }) => {
  return (
    <Grid container className={classes.row}>
      <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
        <>
          <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
            <div style={{ marginRight: '10px' }}>Auto-calibration </div>
            <Grid item>Off</Grid>
            <Grid item>
              <OrangeSwitch checked={Boolean(allowAuto)} onChange={handleSwitchChange} name="allowAuto" />
            </Grid>
            <Grid item>On</Grid>
          </Grid>
        </>
      </Grid>
    </Grid>
  );
};

export default CalibrationSwitch;
