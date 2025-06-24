import React from 'react';
import ReactDOM from 'react-dom';
// import "./index.css";
import App from './App';

import { init } from '@rematch/core';
import * as models from './models';
import { Provider } from 'react-redux';
// import {
//   connectRouter,
//   routerMiddleware,
//   ConnectedRouter
// } from "connected-react-router";
import './App.scss';
// import { applyPolyfills, defineCustomElements } from '@mapsindoors/components/loader';

// applyPolyfills().then(() => {
//   defineCustomElements();
// });

// import { createBrowserHistory } from "history";

// const history = createBrowserHistory();
// const routeMiddleware = routerMiddleware(history);
// const middlewares = [routeMiddleware];

const store = init({
  redux: {
    // middlewares,
    reducers: {
      // router: connectRouter(history)
    }
  },
  models
});

if (process.env.NODE_ENV !== 'development') console.log = () => {};

ReactDOM.render(
  <Provider store={store}>
    {/* <ConnectedRouter history={history}> */}
    <App />
    {/* </ConnectedRouter> */}
  </Provider>,
  document.getElementById('assetflo-root')
);
// }
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
// serviceWorker.register();
