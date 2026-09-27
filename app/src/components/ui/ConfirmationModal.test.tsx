import { fireEvent, render, screen, cleanup, act } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ConfirmationModal } from './ConfirmationModal';
afterEach(cleanup);
it('blocks duplicate confirmations and cancellation during a pending operation', async () => {
    let finish!: () => void;
    const onConfirm = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    const onCancel = vi.fn();
    render(<ConfirmationModal open title="Delete learner" message="Confirm deletion" onConfirm={onConfirm} onCancel={onCancel} />);
    expect(screen.getByRole('alertdialog', { name: 'Delete learner' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    fireEvent.click(screen.getByRole('button', { name: 'Working…' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    await act(async () => finish());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
});
it('announces a rejected action and allows a retry', async () => {
    render(<ConfirmationModal open title="Save" message="Confirm save" onConfirm={async () => { throw new Error('synthetic failure'); }} onCancel={() => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be completed');
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeEnabled();
});
