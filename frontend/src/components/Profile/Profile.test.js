import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Profile from './index';

// Mock AuthContext.
jest.mock('../../context/AuthContext', () => {
  const React = require('react');
  const ctx = React.createContext(null);
  return {
    __esModule: true,
    default: ctx,
  };
});

const mockUser = {
  id: '1',
  username: 'tester',
  name: 'Test User',
  displayTag: 'TestUser',
  email: 'test@example.com',
  gender: 'male',
  bio: 'Car enthusiast',
  premiumStatus: false,
  role: 'user',
  location: { city: 'Chicago', state: 'IL' },
  carInterests: ['Muscle Cars'],
  cars: [],
  preferences: { notifications: {}, privacy: {}, display: {}, connections: {} },
};

const mockAuthValue = {
  currentUser: mockUser,
  token: 'fake-token',
  login: jest.fn(),
  logout: jest.fn(),
  updateCurrentUser: jest.fn().mockResolvedValue(mockUser),
  loadingAuth: false,
};

// Mock the api client — factory must not reference outer variables that aren't
// initialized at hoist time, so we use plain static return values.
jest.mock('../../api/client', () => ({
  __esModule: true,
  default: {
    getUserEvents: jest.fn().mockResolvedValue([]),
    getMyRsvps: jest.fn().mockResolvedValue([]),
    fetchMessages: jest.fn().mockResolvedValue([]),
    updateUser: jest.fn().mockResolvedValue({ user: { id: '1', username: 'tester' } }),
    deleteUser: jest.fn().mockResolvedValue({}),
  },
}));

const renderProfile = () => {
  const ctx = require('../../context/AuthContext').default;
  return render(
    <ctx.Provider value={mockAuthValue}>
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    </ctx.Provider>
  );
};

describe('Profile component', () => {
  test('renders profile page with tabs', async () => {
    renderProfile();
    await waitFor(() => expect(screen.getByRole('button', { name: /profile/i })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /garage/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /events/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /messages/i })).toBeInTheDocument();
  });

  test('default tab shows profile info with user name', async () => {
    renderProfile();
    await waitFor(() => expect(screen.getByText(/test user/i)).toBeInTheDocument());
  });

  test('clicking Garage tab shows garage section', async () => {
    renderProfile();
    await waitFor(() => expect(screen.getByRole('button', { name: /garage/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /^garage$/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /my garage/i })).toBeInTheDocument());
  });

  test('garage section shows empty state when no vehicles', async () => {
    renderProfile();
    await waitFor(() => expect(screen.getByRole('button', { name: /garage/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /^garage$/i }));
    await waitFor(() => expect(screen.getByText(/no vehicles in your garage/i)).toBeInTheDocument());
  });

  test('clicking Settings tab shows settings section', async () => {
    renderProfile();
    await waitFor(() => expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /^settings$/i }));
    await waitFor(() => expect(screen.getByText(/edit settings/i)).toBeInTheDocument());
  });

  test('settings tab shows preferences section', async () => {
    renderProfile();
    await waitFor(() => expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /^settings$/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /preferences/i })).toBeInTheDocument());
  });
});
