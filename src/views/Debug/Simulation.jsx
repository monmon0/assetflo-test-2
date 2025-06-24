import React, { useState, useEffect, Fragment, useRef } from 'react';
import * as turf from '@turf/turf';
import mapboxgl from 'mapbox-gl';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { connect } from 'react-redux';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  ClickAwayListener,
  Slider,
  Typography,
  Box,
  TextField,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import Autocomplete from '@mui/material/Autocomplete';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Grid from '@mui/material/Grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Input from '@mui/material/Input';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

import variables from '../../variables.json';
import moment from 'moment';

import NavigationButtons from '../Map/NavigationButtons';
import List from './List';

import { useDispatch } from 'react-redux';

mapboxgl.accessToken = variables.MAPBOX_ACCESS_TOKEN;

const dragableAnchorIcon = variables.ANCHER_ICON;

let updatedDragedDevicesList = [];
let clickEvt = null;

// import event building function to build events for processing
const { build5gEvent } = require('./5gEventBuilder.js');

export function Simulation(props) {
  const [map, setMap] = useState(null);
  const [deviceMarkers, setDeviceMarkers] = useState({});
  const [devicePayload, setDevicePayload] = useState({});
  const [color, setColor] = useState({});
  const [defaultScan, setDefaultScan] = useState({ device: '', rssi: -60, isMoving: true });
  const [isValidDate, setIsValidDate] = useState(true);

  const [done, setDone] = useState(false);

  useEffect(() => {
    props.getAllDevices();
  }, []);

  useEffect(() => {
    const initmap = new mapboxgl.Map({
      container: 'map1',
      style: variables.STREETS_STYLE,
      center: [-79.8443225556831, 43.52227782075562],
      zoom: 17
    }).setMaxZoom(24);

    setMap(initmap);

    initmap.on('load', () => {
      initmap.resize();
    });
  }, []);

  useEffect(() => {
    if (props.devices) {
      const ble = props.devices.filter((d) => d.protocol === 'BLE');
      console.log('ble', ble[0]);
      setDefaultScan({ device: ble[0], rssi: -60, isMoving: true });
      const iox = props.devices.filter((d) => d.protocol === 'IOX');
    }
  }, [props.devices]);

  const iconStyle = () => {
    return {
      icon: dragableAnchorIcon,
      width: '15px',
      height: '15px',
      color: '#ff0000',
      borderRadius: '50%',
      borderColor: '1px solid ' + variables.DARK_GRAY_COLOR
    };
  };

  const getRandomColor = (deviceId) => {
    let letters = '0123456789ABCDEF';
    let currColor = '#';

    // generate random color until non-white color is found to not conflict with event number
    do {
      for (let i = 0; i < 6; i++) {
        currColor += letters[Math.floor(Math.random() * 16)];
      }
    } while (currColor === '#FFFFFF');

    setColor({ ...color, [deviceId]: currColor });
    return currColor;
  };

  // find marker on map by eventId and update it's event id number
  const updateDotContent = (eventId, newContent) => {
    const markerElement = document.getElementById(eventId);
    if (markerElement) {
      const labelElement = markerElement.querySelector('.marker-label');
      if (labelElement) {
        labelElement.textContent = newContent;
        markerElement.id = newContent;
      }
    }
  };

  // function for adding a coordinate marker onto the map
  const setAddMode = (event) => {
    map.getCanvas().style.cursor = 'crosshair';
    const wrapper = (e) => handleMapClick(e, event, wrapper);
    clickEvt = wrapper;
    map.on('click', wrapper);
  };

  // function handles map click after point is placed on map
  const handleMapClick = (e, event, wrapper) => {
    const cursor = map.getCanvas().style.cursor;
    if (cursor === 'crosshair') {
      map.getCanvas().style.cursor = '';
      // round long and lat values to 7 decimal places
      const roundedLng = parseFloat(e.lngLat.lng.toFixed(7));
      const roundedLat = parseFloat(e.lngLat.lat.toFixed(7));
      const roundedCoords = { lng: roundedLng, lat: roundedLat };

      // add point at the chosen long lat position
      addPoint(event, roundedCoords);
      // update coordinates of added events
      locationConfirmedCallback(roundedCoords, event);
    }
    map.off('click', wrapper);
  };

  // add point from dragging point onto map
  const addPoint = (eventSelected, mouseCoords) => {
    if (eventSelected === null) {
      return null;
    }

    !done && setDone(true);
    const markers = deviceMarkers;

    const device = eventSelected;
    const deviceId = device.deviceId;
    let index = 0;
    if (markers[deviceId]) {
      index = markers[deviceId].length;
    } else {
      markers[deviceId] = [];
    }

    const el = document.createElement('span');
    el.className = 'marker';
    console.log('color', color[deviceId]);
    const circle = iconStyle();
    el.style.width = circle.width;
    el.style.height = circle.height;
    el.style.backgroundColor = color[deviceId] ? color[deviceId] : getRandomColor(deviceId);
    el.style.borderRadius = circle.borderRadius;
    el.style.border = circle.borderColor;

    // add the event id in the dot to identify the event on the map
    const span = document.createElement('span');
    span.className = 'marker-label';
    span.textContent = eventSelected.newEventId;
    span.style.display = 'flex';
    span.style.alignItems = 'center';
    span.style.justifyContent = 'center';
    span.style.fontWeight = 'bold';
    span.style.lineHeight = '100%';
    span.style.color = 'white';

    el.appendChild(span);

    // set marker id to new event id of event being addded to the map
    el.id = eventSelected.newEventId;
    el.onclick = (e) => {
      console.log('click on', e.target.id);
    };

    const coords = mouseCoords;

    let updatedEventsData = newEvents;

    // add marker to map
    let markerIcon = new mapboxgl.Marker(el, {
      draggable: true,
      scale: 0
    })
      .setLngLat([coords.lng, coords.lat])
      .on('dragstart', (e) => {})
      .on('dragend', (data) => handleDragEnd(data, device, eventSelected));

    markers[deviceId].push(markerIcon);
    markerIcon.addTo(map);

    setDeviceMarkers(markers);
    setDevicePayload({ ...devicePayload, [deviceId]: device });
  };

  // update location of events with a marker on the map
  const locationConfirmedCallback = (lngLat, event) => {
    if (event === null) {
      return;
    }

    // allow next duplicate event to be created
    setCallAutoDuplicate(true);

    // set location coordinates of event added
    event.longitude = lngLat.lng;
    event.latitude = lngLat.lat;
    event.setPoint = true;

    setDevicePayload({ ...devicePayload, [event.deviceId]: event });
  };

  // add point from predetermined long and lat position
  const addLatLongPoint = (eventSelected, longitude, latitude) => {
    !done && setDone(true);
    const markers = deviceMarkers;

    const device = eventSelected;
    const deviceId = device.deviceId;
    let index = 0;
    if (markers[deviceId]) {
      index = markers[deviceId].length;
    } else {
      markers[deviceId] = [];
    }

    const el = document.createElement('span');
    el.className = 'marker';

    const circle = iconStyle();
    el.style.width = circle.width;
    el.style.height = circle.height;
    el.style.backgroundColor = color[deviceId] ? color[deviceId] : getRandomColor(deviceId);
    el.style.borderRadius = circle.borderRadius;
    el.style.border = circle.borderColor;

    const span = document.createElement('span');
    span.className = 'marker-label';
    span.textContent = eventSelected.newEventId;
    span.style.display = 'flex';
    span.style.alignItems = 'center';
    span.style.justifyContent = 'center';
    span.style.fontWeight = 'bold';
    span.style.lineHeight = '100%';
    span.style.color = 'white';

    el.appendChild(span);

    el.id = eventSelected.newEventId;
    el.onclick = (e) => {
      console.log('click on', e.target.id);
    };

    let updatedEventsData = newEvents;

    // Add marker to map
    let markerIcon = new mapboxgl.Marker(el, {
      draggable: true,
      scale: 0
    })
      .setLngLat([longitude, latitude])
      .on('dragstart', (e) => {})
      .on('dragend', (data) => handleDragEnd(data, device, eventSelected));

    markers[deviceId].push(markerIcon);
    markerIcon.addTo(map);

    setDeviceMarkers(markers);
    setDevicePayload({ ...devicePayload, [deviceId]: device });
  };

  // remove point on map for an event
  const removePoint = (eventSelected) => {
    const deviceId = eventSelected.deviceId;
    const markers = deviceMarkers;

    if (markers[deviceId]) {
      const index = markers[deviceId].findIndex((marker) => marker.getElement().id.includes(eventSelected.newEventId));
      if (index !== -1) {
        const markerToRemove = markers[deviceId][index];
        markerToRemove.remove();

        markers[deviceId].splice(index, 1);

        const updatedEventsData = { ...newEvents };
        updatedEventsData.events.forEach((event) => {
          if (event.newEventId === eventSelected.newEventId) {
            // reset longitude, latitude, and set point
            event.longitude = '';
            event.latitude = '';
            event.setPoint = false;
          }
        });
        setDeviceMarkers(markers);
        setNewEvents(updatedEventsData);
      }
    }
  };

  // handle dragging of marker on map and update to new selected position
  const handleDragEnd = (data, mappedEvent, selectedEvent) => {
    const loc = { lat: data.target._lngLat.lat, lng: data.target._lngLat.lng };
    // round long and lat values to 7 decimal places
    const roundedLng = parseFloat(loc.lng.toFixed(7));
    const roundedLat = parseFloat(loc.lat.toFixed(7));
    // console.log('loc', loc);

    !done && setDone(true);
    const deviceId = selectedEvent.deviceId;

    mappedEvent.longitude = roundedLng;
    mappedEvent.latitude = roundedLat;

    // only update on list if event is not recognized as set when dragging
    if (!selectedEvent.setPoint) {
      // update new position of dragged event in newEvents.events list
      const updatedEventsData = { ...newEvents };
      updatedEventsData.events.forEach((event) => {
        if (event.newEventId === selectedEvent.newEventId) {
          event.longitude = roundedLng;
          event.latitude = roundedLat;
          event.setPoint = true;
        }
      });
      setNewEvents(updatedEventsData);
    }

    setDevicePayload({ ...devicePayload, [deviceId]: selectedEvent });
  };

  // process new events for running and saving as a test case
  function processEvents(newEvents) {
    let allEvents = [];
    let type = '';

    newEvents.events.forEach((event) => {
      const location = {
        lng: event.longitude,
        lat: event.latitude,
        speed: event.deviceSpeed
      };
      // 5G device
      if (event.deviceType === '5G') {
        allEvents.push(
          build5gEvent(
            event.eventObject,
            location,
            event.deviceSpeed,
            event.deviceIsMoving,
            moment(event.selectedDate).valueOf(),
            event.scanData,
            event
          )
        );
        if (type === '') {
          type = '5g';
        } else if (type === 'iox') {
          type = 'mix';
        }
      }
      // IOX device
      else {
        if (type === '') {
          type = 'iox';
        } else if (type === '5g') {
          type = 'mix';
        }
        if (event.eventType !== 'gps' && event.numberOfScans > 1) {
          event.scanData.map((scan) => {
            allEvents.push(
              buildIoxEvent(
                event.eventObject,
                location,
                event.deviceSpeed,
                event.deviceIsMoving,
                moment(event.selectedDate).valueOf(),
                event.eventType,
                scan,
                null
              )
            );
          });
        } else {
          allEvents.push(
            buildIoxEvent(
              event.eventObject,
              location,
              event.deviceSpeed,
              event.deviceIsMoving,
              moment(event.selectedDate).valueOf(),
              event.eventType,
              event.scanData && event.scanData.length ? event.scanData[0] : null,
              event.locationAccuracy
            )
          );
        }
      }
    });

    const sorted = allEvents.sort((x, y) => {
      const scanTimeA = x.tagData ? x.tagData.scanTime : x.scanTime;
      const scanTimeB = y.tagData ? y.tagData.scanTime : y.scanTime;
      return scanTimeA - scanTimeB;
    });

    return { sorted, type };
  }

  const submitTest = (runLive) => {
    // stop auto-duplicating events when running events
    stopAutoEventAdding();

    console.log('newEvents.events', newEvents.events);

    // process events and get sorted events and type
    const { sorted, type } = processEvents(newEvents);

    props.setDeviceSelected(sorted[0]);

    // if running existing test case
    if (props.testToEdit?.attachedState) {
      const DEFAULT_RSSI = -100;
      const attachment =
        props.testToEdit.attachedState && props.testToEdit.attachedState.state === 'Detached'
          ? {
              configured: false,
              state: 'Detached',
              correctionRssi: DEFAULT_RSSI,
              rssi: DEFAULT_RSSI,
              attachedTo: null,
              dropRssi: DEFAULT_RSSI,
              dropLocation: null
            }
          : {
              configured: false,
              state: 'Attached',
              correctionRssi: DEFAULT_RSSI,
              rssi: -75,
              attachedTo: props.testToEdit.attachedState.attachedTo,
              dropRssi: DEFAULT_RSSI,
              dropLocation: null
            };
      props.processTestData({
        events: sorted,
        type: type,
        deviceToUpdate: props.testToEdit.deviceToUpdate,
        attachedState: attachment,
        runLive: runLive
      });
    }
    // if running a new test from scratch
    else {
      props.processTestData({
        events: sorted,
        type: type,
        runLive: runLive
      });
    }
  };

  const handleQuickEdit = () => {
    // update time of selected event with quick edit slider
    const updatedEventsData = { ...newEvents };
    updatedEventsData.events.forEach((event) => {
      if (event.newEventId === selectedQuickEditEvent) {
        event.selectedDate = selectedDate;
        const initialScanData = handleDateChange(selectedDate, event.scanData);
        event.scanData = initialScanData;
        setScanData(initialScanData);
      }
    });
    setNewEvents(updatedEventsData);
  };

  const handleManageTests = () => {
    // set view to manage test cases
    props.setSimulatorView('management');
    // reset to new test case and list of events
    props.setTestToEdit(undefined);
    props.setEventsToEdit(undefined);
  };

  const handleSaveTest = () => {
    // process events and get sorted events and type
    const { sorted, type } = processEvents(newEvents);

    // don't save if test case name is blank
    if (testCaseName === '') {
      props.setNote({
        message: `Please provide the test case with a name`,
        variant: 'warning'
      });
      return;
    }

    // don't save if attachment info invalid
    if (
      (attachmentDeviceId === null && attachmentStatus !== null) ||
      (attachmentDeviceId !== null && attachmentStatus === null) ||
      (attachmentStatus === 'Attached' && attachmentToDeviceId === null)
    ) {
      props.setNote({
        message: `Please fill out all required attachment fields`,
        variant: 'warning'
      });
      return;
    }

    // create attachedState object with our inputted state and attached to device
    let attachedStateObject;
    if (attachmentDeviceId !== null) {
      attachedStateObject = {
        ...attachmentObject,
        state: attachmentStatus,
        attachedTo: attachmentToDeviceId
      };
    } else {
      attachedStateObject = null;
    }

    // find an existing test case with the same name
    const existingTestCase = props.testCases.find((testCase) => testCase.name === testCaseName);

    if (existingTestCase) {
      // if a test case with the same name exists
      if (existingTestCase.isDefault) {
        // if the conflicting test case is default, show a warning notification and don't save
        props.setNote({
          message: `Cannot edit default test case '${testCaseName}'. Choose a different name.`,
          variant: 'warning'
        });
        return;
      }
      // overwrite test case if conflict is not with default test case
      else {
        // overwrite test case by providing the same test id
        props.setDeviceSelected(sorted[0]);
        props.updateTestCases({
          events: sorted,
          type: type,
          testId: existingTestCase.testId,
          testName: testCaseName,
          owner: undefined,
          attachedState: attachedStateObject,
          deviceToUpdate: attachmentDeviceId
        });
      }
    }
    // if test name selected does not already exist, create new test case
    else {
      props.setDeviceSelected(sorted[0]);
      props.updateTestCases({
        events: sorted,
        type: type,
        testId: undefined,
        testName: testCaseName,
        owner: undefined,
        attachedState: attachedStateObject,
        deviceToUpdate: attachmentDeviceId
      });
    }

    // close save test case modal
    setOpenSaveTest(false);
  };

  // build Iox event when processing events for running or saving
  const buildIoxEvent = (
    deviceData,
    location,
    speed,
    isMoving,
    selectedTime,
    eventType,
    scanData,
    locationAccuracy
  ) => {
    const scanTime = scanData ? moment(scanData.scanTime).valueOf() : selectedTime;
    const eventId = `${deviceData.deviceId}.${scanTime}`;
    const goId = deviceData.deviceId.split('.')[1];
    const isAnchorScan = (scanData && scanData.isAnchor) || false;
    const isFixedAsset = deviceData.fixAsset;
    const locatorLoc = getPosition(isAnchorScan ? scanData.deviceId : isFixedAsset ? deviceData.deviceId : null);

    const event = {
      locatorId: eventType === 'scans' && isAnchorScan ? scanData.deviceId : deviceData.deviceId,
      goId: goId,
      eventTime: new Date(scanTime),
      eventId: eventId,
      organization: deviceData.organization,
      receivedAt: scanTime,
      assetName: deviceData.assetName,
      deviceId:
        (eventType === 'scans' && isAnchorScan) || eventType === 'gps' ? deviceData.deviceId : scanData.deviceId,
      isLogRec: eventType === 'scans' ? false : true,
      isBleScan: eventType === 'scans' ? true : false,
      feedSource: eventType === 'scans' ? 'IOXScan' : 'LogRecord',
      scanTime: scanTime,
      telemetry: {
        isMoving: eventType === 'scans' ? scanData.isMoving || false : isMoving
      },
      requestDate: scanTime,
      rssi: eventType === 'scans' ? +scanData.rssi : -48,
      measuredPower: -48,
      beaconType: 'assetfloNearable',
      protocol: eventType === 'scans' && !isAnchorScan ? 'BLE' : 'IOX',
      localization: eventType === 'scans' && !isAnchorScan ? 'asset' : 'own',
      ...(eventType !== 'scans' && {
        location: {
          ...location,
          alt: 1,
          speed: speed,
          eventId: eventId,
          goId: goId,
          eventTime: new Date(scanTime),
          accuracy: locationAccuracy
        }
      }),

      locatorLoc: locatorLoc || {
        ...location,
        alt: 1,
        speed: speed,
        eventId: eventId,
        goId: goId,
        eventTime: new Date(scanTime),
        accuracy: locationAccuracy
      },
      ...(eventType === 'scans' && {
        locatorName: deviceData.assetName
      })
    };
    return event;
  };

  // find position of device given device id
  const getPosition = (deviceId) => {
    if (!deviceId) return null;
    const device = props.devices.find((dev) => dev.deviceId === deviceId);
    return device.location;
  };

  // adding/editing event modal useState variables
  const [openEvent, setOpenEvent] = useState(false);
  const [openQuickEdit, setOpenQuickEdit] = useState(false);
  const [openSaveTest, setOpenSaveTest] = useState(false);
  const modalRef = useRef(null);

  // adding or editing an event using the modal
  const [isAdd, setIsAdd] = useState(true);
  // old long and lat variables for detecting if the long and lat have changed when editing an event
  const [oldLatitude, setOldLatitude] = useState('');
  const [oldLongitude, setOldLongitude] = useState('');

  // auto duplicate useState variables
  const [nextDuplicateEvent, setNextDuplicateEvent] = useState(null);
  const [callAutoDuplicate, setCallAutoDuplicate] = useState(false);

  // event being edited
  const [editEventObject, setEditEventObject] = useState({});

  // end auto duplicating loop and reset values
  const stopAutoEventAdding = () => {
    // make cursor non cross hair
    map.getCanvas().style.cursor = '';

    // simulate a click to conclude final setAddMode call
    if (clickEvt) {
      map.off('click', clickEvt);
      clickEvt = null;
    }

    // reset auto duplicate variables
    setNextDuplicateEvent(null);
    setCallAutoDuplicate(false);
  };

  // event modal functions
  const handleOpenAddEvent = () => {
    // stop auto-duplicating events when adding new event
    stopAutoEventAdding();

    // set selected date to be latest based on existing list
    setSelectedDate(findLargestSelectedDate());

    // set modal to add event mode
    setIsAdd(true);

    // reset long and lat position for next addition to be done on map
    setLongitude('');
    setLatitude('');

    // open modal
    setOpenEvent(true);
  };

  function sameEvent(oldEvent, newEvent) {
    const keys1 = Object.keys(oldEvent);
    const keys2 = Object.keys(newEvent);

    // if there are different number of props, events are different
    if (keys1.length !== keys2.length) {
      return false;
    }

    for (let key of keys1) {
      // if the new event has a locatiom, check location difference with current long and lat values
      if ((newEvent.setPoint && oldLatitude !== latitude) || oldLongitude !== longitude) {
        return false;
      }
      // check difference for all other props, ignore setPoint
      else if (
        key !== 'setPoint' &&
        key !== 'latitude' &&
        key !== 'longitude' &&
        key !== 'selectedDate' &&
        oldEvent[key] !== newEvent[key]
      ) {
        return false;
      }
      // check time difference, converting date to string if needed
      else if (
        key === 'selectedDate' &&
        (typeof oldEvent[key] !== 'string' ? oldEvent[key].toISOString() : oldEvent[key]) !==
          (typeof newEvent[key] !== 'string' ? newEvent[key].toISOString() : newEvent[key])
      ) {
        return false;
      }
    }

    return true;
  }

  const handleClickAwayEvent = () => {
    // if event is being edited, check if unsaved changes have been made
    if (!isAdd) {
      // replace event being edited with new event object containing updated fields
      let newEvent = {
        newEventId: editEventObject.newEventId,
        setPoint: editEventObject.setPoint,
        eventObject: eventObject,
        selectedDate: selectedDate,
        deviceId: eventDeviceId,
        deviceType: deviceType,
        eventType: editEventObject.eventType,
        isDuplicate: editEventObject.isDuplicate
      };

      // update with more properties depending on event and device types
      newEvent = updateEventProps(newEvent);
      if (newEvent === null) {
        return;
      }

      // if event has a set point, initialize the long and lat positions
      if (editEventObject.setPoint) {
        newEvent.longitude = editEventObject.longitude;
        newEvent.latitude = editEventObject.latitude;
      }

      // if the event being edited and the new event replacing it are different, there are unsaved changes
      if (!sameEvent(editEventObject, newEvent)) {
        props.setNote({
          message: `Unsaved changes found. Click Save Edits to edit event.`,
          variant: 'warning'
        });
      } else {
        // close modal if no unsaved changes are made
        setOpenEvent(false);
      }
    } else {
      // close modal when adding event and clicked away
      setOpenEvent(false);
    }
  };

  const handleClickEvent = () => {
    // reverse previous state of open modal
    setOpenEvent((prev) => !prev);
  };

  // quick edit modal functions
  const handleOpenQuickEdit = () => {
    // stop auto-duplicating events when quick editing events
    stopAutoEventAdding();

    if (newEvents.events.length > 0) {
      // preset time and isMoving fields, if there are new events
      const selectedEventObject = newEvents.events.find((event) => event.newEventId === selectedQuickEditEvent);
      // convert string format of edited event's selectedDate to object format
      const selectedDateObject = new Date(selectedEventObject.selectedDate);
      setSelectedDate(selectedDateObject);
    }

    setOpenQuickEdit(true);
  };

  const handleClickAwayQuickEdit = () => {
    // close modal
    setOpenQuickEdit(false);
  };

  const handleClickQuickEdit = () => {
    setOpenQuickEdit((prev) => !prev);
  };

  // save test modal functions
  const handleOpenSaveTest = () => {
    // stop auto-duplicating events when saving events
    stopAutoEventAdding();

    // reset fields that may have been set before
    setAttachmentStatus(null);
    setAttachmentDeviceId(null);
    setAttachmentToDeviceId(null);
    setAttachmentObject(null);
    setAttachmentToObject(null);

    // preset fields if attachedState has been set
    if (props.testToEdit && props.testToEdit.attachedState !== undefined && props.testToEdit.attachedState !== null) {
      setAttachmentStatus(props.testToEdit.attachedState.state);
      setAttachmentDeviceId(props.testToEdit.deviceToUpdate);
      setAttachmentToDeviceId(props.testToEdit.attachedState.attachedTo);
      const foundAttachmentObject = props.devices.find(
        (device) => device.deviceId && device.deviceId === props.testToEdit.deviceToUpdate
      );
      setAttachmentObject(foundAttachmentObject);
      const foundAttachmentToObject = props.devices.find(
        (device) => device.deviceId && device.deviceId === props.testToEdit.attachedState.attachedTo
      );
      setAttachmentToObject(foundAttachmentToObject);
    }
    setOpenSaveTest(true);
  };

  const handleClickAwaySaveTest = () => {
    // close modal
    setOpenSaveTest(false);
  };

  const handleClickSaveTest = () => {
    setOpenSaveTest((prev) => !prev);
  };

  // test case attachment state use state variables
  const [attachmentStatus, setAttachmentStatus] = useState(null);
  const [attachmentDeviceId, setAttachmentDeviceId] = useState(null);
  const [attachmentObject, setAttachmentObject] = useState(null);
  const [attachmentToDeviceId, setAttachmentToDeviceId] = useState(null);
  const [attachmentToObject, setAttachmentToObject] = useState(null);
  const attachmentTypes = ['Attached', 'Detached'];

  const handleAttachmentStatusChange = (value) => {
    if (value === 'Detached') {
      setAttachmentToObject(null);
      setAttachmentToDeviceId(null);
    }
    setAttachmentStatus(value);
  };

  const handleAttachmentDeviceIdChange = (value) => {
    if (value) {
      setAttachmentDeviceId(value.deviceId);
      setAttachmentObject(value);
    }
  };

  const handleAttachmentToDeviceIdChange = (value) => {
    if (value) {
      setAttachmentToDeviceId(value.deviceId);
      setAttachmentToObject(value);
    }
  };

  // event device id and type useState variable
  const [eventDeviceId, setEventDeviceId] = useState('');
  const [eventObject, setEventObject] = useState({});
  const [deviceType, setDeviceType] = useState('');
  const [showDeviceFields, setShowDeviceFields] = useState(false);
  const [show5GFields, setShow5GFields] = useState(false);
  const [showIOXFields, setShowIOXFields] = useState(false);

  const handleEventDeviceIdChange = (value) => {
    if (value) {
      setEventDeviceId(value.deviceId);

      // set event object and eventTime of object based on selected event time
      setEventObject(value);
      eventObject.eventTime = selectedDate;

      // choose device type based on protocol
      let deviceTypeValue;
      if (value.protocol === 'LTE') {
        deviceTypeValue = '5G';
      } else if (value.protocol === 'IOX' || value.protocol === 'BLE') {
        deviceTypeValue = 'IOX';
      } else {
        deviceTypeValue = '';
      }
      setDeviceType(deviceTypeValue);
      setShowDeviceFields(deviceTypeValue === '5G' || deviceTypeValue === 'IOX');
      if (deviceTypeValue === '5G') {
        setShowDeviceFields(true);
        setShow5GFields(true);
        setShowIOXFields(false);
        setShowScansFields(false);
        setShowGpsFields(false);
      } else if (deviceTypeValue == 'IOX') {
        setShowDeviceFields(true);
        setShowIOXFields(true);
        setShow5GFields(false);
        setShowScansFields(false);
        setShowGpsFields(false);
      } else {
        setShowDeviceFields(false);
        setShow5GFields(false);
        setShowIOXFields(false);
      }
    } else {
      setEventObject({});
      setEventDeviceId('');
      setEventType('');
      setShowDeviceFields(false);
      setShow5GFields(false);
      setShowIOXFields(false);
    }
  };

  const handleIOXScanDeviceIdChange = (value) => {
    if (value) {
      setScanDeviceId(value.deviceId);
      setScanDeviceObject(value);
    }
  };

  // Select event type useState variables
  const [eventType, setEventType] = useState('');
  const [showEventFields, setShowEventFields] = useState(false);
  const [showScansFields, setShowScansFields] = useState(false);
  const [showGpsFields, setShowGpsFields] = useState(false);

  const handleEventTypeChange = (value) => {
    setEventType(value);
    setShowEventFields(value === 'scans' || value === 'gps' || 'scans AND gps');
    if (value === 'scans') {
      setShowEventFields(true);
      setShowScansFields(true);
    } else if (value == 'gps') {
      setShowEventFields(true);
      setShowGpsFields(true);
    } else if (value === 'scans AND gps') {
      setShowEventFields(true);
      setShowScansFields(true);
      setShowGpsFields(true);
    } else {
      setShowEventFields(false);
      setShowScansFields(false);
      setShowGpsFields(false);
    }
  };

  // GPS/Scans fields useState variables
  const [hdop, setHdop] = useState(8);
  const [satsUsed, setSatsUsed] = useState(12);
  const [batterylevel, setBatterylevel] = useState(13);
  const [temperature, setTemperature] = useState(12);
  const [isCached, setIsCached] = useState(false);
  const [powerConnected, setPowerConnected] = useState(false);
  const [deviceSpeed, setDeviceSpeed] = useState(5);
  const [heading, setHeading] = useState('');
  const [locationAccuracy, setLocationAccuracy] = useState(1);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [numScans, setNumScans] = useState('');
  const [scanDeviceId, setScanDeviceId] = useState('');
  const [scanDeviceObject, setScanDeviceObject] = useState({});

  // select time of event down to the second
  const [selectedDate, setSelectedDate] = useState(new Date());
  // current time of saving a test case
  const [currentTestTime, setCurrentTestTime] = useState('');

  // changes date to new selected date, updates scan data to this change, and returns initial scan data
  const handleDateChange = (value, eventScanData) => {
    setSelectedDate(value);
    eventObject.eventTime = selectedDate;

    // convert the selected date to local time using moment
    const localSelectedDate = moment(value).valueOf();

    // reset scanTimes for scanData based on new time
    const initialScanData = eventScanData.map((oldProps, index) => {
      const updatedScanTime = index === 0 ? localSelectedDate : incrementTime(localSelectedDate, index * 10);
      return {
        ...oldProps,
        scanTime: updatedScanTime
      };
    });

    setScanData(initialScanData);

    // return scan data with updated scanTimes based on new selectedDate
    return initialScanData;
  };

  // date selection for events with hours, minutes, seconds, and milliseconds input
  const timePicker = () => {
    const handleHoursChange = (event) => {
      const newDate = new Date(selectedDate);
      const hours = parseInt(event.target.value, 10);
      newDate.setHours(hours || 0);
      handleDateChange(newDate, scanData);
    };

    const handleMinutesChange = (event) => {
      const newDate = new Date(selectedDate);
      const minutes = parseInt(event.target.value, 10);
      newDate.setMinutes(minutes || 0);
      handleDateChange(newDate, scanData);
    };

    const handleSecondsChange = (event) => {
      const newDate = new Date(selectedDate);
      const seconds = parseInt(event.target.value, 10);
      newDate.setSeconds(seconds || 0);
      handleDateChange(newDate, scanData);
    };

    const handleMillisecondsChange = (event) => {
      const newDate = new Date(selectedDate);
      const milliseconds = parseInt(event.target.value, 10);
      newDate.setMilliseconds(milliseconds || 0);
      handleDateChange(newDate, scanData);
    };

    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Grid container justifyContent="space-around">
          <FormControl>
            <InputLabel htmlFor="hours">Hours</InputLabel>
            <Input
              id="hours"
              type="number"
              value={selectedDate.getHours()}
              onChange={handleHoursChange}
              style={{ width: '70px', textAlign: 'center' }}
            />
          </FormControl>
          <FormControl>
            <InputLabel htmlFor="minutes">Minutes</InputLabel>
            <Input
              id="minutes"
              type="number"
              value={selectedDate.getMinutes()}
              onChange={handleMinutesChange}
              style={{ width: '70px', textAlign: 'center' }}
            />
          </FormControl>
          <FormControl>
            <InputLabel htmlFor="seconds">Seconds</InputLabel>
            <Input
              id="seconds"
              type="number"
              value={selectedDate.getSeconds()}
              onChange={handleSecondsChange}
              style={{ width: '80px', textAlign: 'center' }}
            />
          </FormControl>
          <FormControl>
            <InputLabel htmlFor="milliseconds">Milliseconds</InputLabel>
            <Input
              id="milliseconds"
              type="number"
              value={selectedDate.getMilliseconds()}
              onChange={handleMillisecondsChange}
              style={{ width: '100px', textAlign: 'center' }}
            />
          </FormControl>
        </Grid>
      </LocalizationProvider>
    );
  };

  const datePicker = () => {
    const handleDatePick = (date) => {
      console.log(date, isNaN(date));
      if (!isNaN(date)) {
        // return;
        const newDate = new Date(selectedDate);
        const dateData = new Date(date);
        const dd = dateData.getDate();
        const mm = dateData.getMonth();
        const yy = dateData.getFullYear();
        newDate.setDate(dd);
        newDate.setMonth(mm);
        newDate.setFullYear(yy);
        handleDateChange(newDate, scanData);
      }
      setIsValidDate(!isNaN(date));
    };

    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Grid container justifycontent="space-around">
          <DatePicker
            disableToolbar
            variant="inline"
            format="MM/dd/yyyy"
            margin="normal"
            id="date-picker-inline"
            label="Date picker"
            value={selectedDate}
            onChange={handleDatePick}
            KeyboardButtonProps={{
              'aria-label': 'change date'
            }}
            error={!isValidDate}
            helperText={!isValidDate ? 'Invalid date' : ''}
          />
        </Grid>
      </LocalizationProvider>
    );
  };

  // isMoving useState variable for gps events
  const [deviceIsMoving, setDeviceIsMoving] = useState(false);

  const handleIsMovingCheckChange = (event) => {
    setDeviceIsMoving(event.target.checked);
  };

  // list of event types
  const eventTypes = ['scans', 'gps', 'scans AND gps'];

  // selection component for event type
  const selectEventType = () => {
    const options = deviceType === 'IOX' ? eventTypes.slice(0, 2) : eventTypes;
    return (
      <div>
        <Typography variant="h6" component="h2">
          <span style={{ color: 'black', fontSize: '14px' }}>Event Type</span>
        </Typography>
        <Autocomplete
          id="combo-box-demo"
          options={options}
          getOptionLabel={(option) => option || ''}
          style={{ width: 300 }}
          renderInput={(params) => <TextField {...params} label="select event type" variant="outlined" />}
          value={eventType}
          onChange={(event, value) => handleEventTypeChange(value)}
          disabled={!isAdd} // disable changing event type if on edit mode
        />
      </div>
    );
  };

  // scan data in a nested list cotaining scanTime, rssi, isMoving in a seperate list for each scan
  const [scanData, setScanData] = useState([]);

  const handleNumScans = (value) => {
    setNumScans(value);

    // convert the selected date to local time using moment
    const localSelectedDate = moment(selectedDate).valueOf();

    // initialize scanData with placeholder objects based on numScans
    const initialScanData = Array.from({ length: value }, (_, index) => {
      // format time in hours, minutes, seconds
      const scanTime = localSelectedDate;
      return {
        scanTime,
        deviceId: '',
        rssi: -70,
        isMoving: false,
        temperature: 25,
        batterylevel: 87,
        isAnchor: false
      };
    });

    setScanData(initialScanData);
  };

  // increment time by 10 seconds for further scan times
  const incrementTime = (date, seconds) => {
    const newDate = new Date(date);
    newDate.setSeconds(newDate.getSeconds() + seconds);
    const localSelectedDate = moment(newDate).valueOf();
    return localSelectedDate;
  };

  // function to convert milliseconds to HH:MM:SS format for display
  const convertMillisecondsToHHMMSS = (milliseconds) => {
    const date = new Date(milliseconds);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  // function to convert HH:MM:SS string format to milliseconds for scanTime use
  const convertHHMMSSToMilliseconds = (timeString) => {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    const totalMilliseconds = (hours * 60 * 60 + minutes * 60 + seconds) * 1000;
    return totalMilliseconds;
  };

  // render scan inputs for scan events
  const renderScanInputs = (eventObject) => {
    const scans = [];

    // initialize scan data with starting values
    for (let i = 0; i < parseInt(numScans); i++) {
      const scan = scanData[i] || {};

      const scanTime = scan.scanTime || '';
      const rssi = scan.rssi !== '' || scan.rssi === undefined ? scan.rssi : -70;
      const isMoving = scan.isMoving || false;
      const temperature = 25;
      const batterylevel = 87;
      const isAnchor = eventObject.isAnchor;

      scans.push({
        scanTime: scanTime,
        rssi: rssi,
        isMoving: isMoving,
        temperature: temperature,
        batterylevel: batterylevel,
        isAnchor: isAnchor
      });
    }

    return scans.map((scan, i) => (
      <Box key={i} sx={{ display: 'flex' }}>
        <input
          id={`scanTime-${i}`}
          type="time"
          step="2"
          value={convertMillisecondsToHHMMSS(scan.scanTime)}
          onChange={(event) => handleScanTimeChange(event, i)}
        />
        {/* allow device id to be chosen for each scan for 5g events*/}
        {deviceType === '5G' && (
          <Autocomplete
            id="combo-box-demo"
            options={props.devices && props.devices.filter((device) => device.protocol === 'BLE')}
            getOptionLabel={(option) => option.assetName}
            style={{ width: 300, margin: '10px' }}
            renderInput={(params) => <TextField {...params} label="select scan device" variant="outlined" />}
            value={
              scanData[i] && scanData[i].deviceId !== ''
                ? props.devices.find((device) => device.deviceId === scanData[i].deviceId)
                : null
            }
            onChange={(event, value) => handle5GScanDeviceIdChange(value, i)}
          />
        )}
        <TextField
          type="number"
          label="Enter RSSI"
          variant="outlined"
          style={{ margin: '10px' }}
          value={scan.rssi}
          onChange={(event) => handleScanRssiChange(event, i)}
          inputProps={{
            min: -100,
            max: 0
          }}
        />
        <FormControlLabel
          control={
            <Checkbox
              style={{ margin: '10px' }}
              checked={scan.isMoving}
              onChange={(event) => handleScanIsMovingChange(event, i)}
              color="primary"
            />
          }
          label="Is Moving"
        />
      </Box>
    ));
  };

  // handle time change for a scan
  const handleScanTimeChange = (event, index) => {
    const newData = [...scanData];

    if (!newData[index]) {
      newData[index] = {};
    }

    // initialize constant fields
    newData[index].temperature = 25;
    newData[index].batterylevel = 87;

    // convert string input into milliseconds for scanTime
    newData[index].scanTime = convertHHMMSSToMilliseconds(event.target.value);

    // if updating the first scan time, update the rest of the scan times accordingly
    if (index === 0) {
      const currentTime = event.target.value;
      const newDate = new Date(convertHHMMSSToMilliseconds(currentTime));
      const hours = newDate.getHours();
      const minutes = newDate.getMinutes();
      const seconds = newDate.getSeconds();
      const timeInSeconds = hours * 3600 + minutes * 60 + seconds;

      for (let i = 1; i < newData.length; i++) {
        const newTimeInSeconds = timeInSeconds + i * 10;
        const newHours = Math.floor(newTimeInSeconds / 3600)
          .toString()
          .padStart(2, '0');
        const newMinutes = Math.floor((newTimeInSeconds % 3600) / 60)
          .toString()
          .padStart(2, '0');
        const newSeconds = (newTimeInSeconds % 60).toString().padStart(2, '0');
        newData[i].scanTime = convertHHMMSSToMilliseconds(`${newHours}:${newMinutes}:${newSeconds}`);
      }
    }

    // update scan data based on intialized values
    setScanData(newData);
  };

  // handle device id change for 5g scans that each have a unique device id
  const handle5GScanDeviceIdChange = (value, index) => {
    const newData = [...scanData];
    if (!newData[index]) {
      newData[index] = {};
    }

    newData[index].deviceId = value ? value.deviceId : '';

    setScanData(newData);
  };

  // handle rssi change for a scan
  const handleScanRssiChange = (event, index) => {
    const newData = [...scanData];
    const inputValue = event.target.value;

    // Check if the input value is a valid number in range -100 - 0
    let value;
    if (inputValue === '') {
      // allow empty value
      value = null;
    } else {
      value = parseInt(inputValue, 10);
      if (isNaN(value)) {
        return;
      }
      value = Math.max(Math.min(value, 0), -100);
    }

    if (!newData[index]) {
      newData[index] = {};
    }

    newData[index].rssi = value;
    setScanData(newData);
  };

  // handle isMoving change for a scan
  const handleScanIsMovingChange = (event, index) => {
    const newData = [...scanData];
    const checked = event.target.checked;

    if (!newData[index]) {
      newData[index] = {};
    }

    newData[index].isMoving = checked;
    setScanData(newData);
  };

  // each test case has a name, list of events, date, etc
  const [testCaseName, setTestCaseName] = useState('');

  // update test case name with existing test case being edited if it exists
  useEffect(() => {
    if (props.testToEdit) {
      setTestCaseName(props.testToEdit.testName);
    }
    console.log('props.eventsToEdit', props.eventsToEdit);
  }, [props.testToEdit]);

  // testCaseId useState variable
  const [testCaseId, setTestCaseId] = useState(1);

  // list of new events to be added
  const [newEvents, setNewEvents] = useState({
    // if user has selected events to be edited, initialize newEvents with this list
    events: props.eventsToEdit !== undefined ? props.eventsToEdit : []
  });

  // eventId useState variable
  const [newEventId, setNewEventId] = useState(1);

  // eventId for quick editing with the slider
  const [selectedQuickEditEvent, setSelectedQuickEditEvent] = useState(1);

  const handleSelectedQuickEditEventChange = (value) => {
    setSelectedQuickEditEvent(value);
    // preset time and isMoving fields
    const selectedEventObject = newEvents.events.find((event) => event.newEventId === value);
    // convert string format of edited event's selectedDate to object format
    const selectedDateObject = new Date(selectedEventObject.selectedDate);
    setSelectedDate(selectedDateObject);
  };

  // function to calculate the largest event Id from the list of newEvents
  const findLargestEventId = () => {
    // if new events list is empty, init new event id to 1
    if (newEvents.events.length === 0) {
      return 1;
    }

    // find the largest event Id using the reduce method
    const largestEventId = newEvents.events.reduce((maxId, event) => {
      return event.newEventId > maxId ? event.newEventId : maxId;
    }, 0);

    // increment the largest event Id by 1
    return largestEventId + 1;
  };

  const findLargestSelectedDate = () => {
    // if new events list is empty, use the current date
    if (newEvents.events.length === 0) {
      return new Date();
    }

    // sort the events array by selectedDate
    const sortedEvents = newEvents.events.sort(
      (a, b) => moment(a.selectedDate).valueOf() - moment(b.selectedDate).valueOf()
    );

    // get the last event (with the largest selectedDate)
    const largestEvent = sortedEvents[sortedEvents.length - 1];

    // set date to 5 seconds after the largest selected date
    const newDate = new Date(new Date(largestEvent.selectedDate).getTime() + 5000);
    const initialScanData = handleDateChange(newDate, scanData);
    setScanData(initialScanData);
    return newDate;
  };

  // set event id and selected date based on existing list
  useEffect(() => {
    // Set the newEventId state using the calculated value
    setNewEventId(findLargestEventId());
    setSelectedDate(findLargestSelectedDate());
  }, [newEvents.events]);

  // add all points to map from existing list
  useEffect(() => {
    // only update points on map if map is renderd
    if (map) {
      // loop through each event in newEvents and add each point to map
      newEvents.events.forEach((event) => {
        if (event.eventType !== 'scans' && event.setPoint === true) {
          addLatLongPoint(event, event.longitude, event.latitude);
        }
      });
    }
  }, [map]);

  // useEffect hook to update the current time when the saveTest modal opens
  useEffect(() => {
    if (openSaveTest) {
      const now = new Date();
      // format the time as a string
      setCurrentTestTime(
        now.toLocaleString(undefined, {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    }
  }, [openSaveTest]);

  // return event with unique props for it's device and event type
  const updateEventProps = (eventToUpdate) => {
    // gps events and 5g scans have isMoving for devices
    if (eventType !== 'scans' || (eventType !== 'gps' && deviceType === '5G')) {
      eventToUpdate.deviceIsMoving = deviceIsMoving;
    }

    // Check if locationAccuracy is required based on deviceType and eventType
    if (deviceType === 'IOX' && (eventType === 'gps' || eventType === 'scans AND gps')) {
      eventToUpdate.locationAccuracy = locationAccuracy;
    }

    // Check if numScans is required based on eventType
    if (eventType === 'scans' || eventType === 'scans AND gps') {
      // iox events have the same device id for all scans
      if (deviceType === 'IOX') {
        eventToUpdate.scanDeviceId = scanDeviceId;
      }
      eventToUpdate.numberOfScans = numScans;

      // check if all device id and rssi fields are filled out in scanData, if not return null
      if (
        scanData.length !== parseInt(numScans) ||
        scanData.some(
          (scan) => scan.scanTime === '' || scan.rssi === '' || scan.scanTime === null || scan.rssi === null
        )
      ) {
        props.setNote({
          message: `Please fill out all required scan fields`,
          variant: 'warning'
        });

        return null;
      }

      // if device is 5G, each has a specific device id to validate
      if (deviceType === '5G' && scanData.some((scan) => scan.deviceId === '' || scan.deviceId === null)) {
        props.setNote({
          message: `Please fill out all required scan fields`,
          variant: 'warning'
        });
        return null;
      }

      // update deviceId for each scan for iox scans
      const updatedScanData = scanData.map((data) => {
        // if event is IOX, update each device id with the same scanDeviceId
        if (eventToUpdate.deviceType === 'IOX') {
          return { ...data, deviceId: scanDeviceId, isAnchor: scanDeviceObject.isAnchor };
        } else {
          return { ...data };
        }
      });

      eventToUpdate.scanData = updatedScanData;
    }

    // check if hdop and satsUsed is required based on deviceType and eventType
    if (deviceType === '5G' && (eventType === 'gps' || eventType === 'scans AND gps')) {
      eventToUpdate.hdop = hdop;
      eventToUpdate.satsUsed = satsUsed;

      if (heading) {
        eventToUpdate.heading = heading;
      }
    }
    if (deviceType === '5G') {
      eventToUpdate.batterylevel = batterylevel;
      eventToUpdate.temperature = temperature;
      eventToUpdate.isCached = isCached;
      eventToUpdate.powerConnected = powerConnected;
    }

    if (eventType === 'gps' || eventType === 'scans AND gps') {
      // include Device Speed, Longitude, and Latitude device data if gps is chosen
      eventToUpdate.deviceSpeed = deviceSpeed;
      eventToUpdate.longitude = longitude;
      eventToUpdate.latitude = latitude;
    }

    return eventToUpdate;
  };

  // return true if there are 0 missing fields for events
  const checkMissingEventFields = (eventToCheck) => {
    // create missing fields list for all empty required fields
    const missingFields = [];
    for (const key in eventToCheck) {
      if (
        key !== 'scanData' &&
        key !== 'date' &&
        key !== 'deviceIsMoving' &&
        key !== 'longitude' &&
        key !== 'latitude' &&
        key !== 'newEventId' &&
        key !== 'setPoint' &&
        key !== 'eventObject' &&
        (eventToCheck[key] === '' || eventToCheck[key] === null)
      ) {
        missingFields.push(key);
      }
    }

    return missingFields.length === 0;
  };

  // return false if either
  //   One of latitude and longitude is empty and the other non-empty
  //   or, both are non-empty but at least one of them isn't in range
  const checkCoordinates = (latitude, longitude) => {
    if (latitude === undefined && longitude === undefined) return true;
    if (latitude === '' && longitude === '') return true;
    if (latitude === '' || longitude === '') return false;
    if (Number(latitude) <= 90 && Number(latitude) >= -90 && Number(longitude) >= -180 && Number(longitude) <= 180)
      return true;
    return false;
  };

  // handle event addition after information is entered
  const handleAdd = () => {
    const maxNewEventId = newEvents.events.reduce((maxId, event) => {
      return Math.max(maxId, event.newEventId);
    }, 0);

    let eventToAdd = {
      newEventId: maxNewEventId + 1,
      setPoint: false,
      eventObject: eventObject,
      selectedDate: selectedDate,
      deviceId: eventDeviceId,
      deviceType: deviceType,
      eventType: eventType,
      isDuplicate: false
    };

    // update with more properties depending on event and device types
    eventToAdd = updateEventProps(eventToAdd);
    if (eventToAdd === null) {
      return;
    }

    // if latitude and longitude are not set correctly, display error
    if (!checkCoordinates(eventToAdd['latitude'], eventToAdd['longitude'])) {
      props.setNote({
        message: `Please fill out latitude and longitude while keeping them in range`,
        variant: 'warning'
      });
      return;
    }

    // if there is no missing data, allow event to be added
    if (checkMissingEventFields(eventToAdd)) {
      // set current event object variable to be a duplicate to avoid changing past event object fields
      const duplicateEventObject = { ...eventObject };
      setEventObject(duplicateEventObject);

      // if event is scans add it to list of new events
      if (eventType === 'scans') {
        setNewEvents((prevState) => ({
          ...prevState,
          events: [...prevState.events, eventToAdd]
        }));
      }
      // if event involves a gps event, only add to list if manual long lat is given
      else {
        // add point to map if manual long and lat has been set
        if (longitude !== '' && latitude !== '') {
          addLatLongPoint(eventToAdd, longitude, latitude);
          eventToAdd.setPoint = true;

          setNewEvents((prevState) => ({
            ...prevState,
            events: [...prevState.events, eventToAdd]
          }));
        }
        // if lat long not given, start adding events one at a time after location is set
        else {
          setNextDuplicateEvent(eventToAdd);
          setAddMode(eventToAdd);
        }

        // close modal after gps event is created, keep open for scans
        setOpenEvent(false);
      }
    } else {
      props.setNote({
        message: `Please fill out all required fields`,
        variant: 'warning'
      });
    }
  };

  useEffect(() => {
    if (callAutoDuplicate === true && nextDuplicateEvent !== null) {
      const newDate = new Date(nextDuplicateEvent.selectedDate.getTime() + 5000);

      const newEvent = {
        ...nextDuplicateEvent,
        newEventId: nextDuplicateEvent.newEventId + 1,
        setPoint: false,
        latitude: '',
        longitude: '',
        selectedDate: newDate,
        isDuplicate: true
      };

      // update scan times if event contains scans
      if (nextDuplicateEvent.eventType !== 'gps') {
        const initialScanData = handleDateChange(newDate, nextDuplicateEvent.scanData);
        newEvent.scanData = initialScanData;
        setScanData(initialScanData);
      }

      setNextDuplicateEvent(newEvent);

      setCallAutoDuplicate(false);

      setAddMode(newEvent);

      // add auto duplicate event to list of new events
      if (nextDuplicateEvent !== null) {
        setNewEvents((prevState) => ({
          ...prevState,
          events: [...prevState.events, nextDuplicateEvent]
        }));
      }
    }
  }, [locationConfirmedCallback]);

  // handle event addition after information is entered
  const handleDuplicateEvent = (eventToDuplicate) => {
    // stop auto-duplicating if event is manually duplicated
    stopAutoEventAdding();

    // add duplicate point in the same position
    const newDate = new Date(findLargestSelectedDate());
    const newDuplicateEvent = {
      ...eventToDuplicate,
      //newEventId: newEventId,
      newEventId: findLargestEventId(),
      selectedDate: newDate,
      isDuplicate: true
    };

    // update scan times if event contains scans
    if (newDuplicateEvent.eventType !== 'gps') {
      const initialScanData = handleDateChange(newDate, newDuplicateEvent.scanData);
      newDuplicateEvent.scanData = initialScanData;
    }

    // add event to list of new events
    setNewEvents((prevState) => ({
      ...prevState,
      events: [...prevState.events, newDuplicateEvent]
    }));

    // if event to duplicate has a point, add lat long point on same position
    if (eventToDuplicate.setPoint) {
      addLatLongPoint(newDuplicateEvent, eventToDuplicate.longitude, eventToDuplicate.latitude);
    }
  };

  const handleRemoveEvent = (newEventId, eventObject) => {
    // stop auto-duplicating if event is removed
    stopAutoEventAdding();

    // remove point from map
    if (eventObject.setPoint) {
      removePoint(eventObject);
    }

    // remove event from list of newEvents
    setNewEvents((prevState) => {
      // create a copy of the events array without the removed event
      const updatedEvents = prevState.events.filter((event) => event.newEventId !== newEventId);

      // update the event Ids and the dot content
      updatedEvents.forEach((event) => {
        if (event.newEventId > newEventId) {
          event.newEventId = event.newEventId - 1;
          updateDotContent(event.newEventId + 1, event.newEventId);
        }
      });

      // find the maximum event Id in the updated events array
      const maxEventId = Math.max(...updatedEvents.map((event) => event.newEventId));

      // update the newEventId state
      setNewEventId(Math.max(1, maxEventId + 1));

      return {
        ...prevState,
        events: updatedEvents
      };
    });
  };

  // edit an event after new fields are set in the event modal
  const handleEditEvent = (eventToEdit) => {
    // replace event being edited with new event object containing updated fields
    let newEvent = {
      newEventId: eventToEdit.newEventId,
      setPoint: eventToEdit.setPoint,
      eventObject: eventObject,
      selectedDate: selectedDate,
      deviceId: eventDeviceId,
      deviceType: deviceType,
      eventType: eventToEdit.eventType,
      isDuplicate: eventToEdit.isDuplicate
    };

    // update with more properties depending on event and device types
    newEvent = updateEventProps(newEvent);
    if (newEvent === null) {
      return;
    }

    // if event has a set point, initialize the long and lat positions
    if (eventToEdit.setPoint) {
      newEvent.longitude = eventToEdit.longitude;
      newEvent.latitude = eventToEdit.latitude;
    }

    // if there is no missing data, allow event to be edited
    if (checkMissingEventFields(newEvent)) {
      // if event being has a point on map that is manually changed, update point on map
      if (eventToEdit.setPoint && (longitude !== eventToEdit.longitude || latitude !== eventToEdit.longitude)) {
        // return if invalid coords are given and give warning
        if (longitude === '' || latitude === '' || !checkCoordinates(latitude, longitude)) {
          props.setNote({
            message: `Please provide valid long and lat position`,
            variant: 'warning'
          });
          return;
        }

        // update position of new event if new long and lat entered
        newEvent.longitude = longitude;
        newEvent.latitude = latitude;

        // TODO: handle device changed
        // remove past point and add new point
        removePoint(eventToEdit);
        addLatLongPoint(eventToEdit, longitude, latitude);
      }

      // edit list of new events
      const updatedEventsData = { ...newEvents };
      updatedEventsData.events.forEach((event, index) => {
        if (event.newEventId === eventToEdit.newEventId) {
          // replace the event with the newEvent object
          updatedEventsData.events[index] = { ...newEvent };
        }
      });

      setNewEvents(updatedEventsData);

      // close modal after editing event
      setOpenEvent(false);
    } else {
      props.setNote({
        message: `Please fill out all required fields`,
        variant: 'warning'
      });
    }
  };

  const handleOpenEditEvent = (eventToEdit) => {
    // stop auto-duplicating if event is edited
    stopAutoEventAdding();

    // set modal to edit event mode
    setIsAdd(false);

    // set event being edited
    setEditEventObject(eventToEdit);
    setHeading(eventToEdit.heading);

    // reset useState variables of the modal to match eventToEdit
    setNewEventId(eventToEdit.newEventId);
    setEventObject(eventToEdit.eventObject);
    // convert string format of edited event's selectedDate to object format
    const selectedDateObject = new Date(eventToEdit.selectedDate);
    setSelectedDate(selectedDateObject);

    // call handle device type and event type functions to open proper fields
    handleEventDeviceIdChange(eventToEdit.eventObject);
    handleEventTypeChange(eventToEdit.eventType);

    // gps events and 5g scans have device is moving
    if (eventType !== 'scans' || (eventType !== 'gps' && deviceType === '5G')) {
      setDeviceIsMoving(eventToEdit.deviceIsMoving);
    }

    if (
      eventToEdit.deviceType === 'IOX' &&
      (eventToEdit.eventType === 'gps' || eventToEdit.eventType === 'scans AND gps')
    ) {
      setLocationAccuracy(eventToEdit.locationAccuracy);

      // set location accuracy to 1 if not set
      if (eventToEdit.locationAccuracy === undefined || eventToEdit.locationAccuracy === null) {
        setLocationAccuracy(1);
      }
    }

    // if event being edited is scan event, preset scans with necessary fields
    if (eventToEdit.eventType === 'scans' || eventToEdit.eventType === 'scans AND gps') {
      setScanDeviceId(eventToEdit.scanDeviceId);
      const bleDevices = props.devices.filter((device) => device.protocol === 'BLE');
      const foundScanDeviceObject = bleDevices.find((device) => device.deviceId === eventToEdit.scanDeviceId);
      setScanDeviceObject(foundScanDeviceObject);
      setScanData([]);
      handleNumScans(eventToEdit.numberOfScans);
      const updatedScanData = eventToEdit.scanData.map((scan, index) => {
        return {
          scanTime: eventToEdit.scanData[index].scanTime,
          deviceId: eventToEdit.scanData[index].deviceId,
          rssi: eventToEdit.scanData[index].rssi,
          isMoving: eventToEdit.scanData[index].isMoving,
          temperature: 25,
          batterylevel: 87,
          isAnchor: false
        };
      });

      setScanData(updatedScanData);
    }

    if (
      eventToEdit.deviceType === '5G' &&
      (eventToEdit.eventType === 'gps' || eventToEdit.eventType === 'scans AND gps')
    ) {
      setHdop(eventToEdit.hdop);
      setSatsUsed(eventToEdit.satsUsed);
    }

    if (eventToEdit.deviceType === '5G') {
      console.log('handleOpenEditEvent', eventToEdit);
      setBatterylevel(eventToEdit.batterylevel);
      setTemperature(eventToEdit.temperature);
      setIsCached(eventToEdit.isCached);
      setPowerConnected(eventToEdit.powerConnected);
    }

    if (eventToEdit.eventType === 'gps' || eventToEdit.eventType === 'scans AND gps') {
      setDeviceSpeed(eventToEdit.deviceSpeed);
      setLongitude(eventToEdit.longitude);
      setLatitude(eventToEdit.latitude);
      setOldLongitude(eventToEdit.longitude);
      setOldLatitude(eventToEdit.latitude);
    }

    // open modal with variables based on event being changed
    setOpenEvent(true);
  };

  const generateEventSliderMarks = (numMarks) => {
    const marks = [];

    // S stands for scan, G stands for GPS, S&G is scan and gps event
    for (let i = 1; i <= numMarks; i++) {
      const eventType = newEvents.events[i - 1].eventType;
      let symbol;
      if (eventType == 'scans') {
        symbol = 'S';
      } else if (eventType == 'gps') {
        symbol = 'G';
      } else {
        symbol = 'S&G';
      }

      marks.push({ value: i, label: `#${i}-${symbol}` });
    }

    return marks;
  };

  // calculate width needed for quick edit events
  const calculateMinWidth = (eventCount) => {
    if (eventCount === 0) {
      return 100;
    }
    // adding 75px for each new event
    return 100 + eventCount * 75;
  };

  const calcGpsWeight = () => {
    console.log('hdop', hdop, satsUsed);
    const telemetry = { hdop: hdop, satsUsed: satsUsed };
    const satValue =
      0.00075 * Math.pow(telemetry.satsUsed, 3) -
      0.03153 * Math.pow(telemetry.satsUsed, 2) +
      0.43863 * telemetry.satsUsed -
      1.0275;
    const w_sat = Math.max(0, Math.min(1, satValue));

    const hdopValue = -0.02857 * telemetry.hdop + 1.2857149;
    const w_hdop = Math.max(0, Math.min(1, hdopValue));

    const w_gps = (w_hdop + 2 * w_sat) / 3;

    const gpsWeight = w_gps > 1 ? 1 : w_gps;
    return gpsWeight;
  };

  // manage event modal content for adding and editing events
  const manageEventsBody = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
    >
      <ClickAwayListener onClickAway={handleClickAwayEvent}>
        <div
          style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '4px',
            maxHeight: '100vh',
            overflow: 'auto'
          }}
        >
          <h2 id="simple-modal-title">{isAdd ? 'New Event' : `Edit Event #${editEventObject.newEventId}`}</h2>

          <Typography variant="h6" component="h2">
            <span style={{ color: 'black', fontSize: '14px' }}>Event Time</span>
          </Typography>
          {/* {timePicker()} */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel-content" id="panel-header">
              {/* <Typography>Date</Typography> */}
              {timePicker()}
            </AccordionSummary>
            <AccordionDetails>{datePicker()}</AccordionDetails>
          </Accordion>

          <Typography variant="h6" component="h2">
            <span style={{ color: 'black', fontSize: '14px' }}>Device Name</span>
          </Typography>
          {props.devices && (
            <Autocomplete
              id="combo-box-demo"
              options={props.devices?.filter((device) => device.protocol === 'LTE' || device.protocol === 'IOX')}
              getOptionLabel={(option) => (option ? option.assetName || option.deviceId : '')}
              style={{ width: 300 }}
              renderInput={(params) => <TextField {...params} label="select name" variant="outlined" />}
              value={eventObject}
              onChange={(event, value) => handleEventDeviceIdChange(value)}
            />
          )}

          {showDeviceFields && (
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '10px' }}>
              {/* don't display event type in modal if editing event */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  marginRight: '20px'
                }}
              >
                {isAdd && selectEventType()}
              </div>
              {showEventFields && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    marginTop: '10px'
                  }}
                >
                  {/* GPS-specific fields */}
                  {eventType === 'gps' || eventType === 'scans AND gps' ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <FormControlLabel
                        control={
                          <Checkbox checked={deviceIsMoving} onChange={handleIsMovingCheckChange} color="primary" />
                        }
                        label="Is Moving"
                      />
                      {/* Hdop and satsUsed slider inputs */}

                      {show5GFields && (
                        <Accordion>
                          <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel-content"
                            id="panel-header"
                          >
                            <Typography variant="h6" component="h2">
                              <span style={{ color: 'black', fontSize: '14px' }}>Telemetry</span>
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails style={{ display: 'block' }}>
                            {/* <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'row' }}> */}
                            <div>GPS accuracy: {calcGpsWeight()}</div>
                            <Typography variant="h6" component="h2">
                              <span style={{ color: 'black', fontSize: '14px' }}>Set HDOP</span>
                            </Typography>
                            <Slider
                              value={hdop}
                              onChange={(event, newValue) => setHdop(newValue)}
                              min={1}
                              max={50}
                              step={1}
                              valueLabelDisplay="auto"
                              marks={Array.from({ length: 11 }).map((_, index) => {
                                const value = index * 5;
                                return {
                                  value,
                                  label: value.toString()
                                };
                              })}
                            />
                            <Typography variant="h6" component="h2">
                              <span style={{ color: 'black', fontSize: '14px' }}>Set satsUsed</span>
                            </Typography>
                            <Slider
                              value={satsUsed}
                              onChange={(event, newValue) => setSatsUsed(newValue)}
                              min={3}
                              max={14}
                              step={1}
                              valueLabelDisplay="auto"
                              marks={Array.from({ length: 12 }).map((_, index) => {
                                const value = index + 3;
                                return {
                                  value,
                                  label: value.toString()
                                };
                              })}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <TextField
                                type="number"
                                label="enter battery level"
                                variant="outlined"
                                style={{ marginTop: '10px' }}
                                value={batterylevel}
                                onChange={(event) => {
                                  const inputValue = event.target.value;
                                  setBatterylevel(inputValue);
                                }}
                              />
                              <TextField
                                type="number"
                                label="enter temperature"
                                variant="outlined"
                                style={{ marginTop: '10px' }}
                                value={temperature}
                                onChange={(event) => {
                                  const inputValue = event.target.value;
                                  setTemperature(inputValue);
                                }}
                              />
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={isCached}
                                    onChange={(e) => setIsCached(e.target.checked)}
                                    color="primary"
                                  />
                                }
                                label="Is cached"
                              />
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={powerConnected}
                                    onChange={(e) => setPowerConnected(e.target.checked)}
                                    color="primary"
                                  />
                                }
                                label="Power connected"
                              />
                            </div>

                            {/* </div> */}
                          </AccordionDetails>
                        </Accordion>
                      )}
                      {/* Location Accuracy Text Input */}
                      {showIOXFields && (
                        <>
                          <Typography variant="h6" component="h2">
                            <span style={{ color: 'black', fontSize: '14px' }}>Location Accuracy</span>
                          </Typography>
                          <TextField
                            type="number"
                            label="enter value"
                            variant="outlined"
                            style={{ marginTop: '10px' }}
                            value={locationAccuracy}
                            onChange={(event) => {
                              const inputValue = event.target.value;
                              setLocationAccuracy(inputValue);
                            }}
                          />
                        </>
                      )}

                      <Typography variant="h6" component="h2">
                        <span style={{ color: 'black', fontSize: '14px' }}>Device Speed</span>
                      </Typography>
                      {/* Device Speed Text Input */}
                      <TextField
                        type="number"
                        label="enter device speed"
                        variant="outlined"
                        style={{ marginTop: '10px' }}
                        value={deviceSpeed}
                        onChange={(event) => {
                          const inputValue = event.target.value;
                          setDeviceSpeed(inputValue);
                        }}
                      />

                      <Typography variant="h6" component="h2">
                        <span style={{ color: 'black', fontSize: '14px' }}>Heading (Optional)</span>
                      </Typography>
                      <TextField
                        type="number"
                        // label="Heading"
                        variant="outlined"
                        style={{ marginTop: '10px' }}
                        value={heading}
                        onChange={(event) => {
                          const inputValue = event.target.value;
                          setHeading(inputValue);
                        }}
                      />

                      <Accordion>
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          aria-controls="panel-content"
                          id="panel-header"
                        >
                          <Typography variant="h6" component="h2">
                            <span style={{ color: 'black', fontSize: '14px' }}>Longitude and Latitude (Optional)</span>
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {/* Longitude Text Input */}
                            <TextField
                              type="number"
                              label="enter longitude"
                              variant="outlined"
                              style={{ marginTop: '10px', width: 150 }}
                              value={longitude}
                              onChange={(event) => {
                                const inputValue = event.target.value;
                                // check for negative sign as symbol doesn't count towards total max length
                                const isNegative = inputValue.startsWith('-');
                                // cap to 10 total chars so we long is capped at 7 decimals
                                const maxLength = isNegative ? 11 : 10;
                                const truncatedValue = inputValue.slice(0, maxLength);
                                setLongitude(truncatedValue);
                              }}
                            />

                            {/* Latitude Text Input */}
                            <TextField
                              type="number"
                              label="enter latitude"
                              variant="outlined"
                              style={{ marginTop: '10px', width: 150 }}
                              value={latitude}
                              onChange={(event) => {
                                const inputValue = event.target.value;
                                // check for negative sign as symbol doesn't count towards total max length
                                const isNegative = inputValue.startsWith('-');
                                // cap to 10 total chars so we lat is capped at 7 decimals
                                const maxLength = isNegative ? 11 : 10;
                                const truncatedValue = inputValue.slice(0, maxLength);
                                setLatitude(truncatedValue);
                              }}
                            />
                          </div>
                        </AccordionDetails>
                      </Accordion>
                    </div>
                  ) : null}

                  {/* Scans-specific fields */}
                  {eventType === 'scans' || eventType === 'scans AND gps' ? (
                    <div>
                      {deviceType === '5G' && eventType !== 'scans AND gps' && (
                        <FormControlLabel
                          control={
                            <Checkbox checked={deviceIsMoving} onChange={handleIsMovingCheckChange} color="primary" />
                          }
                          label="Is Moving"
                        />
                      )}
                      {props.devices && deviceType === 'IOX' && (
                        <>
                          <Typography variant="h6" component="h2">
                            <span style={{ color: 'black', fontSize: '14px' }}>Scan Device</span>
                          </Typography>
                          <Autocomplete
                            id="combo-box-demo"
                            options={props.devices && props.devices.filter((device) => device.protocol === 'BLE')}
                            getOptionLabel={(option) => option.assetName}
                            style={{ width: 300 }}
                            renderInput={(params) => (
                              <TextField {...params} label="select scan device" variant="outlined" />
                            )}
                            value={scanDeviceObject}
                            onChange={(event, value) => handleIOXScanDeviceIdChange(value)}
                          />
                        </>
                      )}
                      <Typography variant="h6" component="h2">
                        <span style={{ color: 'black', fontSize: '14px' }}>Number of Scans</span>
                      </Typography>
                      <TextField
                        type="number"
                        label="Scans"
                        variant="outlined"
                        style={{ marginTop: '10px' }}
                        value={numScans}
                        onChange={(event) => {
                          const value = parseInt(event.target.value, 10);
                          // clamp the value to a minimum of 0
                          const clampedValue = Math.max(value, 0);
                          handleNumScans(clampedValue);
                        }}
                      />
                      {renderScanInputs(eventObject)}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <Button
              type="button"
              onClick={isAdd ? handleAdd : () => handleEditEvent(editEventObject)}
              style={{ marginTop: '10px' }}
              disabled={!isValidDate}
            >
              {isAdd ? 'Add Event' : 'Save Edits'}
            </Button>
          </div>
        </div>
      </ClickAwayListener>
    </div>
  );

  // quick edit modal content
  const quickEditBody = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
    >
      <ClickAwayListener onClickAway={handleClickAwayQuickEdit}>
        <div
          style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '4px',
            maxHeight: '90vh',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            // dynamic size to slider length
            minWidth: `${calculateMinWidth(newEvents.events.length)}px`
          }}
        >
          <h2 id="simple-modal-title">Quick Edit Events</h2>
          {newEvents.events.length > 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <Typography variant="h6" component="h2">
                <span style={{ color: 'black', fontSize: '14px' }}>Select Event To Edit</span>
              </Typography>
              <Slider
                defaultValue={0}
                value={selectedQuickEditEvent}
                min={1}
                max={newEvents.events.length}
                onChange={(event, newValue) => handleSelectedQuickEditEventChange(newValue)}
                aria-labelledby="discrete-slider"
                step={1}
                marks={generateEventSliderMarks(newEvents.events.length)}
              />
              <Typography variant="h6" component="h2">
                <span style={{ color: 'black', fontSize: '14px' }}>Select New Time</span>
              </Typography>
              {timePicker()}
              <br></br>
              <Button type="button" onClick={handleQuickEdit}>
                Edit Event #{selectedQuickEditEvent}
              </Button>
            </div>
          ) : (
            <div>No events to edit yet</div>
          )}
        </div>
      </ClickAwayListener>
    </div>
  );

  // save event modal content
  const saveTestBody = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
    >
      <ClickAwayListener onClickAway={handleClickAwaySaveTest}>
        <div
          style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '4px',
            maxHeight: '90vh',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <h2 id="simple-modal-title">
            {/* if test case name selected is already a test case name used, we are editing this test case */}
            {props.testCases.find((testCase) => testCase.name === testCaseName)
              ? `Edit Test Case: ${testCaseName}`
              : 'Save Events As New Test Case'}
          </h2>
          <Typography variant="h6" component="h2">
            <span style={{ color: 'black', fontSize: '14px' }}>Test Case Name</span>
          </Typography>
          <TextField
            label="enter name"
            variant="outlined"
            style={{ margin: '10px' }}
            value={testCaseName}
            onChange={(event) => {
              setTestCaseName(event.target.value);
            }}
          />
          <Typography variant="h6" component="h2">
            <span style={{ color: 'black', fontSize: '14px' }}>Initial Attachment Status (Optional)</span>
          </Typography>
          <Autocomplete
            id="combo-box-demo"
            options={attachmentTypes}
            getOptionLabel={(option) => option}
            style={{ margin: '10px' }}
            renderInput={(params) => <TextField {...params} label="select attachment status" variant="outlined" />}
            value={attachmentStatus}
            onChange={(event, newValue) => {
              handleAttachmentStatusChange(newValue);
            }}
          />
          <Typography variant="h6" component="h2">
            <span style={{ color: 'black', fontSize: '14px' }}>Device Name (Optional)</span>
          </Typography>
          {props.devices && (
            <Autocomplete
              id="combo-box-demo"
              options={
                props.devices &&
                props.devices.filter(
                  (device) =>
                    (device.protocol === 'BLE' && !device.isAnchor && !device.fixAsset) || device.protocol === 'LTE'
                )
              }
              getOptionLabel={(option) => option.assetName}
              style={{ margin: '10px' }}
              renderInput={(params) => <TextField {...params} label="select name" variant="outlined" />}
              value={attachmentObject}
              onChange={(event, value) => handleAttachmentDeviceIdChange(value)}
            />
          )}
          <Typography variant="h6" component="h2">
            <span style={{ color: 'black', fontSize: '14px' }}>Attached To Device Name (Optional)</span>
          </Typography>
          {props.devices && (
            <Autocomplete
              id="combo-box-demo-2"
              options={props.devices && props.devices.filter((device) => device.protocol === 'IOX')}
              getOptionLabel={(option) => option.assetName}
              style={{ margin: '10px' }}
              renderInput={(params) => <TextField {...params} label="select name" variant="outlined" />}
              value={attachmentToObject}
              onChange={(event, value) => handleAttachmentToDeviceIdChange(value)}
              disabled={attachmentStatus === 'Detached' && attachmentToObject == null}
            />
          )}
          <span>
            <strong>Test Case Time: </strong>
            {currentTestTime}
          </span>
          <Button type="button" style={{ marginTop: '20px' }} onClick={handleSaveTest}>
            {props.testToEdit && props.testToEdit.testName === testCaseName ? `Edit Test Case` : 'Save Test Case'}
          </Button>
        </div>
      </ClickAwayListener>
    </div>
  );

  return (
    <div style={{ height: '100%' }}>
      <div
        id="map1"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0
        }}
      >
        <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
          <div style={{ position: 'relative' }}>
            <NavigationButtons mapbox={map} zoom={map && map.getZoom()} isIndoor={false} />
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            top: 80,
            right: props.screenWidth < 1000 ? 15 : 30,
            zIndex: 100
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column'
            }}
          ></div>
        </div>
        <List
          mapbox={map}
          bearing={0}
          // add events props
          handleOpenAddEvent={handleOpenAddEvent}
          openEvent={openEvent}
          handleClickEvent={handleClickEvent}
          manageEventsBody={manageEventsBody}
          // quick edit events props
          handleOpenQuickEdit={handleOpenQuickEdit}
          openQuickEdit={openQuickEdit}
          handleClickQuickEdit={handleClickQuickEdit}
          quickEditBody={quickEditBody}
          // run events props
          submitTest={submitTest}
          // save events props
          handleOpenSaveTest={handleOpenSaveTest}
          openSaveTest={openSaveTest}
          handleClickSaveTest={handleClickSaveTest}
          saveTestBody={saveTestBody}
          // manage events props
          handleManageTests={handleManageTests}
          // other necessary props
          handleDuplicateEvent={handleDuplicateEvent}
          handleRemoveEvent={handleRemoveEvent}
          handleOpenEditEvent={handleOpenEditEvent}
          newEvents={newEvents}
          stopAutoEventAdding={stopAutoEventAdding}
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
  devices: map.devices,
  email: user.email
});

const mapDispatch = ({
  map: { getTripHistoryAction, getAllDevicesAction, setDeviceSelectedAction },
  dashboard: { getAllFacilityDevicesAction },
  simulation: { processTestDataAction, updateTestCasesAction },
  provision: { updateDeviceDataAction },
  location: { renderComponentAction },
  notifications: { setNoteAction }
}) => ({
  getAllDevices: getAllDevicesAction,
  getTripHistory: getTripHistoryAction,
  getAllFacilityDevices: getAllFacilityDevicesAction,
  processTestData: processTestDataAction,
  updateDeviceData: updateDeviceDataAction,
  renderComponent: renderComponentAction,
  setDeviceSelected: setDeviceSelectedAction,
  updateTestCase: updateTestCasesAction,
  setNote: setNoteAction
});

export default connect(mapStateToProps, mapDispatch)(Simulation);
