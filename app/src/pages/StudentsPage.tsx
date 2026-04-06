import { useState, useMemo, useRef } from 'react';
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
import type { Student } from '../types';
import { StudentForm } from '../components/students/StudentForm';
import { parseSF1 } from '../utils/sf1-parser';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Upload, Trash2, ArrowLeft, Search, MapPin, Edit3, Trash, ChevronRight, Download } from 'lucide-react';
import { exportToCSV } from '../utils/csv-export';

export function StudentsPage() {
    const { students, sections, addStudent, deleteStudent, clearSection } = useAppStore();
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'admin';

    const [viewMode, setViewMode] = useState<'overview' | 'section_detail'>('overview');
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');
    const [addressFilter, setAddressFilter] = useState<string>('All');

    // Table State
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [collapsedGrades, setCollapsedGrades] = useState<Record<string, boolean>>({});

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

    // Import State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    const getSelectedSectionObj = () => sections.find(s => s.id === selectedSectionId);
    const selectedSectionObj = getSelectedSectionObj();
    const isAdviser = user?.uid && selectedSectionObj?.adviser_id === user.uid;
    const canEdit = isAdmin || isAdviser;

    const handleExportStudents = () => {
        exportToCSV(displayedStudents.map(s => ({
            'LRN': s.lrn,
            'Last Name': s.last_name,
            'First Name': s.first_name,
            'Middle Name': s.middle_name || '',
            'Gender': s.gender,
            'Birthday': s.birthday,
            'Age': s.age,
            'Address': s.address,
            'Contact': s.contact_number || '',
            'Grade Level': s.grade_level,
            'Section': s.student_section || '',
        })), `Students_${selectedSectionObj?.section_name || 'All'}`);
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
        sections.forEach((section) => {
            const grade = section.section_grade_level || 'No Grade';
            if (!grouped[grade]) grouped[grade] = [];
            grouped[grade].push(section);
        });
        return grouped;
    }, [sections]);

    const sectionStudents = useMemo(() => {
        if (viewMode === 'overview') return [];
        const section = sections.find(s => s.id === selectedSectionId);
        if (!section) return [];
        const filtered = students.filter(s => s.student_section === section.section_name);
        return filtered.sort((a, b) => {
            if (a.gender !== b.gender) return a.gender === 'Male' ? -1 : 1;
            return a.last_name.localeCompare(b.last_name);
        });
    }, [students, sections, selectedSectionId, viewMode]);

    const uniqueAddresses = useMemo(() => {
        const counts: Record<string, number> = {};
        sectionStudents.forEach(s => {
            if (s.address) counts[s.address] = (counts[s.address] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [sectionStudents]);

    const displayedStudents = useMemo(() => {
        let filtered = sectionStudents;
        if (genderFilter !== 'All') filtered = filtered.filter(s => s.gender === genderFilter);
        if (addressFilter !== 'All') filtered = filtered.filter(s => s.address === addressFilter);
        return filtered;
    }, [sectionStudents, genderFilter, addressFilter]);

    const handleSectionClick = (sectionId: string) => {
        setSelectedSectionId(sectionId);
        setGenderFilter('All');
        setAddressFilter('All');
        setViewMode('section_detail');
    };

    const handleBackToOverview = () => {
        setViewMode('overview');
        setSelectedSectionId(null);
        setGlobalFilter('');
        setGenderFilter('All');
        setAddressFilter('All');
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
                {
                    accessorKey: 'birthday',
                    header: 'Birthday',
                    cell: (info) => {
                        const dateStr = info.getValue() as string;
                        if (!dateStr) return <span className="text-gray-300 italic text-xs">N/A</span>;
                        const parts = dateStr.split('-');
                        if (parts.length === 3) {
                            const [y, m, d] = parts;
                            return <span className="font-mono text-xs text-gray-600">{`${m}/${d}/${y}`}</span>;
                        }
                        return dateStr;
                    },
                },
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
        [canEdit]
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

    const handleEdit = (student: Student) => {
        setEditingStudent(student);
        setIsModalOpen(true);
    };

    const handleDelete = (student: Student) => {
        if (confirm(`Delete ${student.first_name} ${student.last_name}?`)) {
            deleteStudent(student.lrn);
        }
    };

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
        if (confirm(`⚠️ DANGER: Delete ALL ${count} students in ${selectedSectionObj.section_name}?`)) {
            try {
                await clearSection(selectedSectionObj.section_name);
                alert("Section cleared successfully.");
            } catch (e) {
                alert("Error clearing section: " + e);
            }
        }
    };

    const handleImportClick = () => fileInputRef.current?.click();

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !selectedSectionObj) return;

        setIsImporting(true);
        try {
            const importedStudents = await parseSF1(file);
            if (importedStudents.length === 0) {
                alert("No valid students found.");
                setIsImporting(false);
                return;
            }

            if (confirm(`Found ${importedStudents.length} students. Import into ${selectedSectionObj.section_name}?`)) {
                let successCount = 0;
                for (const student of importedStudents) {
                    const enrichedStudent: Student = {
                        ...student,
                        grade_level: selectedSectionObj.section_grade_level,
                        student_section: selectedSectionObj.section_name,
                        age: student.birthday ? new Date().getFullYear() - new Date(student.birthday).getFullYear() : 0
                    };
                    try {
                        await addStudent(enrichedStudent);
                        successCount++;
                    } catch (e) {
                        console.error(`Failed to add ${student.last_name}:`, e);
                    }
                }
                alert(`Successfully imported ${successCount} students!`);
            }
        } catch (error) {
            alert(`Import Failed: ${error}`);
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const getStudentCount = (sectionName: string) => students.filter(s => s.student_section === sectionName).length;
    const getMaleCount = (sectionName: string) => students.filter(s => s.student_section === sectionName && s.gender === 'Male').length;
    const getFemaleCount = (sectionName: string) => students.filter(s => s.student_section === sectionName && s.gender === 'Female').length;

    const validStudents = useMemo(() => {
        return students.filter(s => sections.some(sec => sec.section_name === s.student_section));
    }, [students, sections]);

    const totalStudents = validStudents.length;
    const totalMale = validStudents.filter(s => s.gender === 'Male').length;
    const totalFemale = validStudents.filter(s => s.gender === 'Female').length;

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-4 justify-between items-center"
            >
                <div>
                    <h2 className="text-3xl font-extrabold text-deped-blue tracking-tight flex items-center gap-3">
                        {viewMode === 'section_detail' && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleBackToOverview}
                                className="p-2 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </motion.button>
                        )}
                        {viewMode === 'overview' ? 'Student Information' : selectedSectionObj?.section_name}
                    </h2>
                    {viewMode === 'overview' ? (
                        <p className="text-gray-500 font-medium mt-1">{totalStudents} Learners • {sections.length} Sections</p>
                    ) : (
                        <p className="text-gray-500 font-medium mt-1">
                            {selectedSectionObj?.section_grade_level} • Room {selectedSectionObj?.section_room || 'TBA'}
                            {isAdviser && <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Adviser</span>}
                        </p>
                    )}
                </div>

                <div className="flex gap-2">
                    {viewMode === 'section_detail' && canEdit && (
                        <>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xls,.xlsx" className="hidden" />
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleImportClick}
                                disabled={isImporting}
                                className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md hover:bg-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                <Upload className="w-4 h-4" />
                                {isImporting ? 'Importing...' : 'Import SF1'}
                            </motion.button>

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

                    {canEdit && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleAdd}
                            className="px-5 py-2.5 bg-deped-blue text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                        >
                            <UserPlus className="w-4 h-4" />
                            Add Student
                        </motion.button>
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
                            
                            <div className="flex gap-2 mb-1">
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
                            </div>
                        </div>

                        {/* Section Cards by Grade */}
                        {Object.entries(sectionsByGrade)
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
                                            const count = getStudentCount(section.section_name);
                                            const maleCount = getMaleCount(section.section_name);
                                            const femaleCount = getFemaleCount(section.section_name);
                                            const malePercent = count > 0 ? (maleCount / count) * 100 : 50;

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
                                                                    {section.section_name}
                                                                </h4>
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                                                                    Room {section.section_room || 'TBA'}
                                                                </p>
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
                                                                <span className="text-gray-500">Adviser:</span> TBA
                                                            </p>
                                                            <div className="flex items-center gap-1 text-deped-blue font-bold text-xs opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                                View <ChevronRight className="w-3 h-3" />
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
                                <p className="text-gray-500">Go to Classes/Sections to create your first section.</p>
                            </motion.div>
                        )}
                    </motion.div>
                )}

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
                        </div>

                        {/* Search Bar */}
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
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
                            <p className="text-sm text-gray-500 font-medium ml-4">
                                Showing <span className="font-bold text-gray-800">{displayedStudents.length}</span> students
                            </p>
                        </div>

                        {/* Table */}
                        {displayedStudents.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-gray-300" />
                                </div>
                                <p className="text-gray-500 font-medium mb-4">No students enrolled yet.</p>
                                {canEdit && (
                                    <div className="flex justify-center gap-3">
                                        <button onClick={handleAdd} className="px-4 py-2 bg-deped-blue text-white rounded-xl font-bold text-sm">
                                            Add Manually
                                        </button>
                                        <button onClick={handleImportClick} className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-sm">
                                            Import SF1
                                        </button>
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
                                initialData={viewMode === 'section_detail' && selectedSectionObj ? {
                                    grade_level: selectedSectionObj.section_grade_level,
                                    student_section: selectedSectionObj.section_name
                                } : undefined}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
