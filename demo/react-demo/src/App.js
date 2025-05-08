/* eslint-disable react/self-closing-comp */
/* eslint-disable react/prefer-stateless-function */
/* Notes on Differences from Demo...
    React Router v6 requires these changes...
    "Routes" replaces use of "Switch"
    Must wrap "Route" items with "Routes" component now
    "element" is used now instead of "component"
    Use "React.Fragment" inside of Routes instead of dom elements like "main"
    "exact" no longer needed. It's a default now
    Re-enabled long slack URI. Disabled before so I could see element render
*/
import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import styles from './app.module.css';
import Header from './header';
import Login from './Login';
import DecisionList from './decision/list';
import Landing from './decision/landing';
import DecisionDetail from './decision/detail';
import DecisionForm from './forms/decision';

class App extends Component {
  render() {
    return (
      <Router>
        <div className={styles.body}>
          <div className={styles.main_container}>
            <> {/* Removed style tags from fragment. A fragment isn't rendered! */}
              <Routes>
                <Route path="/" element={<Header />} />
                <Route path="/" element={<Landing />} />
                <Route path="(/login/slack/callback)" element={<Login />} />
                <Route path="(/login)" element={<Login />} />
                <Route path="/admin/decisions" element={<DecisionList />} />
                <Route path="/admin/decisions/new" element={<DecisionForm />} />
                <Route path="/admin/decisions/edit/:id" element={<DecisionForm />} />
                <Route path="/admin/decisions/:id" element={<DecisionDetail />} />
              </Routes>
            </>
          </div>
        </div>
      </Router>
    );
  }
}

export default App;
