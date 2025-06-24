import './styles.css';
import { styled } from '@mui/material/styles';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Box } from '@mui/material';
import { connect } from 'react-redux';

import variables from '../../variables.json';

const PREFIX = 'AssetfloRegister';

const classes = {
  continer: `${PREFIX}-continer`,
  submitButton: `${PREFIX}-submitButton`,
  error: `${PREFIX}-error`,
  lable: `${PREFIX}-lable`,
  input: `${PREFIX}-input`,
  header: `${PREFIX}-header`,
  loginWithAssetFloAccount: `${PREFIX}-loginWithAssetFloAccount`,
  assetfloRegister: `${PREFIX}-assetfloRegister`,
  registerLoingStyle: `${PREFIX}-registerLoingStyle`
};

const StyledBox = styled(Box)(({ theme }) => ({
  [`& .${classes.continer}`]: {
    borderRadius: '5px',
    boxShadow: '0 4px 8px 0 rgba(0,0,0,0.10)',
    background: variables.WHITE_COLOR,
    padding: '15px',
    alignText: 'center',
    marginTop: '150px'
  },

  [`& .${classes.submitButton}`]: {
    background: variables.ORANGE_COLOR,
    color: variables.WHITE_COLOR,
    display: 'block',
    boxSizing: 'border-box',
    width: '30%',
    borderRadius: '4px',
    border: '1px solid white',
    padding: '10px 15px',
    margin: 'auto',
    marginTop: '10px',
    fontSize: '14px'
  },

  [`& .${classes.error}`]: {
    color: variables.RED_COLOR
  },

  [`& .${classes.lable}`]: {
    color: variables.ORANGE_COLOR
  },

  [`& .${classes.input}`]: {
    borderWidth: '1px',
    borderColor: variables.LIGHT_GRAY_COLOR,
    display: 'block',
    boxSizing: 'border-box',
    width: '100%',
    borderRadius: '4px',
    border: '1px solid #E4E5E6',
    padding: '10px 15px',
    marginBottom: '10px',
    fontSize: '14px'
  },

  [`& .${classes.header}`]: {
    marginBottom: '10px',
    color: variables.ORANGE_COLOR,
    fontWeight: 'bold',
    fontSize: '20px'
    // display: "flex",
    // justifyContent: "center"
  },

  [`& .${classes.loginWithAssetFloAccount}`]: {
    cursor: 'pointer',
    color: variables.ORANGE_COLOR
  },

  [`& .${classes.assetfloRegister}`]: {
    cursor: 'pointer',
    marginLeft: '5px',
    color: variables.ORANGE_COLOR
  },

  [`& .${classes.registerLoingStyle}`]: {
    color: variables.DARK_GRAY_COLOR,
    margin: 'auto',
    marginTop: '10px'
  }
}));

function AssetfloRegister(props) {
  const { register, handleSubmit, errors } = useForm();
  const handleSubmitForm = async (data) => {
    await props.assetfloRegister(data);
  };

  // console.log(watch("email")); // watch input value by passing the name of it

  return (
    <StyledBox
      style={{
        paddingTop: 50,
        height: 'calc(100vh - 150px)'
      }}
    >
      <Box
        style={{
          width: props.screenWidth > 750 ? '50%' : 'auto',
          marginLeft: props.screenWidth > 750 ? 'auto' : '10px',
          marginRight: props.screenWidth > 750 ? 'auto' : '10px',
          marginTop: props.screenWidth > 750 ? '50px' : '10px'
        }}
        className={classes.continer}
      >
        {props.error && <span className={classes.error}>{props.error}</span>}
        <Box className={classes.header}>
          <span>Create New Assetflo Account</span>
        </Box>
        <form onSubmit={handleSubmit(handleSubmitForm)}>
          <label className={classes.lable}>User name</label>
          <input
            className={classes.input}
            name="username"
            ref={register({
              required: 'User name is required',
              minLength: 4
            })}
          />
          {errors.username && errors.username.type === 'required' && <p className={classes.error}>username required</p>}
          {errors.username && errors.username.type === 'minLength' && (
            <p className={classes.error}>username should be at least 4 characters</p>
          )}
          <Box
            style={{
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <Box style={{ width: '100%', marginRight: '10px' }}>
              <label className={classes.lable}>First name</label>
              <input
                className={classes.input}
                name="firstName"
                ref={register({ required: 'First name is required' })}
              />
              {errors.firstName && <p className={classes.error}>{errors.firstName.message}</p>}
            </Box>
            <Box style={{ width: '100%' }}>
              <label className={classes.lable}>Last name</label>
              <input className={classes.input} name="lastName" ref={register({ required: 'Last name is required' })} />
              {errors.lastName && <p className={classes.error}>{errors.lastName.message}</p>}
            </Box>
          </Box>
          <label className={classes.lable}>Email</label>
          <input
            className={classes.input}
            name="email"
            ref={register({
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                message: 'invalid email address'
              }
            })}
          />
          {errors.email && <p className={classes.error}>{errors.email.message}</p>}
          <label className={classes.lable}>Password</label>
          <input
            className={classes.input}
            name="password"
            type="password"
            ref={register({
              required: 'password is required and should be 8 charector or more!',
              minLength: 8
            })}
          />
          {/* {errors.password && (
            <p className={classes.error}>{errors.password.message}</p>
          )} */}
          {/* {errors.password && console.log(errors.password)} */}
          {errors.password && errors.password.type === 'required' && <p className={classes.error}>password required</p>}
          {errors.password && errors.password.type === 'minLength' && (
            <p className={classes.error}>password should be at least 8 characters</p>
          )}
          <label className={classes.lable}>Database</label>
          <input
            className={classes.input}
            name="database"
            ref={register({
              required: 'Database is required and should be 8 charector or more!',
              minLength: 8
            })}
          />
          {errors.database && errors.database.type === 'required' && <p className={classes.error}>Database required</p>}
          {errors.database && errors.database.type === 'minLength' && (
            <p className={classes.error}>Database should be 8 charector or more!</p>
          )}
          <input className={classes.submitButton} type="submit" />
        </form>
      </Box>
      <Box style={{ width: props.screenWidth > 750 ? '50%' : '90%' }} className={classes.registerLoingStyle}>
        Login With{' '}
        <label onClick={() => props.renderComponent('assetflologin')} className={classes.loginWithAssetFloAccount}>
          Assetflo Account
        </label>{' '}
        |
        <label onClick={() => props.renderComponent('geotablogin')} className={classes.assetfloRegister}>
          Geotab Account
        </label>
      </Box>
    </StyledBox>
  );
}

const mapStateToProps = ({ user, location }) => ({
  email: user.email,
  error: user.error,
  isUserLoading: user.isUserLoading,
  routerLocation: location.routerLocation,
  screenWidth: location.screenWidth
});

const mapDispatch = ({ user: { assetfloRegisterAction }, location: { renderComponentAction } }) => ({
  assetfloRegister: assetfloRegisterAction,
  renderComponent: renderComponentAction
});

export default connect(mapStateToProps, mapDispatch)(AssetfloRegister);
