import React, { Component } from 'react';
import { connect } from 'react-redux';
import Modal from '@mui/material/Modal';
import moment from 'moment';
import Provision from './Provisioning/Provision';
import Dashboard from './Dashboard/Dashboard';
import Navbar from '../views/Navbar/Navbar';
import GeotabLogin from '../views/Users/GeotabLogin';
import AssetfloLogin from '../views/Users/AssetfloLogin';
import AssetfloRegister from '../views/Users/AssetfloRegister';
import Mapbox from './Map/Mapbox.jsx';
import MainConfiguration from './Configuration/MainConfiguration';
import NotificationsComponent from './NotificationsComponent';
import ErrorPage from './Pages/ErrorPage';
import SuccessPage from './Pages/SuccessPage';
import TermsAndConditions from './Pages/TermsAndConditions';
import InstructionsComponent from './Pages/InstructionsComponent';
import Eula from './Pages/Eula';
import variables from '../variables.json';
import MainDraggableForm from './Map2/MainDraggableForm.jsx';
import TripMap from './TripHistory/TripMap.jsx';
import CompanySelect from './Users/CompanySelect.jsx';
import OrganizationMain from './Addin/TenantSettings/OrganizationMain.jsx';

import ErrorBoundary from './Error/ErrorBoundary';
import ManageTests from './Debug/ManageTestsTable.jsx';
import IndoorMap from './IndoorMap/IndoorMap.jsx';
import AssignBLETags from './Provisioning/AssignBLETags/AssignBLETags.jsx';

class MainPage extends Component {
  state = {
    eula: false,
    termsAndCond: false,
    organization: null,
    isMenuOpen: null,
    displayedMap: 'mapbox',
    displayIndoor: 'none',
    hasCheckedOrgAndTerms: false
  };

  handleClick = (event) => {
    // setIsMenuOpen(event.currentTarget);
    // this.setState({ ...this.state, isMenuOpen: event.currentTarget });
    this.props.renderComponent('instructions');
    // console.log(this.state);
  };

  openIndoor = (params) => {
    try {
      this.setState({
        ...this.state,
        ...params
      });
    } catch (e) {
      console.log(e);
    }
  };

  handleClose = () => {
    this.setState({ ...this.state, isMenuOpen: null });
  };

  screenWidthListener = () => {
    this.props.screenWidth(window.innerWidth);
    window.addEventListener('resize', () => {
      this.props.screenWidth(window.innerWidth);
      // console.log(window.innerWidth);
    });
  };

  checkIfAddin = async (key, server) => {
    let localStoregData = window.localStorage.getItem(key ? key : `sTokens_${window.location.href.split('/')[3]}`);

    let parsedData;
    if (localStoregData) {
      // this.props.renderComponent("wrld3d");
      parsedData = JSON.parse(localStoregData);

      let payload = {
        server: server ? server : window.location.host,
        userName: parsedData.userName.toLowerCase(),
        database: parsedData.database.toLowerCase(),
        sessionId: parsedData.sessionId
      };
      await this.props.verifygeotab(payload);
    }
    return parsedData;
  };

  loginFromLocalStorage = async () => {
    const db = window.localStorage.getItem('af_db');
    let storageKey = `af_token_${db}`;
    let afToken = window.localStorage.getItem(storageKey);
    let payload;
    if (
      // !localStoregData &&
      afToken &&
      afToken.token !== null &&
      afToken.email !== null &&
      afToken.database !== null &&
      afToken.role !== null
    ) {
      // console.log(afToken);
      let parsedAfToken = JSON.parse(afToken);
      // console.log('parsedAfToken', parsedAfToken);
      payload = {
        token: parsedAfToken.token,
        database: parsedAfToken.database,
        email: parsedAfToken.email,
        role: parsedAfToken.role,
        userPermissions: parsedAfToken.userPermissions,
        group: parsedAfToken.group,
        groups: parsedAfToken.groups,
        eula: parsedAfToken.eula,
        firstTimeLogin: parsedAfToken.firstTimeLogin,
        ...(parsedAfToken.adminDatabase && { adminDatabase: parsedAfToken.adminDatabase })
      };
      this.props.loginFromStorage(payload);
    }
    return payload;
  };

  checkStorage = async () => {
    const filterFromStorage = window.localStorage.getItem(`deviceTypeFilter_${this.props.database}`);
    if (!filterFromStorage) return;
    const parsedFilter = JSON.parse(filterFromStorage);
    this.props.initFilter(parsedFilter);
  };

  handleGeotabUrlGroups = () => {
    // handle groups from geotab url

    let filter = window.location.hash.match(/\(([^)]+)\)/);
    let groups;
    if (filter) {
      groups = filter[1].split(',');
    } else {
      groups = [];
    }
    this.props.setAddinGroupFilter({ groupList: groups });
    window.addEventListener('popstate', () => {
      // check and set group filter if addin url params changed
      let filter = window.location.hash.match(/\(([^)]+)\)/);
      let groups;
      if (filter) {
        groups = filter[1].split(',');
      } else {
        groups = [];
      }
      this.props.setAddinGroupFilter({ groupList: groups });
      // enter indoor if url params set to indoor
      let hasDisplayedMap = window.location.hash.indexOf('displayedMap:wrld') >= 1;
      // if (hasDisplayedMap) {
      //   console.log(hasDisplayedMap);
      //   this.props.setWrldMapOnly(true);
      //   this.openIndoor({
      //     displayIndoor: '',
      //     displayedMap: 'wrld'
      //   });
      //   this.props.setHideHeaderFooter(true);
      // } else {
      //   this.props.setWrldMapOnly(false);
      //   this.props.setHideHeaderFooter(false);
      // }
    });
  };

  // checkForOrganization = async () => {
  //   const tenant = await this.props.getUserTenantActivation(this.props.database);
  //   if (tenant && !tenant.organization) {
  //     this.props.setErrorPageMessage(variables.ERROR.NO_ORGANIZATION_FOUND);
  //     return this.props.renderComponent('errorpage');
  //   }
  //   if (tenant && !tenant.activation && this.props.role === 'user') {
  //     this.props.setErrorPageMessage(variables.ERROR.ORGANIZATION_NOT_ACTIVATED);
  //     return this.props.renderComponent('errorpage');
  //   }
  //   if (tenant && !tenant.activation && this.props.role === 'admin') {
  //     this.props.setErrorPageMessage(variables.ERROR.TERRMS_NOT_SIGNED);
  //     return this.props.renderComponent('termsandcondtions');
  //   }
  // };
  async checkOrgAndTerms() {
    // if (this.state.hasCheckedOrgAndTerms) return;
    // this.setState({ hasCheckedOrgAndTerms: true });

    // const tenant = await this.props.getUserTenantActivation(this.props.database);

    // if (tenant && tenant.type && tenant.payload) {
    //   return;
    // }
    // if (tenant === undefined || !tenant || !tenant.organization) {
    //   this.props.setErrorPageMessage(variables.ERROR.NO_ORGANIZATION_FOUND);
    //   return this.props.renderComponent('errorpage');
    // }
    // if (!tenant.activation && this.props.role === 'user') {
    //   this.props.setErrorPageMessage(variables.ERROR.ORGANIZATION_NOT_ACTIVATED);
    //   return this.props.renderComponent('errorpage');
    // }
    if (!this.props.eula || this.props.eula === undefined) {
      this.props.setErrorPageMessage('');
      return this.props.renderComponent('termsandcondtions');
    }
  }

  checkForEulaIfAccepted = () => {
    if (!this.props.eula || this.props.eula === undefined) {
      console.log('checkForEulaIfAccepted');
      return this.props.renderComponent('eula');
    }
    return;
  };

  async checkIfMapAddin() {
    try {
      const ls = window.location.href.split('?')[1];
      if (!ls) {
        // console.log('error', ls);
        // not addin
        this.props.setIsAddin(false);
        return {};
      }
      const params = JSON.parse(decodeURIComponent(ls));
      // console.log('params', params);
      const storageObj = {
        server: params.server,
        userName: params.userName,
        database: params.database,
        sessionId: params.sessionId
      };

      window.localStorage.setItem(params.key, JSON.stringify(storageObj));

      storageObj && window.sessionStorage.setItem(`routerLocation_${params.database}`, params.routerLocation);

      params.fromDate && this.props.setTripFromDate(params.fromDate);
      params.selectedTime && this.props.setTripTimes(params.selectedTime);
      params.css && this.props.setStyle(params.css);
      params.geotabId && this.props.setGeotabId(params.geotabId);
      params.serialNumber && this.props.setSerialNumber(params.serialNumber);
      params.geotabIdFilter && this.props.setGeotabIdFilter(params.geotabIdFilter);
      params.bbox && this.props.setIndoorBbox(params.bbox);
      params.zoom && this.props.setIndoorZoom(params.zoom);
      this.props.setHideHeaderFooter(params.hideHeaderFooter);
      this.props.setIsAddin(true);
      return { key: params.key, server: params.server, isAddin: true, ...(params.groups && { groups: params.groups }) };
    } catch (e) {
      console.log(e.message, e);
      return {};
    }
  }

  async componentDidMount() {
    // await this.props.getUserTenantActivation(this.props.database);
    console.log('Assetflo Application Mounted', window.location.href);
    try {
      const isIncognito = window.localStorage;
      // console.log('isIncognito', isIncognito);
    } catch (e) {
      this.props.setErrorPageMessage(variables.ERROR.NO_ORGANIZATION_FOUND);
      return this.props.renderComponent('errorpage');
    }

    const { key = null, server = null, groups = null, isAddin = false } = await this.checkIfMapAddin();

    let afLocalStorageData;
    this.screenWidthListener();
    let localStoregData = await this.checkIfAddin(key, server);
    groups && this.props.setAddinGroupFilter({ groupList: groups.split(',') });
    this.handleGeotabUrlGroups();
    if (!localStoregData) {
      afLocalStorageData = await this.loginFromLocalStorage();
    }
    this.checkStorage();
    !isAddin && this.props.email && this.checkOrgAndTerms();
    // console.log('continue to routing', !isAddin, this.props.email);
    window.addEventListener(
      'message',
      (event) => {
        if (event.origin.includes('geotab.com')) {
          this.handleAddinMessage(event.data);
        }
      },
      false
    );

    // this.props.email && this.props.getPois();
    // this.props.email && (await this.checkForEulaIfAccepted());
    this.initialRouting(afLocalStorageData);
    // }
  }

  initialRouting = (afLocalStorageData) => {
    const routerLocation = window.sessionStorage.getItem(`routerLocation_${this.props.database}`);
    // console.log('initialRouting step 1:', this.props.email, this.props.eula, this.props.userTenant);
    let route = routerLocation;
    if (!this.props.eula && afLocalStorageData) return;

    if (
      (this.props.email && this.props.email !== null && this.props.eula) ||
      (this.props.eula === undefined && this.props.userTenant.activation)
    ) {
      const deviceSelected = window.localStorage.getItem(`deviceSelected_${this.props.database}`);
      const now = moment().valueOf();
      let device = JSON.parse(deviceSelected);
      if (device && (device.expiresIn < now || device.deviceType !== 'Tag' || device.isAnchor)) {
        window.localStorage.removeItem('deviceSelected');
        device = null;
      }
      device && this.props.setDeviceSelected(device);
      const isAddinRoute = routerLocation && routerLocation.includes('Addin');
      const isAddinPageOnStandalone = this.props.loginType === 'loginFromStorageToken' && isAddinRoute;

      const displayedMap = window.localStorage.getItem('displayedMap');
      // console.log('displayedMap - ', displayedMap);

      displayedMap && this.openWrldMap();

      // console.log('initialRouting', routerLocation, this.props.wrldMapOnly);
      if ((routerLocation === 'locate' && !device) || isAddinPageOnStandalone) {
        route = 'mapbox';
      } else if (
        this.propsloginType !== 'verifyGeotabAddinAccount' &&
        routerLocation === 'mapbox' &&
        this.state.displayedMap === 'wrld'
      ) {
        this.setState({ displayIndoor: 'none', displayedMap: 'mapbox' });
      } else {
        route = routerLocation || 'mapbox';
      }
    } else {
      if (['mapbox', 'wrld3d'].includes(route) && this.props.loginType === 'verifyGeotabAddinAccount') {
        route = 'errorpage';
      } else if (this.props.loginType !== 'verifyGeotabAddinAccount') {
        route = 'geotablogin';
      }
    }

    return this.props.renderComponent(route);
  };

  openWrldMap = () => {
    this.setState({
      displayIndoor: '',
      displayedMap: 'wrld'
    });
    this.props.setWrldMapOnly(true);
    this.props.setHideHeaderFooter(true);
  };

  async componentDidUpdate(prevProps, prevState) {
    let prev = prevProps.routerLocation;
    let current = this.props.routerLocation;
    if (
      (prev === 'geotablogin' || prev === 'assetflologin') &&
      (current !== 'geotablogin' || current !== 'assetflologin')
    ) {
      // this.props.email && (await this.checkOrgAndTerms());
      // this.props.email && (await this.checkForEulaIfAccepted());
    }
    if (prev !== 'mapbox' && current === 'mapbox' && !this.props.wrldMapOnly) {
      this.setState({ displayedMap: 'mapbox', displayIndoor: 'none' });
    }
    if (prev === 'geotablogin' && current !== 'geotablogin') {
      this.props.email && this.checkOrgAndTerms();
    }
  }

  handleAddinMessage = (data) => {
    switch (data.message) {
      case 'groups':
        console.log('groups', data.value.split(','));
        this.props.setAddinGroupFilter({ groupList: data.value.split(',') });
        break;

      case 'bbox':
        const value = JSON.parse(data.value);
        value.bbox && this.props.setIndoorBbox(value.bbox);
        value.zoom && this.props.setIndoorZoom(value.zoom);
        break;

      case 'addin_blur':
        // pause location poller
        ['mapbox', 'wrld3d'].includes(this.props.routerLocation) && this.props.setLocationPause(true);
        console.log('BLURED', this.props.routerLocation);
        break;

      case 'addin_focus':
        // resume location poller
        if (['mapbox', 'wrld3d'].includes(this.props.routerLocation)) {
          this.props.setLocationPause(false);
          this.props.getTags();
        }
        console.log('FOCUS', this.props.routerLocation);
        break;
      default:
        break;
    }
  };

  footer() {
    const year = new Date().getFullYear();
    return (
      <div
        style={{
          position: 'fixed',
          display: 'flex',
          justifyContent: 'center',
          bottom: 0,
          height: this.props.screen < 1000 ? 30 : 50,
          width: '100%',
          background: 'white',
          zIndex: 110,
          marginLeft:
            this.props.loginType === 'verifyGeotabAddinAccount' && !this.props.geotabFeaturePreviewUI ? '-15px' : '0px',
          boxShadow: 'rgb(0 0 0 / 15%) 0px -4px 8px 0px',
          alignItems: 'center'
        }}
      >
        <span style={{ marginRight: '5px' }}> © {year} Assetflo.io </span>
        <span>
          Powered by{' '}
          <a
            style={{ color: '#F8931C', marginRight: '5px' }}
            target="_blank"
            rel="noopener noreferrer"
            href="http://assetflo.com"
          >
            {' '}
            AssetFlo Inc.
          </a>
          {this.props.role === 'admin' && this.props.screen > 1000 && <span>|</span>}
        </span>
        {/* {this.props.routerLocation !== 'locate' && (
          <div
            data-id="VPfiB2Jjxls"
            className="livechat_button assetflo-livechat-button"
            style={{
              position: 'absolute',
              right:
                this.props.loginType === 'verifyGeotabAddinAccount'
                  ? this.props.screen < 1000
                    ? 15
                    : 75
                  : this.props.screen < 1000
                  ? 15
                  : 25,
              bottom: this.props.screen < 1000 ? 32 : 52,
              boxShadow: 'rgb(0 0 0 / 15%) 0px -4px 8px 0px',
              borderRadius: '50%',
              background: variables.WHITE_COLOR,
              visibility: this.props.email ? 'visible' : 'hidden',
              height: 50
            }}
          >
            <a href="https://www.livechat.com/customer-service/?utm_source=chat_button&utm_medium=referral&utm_campaign=lc_12522996">
              Chat with us now
            </a>
          </div>
        )} */}
        {/* {this.props.role === 'admin' && this.props.eula && (
          <div
            style={{ cursor: 'pointer', color: variables.ORANGE_COLOR, margin: '10px' }}
            onClick={(e) => this.handleClick(e)}
          >
            Show instructions
          </div>
        )} */}
      </div>
    );
  }

  showInstructionsModal() {
    return (
      <Modal
        style={{ width: '60%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: 'auto' }}
        open={Boolean(this.state.isMenuOpen)}
        onClose={() => this.handleClose()}
      >
        <InstructionsComponent />
      </Modal>
    );
  }

  renderComponent() {
    // console.log(this.props.routerLocation && this.props.routerLocation);
    switch (this.props.routerLocation && this.props.routerLocation) {
      case 'mapbox':
        return <IndoorMap />;
        return (
          <Mapbox
            displayIndoor={this.state.displayIndoor}
            displayedMap={this.state.displayedMap}
            openIndoor={this.openIndoor}
          />
        );
      case 'dashboard':
        return <Dashboard />;
      case 'provision':
        return <Provision />;
      case 'geotablogin':
        return <GeotabLogin />;
      case 'assetflologin':
        return <AssetfloLogin />;
      case 'assetfloregister':
        return <AssetfloRegister />;
      case 'configuration':
        return <MainConfiguration />;
      case 'errorpage':
        return <ErrorPage />;
      case 'termsandcondtions':
        return <TermsAndConditions />;
      case 'eula':
        return <Eula />;
      case 'successpage':
        return <SuccessPage />;
      case 'instructions':
        return <InstructionsComponent />;
      case 'draggable':
        return <MainDraggableForm />;
      case 'trip':
        return <TripMap />;
      case 'companyselect':
        return <CompanySelect />;
      case 'tenantAddin':
        return <OrganizationMain />;
      case 'simulation':
        return <ManageTests />;
      case 'indoors':
        return <IndoorMap />;
      case 'AssignBLETags':
        return <AssignBLETags />;
    }
  }

  render() {
    const isAddin = this.props.routerLocation && this.props.routerLocation.includes('Addin');
    let paddingTop =
      (this.props.loginType === 'verifyGeotabAddinAccount' &&
        this.props.geotabFeaturePreviewUI &&
        !this.props.hideHeaderFooter &&
        '45px') ||
      (this.props.hideHeaderFooter && '0px') ||
      '50px';
    // if (this.props.loginType !== 'verifyGeotabAddinAccount' && this.props.screen < 1000) {
    //   paddingTop = 0;
    // }
    return (
      <ErrorBoundary>
        <div
          style={{
            height: '100%',
            paddingTop: paddingTop
          }}
        >
          {(!this.props.hideHeaderFooter || this.props.wrldMapOnly) && (
            <Navbar organization={this.state.organization} />
          )}
          <div
            style={{
              // marginTop:
              //   (this.props.loginType === 'verifyGeotabAddinAccount' &&
              //     this.props.geotabFeaturePreviewUI &&
              //     !this.props.hideHeaderFooter &&
              //     '45px') ||
              //   (this.props.hideHeaderFooter && '0px') ||
              //   '50px',
              backgroundColor:
                this.props.routerLocation && this.props.routerLocation.includes('Addin') ? '#fff' : '#e4e5e6',
              // overflow: 'hidden',
              height: '100%'
            }}
          >
            {/* {this.showInstructionsModal()} */}
            <NotificationsComponent />
            {this.renderComponent()}
          </div>
          {/* {!this.props.hideHeaderFooter && (
          <>
            <LiveChat
              onChatLoaded={(ref) => {
                this.livechat = ref;
              }}
              license={12522996}
            />
            {this.footer()}
          </>
        )} */}
        </div>
      </ErrorBoundary>
    );
  }
}

const mapStateToProps = ({ location, user, provision, map }) => ({
  routerLocation: location.routerLocation,
  database: user.database,
  email: user.email,
  role: user.role,
  eula: user.eula,
  loginType: user.loginType,
  userTenant: provision.userTenant,
  screen: location.screenWidth,
  geotabFeaturePreviewUI: user.geotabFeaturePreviewUI,
  hideHeaderFooter: map.hideHeaderFooter,
  pois: map.pois,
  wrldMapOnly: map.wrldMapOnly && user.loginType === 'verifyGeotabAddinAccount'
});

const mapDispatch = ({
  location: { renderComponentAction, screenWidthAction, initFilterAction },
  user: { verifygeotabAction, loginFromStorageAction, setAddinGroupFilterAction },
  notifications: { setErrorPageMessageAction },
  provision: { getUserTenantActivationAction },
  map: {
    setIsListOpenAction,
    setDeviceSelectedAction,
    setHideHeaderFooterAction,
    setWrldMapOnlyAction,
    getTagsAction,
    setLocationPauseAction,
    getPoisAction
  },
  addin: {
    setIsAddinAction,
    setTripFromDateAction,
    setTripTimesAction,
    setStyleAction,
    setGeotabIdAction,
    setGeotabIdFilterAction,
    setIndoorBboxAction,
    setIndoorZoomAction,
    setSerialNumberAction
  }
}) => ({
  renderComponent: renderComponentAction,
  verifygeotab: verifygeotabAction,
  loginFromStorage: loginFromStorageAction,
  screenWidth: screenWidthAction,
  setAddinGroupFilter: setAddinGroupFilterAction,
  setErrorPageMessage: setErrorPageMessageAction,
  getUserTenantActivation: getUserTenantActivationAction,
  setIsListOpen: setIsListOpenAction,
  setDeviceSelected: setDeviceSelectedAction,
  initFilter: initFilterAction,
  setHideHeaderFooter: setHideHeaderFooterAction,
  setTripFromDate: setTripFromDateAction,
  setTripTimes: setTripTimesAction,
  setStyle: setStyleAction,
  setGeotabId: setGeotabIdAction,
  setSerialNumber: setSerialNumberAction,
  setGeotabIdFilter: setGeotabIdFilterAction,
  setIndoorBbox: setIndoorBboxAction,
  setIndoorZoom: setIndoorZoomAction,
  setWrldMapOnly: setWrldMapOnlyAction,
  getTags: getTagsAction,
  setLocationPause: setLocationPauseAction,
  getPois: getPoisAction,
  setIsAddin: setIsAddinAction
});

export default connect(mapStateToProps, mapDispatch)(MainPage);
