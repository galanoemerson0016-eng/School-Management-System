import { useState, useEffect } from 'react';
import { useAppStore } from '../stores';
import type { SchoolProfile } from '../types';

export function InstitutePage() {
    const { schoolProfile, updateSchoolProfile } = useAppStore();
    const [isEditing, setIsEditing] = useState(false);

    // Safety check: Fallback to empty/default if schoolProfile from store is partial/missing
    const safeProfile: SchoolProfile = {
        school_id: schoolProfile?.school_id || '',
        name: schoolProfile?.name || '',
        region: schoolProfile?.region || '',
        division: schoolProfile?.division || '',
        district: schoolProfile?.district || '',
        head_name: schoolProfile?.head_name || '',
        head_position: schoolProfile?.head_position || '',
        grade_levels_offered: schoolProfile?.grade_levels_offered || ''
    };

    const [formData, setFormData] = useState<SchoolProfile>(safeProfile);

    // Sync formData when schoolProfile changes (e.g. from Firebase sync)
    // Only if NOT currently editing, to avoid overwriting user input
    useEffect(() => {
        if (!isEditing) {
            setFormData(safeProfile);
        }
    }, [schoolProfile, isEditing]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateSchoolProfile(formData);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update profile:", error);
            alert("An error occurred while saving.");
        }
    };

    if (!schoolProfile) {
        return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
    }

    if (isEditing) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md border border-gray-100">
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
                    </div>

                    <div className="flex justify-end gap-4 mt-10 pt-6 border-t">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-6 py-2 text-gray-600 font-semibold hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-deped-blue">Institute Profile</h1>
                <button
                    onClick={() => {
                        setFormData(schoolProfile);
                        setIsEditing(true);
                    }}
                    className="btn-primary"
                >
                    Edit Profile
                </button>
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
                            <div className="col-span-full">
                                <ProfileItem label="School Logo URL" value={schoolProfile.logo_url || '/deped-logo-left.png'} />
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-sm font-black text-deped-blue uppercase tracking-widest mb-4 border-b pb-2">School Leadership</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                            <ProfileItem label="Name of School Head" value={schoolProfile.head_name} />
                            <ProfileItem label="Position" value={schoolProfile.head_position} />
                        </div>
                    </section>
                </div>
            </div>
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
