import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../stores';
import { useAuthStore } from '../stores/auth-store';
import { Printer, ArrowLeft, ArrowRight, ChevronDown, Plus, Minus, Search, Layout as AppLogo } from 'lucide-react';
import { canEditAttendanceSection, filterAttendanceSections } from '../lib/rbac';
import type { Section } from '../types';


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

const TOTAL_COLUMNS = 25; // 5 weeks × 5 days (Mon-Fri)
const DAYS = Array.from({ length: TOTAL_COLUMNS }, (_, i) => i + 1);

export function AttendancePage() {

    const SF2_BASE_WIDTH = 1350;

    const { students, sections, activeSF2Sheet, fetchSF2Sheet, saveSF2Sheet, schoolProfile, teachers, setCurrentView, activeSchoolYear } = useAppStore();
    const { user } = useAuthStore();
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('JUNE');
    const [paperSize, setPaperSize] = useState<'letter' | 'a4' | 'folio'>('folio');
    const [zoom, setZoom] = useState(0.8);
    const previewViewportRef = useRef<HTMLDivElement>(null);
    const [previewViewportWidth, setPreviewViewportWidth] = useState(0);

    const months = ['JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL'];

    const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceMonthData>>({});
    const [monthDateLabels, setMonthDateLabels] = useState<Record<string, DateLabels>>({});

    const days = DAYS;
    const totalColumns = TOTAL_COLUMNS;

    // Persistence: Fetch on change
    useEffect(() => {
        if (selectedSection && selectedMonth) {
            fetchSF2Sheet(selectedSection, selectedMonth);
        }
    }, [selectedSection, selectedMonth, fetchSF2Sheet]);

    // Persistence: Sync store to local
    useEffect(() => {
        if (activeSF2Sheet && activeSF2Sheet.month === selectedMonth && activeSF2Sheet.section_id === selectedSection && activeSF2Sheet.school_year === activeSchoolYear) {
            setAttendanceData(prev => ({
                ...prev,
                [selectedMonth]: activeSF2Sheet.attendance || {}
            }));
            setMonthDateLabels(prev => ({
                ...prev,
                [selectedMonth]: activeSF2Sheet.date_labels || {}
            }));
        }
    }, [activeSF2Sheet, selectedMonth, selectedSection, activeSchoolYear]);

    // Persistence: Debounced Save
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingSaveRef = useRef<{ month: string; data: AttendanceMonthData; labels: DateLabels } | null>(null);

    const triggerSave = useCallback((month: string, newData: AttendanceMonthData, newLabels: DateLabels, immediate = false) => {
        // Track the most recent data for unmount flushing
        pendingSaveRef.current = { month, data: newData, labels: newLabels };

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        const doSave = () => {
            if (!selectedSection || !pendingSaveRef.current) return;
            const { month: m, data: d, labels: l } = pendingSaveRef.current;
            saveSF2Sheet({
                id: `${selectedSection}_${activeSchoolYear}_${m}`,
                section_id: selectedSection,
                school_year: activeSchoolYear,
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
    }, [selectedSection, activeSchoolYear, saveSF2Sheet]);

    // Cleanup: Flush pending save on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            if (pendingSaveRef.current && selectedSection) {
                const { month, data, labels } = pendingSaveRef.current;
                saveSF2Sheet({
                    id: `${selectedSection}_${activeSchoolYear}_${month}`,
                    section_id: selectedSection,
                    school_year: activeSchoolYear,
                    month,
                    date_labels: labels,
                    attendance: data,
                    updated_at: new Date().toISOString()
                });
            }
        };
    }, [selectedSection, saveSF2Sheet, activeSchoolYear]);

    const sortedSections = useMemo(() => {
        return [...filterAttendanceSections(user, sections)].sort((a: Section, b: Section) => {
            // Extract numeric grade level (e.g. "Grade 7" -> 7)
            const gradeA = parseInt(a.section_grade_level.replace(/\D/g, '')) || 0;
            const gradeB = parseInt(b.section_grade_level.replace(/\D/g, '')) || 0;

            if (gradeA !== gradeB) return gradeA - gradeB;
            return a.section_name.localeCompare(b.section_name);
        });
    }, [sections, user]);

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
            }
        });
        
        return groups;
    }, [sortedSections]);

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

    const buildAutoFilledDateLabels = useCallback((month: string): DateLabels => {
        const sy = activeSchoolYear;
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
    }, [activeSchoolYear, days, totalColumns]);

    const applyAutoFillDates = useCallback((month: string, immediate = false) => {
        const filled = buildAutoFilledDateLabels(month);

        setMonthDateLabels(prev => ({
            ...prev,
            [month]: filled
        }));

        // Persist only when current user is allowed to edit this section.
        if (selectedSection && canEditCurrentSection) {
            triggerSave(month, attendanceData[month] || {}, filled, immediate);
        }
    }, [buildAutoFilledDateLabels, selectedSection, canEditCurrentSection, triggerSave, attendanceData]);

    // Auto-populate date labels whenever month/section changes and labels are empty.
    useEffect(() => {
        if (!selectedSection || !selectedMonth) return;

        const existingLabels = monthDateLabels[selectedMonth] || {};
        const hasAnyLabel = Object.values(existingLabels).some(v => String(v).trim() !== '');

        if (!hasAnyLabel) {
            applyAutoFillDates(selectedMonth, true);
        }
    }, [selectedSection, selectedMonth, monthDateLabels, canEditCurrentSection, applyAutoFillDates]);



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
        if (i % 5 === 0) cls += ' border-l-[3.5px] border-l-black';
        if (i % 5 === 4) cls += ' border-r-[3.5px] border-r-black';
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
        document.title = `SF2_${schoolProfile.name || 'School'}_${selectedSectionName}_${selectedMonth}_${activeSchoolYear}`;
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
            maleBaseline, femaleBaseline, totalBaseline: maleBaseline + femaleBaseline,
            maleLate, femaleLate, totalLate: maleLate + femaleLate,
            maleRegistered, femaleRegistered, totalRegistered: maleRegistered + femaleRegistered,
            maleADA, femaleADA, totalADA: maleADA + femaleADA,
            malePerc, femalePerc, totalPerc: (maleRegistered + femaleRegistered) > 0 ? ((maleADA + femaleADA) / (maleRegistered + femaleRegistered)) * 100 : 0,
            maleConsecutive, femaleConsecutive, totalConsecutive: maleConsecutive + femaleConsecutive
        };
    }, [displayStudents, selectedMonth, filledDaysCount, totalMalePresent, totalFemalePresent, attendanceData, monthDateLabels, days]);

    const singleSection = sortedSections.length === 1 ? sortedSections[0] : null;

    useEffect(() => {
        const updatePreviewWidth = () => {
            setPreviewViewportWidth(previewViewportRef.current?.clientWidth || 0);
        };

        updatePreviewWidth();
        window.addEventListener('resize', updatePreviewWidth);
        return () => window.removeEventListener('resize', updatePreviewWidth);
    }, []);

    const fitZoom = useMemo(() => {
        if (!previewViewportWidth) return 1;
        const availableWidth = Math.max(previewViewportWidth - 24, 320);
        return Math.min(1, availableWidth / SF2_BASE_WIDTH);
    }, [previewViewportWidth, SF2_BASE_WIDTH]);

    const effectiveZoom = zoom * fitZoom;

    return (
        <div className="flex flex-col h-screen bg-slate-50 relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white">
             {/* Sticky Premium Top Toolbar */}
             <div className="z-20 bg-white/90 backdrop-blur-3xl border-b border-slate-200 shadow-sm relative print:hidden shrink-0 w-full">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30" />
                <div className="h-16 px-3 lg:px-4 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar scroll-smooth">
                    <div className="flex items-center gap-2 min-w-0 shrink-0">
                        <button
                            onClick={() => setCurrentView('school-forms')}
                            className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 hover:border-slate-300 transition-all group shrink-0 active:scale-95 duration-200"
                            title="Back to Hub"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0 select-none">
                            <AppLogo className="w-4 h-4" />
                        </div>
                        <h2 className="text-[11px] lg:text-[13px] font-black text-slate-900 uppercase tracking-tight truncate">
                            SF2 Daily Attendance
                        </h2>
                    </div>

                    <div className="h-6 w-px bg-slate-200 shrink-0" />

                    <div className="flex items-center gap-2 min-w-0 shrink-0">
                        {!singleSection && (
                            <div className="relative group shrink-0">
                                <select
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                    className="appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-8 text-[10px] lg:text-[11px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer w-[110px] lg:w-[130px] duration-200"
                                >
                                    <option value="">Section</option>
                                    {Object.entries(groupedSections).map(([group, groupSections]) => (
                                        groupSections.length > 0 && (
                                            <optgroup key={group} label={group}>
                                                {groupSections.map(s => (
                                                    <option key={s.id} value={s.section_name}>
                                                        {s.section_grade_level} - {s.section_name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        )
                                    ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors" />
                            </div>
                        )}

                        <div className="relative group shrink-0">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-8 text-[10px] lg:text-[11px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer w-[85px] lg:w-[100px] duration-200"
                            >
                                {months.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors" />
                        </div>

                        {canEditCurrentSection && (
                            <button
                                onClick={() => {
                                    if (confirm("Reset current month's date headers to match official DEPED calendar?")) {
                                        applyAutoFillDates(selectedMonth, true);
                                    }
                                }}
                                className="h-9 px-2.5 rounded-xl bg-white border border-blue-100 text-[9px] font-black uppercase tracking-wide text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0 duration-200 active:scale-95"
                                title="Sync headers with official school calendar"
                            >
                                Sync Dates
                            </button>
                        )}
                    </div>

                    <div className="flex-1 min-w-[12px]" />

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Paper Size */}
                        <div className="relative group shrink-0">
                            <select
                                value={paperSize}
                                onChange={(e) => setPaperSize(e.target.value as 'letter' | 'a4' | 'folio')}
                                className="appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-8 text-[10px] lg:text-[11px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer w-[80px] lg:w-[90px] duration-200"
                            >
                                <option value="letter">Letter</option>
                                <option value="a4">A4</option>
                                <option value="folio">Folio</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors" />
                        </div>

                        <div className="h-6 w-px bg-slate-200 shrink-0" />

                        {/* Zoom Control */}
                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0">
                            <button
                                onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))}
                                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm active:scale-90 duration-200"
                                title="Zoom Out"
                            >
                                <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] font-black text-slate-900 w-8 text-center tabular-nums">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button
                                onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm active:scale-90 duration-200"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Print Primary Button */}
                        <button
                            onClick={handlePrint}
                            disabled={!selectedSection}
                            className="h-9 px-3.5 lg:px-4 rounded-xl bg-blue-600 text-white font-black text-[9px] uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/30 hover:scale-[1.01] hover:-translate-y-px active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1.5 group whitespace-nowrap duration-200"
                        >
                            <Printer className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                            Print Official SF2
                        </button>
                    </div>
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
                    <div ref={previewViewportRef} className="w-full min-h-full flex justify-center py-8 px-4 lg:px-6 print:p-0 print:block overflow-x-auto">
                        <div 
                            className="transition-all duration-700 ease-out origin-top print:scale-100"
                            style={{ transform: `scale(${effectiveZoom})` }}
                        >
                            <div className="sf2-print-container bg-white mx-auto print:w-full shadow-[0_20px_50px_rgba(0,0,0,0.08)] print:shadow-none border border-slate-200 print:border-none mb-4 p-4 md:p-5 print:p-2 print:m-0 rounded-sm" style={{ width: `${SF2_BASE_WIDTH}px` }}>

                {/* === HEADER === */}
                <div className="flex items-center mb-2">
                    <div className="w-[75px] shrink-0">
                        <img src={`${import.meta.env.BASE_URL}deped_logo_left.png`} alt="DepEd Logo" className="w-[70px] h-[70px] object-contain" />
                    </div>
                    <div className="flex-1 text-center">
                        <p className="text-[22px] font-black leading-tight text-black" style={{ fontFamily: '"Arial Narrow", Arial, sans-serif', letterSpacing: '-0.015em' }}>School Form 2 (SF2) Daily Attendance Report of Learners</p>
                        <p className="italic text-[12px] text-gray-800 font-semibold">(This replaced Form 1, Form 2 &amp; STS Form 4 - Absenteeism and Dropout Profile)</p>
                    </div>
                    <div className="w-[100px] shrink-0 flex justify-end">
                        <img src={`${import.meta.env.BASE_URL}deped_logo_right.png`} alt="DepEd" className="h-[65px] object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                </div>

                {/* Row 1: School ID | School Year | Report for the Month of */}
                <div className="flex items-center mb-2.5 text-[12px] font-black text-black">
                    <div className="flex items-center gap-2">
                        <span className="mr-1 whitespace-nowrap">School ID</span>
                        <div className="border-2 border-black px-2 h-9 flex items-center justify-center w-[150px] text-center font-black text-[15px] text-black">{schoolProfile?.school_id}</div>
                        <span className="ml-6 mr-1 whitespace-nowrap">School Year</span>
                        <div className="border-2 border-black px-2 h-9 flex items-center justify-center w-[150px] text-center font-black text-[15px] text-black">{activeSchoolYear}</div>
                    </div>
                    <div className="flex items-center gap-2 ml-auto mr-[60px]">
                        <span className="mr-1 whitespace-nowrap">Report for the Month of</span>
                        <div className="border-2 border-black bg-[#BDD7EE] px-2 h-9 flex items-center justify-center w-[220px] text-center font-black text-[15px] text-black uppercase">{selectedMonth}</div>
                    </div>
                </div>

                {/* Row 2: Name of School | Grade Level | Section */}
                <div className="flex items-center mb-3 text-[12px] font-black text-black">
                    <div className="flex-1 flex items-center gap-2">
                        <span className="mr-1 whitespace-nowrap">Name of School</span>
                        <div className="border-2 border-black px-3 h-9 flex items-center justify-center w-[600px] text-center font-black text-[15px] text-black uppercase">{schoolProfile?.name}</div>
                    </div>
                    <div className="flex items-center gap-2 ml-auto mr-[60px]">
                        <span className="mr-1 whitespace-nowrap">Grade Level</span>
                        <div className="border-2 border-black px-2 h-9 flex items-center justify-center w-16 text-center font-black text-[15px] text-black whitespace-nowrap">
                            {(sections.find(s => s.section_name === selectedSection)?.section_grade_level || '').replace(/\D/g, '') || '7'}
                        </div>
                        <span className="ml-6 mr-1 whitespace-nowrap">Section</span>
                        <div className="border-2 border-black px-3 h-9 flex items-center justify-center w-[220px] text-center font-black text-[15px] text-black uppercase">{selectedSection}</div>
                    </div>
                </div>

                {/* === MAIN TABLE === */}
                <table className="w-full border-collapse border-[2.5px] border-black text-[11px] mb-0" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                        <col style={{ width: '22px' }} />
                        <col style={{ width: '210px' }} />
                        {days.map(d => <col key={d} style={{ width: '23px' }} />)}
                        <col style={{ width: '42px' }} />
                        <col style={{ width: '42px' }} />
                        <col style={{ width: '170px' }} />
                    </colgroup>
                    <thead>
                        {/* Row 1: Labels */}
                        <tr>
                            <th rowSpan={4} className="border-2 border-black bg-white p-0 text-center align-middle" style={{ writingMode: 'horizontal-tb' }}></th>
                            <th rowSpan={4} className="border-2 border-black bg-white p-1 text-center align-middle leading-tight">
                                <div className="font-black text-[13px] text-black uppercase tracking-tight">Learner's Name</div>
                                <div className="font-extrabold text-[10px] text-black">(Last Name, First Name, Middle Name)</div>
                            </th>
                            <th colSpan={totalColumns} className="border-2 border-black bg-white text-center text-[11px] font-black text-black py-1">
                                (1st row for date, 2nd row for Day: M,T,W,TH,F)
                            </th>
                            <th colSpan={2} rowSpan={3} className="border-2 border-black bg-white text-center text-[11.5px] font-black text-black p-1 leading-tight align-middle">
                                Total for the<br />Month
                            </th>
                            <th rowSpan={4} className="border-2 border-black bg-white p-1.5 text-[10.5px] leading-tight text-left align-top font-bold text-black">
                                <span className="font-black text-black">REMARK/S</span> (If NLS, state reason, please refer to legend number 2. If TRANSFERRED IN/OUT, write the name of School.)
                            </th>
                        </tr>
                        {/* Row 2: Date numbers (blue background, editable) */}
                        <tr className="bg-[#BDD7EE]">
                            {days.map((d, i) => (
                                <th key={d} className={`border-2 border-black bg-[#BDD7EE] p-0 text-center text-[11.5px] font-black h-6${getBorderClass(i)}`}>
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
                                        className="w-full h-full text-center text-[11.5px] font-black text-black bg-transparent border-none outline-none p-0"
                                    />
                                </th>
                            ))}
                        </tr>
                        {/* Row 3: Day letters M T W TH F (white background) */}
                        <tr>
                            {days.map((d, i) => (
                                <th key={d} className={`border-2 border-black bg-white p-0 text-center text-[11.5px] font-black h-5${getBorderClass(i)}`}>
                                    {dayLetters[i % 5]}
                                </th>
                            ))}
                        </tr>
                        {/* Row 4: ABSENT / PRESENT headers */}
                        <tr>
                            {days.map((d, i) => (
                                <th key={d} className={`border-2 border-black bg-white p-0 h-0${getBorderClass(i)}`}></th>
                            ))}
                            <th className="border-2 border-black bg-white text-[10px] font-black text-black p-0.5">ABSENT</th>
                            <th className="border-2 border-black bg-white text-[10px] font-black text-black p-0.5">PRESENT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Male students FIRST */}
                        {displayStudents.males.map((student, idx) => (
                            <tr key={student.lrn} className="h-[22px]">
                                <td className="border-2 border-black text-center font-black text-[11px] text-black p-0">{idx + 1}</td>
                                <td className="border-2 border-black px-1.5 uppercase whitespace-nowrap overflow-hidden text-ellipsis text-left font-black text-black text-[12px]">
                                    {student.last_name}, {student.first_name}
                                </td>
                                {days.map((d, i) => (
                                    <td key={d} className={`border-2 border-black text-center text-[12px] font-black text-black p-0${getBorderClass(i)} ${canEditCurrentSection ? 'cursor-pointer hover:bg-yellow-50' : ''}`}
                                        onClick={() => canEditCurrentSection && toggleAttendance(student.lrn, d)}>
                                        {getStatusSymbol(currentAttendance[student.lrn]?.[d])}
                                    </td>
                                ))}
                                <td className="border-2 border-black text-center font-black text-black text-[12px] bg-slate-50">{countStats(student.lrn, 'absent')}</td>
                                <td className="border-2 border-black text-center font-black text-black text-[12px] bg-slate-50">{filledDaysCount - countStats(student.lrn, 'absent')}</td>
                                <td className="border-2 border-black"></td>
                            </tr>
                        ))}

                        {/* ← MALE | TOTAL Per Day → (AFTER male students) */}
                        <tr className="bg-white h-[22px]">
                            <td className="border-2 border-black text-center p-0">
                                <ArrowLeft size={10} className="inline text-blue-700" />
                            </td>
                            <td className="border-2 border-black px-1.5 font-black text-[12.5px] text-black text-right uppercase">
                                MALE | TOTAL Per Day
                            </td>
                            {days.map((d, i) => (
                                <td key={d} className={`border-2 border-black text-center p-0 text-[11.5px] font-black text-black${getBorderClass(i)} bg-slate-50`}>
                                    {calculateDailyAbsent(d, 'Male') || ''}
                                </td>
                            ))}
                            <td className="border-2 border-black text-center font-black text-black text-[12.5px] bg-slate-100">{totalMaleAbsent}</td>
                            <td className="border-2 border-black text-center font-black text-black text-[12.5px] bg-slate-100">{totalMalePresent}</td>
                            <td className="border-2 border-black">
                                <ArrowRight size={10} className="inline text-blue-700 float-right" />
                            </td>
                        </tr>

                        {/* Female students FIRST */}
                        {displayStudents.females.map((student, idx) => (
                            <tr key={student.lrn} className="h-[22px]">
                                <td className="border-2 border-black text-center font-black text-[11px] text-black p-0">{idx + 1}</td>
                                <td className="border-2 border-black px-1.5 uppercase whitespace-nowrap overflow-hidden text-ellipsis text-left font-black text-black text-[12px]">
                                    {student.last_name}, {student.first_name}
                                </td>
                                {days.map((d, i) => (
                                    <td key={d} className={`border-2 border-black text-center text-[12px] font-black text-black p-0${getBorderClass(i)} ${canEditCurrentSection ? 'cursor-pointer hover:bg-yellow-50' : ''}`}
                                        onClick={() => canEditCurrentSection && toggleAttendance(student.lrn, d)}>
                                        {getStatusSymbol(currentAttendance[student.lrn]?.[d])}
                                    </td>
                                ))}
                                <td className="border-2 border-black text-center font-black text-black text-[12px] bg-slate-50">{countStats(student.lrn, 'absent')}</td>
                                <td className="border-2 border-black text-center font-black text-black text-[12px] bg-slate-50">{filledDaysCount - countStats(student.lrn, 'absent')}</td>
                                <td className="border-2 border-black"></td>
                            </tr>
                        ))}

                        {/* ← FEMALE | TOTAL Per Day → (AFTER female students) */}
                        <tr className="bg-white h-[22px]">
                            <td className="border-2 border-black text-center p-0">
                                <ArrowLeft size={10} className="inline text-blue-700" />
                            </td>
                            <td className="border-2 border-black px-1.5 font-black text-[12.5px] text-black text-right uppercase">
                                FEMALE | TOTAL Per Day
                            </td>
                            {days.map((d, i) => (
                                <td key={d} className={`border-2 border-black text-center p-0 text-[11.5px] font-black text-black${getBorderClass(i)} bg-slate-50`}>
                                    {calculateDailyAbsent(d, 'Female') || ''}
                                </td>
                            ))}
                            <td className="border-2 border-black text-center font-black text-black text-[12.5px] bg-slate-100">{totalFemaleAbsent}</td>
                            <td className="border-2 border-black text-center font-black text-black text-[12.5px] bg-slate-100">{totalFemalePresent}</td>
                            <td className="border-2 border-black">
                                <ArrowRight size={10} className="inline text-blue-700 float-right" />
                            </td>
                        </tr>

                        {/* ← Combined TOTAL PER DAY → (LAST) */}
                        <tr className="bg-white h-[22px]">
                            <td className="border-2 border-black text-center p-0">
                                <ArrowLeft size={10} className="inline text-blue-700" />
                            </td>
                            <td className="border-2 border-black px-1.5 font-black text-[12.5px] text-black text-right uppercase">
                                Combined TOTAL PER DAY
                            </td>
                            {days.map((d, i) => (
                                <td key={d} className={`border-2 border-black text-center p-0 text-[11.5px] font-black text-black${getBorderClass(i)} bg-slate-50`}>
                                    {calculateDailyAbsent(d, 'Total') || ''}
                                </td>
                            ))}
                            <td className="border-2 border-black text-center font-black text-black text-[13px] bg-slate-200">{totalMaleAbsent + totalFemaleAbsent}</td>
                            <td className="border-2 border-black text-center font-black text-black text-[13px] bg-slate-200">{totalMalePresent + totalFemalePresent}</td>
                            <td className="border-2 border-black">
                                <ArrowRight size={10} className="inline text-blue-700 float-right" />
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* === FOOTER === */}
                <div className="flex border-l-[2.5px] border-r-[2.5px] border-b-[2.5px] border-black" style={{ fontSize: '11px' }}>

                    {/* Col 1: GUIDELINES */}
                    <div className="w-[38%] p-2.5 border-r-2 border-black leading-tight text-black">
                        <p className="font-black text-black text-[12px] mb-1.5">GUIDELINES:</p>
                        <p className="mb-1 font-bold text-black text-[10px]">1 The attendance shall be accomplished daily. Refer to the codes for checking learners' attendance.</p>
                        <p className="mb-1 font-bold text-black text-[10px]">2 Dates shall be written in the preceding columns beside Learner's Name.</p>
                        <p className="mb-1 font-bold text-black text-[10px]">3 To compute the following:</p>
                        <div className="pl-3 mb-1.5">
                            <div className="mb-2.5 font-bold text-black text-[10px] flex items-center flex-wrap leading-none">
                                <span>a. Percentage of Enrolment =&nbsp;</span>
                                <span className="inline-flex flex-col items-center justify-center text-center mx-1.5">
                                    <span className="border-b-2 border-black px-1 font-black text-[10px] pb-0.5">Registered Learner as of End of the Month</span>
                                    <span className="text-[9.5px] font-bold text-black pt-0.5">Enrolment as of 1st Friday of the school year</span>
                                </span>
                                <span>&nbsp;x 100</span>
                            </div>
                            <div className="mb-2.5 font-bold text-black text-[10px] flex items-center flex-wrap leading-none">
                                <span>b. Average Daily Attendance =&nbsp;</span>
                                <span className="inline-flex flex-col items-center justify-center text-center mx-1.5">
                                    <span className="border-b-2 border-black px-1 font-black text-[10px] pb-0.5">Total Daily Attendance</span>
                                    <span className="text-[9.5px] font-bold text-black pt-0.5">Number of School Days in reporting month</span>
                                </span>
                            </div>
                            <div className="mb-2.5 font-bold text-black text-[10px] flex items-center flex-wrap leading-none">
                                <span>c. Percentage of Attendance for the month =&nbsp;</span>
                                <span className="inline-flex flex-col items-center justify-center text-center mx-1.5">
                                    <span className="border-b-2 border-black px-1 font-black text-[10px] pb-0.5">Average daily attendance</span>
                                    <span className="text-[9.5px] font-bold text-black pt-0.5">Registered Learner as of End of the month</span>
                                </span>
                                <span>&nbsp;x 100</span>
                            </div>
                        </div>
                        <p className="mb-1 font-bold text-black text-[10px]">4. Every End of the month, the class adviser will submit this form to the office of the principal for recording of summary table into the School Form 4. Once signed by the principal, this form should be returned to the advisor.</p>
                        <p className="mb-1 font-bold text-black text-[10px]">5. The adviser will extend necessary intervention including but not limited to home visitation to learner/s that committed 5 consecutive days of absences or those with potentials of dropping out.</p>
                        <p className="font-bold text-black text-[10px]">6. Attendance performance of learner is expected to reflect in Form 137 and Form 138 every grading period.<br />* Beginning of School Year cut off report is every 1st Friday of School Calendar Days</p>
                    </div>

                    {/* Col 2: CODES */}
                    <div className="w-[28%] border-r-2 border-black flex flex-col text-black">
                        <div className="p-2 border-b-2 border-black">
                            <p className="font-black text-black text-[11px] uppercase tracking-wide">1. CODES FOR CHECKING ATTENDANCE</p>
                        </div>
                        <div className="p-2.5 flex-1 flex flex-col leading-normal text-black font-bold text-[10px]">
                            <p className="mb-3 leading-normal">
                                blank- Present;&nbsp;&nbsp;(x)- Absent;&nbsp;&nbsp;Tardy (half shaded= Upper for Late Commer, Lower for Cutting Classes)
                            </p>
                            <p className="font-black text-black text-[11.5px] mb-1.5 uppercase tracking-wide">2. REASONS/CAUSES OF NLS</p>
                            <div className="text-[10px] leading-[1.3] font-bold text-black space-y-0.5">
                                <p className="font-black text-[10.5px]">a. Domestic-Related Factors</p>
                                <p className="pl-2">a.1. Had to take care of siblings</p>
                                <p className="pl-2">a.2. Early marriage/pregnancy</p>
                                <p className="pl-2">a.3. Parents' attitude toward schooling</p>
                                <p className="pl-2">a.4. Family problems</p>
                                <p className="font-black text-[10.5px] mt-1">b. Individual-Related Factors</p>
                                <p className="pl-2">b.1. Illness</p>
                                <p className="pl-2">b.2. Overage</p>
                                <p className="pl-2">b.3. Death</p>
                                <p className="pl-2">b.4. Drug Abuse</p>
                                <p className="pl-2">b.5. Poor academic performance</p>
                                <p className="pl-2">b.6. Lack of interest/Distractions</p>
                                <p className="pl-2">b.7. Hunger/Malnutrition</p>
                                <p className="font-black text-[10.5px] mt-1">c. School-Related Factors</p>
                                <p className="pl-2">c.1. Teacher Factor</p>
                                <p className="pl-2">c.2. Physical condition of classroom</p>
                                <p className="pl-2">c.3. Peer influence</p>
                                <p className="font-black text-[10.5px] mt-1">d. Geographic/Environmental</p>
                                <p className="pl-2">d.1. Distance between home and school</p>
                                <p className="pl-2">d.2. Armed conflict (incl. Tribal wars &amp; clanfeuds)</p>
                                <p className="pl-2">d.3. Calamities/Disasters</p>
                                <p className="font-black text-[10.5px] mt-1">e. Financial-Related</p>
                                <p className="pl-2">e.1. Child labor, work</p>
                                <p className="font-black text-[10.5px] mt-1">f. Others</p>
                            </div>
                        </div>
                    </div>

                    {/* Col 3: Summary + Certification */}
                    <div className="w-[34%] flex flex-col text-black">
                        {/* Summary Table */}
                        <table className="w-full border-collapse border-b-2 border-black text-[11px]" style={{ tableLayout: 'fixed' }}>
                            <colgroup>
                                <col style={{ width: '42%' }} />
                                <col style={{ width: '28%' }} />
                                <col style={{ width: '8%' }} />
                                <col style={{ width: '8%' }} />
                                <col style={{ width: '14%' }} />
                            </colgroup>
                            <thead>
                                {/* Row 1 of Header */}
                                <tr className="h-[22px] border-b-2 border-black">
                                    <th className="border-r-2 border-black p-1 text-center font-black text-[11px] text-black">
                                        Month:
                                    </th>
                                    <th className="border-r-2 border-black p-1 text-center font-black text-[11px] text-black">
                                        No. of Days of Classes:
                                    </th>
                                    <th colSpan={3} className="p-1 text-center font-black text-[11px] text-black bg-slate-50">
                                        Summary for the Month
                                    </th>
                                </tr>
                                {/* Row 2 of Header */}
                                <tr className="h-[24px] border-b-2 border-black">
                                    <th className="border-r-2 border-black p-1 text-center font-black text-[13px] text-black uppercase">
                                        {selectedMonth}
                                    </th>
                                    <th className="border-r-2 border-black p-1 text-center font-black text-[13px] text-black">
                                        {filledDaysCount}
                                    </th>
                                    <th className="border-r-2 border-black p-0.5 text-center font-black text-[10.5px] text-black bg-slate-50">
                                        M
                                    </th>
                                    <th className="border-r-2 border-black p-0.5 text-center font-black text-[10.5px] text-black bg-slate-50">
                                        F
                                    </th>
                                    <th className="p-0.5 text-center font-black text-[10.5px] text-black bg-slate-50">
                                        TOTAL
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Summary rows */}
                                {[
                                    { label: 'Enrolment as of (1st Friday of the school year)', m: summaryStats.maleBaseline, f: summaryStats.femaleBaseline, t: summaryStats.totalBaseline, italic: true },
                                    { label: 'Late Enrollment during the month (beyond cut-off)', m: summaryStats.maleLate, f: summaryStats.femaleLate, t: summaryStats.totalLate, italic: true },
                                    { label: 'Registered Learner as of end of the month', m: summaryStats.maleRegistered, f: summaryStats.femaleRegistered, t: summaryStats.totalRegistered },
                                    { label: 'Percentage of Enrolment as of end of the month', m: summaryStats.maleBaseline > 0 ? (summaryStats.maleRegistered / summaryStats.maleBaseline * 100).toFixed(0) : '0', f: summaryStats.femaleBaseline > 0 ? (summaryStats.femaleRegistered / summaryStats.femaleBaseline * 100).toFixed(0) : '0', t: summaryStats.totalBaseline > 0 ? (summaryStats.totalRegistered / summaryStats.totalBaseline * 100).toFixed(0) : '0' },
                                    { label: 'Average Daily Attendance', m: summaryStats.maleADA.toFixed(2), f: summaryStats.femaleADA.toFixed(2), t: summaryStats.totalADA.toFixed(2) },
                                    { label: 'Percentage of Attendance for the month', m: summaryStats.malePerc.toFixed(0), f: summaryStats.femalePerc.toFixed(0), t: summaryStats.totalPerc.toFixed(0) },
                                    { label: 'Number of students with 5 consecutive days of absences:', m: summaryStats.maleConsecutive, f: summaryStats.femaleConsecutive, t: summaryStats.totalConsecutive },
                                    { label: 'NLS', m: 0, f: 0, t: 0 },
                                    { label: 'Transferred out', m: 0, f: 0, t: 0 },
                                    { label: 'Transferred in', m: 0, f: 0, t: 0 }
                                ].map((row, i) => (
                                    <tr key={i} className="h-[22px] border-b-2 border-black">
                                        <td colSpan={2} className={`border-r-2 border-black p-1 text-[10px] font-bold text-black leading-tight text-center ${row.italic ? 'italic' : ''}`}>
                                            {row.label}
                                        </td>
                                        <td className="border-r-2 border-black p-1 text-center text-[11px] font-extrabold text-black">
                                            {row.m}
                                        </td>
                                        <td className="border-r-2 border-black p-1 text-center text-[11px] font-extrabold text-black">
                                            {row.f}
                                        </td>
                                        <td className="p-1 text-center text-[11.5px] font-black text-black bg-slate-50">
                                            {row.t}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Certification */}
                        <div className="p-2.5 mt-auto bg-slate-50/50">
                            <p className="font-bold text-black text-[10.5px] mb-3">I certify that this is a true and correct report.</p>
                            <div className="text-center mb-3">
                                <div className="font-black border-b-2 border-black w-56 mx-auto uppercase text-[12.5px] text-black py-0.5 tracking-wide">
                                    {(() => {
                                        const sec = sections.find(s => s.section_name === selectedSection);
                                        const fromProfile = (schoolProfile?.adviser_name || '').trim();
                                        const isGenericProfile = fromProfile.toLowerCase() === 'admin' || fromProfile === '';

                                        // Source of Truth: If profile has a real name, use it!
                                        if (!isGenericProfile && fromProfile) return fromProfile;

                                        if (!sec) return fromProfile || user?.displayName || '';

                                        const fromTeacher = sec.adviser_id
                                            ? teachers.find(t => t.uid === sec.adviser_id)?.displayName
                                            : '';
                                        const fromSection = (fromTeacher || sec.adviser_name || '').trim();

                                        if (fromSection && !isRecoveredAdviserPlaceholder(fromSection) && fromSection.toLowerCase() !== 'tba') {
                                            return fromSection;
                                        }
                                        return fromProfile || user?.displayName || '';
                                    })()}
                                </div>
                                <div className="text-[10px] font-bold text-slate-800 mt-1">(Signature of Teacher over Printed Name)</div>
                            </div>
                            <div className="text-[10.5px] font-bold text-black mb-1">Attested by:</div>
                            <div className="text-center">
                                <div className="font-black border-b-2 border-black w-56 mx-auto uppercase text-[12.5px] text-black py-0.5 tracking-wide">
                                    {schoolProfile?.head_name}
                                </div>
                                <div className="text-[10px] font-bold text-slate-800 mt-1">(Signature of School Head over Printed Name)</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center text-[9px] mt-1 text-gray-700 font-extrabold italic mb-20 print:mb-0">Generated thru LIS</div>
            </div>
        </div>
    </div>
)}
</div>
<style dangerouslySetInnerHTML={{ __html: `
    .sf2-print-container, .sf2-print-container * {
        font-family: 'Arial Narrow', Arial, sans-serif !important;
    }
    .no-scrollbar::-webkit-scrollbar {
        display: none;
    }
    .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    @media print {
        @page { 
            size: ${paperSize === 'a4' ? '297mm 210mm' : paperSize === 'letter' ? '11in 8.5in' : '13in 8.5in'}; 
            margin: 0.15in !important; 
        }
        html, body {
            width: 100% !important;
            height: auto !important;
            background: #fff !important;
            overflow: visible !important;
        }
        .sf2-print-container {
            zoom: ${paperSize === 'a4' ? '0.80' : paperSize === 'letter' ? '0.74' : '0.88'} !important;
            width: 1350px !important;
            max-width: none !important;
            margin: 0 auto !important;
            border: none !important;
            box-shadow: none !important;
        }
    }
` }} />
</div>
);
}
