import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import { Tabs, Tab } from '@mui/material';
import { connect } from 'react-redux';
import AccountForm from './AccountForm';
import SyncEntitiesForm from './SyncEntitiesForm';
import LockIcon from '@mui/icons-material/Lock';

import { hasAccess } from '../../../util/hasAccess';
import variables from '../../../variables.json';

const PREFIX = 'TenantSettings';

const classes = {
  container: `${PREFIX}-container`,
  paper: `${PREFIX}-paper`,
  header: `${PREFIX}-header`,
  body: `${PREFIX}-body`,
  list: `${PREFIX}-list`,
  listHead: `${PREFIX}-listHead`,
  tab: `${PREFIX}-tab`,
  accessErrorContainer: `${PREFIX}-accessErrorContainer`,
  accessErrorImg: `${PREFIX}-accessErrorImg`,
  accessError: `${PREFIX}-accessError`
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')(({ theme }) => ({
  [`& .${classes.container}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },

  [`& .${classes.paper}`]: {
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
  },

  [`& .${classes.tab}`]: {
    fontSize: 12,
    fontWeight: 400,
    letterSpacing: '0.02rem',
    lineHeight: '1rem',
    textTransform: 'capitalize',
    top: 1
  },

  [`& .${classes.accessErrorContainer}`]: {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    alignItems: 'center',
    height: 500
  },

  [`& .${classes.accessErrorImg}`]: {
    width: 150,
    height: 150
  },

  [`& .${classes.accessError}`]: {
    fontWeight: 700,
    fontSize: 26
  }
}));

const ServicaAccountModal = (props) => {
  const { SERVICE_ACCOUNT } = variables;
  const [type, setType] = useState(0);

  const handleSwitchType = (event, newValue) => {
    setType(newValue);
  };

  return (
    <Root>
      <div className="checkmateToolbarContainer ">
        <span className="geo-page-toolbar">
          {/* <button className="geo-button geo-caption geo-page-toolbar__item toolbar-popup__item popupWindowTrigger">
            Save
          </button> */}
        </span>
      </div>
      {hasAccess(props.userPermissions, SERVICE_ACCOUNT, props.role, props.database, props.group) ||
      props.selectedTenant.geotabAccount === props.email ? (
        <>
          <div className="geo-page-header" id="devices_header">
            <h1 className="geo-page-header__page-name" id="devices_headerName">
              Sync Management
            </h1>
          </div>
          <div>
            <Tabs
              value={type}
              onChange={handleSwitchType}
              TabIndicatorProps={{
                style: {
                  backgroundColor: variables.GEOTAB_PRIMARY_COLOR
                }
              }}
              style={{ borderBottom: '1px solid #C7CBD2' }}
            >
              <Tab
                className={classes.tab}
                label={
                  <span style={{ color: type === 0 ? variables.GEOTAB_PRIMARY_COLOR : '#575757' }}>Sync Accounts</span>
                }
              />
              <Tab
                className={classes.tab}
                label={
                  <span style={{ color: type === 1 ? variables.GEOTAB_PRIMARY_COLOR : '#575757' }}>Sync Entities</span>
                }
              />
            </Tabs>
          </div>
          <div className="checkmateFormPage">
            {type === 0 && props.selectedTenant && props.selectedTenant.organization && <AccountForm />}
            {type === 1 && props.selectedTenant && props.selectedTenant.organization && <SyncEntitiesForm />}
          </div>
        </>
      ) : (
        <div className={classes.accessErrorContainer}>
          <div>
            <LockIcon className={classes.accessErrorImg} />
          </div>
          <div className={classes.accessError}>You do not have permission to view this page</div>
        </div>
      )}
    </Root>
  );
};

const mapStateToProps = ({ user, provision }) => ({
  selectedTenant: provision.selectedTenant,
  provisionType: provision.provisionType,
  email: user.email,
  role: user.role,
  userPermissions: user.userPermissions,
  database: user.database,
  group: user.group
});

const mapDispatch = () => ({});

export default connect(mapStateToProps, mapDispatch)(ServicaAccountModal);
