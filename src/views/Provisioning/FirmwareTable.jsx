import React, { useState, useEffect, useRef } from 'react';
import MaterialTable from '@material-table/core';
import { useDispatch, useSelector } from 'react-redux';
import ReactDOM from 'react-dom';

// Material UI Components
import { Tooltip, TextField } from '@mui/material';

// Utils
import { hasAccess } from '../../util/hasAccess';
import variables from '../../variables.json';
import FirmwareUploadButton from './FirmwareUploadButton';

function FirmwareTable(props) {
  const dispatch = useDispatch();
  const firmwareList = useSelector((state) => state.provision.firmwareList);
  const provisionType = useSelector((state) => state.provision.provisionType);
  const userPermissions = useSelector((state) => state.user.userPermissions);
  const role = useSelector((state) => state.user.role);
  const database = useSelector((state) => state.user.database);
  const group = useSelector((state) => state.user.group);
  const screenWidth = useSelector((state) => state.location.screenWidth);
  const wrldMapOnly = useSelector((state) => state.map.wrldMapOnly);

  const tableRef = useRef();
  const fileRef = useRef(null);
  const [tableData, setTableData] = useState();
  const [columns, setColumns] = useState();
  const [file, setFile] = useState(null);

  // console.log('userPermissions', userPermissions);
  // console.log('role', role);
  // console.log('database', database);
  // console.log('group', group);
  // console.log('screenWidth', screenWidth);

  const [alert, setAlert] = useState({
    type: '',
    message: ''
  });

  const handleFileChange = (file) => {
    setFile(file);
  };

  const formatFirmwareData = (firmware) => {
    let firmwareObject = { ...firmware }; // Ensure firmwareObject is always defined
    const version = firmware.version;

    if (typeof version === 'number') {
      // Legacy format (major)
      firmwareObject = {
        ...firmware,
        major: version,
        releaseType: firmware.releaseType || 'legacy'
      };
    } else if (typeof version === 'string') {
      const versionParts = version.split('.');
      if (versionParts.length === 5) {
        // New format (hardwareVersion.protocol.major.minor.patch)
        const [hardwareVersion, protocol, major, minor, patch] = versionParts;
        firmwareObject = {
          ...firmware,
          hardwareVersion,
          protocol,
          major: Number(major),
          minor: Number(minor),
          patch: Number(patch),
          releaseType: firmware.releaseType
        };
      } else if (versionParts.length === 7) {
        // Old format (hardwareVersion.protocol.useCase.major.minor.patch.releaseType)
        const [hardwareVersion, protocol, useCase, major, minor, patch, releaseType] = versionParts;
        firmwareObject = {
          ...firmware,
          hardwareVersion,
          protocol,
          useCase,
          major: Number(major),
          minor: Number(minor),
          patch: Number(patch),
          releaseType
        };
      }
    }

    // Ensure firmwareObject exists before modifying properties
    if (!firmwareObject) {
      console.error('formatFirmwareData: Unable to process firmware', firmware);
      return null;
    }

    if (firmware.deviceType) {
      firmwareObject.deviceType = firmware.deviceType;
    }
    if (firmware.useCase) {
      firmwareObject.useCase = firmware.useCase;
    }
    return firmwareObject;
  };

  // Fetch firmware list on mount
  useEffect(() => {
    const fetchFirmwareData = async () => {
      try {
        await dispatch.provision.getFirmwareListAction({ query: {} });
      } catch (error) {
        console.log(error);
      }
    };
    fetchFirmwareData();

    const commonHeaderStyle = {
      color: wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      fontWeight: 'bold',
      textAlign: 'left',
      padding: '3px 10px'
    };

    const commonCellStyle = {
      color: variables.DARK_GRAY_COLOR,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      padding: '3px 10px'
    };

    const renderCellWithTooltip = (rowData, field) => (
      <Tooltip title={rowData[field]} arrow placement="top">
        <span>{rowData[field]?.length > 150 ? `${rowData[field].substring(0, 150)}...` : rowData[field]}</span>
      </Tooltip>
    );

    const columnConfig = [
      {
        title: 'Hardware Version',
        field: 'hardwareVersion',
        filtering: false,
        align: 'left',
        headerStyle: commonHeaderStyle,
        cellStyle: commonCellStyle,
        width: '10%'
      },
      {
        title: 'Device Type',
        field: 'deviceType',
        filtering: false,
        align: 'left',
        headerStyle: commonHeaderStyle,
        cellStyle: commonCellStyle,
        initialEditValue: 'Tag',
        lookup: { Tag: 'Tag', Locator: 'Locator' },
        width: '10%'
      },
      {
        ...props.protocolColumn,
        headerStyle: commonHeaderStyle,
        cellStyle: commonCellStyle,
        width: '10%'
      },
      {
        title: 'Major',
        field: 'major',
        type: 'numeric',
        filtering: false,
        align: 'left',
        headerStyle: commonHeaderStyle,
        cellStyle: commonCellStyle,
        width: '10%',
        editComponent: (props) => (
          <TextField
            type="number"
            value={props.value}
            onChange={(e) => props.onChange(Number(e.target.value))}
            fullWidth
            size="small"
            variant="standard"
          />
        )
      },
      {
        title: 'Minor',
        field: 'minor',
        type: 'numeric',
        filtering: false,
        align: 'left',
        headerStyle: commonHeaderStyle,
        cellStyle: commonCellStyle,
        width: '10%',
        editComponent: (props) => (
          <TextField
            type="number"
            value={props.value}
            onChange={(e) => props.onChange(Number(e.target.value))}
            fullWidth
            size="small"
            variant="standard"
          />
        )
      },
      {
        title: 'Patch',
        field: 'patch',
        type: 'numeric',
        filtering: false,
        align: 'left',
        headerStyle: commonHeaderStyle,
        cellStyle: commonCellStyle,
        width: '10%',
        editComponent: (props) => (
          <TextField
            type="number"
            value={props.value}
            onChange={(e) => props.onChange(Number(e.target.value))}
            fullWidth
            size="small"
            variant="standard"
          />
        )
      },
      {
        title: 'Release Type',
        field: 'releaseType',
        filtering: false,
        initialEditValue: 'alpha',
        headerStyle: commonHeaderStyle,
        cellStyle: commonCellStyle,
        lookup: { alpha: 'alpha', beta: 'beta', prod: 'prod', legacy: 'legacy' },
        width: '10%'
      },
      {
        title: 'Use Case',
        field: 'useCase',
        filtering: false,
        initialEditValue: 'indoor',
        headerStyle: commonHeaderStyle,
        cellStyle: commonCellStyle,
        render: (rowData) => <span>{rowData.useCase || ''}</span>,
        customFilterAndSearch: (term, rowData) => rowData.useCase?.toLowerCase().includes(term.toLowerCase()),
        customSort: (a, b) => (a.useCase || '').localeCompare(b.useCase || ''),
        lookup: { trailer: 'trailer', indoor: 'indoor' },
        width: '10%'
      },
      {
        title: 'Notes',
        field: 'notes',
        filtering: false,
        headerStyle: commonHeaderStyle,
        cellStyle: commonCellStyle,
        width: '30%',
        render: (rowData) => renderCellWithTooltip(rowData, 'notes'),
        editComponent: (props) => (
          <TextField
            placeholder="Add notes here"
            value={props.value || ''}
            onChange={(e) => props.onChange(e.target.value)}
            fullWidth
            multiline
            minRows={1}
            maxRows={Infinity}
            inputProps={{ style: { fontSize: '0.875rem' } }}
            InputLabelProps={{ style: { fontSize: '0.875rem' } }}
            padding="dense"
            sx={{ padding: '1px 0px' }}
          />
        )
      },
      {
        title: 'File',
        field: 'fileName',
        editComponent: (fieldProps) => <FirmwareUploadButton ref={fileRef} onFileChange={handleFileChange} />,
        editable: 'onAdd',
        filtering: false,
        headerStyle: {
          ...commonHeaderStyle,
          padding: '3px 15px 3px 5px'
        },
        cellStyle: {
          ...commonCellStyle,
          whiteSpace: 'nowrap',
          padding: '3px 15px 3px 5px'
        },
        render: (rowData) => renderCellWithTooltip(rowData, 'fileName'),
        width: '15%'
      }
    ];
    setColumns(columnConfig);
  }, []);

  // Once firmware list is fetched, update tableData state and populate table
  useEffect(() => {
    let initialTableData = [];
    if (firmwareList) {
      firmwareList.sort((a, b) => b.updatedAt - a.updatedAt);
      firmwareList.forEach((firmware) => {
        // Don't show archived firmware in table
        if (firmware.archived === true) {
          return;
        }
        if (!firmware.version) {
          console.error('Firmware version is missing:', firmware.firmwareId);
          return;
        }
        const firmwareObject = formatFirmwareData(firmware);
        initialTableData.push(firmwareObject);
      });
    }
    setTableData(initialTableData);
    // console.log(initialTableData);
  }, [firmwareList]);

  const handleAddNewFirmware = async (data) => {
    try {
      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          const base64Data = reader.result.split(',')[1]; // Remove data:*/*;base64, part

          const payload = {
            fileName: file.name,
            fileData: base64Data,
            hardwareVersion: data.releaseType === 'legacy' ? '' : data.hardwareVersion,
            protocol: data.protocol,
            useCase: data.useCase,
            notes: data.notes || '',
            ...(data.releaseType === 'legacy'
              ? { mongoStorage: 'true', version: `${data.major}` } // legacy version
              : {
                  mongoStorage: 'false',
                  version: `${data.major}.${data.minor}.${data.patch}` // new version
                }),
            deviceType: data.deviceType,
            releaseType: data.releaseType
          };

          await dispatch.provision.uploadNewFirmwareAction({ multipartRequest: payload });
        } catch (err) {
          console.error('Upload failed:', err);
          // alert('Upload failed');
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateFirmware = async (oldRowData, newRowData) => {
    try {
      const payload = {
        firmwareId: newRowData.firmwareId,
        releaseType: newRowData.releaseType,
        useCase: newRowData.useCase,
        deviceType: newRowData.deviceType,
        protocol: newRowData.protocol,
        hardwareVersion: newRowData.releaseType === 'legacy' ? '' : newRowData.hardwareVersion,
        notes: newRowData.notes,
        version:
          newRowData.releaseType === 'legacy'
            ? newRowData.major
            : `${newRowData.major}.${newRowData.minor}.${newRowData.patch}`
      };

      await dispatch.provision.updateExistingFirmwareAction(payload);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteFirmware = async (rowData) => {
    try {
      const payload = {
        firmwareId: rowData.firmwareId
      };
      await dispatch.provision.deleteFirmwareAction(payload);
    } catch (error) {
      console.error(error);
    }
  };

  const validateColumn = (columnData, oldColumnData = null) => {
    // Required fields for legacy and non-legacy
    if (
      !columnData.deviceType ||
      !columnData.protocol ||
      !columnData.releaseType ||
      typeof columnData.major != 'number' ||
      isNaN(columnData.major)
    ) {
      dispatch.notifications.setNoteAction({
        message: 'Firmware is missing required fields',
        variant: 'warning'
      });
      return false;
    }

    // Cannot switch firmware between legacy and non-legacy
    if (
      oldColumnData &&
      ((columnData.releaseType === 'legacy' && oldColumnData.releaseType != 'legacy') ||
        (columnData.releaseType != 'legacy' && oldColumnData.releaseType === 'legacy'))
    ) {
      dispatch.notifications.setNoteAction({
        message: 'Cannot switch firmware between legacy and non-legacy',
        variant: 'warning'
      });
      return false;
    }

    // Check for Firmware File
    if (!oldColumnData && !(fileRef.current.getFile() instanceof File)) {
      dispatch.notifications.setNoteAction({
        message: 'Missing firmware file',
        variant: 'warning'
      });
      return false;
    }

    // Required fields for non-legacy firmware
    if (columnData.releaseType != 'legacy') {
      if (
        typeof columnData.minor != 'number' ||
        isNaN(columnData.minor) ||
        typeof columnData.patch != 'number' ||
        isNaN(columnData.patch) ||
        !columnData.hardwareVersion
      ) {
        dispatch.notifications.setNoteAction({
          message: 'Firmware is missing required fields',
          variant: 'warning'
        });
        return false;
      } else if (columnData.major < 0 || columnData.minor < 0 || columnData.patch < 0) {
        dispatch.notifications.setNoteAction({
          message: 'Negative integers are invalid version numbers',
          variant: 'warning'
        });
        return false;
      }
    }

    // Required fields for legacy firmware
    if (columnData.releaseType === 'legacy') {
      // legacy firmware cannot have a minor or patch version (only single number major version)
      if (
        (typeof columnData.minor === 'number' && !isNaN(columnData.minor)) ||
        (typeof columnData.patch === 'number' && !isNaN(columnData.patch))
      ) {
        dispatch.notifications.setNoteAction({
          message: 'Legacy firmware only has a numeric major version and no minor or patch',
          variant: 'warning'
        });
        return false;
      } else if (columnData.major < 0) {
        dispatch.notifications.setNoteAction({
          message: 'Negative integers are invalid version numbers',
          variant: 'warning'
        });
        return false;
      }

      if (columnData.hardwareVersion) {
        dispatch.notifications.setNoteAction({
          message: 'Hardware version not supported for legacy firmware',
          variant: 'warning'
        });
        return false;
      }

      // if (columnData.useCase) {
      //   dispatch.notifications.setNoteAction({
      //     message: 'Use case not supported for legacy firmware',
      //     variant: 'warning'
      //   });
      //   return false;
      // }
    }

    // Check for duplicate firmware version, excluding archived ones
    const duplicateFirmware = firmwareList.find((firmware) => {
      if (firmware.archived) return false; // Ignore archived firmware
      const formattedFirmware = formatFirmwareData(firmware);
      return (
        formattedFirmware.firmwareId !== columnData.firmwareId && // Ignore the one we are currently editing
        formattedFirmware.hardwareVersion === columnData.hardwareVersion &&
        formattedFirmware.deviceType === columnData.deviceType &&
        formattedFirmware.protocol === columnData.protocol &&
        formattedFirmware.major === columnData.major &&
        formattedFirmware.minor === columnData.minor &&
        formattedFirmware.patch === columnData.patch
      );
    });

    if (duplicateFirmware) {
      dispatch.notifications.setNoteAction({
        message: 'Firmware with the same version already exists',
        variant: 'warning'
      });
      return false;
    }

    return true;
  };

  return provisionType === 'Firmware' && tableRef ? (
    <MaterialTable
      tableRef={tableRef}
      key={provisionType}
      style={{
        marginLeft: '30px',
        marginRight: '30px',
        outline: 'none'
      }}
      localization={{ body: { editRow: { deleteText: 'Delete?' } } }}
      stickyHeader
      options={{
        headerStyle: {
          width: 'auto'
        },
        tableLayout: 'fixed',
        search: true,
        maxBodyHeight: screenWidth > 700 ? '65vh' : '55vh',
        thirdSortClick: false,
        pageSize: 20,
        pageSizeOptions: [20, 40, 60, 80, 100],
        addRowPosition: 'first',
        draggable: false,
        sorting: true,
        actionsCellStyle: { padding: '9px' }
      }}
      onChangePage={(e, page) => {
        ReactDOM.findDOMNode(tableRef.current).children[1].children[0].children[0].scrollTo(0, 0);
      }}
      title={
        <div className="text-value-sm" style={{ color: variables.DARK_GRAY_COLOR }}>
          Manage {provisionType}
        </div>
      }
      columns={columns}
      data={tableData}
      editable={
        hasAccess(userPermissions, variables.ALL_PROVISION_FEATURE, role, database, group)
          ? {
              onRowAdd: (newData) =>
                new Promise((resolve, reject) => {
                  if (!validateColumn(newData)) {
                    reject();
                    return;
                  }
                  handleAddNewFirmware(newData);
                  resolve();
                  return;
                }),
              onRowUpdate: (newData, oldData) =>
                new Promise((resolve, reject) => {
                  if (!validateColumn(newData, oldData)) {
                    reject();
                    return;
                  }
                  handleUpdateFirmware(oldData, newData);
                  resolve();
                  return;
                }),
              onRowDelete: (oldData) =>
                new Promise((resolve, reject) => {
                  handleDeleteFirmware(oldData);
                  resolve();
                  return;
                })
            }
          : {}
      }
    />
  ) : null;
}
export default FirmwareTable;
