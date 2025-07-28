import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

test('renders MediMate header', () => {
  render(<App />);
  const headerElement = screen.getByText(/MediMate/i);
  expect(headerElement).toBeInTheDocument();
});
