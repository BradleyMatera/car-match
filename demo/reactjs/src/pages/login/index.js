import styles from './login.module.css';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Button, Control, Field, Input, Label } from 'bloomer';

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = { password: '', username: '' };
  }

  handleInputChange = (event) => {
    // pull the name of the input and value of input out of the event object
    const {
      target: { name, value },
    } = event;
    // update the state to a key of the name of the input and value of the value of the input
    // ex: type: 'private'
    this.setState({
      [name]: value,
    });
  };

  onSubmit = (e) => {
    e.preventDefault();
    const { loginUser } = this.props;
    const { password, username } = this.state;

    loginUser({
      password,
      username,
    });
  };

  render() {
    const { password, username } = this.state;

    return (
      <form onSubmit={this.onSubmit} className={styles.form}>
        <h1 className={styles.heading}>Login</h1>
        <Field>
          <Label className={styles.label}>Username</Label>
          <Control>
            <Input
              className={styles.input}
              name="username"
              value={username}
              onChange={this.handleInputChange}
            />
          </Control>
        </Field>
        <Field>
          <Label className={styles.label}>Password</Label>
          <Control>
            <Input
              className={styles.input}
              name="password"
              type="password"
              value={password}
              onChange={this.handleInputChange}
            />
          </Control>
        </Field>
        <Button className={styles.button} type="submit">
          Login
        </Button>
      </form>
    );
  }
}

Login.propTypes = {
  loginUser: PropTypes.func,
};

Login.defaultProps = {
  loginUser: () => {},
};

export default Login;
