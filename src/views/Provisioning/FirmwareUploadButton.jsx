import React, { useState, forwardRef, useImperativeHandle } from 'react';
import AttachmentIcon from '@mui/icons-material/Attachment';
import DeleteIcon from '@mui/icons-material/Delete';
import { Button, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import variables from '../../variables.json';

const FirmwareUploadButton = forwardRef(({ onFileChange }, _ref) => {
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    if (onFileChange) {
      onFileChange(selectedFile);
    }
  };

  const handleFileDelete = () => {
    setFile(null);
    if (onFileChange) {
      onFileChange(null);
    }
  };

  useImperativeHandle(_ref, () => ({
    getFile: () => file
  }));

  const Input = styled('input')({
    display: 'none'
  });
  return (
    <div
      style={{
        border: '1px solid #ced4da',
        borderRadius: '3px',
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%'
      }}
    >
      <div
        style={{
          maxWidth: 'calc(100% - 30px)'
        }}
      >
        <label htmlFor="file-upload-button">
          <Input accept=".bin" type="file" id="file-upload-button" onChange={handleFileChange} />
          <Button
            variant="text"
            component="span"
            size="small"
            style={{
              fontSize: '9px',
              color: variables.ORANGE_COLOR,
              textAlign: 'left',
              width: '100%',
              height: '100%',
              justifyContent: 'flex-start'
            }}
          >
            {file && file.name ? (
              <div
                style={{
                  marginLeft: 'auto',
                  maxWidth: '100%',
                  wordWrap: 'break-word',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {' '}
                {file.name}
              </div>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <AttachmentIcon fontSize="small" /> Attach
              </span>
            )}
          </Button>
        </label>
      </div>
      <div
        style={{
          fontSize: '11px',
          width: '30px'
        }}
      >
        <IconButton
          aria-label="delete"
          color="primary"
          size="small"
          style={{
            color: variables.ORANGE_COLOR
          }}
          onClick={handleFileDelete}
        >
          <DeleteIcon fontSize="inherit" />
        </IconButton>
      </div>
    </div>
  );
});

export default FirmwareUploadButton;
