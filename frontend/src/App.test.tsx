import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders JetBase app', () => {
    render(<App />);
    const linkElement = screen.getByText(/JetBase/i);
    expect(linkElement).toBeInTheDocument();
});