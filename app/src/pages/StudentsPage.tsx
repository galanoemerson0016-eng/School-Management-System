import { useState, useMemo, useCallback, useEffect } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
    type PaginationState,
} from '@tanstack/react-table';
import { useAppStore, useAuthStore } from '../stores';
import type { Section, Student } from '../types';
import { StudentForm } from '../components/students/StudentForm';
import { StudentProfilePrintModal } from '../components/students/StudentProfilePrintModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Search, MapPin, Edit3, Trash, ChevronRight, ChevronLeft, Download, RotateCcw, FileSpreadsheet, BookOpen, School, Sparkles, Printer, LayoutGrid, List } from 'lucide-react';
import { exportToCSV } from '../utils/csv-export';
import { parseSF1 } from '../utils/sf1-parser';
import { downloadEnrollmentTemplate, parseEnrollmentTemplate } from '../utils/enrollment-template';
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
    const [listMode, setListMode] = useState<'table' | 'grid'>('table');
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [overviewSearch, setOverviewSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');
    const [addressFilter, setAddressFilter] = useState<string>('All');

    // Table State
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [printingStudent, setPrintingStudent] = useState<Student | null>(null);
    const [formDataForModal, setFormDataForModal] = useState<Partial<Student> | undefined>(undefined);
    const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const templateInputRef = useRef<HTMLInputElement>(null);


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
    const targetSectionForForm = editingStudent
        ? officialSections.find(s => s.section_name === editingStudent.student_section || s.id === editingStudent.student_section)
        : selectedSectionObj;
    const isTargetSectionAdvisory = targetSectionForForm ? (targetSectionForForm.is_advisory ?? !targetSectionForForm.is_teaching_load) : true;
    const isSimplifiedMode = !isTargetSectionAdvisory;

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
        const gl = (selectedSectionObj?.section_grade_level || '').toLowerCase();
        const num = parseInt(gl.replace(/\D/g, '')) || 0;
        
        const isElem = gl.includes('kinder') || (num >= 1 && num <= 6);
        const isSHS = num >= 11 && num <= 12;
        const isJHS = num >= 7 && num <= 10;

        exportToCSV(displayedStudents.map(s => {
            const rowData: Record<string, string | number | boolean> = {
                'LRN': s.lrn.startsWith('TEMP-') ? '' : s.lrn,
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
                
                // Health/Nutritional
                'Weight (kg)': s.weight ?? '',
                'Height (m)': s.height ?? '',
                'Height Squared': s.heightSquared ?? '',
                'BMI': s.bmi ?? '',
                'BMI Category': s.bmi_category || '',
                'HFA': s.hfa || '',
                
                // General
                'Remarks': s.remarks || '',
                'Enrollment Date': s.enrollment_date || '',
            };

            if (isElem) {
                // Elementary Specific
                rowData['Kinder Progress Report'] = s.kinder_progress_report ? 'Yes' : 'No';
                rowData['ECCD Checklist'] = s.eccd_checklist ? 'Yes' : 'No';
                rowData['Kinder Completion Cert'] = s.kinder_completion_cert ? 'Yes' : 'No';
                rowData['PEPT Checked'] = s.pept_checked ? 'Yes' : 'No';
                rowData['Other Checked'] = s.other_checked ? 'Yes' : 'No';
                rowData['Elementary School'] = s.elementary_school || '';
                rowData['Elementary School ID'] = s.elementary_school_id || '';
                rowData['Elementary School Address'] = s.elementary_school_address || '';
            } else if (isJHS) {
                // JHS Specific
                rowData['Elementary School'] = s.elementary_school || '';
                rowData['Elementary School ID'] = s.elementary_school_id || '';
                rowData['Elementary School Address'] = s.elementary_school_address || '';
                rowData['SY Last Attended'] = s.sy_last_attended || '';
                rowData['General Average'] = s.average_grade || '';
                rowData['Citation'] = s.citation || '';
                rowData['PEPT Rating'] = s.pept_rating || '';
                rowData['PEPT Date'] = s.pept_date || '';
                rowData['ALS Rating'] = s.als_rating || '';
                rowData['Testing Center'] = s.testing_center || '';
                rowData['Other Credentials'] = s.other_credentials || '';
                rowData['Eligibility Type'] = s.eligibility_type || '';
                rowData['Is Elem Completer'] = s.is_elem_completer ? 'Yes' : 'No';
                rowData['Is PEPT Passer'] = s.is_pept_passer ? 'Yes' : 'No';
                rowData['Is ALS Passer'] = s.is_als_passer ? 'Yes' : 'No';
                rowData['Is Other Eligibility'] = s.is_other_eligibility ? 'Yes' : 'No';
            } else if (isSHS) {
                // SHS Specific
                rowData['Track'] = s.track || '';
                rowData['Strand'] = s.strand || '';
                rowData['SHS Admission Date'] = s.shs_admission_date || '';
                rowData['Is HS Completer'] = s.is_hs_completer ? 'Yes' : 'No';
                rowData['HS Gen Ave'] = s.hs_gen_ave || '';
                rowData['HS Graduation Date'] = s.hs_graduation_date || '';
                rowData['Is JHS Completer'] = s.is_jhs_completer ? 'Yes' : 'No';
                rowData['JHS Gen Ave'] = s.jhs_gen_ave || '';
                rowData['JHS School Name'] = s.jhs_school_name || '';
                rowData['JHS School Address'] = s.jhs_school_address || '';
                rowData['JHS Graduation Date'] = s.jhs_graduation_date || '';
                rowData['SHS PEPT Rating'] = s.shs_pept_rating || '';
                rowData['SHS PEPT Date'] = s.shs_pept_date || '';
                rowData['SHS ALS Rating'] = s.shs_als_rating || '';
                rowData['SHS ALS CLC Name Address'] = s.shs_als_clc_name_address || '';
                rowData['SHS Other Credentials'] = s.shs_other_credentials || '';
            }

            // Parent/Guardian details
            rowData['Parent Name'] = s.parent_name || '';
            rowData['Parent Contact'] = s.parent_contact || '';
            rowData['Parent Email'] = s.parent_email || '';
            rowData['Mother Tongue'] = s.mother_tongue || '';
            rowData['Is IP'] = s.is_ip ? 'Yes' : 'No';
            rowData['Ethnic Group'] = s.ethnic_group || '';
            rowData['Religion'] = s.religion || '';
            rowData['Father Name'] = s.father_name || '';
            rowData['Mother Name'] = s.mother_name || '';
            rowData['Guardian Name'] = s.guardian_name || '';
            rowData['Guardian Relationship'] = s.guardian_relationship || '';

            return rowData;
        }), `Students_${selectedSectionObj?.section_name || 'All'}`);
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

    const handleDownloadTemplate = () => {
        if (!selectedSectionObj) return;
        downloadEnrollmentTemplate(selectedSectionObj.section_name, isCurrentSectionAdvisory);
    };

    const handleTemplateImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedSectionObj) return;

        setIsImporting(true);
        try {
            const parsedStudents = await parseEnrollmentTemplate(file);
            
            // Tag students with the current grade and section
            const studentsToImport = parsedStudents.map(s => ({
                ...s,
                grade_level: selectedSectionObj.section_grade_level,
                student_section: selectedSectionObj.section_name
            })) as Student[];

            if (studentsToImport.length === 0) {
                alert('No valid student records found in the template. Please check the column headers and content.');
                return;
            }

            await importStudentsFromSF1(studentsToImport, selectedSectionObj.section_name);
        } catch (error) {
            console.error('Template Import Failed:', error);
            alert(`Template Import Failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsImporting(false);
            if (templateInputRef.current) templateInputRef.current.value = '';
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
                ...(isCurrentSectionAdvisory ? [{
                    accessorKey: 'lrn',
                    header: 'LRN',
                    cell: (info: { getValue: () => unknown }) => {
                        const val = info.getValue() as string;
                        const displayVal = (val && val.startsWith('TEMP-')) ? '' : val;
                        return <span className="font-mono text-xs text-gray-500 dark:text-slate-400">{displayVal}</span>;
                    },
                }] : []),
                {
                    id: 'name',
                    header: 'Name',
                    accessorFn: (row) => `${row.last_name}, ${row.first_name} ${row.middle_name ? row.middle_name.charAt(0) + '.' : ''}`,
                    cell: (info) => {
                        const student = info.row.original;
                        const isLrnInvalid = student.lrn && !/^\d{12}$/.test(student.lrn) && !student.lrn.startsWith('TEMP-');
                        
                        return (
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800 dark:text-white uppercase">{info.getValue() as string}</span>
                                {isLrnInvalid && (
                                    <span 
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 text-[9px] font-bold uppercase tracking-wider"
                                        title="LRN must be exactly 12 digits"
                                    >
                                        Invalid LRN
                                    </span>
                                )}
                            </div>
                        );
                    },
                },
                {
                    accessorKey: 'gender',
                    header: 'Gender',
                    cell: (info) => {
                        const gender = info.getValue() as string;
                        return (
                             <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${gender === 'Male' ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' : 'bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300'}`}>
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
                        if (!dateStr) return <span className="text-gray-300 dark:text-slate-600 italic text-xs">N/A</span>;
                        const parts = dateStr.split('-');
                        if (parts.length === 3) {
                            const [y, m, d] = parts;
                            return <span className="font-mono text-xs text-gray-600 dark:text-slate-300">{`${m}/${d}/${y}`}</span>;
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
                        <div className="flex gap-1 transition-opacity">
                            <button
                                onClick={() => {
                                    setPrintingStudent(row.original);
                                    setIsPrintModalOpen(true);
                                }}
                                className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                                title="Print Profile Form"
                            >
                                <Printer className="w-4 h-4" />
                            </button>
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
        state: { sorting, globalFilter, pagination },
        onSortingChange: setSorting,
        onGlobalFilterChange: (value) => { setGlobalFilter(value); setPagination(p => ({ ...p, pageIndex: 0 })); },
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
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

    const _totalStudents = validStudents.length;
    const _totalMale = validStudents.filter(s => s.gender === 'Male').length;
    const _totalFemale = validStudents.filter(s => s.gender === 'Female').length;

    const _statsSectionsCount = officialSections.length;

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
        <div className="space-y-6 pb-8 relative min-h-[80vh]">
            {/* School Logo Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] dark:opacity-[0.06] pointer-events-none select-none z-0 overflow-hidden">
                <img 
                    src={schoolProfile?.logo_url || `${import.meta.env.BASE_URL}school-logo.png`} 
                    className="w-160 h-160 max-w-none object-contain grayscale scale-125 -rotate-6"
                    alt=""
                    onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                    }}
                />
            </div>
            {/* Header */}
            {/* Redesigned Compact Header & Action Row - Rendered only in section_detail mode */}
            {viewMode === 'section_detail' && (
                <div className="flex flex-wrap items-center justify-between gap-4 bg-white/70 dark:bg-[#0d1225]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 p-3 rounded-2xl shadow-2xs relative z-10">
                    <div className="flex flex-wrap items-center gap-3.5">
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                                {selectedSectionDisplayName}
                            </h2>
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-[8px] font-black rounded-md uppercase tracking-wider border border-slate-200/50 dark:border-white/5">
                                {selectedSectionGradeDisplay}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest leading-none border-l border-slate-200/80 dark:border-white/10 pl-3">
                                Adviser: {selectedSectionAdviser}
                            </span>
                        </div>
                    </div>

                    {/* Compact Actions Row */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setViewMode('overview')}
                            className="h-9 px-3.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white font-bold text-xs shadow-3xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            Back
                        </button>

                        <button
                            onClick={handleExportStudents}
                            className="h-9 px-3.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white font-bold text-xs shadow-3xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Export CSV
                        </button>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleSF1Import}
                            accept=".csv,.xlsx,.xls"
                            className="hidden"
                        />
                        {canEdit && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isImporting}
                                className="h-9 px-3.5 bg-white dark:bg-white/5 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-xl font-bold text-xs hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                {isImporting ? 'Importing...' : 'Import SF1'}
                            </button>
                        )}

                        {canEdit && (
                            <>
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="h-9 px-3.5 bg-white dark:bg-white/5 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 rounded-xl font-bold text-xs hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Download Template
                                </button>

                                <input
                                    type="file"
                                    ref={templateInputRef}
                                    onChange={handleTemplateImport}
                                    accept=".csv,.xlsx,.xls"
                                    className="hidden"
                                />
                                <button
                                    onClick={() => templateInputRef.current?.click()}
                                    disabled={isImporting}
                                    className="h-9 px-3.5 bg-white dark:bg-white/5 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded-xl font-bold text-xs hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <FileSpreadsheet className="w-3.5 h-3.5" />
                                    {isImporting ? 'Importing Template...' : 'Import Template'}
                                </button>
                            </>
                        )}

                        {canEdit && sectionStudents.length > 0 && (
                            <button
                                onClick={() => {
                                    if (selectedSectionObj) {
                                        setPendingAction({
                                            kind: 'clear-section',
                                            sectionName: selectedSectionObj.section_name,
                                            count: sectionStudents.length
                                        });
                                    }
                                }}
                                className="h-9 px-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 rounded-xl font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                                title="Delete All Students in Section"
                            >
                                <Trash className="w-3.5 h-3.5" />
                                Delete All
                            </button>
                        )}
                        
                        {canEdit && (
                            <button
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
                                className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm animate-in fade-in"
                            >
                                <UserPlus className="w-3.5 h-3.5" />
                                Add Learner
                            </button>
                        )}
                    </div>
                </div>
            )}

            <AnimatePresence mode="wait">
                {viewMode === 'overview' && (
                    <motion.div
                        key="overview"
                        variants={fadeSlide}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="space-y-8 relative z-10"
                    >
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-[#0d1225] p-2.5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-[0_8px_30px_-6px_rgba(0,0,0,0.02)]">
                            {/* Segmented Capsule Toggles (Left aligned) */}
                            <div className="flex bg-slate-100/90 dark:bg-white/5 p-1 rounded-2xl border border-slate-200/40 dark:border-white/5 relative max-w-full overflow-x-auto scrollbar-none shrink-0">
                                {/* All Levels button */}
                                <button 
                                    onClick={() => {
                                        setActiveCategory(null);
                                        setOverviewSearch('');
                                    }}
                                    className={`relative px-6 py-2.5 text-xs font-black rounded-xl transition-all duration-300 z-10 select-none cursor-pointer whitespace-nowrap ${
                                        activeCategory === null ? 'text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                    }`}
                                >
                                    {activeCategory === null && (
                                        <motion.div 
                                            layoutId="active-student-segment"
                                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                            className="absolute inset-0 rounded-xl shadow-md bg-[#527083] dark:bg-blue-600 -z-10"
                                        />
                                    )}
                                    All Levels
                                </button>

                                {Object.entries(groupedSectionsByCategory).map(([group, _groupSections]) => {
                                    const isActive = activeCategory === group;
                                    const label = group === 'ELEMENTARY' ? 'Elementary' :
                                                  group === 'JUNIOR HIGH SCHOOL' ? 'Junior High' : 'Senior High';
                                    return (
                                        <button 
                                            key={group} 
                                            onClick={() => {
                                                setActiveCategory(group);
                                                setOverviewSearch('');
                                            }}
                                            className={`relative px-6 py-2.5 text-xs font-black rounded-xl transition-all duration-300 z-10 select-none cursor-pointer whitespace-nowrap ${
                                                isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                            }`}
                                        >
                                            {isActive && (
                                                <motion.div 
                                                    layoutId="active-student-segment"
                                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                                    className="absolute inset-0 rounded-xl shadow-md bg-[#527083] dark:bg-blue-600 -z-10"
                                                />
                                            )}
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Search (Centered) */}
                            <div className="relative group w-full md:w-80 max-w-md md:mx-auto">
                                <div className="absolute -inset-0.5 bg-linear-to-r from-blue-500 to-indigo-500 rounded-2xl blur-xs opacity-5 group-focus-within:opacity-20 transition duration-300" />
                                <div className="relative bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 p-1 rounded-2xl shadow-2xs transition-all duration-300 flex items-center gap-2 focus-within:bg-white dark:focus-within:bg-[#070a12] focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:border-blue-400">
                                    <div className="pl-3.5 pr-1 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors flex items-center">
                                        <Search className="w-3.5 h-3.5" />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Search section, adviser..."
                                        className="w-full bg-transparent border-none py-1.5 pr-3 text-xs font-bold text-slate-700 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                                        value={overviewSearch}
                                        onChange={(e) => setOverviewSearch(e.target.value)}
                                    />
                                    {overviewSearch.trim() && (
                                        <button 
                                            onClick={() => setOverviewSearch('')}
                                            className="mr-1.5 px-2 py-1 text-[8px] font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-white/10 rounded-md uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Add Learner Button (Right aligned) */}
                            {canAddGlobally && (
                                <button
                                    onClick={handleAdd}
                                    className="w-full md:w-auto px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[9px] uppercase tracking-wider shadow-sm hover:bg-slate-800 dark:hover:bg-gray-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                                >
                                    <UserPlus className="w-3.5 h-3.5" />
                                    Add Learner
                                </button>
                            )}
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
                                        className="w-125 h-125 object-contain grayscale scale-125 rotate-6"
                                        alt=""
                                    />
                                </div>
                                
                                <div className="relative z-10 space-y-8 max-w-lg px-8">
                                    <div className="relative">
                                        <div className="w-28 h-28 bg-white dark:bg-white/10 rounded-[2.5rem] shadow-2xl shadow-blue-100 dark:shadow-none border border-white dark:border-white/10 flex items-center justify-center mx-auto transition-all duration-700 hover:rotate-6 hover:scale-110">
                                            <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-white/5 flex items-center justify-center">
                                                <School className="w-10 h-10 text-deped-blue/60 dark:text-blue-400" />
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-[#0d1225] rounded-2xl shadow-lg border border-slate-50 dark:border-white/10 flex items-center justify-center animate-bounce-slow">
                                            <Sparkles className="w-5 h-5 text-amber-400" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Ready to manage learners?</h3>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                            Click on any of the grade level categories above to explore sections, enroll new students, and manage institutional records.
                                        </p>
                                    </div>
                                    
                                    <div className="pt-6 flex flex-wrap items-center justify-center gap-6">
                                        <div className="flex items-center gap-2.5 text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-[0.2em] bg-slate-50 dark:bg-white/5 px-4 py-2 rounded-full border border-slate-100 dark:border-white/5">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> Elementary
                                        </div>
                                        <div className="flex items-center gap-2.5 text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-[0.2em] bg-slate-50 dark:bg-white/5 px-4 py-2 rounded-full border border-slate-100 dark:border-white/5">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" /> Junior High
                                        </div>
                                        <div className="flex items-center gap-2.5 text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-[0.2em] bg-slate-50 dark:bg-white/5 px-4 py-2 rounded-full border border-slate-100 dark:border-white/5">
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
                                    <h2 className="text-xl font-black text-gray-800 dark:text-white tracking-tight">
                                        {activeCategory ? activeCategory : 'Search Results'}
                                    </h2>
                                    <p className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">
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
                                                className={`group relative bg-white dark:bg-[#0d1225] rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full ${
                                                    isEmpty 
                                                        ? 'border-2 border-dashed border-slate-200 dark:border-white/10 opacity-60 hover:opacity-100 hover:border-slate-300 dark:hover:border-white/20' 
                                                        : 'border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-deped-blue/30 dark:hover:border-blue-500/30'
                                                }`}
                                            >
                                                {/* Clean Top Header */}
                                                <div className="p-5 flex-1">
                                                    <div className="flex justify-between items-start gap-4 mb-3">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 truncate">
                                                                {section.section_grade_level || 'No Grade'}
                                                            </p>
                                                            <h4 className={`text-lg font-black tracking-tight leading-tight truncate ${isEmpty ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                                                                {sectionDisplayName}
                                                            </h4>
                                                        </div>
                                                        <div className={`flex flex-col items-end shrink-0 ${isEmpty ? 'text-slate-400 dark:text-slate-500' : 'text-deped-blue dark:text-blue-400'}`}>
                                                            <span className="text-2xl font-black leading-none">{count}</span>
                                                            <span className="text-[9px] uppercase tracking-widest font-bold mt-1">Learners</span>
                                                        </div>
                                                    </div>

                                                    {/* Inline Stats */}
                                                    {!isEmpty ? (
                                                        <div className="space-y-2 mt-4">
                                                            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                                                                <span className="text-blue-600 dark:text-blue-400">{maleCount} M ({malePercent}%)</span>
                                                                <span className="text-pink-600 dark:text-pink-400">{femaleCount} F ({femalePercent}%)</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden flex">
                                                                <div className="h-full bg-blue-500" style={{ width: `${malePercent}%` }} />
                                                                <div className="h-full bg-pink-500" style={{ width: `${femalePercent}%` }} />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-4 py-2 flex items-center justify-center bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                                                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                                <Users className="w-3 h-3" /> Awaiting Enrollment
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Footer Bar */}
                                                <div className={`px-5 py-3 border-t ${isEmpty ? 'border-slate-100 dark:border-white/5 bg-transparent' : 'border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5'} flex items-center justify-between`}>
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isEmpty ? 'bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-slate-500' : 'bg-deped-blue/10 dark:bg-deped-blue/20 text-deped-blue dark:text-blue-400'}`}>
                                                            {section.is_advisory ? <School className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                                                        </div>
                                                        <div className="truncate">
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-none mb-0.5">{section.is_advisory ? 'Adviser' : 'Teacher'}</p>
                                                            <p className={`text-xs font-bold truncate ${isEmpty ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>{adviserDisplayName}</p>
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
                                                                className={`p-1.5 rounded-lg transition-colors ${isEmpty ? 'text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-deped-blue dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-white/10'}`}
                                                                title="Add Learner"
                                                            >
                                                                <UserPlus className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button 
                                                            className={`p-1.5 rounded-lg transition-colors ${isEmpty ? 'text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10'}`}
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
                        className="bg-white dark:bg-[#0d1225] backdrop-blur-md rounded-3xl shadow-lg border border-slate-200 dark:border-white/10 overflow-hidden text-slate-800 dark:text-white"
                    >
                        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 bg-linear-to-r from-gray-50/80 to-white/80 dark:from-white/2 dark:to-white/2 border-b border-gray-100 dark:border-white/10">
                            {[
                                { label: 'Total', value: sectionStudents.length, icon: '👥', filter: 'All', color: 'blue' },
                                { label: 'Male', value: sectionStudents.filter(s => s.gender === 'Male').length, icon: '♂️', filter: 'Male', color: 'sky' },
                                { label: 'Female', value: sectionStudents.filter(s => s.gender === 'Female').length, icon: '♀️', filter: 'Female', color: 'pink' },
                            ].map((stat) => (
                                <motion.div
                                    key={stat.label}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => { setGenderFilter(stat.filter as 'All' | 'Male' | 'Female'); setPagination(p => ({ ...p, pageIndex: 0 })); }}
                                    className={`bg-white dark:bg-white/5 p-4 rounded-2xl shadow-xs border-2 cursor-pointer transition-all flex items-center gap-3 ${genderFilter === stat.filter
                                        ? stat.color === 'blue' ? 'border-blue-400 dark:border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/40'
                                            : stat.color === 'sky' ? 'border-sky-400 dark:border-sky-500/50 bg-sky-50/50 dark:bg-sky-950/40'
                                                : 'border-pink-400 dark:border-pink-500/50 bg-pink-50/50 dark:bg-pink-950/40'
                                        : 'border-slate-100 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20'
                                        }`}
                                >
                                    <div className="text-2xl">{stat.icon}</div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                        <p className={`text-xl font-black ${stat.color === 'blue' ? 'text-gray-800 dark:text-white' : stat.color === 'sky' ? 'text-sky-600 dark:text-sky-400' : 'text-pink-500 dark:text-pink-400'}`}>{stat.value}</p>
                                    </div>
                                </motion.div>
                            ))}

                            {isCurrentSectionAdvisory && (
                                <>
                                    <div className="bg-white dark:bg-white/5 p-4 rounded-2xl shadow-xs border border-gray-100 dark:border-white/10 flex items-center gap-3">
                                        <div className="text-2xl">🎂</div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Avg Age</p>
                                            <p className="text-xl font-black text-orange-500 dark:text-orange-400">
                                                {sectionStudents.length > 0 ? Math.round(sectionStudents.reduce((acc, s) => acc + (s.age || 0), 0) / sectionStudents.length) : 0}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-white/5 p-4 rounded-2xl shadow-xs border border-gray-100 dark:border-white/10 flex items-center gap-3">
                                        <MapPin className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-1">Location</p>
                                            <select
                                                value={addressFilter}
                                                onChange={(e) => { setAddressFilter(e.target.value); setPagination(p => ({ ...p, pageIndex: 0 })); }}
                                                className="w-full text-xs font-bold border-none p-0 focus:ring-0 cursor-pointer text-gray-700 dark:text-slate-200 bg-transparent truncate"
                                            >
                                                <option value="All" className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">All ({uniqueAddresses.length})</option>
                                                {uniqueAddresses.map(([addr, count]) => (
                                                    <option key={addr} value={addr} className="bg-white dark:bg-[#0d1225] text-slate-800 dark:text-white">{addr} ({count})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="p-4 border-b border-gray-100 dark:border-white/10 flex flex-wrap gap-3 justify-between items-center bg-slate-50/50 dark:bg-white/2">
                            <div className="relative max-w-md flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-400" />
                                <input
                                    type="text"
                                    value={globalFilter}
                                    onChange={(e) => setGlobalFilter(e.target.value)}
                                    placeholder="Search by name or LRN..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-deped-blue/20 focus:border-deped-blue transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-3 ml-auto">
                                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">
                                    Showing <span className="font-bold text-gray-800 dark:text-white">{displayedStudents.length}</span> students
                                </p>

                                <div className="flex bg-slate-100 dark:bg-white/5 p-0.5 rounded-lg border border-slate-200 dark:border-white/10">
                                    <button
                                        onClick={() => setListMode('table')}
                                        className={`p-1 px-1.5 rounded-md transition-all cursor-pointer ${
                                            listMode === 'table' 
                                                ? 'bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white shadow-3xs' 
                                                : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                        }`}
                                        title="Table View"
                                    >
                                        <List className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setListMode('grid')}
                                        className={`p-1 px-1.5 rounded-md transition-all cursor-pointer ${
                                            listMode === 'grid' 
                                                ? 'bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white shadow-3xs' 
                                                : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                        }`}
                                        title="Photo Grid View"
                                    >
                                        <LayoutGrid className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {hasActiveFilters && (
                                    <button
                                        onClick={resetDetailFilters}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5 text-xs font-bold cursor-pointer"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        Reset Filters
                                    </button>
                                )}
                            </div>
                        </div>

                        {displayedStudents.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-gray-300 dark:text-slate-500" />
                                </div>
                                <p className="text-gray-500 dark:text-slate-400 font-medium mb-4">
                                    {sectionStudents.length > 0 ? 'No learners match your current filters.' : 'No students enrolled yet.'}
                                </p>
                                {sectionStudents.length > 0 && hasActiveFilters && (
                                    <button
                                        onClick={resetDetailFilters}
                                        className="px-4 py-2 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-200 rounded-xl font-bold text-sm mr-3 cursor-pointer"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        ) : listMode === 'grid' ? (
                            <div className="flex flex-col">
                                <div className="p-6">
                                    <motion.div 
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                                    >
                                        {table.getRowModel().rows.map((row) => {
                                            const student = row.original;
                                            const fullName = `${student.last_name}, ${student.first_name} ${student.middle_name ? student.middle_name.charAt(0) + '.' : ''}`;
                                            const initials = `${student.first_name.charAt(0)}${student.last_name.charAt(0)}`.toUpperCase();
                                            const displayLrn = student.lrn.startsWith('TEMP-') ? '' : student.lrn;
                                            
                                            return (
                                                <motion.div
                                                    key={student.lrn}
                                                    variants={cardVariants}
                                                    whileHover={{ y: -4 }}
                                                    className="group bg-white dark:bg-[#0d1225] rounded-2xl border border-slate-200/80 dark:border-white/10 hover:border-deped-blue/30 shadow-2xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between"
                                                >
                                                    {/* Card Header & Photo */}
                                                    <div className="p-4 flex flex-col items-center text-center">
                                                        {/* Photo Frame */}
                                                        <div className="w-18 h-18 rounded-full border-2 border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-center relative overflow-hidden mb-3 shadow-inner shrink-0">
                                                            {student.photo_url ? (
                                                                <img 
                                                                    src={student.photo_url} 
                                                                    alt={fullName} 
                                                                    className="w-full h-full object-cover" 
                                                                />
                                                            ) : (
                                                                <div className={`w-full h-full flex items-center justify-center text-sm font-black ${
                                                                    student.gender === 'Male' ? 'bg-blue-50/70 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400' : 'bg-pink-50/70 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400'
                                                                }`}>
                                                                    {initials}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Name and LRN */}
                                                        <h5 className="font-extrabold text-xs text-slate-800 dark:text-white uppercase tracking-tight line-clamp-1 mb-1" title={fullName}>
                                                            {fullName}
                                                        </h5>
                                                        
                                                        {displayLrn ? (
                                                            <span className="font-mono text-[9px] text-slate-400 dark:text-slate-400 font-bold mb-2">
                                                                {displayLrn}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[9px] text-transparent select-none font-bold mb-2">-</span>
                                                        )}

                                                        {/* Badges */}
                                                        <div className="flex items-center gap-1 flex-wrap justify-center mb-1">
                                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                                                                student.gender === 'Male' ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300' : 'bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300'
                                                            }`}>
                                                                {student.gender}
                                                            </span>
                                                            {student.age && (
                                                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-[8px] font-black rounded-full uppercase tracking-wider">
                                                                    {student.age} yrs
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Birthday & Address */}
                                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium space-y-0.5 mt-2 w-full truncate">
                                                            {student.birthday && (
                                                                <p className="truncate text-left flex items-center justify-center gap-1">
                                                                    <span className="text-slate-400">🎂</span>
                                                                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                                                                        {(() => {
                                                                            const parts = student.birthday.split('-');
                                                                            if (parts.length === 3) {
                                                                                const [y, m, d] = parts;
                                                                                return `${m}/${d}/${y}`;
                                                                            }
                                                                            return student.birthday;
                                                                        })()}
                                                                    </span>
                                                                </p>
                                                            )}
                                                            {student.address && (
                                                                <p className="truncate text-left flex items-center justify-center gap-1" title={student.address}>
                                                                    <span className="text-slate-400">📍</span>
                                                                    <span className="font-semibold text-slate-600 dark:text-slate-300">{student.address.split(',')[0]}</span>
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Action Bar */}
                                                    <div className="bg-slate-50/50 dark:bg-white/5 border-t border-slate-100 dark:border-white/10 px-3 py-1.5 flex items-center justify-center gap-0.5">
                                                        <button
                                                            onClick={() => {
                                                                setPrintingStudent(student);
                                                                setIsPrintModalOpen(true);
                                                            }}
                                                            className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/40 text-green-600 dark:text-green-400 transition-colors cursor-pointer"
                                                            title="Print Profile Form"
                                                        >
                                                            <Printer className="w-3.5 h-3.5" />
                                                        </button>
                                                        {canEdit && (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleEdit(student)} 
                                                                    className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer" 
                                                                    title="Edit"
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDelete(student)} 
                                                                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 dark:text-red-400 transition-colors cursor-pointer" 
                                                                    title="Delete"
                                                                >
                                                                    <Trash className="w-3.5 h-3.5" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </motion.div>
                                </div>

                                {table.getPageCount() > 1 && (
                                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/2">
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => table.previousPage()}
                                                disabled={!table.getCanPreviousPage()}
                                                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => table.nextPage()}
                                                disabled={!table.getCanNextPage()}
                                                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
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
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/10 text-slate-800 dark:text-slate-200">
                                        {table.getRowModel().rows.map((row) => (
                                            <motion.tr
                                                key={row.id}
                                                className="group hover:bg-blue-50/50 dark:hover:bg-white/5 transition-colors"
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
                                {table.getPageCount() > 1 && (
                                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/2">
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => table.previousPage()}
                                                disabled={!table.getCanPreviousPage()}
                                                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                onClick={() => table.nextPage()}
                                                disabled={!table.getCanNextPage()}
                                                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
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
                    <StudentForm
                        student={editingStudent}
                        onClose={handleCloseModal}
                        initialData={formDataForModal}
                        isSimplified={isSimplifiedMode}
                    />
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

            {isPrintModalOpen && printingStudent && (
                <StudentProfilePrintModal
                    student={printingStudent}
                    section={sections.find(s => s.section_name === printingStudent.student_section || s.id === printingStudent.student_section) || null}
                    onClose={() => {
                        setIsPrintModalOpen(false);
                        setPrintingStudent(null);
                    }}
                />
            )}
        </div>
    );
}
