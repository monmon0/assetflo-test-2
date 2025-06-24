import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import Button from '@mui/material/Button';
import { SnackbarProvider, useSnackbar } from 'notistack';

function Note({ message, variant }) {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const renderEnqueue = () => {
    // variant could be success, error, warning, info, or default
    const options = {
      variant: variant || 'error',
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'center'
      },
      action: (key) => (
        <Button size="small" style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
          Dismiss
        </Button>
      )
    };
    enqueueSnackbar(message, options);
  };
  return <div>{message && renderEnqueue()}</div>;
}

function NotificationsComponent({ message, variant, setNote, loginType, position }) {
  // clear store
  useEffect(() => {
    setNote({ message: '', variant: '' });
  }, [message]);

  return (
    <SnackbarProvider
      preventDuplicate
      maxSnack={3}
      style={{
        marginTop: loginType === 'verifyGeotabAddinAccount' || !loginType ? (position ? position : '25px') : '0px'
      }}
    >
      <Note message={message} variant={variant} style={{ marginTop: '100px' }} />
    </SnackbarProvider>
  );
}

const mapStateToProps = ({ notifications, user }) => ({
  message: notifications.note.message,
  variant: notifications.note.variant,
  position: notifications.position || 0,
  loginType: user.loginType
});

const mapDispatch = ({ notifications: { setNoteAction } }) => ({
  setNote: setNoteAction
});

// connect(mapStateToProps, mapDispatch)(Note)
export default connect(mapStateToProps, mapDispatch)(NotificationsComponent);
