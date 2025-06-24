import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import {
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  Box,
  Popper,
  Paper,
  MenuList,
  Typography,
  ClickAwayListener
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { connect } from 'react-redux';
import { hasAccess } from '../../util/hasAccess';
import variables from '../../variables.json';
import AdvanceToolSwitcher from './AdvanceToolSwitcher';
import GroupSelector from './GroupSelector';

const PREFIX = 'Navbar';

const classes = {
  indicator: `${PREFIX}-indicator`,
  geoIndicator: `${PREFIX}-geoIndicator`,
  block: `${PREFIX}-block`,
  logoDiv: `${PREFIX}-logoDiv`,
  org: `${PREFIX}-org`
};

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  [`& .${classes.indicator}`]: {
    background: variables.ORANGE_COLOR
  },

  [`& .${classes.logoDiv}`]: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },

  [`& .${classes.org}`]: {
    textTransform: 'none',
    color: variables.ORANGE_COLOR,
    fontSize: 12,
    height: 12
  },

  [`& .${classes.geoIndicator}`]: {
    background: variables.GEOTAB_PRIMARY_COLOR
  },

  [`& .${classes.block}`]: {
    display: 'flex',
    alignItems: 'center',
    height: '100%'
  }
}));

function Navbar(props) {
  const [isMenuOpen, setIsMenuOpen] = useState(null);
  const [value, setValue] = useState('logout');
  const [anchorEl, setAnchorEl] = useState(null);
  const navTabs = ['mapbox', 'dashboard', 'provision'];
  const adminAccess = hasAccess(
    props.userPermissions,
    variables.ADVANCETOOL,
    props.role,
    props.adminDatabase || props.database,
    props.group
  );

  const handleClick = (event) => {
    setIsMenuOpen(event.currentTarget);
  };

  const handleClose = () => {
    setIsMenuOpen(null);
  };

  const handleChange = (event, newValue) => {
    // console.log(newValue);
    setValue(newValue);
  };

  const { eula } = props;

  const renderTab = () => {
    // if (props.email && userTenant && userTenant.activation && userTenant.activation.isAccepted && eula) {
    if (props.email && eula) {
      if (value !== 'map' && value === 'logout') setValue('map');
      return true;
    } else {
      return false;
    }
  };

  const resetSelectedData = () => {
    props.resetConfiguration();
    props.clearDeviceMetrics();
    props.resetFirmwareAndStatus();
    props.resetDeviceState();
  };

  const renderEmailTab = () => {
    return props.screenWidth > 1100 ? (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div>{props.email}</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ArrowDropDownIcon />
        </div>
      </div>
    ) : (
      ''
    );
  };

  return (
    <StyledAppBar
      // position="static"
      style={{
        // position="fixed",
        background: 'white',
        height: '50px',
        display: props.routerLocation?.includes('Addin') ? 'none' : 'flex',
        justifyContent: 'flex-end',
        zIndex: 110,
        width: '100%',
        position: 'absolute'
        // marginBottom: "35px",
      }}
      // expand="md"
    >
      <Toolbar style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className={classes.block}>
          <div className={classes.logoDiv}>
            <img
              alt="LOGO"
              style={{
                width: window.innerWidth > 750 ? '100px' : '60px',
                marginRight: '20px',
                marginTop: props.screenWidth > 750 ? 10 : 0,
                marginLeft: '0'
              }}
              src={
                process.env.NODE_ENV === 'production'
                  ? variables.PRODUCTION_URL_IMAGE + variables.LOGO
                  : variables.STAGING_URL_IMAGE + variables.LOGO
              }
            />
            {adminAccess &&
              props.loginType !== 'verifyGeotabAddinAccount' &&
              props.adminDatabase !== props.database && <div className={classes.org}>{props.database}</div>}
          </div>

          {renderTab() && props.loginType !== 'verifyGeotabAddinAccount' && <GroupSelector />}
        </div>
        <div className={classes.block}>
          {renderTab() && <AdvanceToolSwitcher />}
          {/* </Paper> */}
          {props.screenWidth > 1000 ? (
            // menu on browser
            <div
              style={{
                marginTop: '10px',
                display: 'flex',
                justifyContent: 'flex-end'
              }}
            >
              <Box>
                <Tabs
                  value={renderTab() && navTabs.includes(props.routerLocation) ? props.routerLocation : false}
                  classes={{
                    indicator: props.wrldMapOnly ? classes.geoIndicator : classes.indicator
                  }}
                  onChange={handleChange}
                  aria-label="nav-list-item"
                >
                  {renderTab() && (
                    <Tab
                      value="mapbox"
                      style={{
                        color: ['mapbox', 'indoors'].includes(props.routerLocation)
                          ? props.wrldMapOnly
                            ? variables.GEOTAB_PRIMARY_COLOR
                            : variables.ORANGE_COLOR
                          : variables.DARK_GRAY_COLOR
                      }}
                      label="Map"
                      onClick={() => {
                        resetSelectedData();
                        props.renderComponent(props.wrldMapOnly ? 'indoors' : 'mapbox');
                      }}
                    />
                  )}
                  {renderTab() && props.loginType !== 'verifyGeotabAddinAccount' && (
                    <Tab
                      value="dashboard"
                      style={{
                        color:
                          props.routerLocation === 'dashboard'
                            ? props.wrldMapOnly
                              ? variables.GEOTAB_PRIMARY_COLOR
                              : variables.ORANGE_COLOR
                            : variables.DARK_GRAY_COLOR
                      }}
                      label="Dashboard"
                      onClick={() => {
                        resetSelectedData();
                        props.renderComponent('dashboard');
                      }}
                    />
                  )}
                  {renderTab() && (
                    <Tab
                      value="provision"
                      style={{
                        color:
                          props.routerLocation === 'provision'
                            ? props.wrldMapOnly
                              ? variables.GEOTAB_PRIMARY_COLOR
                              : variables.ORANGE_COLOR
                            : variables.DARK_GRAY_COLOR
                      }}
                      //only the lable change to Admin
                      label="Admin"
                      onClick={() => {
                        {
                          resetSelectedData();
                          props.renderComponent('provision');
                        }
                      }}
                    />
                  )}
                  {props.email && props.loginType !== 'verifyGeotabAddinAccount' && (
                    <Tab
                      value="instructions"
                      style={{
                        color:
                          props.routerLocation === 'instructions'
                            ? props.wrldMapOnly
                              ? variables.GEOTAB_PRIMARY_COLOR
                              : variables.ORANGE_COLOR
                            : variables.DARK_GRAY_COLOR,
                        overflow: 'hidden'
                      }}
                      label={renderEmailTab()}
                      icon={props.screenWidth > 1100 ? null : <AccountCircleIcon />}
                      onClick={(event) => {
                        setAnchorEl(anchorEl ? null : event.currentTarget);
                        // props.renderComponent('instructions');
                      }}
                    />
                  )}

                  {props.email && props.loginType === 'verifyGeotabAddinAccount' && (
                    <Tab
                      value="instructions"
                      style={{
                        color:
                          props.routerLocation === 'instructions'
                            ? props.wrldMapOnly
                              ? variables.GEOTAB_PRIMARY_COLOR
                              : variables.ORANGE_COLOR
                            : variables.DARK_GRAY_COLOR
                      }}
                      label={'User Guide'}
                      onClick={(event) => {
                        resetSelectedData();
                        props.renderComponent('instructions');
                      }}
                    />
                  )}
                </Tabs>
                <Popper
                  id={Boolean(anchorEl) ? 'simple-popper' : undefined}
                  open={Boolean(anchorEl)}
                  anchorEl={anchorEl}
                  style={{ zIndex: 1300, marginTop: 6, width: 200 }}
                >
                  <ClickAwayListener onClickAway={() => anchorEl && setAnchorEl(null)}>
                    <Paper>
                      <MenuList>
                        <MenuItem
                          onClick={(event) => {
                            resetSelectedData();
                            props.renderComponent('instructions');
                            setAnchorEl(null);
                          }}
                        >
                          <Typography variant="inherit">User Guide</Typography>
                        </MenuItem>
                        {adminAccess && props.loginType !== 'verifyGeotabAddinAccount' && (
                          <MenuItem
                            onClick={(event) => {
                              resetSelectedData();
                              props.renderComponent('companyselect');
                              setAnchorEl(null);
                            }}
                          >
                            <Typography variant="inherit">Company select</Typography>
                          </MenuItem>
                        )}
                        {adminAccess && props.loginType !== 'verifyGeotabAddinAccount' && (
                          <MenuItem
                            onClick={(event) => {
                              resetSelectedData();
                              props.renderComponent('simulation');
                              setAnchorEl(null);
                            }}
                          >
                            <Typography variant="inherit">Simulation</Typography>
                          </MenuItem>
                        )}

                        <MenuItem
                          onClick={() => {
                            props.logout();
                            resetSelectedData();
                            props.renderComponent('geotablogin');
                            setValue('map'); // put the nav indicator to map
                            setAnchorEl(null);
                          }}
                        >
                          <Typography variant="inherit">Logout</Typography>
                        </MenuItem>
                      </MenuList>
                    </Paper>
                  </ClickAwayListener>
                </Popper>
              </Box>
            </div>
          ) : (
            // menu on mobile
            props.email && (
              <div>
                <IconButton
                  aria-label="more"
                  aria-controls="long-menu"
                  aria-haspopup="true"
                  style={{ marginTop: props.screenWidth > 750 ? 10 : 0 }}
                  onClick={handleClick}
                  size="large"
                >
                  <MenuIcon />
                </IconButton>

                <Menu
                  id="long-menu"
                  anchorEl={isMenuOpen}
                  keepMounted
                  open={Boolean(isMenuOpen)} // this because open should not be null it is boolean
                  onClose={handleClose}
                  getContentAnchorEl={null}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                  {renderTab() && (
                    <div>
                      <MenuItem
                        key={'map'}
                        onClick={() => {
                          resetSelectedData();
                          props.renderComponent('mapbox');
                          handleClose();
                        }}
                      >
                        Map
                      </MenuItem>
                      {props.loginType !== 'verifyGeotabAddinAccount' && (
                        <MenuItem
                          key={'dashboard'}
                          onClick={() => {
                            resetSelectedData();
                            props.renderComponent('dashboard');
                            handleClose();
                          }}
                        >
                          Dashboard
                        </MenuItem>
                      )}
                      <MenuItem
                        key={'provision'}
                        onClick={() => {
                          resetSelectedData();
                          props.renderComponent('provision');
                          handleClose();
                        }}
                      >
                        Admin
                      </MenuItem>
                    </div>
                  )}
                  <MenuItem
                    key={'instructions'}
                    onClick={() => {
                      resetSelectedData();
                      props.renderComponent('instructions');
                      handleClose();
                    }}
                  >
                    User Guide
                  </MenuItem>
                  {adminAccess && props.loginType !== 'verifyGeotabAddinAccount' && (
                    <MenuItem
                      onClick={() => {
                        resetSelectedData();
                        props.renderComponent('companyselect');
                        setAnchorEl(null);
                      }}
                    >
                      <Typography variant="inherit">Company select</Typography>
                    </MenuItem>
                  )}
                  {props.email && props.loginType !== 'verifyGeotabAddinAccount' && (
                    <MenuItem
                      key={'Logout'}
                      onClick={() => {
                        props.logout();
                        resetSelectedData();
                        props.renderComponent('geotablogin');
                        handleClose();
                      }}
                    >
                      Logout
                    </MenuItem>
                  )}
                </Menu>
              </div>
            )
          )}
        </div>
      </Toolbar>
    </StyledAppBar>
  );
}

const mapStateToProps = ({ location, user, map }) => ({
  routerLocation: location.routerLocation,
  email: user.email,
  loginType: user.loginType,
  screenWidth: location.screenWidth,
  role: user.role,
  eula: user.eula,
  database: user.database,
  group: user.group,
  adminDatabase: user.adminDatabase,
  userPermissions: user.userPermissions,
  geotabFeaturePreviewUI: user.geotabFeaturePreviewUI,
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount'
});

const mapDispatch = ({
  location: { renderComponentAction },
  user: { logoutAction },
  provision: { resetConfigurationAction, resetFirmwareAndStatusAction },
  dashboard: { clearDeviceMetricsAction },
  configuration: { resetDeviceStateAction }
}) => ({
  renderComponent: renderComponentAction,
  logout: logoutAction,
  resetConfiguration: resetConfigurationAction,
  clearDeviceMetrics: clearDeviceMetricsAction,
  resetFirmwareAndStatus: resetFirmwareAndStatusAction,
  resetDeviceState: resetDeviceStateAction
});

export default connect(mapStateToProps, mapDispatch)(Navbar);
