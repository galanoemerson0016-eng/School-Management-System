import { beforeEach, describe, expect, it, vi } from 'vitest';
import { savePreRestoreSafetySnapshot } from '../utils/backup-restore';
import { db } from '../services/database';

vi.mock('../utils/backup-restore', async (importOriginal) => {
  const original = await importOriginal<typeof import('../utils/backup-restore')>();
  return { ...original, savePreRestoreSafetySnapshot: vi.fn() };
});

import { useUpdateStore } from './update-store';

describe('downloaded update installation safety', () => {
  const install = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.spyOn(db, 'getWriteGeneration').mockReturnValue(5);
    vi.spyOn(db, 'acquireInstallWriteBarrier').mockReturnValue(true);
    vi.spyOn(db, 'releaseInstallWriteBarrier').mockImplementation(() => {});
    window.electronAPI = { quitAndInstall: install } as unknown as Window['electronAPI'];
    useUpdateStore.setState({ updateStep: 'ready-to-install', errorMessage: null });
    install.mockResolvedValue({ success: true });
    vi.mocked(savePreRestoreSafetySnapshot).mockResolvedValue({ id: 'synthetic-safety-copy', filename: 'SMS_Backup_Comprehensive_prerestore_synthetic.json' });
  });

  it('installs only after a fresh verified safety snapshot succeeds', async () => {
    await useUpdateStore.getState().applyUpdate();
    expect(savePreRestoreSafetySnapshot).toHaveBeenCalledOnce();
    expect(install).toHaveBeenCalledWith('SMS_Backup_Comprehensive_prerestore_synthetic.json');
    expect(db.acquireInstallWriteBarrier).toHaveBeenCalledWith(7);
    expect(vi.mocked(savePreRestoreSafetySnapshot).mock.invocationCallOrder[0]).toBeLessThan(install.mock.invocationCallOrder[0]);
  });

  it('does not install if snapshot creation fails', async () => {
    vi.mocked(savePreRestoreSafetySnapshot).mockRejectedValueOnce(new Error('disk unavailable'));
    await useUpdateStore.getState().applyUpdate();
    expect(install).not.toHaveBeenCalled();
    expect(useUpdateStore.getState().errorMessage).toContain('disk unavailable');
  });

  it('does not install without a verified desktop backup filename', async () => {
    vi.mocked(savePreRestoreSafetySnapshot).mockResolvedValueOnce({ id: 'browser-only-copy' });
    await useUpdateStore.getState().applyUpdate();
    expect(install).not.toHaveBeenCalled();
    expect(useUpdateStore.getState().errorMessage).toContain('desktop safety backup');
  });

  it('cancels installation if school data changes while the safety copy is made', async () => {
    vi.mocked(db.acquireInstallWriteBarrier).mockReturnValueOnce(false);
    await useUpdateStore.getState().applyUpdate();
    expect(install).not.toHaveBeenCalled();
    expect(useUpdateStore.getState().errorMessage).toContain('records changed');
  });

  it('does not install before the update is downloaded', async () => {
    useUpdateStore.setState({ updateStep: 'downloading' });
    await useUpdateStore.getState().applyUpdate();
    expect(savePreRestoreSafetySnapshot).not.toHaveBeenCalled();
    expect(install).not.toHaveBeenCalled();
  });
});
