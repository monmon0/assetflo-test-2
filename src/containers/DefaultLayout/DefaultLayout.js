import React, { Component } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { Container } from 'reactstrap';
import {
  AppAside,
  // AppBreadcrumb,
  AppFooter,
  AppHeader,
  AppSidebar,
  AppSidebarFooter,
  AppSidebarForm,
  AppSidebarHeader,
  AppSidebarMinimizer,
  AppSidebarNav
} from '@coreui/react';
// sidebar nav config
import navigation from '../../_nav';
// routes config
import routes from '../../routes';
import DefaultAside from './DefaultAside';
import DefaultFooter from './DefaultFooter';
import DefaultHeader from './DefaultHeader';
import agent from '../../views/agent';
import Fullscreen from 'react-full-screen';

class DefaultLayout extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userName: '',
      database: '',
      isFull: false
    };
  }

  goFull = () => {
    this.setState({ isFull: true });
  };

  async componentDidMount() {
    const user = await agent.auth.current();
    if (user) {
      this.setState({
        userName: user.userName || '',
        database: user.database || ''
      });
    }
  }

  render() {
    return (
      <div className="app">
        <AppHeader fixed>
          <DefaultHeader />
          <button onClick={this.goFull} className="btn btn-dark" style={{ marginRight: '10px', marginLeft: '-10px' }}>
            Go Fullscreen
          </button>
        </AppHeader>
        <div className="app-body">
          <AppSidebar fixed display="none">
            <AppSidebarHeader />
            <AppSidebarForm />
            <AppSidebarNav navConfig={navigation} {...this.props} />
            <AppSidebarFooter />
            <div className="sidebar-header-username">
              <span>Database: {this.state.database}</span> <br />
              <span>{this.state.userName} </span>
            </div>
            <AppSidebarMinimizer />
          </AppSidebar>
          <main className="main">
            {/* <AppBreadcrumb appRoutes={routes} /> */}
            <Container fluid>
              <Fullscreen enabled={this.state.isFull} onChange={(isFull) => this.setState({ isFull })}>
                <Switch>
                  {routes.map((route, idx) => {
                    return route.component ? (
                      <Route
                        key={idx}
                        path={route.path}
                        exact={route.exact}
                        name={route.name}
                        render={(props) => <route.component {...props} />}
                      />
                    ) : null;
                  })}
                  {/* <Redirect from="/" to="/map" /> */}
                </Switch>
              </Fullscreen>
            </Container>
          </main>
          <AppAside>
            <DefaultAside />
          </AppAside>
        </div>
        <AppFooter>
          <DefaultFooter />
        </AppFooter>
      </div>
    );
  }
}

export default DefaultLayout;
