import React, { Component } from 'react';
import { Nav, NavItem, NavLink } from 'reactstrap';
import PropTypes from 'prop-types';
// import { history } from '../../App'

import { AppNavbarBrand, AppSidebarToggler } from '@coreui/react';
import agent from '../../views/agent';
// import { createHashHistory } from 'history';
// const history = createHashHistory();

const propTypes = {
  children: PropTypes.node
};

const defaultProps = {};

class DefaultHeader extends Component {
  constructor(props) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
    this.toggleFade = this.toggleFade.bind(this);

    this.state = {
      timeout: 200,
      fadeIn: true,
      isLoggedIn: true,
      userName: '',
      database: '',
      logo: require(`../../assets/img/brand/AssetFlo-orange.png`)
    };
  }

  async componentDidMount() {
    const user = await agent.auth.current();
    if (user) {
      this.setState({
        isLoggedIn: true,
        userName: user.userName || '',
        database: user.database || '',
        logo:
          require(`../../assets/img/brand/${user.database === '' ? `assetflo` : user.database}.png`) || this.state.logo
      });
    }
  }

  toggleFade() {
    this.setState((prevState) => {
      return {
        fadeIn: !prevState
      };
    });
  }

  async handleSubmit(event) {
    event.preventDefault();
    agent.auth.logout();
  }
  render() {
    // eslint-disable-next-line
    const { children, ...attributes } = this.props;

    return (
      <React.Fragment>
        <AppSidebarToggler className="d-lg-none" display="md" mobile />
        <AppNavbarBrand
          full={{
            // src: logo,
            src: this.state.logo,
            width: '70%',
            height: '50%',
            alt: this.state.database || 'assetflo.io'
          }}
          minimized={{
            src: this.state.logo,
            width: '100%',
            height: '30%',
            alt: this.state.database || 'assetflo.io'
          }}
        />
        <AppSidebarToggler className="d-md-down-none" display="lg" />

        <Nav className="d-md-down-none" navbar>
          <NavItem className="px-3">
            <NavLink href="/#/"> Home</NavLink>
          </NavItem>
        </Nav>
        <Nav className="ml-auto" navbar>
          <NavItem className="px-3">
            <div className="header-username">
              {/* <span>Database: {this.state.database}</span> <br/>
              <span>Username: {this.state.userName} </span> */}
            </div>
            <button className="fa fa-lock btn btn-primary" onClick={this.handleSubmit}>
              {' '}
              Logout
            </button>
          </NavItem>
        </Nav>
      </React.Fragment>
    );
  }
}

DefaultHeader.propTypes = propTypes;
DefaultHeader.defaultProps = defaultProps;

export default DefaultHeader;
