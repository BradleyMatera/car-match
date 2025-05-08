import styles from './postAdmin.module.css';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Button } from 'bloomer/lib/elements/Button';
import { Link } from 'react-router-dom';

import postData from '../../exampleData/posts.json';

class Profile extends Component {
  componentDidMount() {
    const { fetchUserPosts } = this.props;
    fetchUserPosts();
  }

  onDeleteClick = (postId) => () => {
    const { deletePost } = this.props;
    deletePost(postId);
  };

  render() {
    const { posts } = this.props;
    return (
      <>
        <h1 className={styles.heading}>Your Posts</h1>
        <ul className={styles.posts}>
          {posts.map((post) => (
            <li key={post.id} className={styles.post}>
              <Link to={`/posts/${post.id}`} className={styles.title}>
                {post.title}
              </Link>
              <Link to={`/posts/edit/${post.id}`} className={styles.button}>
                Edit
              </Link>
              <Button
                onClick={this.onDeleteClick(post.id)}
                className={styles.buttonDelete}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      </>
    );
  }
}

Profile.propTypes = {
  deletePost: PropTypes.func,
  fetchUserPosts: PropTypes.func,
  posts: PropTypes.arrayOf(PropTypes.object),
};

Profile.defaultProps = {
  deletePost: () => {},
  fetchUserPosts: () => {},
  posts: postData.filter((post) => post.user.username === 'eMediaLab'),
};

export default Profile;
