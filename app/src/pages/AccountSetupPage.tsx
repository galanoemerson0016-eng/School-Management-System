import { useState } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { useAppStore } from '../stores/app-store';
import { ShieldCheck, User, Lock, Mail, KeyRound, Eye, EyeOff, AlertCircle } from 'lucide-react';

/**
 * First-run account setup.
 *
 * Shown when no local account exists (fresh install, or a legacy install
 * that was still using the old factory-default credentials). There are no
 * default credentials anymore — the user must create their own account
 * before reaching the login screen.
 */
export function AccountSetupPage() {
    const { createAccount, isLoading, error } = useAuthStore();
    const { schoolProfile } = useAppStore();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');

        if (username.trim().length < 3) {
            setLocalError('Username must be at least 3 characters.');
            return;
        }
        if (password.length < 8) {
            setLocalError('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setLocalError('Passwords do not match.');
            return;
        }
        if ((securityQuestion.trim() && !securityAnswer.trim()) || (!securityQuestion.trim() && securityAnswer.trim())) {
            setLocalError('Provide both a security question and an answer, or leave both blank.');
            return;
        }

        await createAccount({
            username,
            password,
            email: email || undefined,
            securityQuestion: securityQuestion || undefined,
            securityAnswer: securityAnswer || undefined,
        });
    };

    const displayError = localError || error;

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-deped-blue via-deped-blue-dark to-[#051d45] p-4 overflow-y-auto">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 my-8">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-deped-blue/10 text-deped-blue flex items-center justify-center mb-4">
                        <ShieldCheck className="w-7 h-7" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">Set up your account</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {schoolProfile?.name ? `${schoolProfile.name} · ` : ''}Create the administrator account for this installation. There are no default credentials.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoFocus
                                autoComplete="username"
                                placeholder="Choose a username"
                                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none transition focus:border-deped-blue focus:ring-2 focus:ring-deped-blue/15"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="new-password"
                                placeholder="At least 8 characters"
                                className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg outline-none transition focus:border-deped-blue focus:ring-2 focus:ring-deped-blue/15"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                tabIndex={-1}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                                placeholder="Re-enter your password"
                                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none transition focus:border-deped-blue focus:ring-2 focus:ring-deped-blue/15"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Email <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                placeholder="you@example.com"
                                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none transition focus:border-deped-blue focus:ring-2 focus:ring-deped-blue/15"
                            />
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2 mb-3">
                            <KeyRound className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-700">Password recovery <span className="text-slate-400 font-normal">(recommended)</span></span>
                        </div>
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={securityQuestion}
                                onChange={(e) => setSecurityQuestion(e.target.value)}
                                placeholder="Security question (e.g., name of your first pet)"
                                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none transition focus:border-deped-blue focus:ring-2 focus:ring-deped-blue/15"
                            />
                            <input
                                type="text"
                                value={securityAnswer}
                                onChange={(e) => setSecurityAnswer(e.target.value)}
                                placeholder="Answer"
                                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg outline-none transition focus:border-deped-blue focus:ring-2 focus:ring-deped-blue/15"
                            />
                            <p className="text-xs text-slate-400 leading-relaxed">
                                If you skip this, a forgotten password can only be recovered by reactivating the application.
                            </p>
                        </div>
                    </div>

                    {displayError && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-600">{displayError}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-deped-blue hover:bg-deped-blue-dark disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                        {isLoading ? 'Creating account…' : 'Create Account & Continue'}
                    </button>

                    <button
                        type="button"
                        onClick={() => useAuthStore.setState({ needsAccountSetup: false })}
                        className="w-full py-2.5 text-xs text-slate-500 hover:text-deped-blue font-semibold transition-colors cursor-pointer"
                    >
                        Already have an account? Back to Sign In
                    </button>
                </form>
            </div>
        </div>
    );
}
