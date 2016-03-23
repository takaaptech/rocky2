import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { SCENE_LOBBY } from 'constants/scene';

export default class Login extends Component {
  static contextTypes = {
    segue: PropTypes.func
  };

  onLoginSuccess() {
    console.log('login success');
    this.context.segue(SCENE_LOBBY);
  }

  onLoginFail() {
    console.log('login fail');
  }

  onClickLoginBtn() {
    var host = "pomelo";
    var port = "3010";

    pomelo.init({ host: host, port: port, log: true },
      this.onLoginSuccess.bind(this),
      this.onLoginFail.bind(this)
    );
  }

  render() {
    return (
      <div>
        <h1>Login</h1>
        <button onClick={ this.onClickLoginBtn.bind(this) }>Login</button>
      </div>
    )
  }
}
