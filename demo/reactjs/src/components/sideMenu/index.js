import styles from './sideMenu.module.css';

import React from 'react';
import PropTypes from 'prop-types';

import { Menu, MenuLabel, MenuList } from 'bloomer';
import { NavLink } from 'react-router-dom';

import tagData from '../../exampleData/tags.json';

export default class SideMenu extends React.Component {
  componentDidMount() {
    const { fetchWatching } = this.props;
    fetchWatching();
  }

  render() {
    const { currentUserId, loggedIn, watching } = this.props;

    return (
      <Menu className={styles.menu}>
        <MenuLabel>Menu</MenuLabel>
        <MenuList>
          <li>
            <NavLink exact activeClassName="is-active" to="/">
              Home
            </NavLink>
          </li>
          <li>
            <NavLink exact activeClassName="is-active" to="/tags">
              Tags
            </NavLink>
          </li>
          <li>
            <NavLink exact activeClassName="is-active" to="/users">
              Users
            </NavLink>
          </li>
        </MenuList>
        {loggedIn && (
          <>
            <MenuLabel>Dashboard</MenuLabel>
            <MenuList>
              <li>
                <NavLink
                  exact
                  activeClassName="is-active"
                  to={`/users/${currentUserId}`}
                >
                  Profile
                </NavLink>
              </li>
              <li>
                <NavLink exact activeClassName="is-active" to="/posts">
                  Your Posts
                </NavLink>
              </li>
              <li>
                <NavLink exact activeClassName="is-active" to="/settings">
                  Settings
                </NavLink>
              </li>
            </MenuList>
            <MenuLabel>Watched Tags</MenuLabel>
            <MenuList>
              {watching.map((tag) => (
                <li key={tag.id}>
                  <NavLink
                    exact
                    activeClassName="is-active"
                    to={`/tags/${tag.id}`}
                  >
                    {tag.name}
                  </NavLink>
                </li>
              ))}
            </MenuList>
          </>
        )}
      </Menu>
    );
  }
}

SideMenu.propTypes = {
  currentUserId: PropTypes.string,
  fetchWatching: PropTypes.func,
  loggedIn: PropTypes.bool,
  watching: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.string,
      id: PropTypes.string,
      name: PropTypes.string,
    })
  ),
};

SideMenu.defaultProps = {
  currentUserId: 'ffc6d3db-3e8a-4d18-a18a-d3d8e9d62111',
  fetchWatching: () => {},
  loggedIn: true,
  watching: tagData.slice(3, 10),
};
