import styles from './home.module.css';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Icon, Tab, TabLink, TabList, Tabs } from 'bloomer';

import PostList from '../../components/postList';
import examplePosts from '../../exampleData/posts.json';

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: '',
    };
  }

  componentDidMount() {
    const { fetchPosts, loggedIn } = this.props;
    if (loggedIn) {
      this.setState({ activeTab: 'watching' });
      fetchPosts({ type: 'watching' });
    } else {
      this.setState({ activeTab: 'popular' });
      fetchPosts({ type: 'popular' });
    }
  }

  render() {
    const { activeTab } = this.state;
    const { allPosts, fetchPosts, loggedIn } = this.props;
    const activateTab = (tab) => () => {
      this.setState({ activeTab: tab });
      fetchPosts({ type: tab });
    };
    const posts = allPosts[activeTab];
    return (
      <>
        <h1 className={styles.heading}>Top Posts</h1>
        <Tabs className={styles.tabs}>
          <TabList>
            {loggedIn && (
              <Tab isActive={activeTab === 'watching'}>
                <TabLink onClick={activateTab('watching')}>
                  <Icon isSize="small" className="fa fa-eye" />
                  <span>Watching</span>
                </TabLink>
              </Tab>
            )}
            <Tab isActive={activeTab === 'popular'}>
              <TabLink onClick={activateTab('popular')}>
                <Icon isSize="small" className="fa fa-fire" />
                <span>Popular</span>
              </TabLink>
            </Tab>
            <Tab isActive={activeTab === 'new'}>
              <TabLink onClick={activateTab('new')}>
                <Icon isSize="small" className="fa fa-certificate" />
                <span>New</span>
              </TabLink>
            </Tab>
            <Tab isActive={activeTab === 'top'}>
              <TabLink onClick={activateTab('top')}>
                <Icon isSize="small" className="fas fa-sort-amount-up" />
                <span>Top</span>
              </TabLink>
            </Tab>
          </TabList>
        </Tabs>
        <PostList posts={posts} />
      </>
    );
  }
}

Home.propTypes = {
  allPosts: PropTypes.shape({
    new: PropTypes.arrayOf(PropTypes.object),
    popular: PropTypes.arrayOf(PropTypes.object),
    top: PropTypes.arrayOf(PropTypes.object),
    watching: PropTypes.arrayOf(PropTypes.object),
  }),
  fetchPosts: PropTypes.func,
  loggedIn: PropTypes.bool,
};

Home.defaultProps = {
  allPosts: {
    new: examplePosts.slice(3, 4),
    popular: examplePosts.slice(1, 2),
    top: examplePosts.slice(2, 3),
    watching: examplePosts.slice(0, 2),
  },
  fetchPosts: () => {},
  loggedIn: true,
};

export default Home;
