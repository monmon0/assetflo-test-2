import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTheme, styled } from '@mui/material/styles';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  Box,
  InputBase,
  Popper,
  TextField,
  IconButton,
  Typography
} from '@mui/material';
import { connect } from 'react-redux';
import variables from '../../../variables.json';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import { autocompleteClasses } from '@mui/material/Autocomplete';
import moment from 'moment';

const StyledAutocompletePopper = styled(Popper)(({ theme }) => ({
  [`& .${autocompleteClasses.paper}`]: {
    boxShadow: 'none',
    margin: 0,
    color: 'inherit',
    fontSize: 13,
    backgroundColor: theme.palette.background.default
  },
  [`& .${autocompleteClasses.listbox}`]: {
    padding: 0,
    borderRadius: 4,
    backgroundColor: theme.palette.background.default,
    [`& .${autocompleteClasses.option}`]: {
      padding: '8px 16px',
      borderBottom: `1px solid ${theme.palette.divider}`,
      "&[aria-selected='true']": {
        backgroundColor: 'transparent'
      },
      '&:hover': {
        backgroundColor: theme.palette.action.hover
      }
    },
    '&::-webkit-scrollbar': {
      width: '8px'
    },
    '&::-webkit-scrollbar-track': {
      background: '#f1f1f1'
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#888',
      borderRadius: '4px'
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: '#555'
    }
  }
}));

function PopperComponent(props) {
  return <StyledAutocompletePopper {...props} />;
}

const StyledInput = styled(InputBase)(({ theme }) => ({
  padding: '10px 16px',
  width: '100%',
  borderBottom: `1px solid ${theme.palette.divider}`,
  '& input': {
    borderRadius: 4,
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    padding: '8px 12px',
    fontSize: 14,
    '&:focus': {
      boxShadow: `0px 0px 0px 3px ${theme.palette.primary.light}`,
      borderColor: theme.palette.primary.main
    }
  }
}));

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

const generatePositionMarkers = () => {
  const markers = [];
  const rows = ['A', 'B', 'C'];
  const cols = ['1', '2', '3'];
  const depths = ['1', '2', '3'];

  rows.forEach((row) => {
    cols.forEach((col) => {
      depths.forEach((depth) => {
        markers.push(`${row}${col}${depth}`);
      });
    });
  });

  return markers;
};

const positionMarkers = generatePositionMarkers();

function AttachDevicesModal({ attachDevicesModal, setAttachDevicesModal, handleUpdateData, devStates }) {
  const [selectedTags, setSelectedTags] = useState([]);
  const [previousDevices, setPreviousDevices] = useState([]);
  const [positions, setPositions] = useState({});

  useEffect(() => {
    if (attachDevicesModal.rowData) {
      const attachedTags = attachDevicesModal.rowData.attachedTags || [];
      const selectedTagIds = attachedTags.map((tag) => tag.deviceId);
      setSelectedTags(selectedTagIds);
      setPreviousDevices(selectedTagIds);
      setPositions(attachedTags.reduce((acc, tag) => ({ ...acc, [tag.deviceId]: tag.position || '' }), {}));
    }
  }, [attachDevicesModal]);

  const handleSave = async () => {
    if (attachDevicesModal.rowData && attachDevicesModal.rowData.deviceId) {
      const currentDevice = attachDevicesModal.rowData;
      const updates = selectedTags.map((deviceId) => {
        const bleDevice = devStates.find((dev) => dev.deviceId === deviceId);
        return {
          ...bleDevice,
          assetName: `${currentDevice.assetName}-Tag`,
          attachedState: {
            configured: true,
            state: 'Attached',
            time: moment().valueOf(),
            correctionRssi: variables.DEFAULT_RSSI,
            rssi: variables.DEFAULT_RSSI,
            attachedTo: currentDevice.deviceId,
            position: positions[deviceId] || ''
          }
        };
      });
      console.log('updates', updates);

      await handleUpdateData(updates, currentDevice);
    }
    setAttachDevicesModal({ open: false, rowData: null });
  };

  const handleTagChange = (event, newValue, reason) => {
    if (
      event.type === 'keydown' &&
      (event.key === 'Backspace' || event.key === 'Delete') &&
      reason === 'removeOption'
    ) {
      return;
    }

    const newSelectedTags = newValue.map((tag) => tag.deviceId);
    setSelectedTags(newSelectedTags);

    const newPositions = { ...positions };
    const usedPositions = new Set(Object.values(newPositions));

    newSelectedTags.forEach((deviceId, index) => {
      if (!newPositions[deviceId]) {
        let positionIndex = index % positionMarkers.length;
        while (usedPositions.has(positionMarkers[positionIndex])) {
          positionIndex = (positionIndex + 1) % positionMarkers.length;
        }
        newPositions[deviceId] = positionMarkers[positionIndex];
        usedPositions.add(positionMarkers[positionIndex]);
      }
    });
    setPositions(newPositions);
  };

  const handlePositionChange = (deviceId, value) => {
    setPositions((prev) => ({ ...prev, [deviceId]: value }));
  };

  // const availableTags = tempDevices;
  const availableTags = devStates
    .filter((dev) => dev.protocol === 'BLE')
    .map((tag) => ({
      deviceId: tag.deviceId,
      assetName: tag.assetName
    }));

  return (
    <Dialog
      open={attachDevicesModal.open}
      onClose={() => setAttachDevicesModal({ open: false, rowData: null })}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Attach BLE Devices</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Autocomplete
              multiple
              disableCloseOnSelect
              renderTags={() => null}
              noOptionsText="No Available Devices"
              options={[...availableTags].sort((a, b) => {
                let ai = previousDevices.indexOf(a.deviceId);
                ai = ai === -1 ? previousDevices.length + availableTags.indexOf(a) : ai;
                let bi = previousDevices.indexOf(b.deviceId);
                bi = bi === -1 ? previousDevices.length + availableTags.indexOf(b) : bi;
                return ai - bi;
              })}
              getOptionLabel={(option) => option.deviceId}
              onChange={handleTagChange}
              value={availableTags.filter((tag) => selectedTags.includes(tag.deviceId))}
              renderOption={(props, option, { selected }) => {
                return (
                  <li {...props} key={option.deviceId} style={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      component={DoneIcon}
                      sx={{ width: 17, height: 17, mr: '5px', ml: '-2px' }}
                      style={{
                        visibility: selected ? 'visible' : 'hidden'
                      }}
                    />
                    <Box
                      component="span"
                      sx={{
                        width: 14,
                        height: 14,
                        flexShrink: 0,
                        borderRadius: '3px',
                        mr: 1,
                        mt: '2px'
                      }}
                      style={{ backgroundColor: option.color }}
                    />
                    <Box
                      sx={(t) => ({
                        flexGrow: 1,
                        '& span': {
                          color: '#8b949e',
                          ...t.applyStyles('light', {
                            color: '#586069'
                          })
                        }
                      })}
                    >
                      {option.deviceId}
                      {/* <br />
                      <span>{option.deviceId}</span> */}
                    </Box>
                    <Box
                      component={CloseIcon}
                      sx={{ opacity: 0.6, width: 18, height: 18 }}
                      style={{
                        visibility: selected ? 'visible' : 'hidden'
                      }}
                    />
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField {...params} variant="outlined" placeholder="Search and add devices" />
              )}
              PopperComponent={PopperComponent}
              disablePortal
              PaperComponent={useCallback(({ children }) => {
                return (
                  <div
                    style={{
                      backgroundColor: '#fff',
                      borderBottom: '1px solid #eaecef',
                      borderLeft: '1px solid #eaecef',
                      borderRight: '1px solid #eaecef'
                    }}
                  >
                    {children}
                  </div>
                );
              }, [])}
              sx={{ width: '50%' }}
            />
          </Box>
          <Box
            sx={{
              mt: 2,
              border: '1px solid #ccc',
              borderRadius: '8px',
              overflow: 'hidden',
              bgcolor: '#f9f9f9',
              p: 2,
              height: '200px',
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px'
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1'
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#888',
                borderRadius: '4px'
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: '#555'
              }
            }}
          >
            {selectedTags.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100px',
                  fontStyle: 'italic',
                  color: 'text.secondary',
                  textAlign: 'center'
                }}
              >
                No Devices Selected
              </Box>
            ) : (
              selectedTags.map((deviceId) => {
                const tagName = availableTags.find((tag) => tag.deviceId === deviceId)?.deviceId || '';
                return (
                  <Box
                    key={deviceId}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr auto',
                      alignItems: 'center',
                      p: 1,
                      borderBottom: '1px solid #eee',
                      '&:last-child': { borderBottom: 'none' }
                    }}
                  >
                    <Typography sx={{ color: 'text.primary' }}>{tagName || 'Error'}</Typography>
                    <TextField
                      label="Position"
                      value={positions[deviceId] || ''}
                      onChange={(e) => handlePositionChange(deviceId, e.target.value)}
                      placeholder="e.g., A11"
                      size="small"
                      sx={{ width: '80%' }}
                    />
                    <IconButton
                      color="error"
                      onClick={() => setSelectedTags((prev) => prev.filter((id) => id !== deviceId))}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setAttachDevicesModal({ open: false, rowData: null })} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSave} style={{ color: variables.GREEN_COLOR }}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

AttachDevicesModal.propTypes = {
  attachDevicesModal: PropTypes.shape({
    open: PropTypes.bool.isRequired,
    rowData: PropTypes.object
  }).isRequired,
  setAttachDevicesModal: PropTypes.func.isRequired,
  handleUpdateData: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  devStates: state.provision.states
});

export default connect(mapStateToProps)(AttachDevicesModal);
