import React from 'react';
import { Box, Switch, FormControlLabel } from '@mui/material';
import withStyles from '@mui/styles/withStyles';
import { styled } from '@mui/material/styles';
import { connect } from 'react-redux';
import CustomSwitch from '../Common/CustomSwitch';

import variables from '../../variables.json';
import { hasAccess } from '../../util/hasAccess';

function AdvanceToolSwitcher({
  setShowAdvanceTool,
  showAdvanceTool,
  userPermissions,
  role,
  database,
  screenWidth,
  group,
  adminDatabase
}) {
  const { ADVANCETOOL } = variables;

  const GreySwitch = styled(Switch)(({ theme }) => ({
    '& .MuiSwitch-switchBase': {
      color: variables.LIGHT_GRAY_COLOR
    },
    '& .MuiSwitch-switchBase.Mui-checked': {
      color: variables.ORANGE_COLOR
    },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
      backgroundColor: variables.ORANGE_COLOR
    }
  }));

  const handleChangeSwitchState = (event) => {
    setShowAdvanceTool(!showAdvanceTool);
  };

  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
      {hasAccess(userPermissions, ADVANCETOOL, role, adminDatabase || database, group) && (
        <div style={{ display: 'flex', marginTop: screenWidth > 750 ? 10 : 0 }}>
          <FormControlLabel
            style={{ marginBottom: 0 }}
            control={
              <GreySwitch size="small" checked={showAdvanceTool} onChange={handleChangeSwitchState} name="checkedA" />
            }
            label="Advance Tools"
          />
        </div>
      )}
    </div>
  );
}

const mapStateToProps = ({ location, user }) => ({
  screenWidth: location.screenWidth,
  showAdvanceTool: location.showAdvanceTool,
  role: user.role,
  userPermissions: user.userPermissions,
  database: user.database,
  adminDatabase: user.adminDatabase,
  group: user.group
});

const mapDispatch = ({ location: { setShowAdvanceToolAction }, user: { logoutAction } }) => ({
  logout: logoutAction,
  setShowAdvanceTool: setShowAdvanceToolAction
});

export default connect(mapStateToProps, mapDispatch)(AdvanceToolSwitcher);
