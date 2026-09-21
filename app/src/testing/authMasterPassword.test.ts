import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../stores/auth-store';

describe('Authentication bypass prevention', () => {
    let protectedDek: string | null = null;

    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        useAuthStore.setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            needsAccountSetup: false,
            error: null,
        });
        protectedDek = null;
        window.electronAPI = {
            recoveryProtectorAvailable: async () => true,
            protectRecoveryDek: async (rawDek: string) => {
                protectedDek = rawDek;
                return true;
            },
            recoverProtectedDek: async () => protectedDek,
        } as Window['electronAPI'];
    });

    it('rejects the former factory password for an existing account', async () => {
        await useAuthStore.getState().createAccount({
            username: 'maria.santos',
            password: 'MyPersonalSecurePassword123!',
        });
        await useAuthStore.getState().logout();

        const success = await useAuthStore.getState().login('maria.santos', 'formease');

        expect(success).toBe(false);
        expect(useAuthStore.getState().isAuthenticated).toBe(false);
        expect(useAuthStore.getState().error).toBe('Invalid username or password');
    });

    it('requires the exact registered username', async () => {
        await useAuthStore.getState().createAccount({
            username: 'deped_admin_user',
            password: 'SuperSecretCustomPassword999!',
        });
        await useAuthStore.getState().logout();

        const success = await useAuthStore.getState().login('admin', 'SuperSecretCustomPassword999!');

        expect(success).toBe(false);
        expect(useAuthStore.getState().error).toBe('Invalid username or password');
    });

    it('requires account setup instead of accepting a factory credential on first use', async () => {
        const success = await useAuthStore.getState().login('admin', 'formease');

        expect(success).toBe(false);
        expect(useAuthStore.getState().isAuthenticated).toBe(false);
        expect(useAuthStore.getState().needsAccountSetup).toBe(true);
    });

    it('does not allow the former factory password to change credentials', async () => {
        await useAuthStore.getState().createAccount({
            username: 'principal.cruz',
            password: 'OriginalPassword123!',
        });

        await expect(useAuthStore.getState().changeCredentials({
            currentPassword: 'formease',
            newPassword: 'BrandNewSecurePassword456!',
        })).rejects.toThrow('Current password is incorrect');
    });

    it('forces setup for legacy installs that retained the public factory password', async () => {
        localStorage.setItem('formease-credentials', JSON.stringify({
            username: 'legacy_admin',
            password: 'formease',
            role: 'admin',
        }));

        const success = await useAuthStore.getState().login('legacy_admin', 'formease');

        expect(success).toBe(false);
        expect(useAuthStore.getState().needsAccountSetup).toBe(true);
        expect(localStorage.getItem('formease-credentials')).toBeNull();
    });

    it('still accepts the correct user-selected credentials', async () => {
        await useAuthStore.getState().createAccount({
            username: 'test.user',
            password: 'CorrectPassword123!',
        });
        await useAuthStore.getState().logout();

        const success = await useAuthStore.getState().login('test.user', 'CorrectPassword123!');

        expect(success).toBe(true);
        expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('keeps the same DEK through password change and password recovery', async () => {
        await useAuthStore.getState().createAccount({
            username: 'integrity.admin',
            password: 'OriginalPassword123!',
            securityQuestion: 'Synthetic test question?',
            securityAnswer: 'Synthetic answer',
        });
        const initial = JSON.parse(localStorage.getItem('formease-db-key-envelope-v1') || '{}');
        expect(initial.state).toBe('migrated');
        expect(initial.dekFingerprint).toBeTruthy();

        await useAuthStore.getState().changeCredentials({
            currentPassword: 'OriginalPassword123!',
            newPassword: 'ChangedPassword456!',
        });
        const afterChange = JSON.parse(localStorage.getItem('formease-db-key-envelope-v1') || '{}');
        expect(afterChange.dekFingerprint).toBe(initial.dekFingerprint);
        expect(afterChange.passwordWrappedDek.ciphertext).not.toBe(initial.passwordWrappedDek.ciphertext);

        await useAuthStore.getState().logout();
        expect(await useAuthStore.getState().login('integrity.admin', 'OriginalPassword123!')).toBe(false);
        expect(await useAuthStore.getState().login('integrity.admin', 'ChangedPassword456!')).toBe(true);

        await useAuthStore.getState().resetPasswordWithSecurityAnswer('synthetic answer', 'RecoveredPassword789!');
        const afterRecovery = JSON.parse(localStorage.getItem('formease-db-key-envelope-v1') || '{}');
        expect(afterRecovery.dekFingerprint).toBe(initial.dekFingerprint);
        expect(afterRecovery.passwordWrappedDek.ciphertext).not.toBe(afterChange.passwordWrappedDek.ciphertext);

        await useAuthStore.getState().logout();
        expect(await useAuthStore.getState().login('integrity.admin', 'RecoveredPassword789!')).toBe(true);
    });

    it('rejects corrupt recovery material without changing the password wrapper', async () => {
        await useAuthStore.getState().createAccount({
            username: 'recovery.admin',
            password: 'OriginalPassword123!',
            securityQuestion: 'Synthetic test question?',
            securityAnswer: 'Synthetic answer',
        });
        const before = localStorage.getItem('formease-db-key-envelope-v1');
        protectedDek = 'not-a-valid-dek';

        await expect(useAuthStore.getState().resetPasswordWithSecurityAnswer('synthetic answer', 'RecoveredPassword789!'))
            .rejects.toThrow('Password recovery is unavailable');
        expect(localStorage.getItem('formease-db-key-envelope-v1')).toBe(before);

        await useAuthStore.getState().logout();
        expect(await useAuthStore.getState().login('recovery.admin', 'OriginalPassword123!')).toBe(true);
    });
});
