import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import { Box, List, ListItem, ListItemText, Grid, Divider } from '@mui/material';
import { connect } from 'react-redux';
import AccountForm from './AccountForm';
import SyncEntitiesForm from './SyncEntitiesForm';
import OrganizationForm from './OrganizationForm';

import { hasAccess } from '../../util/hasAccess';
import variables from '../../variables.json';

const PREFIX = 'TenantSettings';

const classes = {
  container: `${PREFIX}-container`,
  paper: `${PREFIX}-paper`,
  header: `${PREFIX}-header`,
  body: `${PREFIX}-body`,
  list: `${PREFIX}-list`,
  listHead: `${PREFIX}-listHead`
};

const StyledBox = styled(Box)(({ theme }) => ({
  [`& .${classes.container}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },

  [`&.${classes.paper}`]: {
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
    borderRadius: '5px',
    boxShadow: '0 4px 8px 0 rgba(0,0,0,0.15)'
  },

  [`& .${classes.header}`]: {
    display: 'flex'
  },

  [`& .${classes.body}`]: {},

  [`& .${classes.list}`]: {
    height: '100%',
    width: '100%',
    borderRight: '1px solid #E4E5E6',
    overflowX: 'scroll'
  },

  [`& .${classes.listHead}`]: {
    fontSize: '1.09375rem',
    fontWeight: '600',
    color: 'rgb(87, 101, 116)',
    marginLeft: '5px'
  }
}));

const ServicaAccountModal = (props) => {
  const { SERVICE_ACCOUNT } = variables;
  const [type, setType] = useState('');

  useEffect(() => {
    if (props.provisionType) {
      props.provisionType === 'Organization' ? setType('organization') : setType('account');
    }
  }, [props.provisionType]);

  const handleSwitchType = (type) => {
    setType(type);
  };

  return (
    <StyledBox
      className={classes.paper}
      style={{
        width: props.provisionType === 'Tenant' ? '100%' : '70%',
        height: props.provisionType === 'Tenant' ? '55%' : '480px'
      }}
    >
      <Grid container style={{ height: '100%' }}>
        <Grid container item md={3} xs={3} justifyContent="center">
          <List component="nav" className={classes.list}>
            <ListItem>
              <div className={classes.listHead}>Settings</div>
            </ListItem>
            <Divider />
            {(props.provisionType === 'Geotab' || props.provisionType === 'Tenant') && (
              <ListItem selected={type === 'account'} onClick={() => handleSwitchType('account')} button>
                <ListItemText
                  primary={
                    <span
                      style={{ color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR }}
                    >
                      Service Account
                    </span>
                  }
                />
              </ListItem>
            )}
            {props.selectedTenant &&
              props.selectedTenant.hasServiceAccount &&
              ((props.provisionType === 'Geotab' && props.selectedTenant.geotabAccount === props.email) ||
                hasAccess(props.userPermissions, SERVICE_ACCOUNT, props.role, props.database, props.group) ||
                props.provisionType === 'Tenant') && (
                <ListItem selected={type === 'syncEntities'} onClick={() => handleSwitchType('syncEntities')} button>
                  <ListItemText
                    primary={
                      <span
                        style={{ color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR }}
                      >
                        Sync Entities
                      </span>
                    }
                  />
                </ListItem>
              )}
            {props.provisionType === 'Organization' && (
              <ListItem selected={type === 'organization'} onClick={() => handleSwitchType('organization')} button>
                <ListItemText
                  primary={
                    <span
                      style={{ color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR }}
                    >
                      Organization
                    </span>
                  }
                />
              </ListItem>
            )}
          </List>
        </Grid>
        <Grid container item md={9} xs={9} justifyContent="center">
          {type === 'account' && <AccountForm wrldMapOnly={props.wrldMapOnly} />}
          {type === 'syncEntities' && <SyncEntitiesForm wrldMapOnly={props.wrldMapOnly} />}
          {type === 'organization' && <OrganizationForm wrldMapOnly={props.wrldMapOnly} />}
        </Grid>
      </Grid>
    </StyledBox>
  );
};

const mapStateToProps = ({ user, provision, map }) => ({
  selectedTenant: provision.selectedTenant,
  provisionType: provision.provisionType,
  email: user.email,
  role: user.role,
  userPermissions: user.userPermissions,
  database: user.database,
  group: user.group,
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount'
});

const mapDispatch = () => ({});

export default connect(mapStateToProps, mapDispatch)(ServicaAccountModal);
