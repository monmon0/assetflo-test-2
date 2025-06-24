import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import { connect } from 'react-redux';
import { RadioGroup, Box, Radio } from '@mui/material';
const PREFIX = 'RadioButtonsGroup';

const classes = {
  radioGroup: `${PREFIX}-radioGroup`,
  radioLable: `${PREFIX}-radioLable`
};

const Root = styled('div')(({ theme }) => ({
  [`& .${classes.radioGroup}`]: {
    color: '#F8931C',
    '&$checked': {
      color: '#F8931C'
    },
    display: 'flex',
    flexDirection: 'row'
  },

  [`& .${classes.radioLable}`]: {
    color: '#F8931C'
  }
}));

function RadioButtonsGroup(props) {
  const [radioValue, setRadioValue] = React.useState('today');

  const handleChange = (event) => {
    setRadioValue(event.target.value);
    props.setDevicesGridList(event.target.value);
  };
  return (
    <Root>
      <RadioGroup
        aria-label="devices"
        name="devices"
        value={props.devicesGridList}
        onChange={handleChange}
        className={classes.radioGroup}
      >
        <Box>
          <span className={classes.radioLable}>Today</span>
          <Radio
            size="small"
            color="default"
            checked={radioValue === 'today'}
            value="today"
            name="radio-button-demo"
            inputProps={{ 'aria-label': 'C' }}
          />
        </Box>
        <Box>
          <span className={classes.radioLable}>All</span>
          <Radio
            size="small"
            color="default"
            checked={radioValue === 'all'}
            value="all"
            name="radio-button-demo"
            inputProps={{ 'aria-label': 'C' }}
          />
        </Box>
      </RadioGroup>
    </Root>
  );
}

const mapStateToProps = ({ dashboard }) => ({
  metrics: dashboard.metrics,
  devicesGridList: dashboard.devicesGridList
});

const mapDispatch = ({ dashboard: { setDevicesGridListAction } }) => ({
  setDevicesGridList: setDevicesGridListAction
});

export default connect(mapStateToProps, mapDispatch)(RadioButtonsGroup);
