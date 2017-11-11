import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter as Router, Route, Switch, Redirect, Link } from 'react-router-dom';
import { Provider } from 'react-redux';

import store from './reducers';

import HomeScreen from './screens/homeScreen';

const rootElement = document.querySelector(document.currentScript.getAttribute('data-container'));

ReactDOM.render(
  <Provider store={store}>
    <Router>
      <div className="app">
        <Switch>
          <Route path="/" component={HomeScreen} />
        </Switch>
      </div>
    </Router>
  </Provider>,
  rootElement
);
