export default {
  state: {
    isAddin: false,
    tripFromDate: new Date().toLocaleDateString()
  },
  reducers: {
    isAddin(state, payload) {
      return {
        ...state,
        isAddin: payload
      };
    },
    tripFromDate(state, payload) {
      return {
        ...state,
        tripFromDate: payload
      };
    },
    tripTimes(state, payload) {
      return {
        ...state,
        tripTimes: payload
      };
    },
    style(state, payload) {
      return {
        ...state,
        style: payload
      };
    },
    geotabId(state, payload) {
      return {
        ...state,
        geotabId: payload
      };
    },
    serialNumber(state, payload) {
      return {
        ...state,
        serialNumber: payload
      };
    },
    geotabIdFilter(state, payload) {
      return {
        ...state,
        geotabIdFilter: payload
      };
    },
    bbox(state, payload) {
      return {
        ...state,
        bbox: payload
      };
    },
    zoom(state, payload) {
      return {
        ...state,
        zoom: payload
      };
    }
  },
  effects: (dispatch) => ({
    async setIsAddinAction(payload, rootState) {
      dispatch.addin.isAddin(payload);
    },
    async setTripFromDateAction(payload, rootState) {
      dispatch.addin.tripFromDate(payload);
    },
    async setTripTimesAction(payload, rootState) {
      const list = payload && payload.split(',');
      dispatch.addin.tripTimes(list);
    },
    async setStyleAction(payload, rootState) {
      dispatch.addin.style(payload);
    },
    async setGeotabIdAction(payload, rootState) {
      dispatch.addin.geotabId(payload);
    },
    async setSerialNumberAction(payload, rootState) {
      dispatch.addin.serialNumber(payload);
    },
    async setGeotabIdFilterAction(payload, rootState) {
      dispatch.addin.geotabIdFilter(payload);
    },
    async setIndoorBboxAction(payload, rootState) {
      dispatch.addin.bbox(payload);
    },
    async setIndoorZoomAction(payload, rootState) {
      dispatch.addin.zoom(payload);
    }
  })
};
