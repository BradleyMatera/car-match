import styles from './tag.module.css';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Button } from 'bloomer';

import PostList from '../../components/postList';
import examplePosts from '../../exampleData/posts.json';
import tagData from '../../exampleData/tags.json';
import userData from '../../exampleData/users';

class Tag extends Component {
  componentDidMount() {
    const {
      fetchPosts,
      match: {
        params: { tagId },
      },
    } = this.props;
    fetchPosts({ tag: tagId });
  }

  onWatchClick = () => {
    const {
      addToWatched,
      match: {
        params: { tagId },
      },
    } = this.props;
    addToWatched(tagId);
  };

  onStopWatchClick = () => {
    const {
      match: {
        params: { tagId },
      },
      removeFromWatched,
    } = this.props;
    removeFromWatched(tagId);
  };

  render() {
    const { posts, tag, user } = this.props;
    const alreadyWatching = user.tags.find((t) => t.id === tag.id);
    return (
      <>
        <h1 className={styles.heading}>
          {tag.name}
          {!alreadyWatching && (
            <Button className={styles.button} onClick={this.onWatchClick}>
              Watch Tag
            </Button>
          )}
          {alreadyWatching && (
            <Button
              className={styles.stopButton}
              onClick={this.onStopWatchClick}
            >
              Stop Watching
            </Button>
          )}
        </h1>

        <PostList posts={posts} />
      </>
    );
  }
}

Tag.propTypes = {
  addToWatched: PropTypes.func,
  fetchPosts: PropTypes.func,
  posts: PropTypes.arrayOf(PropTypes.object),
  removeFromWatched: PropTypes.func,
  tag: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  }),
  user: PropTypes.shape({
    tags: PropTypes.arrayOf(PropTypes.object),
  }),
};

Tag.defaultProps = {
  addToWatched: () => {},
  fetchPosts: () => {},
  posts: examplePosts.filter(
    (post) => post.tags.filter((t) => t.id === tagData[3].id).length
  ),
  removeFromWatched: () => {},
  tag: tagData[3],
  user: userData[3],
};

export default Tag;
