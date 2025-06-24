import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useFilterByActivity from '../../hooks/useFilterByActivity';
import variables from '../../variables.json';
import List from '../Map/List';
import Loader from '../Map/Loader';
import Markers from './Markers';
import Popup from './Popup';
import { applyFilters } from '../../util/filters';
import GpsQuality from './GpsQuality';
import NavigationButtons from '../Map/NavigationButtons';
import LocatorSignals from './LocatorSignals';
import SwitchMapButton from '../Map/SwitchMapButton';
import { getAllDevicesBoundingBox } from '../../util/mapUtils';
import Zones from './Zones';
import Pois from './Pois';
import DistanceInfo from '../Map/DistanceInfo';
import AnalysisTool from './AnalysisTool';
import { iconPrefix } from '../../util/statusColor';
import mapboxgl from 'mapbox-gl';
import { MarkerProvider } from '../../context/Map/MarkerContext';

const icons = [
  variables.LOCATOR_ICON,
  variables.TAG_ICON_GREEN,
  variables.TAG_ICON_BLUE,
  variables.TAG_ICON_GREY,
  variables.TAG_ICON_RED,
  variables.TAG_ICON_BLACK,
  variables.ANCHER_ICON,
  variables.TAG_ICON_MOVING,
  variables.FIXED_TAG_ICON,
  variables.FIXED_TAG_GREEN,
  variables.FIXED_TAG_LIGHT_GREEN,
  variables.FIXED_TAG_ORANGE,
  variables.FIXED_TAG_YELLOW
];

const IndoorMap = () => {
  const [mapRef, setMapRef] = useState(null);
  const [initLoad, setInitLoad] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const [inCluster, setInCluster] = useState(null);
  const [mapParams, setMapParams] = useState(null);
  const [accuracyFilter, setAccuracyFilter] = useState(0);
  const [searchString, setSearchString] = useState('');
  // Selected Poi (taken from list)
  const [selectedPoi, setSelectedPoi] = useState(null);
  // Selected Poi ID (the current selected poi id)
  const [selectedPoiId, setSelectedPoiId] = useState(null);

  const intervalDevices = useRef(null);
  const dispatch = useDispatch();

  // const email = useSelector((state) => state.user.email);
  // const userTenant = useSelector((state) => state.provision.userTenant);
  // const eula = useSelector((state) => state.user.eula);
  const devices = useSelector((state) => state.map.devices);
  const deviceInit = useSelector((state) => state.map.deviceInit);
  const pois = useSelector((state) => state.map.pois);
  const groupFilter = useSelector((state) => state.user.groupFilter);
  const searchResult = useSelector((state) => state.map.searchResult);
  const filter = useSelector((state) => state.location.filter);
  const loginType = useSelector((state) => state.user.loginType);
  const isListOpen = useSelector((state) => state.map.isListOpen);
  const screenWidth = useSelector((state) => state.location.screenWidth);
  const mapboxStyle = useSelector((state) => state.map.mapboxStyle);
  const distanceMeasurementSelected = useSelector((state) => state.location.distanceMeasurementSelected);
  const zones = useSelector((state) => state.map.zones);

  const [displayedDevices, setDisplayedDevices] = useState(devices);

  const prevMapboxStyleRef = useRef(mapboxStyle);
  const filterByActivityAdapter = useFilterByActivity();

  // manual js
  useEffect(() => {
    fetchInitData();
    return () => {
      intervalDevices.current && clearInterval(intervalDevices.current);
      // props.clearMapData();
      console.log('unmount indoor');
      dispatch.map.clearMapDataAction();
      setMapRef(null);
      setMapLoaded(false);
      setStyleLoaded(false);
    };
  }, []);

  useEffect(() => {
    if (devices?.length === 0) return;
    const pollerCondition = devices?.length > 0;

    if (pollerCondition) {
      setTimeout(() => locationPoller(), 5000);
    }
    // dispatch.map.updateSearchResultAction({ searchResultDevices: searchResult && searchResult });
  }, [devices]);

  useEffect(() => {
    if (pois && displayedDevices && !mapRef && deviceInit) {
      const mapViewOptions = {
        accessToken: variables.MAPBOX_ACCESS_TOKEN,
        element: document.getElementById('map'),
        zoom: 5,
        maxZoom: 24,
        style: mapboxStyle === 'satellite' ? variables.SATELLITE_STYLE : variables.STREETS_STYLE,
        apiKey: pois[0]?.provider?.apikey
      };

      if (pois?.length > 0) {
        // center on POI
        // console.log('poi center');
        const { location, zoom, offset } = pois[0];

        mapViewOptions.bearing = mapParams?.bearing || offset;
        mapViewOptions.center = mapParams?.center || location;
        // console.log('init zoom', zoom);
        mapViewOptions.zoom = mapParams?.zoom || zoom;
      } else if (devices?.length > 0) {
        // centroid of devices
        // console.log('centroid center');
        const bbox = mapParams ? null : getAllDevicesBoundingBox(displayedDevices);
        mapViewOptions.center = mapParams?.center || variables.DEFAULT_MAP_CENTER;
        mapViewOptions.bbox = bbox;

        if (mapParams) {
          mapViewOptions.bearing = mapParams?.bearing;
          mapViewOptions.zoom = mapParams?.zoom;
        }
        // mapViewOptions.center = { lat: 39.75714, lng: -75.37875 };
      } else {
        // console.log('default center');
      }
      loadMap(mapViewOptions);
    }
  }, [pois, displayedDevices, deviceInit]);

  useEffect(() => {
    if (prevMapboxStyleRef.current !== mapboxStyle) {
      console.log('mapboxStyle changed');
      // Update previous mapboxStyle value
      prevMapboxStyleRef.current = mapboxStyle;
      setMapRef(null);
      const params = {
        bearing: mapRef.getBearing(),
        center: mapRef.getCenter(),
        zoom: mapRef.getZoom()
      };
      setMapParams(params);
    }
  }, [mapboxStyle]);

  const filteredDevices = useMemo(
    () =>
      applyFilters(devices, searchResult, groupFilter, filterByActivityAdapter, filter, accuracyFilter, searchString),
    [devices, searchResult, groupFilter, filterByActivityAdapter.filterByActivity, filter, accuracyFilter, searchString]
  );

  useEffect(() => {
    if (filteredDevices) {
      setDisplayedDevices(filteredDevices);
    }
  }, [filteredDevices]); // Update state whenever filteredDevices changes

  // useEffect(() => {
  //   if (devices) {
  //     const filteredDevices = applyFilters(devices, searchResult, groupFilter, filterByActivityAdapter, filter);
  //     setDisplayedDevices(filteredDevices);
  //   }
  // }, [devices, groupFilter, searchResult, filter, filterByActivityAdapter.filterByActivity]);

  const loadMap = (mapOptions) => {
    if (mapRef) return;

    const mapboxInstance = getMap(mapOptions);
    console.log('loadMap');
    setMapRef(mapboxInstance);
    mapboxInstance.on('style.load', () => {
      setStyleLoaded(true);
    });
    mapboxInstance.on('load', () => {
      setMapLoaded(true);
      setInitLoad(true);
    });
  };

  const getMap = (mapOptions) => {
    const { apiKey, ...mapViewOptions } = mapOptions;

    if (apiKey) {
      console.log('load indoor map');
      mapsindoors.MapsIndoors.setMapsIndoorsApiKey(apiKey);
      const mapViewInstance = new mapsindoors.mapView.MapboxView(mapViewOptions);
      const mapsIndoorsInstance = new mapsindoors.MapsIndoors({
        mapView: mapViewInstance
      });
      const mapboxInstance = mapViewInstance.getMap();
      mapViewOptions.bbox && mapboxInstance.fitBounds(mapViewOptions.bbox, { padding: 50 });
      // setMiInstance(mapsIndoorsInstance);
      return mapboxInstance;
    } else {
      // console.log('load mapbox');
      mapboxgl.accessToken = variables.MAPBOX_ACCESS_TOKEN;
      const map = new mapboxgl.Map({
        container: 'map',
        style: mapOptions.style,
        center: mapViewOptions.center,
        zoom: mapViewOptions.zoom,
        maxZoom: mapViewOptions.maxZoom,
        bearing: mapViewOptions.bearing || 0,
        bearingSnap: 0.1
      });

      icons.forEach((icon) => {
        // Add prefix to icons if app is opened as geotab add-in
        icon = iconPrefix(icon, loginType === 'verifyGeotabAddinAccount');
        map.loadImage(icon, (error, image) => {
          map.addImage(icon, image);
        });
      });
      mapViewOptions.bbox && map.fitBounds(mapViewOptions.bbox, { padding: 50 });
      return map;
    }
  };

  const fetchInitData = () => {
    // dispatch.user.checkDevicesNumberAction();
    dispatch.map.getPoisAction();
    dispatch.map.getAllDevicesAction();
  };

  const locationPoller = () => {
    dispatch.map.getTagsAction(true);
    // intervalDevices.current = setInterval(async () => {
    //   console.log('locationPoller updateSearchResultAction');
    //   dispatch.map.updateSearchResultAction({ searchResultDevices: searchResult ? searchResult : [] });

    //   // console.log(mapRef.current.getCenter());
    // }, 2000);
  };

  return (
    <>
      <div
        id="map"
        style={{
          width: '100%',
          height: '100%'
        }}
      >
        <GpsQuality mapRef={mapRef} mapLoaded={mapLoaded} displayedDevices={displayedDevices} />
        <LocatorSignals mapRef={mapRef} mapLoaded={mapLoaded} displayedDevices={displayedDevices} />
        <MarkerProvider>
          <Markers
            mapRef={mapRef}
            mapLoaded={mapLoaded}
            styleLoaded={styleLoaded}
            displayedDevices={displayedDevices}
            setInCluster={setInCluster}
          />
          <Popup mapRef={mapRef} mapLoaded={mapLoaded} displayedDevices={devices} inCluster={inCluster} />
          {/* device list */}
          <List
            mapbox={mapRef}
            bearing={mapRef && mapRef.getBearing()}
            displayIndoor={true}
            displayedMap={'indoor'}
            filterByActivityAdapter={filterByActivityAdapter}
            setViewState={false}
            accuracyFilter={accuracyFilter}
            onPoiSelected={setSelectedPoi}
            searchString={searchString}
            setSearchString={setSearchString}
          />
          <AnalysisTool
            mapRef={mapRef}
            mapLoaded={mapLoaded}
            styleLoaded={styleLoaded}
            displayedDevices={displayedDevices}
            setAccuracyFilter={setAccuracyFilter}
          />
        </MarkerProvider>

        <Pois
          mapRef={mapRef}
          mapLoaded={mapLoaded}
          styleLoaded={styleLoaded}
          displayedDevices={displayedDevices}
          selectedPoi={selectedPoi}
          // Actual Id selected:
          selectedPoiId={selectedPoiId}
          setSelectedPoiId={setSelectedPoiId}
        />

        {/* zones & zone popup*/}
        {zones && <Zones mapRef={mapRef} mapLoaded={mapLoaded} showZones={filter.indexOf('Zones') > -1} />}

        {/* rotate, zoom, portrait mode buttons */}
        <NavigationButtons
          mapbox={mapRef}
          zoom={mapRef?.getZoom()}
          isOutdoor={true}
          pois={pois}
          // Actual Id selected:
          selectedPoiId={selectedPoiId}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            position: 'absolute',
            marginBottom: '70px',
            bottom: '0px',
            left: isListOpen ? (screenWidth < 900 ? 200 : 330) : 10,
            transition: 'all 100ms ease'
          }}
        >
          <SwitchMapButton mapbox={mapRef} setStyleLoaded={setStyleLoaded} setMapLoaded={setMapLoaded} />
        </div>
        {distanceMeasurementSelected && <DistanceInfo />}
      </div>
      {!initLoad && <Loader />}
    </>
  );
};

export default IndoorMap;
