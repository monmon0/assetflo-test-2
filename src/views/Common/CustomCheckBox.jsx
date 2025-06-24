import React from 'react';
import { styled } from '@mui/material/styles';
import { Checkbox } from '@mui/material';
import variables from '../../variables.json';
import { connect } from 'react-redux';

const StyledCheckbox = styled(Checkbox)(({ theme, wrldMapOnly }) => ({
  color: wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
  '&.Mui-checked': {
    color: wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR
  }
}));

const CustomCheckBox = ({ checked, onChange, wrldMapOnly }) => {
  return <StyledCheckbox wrldMapOnly={wrldMapOnly} checked={checked} onChange={onChange} />;
};

const mapStateToProps = ({ user, map }) => ({
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount'
});

export default connect(mapStateToProps)(CustomCheckBox);
