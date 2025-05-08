import styles from './postList.module.css';

import React from 'react';
import PropTypes from 'prop-types';

import { Link } from 'react-router-dom';

import PostDetails from '../postDetails';
import PostSlugline from '../postSlugline';

export default function PostList({ posts }) {
  return (
    <div className={styles.list}>
      {posts.map((post) => (
        <div className={styles.post} key={post.id}>
          <Link to={`/posts/${post.id}`} key={post.id}>
            <h1 className={styles.title}>{post.title}</h1>
            <PostSlugline post={post} />
          </Link>
          <PostDetails post={post} />
        </div>
      ))}
    </div>
  );
}

PostList.propTypes = {
  posts: PropTypes.arrayOf(
    PropTypes.shape({
      commentCount: PropTypes.number,
      createdAt: PropTypes.string,
      id: PropTypes.string,
      tags: PropTypes.arrayOf(PropTypes.object),
      title: PropTypes.string,
      user: PropTypes.shape({
        username: PropTypes.string,
      }),
      votes: PropTypes.arrayOf(
        PropTypes.shape({
          userId: PropTypes.string,
          vote: PropTypes.number,
        })
      ),
    })
  ),
};

PostList.defaultProps = {
  posts: [],
};
