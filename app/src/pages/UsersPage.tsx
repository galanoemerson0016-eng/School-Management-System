import { useAuthStore } from '../stores';

export function UsersPage() {
    const { user } = useAuthStore();

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
                <p className="mt-2 text-slate-600">
                    This offline build uses a single local account per device.
                </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-lg font-semibold text-slate-900">Current User</h3>
                <p className="mt-2 text-slate-700">Name: {user?.displayName || 'Local User'}</p>
                <p className="text-slate-700">Email: {user?.email || 'teacher@school.local'}</p>
                <p className="text-slate-700">Role: {user?.role || 'teacher'}</p>
            </div>
        </div>
    );
}
