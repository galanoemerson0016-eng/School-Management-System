import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { X, Save, History, Trash2, Info } from 'lucide-react';
import { useSF10Store } from '../stores/sf10-store';
import type { SF10Version } from '../stores/sf10-store';
import type { Student, SchoolProfile } from '../types';
import { getSF10RowsForGrade } from '../lib/subjectConfig';

interface SF10HistoricalDataModalProps {
    student: Student;
    schoolProfile: SchoolProfile;
    onClose: () => void;
}

interface GradeVal {
    q1?: string;
    q2?: string;
    q3?: string;
    q4?: string;
    finalRating?: string;
    remarks?: string;
    label?: string;
}

export function SF10HistoricalDataModal({
    student,
    schoolProfile,
    onClose
}: SF10HistoricalDataModalProps) {
    const { overrides, setOverride, clearOverrides, history, restoreSnapshot } = useSF10Store();
    const gradeNum = parseInt(student.grade_level?.replace(/\D/g, '') || '0');
    const curriculumType: 'ES' | 'JHS' = gradeNum <= 6 ? 'ES' : 'JHS';
    
    // Determine which blocks to show based on curriculum type
    const availableBlocks = curriculumType === 'ES' ? [1, 2, 3, 4, 5, 6] : [7, 8, 9, 10];
    const [selectedBlockGrade, setSelectedBlockGrade] = useState(availableBlocks[0]);

    const [isUnlocked, setIsUnlocked] = useState(false);
    
    // Reset unlock state when changing blocks
    useEffect(() => {
        setIsUnlocked(false);
    }, [selectedBlockGrade]);

    const isCurrentGrade = selectedBlockGrade === gradeNum;
    const isLocked = isCurrentGrade && !isUnlocked;
    
    // Map block grade to index and page
    // For ES: G1-G4 -> Page 1 (Idx 0-3), G5-G6 -> Page 2 (Idx 4-5)
    // For JHS: G7-G8 -> Page 1 (Idx 0-1), G9-G10 -> Page 2 (Idx 2-3)
    const blockIdx = curriculumType === 'ES' ? (selectedBlockGrade - 1) : (selectedBlockGrade - 7);
    const pageNum = curriculumType === 'ES' ? (selectedBlockGrade <= 4 ? 1 : 2) : (selectedBlockGrade <= 8 ? 1 : 2);
    
    const overrideKey = `${student.lrn}_page_${pageNum}`;
    const currentOverrides = useMemo(() => overrides[overrideKey] || {}, [overrides, overrideKey]);

    const is3Term = selectedBlockGrade >= gradeNum;

    const getVal = useCallback((path: string) => currentOverrides[path] || '', [currentOverrides]);

    // Form state for block metadata
    const [metadata, setMetadata] = useState({
        schoolName: '',
        schoolId: '',
        district: '',
        division: '',
        region: '',
        section: '',
        schoolYear: '',
        adviserTeacher: '',
    });

    // Load metadata from overrides
    useEffect(() => {
        setMetadata({
            schoolName: getVal(`scholasticRecords[${blockIdx}].schoolName`),
            schoolId: getVal(`scholasticRecords[${blockIdx}].schoolId`),
            district: getVal(`scholasticRecords[${blockIdx}].district`),
            division: getVal(`scholasticRecords[${blockIdx}].division`),
            region: getVal(`scholasticRecords[${blockIdx}].region`),
            section: getVal(`scholasticRecords[${blockIdx}].section`),
            schoolYear: getVal(`scholasticRecords[${blockIdx}].schoolYear`),
            adviserTeacher: getVal(`scholasticRecords[${blockIdx}].adviserTeacher`),
        });
    }, [selectedBlockGrade, overrides, blockIdx, getVal]);

    // Subjects for the selected grade
    const rows = useMemo(() => {
        const customCurriculum = schoolProfile.curriculum;
        const useOldCurriculum = curriculumType === 'JHS' && gradeNum >= 9 && selectedBlockGrade > 0 && selectedBlockGrade < gradeNum;
        const finalRows = getSF10RowsForGrade(selectedBlockGrade, customCurriculum, { useOldCurriculum });
        
        return finalRows;
    }, [selectedBlockGrade, schoolProfile, curriculumType, gradeNum]);

    const [grades, setGrades] = useState<Record<string, GradeVal | string>>({});

    // Load grades from overrides
    useEffect(() => {
        const newGrades: Record<string, GradeVal | string> = {};
        rows.forEach(row => {
            const base = `scholasticRecords[${blockIdx}].subjects.${row.key}`;
            newGrades[row.key] = {
                q1: getVal(`${base}.q1`),
                q2: getVal(`${base}.q2`),
                q3: getVal(`${base}.q3`),
                q4: getVal(`${base}.q4`),
                finalRating: getVal(`${base}.finalRating`),
                remarks: getVal(`${base}.remarks`),
            };
        });
        // General Average
        newGrades['generalAverage'] = getVal(`scholasticRecords[${blockIdx}].subjects.generalAverage`);
        // Load custom labels for extra rows
        rows.forEach(row => {
            if (row.key.startsWith('extra_')) {
                const gradeVal = newGrades[row.key];
                if (typeof gradeVal === 'object' && gradeVal !== null) {
                    gradeVal.label = getVal(`scholasticRecords[${blockIdx}].subjects.${row.key}.label`);
                }
            }
        });
        setGrades(newGrades);
    }, [selectedBlockGrade, student.lrn, blockIdx, getVal, rows]);

    const handleMetadataChange = (field: string, value: string) => {
        setMetadata(prev => ({ ...prev, [field]: value }));
        setOverride(student.lrn, `page_${pageNum}`, `scholasticRecords[${blockIdx}].${field}`, value);
        
        // Auto-ensure grade level info is present
        setOverride(student.lrn, `page_${pageNum}`, `scholasticRecords[${blockIdx}].gradeLevel`, `Grade ${selectedBlockGrade}`);
        setOverride(student.lrn, `page_${pageNum}`, `scholasticRecords[${blockIdx}].gradeLevelNum`, String(selectedBlockGrade));
    };

    const handleGradeChange = (subjectKey: string, quarter: string, value: string) => {
        const updatedGrades = { ...grades };
        const currentGradeVal = typeof updatedGrades[subjectKey] === 'object' 
            ? (updatedGrades[subjectKey] as GradeVal) 
            : {};
        const subjectGrade: GradeVal = { ...currentGradeVal, [quarter]: value };
        updatedGrades[subjectKey] = subjectGrade;

        // Auto-calculate Final Rating
        const q1 = parseFloat(subjectGrade.q1 || '') || 0;
        const q2 = parseFloat(subjectGrade.q2 || '') || 0;
        const q3 = parseFloat(subjectGrade.q3 || '') || 0;
        const q4 = parseFloat(subjectGrade.q4 || '') || 0;

        const filledQuarters = is3Term 
            ? [q1, q2, q3].filter(v => v > 0)
            : [q1, q2, q3, q4].filter(v => v > 0);
            
        const isExtra = subjectKey.startsWith('extra_reserved_');
        const hasLabel = isExtra ? (subjectGrade.label?.trim() || '') !== '' : true;

        const isComponent = ['music', 'arts', 'physicalEducation', 'health', 'musicAndArts', 'peAndHealth', 'musicarts', 'pehealth'].includes(subjectKey) || (row?.indent && row?.key !== 'mapeh');

        if (isComponent) {
            // MAPEH components should not have final rating or remarks in SF10
            subjectGrade.finalRating = '';
            subjectGrade.remarks = '';
            const base = `scholasticRecords[${blockIdx}].subjects.${subjectKey}`;
            setOverride(student.lrn, `page_${pageNum}`, `${base}.${quarter}`, value);
            setOverride(student.lrn, `page_${pageNum}`, `${base}.finalRating`, '');
            setOverride(student.lrn, `page_${pageNum}`, `${base}.remarks`, '');
        } else if (filledQuarters.length > 0 && hasLabel) {
            const avg = Math.round(filledQuarters.reduce((a, b) => a + b, 0) / filledQuarters.length);
            subjectGrade.finalRating = avg.toString();
            subjectGrade.remarks = avg >= 75 ? 'PASSED' : 'FAILED';
            
            // Save to overrides
            const base = `scholasticRecords[${blockIdx}].subjects.${subjectKey}`;
            setOverride(student.lrn, `page_${pageNum}`, `${base}.${quarter}`, value);
            setOverride(student.lrn, `page_${pageNum}`, `${base}.finalRating`, avg.toString());
            setOverride(student.lrn, `page_${pageNum}`, `${base}.remarks`, subjectGrade.remarks);
        } else {
            // Clear everything if no grades are left or no label is present for extra subjects
            const base = `scholasticRecords[${blockIdx}].subjects.${subjectKey}`;
            subjectGrade.finalRating = '';
            subjectGrade.remarks = '';
            setOverride(student.lrn, `page_${pageNum}`, `${base}.${quarter}`, value);
            setOverride(student.lrn, `page_${pageNum}`, `${base}.finalRating`, '');
            setOverride(student.lrn, `page_${pageNum}`, `${base}.remarks`, '');
        }

        // Recalculate General Average
        let total = 0;
        let count = 0;
        
        Object.keys(updatedGrades).forEach(key => {
            if (key === 'generalAverage') return;
            // Exclude components from GPA (standard SF10 rules)
            const isComponent = ['music', 'arts', 'physicalEducation', 'health', 'musicAndArts', 'peAndHealth'].includes(key);
            const gradeObj = updatedGrades[key];
            if (typeof gradeObj === 'object' && gradeObj !== null) {
                const final = parseFloat(gradeObj.finalRating || '') || 0;
                const hasLabel = key.startsWith('extra_') ? (gradeObj.label?.trim() || '') !== '' : true;
                
                if (final > 0 && !isComponent && hasLabel) {
                    total += final;
                    count++;
                }
            }
        });

        if (count > 0) {
            const genAvg = Math.round(total / count);
            updatedGrades['generalAverage'] = genAvg.toString();
            setOverride(student.lrn, `page_${pageNum}`, `scholasticRecords[${blockIdx}].subjects.generalAverage`, genAvg.toString());
        } else {
            updatedGrades['generalAverage'] = '';
            setOverride(student.lrn, `page_${pageNum}`, `scholasticRecords[${blockIdx}].subjects.generalAverage`, '');
        }

        setGrades(updatedGrades);
    };

    const handleReset = () => {
        if (confirm(`Are you sure you want to reset Grade ${selectedBlockGrade} to system-computed data? All manual edits for this block will be cleared.`)) {
            clearOverrides(student.lrn, `page_${pageNum}`);
        }
    };

    const blockSnapshots = useMemo(() => {
        const key = `${student.lrn}_page_${pageNum}`;
        return (history[key] || []).sort((a, b) => b.timestamp - a.timestamp);
    }, [history, student.lrn, pageNum]);

    return (
        <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <History className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Manage Historical SF10 Data</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{student.last_name}, {student.first_name} • {curriculumType === 'ES' ? 'Elementary' : 'Junior High'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-all">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto flex">
                    {/* Sidebar - Block Selection */}
                    <div className="w-64 bg-slate-50/50 border-r border-slate-100 p-6 space-y-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Grade Levels</span>
                        {availableBlocks.map(g => (
                            <button
                                key={g}
                                onClick={() => setSelectedBlockGrade(g)}
                                className={`w-full px-4 py-3 rounded-2xl text-left font-bold transition-all flex items-center justify-between group ${selectedBlockGrade === g ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}
                            >
                                <span>Grade {g}</span>
                                {selectedBlockGrade === g && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                            </button>
                        ))}
                        
                        <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <div className="flex items-center gap-2 text-blue-600 mb-2">
                                <Info className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase">Note</span>
                            </div>
                            <p className="text-[10px] text-blue-600/70 font-medium leading-relaxed">
                                Manual entries here will override system-computed grades for this block. Auto-computation is applied on entry.
                            </p>
                        </div>

                        {/* Snapshots / Version History */}
                        {blockSnapshots.length > 0 && (
                            <div className="mt-8 space-y-3">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Version History</span>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                    {blockSnapshots.map((snap: SF10Version) => (
                                        <div key={snap.id} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-500">{new Date(snap.timestamp).toLocaleString()}</span>
                                                <button 
                                                    onClick={() => restoreSnapshot(student.lrn, `page_${pageNum}`, snap.id)}
                                                    className="text-[9px] font-black text-blue-600 uppercase hover:underline"
                                                >
                                                    Restore
                                                </button>
                                            </div>
                                            <p className="text-[9px] text-slate-400 italic truncate">"{snap.label}"</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main Form */}
                    <div className="flex-1 p-8 overflow-auto custom-scrollbar relative">
                        {isLocked && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
                                <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col items-center gap-6 max-w-sm text-center">
                                    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                                        <Info className="w-10 h-10" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 mb-2">Current Grade Protected</h3>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                            This is the student's current grade level. Manual overrides are disabled to prevent data mismatch with the e-Class Record.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setIsUnlocked(true)}
                                        className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                                    >
                                        Unlock Manual Editing
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-8">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">General Information</span>
                            <button 
                                onClick={handleReset}
                                className="flex items-center gap-2 text-rose-500 hover:text-rose-600 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Reset Block to System Data</span>
                            </button>
                        </div>

                        {/* School Metadata Grid */}
                        <div className="grid grid-cols-4 gap-6 mb-8">
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">School Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                    value={metadata.schoolName}
                                    onChange={(e) => handleMetadataChange('schoolName', e.target.value)}
                                    placeholder="Enter school name"
                                    disabled={isLocked}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">School ID</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-center"
                                    value={metadata.schoolId}
                                    onChange={(e) => handleMetadataChange('schoolId', e.target.value)}
                                    placeholder="ID"
                                    disabled={isLocked}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">School Year</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-center"
                                    value={metadata.schoolYear}
                                    onChange={(e) => handleMetadataChange('schoolYear', e.target.value)}
                                    placeholder="YYYY-YYYY"
                                    disabled={isLocked}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">District</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                    value={metadata.district}
                                    onChange={(e) => handleMetadataChange('district', e.target.value)}
                                    disabled={isLocked}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Division</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                    value={metadata.division}
                                    onChange={(e) => handleMetadataChange('division', e.target.value)}
                                    disabled={isLocked}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Region</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                    value={metadata.region}
                                    onChange={(e) => handleMetadataChange('region', e.target.value)}
                                    disabled={isLocked}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                    value={metadata.section}
                                    onChange={(e) => handleMetadataChange('section', e.target.value)}
                                    disabled={isLocked}
                                />
                            </div>
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Adviser</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                    value={metadata.adviserTeacher}
                                    onChange={(e) => handleMetadataChange('adviserTeacher', e.target.value)}
                                    disabled={isLocked}
                                />
                            </div>
                        </div>

                        {/* Grades Grid */}
                        <div className="bg-slate-50 rounded-4xl border border-slate-100 overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-900 text-white">
                                        <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-left border-r border-slate-700/50">Learning Areas</th>
                                        <th className="w-16 px-2 py-4 font-black uppercase text-[10px] tracking-widest text-center border-r border-slate-700/50">1</th>
                                        <th className="w-16 px-2 py-4 font-black uppercase text-[10px] tracking-widest text-center border-r border-slate-700/50">2</th>
                                        <th className="w-16 px-2 py-4 font-black uppercase text-[10px] tracking-widest text-center border-r border-slate-700/50">3</th>
                                        {!is3Term && <th className="w-16 px-2 py-4 font-black uppercase text-[10px] tracking-widest text-center border-r border-slate-700/50">4</th>}
                                        <th className="w-24 px-4 py-4 font-black uppercase text-[10px] tracking-widest text-center border-r border-slate-700/50">Final</th>
                                        <th className="w-32 px-6 py-4 font-black uppercase text-[10px] tracking-widest text-center">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {rows.map((row) => {
                                        const rowGrade = grades[row.key] as GradeVal | undefined;
                                        return (
                                            <tr key={row.key} className="hover:bg-white transition-colors group">
                                                <td className="px-6 py-3 font-bold text-slate-700 border-r border-slate-200">
                                                    {(row.key.startsWith('extra_') || (rowGrade?.label !== undefined && rowGrade.label !== row.label)) ? (
                                                        <input
                                                            type="text"
                                                            className="w-full bg-transparent border-b border-dashed border-slate-200 focus:border-blue-500 outline-none px-1 py-0.5 font-bold text-slate-700"
                                                            value={rowGrade?.label !== undefined ? rowGrade.label : row.label}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setGrades(prev => {
                                                                    const prevGrade = (prev[row.key] as GradeVal) || {};
                                                                    return {
                                                                        ...prev,
                                                                        [row.key]: { ...prevGrade, label: val }
                                                                    };
                                                                });
                                                                setOverride(student.lrn, `page_${pageNum}`, `scholasticRecords[${blockIdx}].subjects.${row.key}.label`, val);
                                                                
                                                                // If label is cleared, clear everything else too
                                                                if (val.trim() === '') {
                                                                    const base = `scholasticRecords[${blockIdx}].subjects.${row.key}`;
                                                                    setOverride(student.lrn, `page_${pageNum}`, `${base}.q1`, '');
                                                                    setOverride(student.lrn, `page_${pageNum}`, `${base}.q2`, '');
                                                                    setOverride(student.lrn, `page_${pageNum}`, `${base}.q3`, '');
                                                                    setOverride(student.lrn, `page_${pageNum}`, `${base}.q4`, '');
                                                                    setOverride(student.lrn, `page_${pageNum}`, `${base}.finalRating`, '');
                                                                    setOverride(student.lrn, `page_${pageNum}`, `${base}.remarks`, '');
                                                                    setGrades(prev => ({
                                                                        ...prev,
                                                                        [row.key]: { label: '', q1: '', q2: '', q3: '', q4: '', finalRating: '', remarks: '' }
                                                                    }));
                                                                }
                                                            }}
                                                            placeholder="Type subject name..."
                                                            disabled={isLocked}
                                                        />
                                                    ) : (
                                                        row.label
                                                    )}
                                                </td>
                                                {['q1', 'q2', 'q3', ...(!is3Term ? ['q4'] : [])].map((q) => (
                                                    <td key={q} className="p-1.5 border-r border-slate-200 bg-slate-50/50 group-hover:bg-transparent transition-colors">
                                                        <input
                                                            type="text"
                                                            className="w-full h-10 bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 rounded-xl text-center font-black text-slate-900 outline-none transition-all tabular-nums shadow-sm"
                                                            value={rowGrade?.[q as keyof GradeVal] || ''}
                                                            onChange={(e) => handleGradeChange(row.key, q, e.target.value)}
                                                            maxLength={3}
                                                            placeholder="-"
                                                            disabled={isLocked}
                                                        />
                                                    </td>
                                                ))}
                                                {(() => {
                                                    const isComponentRow = ['music', 'arts', 'physicalEducation', 'health', 'musicAndArts', 'peAndHealth', 'musicarts', 'pehealth'].includes(row.key) || (row.indent && row.key !== 'mapeh');
                                                    return (
                                                        <>
                                                            <td className="px-4 text-center border-r border-slate-200">
                                                                {!isComponentRow ? (
                                                                    <span className={`inline-block px-3 py-1 rounded-lg font-black tabular-nums ${parseFloat(rowGrade?.finalRating || '') > 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                                                        {(rowGrade?.label?.trim() !== '' || !row.key.startsWith('extra_')) ? (rowGrade?.finalRating || '--') : '--'}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-400 font-medium">--</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 text-center">
                                                                {!isComponentRow ? (
                                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${rowGrade?.remarks === 'PASSED' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                        {(rowGrade?.label?.trim() !== '' || !row.key.startsWith('extra_')) ? (rowGrade?.remarks || '--') : '--'}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-400 font-medium">--</span>
                                                                )}
                                                            </td>
                                                        </>
                                                    );
                                                })()}
                                            </tr>
                                        );
                                    })}
                                    <tr className="bg-slate-900/5 font-black">
                                        <td className="px-6 py-6 text-right uppercase tracking-widest text-xs text-slate-500 border-r border-slate-200">General Average</td>
                                        <td colSpan={is3Term ? 3 : 4} className="border-r border-slate-200"></td>
                                        <td className="px-4 text-center border-r border-slate-200">
                                            <div className="w-full h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-lg">
                                                {(grades.generalAverage as string) || '--'}
                                            </div>
                                        </td>
                                        <td className="px-6 text-center">
                                            <span className={`text-xs font-black uppercase tracking-widest ${parseFloat((grades.generalAverage as string) || '0') >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {parseFloat((grades.generalAverage as string) || '0') >= 75 ? 'PROMOTED' : ''}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-3 rounded-2xl text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                        Close
                    </button>
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg"
                    >
                        <Save className="w-4 h-4" />
                        Finish Encoding
                    </button>
                </div>
            </div>
        </div>
    );
}
