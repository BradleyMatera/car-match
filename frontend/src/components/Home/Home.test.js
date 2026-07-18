import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './index';

// Mock the api client with bare jest.fn() — implementations set in beforeEach.
jest.mock('../../api/client', () => ({
  __esModule: true,
  default: {
    getSiteStats: jest.fn(),
    getForumStats: jest.fn(),
    getForumCategories: jest.fn(),
    getThreadsByCategory: jest.fn(),
    getEvents: jest.fn(),
    getListings: jest.fn(),
    getBusinesses: jest.fn(),
  },
}));

const api = require('../../api/client').default;

const renderHome = () => render(<MemoryRouter><Home /></MemoryRouter>);

describe('Home component', () => {
  beforeEach(() => {
    api.getSiteStats.mockResolvedValue({ users: 120, threads: 30, posts: 200, events: 5 });
    api.getForumStats.mockResolvedValue([]);
    api.getForumCategories.mockResolvedValue([
      { id: 'cat1', name: 'General Discussion', description: 'Talk cars' },
    ]);
    api.getThreadsByCategory.mockResolvedValue([
      { id: 't1', title: 'First thread', lastPostAt: new Date().toISOString(), replies: 2, categoryName: 'General Discussion' },
    ]);
    api.getEvents.mockResolvedValue([
      { id: 'e1', title: 'Car Meet', date: new Date(Date.now() + 86400000).toISOString(), location: 'Chicago' },
    ]);
    api.getListings.mockResolvedValue([]);
    api.getBusinesses.mockResolvedValue([]);
  });

  test('renders hero section with "Discover Your Next Drive"', () => {
    renderHome();
    expect(screen.getByRole('heading', { name: /discover your next drive/i })).toBeInTheDocument();
  });

  test('renders community stats section', async () => {
    renderHome();
    await waitFor(() => expect(screen.getByText('Community Pulse')).toBeInTheDocument());
  });

  test('renders upcoming events section', async () => {
    renderHome();
    await waitFor(() => expect(screen.getByText('Upcoming Events')).toBeInTheDocument());
  });

  test('renders trending discussions section', async () => {
    renderHome();
    await waitFor(() => expect(screen.getByText('Trending Discussions')).toBeInTheDocument());
  });

  test('shows loading skeletons while data loads', () => {
    api.getSiteStats.mockImplementationOnce(() => new Promise(() => {}));
    renderHome();
    expect(screen.getByText('Community Pulse')).toBeInTheDocument();
  });
});
