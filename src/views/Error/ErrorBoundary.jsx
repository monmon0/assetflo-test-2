import React from 'react';
import { connect } from 'react-redux';
import BeatLoader from 'react-spinners/BeatLoader';
import variables from '../../variables.json';
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    // logErrorToMyService(error, errorInfo);
    // console.log('error', JSON.stringify(error));
    // console.log('error stack ', JSON.stringify(errorInfo.componentStack));
    // console.log('page', this.props.routerLocation);
    // api call to log error
    this.props.logWebError({ stack: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError) {
      //   window.location.reload();
      // You can render any custom fallback UI
      return (
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%'
          }}
        >
          <div
            style={{
              position: 'relative',
              left: '-50%',
              textAlign: 'center'
            }}
          >
            <h1>Sorry, we couldn't complete your request</h1>
            <p>Please try again later</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const mapStateToProps = ({ map, user, location, provision }) => ({
  routerLocation: location.routerLocation,
  email: user.email,
  database: user.database,
  eula: user.eula,
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount'
});

const mapDispatch = ({ notifications: { logWebErrorAction } }) => ({
  logWebError: logWebErrorAction
});

export default connect(mapStateToProps, mapDispatch)(ErrorBoundary);
