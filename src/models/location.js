export default {
  state: {
    isSplitScreen: false,
    showAdvanceTool: false,
    showCircle: false,
    distanceMeasurementSelected: false,
    filterType: 'Tag',
    showGrid: false,
    expandIndoorSize: false,
    filter: ['Tag', 'IOX']
  },
  reducers: {
    renderedComponent(state, payload) {
      return {
        ...state,
        routerLocation: payload
      };
    },
    fullScreen(state, payload) {
      return {
        ...state,
        fullScreen: payload ? payload : false
      };
    },
    screenWidth(state, payload) {
      return {
        ...state,
        screenWidth: payload ? payload : window.innerWidth
      };
    },
    isSplitScreen(state, payload) {
      return {
        ...state,
        isSplitScreen: payload
      };
    },
    showAdvanceTool(state, payload) {
      return {
        ...state,
        showAdvanceTool: !state.showAdvanceTool
      };
    },
    showCircle(state, payload) {
      return {
        ...state,
        showCircle: !state.showCircle
      };
    },
    showGrid(state, payload) {
      return {
        ...state,
        showGrid: !state.showGrid
      };
    },
    distanceMeasurementSelected(state, payload) {
      return {
        ...state,
        distanceMeasurementSelected: !state.distanceMeasurementSelected
      };
    },
    filterType(state, payload) {
      return {
        ...state,
        filterType: payload
      };
    },
    filter(state, payload) {
      return {
        ...state,
        filter: payload
      };
    },
    expandIndoorSize(state, payload) {
      return {
        ...state,
        expandIndoorSize: payload || false
      };
    },
    clearLocationData(state, payload) {
      return {
        ...state,
        isSplitScreen: false,
        showAdvanceTool: false,
        showCircle: false,
        distanceMeasurementSelected: false,
        filterType: 'Tag',
        showGrid: false,
        expandIndoorSize: false,
        filter: ['Tag', 'IOX'],
        screenWidth: window.innerWidth
      };
    }
  },
  effects: (dispatch) => ({
    async renderComponentAction(payload, rootState) {
      try {
        rootState.map.currentTrips && rootState.map.currentTrips.length > 0 && dispatch.map.currentTrips([]);
        dispatch.map.searchResult([]);

        payload &&
          payload !== 'errorpage' &&
          payload !== 'configuration' &&
          payload !== 'rules' &&
          payload !== 'draggable' &&
          window.sessionStorage.setItem(`routerLocation_${rootState.user.database}`, payload);

        if (!['mapbox', 'wrld3d'].includes(payload)) dispatch.map.poller('');

        payload && dispatch.location.renderedComponent(payload);
      } catch (e) {
        console.log(e);
      }
    },
    async fullScreenAction(payload, rootState) {
      dispatch.location.fullScreen(payload);
    },
    async screenWidthAction(payload, rootState) {
      dispatch.location.screenWidth(payload);
    },
    async setIsSplitScreenAction(payload, rootState) {
      dispatch.location.isSplitScreen(payload);
    },
    async setShowAdvanceToolAction(payload, rootState) {
      dispatch.location.showAdvanceTool();
    },
    async setShowCircleAction(payload, rootState) {
      dispatch.location.showCircle();
    },
    async setShowGridAction(payload, rootState) {
      dispatch.location.showGrid();
    },
    async setDistanceMeasurementSelectedAction(payload, rootState) {
      dispatch.location.distanceMeasurementSelected();
    },
    async setFilterTypeAction(payload, rootState) {
      dispatch.location.filterType(payload);
    },
    async setFilterAction(payload, rootState) {
      let filter = [...rootState.location.filter];
      const index = filter.indexOf(payload);
      if (index < 0) {
        filter.push(payload);
      } else {
        filter.length === 1 ? (filter = ['Tag']) : filter.splice(index, 1);
      }
      dispatch.location.filter(filter);
      window.localStorage.setItem(`deviceTypeFilter_${rootState.user.database}`, JSON.stringify(filter));
      if (filter.indexOf(rootState.map.deviceSelected.deviceType) === -1) {
        dispatch.map.deviceSelected('');
      }
    },
    async initFilterAction(payload, rootState) {
      dispatch.location.filter(payload);

      if (payload.indexOf(rootState.map.deviceSelected.deviceType) === -1) {
        dispatch.map.deviceSelected('');
      }
    },
    async setExpandIndoorSizeAction(payload, rootState) {
      dispatch.location.expandIndoorSize(payload.expand);
      payload.mapbox && payload.mapbox.resize();
    }
  })
};
