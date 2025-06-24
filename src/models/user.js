import axios from '../util/axiosConfig';
import { setAuthToken } from '../util/axiosConfig';
import variables from '../variables.json';

const BASE_URL = process.env.REACT_APP_API_URL || variables.BASE_URL;

export default {
  state: {
    database: '',
    error: '',
    loginType: '',
    email: '',
    role: '',
    firstTimeLogin: false,
    geotabFeaturePreviewUI: false,
    isUserLoading: false,
    groupFilter: [],
    group: null,
    groups: null,
    groupObjects: null,
    geotabFeaturePreviewUI: false,
    token: ''
  },
  reducers: {
    geotabUser(state, payload) {
      return {
        ...state,
        ...payload
      };
    },
    error(state, payload) {
      return {
        ...state,
        error: payload
      };
    },
    logout(state, payload) {
      return {
        ...state,
        loginType: null,
        geotabUser: null,
        email: null,
        token: null,
        adminDatabase: null,
        database: null,
        role: null,
        userPermissions: null,
        group: null,
        groups: null,
        groupFilter: [],
        groupObjects: null,
        eula: null,
        // devicesNumber: null,
        firstTimeLogin: false,
        showInstructions: false
      };
    },
    isUserLoading(state, payload) {
      return {
        ...state,
        isUserLoading: !!payload
      };
    },
    groupFilter(state, payload) {
      return {
        ...state,
        groupFilter: payload
      };
    },
    groups(state, payload) {
      return {
        ...state,
        groups: payload || []
      };
    },
    groupObjects(state, payload) {
      return {
        ...state,
        groupObjects: payload || []
      };
    },
    showInstructions(state, payload) {
      return {
        ...state,
        showInstructions: payload
      };
    },
    orgDevicesNumber(state, payload) {
      return {
        ...state,
        orgDevicesNumber: payload
      };
    },
    geotabFeaturePreviewUI(state, payload) {
      return {
        ...state,
        geotabFeaturePreviewUI: payload
      };
    }
  },
  effects: (dispatch) => ({
    async verifygeotabAction(payload, rootState) {
      try {
        // console.log(payload);
        const { data } = await axios.post(`${BASE_URL}/account/verifygeotab`, payload).catch((error) => {
          if (error.response) {
            return dispatch.notifications.note({ message: error.response.data.message });
          }
        });
        if (!data) return;
        if (data.code === 422) return dispatch.notifications.note({ message: data.data });
        setAuthToken(data.token);

        const groups = await axios
          .post(`${BASE_URL}/group/tree`, {
            organization: data.database.toLowerCase(),
            groups: [data.group]
          })
          .catch((error) => {
            if (error.response) {
              return dispatch.notifications.note({ message: error.response.data.message });
            }
          });
        const groupIds = Object.keys(groups.data);
        const groupsObj = Object.values(groups.data);

        dispatch.user.groups(groupIds);
        dispatch.user.groupObjects(groupsObj);

        data.loginType = 'verifyGeotabAddinAccount';
        data.database = payload.database.toLowerCase();
        dispatch.user.geotabUser(data);
        // dispatch.user.geotabFeaturePreviewUI(data.geotabPreference.isLatestUI);
        dispatch.user.geotabFeaturePreviewUI(true);
        console.log('verifyGEotab', rootState.addin.isAddin);
        !rootState.addin.isAddin && window.localStorage.setItem(`af_token_${data.database}`, JSON.stringify(data));
      } catch (error) {
        dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async getGroupsAction(payload, rootState) {
      try {
        const groups = await axios
          .post(`${BASE_URL}/group/tree`, {
            organization: payload.database.toLowerCase(),
            groups: [payload.group]
          })
          .catch((error) => {
            if (error.response) {
              return dispatch.notifications.note({ message: error.response.data.message });
            }
          });
        // clear session
        dispatch.map.clearMapData();
        dispatch.dashboard.clearDashboardData();
        dispatch.provision.clearProvisionData();
        dispatch.location.clearLocationData();
        dispatch.configuration.clearConfigurationData();

        // clear group filter from local storage
        window.localStorage.setItem(`groupFilter_${rootState.user.database}`, JSON.stringify([]));

        // update with new session
        dispatch.provision.getUserTenantActivationAction();
        const groupIds = Object.keys(groups.data);
        const groupsObj = Object.values(groups.data);

        let data = {
          ...rootState.user,
          groupFilter: [],
          groups: groupIds,
          groupObjects: groupsObj,
          adminDatabase: rootState.user.adminDatabase || rootState.user.database,
          database: payload.database.toLowerCase()
        };

        // console.log('getGroupsAction', data);

        dispatch.user.geotabUser(data);

        window.localStorage.setItem(`af_token_${data.database}`, JSON.stringify(data));
        window.localStorage.setItem(`af_db`, data.database);
      } catch (error) {
        dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async logintogeotabAction(payload, rootState) {
      try {
        // console.log(payload);
        let userInput = {
          userName: payload.email.toLowerCase(),
          database: payload.database.toLowerCase(),
          password: payload.password
        };
        console.log('URL', BASE_URL);
        const { data: resp } = await axios.post(`${BASE_URL}/account/logintogeotab`, userInput).catch((error) => {
          if (error.response) {
            console.log('error from login', error.response);
            if (error.response.status === 422)
              return dispatch.notifications.note({
                message: (error.response.data && error.response.data.data) || 'Request failed'
              });
            return dispatch.notifications.note({ message: error.response.data.message });
          }
        });
        if (!resp) return;
        // console.log("data from login",data);
        if (resp.code === 422) return dispatch.notifications.note({ message: resp.data });

        // console.log(data);
        // if (!data.roles) data.roles = "admin";
        setAuthToken(resp.token);

        const data = {
          ...resp,
          ...(resp.userRole && { ...resp.userRole })
        };

        const groups = await axios
          .post(`${BASE_URL}/group/tree`, {
            organization: data.database.toLowerCase(),
            groups: [data.group]
          })
          .catch((error) => {
            if (error.response) {
              return dispatch.notifications.note({ message: error.response.data.message });
            }
          });
        const groupIds = Object.keys(groups.data);
        const groupsObj = Object.values(groups.data);

        dispatch.user.groups(groupIds);
        dispatch.user.groupObjects(groupsObj);

        data.loginType = 'loginWithGeotabAccount';
        data.database = payload.database.toLowerCase();
        dispatch.user.geotabUser(data);

        window.localStorage.setItem(`af_token_${data.database}`, JSON.stringify(data));
        window.localStorage.setItem(`af_db`, data.database);
      } catch (error) {
        dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async loginFromStorageAction(payload, rootState) {
      let data = {
        token: payload.token,
        database: payload.database,
        adminDatabase: payload.adminDatabase,
        email: payload.email,
        role: payload.role,
        userPermissions: payload.userPermissions,
        loginType: 'loginFromStorageToken',
        group: payload.group,
        eula: payload.eula,
        firstTimeLogin: payload.firstTimeLogin
      };
      setAuthToken(payload.token);
      dispatch.user.geotabUser(data);

      try {
        const groups = await axios.post(`${BASE_URL}/group/tree`, {
          organization: payload.database.toLowerCase(),
          groups: [payload.group]
        });
        // .catch((error) => {
        //   console.log(error, ' --- ', error.response);
        //   if (error.response) {
        //     return dispatch.notifications.note({ message: error.response.data.message });
        //   }
        //   this.checkUserTokenExpireAction(error.response);
        // });
        const groupIds = Object.keys(groups.data);
        const groupsObj = Object.values(groups.data);
        dispatch.user.groups(groupIds);
        dispatch.user.groupObjects(groupsObj);
      } catch (e) {
        // console.log(e.response);
        this.checkUserTokenExpireAction(e.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async logoutAction(payload, rootState) {
      // console.log("logout");
      dispatch.user.logout();
      dispatch.map.clearMapData();
      dispatch.dashboard.clearDashboardData();
      dispatch.provision.clearProvisionData();
      dispatch.location.clearLocationData();
      dispatch.configuration.clearConfigurationData();
      setAuthToken(null);
      // window.localStorage.removeItem(`af_token_${data.database}`);
      // window.localStorage.removeItem('groupFilter');
      window.localStorage.clear();
      // window.HubSpotConversations && window.HubSpotConversations.clear({ resetWidget: true });
      // window.userlike && window.userlike.deleteCookies();
      // console.log(window.userlike)
      // window.userlike && window.userlike.userlikeQuitChat();
    },
    async assetfloLoginAction(payload, rootState) {
      try {
        const { data } = await axios.post(`${BASE_URL}/account/login`, payload).catch((error) => {
          if (error.response) {
            return dispatch.notifications.note({ message: error.response.data.message });
          }
        });
        if (!data) return;
        if (data.code === 422) return dispatch.notifications.note({ message: data.data });

        setAuthToken(data.token);

        const groups = await axios
          .post(`${BASE_URL}/group/tree`, {
            organization: data.database.toLowerCase(),
            groups: [data.group]
          })
          .catch((error) => {
            if (error.response) {
              return dispatch.notifications.note({ message: error.response.data.message });
            }
          });
        const groupIds = Object.keys(groups.data);
        const groupsObj = Object.values(groups.data);

        dispatch.user.groups(groupIds);
        dispatch.user.groupObjects(groupsObj);

        data.loginType = 'loginFromAssetfloAccount';
        dispatch.user.geotabUser(data);
        window.localStorage.setItem(`af_token_${data.database}`, JSON.stringify(data));
        window.localStorage.setItem(`af_db`, data.database);
      } catch (error) {
        console.log(error.message, error);
        dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async assetfloRegisterAction(payload, rootState) {
      try {
        // console.log('register', payload);
        dispatch.user.isUserLoading(true);
        const { status } = await axios.post(`${BASE_URL}/account/register`, payload).catch((error) => {
          if (error.response) {
            return dispatch.notifications.note({ message: error.response.data.message });
          }
        });
        dispatch.user.isUserLoading(false);
        status === 200 && dispatch.location.renderedComponent('assetflologin');
      } catch (error) {
        if (error.response) {
          dispatch.user.isUserLoading(false);
          dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
        }
      }
    },
    async setGroupFilterAction(payload, rootState) {
      const selectedDeviceGroups = rootState.map.deviceSelected && rootState.map.deviceSelected.groups;
      if (selectedDeviceGroups && payload.groupList.length > 0) {
        let belongsToGroups = payload.groupList.find((group) => {
          return selectedDeviceGroups.some((deviceGroup) => {
            return deviceGroup === group;
          });
        });
        if (!belongsToGroups) {
          dispatch.map.deviceSelected('');
        }
      }
      dispatch.user.groupFilter(payload.groupList);
    },
    async setAddinGroupFilterAction(payload, rootState) {
      try {
        if (payload.groupList.length === 0) return dispatch.user.groupFilter([]);
        const { data } = await axios
          .post(`${BASE_URL}/group/tree`, {
            organization: rootState.user.database,
            groups: payload.groupList
          })
          .catch((error) => {
            if (error.response) {
              return dispatch.notifications.note({ message: error.response.data.message });
            }
          });
        dispatch.user.groupFilter(Object.keys(data));
      } catch (error) {
        dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async checkEulaAction(payload, rootState) {
      try {
        const { data: user } = await axios.get(`${BASE_URL}/account/accepteula`).catch((error) => {
          if (error.response) {
            return dispatch.notifications.note({ message: error.response.data.message });
          }
        });
        if (!user) return;
        let updatedUser = {
          ...rootState.user,
          eula: user.eula
        };
        dispatch.user.geotabUser(updatedUser);

        !rootState.addin.isAddin &&
          window.localStorage.setItem(`af_token_${updatedUser.database}`, JSON.stringify(updatedUser));
        return user;
      } catch (error) {
        dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async setFirstTimeLoginAction(payload, rootState) {
      try {
        const user = { ...rootState.user };
        if (!user) return;
        let updatedUser = {
          ...user,
          firstTimeLogin: payload
        };
        dispatch.user.geotabUser(updatedUser);

        !rootState.addin.isAddin &&
          window.localStorage.setItem(`af_token_${updatedUser.database}`, JSON.stringify(updatedUser));
      } catch (error) {
        dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async checkDevicesNumberAction(payload, rootState) {
      try {
        const { data: devicesNumber } = await axios.get(`${BASE_URL}/device/check`).catch((error) => {
          if (error.response) {
            return dispatch.notifications.note({ message: error.response.data.message });
          }
        });
        dispatch.user.orgDevicesNumber(devicesNumber);
        return devicesNumber;
      } catch (error) {
        dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async setShowInstructionsAction(payload, rootState) {
      try {
        dispatch.user.showInstructions(payload);
      } catch (error) {}
    },
    async checkUserTokenExpireAction(payload, rootState) {
      // console.log('checkUserTokenExpireAction', payload, rootState);
      let error = payload;
      const loginType = rootState.user.loginType;
      // console.log(loginType);
      if (
        error &&
        ((error.data && error.data.code === 401 && error.data.type === 'INVALID_TOKEN') ||
          error.data.code === 403 ||
          error.status === 401 ||
          error.status === 403)
      ) {
        if (loginType === 'loginFromStorageToken' || loginType === 'loginWithGeotabAccount') {
          dispatch.user.logoutAction();
          dispatch.location.renderComponentAction('geotablogin');
        }
        if (loginType === 'verifyGeotabAddinAccount') {
          let localStoregData = window.localStorage.getItem(`sTokens_${window.location.href.split('/')[3]}`);
          let parsedData;
          if (localStoregData) {
            // this.props.renderComponent("wrld3d");
            parsedData = JSON.parse(localStoregData);
            let payload = {
              server: window.location.host,
              userName: parsedData.userName.toLowerCase(),
              database: parsedData.database.toLowerCase(),
              sessionId: parsedData.sessionId
            };
            await this.verifygeotabAction(payload);
          }
        }

        return dispatch.notifications.note({ message: 'Your session has been expired!' });
      }
    }
  })
};
