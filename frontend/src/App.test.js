import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

test('shows login form when unauthenticated', async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument());
  expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
});
