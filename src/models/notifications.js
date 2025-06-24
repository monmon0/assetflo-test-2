import axios from '../util/axiosConfig';
import variables from '../variables.json';

const BASE_URL = process.env.REACT_APP_API_URL || variables.BASE_URL;

export default {
  state: {
    note: { message: '', variant: '' },
    errorPageMessage: ''
  },
  reducers: {
    note(state, payload) {
      return {
        ...state,
        note: {
          message: payload.message,
          variant: payload.variant
        }
      };
    },
    position(state, payload) {
      return {
        ...state,
        position: payload || 0
      };
    },
    errorPageMessage(state, payload) {
      return {
        ...state,
        errorPageMessage: payload
      };
    },
    clearNotificationsData(state, payload) {
      return {
        ...state,
        note: { message: '', variant: '' }
      };
    }
  },
  effects: (dispatch) => ({
    async clearNotificationsAction(payload, rootState) {
      dispatch.notifications.clearNotificationsData();
    },
    async setNoteAction(payload, rootState) {
      // console.log('notifications', payload);
      dispatch.notifications.note(payload);
    },
    async setErrorPageMessageAction(payload, rootState) {
      // console.log('notifications', payload);
      dispatch.notifications.errorPageMessage(payload);
    },
    async logWebErrorAction(payload, rootState) {
      try {
        const device = ['mapbox', 'wrld3d', 'wrldAddin'].includes(rootState.location.routerLocation)
          ? rootState.map.deviceSelected
          : rootState.provision.selectedRow;
        const errorData = {
          deviceId: device.deviceId || 'web',
          isError: true,
          error: 'Web Error',
          page: rootState.location.routerLocation,
          stack: payload.stack ? JSON.stringify(payload.stack) : 'Unidentified',
          user: rootState.user.email,
          database: rootState.user.database
        };

        // console.log('logWebErrorAction', errorData);
        const data = await axios.post(`${BASE_URL}/logs/add`, errorData).catch((error) => {
          if (error.response) {
            console.log('error', error, error.response);
            // throw error;
            // return dispatch.notifications.note({ message: error.response.data.message });
          }
        });

        // return;
      } catch (error) {
        console.log(error.message);
        // return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    }
  })
};
