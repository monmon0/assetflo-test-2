import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import moment from 'moment';
import variables from '../../../variables.json';

const ConfirmRemove = ({ confirmRemove, setConfirmRemove, handleUpdateData }) => {
  return (
    <Dialog open={confirmRemove.open} onClose={() => setConfirmRemove({ open: false, rowData: null })}>
      <DialogTitle>Remove attached device?</DialogTitle>
      <DialogContent>
        <DialogContentText>Are you sure you want to remove the attached device?</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setConfirmRemove({ open: false, rowData: null })}>Cancel</Button>
        <Button
          onClick={() => {
            const oldData = confirmRemove.rowData;
            const updatedData = {
              ...oldData,
              attachedState: {
                configured: false,
                state: 'Detached',
                time: moment().valueOf(),
                correctionRssi: variables.DEFAULT_RSSI,
                rssi: variables.DEFAULT_RSSI,
                attachedTo: null
              }
            };
            handleUpdateData(updatedData, oldData);
            setConfirmRemove({ open: false, rowData: null });
          }}
          style={{ color: variables.GREEN_COLOR }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmRemove;
