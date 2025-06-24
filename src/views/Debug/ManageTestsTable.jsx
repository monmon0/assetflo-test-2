import React, { useState, useEffect, createRef, useRef } from 'react';
import MaterialTable, { MTableEditField } from '@material-table/core';
import { connect } from 'react-redux';
import moment from 'moment';
import {
  Chip,
  createTheme,
  ThemeProvider,
  StyledEngineProvider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Tooltip,
  TextField,
  Radio,
  Typography,
  ClickAwayListener,
  Modal,
  adaptV4Theme
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import withStyles from '@mui/styles/withStyles';
import { Alert } from '@mui/material';
import variables from '../../variables.json';
import { hasAccess } from '../../util/hasAccess';
import ReactDOM from 'react-dom';
import SettingsIcon from '@mui/icons-material/Settings';
import LocationOffIcon from '@mui/icons-material/LocationOff';
import QueueIcon from '@mui/icons-material/Queue';
import PlaceIcon from '@mui/icons-material/Place';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import MapIcon from '@mui/icons-material/Map';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import Autocomplete from '@mui/material/Autocomplete';

import Simulation from './Simulation.jsx';
import SimulationButton from './SimulationButton.jsx';
import ManageAttachmentsModal from './ManageAttachmentsModal.jsx';

// import event building functions to build events for processing
const { build5gEvent } = require('./5gEventBuilder.js');
const { buildIoxEvent } = require('./ioxEventBuilder.js');

// get list of validOwners that the user can choose
const validOwners = variables.validOwners;

function ManageTestsTable(props) {
  const [testToEdit, setTestToEdit] = useState(undefined);
  const [eventsToEdit, setEventsToEdit] = useState(undefined);

  // test case attachment use state variables
  const [attachmentStatus, setAttachmentStatus] = useState(null);
  const [attachmentDeviceId, setAttachmentDeviceId] = useState(null);
  const [attachmentObject, setAttachmentObject] = useState(null);
  const [attachmentToDeviceId, setAttachmentToDeviceId] = useState(null);
  const [attachmentToObject, setAttachmentToObject] = useState(null);
  const [rowDataObject, setRowDataObject] = useState(null);
  const attachmentTypes = ['Attached', 'Detached'];

  // modal useState variables
  const [openEditAttachment, setOpenEditAttachment] = useState(false);
  const modalRef = useRef(null);

  // attachment state modal functions
  const handleClickAwayEditAttachment = () => {
    // close modal
    setOpenEditAttachment(false);
  };

  const handleClickEditAttachment = () => {
    setOpenEditAttachment((prev) => !prev);
  };

  const handleOpenEditAttachment = (rowData) => {
    // set test case object being edited
    setRowDataObject(rowData);

    // reset fields that may have been set before
    setAttachmentStatus(null);
    setAttachmentDeviceId(null);
    setAttachmentToDeviceId(null);
    setAttachmentObject(null);
    setAttachmentToObject(null);

    // preset fields if attachedState of a test case has been set
    if (rowData.attachedState !== undefined && rowData.attachedState !== null) {
      setAttachmentStatus(rowData.attachedState.state);
      setAttachmentDeviceId(rowData.deviceToUpdate);
      setAttachmentToDeviceId(rowData.attachedState.attachedTo);
      const foundAttachmentObject = props.devices.find(
        (device) => device.deviceId && device.deviceId === rowData.deviceToUpdate
      );
      setAttachmentObject(foundAttachmentObject);
      const foundAttachmentToObject = props.devices.find(
        (device) => device.deviceId && device.deviceId === rowData.attachedState.attachedTo
      );
      setAttachmentToObject(foundAttachmentToObject);
    }

    setOpenEditAttachment(true);
  };

  const handleAttachmentStatusChange = (value) => {
    // if attachment state is made Detached, there is no attached to object
    if (value === 'Detached') {
      setAttachmentToObject(null);
      setAttachmentToDeviceId(null);
    }
    setAttachmentStatus(value);
  };

  const handleAttachmentDeviceIdChange = (value) => {
    if (value) {
      setAttachmentDeviceId(value.deviceId);
      setAttachmentObject(value);
    }
  };

  const handleAttachmentToDeviceIdChange = (value) => {
    if (value) {
      setAttachmentToDeviceId(value.deviceId);
      setAttachmentToObject(value);
    }
  };

  const handleEditAttachment = () => {
    // process events and get sorted events and type
    const { sorted, type } = processEvents(rowDataObject);

    // don't save if attachment info invalid due to missing fields
    if (
      (attachmentDeviceId === null && attachmentStatus !== null) ||
      (attachmentDeviceId !== null && attachmentStatus === null) ||
      (attachmentStatus === 'Attached' && attachmentToDeviceId === null)
    ) {
      props.setNote({
        message: `Please fill out all required attachment fields`,
        variant: 'warning'
      });
      return;
    }

    // create attachedState object with our inputted state and attached to device
    let attachedStateObject;
    if (attachmentDeviceId !== null) {
      attachedStateObject = {
        configured: false,
        state: attachmentStatus,
        correctionRssi: -100,
        rssi: attachmentStatus === 'Detached' ? -100 : -75,
        attachedTo: attachmentStatus === 'Detached' ? null : attachmentToDeviceId,
        dropRssi: -100,
        dropLocation: null
      };
    } else {
      attachedStateObject = null;
    }

    // if default test case, create a new test case with attachment status
    if (rowDataObject.isDefault) {
      props.updateTestCases({
        events: sorted,
        type: type,
        testId: undefined,
        owner: rowDataObject.owner,
        attachedState: attachedStateObject,
        deviceToUpdate: attachmentDeviceId
      });
    }
    // if default test case, create a new test case with attachment status
    else {
      props.updateTestCases({
        events: sorted,
        type: type,
        testId: rowDataObject.testId,
        testName: rowDataObject.testName,
        owner: rowDataObject.owner,
        attachedState: attachedStateObject,
        deviceToUpdate: attachmentDeviceId
      });
    }
  };

  // handle manage events button pressed for a test case
  const handleManageEvents = (testCaseToEdit, eventsSelected) => {
    // set the test case and events being edited
    setTestToEdit(testCaseToEdit);
    setEventsToEdit(eventsSelected);

    // set the view to simulator page
    props.setSimulatorView('simulator');
  };

  let tableRef = createRef();

  const theme = createTheme(
    adaptV4Theme({
      palette: {
        secondary: {
          main: variables.LIGHT_ORANGE_COLOR
        }
      }
    })
  );

  const [alert, setAlert] = useState({
    type: '',
    msg: ''
  });

  const productTypeList = variables.SUBSCRIPTION;

  useEffect(() => {
    // get device list
    props.getDevices();
    // get test cases
    props.fetchTestCases();
  }, []);

  // process new events for running and saving as a test case
  function processEvents(newData) {
    let allEvents = [];

    let type = '';
    newData.eventData.forEach((event) => {
      const location = {
        lng: event.longitude,
        lat: event.latitude,
        alt: 1,
        speed: event.deviceSpeed
      };
      // 5G device
      if (event.deviceType == '5G') {
        allEvents.push(
          build5gEvent(
            event.eventObject,
            location,
            event.deviceSpeed,
            event.deviceIsMoving,
            moment(event.selectedDate).valueOf(),
            event.scanData,
            event
          )
        );
        if (type === '') {
          type = '5g';
        } else if (type === 'iox') {
          type = 'mix';
        }
      }
      // IOX device
      else {
        if (type === '') {
          type = 'iox';
        } else if (type === '5g') {
          type = 'mix';
        }
        if (event.eventType !== 'gps' && event.numberOfScans > 1) {
          // handle multiple scans
          event.scanData.map((scan) => {
            allEvents.push(
              buildIoxEvent(
                props.devices,
                event.eventObject,
                location,
                event.deviceSpeed,
                event.deviceIsMoving,
                moment(event.selectedDate).valueOf(),
                event.eventType,
                scan,
                null
              )
            );
          });
        } else {
          // handle logrecord or single scan
          allEvents.push(
            buildIoxEvent(
              props.devices,
              event.eventObject,
              location,
              event.deviceSpeed,
              event.deviceIsMoving,
              moment(event.selectedDate).valueOf(),
              event.eventType,
              event.scanData && event.scanData.length ? event.scanData[0] : null,
              event.locationAccuracy
            )
          );
        }
      }
      // console.log('allEvents', allEvents);
    });
    // sort by scanTime
    const sorted = allEvents.sort((x, y) => {
      const scanTimeA = x.tagData ? x.tagData.scanTime : x.scanTime;
      const scanTimeB = y.tagData ? y.tagData.scanTime : y.scanTime;
      return scanTimeA - scanTimeB;
    });

    return { sorted, type };
  }

  // update test case after editing name or owner
  const handleUpdateTest = (newData, oldData) => {
    // process events and get sorted events and type
    const { sorted, type } = processEvents(newData);

    // only set the owner name to the new name if in list of valid owners
    let chosenOwner = validOwners.includes(newData.owner) ? newData.owner : oldData.owner;

    // if new name is already a name in test cases do not update and give warning
    if (props.testCases.find((testCase) => testCase.name === newData.testName)) {
      props.setNote({
        message: `Test case: ${newData.testName} already exists. Choose a different name.`,
        variant: 'warning'
      });
      return;
    }

    // update with new name and owner
    props.updateTestCases({
      events: sorted,
      type: type,
      testId: oldData.testId,
      testName: newData.testName,
      owner: chosenOwner
    });
  };

  // update table data based on new data
  async function handleUpdateData(newData, oldData) {
    newData.testName = newData.testName;

    let updatedDeviceData = {
      ...newData
    };
    delete updatedDeviceData.tableData;

    await props.updateDeviceData(updatedDeviceData);
    return;
  }

  // delete test case by making it archived in props
  const handleDeleteTest = (testToDelete) => {
    props.updateTestCases({
      events: testToDelete.eventData,
      type: '',
      testId: testToDelete.testId,
      testName: testToDelete.testName,
      archived: true
    });
  };

  // attachment modal body contents
  const editAttachmentBody = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
    >
      <ClickAwayListener onClickAway={handleClickAwayEditAttachment}>
        <div
          style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '4px',
            maxHeight: '90vh',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          {rowDataObject && (
            <h2 id="simple-modal-title">
              Edit Attachment State: {rowDataObject.testName}
              {/* Edit Attachment State */}
            </h2>
          )}
          <Typography variant="h6" component="h2">
            <span style={{ color: 'black', fontSize: '14px' }}>Initial Attachment Status (Optional)</span>
          </Typography>
          <Autocomplete
            id="combo-box-demo"
            options={attachmentTypes}
            getOptionLabel={(option) => option}
            style={{ margin: '10px' }}
            renderInput={(params) => <TextField {...params} label="select attachment status" variant="outlined" />}
            value={attachmentStatus}
            onChange={(event, newValue) => {
              handleAttachmentStatusChange(newValue);
            }}
          />
          <Typography variant="h6" component="h2">
            <span style={{ color: 'black', fontSize: '14px' }}>Device Name (Optional)</span>
          </Typography>
          {props.devices && (
            <Autocomplete
              id="combo-box-demo"
              options={
                props.devices &&
                props.devices.filter(
                  (device) =>
                    (device.protocol === 'BLE' && !device.isAnchor && !device.fixAsset) || device.protocol === 'LTE'
                )
              }
              getOptionLabel={(option) => option.assetName}
              style={{ margin: '10px' }}
              renderInput={(params) => <TextField {...params} label="select name" variant="outlined" />}
              value={attachmentObject}
              onChange={(event, value) => handleAttachmentDeviceIdChange(value)}
            />
          )}
          <Typography variant="h6" component="h2">
            <span style={{ color: 'black', fontSize: '14px' }}>Attached To Device Name (Optional)</span>
          </Typography>
          {props.devices && (
            <Autocomplete
              id="combo-box-demo-2"
              options={props.devices && props.devices.filter((device) => device.protocol === 'IOX')}
              getOptionLabel={(option) => option.assetName}
              style={{ margin: '10px' }}
              renderInput={(params) => <TextField {...params} label="select name" variant="outlined" />}
              value={attachmentToObject}
              onChange={(event, value) => handleAttachmentToDeviceIdChange(value)}
              disabled={attachmentStatus === 'Detached' && attachmentToObject == null}
            />
          )}
          <Button type="button" style={{ marginTop: '20px' }} onClick={handleEditAttachment}>
            Edit Attachment
          </Button>
        </div>
      </ClickAwayListener>
    </div>
  );

  // table data contents
  function tableData() {
    let columns = [
      {
        title: 'Name',
        field: 'testName',
        filtering: false,
        // width: '1%',
        headerStyle: {
          color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
          fontWeight: 'bold'
        },
        cellStyle: {
          color: variables.DARK_GRAY_COLOR,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          padding: '16px 3px'
        }
      },
      {
        title: 'Test ID',
        field: 'testId',
        filtering: false,
        headerStyle: {
          color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
          fontWeight: 'bold'
        },
        cellStyle: {
          color: variables.DARK_GRAY_COLOR,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          padding: '16px 3px'
        },
        editable: 'onAdd'
      },
      {
        title: 'Owner',
        field: 'owner',
        filtering: false,
        headerStyle: {
          color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
          fontWeight: 'bold'
        },
        cellStyle: {
          color: variables.DARK_GRAY_COLOR,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          padding: '16px 3px'
        }
      },
      {
        title: 'Created',
        field: 'createdAt',
        filtering: false,
        render: (rowData) => {
          return rowData && moment(rowData.createdAt).format('DD/MM/YY');
        },
        headerStyle: {
          color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
          fontWeight: 'bold'
        },
        cellStyle: {
          color: variables.DARK_GRAY_COLOR,
          wordBreak: 'break-word',
          padding: '16px 3px 16px 13px'
        },
        editable: 'never'
      },
      {
        title: 'Last Edited',
        field: 'editedAt',
        filtering: false,
        render: (rowData) => {
          return rowData && moment(rowData.editedAt).format('DD/MM/YY');
        },
        headerStyle: {
          color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
          fontWeight: 'bold'
        },
        cellStyle: {
          color: variables.DARK_GRAY_COLOR,
          wordBreak: 'break-word',
          padding: '16px 3px 16px 13px'
        },
        editable: 'never'
      },
      {
        title: '№ Events',
        field: 'numEvents',
        filtering: false,
        headerStyle: {
          color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
          fontWeight: 'bold'
        },
        cellStyle: {
          color: variables.DARK_GRAY_COLOR,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          padding: '16px 3px 16px 3px'
        },
        editable: 'never'
      },
      {
        title: 'Default Test',
        field: 'isDefault',
        filtering: false,
        render: (rowData) => {
          return rowData.isDefault ? <CheckIcon /> : <ClearIcon />;
        },
        headerStyle: {
          color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
          fontWeight: 'bold'
        },
        cellStyle: {
          color: variables.DARK_GRAY_COLOR,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          padding: '16px 3px 16px 20px'
        },
        editable: 'never'
      },
      {
        title: 'State',
        field: 'attachedState',
        filtering: false,
        headerStyle: {
          color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
          fontWeight: 'bold'
        },
        cellStyle: {
          color: variables.DARK_GRAY_COLOR,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          padding: '16px 3px 16px 3px'
        },
        render: (rowData) => (
          <Tooltip
            title={
              rowData.attachedState === undefined || rowData.attachedState === null
                ? 'Set initial attachment state'
                : 'Change initial attachment state'
            }
          >
            <Chip
              size="small"
              style={{
                backgroundColor:
                  rowData.attachedState === undefined || rowData.attachedState === null
                    ? variables.DISABLED_ORANGE_COLOR
                    : rowData.attachedState.state === 'Attached'
                    ? variables.LIGHT_GREEN_COLOR
                    : rowData.attachedState.state === 'Detached'
                    ? variables.RED_COLOR
                    : props.wrldMapOnly
                    ? variables.DISABLED_GEOTAB_COLOR
                    : variables.DISABLED_ORANGE_COLOR,
                color: variables.WHITE_COLOR
              }}
              onClick={() => handleOpenEditAttachment(rowData)}
              label={
                rowData.attachedState === undefined || rowData.attachedState === null
                  ? 'Set Attachment'
                  : rowData.attachedState.state
              }
            />
          </Tooltip>
        ),
        editable: 'never'
      }
    ];

    // edit events column
    let editEventsColumn = {
      title: 'Manage Events',
      field: 'manageEvents',
      editable: 'never',
      render: (rowData) => {
        return (
          <div
            style={{
              display: 'flex',
              paddingLeft: 10
            }}
          >
            <Chip
              size="small"
              style={{
                backgroundColor: '#98c494',
                color: variables.WHITE_COLOR,
                paddingLeft: '8px'
              }}
              onClick={() => handleManageEvents(rowData, rowData.eventData)}
              label={''}
              icon={
                <SettingsIcon
                  style={{
                    color: variables.WHITE_COLOR
                  }}
                />
              }
            />
          </div>
        );
      },
      filtering: false,
      headerStyle: {
        color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
        fontWeight: 'bold'
      },
      cellStyle: {
        color: variables.DARK_GRAY_COLOR,
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      },
      sorting: false
    };

    // add edit events column to list of columns
    columns = [...columns, editEventsColumn];

    // fill out list of data being including each row with the required fields
    let data = [];
    props.testCases &&
      props.testCases.map((test) => {
        let tableRowData = [];
        tableRowData = {
          testName: props.screenWidth > 700 ? test.name : test.name.substring(0, 10),
          testId: test.testId,
          owner: test.owner,
          createdAt: test.createdAt,
          editedAt: test.editedAt,
          numEvents: test.eventData.length,
          isDefault: test.isDefault,
          attachedState: test.attachedState,
          deviceToUpdate: test.deviceToUpdate,
          eventData: test.eventData
        };

        data.push(tableRowData);
      });

    return { columns, data };
  }

  // display simulation page if view is set to simulator mode
  // display manage attachments page if view is set to attachment mode
  // otherwise display manage attachments page if view is set to management mode
  return (
    <div style={{ width: '100%' }}>
      {props.simulatorView === 'simulator' ? (
        <Simulation
          simulatorView={props.simulatorView}
          setSimulatorView={props.setSimulatorView}
          testCases={props.testCases}
          testToEdit={testToEdit}
          setTestToEdit={setTestToEdit}
          eventsToEdit={eventsToEdit}
          setEventsToEdit={setEventsToEdit}
          updateTestCases={props.updateTestCases}
        />
      ) : props.simulatorView === 'attachment' ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%'
          }}
        >
          <SimulationButton simulatorView={props.simulatorView} setSimulatorView={props.setSimulatorView} />
          <ManageAttachmentsModal />
        </div>
      ) : (
        <div>
          {alert.type !== '' && (
            <div
              style={{
                position: 'absolute',
                marginLeft: 'auto',
                marginRight: 'auto',
                left: 0,
                right: 0,
                top: '90px',
                textAlign: 'center',
                zIndex: 1,
                width: '30%',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <Alert severity={alert.type}>{alert.msg}</Alert>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}
          >
            <Modal open={openEditAttachment} onClose={handleClickEditAttachment}>
              {editAttachmentBody}
            </Modal>
            <SimulationButton
              simulatorView={props.simulatorView}
              setSimulatorView={props.setSimulatorView}
              setEventsToEdit={setEventsToEdit}
            />
            <StyledEngineProvider injectFirst>
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
                  options={{
                    tableLayout: 'fixed',
                    selection: false,
                    search: true,
                    maxBodyHeight: props.screenWidth > 700 ? '65vh' : '55vh',
                    thirdSortClick: false,
                    pageSize: 20,
                    pageSizeOptions: [20, 40, 60, 80, 100],
                    addRowPosition: 'first',
                    draggable: false,
                    rowStyle: (rowData) => ({
                      backgroundColor: variables.WHITE_COLOR,
                      maxHeight: '50px'
                    }),
                    initialPage: props.tablePage || 0,
                    searchText: props.tableSearch || ''
                  }}
                  components={props.groupCell}
                  onChangePage={(e, page) => {
                    ReactDOM.findDOMNode(tableRef.current).children[1].children[0].children[0].scrollTo(0, 0);
                  }}
                  onRowClick={(evt, selectedRow) => {}}
                  title={
                    <div className="text-value-sm" style={{ color: variables.DARK_GRAY_COLOR }}>
                      Manage Test Cases
                    </div>
                  }
                  columns={tableData().columns}
                  data={tableData().data}
                  isLoading={props.isDevicesLoading}
                  editable={{
                    onRowUpdate: (newData, oldData) =>
                      new Promise((resolve, reject) => {
                        if (oldData.isDefault) {
                          // do not edit a test case if it's default
                          props.setNote({
                            message: `Cannot edit default test case`,
                            variant: 'warning'
                          });
                          resolve();
                          return;
                        }
                        newData.testName = newData.testName.trim();
                        handleUpdateTest(newData, oldData);
                        handleUpdateData(newData, oldData);
                        resolve();
                        return;
                      }),
                    onRowDelete: (oldData) =>
                      new Promise((resolve, reject) => {
                        if (oldData.isDefault) {
                          // do not delete a test case if it's default
                          props.setNote({
                            message: `Cannot delete default test case`,
                            variant: 'warning'
                          });
                          resolve();
                          return;
                        }
                        handleDeleteTest(oldData);
                        oldData.archived = true;
                        handleUpdateData(oldData);
                        resolve();
                      })
                  }}
                />
              </ThemeProvider>
            </StyledEngineProvider>
          </div>
        </div>
      )}
    </div>
  );
}

const mapStateToProps = ({ map, user, location, simulation }) => ({
  database: user.database,
  role: user.role,
  userPermissions: user.userPermissions,
  screenWidth: location.screenWidth,
  groupObjects: user.groupObjects,
  groupFilter: user.groupFilter,
  group: user.group,
  testCases: simulation.testCases,
  simulatorView: simulation.simulatorView,
  devices: map.devices
});

const mapDispatch = ({
  dashboard: { getAllFacilityDevicesAction, getMetricsPerDeviceAction },
  provision: {
    updateDeviceDataAction,
    setTablePageAction,
    setSelectedRowAction,
    setSelectedDeviceListAction,
    getConfigAction,
    getLocatorConfigAction,
    getAllDeviceCalibrationAction,
    setTableSearchAction,
    provisionToMyAdminAction,
    relinkSerialNoAction,
    getGeotabDevicesAction
  },
  location: { renderComponentAction },
  notifications: { setNoteAction },
  simulation: { processTestDataAction, fetchTestCasesAction, updateTestCasesAction, setSimulatorViewAction },
  map: { getAllDevicesAction }
}) => ({
  getAllFacilityDevices: getAllFacilityDevicesAction,
  updateDeviceData: updateDeviceDataAction,
  getMetricsPerDevice: getMetricsPerDeviceAction,
  setTableSearch: setTableSearchAction,
  renderComponent: renderComponentAction,
  setTablePage: setTablePageAction,
  setSelectedRow: setSelectedRowAction,
  setSelectedDeviceList: setSelectedDeviceListAction,
  getConfig: getConfigAction,
  getLocatorConfig: getLocatorConfigAction,
  getAllDeviceCalibration: getAllDeviceCalibrationAction,
  provisionToMyAdmin: provisionToMyAdminAction,
  relinkSerialNo: relinkSerialNoAction,
  getDevices: getAllDevicesAction,
  setNote: setNoteAction,
  getGeotabDevices: getGeotabDevicesAction,
  fetchTestCases: fetchTestCasesAction,
  setSimulatorView: setSimulatorViewAction,
  updateTestCases: updateTestCasesAction
});

export default connect(mapStateToProps, mapDispatch)(ManageTestsTable);
