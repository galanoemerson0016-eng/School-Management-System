import { useState, useMemo, useRef } from 'react';
import { 
    ImagePlus, 
    CheckCircle2, 
    Loader2, 
    ShieldCheck, 
    School, 
    MapPin, 
    Building2, 
    UserCircle, 
    Sparkles, 
    GraduationCap, 
    Globe, 
    User, 
    SlidersHorizontal,
    Copy,
    Check,
    PenTool,
    Users,
    Layers,
    AlertCircle,
    Calendar,
    ChevronRight
} from 'lucide-react';
import { useAppStore } from '../stores/app-store';
import { useAuthStore } from '../stores/auth-store';
import type { SchoolProfile } from '../types';
import { canManageSchoolProfile } from '../lib/rbac';
import { SignaturePadModal } from '../components/institute/SignaturePadModal';

function formatGradeLevelsDisplay(raw: string | undefined): { title: string; subtitle: string } {
    if (!raw || !raw.trim()) {
        return { title: 'K-12 Basic Ed', subtitle: 'DepEd Curricular Offering' };
    }
    const clean = raw.trim();
    
    // Check known DepEd combinations
    if (clean.includes('Grade 1-6') && clean.includes('Grade 7-10') && clean.includes('Grade 11-12')) {
        return { title: 'Grade 1–12', subtitle: 'Complete Basic Education' };
    }
    if (clean.includes('Kinder') && clean.includes('12')) {
        return { title: 'Complete K–12', subtitle: 'Kindergarten to Grade 12' };
    }
    if (clean.includes('Kinder') && clean.includes('10')) {
        return { title: 'Kinder to G10', subtitle: 'Integrated Basic Education' };
    }
    if (clean.includes('Kinder') && clean.includes('6')) {
        return { title: 'Kinder to G6', subtitle: 'Elementary Education' };
    }
    if (clean.includes('Grade 7-10') && clean.includes('Grade 11-12')) {
        return { title: 'Grade 7–12', subtitle: 'Junior & Senior High School' };
    }
    if (clean === 'Grade 7-10') {
        return { title: 'Grade 7–10', subtitle: 'Junior High School' };
    }
    if (clean === 'Grade 11-12') {
        return { title: 'Grade 11–12', subtitle: 'Senior High School' };
    }
    if (clean === 'Grade 1-6') {
        return { title: 'Grade 1–6', subtitle: 'Elementary Education' };
    }
    if (clean.toLowerCase().includes('als') || clean.toLowerCase().includes('community')) {
        return { title: 'ALS Center', subtitle: 'Alternative Learning System' };
    }

    const parts = clean.split(';').map(p => p.trim());
    if (parts.length > 1) {
        return { title: parts[0], subtitle: parts.slice(1).join(', ') };
    }

    return { title: clean, subtitle: 'DepEd Curricular Offering' };
}

export function InstitutePage() {
    const { schoolProfile, updateSchoolProfile, sections, students, activeSchoolYear } = useAppStore();
    const { user } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'branding'>('overview');
    const [copiedSchoolId, setCopiedSchoolId] = useState(false);

    // Digital signature drawing modal state
    const [sigModalOpen, setSigModalOpen] = useState(false);
    const [sigTarget, setSigTarget] = useState<'head' | 'adviser' | null>(null);

    // Transparency check toggles for specimen previews
    const [showCheckerHead, setShowCheckerHead] = useState(false);
    const [showCheckerAdv, setShowCheckerAdv] = useState(false);

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

    // Safety fallback for profile fields
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
        school_year: schoolProfile?.school_year || activeSchoolYear || '',
        id_card_config: schoolProfile?.id_card_config,
    }), [schoolProfile, activeSchoolYear]);

    const [formData, setFormData] = useState<SchoolProfile>(safeProfile);

    // Profile completeness calculation
    const completeness = useMemo(() => {
        const checks = [
            { label: 'Official School Name', ok: Boolean(safeProfile.name?.trim()), weight: 20 },
            { label: '6-digit DepEd School ID', ok: /^\d{6}$/.test(safeProfile.school_id?.trim() || ''), weight: 20 },
            { label: 'Region & Division', ok: Boolean(safeProfile.region && safeProfile.division), weight: 20 },
            { label: 'School Head / Principal', ok: Boolean(safeProfile.head_name?.trim()), weight: 15 },
            { label: 'School Official Seal', ok: Boolean(safeProfile.logo_url), weight: 15 },
            { label: 'Principal Specimen Signature', ok: Boolean(safeProfile.head_signature_url), weight: 10 },
        ];
        const score = checks.reduce((acc, c) => acc + (c.ok ? c.weight : 0), 0);
        const missing = checks.filter(c => !c.ok);
        return { score, checks, missing };
    }, [safeProfile]);

    const handleOpenEdit = () => {
        setFormData(safeProfile);
        setIsEditing(true);
    };

    const handleCopySchoolId = () => {
        if (!safeProfile.school_id) return;
        navigator.clipboard.writeText(safeProfile.school_id);
        setCopiedSchoolId(true);
        setTimeout(() => setCopiedSchoolId(false), 2000);
    };

    // File input references
    const fileInputRef = useRef<HTMLInputElement>(null);
    const adviserFileInputRef = useRef<HTMLInputElement>(null);
    const headSignatureFileInputRef = useRef<HTMLInputElement>(null);
    const adviserSignatureFileInputRef = useRef<HTMLInputElement>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [isUploadingAdviser, setIsUploadingAdviser] = useState(false);
    const [isUploadingHeadSignature, setIsUploadingHeadSignature] = useState(false);
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
                    resolve(canvas.toDataURL('image/png'));
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
            void updateSchoolProfile({ logo_url: base64 } as SchoolProfile);
        } catch (error) {
            console.error('Logo upload failed:', error);
            alert('Failed to process image. Please try another one.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteLogo = () => {
        if (window.confirm('Remove custom school logo? The system will revert to the default.')) {
            setFormData(prev => ({ ...prev, logo_url: '' }));
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
            alert('Failed to process image.');
        } finally {
            setIsUploadingAdviser(false);
        }
    };

    const handleDeleteAdviserImage = () => {
        if (window.confirm('Remove adviser photo?')) {
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
            alert('Failed to process signature image.');
        } finally {
            setIsUploadingHeadSignature(false);
        }
    };

    const handleDeleteHeadSignature = () => {
        if (window.confirm('Remove the School Head digital specimen signature?')) {
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
            alert('Failed to process signature image.');
        } finally {
            setIsUploadingAdviserSignature(false);
        }
    };

    const handleDeleteAdviserSignature = () => {
        if (window.confirm('Remove the Class Adviser digital specimen signature?')) {
            setFormData(prev => ({ ...prev, adviser_signature_url: '' }));
        }
    };

    // Handle signature drawn via SignaturePadModal
    const handleSaveDrawnSignature = (dataUrl: string) => {
        if (sigTarget === 'head') {
            setFormData(prev => ({ ...prev, head_signature_url: dataUrl }));
            if (!isEditing) {
                void updateSchoolProfile({ head_signature_url: dataUrl } as SchoolProfile);
            }
        } else if (sigTarget === 'adviser') {
            setFormData(prev => ({ ...prev, adviser_signature_url: dataUrl }));
            if (!isEditing) {
                void updateSchoolProfile({ adviser_signature_url: dataUrl } as SchoolProfile);
            }
        }
        setSigTarget(null);
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (isSaving) return;

        setIsSaving(true);
        const payload = { ...formData };
        try {
            await updateSchoolProfile(payload);
            setIsEditing(false);
            setFormData(payload);
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert(error instanceof Error ? error.message : 'An error occurred while saving.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!schoolProfile) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                    Initializing Institutional Profile...
                </p>
            </div>
        );
    }

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

    // Calculate quick student tally
    const totalStudentsCount = students.length;
    const maleStudentsCount = students.filter(s => s.gender === 'Male').length;
    const femaleStudentsCount = students.filter(s => s.gender === 'Female').length;

    // EDIT MODE RENDER
    if (isEditing && canEdit) {
        const isSchoolIdValid = /^\d{6}$/.test(formData.school_id?.trim() || '');

        return (
            <div className="w-full max-w-6xl mx-auto flex flex-col gap-5 pb-24 animate-in fade-in duration-200">
                {/* Header Edit Bar */}
                <div className="shrink-0 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
                            <SlidersHorizontal className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                                Edit Institutional Profile
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Configure DepEd identification, leadership records, official seals, and digital signatures.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-600/25 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
                        </button>
                    </div>
                </div>

                {/* Form Sections */}
                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                    {/* Section 1: DepEd Institutional Identifiers */}
                    <div className="shrink-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
                                <School className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                    DepEd Institutional Identification & Location
                                </h3>
                                <p className="text-[11px] text-slate-400">
                                    Official institution credentials required for DepEd Form 138 (SF9), SF10, and LIS exports.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* School Name */}
                            <div className="md:col-span-2">
                                <FormInput 
                                    label="School Name (Official DepEd Title)" 
                                    value={formData.name} 
                                    onChange={v => setFormData({ ...formData, name: v })} 
                                    placeholder="e.g. Calibungan High School"
                                    isPrimary={true}
                                    icon={<School className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                                />
                            </div>

                            {/* School ID with 6-digit validator badge */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        <GraduationCap className="w-3.5 h-3.5 inline mr-1 text-slate-400 align-middle" />
                                        <span>School ID (6 Digits)</span>
                                    </label>
                                    {formData.school_id && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                            isSchoolIdValid
                                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                                        }`}>
                                            {isSchoolIdValid ? '✓ Valid 6-digit ID' : '⚠ Must be 6 digits'}
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    maxLength={6}
                                    className="w-full rounded-xl py-2 px-3 bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                                    value={formData.school_id}
                                    onChange={e => setFormData({ ...formData, school_id: e.target.value.replace(/\D/g, '') })}
                                    placeholder="e.g. 307014"
                                />
                            </div>

                            {/* Region */}
                            <div className="space-y-1">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    <Globe className="w-3.5 h-3.5 inline mr-1 text-slate-400 align-middle" />
                                    <span>Region</span>
                                </label>
                                <select
                                    value={formData.region || ''}
                                    onChange={e => setFormData({ ...formData, region: e.target.value })}
                                    className="w-full rounded-xl py-2 px-3 bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                                >
                                    <option value="">Select Official Region</option>
                                    {['CAR', 'NCR', 'Region I', 'Region II', 'Region III', 'Region IV-A', 'MIMAROPA', 'Region V', 'Region VI', 'Region VII', 'Region VIII', 'NIR', 'Region IX', 'Region X', 'Region XI', 'Region XII', 'CARAGA', 'BARMM'].map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Division */}
                            <FormInput 
                                label="Division" 
                                value={formData.division} 
                                onChange={v => setFormData({ ...formData, division: v })} 
                                placeholder="e.g. Tarlac Province"
                                icon={<Building2 className="w-4 h-4 text-slate-400" />}
                            />

                            {/* District */}
                            <FormInput 
                                label="District" 
                                value={formData.district} 
                                onChange={v => setFormData({ ...formData, district: v })} 
                                placeholder="e.g. Victoria East"
                                icon={<MapPin className="w-4 h-4 text-slate-400" />}
                            />

                            {/* Municipality / City */}
                            <FormInput 
                                label="Municipality / City" 
                                value={formData.municipality || formData.city || ''} 
                                onChange={v => setFormData({ ...formData, municipality: v, city: v })} 
                                placeholder="e.g. Victoria"
                                icon={<MapPin className="w-4 h-4 text-slate-400" />}
                            />

                            {/* Province */}
                            <FormInput 
                                label="Province" 
                                value={formData.province || ''} 
                                onChange={v => setFormData({ ...formData, province: v })} 
                                placeholder="e.g. Tarlac"
                                icon={<MapPin className="w-4 h-4 text-slate-400" />}
                            />

                            {/* Grade Levels Offered */}
                            <div className="md:col-span-2 space-y-1">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    <GraduationCap className="w-3.5 h-3.5 inline mr-1 text-slate-400 align-middle" />
                                    <span>Grade Levels Offered</span>
                                </label>
                                <select
                                    value={formData.grade_levels_offered || ''}
                                    onChange={e => setFormData({ ...formData, grade_levels_offered: e.target.value })}
                                    className="w-full rounded-xl py-2 px-3 bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                                >
                                    <option value="">Select Curricular Grade Offering</option>
                                    <option value="Kindergarten">Kindergarten</option>
                                    <option value="Kinder to Grade 6">Kinder to Grade 6 (Elementary)</option>
                                    <option value="Kinder to Grade 10">Kinder to Grade 10 (Integrated Basic)</option>
                                    <option value="Kinder to Grade 12">Kinder to Grade 12 (Complete K-12)</option>
                                    <option value="Kinder to Grade 6; Grade 11-12">Kinder to Grade 6; Grade 11-12</option>
                                    <option value="Grade 1-6">Grade 1-6</option>
                                    <option value="Grade 1-6; Grade 7-10">Grade 1-6; Grade 7-10</option>
                                    <option value="Grade 1-6; Grade 7-10; Grade 11-12">Grade 1-6; Grade 7-10; Grade 11-12</option>
                                    <option value="Grade 7-10">Grade 7-10 (Junior High School)</option>
                                    <option value="Grade 7-10; Grade 11-12">Grade 7-10; Grade 11-12 (JHS + SHS)</option>
                                    <option value="Grade 11-12">Grade 11-12 (Senior High School)</option>
                                    <option value="Community-based Learning Center">Community-based Learning Center (ALS)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Leadership & Signatories */}
                    <div className="shrink-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
                                <UserCircle className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                    School Leadership & Designated Signatories
                                </h3>
                                <p className="text-[11px] text-slate-400">
                                    Official DepEd school head whose specimen signature and name appear on report cards and certificates.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormInput 
                                label="School Head / Principal Name" 
                                value={formData.head_name} 
                                onChange={v => setFormData({ ...formData, head_name: v })} 
                                placeholder="e.g. AGAPITO S. GONZAGA"
                                icon={<User className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                            />

                            <FormInput 
                                label="Official Position / Designation" 
                                value={formData.head_position} 
                                onChange={v => setFormData({ ...formData, head_position: v })} 
                                placeholder="e.g. Principal I"
                                icon={<UserCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                            />

                            <FormInput 
                                label="Class Adviser Name" 
                                value={formData.adviser_name || ''} 
                                onChange={v => setFormData({ ...formData, adviser_name: v })} 
                                placeholder="e.g. MARIA L. SANTOS"
                                icon={<User className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                            />
                        </div>
                    </div>

                    {/* Section 3: Official Branding & Specimen Signatures Studio */}
                    <div className="shrink-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                    Official Branding & Digital Specimen Signatures
                                </h3>
                                <p className="text-[11px] text-slate-400">
                                    Seals and specimen signatures automatically stamped onto SF9, SF10, diplomas, and student IDs.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Card 1: School Official Seal */}
                            <div className="flex flex-col items-center justify-between p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 gap-3">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                    Official School Seal
                                </span>
                                <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-2 relative shadow-xs overflow-hidden">
                                    <img
                                        src={formData.logo_url || `${import.meta.env.BASE_URL}school-logo.png`}
                                        alt="School Seal"
                                        className="max-w-full max-h-full object-contain"
                                    />
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex items-center justify-center">
                                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col w-full gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                        <ImagePlus className="w-3.5 h-3.5" />
                                        Upload Seal
                                    </button>
                                    {formData.logo_url && (
                                        <button
                                            type="button"
                                            onClick={handleDeleteLogo}
                                            className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 transition-colors py-0.5 cursor-pointer text-center"
                                        >
                                            Reset to Default
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Card 2: School Head Specimen Signature */}
                            <div className="flex flex-col items-center justify-between p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 gap-3">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                    School Head Signature
                                </span>
                                <div className="w-full h-20 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-2 relative shadow-xs overflow-hidden">
                                    {formData.head_signature_url ? (
                                        <img
                                            src={formData.head_signature_url}
                                            alt="Head Signature"
                                            className="max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-xs text-slate-400 font-medium italic">
                                            No signature set
                                        </span>
                                    )}
                                    {isUploadingHeadSignature && (
                                        <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex items-center justify-center">
                                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col w-full gap-1.5">
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => headSignatureFileInputRef.current?.click()}
                                            disabled={isUploadingHeadSignature}
                                            className="py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                                        >
                                            <ImagePlus className="w-3.5 h-3.5" />
                                            Upload
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSigTarget('head');
                                                setSigModalOpen(true);
                                            }}
                                            className="py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                                        >
                                            <PenTool className="w-3.5 h-3.5" />
                                            Draw
                                        </button>
                                    </div>
                                    {formData.head_signature_url && (
                                        <button
                                            type="button"
                                            onClick={handleDeleteHeadSignature}
                                            className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 transition-colors py-0.5 cursor-pointer text-center"
                                        >
                                            Remove Signature
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Card 3: Class Adviser Specimen Signature */}
                            <div className="flex flex-col items-center justify-between p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 gap-3">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                    Class Adviser Signature
                                </span>
                                <div className="w-full h-20 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-2 relative shadow-xs overflow-hidden">
                                    {formData.adviser_signature_url ? (
                                        <img
                                            src={formData.adviser_signature_url}
                                            alt="Adviser Signature"
                                            className="max-h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-xs text-slate-400 font-medium italic">
                                            No signature set
                                        </span>
                                    )}
                                    {isUploadingAdviserSignature && (
                                        <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex items-center justify-center">
                                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col w-full gap-1.5">
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => adviserSignatureFileInputRef.current?.click()}
                                            disabled={isUploadingAdviserSignature}
                                            className="py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                                        >
                                            <ImagePlus className="w-3.5 h-3.5" />
                                            Upload
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSigTarget('adviser');
                                                setSigModalOpen(true);
                                            }}
                                            className="py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                                        >
                                            <PenTool className="w-3.5 h-3.5" />
                                            Draw
                                        </button>
                                    </div>
                                    {formData.adviser_signature_url && (
                                        <button
                                            type="button"
                                            onClick={handleDeleteAdviserSignature}
                                            className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 transition-colors py-0.5 cursor-pointer text-center"
                                        >
                                            Remove Signature
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Card 4: Class Adviser Profile Photo */}
                            <div className="flex flex-col items-center justify-between p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 gap-3">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                    Class Adviser Photo
                                </span>
                                <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 relative shadow-xs overflow-hidden">
                                    {formData.adviser_image_url ? (
                                        <img
                                            src={formData.adviser_image_url}
                                            alt="Adviser Photo"
                                            className="w-full h-full object-cover rounded-full"
                                        />
                                    ) : (
                                        <User className="w-8 h-8 text-slate-400" />
                                    )}
                                    {isUploadingAdviser && (
                                        <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex items-center justify-center rounded-full">
                                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col w-full gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => adviserFileInputRef.current?.click()}
                                        disabled={isUploadingAdviser}
                                        className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                        <ImagePlus className="w-3.5 h-3.5" />
                                        Upload Photo
                                    </button>
                                    {formData.adviser_image_url && (
                                        <button
                                            type="button"
                                            onClick={handleDeleteAdviserImage}
                                            className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 transition-colors py-0.5 cursor-pointer text-center"
                                        >
                                            Remove Photo
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Hidden native file inputs */}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        <input type="file" ref={headSignatureFileInputRef} onChange={handleHeadSignatureChange} accept="image/*" className="hidden" />
                        <input type="file" ref={adviserSignatureFileInputRef} onChange={handleAdviserSignatureChange} accept="image/*" className="hidden" />
                        <input type="file" ref={adviserFileInputRef} onChange={handleAdviserFileChange} accept="image/*" className="hidden" />
                    </div>
                </form>

                {/* Digital Signature Drawing Pad Modal */}
                <SignaturePadModal
                    isOpen={sigModalOpen}
                    onClose={() => {
                        setSigModalOpen(false);
                        setSigTarget(null);
                    }}
                    onSave={handleSaveDrawnSignature}
                    title={sigTarget === 'head' ? 'School Head Specimen Signature' : 'Class Adviser Specimen Signature'}
                    signerName={sigTarget === 'head' ? (formData.head_name || 'School Principal') : (formData.adviser_name || 'Class Adviser')}
                    signerRole={sigTarget === 'head' ? (formData.head_position || 'Principal / School Head') : 'Class Adviser'}
                />
            </div>
        );
    }

    // VIEW MODE RENDER
    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-3 select-none pb-2">
            {/* Top Row: Modern DepEd Institutional Campus Hero Banner */}
            <div className="shrink-0 bg-linear-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-4 sm:p-4.5 shadow-lg border border-slate-800/80 relative overflow-hidden">
                {/* Background ambient lighting */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Seal + Titles */}
                    <div className="flex items-center gap-4">
                        {/* School Official Seal with DepEd verified badge */}
                        <div className="relative shrink-0 group">
                            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-white border-2 border-white/20 shadow-xl overflow-hidden flex items-center justify-center p-1.5 transition-transform duration-300 group-hover:scale-105">
                                <img 
                                    src={schoolProfile.logo_url || `${import.meta.env.BASE_URL}school-logo.png`} 
                                    alt="Official School Seal" 
                                    className="max-w-full max-h-full object-contain" 
                                />
                            </div>
                            <div 
                                className="absolute -bottom-1 -right-1 w-5.5 h-5.5 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center shadow-md"
                                title="DepEd Official Profile Verified"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            </div>
                        </div>

                        <div className="min-w-0">
                            {/* Badges Bar */}
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase tracking-wider">
                                    <Sparkles className="w-3 h-3 text-emerald-400" />
                                    <span>DepEd Recognized</span>
                                </div>

                                {activeSchoolYear && (
                                    <div className="flex items-center gap-1 bg-white/10 text-slate-300 px-2 py-0.5 rounded-full text-[9.5px] font-bold border border-white/10">
                                        <Calendar className="w-3 h-3 text-indigo-300" />
                                        <span>S.Y. {activeSchoolYear}</span>
                                    </div>
                                )}

                                {/* School ID with Copy Shortcut */}
                                <button
                                    type="button"
                                    onClick={handleCopySchoolId}
                                    className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-full border border-white/15 transition-all cursor-pointer font-mono font-bold text-white text-[9.5px]"
                                    title="Click to copy School ID"
                                >
                                    <span>ID: {displaySchoolId || '307014'}</span>
                                    {copiedSchoolId ? (
                                        <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                        <Copy className="w-3 h-3 text-slate-300" />
                                    )}
                                </button>
                            </div>

                            {/* School Title */}
                            <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-white tracking-tight uppercase leading-tight drop-shadow-xs truncate">
                                {displaySchoolName || 'Calibungan High School'}
                            </h1>

                            {/* Location Hierarchy */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs font-semibold text-slate-300">
                                <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md border border-white/10 text-[10.5px]">
                                    <Globe className="w-3 h-3 text-indigo-400" />
                                    <span>{displayRegion || 'Region III'}</span>
                                </div>

                                <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md border border-white/10 text-[10.5px]">
                                    <Building2 className="w-3 h-3 text-blue-400" />
                                    <span>{displayDivision || 'Schools Division Office'}</span>
                                </div>

                                {displayDistrict && (
                                    <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md border border-white/10 text-[10.5px]">
                                        <MapPin className="w-3 h-3 text-emerald-400" />
                                        <span>{displayDistrict}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions & Readiness Meter */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-2.5 shrink-0 pt-2.5 lg:pt-0 border-t lg:border-t-0 border-white/10">
                        {canEdit && (
                            <button
                                onClick={handleOpenEdit}
                                className="h-8.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold tracking-wide shadow-md shadow-blue-600/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5 cursor-pointer border border-blue-400/30"
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                Edit Profile
                            </button>
                        )}

                        {/* Readiness Meter Badge */}
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 text-xs">
                            <div className="text-right">
                                <span className="text-[9px] text-slate-300 block uppercase font-bold tracking-wider leading-none mb-0.5">DepEd Readiness</span>
                                <span className="font-mono font-bold text-emerald-300 leading-none">{completeness.score}%</span>
                            </div>
                            <div className="w-12 h-1.5 rounded-full bg-white/20 overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-500 ${
                                        completeness.score === 100 ? 'bg-emerald-400' : 'bg-amber-400'
                                    }`}
                                    style={{ width: `${completeness.score}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Quick KPI Stats Bar */}
                <div className="mt-3.5 pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-slate-200">
                    <div className="bg-white/5 rounded-xl p-2 sm:p-2.5 border border-white/10 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                            <Users className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider block leading-tight">Total Learners</span>
                            <span className="text-xs sm:text-sm font-black text-white truncate block leading-tight">{totalStudentsCount} Enrolled</span>
                            <span className="text-[9.5px] text-slate-400 block truncate leading-tight">{maleStudentsCount}M • {femaleStudentsCount}F</span>
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-2 sm:p-2.5 border border-white/10 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                            <Layers className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider block leading-tight">Class Sections</span>
                            <span className="text-xs sm:text-sm font-black text-white truncate block leading-tight">{sections.length} Active Classes</span>
                            <span className="text-[9.5px] text-indigo-300 block truncate leading-tight">{advisorySections.length} Advisory Classes</span>
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-2 sm:p-2.5 border border-white/10 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                            <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider block leading-tight">School Head</span>
                            <span className="text-xs sm:text-sm font-black text-white truncate block leading-tight" title={displayHeadName || 'Not Set'}>
                                {displayHeadName || 'Agapito S. Gonzaga'}
                            </span>
                            <span className="text-[9.5px] text-slate-400 block truncate leading-tight">{displayHeadPosition || 'Principal I'}</span>
                        </div>
                    </div>

                    {(() => {
                        const gradeDisplay = formatGradeLevelsDisplay(schoolProfile.grade_levels_offered);
                        return (
                            <div className="bg-white/5 rounded-xl p-2 sm:p-2.5 border border-white/10 flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                    <GraduationCap className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider block leading-tight">Grade Levels Offered</span>
                                    <span className="text-xs sm:text-sm font-black text-white truncate block leading-tight" title={schoolProfile.grade_levels_offered || 'K-12 Basic Education'}>
                                        {gradeDisplay.title}
                                    </span>
                                    <span className="text-[9.5px] text-emerald-300 block truncate leading-tight">{gradeDisplay.subtitle}</span>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Navigation Tabs Bar (Modern Segmented Control) */}
            <div className="shrink-0 flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 w-fit select-none shadow-2xs gap-1">
                {[
                    { id: 'overview', label: 'Institutional Details', icon: School },
                    { id: 'branding', label: 'Seals & Specimen Signatures', icon: Sparkles },
                ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                                isActive
                                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* TAB CONTENT PANELS */}
            {activeTab === 'overview' && (
                <div className="shrink-0 grid grid-cols-1 lg:grid-cols-12 gap-3.5 animate-in fade-in duration-150">
                    {/* Left 6 Cols: Institutional Information */}
                    <div className="lg:col-span-6 flex flex-col">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col gap-2.5 h-full">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
                                        <School className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider leading-tight">
                                            Institutional Information
                                        </h3>
                                        <p className="text-[11px] text-slate-400 leading-tight">
                                            Official school identification and administrative records.
                                        </p>
                                    </div>
                                </div>
                                {canEdit && (
                                    <button
                                        type="button"
                                        onClick={handleOpenEdit}
                                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer shrink-0"
                                    >
                                        Edit Data →
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <GridFieldItem label="Official School Name" value={displaySchoolName} icon={<School />} />
                                <GridFieldItem label="DepEd School ID" value={displaySchoolId} icon={<GraduationCap />} isMono={true} />
                                <GridFieldItem label="Region" value={displayRegion} icon={<Globe />} />
                                <GridFieldItem label="Schools Division" value={displayDivision} icon={<Building2 />} />
                                <GridFieldItem label="District" value={displayDistrict} icon={<MapPin />} />
                                <GridFieldItem label="Municipality / City" value={schoolProfile.municipality || schoolProfile.city || ''} icon={<MapPin />} />
                                <GridFieldItem label="Province" value={schoolProfile.province || ''} icon={<MapPin />} />
                                <GridFieldItem label="Grade Levels Offered" value={schoolProfile.grade_levels_offered || 'K-12 Basic Education'} icon={<GraduationCap />} />
                                <GridFieldItem label="School Head / Principal" value={displayHeadName} icon={<User />} />
                                <GridFieldItem label="Head Position" value={displayHeadPosition} icon={<UserCircle />} />
                                <GridFieldItem label="Class Adviser Name" value={displayAdviserName} icon={<User />} />
                                <GridFieldItem label="Advisory Class Section" value={displaySection ? `${displayGradeLevel ? displayGradeLevel + ' • ' : ''}${displaySection}` : (displayGradeLevel || '')} icon={<Users />} />
                            </div>
                        </div>
                    </div>

                    {/* Right 6 Cols: DepEd Form Readiness Checklist (2 Columns as requested!) */}
                    <div className="lg:col-span-6 flex flex-col">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col gap-2.5 h-full">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider leading-tight">
                                        DepEd Form Compliance
                                    </h4>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-900/50">
                                    {completeness.score}% Readiness
                                </span>
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                                Required institutional credentials for official DepEd School Forms (SF9, SF10, SF1, Form 137).
                            </p>

                            {/* 2-COLUMN COMPLIANCE GRID */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {completeness.checks.map(chk => (
                                    <div 
                                        key={chk.label}
                                        className="flex items-center justify-between p-2 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/60 text-xs"
                                    >
                                        <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] truncate mr-1.5" title={chk.label}>
                                            {chk.label}
                                        </span>
                                        {chk.ok ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Set
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                                                <AlertCircle className="w-3.5 h-3.5" /> Missing
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {completeness.missing.length > 0 && canEdit && (
                                <button
                                    type="button"
                                    onClick={handleOpenEdit}
                                    className="w-full py-1.5 px-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    Complete Missing Profile Info →
                                </button>
                            )}

                            {/* Specimen Signatures & Seal Status Studio (Directly below checklist) */}
                            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Specimen Signatures & Seal
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('branding')}
                                        className="text-[10.5px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-0.5"
                                    >
                                        <span>Studio</span>
                                        <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {/* Principal Specimen Signature */}
                                    <div className="p-2 px-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex items-center justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Principal Signature</span>
                                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                {displayHeadName || 'School Head'}
                                            </p>
                                            <span className={`text-[10px] font-semibold block ${schoolProfile.head_signature_url ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                                {schoolProfile.head_signature_url ? '✓ Specimen Ready' : '⚠ Missing'}
                                            </span>
                                        </div>
                                        {canEdit && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSigTarget('head');
                                                    setSigModalOpen(true);
                                                }}
                                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                                            >
                                                <PenTool className="w-3 h-3" />
                                                Draw
                                            </button>
                                        )}
                                    </div>

                                    {/* Class Adviser Specimen Signature */}
                                    <div className="p-2 px-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex items-center justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Adviser Signature</span>
                                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                {displayAdviserName || 'Class Adviser'}
                                            </p>
                                            <span className={`text-[10px] font-semibold block ${schoolProfile.adviser_signature_url ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                                {schoolProfile.adviser_signature_url ? '✓ Specimen Ready' : '⚠ Missing'}
                                            </span>
                                        </div>
                                        {canEdit && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSigTarget('adviser');
                                                    setSigModalOpen(true);
                                                }}
                                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                                            >
                                                <PenTool className="w-3 h-3" />
                                                Draw
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'branding' && (
                <div className="shrink-0 grid grid-cols-1 md:grid-cols-3 gap-5 animate-in fade-in duration-150">
                    {/* School Official Seal Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col items-center text-center justify-between gap-5">
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                                Official School Seal
                            </span>
                            <p className="text-[11px] text-slate-400">
                                Printed on the right side of official DepEd form headers.
                            </p>
                        </div>

                        <div className="w-36 h-36 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-3 shadow-inner">
                            <img
                                src={schoolProfile.logo_url || `${import.meta.env.BASE_URL}school-logo.png`}
                                alt="School Seal"
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>

                        <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                            {canEdit ? (
                                <button
                                    type="button"
                                    onClick={handleOpenEdit}
                                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                                >
                                    <ImagePlus className="w-3.5 h-3.5" />
                                    Update School Seal
                                </button>
                            ) : (
                                <span className="text-[11px] text-slate-400 font-medium">Read Only</span>
                            )}
                        </div>
                    </div>

                    {/* School Head Specimen Signature Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col items-center text-center justify-between gap-5">
                        <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                                    School Head Signature
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setShowCheckerHead(!showCheckerHead)}
                                    className="text-[10px] font-bold text-blue-500 hover:underline cursor-pointer"
                                    title="Toggle checkerboard background to inspect PNG transparency"
                                >
                                    [Check PNG]
                                </button>
                            </div>
                            <p className="text-[11px] text-slate-400">
                                Official signature over the Principal's printed line.
                            </p>
                        </div>

                        {/* Signature Specimen Container */}
                        <div className={`w-full h-36 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-end p-3 relative shadow-inner overflow-hidden ${
                            showCheckerHead 
                                ? 'bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-size-[16px_16px] dark:bg-slate-950'
                                : 'bg-white dark:bg-slate-950'
                        }`}>
                            <div className="h-20 flex items-center justify-center">
                                {schoolProfile.head_signature_url ? (
                                    <img
                                        src={schoolProfile.head_signature_url}
                                        alt="Head Signature"
                                        className="max-h-16 object-contain"
                                    />
                                ) : (
                                    <span className="text-xs text-slate-300 dark:text-slate-600 font-medium italic">
                                        No specimen signature uploaded
                                    </span>
                                )}
                            </div>
                            <div className="w-4/5 border-t border-slate-400/80 pt-1.5 text-center">
                                <p className="text-[11px] font-extrabold uppercase text-slate-800 dark:text-slate-200 truncate">
                                    {displayHeadName || 'DR. JUAN DELA CRUZ'}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate">
                                    {displayHeadPosition || 'School Principal IV'}
                                </p>
                            </div>
                        </div>

                        <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                            {canEdit ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSigTarget('head');
                                            setSigModalOpen(true);
                                        }}
                                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                                    >
                                        <PenTool className="w-3.5 h-3.5" />
                                        Draw
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleOpenEdit}
                                        className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                                    >
                                        <ImagePlus className="w-3.5 h-3.5" />
                                        Upload
                                    </button>
                                </>
                            ) : (
                                <span className="text-[11px] text-slate-400 font-medium w-full text-center">Read Only</span>
                            )}
                        </div>
                    </div>

                    {/* Class Adviser Specimen Signature Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col items-center text-center justify-between gap-5">
                        <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                                    Class Adviser Signature
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setShowCheckerAdv(!showCheckerAdv)}
                                    className="text-[10px] font-bold text-blue-500 hover:underline cursor-pointer"
                                    title="Toggle checkerboard background to inspect PNG transparency"
                                >
                                    [Check PNG]
                                </button>
                            </div>
                            <p className="text-[11px] text-slate-400">
                                Official signature over the Class Adviser's printed line.
                            </p>
                        </div>

                        {/* Signature Specimen Container */}
                        <div className={`w-full h-36 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-end p-3 relative shadow-inner overflow-hidden ${
                            showCheckerAdv 
                                ? 'bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] bg-size-[16px_16px] dark:bg-slate-950'
                                : 'bg-white dark:bg-slate-950'
                        }`}>
                            <div className="h-20 flex items-center justify-center">
                                {schoolProfile.adviser_signature_url ? (
                                    <img
                                        src={schoolProfile.adviser_signature_url}
                                        alt="Adviser Signature"
                                        className="max-h-16 object-contain"
                                    />
                                ) : (
                                    <span className="text-xs text-slate-300 dark:text-slate-600 font-medium italic">
                                        No specimen signature uploaded
                                    </span>
                                )}
                            </div>
                            <div className="w-4/5 border-t border-slate-400/80 pt-1.5 text-center">
                                <p className="text-[11px] font-extrabold uppercase text-slate-800 dark:text-slate-200 truncate">
                                    {displayAdviserName || 'Class Adviser'}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate">
                                    Class Adviser / Teacher
                                </p>
                            </div>
                        </div>

                        <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                            {canEdit ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSigTarget('adviser');
                                            setSigModalOpen(true);
                                        }}
                                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                                    >
                                        <PenTool className="w-3.5 h-3.5" />
                                        Draw
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleOpenEdit}
                                        className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                                    >
                                        <ImagePlus className="w-3.5 h-3.5" />
                                        Upload
                                    </button>
                                </>
                            ) : (
                                <span className="text-[11px] text-slate-400 font-medium w-full text-center">Read Only</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Digital Signature Drawing Pad Modal (Available from View Mode) */}
            <SignaturePadModal
                isOpen={sigModalOpen}
                onClose={() => {
                    setSigModalOpen(false);
                    setSigTarget(null);
                }}
                onSave={handleSaveDrawnSignature}
                title={sigTarget === 'head' ? 'School Head Specimen Signature' : 'Class Adviser Specimen Signature'}
                signerName={sigTarget === 'head' ? (safeProfile.head_name || 'School Principal') : (safeProfile.adviser_name || 'Class Adviser')}
                signerRole={sigTarget === 'head' ? (safeProfile.head_position || 'Principal / School Head') : 'Class Adviser'}
            />
        </div>
    );
}

function GridFieldItem({ label, value, icon, isMono = false }: { 
    label: string; 
    value: string; 
    icon: React.ReactNode; 
    isMono?: boolean;
}) {
    return (
        <div className="p-2 px-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 hover:border-blue-500/30 transition-all">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0 [&_svg]:w-3.5 [&_svg]:h-3.5 text-blue-500 dark:text-blue-400">
                    {icon}
                </span>
                {label}
            </span>
            <p className={`text-xs font-bold text-slate-900 dark:text-white truncate ${isMono ? 'font-mono' : ''}`} title={value || 'Not Specified'}>
                {value || 'Not Specified'}
            </p>
        </div>
    );
}

function FormInput({ 
    label, 
    value, 
    onChange, 
    placeholder, 
    required = false, 
    isPrimary = false, 
    className = '', 
    icon 
}: { 
    label: string; 
    value: string; 
    onChange: (v: string) => void; 
    placeholder?: string;
    required?: boolean;
    isPrimary?: boolean;
    className?: string;
    icon?: React.ReactNode;
}) {
    return (
        <div className={`space-y-1 ${className}`}>
            <label className={`block text-[11px] font-bold uppercase tracking-wider ${
                isPrimary ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
            }`}>
                {icon && <span className="inline-flex mr-1.5 self-center align-middle">{icon}</span>}
                <span className="align-middle">{label}</span>
            </label>
            <input
                type="text"
                required={required}
                className={`w-full rounded-xl py-2 px-3 outline-none transition-all placeholder:text-slate-400 shadow-2xs ${
                    isPrimary 
                        ? 'bg-blue-50/30 dark:bg-blue-950/20 border-2 border-blue-500 text-sm font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                }`}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    );
}
