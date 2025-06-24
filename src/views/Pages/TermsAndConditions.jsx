import React, { useEffect } from 'react';
import { styled } from '@mui/material/styles';
import { connect } from 'react-redux';
import { Box, Checkbox, Button, FormControlLabel, Typography } from '@mui/material';
import variables from '../../variables.json';
const PREFIX = 'TermsAndConditions';

const classes = {
  root: `${PREFIX}-root`,
  checked: `${PREFIX}-checked`,
  continer: `${PREFIX}-continer`,
  checkboxWithButtonBox: `${PREFIX}-checkboxWithButtonBox`,
  buttonStyle: `${PREFIX}-buttonStyle`
};

const StyledBox = styled(Box)(({ theme }) => ({
  [`&.${classes.continer}`]: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px 0 50px'
  },

  [`& .${classes.checkboxWithButtonBox}`]: {
    display: 'flex',
    flexDirection: 'column',
    width: '90%',
    justifyContent: 'center',
    alignItems: 'center'
  },

  [`& .${classes.buttonStyle}`]: {
    backgroundColor: variables.ORANGE_COLOR,
    color: variables.WHITE_COLOR,
    width: '20%'
  }
}));

function TermsAndConditions({
  userTenant,
  database,
  activateTenant,
  renderComponent,
  getUserTenantActivation,
  screen,
  loginType,
  eula,
  checkEula
}) {
  const [state, setState] = React.useState({
    termsChecked: false
  });

  useEffect(() => {
    getUserTenantActivation(database);
  }, []);
  useEffect(() => {
    // if (userTenant.activation) renderComponent('eula');
    if (eula) renderComponent('successpage');
  }, [eula]);

  const GreenCheckbox = (props) => <Checkbox color="default" {...props} />;

  const handleChange = (event) => {
    setState({ ...state, termsChecked: event.target.checked });
  };

  const handleSubmitTerms = () => {
    activateTenant({ organization: database });
    // temporary terms and eula are in on doc
    !eula && checkEula();
  };

  return (
    <StyledBox className={classes.continer} style={{ height: 'calc(100vh - 100px)', width: '100%' }}>
      <Typography style={{ marginBottom: '20px', color: variables.DARK_GRAY_COLOR }} variant="h5">
        {variables.TERMS_AND_CONDITIONS}
      </Typography>
      <iframe
        title="terms_and_conditions"
        src={screen < 900 ? variables.TERMS_AND_CONDITIONS_PDF_URL : variables.TERMS_AND_CONDITIONS_URL}
        width={screen < 900 ? '90%' : '900px'}
        height="75%"
        frameBorder="0"
      ></iframe>
      <Box className={classes.checkboxWithButtonBox}>
        <FormControlLabel
          control={
            <GreenCheckbox
              checked={state.termsChecked}
              onChange={handleChange}
              name="termsCheckbox"
              classes={{
                root: classes.root,
                checked: classes.checked
              }}
            />
          }
          // label="I agree to the terms and condtions of service"
          label="I agree to the terms and condtions of service and user licence"
        />
        <Button
          variant="contained"
          className={classes.buttonStyle}
          disabled={!state.termsChecked}
          onClick={handleSubmitTerms}
        >
          Submit
        </Button>
      </Box>
    </StyledBox>
  );
}

const mapStateToProps = ({ user, location }) => ({
  // userTenant: provision.userTenant,
  database: user.database,
  screen: location.screenWidth,
  loginType: user.loginType,
  // temporary terms and eula are in on doc
  eula: user.eula
});

const mapDispatch = ({
  provision: { activateTenantAction, getUserTenantActivationAction },
  location: { renderComponentAction },
  user: { checkEulaAction }
}) => ({
  activateTenant: activateTenantAction,
  renderComponent: renderComponentAction,
  getUserTenantActivation: getUserTenantActivationAction,
  checkEula: checkEulaAction
});

// connect(mapStateToProps, mapDispatch)(Note)
export default connect(mapStateToProps, mapDispatch)(TermsAndConditions);
