import styles from './header.module.css';

import React from 'react';
import PropTypes from 'prop-types';

import {
  Dropdown,
  DropdownContent,
  DropdownMenu,
  DropdownTrigger,
  Icon,
} from 'bloomer';
import { Link, useHistory } from 'react-router-dom';

export default function Header({ loggedIn, logout, user }) {
  const history = useHistory();
  const onClickLogout = (e) => {
    e.preventDefault();
    logout();
    history.push('/');
  };
  return (
    <header className={styles.background}>
      <div className={styles.logo}>
        <img
          className={styles.logoImage}
          src="data:image/png;base64,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"
          alt="S"
        />
        <span className={styles.logoFont}>hipIt</span>
      </div>
      <div className={styles.searchBar}>
        <img
          className={styles.searchBarIcon}
          src="/search_icon.svg"
          alt="search"
        />
        <input
          className={styles.searchBarInput}
          name="search"
          placeholder="search by keywords or tags..."
        />
      </div>
      {loggedIn && (
        <div>
          <Link to="/create-post" className={styles.navButton}>
            New Post
          </Link>
          <Dropdown isHoverable isAlign="right">
            <DropdownTrigger aria-haspopup="true" aria-controls="dropdown-menu">
              <img
                src={user.avatar}
                className={styles.avatar}
                alt={user.name}
              />
              <Icon
                icon="angle-down"
                isSize="small"
                className="fa fa-angle-down"
              />
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownContent>
                <Link to={`/users/${user.id}`} className="dropdown-item">
                  Profile
                </Link>
                <Link to="/settings" className="dropdown-item">
                  Settings
                </Link>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <a
                  onClick={onClickLogout}
                  className="dropdown-item"
                  role="presentation"
                >
                  Logout
                </a>
              </DropdownContent>
            </DropdownMenu>
          </Dropdown>
        </div>
      )}

      {!loggedIn && (
        <div>
          <Link to="/login" className={styles.navLink}>
            Login
          </Link>
          <Link to="/join" className={styles.navButton}>
            Join Now
          </Link>
        </div>
      )}
    </header>
  );
}

Header.propTypes = {
  loggedIn: PropTypes.bool,
  logout: PropTypes.func,
  user: PropTypes.shape({
    avatar: PropTypes.string,
    id: PropTypes.string,
    name: PropTypes.string,
  }),
};
Header.defaultProps = {
  loggedIn: true,
  logout: () => {},
  user: {
    avatar: 'https://i.pravatar.cc/100',
    id: 'ffc6d3db-3e8a-4d18-a18a-d3d8e9d62111',
  },
};
