import '@dsalvagni/react-profile-picture/build/ProfilePicture.css';
import styles from './join.module.css';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import ProfilePicture from '@dsalvagni/react-profile-picture';
import { Button, Control, Field, Image, Input, Label } from 'bloomer';

class Join extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.profilePictureRef = React.createRef();
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
    const { registerUser } = this.props;
    const { avatar, city, password, state, username } = this.state;

    const PP = this.profilePictureRef.current;
    registerUser({
      avatar: PP ? PP.getImageAsDataUrl() : avatar,
      city,
      password,
      state,
      username,
    });
  };

  render() {
    const {
      avatar,
      city,
      password,
      showUpload = false,
      state,
      username,
    } = this.state;

    return (
      <form onSubmit={this.onSubmit} className={styles.form}>
        <h1 className={styles.heading}>Join ShipIt</h1>
        <div className={styles.profilePic}>
          <Label className={styles.label}>Avatar</Label>
          {(showUpload || !avatar) && (
            <ProfilePicture
              ref={this.profilePictureRef}
              frameFormat="circle"
              minImageSize={64}
              frameSize={64}
            />
          )}
          {avatar && !showUpload && (
            <>
              <Image src={avatar} className={styles.avatar} />
              <Button
                onClick={() => {
                  this.setState({ showUpload: true });
                }}
                className={styles.button}
              >
                Change Avatar
              </Button>
            </>
          )}
        </div>
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
              value={password}
              type="password"
              onChange={this.handleInputChange}
            />
          </Control>
        </Field>
        <Field>
          <Label className={styles.label}>City</Label>
          <Control>
            <Input
              className={styles.input}
              name="city"
              value={city}
              onChange={this.handleInputChange}
            />
          </Control>
        </Field>
        <Field>
          <Label className={styles.label}>State</Label>
          <Control>
            <Input
              className={styles.input}
              name="state"
              value={state}
              onChange={this.handleInputChange}
            />
          </Control>
        </Field>
        <Button className={styles.button} type="submit">
          Join
        </Button>
      </form>
    );
  }
}

Join.propTypes = {
  registerUser: PropTypes.func,
};

Join.defaultProps = {
  registerUser: () => {},
};

export default Join;
