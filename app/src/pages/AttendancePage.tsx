import { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback, type Ref } from 'react';
import { useAppStore } from '../stores';
import { useAuthStore } from '../stores/auth-store';
import { Printer, ArrowLeft, ArrowRight, ChevronDown, Plus, Minus, Search, Layout as AppLogo, Download } from 'lucide-react';
import { canEditAttendanceSection, filterAttendanceSections } from '../lib/rbac';
import { formatLearnerName } from '../utils/student-name';
import { db } from '../services/database';

import type { Section, Student, SF2Sheet, CalendarEvent } from '../types';


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

const getHeaderBoxFontSize = (text: string = ''): string => {
    const len = String(text).length;
    if (len > 40) return 'text-[10px]';
    if (len > 30) return 'text-[11px]';
    if (len > 20) return 'text-[12px]';
    return 'text-[13px]';
};

type PaperSize = 'letter' | 'a4' | 'folio';

type BodyRow =
    | { type: 'student'; student: Student; displayIdx: number }
    | { type: 'maleTotal' }
    | { type: 'femaleTotal' }
    | { type: 'combinedTotal' };

// 1mm in CSS px at 96dpi - used to convert the printed page height (defined
// in mm/in via paperDimensions) into the px units the on-screen DOM uses.
const MM_TO_PX = 96 / 25.4;

// Top+bottom page padding (matches the print:py-N from layoutConfig.padding)
// plus a small safety buffer so a page never overflows by a fraction of a row.
const PAGE_PADDING_PX: Record<PaperSize, number> = {
    letter: 40,
    a4: 42,
    folio: 50,
};

interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: string;
    onChange: (val: string) => void;
    debounceMs?: number;
}

function DebouncedInput({
    value: initialValue,
    onChange,
    debounceMs = 300,
    ...props
}: DebouncedInputProps) {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (value !== initialValue) {
                onChange(value);
            }
        }, debounceMs);

        return () => clearTimeout(timeout);
    }, [value, onChange, initialValue, debounceMs]);

    const handleBlur = () => {
        if (value !== initialValue) {
            onChange(value);
        }
    };

    return (
        <input
            {...props}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
        />
    );
}

export function AttendancePage() {

    const { students, sections, saveSF2Sheet, schoolProfile, teachers, setCurrentView, activeSchoolYear, showNotification } = useAppStore();
    const { user } = useAuthStore();
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('JUNE');
    const [paperSize, setPaperSize] = useState<'letter' | 'a4' | 'folio'>('folio');
    const [zoom, setZoom] = useState(0.8);
    const [isDownloading, setIsDownloading] = useState(false);
    const previewViewportRef = useRef<HTMLDivElement>(null);
    const [previewViewportWidth, setPreviewViewportWidth] = useState(0);

    // Pagination: how many body rows fit on one printed page, with vs.
    // without the Guidelines/Summary/Signatures footer block.
    const [pageCapacity, setPageCapacity] = useState<{ withFooter: number; withoutFooter: number } | null>(null);
    const measureHeaderRef = useRef<HTMLDivElement>(null);
    const measureTheadRef = useRef<HTMLTableSectionElement>(null);
    const measureRowRef = useRef<HTMLTableRowElement>(null);
    const measureFooterRef = useRef<HTMLDivElement>(null);

    const months = ['JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL'];

    const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceMonthData>>({});
    const [monthDateLabels, setMonthDateLabels] = useState<Record<string, DateLabels>>({});
    const [remarksData, setRemarksData] = useState<Record<string, Record<string, string>>>({});

    const days = DAYS;
    const totalColumns = TOTAL_COLUMNS;

    const lastLoadedIdRef = useRef<string | null>(null);

    // Persistence: Fetch on change with race-condition protection
    useEffect(() => {
        let active = true;
        if (!selectedSection || !selectedMonth) return;

        const loadSheet = async () => {
            const sheetId = `${selectedSection}_${activeSchoolYear}_${selectedMonth}`;
            try {
                const sheet = await db.getRecord<SF2Sheet>('sf2Sheets', sheetId);
                if (!active) return;

                if (sheet) {
                    setAttendanceData(prev => ({
                        ...prev,
                        [selectedMonth]: sheet.attendance || {}
                    }));
                    setMonthDateLabels(prev => ({
                        ...prev,
                        [selectedMonth]: sheet.date_labels || {}
                    }));
                    setRemarksData(prev => ({
                        ...prev,
                        [selectedMonth]: sheet.remarks || {}
                    }));
                } else {
                    setAttendanceData(prev => ({
                        ...prev,
                        [selectedMonth]: {}
                    }));
                    setMonthDateLabels(prev => ({
                        ...prev,
                        [selectedMonth]: {}
                    }));
                    setRemarksData(prev => ({
                        ...prev,
                        [selectedMonth]: {}
                    }));
                }
                lastLoadedIdRef.current = sheetId;
            } catch (error) {
                console.error('Error loading SF2 sheet:', error);
            }
        };

        lastLoadedIdRef.current = null;
        loadSheet();

        return () => {
            active = false;
        };
    }, [selectedSection, selectedMonth, activeSchoolYear]);

    // Persistence: Debounced Save
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingSaveRef = useRef<{ month: string; data: AttendanceMonthData; labels: DateLabels; remarks: Record<string, string> } | null>(null);

    // Keep track of previous month and section to flush pending saves on switch
    const prevMonthRef = useRef(selectedMonth);
    const prevSectionRef = useRef(selectedSection);

    useEffect(() => {
        if (selectedMonth !== prevMonthRef.current || selectedSection !== prevSectionRef.current) {
            if (pendingSaveRef.current) {
                if (saveTimeoutRef.current) {
                    clearTimeout(saveTimeoutRef.current);
                }
                const { month: m, data: d, labels: l, remarks: r } = pendingSaveRef.current;
                saveSF2Sheet({
                    id: `${prevSectionRef.current}_${activeSchoolYear}_${m}`,
                    section_id: prevSectionRef.current,
                    school_year: activeSchoolYear,
                    month: m,
                    date_labels: l,
                    attendance: d,
                    remarks: r || {},
                    updated_at: new Date().toISOString()
                });
                pendingSaveRef.current = null;
            }
            prevMonthRef.current = selectedMonth;
            prevSectionRef.current = selectedSection;
        }
    }, [selectedMonth, selectedSection, activeSchoolYear, saveSF2Sheet]);

    const triggerSave = useCallback((month: string, newData: AttendanceMonthData, newLabels: DateLabels, newRemarks?: Record<string, string>, immediate = false) => {
        // Track the most recent data for unmount flushing
        pendingSaveRef.current = { month, data: newData, labels: newLabels, remarks: newRemarks || {} };

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        const doSave = () => {
            if (!selectedSection || !pendingSaveRef.current) return;
            const { month: m, data: d, labels: l, remarks: r } = pendingSaveRef.current;
            saveSF2Sheet({
                id: `${selectedSection}_${activeSchoolYear}_${m}`,
                section_id: selectedSection,
                school_year: activeSchoolYear,
                month: m,
                date_labels: l,
                attendance: d,
                remarks: r || {},
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
                const { month, data, labels, remarks } = pendingSaveRef.current;
                saveSF2Sheet({
                    id: `${selectedSection}_${activeSchoolYear}_${month}`,
                    section_id: selectedSection,
                    school_year: activeSchoolYear,
                    month,
                    date_labels: labels,
                    attendance: data,
                    remarks: remarks || {},
                    updated_at: new Date().toISOString()
                });
            }
        };
    }, [selectedSection, saveSF2Sheet, activeSchoolYear]);


    const sortedSections = useMemo(() => {
        return [...filterAttendanceSections(user, sections)]
            .sort((a: Section, b: Section) => {
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

        // Fetch calendar holidays from localStorage
        let holidays: string[] = [];
        try {
            const storedEvents = localStorage.getItem('school_calendar_events');
            if (storedEvents) {
                const parsedEvents = JSON.parse(storedEvents);
                if (Array.isArray(parsedEvents)) {
                    holidays = parsedEvents
                        .filter((e: CalendarEvent) => e.type === 'holiday')
                        .flatMap((e: CalendarEvent) => {
                            const dates: string[] = [];
                            try {
                                const curr = new Date(e.date + 'T00:00:00');
                                const end = e.end_date ? new Date(e.end_date + 'T00:00:00') : new Date(curr);
                                if (!isNaN(curr.getTime()) && !isNaN(end.getTime())) {
                                    while (curr <= end) {
                                        dates.push(curr.toISOString().split('T')[0]);
                                        curr.setDate(curr.getDate() + 1);
                                    }
                                }
                            } catch (dateErr) {
                                console.error('Error parsing date range for event:', e, dateErr);
                            }
                            return dates;
                        });
                }
            }
        } catch (e) {
            console.error('Failed to load/parse calendar events for holiday filter', e);
        }

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
                    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    if (holidays.includes(dateStr)) {
                        return; // Skip holiday
                    }

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
                    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    if (holidays.includes(dateStr)) {
                        continue; // Skip holiday
                    }

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
            triggerSave(month, attendanceData[month] || {}, filled, remarksData[month] || {}, immediate);
        }
    }, [buildAutoFilledDateLabels, selectedSection, canEditCurrentSection, triggerSave, attendanceData, remarksData]);

    // Auto-populate date labels whenever month/section changes and labels are empty.
    useEffect(() => {
        if (!selectedSection || !selectedMonth) return;

        // Wait until the saved sheet has actually been loaded for this
        // section/month before deciding labels are empty - otherwise this can
        // fire before the async fetchSF2Sheet resolves and immediately save
        // over real attendance/remarks data with empty data via triggerSave.
        const sheetId = `${selectedSection}_${activeSchoolYear}_${selectedMonth}`;
        if (lastLoadedIdRef.current !== sheetId) return;

        const existingLabels = monthDateLabels[selectedMonth] || {};
        const hasAnyLabel = Object.values(existingLabels).some(v => String(v).trim() !== '');

        if (!hasAnyLabel) {
            applyAutoFillDates(selectedMonth, true);
        }
    }, [selectedSection, selectedMonth, activeSchoolYear, monthDateLabels, canEditCurrentSection, applyAutoFillDates]);



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

            triggerSave(selectedMonth, newData[selectedMonth], monthDateLabels[selectedMonth] || {}, remarksData[selectedMonth] || {});
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
        if (i % 5 === 4) cls += ' border-r-2 border-r-black';
        return cls;
    };

    // Helper to get current month's data
    const currentAttendance = useMemo(() => attendanceData[selectedMonth] || {}, [attendanceData, selectedMonth]);
    // Use global dates
    const currentDateLabels = useMemo(() => monthDateLabels[selectedMonth] || {}, [monthDateLabels, selectedMonth]);
    // Get current remarks
    const currentRemarks = useMemo(() => remarksData[selectedMonth] || {}, [remarksData, selectedMonth]);

    // Count how many date cells actually have a date filled in
    const filledDaysCount = Object.values(currentDateLabels).filter(v => v.trim() !== '').length;

    // Pre-calculate student attendance counts to avoid O(N * D) rendering operations
    const studentStats = useMemo(() => {
        const stats: Record<string, { absent: number; present: number }> = {};

        sectionStudents.forEach(student => {
            const record = currentAttendance[student.lrn] || {};
            let absentCount = 0;
            
            for (let day = 1; day <= totalColumns; day++) {
                if (record[day] === 'absent') {
                    absentCount++;
                }
            }
            stats[student.lrn] = {
                absent: absentCount,
                present: Math.max(0, filledDaysCount - absentCount)
            };
        });
        return stats;
    }, [currentAttendance, filledDaysCount, sectionStudents, totalColumns]);

    // Pre-calculate daily present count to avoid O(D * N) rendering operations
    const dailyPresentCounts = useMemo(() => {
        const counts: Record<number, { Male: number; Female: number; Total: number }> = {};
        
        for (let day = 1; day <= totalColumns; day++) {
            if (!currentDateLabels[day]?.trim()) {
                counts[day] = { Male: 0, Female: 0, Total: 0 };
                continue;
            }

            let maleCount = 0;
            displayStudents.males.forEach(student => {
                const status = currentAttendance[student.lrn]?.[day];
                if (status !== 'absent') {
                    maleCount++;
                }
            });

            let femaleCount = 0;
            displayStudents.females.forEach(student => {
                const status = currentAttendance[student.lrn]?.[day];
                if (status !== 'absent') {
                    femaleCount++;
                }
            });

            counts[day] = {
                Male: maleCount,
                Female: femaleCount,
                Total: maleCount + femaleCount
            };
        }
        return counts;
    }, [currentAttendance, currentDateLabels, displayStudents, totalColumns]);

    const countStats = (studentId: string, type: string) => {
        if (type === 'absent') {
            return studentStats[studentId]?.absent || 0;
        }
        return studentStats[studentId]?.present || 0;
    };

    const calculateDailyPresent = (day: number, gender: 'Male' | 'Female' | 'Total') => {
        return dailyPresentCounts[day]?.[gender] || 0;
    };

    const handlePrint = () => {
        const selectedSectionName = sections.find(s => s.id === selectedSection || s.section_name === selectedSection)?.section_name || 'Record';
        const originalTitle = document.title;
        document.title = `SF2_${schoolProfile.name || 'School'}_${selectedSectionName}_${selectedMonth}_${activeSchoolYear}`;
        window.print();
        document.title = originalTitle;
    };

    const handleDownloadAttendance = async () => {
        const selectedSectionName = sections.find(s => s.id === selectedSection || s.section_name === selectedSection)?.section_name || 'Record';
        const filename = `SF2_${schoolProfile.name || 'School'}_${selectedSectionName}_${selectedMonth}_${activeSchoolYear}.pdf`;

        // Use html2canvas + jsPDF to capture exactly what's rendered (WYSIWYG)
        const pages = Array.from(document.querySelectorAll('.sf2-print-container[data-sf2-page]')) as HTMLElement[];
        if (pages.length === 0) {
            showNotification('Nothing to download. Please select a section first.', 'error');
            return;
        }

        setIsDownloading(true);
        const parentTransforms: string[] = [];
        const parentsToRestore: HTMLElement[] = [];

        try {
            const html2canvas = (await import('html2canvas-pro')).default;
            const { jsPDF } = await import('jspdf');

            // Temporarily reset zoom scale transforms on the parent wrappers
            pages.forEach(p => {
                const parent = p.parentElement;
                if (parent) {
                    parentTransforms.push(parent.style.transform);
                    parentsToRestore.push(parent);
                    parent.style.transform = 'none';
                }
            });

            // Force a layout reflow
            if (parentsToRestore.length > 0) {
                void parentsToRestore[0].offsetHeight;
            }

            // Derive PDF dimensions dynamically from the selected paperSize
            const paperWidthMm = paperSize === 'letter' ? 279.4 : paperSize === 'a4' ? 297 : 330.2;
            const paperHeightMm = paperSize === 'letter' ? 215.9 : paperSize === 'a4' ? 210 : 215.9;
            const pdfFormat = [paperWidthMm, paperHeightMm];

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: pdfFormat
            });

            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const margin = 4;
            const usableW = pageW - margin * 2;
            const usableH = pageH - margin * 2;
            const pdfRatio = usableW / usableH;

            for (let i = 0; i < pages.length; i++) {
                if (i > 0) {
                    pdf.addPage(pdfFormat, 'landscape');
                }
                const pageEl = pages[i];

                const canvas = await html2canvas(pageEl, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    onclone: (clonedDoc, clonedPageEl) => {
                        const style = clonedDoc.createElement('style');
                        style.innerHTML = `
                            ::-webkit-scrollbar {
                                display: none !important;
                            }
                            * {
                                scrollbar-width: none !important;
                                -ms-overflow-style: none !important;
                            }
                        `;
                        clonedDoc.head.appendChild(style);

                        // Swap input fields with text content spans
                        const origInputs = pageEl.querySelectorAll('input');
                        const clonedInputs = clonedPageEl.querySelectorAll('input');
                        origInputs.forEach((origInput, idx) => {
                            const clonedInput = clonedInputs[idx];
                            if (clonedInput) {
                                const val = (origInput as HTMLInputElement).value || '';
                                const span = clonedDoc.createElement('span');
                                span.textContent = val;
                                span.className = clonedInput.className;
                                span.style.cssText = clonedInput.style.cssText;
                                span.style.display = 'flex';
                                span.style.alignItems = 'center';
                                if (clonedInput.classList.contains('text-left')) {
                                    span.style.justifyContent = 'flex-start';
                                    span.style.paddingLeft = '4px';
                                } else {
                                    span.style.justifyContent = 'center';
                                }
                                span.style.width = '100%';
                                span.style.height = '100%';
                                if (clonedInput.parentNode) {
                                    clonedInput.parentNode.replaceChild(span, clonedInput);
                                }
                            }
                        });

                        // Remove select tags inside print container (if any exist)
                        const clonedSelects = clonedPageEl.querySelectorAll('select');
                        clonedSelects.forEach(select => {
                            select.remove();
                        });
                    }
                });

                const imgData = canvas.toDataURL('image/png');
                const canvasRatio = canvas.width / canvas.height;

                let imgW = usableW;
                let imgH = usableH;
                let xOffset = margin;
                let yOffset = margin;

                if (canvasRatio > pdfRatio) {
                    imgW = usableW;
                    imgH = usableW / canvasRatio;
                    yOffset = margin + (usableH - imgH) / 2;
                } else {
                    imgH = usableH;
                    imgW = usableH * canvasRatio;
                    xOffset = margin + (usableW - imgW) / 2;
                }

                pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgW, imgH);
            }

            pdf.save(filename);
            showNotification('Daily Attendance downloaded successfully!', 'success');
        } catch (err) {
            console.error('Download failed:', err);
            showNotification('Failed to download Daily Attendance. Please try again.', 'error');
        } finally {
            // Restore original parent transforms
            parentsToRestore.forEach((parent, idx) => {
                parent.style.transform = parentTransforms[idx] || '';
            });
            setIsDownloading(false);
        }
    };


    const totalMaleAbsent = displayStudents.males.reduce((sum, s) => sum + (studentStats[s.lrn]?.absent || 0), 0);
    const totalFemaleAbsent = displayStudents.females.reduce((sum, s) => sum + (studentStats[s.lrn]?.absent || 0), 0);
    const totalMalePresent = displayStudents.males.reduce((sum, s) => sum + (studentStats[s.lrn]?.present || 0), 0);
    const totalFemalePresent = displayStudents.females.reduce((sum, s) => sum + (studentStats[s.lrn]?.present || 0), 0);

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

    const paperDimensions = useMemo(() => ({
        a4: { width: '297mm', height: '210mm', pixelWidth: 1122.5 },
        letter: { width: '279.4mm', height: '215.9mm', pixelWidth: 1056 },
        folio: { width: '330.2mm', height: '215.9mm', pixelWidth: 1248 }
    }), []);

    const layoutConfig = useMemo(() => {
        const configs = {
            letter: {
                padding: 'px-8 py-5 print:px-8 print:py-4',
                headerText: 'text-[18px]',
                subHeaderText: 'text-[10px]',
                labelSize: 'text-[11px]',
                inputValSize: 'text-[13px]',
                schoolIdWidth: 'w-32',
                schoolYearWidth: 'w-32',
                monthWidth: 'w-40',
                schoolNameWidth: 'w-[420px]',
                gradeWidth: 'w-32',
                sectionWidth: 'w-40',
                headerMarginRight: 'mr-2',
                colNameWidth: '165px',
                colDayWidth: '20px',
                colAbsentWidth: '38px',
                colPresentWidth: '38px',
                colRemarksWidth: '80px',
                tableTextSize: 'text-[10px]',
                studentNameSize: 'text-[9.5px]',
                absentPresentHeaderSize: 'text-[7px] tracking-tighter',
                guidelinesTextSize: 'text-[8.5px]',
                summaryTableWidths: { col1: '40%', col2: '28%', col3: '10%', col4: '10%', col5: '12%' },
                summaryTextSize: 'text-[9.5px]',
                certTextSize: 'text-[9.5px]',
                adviserWidth: 'w-56',
                bottomMargin: 'mb-12'
            },
            a4: {
                padding: 'px-10 py-5 print:px-10 print:py-4',
                headerText: 'text-[20px]',
                subHeaderText: 'text-[11px]',
                labelSize: 'text-[11.5px]',
                inputValSize: 'text-[14px]',
                schoolIdWidth: 'w-36',
                schoolYearWidth: 'w-36',
                monthWidth: 'w-44',
                schoolNameWidth: 'w-[480px]',
                gradeWidth: 'w-36',
                sectionWidth: 'w-44',
                headerMarginRight: 'mr-6',
                colNameWidth: '195px',
                colDayWidth: '21px',
                colAbsentWidth: '40px',
                colPresentWidth: '40px',
                colRemarksWidth: '90px',
                tableTextSize: 'text-[10.5px]',
                studentNameSize: 'text-[10px]',
                absentPresentHeaderSize: 'text-[7.5px] tracking-tighter',
                guidelinesTextSize: 'text-[9px]',
                summaryTableWidths: { col1: '41%', col2: '28%', col3: '9%', col4: '9%', col5: '13%' },
                summaryTextSize: 'text-[10px]',
                certTextSize: 'text-[10px]',
                adviserWidth: 'w-64',
                bottomMargin: 'mb-16'
            },
            folio: {
                padding: 'px-12 py-6 print:px-12 print:py-5',
                headerText: 'text-[22px]',
                subHeaderText: 'text-[12px]',
                labelSize: 'text-[12px]',
                inputValSize: 'text-[15px]',
                schoolIdWidth: 'w-40',
                schoolYearWidth: 'w-40',
                monthWidth: 'w-48',
                schoolNameWidth: 'w-[560px]',
                gradeWidth: 'w-40',
                sectionWidth: 'w-48',
                headerMarginRight: 'mr-15',
                colNameWidth: '225px',
                colDayWidth: '25px',
                colAbsentWidth: '42px',
                colPresentWidth: '42px',
                colRemarksWidth: '95px',
                tableTextSize: 'text-[11px]',
                studentNameSize: 'text-[10.5px]',
                absentPresentHeaderSize: 'text-[8.5px] tracking-tighter',
                guidelinesTextSize: 'text-[10px]',
                summaryTableWidths: { col1: '42%', col2: '28%', col3: '8%', col4: '8%', col5: '14%' },
                summaryTextSize: 'text-[11px]',
                certTextSize: 'text-[10.5px]',
                adviserWidth: 'w-70',
                bottomMargin: 'mb-20'
            }
        };
        return configs[paperSize] || configs.folio;
    }, [paperSize]);

    const fitZoom = useMemo(() => {
        if (!previewViewportWidth) return 1;
        const availableWidth = Math.max(previewViewportWidth - 24, 320);
        const currentPaperWidth = paperDimensions[paperSize]?.pixelWidth || 1248;
        return Math.min(1, availableWidth / currentPaperWidth);
    }, [previewViewportWidth, paperSize, paperDimensions]);

    const effectiveZoom = zoom * fitZoom;

    const adviserName = useMemo(() => {
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
    }, [sections, selectedSection, schoolProfile, user, teachers]);

    // ============================================================
    // Pagination: split the attendance table body into page-sized
    // chunks so the on-screen preview (and PDF/print output) render
    // as separate page-sheets, matching the selected paper size.
    // ============================================================

    const bodyRows = useMemo<BodyRow[]>(() => {
        const rows: BodyRow[] = [];
        displayStudents.males.forEach((student, idx) => {
            rows.push({ type: 'student', student, displayIdx: idx + 1 });
        });
        rows.push({ type: 'maleTotal' });
        displayStudents.females.forEach((student, idx) => {
            rows.push({ type: 'student', student, displayIdx: idx + 1 });
        });
        rows.push({ type: 'femaleTotal' });
        rows.push({ type: 'combinedTotal' });
        return rows;
    }, [displayStudents]);

    const renderHeaderBlock = () => {
        const gradeLevelText = sections.find(s => s.section_name === selectedSection)?.section_grade_level || 'Grade 7';
        return (
            <>
                <div className="flex items-center mb-2">
                    <div className="w-18.75 shrink-0">
                        <img src={`${import.meta.env.BASE_URL}deped_logo_left.png`} alt="DepEd Logo" className="w-17.5 h-17.5 object-contain" />
                    </div>
                    <div className="flex-1 text-center">
                        <p className={`font-black leading-tight text-black uppercase ${layoutConfig.headerText}`} style={{ fontFamily: '"Arial Narrow", Arial, sans-serif', letterSpacing: '-0.015em' }}>School Form 2 (SF2) Daily Attendance Report of Learners</p>
                        <p className={`italic text-gray-800 font-semibold ${layoutConfig.subHeaderText}`}>(This replaced Form 1, Form 2 &amp; STS Form 4 - Absenteeism and Dropout Profile)</p>
                    </div>
                    <div className="w-25 shrink-0 flex justify-end">
                        <img src={`${import.meta.env.BASE_URL}deped_logo_right.png`} alt="DepEd" className="h-16.25 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                </div>

                {/* Row 1: School ID | School Year | Report for the Month of */}
                <div className={`flex items-center mb-2.5 font-black text-black ${layoutConfig.labelSize}`}>
                    <div className="flex items-center gap-2">
                        <span className="mr-1 whitespace-nowrap">School ID</span>
                        <div className={`border border-black px-3 h-9 flex items-center justify-center text-center font-black text-black ${layoutConfig.schoolIdWidth} ${getHeaderBoxFontSize(schoolProfile?.school_id)}`}>{schoolProfile?.school_id}</div>
                        <span className="ml-6 mr-1 whitespace-nowrap">School Year</span>
                        <div className={`border border-black px-3 h-9 flex items-center justify-center text-center font-black text-black ${layoutConfig.schoolYearWidth} ${getHeaderBoxFontSize(activeSchoolYear)}`}>{activeSchoolYear}</div>
                    </div>
                    <div className={`flex items-center gap-2 ml-auto ${layoutConfig.headerMarginRight}`}>
                        <span className="mr-1 whitespace-nowrap">Report for the Month of</span>
                        <div className={`border border-black bg-slate-50 px-3 h-9 flex items-center justify-center text-center font-black text-black uppercase ${layoutConfig.monthWidth} ${getHeaderBoxFontSize(selectedMonth)}`}>{selectedMonth}</div>
                    </div>
                </div>

                {/* Row 2: Name of School | Grade Level | Section */}
                <div className={`flex items-center mb-3 font-black text-black ${layoutConfig.labelSize}`}>
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className="mr-1 whitespace-nowrap">Name of School</span>
                        <div className={`flex-1 min-w-0 border border-black px-3 h-9 flex items-center justify-center text-center font-black text-black uppercase ${getHeaderBoxFontSize(schoolProfile?.name)}`}>{schoolProfile?.name}</div>
                    </div>
                    <div className={`flex items-center gap-2 shrink-0 ml-4 ${layoutConfig.headerMarginRight}`}>
                        <span className="mr-1 whitespace-nowrap">Grade Level</span>
                        <div className={`border border-black px-3 h-9 flex items-center justify-center text-center font-black text-black whitespace-nowrap uppercase ${layoutConfig.gradeWidth} ${getHeaderBoxFontSize(gradeLevelText)}`}>
                            {gradeLevelText}
                        </div>
                        <span className="ml-6 mr-1 whitespace-nowrap">Section</span>
                        <div className={`border border-black px-3 h-9 flex items-center justify-center text-center font-black text-black uppercase ${layoutConfig.sectionWidth} ${getHeaderBoxFontSize(selectedSection)}`}>{selectedSection}</div>
                    </div>
                </div>
            </>
        );
    };

    const renderColgroup = () => (
        <colgroup>
            <col style={{ width: '22px' }} />
            <col style={{ width: layoutConfig.colNameWidth }} />
            {days.map(d => <col key={d} style={{ width: layoutConfig.colDayWidth }} />)}
            <col style={{ width: layoutConfig.colAbsentWidth }} />
            <col style={{ width: layoutConfig.colPresentWidth }} />
            <col style={{ width: layoutConfig.colRemarksWidth }} />
        </colgroup>
    );

    const renderTableHeadRows = (ref?: Ref<HTMLTableSectionElement>) => (
        <thead ref={ref} className="bg-slate-50">
            {/* Row 1: Labels */}
            <tr className="bg-slate-50">
                <th rowSpan={4} className="border border-black bg-slate-50 p-0 text-center align-middle" style={{ writingMode: 'horizontal-tb' }}></th>
                <th rowSpan={4} className="border border-black border-r-2 border-r-black bg-slate-50 px-2 py-2 text-center align-middle leading-snug">
                    <div className={`font-black text-black uppercase tracking-tight ${layoutConfig.studentNameSize}`}>Learner's Name</div>
                    <div className={`font-bold text-black text-[8px]`}>(Last Name, First Name, Middle Name)</div>
                </th>
                <th colSpan={totalColumns} className={`border border-black bg-slate-50 text-center font-black text-black py-2 text-[9px]`}>
                    (1st row for date, 2nd row for Day: M,T,W,TH,F)
                </th>
                <th colSpan={2} rowSpan={3} className={`border border-black border-r-2 border-r-black bg-slate-50 px-1 py-2 text-center font-black text-black leading-tight align-middle text-[9px]`}>
                    Total for the<br />Month
                </th>
                <th rowSpan={4} className={`border border-black bg-slate-50 px-2 py-2 leading-tight text-center align-middle font-bold text-black text-[8px]`}>
                    <span className="font-black text-black block mb-0.5">REMARK/S</span>
                    <span className="text-[7px] font-bold">(If NLS, state reason, please refer to legend number 2. If TRANSFERRED IN/OUT, write the name of School.)</span>
                </th>
            </tr>
            {/* Row 2: Date numbers (editable) */}
            <tr className="bg-slate-50">
                {days.map((d, i) => (
                    <th key={d} className={`border border-black bg-slate-50 p-1 text-center font-black h-7${getBorderClass(i)} ${layoutConfig.tableTextSize}`}>
                        <DebouncedInput
                            type="text"
                            maxLength={2}
                            value={currentDateLabels[d] || ''}
                            readOnly={!canEditCurrentSection}
                            onChange={(val) => {
                                if (!canEditCurrentSection) return;
                                setMonthDateLabels(prev => {
                                    const newLabels = {
                                        ...prev,
                                        [selectedMonth]: { ...(prev[selectedMonth] || {}), [d]: val }
                                    };
                                    triggerSave(selectedMonth, attendanceData[selectedMonth] || {}, newLabels[selectedMonth], remarksData[selectedMonth] || {});
                                    return newLabels;
                                });
                            }}
                            className={`w-full h-full text-center font-black text-black bg-transparent border-none outline-none p-0 ${layoutConfig.tableTextSize}`}
                        />
                    </th>
                ))}
            </tr>
            {/* Row 3: Day letters M T W TH F */}
            <tr className="bg-slate-50">
                {days.map((d, i) => (
                    <th key={d} className={`border border-black bg-slate-50 p-1 text-center font-black h-6${getBorderClass(i)} ${layoutConfig.tableTextSize}`}>
                        {dayLetters[i % 5]}
                    </th>
                ))}
            </tr>
            {/* Row 4: ABSENT / PRESENT headers */}
            <tr className="bg-slate-50">
                {days.map((d, i) => (
                    <th key={d} className={`border border-black bg-slate-50 p-0 h-4${getBorderClass(i)}`}></th>
                ))}
                <th className={`border border-black bg-slate-50 font-black text-black px-0 py-0.5 ${layoutConfig.absentPresentHeaderSize}`}>ABSENT</th>
                <th className={`border border-black border-r-2 border-r-black bg-slate-50 font-black text-black px-0 py-0.5 ${layoutConfig.absentPresentHeaderSize}`}>PRESENT</th>
            </tr>
        </thead>
    );

    const getStudentNameStyle = (name: string) => {
        const style: React.CSSProperties = {};
        if (name.length > 35) {
            style.fontSize = '80%';
        } else if (name.length > 25) {
            style.fontSize = '90%';
        }
        return style;
    };

    const renderStudentRow = (student: Student, displayIdx: number, key: string | number, ref?: Ref<HTMLTableRowElement>) => (
        <tr key={key} ref={ref} className="h-5.5 bg-white">
            <td className={`border border-black text-center font-black text-black p-0 ${layoutConfig.tableTextSize}`}>{displayIdx}</td>
            <td 
                className={`border border-black border-r-2 border-r-black px-1.5 uppercase whitespace-nowrap overflow-hidden text-ellipsis text-left font-black text-black sf2-student-name-cell ${layoutConfig.studentNameSize}`}
                style={getStudentNameStyle(formatLearnerName(student))}
            >
                {formatLearnerName(student)}
            </td>
            {days.map((d, i) => (
                <td key={d} className={`border border-black text-center font-black text-black p-0${getBorderClass(i)} ${canEditCurrentSection ? 'cursor-pointer hover:bg-yellow-50' : ''} ${layoutConfig.studentNameSize}`}
                    onClick={() => canEditCurrentSection && toggleAttendance(student.lrn, d)}>
                    {getStatusSymbol(currentAttendance[student.lrn]?.[d])}
                </td>
            ))}
            <td className={`border border-black text-center font-black text-black bg-slate-50/50 ${layoutConfig.studentNameSize}`}>{countStats(student.lrn, 'absent')}</td>
            <td className={`border border-black border-r-2 border-r-black text-center font-black text-black bg-slate-50/50 ${layoutConfig.studentNameSize}`}>{filledDaysCount - countStats(student.lrn, 'absent')}</td>
            <td className={`border border-black px-1 text-left align-middle ${layoutConfig.tableTextSize}`}>
                <DebouncedInput
                    type="text"
                    value={currentRemarks[student.lrn] || ''}
                    readOnly={!canEditCurrentSection}
                    onChange={(val) => {
                        if (!canEditCurrentSection) return;
                        setRemarksData(prev => {
                            const newRemarks = {
                                ...prev,
                                [selectedMonth]: { ...(prev[selectedMonth] || {}), [student.lrn]: val }
                            };
                            triggerSave(selectedMonth, attendanceData[selectedMonth] || {}, monthDateLabels[selectedMonth] || {}, newRemarks[selectedMonth]);
                            return newRemarks;
                        });
                    }}
                    className={`w-full h-full text-left font-normal text-black bg-transparent border-none outline-none p-0 ${canEditCurrentSection ? '' : 'cursor-default'} ${layoutConfig.tableTextSize}`}
                />
            </td>
        </tr>
    );

    const renderMaleTotalRow = (key: string | number, ref?: Ref<HTMLTableRowElement>) => (
        <tr key={key} ref={ref} className="bg-slate-50 h-5.5">
            <td className="border border-black border-t-2 border-t-black text-center p-0">
                <ArrowLeft size={10} className="inline text-blue-700" />
            </td>
            <td className={`border border-black border-t-2 border-t-black border-r-2 border-r-black px-1.5 font-black text-black text-right uppercase ${layoutConfig.studentNameSize}`}>
                MALE | TOTAL Per Day
            </td>
            {days.map((d, i) => (
                <td key={d} className={`border border-black border-t-2 border-t-black text-center p-0 font-black text-black${getBorderClass(i)} bg-slate-50/80 ${layoutConfig.tableTextSize}`}>
                    {calculateDailyPresent(d, 'Male') || ''}
                </td>
            ))}
            <td className={`border border-black border-t-2 border-t-black text-center font-black text-black bg-slate-100 ${layoutConfig.studentNameSize}`}>{totalMaleAbsent}</td>
            <td className={`border border-black border-t-2 border-t-black border-r-2 border-r-black text-center font-black text-black bg-slate-100 ${layoutConfig.studentNameSize}`}>{totalMalePresent}</td>
            <td className="border border-black border-t-2 border-t-black">
                <ArrowRight size={10} className="inline text-blue-700 float-right" />
            </td>
        </tr>
    );

    const renderFemaleTotalRow = (key: string | number, ref?: Ref<HTMLTableRowElement>) => (
        <tr key={key} ref={ref} className="bg-slate-50 h-5.5">
            <td className="border border-black border-t-2 border-t-black text-center p-0">
                <ArrowLeft size={10} className="inline text-blue-700" />
            </td>
            <td className={`border border-black border-t-2 border-t-black border-r-2 border-r-black px-1.5 font-black text-black text-right uppercase ${layoutConfig.studentNameSize}`}>
                FEMALE | TOTAL Per Day
            </td>
            {days.map((d, i) => (
                <td key={d} className={`border border-black border-t-2 border-t-black text-center p-0 font-black text-black${getBorderClass(i)} bg-slate-50/80 ${layoutConfig.tableTextSize}`}>
                    {calculateDailyPresent(d, 'Female') || ''}
                </td>
            ))}
            <td className={`border border-black border-t-2 border-t-black text-center font-black text-black bg-slate-100 ${layoutConfig.studentNameSize}`}>{totalFemaleAbsent}</td>
            <td className={`border border-black border-t-2 border-t-black border-r-2 border-r-black text-center font-black text-black bg-slate-100 ${layoutConfig.studentNameSize}`}>{totalFemalePresent}</td>
            <td className="border border-black border-t-2 border-t-black">
                <ArrowRight size={10} className="inline text-blue-700 float-right" />
            </td>
        </tr>
    );

    const renderCombinedTotalRow = (key: string | number, ref?: Ref<HTMLTableRowElement>) => (
        <tr key={key} ref={ref} className="bg-slate-100/80 h-5.5">
            <td className="border border-black border-t-2 border-t-black text-center p-0">
                <ArrowLeft size={10} className="inline text-blue-700" />
            </td>
            <td className={`border border-black border-t-2 border-t-black border-r-2 border-r-black px-1.5 font-black text-black text-right uppercase ${layoutConfig.studentNameSize}`}>
                Combined TOTAL PER DAY
            </td>
            {days.map((d, i) => (
                <td key={d} className={`border border-black border-t-2 border-t-black text-center p-0 font-black text-black${getBorderClass(i)} bg-slate-200/40 ${layoutConfig.tableTextSize}`}>
                    {calculateDailyPresent(d, 'Total') || ''}
                </td>
            ))}
            <td className={`border border-black border-t-2 border-t-black text-center font-black text-black bg-slate-200 ${layoutConfig.studentNameSize}`}>{totalMaleAbsent + totalFemaleAbsent}</td>
            <td className={`border border-black border-t-2 border-t-black border-r-2 border-r-black text-center font-black text-black bg-slate-200 ${layoutConfig.studentNameSize}`}>{totalMalePresent + totalFemalePresent}</td>
            <td className="border border-black border-t-2 border-t-black">
                <ArrowRight size={10} className="inline text-blue-700 float-right" />
            </td>
        </tr>
    );

    const renderBodyRow = (row: BodyRow, key: string | number, ref?: Ref<HTMLTableRowElement>) => {
        if (row.type === 'student') return renderStudentRow(row.student, row.displayIdx, key, ref);
        if (row.type === 'maleTotal') return renderMaleTotalRow(key, ref);
        if (row.type === 'femaleTotal') return renderFemaleTotalRow(key, ref);
        return renderCombinedTotalRow(key, ref);
    };

    const renderFooterBlock = (hasTable = true) => (
        <>
                {/* === FOOTER === */}
                <div className={`flex border-l-2 border-r-2 border-b-2 border-black ${hasTable ? '' : 'border-t-2'}`} style={{ fontSize: layoutConfig.guidelinesTextSize }}>

                    {/* Col 1: GUIDELINES */}
                    <div className="w-[35%] p-2.5 border-r-2 border-black leading-tight text-black">
                        <p className={`font-black text-black mb-1.5 ${layoutConfig.studentNameSize}`}>GUIDELINES:</p>
                        <p className={`mb-1 font-bold text-black ${layoutConfig.guidelinesTextSize}`}>1 The attendance shall be accomplished daily. Refer to the codes for checking learners' attendance.</p>
                        <p className={`mb-1 font-bold text-black ${layoutConfig.guidelinesTextSize}`}>2 Dates shall be written in the preceding columns beside Learner's Name.</p>
                        <p className={`mb-1 font-bold text-black ${layoutConfig.guidelinesTextSize}`}>3. Every End of the month, the class adviser will submit this form to the office of the principal for recording of summary table into the School Form 4. Once signed by the principal, this form should be returned to the advisor.</p>
                        <p className={`mb-1 font-bold text-black ${layoutConfig.guidelinesTextSize}`}>4. The adviser will extend necessary intervention including but not limited to home visitation to learner/s that committed 5 consecutive days of absences or those with potentials of dropping out.</p>
                        <p className={`font-bold text-black ${layoutConfig.guidelinesTextSize}`}>5. Attendance performance of learner is expected to reflect in Form 137 and Form 138 every grading period.<br />* Beginning of School Year cut off report is every 1st Friday of School Calendar Days</p>
                    </div>

                    {/* Col 2: CODES & FORMULAS */}
                    <div className="w-[35%] border-r-2 border-black flex flex-col text-black">
                        {/* 3. TO COMPUTE THE FOLLOWING */}
                        <div className="p-2 border-b-2 border-black bg-slate-50">
                            <p className={`font-black text-black uppercase tracking-wide ${layoutConfig.tableTextSize}`}>3. TO COMPUTE THE FOLLOWING</p>
                        </div>
                        <div className="p-2.5 leading-tight text-black border-b-2 border-black">
                            <div className={`mb-2 font-bold text-black flex items-center flex-wrap leading-none ${layoutConfig.guidelinesTextSize}`}>
                                <span>a. Percentage of Enrolment =&nbsp;</span>
                                <span className="inline-flex flex-col items-center justify-center text-center mx-1.5">
                                    <span className={`border-b border-black px-1 font-black pb-0.5 ${layoutConfig.guidelinesTextSize}`}>Registered Learner as of End of the Month</span>
                                    <span className={`font-bold text-black pt-0.5 ${layoutConfig.guidelinesTextSize}`}>Enrolment as of 1st Friday of the school year</span>
                                </span>
                                <span>&nbsp;x 100</span>
                            </div>
                            <div className={`mb-2 font-bold text-black flex items-center flex-wrap leading-none ${layoutConfig.guidelinesTextSize}`}>
                                <span>b. Average Daily Attendance =&nbsp;</span>
                                <span className="inline-flex flex-col items-center justify-center text-center mx-1.5">
                                    <span className={`border-b border-black px-1 font-black pb-0.5 ${layoutConfig.guidelinesTextSize}`}>Total Daily Attendance</span>
                                    <span className={`font-bold text-black pt-0.5 ${layoutConfig.guidelinesTextSize}`}>Number of School Days in reporting month</span>
                                </span>
                            </div>
                            <div className={`font-bold text-black flex items-center flex-wrap leading-none ${layoutConfig.guidelinesTextSize}`}>
                                <span>c. Percentage of Attendance for the month =&nbsp;</span>
                                <span className="inline-flex flex-col items-center justify-center text-center mx-1.5">
                                    <span className={`border-b border-black px-1 font-black pb-0.5 ${layoutConfig.guidelinesTextSize}`}>Average daily attendance</span>
                                    <span className={`font-bold text-black pt-0.5 ${layoutConfig.guidelinesTextSize}`}>Registered Learner as of End of the month</span>
                                </span>
                                <span>&nbsp;x 100</span>
                            </div>
                        </div>

                        {/* 1. CODES FOR CHECKING ATTENDANCE */}
                        <div className="p-2 border-b-2 border-black bg-slate-50">
                            <p className={`font-black text-black uppercase tracking-wide ${layoutConfig.tableTextSize}`}>1. CODES FOR CHECKING ATTENDANCE</p>
                        </div>
                        <div className={`p-2.5 flex-1 flex flex-col leading-normal text-black font-bold ${layoutConfig.guidelinesTextSize}`}>
                            <p className="mb-3 leading-normal">
                                blank- Present;&nbsp;&nbsp;(x)- Absent;&nbsp;&nbsp;Tardy (half shaded= Upper for Late Commer, Lower for Cutting Classes)
                            </p>
                            <p className={`font-black text-black mb-1.5 uppercase tracking-wide ${layoutConfig.tableTextSize}`}>2. REASONS/CAUSES OF NLS</p>
                            <div className={`leading-[1.3] font-bold text-black space-y-0.5 ${layoutConfig.guidelinesTextSize}`}>
                                <p className="font-black">a. Domestic-Related Factors</p>
                                <p className="pl-2">a.1. Had to take care of siblings</p>
                                <p className="pl-2">a.2. Early marriage/pregnancy</p>
                                <p className="pl-2">a.3. Parents' attitude toward schooling</p>
                                <p className="pl-2">a.4. Family problems</p>
                                <p className="font-black mt-1">b. Individual-Related Factors</p>
                                <p className="pl-2">b.1. Illness</p>
                                <p className="pl-2">b.2. Overage</p>
                                <p className="pl-2">b.3. Death</p>
                                <p className="pl-2">b.4. Drug Abuse</p>
                                <p className="pl-2">b.5. Poor academic performance</p>
                                <p className="pl-2">b.6. Lack of interest/Distractions</p>
                                <p className="pl-2">b.7. Hunger/Malnutrition</p>
                                <p className="font-black mt-1">c. School-Related Factors</p>
                                <p className="pl-2">c.1. Teacher Factor</p>
                                <p className="pl-2">c.2. Physical condition of classroom</p>
                                <p className="pl-2">c.3. Peer influence</p>
                                <p className="font-black mt-1">d. Geographic/Environmental</p>
                                <p className="pl-2">d.1. Distance between home and school</p>
                                <p className="pl-2">d.2. Armed conflict (incl. Tribal wars &amp; clanfeuds)</p>
                                <p className="pl-2">d.3. Calamities/Disasters</p>
                                <p className="font-black mt-1">e. Financial-Related</p>
                                <p className="pl-2">e.1. Child labor, work</p>
                                <p className="font-black mt-1">f. Others</p>
                            </div>
                        </div>
                    </div>

                    {/* Col 3: Summary + Certification */}
                    <div className="w-[30%] flex flex-col text-black">
                        {/* Summary Table */}
                        <table className={`w-full border-collapse border border-black ${layoutConfig.tableTextSize}`} style={{ tableLayout: 'fixed' }}>
                            <colgroup>
                                <col style={{ width: layoutConfig.summaryTableWidths.col1 }} />
                                <col style={{ width: layoutConfig.summaryTableWidths.col2 }} />
                                <col style={{ width: layoutConfig.summaryTableWidths.col3 }} />
                                <col style={{ width: layoutConfig.summaryTableWidths.col4 }} />
                                <col style={{ width: layoutConfig.summaryTableWidths.col5 }} />
                            </colgroup>
                            <thead>
                                {/* Row 1 of Header */}
                                <tr className="h-5.5 border-b border-black">
                                    <th className={`border-r border-black p-1 text-center font-black text-black ${layoutConfig.tableTextSize}`}>
                                        Month:
                                    </th>
                                    <th className={`border-r border-black p-1 text-center font-black text-black ${layoutConfig.tableTextSize}`}>
                                        No. of Days of Classes:
                                    </th>
                                    <th colSpan={3} className={`border-l border-black p-1 text-center font-black text-black ${layoutConfig.tableTextSize}`}>
                                        Summary for the Month
                                    </th>
                                </tr>
                                {/* Row 2 of Header */}
                                <tr className="h-6 border-b border-black">
                                    <th className={`border-r border-black p-1 text-center font-black text-black uppercase ${layoutConfig.inputValSize}`}>
                                        {selectedMonth}
                                    </th>
                                    <th className={`border-r border-black p-1 text-center font-black text-black ${layoutConfig.inputValSize}`}>
                                        {filledDaysCount}
                                    </th>
                                    <th className={`border-r border-black p-0.5 text-center font-black text-black ${layoutConfig.tableTextSize}`}>
                                        M
                                    </th>
                                    <th className={`border-r border-black p-0.5 text-center font-black text-black ${layoutConfig.tableTextSize}`}>
                                        F
                                    </th>
                                    <th className={`p-0.5 text-center font-black text-black ${layoutConfig.tableTextSize}`}>
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
                                    <tr key={i} className="h-5.5 border-b border-black">
                                        <td colSpan={2} className={`border-r border-black p-1 font-bold text-black leading-tight text-center ${row.italic ? 'italic' : ''} ${layoutConfig.summaryTextSize}`}>
                                            {row.label}
                                        </td>
                                        <td className={`border-r border-black p-1 text-center font-extrabold text-black ${layoutConfig.tableTextSize}`}>
                                            {row.m}
                                        </td>
                                        <td className={`border-r border-black p-1 text-center font-extrabold text-black ${layoutConfig.tableTextSize}`}>
                                            {row.f}
                                        </td>
                                        <td className={`p-1 text-center font-black text-black ${layoutConfig.tableTextSize}`}>
                                            {row.t}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Certification */}
                        <div className="p-2 mt-[10px] bg-slate-50/50 pt-2 pb-0.5 space-y-2 flex flex-col">
                            <p className={`font-bold text-black text-[8.5px]`}>I certify that this is a true and correct report.</p>
                            <div className="text-center pt-0.5">
                                <div className={`font-black border-b border-black mx-auto uppercase text-black py-0.5 tracking-wide whitespace-nowrap truncate text-center ${layoutConfig.adviserWidth} text-[8px]`}>
                                    {adviserName}
                                </div>
                                <div className={`font-bold text-slate-800 mt-0.5 text-[7.5px]`}>(Signature of Teacher over Printed Name)</div>
                            </div>
                            <div className={`font-bold text-black pt-1 text-[8.5px]`}>Attested by:</div>
                            <div className="text-center">
                                <div className={`font-black border-b border-black mx-auto uppercase text-black py-0.5 tracking-wide whitespace-nowrap truncate text-center ${layoutConfig.adviserWidth} text-[8px]`}>
                                    {schoolProfile?.head_name}
                                </div>
                                <div className={`font-bold text-slate-800 mt-0.5 text-[7.5px]`}>(Signature of School Head over Printed Name)</div>
                            </div>
                            <div className={`text-center mt-auto pt-1 text-gray-700 font-extrabold italic text-[7px]`}>Generated thru LIS</div>
                        </div>
                    </div>
                </div>
        </>
    );

    // Measure the header block, table header row, a single body row, and the
    // footer block (off-screen, at full print scale) to figure out how many
    // body rows fit on one printed page - with and without the trailing
    // footer - for the current paper size.
    useLayoutEffect(() => {
        const headerEl = measureHeaderRef.current;
        const theadEl = measureTheadRef.current;
        const rowEl = measureRowRef.current;
        const footerEl = measureFooterRef.current;
        if (!headerEl || !theadEl || !rowEl || !footerEl || rowEl.offsetHeight === 0) return;

        const pageHeightPx = parseFloat(paperDimensions[paperSize]?.height || '215.9') * MM_TO_PX;
        const availableHeight = pageHeightPx - PAGE_PADDING_PX[paperSize];

        const headerHeight = headerEl.offsetHeight;
        const theadHeight = theadEl.offsetHeight;
        const rowHeight = rowEl.offsetHeight;
        const footerHeight = footerEl.offsetHeight;

        const tableBorderPx = 4; // table's border-2 top + bottom
        const contentForRows = availableHeight - headerHeight - theadHeight - tableBorderPx;

        const withoutFooter = Math.max(1, Math.floor(contentForRows / rowHeight));
        const withFooter = Math.max(1, Math.floor((contentForRows - footerHeight) / rowHeight));

        setPageCapacity(prev => {
            if (prev && prev.withFooter === withFooter && prev.withoutFooter === withoutFooter) return prev;
            return { withFooter, withoutFooter };
        });
    }, [paperSize, layoutConfig, paperDimensions, bodyRows]);

    // Split the body rows into page-sized chunks. The Guidelines/Codes/
    // Summary/Certification footer is only ever placed on the final page; if
    // the remaining rows fit on a page without the footer but not with it, an
    // extra (rows-empty) final page is added to hold just the footer.
    const pages = useMemo<{ rows: BodyRow[]; isLast: boolean }[]>(() => {
        if (!pageCapacity) {
            return [{ rows: bodyRows, isLast: true }];
        }

        const { withFooter, withoutFooter } = pageCapacity;
        const result: { rows: BodyRow[]; isLast: boolean }[] = [];
        let remaining = bodyRows;

        while (remaining.length > 0) {
            if (remaining.length <= withFooter) {
                result.push({ rows: remaining, isLast: true });
                remaining = [];
            } else if (remaining.length <= withoutFooter) {
                result.push({ rows: remaining, isLast: false });
                result.push({ rows: [], isLast: true });
                remaining = [];
            } else {
                result.push({ rows: remaining.slice(0, withoutFooter), isLast: false });
                remaining = remaining.slice(withoutFooter);
            }
        }

        return result.length > 0 ? result : [{ rows: [], isLast: true }];
    }, [bodyRows, pageCapacity]);

    return (
        <div className="flex flex-col h-screen bg-slate-50 relative overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white">
             {/* Sticky Premium Top Toolbar */}
             <div className="z-20 bg-white/90 backdrop-blur-3xl border-b border-slate-200 shadow-sm relative print:hidden shrink-0 w-full">
                <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30" />
                <div className="h-14 px-2.5 lg:px-3 flex items-center justify-between gap-2.5 overflow-x-auto no-scrollbar scroll-smooth">
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
                        <h2 className="text-[9px] lg:text-[11px] font-black text-slate-900 uppercase tracking-tight truncate">
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
                                    className="appearance-none h-8 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-lg px-2 pr-7 text-[8px] lg:text-[9px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer w-27.5 lg:w-32.5 duration-200"
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
                                className="appearance-none h-8 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-lg px-2 pr-7 text-[8px] lg:text-[9px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer w-21.25 lg:w-25 duration-200"
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
                                className="h-8 px-2 rounded-lg bg-white border border-blue-100 text-[7px] font-black uppercase tracking-wide text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all flex items-center gap-1 shadow-sm whitespace-nowrap shrink-0 duration-200 active:scale-95"
                                title="Sync headers with official school calendar"
                            >
                                Sync Dates
                            </button>
                        )}
                    </div>

                    <div className="flex-1 min-w-3" />

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Paper Size */}
                        <div className="relative group shrink-0">
                            <select
                                value={paperSize}
                                onChange={(e) => setPaperSize(e.target.value as 'letter' | 'a4' | 'folio')}
                                className="appearance-none h-8 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-lg px-2 pr-7 text-[8px] lg:text-[9px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer w-20 lg:w-22.5 duration-200"
                            >
                                <option value="letter">Letter</option>
                                <option value="a4">A4</option>
                                <option value="folio">Folio</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors" />
                        </div>

                        <div className="h-6 w-px bg-slate-200 shrink-0" />

                        {/* Zoom Control */}
                        <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
                            <button
                                onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))}
                                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-md transition-all shadow-sm active:scale-90 duration-200"
                                title="Zoom Out"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-[8px] font-black text-slate-900 w-7 text-center tabular-nums">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button
                                onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-md transition-all shadow-sm active:scale-90 duration-200"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Download PDF Button */}
                        <button
                            onClick={handleDownloadAttendance}
                            disabled={!selectedSection || isDownloading}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-black active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center group duration-200"
                            title="Download PDF"
                        >
                            <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                        </button>

                        {/* Print Primary Button */}
                        <button
                            onClick={handlePrint}
                            disabled={!selectedSection}
                            className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/30 hover:scale-[1.01] hover:-translate-y-px active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center group duration-200"
                            title="Print Official SF2"
                        >
                            <Printer className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
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
                    <div ref={previewViewportRef} className="w-full min-h-full flex flex-col items-center py-8 px-4 lg:px-6 gap-6 print:p-0 print:gap-0 print:block overflow-x-auto">
                        {pages.map((page, pageIdx) => {
                            const isLastPage = pageIdx === pages.length - 1;
                            const pageHeightPx = parseFloat(paperDimensions[paperSize]?.height || '215.9mm') * MM_TO_PX;
                            return (
                                <div
                                    key={pageIdx}
                                    className="origin-top print:contents"
                                    style={{
                                        transform: `scale(${effectiveZoom})`,
                                        width: paperDimensions[paperSize]?.pixelWidth || 1248,
                                        marginBottom: `${(effectiveZoom - 1) * pageHeightPx}px`,
                                    }}
                                >
                                    <div
                                        id={pageIdx === 0 ? 'sf2-printable-area' : undefined}
                                        data-sf2-page={pageIdx}
                                        className={`sf2-print-container bg-white mx-auto print:w-full shadow-[0_20px_50px_rgba(0,0,0,0.08)] print:shadow-none border border-slate-200 print:border-none print:m-0 rounded-sm ${layoutConfig.padding} ${!isLastPage ? 'sf2-page-break' : ''}`}
                                        style={{
                                            width: paperDimensions[paperSize]?.width || '330.2mm',
                                            height: paperDimensions[paperSize]?.height || '215.9mm',
                                            display: 'flow-root',
                                        }}
                                    >

                {page.rows.length > 0 ? (
                    <>
                        {renderHeaderBlock()}
                        <table className={`w-full border-collapse border-2 border-black mb-0 ${layoutConfig.tableTextSize}`} style={{ tableLayout: 'fixed' }}>
                            {renderColgroup()}
                            {renderTableHeadRows()}
                            <tbody>
                                {page.rows.map((row, rowIdx) => renderBodyRow(row, row.type === 'student' ? row.student.lrn : `${row.type}-${rowIdx}`))}
                            </tbody>
                        </table>
                        {page.isLast && renderFooterBlock(true)}
                    </>
                ) : (
                    page.isLast && renderFooterBlock(false)
                )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Hidden measurement template (visibility:hidden, NOT display:none, so
                            offsetHeight stays measurable): renders one page's header, table
                            head, a single body row, and the footer block off-screen at full
                            scale to compute pageCapacity above. */}
                        <div aria-hidden="true" className="print:hidden" style={{ position: 'fixed', top: 0, left: '-99999px', visibility: 'hidden', pointerEvents: 'none' }}>
                            <div
                                className={`sf2-print-container bg-white ${layoutConfig.padding}`}
                                style={{ width: paperDimensions[paperSize]?.width || '330.2mm', display: 'flow-root' }}
                            >
                                <div ref={measureHeaderRef} style={{ display: 'flow-root' }}>
                                    {renderHeaderBlock()}
                                </div>
                                <table className={`w-full border-collapse border-2 border-black mb-0 ${layoutConfig.tableTextSize}`} style={{ tableLayout: 'fixed' }}>
                                    {renderColgroup()}
                                    {renderTableHeadRows(measureTheadRef)}
                                    <tbody>
                                        {bodyRows.length > 0 && renderBodyRow(bodyRows[0], 'measure-row', measureRowRef)}
                                    </tbody>
                                </table>
                                <div ref={measureFooterRef} style={{ display: 'flow-root' }}>
                                    {renderFooterBlock(true)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
<style>{`
    .sf2-print-container, .sf2-print-container * {
        font-family: 'Arial Narrow', Arial, sans-serif !important;
    }
    .sf2-print-container th[rowspan], 
    .sf2-print-container td[rowspan], 
    .sf2-print-container th[colspan], 
    .sf2-print-container td[colspan] {
        position: relative !important;
        background-clip: padding-box !important;
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
            margin: 0 !important;
        }
        html, body {
            width: 100% !important;
            height: auto !important;
            background: #fff !important;
            overflow: visible !important;
        }
        .sf2-print-container {
            width: ${paperSize === 'a4' ? '297mm' : paperSize === 'letter' ? '11in' : '13in'} !important;
            height: ${paperSize === 'a4' ? '210mm' : '8.5in'} !important;
            max-width: none !important;
            margin: 0 auto !important;
            border: none !important;
            box-shadow: none !important;
        }
        .sf2-page-break {
            break-after: page;
            page-break-after: always;
        }
    }
`}</style>
</div>
);
}
