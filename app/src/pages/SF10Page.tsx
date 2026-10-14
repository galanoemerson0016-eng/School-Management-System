import { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '../stores/app-store';
import { useAuthStore } from '../stores/auth-store';
import { useSF10Store } from '../stores/sf10-store';
import { db } from '../services/database';
import type { Student, Section, Subject, ClassRecord } from '../types';
import { getDefaultTermForSubject } from '../lib/curriculum';
import { getCanonicalSubjectKey, normalizeSubjectName } from '../lib/subjectConfig';
import { reconcileOrphanedGradesAndSubjects } from '../utils/grade-reconciliation';
import { isMatchingSubject, isStudentInSection, isMaleStudent, isFemaleStudent } from '../utils/grading-helpers';
import SF10SpecRenderer from '../components/SF10SpecRenderer';
import SF10JHSRenderer from '../components/SF10JHSRenderer';
import { SF10SHSRenderer } from '../components/SF10SHSRenderer';
import { mapStudentToSpecData } from '../utils/sf10Mapper';
import { mapStudentToShsSf10Data } from '../utils/shsSf10Mapper';
import { ArrowLeft, Printer, FileText, Plus, Minus, ChevronDown, Bug, RefreshCcw } from 'lucide-react';
import { canAccessSF9Section, filterSF9Sections } from '../lib/rbac';

export function SF10Page() {
    const { 
        students, 
        sections, 
        subjects, 
        gradingSheetRecords, 
        classRecords, 
        teachers, 
        schoolProfile, 
        activeSchoolYear, 
        setCurrentView,
        selectedSection: globalSelectedSection,
        setSelectedSection: setGlobalSelectedSection
    } = useAppStore();
    const { user } = useAuthStore();
    const { overrides, setOverride, clearOverrides } = useSF10Store();
    
    const [selectedSectionState, setSelectedSectionState] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [zoom, setZoom] = useState(1);
    const [isSyncingFromGrading, setIsSyncingFromGrading] = useState(false);
    const [syncVersion, setSyncVersion] = useState(0);

    const handlePrintSF10 = () => {
        if (!selectedStudent) return;
        const originalTitle = document.title;
        const safeName = `${selectedStudent.last_name}_${selectedStudent.first_name}`.replace(/[^a-z0-9]/gi, '_');
        document.title = `SF10_${safeName}_${activeSchoolYear}`;
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 1000);
    };

    const sortedSections = useMemo(() => {
        return [...filterSF9Sections(user, sections)].sort((a, b) => {
            const getGradeNum = (val: string) => {
                const num = val.match(/\d+/);
                return num ? parseInt(num[0] || '0') : 0;
            };
            const gradeA = getGradeNum(a.section_grade_level);
            const gradeB = getGradeNum(b.section_grade_level);
            if (gradeA !== gradeB) return gradeA - gradeB;
            return a.section_name.localeCompare(b.section_name);
        });
    }, [sections, user]);

    const selectedSection = useMemo(() => {
        if (selectedSectionState && sortedSections?.some(s => s.section_name === selectedSectionState || s.id === selectedSectionState)) {
            return sortedSections.find(s => s.id === selectedSectionState || s.section_name === selectedSectionState)?.id || '';
        }
        if (globalSelectedSection && sortedSections?.some(s => s.section_name === globalSelectedSection || s.id === globalSelectedSection)) {
            const match = sortedSections.find(s => s.section_name === globalSelectedSection || s.id === globalSelectedSection);
            return match?.id || '';
        }
        return sortedSections?.[0]?.id || '';
    }, [selectedSectionState, globalSelectedSection, sortedSections]);

    const setSelectedSection = (val: string) => {
        setSelectedSectionState(val);
        setGlobalSelectedSection(val);
    };

    const groupedSections = useMemo(() => {
        const groups: Record<string, Section[]> = {
            'ELEMENTARY': [],
            'JUNIOR HIGH SCHOOL': [],
            'SENIOR HIGH SCHOOL': []
        };
        
        sortedSections.forEach(s => {
            const gl = (s.section_grade_level || '').toLowerCase();
            const num = parseInt(gl.replace(/\D/g, '')) || 0;
            
            if (gl.includes('kinder') || (num >= 1 && num <= 6)) {
                groups['ELEMENTARY'].push(s);
            } else if (num >= 7 && num <= 10) {
                groups['JUNIOR HIGH SCHOOL'].push(s);
            } else if (num >= 11 && num <= 12) {
                groups['SENIOR HIGH SCHOOL'].push(s);
            } else {
                groups['ELEMENTARY'].push(s);
            }
        });
        
        return groups;
    }, [sortedSections]);

    const selectedSectionObj = useMemo(() => {
        return sections.find((s) => s.section_name === selectedSection || s.id === selectedSection);
    }, [sections, selectedSection]);

    const _isShsSection = useMemo(() => {
        const grade = (selectedSectionObj?.section_grade_level || '').toString().toLowerCase();
        if (!grade.includes('grade')) return false;
        const num = parseInt(grade.replace(/\D/g, '')) || 0;
        return num === 11 || num === 12;
    }, [selectedSectionObj?.section_grade_level]);

    const isShsSf10Selection = useMemo(() => {
        const fromStudent = (selectedStudent?.grade_level || '').toString();
        const text = `${fromStudent} ${selectedSectionObj?.section_grade_level || ''}`.toLowerCase();
        if (!text.includes('grade')) return false;
        const num = parseInt(text.replace(/\D/g, '')) || 0;
        return num === 11 || num === 12;
    }, [selectedStudent?.grade_level, selectedSectionObj?.section_grade_level]);

    const canEditCurrentSection = useMemo(() => {
        if (!user) return false;
        if (!selectedSectionObj) return true;
        return canAccessSF9Section(user, selectedSectionObj);
    }, [user, selectedSectionObj]);

    const sectionStudents = useMemo(() => {
        if (!selectedSectionObj) return [];
        return students.filter(s => isStudentInSection(s, selectedSectionObj));
    }, [students, selectedSectionObj]);

    const males = sectionStudents.filter(s => isMaleStudent(s)).sort((a, b) => a.last_name.localeCompare(b.last_name));
    const females = sectionStudents.filter(s => isFemaleStudent(s)).sort((a, b) => a.last_name.localeCompare(b.last_name));

    const studentKey = selectedStudent?.lrn || '';

    const specData = useMemo(() => {
        // Re-evaluate whenever syncVersion changes after Grade Management sync
        void syncVersion;
        const overrideKey = `${studentKey}_page_${currentPage}`;
        const currentOverrides = overrides[overrideKey] || {};
        if (!selectedStudent) return null;
        
        const isSHS = selectedStudent.grade_level?.includes('11') || selectedStudent.grade_level?.includes('12');
        
        const baseData = isSHS ? mapStudentToShsSf10Data({
            student: selectedStudent,
            profile: schoolProfile,
            schoolYear: activeSchoolYear,
            sections,
            teachers,
            gradingSheetRecords,
            classRecords,
            subjects,
        }) : mapStudentToSpecData({
            student: selectedStudent,
            profile: schoolProfile,
            schoolYear: activeSchoolYear,
            sections,
            teachers,
            gradingSheetRecords,
            classRecords,
            subjects,
        });
        
        const mergedData = JSON.parse(JSON.stringify(baseData)); // Deep clone
        Object.entries(currentOverrides).forEach(([path, value]) => {
            if (!path || value === undefined) return;

            const parts = path.split('.');
            let curr = mergedData as Record<string, unknown>;
            
            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                if (part.includes('[')) {
                    const [p, rest] = part.split('[');
                    const idx = parseInt(rest.replace(']', ''));
                    if (!curr[p]) curr[p] = [];
                    const arr = curr[p] as unknown[];
                    if (!arr[idx]) arr[idx] = {};
                    curr = arr[idx] as Record<string, unknown>;
                } else {
                    if (!curr[part]) curr[part] = {};
                    curr = curr[part] as Record<string, unknown>;
                }
            }

            const lastPart = parts[parts.length - 1];
            if (lastPart) {
                curr[lastPart] = value;
            }
        });

        // Combine everything: prefer nested structure but fallback to flat keys for getVal compatibility
        return { ...mergedData, ...currentOverrides };
    }, [selectedStudent, schoolProfile, activeSchoolYear, sections, teachers, gradingSheetRecords, classRecords, subjects, overrides, studentKey, currentPage, syncVersion]);

    const handleCellUpdate = (path: string, value: string) => {
        if (!selectedStudent) return;
        // Allow certification fields to always be editable
        const isCertPath = path.startsWith('certification.');
        if (!isCertPath && !canEditCurrentSection) return;
        setOverride(selectedStudent.lrn, `page_${currentPage}`, path, value);
    };

    const handleResetOverrides = () => {
        if (!selectedStudent) return;
        if (window.confirm('Are you sure you want to reset all manual edits for this page? This will clear any inputted data and restore the template defaults.')) {
            clearOverrides(selectedStudent.lrn, `page_${currentPage}`);
        }
    };

    const handleSyncFromGradeManagement = useCallback(async () => {
        if (!selectedSectionObj) {
            useAppStore.getState().showNotification('Please select an advisory section first.', 'info');
            return;
        }

        setIsSyncingFromGrading(true);
        try {
            // 1. Fetch fresh IndexedDB records directly into app state
            const [freshGradingRecords, freshClassRecords, freshSections, freshRawSubjects] = await Promise.all([
                db.getAllRecords<ClassRecord>('gradingSheetRecords'),
                db.getAllRecords<ClassRecord>('classRecords'),
                db.getAllRecords<Section>('sections'),
                db.getAllRecords<Subject>('subjects')
            ]);

            const freshSubjects: Subject[] = (freshRawSubjects || []).map((s: Subject) => ({
                ...s,
                term: s.term !== undefined && s.term !== null ? s.term : getDefaultTermForSubject(s.subject_name, s.grade_level)
            }));

            // Update app store state so all components immediately have the latest records
            useAppStore.setState({
                gradingSheetRecords: freshGradingRecords || [],
                classRecords: freshClassRecords || [],
                sections: freshSections || [],
                subjects: freshSubjects
            });

            // 2. Run reconciliation to auto-heal duplicate subjects & consolidate grades
            const recon = reconcileOrphanedGradesAndSubjects({
                subjects: freshSubjects,
                sections: freshSections || [],
                students: useAppStore.getState().students,
                classRecords: freshClassRecords || [],
                hpsRecords: useAppStore.getState().hpsRecords,
                gradingSheetRecords: freshGradingRecords || []
            });

            if (recon.subjectsModified && recon.subjects) {
                await db.putRecordsBulk('subjects', recon.subjects);
            }
            if (recon.deletedSubjectIds.length > 0) {
                await db.deleteRecordsBulk('subjects', recon.deletedSubjectIds);
            }
            if (recon.modified) {
                if (recon.classRecords) await db.putRecordsBulk('classRecords', recon.classRecords);
                if (recon.hpsRecords) await db.putRecordsBulk('hpsRecords', recon.hpsRecords);
                if (recon.gradingSheetRecords) await db.putRecordsBulk('gradingSheetRecords', recon.gradingSheetRecords);
            }

            const reconciledSubjects = recon.subjects || freshSubjects;
            const reconciledSections = recon.sections || freshSections || [];
            const reconciledGradingRecords = recon.gradingSheetRecords || freshGradingRecords || [];
            const reconciledClassRecords = recon.classRecords || freshClassRecords || [];

            // 3. Find current section from reconciled sections
            const baseSection = reconciledSections.find((s: Section) => s.id === selectedSectionObj.id) || selectedSectionObj;

            // 4. Sanitize and deduplicate taught_subjects & teaching_subjects
            const sanitizeSubjectList = (list?: string[]): string[] | undefined => {
                if (!list) return undefined;
                const mapped = list.map(t => {
                    const trimmed = t.trim();
                    const matchedDb = reconciledSubjects.find(s => isMatchingSubject(trimmed, s.id, s.subject_name));
                    if (matchedDb && matchedDb.subject_name) {
                        return matchedDb.subject_name;
                    }
                    return trimmed;
                });
                const seenKeys = new Set<string>();
                const deduped: string[] = [];
                for (const item of mapped) {
                    const k = getCanonicalSubjectKey(item, baseSection.section_grade_level) || normalizeSubjectName(item);
                    if (k && seenKeys.has(k)) continue;
                    if (k) seenKeys.add(k);
                    deduped.push(item);
                }
                return deduped;
            };

            const cleanTaught = sanitizeSubjectList(baseSection.taught_subjects) || [];
            const cleanTeaching = sanitizeSubjectList(baseSection.teaching_subjects);

            const updatedSection = {
                ...baseSection,
                taught_subjects: cleanTaught,
                ...(cleanTeaching !== undefined ? { teaching_subjects: cleanTeaching } : {}),
                section_metadata: {
                    ...baseSection.section_metadata,
                    sf10SubjectSelections: undefined
                }
            };
            await useAppStore.getState().updateSection(updatedSection);

            // Update app store state so all components immediately have the latest records
            useAppStore.setState({
                gradingSheetRecords: reconciledGradingRecords,
                classRecords: reconciledClassRecords,
                sections: reconciledSections.map((s: Section) => s.id === updatedSection.id ? updatedSection : s),
                subjects: reconciledSubjects
            });

            // 5. Force re-calculation by incrementing syncVersion
            setSyncVersion(v => v + 1);

            // 6. Count total synchronized grades for this section
            const sectionGradesCount = reconciledGradingRecords.filter((r: ClassRecord) =>
                (r.section_id === updatedSection.id || r.section_id === updatedSection.section_name) &&
                (!activeSchoolYear || !r.school_year || r.school_year === activeSchoolYear) &&
                Number(r.final_grade) > 0
            ).length;

            const currentTaught = cleanTaught;

            // 6. Calculate official learning areas count (combining MAPEH components into 1 official subject for Grades 1-10)
            const sectionGradeNum = parseInt((updatedSection.section_grade_level || '').replace(/\D/g, '')) || 0;
            const isSHS = sectionGradeNum === 11 || sectionGradeNum === 12;

            const isMapehComp = (name: string) => {
                const n = name.toLowerCase().replace(/[^a-z]/g, '');
                return (
                    n.includes('musicandarts') || n.includes('musicarts') || (n.includes('music') && n.includes('arts')) ||
                    n.includes('physicaleducationandhealth') || n.includes('peandhealth') || n.includes('pehealth') ||
                    n === 'music' || n === 'arts' || n === 'pe' || n === 'health'
                );
            };

            let officialSubjectCount = currentTaught.length;
            if (!isSHS && currentTaught.length > 0) {
                const hasMapehOrComponents = currentTaught.some((s: string) => s.trim().toUpperCase() === 'MAPEH' || isMapehComp(s));
                const nonMapehTaught = currentTaught.filter((s: string) => s.trim().toUpperCase() !== 'MAPEH' && !isMapehComp(s));
                officialSubjectCount = nonMapehTaught.length + (hasMapehOrComponents ? 1 : 0);
            }

            const subjectCount = officialSubjectCount > 0 ? officialSubjectCount : (currentTaught.length > 0 ? currentTaught.length : 'curriculum');

            useAppStore.getState().showNotification(
                `Successfully synced subjects and grades from Grade Management! (${subjectCount} subjects, ${sectionGradesCount} grades loaded)`,
                'success'
            );
        } catch (error) {
            console.error('Failed to sync SF10 from Grade Management:', error);
            useAppStore.getState().showNotification('Failed to sync from Grade Management. Please try again.', 'error');
        } finally {
            setIsSyncingFromGrading(false);
        }
    }, [selectedSectionObj, activeSchoolYear]);

    return (
        <div className="sf10-print-root flex flex-col h-full min-h-0 bg-linear-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 dark:from-[#080d1a] dark:via-[#0b1329] dark:to-[#0d1630] relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white">
             {/* Sticky Premium Top Toolbar */}
             <div className="z-20 bg-white/80 dark:bg-[#0d1225]/90 backdrop-blur-2xl border-b border-slate-200/70 dark:border-white/10 shadow-[0_4px_20px_rgba(15,23,42,0.04)] relative print:hidden shrink-0 w-full">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-blue-500 via-indigo-500 to-cyan-500 z-30" />
                <div className="flex items-center justify-between w-full h-11 px-2 sm:px-3 gap-1 sm:gap-1.5 select-none overflow-x-auto custom-scrollbar">
                    
                    {/* Identity & Context Branding (Left Most Edge) */}
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 min-w-0">
                        <button 
                            onClick={() => setCurrentView('school-forms')}
                            className="w-7.5 h-7.5 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white transition-all group shrink-0 active:scale-95 duration-200"
                            title="Back to Hub"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="flex flex-col shrink-0 mr-1">
                            <h2 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-0.5">SF10 Record</h2>
                            <p className="text-[7px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider leading-none">Permanent Record</p>
                        </div>

                        {sortedSections.length >= 1 && (
                            <div className="relative group shrink-0">
                                <select 
                                    className="appearance-none h-7.5 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 rounded-lg px-2 pr-5 text-[9px] font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer max-w-28 sm:max-w-34 lg:max-w-40 truncate"
                                    value={selectedSection}
                                    onChange={(e) => { setSelectedSection(e.target.value); setSelectedStudent(null); }}
                                    title="Select Advisory Section"
                                >
                                    <option value="">Choose Section</option>
                                    {Object.entries(groupedSections).map(([group, groupSections]) => (
                                        groupSections.length > 0 && (
                                            <optgroup key={group} label={group}>
                                                {groupSections.map(s => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.section_grade_level} - {s.section_name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        )
                                    ))}
                                </select>
                                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        )}

                        <div className="relative group shrink-0">
                            <select 
                                className="appearance-none h-7.5 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 rounded-lg px-2 pr-5 text-[9px] font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 cursor-pointer max-w-30 sm:max-w-38 lg:max-w-46 truncate disabled:opacity-30"
                                value={selectedStudent?.lrn || ''}
                                onChange={(e) => setSelectedStudent(students.find(s => s.lrn === e.target.value) || null)}
                                disabled={!selectedSection}
                                title="Select Student"
                            >
                                <option value="">Select Student</option>
                                {males.length > 0 && (
                                    <optgroup label="MALE">
                                        {males.map(s => <option key={s.lrn} value={s.lrn}>{s.last_name}, {s.first_name}</option>)}
                                    </optgroup>
                                )}
                                {females.length > 0 && (
                                    <optgroup label="FEMALE">
                                        {females.map(s => <option key={s.lrn} value={s.lrn}>{s.last_name}, {s.first_name}</option>)}
                                    </optgroup>
                                )}
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    {/* View & Formatting Controls (Center) */}
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        {selectedStudent && (
                            <>
                                <div className="flex bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 h-7.5 shrink-0">
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        className={`px-2 h-full rounded-md text-[7.5px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95 ${currentPage === 1 ? 'bg-white dark:bg-white/20 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}
                                    >
                                        Page 1
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(2)}
                                        className={`px-2 h-full rounded-md text-[7.5px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95 ${currentPage === 2 ? 'bg-white dark:bg-white/20 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}
                                    >
                                        Page 2
                                    </button>
                                </div>

                                <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 shrink-0 h-7.5">
                                    <button 
                                        onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))}
                                        className="w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all shadow-xs active:scale-90"
                                        title="Zoom Out"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-[8.5px] font-black text-slate-900 dark:text-white w-7 text-center tabular-nums">
                                        {Math.round(zoom * 100)}%
                                    </span>
                                    <button 
                                        onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                                        className="w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded-md transition-all shadow-xs active:scale-90"
                                        title="Zoom In"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Sync Button from Grade Management (visible whenever a section is selected!) */}
                        {selectedSectionObj && (
                            <button
                                onClick={handleSyncFromGradeManagement}
                                disabled={isSyncingFromGrading}
                                className={`h-7.5 px-2 rounded-lg border text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-xs shrink-0 active:scale-95 cursor-pointer ${
                                    isSyncingFromGrading
                                        ? 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-white/5 dark:text-slate-500 dark:border-white/10 cursor-wait'
                                        : 'bg-white dark:bg-white/10 border-slate-200 dark:border-white/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300'
                                }`}
                                title="Sync subjects and grades based on Grade Management"
                            >
                                <RefreshCcw className={`w-3 h-3 text-emerald-600 dark:text-emerald-400 ${isSyncingFromGrading ? 'animate-spin' : ''}`} />
                                <span>{isSyncingFromGrading ? 'Syncing...' : 'Sync'}</span>
                            </button>
                        )}
                    </div>

                    {/* Data and Actions (Right) */}
                    {selectedStudent && (
                        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                            <button
                                onClick={handleResetOverrides}
                                disabled={!selectedStudent}
                                className="h-7.5 px-2 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-red-50 dark:hover:bg-red-500/20 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 font-black text-[8px] uppercase tracking-wider disabled:opacity-30 transition-all flex items-center gap-1 shadow-xs shrink-0 active:scale-95 border border-slate-200/40 dark:border-white/10"
                                title="Reset all manual edits for this page"
                            >
                                <span>Reset</span>
                            </button>
                            
                            <button
                                onClick={() => {
                                    window.dispatchEvent(new CustomEvent('formease-open-grade-debugger', {
                                        detail: {
                                            sectionId: selectedSectionObj?.id || selectedSectionState,
                                            studentLrn: selectedStudent?.lrn
                                        }
                                    }));
                                }}
                                className="h-7.5 px-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:text-amber-700 border border-amber-200/60 dark:border-amber-700/30 transition-all flex items-center gap-1 shrink-0 active:scale-95 text-[8px] font-black uppercase tracking-wider cursor-pointer"
                                title="Inspect & Debug Grade Sync"
                            >
                                <Bug className="w-3 h-3" />
                                <span>Inspect</span>
                            </button>

                            <button
                                onClick={handlePrintSF10}
                                disabled={!selectedStudent}
                                className="h-7.5 px-2.5 sm:px-3 rounded-lg bg-blue-600 text-white font-black text-[8px] uppercase tracking-wider shadow-sm hover:bg-blue-700 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1 group whitespace-nowrap"
                                title="Print Official SF10"
                            >
                                <Printer className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" />
                                <span>Print</span>
                            </button>
                        </div>
                    )}
                </div>
             </div>

             {/* Workspace Container */}
             <div className="flex-1 overflow-auto relative bg-linear-to-b from-slate-100/70 to-blue-100/40 dark:from-[#080d1a] dark:to-[#0c142c] print:bg-white custom-scrollbar">
                <div className="w-full min-h-full flex flex-col items-center justify-start py-6 sm:py-8 px-3 sm:px-6 lg:px-10 relative print:overflow-visible print:py-0 print:px-0">
                    {selectedStudent && specData ? (
                        <div
                            className="transition-all duration-700 ease-out origin-top print:scale-100"
                            style={{
                                transform: `scale(${zoom}) translateZ(0)`,
                                transformOrigin: 'top center',
                                willChange: 'transform',
                                backfaceVisibility: 'hidden',
                                WebkitBackfaceVisibility: 'hidden'
                            }}
                        >
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-linear-to-br from-blue-500/5 to-indigo-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000" />
                                <div className={`sf10-print-sheet relative bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-sm print:shadow-none overflow-hidden mb-20 last:mb-0 print:mb-0 print:rounded-none ${currentPage === 1 ? 'sf10-force-single-page' : ''}`}>
                                    {isShsSf10Selection ? (
                                        <SF10SHSRenderer
                                            pageNumber={currentPage}
                                            data={specData}
                                            onUpdate={handleCellUpdate}
                                            dbSubjects={subjects}
                                        />
                                    ) : specData.isES ? (
                                        <SF10SpecRenderer
                                            pageNumber={currentPage}
                                            data={specData}
                                            onUpdate={handleCellUpdate}
                                            dbSubjects={subjects}
                                        />
                                    ) : (
                                        <SF10JHSRenderer
                                            pageNumber={currentPage}
                                            data={specData}
                                            onUpdate={handleCellUpdate}
                                            dbSubjects={subjects}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10 py-10">
                            <div className="relative group">
                                <div className="absolute -inset-24 bg-blue-500/5 blur-[120px] rounded-full" />
                                <div className="relative w-64 h-64 bg-white rounded-[5rem] border border-slate-200 flex items-center justify-center transform group-hover:scale-105 transition-all duration-700 shadow-xl">
                                    <FileText className="w-28 h-28 text-slate-100" />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-7xl font-black text-slate-100 tracking-tighter leading-none italic">SF10</span>
                                        <div className="w-20 h-1 bg-blue-500/10 rounded-full mt-4" />
                                    </div>
                                    <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl ring-8 ring-slate-50 group-hover:rotate-12 transition-all duration-500">
                                        <Printer className="w-10 h-10 text-white" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Permanent Record</h2>
                                <p className="text-slate-400 font-bold max-w-sm mx-auto leading-relaxed uppercase text-[10px] tracking-[0.3em] opacity-60">
                                    Select a learner from the toolbar above to preview and edit their academic profile.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
             </div>





             <style>{`
                @media print {
                    @page {
                        size: 8.5in 13in;
                        margin: 0 !important;
                    }

                    html,
                    body {
                        width: 8.5in !important;
                        height: 13in !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                        background: #fff !important;
                    }

                    .sf10-print-root {
                        display: block !important;
                        width: 8.5in !important;
                        height: 13in !important;
                        max-height: 13in !important;
                        overflow: hidden !important;
                        background: #fff !important;
                    }

                    .sf10-print-sheet {
                        width: 8.5in !important;
                        height: 13in !important;
                        max-height: 13in !important;
                        margin: 0 !important;
                        overflow: hidden !important;
                    }

                    .sf10-force-single-page {
                        break-after: avoid-page !important;
                        page-break-after: avoid !important;
                    }
                }
             `}</style>
        </div>
    );
}
