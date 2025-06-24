import React, { useEffect } from 'react';
import { styled } from '@mui/material/styles';
import { connect } from 'react-redux';
import { Box } from '@mui/material';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';

import variables from '../../variables.json';
const PREFIX = 'ErrorPage';

const classes = {
  continer: `${PREFIX}-continer`,
  icon: `${PREFIX}-icon`,
  body: `${PREFIX}-body`
};

const StyledBox = styled(Box)(({ theme }) => ({
  [`&.${classes.continer}`]: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: 'calc(100vh - 50px)'
  },

  [`& .${classes.icon}`]: { width: 150, height: 150, color: variables.RED_COLOR },

  [`& .${classes.body}`]: {
    textAlign: 'center',
    marginTop: '30px',
    fontSize: '15px'
  }
}));

function ErrorPage({ errorPageMessage }) {
  useEffect(() => {}, [errorPageMessage]);

  return (
    <StyledBox className={classes.continer}>
      <h1 style={{ marginTop: '150px' }}>{variables.THANKS_MESSAGE}</h1>
      <ErrorOutlineOutlinedIcon className={classes.icon} />
      <p className={classes.body}>{errorPageMessage ? errorPageMessage : ''}</p>
    </StyledBox>
  );
}

const mapStateToProps = ({ notifications }) => ({
  errorPageMessage: notifications.errorPageMessage
});

const mapDispatch = () => ({});

// connect(mapStateToProps, mapDispatch)(Note)
export default connect(mapStateToProps, mapDispatch)(ErrorPage);
