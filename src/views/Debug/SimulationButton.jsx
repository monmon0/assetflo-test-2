import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Button } from '@mui/material';
import { hasAccess } from '../../util/hasAccess';
import variables from '../../variables.json';

function SimulationButton(props) {
  const resetSelectedData = () => {
    props.setTablePage(0);
    props.setSelectedRow({});
    props.setSelectedDeviceList('');
    props.setTableSearch('');
    props.resetConfiguration();
    props.clearDeviceMetrics();
    props.resetFirmwareAndStatus();
  };

  return (
    <div style={{ display: 'flex', maxWidth: '100%', alignItems: 'baseline' }}>
      {props.screenWidth > 1000 &&
        hasAccess(
          props.userPermissions,
          variables.ALL_PROVISION_FEATURE,
          props.role,
          props.adminDatabase || props.database,
          props.group
        ) && (
          // add events / simulator button
          <Button
            style={{
              outline: 0,
              fontWeight: 'bold',
              color:
                props.simulatorView === 'simulator'
                  ? props.wrldMapOnly
                    ? variables.GEOTAB_PRIMARY_COLOR
                    : variables.ORANGE_COLOR
                  : variables.DARK_GRAY_COLOR
            }}
            // set view to simulator page if clicked
            onClick={() => {
              resetSelectedData();
              props.setSimulatorView('simulator');
            }}
          >
            Add Events
          </Button>
        )}

      {props.screenWidth > 1000 &&
        hasAccess(
          props.userPermissions,
          variables.ALL_PROVISION_FEATURE,
          props.role,
          props.adminDatabase || props.database,
          props.group
        ) && <span style={{ marginTop: '5px' }}>|</span>}
      {/* attachment button */}
      <Button
        style={{
          outline: 0,
          fontWeight: 'bold',
          color:
            props.simulatorView === 'attachment'
              ? props.wrldMapOnly
                ? variables.GEOTAB_PRIMARY_COLOR
                : variables.ORANGE_COLOR
              : variables.DARK_GRAY_COLOR
        }}
        // set view to attachment page if clicked
        onClick={() => {
          resetSelectedData();
          props.setSimulatorView('attachment');
        }}
      >
        Manage Attachments
      </Button>

      {props.screenWidth > 1000 &&
        hasAccess(
          props.userPermissions,
          variables.ALL_PROVISION_FEATURE,
          props.role,
          props.adminDatabase || props.database,
          props.group
        ) && <span style={{ marginTop: '5px' }}>|</span>}
      {/* manage test cases button */}
      <Button
        style={{
          outline: 0,
          fontWeight: 'bold',
          color:
            props.simulatorView === 'management'
              ? props.wrldMapOnly
                ? variables.GEOTAB_PRIMARY_COLOR
                : variables.ORANGE_COLOR
              : variables.DARK_GRAY_COLOR
        }}
        // set view to management test cases page if clicked
        onClick={() => {
          resetSelectedData();
          props.setSimulatorView('management');
        }}
      >
        Manage Test Cases
      </Button>
    </div>
  );
}

const mapStateToProps = ({ provision, user, location, dashboard, map }) => ({
  provisionType: provision.provisionType,
  allFacilityDevices: dashboard.allFacilityDevices,
  loginType: user.loginType,
  adminDatabase: user.adminDatabase,
  database: user.database,
  checkedDevicesList: provision.checkedDevicesList,
  role: user.role,
  userPermissions: user.userPermissions,
  screenWidth: location.screenWidth,
  showAdvanceTool: location.showAdvanceTool,
  tenant: provision.userTenant,
  email: user.email,
  group: user.group,
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount'
});

const mapDispatch = ({
  provision: {
    setProvisionTypeAction,
    setTablePageAction,
    setSelectedRowAction,
    setSelectedDeviceListAction,
    setTableSearchAction,
    resetConfigurationAction,
    resetFirmwareAndStatusAction
  },
  dashboard: { clearDeviceMetricsAction }
}) => ({
  setProvisionType: setProvisionTypeAction,
  setTablePage: setTablePageAction,
  setSelectedRow: setSelectedRowAction,
  setSelectedDeviceList: setSelectedDeviceListAction,
  setTableSearch: setTableSearchAction,
  resetConfiguration: resetConfigurationAction,
  clearDeviceMetrics: clearDeviceMetricsAction,
  resetFirmwareAndStatus: resetFirmwareAndStatusAction
});

export default connect(mapStateToProps, mapDispatch)(SimulationButton);
