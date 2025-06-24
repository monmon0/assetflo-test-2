import React, { useEffect, useState, useRef, useCallback } from 'react';
import Map, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import WebMercatorViewport from 'viewport-mercator-project';
import { connect } from 'react-redux';
import moment from 'moment';
import * as turf from '@turf/turf';
import '../../App.scss';
import variables from '../../variables.json';
import Loader from './Loader';
import ListAndMarkersContainer from './ListAndMarkersContainer';
import SwitchMapButton from './SwitchMapButton';
import NavigationButtons from './NavigationButtons';
import Markers from './Markers';
import GpsQuality from './GpsQuality';
import DevicePopup from './DevicePopup';
import LocatorCircles from './LocatorCircles';
import ZoneLayer from './Zones';
import DistanceInfo from './DistanceInfo';
import { filterByGroup } from '../../util/filters';
import { iconColor } from '../../util/statusColor';
import { isValidLocation } from '../../util/validation';
import usePrevious from '../../hooks/usePrevious';
import IndoorOutdoorSwitch from '../IndoorMap/IndoorOutdoorSwitch';

const STAGING_URL = variables.STAGING_URL_IMAGE;
const PRODUCTION_URL = variables.PRODUCTION_URL_IMAGE;

const tagIconMoving =
  process.env.NODE_ENV === 'production'
    ? PRODUCTION_URL + variables.TAG_ICON_MOVING
    : STAGING_URL + variables.TAG_ICON_MOVING;

let geocoder, mainLayer;

const Mapbox = (props) => {
  const [viewState, setViewState] = useState({
    zoom: 3,
    longitude: variables.DEFAULT_MAP_CENTER[0],
    latitude: variables.DEFAULT_MAP_CENTER[1],
    maxZoom: 22
  });

  const [inCluster, setInCluster] = useState(false);
  const [zone, setZone] = useState('');
  const intervalDevices = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const prevProps = usePrevious(props);
  const [timer, setTimer] = useState(moment().valueOf());

  const geotabResizeStyle = () => {
    // fix extra css left in geotab addin
    if (props.loginType === 'verifyGeotabAddinAccount') {
      let resizeEl = document.querySelector('.centerPane');
      let geotabMenu = document.querySelector('.menuCollapsed');
      if (!geotabMenu && resizeEl) {
        if (props.screenWidth >= 950) {
          resizeEl.style = !props.geotabFeaturePreviewUI ? 'left:235px; top: 40px' : 'left: 265px; top: 50px';
        } else {
          resizeEl.style = !props.geotabFeaturePreviewUI ? 'left:235px; top: 40px' : 'left: 0px; top: 50px';
        }
      } else if (geotabMenu && resizeEl) {
        resizeEl.style = !props.geotabFeaturePreviewUI ? 'left:35px; top: 40px' : 'left:48px; top: 50px';
      }
      mapRef.current && mapRef.current.resize();
    }
  };

  const getAllDevicesBoundingBox = (devices) => {
    let points = [];
    devices.map((device) => {
      if (device.deviceType === 'Tag' && device.location && isValidLocation(device.location)) {
        points.push(turf.point([device.location.lng, device.location.lat]));
      }
    });
    if (points.length === 0) return;
    // get center
    const bbox = turf.bbox(turf.featureCollection(points));
    return bbox;
  };

  const renderBuilding = (pois) => {
    if (!pois) return;
    if (props.groupFilter.length > 0) {
      pois = filterByGroup(pois, props.groupFilter);
    }
    if (props.searchResult && props.searchResult.length > 0 && props.syncFilterWithMap) {
      let searchPoi = props.searchResult.filter((result) => result?.poiId);
      //  console.log(searchPoi);
      if (searchPoi.length === 0) return;
    }

    return (
      pois &&
      pois.map((poi) => {
        // console.log(device);
        return (
          mapRef.current &&
          poi.location &&
          poi.location.lat &&
          poi.location.lng && (
            <Marker
              // draggable={true}
              key={poi.location.lat}
              latitude={poi.location.lat}
              longitude={poi.location.lng}
              anchor="bottom"
              onClick={() => {
                // props.screenWidth >= 1000 && handleBuildingClicked(poi);
              }}
            >
              <img style={{ width: '60px', height: '60px', cursor: 'pointer' }} src={variables.BUILDINGS_ICON} />
            </Marker>
          )
        );
      })
    );
  };

  const handleMarkerSelected = useCallback(
    async (evt, device) => {
      const { originalEvent } = evt;
      originalEvent.preventDefault();
      originalEvent.stopPropagation();
      if (!device) return;
      // advancedTool: measure enabled
      if (props.distanceMeasurementSelected) {
        props.setDistancePoints({ device: device });
      }
      // fly to selected marker
      const currentZoom = mapRef?.current && mapRef.current.getZoom();
      if (mapRef?.current && mapRef.current.getZoom() < 15) {
        const zoom = currentZoom < 15 ? 17 : currentZoom;
        setViewState({ latitude: device.location.lat, longitude: device.location.lng, zoom: zoom });
      }
      // set selected device
      props.setDeviceSelected(device);
    },
    [props.distanceMeasurementSelected, props.setDistancePoints, props.setDeviceSelected]
  );

  const handleClosePopup = () => {
    // props.setIsSplitScreen(false);
    // props.openIndoor({ displayIndoor: 'none' });

    // mapRef.current && mapRef.current.resize();
    props.setDeviceSelected('');
  };

  // const displayGrid = () => {
  //   const geojsonStyles = {
  //     linePaint: {
  //       'line-color': variables.ORANGE_COLOR,
  //       'line-width': 1,
  //       'line-opacity': 1
  //     }
  //   };
  //   let cellSide = 0.002;
  //   let opts = { units: 'kilometers' };
  //   let squareGrid = turf.squareGrid(props.grid, cellSide, opts);

  //   const rotatedGrid = turf.featureCollection(
  //     squareGrid.features.map((feature) =>
  //       turf.transformRotate(feature, props.gridHeading, {
  //         pivot: [props.grid[2], props.grid[1]],
  //         mutate: true
  //       })
  //     )
  //   );
  //   return <GeoJSONLayer {...geojsonStyles} data={squareGrid} />;
  // };

  const onHover = useCallback((event) => {
    // get hover layer features
    const { features, lngLat: loc } = event;
    const layer = features && features[0];

    setZone(
      layer && {
        id: layer.properties.zoneId,
        name: layer.properties.zoneName,
        location: {
          lat: loc.lat,
          lng: loc.lng
        }
      }
    );
  }, []);

  const handleMove = useCallback((evt) => {
    setViewState(evt.viewState || evt.viewPort);
  }, []);

  const renderMapBox = () => {
    const wrldOnly = props.loginType === 'verifyGeotabAddinAccount' && props.wrldMapOnly;
    let userTenant = props.userTenant;
    if (userTenant.organization !== props.database) {
      const selectedTenant = props.allTenants && props.allTenants.find((t) => t.organization === props.database);
      selectedTenant && (userTenant = selectedTenant);
    }
    const currentDevice =
      props.devices &&
      props.deviceSelected &&
      props.devices.find((device) => device.deviceId === props.deviceSelected.deviceId);

    return (
      <>
        <Map
          ref={mapRef}
          {...viewState}
          mapboxAccessToken={variables.MAPBOX_ACCESS_TOKEN}
          mapStyle={props.mapboxStyle === 'satellite' ? variables.SATELLITE_STYLE : variables.STREETS_STYLE}
          style={{ width: '100%', height: '100%' }}
          doubleClickZoom={false}
          interactiveLayerIds={['zoneSource', 'zoneLayer']}
          onMove={handleMove}
          onViewportChange={(viewport) => setViewState(viewport)}
          onClick={(e) => {
            handleClosePopup(e);
          }}
          onLoad={() => {
            fetchData();
            console.log('loading', moment().valueOf() - timer);
          }}
          onMouseMove={onHover}
          onZoom={() => {
            if (mapRef?.current?.getZoom() >= 17) {
              inCluster && setInCluster(false);
            }
          }}
        >
          {/* marker popup */}
          {mapRef?.current?.getZoom() > 8 && props.deviceSelected && (
            <DevicePopup
              device={
                props.deviceSelected.deviceType === 'Ancher'
                  ? props.deviceSelected
                  : inCluster
                  ? { ...inCluster, lastSeen: currentDevice.lastSeen, locTime: currentDevice.locTime }
                  : currentDevice
              }
              inCluster={inCluster}
              tagIconMoving={tagIconMoving}
            />
          )}

          {/* calculate distance */}
          {props.distanceMeasurementSelected && <DistanceInfo />}

          {/* sattelite/streets view button */}
          {!props.isSplitScreen && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                position: 'absolute',
                bottom:
                  props.loginType === 'verifyGeotabAddinAccount'
                    ? props.screenWidth < 900
                      ? 200
                      : 110
                    : props.screenWidth < 900
                    ? 145
                    : 60,
                left: props.isListOpen ? (props.screenWidth < 900 ? 210 : 330) : 10,
                transition: 'all 100ms ease'
              }}
            >
              <SwitchMapButton mapbox={mapRef?.current} />
            </div>
          )}
          {/* rotate and zoom buttons  */}
          {!props.isSplitScreen && (
            <NavigationButtons
              mapbox={mapRef?.current}
              zoom={mapRef?.current?.getZoom()}
              isOutdoor={props.displayedMap === 'mapbox'}
            />
          )}
          {/* pois */}
          {mapRef?.current && props.pois && renderBuilding(props.pois)}
          {/* 4g/5g quality circles */}
          {props.deviceSelected?.deviceType === 'Tag' && (
            <GpsQuality deviceSelected={currentDevice} mapbox={mapRef?.current} />
          )}
          {/* zones & zone popup*/}
          {props.zones && <ZoneLayer show={props.filter.indexOf('Zones') > -1} zone={zone} />}
          {/* rssi circles */}
          {props.showCircle && <LocatorCircles deviceSelected={currentDevice} />}
          {/* device list */}
          <ListAndMarkersContainer
            mapbox={mapRef?.current}
            mainLayer={mainLayer}
            displayIndoor={props.displayIndoor}
            displayedMap={props.displayedMap}
            iconColor={iconColor}
            handleMarkerSelected={handleMarkerSelected}
            inCluster={inCluster}
            setInCluster={setInCluster}
            devices={props.devices}
            syncFilterWithMap={props.syncFilterWithMap}
            deviceSelected={props.deviceSelected}
            setViewState={setViewState}
          />
          {mapRef?.current && props.pois && props.pois.length && <IndoorOutdoorSwitch mapRef={mapRef.current} />}
        </Map>
        {!mapLoaded && <Loader wrldMapOnly={props.wrldMapOnly} />}
      </>
    );
  };

  const renderResizeComponent = () => {
    try {
      const isAddin = window.localStorage.getItem(`sTokens_${window.location.href.split('/')[3]}`);
      const hash = window.location.hash;

      if (isAddin && !hash.startsWith('#addin-')) return <div></div>;

      return <div style={{ position: 'relative', width: '100%', height: '100%' }}>{renderMapBox()}</div>;
    } catch (e) {
      console.log(e);
    }
  };

  const fetchData = () => {
    props.checkDevicesNumber();
    props.getAllDevices();
    props.getPois();
  };
  const locationPoller = () => {
    props.getTags(true);
    intervalDevices.current = setInterval(async () => {
      props.updateSearchResult({ searchResultDevices: props.searchResult ? props.searchResult : [] });

      // console.log(mapRef.current.getCenter());
    }, 2000);
  };

  useEffect(() => {
    setTimer(moment().valueOf());
    return () => {
      // unmount
      console.log('unmount');
      intervalDevices.current && clearInterval(intervalDevices.current);
      props.clearMapData();
    };
  }, []);

  useEffect(() => {
    const deviceNum = props.orgDevicesNumber;
    if (!mapLoaded || !deviceNum) return;
    const pollerCondition =
      props.routerLocation === 'mapbox' &&
      props.email &&
      props.userTenant?.activation?.isAccepted &&
      props.eula &&
      deviceNum > 0;

    if (pollerCondition) {
      locationPoller();
    }
    props.updateSearchResult({ searchResultDevices: props.searchResult && props.searchResult });
    geotabResizeStyle();

    setTimeout(async () => {
      if (!props.devices || !props.devices.length) {
        if (pollerCondition) {
          locationPoller();
        }
      }
    }, 1500);
  }, [mapLoaded, props.orgDevicesNumber]);

  useEffect(() => {
    if (props.pois && props.devices && !mapLoaded) {
      if (props.pois?.length) {
        // center on POI
        // console.log('poi center');
        let { location, zoom, offset } = props.pois[0];
        setViewState({
          bearing: offset && offset,
          zoom: props.mapboxStyle === 'satellite' ? 18.5 : (zoom && zoom) || 24,
          longitude: location.lng,
          latitude: location.lat,
          maxZoom: 22
        });
      } else if (props.devices && props.devices.length > 0) {
        // centroid of devices
        // console.log('centroid center');
        const bbox = getAllDevicesBoundingBox(props.devices);
        const viewport = new WebMercatorViewport({ width: 800, height: 600 }).fitBounds(
          [
            [bbox[0], bbox[1]],
            [bbox[2], bbox[3]]
          ],
          {
            padding: 0
          }
        );
        const { longitude, latitude, zoom } = viewport;
        setViewState({
          bearing: mapRef?.current?.getBearing(),
          longitude,
          latitude,
          zoom,
          maxZoom: 22
        });
      } else {
        // console.log('default center');
      }

      mapRef?.current && setMapLoaded(true);
    }
  }, [props.pois, props.devices]);

  useEffect(() => {
    if (mapRef.current) {
      const currentZoom = mapRef?.current?.getZoom();
      currentZoom < 5 && mapRef.current.setBearing(0);
      props.mapboxStyle === 'satellite' && currentZoom > 18.5 && mapRef.current.setZoom(18.5);
      prevProps.mapboxstyle !== props.mapboxStyle &&
        setViewState({ maxZoom: props.mapboxStyle === 'satellite' ? 18.5 : 24 });
    }
  }, [prevProps]);

  useEffect(() => {
    if (mapRef.current) {
      const currentZoom = mapRef?.current?.getZoom();
      currentZoom >= 17 && inCluster && setInCluster(false);
    }
  }, [viewState]);

  useEffect(() => {
    const { deviceToFollow } = props;
    // follow selected device if location changed
    if (deviceToFollow?.location?.lat && deviceToFollow?.location?.lng && mapRef?.current) {
      mapRef.current.flyTo({
        center: [deviceToFollow.location.lng, deviceToFollow.location.lat]
      });
    }
  }, [props.deviceToFollow]);

  return renderResizeComponent();
};

const mapStateToProps = ({ map, user, location, provision }) => ({
  // map,
  email: user.email,
  orgDevicesNumber: user.orgDevicesNumber,
  tags: map.tags,
  devices: map.devices,
  pois: map.pois,
  searchResult: map.searchResult,
  syncFilterWithMap: map.syncFilterWithMap,
  database: user.database,
  eula: user.eula,
  deviceSelected: map.deviceSelected,
  loginType: user.loginType,
  routerLocation: location.routerLocation,
  isSplitScreen: location.isSplitScreen,
  showAdvanceTool: location.showAdvanceTool,
  expandIndoorSize: location.expandIndoorSize,
  mapboxStyle: map.mapboxStyle,
  showCircle: location.showCircle,
  distanceMeasurementSelected: location.distanceMeasurementSelected,
  grid: map.grid,
  gridHeading: map.gridHeading,
  groupFilter: user.groupFilter,
  userTenant: provision.userTenant,
  allTenants: provision.allTenants,
  isListOpen: map.isListOpen,
  screenWidth: location.screenWidth,
  geotabFeaturePreviewUI: user.geotabFeaturePreviewUI,
  zones: map.zones,
  filter: location.filter,
  deviceToFollow: map.deviceToFollow,
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount'
});

const mapDispatch = ({
  map: {
    getAllDevicesAction,
    getTagsAction,
    updateSearchResultAction,
    setDeviceSelectedAction,
    getPoisAction,
    setDistancePointsAction,
    setDeviceToFollowAction,
    clearMapDataAction
  },
  user: { checkDevicesNumberAction },
  location: { setIsSplitScreenAction, setExpandIndoorSizeAction },
  notifications: { setNoteAction }
}) => ({
  getAllDevices: getAllDevicesAction,
  getTags: getTagsAction,
  updateSearchResult: updateSearchResultAction,
  setDeviceSelected: setDeviceSelectedAction,
  setIsSplitScreen: setIsSplitScreenAction,
  getPois: getPoisAction,
  setDistancePoints: setDistancePointsAction,
  setNote: setNoteAction,
  checkDevicesNumber: checkDevicesNumberAction,
  setExpandIndoorSize: setExpandIndoorSizeAction,
  setDeviceToFollow: setDeviceToFollowAction,
  clearMapData: clearMapDataAction
});

export default connect(mapStateToProps, mapDispatch)(Mapbox);
