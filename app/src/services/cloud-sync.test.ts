import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CloudSyncService } from './cloud-sync';

describe('CloudSyncService Onboarding & Subscription', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows onboarding prompt by default when unlinked', () => {
    expect(CloudSyncService.shouldShowOnboarding()).toBe(true);
  });

  it('does not show onboarding when already linked', () => {
    localStorage.setItem('formease_gdrive_token', 'sample_token_123');
    expect(CloudSyncService.shouldShowOnboarding()).toBe(false);
  });

  it('snoozes onboarding for 24 hours when remindLater is true', () => {
    CloudSyncService.dismissOnboarding(true);
    expect(CloudSyncService.shouldShowOnboarding()).toBe(false);
  });

  it('never shows onboarding again when user dismisses permanently', () => {
    CloudSyncService.dismissOnboarding(false);
    expect(CloudSyncService.shouldShowOnboarding()).toBe(false);
    expect(localStorage.getItem('formease_gdrive_onboarding_dismissed')).toBe('never');
  });

  it('notifies subscribers when status changes', () => {
    const listener = vi.fn();
    const unsubscribe = CloudSyncService.subscribe(listener);

    CloudSyncService.emitStatusChange({
      linked: true,
      email: 'teacher@school.edu',
      lastSync: 1700000000000,
      isSyncing: false
    });

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        linked: true,
        email: 'teacher@school.edu',
        lastSync: 1700000000000
      })
    );

    unsubscribe();
  });
});
