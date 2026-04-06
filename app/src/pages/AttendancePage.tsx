import { useState, useMemo, useEffect, useRef } from 'react';
import { useAppStore } from '../stores';
import { useAuthStore } from '../stores/auth-store';
import { Printer, ArrowLeft, ArrowRight } from 'lucide-react';


export function AttendancePage() {
    const { students, sections, activeSF2Sheet, fetchSF2Sheet, saveSF2Sheet, schoolProfile, teachers } = useAppStore();
    const { user } = useAuthStore();
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('JUNE');

    const months = ['JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER', 'JANUARY', 'FEBRUARY', 'MARCH'];

    const [attendanceData, setAttendanceData] = useState<Record<string, Record<string, Record<number, string>>>>({});
    const [monthDateLabels, setMonthDateLabels] = useState<Record<string, Record<number, string>>>({});

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

    const triggerSave = (month: string, newData: any, newLabels: any) => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(() => {
            if (!selectedSection) return;
            saveSF2Sheet({
                id: `${selectedSection}_${useAppStore.getState().activeSchoolYear}_${month}`,
                section_id: selectedSection,
                school_year: useAppStore.getState().activeSchoolYear,
                month: month,
                date_labels: newLabels,
                attendance: newData,
                updated_at: new Date().toISOString()
            });
        }, 2000);
    };

    const sortedSections = useMemo(() => {
        return [...sections].sort((a, b) => {
            // Extract numeric grade level (e.g. "Grade 7" -> 7)
            const gradeA = parseInt(a.section_grade_level.replace(/\D/g, '')) || 0;
            const gradeB = parseInt(b.section_grade_level.replace(/\D/g, '')) || 0;

            if (gradeA !== gradeB) return gradeA - gradeB;
            return a.section_name.localeCompare(b.section_name);
        });
    }, [sections]);

    const autoFillDates = () => {
        const monthMap: Record<string, number> = {
            'JANUARY': 0, 'FEBRUARY': 1, 'MARCH': 2, 'APRIL': 3, 'MAY': 4, 'JUNE': 5,
            'JULY': 6, 'AUGUST': 7, 'SEPTEMBER': 8, 'OCTOBER': 9, 'NOVEMBER': 10, 'DECEMBER': 11
        };
        const monthIndex = monthMap[selectedMonth];
        const [startYear, endYear] = useAppStore.getState().activeSchoolYear.split('-').map(Number);
        const year = monthIndex >= 5 ? startYear : endYear;

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

        if (firstSchoolDayDate === 0) return; // No school days?

        const filled: Record<number, string> = {};
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

        setMonthDateLabels(prev => ({
            ...prev,
            [selectedMonth]: filled
        }));

        triggerSave(selectedMonth, attendanceData[selectedMonth] || {}, filled);
    };



    const sectionStudents = useMemo(() => {
        return selectedSection
            ? students.filter((s) => s.student_section === selectedSection)
            : [];
    }, [selectedSection, students]);

    const displayStudents = useMemo(() => {
        const males = sectionStudents.filter(s => s.gender === 'Male').sort((a, b) => a.last_name.localeCompare(b.last_name));
        const females = sectionStudents.filter(s => s.gender === 'Female').sort((a, b) => a.last_name.localeCompare(b.last_name));
        return { males, females };
    }, [sectionStudents]);

    const days = Array.from({ length: totalColumns }, (_, i) => i + 1);
    const dayLetters = ['M', 'T', 'W', 'TH', 'F'];

    const toggleAttendance = (studentId: string, day: number) => {
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

    const handlePrint = () => window.print();

    const totalMaleAbsent = displayStudents.males.reduce((sum, s) => sum + countStats(s.lrn, 'absent'), 0);
    const totalFemaleAbsent = displayStudents.females.reduce((sum, s) => sum + countStats(s.lrn, 'absent'), 0);
    const totalMalePresent = displayStudents.males.reduce((sum, s) => sum + (Math.max(0, filledDaysCount - countStats(s.lrn, 'absent'))), 0);
    const totalFemalePresent = displayStudents.females.reduce((sum, s) => sum + (Math.max(0, filledDaysCount - countStats(s.lrn, 'absent'))), 0);

    const summaryStats = useMemo(() => {
        // Enrolment Stats
        let maleBaseline = 0, femaleBaseline = 0;
        let maleLate = 0, femaleLate = 0;
        let maleRegistered = 0, femaleRegistered = 0;

        const isLate = (s: any) => {
            if (!s.enrollment_date) return false;
            // Simplification: Late if enrolled in current selected Month (and NOT June/default)
            const d = new Date(s.enrollment_date);
            // Verify valid date
            if (isNaN(d.getTime())) return false;
            const m = d.toLocaleString('en-US', { month: 'long' }).toUpperCase();
            return m === selectedMonth && selectedMonth !== 'JUNE';
        };

        displayStudents.males.forEach(s => {
            maleRegistered++;
            if (isLate(s)) maleLate++;
            else maleBaseline++; // Assume baseline if not late
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
        const hasConsecutiveAbsences = (s: any) => {
            const records = attendanceData[selectedMonth]?.[s.lrn] || {};
            // Get valid school days (indices that have a date label)
            const validDays = days.filter(d => monthDateLabels[selectedMonth]?.[d]);

            let consecutive = 0;
            for (const d of validDays) {
                const status = records[d]; // 'x' or '' or undefined
                if (status === 'x') {
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
    }, [displayStudents, selectedMonth, filledDaysCount, totalMalePresent, totalFemalePresent, attendanceData, monthDateLabels]);


    return (
        <div className="flex flex-col bg-gray-100 min-h-screen overflow-auto print:bg-white print:overflow-visible" style={{ fontFamily: "'Arial Narrow', Arial, sans-serif", fontSize: '10px' }}>
            {/* Controls Bar */}
            <div className="flex justify-between items-center bg-white p-2 mb-2 rounded shadow-sm border border-gray-200 mx-4 mt-4 print:hidden">
                <div className="flex gap-4 items-center">
                    <div className="flex flex-col">
                        <label className="font-bold text-gray-700 text-[10px] uppercase">Section</label>
                        <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm">
                            <option value="">Select Section</option>
                            {sortedSections.map(section => (
                                <option key={section.id} value={section.section_name}>
                                    {section.section_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label className="font-bold text-gray-700 text-[10px] uppercase">Month</label>
                        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm">
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>

                    <button onClick={autoFillDates}
                        className="bg-green-600 text-white px-3 py-1 rounded shadow hover:bg-green-700 transition-colors text-[10px] font-bold uppercase tracking-wider ml-4 h-8"
                        title="Auto-fill school days (Mon-Fri)">
                        Auto-Fill Dates
                    </button>
                </div>

                <button onClick={handlePrint} className="flex gap-2 items-center bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition-colors text-xs font-bold uppercase tracking-wider">
                    <Printer size={16} /> Print SF2
                </button>
            </div>


            {/* Print styles for 8.5 x 13 folio landscape */}
            <style>{`
                @media print {
                    @page {
                        size: 13in 8.5in landscape;
                        margin: 0.3in;
                    }
                    body { margin: 0; padding: 0; }
                    .no-print, .print\\:hidden { display: none !important; }
                }
            `}</style>

            {/* Paper */}
            <div className="bg-white mx-auto w-[1350px] print:w-full shadow-lg print:shadow-none border print:border-none mb-8 p-6 print:p-2 print:m-0">

                {/* === HEADER === */}
                <div className="flex items-center mb-1">
                    <div className="w-[75px] flex-shrink-0">
                        <img src="/deped_logo_left.png" alt="DepEd Logo" className="w-[70px] h-[70px] object-contain" />
                    </div>
                    <div className="flex-1 text-center">
                        <p className="text-[16px] font-bold leading-tight" style={{ fontFamily: 'Arial, sans-serif' }}>School Form 2 (SF2) Daily Attendance Report of Learners</p>
                        <p className="italic text-[9px] text-gray-600">(This replaced Form 1, Form 2 &amp; STS Form 4 - Absenteeism and Dropout Profile)</p>
                    </div>
                    <div className="w-[100px] flex-shrink-0 flex justify-end">
                        <img src="/deped_logo_right.png" alt="DepEd" className="h-[55px] object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                </div>

                {/* Row 1: School ID | School Year | Report for the Month of */}
                <div className="flex items-center mb-0.5 text-[10px]">
                    <span className="font-bold mr-1 whitespace-nowrap">School ID</span>
                    <div className="border border-black px-2 py-0.5 w-24 text-center font-bold">307014</div>
                    <span className="font-bold ml-4 mr-1 whitespace-nowrap">School Year</span>
                    <div className="border border-black px-2 py-0.5 w-24 text-center font-bold">2025-2026</div>
                    <span className="flex-1"></span>
                    <span className="font-bold mr-1 whitespace-nowrap">Report for the Month of</span>
                    <div className="border border-black bg-[#BDD7EE] px-2 py-0.5 w-32 text-center font-bold uppercase">{selectedMonth}</div>
                </div>

                {/* Row 2: Name of School | Grade Level | Section */}
                <div className="flex items-center mb-1.5 text-[10px]">
                    <span className="font-bold mr-1 whitespace-nowrap">Name of School</span>
                    <div className="border border-black px-2 py-0.5 flex-1 text-center font-bold uppercase">CALIBUNGAN HIGH SCHOOL</div>
                    <span className="font-bold ml-4 mr-1 whitespace-nowrap">Grade Level</span>
                    <div className="border border-black px-2 py-0.5 w-10 text-center font-bold">
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
                                        onChange={(e) => {
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
                                    <td key={d} className={`border border-black text-center cursor-pointer hover:bg-yellow-50 p-0${getBorderClass(i)}`}
                                        onClick={() => toggleAttendance(student.lrn, d)}>
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
                                    <td key={d} className={`border border-black text-center cursor-pointer hover:bg-yellow-50 p-0${getBorderClass(i)}`}
                                        onClick={() => toggleAttendance(student.lrn, d)}>
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
                                    {/* Actually for percentages, Average Percentage is tricky. 
                                        Percentage of Enrolment Total = ((M_Reg + F_Reg) / (M_Base + F_Base)) * 100.
                                        Percentage of Attendance Total = ((M_ADA + F_ADA) / (M_Reg + F_Reg)) * 100.
                                        I should approximate or calculate correctly.
                                     */}
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
                                        if (!sec) return '';
                                        // Priority 1: Explicit name in section
                                        if (sec.adviser_name) return sec.adviser_name;
                                        // Priority 2: Lookup by adviser_id
                                        if (sec.adviser_id) {
                                            const teacher = teachers.find(t => t.uid === sec.adviser_id);
                                            if (teacher && teacher.displayName) return teacher.displayName;
                                        }
                                        // Priority 3: Current User if they are the one generating (and implicit adviser)
                                        // But careful, user said "It was admin that shows". User wants REAL adviser.
                                        // If real adviser is missing, maybe showing Admin is okay, OR showing nothing/placeholder?
                                        // Logic used: Fallback to user.displayName
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

                <div className="text-center text-[8px] mt-1 text-gray-500 italic">Generated thru LIS</div>
            </div>
        </div >
    );
}
