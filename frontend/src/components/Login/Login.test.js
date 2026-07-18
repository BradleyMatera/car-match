import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from './index';

// Mock AuthContext so Login has a login function available.
jest.mock('../../context/AuthContext', () => {
  const React = require('react');
  const ctx = React.createContext(null);
  return {
    __esModule: true,
    default: ctx,
  };
});

const mockAuthValue = {
  currentUser: null,
  token: null,
  login: jest.fn().mockResolvedValue({ id: '1', username: 'tester' }),
  logout: jest.fn(),
  updateCurrentUser: jest.fn(),
  loadingAuth: false,
};

const renderLogin = () => {
  const ctx = require('../../context/AuthContext').default;
  return render(
    <ctx.Provider value={mockAuthValue}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </ctx.Provider>
  );
};

describe('Login component', () => {
  test('renders login form with username and password inputs', () => {
    renderLogin();
    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  test('shows submit button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('shows error when submitting empty fields', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(screen.getByText(/username and password are required/i)).toBeInTheDocument());
  });

  test('password visibility toggle works', async () => {
    renderLogin();
    const passwordInput = screen.getByLabelText(/^password$/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
    const toggle = screen.getByRole('button', { name: /show password/i });
    await userEvent.click(toggle);
    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('renders "Remember me" checkbox', () => {
    renderLogin();
    expect(screen.getByText(/remember me/i)).toBeInTheDocument();
  });

  test('renders link to signup', () => {
    renderLogin();
    expect(screen.getByText(/create one/i)).toBeInTheDocument();
  });
});
