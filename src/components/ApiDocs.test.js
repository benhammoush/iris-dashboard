import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ApiDocs, { openApiUrl } from './ApiDocs';

vi.mock('swagger-ui-react', () => ({ default: ({ url }) => <div data-testid="swagger-ui">{url}</div> }));

test('renders Swagger UI with the published Iris OpenAPI document', () => {
  render(<BrowserRouter><ApiDocs /></BrowserRouter>);
  expect(screen.getByRole('heading', { name: 'Interactive API documentation' })).toBeInTheDocument();
  expect(screen.getByTestId('swagger-ui')).toHaveTextContent(openApiUrl);
  expect(screen.getByRole('link', { name: 'Back to Iris' })).toHaveAttribute('href', '/');
});
