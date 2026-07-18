import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Marketplace from './index';

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
    getListings: jest.fn(),
  },
}));

const api = require('../../api/client').default;

const renderMarketplace = () => {
  const ctx = require('../../context/AuthContext').default;
  return render(
    <ctx.Provider value={mockAuthValue}>
      <MemoryRouter>
        <Marketplace />
      </MemoryRouter>
    </ctx.Provider>
  );
};

describe('Marketplace component', () => {
  beforeEach(() => {
    api.getListings.mockResolvedValue([
      { id: 'l1', title: 'BBS Wheels', price: 1200, category: 'parts', condition: 'used', location: { city: 'Chicago', state: 'IL' } },
      { id: 'l2', title: 'Honda Civic', price: 15000, category: 'vehicles', condition: 'new', location: { city: 'Madison', state: 'WI' } },
    ]);
  });

  test('renders marketplace heading', () => {
    renderMarketplace();
    expect(screen.getByRole('heading', { name: /marketplace/i })).toBeInTheDocument();
  });

  test('renders filter form with search and selects', () => {
    renderMarketplace();
    expect(screen.getByPlaceholderText(/search listings/i)).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Any Condition')).toBeInTheDocument();
  });

  test('renders listing cards with title and price', async () => {
    renderMarketplace();
    await waitFor(() => expect(screen.getByText('BBS Wheels')).toBeInTheDocument());
    expect(screen.getByText('Honda Civic')).toBeInTheDocument();
    expect(screen.getByText('$1,200')).toBeInTheDocument();
    expect(screen.getByText('$15,000')).toBeInTheDocument();
  });

  test('listing cards show condition', async () => {
    renderMarketplace();
    await waitFor(() => expect(screen.getByText('BBS Wheels')).toBeInTheDocument());
    expect(screen.getByText('used')).toBeInTheDocument();
    expect(screen.getByText('new')).toBeInTheDocument();
  });

  test('typing in search updates value', async () => {
    renderMarketplace();
    const searchInput = screen.getByPlaceholderText(/search listings/i);
    await userEvent.type(searchInput, 'wheels');
    expect(searchInput).toHaveValue('wheels');
  });
});
