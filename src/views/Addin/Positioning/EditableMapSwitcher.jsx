import React from 'react';
import { connect } from 'react-redux';
import { Button, Menu, MenuItem, IconButton } from '@mui/material';

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
          onClick={(e) => handleClick(e)}
          style={{ height: 32 }}
          className="geo-button geo-button--action fullWidth"
        >
          {props.editableMap === 'editableMapbox' ? 'Outdoor' : 'Indoor'}
        </Button>
      )}
      <Menu id="EditableMApSwitchMenu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
        {/* mapbox-satellite mapbox-streets */}
        <MenuItem
          style={{ backgroundColor: props.editableMap === 'editableMapbox' ? 'rgba(0, 120, 211, 0.5)' : '#fff' }}
          onClick={() => {
            props.setEditableMap('editableMapbox');
            // props.setMapboxStyle("streets");
            setAnchorEl(null);
          }}
        >
          OUTDOOR
        </MenuItem>
        {/* <MenuItem
          onClick={() => {
            // props.setEditableMap("editableMapbox");
            // props.setMapboxStyle("streets");
            setAnchorEl(null);
          }}
        >
          MAPBOX classic
        </MenuItem> */}
        <MenuItem
          style={{ backgroundColor: props.editableMap === 'editableWrld' ? 'rgba(0, 120, 211, 0.5)' : '#fff' }}
          onClick={() => {
            props.setEditableMap('editableWrld');
            setAnchorEl(null);
          }}
        >
          INDOOR
        </MenuItem>
      </Menu>
    </>
  );
};
const mapStateToProps = ({ map, user }) => ({
  editableMap: map.editableMap
});

const mapDispatch = ({ map: { setEditableMapAction, setMapboxStyleAction } }) => ({
  setMapboxStyle: setMapboxStyleAction,
  setEditableMap: setEditableMapAction
});

export default connect(mapStateToProps, mapDispatch)(EditableMapSwitcher);
