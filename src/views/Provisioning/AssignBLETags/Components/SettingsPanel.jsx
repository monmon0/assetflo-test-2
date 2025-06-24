import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fab,
  Checkbox,
  FormControlLabel,
  Snackbar
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import { connect } from 'react-redux';

import variables from '../../../../variables.json';

const MAX = 26;

const SettingsPanel = ({ isMobile, x, setX, y, setY, z, setZ, tags, handleReset, loginType, handleSave }) => {
  const [fabOpen, setFabOpen] = useState(false);
  const [resetDialog, setResetDialog] = useState(false);
  const [tempY, setTempY] = useState(y);
  const [tempX, setTempX] = useState(x);
  const [tempZ, setTempZ] = useState(z);
  const [resetTags, setResetTags] = useState(false);
  const [maxNotificationShown, setMaxNotificationShown] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Debounce the settings update
  useEffect(() => {
    if (tempY === '' || tempX === '' || tempZ === '') return;

    const newY = Math.min(MAX, Math.max(1, parseInt(tempY, 10) || 3));
    const newX = Math.min(MAX, Math.max(1, parseInt(tempX, 10) || 3));
    const newZ = Math.min(MAX, Math.max(1, parseInt(tempZ, 10) || 3));

    if ((newY >= MAX || newX >= MAX || newZ >= MAX) && (newY !== y || newX !== x || newZ !== z)) {
      if (!maxNotificationShown) {
        setSnackbarOpen(true);
        setMaxNotificationShown(true);
      }
    }

    const timeout = setTimeout(() => {
      setY(newY);
      setX(newX);
      setZ(newZ);
    }, 500); // 500ms delay before updating

    return () => clearTimeout(timeout);
  }, [tempY, tempX, tempZ]);

  // Update the temp values when the props change
  useEffect(() => {
    setTempY(y);
    setTempX(x);
    setTempZ(z);
  }, [x, y, z]);

  // Handle the update of the temp values
  const handleUpdate = useCallback((setter, value) => {
    setter(value);
  }, []);

  // Handle the blur event of the text fields
  const handleBlur = useCallback((setter, value) => {
    const parsedValue = parseInt(value, 10);
    if (!isNaN(parsedValue)) {
      const newValue = Math.min(MAX, Math.max(1, parsedValue));
      setter(newValue);
      if (newValue >= MAX && !maxNotificationShown) {
        setSnackbarOpen(true);
        setMaxNotificationShown(true);
      }
    } else {
      setter(3);
    }
  });

  // This is the content of the settings panel
  const renderContent = useMemo(
    () => (
      <Box>
        {[
          { label: 'Aisles', value: tempY, setValue: setTempY },
          { label: 'Zones', value: tempX, setValue: setTempX },
          { label: 'Levels', value: tempZ, setValue: setTempZ }
        ].map(({ label, value, setValue }) => (
          <TextField
            key={label}
            label={label}
            type="number"
            value={value}
            onChange={(e) => handleUpdate(setValue, e.target.value)}
            onBlur={(e) => handleBlur(setValue, e.target.value)}
            fullWidth
            margin="normal"
            inputProps={{ min: 1, max: MAX }}
          />
        ))}
        {isMobile && (
          <Button variant="contained" color="secondary" onClick={() => setResetDialog(true)} fullWidth sx={{ mt: 2 }}>
            Reset Positions
          </Button>
        )}

        <Dialog
          open={resetDialog}
          onClose={() => {
            setResetDialog(false);
            setResetTags(false);
          }}
        >
          <DialogTitle>Reset Confirmation</DialogTitle>
          <DialogContent>
            <DialogContentText>Are you sure you want to reset all positions?</DialogContentText>
            <FormControlLabel
              control={<Checkbox checked={resetTags} onChange={(e) => setResetTags(e.target.checked)} />}
              label="Also remove all added Devices"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResetDialog(false)}>Cancel</Button>
            <Button
              onClick={() => {
                handleReset(resetTags);
                setResetDialog(false);
              }}
              color="primary"
            >
              Reset
            </Button>
          </DialogActions>
        </Dialog>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          message={`Maximum value of ${MAX} reached`}
        />
      </Box>
    ),
    [tempY, tempX, tempZ, resetDialog, handleReset, handleUpdate, handleBlur, tags, resetTags, snackbarOpen]
  );

  // Render the settings panel as a floating action button on mobile, or a drawer on desktop
  return isMobile ? (
    <>
      <Fab
        color="primary"
        aria-label="settings"
        onClick={() => setFabOpen(true)}
        sx={{
          position: 'fixed',
          bottom: loginType === 'verifyGeotabAddinAccount' ? 50 : 0,
          left: 'auto',
          margin: 2
        }}
      >
        <SettingsIcon />
      </Fab>
      <Dialog open={fabOpen} onClose={() => setFabOpen(false)}>
        <DialogTitle>Trailer Configuration</DialogTitle>
        <DialogContent>
          {renderContent}
          <IconButton
            aria-label="close"
            onClick={() => setFabOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFabOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  ) : (
    <Drawer
      anchor="left"
      open
      variant="permanent"
      sx={{
        '& .MuiDrawer-paper': {
          width: 300,
          boxSizing: 'border-box',
          top: loginType === 'verifyGeotabAddinAccount' ? 90 : 50,
          left: 'auto',
          zIndex: 50
        }
      }}
    >
      <Box sx={{ padding: 2 }}>
        <Typography variant="h6">Trailer Configuration</Typography>
        {renderContent}
        {/* Save Button */}
        <Box sx={{ display: 'flex', justifyContent: 'right', marginTop: '15px' }}>
          <Button variant="contained" color="secondary" onClick={() => setResetDialog(true)}>
            Reset
          </Button>
          <Button
            variant="contained"
            color="info"
            onClick={handleSave}
            sx={{
              '&:focus, &:active, &:hover': {
                backgroundColor: variables.LIGHT_ORANGE_COLOR
              },
              backgroundColor: variables.ORANGE_COLOR,
              color: 'white',
              marginLeft: '10px'
            }}
          >
            Save
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

const mapStateToProps = ({ user }) => ({
  loginType: user.loginType
});

export default connect(mapStateToProps)(SettingsPanel);
