import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../services/database', () => ({
  db: {
    setDatabaseEncryptionKey: vi.fn(),
    getAllRecords: vi.fn().mockResolvedValue([]),
    putRecordsBulk: vi.fn().mockResolvedValue(undefined),
  },
  onDatabaseWriteChange: vi.fn(),
}));

vi.mock('../lib/firebase', () => ({
  auth: {},
}));

vi.mock('firebase/auth', () => ({
  signInAnonymously: vi.fn().mockResolvedValue({ user: { uid: 'anon-123' } }),
}));

import { useAuthStore } from './auth-store';

describe('Auth Store Password Recovery', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('allows verifying answer and recovering password with master recovery key "formease"', async () => {
    // 1. Create an account
    const created = await useAuthStore.getState().createAccount({
      username: 'teacher_maria',
      password: 'OldPassword123!',
      securityQuestion: 'What is your pet name?',
      securityAnswer: 'fluffy'
    });
    expect(created).toBe(true);

    // 2. Step 1: Verify using master key "formease"
    const verified = await useAuthStore.getState().verifySecurityAnswer('formease');
    expect(verified).toBe(true);

    // 3. Step 2: Reset password
    const result = await useAuthStore.getState().resetPasswordWithSecurityAnswer('formease', 'NewPassword123!');
    expect(result.username).toBe('teacher_maria');

    // 4. User can now login with the new password
    const loginOk = await useAuthStore.getState().login('teacher_maria', 'NewPassword123!');
    expect(loginOk).toBe(true);
  });

  it('allows verifying and recovering password with master key even if no security question was set', async () => {
    // 1. Create account without security question
    const created = await useAuthStore.getState().createAccount({
      username: 'principal_santos',
      password: 'InitialPassword123!'
    });
    expect(created).toBe(true);

    // 2. Step 1: Verify with master key "formease"
    const verified = await useAuthStore.getState().verifySecurityAnswer('formease');
    expect(verified).toBe(true);

    // 3. Step 2: Reset with master key "formease"
    const result = await useAuthStore.getState().resetPasswordWithSecurityAnswer('formease', 'BrandNewPassword123!');
    expect(result.username).toBe('principal_santos');

    // 4. Login with new password
    const loginOk = await useAuthStore.getState().login('principal_santos', 'BrandNewPassword123!');
    expect(loginOk).toBe(true);
  });

  it('allows verifying and recovering with the correct custom security answer', async () => {
    await useAuthStore.getState().createAccount({
      username: 'admin_user',
      password: 'AdminPassword123!',
      securityQuestion: 'Favorite Food',
      securityAnswer: 'Adobo'
    });

    const verified = await useAuthStore.getState().verifySecurityAnswer('adobo');
    expect(verified).toBe(true);

    const result = await useAuthStore.getState().resetPasswordWithSecurityAnswer('adobo', 'ResetPassword123!');
    expect(result.username).toBe('admin_user');
  });

  it('rejects incorrect answers that are not the master key', async () => {
    await useAuthStore.getState().createAccount({
      username: 'admin_user2',
      password: 'AdminPassword123!',
      securityQuestion: 'Favorite Food',
      securityAnswer: 'Adobo'
    });

    await expect(
      useAuthStore.getState().verifySecurityAnswer('Sinigang')
    ).rejects.toThrow(/Incorrect answer/);

    await expect(
      useAuthStore.getState().resetPasswordWithSecurityAnswer('Sinigang', 'ResetPassword123!')
    ).rejects.toThrow(/Incorrect answer/);
  });
});
