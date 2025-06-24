import axios from '../util/axiosConfig';
import variables from '../variables.json';
import { handleGroupsParam } from '../util/handleGroups';

const BASE_URL = process.env.REACT_APP_API_URL || variables.BASE_URL;

let metricsCach = {};
export default {
  state: {
    selectedDate: 'Today',
    selectedCard: 'utilization',
    devicesGridList: 'today'
  },
  reducers: {
    isDevicesLoading(state, payload) {
      return {
        ...state,
        isDevicesLoading: !!payload
      };
    },
    allFacilityDevices(state, payload) {
      return {
        ...state,
        allFacilityDevices: payload
      };
    },
    metrics(state, payload) {
      return {
        ...state,
        metrics: payload
      };
    },
    deviceMetrics(state, payload) {
      return {
        ...state,
        deviceMetrics: payload
      };
    },
    searchTableResult(state, payload) {
      return {
        ...state,
        searchTableResult: payload
      };
    },
    isMetricsLoading(state, payload) {
      return {
        ...state,
        isMetricsLoading: payload ? payload : false
      };
    },
    selectedDate(state, payload) {
      return {
        ...state,
        selectedDate: payload ? payload : 'Today'
      };
    },
    selectedCard(state, payload) {
      return {
        ...state,
        selectedCard: payload ? payload : 'utilization'
      };
    },
    devicesGridList(state, payload) {
      return {
        ...state,
        devicesGridList: payload ? payload : 'today'
      };
    },
    clearDashboardData(state, payload) {
      metricsCach = {}; // clear cached data
      return {
        ...state,
        deviceMetrics: [],
        searchTableResult: [],
        allFacilityDevices: [],
        metrics: []
      };
    }
  },
  effects: (dispatch) => ({
    async getAllFacilityDevicesAction(payload, rootState) {
      dispatch.dashboard.isDevicesLoading(true);
      // console.log('getAllFacilityDevicesAction');
      try {
        const params = handleGroupsParam(
          rootState.user.groups,
          {
            organization: rootState.user.database
          },
          rootState.user.groupFilter
        );
        const { data: devices } = await axios.post(`${BASE_URL}/device/list`, params).catch((error) => {
          if (error.response) {
            throw error;
            // return dispatch.user.checkUserTokenExpireAction(error.response);
            // return dispatch.notifications.note({ message: error.response.data.message });
          }
        });
        dispatch.dashboard.allFacilityDevices(devices);
        dispatch.dashboard.isDevicesLoading(false);
      } catch (error) {
        dispatch.dashboard.isDevicesLoading(false);
        return dispatch.user.checkUserTokenExpireAction(error.response);

        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async getMetricsAction(payload, rootState) {
      // console.log('metrics from dashboard modal', payload);
      try {
        dispatch.dashboard.isMetricsLoading(true);
        if (metricsCach.hasOwnProperty(payload && payload.fromDate)) {
          // console.log("from cach")
          dispatch.dashboard.metrics(metricsCach[payload.fromDate]);
          dispatch.dashboard.isMetricsLoading(false);
        } else {
          const { data: metrics } = payload
            ? await axios
                .post(`${BASE_URL}/metrics/metrics`, {
                  organization: rootState.user.database,
                  groups: rootState.user.groups,
                  fromDate: payload.fromDate
                })
                .catch((error) => {
                  if (error.response) {
                    throw error;
                    // return dispatch.notifications.note({ message: error.response.data.message });
                  }
                })
            : await axios
                .post(`${BASE_URL}/metrics/metrics`, {
                  organization: rootState.user.database,
                  groups: rootState.user.groups
                })
                .catch((error) => {
                  if (error.response) {
                    throw error;
                    // return dispatch.notifications.note({ message: error.response.data.message });
                  }
                });
          let date = payload && payload.fromDate;
          metricsCach = {
            ...metricsCach,
            ...(date && { [date]: metrics })
          };

          dispatch.dashboard.metrics(metrics);
          dispatch.dashboard.isMetricsLoading(false);
        }
        // console.log("metricsCach", metricsCach)
      } catch (error) {
        // console.log(error);
        return dispatch.user.checkUserTokenExpireAction(error.response);

        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async getMetricsPerDeviceAction(payload, rootState) {
      try {
        const { data: deviceMetrics } = await axios
          .post(`${BASE_URL}/metrics/activedevicemetrics`, payload)
          .catch((error) => {
            if (error.response) {
              throw error;
            }
          });
        dispatch.dashboard.deviceMetrics(deviceMetrics);
      } catch (error) {
        // console.log(e);
        return dispatch.user.checkUserTokenExpireAction(error.response);

        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async getSearchTableResultAction(payload, rootState) {
      dispatch.dashboard.searchTableResult(payload);
    },
    async clearDeviceMetricsAction(payload, rootState) {
      dispatch.dashboard.deviceMetrics([]);
    },
    async selectedDateAction(payload, rootState) {
      dispatch.dashboard.selectedDate(payload);
    },
    async setSelectedCardAction(payload, rootState) {
      dispatch.dashboard.selectedCard(payload);
    },
    async setDevicesGridListAction(payload, rootState) {
      dispatch.dashboard.devicesGridList(payload);
    }
  })
};
