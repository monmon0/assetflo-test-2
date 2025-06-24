import axios from '../util/axiosConfig';
import variables from '../variables.json';
import moment from 'moment';
import { handleGroupsParam } from '../util/handleGroups';

const BASE_URL = process.env.REACT_APP_API_URL || variables.BASE_URL;
const DEFAULT_RSSI = -100;

export default {
  state: {},
  reducers: {
    clearConfigurationData(state, payload) {
      return {
        ...state,
        deviceState: '',
        bleDevices: ''
      };
    },
    deviceState(state, payload) {
      return {
        ...state,
        deviceState: payload
      };
    },
    battery(state, payload) {
      return {
        ...state,
        battery: payload
      };
    },
    distributionList(state, payload) {
      return {
        ...state,
        distributionList: payload
      };
    },
    bleDevices(state, payload) {
      return {
        ...state,
        bleDevices: payload
      };
    }
  },
  effects: (dispatch) => ({
    async getDeviceStateAction(payload, rootState) {
      try {
        const { data: devicestate } = await axios.post(`${BASE_URL}/device/getstate`, payload);
        dispatch.configuration.deviceState(devicestate);
        devicestate &&
          devicestate.telemetry &&
          dispatch.configuration.battery(
            devicestate.telemetry.batterylevel !== undefined
              ? devicestate.telemetry.batterylevel
              : devicestate.telemetry.batteryLevel
          );
        return devicestate;
      } catch (error) {
        // console.log(e);
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },

    async resetDeviceStateAction(payload, rootState) {
      dispatch.configuration.deviceState('');
      dispatch.configuration.distributionList('');
    },

    async setDeviceStateAction(payload, rootState) {
      try {
        const selectedRow = rootState.provision.selectedRow;
        if (selectedRow) {
          dispatch.configuration.deviceState(selectedRow);
          selectedRow.telemetry &&
            dispatch.configuration.battery(
              selectedRow.telemetry.batterylevel !== undefined
                ? selectedRow.telemetry.batterylevel
                : selectedRow.telemetry.batteryLevel
            );
        }
      } catch (error) {
        // console.log(e);
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },

    async getDistributionListAction(payload, rootState) {
      try {
        const { data: list } = await axios.post(`${BASE_URL}/notification/distribution/list`, {
          organization: rootState.user.database
        });
        dispatch.configuration.distributionList(list);
      } catch (error) {
        // console.log(e);
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async updateDistributionAction(payload, rootState) {
      try {
        const { status } = await axios.post(`${BASE_URL}/notification/distribution/update`, payload);
        status === 200 &&
          dispatch.notifications.note({
            message: `distribution list successfully updated!`,
            variant: 'success'
          });

        const { data: list } = await axios.post(`${BASE_URL}/notification/distribution/list`, {
          organization: rootState.user.database
        });
        dispatch.configuration.distributionList(list);
      } catch (error) {
        // console.log(e);
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async getBleDevicesAction(payload, rootState) {
      try {
        const params = handleGroupsParam(rootState.user.groups, {
          organization: rootState.user.database,
          deviceType: 'Tag',
          protocol: 'BLE'
        });
        const { data: allDevices } = await axios.post(`${BASE_URL}/device/list`, params).catch((error) => {
          if (error.response) {
            throw error;
            // return dispatch.notifications.note({ message: error.response.data.message });
          }
        });

        const beacons = allDevices.filter((dev) => !dev.isAnchor);

        dispatch.configuration.bleDevices(beacons);
        // return;
      } catch (error) {
        // console.log(error.message);
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async setAttachedBleDevicesAction(payload, rootState) {
      try {
        const { attachTo, attach, detach, goId } = payload || {};
        const requests = attach.map((deviceData) => {
          const { _id, createdAt, ...device } = deviceData;
          return axios
            .post(`${BASE_URL}/device/update`, {
              ...device,
              attachedState: {
                configured: true,
                state: 'Attached',
                time: moment().valueOf(),
                correctionRssi: DEFAULT_RSSI,
                rssi: DEFAULT_RSSI,
                attachedTo: attachTo.deviceId
              }
            })
            .then((res) => res.data);
        });

        detach.map((deviceData) => {
          const { _id, createdAt, ...device } = deviceData;
          requests.push(
            axios
              .post(`${BASE_URL}/device/update`, {
                ...device,
                attachedState: {
                  configured: false,
                  state: 'Detached',
                  time: moment().valueOf(),
                  correctionRssi: DEFAULT_RSSI,
                  rssi: DEFAULT_RSSI,
                  attachedTo: null
                }
              })
              .then((res) => res.data)
          );
        });

        await Promise.all(requests).then((values) => {
          const isError = values.some((res) => !res.deviceId);
          isError
            ? dispatch.notifications.note({
                message: `action failed. Please try again later.`,
                variant: 'warning'
              })
            : dispatch.notifications.note({
                message: `successfully updated!`,
                variant: 'success'
              });
          isError && dispatch.configuration.getBleDevicesAction();
        });

        const id = `virtual-${goId}`;
        const { data } = await axios.post(`${BASE_URL}/iox/update`, {
          organization: rootState.user.database,
          groups: ['GroupCompanyId'],
          goId: goId,
          type: 9999,
          archived: false,
          attached: true,
          channel: 1,
          deviceId: `${rootState.user.database}.${moment().valueOf()}`,
          name: 'Virtual-IOX-' + goId
        });
        // return;
      } catch (error) {
        // console.log(error.message);
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },

    async createVirtualIOXAction(payload, rootState) {
      try {
        const { goId } = payload;
        const id = `virtual-${goId}`;
        const { data } = await axios.post(`${BASE_URL}/iox/update`, {
          organization: rootState.user.database,
          groups: ['GroupCompanyId'],
          goId: goId,
          type: 9999,
          archived: false,
          attached: true,
          channel: 1,
          deviceId: `${rootState.user.database}.${moment().valueOf()}`,
          name: 'Virtual-IOX-' + goId
        });
        // return;
      } catch (error) {
        // console.log(error.message);
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    }
  })
};
