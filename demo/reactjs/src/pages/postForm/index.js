import 'easymde/dist/easymde.min.css';
import styles from './postForm.module.css';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Input } from 'bloomer/lib/elements/Form/Input';
import SimpleMDE from 'react-simplemde-editor';
import ReactTags from 'react-tag-autocomplete';

import postData from '../../exampleData/posts.json';
import tagData from '../../exampleData/tags.json';

class CreatePost extends Component {
  constructor(props) {
    super(props);
    const {
      fetchPost,
      match: {
        params: { postId },
      },
    } = this.props;
    if (postId) {
      fetchPost(postId);
    }
    this.state = {};
  }

  handleMarkdownChange = (value) => {
    this.setState({
      content: value,
    });
  };

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

  handleDelete = (i) => {
    const { tags } = this.state;
    const newTags = [...tags];
    newTags.splice(i, 1);
    this.setState({ tags: newTags });
  };

  handleAddition = (tag) => {
    const {
      post: { tags: defaultTags = [] },
    } = this.props;
    const { tags = defaultTags } = this.state;
    const newTags = [...tags, tag];
    this.setState({ tags: newTags });
  };

  onSubmit = () => {
    const { content, tags, title } = this.state;
    const {
      history,
      post: { id },
      savePost,
    } = this.props;
    savePost({ content, id, tags, title });
    history.push('/posts');
  };

  render() {
    const {
      post: {
        title: defaultTitle = '',
        content: defaultContent = '',
        tags: defaultTags = [],
      },
      match: {
        params: { postId },
      },
      suggestions,
    } = this.props;
    const {
      title = defaultTitle,
      content = defaultContent,
      tags = defaultTags,
    } = this.state;
    return (
      <div className={styles.createPost}>
        <h1 className={styles.heading}>
          {postId ? 'Edit Post' : 'Create a New Post'}
        </h1>
        <Input
          className={styles.input}
          name="title"
          value={title}
          onChange={this.handleInputChange}
          placeholder="Title"
        />
        <SimpleMDE
          value={content}
          onChange={this.handleMarkdownChange}
          options={{
            autofocus: true,
            previewClass: [styles.preview, 'editor-preview'],
            spellChecker: true,
          }}
        />
        <ReactTags
          tags={tags}
          suggestions={suggestions}
          handleDelete={this.handleDelete}
          handleAddition={this.handleAddition}
          allowNew
          classNames={{
            root: styles.tags,
            rootFocused: styles.isFocused,
            search: styles.tagsSearch,
            searchInput: styles.tagsSearchInput,
            selected: styles.tagsSelected,
            selectedTag: styles.tagsSelectedTag,
            selectedTagName: styles.tagsSelectedTagName,
            suggestionActive: styles.isActive,
            suggestionDisabled: styles.isDisabled,
            suggestions: styles.tagsSuggestions,
          }}
        />
        <button type="button" onClick={this.onSubmit} className={styles.button}>
          Save Post
        </button>
      </div>
    );
  }
}

CreatePost.propTypes = {
  fetchPost: PropTypes.func,
  post: PropTypes.shape({
    content: PropTypes.string,
    id: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.object),
    title: PropTypes.string,
  }),
  savePost: PropTypes.func,
  suggestions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
    })
  ),
};

CreatePost.defaultProps = {
  fetchPost: () => {},
  post: postData[0],
  savePost: () => {},
  suggestions: tagData,
};

export default CreatePost;
