import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SignUp from './index';

// Mock the api client.
jest.mock('../../api/client', () => ({
  __esModule: true,
  default: {
    registerUser: jest.fn().mockResolvedValue({}),
  },
}));

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
  currentUser: null,
  token: null,
  login: jest.fn().mockResolvedValue({ id: '1', username: 'tester' }),
  logout: jest.fn(),
  updateCurrentUser: jest.fn(),
  loadingAuth: false,
};

const renderSignUp = () => {
  const ctx = require('../../context/AuthContext').default;
  return render(
    <ctx.Provider value={mockAuthValue}>
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    </ctx.Provider>
  );
};

describe('SignUp component', () => {
  test('renders multi-step form with step 1 visible', () => {
    renderSignUp();
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/john doe/i)).toBeInTheDocument();
  });

  test('shows validation error when clicking Continue with empty fields', async () => {
    renderSignUp();
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => expect(screen.getByText(/please enter your name/i)).toBeInTheDocument());
  });

  test('navigates to step 2 when step 1 is valid', async () => {
    renderSignUp();
    await userEvent.type(screen.getByPlaceholderText(/john doe/i), 'John Doe');
    await userEvent.type(screen.getByPlaceholderText('you@email.com'), 'john@example.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    await userEvent.type(passwordInputs[0], 'Password123!');
    await userEvent.type(passwordInputs[1], 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => expect(screen.getByText(/display tag/i)).toBeInTheDocument());
  });

  test('shows back button on step 2', async () => {
    renderSignUp();
    await userEvent.type(screen.getByPlaceholderText(/john doe/i), 'John Doe');
    await userEvent.type(screen.getByPlaceholderText('you@email.com'), 'john@example.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    await userEvent.type(passwordInputs[0], 'Password123!');
    await userEvent.type(passwordInputs[1], 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument());
  });

  test('shows password strength meter when typing password', async () => {
    renderSignUp();
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    await userEvent.type(passwordInputs[0], 'Str0ngP@ss!');
    await waitFor(() => expect(screen.getByText(/strong|good|fair|weak|very strong/i)).toBeInTheDocument());
  });

  test('renders car interests selection on step 3', async () => {
    renderSignUp();
    // Fill step 1
    await userEvent.type(screen.getByPlaceholderText(/john doe/i), 'John Doe');
    await userEvent.type(screen.getByPlaceholderText('you@email.com'), 'john@example.com');
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    await userEvent.type(passwordInputs[0], 'Password123!');
    await userEvent.type(passwordInputs[1], 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));
    // Fill step 2
    await waitFor(() => expect(screen.getByPlaceholderText(/AJ_Rides/i)).toBeInTheDocument());
    await userEvent.type(screen.getByPlaceholderText(/AJ_Rides/i), 'TestUser1');
    await userEvent.selectOptions(screen.getByRole('combobox'), 'male');
    await userEvent.type(screen.getByPlaceholderText('Rockford'), 'Rockford');
    await userEvent.type(screen.getByPlaceholderText('IL'), 'IL');
    await userEvent.click(screen.getAllByRole('button', { name: /continue/i })[0]);
    // Step 3
    await waitFor(() => expect(screen.getByText(/car interests/i)).toBeInTheDocument());
    expect(screen.getByText('Muscle Cars')).toBeInTheDocument();
  });
});
