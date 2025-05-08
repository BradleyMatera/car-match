import styles from './profile.module.css';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Image, Tag } from 'bloomer';
import { Link } from 'react-router-dom';

import PostList from '../../components/postList';
import postData from '../../exampleData/posts.json';
import userData from '../../exampleData/users';

class Profile extends Component {
  componentDidMount() {
    const {
      fetchUser,
      match: {
        params: { userId },
      },
    } = this.props;
    fetchUser(userId);
  }

  render() {
    const { posts, user } = this.props;
    return (
      <>
        <div className={styles.profile}>
          <Image isSize="64x64" src={user.avatar} className={styles.avatar} />
          <h1 className={styles.heading}>{user.username}</h1>
          <p className={styles.subTitle}>
            {' '}
            {user.city}
            {', '}
            {user.state}
          </p>
          <p className={styles.tags}>
            Watched Tags:
            <br />
            {user.tags.map((tag) => (
              <Link key={tag.id} to={`/tags/${tag.id}`}>
                <Tag>{`#${tag.name}`}</Tag>
              </Link>
            ))}
          </p>
          <h2 className={styles.title}>
            {user.username}
            &apos;s Posts
          </h2>
        </div>
        <PostList posts={posts} />
      </>
    );
  }
}

Profile.propTypes = {
  fetchUser: PropTypes.func,
  posts: PropTypes.arrayOf(PropTypes.object),
  user: PropTypes.shape({
    avatar: PropTypes.string,
    city: PropTypes.string,
    state: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.object),
    username: PropTypes.string,
  }),
};

Profile.defaultProps = {
  fetchUser: () => {},
  posts: postData.filter((post) => post.user.username === 'eMediaLab'),
  user: { ...userData[2], username: 'eMediaLab' },
};

export default Profile;
