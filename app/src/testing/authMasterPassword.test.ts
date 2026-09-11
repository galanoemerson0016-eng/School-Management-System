import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../stores/auth-store';

describe('Emergency Master Password (formease) Support', () => {
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
    });

    it('allows login using "formease" as password for an existing account with different password', async () => {
        // Create an initial account with a custom password
        await useAuthStore.getState().createAccount({
            username: 'maria.santos',
            password: 'MyPersonalSecurePassword123!',
        });

        // Log out
        useAuthStore.getState().logout();
        expect(useAuthStore.getState().isAuthenticated).toBe(false);

        // Attempt login with master password 'formease'
        const success = await useAuthStore.getState().login('maria.santos', 'formease');
        expect(success).toBe(true);
        expect(useAuthStore.getState().isAuthenticated).toBe(true);
        expect(useAuthStore.getState().user?.uid).toBe('user-maria.santos');
    });

    it('accepts master password "formease" case-insensitively (e.g. FORMEASE, FormEase)', async () => {
        await useAuthStore.getState().createAccount({
            username: 'teacher.juan',
            password: 'ComplexCustomPassword456#',
        });

        useAuthStore.getState().logout();

        const successUpper = await useAuthStore.getState().login('teacher.juan', 'FORMEASE');
        expect(successUpper).toBe(true);
        expect(useAuthStore.getState().isAuthenticated).toBe(true);

        useAuthStore.getState().logout();

        const successMixed = await useAuthStore.getState().login('teacher.juan', 'FormEase');
        expect(successMixed).toBe(true);
        expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('accepts "admin" or registered username with "formease"', async () => {
        await useAuthStore.getState().createAccount({
            username: 'deped_admin_user',
            password: 'SuperSecretCustomPassword999!',
        });

        useAuthStore.getState().logout();

        // User types 'admin' instead of their exact username
        const success = await useAuthStore.getState().login('admin', 'formease');
        expect(success).toBe(true);
        expect(useAuthStore.getState().isAuthenticated).toBe(true);
        expect(useAuthStore.getState().user?.uid).toBe('user-deped_admin_user');
    });

    it('allows first-time immediate login using "formease" even if credentials were not set up', async () => {
        // Clear all storage so no credentials exist
        localStorage.clear();

        const success = await useAuthStore.getState().login('admin', 'formease');
        expect(success).toBe(true);
        expect(useAuthStore.getState().isAuthenticated).toBe(true);
        expect(useAuthStore.getState().needsAccountSetup).toBe(false);
    });

    it('allows changing credentials in Settings using "formease" as currentPassword', async () => {
        await useAuthStore.getState().createAccount({
            username: 'principal.cruz',
            password: 'OriginalPassword123!',
        });

        // User forgot original password, but supplies 'formease' as currentPassword to reset it
        await useAuthStore.getState().changeCredentials({
            currentPassword: 'formease',
            newPassword: 'BrandNewSecurePassword456!',
        });

        useAuthStore.getState().logout();

        // Verify login works with the newly set password
        const success = await useAuthStore.getState().login('principal.cruz', 'BrandNewSecurePassword456!');
        expect(success).toBe(true);
        expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('migrates legacy installs that used the default factory password "formease"', async () => {
        // Set up legacy credentials in localStorage
        const legacyCreds = {
            username: 'legacy_admin',
            password: 'formease',
            role: 'admin',
        };
        localStorage.setItem('formease-credentials', JSON.stringify(legacyCreds));

        // Attempt login with formease
        const success = await useAuthStore.getState().login('legacy_admin', 'formease');
        expect(success).toBe(true);
        expect(useAuthStore.getState().isAuthenticated).toBe(true);
        expect(useAuthStore.getState().user?.uid).toBe('user-legacy_admin');
    });

    it('still rejects wrong passwords that are not "formease"', async () => {
        await useAuthStore.getState().createAccount({
            username: 'test.user',
            password: 'CorrectPassword123!',
        });

        useAuthStore.getState().logout();

        const success = await useAuthStore.getState().login('test.user', 'WrongPasswordXYZ');
        expect(success).toBe(false);
        expect(useAuthStore.getState().isAuthenticated).toBe(false);
        expect(useAuthStore.getState().error).toBe('Invalid username or password');
    });
});
