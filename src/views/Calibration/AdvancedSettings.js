import React from 'react';

import { Grid, Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeviceCalibration from './DeviceCalibration';

const AdvancedSettings = ({ displayText, classes, text, allowAuto, props }) => {
  return (
    <Grid container className={classes.row}>
      <Grid container item sm={12} justifyContent="center">
        {props.deviceList.length === 0 &&
        props.device &&
        (props.device.fixAsset || props.device.protocol === 'WIFI' || props.device.isAnchor) ? (
          <Accordion style={{ width: '100%' }} onMouseOver={displayText}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography className={classes.heading}>Advanced Settings {text}</Typography>
            </AccordionSummary>
            <AccordionDetails style={{ padding: 0 }}>
              <DeviceCalibration allowAuto={allowAuto} />
            </AccordionDetails>
          </Accordion>
        ) : (
          <DeviceCalibration />
        )}
      </Grid>
    </Grid>
  );
};

export default AdvancedSettings;
