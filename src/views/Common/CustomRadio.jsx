import React from 'react';
import { styled } from '@mui/material/styles';
import { Radio } from '@mui/material';
import variables from '../../variables.json';
import { connect } from 'react-redux';

const PREFIX = 'CustomRadio';
const classes = {};

const StyledRadio = styled(Radio)({});

const CustomRadio = ({ ...props }) => (
  <Radio
    color="default"
    {...props}
    classes={{
      root: {
        '&$checked': {
          color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR
        }
      },
      checked: {}
    }}
  />
);

const mapStateToProps = ({ user, map }) => ({
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount'
});

const mapDispatch = ({}) => ({});

export default connect(mapStateToProps, mapDispatch)(CustomRadio);
