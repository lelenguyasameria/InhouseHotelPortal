import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MaintenancePage from './Page.jsx';

const order = (id) => screen.getByRole('listitem', { name: `Work order ${id}` });

describe('Maintenance page', () => {
  it('shows seeded orders and summary counts', () => {
    render(<MaintenancePage />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByTestId('count-open')).toHaveTextContent('1');
    expect(screen.getByTestId('count-in-progress')).toHaveTextContent('1');
  });

  it('creates a work order from the form and clears the form', async () => {
    const user = userEvent.setup();
    render(<MaintenancePage />);
    await user.type(screen.getByLabelText('Location'), 'Pool');
    await user.type(screen.getByLabelText('Description'), 'Pump leaking');
    await user.selectOptions(screen.getByLabelText('Priority'), 'urgent');
    await user.click(screen.getByRole('button', { name: 'Create work order' }));

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(within(order(3)).getByText(/Pool/)).toBeInTheDocument();
    expect(screen.getByLabelText('Location')).toHaveValue('');
    // urgent orders sort to the top
    expect(screen.getAllByRole('listitem')[0]).toHaveAccessibleName('Work order 3');
  });

  it('shows a validation error for an empty form', async () => {
    const user = userEvent.setup();
    render(<MaintenancePage />);
    await user.click(screen.getByRole('button', { name: 'Create work order' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/location is required/i);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('requires an assignee before starting work, then runs the lifecycle', async () => {
    const user = userEvent.setup();
    render(<MaintenancePage />);
    await user.click(within(order(1)).getByRole('button', { name: 'Start work' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/assign someone/i);

    await user.selectOptions(screen.getByLabelText('Assignee for work order 1'), 'Lucy');
    await user.click(within(order(1)).getByRole('button', { name: 'Start work' }));
    expect(screen.getByTestId('status-1')).toHaveTextContent('In progress');
    await user.click(within(order(1)).getByRole('button', { name: 'Mark resolved' }));
    expect(screen.getByTestId('status-1')).toHaveTextContent('Resolved');
  });

  it('filters by status', async () => {
    const user = userEvent.setup();
    render(<MaintenancePage />);
    await user.selectOptions(screen.getByLabelText('Filter status'), 'in_progress');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    await user.type(screen.getByLabelText('Search'), 'zzz');
    expect(screen.getByText(/no work orders match/i)).toBeInTheDocument();
  });
});
