import axios from '../util/axiosConfig';
import variables from '../variables.json';
import moment from 'moment';
import { handleGroupsParam } from '../util/handleGroups';

const BASE_URL = process.env.REACT_APP_API_URL || variables.BASE_URL;

export default {
  state: {
    testCases: [],
    simulatorView: 'management'
  },
  reducers: {
    testCases(state, payload) {
      return {
        ...state,
        testCases: payload || []
      };
    },
    simulatorView(state, payload) {
      return {
        ...state,
        simulatorView: payload
      };
    }
  },
  effects: (dispatch) => ({
    async processTestDataAction(payload, rootState) {
      try {
        console.log(payload);
        const { events, type, deviceToUpdate, attachedState, runLive } = payload;
        const data = {
          eventData: events,
          type: type,
          deviceToUpdate: deviceToUpdate,
          attachedState: attachedState,
          runLive: runLive
        };

        const { resp } = await axios.post(`${BASE_URL}/simulator/process`, data);
        dispatch.notifications.note({
          message: 'events sent!',
          variant: 'success'
        });
      } catch (error) {
        dispatch.notifications.note({
          message: 'request failed!',
          variant: 'warning'
        });
        // console.log(e);
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async fetchTestCasesAction(payload, rootState) {
      try {
        const { data } = await axios.post(`${BASE_URL}/simulator/list`);
        dispatch.simulation.testCases(data);
      } catch (error) {
        dispatch.notifications.note({
          message: 'request failed!',
          variant: 'warning'
        });
        // console.log(e);
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },

    async updateTestCasesAction(payload, rootState) {
      try {
        const { testId, events, type, testName, owner, archived, deviceToUpdate, attachedState } = payload;
        const { data } = await axios.post(`${BASE_URL}/simulator/update`, {
          eventData: events,
          type: type,
          name: testName,
          testId: testId,
          owner: owner,
          archived: archived,
          deviceToUpdate: deviceToUpdate,
          attachedState: attachedState
        });
        this.fetchTestCasesAction();
        dispatch.notifications.note({
          message: 'test case saved!',
          variant: 'success'
        });
      } catch (error) {
        // console.log(e);
        dispatch.notifications.note({
          message: 'request failed!',
          variant: 'warning'
        });
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },

    async setSimulatorViewAction(payload, rootState) {
      dispatch.simulation.simulatorView(payload);
    }
  })
};
