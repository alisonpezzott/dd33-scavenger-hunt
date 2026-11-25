import { StrictMode } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CompletionRecord } from '@rayfin-app/shared';
import App from '@/App';
import { AuthContext, type AuthContextValue } from '@/hooks/auth.context';
import { huntApi } from '@/services/hunt.service';

vi.mock('@/services/hunt.service', () => ({
  huntApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));

const auth: AuthContextValue = {
  session: { user: { id: 'player-1', email: 'player@example.test' }, isAuthenticated: true, isAnonymous: false },
  isAuthenticated: true, isLoading: false, canSignIn: true, signIn: async () => {},
  isSigningIn: false, signInError: null, error: null, config: { kind: 'ready' },
};
const completion: CompletionRecord = {
  id: 'completion-1', owner_id: 'player-1', completionKey: 'player-1:icebreaker',
  challengeId: 'icebreaker', playerName: 'Alex', note: 'Met a fellow first-time attendee.',
};
function mount() {
  return render(<StrictMode><AuthContext.Provider value={auth}><App /></AuthContext.Provider></StrictMode>);
}
async function openFirst() {
  const button = screen.getByRole('button', { name: 'Complete Break the ice' });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  fireEvent.change(screen.getByLabelText('Your leaderboard name'), { target: { value: 'Alex' } });
  fireEvent.change(screen.getByLabelText('Your short note'), { target: { value: completion.note } });
}

describe('Scavenger Hunt', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(huntApi.list).mockResolvedValue([]);
    vi.mocked(huntApi.create).mockResolvedValue(completion);
    vi.mocked(huntApi.update).mockResolvedValue({ id: completion.id, note: 'Updated memory' });
    vi.mocked(huntApi.remove).mockResolvedValue(undefined);
  });

  it('shows exactly ten challenges and an honest empty leaderboard in Strict Mode', async () => {
    mount();
    await screen.findByText('First explorer, step up!');
    expect(screen.getAllByRole('article')).toHaveLength(10);
    expect(screen.getByText('0 / 10')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Completed (0)' }));
    expect(screen.getByText('Your story starts here')).toBeVisible();
  });

  it('saves a completion note, counts one point, and filters completed challenges', async () => {
    mount();
    await openFirst();
    fireEvent.click(screen.getByRole('button', { name: 'Complete challenge' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(huntApi.create).toHaveBeenCalledWith({
      owner_id: 'player-1', completionKey: 'player-1:icebreaker', challengeId: 'icebreaker',
      playerName: 'Alex', note: completion.note,
    });
    expect(screen.getByText(completion.note)).toBeVisible();
    expect(screen.getByText('1 / 10')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Edit Break the ice' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Completed (1)' }));
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(within(screen.getByRole('list')).getByText(/Alex/)).toBeVisible();
  });

  it('rolls back a failed save and retains the draft for retry', async () => {
    vi.mocked(huntApi.create).mockRejectedValue(new Error('Connection interrupted'));
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    mount();
    await openFirst();
    fireEvent.click(screen.getByRole('button', { name: 'Complete challenge' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Your change was not saved');
    expect(screen.getByLabelText('Your short note')).toHaveValue(completion.note);
    expect(screen.getByText('0 / 10')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Complete challenge' })).toBeEnabled();
    logged.mockRestore();
  });

  it('edits an existing note and confirms before undoing a completion', async () => {
    vi.mocked(huntApi.list).mockResolvedValue([completion]);
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Edit Break the ice' }));
    fireEvent.change(screen.getByLabelText('Your short note'), { target: { value: 'Updated memory' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save note' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByText('Updated memory')).toBeVisible();
    expect(screen.getByText('1 / 10')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Edit Break the ice' }));
    fireEvent.click(screen.getByRole('button', { name: 'Undo completion' }));
    expect(huntApi.remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Yes, undo completion' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(huntApi.remove).toHaveBeenCalledWith(completion.id);
    expect(screen.getByText('0 / 10')).toBeVisible();
  });

  it('surfaces a load error instead of leaving a spinner or allowing writes', async () => {
    vi.mocked(huntApi.list).mockRejectedValue(new Error('Permission denied'));
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('Progress could not be loaded');
    expect(screen.getByRole('button', { name: 'Complete Break the ice' })).toBeDisabled();
    vi.mocked(huntApi.list).mockResolvedValue([]);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Complete Break the ice' })).toBeEnabled());
    logged.mockRestore();
  });
});
