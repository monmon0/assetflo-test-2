import React, { useState, useEffect, createRef } from 'react';
import MaterialTable, { MTableAction } from '@material-table/core';
import { connect } from 'react-redux';
import ReactDOM from 'react-dom';

import { hasAccess } from '../../util/hasAccess';
import {
  Box,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import variables from '../../variables.json';
import { createTheme } from '@mui/material/styles';
import { ThemeProvider } from '@mui/material/styles';

let tableRef = createRef();
const theme = createTheme({
  palette: {
    secondary: {
      main: variables.LIGHT_ORANGE_COLOR
    }
  }
});

function ProvisionTable(props) {
  const [selectedRow, setSelectedRow] = useState({});
  const [organizationInput, setOrganizationInput] = useState('assetflo');
  const [companyMoveModal, setCompanyMoveModal] = useState({ open: false, updates: null, fetched: null });
  const [data, setData] = useState(null);
  useEffect(() => {
    const { columns, data } = props.tableData;
    setData({
      columns,
      data
    });
  }, [props.tableData]);

  useEffect(() => {
    let payload = {};
    if (props.role !== 'superAdmin') payload.database = props.database;
    if (props.database === 'assetflo') payload.database = '';
    props.email && props.getProvisionDevices(payload);
  }, [props.role]);

  function handleAddNewData(newData) {
    let isProvisioned = newData.isProvisioned || false;
    let status = isProvisioned ? 'Active' : 'New';
    let payload = {
      organization: newData.organization,
      //   createdAt: new Date().valueOf(),
      // organization: newData.organization,
      deviceId: newData.deviceId,
      deviceType: newData.deviceType,
      icon: newData.deviceType === 'Tag' ? 'tagIcon' : 'locatorIcon',
      status: status,
      isProvisioned: isProvisioned,
      protocol: newData.protocol
    };
    // console.log('newData', payload);
    props.updateProvisionDevice(payload);
    let credentials = {
      database: props.database
    };
    props.getAllFacilityDevices(credentials);
  }

  function handleUpdateData(newData, oldData) {
    let payload = {
      organization: newData.organization,
      deviceId: newData.deviceId,
      deviceType: newData.deviceType,
      icon: newData.deviceType === 'Tag' ? 'tagIcon' : 'locatorIcon',
      status: 'Active',
      isProvisioned: newData.isProvisioned,
      protocol: newData.protocol
    };
    props.updateProvisionDevice(payload);
  }

  const handleOrganizationChange = (e) => {
    setOrganizationInput(e.target.value);
  };

  const handleAssignOrganization = () => {
    // if (organizationInput.length === 0) return;
    const list = tableRef.current?.props?.data;
    const selected = list.filter((item) => item.tableData?.checked);
    console.log('selected', selected);
    const updatedCheckedList = selected?.map((device) => {
      delete device.createdAt;
      device.isProvisioned = true;
      device.status = 'Active';
      return device;
    });
    if (!updatedCheckedList || !updatedCheckedList.length) return;
    const payload = {
      organization: organizationInput,
      devices: updatedCheckedList
    };
    props.assignOrganization(payload);
    setOrganizationInput('assetflo');
  };

  return (
    <div style={{ width: '100%' }}>
      {companyMoveModal.open && (
        <Dialog
          open={companyMoveModal.open}
          onClose={() => {
            setCompanyMoveModal({ open: false, updates: null, fetched: null });
          }}
        >
          <DialogTitle id="geopush-dialog-title">
            <span style={{ color: variables.ORANGE_COLOR }}>Reminder</span>
          </DialogTitle>
          <DialogContent>
            <div>
              Don't forget to unplug/archive device with serial number{' '}
              <span style={{ fontWeight: 700 }}>{companyMoveModal.fetched.serialNo}</span> from{' '}
              <span style={{ fontWeight: 700 }}>{companyMoveModal.fetched.organization}</span> database on Geotab
              portal.
            </div>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                handleUpdateData(companyMoveModal.updates);
                setCompanyMoveModal({ open: false, updates: null, fetched: null });
              }}
              style={{ color: variables.GREEN_COLOR }}
            >
              Continue
            </Button>
          </DialogActions>
        </Dialog>
      )}
      <ThemeProvider theme={theme}>
        <MaterialTable
          tableRef={tableRef}
          key={props.provisionType}
          style={{
            marginLeft: '30px',
            marginRight: '30px',
            outline: 'none'
          }}
          localization={{ body: { editRow: { deleteText: 'Delete?' } } }}
          stickyHeader
          actions={[
            {
              position: 'toolbarOnSelect',
              icon: () => {
                return (
                  <Box style={{ display: 'flex' }}>
                    <Button
                      size={'small'}
                      style={{
                        margin: '0px 10px',
                        padding: '0px 10px',
                        color: variables.WHITE_COLOR,
                        backgroundColor: variables.ORANGE_COLOR,
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        handleAssignOrganization();
                        console.log(tableRef.current);
                        tableRef.current.onAllSelected(false);
                      }}
                    >
                      Submit
                    </Button>
                    <Select
                      id="organization-select"
                      value={organizationInput}
                      onChange={(e) => handleOrganizationChange(e)}
                      size="small"
                    >
                      {props.allTenants &&
                        props.allTenants.map((tenant) => (
                          <MenuItem key={tenant.organization} value={tenant.organization}>
                            {tenant.organization}
                          </MenuItem>
                        ))}
                    </Select>
                  </Box>
                );
              }
            }
          ]}
          options={{
            selection: hasAccess(
              props.userPermissions,
              variables.ALL_PROVISION_FEATURE,
              props.role,
              props.database,
              props.group
            ),
            addRowPosition: 'first',
            search: true,
            maxBodyHeight: props.screenWidth > 750 ? '65vh' : '55vh',
            thirdSortClick: false,
            pageSize: 20,
            pageSizeOptions: [20, 40, 60, 80, 100],
            draggable: false,
            searchText: props.tableSearch || ''
          }}
          // onRowClick={(evt, selectedRow) => {
          //   // console.log(tableRef.current && tableRef.current.state.lastEditingRow)
          //   if (tableRef.current && tableRef.current.state.lastEditingRow === undefined)
          //     // check the edit mood
          //     setSelectedRow(selectedRow);

          //   // console.log(selectedRow, evt);
          // }}

          onRowClick={(event, rowData) => {
            // Copy row data and set checked state
            const rowDataCopy = { ...rowData };
            rowDataCopy.tableData.checked = !rowDataCopy.tableData.checked;
            // console.log('rowData', rowData);
            // Copy data so we can modify it
            const dataCopy = [...data?.data];
            // Find the row we clicked and update it with `checked` prop
            dataCopy[rowDataCopy.tableData.id] = rowDataCopy;
            setData({ columns: props.tableData.columns, data: dataCopy });
          }}
          onSelectionChange={(rows) => props.adminTableSelectedRows(rows)}
          title={
            <div className="text-value-sm" style={{ color: '#576574' }}>
              Manage devices list
            </div>
          }
          components={{
            Action: (actionProps) => {
              // console.log(actionProps);
              if (actionProps && actionProps.action.tooltip === 'Add') {
                return (
                  <IconButton
                    size={actionProps.size}
                    color="inherit"
                    onClick={(e) => {
                      ReactDOM.findDOMNode(tableRef.current).children[1].children[0].children[0].scrollTo(0, 0);
                      actionProps.action.onClick(e, actionProps.data);
                    }}
                  >
                    <actionProps.action.icon style={{ fontSize: 30 }} />
                  </IconButton>
                );
              } else {
                return <MTableAction {...actionProps} />;
              }
            }
          }}
          columns={props.tableData.columns}
          data={data?.data}
          isLoading={props.isProvisionLoading || !props.tableData}
          onChangePage={(e, page) => {
            ReactDOM.findDOMNode(tableRef.current).children[1].children[0].children[0].scrollTo(0, 0);
          }}
          editable={
            hasAccess(props.userPermissions, variables.ALL_PROVISION_FEATURE, props.role, props.database, props.group)
              ? {
                  isDeleteHidden: () => true,
                  onRowAdd: (newData) =>
                    new Promise((resolve, reject) => {
                      if (
                        // newData.deviceId.trim().length !== 12 ||
                        !newData.deviceId ||
                        newData.deviceId.trim() === ''
                      ) {
                        reject();
                        return;
                      }
                      newData.deviceId = newData.deviceId.trim().toLowerCase();
                      handleAddNewData(newData);
                      resolve();
                    }),
                  onRowUpdate: (newData, oldData) =>
                    new Promise(async (resolve, reject) => {
                      if (newData.deviceId.trim() === '') {
                        reject();
                        return;
                      }
                      newData.deviceId = newData.deviceId.trim().toLowerCase();

                      const fetchedDevice =
                        newData.organization !== oldData.organization
                          ? await props.getDeviceData({ deviceId: newData.deviceId })
                          : null;
                      console.log('fetchedDevice', fetchedDevice);
                      if (
                        fetchedDevice &&
                        fetchedDevice.serialNo &&
                        fetchedDevice.organization !== newData.organization
                      ) {
                        console.log('display modal');
                        //show popup msg to remind to remove device
                        setCompanyMoveModal({ open: true, updates: newData, fetched: fetchedDevice });
                      } else {
                        handleUpdateData(newData, oldData);
                      }
                      resolve();
                    }),
                  onRowDelete: (oldData) =>
                    new Promise((resolve, reject) => {
                      // handleDeleteData(oldData);
                      resolve();
                    })
                }
              : {}
          }
        />
      </ThemeProvider>
    </div>
  );
}

const mapStateToProps = ({ dashboard, provision, user, location }) => ({
  isDevicesLoading: dashboard.isDevicesLoading,
  provisionType: provision.provisionType,
  allTenants: provision.allTenants,
  database: user.database,
  role: user.role,
  userPermissions: user.userPermissions,
  screenWidth: location.screenWidth,
  checkedDevicesList: provision.checkedDevicesList,
  email: user.email,
  tableSearch: provision.tableSearch,
  group: user.group
  // fetchedDevice: provision.fetchedDevice
});

const mapDispatch = ({
  provision: {
    getProvisionDevicesAction,
    updateProvisionDeviceAction,
    adminTableSelectedRowsAction,
    assignOrganizationAction,
    setTableSearchAction,
    getDeviceDataAction
  },
  dashboard: { getAllFacilityDevicesAction }
}) => ({
  getProvisionDevices: getProvisionDevicesAction,
  updateProvisionDevice: updateProvisionDeviceAction,
  adminTableSelectedRows: adminTableSelectedRowsAction,
  getAllFacilityDevices: getAllFacilityDevicesAction,
  assignOrganization: assignOrganizationAction,
  setTableSearch: setTableSearchAction,
  getDeviceData: getDeviceDataAction
});

export default connect(mapStateToProps, mapDispatch)(ProvisionTable);
