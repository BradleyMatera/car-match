import React from 'react';
import PropTypes from 'prop-types';
// † Issue: Dynamic use of RRLink with className
// Needs Revision/Refactor...
import { Link as RRLink } from 'react-router-dom';
import styles from './styles.module.css';

function Link({
  url, title, icon, className,
}) {
  return (
    /* † dynamic Link construction issue using RRLink */
    <RRLink to={url} className={[styles[className], styles.link].join(' ')}>
      <i className={[icon, 'fas'].join(' ')} />
      <span>
        {' '}
        {title}
      </span>
    </RRLink>
  );
}

Link.propTypes = {
  url: PropTypes.string.isRequired,
  title: PropTypes.string,
  icon: PropTypes.string,
  className: PropTypes.string,
};

Link.defaultProps = {
  title: 'View',
  icon: 'fa-eye',
  className: '',
};

export default Link;
