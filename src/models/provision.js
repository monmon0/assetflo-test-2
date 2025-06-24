import axios from '../util/axiosConfig';
import variables from '../variables.json';
import { handleGroupsParam } from '../util/handleGroups';
import { updateDevice, updateConfig, updateDevices, bulkUpdateDevices } from '../util/transformer';

const BASE_URL = process.env.REACT_APP_API_URL || variables.BASE_URL;

export default {
  state: {
    provisionType: 'Tag',
    error: '',
    selectedRow: {},
    selectedDeviceList: [],
    selectedTenant: {},
    userTenant: {},
    states: []
  },
  reducers: {
    isProvisionLoading(state, payload) {
      return {
        ...state,
        isProvisionLoading: payload ? payload : false
      };
    },
    provisionType(state, payload) {
      return {
        ...state,
        provisionType: payload
      };
    },
    fullScreen(state, payload) {
      return {
        ...state,
        fullScreen: payload ? payload : false
      };
    },
    provisionDevices(state, payload) {
      return {
        ...state,
        provisionDevices: payload
      };
    },
    checkedDevicesList(state, payload) {
      return {
        ...state,
        checkedDevicesList: payload
      };
    },
    adminCheckedDevicesList(state, payload) {
      return {
        ...state,
        adminCheckedDevicesList: payload
      };
    },
    clearProvisionData(state, payload) {
      return {
        ...state,
        provisionType: 'Tag',
        provisionDevices: [],
        deviceConfigList: [],
        deviceCalibrationList: [],
        allTenants: [],
        deviceConfig: '',
        selectedTenant: {},
        userTenant: {},
        selectedRow: '',
        deviceCalibraiton: '',
        bleLocatorConfig: '',
        lastDeviceStatus: '',
        firmwareList: '',
        tableSearch: '',
        myAdminAccount: '',
        digAccount: '',
        myAdminPushResponse: '',
        ioxDevice: '',
        geotabDevices: '',
        geotabGroupVehicleId: ''
      };
    },
    provisionError(state, payload) {
      return {
        ...state,
        provisionError: payload
      };
    },
    allTenants(state, payload) {
      return {
        ...state,
        allTenants: payload
      };
    },
    deviceCalibration(state, payload) {
      return {
        ...state,
        deviceCalibration: payload
      };
    },
    bleLocatorConfig(state, payload) {
      return {
        ...state,
        bleLocatorConfig: payload
      };
    },
    deviceConfig(state, payload) {
      return {
        ...state,
        deviceConfig: payload
      };
    },
    deviceCalibrationList(state, payload) {
      return {
        ...state,
        deviceCalibrationList: payload
      };
    },
    requestStatus(state, payload) {
      return {
        ...state,
        requestStatus: payload || {}
      };
    },
    tablePage(state, payload) {
      return {
        ...state,
        tablePage: payload || 0
      };
    },
    selectedRow(state, payload) {
      return {
        ...state,
        selectedRow: payload || {}
      };
    },
    selectedDeviceList(state, payload) {
      return {
        ...state,
        selectedDeviceList: payload || []
      };
    },
    selectedTenant(state, payload) {
      return {
        ...state,
        selectedTenant: payload || {}
      };
    },
    userTenant(state, payload) {
      return {
        ...state,
        userTenant: payload || {}
      };
    },
    firmwareList(state, payload) {
      return {
        ...state,
        firmwareList: payload || ''
      };
    },
    lastDeviceStatus(state, payload) {
      return {
        ...state,
        lastDeviceStatus: payload || ''
      };
    },
    tableSearch(state, payload) {
      return {
        ...state,
        tableSearch: payload || ''
      };
    },
    myAdminAccount(state, payload) {
      return {
        ...state,
        myAdminAccount: payload
      };
    },
    digAccount(state, payload) {
      return {
        ...state,
        digAccount: payload
      };
    },
    myAdminPushResponse(state, payload) {
      return {
        ...state,
        myAdminPushResponse: payload
      };
    },
    ioxDevice(state, payload) {
      return {
        ...state,
        ioxDevice: payload
      };
    },
    geotabDevices(state, payload) {
      return {
        ...state,
        geotabDevices: payload
      };
    },
    geotabGroupVehicleId(state, payload) {
      return {
        ...state,
        geotabGroupVehicleId: payload
      };
    },
    states(state, payload) {
      return {
        ...state,
        states: payload
      };
    },
    tableOrderByCollection(state, payload) {
      return {
        ...state,
        tableOrderByCollection: payload || []
      };
    }
  },
  effects: (dispatch) => ({
    async setProvisionTypeAction(payload, rootState) {
      dispatch.provision.provisionType(payload);
    },
    async setTableSearchAction(payload, rootState) {
      dispatch.provision.tableSearch(payload);
    },
    async getDeviceDataAction(payload, rootState) {
      try {
        const { data } = await axios.post(`${BASE_URL}/device/find`, payload).catch((error) => {
          if (error.response) {
            throw error;
            // return dispatch.notifications.note({ message: error.response.data.message });
          }
        });
        return data;
      } catch (error) {
        // console.log(e);
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async updateDeviceDataAction(payload, rootState) {
      // console.log(' payload', payload);
      const { database, token, _id, ...updatedPayload } = payload;

      try {
        const { status, data } = await axios.post(`${BASE_URL}/device/update`, updatedPayload).catch((error) => {
          if (error.response) {
            throw error;
            // return dispatch.notifications.note({ message: error.response.data.message });
          }
        });

        this.updateGeotab(updatedPayload, rootState);

        status === 200 &&
          !updatedPayload.archived &&
          dispatch.notifications.note({
            message: `device successfully ${updatedPayload.archived ? 'deleted' : 'updated'}!`,
            variant: 'success'
          });

        const devices = updateDevice(data, rootState.provision.states);
        dispatch.provision.selectedRow({ ...rootState.selectedRow, ...data });
        // dispatch.dashboard.allFacilityDevices(devices);
        dispatch.provision.states(devices || []);
      } catch (error) {
        // console.log(e);
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },

    async updateGeotab(payload, rootState) {
      try {
        const wasDetached =
          rootState.provision.selectedRow &&
          (!rootState.provision.selectedRow.attachedState ||
            rootState.provision.selectedRow.attachedState.state === 'Detached');
        const becameAttached =
          payload.attachedState && payload.attachedState.state === 'Attached' && payload.attachedState.configured;

        console.log('update geotab name', wasDetached && becameAttached, payload.assetName, payload.geotabId);
        if (payload.serialNo && wasDetached && becameAttached) {
          const { geoStatus, geoData } = await axios
            .post(`${BASE_URL}/device/updateOnMyGeotab`, {
              assetName: payload.assetName,
              geotabId: payload.geotabId
            })
            .catch((error) => {
              if (error.response) {
                throw error;
                // return dispatch.notifications.note({ message: error.response.data.message });
              }
            });
        }
      } catch (error) {
        // console.log(e);
        throw error;
      }
    },
    async updateProvisionDeviceAction(payload, rootState) {
      try {
        // console.log("update prov device", payload)
        //?token=${payload.token}
        // console.log("updateProvisionDeviceAction", payload)
        let updatedPayload = { ...payload };
        delete updatedPayload.token;
        delete updatedPayload.database;

        // console.log("payload", payload)
        console.log('updatedPayload', updatedPayload);

        const { status } = await axios.post(`${BASE_URL}/provision/update`, updatedPayload).catch((error) => {
          if (error.response) {
            throw error;
            // return dispatch.notifications.note({ message: error.response.data.message });
          }
        });
        status === 200 && dispatch.notifications.note({ message: 'device successfully updated', variant: 'success' });

        const { data: devices } = await axios
          .post(`${BASE_URL}/provision/list`, { ...(payload.database && { organization: payload.database }) })
          .catch((error) => {
            if (error.response) {
              throw error;
            }
          });
        dispatch.provision.provisionDevices(devices);
      } catch (error) {
        return dispatch.user.checkUserTokenExpireAction(error.response);
      }
    },
    async deleteDeviceDataAction(payload, rootState) {
      try {
        console.log(payload);
        payload.device.uuid = payload.device.deviceId;
        payload.device.archived = true;
        const { status: status, data } = await axios
          .post(`${BASE_URL}/device/update`, payload.device)
          .catch((error) => {
            if (error.response) {
              throw error;
            }
          });
        // console.log('status', status);
        status === 200 && dispatch.notifications.note({ message: 'device successfully deleted', variant: 'success' });
        const devices = updateDevice(data, rootState.provision.states);
        dispatch.dashboard.allFacilityDevices(devices);
        dispatch.provision.states(devices || []);
      } catch (error) {
        return dispatch.user.checkUserTokenExpireAction(error.response);
      }
    },

    async getProvisionDevicesAction(payload, rootState) {
      try {
        // ?token=${payload.token}    NOTE: api not working when add token to the parmas
        // console.log(payload);
        dispatch.provision.isProvisionLoading(true);
        const { data: devices } = await axios
          .post(`${BASE_URL}/provision/list`, { ...(payload.database && { organization: payload.database }) })
          .catch((error) => {
            if (error.response) {
              throw error;
            }
          });

        // devices.map(device => device.checkSelected = false)
        dispatch.provision.provisionDevices(devices);
        dispatch.provision.isProvisionLoading(false);
      } catch (error) {
        return dispatch.user.checkUserTokenExpireAction(error.response);
      }
    },
    async checkSelectedAction(payload, rootState) {
      try {
        let devices = rootState.provision.provisionDevices;
        devices.map((device) => {
          if (device.deviceId === payload.device.deviceId) {
            device.checkSelected = payload.checkSelected;
          }
        });
        let checkedDevicesList = devices.filter((device) => device.checkSelected === true);
        // console.log(checkedDevicesList);
        dispatch.provision.provisionDevices(devices);
        dispatch.provision.checkedDevicesList(checkedDevicesList);
      } catch (e) {
        console.log(e);
      }
    },
    async adminTableSelectedRowsAction(payload, rootState) {
      try {
        // console.log(payload)
        dispatch.provision.checkedDevicesList(payload);
      } catch (e) {
        console.log(e);
      }
    },
    async assignOrganizationAction(payload, rootState) {
      try {
        console.log(payload);
        dispatch.provision.isProvisionLoading(true);

        const { status } = await axios.post(`${BASE_URL}/provision/batchupdate`, payload).catch((error) => {
          if (error.response) {
            throw error;
            // return dispatch.notifications.note({ message: error.response.data.message });
          }
        });

        status === 200 &&
          dispatch.notifications.note({
            message: `Devices assigned to ${payload.organization} successfully`,
            variant: 'success'
          });

        const { data: devices } = await axios
          .post(`${BASE_URL}/provision/list`, { ...(payload.database && { organization: payload.database }) })
          .catch((error) => {
            if (error.response) {
              throw error;
            }
          });
        devices.map((device) => (device.checkSelected = false));
        dispatch.provision.provisionDevices(devices);
        dispatch.provision.checkedDevicesList([]);
        dispatch.provision.isProvisionLoading(false);
      } catch (error) {
        return dispatch.user.checkUserTokenExpireAction(error.response);
      }
    },

    async getAllTenantsAction(payload, rootState) {
      try {
        const { data: allTenants } = await axios.post(`${BASE_URL}/tenant/list`, { active: true }).catch((error) => {
          if (error.response) {
            throw error;
          }
        });
        dispatch.provision.allTenants(allTenants);
      } catch (error) {
        return dispatch.user.checkUserTokenExpireAction(error.response);
      }
    },
    async findAndUpdateTenantAction(payload, rootState) {
      try {
        // console.log('add And Update Tenant Action', payload);
        const { data: updatedTenant, status: status } = await axios
          .post(`${BASE_URL}/tenant/update`, payload)
          .catch((error) => {
            if (error.response) {
              throw error;
            }
          });
        status === 200 &&
          dispatch.notifications.note({
            message: `Tenant successfully ${payload.archived ? 'deleted' : 'updated'}!`,
            variant: 'success'
          });
        dispatch.provision.selectedTenant(updatedTenant);

        const { data: allTenants } = await axios.post(`${BASE_URL}/tenant/list`, { active: true });
        dispatch.provision.allTenants(allTenants);
      } catch (error) {
        return dispatch.user.checkUserTokenExpireAction(error.response);
      }
    },

    async getAllDeviceCalibrationAction(payload, rootState) {
      try {
        const { data: deviceCalibrationList } = await axios
          .post(`${BASE_URL}/calibration/list`, {
            organization: rootState.user.database
          })
          .catch((error) => {
            if (error.response) {
              throw error;
            }
          });
        dispatch.provision.deviceCalibrationList(deviceCalibrationList);
      } catch (error) {
        return dispatch.user.checkUserTokenExpireAction(error.response);
      }
    },
    async getDeviceCalibrationAction(payload, rootState) {
      try {
        const { data: deviceCalibration } = await axios
          .post(`${BASE_URL}/calibration/get`, {
            deviceId: payload.device.deviceId,
            formatResponse: false,
            organization: rootState.user.database
          })
          .catch((error) => {
            if (error.response) {
              throw error;
            }
          });
        dispatch.provision.deviceCalibration(deviceCalibration);
      } catch (error) {
        return dispatch.user.checkUserTokenExpireAction(error.response);
      }
    },
    async setDeviceCalibrationAction(payload, rootState) {
      dispatch.provision.deviceCalibration(payload);
    },
    async updateDeviceCalibrationAction(payload, rootState) {
      try {
        if (rootState.location.routerLocation === 'configurationAddin') {
          dispatch.notifications.position(payload.position);
        }

        const { data: deviceCalibration, status: status } = await axios
          .post(`${BASE_URL}/calibration/update`, payload.device)
          .catch((error) => {
            if (error.response) {
              throw error;
              // return dispatch.notifications.note({ message: error.response.statusText });
            }
          });
        !payload.isCreate &&
          status === 200 &&
          dispatch.notifications.note({
            message: 'successfully updated!',
            variant: 'success'
          });

        dispatch.provision.deviceCalibration(deviceCalibration);
      } catch (error) {
        return dispatch.user.checkUserTokenExpireAction(error.response);
      }
    },
    async updateMultipleDeviceCalibrationAction(payload, rootState) {
      try {
        const { status: status } = await axios
          .post(`${BASE_URL}/calibration/multipleupdate?organization=${payload.database}`, payload.data)
          .catch((error) => {
            if (error.response) {
              throw error;
              // return dispatch.notifications.note({ message: error.response.statusText });
            }
          });
        status === 200 &&
          dispatch.notifications.note({
            message: 'successfully updated!',
            variant: 'success'
          });

        await this.getDeviceCalibrationAction(
          {
            device: rootState.provision.selectedRow
          },
          rootState
        );
        // dispatch.provision.deviceConfig(deviceConfig);
      } catch (error) {
        return dispatch.user.checkUserTokenExpireAction(error.response);
      }
    },
    async setTablePageAction(payload, rootState) {
      dispatch.provision.tablePage(payload);
    },
    async setSelectedRowAction(payload, rootState) {
      dispatch.provision.selectedRow(payload);
    },
    async setSelectedDeviceListAction(payload, rootState) {
      dispatch.provision.selectedDeviceList(payload);
    },
    async getConfigAction(payload, rootState) {
      try {
        const { data: deviceConfig } = await axios
          .post(`${BASE_URL}/configuration/get`, payload.data)
          .catch((error) => {
            if (error.response) {
              throw error;
            }
          });
        dispatch.provision.deviceConfig(deviceConfig);
      } catch (error) {
        return dispatch.user.checkUserTokenExpireAction(error.response);
      }
    },
    async getLocatorConfigAction(payload, rootState) {
      try {
        const { data: locatorConfig } = await axios
          .post(`${BASE_URL}/configuration/getCombinedProfile`, payload.data)
          .catch((error) => {
            if (error.response) {
              throw error;
              // return dispatch.notifications.note({ message: error.response.statusText });
            }
          });
        dispatch.provision.bleLocatorConfig(locatorConfig.blePart);
        dispatch.provision.deviceConfig(locatorConfig.mainPart);
      } catch (error) {
        return dispatch.user.checkUserTokenExpireAction(error.response);
      }
    },
    async resetConfigurationAction(payload, rootState) {
      dispatch.provision.selectedDeviceList('');
      dispatch.provision.deviceConfig('');
      dispatch.provision.bleLocatorConfig('');
      dispatch.provision.deviceCalibration('');
    },

    async updateDeviceConfigAction(payload, rootState) {
      try {
        //update device config
        const { data: deviceConfig, status: status } = await axios
          .post(`${BASE_URL}/configuration/update`, payload.data)
          .catch((error) => {
            if (error.response) {
              throw error;
              // return dispatch.user.checkUserTokenExpireAction(error.response);
              // return dispatch.notifications.note({ message: error.response.statusText });
            }
          });
        status === 200 &&
          dispatch.notifications.note({
            message: 'configuration successfully updated!',
            variant: 'success'
          });
        const devices = updateConfig(payload.data, deviceConfig, rootState.provision.states);
        // update table list
        // dispatch.dashboard.allFacilityDevices(devices);
        dispatch.provision.states(devices || []);

        // dispatch config
        if (deviceConfig.protocol === 'BLE' && deviceConfig.deviceType === 'Locator') {
          dispatch.provision.bleLocatorConfig(deviceConfig);
        } else {
          const profile = payload.data.profile;
          dispatch.provision.deviceConfig({ ...deviceConfig, profile: { ...profile, ...deviceConfig.profile } });
        }
        dispatch.provision.selectedRow({
          ...rootState.provision.selectedRow,
          configurationId: deviceConfig.configurationId
        });
        return deviceConfig.configurationId;
      } catch (error) {
        dispatch.notifications.note({
          message: 'request failed. please try again later.',
          variant: 'warning'
        });
        return dispatch.user.checkUserTokenExpireAction(error.response);
      }
    },
    async setServiceAccountAction(payload, rootState) {
      try {
        // set service account
        const { status, data: tenant } = await axios
          .post(`${BASE_URL}/tenant/serviceAccount`, payload)
          .catch((error) => {
            if (error.response) {
              console.log(error.response, error.message);
              if (error.response.data.type === 'Not Accepted') {
                return dispatch.notifications.note({ message: error.response.data.message });
              }
              return dispatch.notifications.note({ message: 'WRONG CREDENTIALS' });
            }
          });

        status === 200 && rootState.user.database === tenant.organization && dispatch.provision.selectedTenant(tenant);

        status === 200 &&
          dispatch.notifications.note({
            message: 'successfully updated!',
            variant: 'success'
          });
        // dispatch.provision.deviceConfig(deviceConfig);
      } catch (e) {
        dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async setMyAdminDigAccountAction(payload, rootState) {
      try {
        // set service account
        const { status, data: account } = await axios
          .post(`${BASE_URL}/geopush/updateAccount`, payload)
          .catch((error) => {
            if (error.response) {
              console.log(error.response, error.message);
              if (error.response.data.type === 'Not Accepted') {
                return dispatch.notifications.note({ message: error.response.data.message });
              }
              return dispatch.notifications.note({ message: 'WRONG CREDENTIALS' });
            }
          });

        status === 200 &&
          !account.error &&
          dispatch.notifications.note({
            message: 'successfully updated!',
            variant: 'success'
          });

        account.error &&
          dispatch.notifications.note({
            message: 'WRONG CREDENTIALS'
          });

        payload.type === 'dig'
          ? dispatch.provision.digAccount(account.UserId)
          : dispatch.provision.myAdminAccount(account.userName);
        // dispatch.provision.deviceConfig(deviceConfig);
      } catch (e) {
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async getMyAdminDigAccountAction(payload, rootState) {
      try {
        // set service account
        const { data: account } = await axios.post(`${BASE_URL}/geopush/serviceaccount`, payload).catch((error) => {
          if (error.response) {
            console.log(error.response, error.message);
            return dispatch.notifications.note({ message: error.response.data.message });
          }
        });

        payload.accountType === 'myAdminSession' &&
          account.myAdminSession &&
          dispatch.provision.myAdminAccount(account.userName);
        payload.accountType === 'digSession' && account.digSession && dispatch.provision.digAccount(account.userName);
        // dispatch.provision.deviceConfig(deviceConfig);
      } catch (e) {
        dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async setSelectedTenantAction(payload, rootState) {
      dispatch.provision.selectedTenant(payload);
    },
    async getUserTenantAction(payload, rootState) {
      try {
        const { data: tenant } = await axios
          .post(`${BASE_URL}/tenant/find`, {
            active: true,
            organization: rootState.user.database
          })
          .catch((error) => {
            if (error.response) {
              throw error;
              // return dispatch.user.checkUserTokenExpireAction(error.response);
              // return dispatch.notifications.note({ message: error.response.data.message });
            }
          });

        dispatch.provision.selectedTenant(tenant);
        if (!tenant.organization && payload.isAddin) {
          dispatch.notifications.setErrorPageMessageAction(variables.ERROR.NO_ORGANIZATION_FOUND);
          dispatch.location.renderComponentAction('errorpage');
        }
      } catch (error) {
        return dispatch.user.checkUserTokenExpireAction(error.response);
      }
    },
    async getUserTenantActivationAction(payload, rootState) {
      try {
        const { data: tenant } = await axios
          .post(`${BASE_URL}/tenant/find`, {
            active: true,
            organization: rootState.user.database
          })
          .catch((error) => {
            if (error.response) {
              // return dispatch.user.checkUserTokenExpireAction(error.response);
              throw error;
              // return dispatch.notifications.note({ message: error.response.data.message });
            }
          });
        if (!tenant) return;
        dispatch.provision.userTenant(tenant);

        tenant.subscriptions && tenant.subscriptions.wrldMapOnly && dispatch.map.wrldMapOnly(true);
        return tenant;
      } catch (error) {
        // console.log(e);
        return dispatch.user.checkUserTokenExpireAction(error.response);
      }
    },
    async activateTenantAction(payload, rootState) {
      try {
        await axios.get(`${BASE_URL}/tenant/activate?organization=${payload.organization}`).catch((error) => {
          if (error.response) {
            throw error;
          }
        });

        const { data: tenant } = await axios
          .post(`${BASE_URL}/tenant/find`, {
            active: true,
            organization: rootState.user.database
          })
          .catch((error) => {
            if (error.response) {
              throw error;
            }
          });
        dispatch.provision.userTenant(tenant);
      } catch (error) {
        return dispatch.user.checkUserTokenExpireAction(error.response);
      }
    },
    async getFirmwareListAction(payload, rootState) {
      try {
        const { data } = await axios.post(`${BASE_URL}/firmware/list`, payload.query);
        dispatch.provision.firmwareList(data);
      } catch (error) {
        dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async resetFirmwareAndStatusAction(payload, rootState) {
      try {
        dispatch.provision.firmwareList('');
        dispatch.provision.lastDeviceStatus([]);
      } catch (error) {
        dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },

    async uploadNewFirmwareAction(payload, rootState) {
      try {
        const { status, data } = await axios.post(`${BASE_URL}/firmware/upload`, payload.multipartRequest);
        status === 200 &&
          dispatch.notifications.note({
            message: 'Firmware successfully created!',
            variant: 'success'
          });

        dispatch.provision.getFirmwareListAction({ query: {} });
      } catch (error) {
        dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },

    async updateExistingFirmwareAction(payload, rootState) {
      try {
        const { status, data } = await axios.post(`${BASE_URL}/firmware/update?id=${payload.firmwareId}`, payload);
        status === 200 &&
          dispatch.notifications.note({
            message: 'Firmware successfully updated!',
            variant: 'success'
          });
        dispatch.provision.getFirmwareListAction({ query: {} });
      } catch (error) {
        console.log(error, error.code);
        dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },

    async deleteFirmwareAction(payload, rootState) {
      try {
        const { status, data } = await axios.post(`${BASE_URL}/firmware/delete`, payload);
        status === 200 &&
          dispatch.notifications.note({
            message: 'Firmware successfully deleted!',
            variant: 'success'
          });
        dispatch.provision.getFirmwareListAction({ query: {} });
      } catch (error) {
        dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },

    async getLastDeviceStatusAction(payload, rootState) {
      try {
        const { data } = await axios.post(`${BASE_URL}/status/get`, payload.query);
        dispatch.provision.lastDeviceStatus((data.length > 0 && data) || '');
      } catch (error) {
        dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async updateDeviceBatchAction(payload, rootState) {
      try {
        const { status } = await axios.post(`${BASE_URL}/device/batchupdate`, payload);
        status === 200 &&
          dispatch.notifications.note({
            message: `devices successfully updated!`,
            variant: 'success'
          });
        const devices = updateDevices(payload, rootState.provision.states);

        console.log('updateDeviceBatchAction', payload, devices);
        dispatch.provision.states(devices);
      } catch (error) {
        console.log(error);
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },

    async updateDeviceBulkAction(payload, rootState) {
      try {
        const { status } = await axios.post(`${BASE_URL}/device/bulkupdate`, payload);
        status === 200 &&
          dispatch.notifications.note({
            message: `devices successfully updated!`,
            variant: 'success'
          });

        const devices = bulkUpdateDevices(payload.updates, rootState.provision.states);

        dispatch.provision.states(devices);
      } catch (error) {
        console.log(error);
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },

    async provisionGoDeviceAction(payload, rootState) {
      try {
        const { status, data } = await axios.post(`${BASE_URL}/geopush/myadminpush`, payload);
        status === 200 &&
          dispatch.notifications.note({
            message: `devices successfully updated!`,
            variant: 'success'
          });

        // const { data: devices } = await axios.post(`${BASE_URL}/device/list`, {
        //   organization: rootState.user.database,
        //   groups: rootState.user.groups
        // });
        // console.log("updated devices", devices);
        dispatch.provision.myAdminPushResponse({ ...data, status: status });
      } catch (error) {
        // console.log(e);
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },

    async getGeotabDevicesAction(payload, rootState) {
      try {
        const { status, data } = await axios.post(`${BASE_URL}/device/geotabList`, payload);
        // console.log(data);
        dispatch.provision.geotabDevices(data);
      } catch (error) {
        console.log(error);
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },

    async getGeotabGroupVehicleIdAction(payload, rootState) {
      try {
        const { status, data } = await axios.post(`${BASE_URL}/device/geotabList`, payload);
        // console.log(data);
        dispatch.provision.geotabGroupVehicleId(data);
      } catch (error) {
        console.log(error);
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },

    async provisionToMyAdminAction(payload, rootState) {
      try {
        dispatch.dashboard.isDevicesLoading(true);
        const { status, data } = await axios.post(`${BASE_URL}/device/addToGeotab`, payload);
        status === 200 &&
          data.serialNo &&
          dispatch.notifications.note({
            message: `devices successfully provisioned!`,
            variant: 'success'
          });

        if (!data.serialNo) {
          dispatch.notifications.note({
            message: `Failed to provision device. Please try again later.`,
            variant: 'warning'
          });
        } else {
          const { assetTypeGroup, ...updated } = payload;
          const devices = updateDevice(
            { ...updated, serialNo: data.serialNo, isPush: true },
            rootState.provision.states
          );
          dispatch.provision.states(devices);
        }

        dispatch.dashboard.isDevicesLoading(false);
      } catch (error) {
        console.log('error obj', error);
        dispatch.dashboard.isDevicesLoading(false);
        dispatch.notifications.note({
          message: error?.response?.data?.message || `Failed to provision device. Please try again later.`,
          variant: 'warning'
        });
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },

    async updateGeotabVinAndOdometerAction(payload, rootState) {
      try {
        // send DIG requests to update VIN and odometer
        const { status, data } = await axios.post(`${BASE_URL}/device/updateGeotab`, payload);
        status === 200 &&
          data.serialNo &&
          dispatch.notifications.note({
            message: `VIN and/or odometer successfully updated!`,
            variant: 'success'
          });

        if (!data.serialNo) {
          dispatch.notifications.note({
            message: `Failed to update VIN or odometer. Please try again later.`,
            variant: 'warning'
          });
        }
      } catch (error) {
        dispatch.notifications.note({
          message: `Failed to provision device. Please try again later.`,
          variant: 'warning'
        });
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },

    async relinkSerialNoAction(payload, rootState) {
      try {
        const { toAssign, toRemove, archive } = payload;
        if (toAssign.connectors && !toAssign.connectors.includes('DIG')) {
          toAssign.connectors.push('DIG');
        }
        const newName = toAssign.assetName.includes('previous ')
          ? toAssign.assetName.replace('previous ', '')
          : toAssign.assetName;
        const toAssignObj = {
          ...toAssign,
          assetName: newName,
          serialNo: toRemove.serialNo,
          isPush: true,
          connectors: toAssign.connectors || ['DIG']
        };
        const assignSn = axios.post(`${BASE_URL}/device/update`, toAssignObj);

        const prevName = toRemove.assetName.includes('previous')
          ? toRemove.assetName
          : 'previous ' + toRemove.assetName;
        const toRemoveObj = {
          ...toRemove,
          assetName: prevName,
          serialNo: null,
          geotabId: null,
          isPush: false,
          connectors: [],
          ...(archive && { archived: true }),
          ...(toRemove.vin && { vin: null }),
          ...(toRemove.unitId && { unitId: null })
        };
        const removeSn = axios.post(`${BASE_URL}/device/update`, toRemoveObj);

        await Promise.all([assignSn, removeSn]).then((values) => {
          if (values[0].data && values[1].data) {
            dispatch.notifications.note({
              message: `devices successfully relinked!`,
              variant: 'success'
            });
          } else {
            dispatch.notifications.note({
              message: `Failed to relink devices. Please try again later.`,
              variant: 'warning'
            });
          }
        });
        // console.log('status', status);
        let devices = updateDevice(toAssignObj, rootState.provision.states);
        devices = updateDevice(toRemoveObj, devices);
        devices = devices.filter((dev) => !dev.archived);
        dispatch.provision.states(devices);
      } catch (error) {
        console.log(error);
        dispatch.notifications.note({
          message: `Failed to relink devices. Please try again later.`,
          variant: 'warning'
        });
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async getIOXAction(payload, rootState) {
      try {
        const { data } = await axios.post(`${BASE_URL}/iox/get`, { goId: payload });
        dispatch.provision.ioxDevice(data || {});
      } catch (error) {
        // console.log(e);
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },

    async getDeviceStatesAction(payload, rootState) {
      try {
        dispatch.dashboard.isDevicesLoading(true);
        const { data } = await axios.post(`${BASE_URL}/device/states`, { organization: rootState.user.database });

        const deviceMap = new Map();

        // Process each device once
        data.forEach((device) => {
          const hasValidLocation = device.location && device.location.lat != null && device.location.lng != null;

          if (!deviceMap.has(device.deviceId) || hasValidLocation) {
            deviceMap.set(device.deviceId, device);
          }
        });

        const filteredData = Array.from(deviceMap.values());

        dispatch.provision.states(filteredData || []);
        dispatch.dashboard.isDevicesLoading(false);
      } catch (error) {
        // console.log(e);
        dispatch.dashboard.isDevicesLoading(false);
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async updateMultipleDevicesAction(payload, rootState) {
      try {
        const { status } = await axios.post(`${BASE_URL}/device/bulkupdate`, { updates: payload });
        if (status !== 200) {
          throw new Error('Failed to update multiple devices');
        }

        dispatch.notifications.note({
          message: 'Devices successfully updated!',
          variant: 'success'
        });
        const devices = bulkUpdateDevices(payload, rootState.provision.states);

        dispatch.provision.states(devices);
      } catch (error) {
        console.error('Error updating multiple devices:', error);
        dispatch.notifications.note({ message: error.response?.data?.message || 'Failed to update multiple devices' });
        return dispatch.user.checkUserTokenExpireAction(error.response);
      }
    },
    async setTableOrderByCollectionAction(payload, rootState) {
      dispatch.provision.tableOrderByCollection(payload);
    }
  })
};
