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
import { Users, UserPlus, Search, MapPin, Edit3, Trash, ChevronRight, ChevronLeft, Download, X, RotateCcw, FileSpreadsheet, BookOpen, GraduationCap, School, Sparkles } from 'lucide-react';
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
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');
    const [addressFilter, setAddressFilter] = useState<string>('All');

    // Table State
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [formDataForModal, setFormDataForModal] = useState<Partial<Student> | undefined>(undefined);
    const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);


    const [pendingAction, setPendingAction] = useState<
        | { kind: 'clear-section'; sectionName: string; count: number }
        | null
    >(null);

    const officialSections = useMemo(() => sections, [sections]);

    const getSelectedSectionObj = () => officialSections.find(s => s.id === selectedSectionId);
    const selectedSectionObj = getSelectedSectionObj();

    const isPlaceholderSectionName = useCallback((value?: string) => {
        const text = (value || '').trim();
        return /^G\d+\s*-\s*[A-Za-z0-9]+$/i.test(text);
    }, []);

    const resolveSectionDisplayName = useCallback((section?: Section | null) => {
        const fromSection = (section?.section_name || '').trim();
        if (fromSection && !isPlaceholderSectionName(fromSection)) return fromSection;

        const fromProfile = (schoolProfile?.section || '').trim();
        if (fromProfile) return fromProfile;

        return fromSection || 'Section';
    }, [schoolProfile, isPlaceholderSectionName]);

    const resolveSectionGradeDisplay = useCallback((section?: Section | null) => {
        const fromSection = (section?.section_grade_level || '').trim();
        const fromProfile = (schoolProfile?.grade_level || '').trim();
        return fromSection || fromProfile || 'Grade';
    }, [schoolProfile]);


    const getSectionAliases = useCallback((section?: Section | null) => {
        if (!section) return [] as string[];
        const aliases = [section.section_name, resolveSectionDisplayName(section), section.id]
            .map((value) => (value || '').trim())
        return Array.from(new Set(aliases));
    }, [resolveSectionDisplayName]);

    const resolveAdviserName = useCallback((section?: Section | null) => {
        if (!section) return 'TBA';
        const fromSection = section.adviser_name || teachers.find((teacher) => teacher.uid === section.adviser_id)?.displayName;
        if (fromSection && fromSection.trim() && fromSection.trim().toLowerCase() !== 'tba') return fromSection;

        const isAdvisory = section.is_advisory ?? !section.is_teaching_load;
        if (isAdvisory) {
            const fromProfile = (schoolProfile?.adviser_name || '').trim();
            if (fromProfile) return fromProfile;
        }

        return 'TBA';
    }, [teachers, schoolProfile]);
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
            transition: { staggerChildren: 0.02, delayChildren: 0 }
        }
    };

    const cardVariants = {
        hidden: { y: 10, opacity: 0, scale: 0.98 },
        visible: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: { type: 'spring' as const, stiffness: 400, damping: 25, mass: 0.8 }
        }
    };

    const fadeSlide = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.2 } }
    };





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

    const filteredSectionsList = useMemo(() => {
        const query = overviewSearch.trim().toLowerCase();
        const list: typeof sections = [];

        // Show all sections by default, or filter if category/search is active
        officialSections.forEach(section => {
            const grade = section.section_grade_level || 'No Grade';
            let isMatch = true;
            
            if (activeCategory) {
                const num = parseInt(grade.replace(/\D/g, '')) || 0;
                isMatch = false;
                if (activeCategory === 'ELEMENTARY' && (grade.toLowerCase().includes('kinder') || (num >= 1 && num <= 6))) isMatch = true;
                else if (activeCategory === 'JUNIOR HIGH SCHOOL' && (num >= 7 && num <= 10)) isMatch = true;
                else if (activeCategory === 'SENIOR HIGH SCHOOL' && (num >= 11 && num <= 12)) isMatch = true;
            }

            if (!isMatch) return;

            if (query) {
                const adviser = resolveAdviserName(section).toLowerCase();
                const sectionDisplayName = resolveSectionDisplayName(section).toLowerCase();
                const sectionGradeDisplay = resolveSectionGradeDisplay(section).toLowerCase();
                
                const matchesQuery = (
                    grade.toLowerCase().includes(query) ||
                    sectionGradeDisplay.includes(query) ||
                    section.section_name.toLowerCase().includes(query) ||
                    sectionDisplayName.includes(query) ||
                    adviser.includes(query)
                );
                
                if (!matchesQuery) return;
            }
            
            list.push(section);
        });

        // Sort by Grade (increasing) then Section Name (alphabetical)
        return list.sort((a, b) => {
            const gradeA = a.section_grade_level || '';
            const gradeB = b.section_grade_level || '';
            
            const numA = parseInt(gradeA.replace(/\D/g, '')) || 0;
            const numB = parseInt(gradeB.replace(/\D/g, '')) || 0;
            
            if (numA !== numB) return numA - numB;
            
            return a.section_name.localeCompare(b.section_name);
        });
    }, [overviewSearch, officialSections, activeCategory, resolveAdviserName, resolveSectionDisplayName, resolveSectionGradeDisplay]);

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
                    cell: (info: { getValue: () => unknown }) => {
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
        [canEdit, handleEdit, handleDelete, isCurrentSectionAdvisory]
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

    const groupedSectionsByCategory = useMemo(() => {
        const groups: Record<string, typeof sections> = {
            'ELEMENTARY': [],
            'JUNIOR HIGH SCHOOL': [],
            'SENIOR HIGH SCHOOL': []
        };
        
        officialSections.forEach(s => {
            const gl = (s.section_grade_level || '').toLowerCase();
            const num = parseInt(gl.replace(/\D/g, '')) || 0;
            
            if (gl.includes('kinder') || (num >= 1 && num <= 6)) {
                groups['ELEMENTARY'].push(s);
            } else if (num >= 7 && num <= 10) {
                groups['JUNIOR HIGH SCHOOL'].push(s);
            } else if (num >= 11 && num <= 12) {
                groups['SENIOR HIGH SCHOOL'].push(s);
            }
        });
        
        return groups;
    }, [officialSections]);

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
                            onClick={() => setViewMode('overview')}
                            className="px-4 py-2.5 bg-white text-gray-700 border border-gray-100 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Overview
                        </motion.button>
                    )}

                    {viewMode === 'overview' && canAddGlobally && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleAdd}
                            className="px-5 py-2.5 bg-deped-blue text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                        >
                            <UserPlus className="w-4 h-4" />
                            Add Learner
                        </motion.button>
                    )}

                    {viewMode === 'section_detail' && (
                        <>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleExportStudents}
                                className="px-4 py-2.5 bg-white text-gray-700 border border-gray-100 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </motion.button>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleSF1Import}
                                accept=".csv,.xlsx,.xls"
                                className="hidden"
                            />
                            {canEdit && (
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
                            )}
                            
                            {canEdit && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
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
                            )}
                        </>
                    )}
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                {viewMode === 'overview' && (
                    <motion.div
                        key="overview"
                        variants={fadeSlide}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="space-y-8"
                    >
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                            {/* Sleek Stats */}
                            <div className="flex items-center gap-6 px-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                                        <p className="text-sm font-black text-slate-800 leading-none">{totalStudents}</p>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-slate-100" />
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Male</p>
                                        <p className="text-sm font-black text-slate-800 leading-none">{totalMale}</p>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-slate-100" />
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-500">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Female</p>
                                        <p className="text-sm font-black text-slate-800 leading-none">{totalFemale}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={overviewSearch}
                                    onChange={(e) => setOverviewSearch(e.target.value)}
                                    placeholder="Search section, adviser..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-deped-blue/20 focus:border-deped-blue transition-all"
                                />
                                {overviewSearch.trim() && (
                                    <button onClick={() => setOverviewSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Pill Tabs for Categories */}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => { setActiveCategory(null); setOverviewSearch(''); }}
                                className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                                    !activeCategory 
                                        ? 'bg-slate-800 text-white shadow-md' 
                                        : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                                }`}
                            >
                                All Levels
                            </button>
                            {Object.entries(groupedSectionsByCategory).map(([group, groupSections]) => (
                                <button
                                    key={group}
                                    onClick={() => { setActiveCategory(group); setOverviewSearch(''); }}
                                    className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                        activeCategory === group 
                                            ? 'bg-deped-blue text-white shadow-md' 
                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                                    }`}
                                >
                                    {group === 'ELEMENTARY' ? <BookOpen className="w-3 h-3" /> : 
                                     group === 'JUNIOR HIGH SCHOOL' ? <School className="w-3 h-3" /> : 
                                     <GraduationCap className="w-3 h-3" />}
                                    {group.replace(' SCHOOL', '')} ({groupSections.length})
                                </button>
                            ))}
                        </div>

                        {!activeCategory && !overviewSearch.trim() && filteredSectionsList.length === 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="relative py-24 flex flex-col items-center justify-center text-center overflow-hidden rounded-[3rem] mt-4"
                            >
                                {/* Large Watermark Background */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                                    <img 
                                        src={schoolProfile?.logo_url || `${import.meta.env.BASE_URL}school-logo.png`} 
                                        className="w-[500px] h-[500px] object-contain grayscale scale-125 rotate-6"
                                        alt=""
                                    />
                                </div>
                                
                                <div className="relative z-10 space-y-8 max-w-lg px-8">
                                    <div className="relative">
                                        <div className="w-28 h-28 bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100 border border-white flex items-center justify-center mx-auto transition-all duration-700 hover:rotate-6 hover:scale-110">
                                            <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center">
                                                <School className="w-10 h-10 text-deped-blue/60" />
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg border border-slate-50 flex items-center justify-center animate-bounce-slow">
                                            <Sparkles className="w-5 h-5 text-amber-400" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">Ready to manage learners?</h3>
                                        <p className="text-slate-500 font-medium leading-relaxed">
                                            Click on any of the grade level categories above to explore sections, enroll new students, and manage institutional records.
                                        </p>
                                    </div>
                                    
                                    <div className="pt-6 flex flex-wrap items-center justify-center gap-6">
                                        <div className="flex items-center gap-2.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> Elementary
                                        </div>
                                        <div className="flex items-center gap-2.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" /> Junior High
                                        </div>
                                        <div className="flex items-center gap-2.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                                            <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" /> Senior High
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {(activeCategory || overviewSearch.trim()) && filteredSectionsList.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3 px-2"
                            >
                                <div className="h-8 w-1.5 bg-deped-blue rounded-full" />
                                <div>
                                    <h2 className="text-xl font-black text-gray-800 tracking-tight">
                                        {activeCategory ? activeCategory : 'Search Results'}
                                    </h2>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        {filteredSectionsList.length} Sections Found
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        <AnimatePresence>
                            {filteredSectionsList.length > 0 && (
                                <motion.div
                                    key={activeCategory || 'all'}
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                                >
                                    {filteredSectionsList.map((section) => {
                                        const count = getStudentCount(section);
                                        const maleCount = getMaleCount(section);
                                        const femaleCount = getFemaleCount(section);
                                        const adviserDisplayName = resolveAdviserName(section);
                                        const sectionDisplayName = resolveSectionDisplayName(section);
                                        const malePercent = count > 0 ? Math.round((maleCount / count) * 100) : 0;
                                        const femalePercent = count > 0 ? 100 - malePercent : 0;

                                        const isEmpty = count === 0;

                                        return (
                                            <motion.div
                                                key={section.id}
                                                variants={cardVariants}
                                                whileHover={!isEmpty ? { y: -4 } : {}}
                                                whileTap={!isEmpty ? { scale: 0.98 } : {}}
                                                onClick={() => handleSectionClick(section.id)}
                                                className={`group relative bg-white rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full ${
                                                    isEmpty 
                                                        ? 'border-2 border-dashed border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300' 
                                                        : 'border border-slate-200 shadow-sm hover:shadow-xl hover:border-deped-blue/30'
                                                }`}
                                            >
                                                {/* Clean Top Header */}
                                                <div className="p-5 flex-1">
                                                    <div className="flex justify-between items-start gap-4 mb-3">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">
                                                                {section.section_grade_level || 'No Grade'}
                                                            </p>
                                                            <h4 className={`text-lg font-black tracking-tight leading-tight truncate ${isEmpty ? 'text-slate-500' : 'text-slate-800'}`}>
                                                                {sectionDisplayName}
                                                            </h4>
                                                        </div>
                                                        <div className={`flex flex-col items-end shrink-0 ${isEmpty ? 'text-slate-400' : 'text-deped-blue'}`}>
                                                            <span className="text-2xl font-black leading-none">{count}</span>
                                                            <span className="text-[9px] uppercase tracking-widest font-bold mt-1">Learners</span>
                                                        </div>
                                                    </div>

                                                    {/* Inline Stats */}
                                                    {!isEmpty ? (
                                                        <div className="space-y-2 mt-4">
                                                            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                                                                <span className="text-blue-600">{maleCount} M ({malePercent}%)</span>
                                                                <span className="text-pink-600">{femaleCount} F ({femalePercent}%)</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                                                <div className="h-full bg-blue-500" style={{ width: `${malePercent}%` }} />
                                                                <div className="h-full bg-pink-500" style={{ width: `${femalePercent}%` }} />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-4 py-2 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                <Users className="w-3 h-3" /> Awaiting Enrollment
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Footer Bar */}
                                                <div className={`px-5 py-3 border-t ${isEmpty ? 'border-slate-100 bg-transparent' : 'border-slate-50 bg-slate-50/50'} flex items-center justify-between`}>
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isEmpty ? 'bg-slate-200 text-slate-400' : 'bg-deped-blue/10 text-deped-blue'}`}>
                                                            {section.is_advisory ? <School className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                                                        </div>
                                                        <div className="truncate">
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-0.5">{section.is_advisory ? 'Adviser' : 'Teacher'}</p>
                                                            <p className={`text-xs font-bold truncate ${isEmpty ? 'text-slate-500' : 'text-slate-700'}`}>{adviserDisplayName}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1 shrink-0 ml-2">
                                                        {(isAdmin || section.adviser_id === user?.uid) && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingStudent(null);
                                                                    setFormDataForModal({ grade_level: section.section_grade_level, student_section: section.section_name });
                                                                    setIsModalOpen(true);
                                                                }}
                                                                className={`p-1.5 rounded-lg transition-colors ${isEmpty ? 'text-slate-400 hover:bg-slate-200' : 'text-slate-500 hover:text-deped-blue hover:bg-blue-50'}`}
                                                                title="Add Learner"
                                                            >
                                                                <UserPlus className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button 
                                                            className={`p-1.5 rounded-lg transition-colors ${isEmpty ? 'text-slate-400 hover:bg-slate-200' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}
                                                            title="View Class"
                                                        >
                                                            <ChevronRight className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>

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

                        {sections.length > 0 && filteredSectionsList.length === 0 && (activeCategory || overviewSearch.trim()) && (
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

                {viewMode === 'section_detail' && (
                    <motion.div
                        key="detail"
                        variants={fadeSlide}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="bg-white/70 backdrop-blur-md rounded-3xl shadow-lg border border-white/20 overflow-hidden"
                    >
                        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 bg-linear-to-r from-gray-50/80 to-white/80 border-b border-gray-100">
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
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-linear-to-r from-deped-blue to-blue-600 text-white">
                                        {table.getHeaderGroups().map((headerGroup) => (
                                            <tr key={headerGroup.id}>
                                                {headerGroup.headers.map((header) => (
                                                    <th
                                                        key={header.id}
                                                        onClick={header.column.getToggleSortingHandler()}
                                                        className="text-left py-4 px-5 font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors"
                                                    >
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                    </th>
                                                ))}
                                            </tr>
                                        ))}
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {table.getRowModel().rows.map((row) => (
                                            <motion.tr
                                                key={row.id}
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

            <ConfirmationModal
                open={pendingAction !== null}
                title={pendingAction?.kind === 'clear-section' ? `Delete all students in ${pendingAction.sectionName}?` : ''}
                message="This will permanently remove every student enrolled in the selected section."
                details="This action cannot be undone."
                confirmLabel="Delete Students"
                intent="danger"
                onConfirm={handleConfirmPendingAction}
                onCancel={() => setPendingAction(null)}
            />

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
                        className="fixed inset-0 z-80 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4"
                        onClick={() => setDeleteTarget(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 16, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 16, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md overflow-hidden rounded-4xl bg-white shadow-[0_30px_100px_rgba(15,23,42,0.35)] border border-slate-200"
                        >
                            <div className="bg-linear-to-r from-rose-600 to-red-600 px-6 py-5 text-white">
                                <h3 className="text-2xl font-black tracking-tight">Delete {deleteTarget.last_name}, {deleteTarget.first_name}?</h3>
                            </div>
                            <div className="px-6 py-5 space-y-4">
                                <p className="text-sm text-slate-600">This will permanently remove the learner record.</p>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button onClick={() => setDeleteTarget(null)} className="h-11 rounded-xl border px-5 text-sm font-bold text-slate-700">Cancel</button>
                                    <button onClick={() => void confirmDelete()} className="h-11 rounded-xl bg-rose-600 px-5 text-sm font-black text-white">Delete</button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
