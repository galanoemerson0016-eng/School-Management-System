/**
 * SF2 Sync — bridges Daily Attendance marks into SF2 monthly sheets.
 *
 * SF2 sheets store attendance as `attendance[LRN]['date_<dayOfMonth>']` with
 * mark values '', 'absent', 'tardy-upper', 'tardy-lower'. Sheet ids follow
 * `${sectionName}_${schoolYear}_${MONTH}`. The calendar math below mirrors
 * AttendancePage so sheets created here match ones created on the SF2 page.
 */
import { db } from '../services/database';
import type { SF2Sheet, AttendanceRecord, CalendarEvent } from '../types';

export const SCHOOL_CALENDAR_2026_2027: Record<string, number[]> = {
    JUNE: [8, 9, 10, 11, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26, 29, 30], // 16 days (Opens June 8; June 12 Holiday)
    JULY: [1, 2, 3, 6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 20, 21, 22, 23, 24, 27, 28, 29, 30, 31], // 23 days
    AUGUST: [3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 17, 18, 19, 20, 24, 25, 26, 27, 28], // 19 days (Aug 21 & 31 Holidays)
    SEPTEMBER: [1, 2, 3, 4, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 28, 29, 30], // 22 days (Term 1 ends Sep 15; Term 2 opens Sep 16)
    OCTOBER: [1, 2, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 26, 27, 28, 29, 30], // 22 days
    NOVEMBER: [3, 4, 5, 6, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 23, 24, 25, 26, 27], // 19 days (Nov 2 & 30 Holidays)
    DECEMBER: [1, 2, 3, 4, 7, 9, 10, 11, 14, 15, 16, 17, 18], // 13 days (Dec 8 Holiday; Term 2 ends Dec 18)
    JANUARY: [4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 18, 19, 20, 21, 22, 25, 26, 27, 28, 29], // 20 days (Term 3 opens Jan 4)
    FEBRUARY: [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26], // 20 days
    MARCH: [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 29, 30, 31], // 21 days (Mar 25-26 Holy Week)
    APRIL: [1, 2, 5, 6, 7, 8], // 6 days (EOSY April 8, 2027) -> Total = 201 Class Days
};

const MONTH_NAMES = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

const MONTH_INDEX_BY_NAME = new Map(MONTH_NAMES.map((name, index) => [name, index]));

function loadHolidays(): string[] {
    try {
        const storedEvents = localStorage.getItem('school_calendar_events');
        if (!storedEvents) return [];
        const parsedEvents = JSON.parse(storedEvents);
        if (!Array.isArray(parsedEvents)) return [];
        return parsedEvents
            .filter((e: CalendarEvent) => e.type === 'holiday' || e.type === 'suspension')
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
                } catch {
                    // skip malformed event dates
                }
                return dates;
            });
    } catch {
        return [];
    }
}

function getActiveWeeks(month: string, schoolYear: string, includeSaturdays: boolean): number[] {
    const monthIndex = MONTH_NAMES.indexOf(month);
    if (monthIndex === -1) return [0, 1, 2, 3];

    const [startYear, endYear] = schoolYear.split('-').map(Number);
    const year = monthIndex >= 5 ? startYear : endYear;

    const limitDow = includeSaturdays ? 6 : 5;
    const firstDateOfMonth = new Date(year, monthIndex, 1);
    const firstDayOffset = firstDateOfMonth.getDay() === 0 ? 6 : firstDateOfMonth.getDay() - 1;

    let calendarDays: number[] = [];
    if (schoolYear === '2026-2027' && SCHOOL_CALENDAR_2026_2027[month]) {
        calendarDays = [...SCHOOL_CALENDAR_2026_2027[month]];
        if (includeSaturdays && calendarDays.length > 0) {
            const firstSchoolDay = calendarDays[0];
            const lastSchoolDay = calendarDays[calendarDays.length - 1];
            const holidays = loadHolidays();
            for (let d = firstSchoolDay; d <= lastSchoolDay; d++) {
                const dateObj = new Date(year, monthIndex, d);
                if (dateObj.getDay() === 6) {
                    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    if (!holidays.includes(dateStr) && !calendarDays.includes(d)) {
                        calendarDays.push(d);
                    }
                }
            }
            calendarDays.sort((a, b) => a - b);
        }
    } else {
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            calendarDays.push(d);
        }
    }

    const activeWeekSet = new Set<number>();
    calendarDays.forEach(d => {
        const dateObj = new Date(year, monthIndex, d);
        const dow = dateObj.getDay();
        if (dow >= 1 && dow <= limitDow) {
            const totalDaysFromMondayOfFirstWeek = d + firstDayOffset - 1;
            const weekIndex = Math.floor(totalDaysFromMondayOfFirstWeek / 7);
            activeWeekSet.add(weekIndex);
        }
    });

    const activeWeeks = Array.from(activeWeekSet).sort((a, b) => a - b);
    if (activeWeeks.length === 0) return [0, 1, 2, 3];
    return activeWeeks;
}

export function getSf2TotalColumns(month: string, schoolYear: string, includeSaturdays: boolean): number {
    return getActiveWeeks(month, schoolYear, includeSaturdays).length * (includeSaturdays ? 6 : 5);
}

export function getSf2MonthContext(isoDate: string, schoolYear: string): { month: string; day: number; dateKey: string } | null {
    const [yearStr, monthStr, dayStr] = isoDate.split('-');
    const monthIndex = Number(monthStr) - 1;
    const day = Number(dayStr);
    if (!yearStr || isNaN(monthIndex) || isNaN(day)) return null;

    const month = MONTH_NAMES[monthIndex];
    if (!month || month === 'MAY') return null;

    const [startYear, endYear] = schoolYear.split('-').map(Number);
    const expectedYear = monthIndex >= 5 ? startYear : endYear;
    const actualYear = Number(yearStr);
    if (!isNaN(actualYear) && actualYear !== expectedYear) {
        return null;
    }

    return {
        month,
        day,
        dateKey: `date_${day}`,
    };
}

export function attendanceStatusFromSf2Mark(mark?: string): AttendanceRecord['status'] {
    const normalized = (mark || '').trim();
    switch (normalized) {
        case 'absent':
            return 'absent';
        case 'tardy-upper':
        case 'tardy':
            return 'late';
        case 'tardy-lower':
        case 'cutting':
            return 'cutting';
        default:
            return 'present';
    }
}

export function buildAttendanceRecordsFromSf2Sheet(sheet: SF2Sheet): AttendanceRecord[] {
    const records: AttendanceRecord[] = [];
    const dateLabels = Object.entries(sheet.date_labels || {})
        .map(([, label]) => String(label || '').trim())
        .filter((label) => /^\d{1,2}$/.test(label));

    const monthIndex = MONTH_INDEX_BY_NAME.get(sheet.month);
    if (monthIndex === undefined) return records;

    const [startYear, endYear] = sheet.school_year.split('-').map(Number);
    const year = monthIndex >= 5 ? startYear : endYear;

    for (const [studentLrn, row] of Object.entries(sheet.attendance || {})) {
        for (const dayLabel of dateLabels) {
            const dateKey = `date_${dayLabel}`;
            const status = attendanceStatusFromSf2Mark(row?.[dateKey]);
            if (status === 'present') continue;
            records.push({
                id: `${studentLrn}_${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(Number(dayLabel)).padStart(2, '0')}`,
                student_lrn: studentLrn,
                date: `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(Number(dayLabel)).padStart(2, '0')}`,
                status,
                section_id: sheet.section_id,
            });
        }
    }

    return records;
}

export function buildSf2SheetAttendanceFromRecords(
    sheet: SF2Sheet,
    records: AttendanceRecord[],
): SF2Sheet {
    const attendance = { ...sheet.attendance };
    for (const record of records) {
        const context = getSf2MonthContext(record.date, sheet.school_year);
        if (!context || context.month !== sheet.month) continue;
        const row = { ...(attendance[record.student_lrn] || {}) };
        row[context.dateKey] = sf2MarkFor(record.status);
        attendance[record.student_lrn] = row;
    }
    return { ...sheet, attendance, updated_at: new Date().toISOString() };
}

/** Auto-fill date labels for a new sheet, matching AttendancePage's generator. */
export function buildAutoFilledDateLabels(month: string, schoolYear: string, includeSaturdays: boolean): Record<number, string> {
    const filled: Record<number, string> = {};
    const monthIndex = MONTH_NAMES.indexOf(month);
    if (monthIndex === -1) return filled;

    const [startYear, endYear] = schoolYear.split('-').map(Number);
    const year = monthIndex >= 5 ? startYear : endYear;
    const totalCols = getSf2TotalColumns(month, schoolYear, includeSaturdays);
    const holidays = loadHolidays();
    const limitDow = includeSaturdays ? 6 : 5;
    const weekMultiplier = includeSaturdays ? 6 : 5;
    const activeWeeks = getActiveWeeks(month, schoolYear, includeSaturdays);
    const firstDateOfMonth = new Date(year, monthIndex, 1);
    const firstDayOffset = firstDateOfMonth.getDay() === 0 ? 6 : firstDateOfMonth.getDay() - 1;

    let calendarDays: number[] = [];
    if (schoolYear === '2026-2027' && SCHOOL_CALENDAR_2026_2027[month]) {
        calendarDays = [...SCHOOL_CALENDAR_2026_2027[month]];
        if (includeSaturdays && calendarDays.length > 0) {
            const firstSchoolDay = calendarDays[0];
            const lastSchoolDay = calendarDays[calendarDays.length - 1];
            for (let d = firstSchoolDay; d <= lastSchoolDay; d++) {
                const dateObj = new Date(year, monthIndex, d);
                if (dateObj.getDay() === 6) {
                    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    if (!holidays.includes(dateStr) && !calendarDays.includes(d)) {
                        calendarDays.push(d);
                    }
                }
            }
            calendarDays.sort((a, b) => a - b);
        }
    } else {
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    }

    calendarDays.forEach((d) => {
        const dateObj = new Date(year, monthIndex, d);
        const dow = dateObj.getDay();
        if (dow >= 1 && dow <= limitDow) {
            const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            if (holidays.includes(dateStr)) return;
            const totalDaysFromMondayOfFirstWeek = d + firstDayOffset - 1;
            const calendarWeekIndex = Math.floor(totalDaysFromMondayOfFirstWeek / 7);
            const weekIndex = activeWeeks.indexOf(calendarWeekIndex);
            if (weekIndex !== -1) {
                const colIndex = (weekIndex * weekMultiplier) + (dow - 1);
                if (colIndex >= 0 && colIndex < totalCols) {
                    filled[colIndex + 1] = d.toString();
                }
            }
        }
    });

    return filled;
}

/** Map a Daily Attendance status to the SF2 cell mark. Excused counts as absent on SF2 (noted via remarks by the teacher). */
export function sf2MarkFor(status: AttendanceRecord['status']): string {
    switch (status) {
        case 'absent': return 'absent';
        case 'late': return 'tardy-upper';
        case 'cutting': return 'tardy-lower';
        case 'excused': return 'absent';
        case 'present':
        default:
            return '';
    }
}

export interface SF2SyncResult {
    synced: boolean;
    sheetId?: string;
    /** Day was not a school day on the SF2 calendar, so no column exists for it. */
    dayNotInSheet?: boolean;
}

/**
 * Write a day's attendance marks for one section into its SF2 monthly sheet.
 * Creates the sheet (with auto-filled date labels) when it doesn't exist yet.
 *
 * @param sectionName SF2 sheets are keyed by section *name* (matching AttendancePage)
 * @param isoDate     YYYY-MM-DD
 * @param marks       LRN → daily status ('present' clears the cell)
 * @param saveSheet   store action so React state stays in sync (useAppStore saveSF2Sheet)
 */
export async function syncDailyAttendanceToSF2(
    sectionName: string,
    isoDate: string,
    marks: Record<string, AttendanceRecord['status'] | null>,
    schoolYear: string,
    saveSheet: (sheet: SF2Sheet) => Promise<void>,
): Promise<SF2SyncResult> {
    const [yearStr, monthStr, dayStr] = isoDate.split('-');
    const monthIndex = Number(monthStr) - 1;
    const day = Number(dayStr);
    if (!yearStr || isNaN(monthIndex) || isNaN(day)) return { synced: false };

    const month = MONTH_NAMES[monthIndex];
    // SF2 sheets only exist for school months (JUNE..APRIL); skip e.g. MAY
    if (!month || month === 'MAY') return { synced: false };

    const includeSaturdays = localStorage.getItem('formease_sf2_include_saturdays') === 'true';
    const sheetId = `${sectionName}_${schoolYear}_${month}`;

    let sheet = await db.getRecord<SF2Sheet>('sf2Sheets', sheetId);
    if (!sheet) {
        sheet = {
            id: sheetId,
            section_id: sectionName,
            school_year: schoolYear,
            month,
            date_labels: buildAutoFilledDateLabels(month, schoolYear, includeSaturdays),
            attendance: {},
            remarks: {},
            updated_at: new Date().toISOString(),
        };
    }

    const dayLabel = day.toString();
    const dayNotInSheet = !Object.values(sheet.date_labels || {}).some(
        (label) => (label || '').trim() === dayLabel,
    );

    const dateKey = `date_${dayLabel}`;
    const attendance = { ...sheet.attendance };
    for (const [lrn, status] of Object.entries(marks)) {
        const row = { ...(attendance[lrn] || {}) };
        if (status === null) {
            delete row[dateKey];
        } else {
            row[dateKey] = sf2MarkFor(status);
        }
        attendance[lrn] = row;
    }

    await saveSheet({ ...sheet, attendance, updated_at: new Date().toISOString() });
    return { synced: true, sheetId, dayNotInSheet };
}
