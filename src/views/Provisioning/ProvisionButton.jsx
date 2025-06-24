import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Button } from '@mui/material';
import { hasAccess } from '../../util/hasAccess';
import variables from '../../variables.json';

function ProvisionButton(props) {
  const [locators, setLocators] = useState(1);

  // Define reusable permission variables
  const hasTenantAccess =
    hasAccess(props.userPermissions, variables.FIND_TENANT, props.role, props.database, props.group) &&
    hasAccess(props.userPermissions, variables.UPDATE_TENANT, props.role, props.database, props.group) &&
    hasAccess(props.userPermissions, variables.SERVICE_ACCOUNT, props.role, props.database, props.group);

  const hasAllProvisionAccess = hasAccess(
    props.userPermissions,
    variables.ALL_PROVISION_FEATURE,
    props.role,
    props.database,
    props.group
  );

  const hasAdvanceToolAccess = hasAccess(
    props.userPermissions,
    variables.ADVANCETOOL,
    props.role,
    props.database,
    props.group
  );

  const hasServiceAccountAccess = hasAccess(
    props.userPermissions,
    variables.SERVICE_ACCOUNT,
    props.role,
    props.database,
    props.group
  );

  useEffect(() => {
    if (!props.showAdvanceTool && props.provisionType === 'Ancher') {
      props.setProvisionType('Locator');
    }
  }, [props.showAdvanceTool]);

  useEffect(() => {
    if (props.deviceStates) {
      const locNum = props.deviceStates.filter((device) => device.deviceType === 'Locator');
      setLocators(!!(locNum && locNum.length));
    }
  }, [props.deviceStates]);

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
      {/* My Organization */}
      {props.screenWidth > 1000 && (hasTenantAccess || hasAllProvisionAccess) && (
        <>
          <Button
            style={{
              outline: 0,
              fontWeight: 'bold',
              color:
                props.provisionType === 'Organization'
                  ? props.wrldMapOnly
                    ? variables.GEOTAB_PRIMARY_COLOR
                    : variables.ORANGE_COLOR
                  : variables.DARK_GRAY_COLOR
            }}
            onClick={() => {
              resetSelectedData();
              props.setProvisionType('Organization');
            }}
          >
            My Organization
          </Button>
          <span style={{ marginTop: '5px' }}>|</span>
        </>
      )}

      {/* Devices: (Tags) */}
      <Button
        style={{
          outline: 0,
          fontWeight: 'bold',
          color:
            props.provisionType === 'Tag'
              ? props.wrldMapOnly
                ? variables.GEOTAB_PRIMARY_COLOR
                : variables.ORANGE_COLOR
              : variables.DARK_GRAY_COLOR
        }}
        onClick={() => {
          resetSelectedData();
          props.setProvisionType('Tag');
        }}
      >
        Tags
      </Button>

      {/* Locators: (only if locators are provisioned) */}
      {locators && (
        <>
          <span style={{ marginTop: '5px' }}>|</span>
          <Button
            style={{
              outline: 0,
              fontWeight: 'bold',
              color:
                props.provisionType === 'Locator'
                  ? props.wrldMapOnly
                    ? variables.GEOTAB_PRIMARY_COLOR
                    : variables.ORANGE_COLOR
                  : variables.DARK_GRAY_COLOR
            }}
            onClick={() => {
              resetSelectedData();
              props.setProvisionType('Locator');
            }}
          >
            Locators
          </Button>
        </>
      )}

      {/* Pois */}
      {props.screenWidth > 1000 && (
        <>
          <span style={{ marginTop: '5px' }}>|</span>
          <Button
            style={{
              outline: 0,
              fontWeight: 'bold',
              color:
                props.provisionType === 'Poi'
                  ? props.wrldMapOnly
                    ? variables.GEOTAB_PRIMARY_COLOR
                    : variables.ORANGE_COLOR
                  : variables.DARK_GRAY_COLOR
            }}
            onClick={() => {
              resetSelectedData();
              props.setProvisionType('Poi');
            }}
          >
            Pois
          </Button>
        </>
      )}

      {/* Anchors, on showAdvanceTools */}
      {props.showAdvanceTool && (
        <>
          <span style={{ marginTop: '5px' }}>|</span>
          <Button
            style={{
              outline: 0,
              fontWeight: 'bold',
              color:
                props.provisionType === 'Ancher'
                  ? props.wrldMapOnly
                    ? variables.GEOTAB_PRIMARY_COLOR
                    : variables.ORANGE_COLOR
                  : variables.DARK_GRAY_COLOR
            }}
            onClick={() => {
              resetSelectedData();
              props.setProvisionType('Ancher');
            }}
          >
            Anchors
          </Button>
        </>
      )}

      {/* Tenants */}
      {props.screenWidth > 1000 && hasAdvanceToolAccess && (
        <>
          <span style={{ marginTop: '5px' }}>|</span>
          <Button
            style={{
              outline: 0,
              fontWeight: 'bold',
              color:
                props.provisionType === 'Tenant'
                  ? props.wrldMapOnly
                    ? variables.GEOTAB_PRIMARY_COLOR
                    : variables.ORANGE_COLOR
                  : variables.DARK_GRAY_COLOR
            }}
            onClick={() => {
              resetSelectedData();

              props.setProvisionType('Tenant');
            }}
          >
            Tenants
          </Button>
        </>
      )}

      {/* Provisioning */}
      {props.screenWidth > 1000 && hasAllProvisionAccess && props.loginType !== 'verifyGeotabAddinAccount' && (
        <>
          <span style={{ marginTop: '5px' }}>|</span>
          <Button
            style={{
              outline: 0,
              fontWeight: 'bold',
              color:
                props.provisionType === 'Provision'
                  ? props.wrldMapOnly
                    ? variables.GEOTAB_PRIMARY_COLOR
                    : variables.ORANGE_COLOR
                  : variables.DARK_GRAY_COLOR
            }}
            onClick={() => {
              resetSelectedData();
              props.setProvisionType('Provision');
            }}
          >
            Provisioning
          </Button>
        </>
      )}
      {/* Geotab Settings */}
      {props.screenWidth > 1000 && (hasAllProvisionAccess || hasServiceAccountAccess) && (
        // service account will not have access to Geotab settings (sync entities)
        // will require: || props.tenant && props.tenant.geotabAccount === props.email &&
        <>
          <span style={{ marginTop: '5px' }}>|</span>
          <Button
            style={{
              outline: 0,
              fontWeight: 'bold',
              color:
                props.provisionType === 'Geotab'
                  ? props.wrldMapOnly
                    ? variables.GEOTAB_PRIMARY_COLOR
                    : variables.ORANGE_COLOR
                  : variables.DARK_GRAY_COLOR
            }}
            onClick={() => {
              resetSelectedData();
              props.setProvisionType('Geotab');
            }}
          >
            Geotab Settings
          </Button>
        </>
      )}
      {/* Firmware Tab */}
      {props.screenWidth > 1000 && hasAllProvisionAccess && props.loginType !== 'verifyGeotabAddinAccount' && (
        <>
          <span style={{ marginTop: '5px' }}>|</span>
          <Button
            style={{
              outline: 0,
              fontWeight: 'bold',
              color:
                props.provisionType === 'Firmware'
                  ? props.wrldMapOnly
                    ? variables.GEOTAB_PRIMARY_COLOR
                    : variables.ORANGE_COLOR
                  : variables.DARK_GRAY_COLOR
            }}
            onClick={() => {
              resetSelectedData();
              props.setProvisionType('Firmware');
            }}
          >
            Firmware
          </Button>
        </>
      )}
    </div>
  );
}

const mapStateToProps = ({ provision, user, location, dashboard, map }) => ({
  provisionType: provision.provisionType,
  allFacilityDevices: dashboard.allFacilityDevices,
  deviceStates: provision.states,
  loginType: user.loginType,
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

export default connect(mapStateToProps, mapDispatch)(ProvisionButton);
