import { compose, createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk';

import * as reducers from 'reducers';

const reducer = combineReducers(Object.assign({}, reducers));

const finalCreateStore = compose(
  applyMiddleware(thunk),
  // https://github.com/zalmoxisus/redux-devtools-extension
  typeof window === 'object' && typeof window.devToolsExtension !== 'undefined' ? window.devToolsExtension() : f => f
)(createStore);

export function configureStore() {
  const store = finalCreateStore(reducer);

  if (module.hot) {
    module.hot.accept('reducers', () => {
      const nextReducers = require('reducers/index');
      store.replaceReducer(combineReducers(nextReducers));
    });
  }

  return store;
}
