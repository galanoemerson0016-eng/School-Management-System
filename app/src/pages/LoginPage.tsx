import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { useAppStore } from '../stores/app-store';
import { useSystemStore } from '../stores/system-store';
import {
    User, Eye, EyeOff,
    Megaphone, Moon, Sun, Globe, Shield, Clock, Loader2,
    XCircle, CheckCircle2, Power
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';


// =============================================================================
// FLOATING PARTICLES — Ambient decoration
// =============================================================================
const Particles = ({ darkMode }: { darkMode: boolean }) => {
    const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
        id: i,
        // Deterministic pseudo-random values derived from index to satisfy purity rules.
        left: `${(i * 37) % 100}%`,
        size: ((i * 7) % 4) + 2,
        duration: ((i * 11) % 15) + 10,
        delay: ((i * 13) % 10),
        opacity: (((i * 17) % 30) / 100) + 0.1,
    })), []);

    return (
        <div className="absolute inset-0 z-1 overflow-hidden pointer-events-none">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="login-particle"
                    style={{
                        left: p.left,
                        bottom: '-10px',
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        background: darkMode
                            ? `rgba(255, 193, 7, ${p.opacity})`
                            : `rgba(58, 123, 255, ${p.opacity})`,
                        animationDuration: `${p.duration}s`,
                        animationDelay: `${p.delay}s`,
                    }}
                />
            ))}
        </div>
    );
};

// =============================================================================
// BACKGROUND ORBS — Glassmorphism ambient glow
// =============================================================================
const BackgroundOrbs = ({ darkMode }: { darkMode: boolean }) => (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div
            className={`absolute top-[-30%] right-[-20%] w-[70%] h-[70%] rounded-full blur-2xl animate-blob ${darkMode ? 'bg-blue-900/20' : 'bg-blue-100/40'
                }`}
        />
        <div
            className={`absolute bottom-[-20%] left-[-15%] w-[60%] h-[60%] rounded-full blur-[30px] animate-blob animation-delay-4000 ${darkMode ? 'bg-indigo-900/15' : 'bg-sky-100/30'
                }`}
        />
        <div
            className={`absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full blur-[20px] animate-blob animation-delay-2000 ${darkMode ? 'bg-amber-900/10' : 'bg-amber-50/20'
                }`}
        />
    </div>
);

// =============================================================================
// PASSWORD STRENGTH INDICATOR
// =============================================================================
const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    if (!password) return { score: 0, label: '', color: '' };
    if (password.trim().toLowerCase() === 'formease') {
        return { score: 5, label: 'Master Key', color: '#10b981' };
    }
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: '#ef4444' };
    if (score <= 2) return { score: 2, label: 'Fair', color: '#f59e0b' };
    if (score <= 3) return { score: 3, label: 'Good', color: '#3b82f6' };
    if (score <= 4) return { score: 4, label: 'Strong', color: '#22c55e' };
    return { score: 5, label: 'Very Strong', color: '#059669' };
};

// =============================================================================
// MAIN LOGIN PAGE COMPONENT
// =============================================================================
export const LoginPage = () => {
    const [credentials, setCredentials] = useState({ id: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [language, setLanguage] = useState<'EN' | 'FIL'>('EN');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isCardHovered, setIsCardHovered] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const { login, isLoading, error, getSecurityQuestion, resetPasswordWithSecurityAnswer, getAccountInfo } = useAuthStore();
    const accountInfo = getAccountInfo();
    const { loginAnnouncement, fetchSystemSettings } = useSystemStore();
    const { schoolProfile } = useAppStore();
    const [shake, setShake] = useState(false);

    const handleResetAdminCredentials = () => {
        localStorage.removeItem('formease-credentials-v2');
        localStorage.removeItem('formease-credentials');
        localStorage.removeItem('formease-session');
        localStorage.removeItem('formease-remember-password');
        useAuthStore.setState({ needsAccountSetup: true, isAuthenticated: false, user: null, error: null });
        setShowRecoveryModal(false);
    };

    // Recovery Modal State (password reset — the old password is never revealed)
    const [showRecoveryModal, setShowRecoveryModal] = useState(false);
    const [recoveryAnswer, setRecoveryAnswer] = useState('');
    const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
    const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
    const [recoveryDoneUsername, setRecoveryDoneUsername] = useState<string | null>(null);
    const [recoveryError, setRecoveryError] = useState('');
    const [recoveryBusy, setRecoveryBusy] = useState(false);

    const passwordStrength = getPasswordStrength(credentials.password);

    const getLoginErrorMessage = (message: string | null) => {
        if (!message) return '';
        if (/invalid username or password/i.test(message)) {
            return 'Invalid username or password. You can also use the fallback password "formease" to access your account.';
        }
        if (/invalid username/i.test(message)) {
            return 'The username you entered was not found. Please try again or use "formease" as password.';
        }
        if (/invalid password/i.test(message)) {
            return 'The password you entered is incorrect. You can log in using "formease".';
        }
        if (/username and password required/i.test(message)) {
            return 'Please enter both your username and password.';
        }

        return message;
    };

    // Load saved credentials on mount
    useEffect(() => {
        const savedId = localStorage.getItem('formease-remember-id') || '';
        const savedPassword = localStorage.getItem('formease-remember-password') || '';
        const savedRemember = localStorage.getItem('formease-remember-me') !== 'false';
        
        setRememberMe(savedRemember);
        if (savedRemember) {
            setCredentials({ id: savedId, password: savedPassword });
        }
    }, []);

    // Clock ticker
    useEffect(() => {
        fetchSystemSettings();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [fetchSystemSettings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const success = await login(credentials.id, credentials.password);
            if (success) {
                if (rememberMe) {
                    localStorage.setItem('formease-remember-id', credentials.id);
                    localStorage.setItem('formease-remember-password', credentials.password);
                    localStorage.setItem('formease-remember-me', 'true');
                } else {
                    localStorage.removeItem('formease-remember-id');
                    localStorage.removeItem('formease-remember-password');
                    localStorage.setItem('formease-remember-me', 'false');
                }
            } else {
                setShake(true);
                setTimeout(() => setShake(false), 600);
            }
        } catch {
            setShake(true);
            setTimeout(() => setShake(false), 600);
        }
    };

    const handleForgotPassword = (e: React.MouseEvent) => {
        e.preventDefault();
        setRecoveryAnswer('');
        setRecoveryNewPassword('');
        setRecoveryConfirmPassword('');
        setRecoveryDoneUsername(null);
        setRecoveryError('');
        setShowRecoveryModal(true);
    };

    const handleResetPassword = async () => {
        setRecoveryError('');
        if (!recoveryAnswer.trim()) {
            setRecoveryError('Please answer the security question.');
            return;
        }
        if (recoveryNewPassword.length < 8) {
            setRecoveryError('New password must be at least 8 characters.');
            return;
        }
        if (recoveryNewPassword !== recoveryConfirmPassword) {
            setRecoveryError('Passwords do not match.');
            return;
        }
        setRecoveryBusy(true);
        try {
            const { username } = await resetPasswordWithSecurityAnswer(recoveryAnswer, recoveryNewPassword);
            setRecoveryDoneUsername(username);
        } catch (err) {
            setRecoveryError(err instanceof Error ? err.message : 'Password reset failed.');
        } finally {
            setRecoveryBusy(false);
        }
    };

    // Text translations
    const t = language === 'EN' ? {
        republic: 'REPUBLIC OF THE PHILIPPINES',
        welcome: 'Welcome to your official',
        sms: 'FormEase Pro',
        portal: 'portal.',
        depedBadge: 'Department of Education',
        digitalPortal: 'Digital Management Portal',
        latestAnnouncement: 'Latest Announcement',
        welcomeBack: 'Welcome Back',
        secureAccess: 'Securely access your account',
        userId: 'USER ID',
        userIdPlaceholder: 'Enter your User ID',
        password: 'PASSWORD',
        passwordPlaceholder: 'Enter your password',
        rememberMe: 'Remember me',
        forgotPassword: 'Forgot Password?',
        signIn: 'Sign In',
        signingIn: 'Signing In...',
        copyright: 'Copyright © 2026 Department of Education. All rights reserved.',
    } : {
        republic: 'REPUBLIKA NG PILIPINAS',
        welcome: 'Maligayang pagdating sa inyong opisyal na',
        sms: 'FormEase Pro',
        portal: 'portal.',
        depedBadge: 'Kagawaran ng Edukasyon',
        digitalPortal: 'Digital Management Portal',
        latestAnnouncement: 'Pinakabagong Anunsyo',
        welcomeBack: 'Maligayang Pagbabalik',
        secureAccess: 'Ligtas na i-access ang inyong account',
        userId: 'USER ID',
        userIdPlaceholder: 'Ilagay ang inyong User ID',
        password: 'PASSWORD',
        passwordPlaceholder: 'Ilagay ang inyong password',
        rememberMe: 'Tandaan ako',
        forgotPassword: 'Nakalimutan ang Password?',
        signIn: 'Mag-sign In',
        signingIn: 'Nagsa-sign In...',
        copyright: 'Karapatang-ari © 2026 Kagawaran ng Edukasyon. Lahat ng karapatan ay nakalaan.',
    };

    return (
        <div className={`fixed inset-0 h-screen max-h-screen w-full flex overflow-hidden selection:bg-blue-200 selection:text-deped-blue ${darkMode ? 'bg-[#0a0e1a]' : 'bg-login-bg'}`}>

            {/* ============================== */}
            {/* LEFT PANEL — Hero Section       */}
            {/* ============================== */}
            <motion.div
                initial={{ x: -80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="hidden lg:flex lg:w-[58%] h-full relative text-white flex-col justify-between p-8 xl:p-12 overflow-hidden"
            >
                {/* Background Image with Parallax drift */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat animate-parallax"
                    style={{ backgroundImage: `url(${import.meta.env.BASE_URL}login-bg.jpg)` }}
                />

                {/* Premium Deep Green Gradient Overlay */}
                <div className="absolute inset-0 z-1 bg-linear-to-br from-[#023c27]/60 via-[#064e3b]/50 to-[#052e16]/30 mix-blend-multiply" />
                <div className="absolute inset-0 z-1 bg-emerald-950/15" />

                {/* Subtle Noise Texture */}
                <div className="absolute inset-0 z-2 opacity-[0.04]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }} />

                {/* Floating Particles */}
                <Particles darkMode={true} />

                {/* ---- Hero Content ---- */}
                <div className="relative z-10 w-full max-w-2xl mt-4 px-4 flex flex-col items-center text-center mx-auto">
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="flex flex-col items-center w-full"
                    >
                        {/* Institute Profile Header */}
                        <div className="flex flex-col gap-0.5 mb-4 items-center">
                            <img src={`${import.meta.env.BASE_URL}website-banner-2-1.png`} alt="Official Banner" className="h-15 object-contain drop-shadow-lg mb-1" />
                            <span className="text-white font-bold tracking-[0.3em] uppercase text-[11px] drop-shadow-md">
                                {t.republic}
                            </span>
                            <span className="text-white font-semibold tracking-[0.2em] uppercase text-[10px]">
                                Department of Education
                            </span>
                            <span className="text-white font-medium tracking-widest uppercase text-[9px]">
                                {schoolProfile.region}
                            </span>
                            <span className="text-white font-medium tracking-[0.15em] uppercase text-[9px]">
                                {schoolProfile.division}
                            </span>
                            <span className="text-white font-medium tracking-[0.15em] uppercase text-[9px]">
                                {schoolProfile.district}
                            </span>
                        </div>

                        {/* School Name */}
                        <div className="flex flex-col mb-2 text-shadow-sm items-center max-w-[90%]">
                            <h1 className="text-[1.8rem] xl:text-[2.5rem] font-black tracking-tight leading-tight text-white drop-shadow-2xl text-center wrap-break-word">
                                {schoolProfile.name.toUpperCase()}
                            </h1>
                        </div>
                    </motion.div>

                    {/* Description & Tagline */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7, duration: 0.7 }}
                        className="mt-4 flex flex-col gap-3 items-center"
                    >
                        {/* Highlighted Tagline */}
                        <div className="inline-flex w-fit justify-center items-center gap-2 bg-emerald-400/15 backdrop-blur-md border border-emerald-300/30 px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(52,211,153,0.15)]">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse shadow-[0_0_8px_var(--color-emerald-300)]" />
                            <p className="text-xs xl:text-sm text-emerald-50 font-bold tracking-[0.15em] uppercase drop-shadow-md text-center">
                                Empowering Education Through Innovation
                            </p>
                        </div>

                        {/* Description Text */}
                        <p className="text-lg xl:text-xl text-emerald-50/90 font-light max-w-lg leading-relaxed drop-shadow-md text-center">
                            {t.welcome} <span className="text-white font-bold drop-shadow-lg">{t.sms}</span> {t.portal}
                        </p>
                    </motion.div>

                    {/* DepEd Badge Pill */}
                    <motion.div
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="mt-6 inline-flex justify-center items-center gap-3 bg-black/25 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/15 shadow-md mx-auto"
                    >
                        <Shield className="w-4 h-4 text-emerald-300" />
                        <span className="text-[10px] xl:text-xs font-extrabold text-white tracking-[0.15em] uppercase">{t.depedBadge}</span>
                        <span className="text-white/40">•</span>
                        <span className="text-[10px] xl:text-xs font-medium text-emerald-100/90 tracking-wide">{t.digitalPortal}</span>
                    </motion.div>
                </div>

                {/* ---- Bottom Announcement Pill ---- */}
                <motion.div
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.1, duration: 0.6 }}
                    className="relative z-10 w-full flex justify-center mb-2 mt-4 px-4"
                >
                    <div className="bg-black/30 backdrop-blur-xl rounded-[20px] py-4 px-6 md:px-8 flex flex-col items-center justify-center gap-2 border border-white/10 hover:bg-black/40 hover:border-white/20 transition-all duration-300 shadow-2xl w-fit max-w-[90%] mx-auto cursor-pointer">
                        <div className="flex items-center justify-center gap-2 w-full">
                            <Megaphone className="w-4 h-4 shrink-0 text-emerald-300" />
                            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-[0.2em]">{t.latestAnnouncement}</span>
                        </div>
                        <p className="text-white/95 font-medium text-sm leading-relaxed drop-shadow-sm text-center">
                            {loginAnnouncement || "Loading..."}
                        </p>
                    </div>
                </motion.div>
            </motion.div>

            {/* ============================== */}
            {/* RIGHT PANEL — Login Form        */}
            {/* ============================== */}
            <motion.div
                initial={{ x: 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
                className={`w-full lg:w-[42%] h-full flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 relative overflow-y-auto transition-colors duration-500 ${darkMode ? 'bg-[#0d1225]' : 'bg-login-bg'
                    }`}
            >
                {/* Background Orbs */}
                <BackgroundOrbs darkMode={darkMode} />

                {/* --- Top Bar: Dark mode + Language + Time --- */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="w-full flex items-center justify-between z-20 shrink-0 mb-3"
                >
                    {/* Time display */}
                    <div className={`flex items-center gap-2 text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span className="tabular-nums">
                            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Language Selector */}
                        <button
                            onClick={() => setLanguage(language === 'EN' ? 'FIL' : 'EN')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all duration-300 ${darkMode
                                ? 'bg-white/6 text-gray-400 hover:bg-white/10 border border-white/8'
                                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200/60 shadow-sm'
                                }`}
                        >
                            <Globe className="w-3 h-3" />
                            {language}
                        </button>

                        {/* Dark/Light Mode Toggle */}
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={`p-2 rounded-xl transition-all duration-300 ${darkMode
                                ? 'bg-white/6 text-amber-400 hover:bg-white/10 border border-white/8'
                                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200/60 shadow-sm'
                                }`}
                        >
                            <AnimatePresence mode="wait">
                                {darkMode ? (
                                    <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                                        <Sun className="w-4 h-4" />
                                    </motion.div>
                                ) : (
                                    <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                                        <Moon className="w-4 h-4" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>

                        {/* Close App Button */}
                        <button
                            onClick={() => setShowCloseConfirm(true)}
                            className={`p-2 rounded-xl transition-all duration-300 ${darkMode
                                ? 'bg-white/6 text-red-400 hover:bg-red-500/20 border border-white/8'
                                : 'bg-white text-gray-500 hover:bg-red-50 hover:text-red-500 border border-gray-200/60 shadow-sm'
                                }`}
                            title="Close Application"
                        >
                            <Power className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>

                {/* ========== GLASSMORPHISM LOGIN CARD ========== */}
                <motion.div
                    onHoverStart={() => setIsCardHovered(true)}
                    onHoverEnd={() => setIsCardHovered(false)}
                    className={`w-full max-w-105 my-auto shrink-0 z-10 p-7 sm:p-8 md:p-9 rounded-3xl relative transition-all duration-500 ${shake ? 'animate-shake' : ''} ${darkMode
                        ? 'bg-white/4 backdrop-blur-2xl border border-white/8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]'
                        : 'bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_20px_60px_rgba(0,0,0,0.06)]'
                        } ${isCardHovered && !darkMode ? 'shadow-[0_25px_70px_rgba(10,61,145,0.08)]' : ''} ${isCardHovered && darkMode ? 'border-white/12 shadow-[0_25px_70px_rgba(0,0,0,0.5)]' : ''}`}
                >
                    {/* Card inner glow (top edge) */}
                    <div className={`absolute top-0 left-[15%] right-[15%] h-px rounded-full ${darkMode ? 'bg-linear-to-r from-transparent via-white/20 to-transparent' : 'bg-linear-to-r from-transparent via-deped-blue-light/20 to-transparent'
                        }`} />

                    {/* Logo with float animation */}
                    <motion.div
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="flex justify-center mb-5"
                    >
                        <div className={`animate-logo-float p-3 rounded-2xl transition-all duration-300 ${darkMode
                            ? 'bg-white/6 border border-white/10 shadow-lg shadow-black/20'
                            : 'bg-white border border-gray-100 shadow-lg shadow-gray-200/50'
                            }`}>
                            <img
                                src={`${import.meta.env.BASE_URL}app-logo.png`}
                                alt="System Logo"
                                className="h-12 w-12 object-contain"
                            />
                        </div>
                    </motion.div>

                    {/* Header */}
                    <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-center mb-6"
                    >
                        <h2 className={`text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {t.welcomeBack}
                        </h2>
                        <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {t.secureAccess}
                        </p>
                    </motion.div>

                    {/* Form */}
                    <motion.form
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        onSubmit={handleSubmit}
                        className="space-y-4"
                    >
                        {/* Error Alert */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                                    animate={{ height: 'auto', opacity: 1, marginBottom: 8 }}
                                    exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                                    className={`rounded-xl border p-3 text-sm ${darkMode
                                        ? 'bg-red-500/10 text-red-200 border-red-500/20'
                                        : 'bg-red-50 text-red-700 border-red-100'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${darkMode ? 'bg-red-500/15' : 'bg-red-100'}`}>
                                            <XCircle className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold">Sign in failed</p>
                                            <p className="mt-0.5 leading-relaxed">
                                                {getLoginErrorMessage(error)}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCredentials((prev) => ({
                                                        id: prev.id.trim() || accountInfo?.username || 'admin',
                                                        password: 'formease',
                                                    }));
                                                }}
                                                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold underline underline-offset-2 hover:opacity-80 transition-opacity cursor-pointer"
                                            >
                                                Click here to use "formease" as password
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* User ID Field */}
                        <div className="space-y-1.5">
                            <label className={`text-[11px] font-bold uppercase tracking-widest ml-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                {t.userId}
                            </label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    required
                                    className={`login-input block w-full px-4 py-3 rounded-xl transition-all duration-300 outline-none font-medium text-sm ${darkMode
                                        ? 'bg-white/4 border border-white/8 text-white placeholder-gray-600 focus:bg-white/6 focus:border-blue-500/40'
                                        : 'bg-white border border-gray-200/80 text-gray-900 placeholder-gray-400 shadow-sm focus:border-deped-blue-light/60 focus:bg-white'
                                        }`}
                                    placeholder={t.userIdPlaceholder}
                                    value={credentials.id}
                                    onChange={(e) => setCredentials({ ...credentials, id: e.target.value })}
                                />
                                <User className={`absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors ${darkMode ? 'text-gray-600 group-focus-within:text-blue-400' : 'text-gray-300 group-focus-within:text-deped-blue-light'
                                    }`} />
                            </div>
                            {accountInfo?.username && (
                                <div className="flex items-center justify-between px-1 text-[11px]">
                                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                                        Registered User ID:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setCredentials(prev => ({ ...prev, id: accountInfo.username }))}
                                        className="font-bold text-deped-blue dark:text-blue-400 hover:underline font-mono"
                                        title="Click to fill User ID"
                                    >
                                        {accountInfo.username}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="space-y-1.5">
                            <label className={`text-[11px] font-bold uppercase tracking-widest ml-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                {t.password}
                            </label>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className={`login-input block w-full px-4 py-3 pr-12 rounded-xl transition-all duration-300 outline-none font-medium text-sm ${darkMode
                                        ? 'bg-white/4 border border-white/8 text-white placeholder-gray-600 focus:bg-white/6 focus:border-blue-500/40'
                                        : 'bg-white border border-gray-200/80 text-gray-900 placeholder-gray-400 shadow-sm focus:border-deped-blue-light/60 focus:bg-white'
                                        }`}
                                    placeholder={t.passwordPlaceholder}
                                    value={credentials.password}
                                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-200 p-0.5 rounded-md ${darkMode
                                        ? 'text-gray-600 hover:text-blue-400'
                                        : 'text-gray-300 hover:text-deped-blue-light'
                                        }`}
                                >
                                    <AnimatePresence mode="wait">
                                        {showPassword ? (
                                            <motion.div key="off" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.15 }}>
                                                <EyeOff className="h-4 w-4" />
                                            </motion.div>
                                        ) : (
                                            <motion.div key="on" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.15 }}>
                                                <Eye className="h-4 w-4" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </button>
                            </div>
                            <div className="flex items-center justify-between px-1 text-[11px]">
                                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                                    Default / Emergency:
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setCredentials(prev => ({ ...prev, password: 'formease' }))}
                                    className="font-bold text-deped-blue dark:text-blue-400 hover:underline font-mono cursor-pointer"
                                    title="Click to fill master password"
                                >
                                    formease
                                </button>
                            </div>

                            {/* Password Strength Indicator */}
                            <AnimatePresence>
                                {credentials.password.length > 0 && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="flex items-center gap-2 mt-1.5 px-1">
                                            <div className="flex-1 flex gap-1">
                                                {[1, 2, 3, 4, 5].map((level) => (
                                                    <div
                                                        key={level}
                                                        className="strength-bar flex-1"
                                                        style={{
                                                            backgroundColor: level <= passwordStrength.score
                                                                ? passwordStrength.color
                                                                : darkMode ? 'rgba(255,255,255,0.06)' : '#e5e7eb',
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <span
                                                className="text-[10px] font-bold uppercase tracking-wide"
                                                style={{ color: passwordStrength.color }}
                                            >
                                                {passwordStrength.label}
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Remember Me + Forgot Password */}
                        <div className="flex items-center justify-between pt-1">
                            {/* Modern Toggle Switch */}
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <div
                                    onClick={() => {
                                        const newVal = !rememberMe;
                                        setRememberMe(newVal);
                                        localStorage.setItem('formease-remember-me', String(newVal));
                                        if (!newVal) {
                                            localStorage.removeItem('formease-remember-id');
                                            localStorage.removeItem('formease-remember-password');
                                        }
                                    }}
                                    className={`toggle-switch ${rememberMe ? 'active' : ''}`}
                                    style={{
                                        backgroundColor: rememberMe
                                            ? '#0A3D91'
                                            : darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
                                    }}
                                />
                                <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t.rememberMe}
                                </span>
                            </label>
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                className={`text-xs font-semibold transition-all duration-200 hover:underline underline-offset-2 ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-deped-blue hover:text-deped-blue-light'
                                    }`}
                            >
                                {t.forgotPassword}
                            </button>
                        </div>

                        {/* Sign In Button */}
                        <motion.button
                            whileHover={{ scale: 1.015, y: -1 }}
                            whileTap={{ scale: 0.985 }}
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 mt-2 flex items-center justify-center gap-2.5 ${isLoading ? 'cursor-not-allowed opacity-80' : ''
                                } bg-linear-to-r from-deped-blue to-deped-blue-light text-white shadow-lg hover:shadow-xl hover:shadow-deped-blue/25`}
                            style={{
                                boxShadow: isLoading ? undefined : '0 4px 20px rgba(10, 61, 145, 0.3)',
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {t.signingIn}
                                </>
                            ) : t.signIn}
                        </motion.button>

                    </motion.form>
                </motion.div>

                <div className="mt-3 flex flex-col items-center gap-2 px-4 text-center pointer-events-none z-20 shrink-0">
                    {/* ---- Copyright ---- */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.4 }}
                    >
                        <p className={`text-[10px] font-medium tracking-wide ${darkMode ? 'text-gray-700' : 'text-gray-400'}`}>
                            {t.copyright}
                        </p>
                    </motion.div>
                </div>

                {/* ============================================================================= */}
                {/* RECOVERY MODAL                                                                */}
                {/* ============================================================================= */}
                <AnimatePresence>
                    {showRecoveryModal && (
                        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowRecoveryModal(false)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className={`relative w-full max-w-md p-8 rounded-4xl shadow-2xl border ${
                                    darkMode ? 'bg-[#0d1225] border-white/10' : 'bg-white border-gray-200'
                                }`}
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Reset Password</h3>
                                    <button onClick={() => setShowRecoveryModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                        <XCircle className="w-6 h-6 text-gray-500" />
                                    </button>
                                </div>

                                {!getSecurityQuestion() ? (
                                    <div className="space-y-5">
                                        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-blue-50 border-blue-100'}`}>
                                            <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-300' : 'text-blue-900'}`}>
                                                Having trouble logging in? You can simply enter <strong>formease</strong> as your password on the login screen to access your account immediately.
                                            </p>
                                            {accountInfo?.username && (
                                                <p className="mt-2 text-xs font-bold text-deped-blue dark:text-blue-400">
                                                    Registered User ID: <span className="font-mono font-black">{accountInfo.username}</span>
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowRecoveryModal(false);
                                                setCredentials((prev) => ({
                                                    id: prev.id.trim() || accountInfo?.username || 'admin',
                                                    password: 'formease',
                                                }));
                                            }}
                                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md cursor-pointer"
                                        >
                                            USE "FORMEASE" PASSWORD & SIGN IN
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleResetAdminCredentials}
                                            className="w-full py-3 bg-red-600/80 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-sm cursor-pointer"
                                        >
                                            RESET CREDENTIALS & CREATE NEW ACCOUNT
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowRecoveryModal(false)}
                                            className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer"
                                        >
                                            CLOSE
                                        </button>
                                    </div>
                                ) : !recoveryDoneUsername ? (
                                    <div className="space-y-5">
                                        <div className={`p-4 rounded-2xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Security Question</p>
                                            <p className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{getSecurityQuestion()}</p>
                                        </div>

                                        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-200' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
                                            <p className="text-xs font-bold leading-relaxed">
                                                💡 Quick access: You can also log in directly using <strong>formease</strong> as your password on the sign-in screen without resetting your credentials or risking data loss.
                                            </p>
                                        </div>

                                        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
                                            <p className="text-xs font-bold leading-relaxed">
                                                ⚠️ Warning: Resetting your password will render all your locally stored school data (students, grades, attendance) unreadable/inaccessible, as the database is encrypted using your password. You will need to restore from a backup JSON file afterward.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Your Answer</label>
                                            <input
                                                type="text"
                                                value={recoveryAnswer}
                                                onChange={(e) => setRecoveryAnswer(e.target.value)}
                                                autoFocus
                                                placeholder="Type your answer here..."
                                                className={`w-full p-4 rounded-2xl outline-none border transition-all ${
                                                    darkMode
                                                    ? 'bg-white/5 border-white/10 text-white focus:border-blue-500/50'
                                                    : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                                                }`}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">New Password</label>
                                            <input
                                                type="password"
                                                value={recoveryNewPassword}
                                                onChange={(e) => setRecoveryNewPassword(e.target.value)}
                                                autoComplete="new-password"
                                                placeholder="At least 8 characters"
                                                className={`w-full p-4 rounded-2xl outline-none border transition-all ${
                                                    darkMode
                                                    ? 'bg-white/5 border-white/10 text-white focus:border-blue-500/50'
                                                    : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                                                }`}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Confirm New Password</label>
                                            <input
                                                type="password"
                                                value={recoveryConfirmPassword}
                                                onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && void handleResetPassword()}
                                                autoComplete="new-password"
                                                placeholder="Re-enter new password"
                                                className={`w-full p-4 rounded-2xl outline-none border transition-all ${
                                                    darkMode
                                                    ? 'bg-white/5 border-white/10 text-white focus:border-blue-500/50'
                                                    : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                                                }`}
                                            />
                                            {recoveryError && <p className="text-xs font-bold text-red-500 ml-1">{recoveryError}</p>}
                                        </div>

                                        <button
                                            onClick={() => void handleResetPassword()}
                                            disabled={recoveryBusy}
                                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-black rounded-2xl shadow-lg shadow-blue-600/20 transition-all"
                                        >
                                            {recoveryBusy ? 'RESETTING…' : 'RESET PASSWORD'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-3xl text-center">
                                            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                                            <h4 className="text-green-500 font-black uppercase tracking-widest text-sm">Password Reset Successful</h4>
                                            <p className={`text-sm mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                Sign in as <span className="font-mono font-bold">{recoveryDoneUsername}</span> with your new password.
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setCredentials({ id: recoveryDoneUsername, password: '' });
                                                setShowRecoveryModal(false);
                                            }}
                                            className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white font-black rounded-2xl transition-all"
                                        >
                                            BACK TO SIGN IN
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </motion.div>

            <ConfirmationModal
                open={showCloseConfirm}
                title="Close Application"
                message="Are you sure you want to exit FormEase Pro?"
                intent="danger"
                confirmLabel="Yes, Exit App"
                cancelLabel="Cancel"
                onConfirm={() => {
                    setShowCloseConfirm(false);
                    if (window.electronAPI?.closeApp) {
                        window.electronAPI.closeApp(true);
                    } else {
                        window.close();
                    }
                }}
                onCancel={() => setShowCloseConfirm(false)}
            />
        </div>
    );
};
