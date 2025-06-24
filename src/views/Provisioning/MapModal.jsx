import React, { useEffect } from 'react';
import { makeStyles, Box, Button } from '@mui/material';
import Modal from '@mui/material/Modal';
import { connect } from 'react-redux';
import { styled } from '@mui/material/styles';
import variables from '../../variables.json';
import EditableMapSwitcher from '../Map2/EditableMapSwitcher';
import DraggableMapbox from '../Map2/DraggableMapbox';

// No usage found for this file
const PREFIX = 'MapModal';

const classes = {
  container: `${PREFIX}-container`,
  paper: `${PREFIX}-paper`,
  doneButton: `${PREFIX}-doneButton`,
  buttonsStyle: `${PREFIX}-buttonsStyle`
};

const StyledModal = styled(Modal)(({ theme }) => ({
  [`& .${classes.container}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  [`& .${classes.paper}`]: {
    overflow: 'hidden',
    width: '80%',
    height: '80%',
    backgroundColor: theme.palette.background.paper,
    borderRadius: '5px',
    boxShadow: '0 4px 8px 0 rgba(0,0,0,0.15)'
  },
  [`& .${classes.doneButton}`]: {
    color: variables.LIGHT_GRAY_COLOR,
    background: variables.ORANGE_COLOR
  },
  [`& .${classes.buttonsStyle}`]: {
    display: 'flex',
    justifyContent: 'space-between'
  }
}));

function MapModal({ open, onClose, device, body, loginType, editableMap, provisionType, pois }) {
  let copyBody = body;
  useEffect(() => {
    // console.log(editableMap);
    copyBody = '';
  }, [editableMap]);

  // console.log("modal body", copyBody);

  if (editableMap === 'editableMapbox') {
    copyBody = <DraggableMapbox currentDevice={device} />;
  } else {
    copyBody = <DraggableMapbox currentDevice={device} />;
  }

  return (
    <StyledModal open={open} onClose={onClose} className={classes.container}>
      <Box className={classes.paper}>
        <Box className={classes.buttonsStyle}>
          <Button onClick={onClose} className={classes.doneButton}>
            Close
          </Button>
          {provisionType !== 'Tenant' &&
            provisionType !== 'Poi' &&
            pois &&
            pois.length > 0 &&
            pois[0] &&
            pois[0].provider &&
            pois[0].provider.indoorId &&
            pois[0].provider.apikey && <EditableMapSwitcher />}
        </Box>
        <Box>{copyBody}</Box>
      </Box>
    </StyledModal>
  );
}

const mapStateToProps = ({ user, map, provision }) => ({
  loginType: user.loginType,
  editableMap: map.editableMap,
  provisionType: provision.provisionType,
  pois: map.pois
});

const mapDispatch = () => ({});

export default connect(mapStateToProps, mapDispatch)(MapModal);
