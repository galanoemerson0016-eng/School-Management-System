import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../stores/auth-store';

describe('Authentication bypass prevention', () => {
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
});
