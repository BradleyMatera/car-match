import styles from './tags.module.css';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Icon } from 'bloomer';
import moment from 'moment';
import { Link } from 'react-router-dom';

import tagData from '../../exampleData/tags.json';

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
    const { tags } = this.props;
    const { searchFilter } = this.state;

    const filteredTags = tags.filter((tag) => {
      if (!searchFilter) return true;
      const search = searchFilter.toLowerCase();
      return tag.name.toLowerCase().indexOf(search) !== -1;
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
            placeholder="filter tags"
          />
        </div>
        <div className={styles.tags}>
          {filteredTags.map((tag) => (
            <div className={styles.tag} key={tag.id}>
              <Icon isSize="large" className={`fa ${tag.icon}`} />
              <span className={styles.data}>
                <Link to={`/tags/${tag.id}`} className={styles.tagTitle}>
                  {tag.name}
                </Link>
                <span className={styles.meta}>{`${tag.count} Posts`}</span>
                <span className={styles.meta}>
                  {`Last post was ${moment(tag.lastPostAt).fromNow()}`}
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
  tags: PropTypes.arrayOf(
    PropTypes.shape({
      count: PropTypes.number,
      icon: PropTypes.string,
      name: PropTypes.string,
    })
  ),
};

Users.defaultProps = {
  tags: tagData,
};
export default Users;
