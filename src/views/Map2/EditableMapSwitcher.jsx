import React from 'react';
import { connect } from 'react-redux';
import { Button, Menu, MenuItem } from '@mui/material';

import variables from '../../variables';

const EditableMapSwitcher = (props) => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      {!props.isSplitScreen && (
        <Button
          onClick={(e) =>
            props.setEditableMap(props.editableMap === 'editableMapbox' ? 'editableIndoor' : 'editableMapbox')
          }
          style={{
            color: variables.LIGHT_GRAY_COLOR,
            background: props.wrldMapOnly
              ? variables.GEOTAB_PRIMARY_COLOR
              : props.wrldMapOnly
              ? variables.GEOTAB_PRIMARY_COLOR
              : variables.ORANGE_COLOR,
            zIndex: 100
          }}
          aria-controls="EditableMApSwitchMenu"
        >
          {props.editableMap === 'editableMapbox' ? 'INDOOR' : 'OUTDOOR'}
        </Button>
      )}
    </>
  );
};
const mapStateToProps = ({ map, user }) => ({
  editableMap: map.editableMap,
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount'
});

const mapDispatch = ({ map: { setEditableMapAction, setMapboxStyleAction } }) => ({
  setMapboxStyle: setMapboxStyleAction,
  setEditableMap: setEditableMapAction
});

export default connect(mapStateToProps, mapDispatch)(EditableMapSwitcher);
