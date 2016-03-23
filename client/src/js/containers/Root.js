import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { isEmpty } from 'lodash';

import ViewController from 'lib/ViewController';

import Login from 'components/Login';
import Lobby from 'components/Lobby';
import Poker from 'components/Poker';

import { SCENE_LOGIN, SCENE_LOBBY, SCENE_POKER } from 'constants/scene';

class Root extends Component {
  static childContextTypes = {
    segue: PropTypes.func
  };

  getChildContext() {
    return {
      segue: this.segue.bind(this)
    };
  }

  constructor(props) {
    super(props);
    this.state = { stage: '' };
    this.vc = new ViewController(this);
    this.register();

    window.addEventListener('beforeunload', () => {
      pomelo.disconnect();
    }, false);
  }

  register() {
    this.vc.register({ type: SCENE_LOGIN, view: Login });
    this.vc.register({ type: SCENE_LOBBY, view: Lobby });
    this.vc.register({ type: SCENE_POKER, view: Poker });
  }

  segue(stage) {
    if (!this.vc.getView(stage)) {
      throw new Error('No match view controller...');
    }

    this.setState({ stage });
  }

  componentDidMount() {
    this.segue(SCENE_POKER);
  }

  render() {
    const { stage } = this.state;

    if (stage === '') {
      return <div>Page not found!</div>
    }

    return (
      <div>
        { React.createElement(this.vc.getView(stage))}
      </div>
    )
  }
}

function mapStateToProps(state) {
  return state;
}

export default connect(mapStateToProps)(Root)
