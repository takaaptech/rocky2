import 'babel-polyfill';
import 'lib/pomelo';

import React, { Component } from 'react';
import ReactDom from 'react-dom';
import { Provider } from 'react-redux';

import { configureStore } from 'store';

import Root from 'containers/Root';

const store = configureStore();

ReactDom.render(
  <Provider store={store}>
    <Root />
  </Provider>,
  document.getElementById('app')
);

pomelo.on('close', (event) => {
  // TODO: 預留處理斷線行為
});
