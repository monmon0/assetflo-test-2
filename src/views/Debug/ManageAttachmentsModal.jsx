import React, { useState, useEffect, Fragment, useRef } from 'react';
import * as turf from '@turf/turf';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { connect } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Modal,
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
import Grid from '@mui/material/Grid';
import DateFnsUtils from '@date-io/date-fns';

import variables from '../../variables.json';
import moment from 'moment';

import { useDispatch } from 'react-redux';

export function ManageAttachmentsModal(props) {
  const [map, setMap] = useState(null);
  const [deviceMarkers, setDeviceMarkers] = useState({});
  const [deviceScanTimes, setDeviceScanTimes] = useState({});
  const [deviceSpeeds, setDeviceSpeeds] = useState({});
  const [deviceSensors, setDeviceSensors] = useState({});
  const [devicePayload, setDevicePayload] = useState({});
  const [color, setColor] = useState({});
  const [defaultScan, setDefaultScan] = useState({ device: '', rssi: -60, isMoving: true });

  const [done, setDone] = useState(false);

  useEffect(() => {
    props.getAllDevices();
  }, []);

  useEffect(() => {
    if (props.devices) {
      const ble = props.devices.filter((d) => d.protocol === 'BLE');
      console.log('ble', ble[0]);
      setDefaultScan({ device: ble[0], rssi: -60, isMoving: true });
      const iox = props.devices.filter((d) => d.protocol === 'IOX');
    }
  }, [props.devices]);

  // update attachment status of a device and attached to device
  const handleUpdateAttachment = (deviceObject, attachedToDevice, configured) => {
    const DEFAULT_RSSI = -100;
    const { _id, createdAt, location, ...dev } = deviceObject;
    // if device is attached switch to detached and vice versa
    const attachment =
      deviceObject.attachedState && deviceObject.attachedState.state === 'Attached'
        ? {
            configured: false,
            state: 'Detached',
            time: moment().valueOf(),
            correctionRssi: DEFAULT_RSSI,
            rssi: DEFAULT_RSSI,
            attachedTo: null,
            dropRssi: DEFAULT_RSSI,
            dropLocation: null
          }
        : {
            configured: configured,
            state: 'Attached',
            time: moment().valueOf(),
            correctionRssi: DEFAULT_RSSI,
            rssi: -75,
            attachedTo: attachedToDevice,
            dropRssi: DEFAULT_RSSI,
            dropLocation: null
          };
    console.log('attach', { ...dev, attachedState: attachment });
    props.updateDeviceData({ ...dev, attachedState: attachment });
    props.getAllDevices();
  };

  // handle device detachment
  const handleDetachment = (device) => {
    const DEFAULT_RSSI = -100;
    const { _id, createdAt, location, ...dev } = device;
    const attachment = {
      configured: false,
      state: 'Detached',
      time: moment().valueOf(),
      correctionRssi: DEFAULT_RSSI,
      rssi: DEFAULT_RSSI,
      attachedTo: null
    };
    console.log('detach', { ...dev, attachedState: attachment });
    props.updateDeviceData({ ...dev, attachedState: attachment });
    props.getAllDevices();
  };

  // handle attachment or detachment of device depending on device attachment status
  const handleAttachmentOrDetachment = () => {
    const requiredFields = {
      attachmentDeviceId: attachmentDeviceId,
      attachmentSelectDeviceId: attachmentSelectDeviceId
    };

    // create missing fields list for all empty required fields
    const missingFields = [];
    for (const key in requiredFields) {
      if (requiredFields[key] === '') {
        missingFields.push(key);
      }
    }

    // if all required fields are filled proceed with attachment/detachment with device, and attached to device
    if (missingFields.length === 0) {
      handleUpdateAttachment(attachmentObject, attachmentSelectDeviceId, attachmentConfigured);
    } else {
      props.setNote({
        message: `Please fill out all required fields`,
        variant: 'warning'
      });
    }
  };

  // attachment device variables
  const [attachmentDeviceId, setAttachmentDeviceId] = useState('');
  const [attachmentObject, setAttachmentObject] = useState({});

  // attached to device variables
  const [attachmentSelectDeviceId, setAttachmentSelectDeviceId] = useState('');
  const [attachmentSelectObject, setAttachmentSelectObject] = useState({});

  // attached status and configured variables
  const [attachmentStatus, setAttachmentStatus] = useState('');
  const [attachmentConfigured, setAttachmentConfigured] = useState(false);

  const handleAttachmentDeviceIdChange = (value) => {
    if (value) {
      setAttachmentDeviceId(value.deviceId);
      setAttachmentObject(value);
      handleAttachmentStatusChange(value);
    } else {
      setAttachmentObject({});
      setAttachmentDeviceId('');
      setAttachmentStatus('');
    }
  };

  const handleAttachmentSelectDeviceIdChange = (value) => {
    setAttachmentSelectObject(value);
    if (value) {
      setAttachmentSelectDeviceId(value.deviceId);
    } else {
      setAttachmentSelectObject({});
      setAttachmentSelectDeviceId('');
    }
  };

  const handleAttachmentStatusChange = (value) => {
    if (value) {
      if (value.attachedState) {
        setAttachmentStatus(value.attachedState.state);
      } else {
        // set to Detached by default
        setAttachmentStatus('Detached');
      }
    } else {
      setAttachmentStatus('');
    }
  };

  const handleConfiguredCheckChange = (event) => {
    setAttachmentConfigured(event.target.checked);
  };

  return (
    <div
      style={{
        marginTop: '20px'
      }}
    >
      <div style={{ background: '#fff', padding: '20px', borderRadius: '4px', maxHeight: '90vh', overflow: 'auto' }}>
        <h2 id="simple-modal-title">New Attachment</h2>

        <Typography variant="h6" component="h2">
          <span style={{ color: 'black', fontSize: '14px' }}>Device Name</span>
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
            style={{ width: 300 }}
            renderInput={(params) => <TextField {...params} label="select name" variant="outlined" />}
            value={attachmentObject}
            onChange={(event, value) => handleAttachmentDeviceIdChange(value)}
          />
        )}

        <Typography variant="h6" component="h2">
          <span style={{ color: 'black', fontSize: '14px' }}>Device Name Of Attached/Detached Device</span>
        </Typography>
        {props.devices && (
          <Autocomplete
            id="combo-box-demo-2"
            options={props.devices && props.devices.filter((device) => device.protocol === 'IOX')}
            getOptionLabel={(option) => option.assetName}
            style={{ width: 300, marginBottom: '10px' }}
            renderInput={(params) => <TextField {...params} label="select name" variant="outlined" />}
            value={attachmentSelectObject}
            onChange={(event, value) => handleAttachmentSelectDeviceIdChange(value)}
          />
        )}
        <span>
          <strong>Attachment Status: </strong>
          {attachmentStatus}
        </span>

        {attachmentStatus === 'Detached' && (
          <div>
            <FormControlLabel
              control={
                <Checkbox checked={attachmentConfigured} onChange={handleConfiguredCheckChange} color="primary" />
              }
              label="Configured"
              style={{ marginTop: '10px' }}
            />
          </div>
        )}

        {/* if device is detached, make the button attach the device and vice versa */}
        {attachmentStatus ? (
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <Button type="button" onClick={handleAttachmentOrDetachment}>
              {attachmentStatus === 'Detached' && 'Confirm Attachment'}
              {attachmentStatus === 'Attached' && 'Confirm Detachment'}
            </Button>
          </div>
        ) : null}
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
  simulation: { processTestDataAction },
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
  setNote: setNoteAction
});

export default connect(mapStateToProps, mapDispatch)(ManageAttachmentsModal);
