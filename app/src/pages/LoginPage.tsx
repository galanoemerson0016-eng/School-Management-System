import { useState, useEffect, useMemo } from 'react';
import { useAuthStore, useAppStore } from '../stores';
import { useSystemStore } from '../stores/system-store';
import {
    User, Eye, EyeOff, GraduationCap, BookOpen, ScrollText, School,
    Megaphone, Moon, Sun, Globe, Shield, Clock, Loader2, Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
        <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
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
            className={`absolute top-[-30%] right-[-20%] w-[70%] h-[70%] rounded-full blur-[40px] animate-blob ${darkMode ? 'bg-blue-900/20' : 'bg-blue-100/40'
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
// FLOATING EDUCATION ICONS — Subtle background decoration on right panel
// =============================================================================
const FloatingIcons = ({ darkMode }: { darkMode: boolean }) => {
    const iconColor = darkMode ? 'text-white/[0.04]' : 'text-deped-blue/[0.06]';
    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <motion.div
                animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute top-[8%] left-[8%] ${iconColor}`}
            >
                <GraduationCap size={56} />
            </motion.div>
            <motion.div
                animate={{ y: [0, 15, 0], rotate: [0, -3, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                className={`absolute top-[18%] right-[12%] ${iconColor}`}
            >
                <BookOpen size={48} />
            </motion.div>
            <motion.div
                animate={{ y: [0, -12, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 3 }}
                className={`absolute bottom-[22%] left-[12%] ${iconColor}`}
            >
                <ScrollText size={52} />
            </motion.div>
            <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className={`absolute bottom-[8%] right-[8%] ${iconColor}`}
            >
                <School size={64} />
            </motion.div>
        </div>
    );
};

// =============================================================================
// PASSWORD STRENGTH INDICATOR
// =============================================================================
const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    if (!password) return { score: 0, label: '', color: '' };
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

    const { login, isLoading, error } = useAuthStore();
    const { loginAnnouncement, fetchSystemSettings } = useSystemStore();
    const { schoolProfile } = useAppStore();
    const [shake, setShake] = useState(false);

    const passwordStrength = getPasswordStrength(credentials.password);

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
            if (!success) {
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
        alert(language === 'EN'
            ? "Please contact your School Administrator to reset your password."
            : "Mangyaring makipag-ugnayan sa inyong School Administrator upang i-reset ang inyong password."
        );
    };

    // Text translations
    const t = language === 'EN' ? {
        republic: 'REPUBLIC OF THE PHILIPPINES',
        welcome: 'Welcome to your official',
        sms: 'Student Management System',
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
        systemStatus: 'All Systems Operational',
        copyright: 'Copyright © 2026 Department of Education. All rights reserved.',
    } : {
        republic: 'REPUBLIKA NG PILIPINAS',
        welcome: 'Maligayang pagdating sa inyong opisyal na',
        sms: 'Student Management System',
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
        systemStatus: 'Lahat ng Sistema ay Gumagana',
        copyright: 'Karapatang-ari © 2026 Kagawaran ng Edukasyon. Lahat ng karapatan ay nakalaan.',
    };

    return (
        <div className={`min-h-screen w-full flex overflow-hidden selection:bg-blue-200 selection:text-deped-blue ${darkMode ? 'bg-[#0a0e1a]' : 'bg-login-bg'}`}>

            {/* ============================== */}
            {/* LEFT PANEL — Hero Section       */}
            {/* ============================== */}
            <motion.div
                initial={{ x: -80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="hidden lg:flex lg:w-[58%] relative text-white flex-col justify-between p-12 overflow-hidden"
            >
                {/* Background Image with Parallax drift */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat animate-parallax"
                    style={{ backgroundImage: `url(${import.meta.env.BASE_URL}login-bg.jpg)` }}
                />

                {/* Premium Deep Green Gradient Overlay */}
                <div className="absolute inset-0 z-[1] bg-gradient-to-br from-[#023c27]/60 via-[#064e3b]/50 to-[#052e16]/30 mix-blend-multiply" />
                <div className="absolute inset-0 z-[1] bg-emerald-950/15" />

                {/* Subtle Noise Texture */}
                <div className="absolute inset-0 z-[2] opacity-[0.04]" style={{
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
                            <img src={`${import.meta.env.BASE_URL}website-banner-2-1.png`} alt="Official Banner" className="h-[60px] object-contain drop-shadow-lg mb-1" />
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
                            <h1 className="text-[1.8rem] xl:text-[2.5rem] font-black tracking-tight leading-tight text-white drop-shadow-2xl text-center break-words">
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
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse shadow-[0_0_8px_theme(colors.emerald.300)]" />
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
                            <Megaphone className="w-4 h-4 text-emerald-300 flex-shrink-0" />
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
                className={`w-full lg:w-[42%] flex flex-col justify-center items-center p-6 md:p-10 relative overflow-hidden transition-colors duration-500 ${darkMode ? 'bg-[#0d1225]' : 'bg-[#F5F7FA]'
                    }`}
            >
                {/* Background Orbs */}
                <BackgroundOrbs darkMode={darkMode} />
                {/* Floating Icons */}
                <FloatingIcons darkMode={darkMode} />

                {/* --- Top Bar: Dark mode + Language + Time --- */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute top-5 left-0 right-0 px-6 md:px-10 flex items-center justify-between z-20"
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
                                ? 'bg-white/[0.06] text-gray-400 hover:bg-white/[0.1] border border-white/[0.08]'
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
                                ? 'bg-white/[0.06] text-amber-400 hover:bg-white/[0.1] border border-white/[0.08]'
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
                    </div>
                </motion.div>

                {/* ========== GLASSMORPHISM LOGIN CARD ========== */}
                <motion.div
                    onHoverStart={() => setIsCardHovered(true)}
                    onHoverEnd={() => setIsCardHovered(false)}
                    className={`w-full max-w-[420px] z-10 p-9 md:p-10 rounded-[24px] relative transition-all duration-500 ${shake ? 'animate-shake' : ''} ${darkMode
                        ? 'bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.4)]'
                        : 'bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_20px_60px_rgba(0,0,0,0.06)]'
                        } ${isCardHovered && !darkMode ? 'shadow-[0_25px_70px_rgba(10,61,145,0.08)]' : ''} ${isCardHovered && darkMode ? 'border-white/[0.12] shadow-[0_25px_70px_rgba(0,0,0,0.5)]' : ''}`}
                >
                    {/* Card inner glow (top edge) */}
                    <div className={`absolute top-0 left-[15%] right-[15%] h-[1px] rounded-full ${darkMode ? 'bg-gradient-to-r from-transparent via-white/20 to-transparent' : 'bg-gradient-to-r from-transparent via-deped-blue-light/20 to-transparent'
                        }`} />

                    {/* Logo with float animation */}
                    <motion.div
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="flex justify-center mb-6"
                    >
                        <div className={`animate-logo-float p-3.5 rounded-2xl transition-all duration-300 ${darkMode
                            ? 'bg-white/[0.06] border border-white/[0.1] shadow-lg shadow-black/20'
                            : 'bg-white border border-gray-100 shadow-lg shadow-gray-200/50'
                            }`}>
                            <img
                                src={`${import.meta.env.BASE_URL}app-logo.png`}
                                alt="System Logo"
                                className="h-14 w-14 object-contain"
                            />
                        </div>
                    </motion.div>

                    {/* Header */}
                    <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-center mb-7"
                    >
                        <h2 className={`text-[22px] font-bold mb-1.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {t.welcomeBack}
                        </h2>
                        <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {t.secureAccess}
                        </p>
                    </motion.div>

                    {/* Form */}
                    <motion.form
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >
                        {/* Error Alert */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                                    animate={{ height: 'auto', opacity: 1, marginBottom: 8 }}
                                    exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                                    className={`rounded-xl text-sm font-medium flex items-center gap-2 overflow-hidden ${darkMode
                                        ? 'bg-red-500/10 text-red-400 border border-red-500/20 p-3'
                                        : 'bg-red-50 text-red-600 p-3 border border-red-100'
                                        }`}
                                >
                                    <Shield className="w-4 h-4 shrink-0" />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* User ID Field */}
                        <div className="space-y-2">
                            <label className={`text-[11px] font-bold uppercase tracking-[0.1em] ml-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                {t.userId}
                            </label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    required
                                    className={`login-input block w-full px-4 py-3.5 rounded-xl transition-all duration-300 outline-none font-medium text-[15px] ${darkMode
                                        ? 'bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-600 focus:bg-white/[0.06] focus:border-blue-500/40'
                                        : 'bg-white border border-gray-200/80 text-gray-900 placeholder-gray-400 shadow-sm focus:border-deped-blue-light/60 focus:bg-white'
                                        }`}
                                    placeholder={t.userIdPlaceholder}
                                    value={credentials.id}
                                    onChange={(e) => setCredentials({ ...credentials, id: e.target.value })}
                                />
                                <User className={`absolute right-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] pointer-events-none transition-colors ${darkMode ? 'text-gray-600 group-focus-within:text-blue-400' : 'text-gray-300 group-focus-within:text-deped-blue-light'
                                    }`} />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className={`text-[11px] font-bold uppercase tracking-[0.1em] ml-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                {t.password}
                            </label>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className={`login-input block w-full px-4 py-3.5 pr-12 rounded-xl transition-all duration-300 outline-none font-medium text-[15px] ${darkMode
                                        ? 'bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-600 focus:bg-white/[0.06] focus:border-blue-500/40'
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
                                                <EyeOff className="h-[18px] w-[18px]" />
                                            </motion.div>
                                        ) : (
                                            <motion.div key="on" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.15 }}>
                                                <Eye className="h-[18px] w-[18px]" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
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
                                    onClick={() => setRememberMe(!rememberMe)}
                                    className={`toggle-switch ${rememberMe ? 'active' : ''}`}
                                    style={{
                                        backgroundColor: rememberMe
                                            ? '#0A3D91'
                                            : darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
                                    }}
                                />
                                <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t.rememberMe}
                                </span>
                            </label>
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                className={`text-sm font-semibold transition-all duration-200 hover:underline underline-offset-2 ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-deped-blue hover:text-deped-blue-light'
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
                            className={`w-full py-3.5 rounded-xl font-bold text-[15px] transition-all duration-300 mt-3 flex items-center justify-center gap-2.5 ${isLoading ? 'cursor-not-allowed opacity-80' : ''
                                } bg-gradient-to-r from-[#0A3D91] to-[#3A7BFF] text-white shadow-lg hover:shadow-xl hover:shadow-deped-blue/25`}
                            style={{
                                boxShadow: isLoading ? undefined : '0 4px 20px rgba(10, 61, 145, 0.3)',
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {t.signingIn}
                                </>
                            ) : t.signIn}
                        </motion.button>

                        {/* Biometric Login Hint */}
                        <div className="flex justify-center pt-2">
                            <button
                                type="button"
                                className={`flex items-center gap-2 text-[11px] font-medium px-4 py-2 rounded-full transition-all duration-200 ${darkMode
                                    ? 'text-gray-600 hover:text-gray-400 hover:bg-white/[0.04]'
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Fingerprint className="w-3.5 h-3.5" />
                                Biometric Login
                            </button>
                        </div>
                    </motion.form>
                </motion.div>

                {/* ---- System Status Pill ---- */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="absolute bottom-14 left-0 right-0 flex justify-center pointer-events-none z-20"
                >
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold ${darkMode
                        ? 'bg-white/[0.04] text-gray-500 border border-white/[0.06]'
                        : 'bg-white/80 backdrop-blur-sm text-gray-500 border border-gray-200/40 shadow-sm'
                        }`}>
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 animate-glow-pulse" />
                        </div>
                        {t.systemStatus}
                    </div>
                </motion.div>

                {/* ---- Copyright ---- */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                    className="absolute bottom-5 left-0 right-0 text-center pointer-events-none z-20"
                >
                    <p className={`text-[10px] font-medium tracking-wide ${darkMode ? 'text-gray-700' : 'text-gray-400'}`}>
                        {t.copyright}
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};
