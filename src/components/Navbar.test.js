import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './Navbar';
import { ThemeProvider } from '../design-system';

test('renders loading skeletons for the navbar market summaries', () => {
  render(<BrowserRouter><ThemeProvider><Navbar /></ThemeProvider></BrowserRouter>);

  expect(screen.getByLabelText('Loading Jupiter market summary')).toHaveAttribute('aria-busy', 'true');
  expect(screen.getByLabelText('Loading Helius network summary')).toHaveAttribute('aria-busy', 'true');
  expect(screen.getByLabelText('Loading Jupiter market summary')).toHaveTextContent('SOL : /MCAP : /24HVOL :');
  expect(screen.getByLabelText('Loading Helius network summary')).toHaveTextContent('TPS : /TRUE TPS : /AVG FEE :');
});
