import React from 'react';
import { styled } from '@mui/material/styles';
import { connect } from 'react-redux';
import { Button, Link } from '@mui/material';
import variables from '../../variables.json';
const PREFIX = 'InstructionsComponent';

const classes = {
  continer: `${PREFIX}-continer`,
  buttonStyle: `${PREFIX}-buttonStyle`,
  frame: `${PREFIX}-frame`,
  link: `${PREFIX}-link`,
  mob: `${PREFIX}-mob`
};

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.continer}`]: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },

  [`& .${classes.buttonStyle}`]: {
    backgroundColor: variables.ORANGE_COLOR,
    color: variables.WHITE_COLOR,
    width: '20%',
    [theme.breakpoints.down('md')]: {
      width: '40%'
    }
  },

  [`& .${classes.frame}`]: {
    height: '80%',
    margin: '20px 0'
  },

  [`& .${classes.link}`]: {
    margin: '0 5px'
  },

  [`& .${classes.mob}`]: {
    margin: '10px'
  }
}));

function InstructionsComponent(props) {
  return (
    <Root
      className={classes.continer}
      style={{
        height: props.loginType === 'verifyGeotabAddinAccount' ? 'calc(100vh - 100px)' : 'calc(100vh - 50px)',
        width: '100%'
      }}
    >
      <iframe
        className={classes.frame}
        width={props.screen < 900 ? '90%' : '900px'}
        src={props.screen < 900 ? variables.USER_GUIDE_PDF_URL : variables.USER_GUIDE_URL}
      ></iframe>

      <Button variant="contained" className={classes.buttonStyle} onClick={() => props.renderComponent('mapbox')}>
        Go to Map
      </Button>
    </Root>
  );
}

const mapStateToProps = ({ location, user }) => ({
  routerLocation: location.routerLocation,
  loginType: user.loginType,
  screen: location.screenWidth
});

const mapDispatch = ({ location: { renderComponentAction }, user: { getInstructionDocAction } }) => ({
  renderComponent: renderComponentAction,
  getInstructionDoc: getInstructionDocAction
});

export default connect(mapStateToProps, mapDispatch)(InstructionsComponent);
