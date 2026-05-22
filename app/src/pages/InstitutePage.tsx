import { useState, useMemo, useRef } from 'react';
import { 
    ImagePlus, 
    CheckCircle2, 
    Loader2, 
    Lock, 
    ShieldCheck, 
    Shield, 
    School, 
    MapPin, 
    Building2, 
    UserCircle, 
    Settings2, 
    Sparkles, 
    GraduationCap,
    Info,
    Globe,
    User,
    SlidersHorizontal
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useAppStore, useAuthStore } from '../stores';
import type { SchoolProfile } from '../types';
import { canManageSchoolProfile } from '../lib/rbac';

export function InstitutePage() {
    const { schoolProfile, updateSchoolProfile } = useAppStore();
    const { user } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const canEdit = canManageSchoolProfile(user);

    const handleOpenEdit = () => {
        setFormData(safeProfile);
        setIsEditing(true);
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
        adviser_image_url: schoolProfile?.adviser_image_url || '',
    }), [schoolProfile]);

    const [formData, setFormData] = useState<SchoolProfile>(safeProfile);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const adviserFileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingAdviser, setIsUploadingAdviser] = useState(false);

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

    const parseGradeGroup = (v?: string) => {
        const s = (v || '').toString().toLowerCase();
        if (s.includes('primary') || s.includes('elementary') || s.includes('grade school')) return 'primary';
        if (s.includes('secondary') || s.includes('junior high') || s.includes('middle')) return 'secondary';
        if (s.includes('senior') || s.includes('senior high') || s.includes('k-12')) {
            if (s.includes('1') && s.includes('12')) return 'all';
            if (s.includes('senior')) return 'senior_high';
        }

        const nums = Array.from(s.matchAll(/\b(\d{1,2})\b/g)).map(m => parseInt(m[1], 10)).filter(n => n >= 1 && n <= 12);
        if (nums.length > 0) {
            const min = Math.min(...nums);
            const max = Math.max(...nums);
            if (min >= 1 && max <= 6) return 'primary';
            if (min >= 7 && max <= 10) return 'secondary';
            if (min >= 11 && max <= 12) return 'senior_high';
            if (min <= 1 && max >= 12) return 'all';
            if (min <= 6 && max >= 11) return 'all';
            if (min <= 6 && max <= 10) return 'all';
            if (min >= 4 && max <= 12) return 'all';
        }

        return 'all';
    };

    const handleDeleteLogo = () => {
        if (window.confirm('Are you sure you want to remove the custom logo? It will revert to the default.')) {
            setFormData(prev => ({ ...prev, logo_url: '' }));
        }
    };

    const handleAdviserFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        setIsUploadingAdviser(true);
        try {
            const base64 = await resizeImage(file, 400, 400);
            setFormData(prev => ({ ...prev, adviser_image_url: base64 }));
        } catch (error) {
            console.error('Adviser photo upload failed:', error);
            alert('Failed to process image. Please try another one.');
        } finally {
            setIsUploadingAdviser(false);
        }
    };

    const handleDeleteAdviserImage = () => {
        if (window.confirm('Are you sure you want to remove the adviser photo?')) {
            setFormData(prev => ({ ...prev, adviser_image_url: '' }));
        }
    };

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
    };

    if (!schoolProfile) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Initializing Profile...</p>
            </div>
        );
    }

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants: Variants = {
        hidden: { y: 15, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } }
    };

    const displaySchoolName = schoolProfile.name || 'Calibungan High School';
    const displaySchoolId = schoolProfile.school_id || '307014';
    const displayRegion = schoolProfile.region || 'Region III';
    const displayDivision = schoolProfile.division || 'Tarlac Province';
    const displayDistrict = schoolProfile.district || 'Victoria East';
    const displayHeadName = schoolProfile.head_name || 'Agapito S. Gonzaga';
    const displayHeadPosition = schoolProfile.head_position || 'Principal I';
    const displayAdviserName = schoolProfile.adviser_name || 'Emerson M. Galano';
    const displayGradeLevel = schoolProfile.grade_level || 'Grade 10';
    const displaySection = schoolProfile.section || 'Curie';

    const GRADE_GROUPS: Record<string, number[]> = {
        primary: [1,2,3,4,5,6],
        secondary: [7,8,9,10],
        senior_high: [11,12],
        all: [1,2,3,4,5,6,7,8,9,10,11,12]
    };

    const displayGroup = parseGradeGroup(schoolProfile.grade_levels_offered);
    const visibleGrades = GRADE_GROUPS[displayGroup] || GRADE_GROUPS.all;

    if (isEditing && canEdit) {
        return (
            <div className="h-[calc(100vh-146px)] max-w-[1400px] mx-auto flex flex-col gap-4 overflow-hidden select-none">
                {/* Header Edit bar */}
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-[#0f172a] rounded-3xl p-4 shadow-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Settings2 className="w-5 h-5 animate-spin-slow" />
                        </div>
                        <div>
                            <h1 className="text-base font-black text-slate-800 dark:text-white tracking-tight uppercase">Update Institute</h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Modify institutional profile details and branding assets</p>
                        </div>
                    </div>
                </motion.div>

                {/* Form Body - Dual Column Grid */}
                <form onSubmit={handleSubmit} noValidate className="flex-1 min-h-0 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
                        {/* Column 1: Core Fields */}
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white dark:bg-[#0f172a] rounded-[32px] border border-slate-100 dark:border-slate-800/80 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col overflow-hidden"
                        >
                            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-850 flex items-center gap-2 shrink-0 bg-slate-50/40 dark:bg-slate-900/40">
                                <div className="w-1.5 h-4.5 bg-blue-600 rounded-full mr-1 animate-pulse" />
                                <Building2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                <h3 className="text-[10px] font-black text-slate-700 dark:text-slate-355 uppercase tracking-widest">School Profile & Leadership</h3>
                            </div>
                            
                            <div className="p-5 flex flex-col justify-between flex-1 gap-4 overflow-hidden">
                                <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                                    <div className="col-span-2">
                                        <FormInput 
                                            label="School Name" 
                                            value={formData.name} 
                                            onChange={v => setFormData({ ...formData, name: v })} 
                                            placeholder="Enter full school name"
                                            isPrimary={true}
                                            icon={<School className="w-4 h-4 text-blue-600" />}
                                        />
                                    </div>
                                    <FormInput 
                                        label="School ID" 
                                        value={formData.school_id} 
                                        onChange={v => setFormData({ ...formData, school_id: v })} 
                                        placeholder="e.g. 307014"
                                        icon={<GraduationCap className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
                                    />
                                    <FormInput 
                                        label="District" 
                                        value={formData.district} 
                                        onChange={v => setFormData({ ...formData, district: v })} 
                                        placeholder="District"
                                        icon={<MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
                                    />
                                    <FormInput 
                                        label="Region" 
                                        value={formData.region} 
                                        onChange={v => setFormData({ ...formData, region: v })} 
                                        placeholder="Region"
                                        icon={<Globe className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
                                    />
                                    <FormInput 
                                        label="Division" 
                                        value={formData.division} 
                                        onChange={v => setFormData({ ...formData, division: v })} 
                                        placeholder="Division"
                                        icon={<Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
                                    />
                                    <FormInput 
                                        label="School Head Name" 
                                        value={formData.head_name} 
                                        onChange={v => setFormData({ ...formData, head_name: v })} 
                                        placeholder="Full name of school head"
                                        icon={<User className="w-4 h-4 text-violet-650 dark:text-violet-400" />}
                                    />
                                    <FormInput 
                                        label="Head Position" 
                                        value={formData.head_position} 
                                        onChange={v => setFormData({ ...formData, head_position: v })} 
                                        placeholder="e.g. Principal II"
                                        icon={<UserCircle className="w-4 h-4 text-violet-655 dark:text-violet-400" />}
                                    />
                                    <div className="col-span-2">
                                        <div className="space-y-1">
                                            <label className="block text-[9.5px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-550 ml-1">
                                                <GraduationCap className="w-4 h-4 inline mr-1.5 text-indigo-600 align-middle" />
                                                <span className="align-middle">Grade Levels Offered</span>
                                            </label>
                                            <select
                                                value={parseGradeGroup(formData.grade_levels_offered)}
                                                onChange={e => setFormData({ ...formData, grade_levels_offered: e.target.value })}
                                                className="w-full rounded-2xl py-2 px-4 outline-none transition-all bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-extrabold text-slate-700 dark:text-slate-300 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 shadow-xs"
                                            >
                                                <option value="primary">Primary — Grades 1–6</option>
                                                <option value="secondary">Secondary — Grades 7–10</option>
                                                <option value="senior_high">Senior High — Grades 11–12</option>
                                                <option value="all">All Levels — Grades 1–12</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Column 2: Logo and Signatory Details */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex flex-col gap-4 min-h-0"
                        >
                            {/* Branding Logo Card */}
                            <div className="bg-white dark:bg-[#0f172a] rounded-[32px] border border-slate-100 dark:border-slate-800/80 shadow-xl shadow-slate-100/50 dark:shadow-none p-5 flex flex-col relative overflow-hidden shrink-0">
                                <h3 className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-blue-600" /> Branding Logo
                                </h3>

                                <div className="flex items-center gap-5">
                                    <div className="w-20 h-20 shrink-0 rounded-2xl bg-white border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-center p-2 relative">
                                        <img
                                            src={formData.logo_url || `${import.meta.env.BASE_URL}school-logo.png`}
                                            alt="Preview"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                        {isUploading && (
                                            <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex items-center justify-center rounded-2xl">
                                                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 flex items-center justify-between gap-5">
                                        <div className="flex flex-col gap-1.5 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                                className="w-fit py-1.5 px-2.5 bg-[#1d566e] hover:bg-[#164356] text-white rounded-lg text-[8px] font-black uppercase tracking-wider transition-all hover:shadow-md flex items-center justify-center gap-1 cursor-pointer shadow-xs shadow-[#1d566e]/15"
                                            >
                                                <ImagePlus className="w-3 h-3" />
                                                Upload Logo
                                            </button>
                                            {formData.logo_url && (
                                                <button
                                                    type="button"
                                                    onClick={handleDeleteLogo}
                                                    className="w-fit py-1 px-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[7.5px] font-black uppercase tracking-wider hover:bg-rose-100 transition-all cursor-pointer"
                                                >
                                                    Remove Logo
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex-1 border-l border-slate-100 dark:border-slate-800/80 pl-4 py-0.5 space-y-1">
                                            <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Logo Specs</span>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[7.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1">
                                                    <span className="w-1 h-1 rounded-full bg-blue-500/80 shrink-0" />
                                                    PNG or JPG format
                                                </span>
                                                <span className="text-[7.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1">
                                                    <span className="w-1 h-1 rounded-full bg-blue-500/80 shrink-0" />
                                                    1:1 Square aspect
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                            </div>

                            {/* Advisory Info Locked Card */}
                            <div className="bg-white dark:bg-[#0f172a] rounded-[32px] p-5 border border-slate-100 dark:border-slate-800/80 shadow-xl shadow-slate-100/50 dark:shadow-none flex-1 flex flex-col justify-between min-h-0">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
                                        <h3 className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Advisory Details (Read Only)</h3>
                                    </div>

                                    <div className="flex items-center gap-5 mt-2">
                                        {/* Adviser Photo Upload */}
                                        <div className="relative shrink-0 flex flex-col items-center">
                                            <div className="relative group">
                                                <div className="w-18 h-18 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center p-0.5 shadow-md transition-all duration-300 group-hover:border-blue-500 group-hover:scale-105">
                                                    {formData.adviser_image_url ? (
                                                        <img 
                                                            src={formData.adviser_image_url} 
                                                            alt="Adviser" 
                                                            className="w-full h-full object-cover rounded-full"
                                                        />
                                                    ) : (
                                                        <User className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                                                    )}
                                                    {isUploadingAdviser && (
                                                        <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 flex items-center justify-center rounded-full">
                                                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => adviserFileInputRef.current?.click()}
                                                    disabled={isUploadingAdviser}
                                                    className="absolute -bottom-1 -right-1 w-6.5 h-6.5 bg-[#1d566e] hover:bg-[#164356] text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer border-2 border-white dark:border-[#0f172a] transition-all duration-250 hover:scale-110 active:scale-95"
                                                    title="Upload adviser photo"
                                                >
                                                    <ImagePlus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            {formData.adviser_image_url && (
                                                <button
                                                    type="button"
                                                    onClick={handleDeleteAdviserImage}
                                                    className="text-[8px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-600 transition-colors mt-2 cursor-pointer focus:outline-none"
                                                >
                                                    Remove Photo
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex-1 flex flex-col gap-2.5">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Class Adviser</label>
                                                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-2.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between shadow-xs truncate">
                                                    <span className="truncate">{formData.adviser_name || 'Not Set'}</span>
                                                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Class Assignment</label>
                                                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-2.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between shadow-xs truncate">
                                                    <span className="truncate">{formData.grade_level || 'Not Set'} {formData.section ? `• ${formData.section}` : ''}</span>
                                                    <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <input type="file" ref={adviserFileInputRef} onChange={handleAdviserFileChange} accept="image/*" className="hidden" />
                                </div>

                                <div className="bg-slate-50/50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-850 flex items-center gap-1.5">
                                    <Info className="w-3 h-3 text-blue-500 shrink-0" />
                                    <p className="text-[7.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-normal whitespace-nowrap truncate">
                                        System Synced: Auto-loaded from database for consistency.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Form Footer */}
                    <div className="bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800/80 rounded-3xl px-6 py-3 flex items-center justify-end gap-4 shrink-0 shadow-lg">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                            disabled={isSaving}
                        >
                            Cancel Changes
                        </button>
                        <button
                            type="submit"
                            className="bg-[#1d566e] text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#164356] hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-[#1d566e]/15"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Synchronizing...' : 'Save Profile'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-146px)] max-w-[1400px] mx-auto flex flex-col gap-4 overflow-hidden select-none">
            {/* Top Row: Restored Premium Brand Hero Card */}
            <motion.div 
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800/80 rounded-[32px] p-6 shadow-xl shadow-slate-100/50 dark:shadow-none flex items-center justify-between shrink-0 relative overflow-hidden"
            >
                {/* Background visual decorations */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24" />
                <div className="absolute -left-12 -bottom-12 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center gap-6 relative z-10">
                    {/* Logo wrapper with overlapping verified badge */}
                    <div className="relative shrink-0">
                        <div className="w-28 h-28 rounded-3xl bg-white border border-slate-100/80 dark:border-slate-800/80 shadow-sm overflow-hidden flex items-center justify-center p-3 transition-transform duration-300 hover:scale-105">
                            <img 
                                src={schoolProfile.logo_url || `${import.meta.env.BASE_URL}school-logo.png`} 
                                alt="School Logo" 
                                className="max-w-full max-h-full object-contain" 
                            />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 border-4 border-white dark:border-slate-900 rounded-full flex items-center justify-center shadow-md">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    
                    <div>
                        <div className="flex items-center gap-1.5 bg-[#0c408a]/10 dark:bg-emerald-500/10 px-3 py-1 rounded-full text-[10px] font-black text-[#0c408a] dark:text-emerald-400 uppercase tracking-widest w-fit mb-2.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Professional Institute</span>
                        </div>

                        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase leading-none">
                            {displaySchoolName}
                        </h1>

                        <div className="flex items-center gap-2 mt-3.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            <div className="flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5 text-slate-400" />
                                <span>{displayRegion || 'Not Specified'}</span>
                            </div>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <div className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>{displayDivision || 'Not Specified'}</span>
                            </div>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span>{displayDistrict || 'Not Specified'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit & active session indicators */}
                <div className="flex items-center gap-4 relative z-10">
                    {canEdit && (
                        <button
                            onClick={handleOpenEdit}
                            className="h-12 px-6 bg-[#0c408a] hover:bg-[#093069] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-[#0c408a]/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 cursor-pointer border border-blue-900/10"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            Edit Institute Profile
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Dashboard grid layout */}
            <motion.div 
                variants={containerVariants} 
                initial="hidden" 
                animate="visible" 
                className="flex-1 min-h-0 grid grid-cols-12 gap-4"
            >
                {/* Left Column: Institutional Data */}
                <motion.div 
                    variants={itemVariants}
                    className="col-span-7 bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800/80 rounded-[32px] p-8 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col overflow-hidden"
                >
                    <div className="flex items-center gap-2.5 pb-5 border-b border-slate-100 dark:border-slate-850 shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <School className="w-4 h-4" />
                        </div>
                        <h4 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest">Institutional Data</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-y-6 gap-x-12 pt-6 overflow-y-auto custom-scrollbar flex-1 pr-1">
                        <GridFieldItem label="School Name" value={displaySchoolName} icon={<School />} />
                        <GridFieldItem label="School ID" value={displaySchoolId} icon={<GraduationCap />} />
                        <GridFieldItem label="Region" value={displayRegion} icon={<MapPin />} />
                        <GridFieldItem label="Division" value={displayDivision} icon={<Building2 />} />
                        <GridFieldItem label="District" value={displayDistrict} icon={<MapPin />} />
                        <GridFieldItem 
                            label="Grades Offered" 
                            value={visibleGrades.length > 0 ? `Grade ${visibleGrades[0]} - ${visibleGrades[visibleGrades.length - 1]}` : 'Not Specified'} 
                            icon={<GraduationCap />} 
                        />
                        <GridFieldItem label="School Head" value={displayHeadName} icon={<User />} />
                        <GridFieldItem label="Head Position" value={displayHeadPosition} icon={<UserCircle />} />
                    </div>
                </motion.div>
                {/* Right Column: Advisory Details (Auto-Stretches to match left card height) */}
                <motion.div 
                    variants={itemVariants}
                    className="col-span-5 bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800/80 rounded-[32px] p-8 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col justify-between overflow-hidden relative"
                >
                    <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-44 h-44 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 shrink-0">
                        <div className="w-fit bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 px-3.5 py-1.5 rounded-2xl flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-350 uppercase tracking-widest">Advisory Details</span>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center gap-5 my-auto relative z-10">
                        {/* Adviser Photo Circle */}
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 overflow-hidden flex items-center justify-center p-1 shadow-md shadow-slate-200/20 dark:shadow-none transition-transform duration-500 hover:scale-105">
                                {schoolProfile.adviser_image_url ? (
                                    <img 
                                        src={schoolProfile.adviser_image_url} 
                                        alt={displayAdviserName} 
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                ) : (
                                    <User className="w-12 h-12 text-slate-400 dark:text-slate-505" />
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-4 text-center">
                            <div>
                                <span className="text-[9.5px] text-slate-450 dark:text-slate-500 font-black uppercase tracking-widest block leading-none mb-2">Current Adviser</span>
                                <div className="text-2xl font-black text-slate-800 dark:text-white truncate max-w-[280px]" title={displayAdviserName}>{displayAdviserName}</div>
                            </div>
                            <div>
                                <span className="text-[9.5px] text-slate-450 dark:text-slate-500 font-black uppercase tracking-widest block leading-none mb-2">Class Assignment</span>
                                <div className="text-base font-extrabold text-slate-600 dark:text-slate-350">{displayGradeLevel} • {displaySection}</div>
                            </div>
                        </div>
                    </div>


                </motion.div>
            </motion.div>
        </div>
    );
}

function GridFieldItem({ label, value, icon }: { 
    label: string; 
    value: string; 
    icon: React.ReactNode; 
}) {
    return (
        <div className="space-y-1.5 transition-all duration-300 hover:translate-x-0.5">
            <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                <span className="w-4 h-4 flex items-center justify-center shrink-0 [&_svg]:w-3.5 [&_svg]:h-3.5 text-slate-400 dark:text-slate-500">
                    {icon}
                </span>
                {label}
            </span>
            <p className="text-base font-black text-slate-800 dark:text-slate-200 pl-6 leading-tight truncate" title={value || 'Not Specified'}>
                {value || 'Not Specified'}
            </p>
        </div>
    );
}

function FormInput({ label, value, onChange, placeholder, required = false, isPrimary = false, className = '', icon }: { 
    label: string; 
    value: string; 
    onChange: (v: string) => void; 
    placeholder?: string;
    required?: boolean;
    isPrimary?: boolean;
    className?: string;
    icon?: React.ReactNode;
}) {
    const labelClass = `block text-[9.5px] font-black uppercase tracking-widest ml-1 ${isPrimary ? 'text-blue-600 font-extrabold' : 'text-slate-400'}`;
    const inputClass = isPrimary 
        ? `rounded-2xl py-2.5 px-4 bg-blue-50/15 border-2 border-slate-300 ring-2 ring-slate-100/50 text-sm font-extrabold text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10` 
        : `rounded-2xl py-2 px-4 bg-slate-50/60 border border-slate-200 text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5`;

    return (
        <div className={`space-y-1 ${className}`}>
            <label className={labelClass}>
                {icon && <span className="inline-flex mr-1.5 self-center align-middle">{icon}</span>}
                <span className="align-middle">{label}</span>
            </label>
            <input
                type="text"
                required={required}
                className={`w-full outline-none transition-all placeholder:text-slate-300 shadow-xs ${inputClass}`}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    );
}

