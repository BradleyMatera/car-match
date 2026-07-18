import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock the api client so AuthProvider hydration doesn't hit the network.
jest.mock('./api/client', () => ({
  __esModule: true,
  default: {
    getCurrentUser: jest.fn().mockRejectedValue(new Error('Not authenticated')),
    getEvents: jest.fn().mockResolvedValue([]),
    getSiteStats: jest.fn().mockResolvedValue({ users: 0, threads: 0, posts: 0, events: 0 }),
    getForumStats: jest.fn().mockResolvedValue([]),
    getForumCategories: jest.fn().mockResolvedValue([]),
    getThreadsByCategory: jest.fn().mockResolvedValue([]),
    getMyRsvps: jest.fn().mockResolvedValue([]),
    getUserEvents: jest.fn().mockResolvedValue([]),
    fetchMessages: jest.fn().mockResolvedValue([]),
    getBusinesses: jest.fn().mockResolvedValue([]),
    getListings: jest.fn().mockResolvedValue([]),
    decodeVin: jest.fn().mockResolvedValue({ decoded: {} }),
  },
}));

// Mock analytics so trackPageView is a no-op.
jest.mock('./utils/analytics', () => ({
  trackPageView: jest.fn(),
}));

// Mutable auth value so individual tests can control auth state.
let mockAuthValue = {
  currentUser: null,
  token: null,
  login: jest.fn(),
  logout: jest.fn(),
  updateCurrentUser: jest.fn(),
  loadingAuth: false,
};

jest.mock('./context/AuthContext', () => {
  const React = require('react');
  const ctx = React.createContext(null);
  return {
    __esModule: true,
    default: ctx,
    AuthProvider: ({ children }) => React.createElement(ctx.Provider, { value: mockAuthValue }, children),
  };
});

// Import App AFTER mocks are set up.
const App = require('./App').default;

describe('App routing', () => {
  afterEach(() => {
    mockAuthValue = {
      currentUser: null,
      token: null,
      login: jest.fn(),
      logout: jest.fn(),
      updateCurrentUser: jest.fn(),
      loadingAuth: false,
    };
  });

  test('renders login page when not authenticated', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('renders signup page at /signup when not authenticated', async () => {
    window.location.hash = '#/signup';
    render(<App />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument());
    window.location.hash = '';
  });

  test('shows nav links when authenticated', async () => {
    mockAuthValue = {
      ...mockAuthValue,
      currentUser: { id: '1', username: 'tester', name: 'Tester', role: 'user' },
      token: 'fake-token',
    };
    render(<App />);
    await waitFor(() => expect(screen.getByText('Discover')).toBeInTheDocument());
    expect(screen.getAllByText('Events').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Forums').length).toBeGreaterThan(0);
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});
