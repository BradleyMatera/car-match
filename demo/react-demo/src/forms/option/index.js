/* eslint-disable react/state-in-constructor */
import React from 'react';
import PropTypes from 'prop-types';
import RRPropTypes from 'react-router-prop-types';
import styles from '../styles.module.css';
import Link from '../../link';
import OptionContainer from '../../containers/option';

class OptionForm extends React.Component {
  state = {
    value: undefined,
  }

  componentDidMount() {
    const { fetchOption, option: { id } } = this.props;
    if (id) fetchOption(id);
  }

handleInputChange = (event) => {
  // pull the name of the input and value of input out of the event object
  const { target: { name, value } } = event;
  // update the state to a key of the name of the input and value of the value of the input
  // ex: type: 'private'
  this.setState({
    [name]: value,
  });
}

save = async (event) => {
  // don't actually submit the form through the browser
  event.preventDefault();
  const {
    option: { id }, saveOption, history, location,
  } = this.props;

  const { value } = this.state;
  // get the query params from the url
  const queryParams = new URLSearchParams(location.search);
  // get the decisionId from query params
  const decisionId = queryParams.get('decisionId');
  await saveOption({ id, decisionId, value });
  history.push(`/admin/decisions/${decisionId}`);
}

delete = async () => {
  const { deleteOption, option: { id } } = this.props;
  await deleteOption(id);
}

render() {
  const {
    option: {
      id,
      // rename value prop to "defaultTitle"
      value: defaultValue = '',
    },
    location,
  } = this.props;

  // get the query params from the url
  const queryParams = new URLSearchParams(location.search);
  // get the decisionId from query params
  const decisionId = queryParams.get('decisionId');
  const {
    value = defaultValue,
  } = this.state;

  return (
    <>
      <h1 className={styles.heading}>
        {id && (
        <>
          <span>Edit Option</span>
          <span onClick={this.delete} role="presentation">
            <Link url={`/admin/decisions/${decisionId}`} title="Delete" icon="fa-trash" className="linkSecondary" />
          </span>
        </>
        )}

        {!id && (
        <span>New Option</span>
        )}
      </h1>
      <form method="POST" className={styles.form} onSubmit={this.save}>
        <label className={styles.form__label} htmlFor="value">
          <span>value</span>
          <input
            type="text"
            name="value"
            value={value}
            id="value"
            className={styles.form__input}
            onChange={this.handleInputChange}
          />
        </label>
        <button type="submit" className={styles.button}>Save</button>
      </form>
    </>
  );
}
}

OptionForm.propTypes = {
  option: PropTypes.shape({
    id: PropTypes.string,
    value: PropTypes.string,
  }),
  saveOption: PropTypes.func.isRequired,
  fetchOption: PropTypes.func.isRequired,
  deleteOption: PropTypes.func.isRequired,
  history: RRPropTypes.history.isRequired,
  location: RRPropTypes.location.isRequired,
  // match: RRPropTypes.match.isRequired,
};

OptionForm.defaultProps = {
  option: {},
};

export default OptionContainer(OptionForm);
