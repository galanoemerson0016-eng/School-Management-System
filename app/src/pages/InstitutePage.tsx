import { useState, useMemo, useRef } from 'react';
import { Trash2, ImagePlus, CheckCircle2, Loader2, Lock, X, ShieldCheck } from 'lucide-react';
import { useAppStore, useAuthStore } from '../stores';
import type { SchoolProfile } from '../types';
import { canManageSchoolProfile } from '../lib/rbac';

export function InstitutePage() {
    const { schoolProfile, updateSchoolProfile } = useAppStore();
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
        return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
    }

    if (isEditing && canEdit) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} noValidate className="bg-white p-8 rounded-lg shadow-md border border-gray-100">
                    <h2 className="text-2xl font-bold mb-8 text-deped-blue">Edit School Profile</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">School Name</label>
                            <input
                                type="text"
                                required
                                className="form-input"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">School ID</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.school_id}
                                onChange={e => setFormData({ ...formData, school_id: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Region</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.region}
                                onChange={e => setFormData({ ...formData, region: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Division</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.division}
                                onChange={e => setFormData({ ...formData, division: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">District</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.district}
                                onChange={e => setFormData({ ...formData, district: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Grade Levels Offered</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.grade_levels_offered}
                                onChange={e => setFormData({ ...formData, grade_levels_offered: e.target.value })}
                            />
                        </div>

                        {/* Logo Management */}
                        <div className="col-span-full mt-4 p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <label className="block text-sm font-bold text-slate-700 mb-4">Official School Logo</label>
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center p-2">
                                        <img
                                            src={formData.logo_url || `${import.meta.env.BASE_URL}school-logo.png`}
                                            alt="Preview"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </div>
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                                            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                                        >
                                            <ImagePlus className="w-4 h-4 text-emerald-500" />
                                            {formData.logo_url ? 'Change Logo' : 'Choose Logo'}
                                        </button>
                                        {formData.logo_url && (
                                            <button
                                                type="button"
                                                onClick={handleDeleteLogo}
                                                className="flex items-center gap-2 px-4 py-2 bg-white border border-red-100 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all shadow-sm"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium">
                                        Recommended: Square PNG/JPG. Max 2MB. <br />
                                        Logo will be automatically resized for optimal performance.
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">School Head Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.head_name}
                                onChange={e => setFormData({ ...formData, head_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">School Head Position</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.head_position}
                                onChange={e => setFormData({ ...formData, head_position: e.target.value })}
                            />
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex justify-between items-center">
                                Adviser Name
                                {!isAdvancedUnlocked && (
                                    <button 
                                        type="button"
                                        onClick={() => setShowPasswordPrompt(true)}
                                        className="text-[10px] text-deped-blue hover:underline flex items-center gap-1"
                                    >
                                        <Lock className="w-3 h-3" /> Unlock
                                    </button>
                                )}
                            </label>
                            <input
                                type="text"
                                className={`form-input ${!isAdvancedUnlocked ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                                value={formData.adviser_name}
                                onChange={e => setFormData({ ...formData, adviser_name: e.target.value })}
                                disabled={!isAdvancedUnlocked}
                            />
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex justify-between items-center">
                                Grade Level
                                {!isAdvancedUnlocked && (
                                    <button 
                                        type="button"
                                        onClick={() => setShowPasswordPrompt(true)}
                                        className="text-[10px] text-deped-blue hover:underline flex items-center gap-1"
                                    >
                                        <Lock className="w-3 h-3" /> Unlock
                                    </button>
                                )}
                            </label>
                            <input
                                type="text"
                                className={`form-input ${!isAdvancedUnlocked ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                                value={formData.grade_level}
                                onChange={e => setFormData({ ...formData, grade_level: e.target.value })}
                                placeholder="e.g. Grade 7"
                                disabled={!isAdvancedUnlocked}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Section</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.section}
                                onChange={e => setFormData({ ...formData, section: e.target.value })}
                                placeholder="e.g. Diamond"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 mt-10 pt-6 border-t">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-6 py-2 text-gray-600 font-semibold hover:text-gray-800"
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary disabled:opacity-50"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
                {passwordModalNode}
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-deped-blue">Institute Profile</h1>
                {canEdit && (
                    <button
                        onClick={handleOpenEdit}
                        className="btn-primary flex items-center gap-2"
                    >
                        <ImagePlus className="w-4 h-4" />
                        Edit Profile
                    </button>
                )}
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
                <div className="p-8 space-y-8">
                    <section>
                        <h3 className="text-sm font-black text-deped-blue uppercase tracking-widest mb-4 border-b pb-2">Institutional Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                            <ProfileItem label="School Name" value={schoolProfile.name} />
                            <ProfileItem label="School ID" value={schoolProfile.school_id} />
                            <ProfileItem label="Region" value={schoolProfile.region} />
                            <ProfileItem label="Division" value={schoolProfile.division} />
                            <ProfileItem label="District" value={schoolProfile.district} />
                             <ProfileItem label="Grade Levels Offered" value={schoolProfile.grade_levels_offered} />
                            <div className="col-span-full pt-4">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-tighter mb-3">Official Logo</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center overflow-hidden">
                                        <img 
                                            src={schoolProfile.logo_url || `${import.meta.env.BASE_URL}school-logo.png`} 
                                            alt="School Branding" 
                                            className="max-w-full max-h-full object-contain" 
                                        />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Dynamic Branding Active
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">This logo is visible on the login page and all reports.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-sm font-black text-deped-blue uppercase tracking-widest mb-4 border-b pb-2">School Leadership</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                            <ProfileItem label="Name of School Head" value={schoolProfile.head_name} />
                            <ProfileItem label="Position" value={schoolProfile.head_position} />
                            <ProfileItem label="Adviser Name" value={schoolProfile.adviser_name || ''} />
                            <ProfileItem label="Grade Level" value={schoolProfile.grade_level || ''} />
                            <ProfileItem label="Section" value={schoolProfile.section || ''} />
                        </div>
                    </section>
                </div>
            </div>

            {passwordModalNode}
        </div>
    );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-tighter mb-1">{label}</label>
            <p className="text-lg font-bold text-gray-800">{value || 'Not Specified'}</p>
        </div>
    );
}
