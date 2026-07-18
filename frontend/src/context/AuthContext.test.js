import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider } from './AuthContext';
import AuthContext from './AuthContext';

// Mock the api client.
jest.mock('../api/client', () => ({
  __esModule: true,
  default: {
    getCurrentUser: jest.fn(),
    loginUser: jest.fn(),
  },
}));

const api = require('../api/client').default;

const renderWithProvider = (ui) => {
  return render(<AuthProvider>{ui}</AuthProvider>);
};

const Consumer = ({ onValue }) => {
  const value = React.useContext(AuthContext);
  React.useEffect(() => { onValue(value); }, [value]);
  return <div data-testid="consumer">consumer</div>;
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    api.getCurrentUser.mockResolvedValue({ id: '1', username: 'stored', name: 'Stored User' });
  });

  test('provides currentUser value (null when not authenticated)', async () => {
    let capturedValue = null;
    renderWithProvider(<Consumer onValue={(v) => { capturedValue = v; }} />);
    await waitFor(() => expect(capturedValue).not.toBeNull());
    expect(capturedValue.currentUser).toBeNull();
    expect(capturedValue.loadingAuth).toBe(false);
  });

  test('login function works and sets currentUser', async () => {
    api.loginUser.mockResolvedValue({
      token: 'test-token',
      user: { id: '1', username: 'tester', name: 'Tester' },
    });
    api.getCurrentUser.mockResolvedValue({ id: '1', username: 'tester', name: 'Tester' });

    let capturedValue = null;
    renderWithProvider(<Consumer onValue={(v) => { capturedValue = v; }} />);
    await waitFor(() => expect(capturedValue).not.toBeNull());

    await act(async () => {
      const user = await capturedValue.login('tester', 'password123');
      expect(user).toBeTruthy();
    });

    await waitFor(() => expect(capturedValue.currentUser).toBeTruthy());
    expect(capturedValue.currentUser.username).toBe('tester');
  });

  test('logout function clears currentUser', async () => {
    // Seed localStorage so the provider starts with a user
    localStorage.setItem('authToken', 'stored-token');
    localStorage.setItem('currentUser', JSON.stringify({ id: '1', username: 'stored', name: 'Stored' }));

    let capturedValue = null;
    renderWithProvider(<Consumer onValue={(v) => { capturedValue = v; }} />);

    await waitFor(() => expect(capturedValue.currentUser).toBeTruthy());

    act(() => {
      capturedValue.logout();
    });

    await waitFor(() => expect(capturedValue.currentUser).toBeNull());
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('currentUser')).toBeNull();
  });

  test('token persistence in localStorage after login', async () => {
    api.loginUser.mockResolvedValue({
      token: 'persisted-token',
      user: { id: '2', username: 'persist', name: 'Persist User' },
    });
    api.getCurrentUser.mockResolvedValue({ id: '2', username: 'persist', name: 'Persist User' });

    let capturedValue = null;
    renderWithProvider(<Consumer onValue={(v) => { capturedValue = v; }} />);
    await waitFor(() => expect(capturedValue).not.toBeNull());

    await act(async () => {
      await capturedValue.login('persist', 'password123');
    });

    expect(localStorage.getItem('authToken')).toBe('persisted-token');
    expect(JSON.parse(localStorage.getItem('currentUser')).username).toBe('persist');
  });
});
