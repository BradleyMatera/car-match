import styles from './postSlugline.module.css';

import React from 'react';
import PropTypes from 'prop-types';

import moment from 'moment';

export default function PostSlugline({ post }) {
  return (
    <h2 className={styles.subTitle}>
      {' Posted By: '}
      {post.user.username}
      {' on '}
      {moment(post.createdAt).format('MMMM Do YYYY, h:mm a')}
    </h2>
  );
}

PostSlugline.propTypes = {
  post: PropTypes.shape({
    createdAt: PropTypes.string,
    user: PropTypes.shape({
      username: PropTypes.string,
    }),
  }),
};

PostSlugline.defaultProps = {
  post: {},
};
