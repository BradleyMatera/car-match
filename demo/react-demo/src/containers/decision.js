/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/state-in-constructor */
import React from 'react';
import API from '../API';

export default function container(Component) {
  return class DecisionContainer extends React.Component {
    // the default state
    state = {
      decision: {},
      options: [],
    }

    fetchDecision = async (id) => {
      // get the details of the decision
      const decision = await API.get(`/decisions/${id}`);
      // get the options for this decision
      const options = await API.get(`/options?decisionId=${id}`);
      this.setState({ decision, options });
    }

    saveDecision = async (decision) => {
      if (decision.id) {
        return API.put(`/decisions/${decision.id}`, decision);
      }
      return API.post('/decisions', decision);
    }

    deleteDecision = async (id) => {
      await API.delete(`/decisions/${id}`);
    }

    render() {
      const { decision, options } = this.state;
      return (
        <Component
          /* pass all other props that are being passed to this component forward */
          {...this.props}
          decision={decision}
          options={options}
          fetchDecision={this.fetchDecision}
          saveDecision={this.saveDecision}
          deleteDecision={this.deleteDecision}
        />
      );
    }
  };
}
