import React, { useState, useEffect } from 'react';
import {
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  TablePagination,
  Autocomplete,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogContentText
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const DeviceTable = ({
  tags,
  onPositionChange,
  onNameChange,
  page,
  rowsPerPage,
  handleChangePage,
  isValidPosition,
  allPositions = [],
  positionError = {},
  setPositionError,
  isMobile,
  handleDeleteData
}) => {
  const [editingDeviceId, setEditingDeviceId] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  const [currentPosition, setCurrentPosition] = useState('');
  const [confirmRemove, setConfirmRemove] = useState({ open: false, deviceId: null });

  const handlePositionChange = (deviceId, value) => {
    setPositionError((prev) => ({ ...prev, [deviceId]: !isValidPosition(value) }));
    onPositionChange(deviceId, value);
  };

  const handleBlur = (deviceId, value) => {
    setPositionError((prev) => ({
      ...prev,
      [deviceId]: !isValidPosition(value)
    }));
  };

  const handleEditClick = (deviceId, currentName) => {
    setEditingDeviceId(deviceId);
    setEditedName(currentName);
  };

  const handleNameChange = (event) => {
    setEditedName(event.target.value);
  };

  const handleNameSave = (deviceId) => {
    if (editedName.trim() === '') {
      return;
    }
    onNameChange(deviceId, editedName);
    setEditingDeviceId(null);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleDialogOpen = (deviceId, position) => {
    setCurrentDeviceId(deviceId);
    setCurrentPosition(position);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleDialogSave = () => {
    handlePositionChange(currentDeviceId, currentPosition);
    setDialogOpen(false);
  };

  const handleUpdateData = (updatedData, oldData) => {
    // Implement the logic to update data
  };

  const sortedTags = tags.sort((a, b) => {
    if (orderBy === 'assetName') {
      return order === 'asc' ? a.assetName.localeCompare(b.assetName) : b.assetName.localeCompare(a.assetName);
    } else if (orderBy === 'deviceId') {
      return order === 'asc' ? a.deviceId.localeCompare(b.deviceId) : b.deviceId.localeCompare(a.deviceId);
    } else if (orderBy === 'position') {
      if (a.position === null) return order === 'asc' ? -1 : 1;
      if (b.position === null) return order === 'asc' ? 1 : -1;
      return order === 'asc' ? a.position.localeCompare(b.position) : b.position.localeCompare(a.position);
    } else {
      // default to assetName, but with empty positions at the start
      if (a.position === null) return -1;
      if (b.position === null) return 1;
      return 0;
    }
  });

  const paginatedTags = sortedTags.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const takenPositions = new Set(tags.map((tag) => tag.position));

  const getAvailablePositions = (currentPosition) => {
    const availablePositions = allPositions.filter((pos) => !takenPositions.has(pos) || pos === currentPosition);
    if (currentPosition && !allPositions.includes(currentPosition)) {
      availablePositions.push(currentPosition);
    }
    return availablePositions;
  };

  return (
    <>
      <TableContainer component={Paper} sx={{ marginTop: '10px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '30%' }}>
                <TableSortLabel
                  active={orderBy === 'assetName'}
                  direction={orderBy === 'assetName' ? order : 'asc'}
                  onClick={() => handleRequestSort('assetName')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ width: '30%' }}>
                <TableSortLabel
                  active={orderBy === 'deviceId'}
                  direction={orderBy === 'deviceId' ? order : 'asc'}
                  onClick={() => handleRequestSort('deviceId')}
                >
                  MAC
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ width: '30%' }}>
                <TableSortLabel
                  active={orderBy === 'position'}
                  direction={orderBy === 'position' ? order : 'asc'}
                  onClick={() => handleRequestSort('position')}
                >
                  Position
                </TableSortLabel>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No devices added.
                </TableCell>
              </TableRow>
            ) : (
              paginatedTags.map((row) => (
                <TableRow key={row.deviceId}>
                  <TableCell>
                    {editingDeviceId === row.deviceId ? (
                      <TextField
                        value={editedName}
                        onChange={handleNameChange}
                        onBlur={() => handleNameSave(row.deviceId)}
                        sx={{ minWidth: '200px' }}
                        autoFocus
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {row.assetName}
                        <IconButton onClick={() => handleEditClick(row.deviceId, row.assetName)}>
                          <EditIcon />
                        </IconButton>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{row.deviceId}</TableCell>
                  <TableCell>
                    {isMobile ? (
                      <TextField
                        value={row.position || ''}
                        onClick={() => handleDialogOpen(row.deviceId, row.position)}
                        size="small"
                        error={!!positionError[row.deviceId]}
                        helperText={positionError[row.deviceId] ? 'Invalid position' : ''}
                        placeholder="Add"
                        InputProps={{
                          readOnly: true,
                          sx: {
                            borderRadius: '4px',
                            backgroundColor: positionError[row.deviceId] ? '#ffe6e6' : 'transparent',
                            borderColor: row.position ? 'blue' : 'grey'
                          }
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: positionError[row.deviceId] ? 'red' : row.position ? 'grey' : 'blue'
                            },
                            '&:hover fieldset': {
                              borderColor: positionError[row.deviceId] ? 'red' : 'black'
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: positionError[row.deviceId] ? 'red' : 'blue'
                            }
                          }
                        }}
                      />
                    ) : (
                      <Autocomplete
                        id={`position-input-${row.deviceId}`}
                        options={getAvailablePositions(row.position)}
                        getOptionLabel={(option) => {
                          return option === row.position && !allPositions.includes(row.position) ? '' : option;
                        }}
                        value={row.position || null}
                        onChange={(event, newValue) => handlePositionChange(row.deviceId, newValue)}
                        onBlur={(event) => handleBlur(row.deviceId, row.position)}
                        autoHighlight
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            size="small"
                            error={!!positionError[row.deviceId]}
                            helperText={positionError[row.deviceId] ? 'Invalid position' : ''}
                            placeholder="Select position"
                            InputProps={{
                              ...params.InputProps,
                              sx: {
                                borderRadius: '4px',
                                backgroundColor: positionError[row.deviceId] ? '#ffe6e6' : 'transparent'
                              }
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                  borderColor: positionError[row.deviceId] ? 'red' : row.position ? 'grey' : 'blue'
                                },
                                '&:hover fieldset': {
                                  borderColor: positionError[row.deviceId] ? 'red' : 'black'
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: positionError[row.deviceId] ? 'red' : 'blue'
                                }
                              }
                            }}
                          />
                        )}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => setConfirmRemove({ open: true, deviceId: row.deviceId })}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10]}
          component="div"
          count={tags.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
        />
      </TableContainer>
      <Dialog open={dialogOpen} onClose={handleDialogClose} fullWidth>
        <DialogTitle>Select Position</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={getAvailablePositions(currentPosition)}
            getOptionLabel={(option) => option}
            value={currentPosition || null}
            onChange={(event, newValue) => setCurrentPosition(newValue)}
            autoHighlight
            renderInput={(params) => <TextField {...params} size="small" placeholder="Select position" />}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleDialogSave} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={confirmRemove.open} onClose={() => setConfirmRemove({ open: false, deviceId: null })}>
        <DialogTitle>Remove attached device?</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to remove the attached device?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRemove({ open: false, deviceId: null })}>Cancel</Button>
          <Button
            onClick={() => {
              console.log('Deleting device', confirmRemove);
              handleDeleteData(confirmRemove.deviceId);
              setConfirmRemove({ open: false, deviceId: null });
            }}
            style={{ color: 'red' }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DeviceTable;
