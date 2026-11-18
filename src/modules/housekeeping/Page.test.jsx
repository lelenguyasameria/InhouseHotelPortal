import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HousekeepingPage from './Page.jsx';

const room = (n) => screen.getByRole('listitem', { name: `Room ${n}` });

describe('Housekeeping page', () => {
  it('renders the seeded board with summary counts', () => {
    render(<HousekeepingPage />);
    expect(screen.getAllByRole('listitem')).toHaveLength(24);
    expect(screen.getByTestId('count-out_of_order')).toHaveTextContent('1');
    // dirty rooms start unassigned
    expect(screen.getByTestId('count-unassigned')).toHaveTextContent(
      screen.getByTestId('count-dirty').textContent
    );
  });

  it('blocks starting to clean until an attendant is assigned, then allows it', async () => {
    const user = userEvent.setup();
    render(<HousekeepingPage />);
    expect(screen.getByTestId('status-101')).toHaveTextContent('Dirty');

    await user.click(within(room('101')).getByRole('button', { name: 'Start cleaning' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/assign an attendant/i);
    expect(screen.getByTestId('status-101')).toHaveTextContent('Dirty');

    await user.selectOptions(screen.getByLabelText('Attendant for room 101'), 'Amina');
    await user.click(within(room('101')).getByRole('button', { name: 'Start cleaning' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByTestId('status-101')).toHaveTextContent('Cleaning');
  });

  it('filters by status and shows an empty state', async () => {
    const user = userEvent.setup();
    render(<HousekeepingPage />);
    await user.selectOptions(screen.getByLabelText('Status'), 'out_of_order');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(room('308')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Room'), '999');
    expect(screen.getByText(/no rooms match/i)).toBeInTheDocument();
  });

  it('keeps changes after a remount (persisted)', async () => {
    const user = userEvent.setup();
    const first = render(<HousekeepingPage />);
    await user.selectOptions(screen.getByLabelText('Attendant for room 101'), 'Brian');
    first.unmount();
    render(<HousekeepingPage />);
    expect(screen.getByLabelText('Attendant for room 101')).toHaveValue('Brian');
  });
});
