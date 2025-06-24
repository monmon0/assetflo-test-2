import React, { useState, useEffect } from 'react';
import MaterialTable from '@material-table/core';
import { connect } from 'react-redux';
import moment from 'moment';
import { msToTime } from './workingHourCardFuncation';
import { Chip } from '@mui/material';
import { statusColor } from '../../util/statusColor';
import { filterByGroup } from '../../util/filters';

function DevicesTable(props) {
  const [selectedRow, setSelectedRow] = useState({});
  const [loading, setloading] = useState(true);
  function utilizationColor(utilization) {
    if (utilization && utilization > 70) {
      return '#2ECC71';
    } else if (utilization >= 50 && utilization <= 70) {
      return '#FFC104';
    } else {
      return 'red';
    }
  }
  useEffect(() => {
    let timeout = setTimeout(() => setloading(false), 2000);
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  function tableData() {
    let columns = [
        {
          title: 'Name',
          field: 'assetName',
          filtering: false,
          headerStyle: {
            color: '#F8931C',
            // fontSize: "15px",
            fontWeight: 'bold'
          },
          cellStyle: {
            color: '#576574',
            width: '20%'
            // height: "10px"
          }
        },
        {
          title: 'MAC',
          field: 'deviceId',
          filtering: false,
          headerStyle: {
            color: '#F8931C',
            // fontSize: "15px",
            fontWeight: 'bold'
          },
          cellStyle: {
            color: '#576574',
            width: '20%'
            // height: "10px"
          }
        }
      ],
      data = [];
    switch (props.selectedCard) {
      case 'devices':
        columns = [
          ...columns,

          {
            title: 'Current status',
            field: 'isMoving',
            render: (rowData) => {
              const timeProp = rowData.locTime ? rowData.locTime : rowData.updatedAt;
              const color = statusColor({ ...rowData, telemetry: rowData }, timeProp);

              return (
                <div>
                  <Chip
                    style={{
                      backgroundColor: color === '#f86c6b' ? '#c8ced3' : color,
                      color: color === '#c8ced3' || color === '#f86c6b' ? '#000' : '#fff',
                      height: 16,
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 5
                    }}
                    size="small"
                    label={
                      rowData &&
                      rowData.isMoving &&
                      moment().valueOf() - moment(rowData.locTime).valueOf() < 3 * 60 * 1000
                        ? 'Moving'
                        : 'Stoped'
                    }
                  />
                </div>
              );
            },
            editable: 'never',
            headerStyle: {
              color: '#F8931C',
              fontWeight: 'bold'
            },
            cellStyle: {
              color: '#576574'
            }
          },
          {
            title: 'Last reported',
            field: 'locTime',
            render: (rowData) => <div>{moment(rowData.locTime).startOf('second').fromNow()}</div>,
            editable: 'never',
            headerStyle: {
              color: '#F8931C',
              fontWeight: 'bold'
            },
            cellStyle: {
              color: '#576574'
            }
          },
          {
            title: 'Battery Level',
            field: 'batterylevel',
            editable: 'never',
            headerStyle: {
              color: '#F8931C',
              fontWeight: 'bold'
            },
            cellStyle: {
              color: '#576574'
            },
            render: (rowData) => <div>{rowData.batterylevel > 100 ? 100 : rowData.batterylevel}</div>
          }
          // {
          //   title: "Metrics",
          //   field: "metrics",
          //   filtering: false,
          //   editable: "never",
          //   headerStyle: {
          //     color: "#F8931C",
          //     // fontSize: "15px",
          //     fontWeight: "bold"
          //   },
          //   cellStyle: {
          //     color: "#576574"
          //   }
          // },
        ];

        break;
      case 'utilization':
        columns = [
          ...columns,
          {
            title: 'Utilization',
            field: 'utilization',
            render: (rowData) => (
              <div>
                {
                  <Chip
                    size="small"
                    style={{
                      backgroundColor: utilizationColor(rowData.utilization * 100),
                      color: '#FFFFFF'
                    }}
                    label={rowData && (rowData.utilization * 100).toFixed(2) + '%'}
                    disabled
                  />
                }
                {/* {window.innerWidth > 750 && (
                  <ColorLinearProgress
                    // className="progress-xs"
                    // style={{ background: "red" }}
                    // color={utilizationColor(rowData.utilization)}
                    value={rowData.utilization * 100}
                    variant="determinate"
                  />
                )} */}
              </div>
            ),
            customSort: (a, b) => a.utilization - b.utilization,
            filtering: false,
            editable: 'never',
            headerStyle: {
              color: '#F8931C',
              // fontSize: "15px",
              fontWeight: 'bold'
            },
            cellStyle: {
              color: '#576574'
            }
          },
          {
            title: 'Total utilization',
            field: 'totalUtilization',
            render: (rowData) => (
              <div>
                <Chip
                  size="small"
                  style={{
                    backgroundColor: utilizationColor(rowData.totalUtilization * 100),
                    color: '#FFFFFF'
                  }}
                  label={rowData && (rowData.totalUtilization * 100).toFixed(2) + '%'}
                  disabled
                />
              </div>
            ),
            // customSort: (a, b) => a.totalUtilization - b.totalUtilization,
            filtering: false,
            editable: 'never',
            headerStyle: {
              color: '#F8931C',
              // fontSize: "15px",
              fontWeight: 'bold'
            },
            cellStyle: {
              color: '#576574'
            }
          }
        ];
        break;
      case 'workHours':
        columns = [
          ...columns,
          {
            title: 'Work hours',
            field: 'workHours',
            filtering: false,
            editable: 'never',
            headerStyle: {
              color: '#F8931C',
              fontWeight: 'bold'
            },
            cellStyle: {
              color: '#576574',
              width: '20%'
            }
          }
        ];
        break;
      case 'lift':
        columns = [
          ...columns,
          {
            title: 'Lift',
            field: 'lift',
            filtering: false,
            editable: 'never',
            headerStyle: {
              color: '#F8931C',
              fontWeight: 'bold'
            },
            cellStyle: {
              color: '#576574'
            }
          }
        ];
      default:
        break;
    }
    data = [];
    let hashMap = {};
    props.metrics &&
      props.metrics.map((d) => {
        let tableRowData = {
          assetName: d.assetName,
          deviceType: d.deviceType,
          deviceId: d.deviceId,
          isMoving: d.isMoving,
          locTime: d.locTime,
          batterylevel: d.telemetry.batterylevel,
          utilization: d && d.utilization >= 0 && d.utilization !== null ? d.utilization : 0,
          totalUtilization: d && d.totalUtilization >= 0 && d.totalUtilization !== null ? d.totalUtilization : 0,
          workHours: msToTime(d.workHours) || 0,
          lift: d && d.totalLifts !== null ? d.totalLifts : 0,
          groups: d.groups
        };
        data.push(tableRowData);
        hashMap[d.deviceId] = d;
      });

    props.allFacilityDevices &&
      props.allFacilityDevices.map((device) => {
        if (device.deviceType === 'Tag') {
          let tableRowData = {
            assetName: device.assetName,
            deviceType: device.deviceType,
            deviceId: device.deviceId,
            isMoving: device.isMoving || false,
            locTime: device.updatedAt,
            batterylevel: 'unknown',
            utilization: 0,
            totalUtilization: 0,
            workHours: 0,
            lift: 0,
            groups: device.groups
          };
          !hashMap[device.deviceId] && data.push(tableRowData);
        }
      });

    if (props.groupFilter.length > 0) {
      data = filterByGroup(data, props.groupFilter);
    }

    return { columns, data };
  }

  return (
    <div
      style={
        {
          // display: "flex",
          // alignItems: "center",
          // boxSizing: "border-box"
        }
      }
    >
      <MaterialTable
        key={props.selectedCard}
        style={{
          margin: '10px'
          // width: "100"
        }}
        stickyHeader
        options={{
          // filterCellStyle: { pading: "0px" },
          search: true,
          maxBodyHeight: props.selectedCard !== 'devices' ? '40vh' : '70vh',
          // filtering: true,
          thirdSortClick: false,
          tableLayout: 'fixed',
          pageSize: 20,
          pageSizeOptions: [20, 40, 60, 80, 100],
          draggable: false,

          rowStyle: (rowData) => ({
            backgroundColor:
              rowData.tableData && selectedRow.tableData && rowData.tableData.id === selectedRow.tableData.id
                ? '#F8931C'
                : '#FFF',
            maxHeight: '50px'
          })
        }}
        onRowClick={(evt, selectedRow) => {
          setSelectedRow(selectedRow);
        }}
        title={
          <div className="text-value-sm" style={{ color: '#576574' }}>
            Devices details
          </div>
        }
        columns={tableData().columns}
        data={tableData().data}
        isLoading={props.isMetricsLoading}
        // editable={{
        //   onRowUpdate: (newData, oldData) =>
        //     new Promise((resolve, reject) => {
        //       setTimeout(() => {
        //         {
        //           console.log(newData, oldData);
        //           resolve();
        //         }
        //         resolve();
        //       }, 1000);
        //     })
        // }}
      />
    </div>
  );
}

const mapStateToProps = ({ dashboard, map, user }) => ({
  isMetricsLoading: dashboard.isMetricsLoading,
  metrics: dashboard.metrics,
  selectedCard: dashboard.selectedCard,
  tags: map.tags,
  devices: map.devices,
  locators: map.locators,
  groupFilter: user.groupFilter,
  allFacilityDevices: dashboard.allFacilityDevices
});

const mapDispatch = () => ({});

export default connect(mapStateToProps, mapDispatch)(DevicesTable);
