/* eslint-disable react/state-in-constructor */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import API from '../API';

export default function container(Component) {
  class AuthContainer extends React.Component {
    state = {
      loggedIn: !!localStorage.getItem('token'),
    }

    logout = () => {
      localStorage.removeItem('token');
      this.setState({ loggedIn: false });
    }

    verifySlackCode = async (code) => {
      const { token, loggedIn } = await API.post('/auth/slack', { code, url: process.env.REACT_APP_CALLBACK_URL });
      localStorage.setItem('token', token);
      this.setState({ loggedIn });
    }

    render() {
      const { loggedIn } = this.state;
      return (
        <Component
        /* pass all other props that are being passed to this component forward */
          {...this.props}
          loggedIn={loggedIn}
          logout={this.logout}
          verifySlackCode={this.verifySlackCode}
        />
      );
    }
  }
  return AuthContainer;
}
