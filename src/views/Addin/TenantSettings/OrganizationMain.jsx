import React, { useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import { connect } from 'react-redux';
import TenantSettings from './TenantSettings';

const OrganizationMain = (props) => {
  useEffect(() => {
    props.getUserTenant({ isAddin: true });
    // get my admin account
    props.getMyAdminDigAccount({
      organization: props.database,
      accountType: 'myAdminSession'
    });
    // get dig account
    props.getMyAdminDigAccount({
      organization: props.database,
      accountType: 'digSession'
    });
    console.log('style', props.style);
  }, []);

  return (
    <>
      <link
        rel="stylesheet"
        type="text/css"
        href={props.style ? props.style : 'https://my976.geotab.com/assetflo/geotab/checkmate/app.less?skin=geotab'}
      />
      {props.selectedTenant ? <TenantSettings /> : <CircularProgress />}
    </>
  );
};

const mapStateToProps = ({ provision, addin, user }) => ({
  selectedTenant: provision.selectedTenant,
  style: addin.style,
  database: user.database
});

const mapDispatch = ({ provision: { getUserTenantAction, getMyAdminDigAccountAction } }) => ({
  getUserTenant: getUserTenantAction,
  getMyAdminDigAccount: getMyAdminDigAccountAction
});

export default connect(mapStateToProps, mapDispatch)(OrganizationMain);
