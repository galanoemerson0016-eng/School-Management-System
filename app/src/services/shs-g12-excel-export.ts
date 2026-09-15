/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Senior High School Grade 12 Electronic Class Record (ECR) Excel Export Service
 *
 * Implements official DepEd Electronic Class Record for Grade 12 of the existing
 * K to 12 Curriculum pursuant to DepEd Order No. 8, series of 2015 and
 * DepEd Order No. 13, series of 2025.
 *
 * Directly populates the official template:
 * "public/templates/SHS E-Class Record SY 2026-2027.xlsx"
 */

import JSZip from 'jszip';
import type { SchoolProfile, Section, Subject, Student, ClassRecord, HPSRecord } from '../types';
import { normalizeRegionForECR } from './ecr-excel-export';
import { getSubjectCluster, transmuteGrade } from '../lib/grading';

export const TEMPLATE_SHS_G12 = 'SHS E-Class Record SY 2026-2027.xlsx';
export const TEMPLATE_SHS_G12_LEGACY = 'ECR_3Term - SHS G12 - SY2026-2027.xlsx';
export const TEMPLATE_SHS_G12_UPDATED = 'ECR_3Term - SHS G12 - SY2026-2027 - Updated_2.xlsx';
export type SHSG12TemplateLayout = 'legacy' | 'updated';

const MAX_STUDENTS_PER_GENDER = 50;
const _G12_WW_COUNT = 10;
const _G12_PT_COUNT = 10;

export interface SHSG12ExportOptions {
  schoolProfile: SchoolProfile | null;
  schoolYear: string;
  section: Section;
  subject: Subject;
  students: Student[];
  classRecords: ClassRecord[];
  hpsRecords: HPSRecord[];
  teacherName?: string;
  track?: string;
  termBlock?: string;
  numTerms?: number;
  templateLayout?: SHSG12TemplateLayout;
}

export interface SHSG12TermsConfig {
  numTerms: number;
  termBlock: string;
  termDesc: string;
  code: number;
}

export interface SHSG12StudentTermScores {
  wwTotal: number | '';
  wwPs: number | '';
  wwWs: number | '';
  ptTotal: number | '';
  ptPs: number | '';
  ptWs: number | '';
  tePs: number | '';
  teWs: number | '';
  initialGrade: number | '';
  termGrade: number | '';
}

/**
 * Escapes XML special characters for OpenXML text content.
 */
function escapeXml(unsafe: string | number | null | undefined): string {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function colToIndex(col: string): number {
  let sum = 0;
  for (let i = 0; i < col.length; i++) {
    sum = sum * 26 + (col.charCodeAt(i) - 64);
  }
  return sum;
}

/**
 * Updates or inserts a cell in an OpenXML worksheet row while strictly preserving
 * existing cell styles (s="...") and maintaining alphabetical column order.
 */
function updateOrInsertCell(
  rowXml: string,
  colRef: string,
  rowNum: number,
  value: string | number | null | undefined,
  isNumber = false
): string {
  const cellRef = `${colRef}${rowNum}`;
  const targetIdx = colToIndex(colRef);
  const cellRegex = new RegExp(`(<c\\s+r="${cellRef}"(?:\\s+[^>]*?)?)(?:\\/>|>([\\s\\S]*?)<\\/c>)`, 'g');

  let found = false;
  let newRowXml = rowXml.replace(cellRegex, (_match, openTag) => {
    found = true;
    const sMatch = openTag.match(/s="(\d+)"/);
    const styleAttr = sMatch ? ` s="${sMatch[1]}"` : '';
    if (value === '' || value === null || value === undefined) {
      return `<c r="${cellRef}"${styleAttr}/>`;
    }
    if (isNumber) {
      const numVal = Math.round(Number(value) * 100) / 100;
      return `<c r="${cellRef}"${styleAttr}><v>${numVal}</v></c>`;
    }
    return `<c r="${cellRef}"${styleAttr} t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
  });

  if (!found && value !== '' && value !== null && value !== undefined) {
    const cRegex = /<c\s+r="([A-Z]+)\d+"[^>]*>(?:[\s\S]*?<\/c>|\/>)/g;
    const newCellXml = isNumber 
      ? `<c r="${cellRef}"><v>${Math.round(Number(value) * 100) / 100}</v></c>` 
      : `<c r="${cellRef}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;

    const cellMatches = [...rowXml.matchAll(cRegex)];
    if (cellMatches.length === 0) {
      newRowXml = rowXml.replace('</row>', `${newCellXml}</row>`);
    } else {
      let insertPos = -1;
      for (const cm of cellMatches) {
        const cCol = cm[1];
        if (colToIndex(cCol) > targetIdx) {
          insertPos = cm.index;
          break;
        }
      }
      if (insertPos >= 0) {
        newRowXml = rowXml.slice(0, insertPos) + newCellXml + rowXml.slice(insertPos);
      } else {
        newRowXml = rowXml.replace('</row>', `${newCellXml}</row>`);
      }
    }
  }
  return newRowXml;
}

/**
 * Updates the cached value (<v>) and optional type (t="...") of a formula cell
 * while strictly preserving its formula (<f>...</f>) and style (s="...").
 */
function updateCellFormulaValue(
  rowXml: string,
  colRef: string,
  rowNum: number,
  cachedValue: string | number | null | undefined,
  cellType?: string,
  fallbackFormula?: string
): string {
  const cellRef = `${colRef}${rowNum}`;
  const cellRegex = new RegExp(`(<c\\s+r="${cellRef}"(?:\\s+[^>]*?)?)(?:\\/>|>([\\s\\S]*?)<\\/c>)`, 'g');

  return rowXml.replace(cellRegex, (_match, openTag, innerContent) => {
    const sMatch = openTag.match(/s="(\d+)"/);
    const styleAttr = sMatch ? ` s="${sMatch[1]}"` : '';

    const fMatch = (innerContent || '').match(/<f[^>]*>[\s\S]*?<\/f>|<f[^>]*\/>/);
    let formulaXml = fMatch ? fMatch[0] : '';
    if (!formulaXml && fallbackFormula) {
      formulaXml = `<f>${fallbackFormula}</f>`;
    }

    let typeAttr = '';
    if (cellType !== undefined) {
      if (cellType) {
        typeAttr = ` t="${cellType}"`;
      }
    } else {
      const tMatch = openTag.match(/\st="([^"]*)"/);
      if (tMatch && tMatch[1] !== 'e') {
        typeAttr = ` t="${tMatch[1]}"`;
      }
    }

    if (cachedValue === '' || cachedValue === null || cachedValue === undefined) {
      if (formulaXml) {
        return `<c r="${cellRef}"${styleAttr}${typeAttr}>${formulaXml}<v/></c>`;
      }
      return `<c r="${cellRef}"${styleAttr}/>`;
    }

    const valStr = String(cachedValue);
    if (formulaXml) {
      return `<c r="${cellRef}"${styleAttr}${typeAttr}>${formulaXml}<v>${escapeXml(valStr)}</v></c>`;
    }
    return `<c r="${cellRef}"${styleAttr}${typeAttr}><v>${escapeXml(valStr)}</v></c>`;
  });
}

function setCellNumber(rowXml: string, colRef: string, rowNum: number, value: number | ''): string {
  return updateOrInsertCell(rowXml, colRef, rowNum, value, true);
}

function setCellString(rowXml: string, colRef: string, rowNum: number, value: string): string {
  return updateOrInsertCell(rowXml, colRef, rowNum, value, false);
}

/**
 * Formats student full name according to DepEd Standard: LASTNAME, FIRSTNAME MIDDLENAME EXT
 */
export function formatDepEdStudentName(s: Student): string {
  const last = (s.last_name || '').trim().toUpperCase();
  const first = (s.first_name || '').trim().toUpperCase();
  const middle = (s.middle_name || '').trim().toUpperCase();
  const ext = (s.name_extension || '').trim().toUpperCase();

  let name = last ? `${last}, ${first}` : first;
  if (middle) name += ` ${middle}`;
  if (ext) name += ` ${ext}`;
  return name.trim();
}

/**
 * Normalizes start year string from School Year (e.g. "2026-2027" -> 2026).
 */
function getStartYear(schoolYear: string): number {
  const match = String(schoolYear || '').match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : 2026;
}

/**
 * Resolves the Grade 12 Track dropdown value in INPUT DATA (F29)
 * exactly matching one of the 4 official DepEd options:
 * 1. "CORE SUBJECT (ALL TRACKS)"
 * 2. "ACADEMIC TRACK (EXCEPT IMMERSION)"
 * 3. "WORK IMMERSION/ CULMINATING ACTIVITY (FOR ACADEMIC TRACK)"
 * 4. "TVL/ SPORTS/ ARTS AND DESIGN TRACK"
 */
export function resolveSHSG12Track(
  sectionTrack?: string,
  subjectName?: string,
  subjectCategory?: string
): string {
  const sName = (subjectName || '').toLowerCase().trim();
  const sTrack = (sectionTrack || '').toLowerCase().trim();
  const sCat = (subjectCategory || '').toLowerCase().trim();

  // 1. Work Immersion / Culminating Activity
  if (
    sName.includes('work immersion') ||
    sName.includes('culminating activity') ||
    sName.includes('business enterprise simulation') ||
    sName.includes('inquiries, investigations') ||
    sName.includes('inquiries investigations') ||
    sName.includes('practical research')
  ) {
    if (sTrack.includes('tvl') || sTrack.includes('techpro') || sTrack.includes('sports') || sTrack.includes('arts')) {
      return 'TVL/ SPORTS/ ARTS AND DESIGN TRACK';
    }
    return 'WORK IMMERSION/ CULMINATING ACTIVITY (FOR ACADEMIC TRACK)';
  }

  // 2. Core Subjects (All Tracks)
  const cluster = getSubjectCluster(subjectName || '', 'Grade 12', sectionTrack);
  if (cluster === 'g12_core' || sCat === 'core') {
    return 'CORE SUBJECT (ALL TRACKS)';
  }

  // 3. TVL / Sports / Arts Track
  if (
    sTrack.includes('tvl') ||
    sTrack.includes('techpro') ||
    sTrack.includes('technical') ||
    sTrack.includes('vocational') ||
    sTrack.includes('sports') ||
    sTrack.includes('arts') ||
    cluster === 'g12_tvl_all'
  ) {
    return 'TVL/ SPORTS/ ARTS AND DESIGN TRACK';
  }

  // 4. Default: Academic Track (Except Immersion)
  return 'ACADEMIC TRACK (EXCEPT IMMERSION)';
}

/**
 * Resolves component weights for Grade 12 tracks:
 * - Core: WW=25%, PT=50%, TE=25%
 * - Academic: WW=25%, PT=45%, TE=30%
 * - Work Immersion: WW=35%, PT=40%, TE=25%
 * - TVL / Sports / Arts: WW=20%, PT=60%, TE=20%
 */
export function getSHSG12TrackWeights(resolvedTrack: string): { ww: number; pt: number; te: number } {
  if (resolvedTrack === 'CORE SUBJECT (ALL TRACKS)') {
    return { ww: 0.25, pt: 0.50, te: 0.25 };
  }
  if (resolvedTrack === 'WORK IMMERSION/ CULMINATING ACTIVITY (FOR ACADEMIC TRACK)') {
    return { ww: 0.35, pt: 0.40, te: 0.25 };
  }
  if (resolvedTrack === 'TVL/ SPORTS/ ARTS AND DESIGN TRACK') {
    return { ww: 0.20, pt: 0.60, te: 0.20 };
  }
  return { ww: 0.25, pt: 0.45, te: 0.30 };
}

/**
 * Dynamically resolves the number of terms and term block configuration for a subject.
 * Accurately detects 1-term, 2-term, and 3-term subjects based on curriculum standard,
 * explicit settings, or active scores/HPS data.
 */
export function resolveSHSG12Terms(
  subject?: Subject,
  classRecords?: ClassRecord[],
  hpsRecords?: HPSRecord[],
  schoolYear?: string
): SHSG12TermsConfig {
  const norm = (subject?.subject_name || '').toLowerCase();

  // 1. Explicit subject.term (1, 2, 3)
  if (subject?.term === 1) return { numTerms: 1, termBlock: 'FIRST TERM', termDesc: '1ST', code: 11 };
  if (subject?.term === 2) return { numTerms: 1, termBlock: 'SECOND TERM', termDesc: '2ND', code: 12 };
  if (subject?.term === 3) return { numTerms: 1, termBlock: 'THIRD TERM', termDesc: '3RD', code: 13 };

  // 2. Explicit term_block / num_terms
  const explicitTermBlock = (subject as any)?.term_block;
  const explicitNumTerms = (subject as any)?.num_terms || (subject as any)?.numTerms;
  if (explicitNumTerms && explicitTermBlock) {
    const nt = Number(explicitNumTerms);
    const tb = String(explicitTermBlock).toUpperCase();
    if (nt === 1) {
      if (tb.includes('2ND') || tb.includes('SECOND') || tb.includes('TERM 2') || tb.includes('T2')) return { numTerms: 1, termBlock: 'SECOND TERM', termDesc: '2ND', code: 12 };
      if (tb.includes('3RD') || tb.includes('THIRD') || tb.includes('TERM 3') || tb.includes('T3')) return { numTerms: 1, termBlock: 'THIRD TERM', termDesc: '3RD', code: 13 };
      return { numTerms: 1, termBlock: 'FIRST TERM', termDesc: '1ST', code: 11 };
    }
    if (nt === 2) {
      if (tb.includes('2ND') || tb.includes('SECOND') || tb.includes('TERM 2') || tb.includes('T2')) return { numTerms: 2, termBlock: 'SECOND TERM', termDesc: '2ND & 3RD', code: 22 };
      return { numTerms: 2, termBlock: 'FIRST TERM', termDesc: '1ST & 2ND', code: 21 };
    }
    return { numTerms: 3, termBlock: 'FIRST TERM', termDesc: '1ST, 2ND, 3RD', code: 33 };
  }

  // 3. Detect which terms actually have class records or HPS
  const sId = subject?.id;
  const sName = subject?.subject_name;
  const cRecs = classRecords || [];
  const hRecs = hpsRecords || [];
  const sy = schoolYear || '';

  const activeTerms = [1, 2, 3].filter(t => {
    const hasHps = hRecs.some(h =>
      (h.subject_id === sId || (sName && h.subject_id === sName)) &&
      (!sy || h.school_year === sy) &&
      Number(h.quarter) === t &&
      ((h.written_works && h.written_works.some(w => w !== '' && w !== 0 && w !== null && !isNaN(Number(w)))) ||
       (h.performance_tasks && h.performance_tasks.some(p => p !== '' && p !== 0 && p !== null && !isNaN(Number(p)))))
    );
    const hasScores = cRecs.some(c =>
      (c.subject_id === sId || (sName && c.subject_id === sName)) &&
      (!sy || c.school_year === sy) &&
      Number(c.quarter) === t &&
      ((c.written_works && c.written_works.some(w => w !== '' && w !== 0 && w !== null && !isNaN(Number(w)))) ||
       (c.performance_tasks && c.performance_tasks.some(p => p !== '' && p !== 0 && p !== null && !isNaN(Number(p)))) ||
       (c.quarterly_exam !== undefined && c.quarterly_exam !== '' && c.quarterly_exam !== null))
    );
    return hasHps || hasScores;
  });

  if (activeTerms.length === 1) {
    const t = activeTerms[0];
    if (t === 2) return { numTerms: 1, termBlock: 'SECOND TERM', termDesc: '2ND', code: 12 };
    if (t === 3) return { numTerms: 1, termBlock: 'THIRD TERM', termDesc: '3RD', code: 13 };
    return { numTerms: 1, termBlock: 'FIRST TERM', termDesc: '1ST', code: 11 };
  }

  if (activeTerms.length === 2) {
    if (activeTerms.includes(2) && activeTerms.includes(3)) {
      return { numTerms: 2, termBlock: 'SECOND TERM', termDesc: '2ND & 3RD', code: 22 };
    }
    return { numTerms: 2, termBlock: 'FIRST TERM', termDesc: '1ST & 2ND', code: 21 };
  }

  if (activeTerms.length === 3) {
    return { numTerms: 3, termBlock: 'FIRST TERM', termDesc: '1ST, 2ND, 3RD', code: 33 };
  }

  // 4. Fallback based on Subject Name standard (e.g. HOPE 1..4)
  if (
    norm.includes('hope 1') || norm.includes('pe and health 1') || norm.includes('physical education and health 1') ||
    norm.includes('hope 3') || norm.includes('pe and health 3') || norm.includes('physical education and health 3')
  ) {
    return { numTerms: 1, termBlock: 'FIRST TERM', termDesc: '1ST', code: 11 };
  }
  if (
    norm.includes('hope 2') || norm.includes('pe and health 2') || norm.includes('physical education and health 2') ||
    norm.includes('hope 4') || norm.includes('pe and health 4') || norm.includes('physical education and health 4')
  ) {
    return { numTerms: 1, termBlock: 'SECOND TERM', termDesc: '2ND', code: 12 };
  }

  // If subject explicitly marked 'all'
  if (subject?.term === 'all') {
    return { numTerms: 3, termBlock: 'FIRST TERM', termDesc: '1ST, 2ND, 3RD', code: 33 };
  }

  // Default to 1 term in First Term
  return { numTerms: 1, termBlock: 'FIRST TERM', termDesc: '1ST', code: 11 };
}

/**
 * Returns the official Key Stage 4 / Grade 12 descriptor.
 */
export function getSHSG12Descriptor(grade: number | ''): string {
  if (grade === '' || grade === null || grade === undefined || isNaN(Number(grade))) return '';
  const g = Number(grade);
  if (g >= 90) return 'Advancing';
  if (g >= 80) return 'Benchmarking';
  if (g >= 75) return 'Connecting';
  if (g >= 65) return 'Developing';
  return 'Emerging';
}

/**
 * Computes live calculated scores for a student in a specific term sheet.
 */
export function computeSHSG12StudentTermScores(
  student: Student,
  termNum: number,
  classRecords: ClassRecord[],
  hpsRecord: HPSRecord | undefined,
  weights: { ww: number; pt: number; te: number },
  schoolYear: string,
  subject: Subject
): SHSG12StudentTermScores {
  const rec = classRecords.find(c =>
    c.student_lrn === student.lrn &&
    (c.subject_id === subject.id || (subject.subject_name && c.subject_id === subject.subject_name)) &&
    (!schoolYear || c.school_year === schoolYear) &&
    Number(c.quarter) === termNum
  );

  const rawHpsWW = hpsRecord?.written_works || [];
  const rawHpsPT = hpsRecord?.performance_tasks || [];
  const rawHpsQA = (hpsRecord as any)?.summative_tests || [];

  // WW HPS total
  let wwHpsTotal = 0;
  for (let i = 0; i < 5; i++) {
    const val = rawHpsWW[i];
    if (val !== '' && val !== null && val !== undefined && !isNaN(Number(val))) wwHpsTotal += Number(val);
  }
  const st1HpsVal = rawHpsWW[5] !== undefined && rawHpsWW[5] !== '' ? rawHpsWW[5] : rawHpsQA[0];
  if (st1HpsVal !== '' && st1HpsVal !== null && st1HpsVal !== undefined && !isNaN(Number(st1HpsVal))) wwHpsTotal += Number(st1HpsVal);
  const st2HpsVal = rawHpsWW[6] !== undefined && rawHpsWW[6] !== '' ? rawHpsWW[6] : rawHpsQA[1];
  if (st2HpsVal !== '' && st2HpsVal !== null && st2HpsVal !== undefined && !isNaN(Number(st2HpsVal))) wwHpsTotal += Number(st2HpsVal);
  for (let i = 7; i < 10; i++) {
    const val = rawHpsWW[i];
    if (val !== '' && val !== null && val !== undefined && !isNaN(Number(val))) wwHpsTotal += Number(val);
  }

  // PT HPS total
  let ptHpsTotal = 0;
  for (let i = 0; i < 10; i++) {
    const val = rawHpsPT[i];
    if (val !== '' && val !== null && val !== undefined && !isNaN(Number(val))) ptHpsTotal += Number(val);
  }

  // TE HPS
  const teHpsVal = rawHpsQA[2] !== undefined && rawHpsQA[2] !== '' ? rawHpsQA[2] : (hpsRecord as any)?.quarterly_exam;
  const teHps = (teHpsVal !== '' && teHpsVal !== null && teHpsVal !== undefined && !isNaN(Number(teHpsVal))) ? Number(teHpsVal) : 0;

  if (!rec) {
    return {
      wwTotal: '',
      wwPs: '',
      wwWs: '',
      ptTotal: '',
      ptPs: '',
      ptWs: '',
      tePs: '',
      teWs: '',
      initialGrade: '',
      termGrade: ''
    };
  }

  const recWW = rec.written_works || [];
  const recPT = rec.performance_tasks || [];
  const recQA = (rec as any)?.summative_tests || [];

  // WW Student total
  let wwTotalNum = 0;
  let hasWW = false;
  for (let i = 0; i < 5; i++) {
    const s = recWW[i];
    if (s !== '' && s !== null && s !== undefined && !isNaN(Number(s))) {
      wwTotalNum += Number(s);
      hasWW = true;
    }
  }
  const st1Val = recWW[5] !== undefined && recWW[5] !== '' ? recWW[5] : recQA[0];
  if (st1Val !== '' && st1Val !== null && st1Val !== undefined && !isNaN(Number(st1Val))) {
    wwTotalNum += Number(st1Val);
    hasWW = true;
  }
  const st2Val = recWW[6] !== undefined && recWW[6] !== '' ? recWW[6] : recQA[1];
  if (st2Val !== '' && st2Val !== null && st2Val !== undefined && !isNaN(Number(st2Val))) {
    wwTotalNum += Number(st2Val);
    hasWW = true;
  }
  for (let i = 7; i < 10; i++) {
    const s = recWW[i];
    if (s !== '' && s !== null && s !== undefined && !isNaN(Number(s))) {
      wwTotalNum += Number(s);
      hasWW = true;
    }
  }
  const wwTotal = hasWW ? wwTotalNum : '';

  // PT Student total
  let ptTotalNum = 0;
  let hasPT = false;
  for (let i = 0; i < 10; i++) {
    const s = recPT[i];
    if (s !== '' && s !== null && s !== undefined && !isNaN(Number(s))) {
      ptTotalNum += Number(s);
      hasPT = true;
    }
  }
  const ptTotal = hasPT ? ptTotalNum : '';

  // TE Student score
  const teVal = (rec.quarterly_exam !== '' && rec.quarterly_exam !== undefined && rec.quarterly_exam !== null)
    ? rec.quarterly_exam
    : recQA[2];
  const teScore = (teVal !== '' && teVal !== null && teVal !== undefined && !isNaN(Number(teVal))) ? Number(teVal) : '';

  // Percentages and weighted scores
  const wwPs = (wwHpsTotal > 0 && wwTotal !== '') ? Math.round((Number(wwTotal) / wwHpsTotal) * 100 * 100) / 100 : '';
  const wwWs = wwPs !== '' ? Math.round(Number(wwPs) * weights.ww * 100) / 100 : '';

  const ptPs = (ptHpsTotal > 0 && ptTotal !== '') ? Math.round((Number(ptTotal) / ptHpsTotal) * 100 * 100) / 100 : '';
  const ptWs = ptPs !== '' ? Math.round(Number(ptPs) * weights.pt * 100) / 100 : '';

  const tePs = (teHps > 0 && teScore !== '') ? Math.round((Number(teScore) / teHps) * 100 * 100) / 100 : '';
  const teWs = tePs !== '' ? Math.round(Number(tePs) * weights.te * 100) / 100 : '';

  let initialGrade: number | '' = '';
  if (weights.te === 0) {
    if (wwWs !== '' && ptWs !== '') {
      initialGrade = Math.round((Number(wwWs) + Number(ptWs)) * 100) / 100;
    }
  } else {
    if (wwWs !== '' && ptWs !== '' && teWs !== '') {
      initialGrade = Math.round((Number(wwWs) + Number(ptWs) + Number(teWs)) * 100) / 100;
    } else if (wwWs !== '' || ptWs !== '') {
      initialGrade = Math.round(((Number(wwWs) || 0) + (Number(ptWs) || 0) + (Number(teWs) || 0)) * 100) / 100;
    }
  }

  const termGrade = initialGrade !== '' ? transmuteGrade(Number(initialGrade), schoolYear) : '';

  return {
    wwTotal,
    wwPs,
    wwWs,
    ptTotal,
    ptPs,
    ptWs,
    tePs,
    teWs,
    initialGrade,
    termGrade
  };
}

function isUpdatedSHSG12TermSheet(sheetXml: string): boolean {
  return /<c\s+r="AM11"/.test(sheetXml) && /<c\s+r="AD13"/.test(sheetXml);
}

function getSHSG12AssessmentScores(
  record: ClassRecord | undefined,
  hpsRecord: HPSRecord | undefined
) {
  const recordWrittenWorks = record?.written_works || [];
  const hpsWrittenWorks = hpsRecord?.written_works || [];
  const recordTests = (record as any)?.summative_tests || [];
  const hpsTests = (hpsRecord as any)?.summative_tests || [];
  const value = (primary: unknown, fallback: unknown): number | '' => {
    const candidate = primary !== '' && primary !== undefined && primary !== null ? primary : fallback;
    const numeric = Number(candidate);
    return candidate !== '' && candidate !== undefined && candidate !== null && Number.isFinite(numeric) ? numeric : '';
  };

  return {
    st1: value(recordTests[0], recordWrittenWorks[5]),
    st2: value(recordTests[1], recordWrittenWorks[6]),
    te: value(record?.quarterly_exam, value(recordTests[2], (hpsRecord as any)?.quarterly_exam)),
    st1Hps: value(hpsTests[0], hpsWrittenWorks[5]),
    st2Hps: value(hpsTests[1], hpsWrittenWorks[6]),
    teHps: value((hpsRecord as any)?.quarterly_exam, hpsTests[2]),
    hasExplicitSummativeTests: recordTests[0] !== '' && recordTests[0] !== undefined && recordTests[0] !== null
      && recordTests[1] !== '' && recordTests[1] !== undefined && recordTests[1] !== null,
  };
}

/**
 * Populates sheet2.xml (INPUT DATA) with school details, subject info, and learner rosters.
 */
export function populateSHSG12InputDataXml(
  sheetXml: string,
  options: SHSG12ExportOptions,
  resolvedTerms: SHSG12TermsConfig,
  resolvedTrack: string
): string {
  const { schoolProfile, schoolYear, section, subject, students, teacherName } = options;
  const subjectName = (subject.subject_name || '').toUpperCase();
  const sectionName = (section.section_name || '').toUpperCase();
  const startYear = getStartYear(schoolYear);
  const { numTerms, termBlock } = resolvedTerms;

  // Group and sort students
  const males = students
    .filter(s => s.gender && s.gender.trim().toLowerCase() === 'male')
    .sort((a, b) => (a.last_name || '').localeCompare(b.last_name || '') || (a.first_name || '').localeCompare(b.first_name || ''))
    .slice(0, MAX_STUDENTS_PER_GENDER);

  const females = students
    .filter(s => s.gender && s.gender.trim().toLowerCase() === 'female')
    .sort((a, b) => (a.last_name || '').localeCompare(b.last_name || '') || (a.first_name || '').localeCompare(b.first_name || ''))
    .slice(0, MAX_STUDENTS_PER_GENDER);

  let xml = sheetXml;
  const rowRegex = /<row r="(\d+)"[^>]*>[\s\S]*?<\/row>/g;

  xml = xml.replace(rowRegex, (rowXml, rStr) => {
    const r = parseInt(rStr, 10);
    let updated = rowXml;

    // School Info
    if (r === 10) updated = setCellString(updated, 'F', 10, normalizeRegionForECR(schoolProfile?.region));
    if (r === 11) updated = setCellString(updated, 'F', 11, (schoolProfile?.division || '').toUpperCase());
    if (r === 13) updated = setCellString(updated, 'F', 13, schoolProfile?.school_id || '');
    if (r === 14) updated = setCellString(updated, 'F', 14, (schoolProfile?.name || '').toUpperCase());
    if (r === 16) updated = setCellNumber(updated, 'F', 16, startYear);

    // Teacher, Grade, Section
    if (r === 22) updated = setCellString(updated, 'F', 22, (teacherName || section.adviser_name || '').toUpperCase());
    if (r === 24) updated = setCellNumber(updated, 'F', 24, 12);
    if (r === 25) updated = setCellString(updated, 'F', 25, sectionName);

    // Curriculum, Track, Subject, Terms
    if (r === 28) updated = setCellString(updated, 'F', 28, 'SHS');
    if (r === 29) updated = setCellString(updated, 'F', 29, resolvedTrack);
    if (r === 30) updated = setCellString(updated, 'F', 30, subjectName);
    if (r === 33) {
      updated = setCellNumber(updated, 'F', 33, numTerms);
      updated = setCellString(updated, 'H', 33, termBlock);
      updated = updateCellFormulaValue(updated, 'I', 33, numTerms === 3 ? 3 : (termBlock === 'FIRST TERM' ? 1 : 2), 'str');
    }
    if (r === 34) {
      updated = updateCellFormulaValue(updated, 'I', 34, resolvedTerms.code);
    }

    // Learners' Names (Rows 11 to 60)
    if (r >= 11 && r <= 60) {
      const maleIdx = r - 11;
      if (maleIdx < males.length) {
        const m = males[maleIdx];
        updated = setCellString(updated, 'N', r, m.lrn || '');
        updated = setCellString(updated, 'O', r, formatDepEdStudentName(m));
      } else {
        updated = setCellString(updated, 'N', r, '');
        updated = setCellString(updated, 'O', r, '');
      }

      const femaleIdx = r - 11;
      if (femaleIdx < females.length) {
        const f = females[femaleIdx];
        updated = setCellString(updated, 'R', r, f.lrn || '');
        updated = setCellString(updated, 'S', r, formatDepEdStudentName(f));
      } else {
        updated = setCellString(updated, 'R', r, '');
        updated = setCellString(updated, 'S', r, '');
      }
    }

    return updated;
  });

  return xml;
}

/**
 * Populates a Grade 12 Term Sheet (Term 1, Term 2, or Term 3).
 *
 * - Relocates Summative Tests 1 and 2 to Written Works 6 and 7 (WW 1..10 in D:M)
 * - PT 1..10 in Q:Z
 * - Term Exam (TE) in AD
 * - Cleans B8 `#VALUE!` error cache
 * - Pre-computes and sets HPS totals (N14, AA14), weights (D12, Q12, AD12, P14, AC14, AF14),
 *   and all student computed score cells (N, O, P, AA, AB, AC, AE, AF, AG, AH)
 */
export function populateSHSG12TermXml(
  sheetXml: string,
  termNum: number,
  options: SHSG12ExportOptions,
  resolvedTerms: SHSG12TermsConfig,
  resolvedTrack: string,
  templateLayout?: SHSG12TemplateLayout
): string {
  const { students, classRecords, hpsRecords, schoolYear, subject, section, teacherName } = options;
  const { termDesc } = resolvedTerms;
  const weights = getSHSG12TrackWeights(resolvedTrack);
  const subjectName = (subject.subject_name || '').toUpperCase();
  const sectionName = (section.section_name || '').toUpperCase();
  const teacherNameStr = (teacherName || section.adviser_name || '').toUpperCase();

  const isTermActive = 
    termNum === 1 ? termDesc.includes('1ST') :
    termNum === 2 ? termDesc.includes('2ND') :
    termDesc.includes('3RD');
  const isUpdatedTemplate = templateLayout === 'updated' || (templateLayout === undefined && isUpdatedSHSG12TermSheet(sheetXml));

  // Find HPS Record for this term
  const hpsRecord = hpsRecords.find(r =>
    (r.subject_id === subject.id || (subject.subject_name && r.subject_id === subject.subject_name)) &&
    r.school_year === schoolYear &&
    Number(r.quarter) === termNum
  );

  const rawHpsWW = hpsRecord?.written_works || [];
  const rawHpsPT = hpsRecord?.performance_tasks || [];
  const rawHpsQA = (hpsRecord as any)?.summative_tests || [];
  const hasExplicitHpsSummativeTests = rawHpsQA[0] !== '' && rawHpsQA[0] !== undefined && rawHpsQA[0] !== null
    && rawHpsQA[1] !== '' && rawHpsQA[1] !== undefined && rawHpsQA[1] !== null;

  // Group students
  const males = students
    .filter(s => s.gender && s.gender.trim().toLowerCase() === 'male')
    .sort((a, b) => (a.last_name || '').localeCompare(b.last_name || '') || (a.first_name || '').localeCompare(b.first_name || ''))
    .slice(0, MAX_STUDENTS_PER_GENDER);

  const females = students
    .filter(s => s.gender && s.gender.trim().toLowerCase() === 'female')
    .sort((a, b) => (a.last_name || '').localeCompare(b.last_name || '') || (a.first_name || '').localeCompare(b.first_name || ''))
    .slice(0, MAX_STUDENTS_PER_GENDER);

  const wwCols = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
  const ptCols = ['Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  // Pre-calculate WW and PT HPS totals
  let wwHpsTotal = 0;
  for (let i = 0; i < 5; i++) {
    const v = rawHpsWW[i];
    if (v !== '' && v !== null && v !== undefined && !isNaN(Number(v))) wwHpsTotal += Number(v);
  }
  const st1HpsVal = rawHpsWW[5] !== undefined && rawHpsWW[5] !== '' ? rawHpsWW[5] : (isUpdatedTemplate && hasExplicitHpsSummativeTests ? '' : rawHpsQA[0]);
  if (st1HpsVal !== '' && st1HpsVal !== null && st1HpsVal !== undefined && !isNaN(Number(st1HpsVal))) wwHpsTotal += Number(st1HpsVal);
  const st2HpsVal = rawHpsWW[6] !== undefined && rawHpsWW[6] !== '' ? rawHpsWW[6] : (isUpdatedTemplate && hasExplicitHpsSummativeTests ? '' : rawHpsQA[1]);
  if (st2HpsVal !== '' && st2HpsVal !== null && st2HpsVal !== undefined && !isNaN(Number(st2HpsVal))) wwHpsTotal += Number(st2HpsVal);
  for (let i = 7; i < 10; i++) {
    const v = rawHpsWW[i];
    if (v !== '' && v !== null && v !== undefined && !isNaN(Number(v))) wwHpsTotal += Number(v);
  }

  let ptHpsTotal = 0;
  for (let i = 0; i < 10; i++) {
    const v = rawHpsPT[i];
    if (v !== '' && v !== null && v !== undefined && !isNaN(Number(v))) ptHpsTotal += Number(v);
  }

  const teHpsVal = rawHpsQA[2] !== undefined && rawHpsQA[2] !== '' ? rawHpsQA[2] : (hpsRecord as any)?.quarterly_exam;
  const teHpsNum = (teHpsVal !== '' && teHpsVal !== null && teHpsVal !== undefined && !isNaN(Number(teHpsVal))) ? Number(teHpsVal) : '';

  let xml = sheetXml;
  const rowRegex = /<row r="(\d+)"[^>]*>[\s\S]*?<\/row>/g;

  xml = xml.replace(rowRegex, (rowXml, rStr) => {
    const r = parseInt(rStr, 10);
    let updated = rowXml;

    // Row 8: Validation message (clean #VALUE! error cache)
    if (r === 8) {
      if (isTermActive) {
        updated = updateCellFormulaValue(updated, 'B', 8, '', 'str');
      } else {
        updated = updateCellFormulaValue(updated, 'B', 8, 'INCORRECT SHEET. Do not use this sheet to input data.', 'str');
      }
    }

    // Row 9: Headers
    if (r === 9) {
      updated = updateCellFormulaValue(updated, 'H', 9, isTermActive ? 12 : '', isTermActive ? '' : 'str');
      updated = updateCellFormulaValue(updated, 'N', 9, isTermActive ? sectionName : '', 'str');
      updated = updateCellFormulaValue(updated, 'U', 9, isTermActive ? subjectName : '', 'str');
    }

    // Row 10: Headers
    if (r === 10) {
      updated = updateCellFormulaValue(updated, 'H', 10, isTermActive ? teacherNameStr : '', 'str');
      updated = updateCellFormulaValue(updated, 'U', 10, isTermActive ? resolvedTrack : '', 'str');
    }

    // Row 12: Component Weights
    if (r === 12) {
      updated = updateCellFormulaValue(updated, 'D', 12, isTermActive ? weights.ww : '');
      updated = updateCellFormulaValue(updated, 'Q', 12, isTermActive ? weights.pt : '');
      updated = updateCellFormulaValue(updated, 'AD', 12, isTermActive ? weights.te : '');
    }

    // Row 14: Highest Possible Score (HPS)
    if (r === 14) {
      // Written Works 1..5
      for (let i = 0; i < 5; i++) {
        const val = rawHpsWW[i];
        const numVal = (val !== '' && val !== null && val !== undefined && !isNaN(Number(val))) ? Number(val) : '';
        updated = setCellNumber(updated, wwCols[i], 14, numVal);
      }

      // WW 6 (ST1 HPS)
      const st1Hps = (st1HpsVal !== '' && st1HpsVal !== null && st1HpsVal !== undefined && !isNaN(Number(st1HpsVal))) ? Number(st1HpsVal) : '';
      updated = setCellNumber(updated, wwCols[5], 14, st1Hps);

      // WW 7 (ST2 HPS)
      const st2Hps = (st2HpsVal !== '' && st2HpsVal !== null && st2HpsVal !== undefined && !isNaN(Number(st2HpsVal))) ? Number(st2HpsVal) : '';
      updated = setCellNumber(updated, wwCols[6], 14, st2Hps);

      // WW 8..10
      for (let i = 7; i < 10; i++) {
        const val = rawHpsWW[i];
        const numVal = (val !== '' && val !== null && val !== undefined && !isNaN(Number(val))) ? Number(val) : '';
        updated = setCellNumber(updated, wwCols[i], 14, numVal);
      }
      if (isUpdatedTemplate && !hasExplicitHpsSummativeTests) {
        updated = setCellNumber(updated, 'I', 14, '');
        updated = setCellNumber(updated, 'J', 14, '');
      }

      // WW Total & Weight
      updated = updateCellFormulaValue(updated, 'N', 14, wwHpsTotal);
      updated = updateCellFormulaValue(updated, 'P', 14, isTermActive ? weights.ww : '');

      // Performance Tasks 1..10
      for (let i = 0; i < 10; i++) {
        const val = rawHpsPT[i];
        const numVal = (val !== '' && val !== null && val !== undefined && !isNaN(Number(val))) ? Number(val) : '';
        updated = setCellNumber(updated, ptCols[i], 14, numVal);
      }

      // PT Total & Weight
      updated = updateCellFormulaValue(updated, 'AA', 14, ptHpsTotal);
      updated = updateCellFormulaValue(updated, 'AC', 14, isTermActive ? weights.pt : '');

      if (isUpdatedTemplate) {
        const revisedSt1Hps = (st1HpsVal !== '' && st1HpsVal !== null && st1HpsVal !== undefined && !isNaN(Number(st1HpsVal))) ? Number(st1HpsVal) : '';
        const revisedSt2Hps = (st2HpsVal !== '' && st2HpsVal !== null && st2HpsVal !== undefined && !isNaN(Number(st2HpsVal))) ? Number(st2HpsVal) : '';
        updated = setCellNumber(updated, 'AD', 14, revisedSt1Hps);
        updated = setCellNumber(updated, 'AE', 14, revisedSt2Hps);
        updated = setCellNumber(updated, 'AF', 14, teHpsNum);
        updated = updateCellFormulaValue(updated, 'AG', 14, isTermActive ? 30 : '');
        updated = updateCellFormulaValue(updated, 'AH', 14, isTermActive ? 30 : '');
        updated = updateCellFormulaValue(updated, 'AI', 14, isTermActive ? 40 : '');
        updated = updateCellFormulaValue(updated, 'AJ', 14, isTermActive ? 100 : '');
        updated = updateCellFormulaValue(updated, 'AK', 14, isTermActive ? weights.te : '');
      } else {
        // Legacy template: Term Exam (TE HPS) & Weight
        updated = setCellNumber(updated, 'AD', 14, teHpsNum);
        updated = updateCellFormulaValue(updated, 'AE', 14, 100);
        updated = updateCellFormulaValue(updated, 'AF', 14, isTermActive ? weights.te : '');
      }
    }

    // Male Student Scores (Rows 17 to 66)
    if (r >= 17 && r <= 66) {
      const idx = r - 17;
      if (idx < males.length) {
        const student = males[idx];
        const rec = classRecords.find(c =>
          c.student_lrn === student.lrn &&
          (c.subject_id === subject.id || (subject.subject_name && c.subject_id === subject.subject_name)) &&
          c.school_year === schoolYear &&
          Number(c.quarter) === termNum
        );

        updated = updateCellFormulaValue(updated, 'C', r, isTermActive ? formatDepEdStudentName(student) : '', 'str');

        const recWW = rec?.written_works || [];
        const recPT = rec?.performance_tasks || [];
        const recQA = (rec as any)?.summative_tests || [];
        const assessmentScores = getSHSG12AssessmentScores(rec, hpsRecord);

        // WW 1..5
        for (let i = 0; i < 5; i++) {
          const s = recWW[i];
          const num = (s !== '' && s !== null && s !== undefined && !isNaN(Number(s))) ? Number(s) : '';
          updated = setCellNumber(updated, wwCols[i], r, num);
        }

        // WW 6 (ST1)
        const st1Val = recWW[5] !== undefined && recWW[5] !== '' ? recWW[5] : (isUpdatedTemplate && assessmentScores.hasExplicitSummativeTests ? '' : recQA[0]);
        const st1Num = (st1Val !== '' && st1Val !== null && st1Val !== undefined && !isNaN(Number(st1Val))) ? Number(st1Val) : '';
        updated = setCellNumber(updated, wwCols[5], r, st1Num);

        // WW 7 (ST2)
        const st2Val = recWW[6] !== undefined && recWW[6] !== '' ? recWW[6] : (isUpdatedTemplate && assessmentScores.hasExplicitSummativeTests ? '' : recQA[1]);
        const st2Num = (st2Val !== '' && st2Val !== null && st2Val !== undefined && !isNaN(Number(st2Val))) ? Number(st2Val) : '';
        updated = setCellNumber(updated, wwCols[6], r, st2Num);

        // WW 8..10
        for (let i = 7; i < 10; i++) {
          const s = recWW[i];
          const num = (s !== '' && s !== null && s !== undefined && !isNaN(Number(s))) ? Number(s) : '';
          updated = setCellNumber(updated, wwCols[i], r, num);
        }
        // PT 1..10
        for (let i = 0; i < 10; i++) {
          const s = recPT[i];
          const num = (s !== '' && s !== null && s !== undefined && !isNaN(Number(s))) ? Number(s) : '';
          updated = setCellNumber(updated, ptCols[i], r, num);
        }

        if (isUpdatedTemplate && !assessmentScores.hasExplicitSummativeTests) {
          updated = setCellNumber(updated, 'I', r, '');
          updated = setCellNumber(updated, 'J', r, '');
        }
        if (isUpdatedTemplate) {
          updated = setCellNumber(updated, 'AD', r, assessmentScores.st1);
          updated = setCellNumber(updated, 'AE', r, assessmentScores.st2);
          updated = setCellNumber(updated, 'AF', r, assessmentScores.te);
        } else {
          const teNum = (assessmentScores.te !== '' && assessmentScores.te !== null && assessmentScores.te !== undefined && !isNaN(Number(assessmentScores.te))) ? Number(assessmentScores.te) : '';
          updated = setCellNumber(updated, 'AD', r, teNum);
        }

        // Computed live score values
        if (isTermActive) {
          const scores = computeSHSG12StudentTermScores(student, termNum, classRecords, hpsRecord, weights, schoolYear, subject);
          updated = updateCellFormulaValue(updated, 'N', r, scores.wwTotal);
          updated = updateCellFormulaValue(updated, 'O', r, scores.wwPs);
          updated = updateCellFormulaValue(updated, 'P', r, scores.wwWs);
          updated = updateCellFormulaValue(updated, 'AA', r, scores.ptTotal, undefined, `IF(COUNT(Q${r}:Z${r})=0,"",SUM(Q${r}:Z${r}))`);
          updated = updateCellFormulaValue(updated, 'AB', r, scores.ptPs);
          updated = updateCellFormulaValue(updated, 'AC', r, scores.ptWs);
          if (isUpdatedTemplate) {
            const weighted = (score: unknown, hps: unknown, weight: number) => {
              const n = Number(score);
              const d = Number(hps);
              return score !== '' && Number.isFinite(n) && d > 0 ? Math.round((n / d) * weight * 100) / 100 : '';
            };
            const st1Weighted = weighted(assessmentScores.st1, assessmentScores.st1Hps, 30);
            const st2Weighted = weighted(assessmentScores.st2, assessmentScores.st2Hps, 30);
            const teWeighted = weighted(assessmentScores.te, assessmentScores.teHps, 40);
            const hasExam = [st1Weighted, st2Weighted, teWeighted].some(v => v !== '');
            const examPs = hasExam ? Math.round(((Number(st1Weighted || 0) + Number(st2Weighted || 0) + Number(teWeighted || 0)) / 100) * 100 * 100) / 100 : '';
            const examWs = examPs !== '' ? Math.round(Number(examPs) * weights.te * 100) / 100 : '';
            const initial = scores.wwWs !== '' || scores.ptWs !== '' || examWs !== '' ? Math.round(((Number(scores.wwWs) || 0) + (Number(scores.ptWs) || 0) + (Number(examWs) || 0)) * 100) / 100 : '';
            updated = updateCellFormulaValue(updated, 'AG', r, st1Weighted);
            updated = updateCellFormulaValue(updated, 'AH', r, st2Weighted);
            updated = updateCellFormulaValue(updated, 'AI', r, teWeighted);
            updated = updateCellFormulaValue(updated, 'AJ', r, examPs);
            updated = updateCellFormulaValue(updated, 'AK', r, examWs);
            updated = updateCellFormulaValue(updated, 'AL', r, initial);
            updated = updateCellFormulaValue(updated, 'AM', r, initial !== '' ? transmuteGrade(Number(initial), schoolYear) : '');
          } else {
            updated = updateCellFormulaValue(updated, 'AE', r, scores.tePs);
            updated = updateCellFormulaValue(updated, 'AF', r, scores.teWs);
            updated = updateCellFormulaValue(updated, 'AG', r, scores.initialGrade);
            updated = updateCellFormulaValue(updated, 'AH', r, scores.termGrade);
          }
        } else {
          updated = updateCellFormulaValue(updated, 'N', r, '');
          updated = updateCellFormulaValue(updated, 'O', r, '');
          updated = updateCellFormulaValue(updated, 'P', r, '');
          updated = updateCellFormulaValue(updated, 'AA', r, '', undefined, `IF(COUNT(Q${r}:Z${r})=0,"",SUM(Q${r}:Z${r}))`);
          updated = updateCellFormulaValue(updated, 'AB', r, '');
          updated = updateCellFormulaValue(updated, 'AC', r, '');
          if (isUpdatedTemplate) {
            updated = updateCellFormulaValue(updated, 'AG', r, '');
            updated = updateCellFormulaValue(updated, 'AH', r, '');
            updated = updateCellFormulaValue(updated, 'AI', r, '');
            updated = updateCellFormulaValue(updated, 'AJ', r, '');
            updated = updateCellFormulaValue(updated, 'AK', r, '');
            updated = updateCellFormulaValue(updated, 'AL', r, '');
            updated = updateCellFormulaValue(updated, 'AM', r, '');
          } else {
            updated = updateCellFormulaValue(updated, 'AE', r, '');
            updated = updateCellFormulaValue(updated, 'AF', r, '');
            updated = updateCellFormulaValue(updated, 'AG', r, '');
            updated = updateCellFormulaValue(updated, 'AH', r, '');
          }
        }
      } else {
        updated = updateCellFormulaValue(updated, 'C', r, '', 'str');
        for (let i = 0; i < 10; i++) updated = setCellNumber(updated, wwCols[i], r, '');
        for (let i = 0; i < 10; i++) updated = setCellNumber(updated, ptCols[i], r, '');
        if (isUpdatedTemplate) {
          updated = setCellNumber(updated, 'AD', r, '');
          updated = setCellNumber(updated, 'AE', r, '');
          updated = setCellNumber(updated, 'AF', r, '');
        } else {
          updated = setCellNumber(updated, 'AD', r, '');
        }
        updated = updateCellFormulaValue(updated, 'N', r, '');
        updated = updateCellFormulaValue(updated, 'O', r, '');
        updated = updateCellFormulaValue(updated, 'P', r, '');
        updated = updateCellFormulaValue(updated, 'AA', r, '', undefined, `IF(COUNT(Q${r}:Z${r})=0,"",SUM(Q${r}:Z${r}))`);
        updated = updateCellFormulaValue(updated, 'AB', r, '');
        updated = updateCellFormulaValue(updated, 'AC', r, '');
        if (isUpdatedTemplate) {
          updated = updateCellFormulaValue(updated, 'AG', r, '');
          updated = updateCellFormulaValue(updated, 'AH', r, '');
          updated = updateCellFormulaValue(updated, 'AI', r, '');
          updated = updateCellFormulaValue(updated, 'AJ', r, '');
          updated = updateCellFormulaValue(updated, 'AK', r, '');
          updated = updateCellFormulaValue(updated, 'AL', r, '');
          updated = updateCellFormulaValue(updated, 'AM', r, '');
        } else {
          updated = updateCellFormulaValue(updated, 'AE', r, '');
          updated = updateCellFormulaValue(updated, 'AF', r, '');
          updated = updateCellFormulaValue(updated, 'AG', r, '');
          updated = updateCellFormulaValue(updated, 'AH', r, '');
        }
      }
    }

    // Female Student Scores (Rows 68 to 117)
    if (r >= 68 && r <= 117) {
      const idx = r - 68;
      if (idx < females.length) {
        const student = females[idx];
        const rec = classRecords.find(c =>
          c.student_lrn === student.lrn &&
          (c.subject_id === subject.id || (subject.subject_name && c.subject_id === subject.subject_name)) &&
          c.school_year === schoolYear &&
          Number(c.quarter) === termNum
        );

        updated = updateCellFormulaValue(updated, 'C', r, isTermActive ? formatDepEdStudentName(student) : '', 'str');

        const recWW = rec?.written_works || [];
        const recPT = rec?.performance_tasks || [];
        const recQA = (rec as any)?.summative_tests || [];
        const assessmentScores = getSHSG12AssessmentScores(rec, hpsRecord);

        // WW 1..5
        for (let i = 0; i < 5; i++) {
          const s = recWW[i];
          const num = (s !== '' && s !== null && s !== undefined && !isNaN(Number(s))) ? Number(s) : '';
          updated = setCellNumber(updated, wwCols[i], r, num);
        }

        // WW 6 (ST1)
        const st1Val = recWW[5] !== undefined && recWW[5] !== '' ? recWW[5] : (isUpdatedTemplate && assessmentScores.hasExplicitSummativeTests ? '' : recQA[0]);
        const st1Num = (st1Val !== '' && st1Val !== null && st1Val !== undefined && !isNaN(Number(st1Val))) ? Number(st1Val) : '';
        updated = setCellNumber(updated, wwCols[5], r, st1Num);

        // WW 7 (ST2)
        const st2Val = recWW[6] !== undefined && recWW[6] !== '' ? recWW[6] : (isUpdatedTemplate && assessmentScores.hasExplicitSummativeTests ? '' : recQA[1]);
        const st2Num = (st2Val !== '' && st2Val !== null && st2Val !== undefined && !isNaN(Number(st2Val))) ? Number(st2Val) : '';
        updated = setCellNumber(updated, wwCols[6], r, st2Num);

        // WW 8..10
        for (let i = 7; i < 10; i++) {
          const s = recWW[i];
          const num = (s !== '' && s !== null && s !== undefined && !isNaN(Number(s))) ? Number(s) : '';
          updated = setCellNumber(updated, wwCols[i], r, num);
        }
        // PT 1..10
        for (let i = 0; i < 10; i++) {
          const s = recPT[i];
          const num = (s !== '' && s !== null && s !== undefined && !isNaN(Number(s))) ? Number(s) : '';
          updated = setCellNumber(updated, ptCols[i], r, num);
        }

        if (isUpdatedTemplate && !assessmentScores.hasExplicitSummativeTests) {
          updated = setCellNumber(updated, 'I', r, '');
          updated = setCellNumber(updated, 'J', r, '');
        }
        if (isUpdatedTemplate) {
          updated = setCellNumber(updated, 'AD', r, assessmentScores.st1);
          updated = setCellNumber(updated, 'AE', r, assessmentScores.st2);
          updated = setCellNumber(updated, 'AF', r, assessmentScores.te);
        } else {
          const teNum = (assessmentScores.te !== '' && assessmentScores.te !== null && assessmentScores.te !== undefined && !isNaN(Number(assessmentScores.te))) ? Number(assessmentScores.te) : '';
          updated = setCellNumber(updated, 'AD', r, teNum);
        }

        // Computed live score values
        if (isTermActive) {
          const scores = computeSHSG12StudentTermScores(student, termNum, classRecords, hpsRecord, weights, schoolYear, subject);
          updated = updateCellFormulaValue(updated, 'N', r, scores.wwTotal);
          updated = updateCellFormulaValue(updated, 'O', r, scores.wwPs);
          updated = updateCellFormulaValue(updated, 'P', r, scores.wwWs);
          updated = updateCellFormulaValue(updated, 'AA', r, scores.ptTotal, undefined, `IF(COUNT(Q${r}:Z${r})=0,"",SUM(Q${r}:Z${r}))`);
          updated = updateCellFormulaValue(updated, 'AB', r, scores.ptPs);
          updated = updateCellFormulaValue(updated, 'AC', r, scores.ptWs);
          if (isUpdatedTemplate) {
            const weighted = (score: unknown, hps: unknown, weight: number) => {
              const n = Number(score);
              const d = Number(hps);
              return score !== '' && Number.isFinite(n) && d > 0 ? Math.round((n / d) * weight * 100) / 100 : '';
            };
            const st1Weighted = weighted(assessmentScores.st1, assessmentScores.st1Hps, 30);
            const st2Weighted = weighted(assessmentScores.st2, assessmentScores.st2Hps, 30);
            const teWeighted = weighted(assessmentScores.te, assessmentScores.teHps, 40);
            const hasExam = [st1Weighted, st2Weighted, teWeighted].some(v => v !== '');
            const examPs = hasExam ? Math.round(((Number(st1Weighted || 0) + Number(st2Weighted || 0) + Number(teWeighted || 0)) / 100) * 100 * 100) / 100 : '';
            const examWs = examPs !== '' ? Math.round(Number(examPs) * weights.te * 100) / 100 : '';
            const initial = scores.wwWs !== '' || scores.ptWs !== '' || examWs !== '' ? Math.round(((Number(scores.wwWs) || 0) + (Number(scores.ptWs) || 0) + (Number(examWs) || 0)) * 100) / 100 : '';
            updated = updateCellFormulaValue(updated, 'AG', r, st1Weighted);
            updated = updateCellFormulaValue(updated, 'AH', r, st2Weighted);
            updated = updateCellFormulaValue(updated, 'AI', r, teWeighted);
            updated = updateCellFormulaValue(updated, 'AJ', r, examPs);
            updated = updateCellFormulaValue(updated, 'AK', r, examWs);
            updated = updateCellFormulaValue(updated, 'AL', r, initial);
            updated = updateCellFormulaValue(updated, 'AM', r, initial !== '' ? transmuteGrade(Number(initial), schoolYear) : '');
          } else {
            updated = updateCellFormulaValue(updated, 'AE', r, scores.tePs);
            updated = updateCellFormulaValue(updated, 'AF', r, scores.teWs);
            updated = updateCellFormulaValue(updated, 'AG', r, scores.initialGrade);
            updated = updateCellFormulaValue(updated, 'AH', r, scores.termGrade);
          }
        } else {
          updated = updateCellFormulaValue(updated, 'N', r, '');
          updated = updateCellFormulaValue(updated, 'O', r, '');
          updated = updateCellFormulaValue(updated, 'P', r, '');
          updated = updateCellFormulaValue(updated, 'AA', r, '', undefined, `IF(COUNT(Q${r}:Z${r})=0,"",SUM(Q${r}:Z${r}))`);
          updated = updateCellFormulaValue(updated, 'AB', r, '');
          updated = updateCellFormulaValue(updated, 'AC', r, '');
          updated = updateCellFormulaValue(updated, 'AE', r, '');
          updated = updateCellFormulaValue(updated, 'AF', r, '');
          updated = updateCellFormulaValue(updated, 'AG', r, '');
          updated = updateCellFormulaValue(updated, 'AH', r, '');
        }
      } else {
        updated = updateCellFormulaValue(updated, 'C', r, '', 'str');
        for (let i = 0; i < 10; i++) updated = setCellNumber(updated, wwCols[i], r, '');
        for (let i = 0; i < 10; i++) updated = setCellNumber(updated, ptCols[i], r, '');
        updated = setCellNumber(updated, 'AD', r, '');
        updated = updateCellFormulaValue(updated, 'N', r, '');
        updated = updateCellFormulaValue(updated, 'O', r, '');
        updated = updateCellFormulaValue(updated, 'P', r, '');
        updated = updateCellFormulaValue(updated, 'AA', r, '', undefined, `IF(COUNT(Q${r}:Z${r})=0,"",SUM(Q${r}:Z${r}))`);
        updated = updateCellFormulaValue(updated, 'AB', r, '');
        updated = updateCellFormulaValue(updated, 'AC', r, '');
        updated = updateCellFormulaValue(updated, 'AE', r, '');
        updated = updateCellFormulaValue(updated, 'AF', r, '');
        updated = updateCellFormulaValue(updated, 'AG', r, '');
        updated = updateCellFormulaValue(updated, 'AH', r, '');
      }
    }

    return updated;
  });

  return xml;
}

/**
 * Populates sheet6.xml (FINAL GRADES) with section info, track, number of terms,
 * and live pre-computed term grades, general averages, descriptors, and remarks.
 */
export function populateSHSG12FinalGradesXml(
  sheetXml: string,
  options: SHSG12ExportOptions,
  resolvedTerms: SHSG12TermsConfig,
  resolvedTrack: string
): string {
  const { schoolYear, section, subject, students, teacherName, classRecords, hpsRecords } = options;
  const { numTerms, termDesc } = resolvedTerms;
  const sectionName = (section.section_name || '').toUpperCase();
  const teacherNameStr = (teacherName || section.adviser_name || '').toUpperCase();
  const weights = getSHSG12TrackWeights(resolvedTrack);

  const males = students
    .filter(s => s.gender && s.gender.trim().toLowerCase() === 'male')
    .sort((a, b) => (a.last_name || '').localeCompare(b.last_name || '') || (a.first_name || '').localeCompare(b.first_name || ''))
    .slice(0, MAX_STUDENTS_PER_GENDER);

  const females = students
    .filter(s => s.gender && s.gender.trim().toLowerCase() === 'female')
    .sort((a, b) => (a.last_name || '').localeCompare(b.last_name || '') || (a.first_name || '').localeCompare(b.first_name || ''))
    .slice(0, MAX_STUDENTS_PER_GENDER);

  const isTerm1Active = termDesc.includes('1ST');
  const isTerm2Active = termDesc.includes('2ND');
  const isTerm3Active = termDesc.includes('3RD');

  let xml = sheetXml;
  const rowRegex = /<row r="(\d+)"[^>]*>[\s\S]*?<\/row>/g;

  xml = xml.replace(rowRegex, (rowXml, rStr) => {
    const r = parseInt(rStr, 10);
    let updated = rowXml;

    // Headers
    if (r === 10) updated = updateCellFormulaValue(updated, 'D', 10, sectionName, 'str');
    if (r === 11) updated = updateCellFormulaValue(updated, 'G', 11, resolvedTrack, 'str');
    if (r === 12) updated = updateCellFormulaValue(updated, 'D', 12, teacherNameStr, 'str');
    if (r === 13) {
      updated = updateCellFormulaValue(updated, 'G', 13, numTerms);
      updated = updateCellFormulaValue(updated, 'I', 13, termDesc, 'str');
    }
    if (r === 16) {
      updated = updateCellFormulaValue(updated, 'E', 16, isTerm1Active ? 1 : 0);
      updated = updateCellFormulaValue(updated, 'F', 16, isTerm2Active ? 1 : 0);
      updated = updateCellFormulaValue(updated, 'G', 16, isTerm3Active ? 1 : 0);
    }

    // Male Students (Rows 17 to 66)
    if (r >= 17 && r <= 66) {
      const idx = r - 17;
      if (idx < males.length) {
        const s = males[idx];
        updated = updateCellFormulaValue(updated, 'C', r, s.lrn || '', 'str');
        updated = updateCellFormulaValue(updated, 'D', r, formatDepEdStudentName(s), 'str');

        // Term grades
        const t1 = isTerm1Active ? computeSHSG12StudentTermScores(s, 1, classRecords, hpsRecords.find(h => Number(h.quarter) === 1), weights, schoolYear, subject).termGrade : '';
        const t2 = isTerm2Active ? computeSHSG12StudentTermScores(s, 2, classRecords, hpsRecords.find(h => Number(h.quarter) === 2), weights, schoolYear, subject).termGrade : '';
        const t3 = isTerm3Active ? computeSHSG12StudentTermScores(s, 3, classRecords, hpsRecords.find(h => Number(h.quarter) === 3), weights, schoolYear, subject).termGrade : '';

        updated = updateCellFormulaValue(updated, 'E', r, t1 !== '' ? t1 : '');
        updated = updateCellFormulaValue(updated, 'F', r, t2 !== '' ? t2 : '');
        updated = updateCellFormulaValue(updated, 'G', r, t3 !== '' ? t3 : '');

        const validGrades = [t1, t2, t3].filter(g => g !== '' && g !== undefined && !isNaN(Number(g))) as number[];
        let finalGrade: number | '' = '';
        if (validGrades.length === numTerms && numTerms > 0) {
          finalGrade = Math.round(validGrades.reduce((a, b) => a + b, 0) / numTerms);
        }
        const descriptor = finalGrade !== '' ? getSHSG12Descriptor(finalGrade) : '';
        const remark = finalGrade !== '' ? (finalGrade >= 75 ? 'PASSED' : 'FAILED') : '';

        updated = updateCellFormulaValue(updated, 'H', r, finalGrade !== '' ? finalGrade : '');
        updated = updateCellFormulaValue(updated, 'I', r, descriptor, 'str');
        updated = updateCellFormulaValue(updated, 'J', r, remark, 'str');
      } else {
        updated = updateCellFormulaValue(updated, 'C', r, '', 'str');
        updated = updateCellFormulaValue(updated, 'D', r, '', 'str');
        updated = updateCellFormulaValue(updated, 'E', r, '');
        updated = updateCellFormulaValue(updated, 'F', r, '');
        updated = updateCellFormulaValue(updated, 'G', r, '');
        updated = updateCellFormulaValue(updated, 'H', r, '');
        updated = updateCellFormulaValue(updated, 'I', r, '', 'str');
        updated = updateCellFormulaValue(updated, 'J', r, '', 'str');
      }
    }

    // Female Students (Rows 68 to 117)
    if (r >= 68 && r <= 117) {
      const idx = r - 68;
      if (idx < females.length) {
        const s = females[idx];
        updated = updateCellFormulaValue(updated, 'C', r, s.lrn || '', 'str');
        updated = updateCellFormulaValue(updated, 'D', r, formatDepEdStudentName(s), 'str');

        // Term grades
        const t1 = isTerm1Active ? computeSHSG12StudentTermScores(s, 1, classRecords, hpsRecords.find(h => Number(h.quarter) === 1), weights, schoolYear, subject).termGrade : '';
        const t2 = isTerm2Active ? computeSHSG12StudentTermScores(s, 2, classRecords, hpsRecords.find(h => Number(h.quarter) === 2), weights, schoolYear, subject).termGrade : '';
        const t3 = isTerm3Active ? computeSHSG12StudentTermScores(s, 3, classRecords, hpsRecords.find(h => Number(h.quarter) === 3), weights, schoolYear, subject).termGrade : '';

        updated = updateCellFormulaValue(updated, 'E', r, t1 !== '' ? t1 : '');
        updated = updateCellFormulaValue(updated, 'F', r, t2 !== '' ? t2 : '');
        updated = updateCellFormulaValue(updated, 'G', r, t3 !== '' ? t3 : '');

        const validGrades = [t1, t2, t3].filter(g => g !== '' && g !== undefined && !isNaN(Number(g))) as number[];
        let finalGrade: number | '' = '';
        if (validGrades.length === numTerms && numTerms > 0) {
          finalGrade = Math.round(validGrades.reduce((a, b) => a + b, 0) / numTerms);
        }
        const descriptor = finalGrade !== '' ? getSHSG12Descriptor(finalGrade) : '';
        const remark = finalGrade !== '' ? (finalGrade >= 75 ? 'PASSED' : 'FAILED') : '';

        updated = updateCellFormulaValue(updated, 'H', r, finalGrade !== '' ? finalGrade : '');
        updated = updateCellFormulaValue(updated, 'I', r, descriptor, 'str');
        updated = updateCellFormulaValue(updated, 'J', r, remark, 'str');
      } else {
        updated = updateCellFormulaValue(updated, 'C', r, '', 'str');
        updated = updateCellFormulaValue(updated, 'D', r, '', 'str');
        updated = updateCellFormulaValue(updated, 'E', r, '');
        updated = updateCellFormulaValue(updated, 'F', r, '');
        updated = updateCellFormulaValue(updated, 'G', r, '');
        updated = updateCellFormulaValue(updated, 'H', r, '');
        updated = updateCellFormulaValue(updated, 'I', r, '', 'str');
        updated = updateCellFormulaValue(updated, 'J', r, '', 'str');
      }
    }

    return updated;
  });

  return xml;
}

/**
 * Populates sheet7.xml (HELPER) to guarantee dropdown lookup formulas never resolve to #VALUE!
 * and align component weights with the resolved track.
 */
export function populateSHSG12HelperXml(
  sheetXml: string,
  options: SHSG12ExportOptions,
  resolvedTerms: SHSG12TermsConfig,
  resolvedTrack: string,
  templateLayout?: SHSG12TemplateLayout
): string {
  const { subject } = options;
  const subjectName = (subject.subject_name || '').toUpperCase();
  const { numTerms, termDesc, code } = resolvedTerms;
  const weights = getSHSG12TrackWeights(resolvedTrack);
  const isUpdatedTemplate = templateLayout === 'updated';

  let xml = sheetXml;
  const rowRegex = /<row r="(\d+)"[^>]*>[\s\S]*?<\/row>/g;

  xml = xml.replace(rowRegex, (rowXml, rStr) => {
    const r = parseInt(rStr, 10);
    let updated = rowXml;

    if (r === 7) updated = setCellNumber(updated, 'F', 7, 12);
    if (r === 8) updated = setCellString(updated, 'G', 8, 'SHS');
    if (r === 9) updated = setCellString(updated, 'G', 9, resolvedTrack);
    if (r === 10) updated = setCellString(updated, 'G', 10, subjectName);

    // Weights for live lookup fallback
    if (r === 13) updated = updateCellFormulaValue(updated, 'G', 13, Math.round(weights.ww * 100));
    if (r === 14) updated = updateCellFormulaValue(updated, 'G', 14, Math.round(weights.pt * 100));
    if (r === 15) updated = updateCellFormulaValue(updated, 'G', 15, Math.round(weights.te * 100));
    if (isUpdatedTemplate && r === 17) updated = updateCellFormulaValue(updated, 'G', 17, 30);
    if (isUpdatedTemplate && r === 18) updated = updateCellFormulaValue(updated, 'G', 18, 30);
    if (isUpdatedTemplate && r === 19) updated = updateCellFormulaValue(updated, 'G', 19, 40);

    // Term config
    if (r === 21) updated = updateCellFormulaValue(updated, 'G', 21, 1);
    if (r === 22) updated = updateCellFormulaValue(updated, 'G', 22, numTerms);
    if (r === 23) {
      updated = updateCellFormulaValue(updated, 'F', 23, code);
      updated = updateCellFormulaValue(updated, 'G', 23, termDesc, 'str');
    }

    return updated;
  });

  return xml;
}

/**
 * Loads the SHS Grade 12 template workbook from public directory.
 */
export async function fetchSHSG12TemplateBuffer(layout: SHSG12TemplateLayout = 'updated'): Promise<Uint8Array> {
  const cleanBase = (import.meta.env.BASE_URL || '/').endsWith('/') 
    ? (import.meta.env.BASE_URL || '/') 
    : `${import.meta.env.BASE_URL}/`;
  const timestamp = Date.now();
  const templateName = layout === 'updated' ? TEMPLATE_SHS_G12_UPDATED : TEMPLATE_SHS_G12;

  const candidateUrls = [
    `${cleanBase}templates/${encodeURIComponent(templateName)}?t=${timestamp}`,
    `/templates/${encodeURIComponent(templateName)}?t=${timestamp}`,
    `templates/${encodeURIComponent(templateName)}?t=${timestamp}`,
    `${cleanBase}templates/${templateName}?t=${timestamp}`,
    `/templates/${templateName}?t=${timestamp}`,
  ];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const ab = await res.arrayBuffer();
        const bytes = new Uint8Array(ab);
        if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
          return bytes;
        }
      }
    } catch {
      // Try next candidate path
    }
  }

  // Node / Electron filesystem fallback
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      const fs = await import('fs');
      const nodePath = await import('path');
      const possibleDirs = [
        nodePath.resolve(process.cwd(), 'app', 'public', 'templates'),
        nodePath.resolve(process.cwd(), 'public', 'templates'),
        ...(typeof __dirname !== 'undefined' ? [
          nodePath.resolve(__dirname, '../../public/templates'),
          nodePath.resolve(__dirname, '../public/templates')
        ] : []),
        ...(typeof (process as unknown as { resourcesPath?: string }).resourcesPath !== 'undefined' ? [
          nodePath.resolve((process as unknown as { resourcesPath: string }).resourcesPath, 'templates'),
          nodePath.resolve((process as unknown as { resourcesPath: string }).resourcesPath, 'app', 'public', 'templates')
        ] : [])
      ];

      for (const dir of possibleDirs) {
        for (const f of [templateName, TEMPLATE_SHS_G12_UPDATED, TEMPLATE_SHS_G12]) {
          const fullPath = nodePath.join(dir, f);
          if (fs.existsSync(fullPath)) {
            const buf = fs.readFileSync(fullPath);
            if (buf.length >= 1000 && buf[0] === 0x50 && buf[1] === 0x4b) {
              const u8 = new Uint8Array(buf.byteLength);
              for (let i = 0; i < buf.byteLength; i++) u8[i] = buf[i];
              return u8;
            }
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  throw new Error(`Failed to load valid SHS Grade 12 template: ${templateName}. Please ensure the template file exists in public/templates.`);
}

/**
 * Populates the entire SHS Grade 12 Excel workbook Zip.
 */
export async function populateSHSG12WorkbookZip(
  templateBuffer: Uint8Array,
  options: SHSG12ExportOptions
): Promise<JSZip> {
  const zip = await JSZip.loadAsync(templateBuffer);
  const firstTermFile = zip.file('xl/worksheets/sheet3.xml');
  const firstTermXml = firstTermFile ? await firstTermFile.async('text') : '';
  const templateLayout: SHSG12TemplateLayout = isUpdatedSHSG12TermSheet(firstTermXml) ? 'updated' : 'legacy';

  // 1. Resolve Track and Terms dynamically
  const resolvedTrack = resolveSHSG12Track(
    options.track || options.section.track,
    options.subject.subject_name,
    (options.subject as any).category
  );

  const resolvedTermsBase = resolveSHSG12Terms(
    options.subject,
    options.classRecords,
    options.hpsRecords,
    options.schoolYear
  );

  const numTerms = options.numTerms || resolvedTermsBase.numTerms;
  const termBlock = options.termBlock || resolvedTermsBase.termBlock;

  const resolvedTerms: SHSG12TermsConfig = {
    ...resolvedTermsBase,
    numTerms,
    termBlock,
    ...(numTerms === 3 ? { termDesc: '1ST, 2ND, 3RD', code: 33 } :
        numTerms === 2 ? (termBlock.includes('2ND') || termBlock.includes('SECOND') || termBlock.includes('TERM 2') ? { termDesc: '2ND & 3RD', code: 22 } : { termDesc: '1ST & 2ND', code: 21 }) :
        (termBlock.includes('2ND') || termBlock.includes('SECOND') || termBlock.includes('TERM 2') ? { termDesc: '2ND', code: 12 } :
         termBlock.includes('3RD') || termBlock.includes('THIRD') || termBlock.includes('TERM 3') ? { termDesc: '3RD', code: 13 } :
         { termDesc: '1ST', code: 11 }))
  };

  // 2. Remove stale calcChain & external links to eliminate Excel repair prompt
  zip.remove('xl/calcChain.xml');
  zip.remove('xl/externalLinks/externalLink1.xml');
  zip.remove('xl/externalLinks/_rels/externalLink1.xml.rels');

  // Revised DepEd templates may retain external-workbook prefixes such as
  // '[2]HELPER!' even though the referenced sheets are inside this workbook.
  // Remove only the workbook index, preserving quoted sheet names and formulas.
  for (const sheetName of ['sheet2.xml', 'sheet3.xml', 'sheet4.xml', 'sheet5.xml', 'sheet6.xml', 'sheet7.xml']) {
    const sheetFile = zip.file(`xl/worksheets/${sheetName}`);
    if (sheetFile) {
      const sheetXml = await sheetFile.async('string');
      zip.file(`xl/worksheets/${sheetName}`, sheetXml.replace(/\[\d+\]/g, ''));
    }
  }

  const wbRel = zip.file('xl/_rels/workbook.xml.rels');
  if (wbRel) {
    let relXml = await wbRel.async('string');
    relXml = relXml.replace(/<Relationship[^>]*Target="calcChain\.xml"[^>]*\/>/g, '');
    relXml = relXml.replace(/<Relationship[^>]*Target="externalLinks\/[^"]*"[^>]*\/>/g, '');
    zip.file('xl/_rels/workbook.xml.rels', relXml);
  }

  const ctFile = zip.file('[Content_Types].xml');
  if (ctFile) {
    let ctXml = await ctFile.async('string');
    ctXml = ctXml.replace(/<Override[^>]*PartName="\/xl\/calcChain\.xml"[^>]*\/>/g, '');
    ctXml = ctXml.replace(/<Override[^>]*PartName="\/xl\/externalLinks\/[^"]*"[^>]*\/>/g, '');
    zip.file('[Content_Types].xml', ctXml);
  }

  // 3. INPUT DATA (sheet2.xml)
  const sheet2File = zip.file('xl/worksheets/sheet2.xml');
  if (sheet2File) {
    const rawXml = await sheet2File.async('text');
    const updatedXml = populateSHSG12InputDataXml(rawXml, options, resolvedTerms, resolvedTrack);
    zip.file('xl/worksheets/sheet2.xml', updatedXml);
  }

  // 4. Term 1 (sheet3.xml)
  const sheet3File = zip.file('xl/worksheets/sheet3.xml');
  if (sheet3File) {
    const rawXml = await sheet3File.async('text');
    const updatedXml = populateSHSG12TermXml(rawXml, 1, options, resolvedTerms, resolvedTrack, templateLayout);
    zip.file('xl/worksheets/sheet3.xml', updatedXml);
  }

  // 5. Term 2 (sheet4.xml)
  const sheet4File = zip.file('xl/worksheets/sheet4.xml');
  if (sheet4File) {
    const rawXml = await sheet4File.async('text');
    const updatedXml = populateSHSG12TermXml(rawXml, 2, options, resolvedTerms, resolvedTrack, templateLayout);
    zip.file('xl/worksheets/sheet4.xml', updatedXml);
  }

  // 6. Term 3 (sheet5.xml)
  const sheet5File = zip.file('xl/worksheets/sheet5.xml');
  if (sheet5File) {
    const rawXml = await sheet5File.async('text');
    const updatedXml = populateSHSG12TermXml(rawXml, 3, options, resolvedTerms, resolvedTrack, templateLayout);
    zip.file('xl/worksheets/sheet5.xml', updatedXml);
  }

  // 7. FINAL GRADES (sheet6.xml)
  const sheet6File = zip.file('xl/worksheets/sheet6.xml');
  if (sheet6File) {
    const rawXml = await sheet6File.async('text');
    const updatedXml = populateSHSG12FinalGradesXml(rawXml, options, resolvedTerms, resolvedTrack);
    zip.file('xl/worksheets/sheet6.xml', updatedXml);
  }

  // 8. HELPER (sheet7.xml)
  const sheet7File = zip.file('xl/worksheets/sheet7.xml');
  if (sheet7File) {
    const rawXml = await sheet7File.async('text');
    const updatedXml = populateSHSG12HelperXml(rawXml, options, resolvedTerms, resolvedTrack, templateLayout);
    zip.file('xl/worksheets/sheet7.xml', updatedXml);
  }

  // 9. Ensure full calculation on load and clean broken definedNames & externalReferences in xl/workbook.xml
  const wbFile = zip.file('xl/workbook.xml');
  if (wbFile) {
    let wbXml = await wbFile.async('string');
    wbXml = wbXml.replace(/<externalReferences>[\s\S]*?<\/externalReferences>/g, '');
    wbXml = wbXml.replace(/<externalReference[^>]*\/>/g, '');
    wbXml = wbXml.replace(/<externalLink[^>]*\/>/g, '');

    // Clean broken or external defined names (named ranges) that trigger Excel repair dialog
    if (wbXml.includes('<definedNames')) {
      wbXml = wbXml.replace(/<definedNames[\s\S]*?<\/definedNames>/, (dnBlock) => {
        const cleanNames = dnBlock.replace(/<definedName[^>]*>(?:(?!<\/definedName>)[\s\S])*?(?:#REF!|\[\d+\])[\s\S]*?<\/definedName>/g, '');
        if (cleanNames.includes('<definedName')) {
          return cleanNames;
        }
        return '';
      });
    }

    if (wbXml.includes('<calcPr')) {
      wbXml = wbXml.replace(/<calcPr([^>]*)(\/>|>[\s\S]*?<\/calcPr>)/, (_match, attrs) => {
        const cleanAttrs = attrs
          .replace(/\s*fullCalcOnLoad="[^"]*"/g, '')
          .replace(/\s*forceFullCalc="[^"]*"/g, '')
          .replace(/\s*calcCompleted="[^"]*"/g, '')
          .replace(/\s*calcId="[^"]*"/g, '');
        return `<calcPr${cleanAttrs} fullCalcOnLoad="1" forceFullCalc="1"/>`;
      });
    } else {
      wbXml = wbXml.replace('</workbook>', '<calcPr fullCalcOnLoad="1" forceFullCalc="1"/></workbook>');
    }
    zip.file('xl/workbook.xml', wbXml);
  }

  return zip;
}

/**
 * Main export function for Grade 12 E-Class Record.
 * Generates the .xlsx file and triggers the browser download.
 */
export async function exportSHSG12EClassRecord(options: SHSG12ExportOptions): Promise<void> {
  const templateBuffer = await fetchSHSG12TemplateBuffer(options.templateLayout || 'updated');
  const zip = await populateSHSG12WorkbookZip(templateBuffer, options);

  const outBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const secName = (options.section.section_name || 'Section').replace(/[^a-zA-Z0-9_-]/g, '_');
  const subjName = (options.subject.subject_name || 'Subject').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `SHS_ECR_Grade12_${secName}_${subjName}_SY_${options.schoolYear.replace('/', '-')}.xlsx`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(outBlob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
