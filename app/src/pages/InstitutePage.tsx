import { useState, useMemo, useRef } from 'react';
import { Trash2, ImagePlus, CheckCircle2, Loader2, Lock, X, ShieldCheck, Shield, School, MapPin, Building2, UserCircle, Settings2, Sparkles, ChevronRight, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useAppStore, useAuthStore } from '../stores';
import type { SchoolProfile } from '../types';
import { canManageSchoolProfile } from '../lib/rbac';

export function InstitutePage() {
    const { schoolProfile, updateSchoolProfile, sections } = useAppStore();
    const { user } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const canEdit = canManageSchoolProfile(user);
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState(false);

    const REQUIRED_PASSWORD = 'EaseForm-3030051497';

    const handleOpenEdit = () => {
        setFormData(safeProfile);
        setIsEditing(true);
        setIsAdvancedUnlocked(false);
    };

    const [isAdvancedUnlocked, setIsAdvancedUnlocked] = useState(false);

    const verifyPassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordInput === REQUIRED_PASSWORD) {
            setShowPasswordPrompt(false);
            setIsAdvancedUnlocked(true);
            setPasswordError(false);
            setPasswordInput('');
        } else {
            setPasswordError(true);
        }
    };

    // Safety check: Fallback to empty/default if schoolProfile from store is partial/missing
    const safeProfile: SchoolProfile = useMemo(() => ({
        school_id: schoolProfile?.school_id || '',
        name: schoolProfile?.name || '',
        region: schoolProfile?.region || '',
        division: schoolProfile?.division || '',
        district: schoolProfile?.district || '',
        head_name: schoolProfile?.head_name || '',
        head_position: schoolProfile?.head_position || '',
        grade_levels_offered: schoolProfile?.grade_levels_offered || '',
        logo_url: schoolProfile?.logo_url || '',
        head_signature_url: schoolProfile?.head_signature_url || '',
        adviser_name: schoolProfile?.adviser_name || '',
        grade_level: schoolProfile?.grade_level || '',
        section: schoolProfile?.section || '',
    }), [schoolProfile]);

    const [formData, setFormData] = useState<SchoolProfile>(safeProfile);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/png', 0.8));
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        setIsUploading(true);
        try {
            const base64 = await resizeImage(file, 400, 400);
            setFormData(prev => ({ ...prev, logo_url: base64 }));
        } catch (error) {
            console.error('Logo upload failed:', error);
            alert('Failed to process image. Please try another one.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteLogo = () => {
        if (window.confirm('Are you sure you want to remove the custom logo? It will revert to the default.')) {
            setFormData(prev => ({ ...prev, logo_url: '' }));
        }
    };

    // We avoid syncing form state inside an effect to satisfy strict hook purity rules.

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (isSaving) return;

        setIsSaving(true);
        const payload = { ...formData };
        try {
            void updateSchoolProfile(payload).catch((error) => {
                console.error('Background profile save failed:', error);
                alert(error instanceof Error ? error.message : 'An error occurred while saving.');
            });
            setIsEditing(false);
            setFormData(payload);
        } catch (error) {
            console.error("Failed to update profile:", error);
            alert(error instanceof Error ? error.message : "An error occurred while saving.");
        } finally {
            setIsSaving(false);
        }
    }

    const passwordModalNode = showPasswordPrompt ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                            <Lock className="w-6 h-6 text-amber-500" />
                        </div>
                        <button 
                            onClick={() => setShowPasswordPrompt(false)}
                            className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Unlock Protected Fields</h2>
                        <p className="text-slate-500 text-sm font-medium mt-2">Enter password to edit Adviser Name and Grade Level.</p>
                    </div>

                    <form onSubmit={verifyPassword} className="space-y-6">
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2">
                                <ShieldCheck className={`w-5 h-5 transition-colors ${passwordError ? 'text-red-400' : 'text-slate-300 group-focus-within:text-deped-blue'}`} />
                            </div>
                            <input
                                autoFocus
                                type="password"
                                className={`w-full bg-slate-50 border-2 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold tracking-widest outline-none transition-all ${
                                    passwordError 
                                    ? 'border-red-200 focus:border-red-500 ring-4 ring-red-50' 
                                    : 'border-slate-100 focus:border-deped-blue focus:ring-4 focus:ring-deped-blue/5'
                                }`}
                                placeholder="••••••••••••"
                                value={passwordInput}
                                onChange={(e) => {
                                    setPasswordInput(e.target.value);
                                    setPasswordError(false);
                                }}
                            />
                            {passwordError && (
                                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2 ml-1 animate-bounce">
                                    Incorrect security password
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full h-14 bg-deped-blue text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-deped-blue/20 hover:bg-blue-800 transition-all active:scale-[0.98]"
                        >
                            Unlock Editor
                        </button>
                    </form>
                </div>
                <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{(safeProfile.name || 'School').toUpperCase()} Security Protocol</p>
                </div>
            </div>
        </div>
    ) : null;;

    if (!schoolProfile) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-deped-blue animate-spin" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Initializing Profile...</p>
            </div>
        );
    }

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } }
    };

    if (isEditing && canEdit) {
        return (
            <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 pb-20">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-deped-blue text-white flex items-center justify-center shadow-lg">
                            <Settings2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Update Institute</h1>
                            <p className="text-sm text-slate-500 font-medium">Modify institutional settings and branding</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                    {/* Main Settings Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden"
                    >
                        <div className="bg-slate-50/50 p-6 border-b border-slate-100">
                            <h3 className="text-xs font-black text-deped-blue uppercase tracking-[0.2em] flex items-center gap-2">
                                <Building2 className="w-4 h-4" /> Basic Information
                            </h3>
                        </div>
                        
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <FormInput 
                                label="School Name" 
                                value={formData.name} 
                                onChange={v => setFormData({ ...formData, name: v })} 
                                placeholder="Enter Full School Name"
                            />
                            <FormInput 
                                label="School ID" 
                                value={formData.school_id} 
                                onChange={v => setFormData({ ...formData, school_id: v })} 
                                placeholder="e.g. 303005"
                            />
                            <FormInput 
                                label="Region" 
                                value={formData.region} 
                                onChange={v => setFormData({ ...formData, region: v })} 
                                placeholder="e.g. Region IV-A"
                            />
                            <FormInput 
                                label="Division" 
                                value={formData.division} 
                                onChange={v => setFormData({ ...formData, division: v })} 
                                placeholder="e.g. Cavite"
                            />
                            <FormInput 
                                label="District" 
                                value={formData.district} 
                                onChange={v => setFormData({ ...formData, district: v })} 
                                placeholder="e.g. District I"
                            />
                            <FormInput 
                                label="Grade Levels Offered" 
                                value={formData.grade_levels_offered} 
                                onChange={v => setFormData({ ...formData, grade_levels_offered: v })} 
                                placeholder="e.g. Grade 1-12"
                            />
                        </div>
                    </motion.div>

                    {/* Logo & Leadership Card */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Logo Card */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="lg:col-span-1 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 flex flex-col items-center text-center"
                        >
                            <h3 className="text-xs font-black text-deped-blue uppercase tracking-[0.2em] mb-8 w-full flex items-center gap-2 justify-center">
                                <Sparkles className="w-4 h-4" /> Branding
                            </h3>

                            <div className="relative mb-6">
                                <div className="w-40 h-40 rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center p-4 group transition-all hover:border-deped-blue/30">
                                    <img
                                        src={formData.logo_url || `${import.meta.env.BASE_URL}school-logo.png`}
                                        alt="Preview"
                                        className="max-w-full max-h-full object-contain transition-transform group-hover:scale-110"
                                    />
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-[2.5rem]">
                                            <Loader2 className="w-8 h-8 text-deped-blue animate-spin" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 w-full">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="w-full py-3.5 bg-deped-blue text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-800 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                                >
                                    <ImagePlus className="w-4 h-4" />
                                    Change Logo
                                </button>
                                {formData.logo_url && (
                                    <button
                                        type="button"
                                        onClick={handleDeleteLogo}
                                        className="w-full py-3 bg-white text-red-500 border border-red-50 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-50 transition-all"
                                    >
                                        Remove Logo
                                    </button>
                                )}
                            </div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-4 leading-relaxed">
                                Visible on reports & login
                            </p>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        </motion.div>

                        {/* Leadership Card */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden"
                        >
                            <div className="bg-slate-50/50 p-6 border-b border-slate-100">
                                <h3 className="text-xs font-black text-deped-blue uppercase tracking-[0.2em] flex items-center gap-2">
                                    <UserCircle className="w-4 h-4" /> Leadership & Advisory
                                </h3>
                            </div>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormInput 
                                    label="School Head Name" 
                                    value={formData.head_name} 
                                    onChange={v => setFormData({ ...formData, head_name: v })} 
                                    placeholder="Full Name"
                                />
                                <FormInput 
                                    label="Head Position" 
                                    value={formData.head_position} 
                                    onChange={v => setFormData({ ...formData, head_position: v })} 
                                    placeholder="e.g. Principal II"
                                />
                                <div className="space-y-1.5 opacity-60">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Adviser Name (Synced)</label>
                                    <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-5 text-sm font-bold text-slate-400 flex items-center justify-between">
                                        {formData.adviser_name}
                                        <Lock className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                                <div className="space-y-1.5 opacity-60">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Class Assignment (Synced)</label>
                                    <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-5 text-sm font-bold text-slate-400 flex items-center justify-between">
                                        {formData.grade_level} - {formData.section}
                                        <Shield className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                                <div className="md:col-span-2 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-relaxed">
                                        Note: Adviser details are automatically synced from the "Classes & Sections" management to ensure data integrity across all reports.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-8 pt-10 border-t border-slate-100 mt-10">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors"
                            disabled={isSaving}
                        >
                            Cancel Changes
                        </button>
                        <button
                            type="submit"
                            className="bg-deped-blue text-white px-10 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-blue-800 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Synchronizing...' : 'Save Profile'}
                        </button>
                    </div>
                </form>
                {passwordModalNode}
            </div>
        );
    }

    return (
        <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-12 pb-20">
            {/* Hero Header Section */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-slate-100 flex flex-col md:flex-row items-center gap-10"
            >
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-deped-blue/5 rounded-full blur-3xl pointer-events-none" />

                {/* Logo Section */}
                <div className="relative z-10 flex-shrink-0">
                    <div className="w-40 h-40 md:w-48 md:h-48 rounded-[3rem] bg-white shadow-[0_20px_50px_rgba(0,103,177,0.15)] border-4 border-white overflow-hidden flex items-center justify-center p-4 group transition-all duration-700 hover:scale-105">
                        <img 
                            src={schoolProfile.logo_url || `${import.meta.env.BASE_URL}school-logo.png`} 
                            alt="School Logo" 
                            className="max-w-full max-h-full object-contain" 
                        />
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl border-4 border-white animate-bounce-slow">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>

                {/* Info Section */}
                <div className="relative z-10 flex-1 text-center md:text-left space-y-4">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-deped-blue text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                            <Sparkles className="w-3 h-3" /> Professional Institute
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none break-words">
                            {schoolProfile.name}
                        </h1>
                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mt-4 text-slate-400 font-bold text-sm">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" /> {schoolProfile.school_id}
                            </div>
                            <div className="w-1 h-1 bg-slate-300 rounded-full" />
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> {schoolProfile.region}
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex flex-wrap justify-center md:justify-start gap-4">
                        {canEdit && (
                            <button
                                onClick={handleOpenEdit}
                                className="px-8 py-3.5 bg-deped-blue text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 hover:bg-blue-800 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                            >
                                <Settings2 className="w-4 h-4" />
                                Edit Institute Profile
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
                {/* Left Column: School Details */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Information Grid */}
                    <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                        <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xs font-black text-deped-blue uppercase tracking-[0.25em] flex items-center gap-3">
                                <School className="w-5 h-5" /> Institutional Data
                            </h3>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <ProfileItem icon={<Building2 className="w-4 h-4" />} label="School Name" value={schoolProfile.name} />
                            <ProfileItem icon={<GraduationCap className="w-4 h-4" />} label="School ID" value={schoolProfile.school_id} />
                            <ProfileItem icon={<MapPin className="w-4 h-4" />} label="Region" value={schoolProfile.region} />
                            <ProfileItem icon={<MapPin className="w-4 h-4" />} label="Division" value={schoolProfile.division} />
                            <ProfileItem icon={<MapPin className="w-4 h-4" />} label="District" value={schoolProfile.district} />
                            <ProfileItem icon={<GraduationCap className="w-4 h-4" />} label="Grades Offered" value={schoolProfile.grade_levels_offered} />
                        </div>
                    </motion.div>

                    {/* School Head Section */}
                    <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                        <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100">
                            <h3 className="text-xs font-black text-deped-blue uppercase tracking-[0.25em] flex items-center gap-3">
                                <UserCircle className="w-5 h-5" /> Leadership Structure
                            </h3>
                        </div>
                        <div className="p-8 flex flex-col md:flex-row items-center gap-8">
                            <div className="w-24 h-24 rounded-3xl bg-blue-50 text-deped-blue flex items-center justify-center flex-shrink-0 shadow-inner">
                                <UserCircle className="w-12 h-12" />
                            </div>
                            <div className="flex-1 text-center md:text-left grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                                <ProfileItem label="School Head" value={schoolProfile.head_name} />
                                <ProfileItem label="Official Position" value={schoolProfile.head_position} />
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Column: Advisory & Branding Summary */}
                <div className="space-y-8">
                    {/* Advisory Card */}
                    <motion.div variants={itemVariants} className="bg-gradient-to-br from-indigo-600 to-deped-blue rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Advisory Details</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Current Adviser</span>
                                    <p className="text-xl font-black">{schoolProfile.adviser_name || 'Unassigned'}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Class Assignment</span>
                                    <p className="text-xl font-black">{schoolProfile.grade_level} {schoolProfile.section ? `• ${schoolProfile.section}` : ''}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/70">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                    Active Source of Truth
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Branding Stats */}
                    <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl space-y-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Branding Stats</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                                        <Sparkles className="w-4 h-4 text-deped-blue" />
                                    </div>
                                    <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Reports</span>
                                </div>
                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase">Enabled</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                                        <Sparkles className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Login</span>
                                </div>
                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase">Enabled</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {passwordModalNode}
        </div>
    );
}

function FormInput({ label, value, onChange, placeholder, required = false }: { 
    label: string; 
    value: string; 
    onChange: (v: string) => void; 
    placeholder?: string;
    required?: boolean;
}) {
    return (
        <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
            <input
                type="text"
                required={required}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-5 text-sm font-bold text-slate-700 outline-none transition-all focus:border-deped-blue focus:bg-white focus:ring-4 focus:ring-deped-blue/5 placeholder:text-slate-300"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    );
}

function ProfileItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
    return (
        <div className="space-y-1.5 group">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors group-hover:text-deped-blue">
                {icon} {label}
            </label>
            <p className="text-base font-black text-slate-800 leading-tight px-1">{value || 'Not Specified'}</p>
        </div>
    );
}
