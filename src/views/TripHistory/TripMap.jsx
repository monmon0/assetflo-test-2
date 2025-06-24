import React, { useState, useEffect } from 'react';
import * as turf from '@turf/turf';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import ReactDOM from 'react-dom';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { connect } from 'react-redux';
import { batteryIcons } from '../../util/batteryUtil';

import variables from '../../variables.json';
import moment from 'moment';

import NavigationButtons from '../Map/NavigationButtons';
import HistoryList from './HistoryList';
import Supercluster from 'supercluster';
import SwitchMapButton from '../Map/SwitchMapButton';

mapboxgl.accessToken = variables.MAPBOX_ACCESS_TOKEN;

// const dragableLocatorIcon = variables.DRAGABLE_LOCATOR_ICON;
const startP = variables.TRIP_START;
const endP = variables.TRIP_END;
const arrow = variables.TRIP_ARROW;

const iconArrow = document.createElement('img');
iconArrow.src = arrow;
iconArrow.width = 13;
iconArrow.height = 13;
iconArrow.crossOrigin = 'Anonymous';

const iconStart = document.createElement('img');
iconStart.src = startP;
iconStart.width = 18;
iconStart.height = 18;
iconStart.crossOrigin = 'Anonymous';

const iconEnd = document.createElement('img');
iconEnd.src = endP;
iconEnd.width = 18;
iconEnd.height = 18;
iconEnd.crossOrigin = 'Anonymous';

let popup;
function TripMap(props) {
  const [map, setMap] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [tripList, setTripList] = useState(null);
  const [displayedTrips, setDisplayedTrips] = useState([]);
  const [displayedTripIds, setDisplayedTripIds] = useState('');
  const [normalized, setNormalized] = useState(false);
  const [showAllPoints, setShowAllPoints] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString());
  const [heatmap, setHeatmap] = useState(false);
  const [shortTrips, setShortTrips] = useState(false);
  const [minTravel, setMinTravel] = useState(50); // 50 meters
  const [minDuration, setminDuration] = useState(600000); // 10 min
  const [isListOpen, setIsListOpen] = useState(true);

  const icons = { iconStart: iconStart, iconEnd: iconEnd, iconArrow: iconArrow };

  // const [popup, setPopup] = useState(null);

  useEffect(() => {
    props.getDevices();
    const initmap = new mapboxgl.Map({
      container: 'map1',
      style: variables.STREETS_STYLE,
      center: variables.DEFAULT_MAP_CENTER,
      zoom: 7
    }).setMaxZoom(24);

    setMap(initmap);

    initmap.on('load', () => {
      initmap.resize();
      addImages(initmap);
      setMapLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (map) {
      addImages(map);
    }
  }, [mapLoaded]);

  useEffect(() => {
    if (!props.trips) {
      const reqParams = {
        minTravel: minTravel,
        minDuration: minDuration
      };
      props.device
        ? props.getTripHistory({ ...props.device, isNormalized: normalized, isGrouped: true, ...reqParams })
        : props.getTripHistory({
            ...{ deviceId: '', organization: props.database, groups: [props.group] },
            isNormalized: normalized,
            isGrouped: true
          });
    } else {
      !displayedTripIds && setDisplayedTrips(props.trips);
      map &&
        map.on('style.load', () => {
          addImages(map);
          const selected = [];
          setDisplayedTrips(props.trips);
          setDisplayedTripIds(selected);
          showTrip(props.trips);
        });
    }
  }, [props.trips]);

  useEffect(() => {
    setDisplayedTripIds('');
  }, [props.device, selectedDate]);

  useEffect(() => {
    if (map) {
      const { validTrips, validIds } = validateTrips();

      mapLoaded && props.trips && showTrip(validTrips, validIds);

      map.on('mousemove', 'line', lineMoveHandler);
      map.on('mouseleave', 'line', lineLeaveHandler);
      map.on('mousemove', 'circle', circleMoveHandler);
      map.on('mouseleave', 'circle', circleLeaveHandler);
      map.on('mousemove', 'arrow', circleMoveHandler);
      map.on('mouseleave', 'arrow', circleLeaveHandler);
    }

    if (props.trips) {
      let hashmap = {};
      const sorted = [...props.trips.sort((a, b) => a.start.start - b.start.start)];
      sorted.map((trip) => {
        hashmap[trip.tripId] = trip;
      });

      setTripList(hashmap);
    }
  }, [mapLoaded, props.trips, props.showAdvanceTool]);

  const addImages = (map) => {
    // const el = map.hasImage('iconArrow');
    // if (!el) {
    //   const img = document.createElement('img');
    //   img.src = iconArrow;
    //   img.width = '15';
    //   img.height = '15';
    //   img.crossOrigin = 'Anonymous';
    //   console.log('el', img);
    //   map.addImage('iconArrow', img);
    // }
    // for (let key in icons) {
    //   const el = map.hasImage(key);
    //   if (!el) {
    //     const img = document.createElement('img');
    //     img.src = icons[key];
    //     img.width = key === 'iconArrow' ? '14' : '18';
    //     img.height = key === 'iconArrow' ? '14' : '18';
    //     img.crossOrigin = 'Anonymous';
    //     map.addImage(key, img);
    //   }
    // }
    for (let key in icons) {
      const el = map.hasImage(key);
      if (!el) {
        map.addImage(key, icons[key]);
      }
    }
  };

  const validateTrips = () => {
    let validTrips = [];
    let validIds = [];
    if (!displayedTripIds) return { validTrips: props.trips, validIds: '' };

    props.trips.map((trip) => {
      if (displayedTripIds.includes(trip.tripId)) {
        validIds.push(trip.tripId);
        validTrips.push(trip);
      }
    });

    if (validTrips.length === 0 && validIds.length === 0) {
      validTrips = props.trips;
      validIds = '';
    }

    setDisplayedTrips(validTrips);
    setDisplayedTripIds(validIds);
    return { validTrips, validIds };
  };

  const circleMoveHandler = (e) => {
    if (map) {
      map.getCanvas().style.cursor = 'pointer';
      const device = e.features[0].properties;
      const container = document.createElement('div');
      ReactDOM.render(<PopupContent device={device} />, container);
      if (popup && popup.isOpen()) {
        popup.setLngLat(e.lngLat).setDOMContent(container);
      } else {
        popup = new mapboxgl.Popup({ offset: 25 }).setLngLat(e.lngLat).setDOMContent(container).addTo(map);
      }
    }
  };

  const circleLeaveHandler = () => {
    popup && popup.remove();
    map && (map.getCanvas().style.cursor = '');
  };

  const lineMoveHandler = (e) => {
    if (map) {
      map.getCanvas().style.cursor = 'pointer';
      const device = e.features[0].properties;
      const container = document.createElement('div');
      ReactDOM.render(<PopupContent device={device} />, container);
      if (popup && popup.isOpen()) {
        popup.setLngLat(e.lngLat).setDOMContent(container);
      } else {
        popup = new mapboxgl.Popup({ offset: 25 }).setLngLat(e.lngLat).setDOMContent(container).addTo(map);
      }
    }
  };

  const lineLeaveHandler = () => {
    // Remove the information from the previously hovered feature from the sidebar
    popup && popup.remove();
    // Reset the cursor style
    map && (map.getCanvas().style.cursor = '');
  };

  const PopupContent = ({ device }) => {
    const timeDisplay = device.time
      ? moment(device.time).format('hh:mm:ss:SSS A')
      : `${moment(device.from).format('hh:mm:ss A')} - ${moment(device.to).format('hh:mm:ss A')}`;

    return (
      <div>
        <span>
          <strong>{device.assetName || device.name}</strong>
        </span>
        <br />
        <span>{device.isMoving !== undefined ? displayTelemetry(device) : ''}</span>
        <span>
          <strong>Time: </strong>
          {timeDisplay}
        </span>
        {device.attachedState && (
          <>
            <br />
            <span>
              {JSON.parse(device.attachedState).state === 'Attached'
                ? `Attached to ${JSON.parse(device.attachedState).attachedTo}`
                : ''}
            </span>
          </>
        )}
      </div>
    );
  };
  const displayTelemetry = (telemetry, showAdvanceTool) => {
    const { locWeight: locWeightRaw, atp: atpRaw } = telemetry;
    const locWeight = locWeightRaw && JSON.parse(locWeightRaw);
    const atp = atpRaw && JSON.parse(atpRaw);
    const icon = telemetry.batteryChargeStatus ? batteryIcons[telemetry.batteryChargeStatus] : null;
    console.log('telemetry', telemetry);
    return (
      <div>
        <span>
          <strong>
            {telemetry.state || ''} {telemetry.speed} km/h
          </strong>
        </span>
        <br />
        <span>
          <strong>Heading:</strong> {Math.round(telemetry.heading)} deg
        </span>
        <br />
        {showAdvanceTool && telemetry.rsrp !== undefined && (
          <>
            <span>
              <strong>RSRP:</strong> {telemetry.rsrp}
            </span>
            <br />
          </>
        )}
        {showAdvanceTool && telemetry.hdop !== undefined && telemetry.satsUsed !== undefined && (
          <>
            <span>
              <strong>hdop:</strong> {telemetry.hdop}
            </span>
            <br />
            <span>
              <strong>satsUsed:</strong> {telemetry.satsUsed}
            </span>
            <br />
          </>
        )}
        {showAdvanceTool && locWeightRaw && (
          <>
            <span>
              <strong>weight:</strong> {locWeight.weight}
            </span>
            <br />
          </>
        )}
        {showAdvanceTool && telemetry.isCached !== undefined && (
          <>
            <span>
              <strong>Cached:</strong> {telemetry.isCached}
            </span>
            <br />
          </>
        )}
        {telemetry.batterylevel !== undefined && (
          <>
            <span>
              <strong>Battery:</strong> {telemetry.batterylevel + '%'}
              <span style={{ marginLeft: 5 }}>{icon}</span>
            </span>
            <br />
          </>
        )}
        {showAdvanceTool && telemetry.powerConnected !== undefined && (
          <>
            <span>
              <strong>isPowered:</strong> {telemetry.powerConnected}
            </span>
            <br />
          </>
        )}
        {telemetry.temperature !== undefined && (
          <>
            <span>
              <strong>Temperature:</strong> {telemetry.temperature + '°C'}
            </span>
            <br />
          </>
        )}
        {telemetry.humidity !== undefined && (
          <>
            <span>
              <strong>Humidity:</strong> {telemetry.humidity + '%'}
            </span>
            <br />
          </>
        )}
        {showAdvanceTool && atp !== undefined && (
          <>
            <span>
              <strong>isATP:</strong> {atp}
            </span>
            <br />
          </>
        )}
        {showAdvanceTool && telemetry.lat !== undefined && telemetry.lng !== undefined && (
          <>
            <span>
              <strong>lat:</strong> {telemetry.lat} <strong>lng:</strong> {telemetry.lng}
            </span>
            <br />
          </>
        )}
        {showAdvanceTool && telemetry.tripDist !== undefined && (
          <>
            <span>
              <strong>Distance:</strong> {telemetry.tripDist} m
            </span>
            <br />
          </>
        )}
        {telemetry.duration !== undefined && (
          <>
            <span>
              <strong>Duration:</strong> {telemetry.duration}
            </span>
            <br />
          </>
        )}
      </div>
    );
  };

  const getBoundingBox = (line) => {
    if (!line) return;
    // get bounding box
    const bbox = turf.bbox(line);
    return bbox;
  };

  const clearMap = () => {
    if (!map) return;
    // remove  path line
    //arrow
    const arrowLayer = map.getLayer('arrow');
    const arrowSource = map.getSource('arrowSource');
    arrowLayer && map.removeLayer('arrow');
    arrowSource && map.removeSource('arrowSource');
    // start finish
    const circleLayer = map.getLayer('circle');
    const circleSource = map.getSource('circleSource');
    circleLayer && map.removeLayer('circle');
    circleSource && map.removeSource('circleSource');
    // line
    const lineLayer = map.getLayer('line');
    const lineBorderLayer = map.getLayer('lineBorder');
    const lineSource = map.getSource('lineSource');
    lineLayer && map.removeLayer('line');
    lineBorderLayer && map.removeLayer('lineBorder');
    lineSource && map.removeSource('lineSource');
    // heatmap
    const heatmap = map.getLayer('heatmap');
    const polygon = map.getSource('polygon');
    heatmap && map.removeLayer('heatmap');
    polygon && map.removeSource('polygon');
  };

  const handlePoints = (trips) => {
    let clusterPoints = [];
    let poly = [];
    let index = 1;
    const showText = props.trips.length !== trips.length;
    // loop trips
    trips.map((trip) => {
      // create geojson points
      const points = createGeoPoints(trip, trips, showText && index);
      showText && index++;
      if (props.device.protocol === 'LTE' || showAllPoints) {
        // concat raw points
        clusterPoints = clusterPoints.concat(points);
      } else {
        // create clusters
        const { clusterData } = createClusterPoints(points) || {};
        // concat clusters
        clusterPoints = clusterPoints.concat(clusterData);
      }
      if (heatmap) {
        const smoothed = createSmoothPoly(trip.heatmap);
        poly = smoothed ? poly.concat(smoothed) : poly;
      }
    });
    return { clusterPoints, poly };
  };

  const showTrip = (trips, ids) => {
    // delete layer with source before creating new layer
    clearMap();
    if (ids === '') {
      // if current trip is selected display all trips for this day
      trips = props.trips;
    }
    // console.log('lineCoordinates', lineCoordinates);
    const { clusterPoints, poly } = handlePoints(trips);

    // display heatmap if enabled
    heatmap && addHeatMap(poly);
    // console.log('clusterCoordinates', concat);
    // console.log('clusterPoints', clusterPoints);
    if (clusterPoints.length === 0) return;
    // create line feature
    const clusterData = turf.featureCollection(clusterPoints);
    // console.log('clusterPoints', clusterPoints);
    // create multiple line with time(from to) data
    const multiline = getFullPath(clusterPoints);
    // console.log('multiline', multiline);
    // source for multiline
    const multilineSource = createSource(multiline);
    // console.log('multilineSource', multilineSource);
    // create lineString for bounding box detection

    // add line layer
    map.addSource('lineSource', {
      type: 'geojson',
      data: multilineSource,
      generateId: true
    });

    map.addLayer({
      type: 'line',
      source: 'lineSource',
      id: 'lineBorder',
      paint: {
        'line-color': 'blue',
        'line-width': 5
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      }
    });

    map.addLayer({
      type: 'line',
      source: 'lineSource',
      id: 'line',
      paint: {
        // 'line-color': '#3386FF',
        'line-color': props.showAdvanceTool ? ['get', 'color'] : '#3386FF',
        'line-width': 3
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      }
    });

    // add points layer
    map.addSource('arrowSource', {
      type: 'geojson',
      data: clusterData,
      generateId: true
    });

    // add points layer
    map.addLayer({
      type: 'symbol',
      source: 'arrowSource',
      id: 'arrow',
      layout: {
        'icon-image': ['get', 'icon'],
        'icon-rotate': ['get', 'heading']
      },
      paint: {
        'text-color': '#ffffff'
      }
    });

    displayStartFinish(clusterPoints, trips.length === props.trips.length);
    // create lineString type geojson
    // const lineString = turf.lineString(lineCoordinates);
    if (!displayedTripIds) {
      const bbox = getBoundingBox(multilineSource);

      bbox &&
        map.fitBounds(bbox, {
          padding:
            props.screenWidth < 1000
              ? { top: 60, bottom: 60, left: 15, right: 15 }
              : { top: 150, bottom: 150, left: 350, right: 20 }
        });
    }
    //
    // console.log(lineCoordinates);;
  };

  const displayStartFinish = (clusterPoints, isWholeTrip) => {
    let points = [];
    clusterPoints.map((p) => {
      if (!p.properties.icon) {
        points.push({
          ...p,
          properties: {
            ...p.properties,
            icon: p.properties.isFinish
              ? 'iconEnd'
              : p.properties.isStart || (!isWholeTrip && p.properties.isTripStart)
              ? 'iconStart'
              : ''
          }
        });
      }
    });

    const pointsData = turf.featureCollection(points);

    map.addSource('circleSource', {
      type: 'geojson',
      data: pointsData,
      generateId: true
    });

    // add points layer
    map.addLayer({
      type: 'symbol',
      source: 'circleSource',
      id: 'circle',
      layout: {
        'icon-image': ['get', 'icon'],
        'icon-rotate': ['get', 'heading'],
        'text-field': ['get', 'text'],
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-size': 13,
        'text-anchor': 'center',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true
      },
      paint: {
        'text-color': '#ffffff'
      }
    });
  };

  const addHeatMap = (poly) => {
    const polygonSource = turf.featureCollection(poly);
    // console.log('polygonSource', polygonSource.features[0]);
    map.addSource('polygon', {
      type: 'geojson',
      data: polygonSource
    });

    map.addLayer({
      type: 'fill',
      source: 'polygon',
      id: 'heatmap',
      paint: {
        'fill-color': variables.ORANGE_COLOR,
        'fill-opacity': 0.5
      }
    });
  };

  const createSmoothPoly = (heatmapObj) => {
    if (!heatmapObj || !heatmapObj.bounds) return;
    const { bounds } = heatmapObj;
    const poly = turf.bboxPolygon([bounds.minLng, bounds.minLat, bounds.maxLng, bounds.maxLat]);
    const smoothed = turf.polygonSmooth(poly, { iterations: 3 });
    return smoothed.features[0];
  };

  const getFullPath = (points) => {
    let multiLine = [];
    // console.log('full', lineCoordinates);
    const props = points[0].properties;
    for (let i = 0; i < points.length - 1; i++) {
      if (points[i].properties.isTripEnd) continue;

      const pair = points.slice(i, i + 2);
      const coords = pair.map((point) => {
        return point.geometry.coordinates;
      });

      const start = moment(pair[0].properties.time);
      const end = moment(pair[1].properties.time);
      const diff = end.diff(start);
      const hour = moment.duration(diff, 'milliseconds').hours();
      const min = moment.duration(diff, 'milliseconds').minutes();
      const sec = moment.duration(diff, 'milliseconds').seconds();
      const duration =
        (hour ? hour + 'h ' : '') +
        (min ? min + 'm ' : '') +
        (sec === 0 && (hour !== 0 || min !== 0) ? '' : sec + 's ');

      multiLine.push({
        from: pair[0].properties.time,
        to: pair[1].properties.time,
        coordinates: coords,
        assetName: props.assetName,
        duration: duration,
        speed: pair[0].properties.speed,
        heading: pair[0].properties.heading,
        isMoving: pair[0].properties.isMoving,
        color: pair[0].properties.atp && pair[1].properties.atp ? 'red' : '#3386FF'
      });
    }
    return multiLine;
  };

  const createSource = (multiLine, trip) => {
    let features = [];
    multiLine.map((source) => {
      const lineString = turf.lineString(source.coordinates, {
        from: source.from,
        to: source.to,
        assetName: source.assetName,
        duration: source.duration,
        speed: source.speed,
        heading: source.heading,
        isMoving: source.isMoving,
        color: source.color
      });
      features.push(lineString);
    });

    const featureCollection = turf.featureCollection(features);
    return featureCollection;
  };

  const getDistanceFromStart = (tripDist, isStart, points, path, i) => {
    const options = { units: 'meters' };
    if (isStart) tripDist = 0;
    if (points.length) {
      const len = points.length;
      const distance = turf.distance(points[len - 1], turf.point([path[i].lng, path[i].lat]), options);
      // console.log('distance', distance);
      tripDist += distance;
    }
    return tripDist;
  };

  const createGeoPoints = (trip, trips, index) => {
    const { trips: path } = trip;
    let points = [];
    let tripDist = 0;
    for (let i = 0; i < path.length; i++) {
      const isStart = path[i] === trips[0].trips[0];
      const isFinish = path[i] === trips[trips.length - 1].trips[path.length - 1];
      const tripObj = path[i];
      const isTripEnd = i === path.length - 1 && !isFinish;
      const isTripStart = i === 0 && !isStart;
      console.log('tripObj', props.tripEvents, path[i]);
      // TODO assign properties like size and color
      // console.log('attach', path[i].attachedState);
      tripDist = getDistanceFromStart(tripDist, isStart, points, path, i);

      const point = turf.point([path[i].lng, path[i].lat], {
        icon: i === 0 || i === path.length - 1 ? '' : 'iconArrow',
        time: path[i].locTime || path[i].updatedAt,
        deviceId: trip.deviceId,
        assetName: trip.assetName,
        ...tripObj,
        isTripEnd: isTripEnd,
        isTripStart: isTripStart,
        isStart: isStart,
        isFinish: isFinish,
        text: i === 0 && index ? index : '',
        ...(path[i].attachedState && {
          attachedState: path[i].attachedState
        }),
        tripDist: Math.round(tripDist * 100) / 100 || 0
      });

      points.push(point);
    }
    return points;
  };

  const createClusterPoints = (points) => {
    if (points.length <= 3) {
      const clusterCoordinates = points.map((point) => {
        return point.geometry.coordinates;
      });
      return { clusterData: points, clusterCoordinates };
    }
    // clustering
    const index = new Supercluster({
      radius: 0.0002,
      maxZoom: 30
    });

    index.load(points.slice(1, points.length - 1));
    const clusters = index.getClusters([-180, -85, 180, 85], 2);

    const combined = [points[0], ...clusters, points[points.length - 1]];

    return processPoints(combined, index);
  };

  const processPoints = (combined, index) => {
    let clusterPoints = [];
    let clusterCoordinates = [];

    // loop clusters and add time & properrties
    for (let i = 0; i < combined.length; i++) {
      clusterCoordinates.push(combined[i].geometry.coordinates);
      if (combined[i].id) {
        const leaves = index.getLeaves(combined[i].id);

        const dev = { ...leaves[0].properties };
        leaves.sort((a, b) => {
          return a.properties.time - b.properties.time;
        });

        clusterPoints.push(
          turf.point(combined[i].geometry.coordinates, {
            ...dev,
            time: leaves[0].properties.time
          })
        );
      } else {
        clusterPoints.push(turf.point(combined[i].geometry.coordinates, combined[i].properties));
      }
    }

    clusterPoints.sort((a, b) => {
      return a.properties.time - b.properties.time;
    });
    return { clusterData: clusterPoints, clusterCoordinates };
  };

  return (
    <div style={{ height: '100%' }}>
      <div id="map1" style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}>
        <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
          <div style={{ position: 'relative' }}>
            <NavigationButtons mapbox={map} zoom={map && map.getZoom()} isIndoor={false} />
          </div>
        </div>
        {
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              position: 'absolute',
              marginBottom: '70px',
              bottom: '0px',
              left: isListOpen ? (props.screenWidth < 900 ? 250 : 330) : 10,
              transition: 'all 100ms ease'
            }}
          >
            <SwitchMapButton mapbox={map} isTrip={true} clearMap={clearMap} />
          </div>
        }
        <HistoryList
          data={tripList}
          switchLine={showTrip}
          displayedTrips={displayedTrips}
          setDisplayedTrips={setDisplayedTrips}
          displayedTripIds={displayedTripIds}
          setDisplayedTripIds={setDisplayedTripIds}
          normalized={normalized}
          setNormalized={setNormalized}
          setShowAllPoints={setShowAllPoints}
          showAllPoints={showAllPoints}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          heatmap={heatmap}
          setHeatmap={setHeatmap}
          shortTrips={shortTrips}
          setShortTrips={setShortTrips}
          isListOpen={isListOpen}
          setIsListOpen={setIsListOpen}
          minTravel={minTravel}
          setMinTravel={setMinTravel}
          minDuration={minDuration}
          setminDuration={setminDuration}
        />
      </div>
    </div>
  );
}

const mapStateToProps = ({ map, user, location }) => ({
  device: map.deviceSelected,
  screenWidth: location.screenWidth,
  mapboxStyle: map.mapboxStyle,
  database: user.database,
  group: user.group,
  role: user.role,
  userPermissions: user.userPermissions,
  trips: map.currentTrips,
  showAdvanceTool: location.showAdvanceTool,
  tripEvents: map.tripEvents,
  loginType: user.loginType
});

const mapDispatch = ({ map: { getTripHistoryAction }, provision: { getDeviceStatesAction } }) => ({
  getTripHistory: getTripHistoryAction,
  getDevices: getDeviceStatesAction
});

export default connect(mapStateToProps, mapDispatch)(TripMap);
