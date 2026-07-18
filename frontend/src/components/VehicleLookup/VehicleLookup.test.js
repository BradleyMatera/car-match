import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VehicleLookup from './index';

// Mock the api client.
jest.mock('../../api/client', () => ({
  __esModule: true,
  default: {
    decodeVin: jest.fn().mockResolvedValue({
      decoded: { make: 'Honda', model: 'Civic', year: '2020', modelYear: '2020' },
    }),
    getRecalls: jest.fn().mockResolvedValue({ Count: 0, results: [] }),
    getSafetyRatings: jest.fn().mockResolvedValue({}),
    getComplaints: jest.fn().mockResolvedValue({ complaints: [], count: 0 }),
  },
}));

const renderVL = () => render(<VehicleLookup />);

describe('VehicleLookup component', () => {
  test('renders VIN decoder tab by default', () => {
    renderVL();
    expect(screen.getByRole('heading', { name: /decode a vin/i })).toBeInTheDocument();
  });

  test('renders VIN input field', () => {
    renderVL();
    expect(screen.getByPlaceholderText('1HGCM82633A123456')).toBeInTheDocument();
  });

  test('renders all tab buttons', () => {
    renderVL();
    expect(screen.getByRole('button', { name: /vin decoder/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recalls/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /safety ratings/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /complaints/i })).toBeInTheDocument();
  });

  test('clicking Recalls tab shows vehicle form inputs', async () => {
    renderVL();
    await userEvent.click(screen.getByRole('button', { name: /recalls/i }));
    expect(screen.getByPlaceholderText(/make/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/model/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/year/i)).toBeInTheDocument();
  });

  test('clicking Safety Ratings tab shows check button', async () => {
    renderVL();
    await userEvent.click(screen.getByRole('button', { name: /^safety ratings$/i }));
    expect(screen.getByRole('button', { name: /get safety ratings/i })).toBeInTheDocument();
  });

  test('typing in VIN input updates value (uppercased)', async () => {
    renderVL();
    const vinInput = screen.getByPlaceholderText('1HGCM82633A123456');
    await userEvent.type(vinInput, '1hg');
    expect(vinInput).toHaveValue('1HG');
  });
});
