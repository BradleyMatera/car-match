/* eslint-disable react/jsx-fragments */
import React from 'react';
import PropTypes from 'prop-types';
import styles from '../styles.module.css';
import Link from '../../link';
import DecisionsContainer from '../../containers/decisions';

class Landing extends React.Component {
  componentDidMount() {
    const { fetchPublicDecisions } = this.props;
    fetchPublicDecisions();
  }

  render() {
    const { publicDecisions } = this.props;
    return (
      <React.Fragment>
        <h1 className={styles.heading}>My Decisions</h1>
        <ul className={styles.list}>
          {publicDecisions.map((decision) => (
            <li className={styles.list__item} key={decision.id}>
              <span className={styles.list__item__title}>{decision.title}</span>
              <Link url={`/decisions/${decision.id}`} />
              <Link url={`/admin/decisions/${decision.id}`} title="Edit" icon="fa-edit" className="linkSecondary" />
            </li>
          ))}
        </ul>
      </React.Fragment>
    );
  }
}

Landing.propTypes = {
  publicDecisions: PropTypes.arrayOf(PropTypes.object),
  fetchPublicDecisions: PropTypes.func.isRequired,
};

Landing.defaultProps = {
  publicDecisions: [],
};

export default DecisionsContainer(Landing);
