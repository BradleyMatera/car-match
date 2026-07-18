import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Forums from './index';

// Mock AuthContext.
jest.mock('../../context/AuthContext', () => {
  const React = require('react');
  const ctx = React.createContext(null);
  return {
    __esModule: true,
    default: ctx,
  };
});

const mockAuthValue = {
  currentUser: { id: '1', username: 'tester', name: 'Tester', role: 'user' },
  token: 'fake-token',
  login: jest.fn(),
  logout: jest.fn(),
  updateCurrentUser: jest.fn(),
  loadingAuth: false,
};

// Mock the api client with bare jest.fn() — implementations set in beforeEach.
jest.mock('../../api/client', () => ({
  __esModule: true,
  default: {
    getForumCategories: jest.fn(),
    getForumStats: jest.fn(),
    getThreadsByCategory: jest.fn(),
    getThreadById: jest.fn(),
    createThread: jest.fn(),
  },
}));

const api = require('../../api/client').default;

const renderForums = () => {
  const ctx = require('../../context/AuthContext').default;
  return render(
    <ctx.Provider value={mockAuthValue}>
      <MemoryRouter>
        <Forums />
      </MemoryRouter>
    </ctx.Provider>
  );
};

describe('Forums component', () => {
  beforeEach(() => {
    api.getForumCategories.mockResolvedValue([
      { id: 'cat1', name: 'General Discussion', description: 'Talk about anything car-related' },
      { id: 'cat2', name: 'Builds', description: 'Show off your build' },
    ]);
    api.getForumStats.mockResolvedValue([
      { id: 'cat1', name: 'General Discussion', threads: 10, posts: 50 },
      { id: 'cat2', name: 'Builds', threads: 5, posts: 20 },
    ]);
    api.getThreadsByCategory.mockResolvedValue([
      { id: 't1', title: 'Welcome thread', replies: 3, lastPostAt: new Date().toISOString() },
    ]);
    api.getThreadById.mockResolvedValue({ thread: {}, posts: [] });
    api.createThread.mockResolvedValue({ id: 't2', title: 'New thread' });
  });

  test('renders forum categories', async () => {
    renderForums();
    await waitFor(() => expect(screen.getAllByText('General Discussion').length).toBeGreaterThan(0));
    expect(screen.getAllByText('Builds').length).toBeGreaterThan(0);
  });

  test('renders forum title heading', async () => {
    renderForums();
    await waitFor(() => expect(screen.getByRole('heading', { name: /carmatch forums/i })).toBeInTheDocument());
  });

  test('thread search input is present', async () => {
    renderForums();
    await waitFor(() => expect(screen.getByPlaceholderText('Search')).toBeInTheDocument());
  });

  test('typing in search updates value', async () => {
    renderForums();
    await waitFor(() => expect(screen.getByPlaceholderText('Search')).toBeInTheDocument());
    const searchInput = screen.getByPlaceholderText('Search');
    await userEvent.type(searchInput, 'engine');
    expect(searchInput).toHaveValue('engine');
  });

  test('clicking a category loads thread list', async () => {
    renderForums();
    await waitFor(() => expect(screen.getAllByText('General Discussion').length).toBeGreaterThan(0));
    // Click the sidebar button for the category
    await userEvent.click(screen.getByRole('button', { name: 'General Discussion' }));
    await waitFor(() => expect(screen.getByText('Welcome thread')).toBeInTheDocument());
  });

  test('New Thread button appears after selecting a category', async () => {
    renderForums();
    await waitFor(() => expect(screen.getAllByText('General Discussion').length).toBeGreaterThan(0));
    await userEvent.click(screen.getByRole('button', { name: 'General Discussion' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /new thread/i })).toBeInTheDocument());
  });
});
