import React from 'react';

import { Grid, IconButton, CircularProgress, Grow } from '@mui/material';
import variables from '../../variables.json';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ErrorIcon from '@mui/icons-material/Error';
import HelpIcon from '@mui/icons-material/Help';
import LoopIcon from '@mui/icons-material/Loop';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import DoneIcon from '@mui/icons-material/Done';
import ClearIcon from '@mui/icons-material/Clear';
import ApplyToManySelect from '../Common/ApplyToManySelect';

const CalibrationStatus = ({
  abcValid,
  classes,
  allowAuto,
  confirmation,
  openConfirmation,
  resetCalibration,
  closeConfirmation,
  applyToMany,
  setApplyToMany,
  selectedGroups,
  setSelectedGroups,
  props
}) => {
  return (
    <Grid container className={classes.row}>
      {allowAuto && props.device.protocol === 'WIFI' ? (
        <>
          <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
            <CircularProgress style={{ margin: 'auto' }} />
          </Grid>
          <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
            Calibrating...
          </Grid>
          <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
            <div>Calibrated by</div>
            <div className={classes.marginSides}>
              {(props.deviceCalibration.calibration.rssi && props.deviceCalibration.calibration.rssi.length) || 0}
            </div>
            <div>
              locator
              {props.deviceCalibration.calibration.rssi && props.deviceCalibration.calibration.rssi.length === 1
                ? ''
                : 's'}
            </div>
          </Grid>
        </>
      ) : props.deviceCalibration.calibration.rssi &&
        props.deviceCalibration.calibration.rssi.length >= 4 &&
        abcValid() &&
        props.device.protocol !== 'WIFI' ? (
        <>
          <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
            <CheckCircleOutlineOutlinedIcon fontSize="large" style={{ margin: 'auto', color: variables.GREEN_COLOR }} />
          </Grid>
          <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
            {`Calibrated with ${props.deviceCalibration.calCounter || 1} measurement${
              props.deviceCalibration.calCounter && props.deviceCalibration.calCounter > 1 ? 's' : ''
            }`}
          </Grid>
        </>
      ) : props.deviceCalibration.calibration.a === undefined &&
        props.deviceCalibration.calibration.b === undefined &&
        props.deviceCalibration.calibration.c === undefined ? (
        <>
          <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
            <HelpIcon fontSize="large" style={{ margin: 'auto', color: 'grey' }} />
          </Grid>
          <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
            Uncalibrated
          </Grid>
          {props.device.protocol !== 'WIFI' ? (
            <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
              Instruction: Place your 5g device in close proximity to an anchor. Move device around and send multiple
              (4+) events.
            </Grid>
          ) : (
            <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
              Instruction: Place a BLE device in close proximity to a Locator(BLE Reader).
            </Grid>
          )}
        </>
      ) : props.deviceCalibration.calibration.rssi &&
        props.deviceCalibration.calibration.rssi.length >= 4 &&
        !abcValid() ? (
        <>
          <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
            <HighlightOffIcon fontSize="large" style={{ margin: 'auto', color: variables.RED_COLOR }} />
          </Grid>
          <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
            Calibration failed
          </Grid>
        </>
      ) : (
        props.deviceCalibration.calibration.rssi &&
        props.deviceCalibration.calibration.rssi.length <= 4 &&
        props.deviceCalibration.calibration.rssi.length > 0 && (
          <>
            <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
              <ErrorIcon fontSize="large" style={{ margin: 'auto', color: 'grey' }} />
            </Grid>
            <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
              <div>Calibrated by</div>
              <div className={classes.marginSides}>{props.deviceCalibration.calibration.rssi.length}</div>
              <div>
                locator
                {props.deviceCalibration.calibration.rssi.length === 1 ? '' : 's'}
              </div>
            </Grid>
          </>
        )
      )}
      {!allowAuto &&
        props.device &&
        (props.device.fixAsset || props.device.protocol === 'WIFI' || props.device.isAnchor) &&
        (props.deviceCalibration.calibration.a ||
          props.deviceCalibration.calibration.b ||
          props.deviceCalibration.calibration.c ||
          (props.deviceCalibration.calibration.rssi && props.deviceCalibration.calibration.rssi.length > 0)) && (
          <>
            <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
              <div>Click</div>
              <div className={classes.marginSides}>
                <IconButton
                  aria-label="reset"
                  color="primary"
                  style={{ margin: 'auto', backgroundColor: '#3f51b5', padding: '3px' }}
                  onClick={openConfirmation}
                  size="large"
                >
                  <LoopIcon style={{ margin: 'auto', color: 'white' }} />
                </IconButton>
              </div>
              <div>to reset calibration</div>
            </Grid>
            <Grow in={confirmation}>
              <Grid container item sm={12} xs={12} justifyContent="center" className={classes.cell}>
                <div>Are you sure?</div>
                <div className={classes.marginSides}>
                  <IconButton
                    aria-label="reset"
                    color="primary"
                    style={{ margin: 'auto', backgroundColor: 'grey', padding: '2px' }}
                    onClick={resetCalibration}
                    size="large"
                  >
                    <DoneIcon style={{ margin: 'auto', color: 'white' }} />
                  </IconButton>
                </div>
                <div>
                  <IconButton
                    aria-label="reset"
                    color="primary"
                    style={{ margin: 'auto', backgroundColor: 'grey', padding: '2px' }}
                    onClick={closeConfirmation}
                    size="large"
                  >
                    <ClearIcon style={{ margin: 'auto', color: 'white' }} />
                  </IconButton>
                </div>
              </Grid>
            </Grow>
          </>
        )}
    </Grid>
  );
};

export default CalibrationStatus;
