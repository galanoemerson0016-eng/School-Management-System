import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, firebaseConfig } from '../lib/firebase';
import type { User, UserRole } from '../types';

// Domain configuration
const DOMAIN = 'chs.307014';

export function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        displayName: '',
        role: 'teacher' as UserRole
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importLogs, setImportLogs] = useState<string[]>([]);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'users'));
            const fetchedUsers = querySnapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            })) as User[];
            setUsers(fetchedUsers);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // 1. Initialize secondary app to avoid logging out current user
        const secondaryApp = initializeApp(firebaseConfig, "Secondary");
        const secondaryAuth = getAuth(secondaryApp);

        try {
            const email = `${formData.username}@${DOMAIN}`;

            // 2. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, formData.password);
            const uid = userCredential.user.uid;

            // 3. Create Firestore Document
            const newUser: User = {
                uid,
                email,
                displayName: formData.displayName,
                role: formData.role
            };

            await setDoc(doc(db, 'users', uid), newUser);

            // 4. Cleanup
            await signOut(secondaryAuth);

            // Success
            alert(`User ${formData.username} created successfully!`);
            setIsModalOpen(false);
            setFormData({ username: '', password: '', displayName: '', role: 'teacher' });
            fetchUsers();

        } catch (error: any) {
            console.error("Error creating user:", error);
            alert("Failed to create user: " + error.message);
        } finally {
            // Delete secondary app instance
            await deleteApp(secondaryApp);
            setIsSubmitting(false);
        }
    };

    const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportLogs(['Reading file...', 'Initializing Batch Process...']);

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n');
            let successCount = 0;
            let failCount = 0;
            const logs: string[] = [];

            // 1. Initialize secondary app ONCE for the batch
            const secondaryApp = initializeApp(firebaseConfig, "SecondaryBatch");
            const secondaryAuth = getAuth(secondaryApp);

            try {
                // Skip header row (index 0)
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    // Parse CSV line: Display Name, Username, Password, Role
                    // Handle quoted strings if necessary, but simple split for now
                    const parts = line.split(',').map(p => p.trim());

                    if (parts.length < 4) {
                        logs.push(`❌ Line ${i + 1}: Invalid format (missing columns)`);
                        setImportLogs([...logs]);
                        failCount++;
                        continue;
                    }

                    const [displayName, username, password, roleRaw] = parts;
                    const role = roleRaw.toLowerCase() as UserRole;

                    if (!['admin', 'teacher', 'parent'].includes(role)) {
                        logs.push(`❌ Line ${i + 1}: Invalid role '${role}'`);
                        setImportLogs([...logs]);
                        failCount++;
                        continue;
                    }

                    try {
                        const email = `${username}@${DOMAIN}`;

                        // Create Auth
                        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
                        const uid = userCredential.user.uid;

                        // Create Firestore
                        await setDoc(doc(db, 'users', uid), {
                            uid,
                            email,
                            displayName: displayName.replace(/^"/, '').replace(/"$/, ''), // Remove quotes if present
                            role
                        });

                        logs.push(`✅ Created: ${username} (${role})`);
                        setImportLogs([...logs]);
                        successCount++;

                        // Sign out this temporary user from the secondary app to keep it clean, 
                        // though strictly not necessary if we delete the app later, but good practice.
                        await signOut(secondaryAuth);

                    } catch (err: any) {
                        logs.push(`❌ Failed ${username}: ${err.message}`);
                        setImportLogs([...logs]);
                        failCount++;
                    }
                }
            } catch (error: any) {
                logs.push(`🔥 Critical Batch Error: ${error.message}`);
                setImportLogs([...logs]);
            } finally {
                await deleteApp(secondaryApp);
                setIsImporting(false);
                fetchUsers(); // Refresh list
                alert(`Batch Import Completed.\nSuccess: ${successCount}\nFailed: ${failCount}`);
            }
        };
        reader.readAsText(file);
    };

    const handleDownloadTemplate = () => {
        const headers = ["Display Name,Username,Password,Role"];
        const rows = [
            "Juan Dela Cruz,juan.delacruz,pass123,teacher",
            "Maria Clara,maria.clara,pass456,parent"
        ];
        const csvContent = [...headers, ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chs_user_import_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const handleDeleteUser = async (uid: string, username: string) => {
        if (!confirm(`Are you sure you want to delete user ${username}? They will no longer be able to log in.`)) return;

        try {
            // We can only delete the Firestore doc from the client SDK (without Admin SDK)
            // But our auth-store logic enforces doc existence, so this effectively bans them.
            await deleteDoc(doc(db, 'users', uid));
            setUsers(prev => prev.filter(u => u.uid !== uid));
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Failed to delete user.");
        }
    };

    if (isLoading) return <div className="p-8">Loading users...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-deped-blue">User Management</h1>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="btn-secondary flex items-center"
                    >
                        <span className="mr-2">📂</span> Import CSV
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary flex items-center"
                    >
                        <span className="mr-2">+</span> Add User
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username / Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.uid}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                            user.role === 'teacher' ? 'bg-green-100 text-green-800' :
                                                'bg-blue-100 text-blue-800'}`}>
                                        {user.role ? user.role.toUpperCase() : 'UNKNOWN'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {user.email !== 'admin@chs.307014' && (
                                        <button
                                            onClick={() => handleDeleteUser(user.uid, user.displayName || 'User')}
                                            className="text-red-600 hover:text-red-900 ml-4"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && (
                    <div className="p-6 text-center text-gray-500">No users found.</div>
                )}
            </div>

            {/* Add User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Create New Account</h3>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1">Display Name</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    value={formData.displayName}
                                    onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                    placeholder="e.g. Juan A. Teacher"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Username</label>
                                <div className="flex">
                                    <input
                                        type="text"
                                        required
                                        className="form-input rounded-r-none border-r-0"
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value.replace(/[^a-zA-Z0-9.]/g, '') })}
                                        placeholder="username"
                                    />
                                    <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                        @{DOMAIN}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    className="form-input"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Min. 6 characters"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Role</label>
                                <select
                                    className="form-input"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                                >
                                    <option value="teacher">Teacher</option>
                                    <option value="parent">Parent</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn-primary disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Creating...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Import CSV Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Mass Import Users</h3>
                            {!isImporting && (
                                <button onClick={() => setIsImportModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                            )}
                        </div>

                        {!isImporting ? (
                            <div className="space-y-6">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 relative">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold text-blue-800 mb-2">CSV Format Instructions</h4>
                                        <button
                                            onClick={handleDownloadTemplate}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 underline"
                                        >
                                            📥 Download Template
                                        </button>
                                    </div>
                                    <p className="text-sm text-blue-700 mb-2">Create a CSV file with the following columns (no header required, but recommended to skip first line if present):</p>
                                    <code className="block bg-white p-3 rounded border border-blue-200 text-sm overflow-x-auto">
                                        Display Name,Username,Password,Role
                                    </code>
                                    <p className="text-xs text-blue-600 mt-2">Example: <code>Juan Dela Cruz,juan.delacruz,pass123,teacher</code></p>
                                </div>

                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleCSVUpload}
                                        className="hidden"
                                        id="csvUpload"
                                    />
                                    <label htmlFor="csvUpload" className="cursor-pointer block">
                                        <div className="text-4xl mb-2">📂</div>
                                        <span className="text-gray-600 font-medium">Click to upload CSV file</span>
                                        <p className="text-xs text-gray-400 mt-1">.csv files only</p>
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 text-deped-blue font-semibold mb-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-deped-blue border-t-transparent"></div>
                                        Processing Users...
                                    </div>
                                    <div className="text-xs text-gray-500">Please do not close this window until finished.</div>
                                </div>
                                <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto whitespace-pre-wrap">
                                    {importLogs.map((log, i) => (
                                        <div key={i}>{log}</div>
                                    ))}
                                    <div className="animate-pulse">_</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
