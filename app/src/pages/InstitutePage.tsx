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
    const { schoolProfile, updateSchoolProfile, sections, setCurrentView, students } = useAppStore();
    const { user } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const canEdit = canManageSchoolProfile(user);

    const advisorySections = useMemo(() => {
        const getGradeNum = (gl: string) => {
            const str = (gl || '').toLowerCase();
            if (str.includes('kinder')) return 0;
            const match = str.match(/\d+/);
            return match ? parseInt(match[0], 10) : 99;
        };

        const list = sections.filter(sec => 
            sec.is_advisory || (sec.adviser_name && sec.adviser_name.trim() !== '' && sec.adviser_name.toLowerCase() !== 'tba')
        );

        return [...list].sort((a, b) => {
            const gA = getGradeNum(a.section_grade_level);
            const gB = getGradeNum(b.section_grade_level);
            if (gA !== gB) return gA - gB;
            return (a.section_name || '').localeCompare(b.section_name || '');
        });
    }, [sections]);

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
        adviser_signature_url: schoolProfile?.adviser_signature_url || '',
        adviser_name: schoolProfile?.adviser_name || '',
        grade_level: schoolProfile?.grade_level || '',
        section: schoolProfile?.section || '',
        adviser_image_url: schoolProfile?.adviser_image_url || '',
        municipality: schoolProfile?.municipality || '',
        city: schoolProfile?.city || '',
        province: schoolProfile?.province || '',
    }), [schoolProfile]);

    const [formData, setFormData] = useState<SchoolProfile>(safeProfile);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const adviserFileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingAdviser, setIsUploadingAdviser] = useState(false);

    const headSignatureFileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingHeadSignature, setIsUploadingHeadSignature] = useState(false);
    const adviserSignatureFileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingAdviserSignature, setIsUploadingAdviserSignature] = useState(false);

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
            // Auto-persist to store so the ID card preview and other pages update immediately
            void updateSchoolProfile({ logo_url: base64 } as SchoolProfile);
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
            // Auto-persist to store so the ID card preview and other pages update immediately
            void updateSchoolProfile({ logo_url: '' } as SchoolProfile);
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

    const handleHeadSignatureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }
        setIsUploadingHeadSignature(true);
        try {
            const base64 = await resizeImage(file, 500, 200);
            setFormData(prev => ({ ...prev, head_signature_url: base64 }));
        } catch (error) {
            console.error('Head signature upload failed:', error);
            alert('Failed to process image.');
        } finally {
            setIsUploadingHeadSignature(false);
        }
    };

    const handleDeleteHeadSignature = () => {
        if (window.confirm('Are you sure you want to remove the school head signature?')) {
            setFormData(prev => ({ ...prev, head_signature_url: '' }));
        }
    };

    const handleAdviserSignatureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }
        setIsUploadingAdviserSignature(true);
        try {
            const base64 = await resizeImage(file, 500, 200);
            setFormData(prev => ({ ...prev, adviser_signature_url: base64 }));
        } catch (error) {
            console.error('Adviser signature upload failed:', error);
            alert('Failed to process image.');
        } finally {
            setIsUploadingAdviserSignature(false);
        }
    };

    const handleDeleteAdviserSignature = () => {
        if (window.confirm('Are you sure you want to remove the adviser signature?')) {
            setFormData(prev => ({ ...prev, adviser_signature_url: '' }));
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

    const displaySchoolName = schoolProfile.name || '';
    const displaySchoolId = schoolProfile.school_id || '';
    const displayRegion = schoolProfile.region || '';
    const displayDivision = schoolProfile.division || '';
    const displayDistrict = schoolProfile.district || '';
    const displayHeadName = schoolProfile.head_name || '';
    const displayHeadPosition = schoolProfile.head_position || '';
    const displayAdviserName = schoolProfile.adviser_name || '';
    const displayGradeLevel = schoolProfile.grade_level || '';
    const displaySection = schoolProfile.section || '';



    if (isEditing && canEdit) {
        return (
            <div className="h-[calc(100vh-146px)] max-w-350 mx-auto flex flex-col gap-3 overflow-hidden select-none">
                {/* Header Edit bar */}
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-[#0f172a] rounded-2xl p-3 shadow-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Settings2 className="w-4 h-4 animate-spin-slow" />
                        </div>
                        <div>
                            <h1 className="text-sm font-black text-slate-800 dark:text-white tracking-tight uppercase">Update Institute</h1>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Modify institutional profile details and branding assets</p>
                        </div>
                    </div>
                </motion.div>

                {/* Form Body - Dual Column Grid */}
                <form onSubmit={handleSubmit} noValidate className="flex-1 min-h-0 flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
                        {/* Column 1: Core Fields */}
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white rounded-2xl border border-slate-100 dark:border-white/10 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col overflow-hidden"
                        >
                            <div className="px-4 py-2 border-b border-slate-100 dark:border-white/10 flex items-center gap-2 shrink-0 bg-slate-50/40 dark:bg-white/5">
                                <div className="w-1.5 h-4 bg-blue-600 rounded-full mr-1 animate-pulse" />
                                <Building2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                                <h3 className="text-[9.5px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">School Profile & Leadership</h3>
                            </div>
                            
                            <div className="p-4 flex-1 flex flex-col justify-between overflow-hidden">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    <div className="col-span-2">
                                        <FormInput 
                                            label="School Name" 
                                            value={formData.name} 
                                            onChange={v => setFormData({ ...formData, name: v })} 
                                            placeholder="Enter full school name"
                                            isPrimary={true}
                                            icon={<School className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                                        />
                                    </div>
                                    <FormInput 
                                        label="School ID" 
                                        value={formData.school_id} 
                                        onChange={v => setFormData({ ...formData, school_id: v })} 
                                        placeholder="e.g. 307014"
                                        icon={<GraduationCap className="w-4 h-4 text-slate-400 dark:text-slate-400" />}
                                    />
                                    <FormInput 
                                        label="District" 
                                        value={formData.district} 
                                        onChange={v => setFormData({ ...formData, district: v })} 
                                        placeholder="District"
                                        icon={<MapPin className="w-4 h-4 text-slate-400 dark:text-slate-400" />}
                                    />
                                    <div className="space-y-0.5">
                                        <label className="block text-[8.5px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-300 ml-1">
                                            <Globe className="w-4 h-4 inline mr-1.5 text-slate-400 dark:text-slate-400 align-middle" />
                                            <span className="align-middle">Region</span>
                                        </label>
                                        <select
                                            value={formData.region || ''}
                                            onChange={e => setFormData({ ...formData, region: e.target.value })}
                                            className="w-full rounded-xl py-1 px-3 outline-none transition-all bg-slate-50/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] font-semibold text-slate-700 dark:text-white focus:bg-white dark:focus:bg-[#0d1225] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 shadow-xs cursor-pointer"
                                        >
                                            <option value="" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Select Region</option>
                                            {['CAR', 'NCR', 'Region I', 'Region II', 'Region III', 'Region IV-A', 'MIMAROPA', 'Region V', 'Region VI', 'Region VII', 'Region VIII', 'NIR', 'Region IX', 'Region X', 'Region XI', 'Region XII', 'CARAGA', 'BARMM'].map(r => (
                                                <option key={r} value={r} className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">{r}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <FormInput 
                                        label="Division" 
                                        value={formData.division} 
                                        onChange={v => setFormData({ ...formData, division: v })} 
                                        placeholder="Division"
                                        icon={<Building2 className="w-4 h-4 text-slate-400 dark:text-slate-400" />}
                                    />
                                    <FormInput 
                                        label="Municipality/City" 
                                        value={formData.municipality || formData.city || ''} 
                                        onChange={v => setFormData({ ...formData, municipality: v, city: v })} 
                                        placeholder="e.g. Tarlac City"
                                        icon={<MapPin className="w-4 h-4 text-slate-400 dark:text-slate-400" />}
                                    />
                                    <FormInput 
                                        label="Province" 
                                        value={formData.province || ''} 
                                        onChange={v => setFormData({ ...formData, province: v })} 
                                        placeholder="e.g. Tarlac"
                                        icon={<MapPin className="w-4 h-4 text-slate-400 dark:text-slate-400" />}
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
                                        <div className="space-y-0.5">
                                            <label className="block text-[8.5px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-300 ml-1">
                                                <GraduationCap className="w-3.5 h-3.5 inline mr-1.5 text-indigo-500 dark:text-indigo-400 align-middle" />
                                                <span className="align-middle">Grade Levels Offered</span>
                                            </label>
                                            <select
                                                value={formData.grade_levels_offered || ''}
                                                onChange={e => setFormData({ ...formData, grade_levels_offered: e.target.value })}
                                                className="w-full rounded-xl py-1 px-3 outline-none transition-all bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] font-extrabold text-slate-700 dark:text-white focus:bg-white dark:focus:bg-[#0d1225] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 shadow-xs cursor-pointer"
                                            >
                                                <option value="" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Select Grade Levels Offered</option>
                                                <option value="Kindergarten" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Kindergarten</option>
                                                <option value="Kinder to Grade 6" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Kinder to Grade 6</option>
                                                <option value="Kinder to Grade 10" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Kinder to Grade 10</option>
                                                <option value="Kinder to Grade 12" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Kinder to Grade 12</option>
                                                <option value="Kinder to Grade 6; Grade 11-12" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Kinder to Grade 6; Grade 11-12</option>
                                                <option value="Kinder to Grade 10 attached to Tertiary" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Kinder to Grade 10 attached to Tertiary</option>
                                                <option value="Kinder to Grade 12 attached to Tertiary" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Kinder to Grade 12 attached to Tertiary</option>
                                                <option value="Kindergarten; Grade 7-10" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Kindergarten; Grade 7-10</option>
                                                <option value="Kindergarten; Grade 7-10; Grade 11-12" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Kindergarten; Grade 7-10; Grade 11-12</option>
                                                <option value="Kindergarten; Grade 11-12" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Kindergarten; Grade 11-12</option>
                                                <option value="Grade 1-6" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Grade 1-6</option>
                                                <option value="Grade 1-6; Grade 7-10" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Grade 1-6; Grade 7-10</option>
                                                <option value="Grade 1-6; Grade 11-12" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Grade 1-6; Grade 11-12</option>
                                                <option value="Grade 1-6; Grade 7-10; Grade 11-12" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Grade 1-6; Grade 7-10; Grade 11-12</option>
                                                <option value="Grade 7-10" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Grade 7-10</option>
                                                <option value="Grade 7-10; Grade 11-12" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Grade 7-10; Grade 11-12</option>
                                                <option value="Grade 11-12" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Grade 11-12</option>
                                                <option value="Community-based Learning Center" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">Community-based Learning Center</option>
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
                            className="flex flex-col gap-3 min-h-0 overflow-hidden"
                        >
                            {/* Branding & Digital Signatures Card */}
                            <div className="bg-white dark:bg-[#0d1225] rounded-2xl border border-slate-100 dark:border-white/10 shadow-xl shadow-slate-100/50 dark:shadow-none p-4 flex flex-col relative overflow-hidden shrink-0 gap-3">
                                <h3 className="text-[9.5px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Branding & Digital Signatures
                                </h3>

                                <div className="grid grid-cols-3 gap-3">
                                    {/* Logo Upload */}
                                    <div className="flex flex-col items-center gap-1.5 bg-slate-50/50 dark:bg-white/5 p-2 rounded-xl border border-slate-100 dark:border-white/10">
                                        <span className="text-[7.5px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest text-center">School Logo</span>
                                        <div className="w-14 h-14 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center p-1 relative shadow-xs">
                                            <img
                                                src={formData.logo_url || `${import.meta.env.BASE_URL}school-logo.png`}
                                                alt="Preview"
                                                className="max-w-full max-h-full object-contain"
                                            />
                                            {isUploading && (
                                                <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex items-center justify-center rounded-xl">
                                                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                            className="w-full py-1 bg-[#1d566e] hover:bg-[#164356] text-white rounded-lg text-[7.5px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                                        >
                                            Upload Logo
                                        </button>
                                        {formData.logo_url && (
                                            <button
                                                type="button"
                                                onClick={handleDeleteLogo}
                                                className="text-[7px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-wide cursor-pointer"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>

                                    {/* School Head Signature Upload */}
                                    <div className="flex flex-col items-center gap-1.5 bg-slate-50/50 dark:bg-white/5 p-2 rounded-xl border border-slate-100 dark:border-white/10">
                                        <span className="text-[7.5px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest text-center">School Head Sign</span>
                                        <div className="w-14 h-14 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center p-1 relative shadow-xs">
                                            {formData.head_signature_url ? (
                                                <img
                                                    src={formData.head_signature_url}
                                                    alt="Head Signature"
                                                    className="max-h-full object-contain"
                                                />
                                            ) : (
                                                <span className="text-[7.5px] text-slate-300 dark:text-slate-400 font-bold uppercase">None</span>
                                            )}
                                            {isUploadingHeadSignature && (
                                                <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex items-center justify-center rounded-xl">
                                                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => headSignatureFileInputRef.current?.click()}
                                            disabled={isUploadingHeadSignature}
                                            className="w-full py-1 bg-[#1d566e] hover:bg-[#164356] text-white rounded-lg text-[7.5px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                                        >
                                            Upload Sign
                                        </button>
                                        {formData.head_signature_url && (
                                            <button
                                                type="button"
                                                onClick={handleDeleteHeadSignature}
                                                className="text-[7px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-wide cursor-pointer"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>

                                    {/* Adviser Signature Upload */}
                                    <div className="flex flex-col items-center gap-1.5 bg-slate-50/50 dark:bg-white/5 p-2 rounded-xl border border-slate-100 dark:border-white/10">
                                        <span className="text-[7.5px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest text-center">Adviser Sign</span>
                                        <div className="w-14 h-14 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center p-1 relative shadow-xs">
                                            {formData.adviser_signature_url ? (
                                                <img
                                                    src={formData.adviser_signature_url}
                                                    alt="Adviser Signature"
                                                    className="max-h-full object-contain"
                                                />
                                            ) : (
                                                <span className="text-[7.5px] text-slate-300 dark:text-slate-400 font-bold uppercase">None</span>
                                            )}
                                            {isUploadingAdviserSignature && (
                                                <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex items-center justify-center rounded-xl">
                                                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => adviserSignatureFileInputRef.current?.click()}
                                            disabled={isUploadingAdviserSignature}
                                            className="w-full py-1 bg-[#1d566e] hover:bg-[#164356] text-white rounded-lg text-[7.5px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                                        >
                                            Upload Sign
                                        </button>
                                        {formData.adviser_signature_url && (
                                            <button
                                                type="button"
                                                onClick={handleDeleteAdviserSignature}
                                                className="text-[7px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-wide cursor-pointer"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                                <input type="file" ref={headSignatureFileInputRef} onChange={handleHeadSignatureChange} accept="image/*" className="hidden" />
                                <input type="file" ref={adviserSignatureFileInputRef} onChange={handleAdviserSignatureChange} accept="image/*" className="hidden" />
                            </div>

                            {/* Advisory Info Locked Card */}
                            <div className="bg-white dark:bg-[#0d1225] rounded-2xl p-4 border border-slate-100 dark:border-white/10 shadow-xl shadow-slate-100/50 dark:shadow-none flex-1 flex flex-col justify-between min-h-0">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                                        <h3 className="text-[9px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Advisory Details (Read Only)</h3>
                                    </div>

                                    <div className="flex items-center gap-4 mt-1">
                                        {/* Adviser Photo Upload */}
                                        <div className="relative shrink-0 flex flex-col items-center">
                                            <div className="relative group">
                                                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 overflow-hidden flex items-center justify-center p-0.5 shadow-md transition-all duration-300 group-hover:border-blue-500 group-hover:scale-105">
                                                    {formData.adviser_image_url ? (
                                                        <img 
                                                            src={formData.adviser_image_url} 
                                                            alt="Adviser" 
                                                            className="w-full h-full object-cover rounded-full"
                                                        />
                                                    ) : (
                                                        <User className="w-6 h-6 text-slate-400 dark:text-slate-400" />
                                                    )}
                                                    {isUploadingAdviser && (
                                                        <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 flex items-center justify-center rounded-full">
                                                            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => adviserFileInputRef.current?.click()}
                                                    disabled={isUploadingAdviser}
                                                    className="absolute -bottom-1 -right-1 w-5.5 h-5.5 bg-[#1d566e] hover:bg-[#164356] text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer border-2 border-white dark:border-[#0d1225] transition-all duration-250 hover:scale-110 active:scale-95"
                                                    title="Upload adviser photo"
                                                >
                                                    <ImagePlus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            {formData.adviser_image_url && (
                                                <button
                                                    type="button"
                                                    onClick={handleDeleteAdviserImage}
                                                    className="text-[7.5px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-600 transition-colors mt-1.5 cursor-pointer focus:outline-none"
                                                >
                                                    Remove Photo
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex-1 flex flex-col gap-2">
                                            <div className="space-y-1">
                                                <label className="text-[8.5px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Class Adviser</label>
                                                <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl py-1.5 px-3 text-[11px] font-bold text-slate-700 dark:text-white flex items-center justify-between shadow-xs truncate">
                                                    <span className="truncate">{formData.adviser_name || 'Not Set'}</span>
                                                    <Lock className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8.5px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest ml-1">Class Assignment</label>
                                                <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl py-1.5 px-3 text-[11px] font-bold text-slate-700 dark:text-white flex items-center justify-between shadow-xs truncate">
                                                    <span className="truncate">{formData.grade_level || 'Not Set'} {formData.section ? `• ${formData.section}` : ''}</span>
                                                    <Shield className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <input type="file" ref={adviserFileInputRef} onChange={handleAdviserFileChange} accept="image/*" className="hidden" />
                                </div>

                                <div className="bg-slate-50/50 dark:bg-white/5 p-2 rounded-xl border border-slate-100 dark:border-white/10 flex items-center gap-1.5">
                                    <Info className="w-3 h-3 text-blue-500 dark:text-blue-400 shrink-0" />
                                    <p className="text-[7.5px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-normal whitespace-nowrap truncate">
                                        System Synced: Auto-loaded from database for consistency.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Form Footer */}
                    <div className="bg-white dark:bg-[#0d1225] border border-slate-100 dark:border-white/10 rounded-xl px-4 py-2.5 flex items-center justify-end gap-3 shrink-0 shadow-lg">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="text-[9px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                            disabled={isSaving}
                        >
                            Cancel Changes
                        </button>
                        <button
                            type="submit"
                            className="bg-[#1d566e] text-white px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#164356] hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-[#1d566e]/15"
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
        <div className="h-[calc(100vh-120px)] max-w-7xl mx-auto w-full flex flex-col gap-3.5 overflow-hidden select-none relative">
            {/* School Logo Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] dark:opacity-[0.05] pointer-events-none select-none z-0 overflow-hidden">
                <img 
                    src={schoolProfile.logo_url || `${import.meta.env.BASE_URL}school-logo.png`} 
                    className="w-180 h-180 max-w-none object-contain grayscale scale-125 -rotate-6"
                    alt=""
                    onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                    }}
                />
            </div>

            {/* Top Row: Restored Premium Brand Hero Card */}
            <motion.div 
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 text-white border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex items-center justify-between shrink-0 relative overflow-hidden z-10"
            >
                {/* Background visual ambient glow */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center gap-4 relative z-10">
                    {/* Logo wrapper with overlapping verified badge */}
                    <div className="relative shrink-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-slate-700/80 shadow-md overflow-hidden flex items-center justify-center p-2 transition-transform duration-300 hover:scale-105">
                            <img 
                                src={schoolProfile.logo_url || `${import.meta.env.BASE_URL}school-logo.png`} 
                                alt="School Logo" 
                                className="max-w-full max-h-full object-contain" 
                            />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center shadow-md">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        </div>
                    </div>
                    
                    <div>
                        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-0.5 rounded-full text-[9px] font-black text-emerald-300 border border-white/10 uppercase tracking-widest w-fit mb-1.5">
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            <span>DepEd Official Institution Profile</span>
                        </div>

                        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase leading-none">
                            {displaySchoolName || 'My School Name'}
                        </h1>

                        <div className="flex flex-wrap items-center gap-2 mt-2 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                            <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                                <Globe className="w-3 h-3 text-indigo-400" />
                                <span>{displayRegion || 'Not Specified'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                                <Building2 className="w-3 h-3 text-blue-400" />
                                <span>{displayDivision || 'Not Specified'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                                <MapPin className="w-3 h-3 text-emerald-400" />
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
                            className="h-10 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9.5px] font-black uppercase tracking-widest shadow-md shadow-indigo-600/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 cursor-pointer border border-indigo-400/20"
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
                className="flex-1 min-h-0 grid grid-cols-12 gap-3 relative z-10"
            >
                {/* Left Column: Institutional Data */}
                <motion.div 
                    variants={itemVariants}
                    className="col-span-7 bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col overflow-hidden"
                >
                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
                            <School className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Institutional Data</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
                        <GridFieldItem label="School Name" value={displaySchoolName} icon={<School />} />
                        <GridFieldItem label="School ID" value={displaySchoolId} icon={<GraduationCap />} />
                        <GridFieldItem label="Region" value={displayRegion} icon={<MapPin />} />
                        <GridFieldItem label="Division" value={displayDivision} icon={<Building2 />} />
                        <GridFieldItem label="District" value={displayDistrict} icon={<MapPin />} />
                        <GridFieldItem label="Municipality/City" value={schoolProfile.municipality || schoolProfile.city || ''} icon={<MapPin />} />
                        <GridFieldItem label="Province" value={schoolProfile.province || ''} icon={<MapPin />} />
                        <GridFieldItem 
                            label="Grades Offered" 
                            value={schoolProfile.grade_levels_offered || 'Not Specified'} 
                            icon={<GraduationCap />} 
                        />
                        <GridFieldItem label="School Head" value={displayHeadName} icon={<User />} />
                        <GridFieldItem label="Head Position" value={displayHeadPosition} icon={<UserCircle />} />
                    </div>
                </motion.div>

                {/* Right Column: Advisory & Teacher Profile */}
                <motion.div 
                    variants={itemVariants}
                    className="col-span-5 bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4.5 shadow-sm flex flex-col justify-between overflow-y-auto custom-scrollbar relative"
                >
                    <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-44 h-44 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 shrink-0 flex items-center justify-between mb-2.5">
                        <div className="w-fit bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                                Advisory Roster & Profile
                            </span>
                        </div>
                        <button
                            onClick={() => setCurrentView('sections')}
                            className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 hover:underline uppercase tracking-wider cursor-pointer"
                        >
                            Manage →
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col justify-between relative z-10 w-full gap-2.5">
                        {/* Featured Adviser Profile Card */}
                        <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-white/5 border border-indigo-100 dark:border-white/10 shadow-xs flex items-center gap-3 shrink-0">
                            <div className="relative shrink-0">
                                <div className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center p-0.5 shadow-sm ring-2 ring-indigo-500/20">
                                    {schoolProfile.adviser_image_url ? (
                                        <img 
                                            src={schoolProfile.adviser_image_url} 
                                            alt={displayAdviserName} 
                                            className="w-full h-full object-cover rounded-full"
                                        />
                                    ) : (
                                        <User className="w-6 h-6 text-slate-400" />
                                    )}
                                </div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="text-[7.5px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest block mb-0.5">Current Adviser</span>
                                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate" title={displayAdviserName}>
                                    {displayAdviserName || 'Adviser Not Assigned'}
                                </h4>
                                <div className="mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-extrabold text-[9px] border border-indigo-500/20">
                                    {advisorySections.length > 1 
                                        ? `${advisorySections.length} Advisory Classes Assigned` 
                                        : `${advisorySections[0]?.section_grade_level || displayGradeLevel || 'Grade'} • ${advisorySections[0]?.section_name || displaySection || 'Section'}`}
                                </div>
                            </div>
                        </div>

                        {/* Advisory Classes Cards Roster */}
                        <div className="flex-1 min-h-35 max-h-55 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                            <span className="text-[8px] text-slate-400 dark:text-slate-400 font-black uppercase tracking-widest block mb-1">Active Class Sections ({advisorySections.length > 0 ? advisorySections.length : 1})</span>
                            {(advisorySections.length > 0 ? advisorySections : [{
                                id: 'single',
                                section_name: displaySection,
                                section_grade_level: displayGradeLevel,
                                adviser_name: displayAdviserName,
                                is_advisory: true
                            }]).map((sec) => {
                                const secStudentsCount = students.filter(st => st.student_section === sec.id || st.student_section === sec.section_name).length;
                                return (
                                    <div 
                                        key={sec.id}
                                        className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 flex items-center justify-between hover:border-indigo-500/30 transition-all"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-[9px] border border-indigo-500/20 shrink-0">
                                                {sec.section_grade_level ? sec.section_grade_level.replace('Grade ', 'G') : 'ADV'}
                                            </div>
                                            <div>
                                                <h5 className="text-[10.5px] font-black text-slate-900 dark:text-white leading-tight">
                                                    {sec.section_grade_level || displayGradeLevel} • {sec.section_name || displaySection}
                                                </h5>
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold leading-snug">
                                                    Adviser: <strong className="text-slate-800 dark:text-slate-200">{sec.adviser_name || displayAdviserName || 'Not Assigned'}</strong>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-wider border border-emerald-500/20 block mb-0.5">
                                                Advisory
                                            </span>
                                            <span className="text-[8px] font-bold text-slate-400">
                                                {secStudentsCount} Learners
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Digital Signatures Preview & Direct Upload Shortcut */}
                        <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest block">Registered Digital Signatures</span>
                                {canEdit && (
                                    <button 
                                        onClick={handleOpenEdit}
                                        className="text-[8px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                                    >
                                        Upload / Edit
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col items-center bg-slate-50/80 dark:bg-slate-800/40 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">School Head</span>
                                    <div className="h-7 w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 rounded-lg flex items-center justify-center p-1">
                                        {schoolProfile.head_signature_url ? (
                                            <img src={schoolProfile.head_signature_url} alt="Head Signature" className="max-h-full object-contain" />
                                        ) : (
                                            <span className="text-[7.5px] text-slate-400 font-bold uppercase">Not Set</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-center bg-slate-50/80 dark:bg-slate-800/40 p-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Class Adviser</span>
                                    <div 
                                        onClick={() => canEdit && handleOpenEdit()}
                                        className={`h-7 w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 rounded-lg flex items-center justify-center p-1 ${canEdit ? 'cursor-pointer hover:border-indigo-400' : ''}`}
                                        title={canEdit ? 'Click to upload Class Adviser digital signature' : ''}
                                    >
                                        {schoolProfile.adviser_signature_url ? (
                                            <img src={schoolProfile.adviser_signature_url} alt="Adviser Signature" className="max-h-full object-contain" />
                                        ) : (
                                            <span className="text-[7.5px] text-amber-600 dark:text-amber-400 font-extrabold uppercase flex items-center gap-1">
                                                Not Set {canEdit && '• Upload'}
                                            </span>
                                        )}
                                    </div>
                                </div>
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
        <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 hover:border-indigo-500/30 transition-all duration-200">
            <span className="flex items-center gap-1.5 text-[8.5px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest leading-none mb-1">
                <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0 [&_svg]:w-3 [&_svg]:h-3 text-indigo-500 dark:text-indigo-400">
                    {icon}
                </span>
                {label}
            </span>
            <p className="text-xs font-black text-slate-900 dark:text-white leading-snug truncate" title={value || 'Not Specified'}>
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
    const labelClass = `block text-[8.5px] font-black uppercase tracking-widest ml-1 ${isPrimary ? 'text-blue-600 dark:text-blue-400 font-extrabold' : 'text-slate-400 dark:text-slate-300'}`;
    const inputClass = isPrimary 
        ? `rounded-xl py-1.5 px-3 bg-blue-50/15 dark:bg-white/5 border-2 border-slate-350 dark:border-white/10 ring-2 ring-slate-100/50 dark:ring-white/5 text-[11.5px] font-extrabold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#0d1225] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10` 
        : `rounded-xl py-1 px-3 bg-slate-50/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] font-semibold text-slate-700 dark:text-white focus:bg-white dark:focus:bg-[#0d1225] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5`;

    return (
        <div className={`space-y-0.5 ${className}`}>
            <label className={labelClass}>
                {icon && <span className="inline-flex mr-1.5 self-center align-middle">{icon}</span>}
                <span className="align-middle">{label}</span>
            </label>
            <input
                type="text"
                required={required}
                className={`w-full outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-500 shadow-xs ${inputClass}`}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    );
}

