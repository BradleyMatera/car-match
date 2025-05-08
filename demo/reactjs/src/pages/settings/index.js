import '@dsalvagni/react-profile-picture/build/ProfilePicture.css';
import styles from './settings.module.css';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import ProfilePicture from '@dsalvagni/react-profile-picture';
import { Button, Control, Field, Image, Input, Label } from 'bloomer';

import userData from '../../exampleData/users';

class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.profilePictureRef = React.createRef();
  }

  componentDidMount() {
    const { fetchUser } = this.props;
    fetchUser();
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
    const { saveUser } = this.props;
    const { avatar, city, state, username } = this.state;

    const PP = this.profilePictureRef.current;
    saveUser({
      avatar: PP ? PP.getImageAsDataUrl() : avatar,
      city,
      state,
      username,
    });
  };

  render() {
    const {
      user: {
        avatar: defaultAvatar = '',
        city: defaultCity = '',
        state: defaultState = '',
        username: defaultUsername = '',
      },
    } = this.props;
    const {
      avatar = defaultAvatar,
      city = defaultCity,
      state = defaultState,
      username = defaultUsername,
      showUpload = false,
    } = this.state;

    return (
      <form onSubmit={this.onSubmit} className={styles.form}>
        <h1 className={styles.heading}>Your Settings</h1>
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
          Save Settings
        </Button>
      </form>
    );
  }
}

Settings.propTypes = {
  fetchUser: PropTypes.func,
  saveUser: PropTypes.func,
  user: PropTypes.shape({
    avatar: PropTypes.string,
    city: PropTypes.string,
    state: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.object),
    username: PropTypes.string,
  }),
};

Settings.defaultProps = {
  fetchUser: () => {},
  saveUser: () => {},
  user: userData[3],
};

export default Settings;
