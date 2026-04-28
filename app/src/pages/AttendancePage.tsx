import { useState, useMemo, useEffect, useRef } from 'react';
import { useAppStore } from '../stores';
import { useAuthStore } from '../stores/auth-store';
import { Printer, ArrowLeft, ArrowRight, ChevronDown, Plus, Minus, Search } from 'lucide-react';
import { canEditAttendanceSection, filterAttendanceSections } from '../lib/rbac';

type AttendanceDayStatus = string;
type AttendanceMonthData = Record<string, Record<number, AttendanceDayStatus>>;
type DateLabels = Record<number, string>;
 
const SCHOOL_CALENDAR_2026_2027: Record<string, number[]> = {
    JUNE: [8, 9, 10, 11, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26, 29, 30],
    JULY: [1, 2, 3, 6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 20, 21, 22, 23, 24, 27, 28, 29, 30, 31],
    AUGUST: [3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 17, 18, 19, 20, 24, 25, 26, 27, 28],
    SEPTEMBER: [1, 2, 3, 4, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 28, 29, 30],
    OCTOBER: [1, 2, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 26, 27, 28, 29, 30],
    NOVEMBER: [3, 4, 5, 6, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 23, 24, 25, 26, 27],
    DECEMBER: [1, 2, 3, 4, 7, 9, 10, 11, 14, 15, 16, 17, 18],
    JANUARY: [4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 18, 19, 20, 21, 22, 25, 26, 27, 28, 29],
    FEBRUARY: [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26],
    MARCH: [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 29, 30, 31],
    APRIL: [1, 2, 5, 6, 7, 8],
};


export function AttendancePage() {
    const { students, sections, activeSF2Sheet, fetchSF2Sheet, saveSF2Sheet, schoolProfile, teachers, setCurrentView } = useAppStore();
    const { user } = useAuthStore();
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('JUNE');
    const [zoom, setZoom] = useState(1);

    const months = ['JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL'];

    const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceMonthData>>({});
    const [monthDateLabels, setMonthDateLabels] = useState<Record<string, DateLabels>>({});

    const totalColumns = 25; // 5 weeks × 5 days (Mon-Fri)

    // Persistence: Fetch on change
    useEffect(() => {
        if (selectedSection && selectedMonth) {
            fetchSF2Sheet(selectedSection, selectedMonth);
        }
    }, [selectedSection, selectedMonth, fetchSF2Sheet]);

    // Persistence: Sync store to local
    useEffect(() => {
        if (activeSF2Sheet && activeSF2Sheet.month === selectedMonth && activeSF2Sheet.section_id === selectedSection && activeSF2Sheet.school_year === useAppStore.getState().activeSchoolYear) {
            setAttendanceData(prev => ({
                ...prev,
                [selectedMonth]: activeSF2Sheet.attendance || {}
            }));
            setMonthDateLabels(prev => ({
                ...prev,
                [selectedMonth]: activeSF2Sheet.date_labels || {}
            }));
        }
    }, [activeSF2Sheet, selectedMonth, selectedSection]);

    // Persistence: Debounced Save
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingSaveRef = useRef<{ month: string; data: AttendanceMonthData; labels: DateLabels } | null>(null);

    const triggerSave = (month: string, newData: AttendanceMonthData, newLabels: DateLabels, immediate = false) => {
        // Track the most recent data for unmount flushing
        pendingSaveRef.current = { month, data: newData, labels: newLabels };

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        const doSave = () => {
            if (!selectedSection || !pendingSaveRef.current) return;
            const { month: m, data: d, labels: l } = pendingSaveRef.current;
            saveSF2Sheet({
                id: `${selectedSection}_${useAppStore.getState().activeSchoolYear}_${m}`,
                section_id: selectedSection,
                school_year: useAppStore.getState().activeSchoolYear,
                month: m,
                date_labels: l,
                attendance: d,
                updated_at: new Date().toISOString()
            });
            pendingSaveRef.current = null;
        };

        if (immediate) {
            doSave();
        } else {
            saveTimeoutRef.current = setTimeout(doSave, 800); // Faster saving
        }
    };

    // Cleanup: Flush pending save on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            if (pendingSaveRef.current && selectedSection) {
                const { month, data, labels } = pendingSaveRef.current;
                saveSF2Sheet({
                    id: `${selectedSection}_${useAppStore.getState().activeSchoolYear}_${month}`,
                    section_id: selectedSection,
                    school_year: useAppStore.getState().activeSchoolYear,
                    month,
                    date_labels: labels,
                    attendance: data,
                    updated_at: new Date().toISOString()
                });
            }
        };
    }, [selectedSection, saveSF2Sheet]);

    const sortedSections = useMemo(() => {
        return [...filterAttendanceSections(user, sections)].sort((a, b) => {
            // Extract numeric grade level (e.g. "Grade 7" -> 7)
            const gradeA = parseInt(a.section_grade_level.replace(/\D/g, '')) || 0;
            const gradeB = parseInt(b.section_grade_level.replace(/\D/g, '')) || 0;

            if (gradeA !== gradeB) return gradeA - gradeB;
            return a.section_name.localeCompare(b.section_name);
        });
    }, [sections, user]);

    useEffect(() => {
        if (sortedSections.length !== 1) return;
        const onlySectionName = sortedSections[0].section_name;
        if (selectedSection !== onlySectionName) {
            setSelectedSection(onlySectionName);
        }
    }, [sortedSections, selectedSection]);

    const selectedSectionObj = useMemo(() => {
        return sections.find((s) => s.section_name === selectedSection || s.id === selectedSection);
    }, [sections, selectedSection]);

    const isRecoveredAdviserPlaceholder = (value?: string | null) => {
        const normalized = (value || '').trim().toLowerCase();
        return normalized === 'recovered adviser' || normalized === 'recovered advisor';
    };

    const canEditCurrentSection = useMemo(() => {
        if (!selectedSectionObj) return false;
        return canEditAttendanceSection(user, selectedSectionObj);
    }, [user, selectedSectionObj]);

    const buildAutoFilledDateLabels = (month: string): DateLabels => {
        const sy = useAppStore.getState().activeSchoolYear;
        const filled: Record<number, string> = {};

        const monthMap: Record<string, number> = {
            'JANUARY': 0, 'FEBRUARY': 1, 'MARCH': 2, 'APRIL': 3, 'MAY': 4, 'JUNE': 5,
            'JULY': 6, 'AUGUST': 7, 'SEPTEMBER': 8, 'OCTOBER': 9, 'NOVEMBER': 10, 'DECEMBER': 11
        };
        const monthIndex = monthMap[month];
        const [startYear, endYear] = sy.split('-').map(Number);
        const year = monthIndex >= 5 ? startYear : endYear;

        if (sy === '2026-2027' && SCHOOL_CALENDAR_2026_2027[month]) {
            // Use Hardcoded Calendar for SY 2026-2027 with Accurate Week Positioning
            const calendarDays = SCHOOL_CALENDAR_2026_2027[month];
            
            // Calculate day of week for the 1st of the month (Monday=0 ... Sunday=6)
            const firstDateOfMonth = new Date(year, monthIndex, 1);
            const firstDayOffset = firstDateOfMonth.getDay() === 0 ? 6 : firstDateOfMonth.getDay() - 1;

            calendarDays.forEach((d) => {
                const dateObj = new Date(year, monthIndex, d);
                const dow = dateObj.getDay(); // 0 (Sun) to 6 (Sat)
                
                if (dow >= 1 && dow <= 5) {
                    // Calculate which week of the month this date falls into
                    // (d + offset - 1) / 7 gives the 0-indexed week number
                    const totalDaysFromMondayOfFirstWeek = d + firstDayOffset - 1;
                    const weekIndex = Math.floor(totalDaysFromMondayOfFirstWeek / 7);
                    
                    // Column index logic: (weekIndex * 5) + (Mon=0..Fri=4)
                    const colIndex = (weekIndex * 5) + (dow - 1);
                    
                    if (colIndex >= 0 && colIndex < totalColumns) {
                        filled[days[colIndex]] = d.toString();
                    }
                }
            });
        } else {
            // Fallback to Dynamic Mon-Fri logic for other years
            const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

            let firstSchoolDayDate = 0;
            let firstSchoolDayDow = 0;

            // Find first school day (1..5)
            for (let d = 1; d <= 7; d++) {
                const date = new Date(year, monthIndex, d);
                const dow = date.getDay();
                if (dow >= 1 && dow <= 5) {
                    firstSchoolDayDate = d;
                    firstSchoolDayDow = dow;
                    break;
                }
            }

            if (firstSchoolDayDate === 0) return filled; // No school days?

            let currentIndex = firstSchoolDayDow - 1; // 1(Mon)->0, 2(Tue)->1...

            for (let d = firstSchoolDayDate; d <= daysInMonth; d++) {
                const date = new Date(year, monthIndex, d);
                const dow = date.getDay();

                if (dow >= 1 && dow <= 5) {
                    if (currentIndex < totalColumns) {
                        filled[days[currentIndex]] = d.toString();
                        currentIndex++;
                    }
                }
            }
        }

        return filled;
    };

    const applyAutoFillDates = (month: string, immediate = false) => {
        const filled = buildAutoFilledDateLabels(month);

        setMonthDateLabels(prev => ({
            ...prev,
            [month]: filled
        }));

        // Persist only when current user is allowed to edit this section.
        if (selectedSection && canEditCurrentSection) {
            triggerSave(month, attendanceData[month] || {}, filled, immediate);
        }
    };

    // Auto-populate date labels whenever month/section changes and labels are empty.
    useEffect(() => {
        if (!selectedSection || !selectedMonth) return;

        const existingLabels = monthDateLabels[selectedMonth] || {};
        const hasAnyLabel = Object.values(existingLabels).some(v => String(v).trim() !== '');

        if (!hasAnyLabel) {
            applyAutoFillDates(selectedMonth, true);
        }
    }, [selectedSection, selectedMonth, monthDateLabels, canEditCurrentSection]);



    const sectionStudents = useMemo(() => {
        if (!selectedSection) return [];
        const sectionId = sections.find(s => s.section_name === selectedSection)?.id;
        return students.filter((s) => s.student_section === selectedSection || (sectionId && s.student_section === sectionId));
    }, [selectedSection, students, sections]);

    const displayStudents = useMemo(() => {
        const males = sectionStudents.filter(s => s.gender === 'Male').sort((a, b) => a.last_name.localeCompare(b.last_name));
        const females = sectionStudents.filter(s => s.gender === 'Female').sort((a, b) => a.last_name.localeCompare(b.last_name));
        return { males, females };
    }, [sectionStudents]);

    const days = Array.from({ length: totalColumns }, (_, i) => i + 1);
    const dayLetters = ['M', 'T', 'W', 'TH', 'F'];

    const toggleAttendance = (studentId: string, day: number) => {
        if (!canEditCurrentSection) return;

        setAttendanceData(prev => {
            const monthData = prev[selectedMonth] || {};
            const studentRecord = monthData[studentId] || {};
            const currentStatus = studentRecord[day];
            let newStatus = '';
            if (!currentStatus) newStatus = 'absent';
            else if (currentStatus === 'absent') newStatus = 'tardy';
            else if (currentStatus === 'tardy') newStatus = 'cutting';
            else if (currentStatus === 'cutting') newStatus = '';

            const newData = {
                ...prev,
                [selectedMonth]: {
                    ...monthData,
                    [studentId]: { ...studentRecord, [day]: newStatus }
                }
            };

            triggerSave(selectedMonth, newData[selectedMonth], monthDateLabels[selectedMonth] || {});
            return newData;
        });
    };

    const getStatusSymbol = (status?: string) => {
        switch (status) {
            case 'absent': return 'X';
            case 'tardy': return 'T';
            case 'cutting': return 'CC';
            default: return '';
        }
    };

    const getBorderClass = (i: number) => {
        let cls = '';
        if (i % 5 === 0) cls += ' border-l-2 border-l-black';
        if (i % 5 === 4) cls += ' border-r-2 border-r-black';
        return cls;
    };

    // Helper to get current month's data
    const currentAttendance = attendanceData[selectedMonth] || {};
    // Use global dates
    const currentDateLabels = monthDateLabels[selectedMonth] || {};

    const countStats = (studentId: string, type: string) => {
        const record = currentAttendance[studentId] || {};
        return Object.entries(record).filter(([col, s]) => {
            const colNum = parseInt(col);
            return colNum >= 1 && colNum <= totalColumns && s === type;
        }).length;
    };

    // Count how many date cells actually have a date filled in
    const filledDaysCount = Object.values(currentDateLabels).filter(v => v.trim() !== '').length;

    const calculateDailyAbsent = (day: number, gender: 'Male' | 'Female' | 'Total') => {
        let targetStudents: typeof displayStudents.males = [];
        if (gender === 'Male') targetStudents = displayStudents.males;
        else if (gender === 'Female') targetStudents = displayStudents.females;
        else targetStudents = [...displayStudents.males, ...displayStudents.females];
        return targetStudents.reduce((total, student) => {
            const status = currentAttendance[student.lrn]?.[day];
            return total + (status === 'absent' ? 1 : 0);
        }, 0);
    };

    const handlePrint = () => {
        const selectedSectionName = sections.find(s => s.id === selectedSection || s.section_name === selectedSection)?.section_name || 'Record';
        const originalTitle = document.title;
        document.title = `SF2_${schoolProfile.name || 'School'}_${selectedSectionName}_${selectedMonth}_${useAppStore.getState().activeSchoolYear}`;
        window.print();
        document.title = originalTitle;
    };
    const totalMaleAbsent = displayStudents.males.reduce((sum, s) => sum + countStats(s.lrn, 'absent'), 0);
    const totalFemaleAbsent = displayStudents.females.reduce((sum, s) => sum + countStats(s.lrn, 'absent'), 0);
    const totalMalePresent = displayStudents.males.reduce((sum, s) => sum + (Math.max(0, filledDaysCount - countStats(s.lrn, 'absent'))), 0);
    const totalFemalePresent = displayStudents.females.reduce((sum, s) => sum + (Math.max(0, filledDaysCount - countStats(s.lrn, 'absent'))), 0);

    const summaryStats = useMemo(() => {
        // Enrolment Stats
        let maleBaseline = 0, femaleBaseline = 0;
        let maleLate = 0, femaleLate = 0;
        let maleRegistered = 0, femaleRegistered = 0;

        const isLate = (s: { enrollment_date?: string }) => {
            if (!s.enrollment_date) return false;
            const d = new Date(s.enrollment_date);
            if (isNaN(d.getTime())) return false;
            const m = d.toLocaleString('en-US', { month: 'long' }).toUpperCase();
            return m === selectedMonth && selectedMonth !== 'JUNE';
        };

        displayStudents.males.forEach(s => {
            maleRegistered++;
            if (isLate(s)) maleLate++;
            else maleBaseline++; 
        });
        displayStudents.females.forEach(s => {
            femaleRegistered++;
            if (isLate(s)) femaleLate++;
            else femaleBaseline++;
        });

        // ADA
        const maleADA = filledDaysCount > 0 ? (totalMalePresent / filledDaysCount) : 0;
        const femaleADA = filledDaysCount > 0 ? (totalFemalePresent / filledDaysCount) : 0;

        // Percentage
        const malePerc = maleRegistered > 0 ? (maleADA / maleRegistered) * 100 : 0;
        const femalePerc = femaleRegistered > 0 ? (femaleADA / femaleRegistered) * 100 : 0;

        // 5 Consecutive Absences
        const hasConsecutiveAbsences = (s: { lrn: string }) => {
            const records = attendanceData[selectedMonth]?.[s.lrn] || {};
            const validDays = days.filter(d => monthDateLabels[selectedMonth]?.[d]);

            let consecutive = 0;
            for (const d of validDays) {
                const status = records[d];
                if (status === 'absent') {
                    consecutive++;
                    if (consecutive >= 5) return true;
                } else {
                    consecutive = 0;
                }
            }
            return false;
        };

        let maleConsecutive = 0, femaleConsecutive = 0;
        displayStudents.males.forEach(s => { if (hasConsecutiveAbsences(s)) maleConsecutive++; });
        displayStudents.females.forEach(s => { if (hasConsecutiveAbsences(s)) femaleConsecutive++; });

        return {
            maleBaseline, femaleBaseline,
            maleLate, femaleLate,
            maleRegistered, femaleRegistered,
            maleADA, femaleADA,
            malePerc, femalePerc,
            maleConsecutive, femaleConsecutive
        };
    }, [displayStudents, selectedMonth, filledDaysCount, totalMalePresent, totalFemalePresent, attendanceData, monthDateLabels, days]);

    const singleSection = sortedSections.length === 1 ? sortedSections[0] : null;

    return (
        <div className="flex flex-col h-screen bg-slate-50 relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white">
             {/* Sticky Premium Top Toolbar */}
             <div className="h-24 px-8 flex items-center justify-between z-[100] bg-white/90 backdrop-blur-3xl border-b border-slate-200 shadow-sm relative print:hidden shrink-0">
                <div className="flex items-center gap-8">
                    {/* Brand/Back Hook */}
                    <div className="flex items-center gap-5">
                        <button 
                            onClick={() => setCurrentView('school-forms')}
                            className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all group"
                            title="Back to Hub"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">SF2 Attendance</h2>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Daily Report</p>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-2" />

                    <div className="flex items-center gap-4">
                        {/* Section Selector (hide when only one section exists) */}
                        {!singleSection && (
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Section</span>
                                <div className="relative group">
                                    <select
                                        value={selectedSection}
                                        onChange={(e) => setSelectedSection(e.target.value)}
                                        className="appearance-none bg-slate-100 border border-slate-200 rounded-2xl px-5 py-2.5 pr-10 text-[12px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer min-w-[200px]"
                                    >
                                        <option value="">Choose Section</option>
                                        {sortedSections.map(section => (
                                            <option key={section.id} value={section.section_name}>{section.section_name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors" />
                                </div>
                            </div>
                        )}
                        {/* Month Selector */}
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Month</span>
                            <div className="relative group">
                                <select 
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="appearance-none bg-slate-100 border border-slate-200 rounded-2xl px-5 py-2.5 pr-10 text-[12px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer min-w-[160px]"
                                >
                                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors" />
                            </div>
                        </div>

                        {/* Reset/Sync Dates Button */}
                        {canEditCurrentSection && (
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Calendar Fix</span>
                                <button
                                    onClick={() => {
                                        if (confirm("Reset current month's date headers to match official DEPED calendar?")) {
                                            applyAutoFillDates(selectedMonth, true);
                                        }
                                    }}
                                    className="h-10 px-4 rounded-2xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all flex items-center gap-2 shadow-sm"
                                    title="Sync headers with official school calendar"
                                >
                                    Sync Dates
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Zoom Control */}
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">View Zoom</span>
                        <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                            <button 
                                onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))}
                                className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-[11px] font-black text-slate-900 w-12 text-center tabular-nums">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button 
                                onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                                className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="h-10 w-px bg-slate-200" />

                    {/* Print Primary Button */}
                    <button
                        onClick={handlePrint}
                        disabled={!selectedSection}
                        className="h-14 px-10 rounded-2.5xl bg-blue-600 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-3 group"
                    >
                        <Printer className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                        Print Official SF2
                    </button>
                </div>
             </div>

             {/* Main Workspace Area */}
             <div className="flex-1 overflow-auto relative bg-slate-100 print:bg-white custom-scrollbar">
                {!selectedSection ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-10 p-10 z-10">
                        <div className="relative">
                            <div className="absolute -inset-20 bg-blue-500/5 blur-[100px] rounded-full" />
                            <div className="relative w-48 h-48 bg-white rounded-[3rem] border border-slate-200 flex items-center justify-center transform -rotate-6 border-dashed">
                                <Search className="w-20 h-20 text-slate-200" />
                                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-xl">
                                    <span className="text-2xl font-black text-blue-600 italic">SF2</span>
                                </div>
                            </div>
                        </div>
                        <div className="max-w-md space-y-4">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Attendance Hub</h2>
                            <p className="text-slate-500 font-bold leading-relaxed">
                                Please select a section and month from the toolbar above to manage learner attendance records.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="w-full min-h-full flex justify-center py-20 px-8 print:p-0 print:block overflow-x-auto">
                        <div 
                            className="transition-all duration-700 ease-out origin-top print:scale-100"
                            style={{ transform: `scale(${zoom})` }}
                        >
                            <div className="bg-white mx-auto w-[1350px] print:w-full shadow-[0_20px_50px_rgba(0,0,0,0.08)] print:shadow-none border border-slate-200 print:border-none mb-8 p-6 print:p-2 print:m-0 rounded-sm">

                {/* === HEADER === */}
                <div className="flex items-center mb-1">
                    <div className="w-[75px] flex-shrink-0">
                        <img src={`${import.meta.env.BASE_URL}deped_logo_left.png`} alt="DepEd Logo" className="w-[70px] h-[70px] object-contain" />
                    </div>
                    <div className="flex-1 text-center">
                        <p className="text-[16px] font-bold leading-tight" style={{ fontFamily: 'Arial, sans-serif' }}>School Form 2 (SF2) Daily Attendance Report of Learners</p>
                        <p className="italic text-[9px] text-gray-600">(This replaced Form 1, Form 2 &amp; STS Form 4 - Absenteeism and Dropout Profile)</p>
                    </div>
                    <div className="w-[100px] flex-shrink-0 flex justify-end">
                        <img src={`${import.meta.env.BASE_URL}deped_logo_right.png`} alt="DepEd" className="h-[55px] object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                </div>

                {/* Row 1: School ID | School Year | Report for the Month of */}
                <div className="flex items-center mb-0.5 text-[10px]">
                    <span className="font-bold mr-1 whitespace-nowrap">School ID</span>
                    <div className="border border-black px-2 py-0.5 w-24 text-center font-bold">307014</div>
                    <span className="font-bold ml-4 mr-1 whitespace-nowrap">School Year</span>
                    <div className="border border-black px-2 py-0.5 w-24 text-center font-bold">2026-2027</div>
                    <span className="flex-1"></span>
                    <span className="font-bold mr-1 whitespace-nowrap">Report for the Month of</span>
                    <div className="border border-black bg-[#BDD7EE] px-2 py-0.5 w-32 text-center font-bold uppercase">{selectedMonth}</div>
                </div>

                {/* Row 2: Name of School | Grade Level | Section */}
                <div className="flex items-center mb-1.5 text-[10px]">
                    <span className="font-bold mr-1 whitespace-nowrap">Name of School</span>
                    <div className="border border-black px-2 py-0.5 w-[340px] text-center font-bold uppercase">CALIBUNGAN HIGH SCHOOL</div>
                    <span className="font-bold ml-4 mr-1 whitespace-nowrap">Grade Level</span>
                    <div className="border border-black px-2 py-0.5 w-20 text-center font-bold whitespace-nowrap">
                        {sections.find(s => s.section_name === selectedSection)?.section_grade_level || '7'}
                    </div>
                    <span className="font-bold ml-4 mr-1 whitespace-nowrap">Section</span>
                    <div className="border border-black px-2 py-0.5 w-36 text-center font-bold uppercase">{selectedSection || 'EMERALD'}</div>
                </div>

                {/* === MAIN TABLE === */}
                <table className="w-full border-collapse border-2 border-black text-[9px] mb-0" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                        <col style={{ width: '20px' }} />
                        <col style={{ width: '200px' }} />
                        {days.map(d => <col key={d} style={{ width: '22px' }} />)}
                        <col style={{ width: '38px' }} />
                        <col style={{ width: '38px' }} />
                        <col style={{ width: '160px' }} />
                    </colgroup>
                    <thead>
                        {/* Row 1: Labels */}
                        <tr>
                            <th rowSpan={4} className="border border-black bg-white p-0 text-center align-middle" style={{ writingMode: 'horizontal-tb' }}></th>
                            <th rowSpan={4} className="border border-black bg-white p-1 text-center align-middle leading-tight">
                                <div className="font-bold text-[10px] uppercase">Learner's Name</div>
                                <div className="font-normal text-[8px]">(Last Name, First Name, Middle Name)</div>
                            </th>
                            <th colSpan={totalColumns} className="border border-black bg-white text-center text-[9px] py-0.5">
                                (1st row for date, 2nd row for Day: M,T,W,TH,F)
                            </th>
                            <th colSpan={2} rowSpan={3} className="border border-black bg-white text-center text-[9px] p-1 leading-tight align-middle">
                                Total for the<br />Month
                            </th>
                            <th rowSpan={4} className="border border-black bg-white p-1 text-[8px] leading-tight text-left align-top">
                                <span className="font-bold">REMARK/S</span> (If NLS, state reason, please refer to legend number 2. If TRANSFERRED IN/OUT, write the name of School.)
                            </th>
                        </tr>
                        {/* Row 2: Date numbers (blue background, editable) */}
                        <tr className="bg-[#BDD7EE]">
                            {days.map((d, i) => (
                                <th key={d} className={`border border-black bg-[#BDD7EE] p-0 text-center text-[8px] font-bold h-5${getBorderClass(i)}`}>
                                    <input
                                        type="text"
                                        maxLength={2}
                                        value={currentDateLabels[d] || ''}
                                        readOnly={!canEditCurrentSection}
                                        onChange={(e) => {
                                            if (!canEditCurrentSection) return;
                                            const val = e.target.value;
                                            setMonthDateLabels(prev => {
                                                const newLabels = {
                                                    ...prev,
                                                    [selectedMonth]: { ...(prev[selectedMonth] || {}), [d]: val }
                                                };
                                                triggerSave(selectedMonth, attendanceData[selectedMonth] || {}, newLabels[selectedMonth]);
                                                return newLabels;
                                            });
                                        }}
                                        className="w-full h-full text-center text-[8px] font-bold bg-transparent border-none outline-none p-0"
                                    />
                                </th>
                            ))}
                        </tr>
                        {/* Row 3: Day letters M T W TH F (white background) */}
                        <tr>
                            {days.map((d, i) => (
                                <th key={d} className={`border border-black bg-white p-0 text-center text-[8px] font-bold h-4${getBorderClass(i)}`}>
                                    {dayLetters[i % 5]}
                                </th>
                            ))}
                        </tr>
                        {/* Row 4: ABSENT / PRESENT headers */}
                        <tr>
                            {days.map((d, i) => (
                                <th key={d} className={`border border-black bg-white p-0 h-0${getBorderClass(i)}`}></th>
                            ))}
                            <th className="border border-black bg-white text-[8px] font-bold p-0.5">ABSENT</th>
                            <th className="border border-black bg-white text-[8px] font-bold p-0.5">PRESENT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Male students FIRST */}
                        {displayStudents.males.map((student, idx) => (
                            <tr key={student.lrn} className="h-[18px]">
                                <td className="border border-black text-center p-0">{idx + 1}</td>
                                <td className="border border-black px-1 uppercase whitespace-nowrap overflow-hidden text-ellipsis text-left font-semibold">
                                    {student.last_name}, {student.first_name}
                                </td>
                                {days.map((d, i) => (
                                    <td key={d} className={`border border-black text-center p-0${getBorderClass(i)} ${canEditCurrentSection ? 'cursor-pointer hover:bg-yellow-50' : ''}`}
                                        onClick={() => canEditCurrentSection && toggleAttendance(student.lrn, d)}>
                                        {getStatusSymbol(currentAttendance[student.lrn]?.[d])}
                                    </td>
                                ))}
                                <td className="border border-black text-center font-bold">{countStats(student.lrn, 'absent')}</td>
                                <td className="border border-black text-center font-bold">{filledDaysCount - countStats(student.lrn, 'absent')}</td>
                                <td className="border border-black"></td>
                            </tr>
                        ))}

                        {/* ← MALE | TOTAL Per Day → (AFTER male students) */}
                        <tr className="bg-white">
                            <td className="border border-black text-center p-0">
                                <ArrowLeft size={10} className="inline text-blue-700" />
                            </td>
                            <td className="border border-black px-1 font-bold text-[10px] text-right">
                                MALE | TOTAL Per Day
                            </td>
                            {days.map((d, i) => (
                                <td key={d} className={`border border-black text-center p-0 text-[8px]${getBorderClass(i)}`}>
                                    {calculateDailyAbsent(d, 'Male') || ''}
                                </td>
                            ))}
                            <td className="border border-black text-center font-bold">{totalMaleAbsent}</td>
                            <td className="border border-black text-center font-bold">{totalMalePresent}</td>
                            <td className="border border-black">
                                <ArrowRight size={10} className="inline text-blue-700 float-right" />
                            </td>
                        </tr>

                        {/* Female students FIRST */}
                        {displayStudents.females.map((student, idx) => (
                            <tr key={student.lrn} className="h-[18px]">
                                <td className="border border-black text-center p-0">{idx + 1}</td>
                                <td className="border border-black px-1 uppercase whitespace-nowrap overflow-hidden text-ellipsis text-left font-semibold">
                                    {student.last_name}, {student.first_name}
                                </td>
                                {days.map((d, i) => (
                                    <td key={d} className={`border border-black text-center p-0${getBorderClass(i)} ${canEditCurrentSection ? 'cursor-pointer hover:bg-yellow-50' : ''}`}
                                        onClick={() => canEditCurrentSection && toggleAttendance(student.lrn, d)}>
                                        {getStatusSymbol(currentAttendance[student.lrn]?.[d])}
                                    </td>
                                ))}
                                <td className="border border-black text-center font-bold">{countStats(student.lrn, 'absent')}</td>
                                <td className="border border-black text-center font-bold">{filledDaysCount - countStats(student.lrn, 'absent')}</td>
                                <td className="border border-black"></td>
                            </tr>
                        ))}

                        {/* ← FEMALE | TOTAL Per Day → (AFTER female students) */}
                        <tr className="bg-white">
                            <td className="border border-black text-center p-0">
                                <ArrowLeft size={10} className="inline text-blue-700" />
                            </td>
                            <td className="border border-black px-1 font-bold text-[10px] text-right">
                                FEMALE | TOTAL Per Day
                            </td>
                            {days.map((d, i) => (
                                <td key={d} className={`border border-black text-center p-0 text-[8px]${getBorderClass(i)}`}>
                                    {calculateDailyAbsent(d, 'Female') || ''}
                                </td>
                            ))}
                            <td className="border border-black text-center font-bold">{totalFemaleAbsent}</td>
                            <td className="border border-black text-center font-bold">{totalFemalePresent}</td>
                            <td className="border border-black">
                                <ArrowRight size={10} className="inline text-blue-700 float-right" />
                            </td>
                        </tr>

                        {/* ← Combined TOTAL PER DAY → (LAST) */}
                        <tr className="bg-white">
                            <td className="border border-black text-center p-0">
                                <ArrowLeft size={10} className="inline text-blue-700" />
                            </td>
                            <td className="border border-black px-1 font-bold text-[10px] text-right">
                                Combined TOTAL PER DAY
                            </td>
                            {days.map((d, i) => (
                                <td key={d} className={`border border-black text-center p-0 text-[8px]${getBorderClass(i)}`}>
                                    {calculateDailyAbsent(d, 'Total') || ''}
                                </td>
                            ))}
                            <td className="border border-black text-center font-bold">{totalMaleAbsent + totalFemaleAbsent}</td>
                            <td className="border border-black text-center font-bold">{totalMalePresent + totalFemalePresent}</td>
                            <td className="border border-black">
                                <ArrowRight size={10} className="inline text-blue-700 float-right" />
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* === FOOTER === */}
                <div className="flex border-l-2 border-r-2 border-b-2 border-black" style={{ fontSize: '9px' }}>

                    {/* Col 1: GUIDELINES */}
                    <div className="w-[38%] p-2 border-r border-black leading-tight">
                        <p className="font-bold mb-1">GUIDELINES:</p>
                        <p className="mb-0.5">1 The attendance shall be accomplished daily. Refer to the codes for checking learners' attendance.</p>
                        <p className="mb-0.5">2 Dates shall be written in the preceding columns beside Learner's Name.</p>
                        <p className="mb-0.5">3 To compute the following:</p>
                        <div className="pl-3 mb-1">
                            <p className="mb-1">a. Percentage of Enrolment =
                                <span className="inline-block mx-1 text-center">
                                    <span className="border-b border-black px-1">Registered Learner as of End of the Month</span>
                                    <br />
                                    <span className="text-[8px]">Enrolment as of 1st Friday of the school year</span>
                                </span>
                                x 100
                            </p>
                            <p className="mb-1">b. Average Daily Attendance =
                                <span className="inline-block mx-1 text-center">
                                    <span className="border-b border-black px-1">Total Daily Attendance</span>
                                    <br />
                                    <span className="text-[8px]">Number of School Days in reporting month</span>
                                </span>
                            </p>
                            <p className="mb-1">c. Percentage of Attendance for the month =
                                <span className="inline-block mx-1 text-center">
                                    <span className="border-b border-black px-1">Average daily attendance</span>
                                    <br />
                                    <span className="text-[8px]">Registered Learner as of End of the month</span>
                                </span>
                                x 100
                            </p>
                        </div>
                        <p className="mb-0.5">4. Every End of the month, the class adviser will submit this form to the office of the principal for recording of summary table into the School Form 4. Once signed by the principal, this form should be returned to the advisor.</p>
                        <p className="mb-0.5">5. The adviser will extend necessary intervention including but not limited to home visitation to learner/s that committed 5 consecutive days of absences or those with potentials of dropping out.</p>
                        <p>6. Attendance performance of learner is expected to reflect in Form 137 and Form 138 every grading period.<br />* Beginning of School Year cut off report is every 1st Friday of School Calendar Days</p>
                    </div>

                    {/* Col 2: CODES */}
                    <div className="w-[28%] border-r border-black flex flex-col">
                        <div className="p-1.5 border-b border-black">
                            <p className="font-bold text-[9px]">1. CODES FOR CHECKING ATTENDANCE</p>
                            <p className="text-[8px] mt-0.5">(blank) Present; (x) Absent; Tardy (half shaded= Upper for Late Comer, Lower for Cutting Classes)</p>
                        </div>
                        <div className="p-1.5 flex-1">
                            <p className="font-bold text-[9px] mb-0.5">2. REASONS/CAUSES OF NLS</p>
                            <div className="text-[8px] leading-[1.4]">
                                <p className="font-bold">a. Domestic-Related Factors</p>
                                <p className="pl-2">a.1. Had to take care of siblings</p>
                                <p className="pl-2">a.2. Early marriage/pregnancy</p>
                                <p className="pl-2">a.3. Parents' attitude toward schooling</p>
                                <p className="pl-2">a.4. Family problems</p>
                                <p className="font-bold mt-0.5">b. Individual-Related Factors</p>
                                <p className="pl-2">b.1. Illness</p>
                                <p className="pl-2">b.2. Overage</p>
                                <p className="pl-2">b.3. Death</p>
                                <p className="pl-2">b.4. Drug Abuse</p>
                                <p className="pl-2">b.5. Poor academic performance</p>
                                <p className="pl-2">b.6. Lack of interest/Distractions</p>
                                <p className="pl-2">b.7. Hunger/Malnutrition</p>
                                <p className="font-bold mt-0.5">c. School-Related Factors</p>
                                <p className="pl-2">c.1. Teacher Factor</p>
                                <p className="pl-2">c.2. Physical condition of classroom</p>
                                <p className="pl-2">c.3. Peer influence</p>
                                <p className="font-bold mt-0.5">d. Geographic/Environmental</p>
                                <p className="pl-2">d.1. Distance between home and school</p>
                                <p className="pl-2">d.2. Armed conflict (incl. Tribal wars &amp; clanfeuds)</p>
                                <p className="pl-2">d.3. Calamities/Disasters</p>
                                <p className="font-bold mt-0.5">e. Financial-Related</p>
                                <p className="pl-2">e.1. Child labor, work</p>
                                <p className="font-bold mt-0.5">f. Others</p>
                            </div>
                        </div>
                    </div>

                    {/* Col 3: Summary + Certification */}
                    <div className="w-[34%] flex flex-col">
                        {/* Summary Header */}
                        <div className="flex border-b border-black">
                            <div className="flex-1 p-1 border-r border-black font-bold text-center">
                                Month:<br /><span className="uppercase text-[11px]">{selectedMonth}</span>
                            </div>
                            <div className="p-1 font-bold text-center leading-tight" style={{ width: '55%' }}>
                                No. of Days of Classes:<br /><span className="text-[11px]">{filledDaysCount}</span>
                            </div>
                        </div>
                        {/* Sub-header: Summary for the Month */}
                        <div className="flex border-b border-black">
                            <div className="flex-1 border-r border-black p-0.5 font-bold text-center">Summary for the Month</div>
                            <div className="w-7 border-r border-black p-0.5 text-center font-bold">M</div>
                            <div className="w-7 border-r border-black p-0.5 text-center font-bold">F</div>
                            <div className="w-12 p-0.5 text-center font-bold">TOTAL</div>
                        </div>
                        {/* Summary rows */}
                        {[
                            { label: 'Enrolment as of (1st Friday of the school year)', m: summaryStats.maleBaseline, f: summaryStats.femaleBaseline },
                            { label: 'Late Enrollment during the month (beyond cut-off)', m: summaryStats.maleLate, f: summaryStats.femaleLate },
                            { label: 'Registered Learner as of end of the month', m: summaryStats.maleRegistered, f: summaryStats.femaleRegistered },
                            { label: 'Percentage of Enrolment as of end of the month', m: (summaryStats.maleRegistered / summaryStats.maleBaseline * 100).toFixed(0), f: (summaryStats.femaleRegistered / summaryStats.femaleBaseline * 100).toFixed(0), isPerc: true },
                            { label: 'Average Daily Attendance', m: summaryStats.maleADA.toFixed(2), f: summaryStats.femaleADA.toFixed(2) },
                            { label: 'Percentage of Attendance for the month', m: summaryStats.malePerc.toFixed(0), f: summaryStats.femalePerc.toFixed(0), isPerc: true },
                            { label: 'Number of students with 5 consecutive days of absences:', m: summaryStats.maleConsecutive, f: summaryStats.femaleConsecutive },
                            { label: 'NLS', m: 0, f: 0 }, // Placeholder for now
                            { label: 'Transferred out', m: 0, f: 0 }, // Placeholder
                            { label: 'Transferred in', m: 0, f: 0 } // Placeholder
                        ].map((row, i) => (
                            <div key={i} className="flex border-b border-black">
                                <div className="flex-1 border-r border-black p-0.5 text-[8px] italic leading-tight">{row.label}</div>
                                <div className="w-7 border-r border-black p-0.5 text-center text-[9px]">{row.m}</div>
                                <div className="w-7 border-r border-black p-0.5 text-center text-[9px]">{row.f}</div>
                                <div className="w-12 p-0.5 text-center text-[9px] font-bold">
                                    {row.isPerc
                                        ? ((Number(row.m) + Number(row.f)) / 2).toFixed(0) // Avg of percentages? Usually it is recalculated from totals.
                                        : (Number(row.m) + Number(row.f)).toFixed(row.label.includes('Average') ? 2 : 0)
                                    }
                                </div>
                            </div>
                        ))}

                        {/* Certification */}
                        <div className="p-2 mt-auto">
                            <p className="italic mb-3 text-[9px]">I certify that this is a true and correct report.</p>
                            <div className="text-center mb-3">
                                <div className="font-bold border-b border-black w-48 mx-auto uppercase">
                                    {(() => {
                                        const sec = sections.find(s => s.section_name === selectedSection);
                                        const fromProfile = (schoolProfile?.adviser_name || '').trim();

                                        if (!sec) return fromProfile || user?.displayName || '';

                                        const fromTeacher = sec.adviser_id
                                            ? teachers.find(t => t.uid === sec.adviser_id)?.displayName
                                            : '';
                                        const fromSection = (fromTeacher || sec.adviser_name || '').trim();

                                        if (fromSection && !isRecoveredAdviserPlaceholder(fromSection) && fromSection.toLowerCase() !== 'tba') {
                                            return fromSection;
                                        }
                                        if (fromProfile) return fromProfile;
                                        return user?.displayName || '';
                                    })()}
                                </div>
                                <div className="text-[8px]">(Signature of Teacher over Printed Name)</div>
                            </div>
                            <div className="text-[9px] mb-1">Attested by:</div>
                            <div className="text-center">
                                <div className="font-bold border-b border-black w-48 mx-auto uppercase">
                                    {schoolProfile?.head_name || 'JUAN A. DELA CRUZ'}
                                </div>
                                <div className="text-[8px]">(Signature of School Head over Printed Name)</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center text-[8px] mt-1 text-gray-500 italic mb-20 print:mb-0">Generated thru LIS</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
