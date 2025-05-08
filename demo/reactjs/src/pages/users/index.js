import styles from './users.module.css';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Image } from 'bloomer';
import { Link } from 'react-router-dom';

import userData from '../../exampleData/users';

class Users extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchFilter: '',
    };
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

  render() {
    const { users } = this.props;
    const { searchFilter } = this.state;

    const filteredUsers = users.filter((user) => {
      if (!searchFilter) return true;
      const search = searchFilter.toLowerCase();
      return (
        user.username.toLowerCase().indexOf(search) !== -1 ||
        user.city.toLowerCase().indexOf(search) !== -1 ||
        user.state.toLowerCase().indexOf(search) !== -1
      );
    });

    return (
      <>
        <div className={styles.searchBar}>
          <img
            className={styles.searchBarIcon}
            src="/search_icon.svg"
            alt="search"
          />
          <input
            className={styles.searchBarInput}
            name="searchFilter"
            onChange={this.handleInputChange}
            placeholder="filter users"
          />
        </div>
        <div className={styles.users}>
          {filteredUsers.map((user) => (
            <div className={styles.user} key={user.id}>
              <Image
                isSize="48x48"
                src={user.avatar}
                className={styles.avatar}
              />
              <span className={styles.data}>
                <Link to={`/users/${user.id}`} className={styles.username}>
                  {user.username}
                </Link>
                <span className={styles.location}>
                  {user.city}
                  {', '}
                  {user.state}
                </span>
                <span className={styles.tags}>
                  {user.tags
                    .map((tag) => (
                      <Link key={tag.id} to={`/tags/${tag.id}`}>
                        {tag.name}
                      </Link>
                    ))
                    .reduce((prev, curr) => [prev, ', ', curr])}
                </span>
              </span>
            </div>
          ))}
        </div>
      </>
    );
  }
}
Users.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      avatar: PropTypes.string,
      city: PropTypes.string,
      state: PropTypes.string,
      tags: PropTypes.arrayOf(PropTypes.object),
      username: PropTypes.string,
    })
  ),
};

Users.defaultProps = {
  users: userData,
};
export default Users;
