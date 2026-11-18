import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GuestRequestsPage from './Page.jsx';

const request = (id) => screen.getByRole('listitem', { name: `Request ${id}` });

describe('Guest requests page', () => {
  it('shows seeded requests and counts', () => {
    render(<GuestRequestsPage />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByTestId('count-pending')).toHaveTextContent('1');
    expect(screen.getByTestId('count-in-progress')).toHaveTextContent('1');
  });

  it('shows where a request type will be routed, live', async () => {
    const user = userEvent.setup();
    render(<GuestRequestsPage />);
    expect(screen.getByTestId('routing-hint')).toHaveTextContent('Housekeeping');
    await user.selectOptions(screen.getByLabelText('Request type'), 'repair');
    expect(screen.getByTestId('routing-hint')).toHaveTextContent('Engineering');
  });

  it('logs a new request and resets the form', async () => {
    const user = userEvent.setup();
    render(<GuestRequestsPage />);
    await user.type(screen.getByLabelText('Room'), '115');
    await user.selectOptions(screen.getByLabelText('Request type'), 'room_service');
    await user.click(screen.getByRole('button', { name: 'Log request' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(within(request(3)).getByLabelText('Department for request 3')).toHaveValue('food_beverage');
    expect(screen.getByLabelText('Room')).toHaveValue('');
  });

  it('rejects an empty room and an undescribed "other" request', async () => {
    const user = userEvent.setup();
    render(<GuestRequestsPage />);
    await user.click(screen.getByRole('button', { name: 'Log request' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/room number is required/i);

    await user.type(screen.getByLabelText('Room'), '115');
    await user.selectOptions(screen.getByLabelText('Request type'), 'other');
    await user.click(screen.getByRole('button', { name: 'Log request' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/describe the request/i);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('progresses a request and removes its action buttons when done', async () => {
    const user = userEvent.setup();
    render(<GuestRequestsPage />);
    await user.click(within(request(1)).getByRole('button', { name: 'Start' }));
    expect(screen.getByTestId('status-1')).toHaveTextContent('In progress');
    await user.click(within(request(1)).getByRole('button', { name: 'Mark done' }));
    expect(screen.getByTestId('status-1')).toHaveTextContent('Done');
    expect(within(request(1)).queryByRole('button')).not.toBeInTheDocument();
  });

  it('reroutes a request and filters by department', async () => {
    const user = userEvent.setup();
    render(<GuestRequestsPage />);
    await user.selectOptions(screen.getByLabelText('Department for request 1'), 'front_desk');
    await user.selectOptions(screen.getByLabelText('Filter department'), 'front_desk');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    await user.selectOptions(screen.getByLabelText('Filter department'), 'engineering');
    expect(screen.getByText(/no requests match/i)).toBeInTheDocument();
  });
});
