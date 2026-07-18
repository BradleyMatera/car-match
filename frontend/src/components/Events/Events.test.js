import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Events from './index';

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

// Mock the api client.
jest.mock('../../api/client', () => ({
  __esModule: true,
  default: {
    getEvents: jest.fn().mockResolvedValue([
      { id: 'e1', title: 'Summer Car Meet', date: '2025-07-15', location: 'Chicago, IL', rsvpCount: 12, image: '' },
      { id: 'e2', title: 'Track Day', date: '2025-08-20', location: 'Road America, WI', rsvpCount: 5, image: '' },
    ]),
    getMyRsvps: jest.fn().mockResolvedValue([]),
    getEvent: jest.fn().mockResolvedValue(null),
  },
}));

const renderEvents = () => {
  const ctx = require('../../context/AuthContext').default;
  return render(
    <ctx.Provider value={mockAuthValue}>
      <MemoryRouter>
        <Events />
      </MemoryRouter>
    </ctx.Provider>
  );
};

describe('Events component', () => {
  test('renders events page header', () => {
    renderEvents();
    expect(screen.getByRole('heading', { name: /car community events/i })).toBeInTheDocument();
  });

  test('renders calendar view', () => {
    renderEvents();
    expect(document.querySelector('.react-calendar')).toBeInTheDocument();
  });

  test('renders search/filter input', () => {
    renderEvents();
    expect(screen.getByPlaceholderText(/search events by title/i)).toBeInTheDocument();
  });

  test('renders date filter select', () => {
    renderEvents();
    expect(screen.getByLabelText(/filter events by date range/i)).toBeInTheDocument();
  });

  test('typing in search updates the input value', async () => {
    renderEvents();
    const searchInput = screen.getByPlaceholderText(/search events by title/i);
    await userEvent.type(searchInput, 'Summer');
    expect(searchInput).toHaveValue('Summer');
  });

  test('renders New Event button', () => {
    renderEvents();
    expect(screen.getByRole('button', { name: /new event/i })).toBeInTheDocument();
  });
});
