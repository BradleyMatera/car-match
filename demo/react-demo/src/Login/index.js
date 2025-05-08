import React from 'react';
import PropTypes from 'prop-types';
import RRPropTypes from 'react-router-prop-types';
// import { Redirect } from 'react-router-dom'; -----> Deprecated
import { Navigate } from 'react-router-dom'; // Use Navigate instead of Redirect
import styles from './styles.module.css';
import AuthContainer from '../containers/auth';

class Login extends React.Component {
  componentDidMount() {
    const { location, verifySlackCode } = this.props;
    // get the query params from the url query string
    const queryParams = new URLSearchParams(location.search);
    // get the code if there is one from slack
    const code = queryParams.get('code');
    // if there is code verify it
    if (code) verifySlackCode(code);
  }

  redirectToSlack = () => {
    let SLACK_URL = 'https://slack.com/oauth/authorize?';
    SLACK_URL += `client_id=${process.env.REACT_APP_CLIENT_ID}`;
    SLACK_URL += '&scope=identity.basic,identity.email';
    SLACK_URL += `&redirect_url=${process.env.REACT_APP_CLIENT_ID}`;
    window.location = SLACK_URL;
  }

  render() {
    const { loggedIn } = this.props;
    // if (loggedIn) return <Redirect to="/admin/decisions" />;
    if (loggedIn) return <Navigate to="/admin/decisions" />;
    return (
      <>
        <h1>Login</h1>
        <div>
          <button type="button" onClick={this.redirectToSlack} className={styles.button}>
            <i className="fab fa-slack" />
            <span>Login with Slack</span>
          </button>
        </div>
      </>
    );
  }
}

Login.propTypes = {
  loggedIn: PropTypes.bool,
  verifySlackCode: PropTypes.func.isRequired,
  location: RRPropTypes.location.isRequired,
};

Login.defaultProps = {
  loggedIn: false,
};

export default AuthContainer(Login);
