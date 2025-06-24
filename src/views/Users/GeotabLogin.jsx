import './styles.css';
import { styled } from '@mui/material/styles';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Box } from '@mui/material';
import { connect } from 'react-redux';

import { hasAccess } from '../../util/hasAccess';
import variables from '../../variables.json';

const PREFIX = 'GeotabLogin';

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
    padding: '15px',
    alignText: 'center',
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
    // display: "flex",
    // justifyContent: "flex-start"
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

function GeotabLogin(props) {
  useEffect(() => {
    // props.email && props.renderComponent('mapbox');
    if (props.email) {
      hasAccess(props.userPermissions, variables.ALL_PROVISION_FEATURE, props.role, props.database, props.group)
        ? props.renderComponent('companyselect')
        : props.renderComponent('mapbox');
    }
  }, [props.email]);

  const { register, handleSubmit, watch, errors } = useForm();
  const handleSubmitForm = async (data) => {
    await props.logintogeotab(data);
    // console.log(data);
    // try {
    //   props.email && props.renderComponent("map");
    // } catch (error) {
    //   console.log(error);
    // }
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
          <span>Login With Geotab Account</span>
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
            ref={register({
              required: 'password is required and should be 6 charector or more!',
              minLength: 6
            })}
          />
          {errors.password && errors.password.type === 'required' && <p className={classes.error}>password required</p>}
          {errors.password && errors.password.type === 'minLength' && (
            <p className={classes.error}>password should be at least 6 characters</p>
          )}
          <label className={classes.lable}>Database</label>
          <input className={classes.input} name="database" ref={register({ required: 'Database is required' })} />
          {errors.database && <p className={classes.error}>{errors.database.message}</p>}
          <input className={classes.submitButton} type="submit" />
        </form>
      </Box>
      <Box style={{ width: props.screenWidth > 750 ? '50%' : '90%' }} className={classes.registerLoingStyle}>
        Login With{' '}
        {props.routerLocation === 'geotablogin' && (
          <label onClick={() => props.renderComponent('assetflologin')} className={classes.loginWithAssetFloAccount}>
            Assetflo Account
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
  role: user.role,
  database: user.database,
  group: user.group,
  userPermissions: user.userPermissions,
  error: user.error,
  routerLocation: location.routerLocation,
  screenWidth: location.screenWidth
});

const mapDispatch = ({ user: { logintogeotabAction }, location: { renderComponentAction } }) => ({
  logintogeotab: logintogeotabAction,
  renderComponent: renderComponentAction
});

export default connect(mapStateToProps, mapDispatch)(GeotabLogin);
