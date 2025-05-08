import React from 'react';
import PropTypes from 'prop-types';
// Removing for compatibility.
// import RRPropTypes from 'react-router-prop-types';
// import { Link as RRLink } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import Link from '../../link';
import styles from '../styles.module.css';
import DecisionContainer from '../../containers/decision';

class DecisionDetail extends React.Component {
  componentDidMount() {
    // get the id from the route params
    // This doesn't work with RR v6...
    // const { fetchDecision, match: { params: { id } } } = this.props;
    // So... we'll pull out the props we need in another way...
    const { fetchDecision, decision: { id } } = this.props;
    fetchDecision(id);
  }

  delete = async () => {
    const { deleteDecision, decision: { id } } = this.props;
    await deleteDecision(id);
  }

  render() {
    const { decision, options } = this.props;
    return (
      <>
        <h1 className={styles.heading}>
          {decision.title}
          <Link url={`/decisions/${decision.id}`} />
          <Link url={`/admin/decisions/edit/${decision.id}`} title="Edit" icon="fa-edit" />

          <span onClick={this.delete} role="presentation">
            <Link url="/admin/decisions" title="Delete" icon="fa-trash" className="linkSecondary" />
          </span>
        </h1>
        <h2 className={styles.headingSecondary}>Options</h2>
        <ul className={styles.list}>
          {options.map((option) => (
            <li className={SVGAnimatedNumberList.list__item} key={option.id}>
              <span className={styles.list__item__title}>{option.value}</span>
              <Link url={`/admin/options/edit/${option.id}?decisionId=${decision.id}`} title="Edit" icon="fa-edit" />
            </li>
          ))}

        </ul>
        <Navigate to={`/admin/options/new?decisionId=${decision.id}`} className={styles.button}>Add a new option</Navigate>
      </>
    );
  }
}

DecisionDetail.propTypes = {
  decision: PropTypes.shape({ title: PropTypes.string, id: PropTypes.string }),
  options: PropTypes.arrayOf(PropTypes.object),
  fetchDecision: PropTypes.func.isRequired,
  deleteDecision: PropTypes.func.isRequired,
  // Removes RRPropTypes - problematic code.
  // match: RRPropTypes.match.isRequired,
};

DecisionDetail.defaultProps = {
  decision: {},
  options: [],
};

export default DecisionContainer(DecisionDetail);
