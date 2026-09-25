/**
 * FormEase Pro — Master Excel Backup Service
 * 
 * Generates an all-in-one, beautifully styled, human-readable multi-tab Excel (.xlsx) workbook
 * containing the entire school database. Enables teachers, coordinators, and administrators
 * to inspect, print, and audit their complete records directly in Microsoft Excel or Google Sheets.
 */

import ExcelJS from 'exceljs';
import type { ComprehensiveBackup } from '../utils/backup-restore';

const THEME_PRIMARY_NAVY = '1B365D';
const THEME_HEADER_FILL = '204070';
const THEME_ZEBRA_LIGHT = 'F8FAFC';
const THEME_BORDER_LIGHT = 'E2E8F0';

/**
 * Apply standard corporate DepEd styling to a worksheet's header and data rows
 */
function applyWorksheetStyling(ws: ExcelJS.Worksheet): void {
  // Freeze top row
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

  // Style Header Row (Row 1)
  const headerRow = ws.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell({ includeEmpty: false }, (cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: THEME_HEADER_FILL }
    };
    cell.font = {
      name: 'Segoe UI',
      size: 10,
      bold: true,
      color: { argb: 'FFFFFF' }
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true
    };
    cell.border = {
      top: { style: 'thin', color: { argb: THEME_PRIMARY_NAVY } },
      left: { style: 'thin', color: { argb: THEME_PRIMARY_NAVY } },
      bottom: { style: 'medium', color: { argb: THEME_PRIMARY_NAVY } },
      right: { style: 'thin', color: { argb: THEME_PRIMARY_NAVY } }
    };
  });

  // Style Data Rows
  for (let rowIdx = 2; rowIdx <= ws.rowCount; rowIdx++) {
    const row = ws.getRow(rowIdx);
    row.height = 20;
    const isEven = rowIdx % 2 === 0;

    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = {
        name: 'Segoe UI',
        size: 9.5,
        color: { argb: '1E293B' }
      };
      cell.border = {
        top: { style: 'hair', color: { argb: THEME_BORDER_LIGHT } },
        left: { style: 'hair', color: { argb: THEME_BORDER_LIGHT } },
        bottom: { style: 'hair', color: { argb: THEME_BORDER_LIGHT } },
        right: { style: 'hair', color: { argb: THEME_BORDER_LIGHT } }
      };
      if (isEven) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: THEME_ZEBRA_LIGHT }
        };
      }
      if (!cell.alignment) {
        cell.alignment = { vertical: 'middle' };
      }
    });
  }

  // Auto-fit column widths
  ws.columns.forEach((col) => {
    let maxLen = 12;
    if (col.header) {
      maxLen = Math.max(maxLen, String(col.header).length + 4);
    }
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const cellLen = cell.value ? String(cell.value).length : 0;
      if (cellLen > maxLen) {
        maxLen = cellLen;
      }
    });
    col.width = Math.min(Math.max(maxLen + 2, 12), 45);
  });
}

interface FlexibleSchoolProfile {
  name?: string;
  school_id?: string;
  schoolId?: string;
  region?: string;
  division?: string;
  district?: string;
  head_name?: string;
  headName?: string;
  head_title?: string;
  headTitle?: string;
}

interface FlexibleSubjectItem {
  id?: string;
  subject_name?: string;
  name?: string;
  code?: string;
  subject_code?: string;
  grade_level?: string | number;
  gradeLevel?: string | number;
}

interface FlexibleClassRecordItem {
  student_lrn?: string;
  studentLrn?: string;
  school_year?: string;
  schoolYear?: string;
  quarter?: number | string;
  subject_id?: string;
  subjectId?: string;
  subject_name?: string;
  name?: string;
  section_id?: string;
  sectionId?: string;
  initial_grade?: number;
  initialGrade?: number;
  quarterly_grade?: number;
  quarterlyGrade?: number;
  final_grade?: number;
  remarks?: string;
}

interface FlexibleGradingSheetItem {
  student_lrn?: string;
  studentLrn?: string;
  school_year?: string;
  schoolYear?: string;
  quarter?: number | string;
  subject_id?: string;
  subjectId?: string;
  subject_name?: string;
  name?: string;
  section_id?: string;
  sectionId?: string;
  quarterly_grade?: number;
  quarterlyGrade?: number;
  final_grade?: number;
}

interface FlexibleAttendanceItem {
  id?: string;
  student_lrn?: string;
  studentLrn?: string;
  section_id?: string;
  sectionId?: string;
  school_year?: string;
  schoolYear?: string;
  month?: string;
  date?: string;
  days_present?: number;
  daysPresent?: number;
  days_absent?: number;
  daysAbsent?: number;
  remarks?: string;
  status?: string;
}

interface FlexibleObservedValueItem {
  student_lrn?: string;
  studentLrn?: string;
  section_id?: string;
  sectionId?: string;
  school_year?: string;
  schoolYear?: string;
  quarter?: number | string;
  term?: number | string;
  core_value?: string;
  coreValue?: string;
  trait?: string;
  marking?: string;
  rating?: string;
}

export type MasterBackupDataInput = ComprehensiveBackup | ComprehensiveBackup['payload'] | Record<string, unknown>;

function extractPayload(input: MasterBackupDataInput): ComprehensiveBackup['payload'] {
  if (input && typeof input === 'object') {
    if ('payload' in input && input.payload) {
      return input.payload as ComprehensiveBackup['payload'];
    }
  }
  return input as ComprehensiveBackup['payload'];
}

/**
 * Generate Master Excel Backup Workbook with all database entities
 */
export async function generateMasterExcelWorkbook(input: MasterBackupDataInput): Promise<ExcelJS.Workbook> {
  const payload = extractPayload(input);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'FormEase Pro';
  wb.lastModifiedBy = 'FormEase Pro Safe Backup';
  wb.created = new Date();
  wb.modified = new Date();

  // -------------------------------------------------------------
  // 1. OVERVIEW & SCHOOL PROFILE TAB
  // -------------------------------------------------------------
  const wsOverview = wb.addWorksheet('Overview & Summary', { properties: { tabColor: { argb: THEME_PRIMARY_NAVY } } });
  wsOverview.columns = [
    { header: 'Property / Metric', key: 'metric', width: 32 },
    { header: 'Current System Value', key: 'val', width: 45 },
    { header: 'Category / Note', key: 'note', width: 30 }
  ];

  const profile = (payload.schoolProfile || {}) as FlexibleSchoolProfile;
  const overviewRows = [
    { metric: 'School Name', val: profile.name || 'Not Configured', note: 'School Profile' },
    { metric: 'School ID', val: profile.school_id || '', note: 'DepEd Official Identifier' },
    { metric: 'Region', val: profile.region || '', note: 'Administrative Region' },
    { metric: 'Division', val: profile.division || '', note: 'Schools Division' },
    { metric: 'District', val: profile.district || '', note: 'District' },
    { metric: 'School Head / Principal', val: profile.head_name || '', note: 'Authorized Signatory' },
    { metric: 'School Head Position/Designation', val: profile.head_title || profile.headTitle || 'Principal', note: 'Signatory Title' },
    { metric: 'Active School Year', val: payload.activeSchoolYear || 'Unknown', note: 'Current Academic Term' },
    { metric: 'Export Timestamp', val: new Date().toLocaleString(), note: 'System Snapshot Time' },
    { metric: 'Application Version', val: `FormEase Pro v${typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'unknown'}`, note: 'Engine Release' },
    { metric: 'Snapshot ID', val: (input && typeof input === 'object' && 'metadata' in input ? (input as ComprehensiveBackup).metadata.snapshotId : '') || '', note: 'Match this ID to the paired recovery file' },
    { metric: 'Total Enrolled Learners', val: (payload.students || []).length, note: 'Database Record Count' },
    { metric: 'Total Class Sections', val: (payload.sections || []).length, note: 'Database Record Count' },
    { metric: 'Total Curriculum Subjects', val: (payload.subjects || []).length, note: 'Database Record Count' },
    { metric: 'Total Class Record (Quarterly) Entries', val: (payload.classRecords || []).length, note: 'Academic Records' },
    { metric: 'Total Consolidated Grade Records', val: (payload.gradingSheetRecords || []).length, note: 'Summary Sheets' },
    { metric: 'Total Teacher Observations & Remarks', val: (payload.observedValues || []).length, note: 'SF9 Core Values' },
    { metric: 'Total Daily Attendance Records', val: (payload.attendanceRecords || []).length, note: 'SF2 Tracking' },
    { metric: 'Total User Accounts', val: (payload.users || []).length, note: 'Security & Personnel' }
  ];
  overviewRows.forEach(r => wsOverview.addRow(r));
  applyWorksheetStyling(wsOverview);

  // -------------------------------------------------------------
  // 2. LEARNERS (STUDENTS) TAB
  // -------------------------------------------------------------
  const wsStudents = wb.addWorksheet('Learners Directory', { properties: { tabColor: { argb: '0284C7' } } });
  wsStudents.columns = [
    { header: 'Learner LRN', key: 'lrn', width: 16 },
    { header: 'Last Name', key: 'last_name', width: 18 },
    { header: 'First Name', key: 'first_name', width: 18 },
    { header: 'Middle Name', key: 'middle_name', width: 16 },
    { header: 'Extension', key: 'name_extension', width: 10 },
    { header: 'Gender', key: 'gender', width: 10 },
    { header: 'Birthdate', key: 'birthday', width: 14 },
    { header: 'Age', key: 'age', width: 8 },
    { header: 'Grade Level', key: 'grade_level', width: 14 },
    { header: 'Assigned Section', key: 'student_section', width: 22 },
    { header: 'Track', key: 'track', width: 14 },
    { header: 'Strand', key: 'strand', width: 14 },
    { header: 'Contact Number', key: 'contact_number', width: 16 },
    { header: 'Residential Address', key: 'address', width: 35 },
    { header: 'Parent / Guardian', key: 'parent_name', width: 24 },
    { header: 'Parent Contact', key: 'parent_contact', width: 16 },
    { header: '4Ps Beneficiary', key: 'is_4ps', width: 14 }
  ];

  (payload.students || []).forEach(s => {
    wsStudents.addRow({
      lrn: s.lrn,
      last_name: s.last_name || '',
      first_name: s.first_name || '',
      middle_name: s.middle_name || '',
      name_extension: s.name_extension || '',
      gender: s.gender || '',
      birthday: s.birthday || '',
      age: s.age ?? '',
      grade_level: s.grade_level || '',
      student_section: s.student_section || '',
      track: s.track || '',
      strand: s.strand || '',
      contact_number: s.contact_number || '',
      address: s.address || '',
      parent_name: s.parent_name || s.guardian_name || '',
      parent_contact: s.parent_contact || s.parent_guardian_contact || '',
      is_4ps: s.is_4ps ? 'Yes' : 'No'
    });
  });
  applyWorksheetStyling(wsStudents);

  // -------------------------------------------------------------
  // 3. SECTIONS TAB
  // -------------------------------------------------------------
  const wsSections = wb.addWorksheet('Sections & Programs', { properties: { tabColor: { argb: '0D9488' } } });
  wsSections.columns = [
    { header: 'Section ID', key: 'id', width: 16 },
    { header: 'Section Name', key: 'section_name', width: 25 },
    { header: 'Grade Level', key: 'section_grade_level', width: 14 },
    { header: 'Special Program', key: 'program', width: 16 },
    { header: 'Curriculum Type', key: 'curriculum_type', width: 16 },
    { header: 'Class Adviser', key: 'adviser_name', width: 25 },
    { header: 'Track / Strand', key: 'track_strand', width: 20 },
    { header: 'Taught Subjects Count', key: 'taught_count', width: 18 }
  ];

  (payload.sections || []).forEach(sec => {
    wsSections.addRow({
      id: sec.id,
      section_name: sec.section_name || '',
      section_grade_level: sec.section_grade_level || '',
      program: sec.program || 'Regular',
      curriculum_type: sec.curriculum_type || 'MATATAG',
      adviser_name: sec.adviser_name || '',
      track_strand: sec.strand ? `${sec.track || ''} - ${sec.strand}` : (sec.track || ''),
      taught_count: (sec.taught_subjects || []).length
    });
  });
  applyWorksheetStyling(wsSections);

  // -------------------------------------------------------------
  // 4. SUBJECTS TAB
  // -------------------------------------------------------------
  const wsSubjects = wb.addWorksheet('Subjects Directory', { properties: { tabColor: { argb: '4F46E5' } } });
  wsSubjects.columns = [
    { header: 'Subject ID', key: 'id', width: 16 },
    { header: 'Grade Level', key: 'grade_level', width: 14 },
    { header: 'Subject Code', key: 'subject_code', width: 16 },
    { header: 'Official Subject Name', key: 'subject_name', width: 35 },
    { header: 'Special Program', key: 'is_special_program', width: 16 },
    { header: 'Program Type', key: 'program_type', width: 16 },
    { header: 'Written Work %', key: 'written_weight', width: 15 },
    { header: 'Performance Task %', key: 'performance_weight', width: 18 },
    { header: 'Quarterly Exam %', key: 'exam_weight', width: 16 },
    { header: 'Counts in Gen Ave', key: 'counts_in_general_average', width: 16 }
  ];

  (payload.subjects || []).forEach(sub => {
    wsSubjects.addRow({
      id: sub.id,
      grade_level: sub.grade_level || '',
      subject_code: sub.subject_code || '',
      subject_name: sub.subject_name || '',
      is_special_program: sub.is_special_program ? 'Yes' : 'No',
      program_type: sub.program_type || '',
      written_weight: sub.written_weight !== undefined ? `${sub.written_weight}%` : 'Default',
      performance_weight: sub.performance_weight !== undefined ? `${sub.performance_weight}%` : 'Default',
      exam_weight: sub.exam_weight !== undefined ? `${sub.exam_weight}%` : 'Default',
      counts_in_general_average: sub.counts_in_general_average === false ? 'No' : 'Yes'
    });
  });
  applyWorksheetStyling(wsSubjects);

  // -------------------------------------------------------------
  // 5. SUBJECT CLASS RECORDS (GRADES) TAB
  // -------------------------------------------------------------
  const wsClassRecords = wb.addWorksheet('Subject Class Records', { properties: { tabColor: { argb: '2563EB' } } });
  wsClassRecords.columns = [
    { header: 'Student LRN', key: 'student_lrn', width: 16 },
    { header: 'School Year', key: 'school_year', width: 14 },
    { header: 'Quarter / Term', key: 'quarter', width: 14 },
    { header: 'Subject ID', key: 'subject_id', width: 16 },
    { header: 'Subject Name', key: 'subject_name', width: 30 },
    { header: 'Section ID', key: 'section_id', width: 16 },
    { header: 'Initial Grade', key: 'initial_grade', width: 14 },
    { header: 'Quarterly Grade', key: 'quarterly_grade', width: 16 },
    { header: 'Remarks', key: 'remarks', width: 16 }
  ];

  // Map student and subject lookups for enriched display
  const subMap = new Map(((payload.subjects || []) as FlexibleSubjectItem[]).map((s) => [s.id, s.subject_name || s.name || s.code]));

  ((payload.classRecords || []) as FlexibleClassRecordItem[]).forEach((cr) => {
    wsClassRecords.addRow({
      student_lrn: cr.student_lrn || cr.studentLrn || '',
      school_year: cr.school_year || cr.schoolYear || '',
      quarter: `Q${cr.quarter}`,
      subject_id: cr.subject_id || cr.subjectId || '',
      subject_name: cr.subject_name || cr.name || subMap.get(cr.subject_id || cr.subjectId) || '',
      section_id: cr.section_id || cr.sectionId || '',
      initial_grade: cr.initial_grade !== undefined ? cr.initial_grade : (cr.initialGrade !== undefined ? cr.initialGrade : ''),
      quarterly_grade: cr.quarterly_grade !== undefined ? cr.quarterly_grade : (cr.quarterlyGrade ?? cr.final_grade ?? ''),
      remarks: cr.remarks || ''
    });
  });
  applyWorksheetStyling(wsClassRecords);

  // Preserve each raw assessment value and its matching HPS in a reviewable table.
  const wsAssessments = wb.addWorksheet('Raw Assessment Scores', { properties: { tabColor: { argb: '7C3AED' } } });
  wsAssessments.columns = [
    { header: 'Record ID', key: 'record_id', width: 22 },
    { header: 'Student LRN', key: 'student_lrn', width: 16 },
    { header: 'Section ID', key: 'section_id', width: 18 },
    { header: 'School Year', key: 'school_year', width: 14 },
    { header: 'Term', key: 'term', width: 10 },
    { header: 'Subject ID', key: 'subject_id', width: 18 },
    { header: 'Assessment Group', key: 'group', width: 22 },
    { header: 'Assessment Number', key: 'assessment_number', width: 18 },
    { header: 'Score', key: 'score', width: 14 },
    { header: 'Highest Possible Score', key: 'hps', width: 24 },
  ];
  const hpsRecords = (payload.hpsRecords || []) as Array<{
    subject_id?: string; section_id?: string; school_year?: string; quarter?: number | string;
    written_works?: Array<number | string>; performance_tasks?: Array<number | string>; quarterly_exam?: number | string;
  }>;
  const matchHps = (record: FlexibleClassRecordItem, group: string, index: number): number | string => {
    const hps = hpsRecords.find(item => item.subject_id === (record.subject_id || record.subjectId) &&
      item.school_year === (record.school_year || record.schoolYear) && String(item.quarter) === String(record.quarter) &&
      (!item.section_id || item.section_id === (record.section_id || record.sectionId)));
    if (!hps) return '';
    if (group === 'Written Work') return hps.written_works?.[index] ?? '';
    if (group === 'Performance Task') return hps.performance_tasks?.[index] ?? '';
    return hps.quarterly_exam ?? '';
  };
  ((payload.classRecords || []) as Array<FlexibleClassRecordItem & {
    id?: string; written_works?: Array<number | string>; performance_tasks?: Array<number | string>; quarterly_exam?: number | string;
  }>).forEach(record => {
    const base = {
      record_id: record.id || '', student_lrn: record.student_lrn || record.studentLrn || '',
      section_id: record.section_id || record.sectionId || '', school_year: record.school_year || record.schoolYear || '',
      term: record.quarter || '', subject_id: record.subject_id || record.subjectId || '',
    };
    for (const [group, scores] of [['Written Work', record.written_works || []], ['Performance Task', record.performance_tasks || []]] as const) {
      scores.forEach((score, index) => wsAssessments.addRow({ ...base, group, assessment_number: index + 1, score, hps: matchHps(record, group, index) }));
    }
    wsAssessments.addRow({ ...base, group: 'Quarterly Exam', assessment_number: 1, score: record.quarterly_exam ?? '', hps: matchHps(record, 'Quarterly Exam', 0) });
  });
  applyWorksheetStyling(wsAssessments);

  // -------------------------------------------------------------
  // 6. CONSOLIDATED MASTER GRADING RECORDS TAB
  // -------------------------------------------------------------
  const wsConsolidated = wb.addWorksheet('Consolidated Grades', { properties: { tabColor: { argb: '16A34A' } } });
  wsConsolidated.columns = [
    { header: 'Student LRN', key: 'student_lrn', width: 16 },
    { header: 'School Year', key: 'school_year', width: 14 },
    { header: 'Quarter / Term', key: 'quarter', width: 14 },
    { header: 'Subject ID', key: 'subject_id', width: 16 },
    { header: 'Subject Name', key: 'subject_name', width: 30 },
    { header: 'Section ID', key: 'section_id', width: 16 },
    { header: 'Final / Transmuted Grade', key: 'quarterly_grade', width: 22 }
  ];

  ((payload.gradingSheetRecords || []) as FlexibleGradingSheetItem[]).forEach((gsr) => {
    wsConsolidated.addRow({
      student_lrn: gsr.student_lrn || gsr.studentLrn || '',
      school_year: gsr.school_year || gsr.schoolYear || '',
      quarter: `Q${gsr.quarter}`,
      subject_id: gsr.subject_id || gsr.subjectId || '',
      subject_name: gsr.subject_name || gsr.name || subMap.get(gsr.subject_id || gsr.subjectId) || '',
      section_id: gsr.section_id || gsr.sectionId || '',
      quarterly_grade: gsr.quarterly_grade !== undefined ? gsr.quarterly_grade : (gsr.quarterlyGrade ?? gsr.final_grade ?? '')
    });
  });
  applyWorksheetStyling(wsConsolidated);

  // -------------------------------------------------------------
  // 7. SF10 OVERRIDES & REMARKS TAB
  // -------------------------------------------------------------
  const wsSF10 = wb.addWorksheet('SF10 Overrides & Remarks', { properties: { tabColor: { argb: 'D97706' } } });
  wsSF10.columns = [
    { header: 'Student LRN', key: 'lrn', width: 16 },
    { header: 'SF10 Sheet', key: 'sheet', width: 14 },
    { header: 'Cell / Attribute Key', key: 'cell', width: 25 },
    { header: 'Custom Value / Override', key: 'value', width: 35 },
    { header: 'Note / Classification', key: 'note', width: 25 }
  ];

  const sf10Raw = payload.localStorageData?.['sf10-storage'];
  if (sf10Raw) {
    try {
      const parsed = JSON.parse(sf10Raw);
      const overrides = parsed?.state?.overrides || parsed?.overrides || {};
      
      Object.entries(overrides).forEach(([storageKey, cellMap]) => {
        const [lrn, sheet] = storageKey.split('_');
        if (cellMap && typeof cellMap === 'object') {
          Object.entries(cellMap as Record<string, string>).forEach(([cellRef, val]) => {
            let note = 'Direct Cell Override';
            if (val === 'PASSED' || val === 'FAILED') note = 'SF10 Subject Remark';
            if (val === 'PROMOTED' || val === 'RETAINED') note = 'General Average Action';
            if (cellRef.toLowerCase().includes('sub') || cellRef.toLowerCase().includes('name')) note = 'Curriculum Custom Subject';

            wsSF10.addRow({
              lrn: lrn || '',
              sheet: sheet || 'Front',
              cell: cellRef,
              value: val,
              note
            });
          });
        }
      });
    } catch (e) {
      wsSF10.addRow({ lrn: 'Error', sheet: '', cell: '', value: 'Corrupted SF10 data block', note: String(e) });
    }
  }
  applyWorksheetStyling(wsSF10);

  // -------------------------------------------------------------
  // 8. ATTENDANCE TAB
  // -------------------------------------------------------------
  const wsAttendance = wb.addWorksheet('Attendance Summary', { properties: { tabColor: { argb: 'EA580C' } } });
  wsAttendance.columns = [
    { header: 'Record ID', key: 'id', width: 20 },
    { header: 'Student LRN', key: 'student_lrn', width: 16 },
    { header: 'Section ID', key: 'section_id', width: 16 },
    { header: 'School Year', key: 'school_year', width: 14 },
    { header: 'Month', key: 'month', width: 14 },
    { header: 'Days Present', key: 'days_present', width: 14 },
    { header: 'Days Absent', key: 'days_absent', width: 14 },
    { header: 'Remarks', key: 'remarks', width: 20 }
  ];

  ((payload.attendanceRecords || []) as FlexibleAttendanceItem[]).forEach((ar) => {
    wsAttendance.addRow({
      id: ar.id || '',
      student_lrn: ar.student_lrn || ar.studentLrn || '',
      section_id: ar.section_id || ar.sectionId || '',
      school_year: ar.school_year || ar.schoolYear || '',
      month: ar.month || ar.date || '',
      days_present: ar.days_present ?? ar.daysPresent ?? '',
      days_absent: ar.days_absent ?? ar.daysAbsent ?? '',
      remarks: ar.remarks || ar.status || ''
    });
  });
  applyWorksheetStyling(wsAttendance);

  // -------------------------------------------------------------
  // 9. OBSERVED VALUES & CORE VALUES TAB
  // -------------------------------------------------------------
  const wsObserved = wb.addWorksheet('Observed Values', { properties: { tabColor: { argb: '9333EA' } } });
  wsObserved.columns = [
    { header: 'Student LRN', key: 'student_lrn', width: 16 },
    { header: 'Section ID', key: 'section_id', width: 16 },
    { header: 'School Year', key: 'school_year', width: 14 },
    { header: 'Quarter / Term', key: 'quarter', width: 14 },
    { header: 'Core Value', key: 'core_value', width: 25 },
    { header: 'Marking (AO/SO/RO/NO)', key: 'marking', width: 22 }
  ];

  ((payload.observedValues || []) as FlexibleObservedValueItem[]).forEach((ov) => {
    wsObserved.addRow({
      student_lrn: ov.student_lrn || ov.studentLrn || '',
      section_id: ov.section_id || ov.sectionId || '',
      school_year: ov.school_year || ov.schoolYear || '',
      quarter: `Q${ov.quarter || ov.term || 1}`,
      core_value: ov.core_value || ov.coreValue || ov.trait || '',
      marking: ov.marking || ov.rating || ''
    });
  });
  applyWorksheetStyling(wsObserved);

  return wb;
}

/**
 * Generate Master Excel Backup buffer
 */
export async function getMasterExcelBackupBuffer(input: MasterBackupDataInput): Promise<Uint8Array> {
  const wb = await generateMasterExcelWorkbook(input);
  const buffer = await wb.xlsx.writeBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}

/**
 * Trigger immediate browser download of the Master Excel Backup
 */
export async function downloadMasterExcelBackup(
  input: MasterBackupDataInput,
  filename?: string
): Promise<void> {
  const payload = extractPayload(input);
  const bytes = await getMasterExcelBackupBuffer(payload);
  const blob = new Blob([bytes as unknown as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  link.href = url;
  link.download = filename || `FormEase_Master_Database_Backup_${payload.activeSchoolYear || dateStr}_${dateStr}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
