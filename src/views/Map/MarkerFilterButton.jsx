import React from 'react';
import { styled } from '@mui/material/styles';
import { connect } from 'react-redux';
import { IconButton, Menu, MenuItem, Tooltip } from '@mui/material';

import VisibilityIcon from '@mui/icons-material/Visibility';
import variables from '../../variables';

const PREFIX = 'MarkerFilterButton';

const classes = {
  menu: `${PREFIX}-menu`,
  geotabmenu: `${PREFIX}-geotabmenu`
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')(({ theme }) => ({
  [`& .${classes.menu}`]: {
    '&.Mui-selected': {
      backgroundColor: 'rgb(248, 147, 28, 0.5)'
    },
    '&.Mui-selected:hover': {
      backgroundColor: 'rgb(248, 147, 28, 0.25)'
    },
    '&.MuiListItem-root:hover': {
      backgroundColor: 'rgb(248, 147, 28, 0.25)'
    }
  },

  [`& .${classes.geotabmenu}`]: {
    '&.Mui-selected': {
      backgroundColor: 'rgb(0, 120, 211, 0.5)'
    },
    '&.Mui-selected:hover': {
      backgroundColor: 'rgb(0, 120, 211, 0.25)'
    },
    '&.MuiListItem-root:hover': {
      backgroundColor: 'rgb(0, 120, 211, 0.25)'
    }
  }
}));

const MarkerFilterButton = (props) => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleFilterMarker = (filter) => {
    // if (mapType === props.routerLocation) return;
    props.setFilter(filter);
    // setAnchorEl(null);
  };

  return (
    <Root>
      <Tooltip title={`Filter`}>
        <IconButton
          aria-label="filter"
          onClick={(e) => handleClick(e)}
          style={{
            color:
              props.routerLocation === 'wrldAddin' || props.wrldMapOnly
                ? variables.GEOTAB_PRIMARY_COLOR
                : props.filterType !== 'All'
                ? variables.GREEN_COLOR
                : variables.ORANGE_COLOR,
            zIndex: '10'
          }}
          size="small"
        >
          <VisibilityIcon />
        </IconButton>
      </Tooltip>
      <Menu
        id="FilterMarker"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        getcontentanchorel={null}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MenuItem
          className={props.routerLocation !== 'wrldAddin' && !props.wrldMapOnly ? classes.menu : classes.geotabmenu}
          selected={props.filter.indexOf('Tag') > -1}
          onClick={() => handleFilterMarker('Tag')}
        >
          Tags
        </MenuItem>
        <MenuItem
          className={props.routerLocation !== 'wrldAddin' && !props.wrldMapOnly ? classes.menu : classes.geotabmenu}
          selected={props.filter.indexOf('IOX') > -1}
          onClick={() => handleFilterMarker('IOX')}
        >
          IOX
        </MenuItem>
        {props.routerLocation !== 'simulation' && (
          <div>
            <MenuItem
              className={props.routerLocation !== 'wrldAddin' && !props.wrldMapOnly ? classes.menu : classes.geotabmenu}
              selected={props.filter.indexOf('Fixed') > -1}
              onClick={() => handleFilterMarker('Fixed')}
            >
              Fixed Assets
            </MenuItem>
            <MenuItem
              className={props.routerLocation !== 'wrldAddin' && !props.wrldMapOnly ? classes.menu : classes.geotabmenu}
              selected={props.filter.indexOf('Locator') > -1}
              onClick={() => handleFilterMarker('Locator')}
            >
              Locators
            </MenuItem>
            <MenuItem
              className={props.routerLocation !== 'wrldAddin' && !props.wrldMapOnly ? classes.menu : classes.geotabmenu}
              selected={props.filter.indexOf('Anchor') > -1}
              onClick={() => handleFilterMarker('Anchor')}
            >
              Anchors
            </MenuItem>
            {props.routerLocation !== 'wrldAddin' && (
              <MenuItem
                className={
                  props.routerLocation !== 'wrldAddin' && !props.wrldMapOnly ? classes.menu : classes.geotabmenu
                }
                selected={props.filter.indexOf('Zones') > -1}
                onClick={() => handleFilterMarker('Zones')}
              >
                Zones
              </MenuItem>
            )}
          </div>
        )}
        {/* <MenuItem selected={props.filterType === 'All'} onClick={() => handleFilterMarker('All')}>
          All
        </MenuItem> */}
      </Menu>
    </Root>
  );
};
const mapStateToProps = ({ location, user, map }) => ({
  routerLocation: location.routerLocation,
  isSplitScreen: location.isSplitScreen,
  loginType: user.loginType,
  screenWidth: location.screenWidth,
  filter: location.filter,
  deviceSelected: map.deviceSelected,
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount'
});

const mapDispatch = ({
  location: { renderComponentAction, setFilterAction },
  map: { setMapboxStyleAction, setDeviceSelectedAction }
}) => ({
  renderComponent: renderComponentAction,
  setMapboxStyle: setMapboxStyleAction,
  setDeviceSelected: setDeviceSelectedAction,
  setFilter: setFilterAction
});

export default connect(mapStateToProps, mapDispatch)(MarkerFilterButton);
