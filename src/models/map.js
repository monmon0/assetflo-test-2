import axios from '../util/axiosConfig';
import L from 'leaflet';
import arraySort from 'array-sort';
import moment from 'moment';
import { updateArrayData } from '../util/updateArray';
import { handleGroupsParam } from '../util/handleGroups';
import variables from '../variables.json';

const BASE_URL = process.env.REACT_APP_API_URL || variables.BASE_URL;

export default {
  state: {
    deviceSelected: '',
    editMood: false,
    wrldMap: '',
    mapboxStyle: 'streets',
    editableMap: 'editableMapbox',
    grid: [],
    distancePoints: [],
    gridHeading: 0,
    isListOpen: false,
    locationPause: false,
    syncFilterWithMap: true,
    searchResult: [],
    wrldMapOnly: false,
    poller: ''
  },
  reducers: {
    syncWithMap(state, payload) {
      return {
        ...state,
        syncFilterWithMap: payload || false
      };
    },
    searchResult(state, payload) {
      return {
        ...state,
        searchResult: payload
      };
    },
    devices(state, payload) {
      return {
        ...state,
        devices: payload
      };
    },
    locators(state, payload) {
      return {
        ...state,
        locators: payload
      };
    },
    tags(state, payload) {
      return {
        ...state,
        tags: payload
      };
    },
    pois(state, payload) {
      return {
        ...state,
        pois: payload || []
      };
    },
    deviceSelected(state, payload) {
      return {
        ...state,
        deviceSelected: payload
      };
    },
    tagsWithMetricsData(state, payload) {
      return {
        ...state,
        tagsWithMetricsData: payload
      };
    },
    metricsData(state, payload) {
      return {
        ...state,
        metrics: payload
      };
    },
    locatorsWithLocTime(state, payload) {
      return {
        ...state,
        locatorsWithLocTime: payload
      };
    },
    mapboxStyle(state, payload) {
      return {
        ...state,
        mapboxStyle: payload
      };
    },
    editableMap(state, payload) {
      return {
        ...state,
        editableMap: payload
      };
    },
    clearMapData(state, payload) {
      return {
        ...state,
        metricsData: [],
        devices: null,
        tagsWithMetricsData: [],
        tags: [],
        pois: null,
        locators: [],
        grid: [],
        searchResult: [],
        deviceSelected: '',
        wrldMap: '',
        mapboxStyle: 'streets',
        currentTrips: [],
        tripEvents: '',
        hideHeaderFooter: false,
        // wrldMapOnly: false,
        poller: ''
      };
    },
    grid(state, payload) {
      return {
        ...state,
        grid: payload
      };
    },
    zones(state, payload) {
      return {
        ...state,
        zones: payload
      };
    },
    distancePoints(state, payload) {
      return {
        ...state,
        distancePoints: payload
      };
    },
    gridHeading(state, payload) {
      return {
        ...state,
        gridHeading: payload
      };
    },
    isListOpen(state, payload) {
      return {
        ...state,
        isListOpen: payload
      };
    },
    locationPause(state, payload) {
      return {
        ...state,
        locationPause: payload
      };
    },
    locationUpdated(state, payload) {
      return {
        ...state,
        locationUpdated: payload
      };
    },
    currentTrips(state, payload) {
      return {
        ...state,
        currentTrips: payload
      };
    },
    tripEvents(state, payload) {
      return {
        ...state,
        tripEvents: payload
      };
    },
    deviceToFollow(state, payload) {
      return {
        ...state,
        deviceToFollow: payload
      };
    },
    hideHeaderFooter(state, payload) {
      return {
        ...state,
        hideHeaderFooter: payload
      };
    },
    wrldMapOnly(state, payload) {
      return {
        ...state,
        wrldMapOnly: payload
      };
    },
    poller(state, payload) {
      return {
        ...state,
        poller: payload
      };
    },
    deviceInit(state, payload) {
      return {
        ...state,
        deviceInit: payload
      };
    }
  },
  effects: (dispatch) => ({
    async getZonesAction(payload, rootState) {
      try {
        const params = handleGroupsParam(rootState.user.groups, {
          organization: rootState.user.database
        });
        const { data: zones } = await axios.post(`${BASE_URL}/zone/list`, params).catch((error) => {
          if (error.response) {
            throw error;
            // return dispatch.notifications.note({ message: error.response.data.message });
          }
        });

        dispatch.map.zones(zones);
        // return;
      } catch (error) {
        // console.log(error.message);
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async getAllDevicesAction(payload, rootState) {
      try {
        const tags = [];
        const locators = [];

        const params = handleGroupsParam(rootState.user.groups, {
          organization: rootState.user.database
          // includeMetrics: true
        });

        // Fetch device states (locations)
        const { data: devicesStates } = await axios.post(`${BASE_URL}/device/states`, params).catch((error) => {
          if (error.response) {
            throw error;
            // return dispatch.notifications.note({ message: error.response.data.message });
          }
        });
        if (!devicesStates) return;

        arraySort(devicesStates, 'assetName');

        // Separate devices into tags and locators
        const deviceMap = new Map();
        devicesStates.forEach((device) => {
          if (!device || !device.deviceId) return;
          if (device.deviceType === 'Tag') tags.push(device);
          else if (device.deviceType === 'Locator') locators.push(device);

          const hasValidLocation = device.location?.lat != null && device.location?.lng != null;
          if (hasValidLocation || !deviceMap.has(device.deviceId)) {
            deviceMap.set(device.deviceId, device);
          }
        });

        // Fetch and process metrics
        this.getMetricsAction({ database: rootState.user.database });

        // Dispatch the cleaned-up device data
        dispatch.map.devices(Array.from(deviceMap.values()));
        dispatch.map.deviceInit(true);
        dispatch.map.tags(tags);
        dispatch.map.locators(locators);
      } catch (error) {
        console.log(error);
        dispatch.map.locationPause(true);
        setTimeout(function () {
          dispatch.map.locationPause(false);
        }, 5 * 60000);
        // console.log(error.message);
        dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async subscribeToLocationPush(payload, rootState) {
      let locationFeed = new EventSource(`${BASE_URL}/location`);
      locationFeed.onerror = function (e) {
        console.log('EventSource failed.');
      };

      let locations = [];
      let sourceListener = function (e) {
        let data = JSON.parse(e.data);
        locations.push(data);
      };
      // TODO: Dispatch here to your properties or a mapping function

      // TODO: Add this code to your container loading/unloading
      // start listening for events
      // locations.addEventListener('locationFeed', sourceListener, false);

      // // stop listening for events
      // locations.removeEventListener('locationFeed', sourceListener, false);
    },

    async getTagsAction(payload, rootState) {
      try {
        if (
          rootState.map.locationPause ||
          !['mapbox', 'wrld3d', 'wrldAddin', 'indoors'].includes(rootState.location.routerLocation) ||
          (payload && rootState.map.poller) // do not create second poller if poller is already active
        )
          return;

        if (document.visibilityState === 'hidden') {
          console.log('Tab Inactive. Pausing updates.');
          setTimeout(() => {
            dispatch.map.getTagsAction();
          }, 5000);
          return;
        }
        let locatorsWithTime = [];
        const params = handleGroupsParam(
          rootState.user.groups,
          {
            organization: rootState.user.database,
            search: {
              fromDate: new Date().valueOf() - 5000 // 5 sec
            }
          },
          rootState.user.groupFilter
        );
        const response = await axios.post(`${BASE_URL}/location/location`, params);
        const { data: tags } = response || {};
        if (!tags) {
          setTimeout(() => {
            // retry in 5sec on null response
            dispatch.map.getTagsAction();
          }, 5000);
          return;
        }

        const locators = rootState.map.locators;
        let oldTags = rootState.map.devices && rootState.map.devices;

        arraySort(tags, 'assetName');

        tags.map((tag) => {
          if (tag.location) {
            tag.location.lat = Number(tag.location.lat);
            tag.location.lng = Number(tag.location.lng);
            tag.location.alt = Number(tag.location.alt);
          }

          tag.location &&
            tag.location.lat &&
            tag.location.lng &&
            tag.locators &&
            tag.locators.map((loc) => {
              loc.locTime = tag.locTime;
              locatorsWithTime.push(loc);
            });
        });

        let updatedTags = tags && oldTags ? updateArrayData(tags, oldTags) : [];

        // console.log(updatedTags);
        //*****this map is to over write some data for testing****

        // updatedTags.map((t) => {
        //   if (t.deviceId === '656100217960') {
        //     t.telemetry.isMoving = 'true';
        //     // t.location.heading = 200;
        //     t.locTime = new Date().valueOf() - 9 * 60 * 1000
        //   }
        // });

        // console.log(locators)

        locators &&
          locators.map((loc) => {
            if (!loc.location) return;
            locatorsWithTime.map((locWithTime) => {
              if (loc.deviceId === locWithTime.locatorId) {
                loc.locTime = locWithTime.locTime;
                // console.log(loc)
                // newLocators.push(loc)
              }
            });
          });
        let oldAllDevice = rootState.map.devices && rootState.map.devices;
        let newAllDevices = locators ? [...updatedTags] : [...updatedTags];

        // update new devices for colapse
        oldAllDevice &&
          oldAllDevice.map((oldDevice) => {
            newAllDevices &&
              newAllDevices.forEach((newDevice) => {
                if (oldDevice.deviceId === newDevice.deviceId) {
                  newDevice.isCollapseOpen = oldDevice.isCollapseOpen;
                }
              });
          });
        if (tags && rootState.map.deviceSelected) {
          const deviceToFollow = tags.find(
            (tag) => tag.deviceId === rootState.map.deviceSelected.deviceId && tag.deviceType === 'Tag'
          );
          dispatch.map.deviceToFollow(deviceToFollow && deviceToFollow);
        }
        dispatch.map.devices(newAllDevices);
        !rootState.map.poller && dispatch.map.poller('created');
        setTimeout(() => {
          dispatch.map.getTagsAction();
        }, 5000);
      } catch (error) {
        // console.log('from tag action', error.response);
        console.log(error);
        dispatch.map.locationPause(true);
        setTimeout(() => {
          dispatch.map.locationPause(false);
          dispatch.map.getTagsAction();
        }, 5 * 60000);
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    handlePopupAction(payload, rootState) {
      try {
        // console.log('handlePopupAction');
        payload.wMap && (payload.wMap._zoom = payload.wMap ? payload.wMap._zoom : 16);
        payload.layout &&
          payload.device &&
          payload.layout.eachLayer((l) => {
            if (l.options.id === payload.device.deviceId) {
              if (payload.showCircle && payload.device.locators && payload.device.deviceType === 'Tag') {
                payload.device.locators.map((locator) => {
                  // @ts-ignore
                  let circle = L.circle([locator.coordinates.lat, locator.coordinates.lng], {
                    color: variables.ORANGE_COLOR,
                    radius: locator.distance,
                    fillOpacity: 0,
                    weight: 1,
                    indoorMapId: l.options.indoorMapId,
                    indoorMapFloorId: 0
                  });
                  payload.circleLayer && payload.circleLayer.getLayers().length >= payload.device.locators.length
                    ? payload.circleLayer.clearLayers() && circle.addTo(payload.circleLayer)
                    : circle.addTo(payload.circleLayer);
                  circle.on('click', () => {
                    circle.remove();
                  });
                });
              }

              if (l.options.indoorMapId) {
                payload.wMap.indoors.enter(l.options.indoorMapId);
              }

              // l.options.indoorMapId
              //   ? payload.wMap &&
              //     payload.wMap.setView([l.options.location.lat, l.options.location.lng]) &&
              //     setTimeout(() => {
              //       console.log('intered1')
              //        payload.wMap.indoors.enter(l.options.indoorMapId);
              //       console.log('intered2')
              //     }, 1000)
              //   : payload.wMap &&
              //   payload.wMap.setView([l.options.location.lat, l.options.location.lng])&&
              //     payload.wMap.indoors.exit() ;
              // setTimeout(function () {
              // }, 500);
              // payload.wMap.setView([lat, lng]);

              l.openPopup();
            }
          });
      } catch (e) {
        console.log(e);
      }
    },
    async getPoisAction(payload, rootState) {
      try {
        // const params = handleGroupsParam(rootState.user.groups, {
        //   organization: rootState.user.database
        // });
        const { data: pois } = await axios
          .post(`${BASE_URL}/poi/find`, {
            organization: rootState.user.database
          })
          .catch((error) => {
            if (error.response) {
              throw error;
            }
          });

        dispatch.map.pois(pois);
      } catch (error) {
        return dispatch.user.checkUserTokenExpireAction(error.response);
      }
    },
    async addAndUpdatePoiAction(payload, rootState) {
      try {
        const { status } = await axios.post(`${BASE_URL}/poi/add`, payload.data).catch((error) => {
          if (error.response) {
            throw error;
            // return dispatch.notifications.note({ message: error.response.data.message });
          }
        });

        status === 200 && dispatch.notifications.note({ message: 'Poi successfully updated', variant: 'success' });

        const params = handleGroupsParam(rootState.user.groups, {
          organization: rootState.user.database
        });
        const { data: pois } = await axios.post(`${BASE_URL}/poi/find`, params).catch((error) => {
          if (error.response) {
            throw error;
            // return dispatch.notifications.note({ message: error.response.data.message });
          }
        });

        dispatch.map.pois(pois);
      } catch (error) {
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async getSearchResultAction(payload, rootState) {
      dispatch.map.searchResult(payload);
    },
    async syncFilterWithMapAction(payload, rootState) {
      dispatch.map.syncWithMap(!rootState.map.syncFilterWithMap);
    },
    async setDeviceSelectedAction(payload, rootState) {
      window.localStorage.setItem(
        `deviceSelected_${rootState.user.database}`,
        JSON.stringify({ ...payload, expiresIn: moment().valueOf() + 86400000 })
      );
      dispatch.map.deviceSelected(payload);
    },
    async setMapboxStyleAction(payload, rootState) {
      dispatch.map.mapboxStyle(payload);
    },
    async setEditableMapAction(payload, rootState) {
      dispatch.map.editableMap(payload);
    },
    async updateSearchResultAction(payload, rootState) {
      if (!payload || (payload && payload.searchResultDevices && payload.searchResultDevices.length === 0)) return;
      const updatedSearch = payload.searchResultDevices?.reduce((acc, cur) => {
        //this condition to not update poi in search list
        if (cur?.deviceId) {
          acc.push(
            rootState.map &&
              rootState.map.devices &&
              rootState.map.devices.filter((d) => d.deviceId === cur.deviceId)[0]
          );
        } else if (cur?.poiId) {
          acc.push(cur);
        }
        return acc;
      }, []);
      dispatch.map.searchResult(updatedSearch);
    },
    async getMetricsAction(payload, rootState) {
      try {
        const tagsWithMetrics = [];
        const oldMetricsData = rootState.map.tagsWithMetricsData || [];
        const resultTags = tagsWithMetrics.length > 0 ? tagsWithMetrics : oldMetricsData;
        dispatch.map.tagsWithMetricsData(resultTags);

        // Old code to get metrics data:
        // const { data: tagsWithMetrics } = await axios
        //   .post(`${BASE_URL}/metrics/metrics`, {
        //     organization: rootState.user.database,
        //     groups: rootState.user.groups
        //     // includeMetrics: true
        //   })
        //   .catch((error) => {
        //     if (error.response) {
        //       throw error;
        //       // return dispatch.notifications.note({ message: error.response.data.message });
        //     }
        //   });
        // if(!tagsWithMetrics) return ;

        // const tagsWithMetrics = [];
        // let deviceWithMetrics = tagsWithMetrics.filter((device) => device.metrics);
        // const oldMetricsData = rootState.map.tagsWithMetricsData || [];
        // const resultTags = tagsWithMetrics.length > 0 ? tagsWithMetrics : oldMetricsData;

        // Dispatch the cleaned-up device data
        // dispatch.map.tagsWithMetricsData(resultTags);
        // dispatch.map.tagsWithMetricsData(tagsWithMetrics);
      } catch (error) {
        // console.log(error.response);
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async getGridBoxAction(payload, rootState) {
      // console.log("grid", payload)
      const { lat, lng } = payload.center;
      // console.log("grid", lat, lng)
      let newGrid = [];
      if (rootState.map.grid.length === 0) {
        let offsetX = 0;
        let offsetY = 0;

        // grid boundaries
        let maxX = lng + 0.00045;
        let minX = lng - 0.00045;
        let maxY = lat + 0.00036;
        let minY = lat - 0.00026;

        // const rawbearing = payload.map.getBearing() % 90;
        // const rawbearing = 0;
        const mapBearing = rootState.map.gridHeading;
        if (mapBearing !== 0) {
          if (mapBearing > 0 && mapBearing < 180) {
            offsetX = (mapBearing / 90) * Math.abs(maxX - minX);
            offsetY = ((mapBearing / 90) * Math.abs(maxY - minY)) / 3;
          }
          newGrid = [minX - offsetX, minY - offsetY, maxX - offsetX, maxY - offsetY];
        } else {
          newGrid = [minX, minY, maxX, maxY];
        }
      }
      dispatch.map.grid(newGrid);
    },
    async setDistancePointsAction(payload, rootState) {
      let updatedDistancePoints = [...rootState.map.distancePoints];

      if (updatedDistancePoints.length < 2 && payload.device.assetName) updatedDistancePoints.push(payload.device);
      dispatch.map.distancePoints(updatedDistancePoints);
    },
    async clearDistancePointsAction(payload, rootState) {
      dispatch.map.distancePoints([]);
    },
    async setIsListOpenAction(payload, rootState) {
      dispatch.map.isListOpen(payload);
    },
    async setGridHeadingAction(payload, rootState) {
      let rawbearing = payload.bearing % 90;

      const angle = rawbearing < 0 ? 90 + rawbearing : rawbearing;
      dispatch.map.gridHeading(angle);
    },
    async sendMobileLocationAction(payload, rootState) {
      try {
        const { status, data: data } = await axios
          .post(`${BASE_URL}/event/mobile`, {
            data: payload
            // includeMetrics: true
          })
          .catch((error) => {
            if (error.response) {
              throw error;
              // return dispatch.notifications.note({ message: error.response.data.message });
            }
          });
        status === 200 && dispatch.notifications.note({ message: 'device location submitted', variant: 'success' });
        dispatch.map.locationUpdated(true);
      } catch (error) {
        // console.log(error.response);
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async getTripHistoryAction(payload, rootState) {
      try {
        const { data: trips } = await axios
          .post(`${BASE_URL}/trip/get`, {
            deviceId: payload.deviceId,
            organization: payload.organization,
            groups: payload.groups,
            isNormalized: payload.isNormalized,
            isGrouped: payload.isGrouped,
            ...(payload.fromDate && { fromDate: payload.fromDate }),
            ...(payload.toDate && { toDate: payload.toDate }),
            ...(payload.minTravel !== undefined && { minTravel: payload.minTravel }),
            ...(payload.minDuration !== undefined && { minDuration: payload.minDuration })
          })
          .catch((error) => {
            if (error.response) {
              throw error;
              // return dispatch.notifications.note({ message: error.response.data.message });
            }
          });

        dispatch.map.currentTrips(trips);
        // console.log(data);
      } catch (error) {
        // console.log(error.response);
        return dispatch.user.checkUserTokenExpireAction(error.response);
        // dispatch.notifications.note({ message: variables.ERROR.NO_SERVER_CONNECTION });
      }
    },
    async setDeviceToFollowAction(payload, rootState) {
      dispatch.map.deviceToFollow(payload);
    },
    async setHideHeaderFooterAction(payload, rootState) {
      try {
        dispatch.map.hideHeaderFooter(payload);
      } catch (error) {}
    },
    async setWrldMapOnlyAction(payload, rootState) {
      dispatch.map.wrldMapOnly(payload);
    },
    async setLocationPauseAction(payload, rootState) {
      dispatch.map.locationPause(payload);
    },
    async clearMapDataAction(payload, rootState) {
      dispatch.user.orgDevicesNumber(undefined);
      dispatch.map.clearMapData();
    }
  })
};
