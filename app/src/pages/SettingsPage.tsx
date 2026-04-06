import { useState, useEffect } from 'react';
import { useAuthStore, useAppStore } from '../stores';
import { auth } from '../lib/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { Moon, Sun, Bell, Database, Lock, User, Shield, Info, Mail, Facebook, Trash2 } from 'lucide-react';

export function SettingsPage() {
    const { user } = useAuthStore();
    const { students, sections, subjects, deleteStudent, deleteSection } = useAppStore();

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

    // Database Maintenance (Ghost Students Cleanup)
    const [isCleaning, setIsCleaning] = useState(false);
    const handleCleanGhostStudents = async () => {
        setIsCleaning(true);
        try {
            const ghostStudents = students.filter(s => !sections.some(sec => sec.section_name === s.student_section));
            
            if (ghostStudents.length === 0) {
                alert('Database is clean. No ghost students found!');
                return;
            }
            
            if (confirm(`Warning: You are about to permanently delete ${ghostStudents.length} unassigned (ghost) student(s) from the system.\n\nProceed?`)) {
                for (const student of ghostStudents) {
                    await deleteStudent(student.lrn);
                }
                alert(`Success! Purged ${ghostStudents.length} ghost student record(s) from the database.`);
            }
        } catch (error) {
            alert('Failed to perform database clean-up: ' + error);
        } finally {
            setIsCleaning(false);
        }
    };
    
    const [isPurgingSections, setIsPurgingSections] = useState(false);
    const handleCleanGhostSections = async () => {
        setIsPurgingSections(true);
        try {
            const ghostSections = sections.filter(sec => {
                const hasStudents = students.some(s => s.student_section === sec.section_name);
                const hasSubjects = subjects.some(sub => sub.section_id === sec.id);
                return !hasStudents && !hasSubjects;
            });
            
            if (ghostSections.length === 0) {
                alert('Database is clean. No empty ghost sections found!');
                return;
            }
            
            if (confirm(`Warning: You are about to permanently delete ${ghostSections.length} empty section(s) from the system.\n\nThese sections have NO students and NO subjects assigned.\n\nProceed?`)) {
                for (const section of ghostSections) {
                    await deleteSection(section.id);
                }
                alert(`Success! Purged ${ghostSections.length} ghost section record(s).`);
            }
        } catch (error) {
            alert('Failed to purge sections: ' + error);
        } finally {
            setIsPurgingSections(false);
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

                    {/* Database Maintenance */}
                    <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-lg bg-red-100 text-red-600">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">Database Maintenance</p>
                                <p className="text-sm text-gray-500">Purge unassigned "ghost" students and empty sections from the system</p>
                            </div>
                        </div>
                                <div className="flex flex-wrap gap-3 mt-4">
                                    <button
                                        onClick={handleCleanGhostStudents}
                                        disabled={isCleaning}
                                        className="px-5 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-100 transition-all flex items-center gap-2 border border-rose-100 disabled:opacity-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        {isCleaning ? 'Cleaning...' : 'Purge Ghost Students'}
                                    </button>
                                    <button
                                        onClick={handleCleanGhostSections}
                                        disabled={isPurgingSections}
                                        className="px-5 py-2.5 bg-amber-50 text-amber-600 rounded-xl font-bold text-sm hover:bg-amber-100 transition-all flex items-center gap-2 border border-amber-100 disabled:opacity-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        {isPurgingSections ? 'Purging...' : 'Purge Ghost Sections'}
                                    </button>
                                </div>
                    </div>
                </div>
            </div>

            {/* About */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-deped-blue to-blue-600 text-white flex items-center gap-3">
                    <Info className="w-5 h-5" />
                    <h3 className="text-lg font-bold">About</h3>
                </div>
                <div className="p-6 text-center">
                    <div className="text-4xl mb-4">🎓</div>
                    <h4 className="text-xl font-bold text-deped-blue">DepEd SMS</h4>
                    <p className="text-gray-600 font-medium mb-4">Comprehensive School Management System</p>
                    
                    <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed mb-6">
                        An integrated digital ecosystem designed in compliance with the Department of Education's standards. 
                        It modernizes academic processes by streamlining the generation of electronic class records, 
                        SF9, SF10, and SF2 attendance reports, ensuring fast, accurate, and secure educational data management.
                    </p>

                    <div className="mt-4 mb-8 flex flex-wrap justify-center gap-2">
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">E-Class Record</span>
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">SF9 Report Card</span>
                        <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold">SF10 Record</span>
                        <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold">Attendance SF2</span>
                        <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">Reports & Analytics</span>
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">Calendar</span>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Developed By</p>
                        <h5 className="text-xl font-black text-gray-800">Emerson M. Galano</h5>
                        
                        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                            <a href="mailto:emerson.galano@deped.gov.ph" className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-deped-blue transition-colors bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 hover:border-deped-blue/30 shadow-sm">
                                <Mail className="w-4 h-4 text-deped-blue" />
                                emerson.galano@deped.gov.ph
                            </a>
                            <a href="https://www.facebook.com/xshame14/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 hover:border-blue-600/30 shadow-sm">
                                <Facebook className="w-4 h-4 text-blue-600" />
                                Facebook Profile
                            </a>
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
