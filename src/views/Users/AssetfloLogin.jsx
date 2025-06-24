import './styles.css';
import { styled } from '@mui/material/styles';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Box } from '@mui/material';
import { connect } from 'react-redux';

import { hasAccess } from '../../util/hasAccess';
import variables from '../../variables.json';

const PREFIX = 'AssetfloLogin';

const classes = {
  continer: `${PREFIX}-continer`,
  submitButton: `${PREFIX}-submitButton`,
  error: `${PREFIX}-error`,
  lable: `${PREFIX}-lable`,
  input: `${PREFIX}-input`,
  header: `${PREFIX}-header`,
  LoginWithGeotabAccount: `${PREFIX}-LoginWithGeotabAccount`,
  assetfloRegister: `${PREFIX}-assetfloRegister`,
  registerLoingStyle: `${PREFIX}-registerLoingStyle`
};

const StyledBox = styled(Box)(({ theme }) => ({
  [`& .${classes.continer}`]: {
    borderRadius: '5px',
    boxShadow: '0 4px 8px 0 rgba(0,0,0,0.10)',
    marginBottom: '10px',
    cursor: 'pointer',
    padding: '15px',
    alignItems: 'center',
    background: variables.WHITE_COLOR
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
  },

  [`& .${classes.LoginWithGeotabAccount}`]: {
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

function AssetfloLogin(props) {
  useEffect(() => {
    props.email && props.renderComponent('mapbox');
  }, [props.email]);

  const { register, handleSubmit, errors } = useForm();

  const handleSubmitForm = async (data) => {
    await props.assetfloLogin(data);
  };

  // console.log(watch("email")); // watch input value by passing the name of it

  return (
    <StyledBox
      style={{
        paddingTop: 100,
        height: 'calc(100vh - 150px)'
      }}
    >
      <Box
        style={{
          width: props.screenWidth > 750 ? '50%' : 'auto',
          marginLeft: props.screenWidth > 750 ? 'auto' : '10px',
          marginRight: props.screenWidth > 750 ? 'auto' : '10px'
        }}
        className={classes.continer}
      >
        {props.error && <span className={classes.error}>{props.error}</span>}
        <Box className={classes.header}>
          <span>Login With Assetflo Account</span>
        </Box>
        <form onSubmit={handleSubmit(handleSubmitForm)}>
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
            ref={register({ required: 'Password is required' })}
          />
          {errors.password && <p className={classes.error}>{errors.password.message}</p>}
          {/* <label className={classes.lable}>Database</label>
        <input
          className={classes.input}
          name="database"
          ref={register({ required: "Database is required" })}
        />
        {errors.database && (
          <p className={classes.error}>{errors.database.message}</p>
        )} */}
          <input className={classes.submitButton} type="submit" />
        </form>
      </Box>
      <Box style={{ width: props.screenWidth > 750 ? '50%' : '90%' }} className={classes.registerLoingStyle}>
        Login With{' '}
        {props.routerLocation === 'assetflologin' && (
          <label onClick={() => props.renderComponent('geotablogin')} className={classes.LoginWithGeotabAccount}>
            Geotab Account
          </label>
        )}{' '}
        |
        <label onClick={() => props.renderComponent('assetfloregister')} className={classes.assetfloRegister}>
          Register
        </label>
      </Box>
    </StyledBox>
  );
}

const mapStateToProps = ({ user, location }) => ({
  email: user.email,
  error: user.error,
  routerLocation: location.routerLocation,
  screenWidth: location.screenWidth
});

const mapDispatch = ({ user: { assetfloLoginAction }, location: { renderComponentAction } }) => ({
  assetfloLogin: assetfloLoginAction,
  renderComponent: renderComponentAction
});

export default connect(mapStateToProps, mapDispatch)(AssetfloLogin);
