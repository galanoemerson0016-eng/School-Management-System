/**
 * SF9 Attendance Computation Utility
 * Calculates monthly school days, days present, and days absent for a student
 * based on SF2 sheets and AttendanceRecords across the 3 terms.
 */

import type { Student, SF2Sheet, Section, AttendanceRecord, CalendarEvent } from '../types';
import { useAppStore } from '../stores/app-store';
import { getSf2TotalColumns } from './sf2-sync';

const SCHOOL_CALENDAR_2026_2027: Record<string, number[]> = {
  JUNE: [15, 16, 17, 18, 19, 22, 23, 24, 25, 26, 29, 30],
  JULY: [1, 2, 3, 6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 20, 21, 22, 23, 24, 27, 28, 29, 30, 31],
  AUGUST: [3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 17, 18, 19, 20, 24, 25, 26, 27, 28],
  SEPTEMBER: [1, 2, 3, 4, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 28, 29, 30],
  OCTOBER: [1, 2, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 26, 27, 28, 29, 30],
  NOVEMBER: [3, 4, 5, 6, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 23, 24, 25, 26, 27],
  DECEMBER: [1, 2, 3, 4, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18],
  JANUARY: [4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 18, 19, 20, 21, 22, 25, 26, 27, 28, 29],
  FEBRUARY: [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26],
  MARCH: [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26, 29, 30, 31],
  APRIL: [1, 2, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 26, 27, 28, 29, 30]
};

const SCHOOL_CALENDAR_2026_2027_COUNTS: Record<string, number> = {
  JUNE: 16,
  JULY: 23,
  AUGUST: 19,
  SEPTEMBER: 22,
  OCTOBER: 22,
  NOVEMBER: 19,
  DECEMBER: 13,
  JANUARY: 20,
  FEBRUARY: 20,
  MARCH: 21,
  APRIL: 6
};

export function computeStudentAttendance(
  student: Student, 
  sf2Sheets: SF2Sheet[], 
  schoolYear: string, 
  sectionObj?: Section,
  attendanceRecords: AttendanceRecord[] = []
) {
  const months = ['JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL'];
  const schoolDays: number[] = [];
  const daysPresent: number[] = [];
  const daysAbsent: number[] = [];

  const getFallbackSchoolDays = (monthName: string) => {
    const includeSaturdays = localStorage.getItem('formease_sf2_include_saturdays') === 'true';
    if (!includeSaturdays && schoolYear === '2026-2027' && SCHOOL_CALENDAR_2026_2027_COUNTS[monthName] != null) {
      return SCHOOL_CALENDAR_2026_2027_COUNTS[monthName];
    }

    const monthIndexMap: Record<string, number> = {
      JANUARY: 0,
      FEBRUARY: 1,
      MARCH: 2,
      APRIL: 3,
      MAY: 4,
      JUNE: 5,
      JULY: 6,
      AUGUST: 7,
      SEPTEMBER: 8,
      OCTOBER: 9,
      NOVEMBER: 10,
      DECEMBER: 11
    };

    const monthIndex = monthIndexMap[monthName];
    if (monthIndex == null) return 0;

    const [startYearRaw, endYearRaw] = (schoolYear || '').split('-');
    const startYear = Number.parseInt(startYearRaw, 10);
    const endYear = Number.parseInt(endYearRaw, 10);
    const resolvedYear = monthIndex >= 5
      ? (Number.isFinite(startYear) ? startYear : new Date().getFullYear())
      : (Number.isFinite(endYear) ? endYear : Number.isFinite(startYear) ? startYear + 1 : new Date().getFullYear());

    const daysInMonth = new Date(resolvedYear, monthIndex + 1, 0).getDate();

    // Fetch calendar holidays from localStorage
    let holidays: string[] = [];
    try {
      const storedEvents = localStorage.getItem('school_calendar_events');
      if (storedEvents) {
        const parsedEvents = JSON.parse(storedEvents);
        if (Array.isArray(parsedEvents)) {
          holidays = parsedEvents
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

    let schoolDaysCount = 0;
    const limitDow = includeSaturdays ? 6 : 5;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(resolvedYear, monthIndex, day);
      const dow = dateObj.getDay();
      const dateStr = `${resolvedYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (holidays.includes(dateStr)) continue;

      if (dow >= 1 && dow <= limitDow) {
        if (schoolYear === '2026-2027' && SCHOOL_CALENDAR_2026_2027[monthName]) {
          const calendarDays = SCHOOL_CALENDAR_2026_2027[monthName];
          const firstSchoolDay = calendarDays.length > 0 ? calendarDays[0] : 1;
          const lastSchoolDay = calendarDays.length > 0 ? calendarDays[calendarDays.length - 1] : daysInMonth;

          const isHardcodedWeekday = calendarDays.includes(day);
          const isSaturday = (dow === 6 && day >= firstSchoolDay && day <= lastSchoolDay);
          if (isHardcodedWeekday || isSaturday) {
            schoolDaysCount++;
          }
        } else {
          schoolDaysCount++;
        }
      }
    }
    const totalCols = getSf2TotalColumns(monthName, schoolYear, includeSaturdays);
    return Math.min(totalCols, schoolDaysCount);
  };

  const normalizeText = (value?: string | number) => (value ?? '').toString().trim().toUpperCase();
  const normalizeSectionToken = (value?: string | number) =>
    (value ?? '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

  const monthByNumber: Record<number, string> = {
    1: 'JANUARY',
    2: 'FEBRUARY',
    3: 'MARCH',
    4: 'APRIL',
    5: 'MAY',
    6: 'JUNE',
    7: 'JULY',
    8: 'AUGUST',
    9: 'SEPTEMBER',
    10: 'OCTOBER',
    11: 'NOVEMBER',
    12: 'DECEMBER'
  };

  const normalizeMonthToken = (value?: string | number): string | null => {
    const raw = normalizeText(value);
    if (!raw) return null;

    const asNumber = Number.parseInt(raw, 10);
    if (!Number.isNaN(asNumber)) {
      if (asNumber >= 1 && asNumber <= 12) return monthByNumber[asNumber];
      if (asNumber >= 0 && asNumber <= 11) return monthByNumber[asNumber + 1];
    }

    const compact = raw.replace(/[^A-Z]/g, '');
    if (!compact) return null;

    for (const monthName of months) {
      if (compact === monthName) return monthName;
      if (compact === monthName.substring(0, 3)) return monthName;
      if (monthName.startsWith(compact) || compact.startsWith(monthName.substring(0, 3))) {
        return monthName;
      }
    }

    return null;
  };

  const extractMonthFromId = (id?: string): string | null => {
    const normalizedId = normalizeText(id);
    if (!normalizedId) return null;

    const parts = normalizedId.split('_').filter(Boolean);
    if (parts.length === 0) return null;

    return normalizeMonthToken(parts[parts.length - 1]);
  };

  const dbSections = useAppStore.getState().sections;
  const advisorySection = dbSections.find((s: Section) => 
    (s.id === student.student_section || s.section_name === student.student_section) &&
    (s.is_advisory || !s.is_teaching_load)
  ) || sectionObj;

  const targetSectionTokens = new Set<string>([
    normalizeSectionToken(student.student_section),
    normalizeSectionToken(advisorySection?.id),
    normalizeSectionToken(advisorySection?.section_name),
    normalizeSectionToken(sectionObj?.id),
    normalizeSectionToken(sectionObj?.section_name)
  ].filter(Boolean));

  const targetSchoolYear = normalizeText(schoolYear);
  const targetStartYear = targetSchoolYear.match(/\d{4}/)?.[0] || '';

  const getSheetMonth = (sheet: SF2Sheet) => normalizeMonthToken(sheet.month) || extractMonthFromId(sheet.id);

  const isSchoolYearMatch = (sheetYearRaw?: string) => {
    const sheetYear = normalizeText(sheetYearRaw);
    if (!sheetYear) return true;
    if (sheetYear === targetSchoolYear) return true;
    if (sheetYear.includes(targetSchoolYear) || targetSchoolYear.includes(sheetYear)) return true;

    const sheetStartYear = sheetYear.match(/\d{4}/)?.[0] || '';
    return !!(sheetStartYear && targetStartYear && sheetStartYear === targetStartYear);
  };

  const getSectionTokensForSheet = (sheet: SF2Sheet) => {
    const baseTokens = [
      normalizeSectionToken(sheet.section_id),
      normalizeSectionToken(sheet.id)
    ];
    const fromId = sheet.id?.split('_').filter(Boolean) || [];
    if (fromId.length >= 3) {
      baseTokens.push(normalizeSectionToken(fromId.slice(0, fromId.length - 2).join('_')));
    }
    return baseTokens.filter(Boolean);
  };

  const targetLRN = (student?.lrn ?? '').toString().trim().toLowerCase();

  const isSectionMatch = (sheet: SF2Sheet) => {
    if (targetLRN) {
      const attendanceKeys = Object.keys(sheet.attendance || {});
      if (attendanceKeys.some(k => k.toString().trim().toLowerCase() === targetLRN)) {
        return true;
      }
    }
    if (!targetSectionTokens.size) return true;
    const sheetTokens = getSectionTokensForSheet(sheet);
    if (!sheetTokens.length) return false;

    return sheetTokens.some(sheetToken => {
      for (const targetToken of targetSectionTokens) {
        if (!targetToken) continue;
        if (sheetToken === targetToken) return true;
        if (sheetToken.includes(targetToken) || targetToken.includes(sheetToken)) return true;
      }
      return false;
    });
  };

  const getSheetDataScore = (sheet: SF2Sheet) => {
    const dateLabelCount = Object.values(sheet.date_labels || {}).filter(v => String(v || '').trim() !== '').length;
    const attendanceCount = Object.keys(sheet.attendance || {}).length;
    return dateLabelCount * 100 + attendanceCount;
  };

  const sf2MonthlySheetMap = new Map<string, SF2Sheet>();
  sf2Sheets.forEach(sheet => {
    const sheetMonth = getSheetMonth(sheet);
    if (!sheetMonth) return;
    if (!months.includes(sheetMonth)) return;
    if (!isSectionMatch(sheet)) return;
    if (!isSchoolYearMatch(sheet.school_year)) return;

    const existing = sf2MonthlySheetMap.get(sheetMonth);
    if (!existing) {
      sf2MonthlySheetMap.set(sheetMonth, sheet);
      return;
    }

    const existingScore = getSheetDataScore(existing);
    const currentScore = getSheetDataScore(sheet);
    if (currentScore > existingScore) {
      sf2MonthlySheetMap.set(sheetMonth, sheet);
      return;
    }

    if (currentScore === existingScore) {
      const existingUpdatedAt = Date.parse(existing.updated_at || '') || 0;
      const currentUpdatedAt = Date.parse(sheet.updated_at || '') || 0;
      if (currentUpdatedAt >= existingUpdatedAt) {
        sf2MonthlySheetMap.set(sheetMonth, sheet);
      }
    }
  });

  const studentDailyRecords = (attendanceRecords || []).filter(r => 
    (r?.student_lrn ?? '').toString().trim().toLowerCase() === targetLRN
  );

  const monthIndexMap: Record<string, number> = {
    JANUARY: 0, FEBRUARY: 1, MARCH: 2, APRIL: 3, MAY: 4, JUNE: 5,
    JULY: 6, AUGUST: 7, SEPTEMBER: 8, OCTOBER: 9, NOVEMBER: 10, DECEMBER: 11
  };

  const isAbsentStatus = (st?: string | number) => {
    if (st == null) return false;
    const s = st.toString().toLowerCase().trim();
    return s === 'absent' || s === 'excused' || s === 'x' || s === 'a' || s === 'abs' || s === 'ab' || s === 'unexcused';
  };

  months.forEach(month => {
    const sheet = sf2MonthlySheetMap.get(month);
    const monthIdx = monthIndexMap[month];

    const dailyRecordsForMonth = studentDailyRecords.filter(r => {
      if (!r.date) return false;
      const parts = r.date.split('-');
      if (parts.length === 3) {
        const mNum = parseInt(parts[1], 10) - 1;
        return mNum === monthIdx;
      }
      const d = new Date(r.date);
      return !isNaN(d.getTime()) && d.getMonth() === monthIdx;
    });

    if (sheet) {
      const dateLabels = sheet.date_labels || {};
      const attendanceKeys = Object.keys(sheet.attendance || {});
      const matchedKey = attendanceKeys.find(k => k.toString().trim().toLowerCase() === targetLRN);
      const studentAttendance = matchedKey ? sheet.attendance[matchedKey] : {};
      
      let mAbsent = 0;
      let mFilled = 0;

      const dayKeys = Object.keys(dateLabels);
      if (dayKeys.length > 0) {
        dayKeys.forEach(dayKey => {
          const labelRaw = (dateLabels as Record<string, string | number>)[dayKey];
          if (labelRaw && labelRaw.toString().trim() !== '') {
            mFilled++;
            const dayNumStr = labelRaw.toString().trim();
            const dayNum = Number(dayNumStr);
            const paddedDay = !isNaN(dayNum) ? String(dayNum).padStart(2, '0') : dayNumStr;

            const attRecord = studentAttendance as Record<string, string | number>;
            let status: string | number | undefined = attRecord[`date_${dayNumStr}`]
              ?? attRecord[`date_${paddedDay}`]
              ?? attRecord[dayNumStr]
              ?? attRecord[paddedDay]
              ?? attRecord[dayKey];

            if (!isAbsentStatus(status) && !isNaN(dayNum)) {
              const dailyRec = dailyRecordsForMonth.find(r => {
                const dayOfRec = parseInt(r.date.split('-')[2] || '0', 10) || new Date(r.date).getDate();
                return dayOfRec === dayNum;
              });
              if (dailyRec && isAbsentStatus(dailyRec.status)) {
                status = dailyRec.status;
              }
            }

            if (isAbsentStatus(status)) {
              mAbsent++;
            }
          }
        });
      } else {
        const sf2Absents = Object.values(studentAttendance).filter(isAbsentStatus).length;
        const dailyAbsents = dailyRecordsForMonth.filter(r => isAbsentStatus(r.status)).length;
        mAbsent = Math.max(sf2Absents, dailyAbsents);
        mFilled = getFallbackSchoolDays(month);
      }
      
      schoolDays.push(mFilled);
      daysAbsent.push(mAbsent);
      daysPresent.push(Math.max(0, mFilled - mAbsent));
    } else {
      const fallbackDays = getFallbackSchoolDays(month);
      const dailyAbsents = dailyRecordsForMonth.filter(r => isAbsentStatus(r.status)).length;

      schoolDays.push(fallbackDays);
      daysAbsent.push(dailyAbsents);
      daysPresent.push(Math.max(0, fallbackDays - dailyAbsents));
    }
  });

  const sumFilter = (arr: number[]) => arr.filter(v => v >= 0).reduce((a, b) => a + b, 0);
  const hasAnyData = schoolDays.some(v => v >= 0);

  const totalSchoolDays = hasAnyData ? sumFilter(schoolDays) : -1;
  const totalPresent = hasAnyData ? sumFilter(daysPresent) : -1;
  const totalAbsent = hasAnyData ? sumFilter(daysAbsent) : -1;

  return {
    months: [...months.map(m => m.substring(0, 3)), 'TOTAL'],
    schoolDays: [...schoolDays, totalSchoolDays],
    daysPresent: [...daysPresent, totalPresent],
    daysAbsent: [...daysAbsent, totalAbsent]
  };
}
