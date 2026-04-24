import { useState, useMemo, useCallback, useEffect } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
} from '@tanstack/react-table';
import { useAppStore, useAuthStore } from '../stores';
import type { Section, Student } from '../types';
import { StudentForm } from '../components/students/StudentForm';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Trash2, Search, MapPin, Edit3, Trash, ChevronRight, Download, X, ArrowLeft, RotateCcw, FileSpreadsheet } from 'lucide-react';
import { exportToCSV } from '../utils/csv-export';
import { parseSF1 } from '../utils/sf1-parser';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { useRef } from 'react';

export function StudentsPage() {
    const {
        students,
        sections,
        teachers,
        schoolProfile,
        deleteStudent,
        clearSection,
        importStudentsFromSF1,
    } = useAppStore();
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'admin';

    const [viewMode, setViewMode] = useState<'overview' | 'section_detail'>('overview');
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [overviewSearch, setOverviewSearch] = useState('');
    const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');
    const [addressFilter, setAddressFilter] = useState<string>('All');

    // Table State
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [formDataForModal, setFormDataForModal] = useState<Partial<Student> | undefined>(undefined);
    const [collapsedGrades, setCollapsedGrades] = useState<Record<string, boolean>>({});
    const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toggleGrade = (grade: string) => {
        setCollapsedGrades(prev => ({ ...prev, [grade]: !prev[grade] }));
    };

    const toggleAllGrades = (collapse: boolean) => {
        const newState: Record<string, boolean> = {};
        Object.keys(sectionsByGrade).forEach(g => {
            newState[g] = collapse;
        });
        setCollapsedGrades(newState);
    };

    const [pendingAction, setPendingAction] = useState<
        | { kind: 'clear-section'; sectionName: string; count: number }
        | null
    >(null);

    const officialSections = useMemo(() => sections, [sections]);

    const getSelectedSectionObj = () => officialSections.find(s => s.id === selectedSectionId);
    const selectedSectionObj = getSelectedSectionObj();

    const isPlaceholderSectionName = (value?: string) => {
        const text = (value || '').trim();
        return /^G\d+\s*-\s*[A-Za-z0-9]+$/i.test(text);
    };

    const resolveSectionDisplayName = (section?: Section | null) => {
        const fromSection = (section?.section_name || '').trim();
        if (fromSection && !isPlaceholderSectionName(fromSection)) return fromSection;

        const fromProfile = (schoolProfile?.section || '').trim();
        if (fromProfile) return fromProfile;

        return fromSection || 'Section';
    };

    const resolveSectionGradeDisplay = (section?: Section | null) => {
        const fromSection = (section?.section_grade_level || '').trim();
        const fromProfile = (schoolProfile?.grade_level || '').trim();
        return fromProfile || fromSection || 'Grade';
    };


    const getSectionAliases = (section?: Section | null) => {
        if (!section) return [] as string[];
        const aliases = [section.section_name, resolveSectionDisplayName(section), section.id]
            .map((value) => (value || '').trim())
            .filter(Boolean);
        return Array.from(new Set(aliases));
    };

    const resolveAdviserName = (section?: Section | null) => {
        if (!section) return 'TBA';
        const fromSection = section.adviser_name || teachers.find((teacher) => teacher.uid === section.adviser_id)?.displayName;
        if (fromSection && fromSection.trim() && fromSection.trim().toLowerCase() !== 'tba') return fromSection;

        // Only fallback to school profile for ADVISORY sections
        const isAdvisory = section.is_advisory ?? !section.is_teaching_load;
        if (isAdvisory) {
            const fromProfile = (schoolProfile?.adviser_name || '').trim();
            if (fromProfile) return fromProfile;
        }

        return 'TBA';
    };
    const selectedSectionAdviser = resolveAdviserName(selectedSectionObj);
    const selectedSectionDisplayName = resolveSectionDisplayName(selectedSectionObj);
    const selectedSectionGradeDisplay = resolveSectionGradeDisplay(selectedSectionObj);
    const userAdvisorySections = useMemo(() => officialSections.filter(s => s.adviser_id === user?.uid), [officialSections, user]);
    const isAdviserOfAny = userAdvisorySections.length > 0;
    const isAdviserOfCurrent = user?.uid && selectedSectionObj?.adviser_id === user.uid;
    const isCurrentSectionAdvisory = selectedSectionObj ? (selectedSectionObj.is_advisory ?? !selectedSectionObj.is_teaching_load) : true;
    const isSimplifiedMode = viewMode === 'section_detail' && !isCurrentSectionAdvisory;

    const canEdit = isAdmin || isAdviserOfCurrent;
    const canAddGlobally = isAdmin || isAdviserOfAny;

    useEffect(() => {
        if (!selectedSectionId && officialSections.length > 0) {
            const firstSection = officialSections[0];
            setSelectedSectionId(firstSection.id);
            if (officialSections.length === 1) {
                setViewMode('section_detail');
            }
        }
    }, [selectedSectionId, officialSections]);


    const handleExportStudents = () => {
        exportToCSV(displayedStudents.map(s => ({
            'LRN': s.lrn,
            'Last Name': s.last_name,
            'First Name': s.first_name,
            'Middle Name': s.middle_name || '',
            'Name Extension': s.name_extension || '',
            'Gender': s.gender,
            'Birthday': s.birthday,
            'Age': s.age,
            'Contact Number': s.contact_number || '',
            'Address': s.address,
            'Grade Level': s.grade_level,
            'Section': s.student_section || '',
            'Track': s.track || '',
            'Strand': s.strand || '',
            'Weight (kg)': s.weight ?? '',
            'Height (m)': s.height ?? '',
            'Elementary School': s.elementary_school || '',
            'Elementary School ID': s.elementary_school_id || '',
            'Elementary School Address': s.elementary_school_address || '',
            'General Average': s.average_grade || '',
            'Citation': s.citation || '',
            'PEPT Rating': s.pept_rating || '',
            'PEPT Date': s.pept_date || '',
            'ALS Rating': s.als_rating || '',
            'Testing Center': s.testing_center || '',
            'Other Credentials': s.other_credentials || '',
        })), `Students_${selectedSectionObj?.section_name || 'All'}`);
    };

    const handleSF1Import = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedSectionObj) return;

        setIsImporting(true);
        try {
            const parsedStudents = await parseSF1(file);
            
            // Tag students with the current grade and section and FILTER results
            const studentsToImport = parsedStudents
                .filter(s => s && s.lrn)
                .map(s => ({
                    ...s,
                    grade_level: selectedSectionObj.section_grade_level,
                    student_section: selectedSectionObj.section_name
                }));

            if (studentsToImport.length === 0) {
                alert('No valid student records found in the file. Please check if the names and LRNs are in the correct columns.');
                return;
            }

            await importStudentsFromSF1(studentsToImport, selectedSectionObj.section_name);
        } catch (error) {
            console.error('SF1 Import Failed:', error);
            alert(`SF1 Import Failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.06 }
        }
    };

    const cardVariants = {
        hidden: { y: 30, opacity: 0, scale: 0.95 },
        visible: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
        }
    };

    const fadeSlide = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
    };

    const sectionsByGrade = useMemo(() => {
        const grouped: Record<string, typeof sections> = {};
        officialSections.forEach((section) => {
            const grade = section.section_grade_level || 'No Grade';
            if (!grouped[grade]) grouped[grade] = [];
            grouped[grade].push(section);
        });
        return grouped;
    }, [officialSections]);

    const sectionStudents = useMemo(() => {
        if (viewMode === 'overview') return [];
        const section = officialSections.find(s => s.id === selectedSectionId);
        if (!section) return [];
        const filtered = students.filter(s => s.student_section === section.section_name || s.student_section === section.id);
        return filtered.sort((a, b) => {
            if (a.gender !== b.gender) return a.gender === 'Male' ? -1 : 1;
            return a.last_name.localeCompare(b.last_name);
        });
    }, [students, officialSections, selectedSectionId, viewMode]);

    const filteredSectionsByGrade = useMemo(() => {
        const query = overviewSearch.trim().toLowerCase();
        if (!query) return sectionsByGrade;

        const filtered: Record<string, typeof sections> = {};
        Object.entries(sectionsByGrade).forEach(([grade, gradeSections]) => {
            const matches = gradeSections.filter((section) => {
                const adviser = resolveAdviserName(section).toLowerCase();
                const sectionDisplayName = resolveSectionDisplayName(section).toLowerCase();
                const sectionGradeDisplay = resolveSectionGradeDisplay(section).toLowerCase();
                return (
                    grade.toLowerCase().includes(query) ||
                    sectionGradeDisplay.includes(query) ||
                    section.section_name.toLowerCase().includes(query) ||
                    sectionDisplayName.includes(query) ||
                    adviser.includes(query)
                );
            });

            if (matches.length > 0) {
                filtered[grade] = matches;
            }
        });

        return filtered;
    }, [overviewSearch, sectionsByGrade]);

    const uniqueAddresses = useMemo(() => {
        const counts: Record<string, number> = {};
        sectionStudents.forEach(s => {
            if (s.address) {
                const addr = s.address.split(',')[0].trim(); // Take barangay or street
                counts[addr] = (counts[addr] || 0) + 1;
            }
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [sectionStudents]);

    const displayedStudents = useMemo(() => {
        let filtered = sectionStudents;
        if (genderFilter !== 'All') filtered = filtered.filter(s => s.gender === genderFilter);
        if (addressFilter !== 'All') {
            filtered = filtered.filter(s => s.address?.includes(addressFilter));
        }
        if (globalFilter.trim()) {
            const q = globalFilter.toLowerCase();
            filtered = filtered.filter(s => 
                s.lrn.includes(q) || 
                `${s.last_name} ${s.first_name}`.toLowerCase().includes(q)
            );
        }
        return filtered;
    }, [sectionStudents, genderFilter, addressFilter, globalFilter]);

    const hasActiveFilters = genderFilter !== 'All' || addressFilter !== 'All' || globalFilter.trim().length > 0;


    const handleSectionClick = (sectionId: string) => {
        setSelectedSectionId(sectionId);
        setGenderFilter('All');
        setAddressFilter('All');
        setViewMode('section_detail');
    };

    const resetDetailFilters = () => {
        setGenderFilter('All');
        setAddressFilter('All');
        setGlobalFilter('');
    };


    const handleEdit = useCallback((student: Student) => {
        setEditingStudent(student);
        setIsModalOpen(true);
    }, []);

    const handleDelete = useCallback((student: Student) => {
        setDeleteTarget(student);
    }, []);

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        const target = deleteTarget;
        setDeleteTarget(null);

        try {
            await deleteStudent(target.lrn);
        } catch (error) {
            console.error('Failed to delete student:', error);
        }
    };

    const columns = useMemo<ColumnDef<Student>[]>(
        () => {
            const baseColumns: ColumnDef<Student>[] = [
                {
                    accessorKey: 'lrn',
                    header: 'LRN',
                    cell: (info) => <span className="font-mono text-xs text-gray-500">{info.getValue() as string}</span>,
                },
                {
                    id: 'name',
                    header: 'Name',
                    accessorFn: (row) => `${row.last_name}, ${row.first_name} ${row.middle_name ? row.middle_name.charAt(0) + '.' : ''}`,
                    cell: (info) => <span className="font-bold text-gray-800 uppercase">{info.getValue() as string}</span>,
                },
                {
                    accessorKey: 'gender',
                    header: 'Gender',
                    cell: (info) => {
                        const gender = info.getValue() as string;
                        return (
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                {gender}
                            </span>
                        );
                    }
                },
                ...(isCurrentSectionAdvisory ? [{
                    accessorKey: 'birthday',
                    header: 'Birthday',
                    cell: (info: any) => {
                        const dateStr = info.getValue() as string;
                        if (!dateStr) return <span className="text-gray-300 italic text-xs">N/A</span>;
                        const parts = dateStr.split('-');
                        if (parts.length === 3) {
                            const [y, m, d] = parts;
                            return <span className="font-mono text-xs text-gray-600">{`${m}/${d}/${y}`}</span>;
                        }
                        return dateStr;
                    },
                }] : []),
            ];

            if (canEdit) {
                baseColumns.push({
                    id: 'actions',
                    header: '',
                    cell: ({ row }) => (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(row.original)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Edit">
                                <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(row.original)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Delete">
                                <Trash className="w-4 h-4" />
                            </button>
                        </div>
                    ),
                });
            }
            return baseColumns;
        },
        [canEdit, handleEdit, handleDelete]
    );

    const table = useReactTable({
        data: displayedStudents,
        columns,
        state: { sorting, globalFilter },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    const handleAdd = () => {
        setEditingStudent(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingStudent(null);
    };

    const handleClearSection = async () => {
        if (!selectedSectionObj) return;
        const count = sectionStudents.length;
        if (count === 0) return;
        setPendingAction({ kind: 'clear-section', sectionName: selectedSectionObj.section_name, count });
    };


    const handleConfirmPendingAction = async () => {
        if (!pendingAction) return;
        const action = pendingAction;
        setPendingAction(null);

        try {
            if (action.kind === 'clear-section') {
                await clearSection(action.sectionName);
            }
        } catch (error) {
            console.error('Action failed:', error);
        }
    };

    const getStudentCount = (section?: Section | null) => {
        const aliases = getSectionAliases(section);
        return students.filter((student) => aliases.includes((student.student_section || '').trim())).length;
    };
    const getMaleCount = (section?: Section | null) => {
        const aliases = getSectionAliases(section);
        return students.filter((student) => aliases.includes((student.student_section || '').trim()) && student.gender === 'Male').length;
    };
    const getFemaleCount = (section?: Section | null) => {
        const aliases = getSectionAliases(section);
        return students.filter((student) => aliases.includes((student.student_section || '').trim()) && student.gender === 'Female').length;
    };

    const validStudents = useMemo(() => {
        return students.filter(s => officialSections.some(sec => sec.section_name === s.student_section));
    }, [students, officialSections]);

    const totalStudents = validStudents.length;
    const totalMale = validStudents.filter(s => s.gender === 'Male').length;
    const totalFemale = validStudents.filter(s => s.gender === 'Female').length;

    const statsSectionsCount = officialSections.length;

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-4 justify-between items-center"
            >
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        {viewMode === 'overview' ? 'Student Information' : selectedSectionDisplayName}
                    </h2>
                    {viewMode === 'overview' ? (
                        <p className="text-gray-500 font-medium mt-1">{totalStudents} Learners • {statsSectionsCount} Sections</p>
                    ) : (
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-wider border border-slate-200/50">
                                {selectedSectionGradeDisplay}
                            </span>
                            <span className="text-slate-300">/</span>
                            <p className="text-slate-500 font-bold text-xs">
                                Adviser: {selectedSectionAdviser}
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    {viewMode === 'section_detail' && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                setViewMode('overview');
                                setSelectedSectionId(null);
                            }}
                            className="px-4 py-2.5 bg-white text-gray-600 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Sections
                        </motion.button>
                    )}

                    {viewMode === 'section_detail' && canEdit && (
                        <>
                            {sectionStudents.length > 0 && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleClearSection}
                                    className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-100 transition-all flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear All
                                </motion.button>
                            )}
                        </>
                    )}

                    {viewMode === 'section_detail' && displayedStudents.length > 0 && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleExportStudents}
                            className="px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </motion.button>
                    )}

                    {viewMode === 'section_detail' && canEdit && (
                        <>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleSF1Import}
                                accept=".xlsx, .xls"
                                className="hidden"
                            />
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isImporting}
                                className="px-4 py-2.5 bg-white text-emerald-600 border border-emerald-200 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-all flex items-center gap-2"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                {isImporting ? 'Importing...' : 'Import SF1'}
                            </motion.button>
                        </>
                    )}

                    {(viewMode === 'section_detail' && canEdit) && (
                        <div className="flex gap-2">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    // If we are in section detail, pre-fill with that section
                                    if (selectedSectionObj) {
                                        setEditingStudent(null);
                                        setFormDataForModal({
                                            grade_level: selectedSectionObj.section_grade_level,
                                            student_section: selectedSectionObj.section_name
                                        });
                                    } else {
                                        setEditingStudent(null);
                                        setFormDataForModal(undefined);
                                    }
                                    setIsModalOpen(true);
                                }}
                                className="px-5 py-2.5 bg-deped-blue text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                            >
                                <UserPlus className="w-4 h-4" />
                                Add Learner
                            </motion.button>
                        </div>
                    )}
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                {/* Overview Mode */}
                {viewMode === 'overview' && (
                    <motion.div
                        key="overview"
                        variants={fadeSlide}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="space-y-8"
                    >
                        {/* Quick Stats & Controls */}
                        <div className="flex flex-col gap-4">
                            <div className="relative max-w-lg w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={overviewSearch}
                                    onChange={(e) => setOverviewSearch(e.target.value)}
                                    placeholder="Search section, adviser, or grade"
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-deped-blue/20 focus:border-deped-blue transition-all shadow-sm"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-between items-end">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                                {[
                                    { label: 'Total Learners', value: totalStudents, icon: Users, color: 'blue' },
                                    { label: 'Male', value: totalMale, icon: Users, color: 'sky' },
                                    { label: 'Female', value: totalFemale, icon: Users, color: 'pink' },
                                ].map((stat, idx) => (
                                    <motion.div
                                        key={stat.label}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={`bg-white/70 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-white/20 flex items-center gap-4`}
                                    >
                                        <div className={`p-3 rounded-xl ${stat.color === 'blue' ? 'bg-blue-100 text-blue-600' : stat.color === 'sky' ? 'bg-sky-100 text-sky-600' : 'bg-pink-100 text-pink-500'}`}>
                                            <stat.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                                            <p className="text-2xl font-black text-gray-800">{stat.value}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                {overviewSearch.trim() && (
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mr-1">
                                        {Object.values(filteredSectionsByGrade).reduce((total, list) => total + list.length, 0)} section(s) matched
                                    </p>
                                )}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => toggleAllGrades(false)}
                                    className="px-3 py-1.5 bg-white border border-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm hover:bg-gray-50 transition-all"
                                >
                                    Expand All
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => toggleAllGrades(true)}
                                    className="px-3 py-1.5 bg-white border border-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm hover:bg-gray-50 transition-all"
                                >
                                    Collapse All
                                </motion.button>
                                {overviewSearch.trim() && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setOverviewSearch('')}
                                        className="px-3 py-1.5 bg-white border border-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm hover:bg-gray-50 transition-all"
                                    >
                                        Clear Search
                                    </motion.button>
                                )}
                            </div>
                            </div>
                        </div>

                        {/* Section Cards by Grade */}
                        {Object.entries(filteredSectionsByGrade)
                            .sort(([a], [b]) => {
                                const getGradeNum = (g: string) => {
                                    const match = g.match(/Grade\s*(\d+)/i);
                                    return match ? parseInt(match[1], 10) : 999;
                                };
                                return getGradeNum(a) - getGradeNum(b);
                            })
                            .map(([grade, gradeSections]) => (
                                <motion.div
                                    key={grade}
                                    variants={fadeSlide}
                                    layout
                                    className="bg-white/50 backdrop-blur-sm p-5 rounded-3xl border border-white/30 shadow-sm overflow-hidden"
                                >
                                    <button
                                        onClick={() => toggleGrade(grade)}
                                        className="w-full flex justify-between items-center group/header mb-2 outline-none focus-visible:ring-2 focus-visible:ring-deped-blue/20 rounded-xl p-1"
                                    >
                                        <h3 className="text-lg font-black text-deped-blue flex items-center gap-2">
                                            <div className="w-1.5 h-6 bg-gradient-to-b from-deped-blue to-blue-400 rounded-full" />
                                            {grade}
                                            <span className="text-xs font-bold text-gray-400 ml-2">({gradeSections.length} sections)</span>
                                        </h3>
                                        <motion.div
                                            animate={{ rotate: collapsedGrades[grade] ? 0 : 90 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                            className="p-2 rounded-xl bg-white/50 border border-gray-100 text-gray-400 group-hover/header:text-deped-blue group-hover/header:bg-white shadow-sm transition-all"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </motion.div>
                                    </button>

                                    <AnimatePresence>
                                        {!collapsedGrades[grade] && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                className="pt-3"
                                            >
                                                <motion.div
                                                    variants={containerVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                                                >
                                        {gradeSections.map((section) => {
                                            const count = getStudentCount(section);
                                            const maleCount = getMaleCount(section);
                                            const femaleCount = getFemaleCount(section);
                                            const malePercent = count > 0 ? (maleCount / count) * 100 : 50;
                                            const adviserDisplayName = resolveAdviserName(section);
                                            const sectionDisplayName = resolveSectionDisplayName(section);

                                            return (
                                                <motion.div
                                                    key={section.id}
                                                    variants={cardVariants}
                                                    whileHover={{ y: -8, scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => handleSectionClick(section.id)}
                                                    className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer border border-transparent hover:border-deped-blue/30"
                                                >
                                                    {/* Gradient Top Bar */}
                                                    <div className="h-1.5 bg-gradient-to-r from-deped-blue via-blue-400 to-deped-yellow" />

                                                    <div className="p-5">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div>
                                                                <h4 className="text-xl font-black text-gray-800 group-hover:text-deped-blue transition-colors">
                                                                    {sectionDisplayName}
                                                                </h4>
                                                            </div>
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg transition-all ${count > 0 ? 'bg-gradient-to-br from-deped-blue to-blue-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                                                                {count}
                                                            </div>
                                                        </div>

                                                        {/* Gender Distribution Bar */}
                                                        {count > 0 && (
                                                            <div className="mb-3">
                                                                <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1">
                                                                    <span>♂ {maleCount}</span>
                                                                    <span>♀ {femaleCount}</span>
                                                                </div>
                                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                                                                    <div
                                                                        className="bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500"
                                                                        style={{ width: `${malePercent}%` }}
                                                                    />
                                                                    <div
                                                                        className="bg-gradient-to-r from-pink-400 to-pink-500 transition-all duration-500"
                                                                        style={{ width: `${100 - malePercent}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                                            <p className="text-xs text-gray-400 font-medium">
                                                                <span className="text-gray-500">
                                                                    {section.is_advisory ? 'Adviser:' : 'Teacher:'}
                                                                </span> {adviserDisplayName}
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                {(isAdmin || section.adviser_id === user?.uid) && (
                                                                    <motion.button
                                                                        whileHover={{ scale: 1.1 }}
                                                                        whileTap={{ scale: 0.9 }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setEditingStudent(null);
                                                                            setFormDataForModal({
                                                                                grade_level: section.section_grade_level,
                                                                                student_section: section.section_name
                                                                            });
                                                                            setIsModalOpen(true);
                                                                        }}
                                                                        className="p-1.5 bg-deped-blue/10 text-deped-blue rounded-lg hover:bg-deped-blue hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                                                        title="Add Learner"
                                                                    >
                                                                        <UserPlus className="w-3.5 h-3.5" />
                                                                    </motion.button>
                                                                )}
                                                                <div className="flex items-center gap-1 text-deped-blue font-bold text-xs opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                                    View <ChevronRight className="w-3 h-3" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}

                        {sections.length === 0 && (
                            <motion.div
                                variants={fadeSlide}
                                className="text-center py-20 bg-white/70 backdrop-blur-md rounded-3xl shadow-sm border border-white/20"
                            >
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-10 h-10 text-gray-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">No Sections Found</h3>
                                <p className="text-gray-500">Go to Institute Profile to set up advisory grade level and section details.</p>
                            </motion.div>
                        )}

                        {sections.length > 0 && Object.keys(filteredSectionsByGrade).length === 0 && (
                            <motion.div
                                variants={fadeSlide}
                                className="text-center py-16 bg-white/70 backdrop-blur-md rounded-3xl shadow-sm border border-white/20"
                            >
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-7 h-7 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2">No matching sections</h3>
                                <p className="text-gray-500 mb-4">Try a different search term for section, adviser, or grade.</p>
                                <button
                                    onClick={() => setOverviewSearch('')}
                                    className="px-4 py-2 bg-deped-blue text-white rounded-xl font-bold text-sm"
                                >
                                    Clear Search
                                </button>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                <ConfirmationModal
                    open={pendingAction !== null}
                    title={pendingAction?.kind === 'clear-section'
                        ? `Delete all ${pendingAction.count} students in ${pendingAction.sectionName}?`
                        : ''}
                    message={pendingAction?.kind === 'clear-section'
                        ? 'This will permanently remove every student enrolled in the selected section.'
                        : ''}
                    details={pendingAction?.kind === 'clear-section'
                        ? 'This action cannot be undone.'
                        : ''}
                    confirmLabel={pendingAction?.kind === 'clear-section' ? 'Delete Students' : 'Confirm'}
                    intent={pendingAction?.kind === 'clear-section' ? 'danger' : 'info'}
                    onConfirm={handleConfirmPendingAction}
                    onCancel={() => setPendingAction(null)}
                />

                {/* Detail Mode */}
                {viewMode === 'section_detail' && (
                    <motion.div
                        key="detail"
                        variants={fadeSlide}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="bg-white/70 backdrop-blur-md rounded-3xl shadow-lg border border-white/20 overflow-hidden"
                    >
                        {/* Analytics Cards */}
                        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 bg-gradient-to-r from-gray-50/80 to-white/80 border-b border-gray-100">
                            {[
                                { label: 'Total', value: sectionStudents.length, icon: '👥', filter: 'All', color: 'blue' },
                                { label: 'Male', value: sectionStudents.filter(s => s.gender === 'Male').length, icon: '♂️', filter: 'Male', color: 'sky' },
                                { label: 'Female', value: sectionStudents.filter(s => s.gender === 'Female').length, icon: '♀️', filter: 'Female', color: 'pink' },
                            ].map((stat) => (
                                <motion.div
                                    key={stat.label}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setGenderFilter(stat.filter as 'All' | 'Male' | 'Female')}
                                    className={`bg-white p-4 rounded-2xl shadow-sm border-2 cursor-pointer transition-all flex items-center gap-3 ${genderFilter === stat.filter
                                        ? stat.color === 'blue' ? 'border-blue-400 bg-blue-50/50'
                                            : stat.color === 'sky' ? 'border-sky-400 bg-sky-50/50'
                                                : 'border-pink-400 bg-pink-50/50'
                                        : 'border-transparent hover:border-gray-200'
                                        }`}
                                >
                                    <div className="text-2xl">{stat.icon}</div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                                        <p className={`text-xl font-black ${stat.color === 'blue' ? 'text-gray-800' : stat.color === 'sky' ? 'text-sky-600' : 'text-pink-500'}`}>{stat.value}</p>
                                    </div>
                                </motion.div>
                            ))}

                            {isCurrentSectionAdvisory && (
                                <>
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                                        <div className="text-2xl">🎂</div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg Age</p>
                                            <p className="text-xl font-black text-orange-500">
                                                {sectionStudents.length > 0 ? Math.round(sectionStudents.reduce((acc, s) => acc + (s.age || 0), 0) / sectionStudents.length) : 0}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                                        <MapPin className="w-5 h-5 text-emerald-500" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Location</p>
                                            <select
                                                value={addressFilter}
                                                onChange={(e) => setAddressFilter(e.target.value)}
                                                className="w-full text-xs font-bold border-none p-0 focus:ring-0 cursor-pointer text-gray-700 bg-transparent truncate"
                                            >
                                                <option value="All">All ({uniqueAddresses.length})</option>
                                                {uniqueAddresses.map(([addr, count]) => (
                                                    <option key={addr} value={addr}>{addr} ({count})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Search Bar */}
                        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 justify-between items-center">
                            <div className="relative max-w-md flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={globalFilter}
                                    onChange={(e) => setGlobalFilter(e.target.value)}
                                    placeholder="Search by name or LRN..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-deped-blue/20 focus:border-deped-blue transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-3 ml-auto">
                                <p className="text-sm text-gray-500 font-medium">
                                    Showing <span className="font-bold text-gray-800">{displayedStudents.length}</span> students
                                </p>
                                {hasActiveFilters && (
                                    <button
                                        onClick={resetDetailFilters}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        Reset Filters
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Table */}
                        {displayedStudents.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-gray-500 font-medium mb-4">
                                    {sectionStudents.length > 0 ? 'No learners match your current filters.' : 'No students enrolled yet.'}
                                </p>
                                {sectionStudents.length > 0 && hasActiveFilters && (
                                    <button
                                        onClick={resetDetailFilters}
                                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm mr-3"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                                {canEdit && sectionStudents.length === 0 && (
                                    <div className="flex justify-center">
                                        <p className="text-xs font-bold text-deped-blue/60 uppercase tracking-widest italic animate-pulse">
                                            Ready to populate section records...
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-deped-blue to-blue-600 text-white">
                                        {table.getHeaderGroups().map((headerGroup) => (
                                            <tr key={headerGroup.id}>
                                                {headerGroup.headers.map((header) => (
                                                    <th
                                                        key={header.id}
                                                        onClick={header.column.getToggleSortingHandler()}
                                                        className="text-left py-4 px-5 font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors"
                                                    >
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                        {{
                                                            asc: ' ↑',
                                                            desc: ' ↓',
                                                        }[header.column.getIsSorted() as string] ?? ''}
                                                    </th>
                                                ))}
                                            </tr>
                                        ))}
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {table.getRowModel().rows.map((row, idx) => (
                                            <motion.tr
                                                key={row.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.02 }}
                                                className="group hover:bg-blue-50/50 transition-colors"
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <td key={cell.id} className="py-3.5 px-5">
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </td>
                                                ))}
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={handleCloseModal}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <StudentForm
                                student={editingStudent}
                                onClose={handleCloseModal}
                                initialData={formDataForModal}
                                isSimplified={isSimplifiedMode}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {deleteTarget && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4"
                        onClick={() => setDeleteTarget(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 16, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 16, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_100px_rgba(15,23,42,0.35)] border border-slate-200"
                        >
                            <div className="bg-gradient-to-r from-rose-600 to-red-600 px-6 py-5 text-white">
                                <p className="text-[10px] font-black uppercase tracking-[0.24em] opacity-80">Confirm Delete</p>
                                <h3 className="mt-2 text-2xl font-black tracking-tight">Delete {deleteTarget.last_name}, {deleteTarget.first_name}?</h3>
                            </div>

                            <div className="px-6 py-5 space-y-4">
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    This will permanently remove the learner record from Student Information and enrollment data.
                                </p>
                                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 border border-slate-200">
                                    <div><span className="font-black uppercase text-slate-400 text-[10px] tracking-[0.2em]">LRN</span> {deleteTarget.lrn}</div>
                                    <div className="mt-1"><span className="font-black uppercase text-slate-400 text-[10px] tracking-[0.2em]">Section</span> {deleteTarget.student_section || 'N/A'}</div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        onClick={() => setDeleteTarget(null)}
                                        className="h-11 rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => void confirmDelete()}
                                        className="h-11 rounded-xl bg-rose-600 px-5 text-sm font-black text-white hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200"
                                    >
                                        Delete Student
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
