import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Bed } from 'lucide-react';
import App from './App.jsx';

const FakePage = () => <h1>Fake module page</h1>;
const fake = [
  { id: 'fake', path: '/fake', label: 'Fake Module', description: 'A test module', icon: Bed, Page: FakePage },
];

const renderApp = (modules, route = '/') =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <App modules={modules} />
    </MemoryRouter>
  );

describe('App shell', () => {
  it('shows a friendly message when no modules are installed', () => {
    renderApp([]);
    expect(screen.getByText(/no modules installed yet/i)).toBeInTheDocument();
  });

  it('lists installed modules in the nav and on the home page', () => {
    renderApp(fake);
    // one link in the sidebar nav, one card on the home page
    expect(screen.getAllByRole('link', { name: /fake module/i })).toHaveLength(2);
    expect(screen.getByText('A test module')).toBeInTheDocument();
  });

  it('navigates to a module page', async () => {
    renderApp(fake);
    await userEvent.click(screen.getAllByRole('link', { name: /fake module/i })[0]);
    expect(screen.getByRole('heading', { name: 'Fake module page' })).toBeInTheDocument();
  });

  it('shows not-found for unknown routes', () => {
    renderApp(fake, '/nope');
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  });
});
