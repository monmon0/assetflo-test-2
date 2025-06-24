import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Grid, Box, CircularProgress, Divider } from '@mui/material';
import moment from 'moment';

import { totalLiftDataForCard, averageLiftDataForCard } from './liftCardFuncation';
import { utilizationDataForPie, totalUtilizationDataForCard } from './utilizationCardFuncations';
import { todayTotalWorkingHourDataForCard, workingHourDataForCard } from './workingHourCardFuncation';
import LineChart from './LineChart';
import DevicesTable from './Table';
import { filterByGroup, filterDeviceTypeByGroup } from '../../util/filters';

class DashboardCards extends Component {
  state = {
    // displayPieChart: false,
    displayDevicePieChart: false,
    displayUtilizationPieChart: false,
    displayWorkingHoursPieChart: false,
    displayLineChart: false,
    dateSelected: '',
    displayTable: false,
    notActiveLocators: [],
    deviceHasUtilization: [],
    totalUtilization: 0,
    utilization: 0,
    collapsed: false
    // screenWidth: window.innerWidth
  };

  async componentDidMount() {
    let credentials = {
      database: this.props.database
    };
    this.props.getAllFacilityDevices(credentials);
    // this.props.get All Devices(credentials);
    // console.log(credentials);
    // this.props.getMetrics({
    //   fromDate: moment().startOf('day').valueOf()
    // });
    // window.addEventListener("resize", () => {
    //   this.setState({ screenWidth: window.innerWidth });
    // });
  }

  summryCards() {
    const buttomStyleClass = {
      borderRadius: '7px',
      boxShadow: '0 4px 8px 0 rgba(0,0,0,0.15)',
      marginLeft: 'auto',
      marginBottom: '5px',
      marginRight: 'auto',
      cursor: 'pointer',
      textAlign: 'center',
      background: '#FFFFFF',
      padding: '15px'
    };
    const { selectedDate } = this.props;
    return (
      <Grid container style={{ margin: '5px' }}>
        {
          <Box
            width={1}
            onClick={() => {
              this.devicesCard();
            }}
            style={buttomStyleClass}
          >
            <div className="text-value-lg" style={{ color: '#576574' }}>
              Devices
            </div>
            <hr />
            <Box
              className="text-value-sm py-3"
              display="flex"
              style={{ padding: '15px 0' }}
              justifyContent="space-between"
            >
              <Box
                minWidth="24.5%"
                border={0.5}
                borderColor="#CCCDCE"
                padding={1}
                borderRadius="5px"
                style={{
                  background: '#F8931C',
                  color: '#576574'
                }}
              >
                <span>Tags</span>
                <Divider style={{ margin: '0.25rem 0' }} />
                {this.props.isDevicesLoading ? (
                  <CircularProgress size={30} style={{ color: '#E4E5E6', fontSize: '10px' }} />
                ) : (
                  <span style={{ color: '#E4E5E6' }}>
                    {this.props.allFacilityDevices &&
                      (this.props.groupFilter.length > 0
                        ? filterDeviceTypeByGroup(this.props.allFacilityDevices, this.props.groupFilter, 'Tag').length
                        : this.props.allFacilityDevices.filter((device) => device.deviceType === 'Tag').length)}
                  </span>
                )}
              </Box>
              <Box
                width="24.5%"
                border={0.5}
                borderColor="#CCCDCE"
                padding={1}
                borderRadius="5px"
                style={{
                  background: '#F8931C',
                  color: '#576574'
                }}
              >
                Locators
                <Divider style={{ margin: '0.25rem 0' }} />
                {this.props.isDevicesLoading ? (
                  <CircularProgress size={30} style={{ color: '#E4E5E6', fontSize: '10px' }} />
                ) : (
                  <span style={{ color: '#E4E5E6' }}>
                    {this.props.allFacilityDevices &&
                      (this.props.groupFilter.length > 0
                        ? filterDeviceTypeByGroup(this.props.allFacilityDevices, this.props.groupFilter, 'Locator')
                            .length
                        : this.props.allFacilityDevices.filter((device) => device.deviceType === 'Locator').length)}
                  </span>
                )}
              </Box>
              <Box
                width="24.5%"
                border={0.5}
                borderColor="#CCCDCE"
                padding={1}
                borderRadius="5px"
                style={{
                  background: '#F8931C',
                  color: '#576574'
                }}
              >
                Total
                <Divider style={{ margin: '0.25rem 0' }} />
                {this.props.isDevicesLoading ? (
                  <CircularProgress size={30} style={{ color: '#E4E5E6', fontSize: '10px' }} />
                ) : (
                  <span style={{ color: '#E4E5E6' }}>
                    {this.props.allFacilityDevices &&
                      (this.props.groupFilter.length > 0
                        ? filterByGroup(this.props.allFacilityDevices, this.props.groupFilter).length
                        : this.props.allFacilityDevices.length)}
                  </span>
                )}
              </Box>
              <Box
                width="24.5%"
                border={0.5}
                borderColor="#CCCDCE"
                padding={1}
                borderRadius="5px"
                style={{
                  background: '#F8931C',
                  color: '#576574'
                }}
              >
                Active
                <Divider style={{ margin: '0.25rem 0' }} />
                {this.props.isMetricsLoading ? (
                  <CircularProgress size={30} style={{ color: '#E4E5E6', fontSize: '10px' }} />
                ) : (
                  <span style={{ color: '#E4E5E6' }}>
                    {this.props.metrics &&
                      (this.props.groupFilter.length > 0
                        ? filterByGroup(this.props.metrics, this.props.groupFilter).length
                        : this.props.metrics.length)}
                  </span>
                )}
              </Box>
            </Box>
          </Box>
        }
        {
          <Box
            width={1}
            onClick={() => {
              this.utilizationCard();
            }}
            style={buttomStyleClass}
          >
            <div className="text-value-lg" style={{ color: '#576574' }}>
              Utilization
            </div>
            <hr />
            {/* <div className="text-value-sm py-3"> */}
            <Box
              className="text-value-sm py-3"
              display="flex"
              style={{ padding: '15px 0' }}
              justifyContent="space-between"
            >
              {/* <div style={{ color: "#576574" }}> */}
              <Box
                width="49%"
                border={0.5}
                borderColor="#CCCDCE"
                padding={1}
                borderRadius="5px"
                style={{
                  background: '#F8931C',
                  color: '#576574'
                }}
              >
                {selectedDate} <Divider style={{ margin: '0.25rem 0' }} />
                {this.props.isMetricsLoading ? (
                  <CircularProgress size={30} style={{ color: '#E4E5E6', fontSize: '10px' }} />
                ) : (
                  <span style={{ color: '#E4E5E6' }}>
                    {' '}
                    {utilizationDataForPie(
                      this.props.groupFilter && this.props.groupFilter.length > 0
                        ? this.props.metrics && filterByGroup(this.props.metrics, this.props.groupFilter)
                        : this.props.metrics
                    )}
                    %
                  </span>
                )}
              </Box>
              <br />
              <Box
                width="49%"
                border={0.5}
                borderColor="#CCCDCE"
                padding={1}
                borderRadius="5px"
                style={{
                  background: '#F8931C',
                  color: '#576574'
                }}
              >
                Total
                <Divider style={{ margin: '0.25rem 0' }} />
                {this.props.isMetricsLoading ? (
                  <CircularProgress size={30} style={{ color: '#E4E5E6', fontSize: '10px' }} />
                ) : (
                  <span style={{ color: '#E4E5E6' }}>
                    {totalUtilizationDataForCard(
                      this.props.groupFilter && this.props.groupFilter.length > 0
                        ? this.props.metrics && filterByGroup(this.props.metrics, this.props.groupFilter)
                        : this.props.metrics
                    )}
                    %
                  </span>
                )}
              </Box>
            </Box>
          </Box>
        }
        {
          <Grid
            item
            xs={5}
            sm={12}
            id="3"
            onClick={() => {
              this.workingHoursCard();
            }}
            style={buttomStyleClass}
          >
            <div className="text-value-lg" style={{ color: '#576574' }}>
              Work Hours
            </div>
            <hr />
            <Box
              className="text-value-sm py-3"
              display="flex"
              style={{ padding: '15px 0' }}
              justifyContent="space-between"
            >
              <Box
                width="49%"
                border={0.5}
                borderColor="#CCCDCE"
                padding={1}
                borderRadius="5px"
                style={{
                  background: '#F8931C',
                  color: '#576574'
                }}
              >
                {selectedDate} <Divider style={{ margin: '0.25rem 0' }} />
                {this.props.isMetricsLoading ? (
                  <CircularProgress size={30} style={{ color: '#E4E5E6', fontSize: '10px' }} />
                ) : (
                  <span style={{ color: '#E4E5E6' }}>
                    {todayTotalWorkingHourDataForCard(
                      null,
                      this.props.groupFilter && this.props.groupFilter.length > 0
                        ? this.props.metrics && filterByGroup(this.props.metrics, this.props.groupFilter)
                        : this.props.metrics
                    )}{' '}
                    H
                  </span>
                )}
              </Box>
              <Box
                width="49%"
                border={0.5}
                borderColor="#CCCDCE"
                padding={1}
                borderRadius="5px"
                style={{
                  background: '#F8931C',
                  color: '#576574'
                }}
              >
                Total <Divider style={{ margin: '0.25rem 0' }} />
                {this.props.isMetricsLoading ? (
                  <CircularProgress size={30} style={{ color: '#E4E5E6', fontSize: '10px' }} />
                ) : (
                  <span style={{ color: '#E4E5E6' }}>
                    {workingHourDataForCard(
                      null,
                      this.props.groupFilter && this.props.groupFilter.length > 0
                        ? this.props.metrics && filterByGroup(this.props.metrics, this.props.groupFilter)
                        : this.props.metrics
                    )}{' '}
                    H
                  </span>
                )}
              </Box>
            </Box>
          </Grid>
        }

        <Grid
          item
          xs={6}
          sm={12}
          id="4"
          onClick={() => {
            this.liftCard();
          }}
          style={buttomStyleClass}
        >
          <div className="text-value-lg" style={{ color: '#576574' }}>
            Lift
          </div>
          <hr />
          <Box className="text-value-sm" display="flex" style={{ padding: '15px 0' }} justifyContent="space-between">
            <Box
              width="49%"
              border={0.5}
              borderColor="#CCCDCE"
              padding={1}
              borderRadius="5px"
              style={{
                background: '#F8931C',
                color: '#576574'
              }}
            >
              {selectedDate} <Divider style={{ margin: '0.25rem 0' }} />
              {this.props.isMetricsLoading ? (
                <CircularProgress size={30} style={{ color: '#E4E5E6', fontSize: '10px' }} />
              ) : (
                <span style={{ color: '#E4E5E6' }}>
                  {totalLiftDataForCard(
                    this.props.groupFilter && this.props.groupFilter.length > 0
                      ? this.props.metrics && filterByGroup(this.props.metrics, this.props.groupFilter)
                      : this.props.metrics
                  )}{' '}
                  lifts
                </span>
              )}
            </Box>
            <Box
              width="49%"
              border={0.5}
              borderColor="#E4E5E6"
              padding={1}
              borderRadius="5px"
              style={{
                background: '#F8931C',
                color: '#576574'
              }}
            >
              Average
              <Divider style={{ margin: '0.25rem 0' }} />
              {this.props.isMetricsLoading ? (
                <CircularProgress size={30} style={{ color: '#E4E5E6', fontSize: '10px' }} />
              ) : (
                <span style={{ color: '#E4E5E6' }}>
                  {averageLiftDataForCard(
                    this.props.groupFilter.length > 0
                      ? this.props.metrics && filterByGroup(this.props.metrics, this.props.groupFilter)
                      : this.props.metrics
                  )}{' '}
                  lifts
                </span>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>
    );
  }

  devicesCard() {
    this.props && this.props.setSelectedCard('devices');
    this.props.getMetrics();
  }

  utilizationCard() {
    this.props.setSelectedCard('utilization');
  }

  workingHoursCard() {
    this.props.setSelectedCard('workHours');
  }

  liftCard() {
    this.props.setSelectedCard('lift');
  }

  // toggleNavbar = () => this.setState({ collapsed: !this.state.collapsed });

  render() {
    return (
      <div>
        <Grid container style={{ width: '100%', marginBottom: '50px', marginLeft: '0px' }}>
          <Grid item xs={12} sm={3} md={3}>
            {this.summryCards()}
          </Grid>
          <Grid item xs={12} sm={9} md={9}>
            {this.props.selectedCard !== 'devices' && <LineChart />}
            <DevicesTable />
          </Grid>
        </Grid>
      </div>
    );
  }
}
const mapStateToProps = ({ dashboard, map, location, user }) => ({
  metrics: dashboard.metrics,
  map,
  devices: map.devices,
  locators: map.locators,
  tags: map.tags,
  routerLocation: location.routerLocation,
  fullScreen: location.fullScreen,
  allFacilityDevices: dashboard.allFacilityDevices,
  selectedDate: dashboard.selectedDate,
  selectedCard: dashboard.selectedCard,
  isMetricsLoading: dashboard.isMetricsLoading,
  isDevicesLoading: dashboard.isDevicesLoading,
  database: user.database,
  groupFilter: user.groupFilter
});

const mapDispatch = ({
  dashboard: { getMetricsAction, getAllFacilityDevicesAction, setSelectedCardAction },
  location: { renderComponentAction, fullScreenAction }
}) => ({
  getMetrics: getMetricsAction,
  getAllFacilityDevices: getAllFacilityDevicesAction,
  renderComponent: renderComponentAction,
  fullScreenAction: fullScreenAction,
  setSelectedCard: setSelectedCardAction
});

export default connect(mapStateToProps, mapDispatch)(DashboardCards);
