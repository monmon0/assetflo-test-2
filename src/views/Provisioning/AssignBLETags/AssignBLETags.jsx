import React, { useState, useEffect } from 'react';
import { Box, Button, useMediaQuery, useTheme, IconButton, Typography } from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { connect } from 'react-redux';

// Component imports
import LayerView from './Components/LayerView';
import DeviceTable from './Components/DeviceTable';
import CustomAutocomplete from './Components/CustomAutocomplete';
import SettingsPanel from './Components/SettingsPanel';

// Utils
import variables from '../../../variables.json';
import { transformDevice } from '../../../util/transformer';

// For testing purposes
// const generateRandomDevices = (numDevices) => {
//   const devices = [];
//   const usedIds = new Set();
//   while (devices.length < numDevices) {
//     const deviceId = `device${Math.floor(Math.random() * 10000)}`;
//     if (!usedIds.has(deviceId)) {
//       usedIds.add(deviceId);
//       devices.push({
//         deviceId,
//         assetName: `Device ${Math.floor(Math.random() * 100)}`
//       });
//     }
//   }
//   return devices;
// };
// const tempDevices = generateRandomDevices(100);

const AddTagsToDevice = ({ renderComponent, devStates, selectedRow, updateMultipleDevices, setNote }) => {
  // State hooks
  const [tags, setTags] = useState([]);
  const [xCoord, setXCoord] = useState(3);
  const [yCoord, setYCoord] = useState(3);
  const [zCoord, setZCoord] = useState(3);
  const [selectedTags, setSelectedTags] = useState([]);
  const [page, setPage] = useState(0);
  const [positionError, setPositionError] = useState({});
  const [highlightPosition, setHighlightPosition] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Set tags and layout initially from selectedRow
  useEffect(() => {
    if (selectedRow && selectedRow.deviceId) {
      if (selectedRow.fixAsset) {
        console.error('Cannot attach devices to a fixed asset.');
        setNote({
          message: 'Cannot attach devices to a fixed asset.',
          severity: 'error'
        });
        handleBack();
        return;
      }

      const attachedTags = selectedRow.attachedTags || [];
      const selectedTagIds = attachedTags.map((tag) => tag.deviceId);
      setTags(
        attachedTags.map((tag) => ({
          deviceId: tag.deviceId,
          assetName: tag.assetName,
          position: tag.attachedState.position
        }))
      );
      setSelectedTags(selectedTagIds);

      // Initialize yCoord, xCoord, and zCoord
      if (selectedRow.layout) {
        setXCoord(selectedRow.layout.x || 3);
        setYCoord(selectedRow.layout.y || 3);
        setZCoord(selectedRow.layout.z || 3);
      }
      console.log('selectedRow', selectedRow);
    } else {
      handleBack();
    }
  }, [selectedRow]);

  useEffect(() => {
    const newInvalidPositions = {};
    tags.forEach((tag) => {
      if (tag.position && !isValidPosition(tag.position)) {
        newInvalidPositions[tag.deviceId] = true;
      }
    });
    setPositionError(newInvalidPositions);
  }, [xCoord, yCoord, zCoord]);

  // Check if position is valid
  const isValidPosition = (value) => {
    if (!yCoord || !xCoord || !zCoord) return false;

    // Adjust regex based on xCoord and zCoord values
    const yRegex = `[A-${String.fromCharCode(64 + yCoord)}]`;

    // Ensure x and z allow up to 2 digits without a dash, but require a dash for 3 digits.
    const xRegex = xCoord > 9 ? `(?:[1-9]|[1-9][0-9])` : `[1-${xCoord}]`;
    const zRegex = zCoord > 9 ? `(?:[1-9]|[1-9][0-9])` : `[1-${zCoord}]`;

    // Add an optional dash **only if** x or z could have 3+ digits.
    // const suffix = xCoord > 9 || zCoord > 9 ? '-?' : '';

    const pattern = `^${yRegex}-${xRegex}-${zRegex}$`;
    const regex = new RegExp(pattern);

    // Regex to match position with optional dash between parts if necessary
    // const pattern = `^(?:${yRegex}\\d{2}|${yRegex}(?:\\d-\\d{2}|\\d{2}-\\d|\\d{2}-\\d{2}))$`;
    // const regex = new RegExp(pattern);

    // Return true if position is valid
    return regex.test(value);
  };

  // Handlers
  const handleTagChange = (event, newValue, reason) => {
    if (
      event.type === 'keydown' &&
      (event.key === 'Backspace' || event.key === 'Delete') &&
      reason === 'removeOption'
    ) {
      return;
    }

    const newSelectedTags = newValue.map((tag) => {
      const existingTag = tags.find((t) => t.deviceId === tag.deviceId);
      return {
        deviceId: tag.deviceId,
        assetName: tag.assetName,
        position: existingTag ? existingTag.position : null
      };
    });
    setTags(newSelectedTags);

    const newSelectedId = newValue.map((tag) => tag.deviceId);
    setSelectedTags(newSelectedId);
    setPage(0);
  };

  const handlePositionChange = (device, position) => {
    setTags((prevTags) => {
      const newTags = [...prevTags];
      const tagIndex = newTags.findIndex((tag) => tag.deviceId === device);
      if (tagIndex !== -1) {
        newTags[tagIndex] = { ...newTags[tagIndex], position };
        setHighlightPosition(position);
      }
      return newTags;
    });

    setPositionError((prev) => ({ ...prev, [device]: !isValidPosition(position) }));
  };

  const handleNameChange = (deviceId, newName) => {
    setTags((prevTags) => {
      const newTags = [...prevTags];
      const tagIndex = newTags.findIndex((tag) => tag.deviceId === deviceId);
      if (tagIndex !== -1) {
        newTags[tagIndex] = { ...newTags[tagIndex], assetName: newName };
        setHighlightPosition(newTags[tagIndex].position);
      }
      return newTags;
    });
  };

  const handleReset = (resetTags) => {
    if (resetTags) {
      setTags([]);
      setSelectedTags([]);
    } else {
      setTags((prevTags) =>
        prevTags.map((tag) => ({
          ...tag,
          position: null
        }))
      );
    }
    setPage(0);
  };

  const handleBack = () => {
    renderComponent('provision');
  };

  const handleDeleteData = (deviceId) => {
    console.log('Deleting device', deviceId);
    setTags((prevTags) => prevTags.filter((tag) => tag.deviceId !== deviceId));
    setSelectedTags((prev) => prev.filter((tag) => tag !== deviceId));
  };

  const handleSave = async () => {
    if (selectedRow && selectedRow.deviceId) {
      const updatedDeviceData = {
        ...selectedRow,
        layout: {
          x: xCoord,
          y: yCoord,
          z: zCoord
        },
        attachments: selectedTags
      };
      const currentDevice = transformDevice(updatedDeviceData, updatedDeviceData);

      const positionSet = new Set();
      const updates = selectedTags
        .map((deviceId) => {
          const bleDevice = devStates.find((dev) => dev.deviceId === deviceId);
          const tag = tags.find((tag) => tag.deviceId === deviceId);
          if (!tag.position || !isValidPosition(tag.position)) {
            // Show error message if position is not set or invalid
            return null;
          }

          if (positionSet.has(tag.position)) {
            // Show error message if duplicate position is found
            return null;
          }
          positionSet.add(tag.position);

          const assetName =
            tag.assetName !== bleDevice.assetName
              ? tag.assetName
              : tag.position === bleDevice.attachedState?.position
              ? bleDevice.assetName
              : `${selectedRow.assetName}-Sensor-${tag.position}`;

          return {
            ...bleDevice,
            assetName,
            attachedState: {
              configured: true,
              state: 'Attached',
              time: Date.now(),
              attachedTo: currentDevice.deviceId,
              position: tag.position
            }
          };
        })
        .filter((update) => update !== null); // Filter out null updates

      // Exit if any tag's position is not set or invalid
      if (updates.length !== selectedTags.length) {
        console.error('Each tag must have a unique, valid position.');
        setNote({
          message: 'Each tag must have a unique, valid position.',
          severity: 'error'
        });
        return;
      }

      // Handle removal of currently attached devices
      const currentAttachedTags = selectedRow.attachedTags || [];
      const removedTags = currentAttachedTags
        .filter((tag) => !selectedTags.includes(tag.deviceId))
        .map((tag) => {
          const oldData = devStates.find((dev) => dev.deviceId === tag.deviceId);
          return {
            ...oldData,
            assetName: `Tag-${tag.deviceId}`,
            isAnchor: false,
            fixAsset: false,
            attachedState: {
              configured: false,
              state: 'Detached',
              time: Date.now(),
              correctionRssi: variables.DEFAULT_RSSI,
              rssi: variables.DEFAULT_RSSI,
              attachedTo: null
            }
          };
        });

      const allUpdates = [...updates, ...removedTags, currentDevice];
      await handleUpdateData(allUpdates);
    }
  };

  // Transform devices and update
  async function handleUpdateData(updates) {
    const transformedUpdates = updates.map((update) => transformDevice(update, update));
    // console.log('transformedUpdates', transformedUpdates);
    await updateMultipleDevices(transformedUpdates);
    // handleBack();
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // const availableTags = tempDevices;
  const availableTags = devStates
    .filter(
      (dev) =>
        (dev.protocol === 'BLE' || (dev.protocol === 'OTS.BLE' && !dev.fixAsset && !dev.isAnchor)) &&
        (!dev.attachedState ||
          dev.attachedState.attachedTo === selectedRow.deviceId ||
          !dev.attachedState.attachedTo) &&
        !dev.fixAsset
    )
    .map((tag) => ({
      deviceId: tag.deviceId,
      assetName: tag.assetName
    }));

  const allPositions = [];
  // Generate all possible positions, in reverse order (for display)
  for (let y = 1; y <= yCoord; y++) {
    for (let row = 1; row <= xCoord; row++) {
      for (let level = 1; level <= zCoord; level++) {
        allPositions.push(`${String.fromCharCode(64 + y)}-${row}-${level}`);
      }
    }
  }

  return (
    <Box sx={{ display: 'flex', height: '100%', overflowY: 'auto' }}>
      {/* Settings Panel */}
      <SettingsPanel
        isMobile={isMobile}
        x={xCoord}
        setX={setXCoord}
        y={yCoord}
        setY={setYCoord}
        z={zCoord}
        setZ={setZCoord}
        tags={tags}
        handleReset={handleReset}
        handleBack={handleBack}
        handleSave={handleSave}
      />

      {/* Page Content */}
      <Box sx={{ marginLeft: isMobile ? 0 : '300px', flex: 1, height: '100%', overflowY: 'auto' }}>
        <Box
          sx={{
            flex: 1,
            padding: '20px',
            maxWidth: '960px',
            margin: '0 auto',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Header: Title and backbutton */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton
              onClick={handleBack}
              size="large"
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowBackIosIcon />
            </IconButton>
            {selectedRow && (
              <Typography variant="h5" component="h5" sx={{ marginRight: 2 }}>
                {`Attach Devices to ${selectedRow.assetName}`}
              </Typography>
            )}
          </Box>

          {/* Grid */}
          <LayerView x={xCoord} y={yCoord} z={zCoord} assignedTags={tags} highlightPosition={highlightPosition} />

          {/* Autocomplete for searching devices */}
          <Box sx={{ display: 'flex', justifyContent: 'right', alignItems: 'center' }}>
            <CustomAutocomplete
              availableTags={availableTags}
              selectedTags={selectedTags}
              handleTagChange={handleTagChange}
              placeholder="Search for Devices"
            />
          </Box>

          {/* Device Table */}
          <DeviceTable
            key={tags.map((tag) => tag.deviceId).join(',')}
            tags={tags}
            onPositionChange={handlePositionChange}
            onNameChange={handleNameChange}
            page={page}
            rowsPerPage={10}
            handleChangePage={handleChangePage}
            isValidPosition={isValidPosition}
            allPositions={allPositions}
            positionError={positionError}
            setPositionError={setPositionError}
            isMobile={isMobile}
            handleDeleteData={handleDeleteData}
          />

          {/* Save Button */}
          {isMobile && (
            <Box sx={{ display: 'flex', justifyContent: 'right', marginTop: '20px' }}>
              <Button
                variant="contained"
                color="info"
                onClick={handleSave}
                sx={{
                  '&:focus, &:active, &:hover': {
                    backgroundColor: variables.LIGHT_ORANGE_COLOR
                  },
                  backgroundColor: variables.ORANGE_COLOR,
                  color: 'white'
                }}
              >
                Save
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

// Redux connection
const mapStateToProps = ({ provision }) => ({
  devStates: provision.states,
  selectedRow: provision.selectedRow
});

const mapDispatch = ({
  provision: { updateMultipleDevicesAction },
  location: { renderComponentAction },
  notifications: { setNoteAction }
}) => ({
  renderComponent: renderComponentAction,
  updateMultipleDevices: updateMultipleDevicesAction,
  setNote: setNoteAction
});

export default connect(mapStateToProps, mapDispatch)(AddTagsToDevice);
