import React, { useState, useEffect, createRef } from 'react';
import MaterialTable from '@material-table/core';
import { connect } from 'react-redux';
import { Chip, Alert } from '@mui/material';
import variables from '../../variables.json';
import { hasAccess } from '../../util/hasAccess';
import MapModal from './MapModal';
import ReactDOM from 'react-dom';
import { filterByGroup } from '../../util/filters';
import LocationOffIcon from '@mui/icons-material/LocationOff';
import MapIcon from '@mui/icons-material/Map';

let tableRef = createRef();

function PoiTable(props) {
  const [alert, setAlert] = useState({
    type: '',
    msg: ''
  });

  const [open, setOpen] = React.useState(false);
  const [displayDevice, setDisplayDevice] = React.useState('');

  const handleOpenDisplay = (rowData) => {
    let search = tableRef.current.state.searchText;
    search && props.setTableSearch(search);
    setOpen(true);
    setDisplayDevice(rowData);
  };

  const handleClose = () => {
    setOpen(false);
    setDisplayDevice('');
  };

  useEffect(() => {
    const credantial = {
      database: props.database,
      token: props.token
    };
    props.getPois(credantial);
  }, []);

  const validNumber = (num) => {
    const reg = new RegExp('^-?[0-9]*[.]?[0-9]+$');
    return reg.test(num);
  };

  const zoomValues = () => {
    let zoomValue = {};
    for (let i = 16; i <= 21; i++) {
      zoomValue[i] = i;
    }
    return zoomValue;
  };

  function tableData() {
    let columns = [
      {
        title: 'Name',
        field: 'name',
        filtering: false,
        headerStyle: {
          color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
          fontWeight: 'bold'
        },
        cellStyle: {
          color: variables.DARK_GRAY_COLOR,
          padding: ' 16px 3px'
        },
        validate: (rowData) =>
          rowData.name === '' || (rowData.name && rowData.name.trim() === '')
            ? { isValid: false, helperText: 'required field' }
            : true
      },
      // {
      //   title: 'Address',
      //   field: 'address',
      //   filtering: false,
      //   headerStyle: {
      //     color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      //     fontWeight: 'bold'
      //   },
      //   cellStyle: {
      //     color: variables.DARK_GRAY_COLOR,
      //     textOverflow: 'ellipsis',
      //     whiteSpace: 'nowrap',
      //     overflow: 'hidden',
      //     padding: ' 16px 3px'
      //   }
      // },
      // {
      //   title: 'Type',
      //   field: 'type',
      //   filtering: false,
      //   headerStyle: {
      //     color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      //     fontWeight: 'bold'
      //   },
      //   cellStyle: {
      //     color: variables.DARK_GRAY_COLOR,
      //     padding: ' 16px 3px'
      //   },
      //   editable: 'onAdd',
      //   lookup: { Building: 'Building', Parking: 'Parking', Yard: 'Yard' },
      //   initialEditValue: 'Building'
      // },
      // {
      //   title: 'API key',
      //   field: 'apikey',
      //   filtering: false,
      //   headerStyle: {
      //     color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      //     fontWeight: 'bold'
      //   },
      //   cellStyle: {
      //     color: variables.DARK_GRAY_COLOR,
      //     textOverflow: 'ellipsis',
      //     whiteSpace: 'nowrap',
      //     overflow: 'hidden',
      //     padding: ' 16px 3px'
      //   }
      // },
      // {
      //   title: 'ProviderId',
      //   field: 'providerId',
      //   filtering: false,
      //   headerStyle: {
      //     color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      //     fontWeight: 'bold'
      //   },
      //   cellStyle: {
      //     color: variables.DARK_GRAY_COLOR,
      //     textOverflow: 'ellipsis',
      //     whiteSpace: 'nowrap',
      //     overflow: 'hidden',
      //     padding: ' 16px 3px'
      //   },
      //   lookup: { Wrld: 'Wrld', MapIndoors: 'MapIndoors' },
      //   initialEditValue: 'MapIndoors'
      // },
      // {
      //   title: 'Url',
      //   field: 'providerURL',
      //   filtering: false,
      //   headerStyle: {
      //     color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      //     fontWeight: 'bold'
      //   },
      //   cellStyle: {
      //     color: variables.DARK_GRAY_COLOR,
      //     textOverflow: 'ellipsis',
      //     whiteSpace: 'nowrap',
      //     overflow: 'hidden',
      //     padding: ' 16px 3px'
      //   }
      //   // validate: (rowData) =>
      //   //   rowData.providerURL === '' || (rowData.providerURL && rowData.providerURL.trim() === '')
      //   //     ? { isValid: false, helperText: 'required field' }
      //   //     : true
      // },
      // {
      //   title: 'IndoorId',
      //   field: 'indoorId',
      //   filtering: false,
      //   headerStyle: {
      //     color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      //     fontWeight: 'bold'
      //   },
      //   cellStyle: {
      //     color: variables.DARK_GRAY_COLOR,
      //     textOverflow: 'ellipsis',
      //     whiteSpace: 'nowrap',
      //     overflow: 'hidden',
      //     padding: ' 16px 3px'
      //   }
      // },
      {
        title: 'Groups',
        field: 'groups',
        filtering: false,
        headerStyle: {
          color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
          fontWeight: 'bold'
        },
        cellStyle: {
          color: variables.DARK_GRAY_COLOR,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          padding: ' 16px 3px'
        },
        // initialEditValue: () =>[props.groupObjects && props.groupObjects.length > 0 && props.groupObjects[0].groupId] || [],
        editComponent: (fieldProps) => {
          let groupsArray = fieldProps.value
            ? Array.isArray(fieldProps.value)
              ? fieldProps.value
              : [fieldProps.value]
            : [props.groups[0]];
          // console.log(props.groupObjects && props.groupObjects);
          return props.groupsEditComponent(groupsArray, fieldProps);
        },
        render: (rowData) => props.renderGroupNames(rowData.groups)
      },
      {
        title: 'Algorithm',
        field: 'algorithm',
        filtering: false,
        headerStyle: {
          color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
          fontWeight: 'bold'
        },
        cellStyle: {
          color: variables.DARK_GRAY_COLOR,
          // textOverflow: 'ellipsis',
          // whiteSpace: 'nowrap',
          overflow: 'hidden',
          padding: '16px 3px'
        },
        // editable: hasAccess(props.userPermissions, variables.ADVANCETOOL, props.role, props.database, props.group),
        sorting: false,
        lookup: {
          '-1': 'None',
          '0': 'Multilateral',
          '1': 'Centroids',
          '2': 'Cluster + ML',
          '4': 'ML + Distance',
          '3': 'Check shape'
        },
        type: 'numeric',
        initialEditValue: '0'
      },
      {
        title: 'K Value',
        field: 'centroidLen',
        filtering: false,
        headerStyle: {
          color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
          fontWeight: 'bold',
          minHeight: 60.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        },
        align: 'center',
        cellStyle: {
          color: variables.DARK_GRAY_COLOR,
          // textOverflow: 'ellipsis',
          // whiteSpace: 'nowrap',
          overflow: 'hidden',
          padding: '16px 3px'
        },
        // editable: hasAccess(props.userPermissions, variables.ADVANCETOOL, props.role, props.database, props.group),
        sorting: false,
        lookup: {
          '2': '2',
          '3': '3'
        },
        type: 'numeric',
        initialEditValue: '2'
      },
      {
        title: 'Max Locators',
        field: 'maxLen',
        filtering: false,
        headerStyle: {
          color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
          fontWeight: 'bold'
        },
        align: 'center',
        cellStyle: {
          color: variables.DARK_GRAY_COLOR,
          // textOverflow: 'ellipsis',
          // whiteSpace: 'nowrap',
          overflow: 'hidden',
          padding: '16px 3px'
        },
        // editable: hasAccess(props.userPermissions, variables.ADVANCETOOL, props.role, props.database, props.group),
        sorting: false,
        lookup: {
          '-1': 'Auto',
          '1': '1',
          '2': '2',
          '3': '3',
          '4': '4',
          '5': '5',
          '6': '6',
          '7': '7',
          '8': '8'
        },
        type: 'numeric',
        initialEditValue: '0'
      },
      {
        title: 'Rates',
        field: 'shapeRate',
        filtering: false,
        headerStyle: {
          color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
          fontWeight: 'bold',
          minHeight: 60.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        },
        align: 'center',
        cellStyle: {
          color: variables.DARK_GRAY_COLOR,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textAlign: 'center',
          padding: '16px 3px'
        },
        // editable: hasAccess(props.userPermissions, variables.ADVANCETOOL, props.role, props.database, props.group),
        sorting: false,
        render: (rowData) => {
          return (
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
              {rowData.shapeRate.join(', ')}
            </div>
          );
        }
      },
      // {
      //   title: 'lat',
      //   field: 'lat',
      //   filtering: false,
      //   headerStyle: {
      //     color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      //     fontWeight: 'bold'
      //   },
      //   cellStyle: {
      //     color: variables.DARK_GRAY_COLOR,
      //     textOverflow: 'ellipsis',
      //     whiteSpace: 'nowrap',
      //     overflow: 'hidden',
      //     padding: ' 16px 3px'
      //   },
      //   // editable: "onAdd",
      //   sorting: false,
      //   validate: (rowData) =>
      //     rowData.lat !== undefined &&
      //     rowData.lat.trim() !== '' &&
      //     (isNaN(Number(rowData.lat)) ||
      //       Number(rowData.lat) < -90 ||
      //       Number(rowData.lat) > 90 ||
      //       !validNumber(rowData.lat))
      //       ? { isValid: false, helperText: 'invalid input' }
      //       : rowData.lat !== undefined && rowData.lat.trim() === ''
      //       ? { isValid: false, helperText: 'field required' }
      //       : true
      // },
      // {
      //   title: 'lng',
      //   field: 'lng',
      //   filtering: false,
      //   headerStyle: {
      //     color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
      //     fontWeight: 'bold'
      //   },
      //   cellStyle: {
      //     color: variables.DARK_GRAY_COLOR,
      //     textOverflow: 'ellipsis',
      //     whiteSpace: 'nowrap',
      //     overflow: 'hidden',
      //     padding: ' 16px 3px'
      //   },
      //   // editable: "onAdd",
      //   sorting: false,
      //   validate: (rowData) =>
      //     rowData.lng !== undefined &&
      //     rowData.lng.trim() !== '' &&
      //     (isNaN(Number(rowData.lng)) ||
      //       Number(rowData.lng) < -180 ||
      //       Number(rowData.lng) > 180 ||
      //       !validNumber(rowData.lng))
      //       ? { isValid: false, helperText: 'invalid input' }
      //       : rowData.lng !== undefined && rowData.lng.trim() === ''
      //       ? { isValid: false, helperText: 'field required' }
      //       : true
      // },
      {
        title: 'Offset',
        field: 'offset',
        filtering: false,
        headerStyle: {
          color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
          fontWeight: 'bold'
        },
        cellStyle: {
          color: variables.DARK_GRAY_COLOR,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          textAlign: 'center'
        },
        type: 'numeric',
        width: '7%',
        // editable: "onAdd",
        sorting: false,
        initialEditValue: 0,
        validate: (rowData) =>
          rowData.offset !== undefined &&
          // rowData.offset.trim() !== '' &&
          (isNaN(Number(rowData.offset)) || !validNumber(rowData.offset))
            ? { isValid: false, helperText: 'invalid input' }
            : rowData.offset !== undefined && rowData.offset === ''
            ? { isValid: false, helperText: 'field required' }
            : true
      },
      {
        title: 'Zoom',
        field: 'zoom',
        filtering: false,
        headerStyle: {
          color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
          fontWeight: 'bold'
        },
        cellStyle: {
          color: variables.DARK_GRAY_COLOR,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis'
        },
        align: 'center',
        // type: 'numeric',
        lookup: zoomValues(),
        initialEditValue: 20,
        // editable: "onAdd",
        sorting: false
      }
    ];

    let displayDeviceColumn = {
      title: 'Position',
      field: 'display',
      editable: 'never',
      render: (rowData) => {
        {
          return rowData && rowData.lat && rowData.lng ? (
            <div
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
              onClick={() => {
                props.setSelectedRow(rowData);
                props.renderComponent('draggable');
              }}
            >
              <Chip
                size="small"
                style={{
                  backgroundColor: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
                  color: variables.WHITE_COLOR,
                  paddingLeft: '8px'
                }}
                label={''}
                icon={
                  <MapIcon
                    style={{
                      color: variables.WHITE_COLOR
                    }}
                  />
                }
                disabled
              />
            </div>
          ) : (
            <div>
              <Chip
                size="small"
                style={{
                  backgroundColor: variables.RED_COLOR,
                  color: variables.WHITE_COLOR,
                  paddingLeft: '8px'
                }}
                label={''}
                icon={
                  <LocationOffIcon
                    style={{
                      color: variables.WHITE_COLOR
                    }}
                  />
                }
                disabled
              />
            </div>
          );
        }
      },
      filtering: false,
      headerStyle: {
        color: props.wrldMapOnly ? variables.GEOTAB_PRIMARY_COLOR : variables.ORANGE_COLOR,
        fontWeight: 'bold'
      },
      cellStyle: {
        color: variables.DARK_GRAY_COLOR
      },
      sorting: false
    };

    if (
      hasAccess(props.userPermissions, variables.ALL_DEVICES_FEATURE, props.role, props.database, props.group) ||
      hasAccess(props.userPermissions, variables.DEVICES_VIEWONMAP, props.role, props.database, props.group)
    ) {
      columns = [...columns, displayDeviceColumn];
    }

    let data = [];
    props.pois &&
      props.pois.map((poi) => {
        // let tableRowData = [];
        let tableRowData = {
          name: poi.name,
          type: poi.type,
          address: poi.address,
          groups: poi.groups,
          poiId: poi.poiId,
          createdAt: poi.createdAt,
          lat: poi.location && poi.location.lat && Number.parseFloat(poi.location.lat).toFixed(6),
          lng: poi.location && poi.location.lng && Number.parseFloat(poi.location.lng).toFixed(6),
          alt: poi.location && poi.location.alt && Number.parseFloat(poi.location.alt).toFixed(1),
          organization: poi.organization,
          apikey: poi.provider.apikey,
          providerId: poi.provider.providerId,
          providerURL: poi.provider.providerURL,
          indoorId: poi.provider.indoorId,
          polygonPoints: poi.polygonPoints,
          offset: poi.offset,
          zoom: poi.zoom,
          algorithm: poi.algorithm?.algo,
          centroidLen: poi.algorithm?.centroidLen || -1,
          maxLen: poi.algorithm?.maxLen || -1,
          shapeRate: poi.algorithm?.shapeRate || [0.9, 0.9, 0.9, 0.9, 0.9]
        };
        if (!poi.archived) data.push(tableRowData);
      });
    // data = data.filter(
    //   (poi) => poi.poiType && device.deviceType === props.provisionType
    // );

    // filtering by groups
    // console.log(data);
    if (props.groupFilter.length > 0) {
      data = filterByGroup(data, props.groupFilter);
    }

    return { columns, data };
  }

  const handleShapeRateChange = (shapeRate) => {
    if (Array.isArray(shapeRate)) {
      return shapeRate;
    } else if (typeof shapeRate === 'string') {
      return shapeRate?.split(',').map((val) => +val);
    }
  };

  async function handleUpdateData(newData, oldData) {
    const poiData = props.pois.find((poi) => poi.poiId === newData.poiId);
    const centroidLen = +newData.centroidLen < 0 || +newData.algorithm === 3 ? 2 : +newData.centroidLen;
    const maxLen = [1, 2, 4].includes(+newData.algorithm) ? -1 : +newData.maxLen;
    const shapeRate = handleShapeRateChange(newData.shapeRate);
    console.log('update poi', newData);
    const payload = {
      data: {
        poiId: newData.poiId,
        name: newData.name && newData.name.trim(),
        address: newData.address && newData.address.trim(),
        groups: newData.groups.length === 0 ? oldData.groups : newData.groups,
        organization: props.database,
        type: newData.type,
        archived: newData.archived || false,
        offset: Number(newData.offset),
        zoom: Number(newData.zoom),
        polygonPoints: newData.polygonPoints,
        algorithm:
          +newData.algorithm < 0
            ? null
            : {
                algo: +newData.algorithm,
                centroidLen: centroidLen,
                maxLen: maxLen,
                shapeRate: shapeRate || oldData.shapeRate || [0.9, 0.9, 0.9, 0.9, 0.9]
              }
      },
      database: props.database
    };

    payload.data.provider = {
      apikey: newData.apikey || poiData.provider.apikey || '',
      providerId: newData.providerId || poiData.provider.providerId || '',
      indoorId: (newData.indoorId && newData.indoorId.trim()) || '',
      providerURL: (newData.providerURL && newData.providerURL.trim()) || ''
    };

    payload.data.geocoordinates = {
      // this geocoordinates equal to location in locator
      lat: Number(newData.lat && newData.lat.trim()),
      lng: Number(newData.lng && newData.lng.trim()),
      alt: 1
    };

    await props.addAndUpdatePoi(payload);
    // const credantial = {
    //   database: props.database,
    //   token: props.token,
    // };
    // await props.getPois(credantial);
  }

  const handleAddNewTenant = async (newData) => {
    // console.log(newData);
    let payload = {
      data: {
        name: newData.name && newData.name.trim(),
        address: newData.address && newData.address.trim(),
        groups: newData.groups, // must be array as poi services
        organization: props.database,
        type: newData.type,
        archived: false,
        offset: Number(newData.offset) || 0,
        zoom: Number(newData.zoom),
        polygonPoints: []
      },
      database: props.database
    };

    payload.data.provider = {
      apikey: newData.apikey || '',
      providerId: newData.providerId || '',
      indoorId: (newData.indoorId && newData.indoorId.trim()) || '',
      providerURL: (newData.providerURL && newData.providerURL.trim()) || ''
    };

    payload.data.geocoordinates = {
      // this geocoordinates equal to location in locator
      lat: Number(newData.lat && newData.lat.trim()),
      lng: Number(newData.lng && newData.lng.trim()),
      alt: Number((newData.alt && newData.alt.trim()) || 0)
    };
    // console.log(payload);
    await props.addAndUpdatePoi(payload);
  };

  return (
    <div style={{ width: '100%' }}>
      {open && <MapModal onClose={() => handleClose()} open={open} device={displayDevice} />}
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
          search: true,
          maxBodyHeight: props.screenWidth > 700 ? '65vh' : '55vh',
          thirdSortClick: false,
          tableLayout: 'fixed',
          pageSize: 20,
          pageSizeOptions: [20, 40, 60, 80, 100],
          addRowPosition: 'first',
          draggable: false
        }}
        onChangePage={(e, page) => {
          ReactDOM.findDOMNode(tableRef.current).children[1].children[0].children[0].scrollTo(0, 0);
        }}
        title={
          <div className="text-value-sm" style={{ color: variables.DARK_GRAY_COLOR }}>
            Manage {props.provisionType}s
          </div>
        }
        components={props.groupCell}
        columns={tableData().columns}
        data={tableData().data}
        // isLoading={props.isDevicesLoading}
        editable={
          hasAccess(props.userPermissions, variables.ALL_DEVICES_FEATURE, props.role, props.database, props.group)
            ? {
                onRowAdd: (newData) =>
                  new Promise((resolve, reject) => {
                    if (!newData.name || newData.name.trim() === '' || !newData.lat || !newData.lng) {
                      setAlert({
                        type: 'error',
                        msg: 'Name & Location fields are required'
                      });
                      setTimeout(() => {
                        setAlert({ type: '', msg: '' });
                      }, 2000);
                      reject();
                      return;
                    }
                    handleAddNewTenant(newData);
                    resolve();
                    return;
                  }),
                onRowUpdate: (newData, oldData) =>
                  new Promise((resolve, reject) => {
                    if (newData.name.trim() === '') {
                      reject();
                      return;
                    }
                    handleUpdateData(newData, oldData);
                    resolve();
                    // return;
                  }),
                onRowDelete: (oldData) =>
                  new Promise((resolve, reject) => {
                    let data = { ...oldData };
                    data.archived = true;
                    handleUpdateData(data);
                    resolve();
                  })
              }
            : {}
        }
      />
    </div>
  );
}

const mapStateToProps = ({ provision, user, location, map }) => ({
  provisionType: provision.provisionType,
  role: user.role,
  pois: map.pois,
  database: user.database,
  userPermissions: user.userPermissions,
  screenWidth: location.screenWidth,
  groupFilter: user.groupFilter,
  tableSearch: provision.tableSearch,
  groups: user.groups,
  group: user.group,
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount'
});

const mapDispatch = ({
  map: { getPoisAction, addAndUpdatePoiAction },
  provision: { setTableSearchAction, setSelectedRowAction },
  location: { renderComponentAction }
}) => ({
  getPois: getPoisAction,
  addAndUpdatePoi: addAndUpdatePoiAction,
  setTableSearch: setTableSearchAction,
  renderComponent: renderComponentAction,
  setSelectedRow: setSelectedRowAction
});

export default connect(mapStateToProps, mapDispatch)(PoiTable);
