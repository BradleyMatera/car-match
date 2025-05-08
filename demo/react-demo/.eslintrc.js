/*
When Installing and using ESLint with AIRbnb
Be sure to review the NPM package information.

Package for ESLint with React:
https://www.npmjs.com/package/eslint-config-airbnb

Package for ESLint wihthout React (API backend)
https://www.npmjs.com/package/eslint-config-airbnb-base

Pay attention to what the package recommends for
installation, and configuration - as this may
change over time leading to necessary updates
and adjustments to a codebase.
*/

module.exports = {
  extends: ['airbnb', 'airbnb/hooks', 'react-app'],
  rules: {
    // turning off rules that conflict with Create React App!
    'react/forbid-prop-types': 0,
    'react/jsx-filename-extension': 0,
    'react/jsx-one-expression-per-line': 0,
    'react/react-in-jsx-scope': 0,
  },
};
