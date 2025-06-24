import React, { useEffect } from 'react';
import { styled } from '@mui/material/styles';
import { connect } from 'react-redux';
import { Box, Checkbox, Button, FormControlLabel, Typography } from '@mui/material';

import variables from '../../variables.json';

const PREFIX = 'Eula';

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
    margin: '70px 0'
  },

  [`& .${classes.checkboxWithButtonBox}`]: {
    display: 'flex',
    flexDirection: 'column',
    width: '50%'
  },

  [`& .${classes.buttonStyle}`]: {
    backgroundColor: variables.ORANGE_COLOR,
    color: variables.WHITE_COLOR,
    width: '20%'
  }
}));

function Eula({ eula, checkEula, renderComponent, screen, loginType }) {
  const [state, setState] = React.useState({
    eula: false
  });

  useEffect(() => {
    // if (eula) renderComponent('mapbox');
    if (eula) renderComponent('successpage');
  }, [eula]);

  const OrangeCheckbox = (props) => <Checkbox color="default" {...props} />;

  const handleChange = (event) => {
    setState({ ...state, eula: event.target.checked });
  };

  const handleSubmitEula = () => {
    checkEula();
  };

  return (
    <StyledBox
      className={classes.continer}
      style={{ height: loginType === 'verifyGeotabAddinAccount' ? '80vh' : '85vh', width: '100%' }}
    >
      <Typography style={{ marginBottom: '20px', color: variables.DARK_GRAY_COLOR }} variant="h5">
        {variables.EULA}
      </Typography>
      <iframe
        title="eula"
        src={variables.EULA_URL}
        width={screen < 900 ? '90%' : '900px'}
        height="100%"
        frameBorder="0"
      ></iframe>
      <Box className={classes.checkboxWithButtonBox}>
        <FormControlLabel
          control={
            <OrangeCheckbox
              checked={state.eula}
              onChange={handleChange}
              name="eulaCheckbox"
              classes={{
                root: classes.root,
                checked: classes.checked
              }}
            />
          }
          label="I agree to the user license agreement"
        />
        <Button variant="contained" className={classes.buttonStyle} disabled={!state.eula} onClick={handleSubmitEula}>
          Submit
        </Button>
      </Box>
    </StyledBox>
  );
}

const mapStateToProps = ({ user, location }) => ({
  eula: user.eula,
  screen: location.screenWidth,
  loginType: user.loginType
});

const mapDispatch = ({ location: { renderComponentAction }, user: { checkEulaAction } }) => ({
  renderComponent: renderComponentAction,
  checkEula: checkEulaAction
});

// connect(mapStateToProps, mapDispatch)(Note)
export default connect(mapStateToProps, mapDispatch)(Eula);
