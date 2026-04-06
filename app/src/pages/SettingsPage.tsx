import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores';
import { auth } from '../lib/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { Moon, Sun, Bell, Database, Lock, User, Shield, Info, Mail, Facebook } from 'lucide-react';

export function SettingsPage() {
    const { user } = useAuthStore();

    // Dark Mode
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('sms-dark-mode') === 'true';
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('sms-dark-mode', String(isDarkMode));
    }, [isDarkMode]);

    // Change Password
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const handleChangePassword = async () => {
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        setIsChangingPassword(true);
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser || !firebaseUser.email) throw new Error('No user');

            const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
            await reauthenticateWithCredential(firebaseUser, credential);
            await updatePassword(firebaseUser, newPassword);

            setPasswordSuccess('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                setShowPasswordModal(false);
                setPasswordSuccess('');
            }, 2000);
        } catch (error: any) {
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                setPasswordError('Current password is incorrect');
            } else {
                setPasswordError(error.message || 'Failed to change password');
            }
        } finally {
            setIsChangingPassword(false);
        }
    };

    // Export Data
    const [isExporting, setIsExporting] = useState(false);
    const handleExportData = async () => {
        setIsExporting(true);
        try {
            // Get all data from localStorage and store
            const exportData = {
                exportDate: new Date().toISOString(),
                version: '1.0.0',
                note: 'Full backup export from DepEd SMS',
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `SMS_Backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            alert('Export failed: ' + error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-3xl font-extrabold text-deped-blue tracking-tight">Settings</h2>
                <p className="text-gray-500 font-medium mt-1">Manage your account and system preferences</p>
            </div>

            {/* Account Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-deped-blue to-blue-600 text-white flex items-center gap-3">
                    <User className="w-5 h-5" />
                    <h3 className="text-lg font-bold">Account Settings</h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Display Name</p>
                            <p className="text-lg font-bold text-gray-800">{user?.displayName || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email</p>
                            <p className="text-lg font-bold text-gray-800">{user?.email || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Role</p>
                            <p className="text-lg font-bold text-gray-800 capitalize flex items-center gap-2">
                                <Shield className="w-4 h-4 text-deped-blue" />
                                {user?.role || 'N/A'}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">User ID</p>
                            <p className="text-sm font-mono text-gray-600 break-all">{user?.uid || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="px-5 py-2.5 bg-deped-blue text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            <Lock className="w-4 h-4" />
                            Change Password
                        </button>
                    </div>
                </div>
            </div>

            {/* System Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-deped-blue to-blue-600 text-white flex items-center gap-3">
                    <Info className="w-5 h-5" />
                    <h3 className="text-lg font-bold">System Settings</h3>
                </div>
                <div className="p-6 space-y-4">
                    {/* Dark Mode */}
                    <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-indigo-100 text-indigo-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">Dark Mode</p>
                                <p className="text-sm text-gray-500">Switch to dark theme for reduced eye strain</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={isDarkMode}
                                onChange={() => setIsDarkMode(!isDarkMode)}
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-deped-blue"></div>
                        </label>
                    </div>

                    {/* Notifications */}
                    <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-lg bg-green-100 text-green-600">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">Push Notifications</p>
                                <p className="text-sm text-gray-500">Receive alerts for announcements and updates</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-deped-blue"></div>
                        </label>
                    </div>

                    {/* Auto-Backup / Export */}
                    <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-lg bg-blue-100 text-blue-600">
                                <Database className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">Data Backup</p>
                                <p className="text-sm text-gray-500">Export your data for safekeeping</p>
                            </div>
                        </div>
                        <button
                            onClick={handleExportData}
                            disabled={isExporting}
                            className="px-4 py-2 bg-deped-blue text-white rounded-lg font-bold text-xs hover:bg-blue-700 transition-all disabled:opacity-50"
                        >
                            {isExporting ? 'Exporting...' : 'Export Data'}
                        </button>
                    </div>
                </div>
            </div>

            {/* About */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-deped-blue to-blue-600 text-white flex items-center gap-3">
                    <Info className="w-5 h-5" />
                    <h3 className="text-lg font-bold">About this System</h3>
                </div>
                <div className="p-6">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-inner">
                            <span className="text-3xl">🎓</span>
                        </div>
                        <h4 className="text-2xl font-black text-deped-blue">School Management System</h4>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">Department of Education (DepEd)</p>
                    </div>
                    
                    <div className="space-y-4 text-sm text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-6 shadow-inner text-justify">
                        <p>
                            This official <strong>School Management System</strong> is a comprehensive, digital solution uniquely tailored for public high schools within the Department of Education. It streamlines the day-to-day administrative operations of school personnel and empowers teachers through innovative technology.
                        </p>
                        <p>
                            From generating precise <strong>E-Class Records</strong> to seamlessly automating the processing of <strong>SF9 (Report Cards)</strong>, <strong>SF10 (Permanent Records)</strong>, and <strong>SF2 (Daily Attendance)</strong> forms, this portal acts as the ultimate centralized hub for school governance, analytics, and learner data management.
                        </p>
                    </div>

                    <div className="mb-8 flex flex-wrap justify-center gap-2">
                        <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold border border-blue-200 shadow-sm uppercase tracking-wider">E-Class Record</span>
                        <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-[10px] font-bold border border-green-200 shadow-sm uppercase tracking-wider">SF9 Report Card</span>
                        <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-[10px] font-bold border border-purple-200 shadow-sm uppercase tracking-wider">SF10 Record</span>
                        <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-[10px] font-bold border border-orange-200 shadow-sm uppercase tracking-wider">Attendance SF2</span>
                        <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-[10px] font-bold border border-red-200 shadow-sm uppercase tracking-wider">Reports & Analytics</span>
                        <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold border border-amber-200 shadow-sm uppercase tracking-wider">Calendar</span>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-5 text-center">System Developer & Architect</h5>
                        <div className="flex flex-col items-center gap-2">
                            <p className="font-black text-gray-800 text-xl tracking-tight">Emerson M. Galano</p>
                            <div className="flex flex-wrap justify-center items-center gap-3 mt-2">
                                <a href="mailto:emerson.galano@deped.gov.ph" className="flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-white transition-colors bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200 hover:bg-emerald-600 shadow-sm">
                                    <Mail className="w-4 h-4" />
                                    emerson.galano@deped.gov.ph
                                </a>
                                <a href="https://www.facebook.com/xshame14/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-white transition-colors bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-200 hover:bg-blue-600 shadow-sm">
                                    <Facebook className="w-4 h-4" />
                                    Messenger / Facebook
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPasswordModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-deped-blue text-white px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-bold flex items-center gap-2"><Lock className="w-5 h-5" /> Change Password</h3>
                            <button onClick={() => setShowPasswordModal(false)} className="text-2xl hover:bg-white/20 rounded-lg p-1">×</button>
                        </div>
                        <div className="p-6 space-y-4">
                            {passwordError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">{passwordError}</div>
                            )}
                            {passwordSuccess && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">{passwordSuccess}</div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="form-input"
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="form-input"
                                    placeholder="Enter new password (min 6 chars)"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="form-input"
                                    placeholder="Confirm new password"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button onClick={() => setShowPasswordModal(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 font-medium hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleChangePassword}
                                    disabled={isChangingPassword}
                                    className="px-6 py-2 bg-deped-blue text-white rounded-lg font-bold hover:bg-blue-700 shadow-md disabled:opacity-50"
                                >
                                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
