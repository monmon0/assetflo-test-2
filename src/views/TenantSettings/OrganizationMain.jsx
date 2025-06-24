import React, { useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import { connect } from 'react-redux';
import TenantSettings from './TenantSettings';

const OrganizationMain = (props) => {
  useEffect(() => {
    props.getUserTenant();
    // get my admin account
    props.getMyAdminDigAccount({
      organization: props.database,
      type: 0
    });
    // get dig account
    props.getMyAdminDigAccount({
      organization: props.database,
      type: 1
    });
  }, []);

  return <>{props.selectedTenant ? <TenantSettings /> : <CircularProgress />}</>;
};

const mapStateToProps = ({ provision, user }) => ({
  selectedTenant: provision.selectedTenant,
  database: user.database
});

const mapDispatch = ({ provision: { getUserTenantAction, getMyAdminDigAccountAction } }) => ({
  getUserTenant: getUserTenantAction,
  getMyAdminDigAccount: getMyAdminDigAccountAction
});

export default connect(mapStateToProps, mapDispatch)(OrganizationMain);
