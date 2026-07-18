import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import BusinessDirectory from './index';

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
    getBusinesses: jest.fn(),
    getReviews: jest.fn(),
    getBusiness: jest.fn(),
  },
}));

const api = require('../../api/client').default;

const renderBD = () => {
  const ctx = require('../../context/AuthContext').default;
  return render(
    <ctx.Provider value={mockAuthValue}>
      <MemoryRouter>
        <BusinessDirectory />
      </MemoryRouter>
    </ctx.Provider>
  );
};

describe('BusinessDirectory component', () => {
  beforeEach(() => {
    api.getBusinesses.mockResolvedValue([
      { id: 'b1', businessName: 'Speed Shop', category: 'repair-shop', rating: 4.5, reviewCount: 10, city: 'Chicago', state: 'IL', description: 'Best repairs' },
      { id: 'b2', businessName: 'Parts Plus', category: 'parts-store', rating: 3, reviewCount: 2, city: 'Madison', state: 'WI', description: 'Parts galore' },
    ]);
    api.getReviews.mockResolvedValue([]);
    api.getBusiness.mockResolvedValue({});
  });

  test('renders business directory heading', () => {
    renderBD();
    expect(screen.getByRole('heading', { name: /automotive business directory/i })).toBeInTheDocument();
  });

  test('renders search/filter form', () => {
    renderBD();
    expect(screen.getByPlaceholderText(/search by name/i)).toBeInTheDocument();
    expect(screen.getByText('All Categories')).toBeInTheDocument();
  });

  test('renders business cards with name and category', async () => {
    renderBD();
    await waitFor(() => expect(screen.getByText('Speed Shop')).toBeInTheDocument());
    expect(screen.getByText('Parts Plus')).toBeInTheDocument();
  });

  test('business cards show rating stars', async () => {
    renderBD();
    await waitFor(() => expect(screen.getByText('Speed Shop')).toBeInTheDocument());
    expect(screen.getByText(/\(10\)/)).toBeInTheDocument();
  });

  test('typing in search updates value', async () => {
    renderBD();
    const searchInput = screen.getByPlaceholderText(/search by name/i);
    await userEvent.type(searchInput, 'Speed');
    expect(searchInput).toHaveValue('Speed');
  });
});
