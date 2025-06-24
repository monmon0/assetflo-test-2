import React from 'react';
import { Bar } from 'react-chartjs-2';
import moment from 'moment';
import { connect } from 'react-redux';
import { Button, TextField, Menu, MenuItem } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CircularProgress from '@mui/material/CircularProgress';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

// import { msToHours } from "./workingHourCardFuncation";
import { lineChartColor } from '../../util/lineChartColor';
import { filterByGroup } from '../../util/filters';

const LineChart = (props) => {
  const metricsChartButtonStyle = {
    // background: "#F8931C",
    color: '#F8931C',
    margin: '2px',
    outline: 'none'
  };

  const [fromDate, setFromDate] = React.useState(dayjs());
  // const [toDate, setToDate] = React.useState(new Date());
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [anchorForm, setAnchorFrom] = React.useState(null);

  const handleFromDateChange = (date) => {
    // console.log(Date.parse(date)); // this to parse the date value from string to MS
    // let parsedDate = Date.parse(date);
    // console.log(parsedDate);
    setFromDate(date);
    const formattedDate = date.format('MM/DD/YYYY');
    console.log('Formatted Date:', formattedDate);
  };
  // const handleToDateChange = date => {
  //   setToDate(date);
  // };

  const handleClickAncherButtons = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClickAncherFrom = (event) => {
    setAnchorFrom(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setAnchorFrom(null);
  };

  function onDateBtnClick(selected) {
    let payload = { database: props.database };
    if (selected === 'today') {
      payload = {
        ...payload,
        fromDate: moment().startOf('day').valueOf()
      };
    } else if (selected === 'yesterday') {
      payload = {
        ...payload,
        fromDate: moment().startOf('day').subtract(1, 'day').valueOf()
      };
    } else if (selected === 'fromTo') {
      // e.preventDefault();
      // let selectedFromDate = fromDate; //document.getElementById("fromDate").value; //fromDate; //

      // let selectedToDate = toDate; //document.getElementById("toDate").value; //toDate; //
      // if (
      //   selectedToDate > selectedFromDate &&
      //   selectedToDate !== selectedFromDate
      // ) {
      // console.log(fromDate);
      let parsedDate = Date.parse(fromDate);
      // console.log(parsedDate);
      payload = {
        ...payload,
        fromDate: moment(parsedDate).startOf('day').valueOf()
      };
      // console.log(payload);
      // } else {
      //   toast.error("Invalid date", {
      //     position: toast.POSITION.TOP_RIGHT
      //   });
      //   return;
      // }
    }

    props && props.getMetrics(payload);
  }

  function metricsButtons() {
    if (props.screenWidth > 750) {
      return (
        <div>
          <Button
            // variant="contained"
            style={metricsChartButtonStyle}
            onClick={() => {
              onDateBtnClick('today');
              props.selectedDate('Today');
            }}
          >
            Today
          </Button>
          <Button
            // variant="contained"
            style={metricsChartButtonStyle}
            onClick={() => {
              onDateBtnClick('yesterday');
              props.selectedDate('Yesterday');
            }}
          >
            Yesterday
          </Button>
        </div>
      );
    } else {
      return (
        <div>
          <Button
            style={{ color: '#F8931C' }}
            aria-controls="simple-menu"
            aria-haspopup="true"
            onClick={handleClickAncherButtons}
          >
            <MoreHorizIcon />
          </Button>

          <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
            <MenuItem
              onClick={() => {
                onDateBtnClick('today');
                props.selectedDate('Today');
                handleClose();
              }}
            >
              Today
            </MenuItem>
            <MenuItem
              onClick={() => {
                onDateBtnClick('yesterday');
                props.selectedDate('Yesterday');
                handleClose();
              }}
            >
              Yesterday
            </MenuItem>
          </Menu>
        </div>
      );
    }
  }

  // function lineChartData() {
  //   let lineChartDevices =
  //     props &&
  //     props.metrics &&
  //     props.metrics.length > 0 &&
  //     props.metrics.reduce((acc, cur) => {
  //       if (cur && props.selectedCard === "utilization") {
  //         acc.push({
  //           name: cur.assetName,
  //           utilization: cur.utilization
  //         });
  //       } else if (cur && props.selectedCard === "workHours") {
  //         acc.push({
  //           name: cur.assetName,
  //           workHours: cur.workHours
  //         });
  //       }
  //       return acc;
  //     }, []);
  // }

  // const formOpen = Boolean(anchorForm);

  function metricsFromToForm() {
    // if (props.screenWidth > 750) {
    return (
      <div style={{ height: '30px' }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Select date"
            value={fromDate}
            onChange={handleFromDateChange}
            renderInput={(params) => <TextField {...params} />}
            disableFuture
          />
        </LocalizationProvider>
      </div>
    );
  }
  let metricsData =
    props.metrics && props.groupFilter.length > 0 ? filterByGroup(props.metrics, props.groupFilter) : props.metrics;
  let lineChartDevices =
    metricsData &&
    metricsData.reduce((acc, cur) => {
      if (cur && props.selectedCard === 'utilization') {
        acc.push({
          name: cur.assetName,
          utilization: cur.utilization
        });
      } else if (cur && props.selectedCard === 'workHours') {
        acc.push({
          name: cur.assetName,
          workHours: cur.workHours
        });
      } else if (cur && props.selectedCard === 'lift') {
        acc.push({
          name: cur.assetName,
          lift: cur.totalLifts
        });
      }
      return acc;
    }, []);

  const line = {
    labels: lineChartDevices && lineChartDevices.map((device) => device.name),
    datasets: [
      {
        type: 'bar',
        // label: "chart",
        fill: false,
        lineTension: 1.0,
        backgroundColor:
          lineChartDevices && lineChartDevices.map((device) => lineChartColor(device, props.selectedCard)),
        borderColor: '#7CC7F9',
        borderCapStyle: 'butt',
        borderDash: [],
        // borderDashOffset: 0.0,
        borderJoinStyle: 'miter',
        pointBorderColor: '#7CC7F9',
        pointBackgroundColor: '#fff',
        pointBorderWidth: 1,
        pointHoverRadius: 5,
        // pointHoverBackgroundColor: "#7CC7F9",
        // pointHoverBorderColor: "#7CC7F9",
        pointHoverBorderWidth: 2,
        pointRadius: 1,
        pointHitRadius: 10,
        data:
          lineChartDevices &&
          lineChartDevices.map((device) => {
            if (props.selectedCard === 'utilization') {
              return (device[props.selectedCard] * 100).toFixed(2);
            } else if (props.selectedCard === 'workHours') {
              return (device[props.selectedCard] / (1000 * 60 * 60)) % 24;
            } else {
              return device[props.selectedCard];
            }
          })
      }
    ]
  };
  let options = {
    tooltips: {
      enabled: false
    },
    legend: {
      display: false
    },

    maintainAspectRatio: false
  };
  if (props.metrics && props.metrics.length > 0) {
    options = {
      ...options,
      scales: {
        yAxes: [
          {
            ticks: {
              max:
                props.selectedCard === 'workHours'
                  ? 24
                  : props.selectedCard === 'utilization'
                  ? 100
                  : (props.metrics &&
                      props.metrics.length > 0 &&
                      props.metrics.sort((a, b) => b.totalLifts && a.totalLifts && b.totalLifts - a.totalLifts)[0]
                        .totalLifts) ||
                    20,
              min: 0,
              stepSize: props.selectedCard === 'utilization' ? 5 : props.selectedCard === 'workHours' ? 2 : 4
            }
          }
        ]
      }
    };
  }
  // console.log("isMetricsLoading", props && props.isMetricsLoading);
  return (
    <div
      style={{
        boxShadow: '0 4px 8px 0 rgba(0,0,0,0.15)',
        margin: '10px',
        marginTop: '5px',
        background: 'white',
        borderRadius: '5px'
      }}
      className="text-white metrics-row1"
    >
      <div
        style={{
          padding: '10px',
          background: '#FFFFFF',
          display: 'flex',
          borderRadius: '10px',
          // justifyContent: "flex-end"
          justifyContent: 'space-between'
        }}
      >
        <strong style={{ margin: '5px', color: '#576574' }}>
          {props.selectedCard.charAt(0).toUpperCase() + props.selectedCard.slice(1)}{' '}
          {props.selectedCard === 'devices' ? 'List' : 'Chart'}
        </strong>
        {/* <div> {props.selectedCard === "devices" && <RadioButtonsGroup />}</div> */}
        {/* {((props && !props.deviceMetrics) ||
          (props && props.deviceMetrics && props.deviceMetrics.length === 0)) && */}
        {metricsButtons()}
        {/* } */}
        {/* {((props && !props.deviceMetrics) ||
          (props && props.deviceMetrics && props.deviceMetrics.length === 0)) && */}
        {metricsFromToForm()}
      </div>
      <hr />
      <div
        style={{
          height: '250px',
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {props && props.isMetricsLoading ? (
          <CircularProgress style={{ color: '#F9941C', marginTop: '10%' }} />
        ) : (
          <Bar height={250} data={line} options={options} />
        )}
      </div>
    </div>
  );
};

const mapStateToProps = ({ dashboard, user, location }) => ({
  metrics: dashboard.metrics,
  screenWidth: location.screenWidth,
  isMetricsLoading: dashboard.isMetricsLoading,
  selectedCard: dashboard.selectedCard,
  devicesGridList: dashboard.devicesGridList,
  database: user.database,
  groupFilter: user.groupFilter
});

const mapDispatch = ({ dashboard: { getMetricsAction, selectedDateAction } }) => ({
  getMetrics: getMetricsAction,
  selectedDate: selectedDateAction
});

export default connect(mapStateToProps, mapDispatch)(LineChart);
