/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Strengthened Senior High School (SSHS) Electronic Class Record (ECR) Excel Export Service
 *
 * Implements official Strengthened Senior High School (SSHS) 3-Term E-Class Record
 * pursuant to DepEd Order No. 15, series of 2026.
 *
 * Exclusively for Strengthened SHS Curriculum Implementers (Grade 11 and Grade 12).
 * Direct OpenXML injection into:
 * "public/templates/SSHS E-Class Record SY 2026-2027.xlsx"
 */

import JSZip from 'jszip';
import type { SchoolProfile, Section, Subject, Student, ClassRecord, HPSRecord } from '../types';
import { normalizeRegionForECR } from './ecr-excel-export';
import { transmuteGrade } from '../lib/grading';
import { isGrade11CoreSubject, getDefaultTermForSubject } from '../lib/curriculum';
import { isSameSubject, isMatchingSubject } from '../utils/grading-helpers';

export const TEMPLATE_SSHS_G11 = 'SSHS E-Class Record SY 2026-2027.xlsx';

const MAX_STUDENTS_PER_GENDER = 50;
const SSHS_WW_COUNT = 10;
const SSHS_PT_COUNT = 10;
const SSHS_ST_COUNT = 3;

export interface ResolvedSSHSTerms {
  numTerms: number;
  termBlock: 'FIRST TERM' | 'SECOND TERM' | 'THIRD TERM' | '';
  termDesc: '1ST' | '2ND' | '3RD' | '1ST & 2ND' | '2ND & 3RD' | '1ST, 2ND, 3RD';
  code: number;
}

export interface SSHSExportOptions {
  schoolProfile: SchoolProfile | null;
  schoolYear: string;
  section: Section;
  subject: Subject;
  students: Student[];
  classRecords: ClassRecord[];
  hpsRecords: HPSRecord[];
  teacherName?: string;
  termBlock?: string;
  numTerms?: number;
  resolvedTerms?: ResolvedSSHSTerms;
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
 * Also removes any error type (t="e") that would cause repair dialogs.
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

    // Match both regular formula <f ...>...</f> AND self-closing shared/array formula <f ... />
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
        if (tMatch[1] === 'str' && typeof cachedValue === 'number') {
          typeAttr = '';
        } else {
          typeAttr = ` t="${tMatch[1]}"`;
        }
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

function formatDepEdStudentName(s: Student): string {
  const last = (s.last_name || '').trim().toUpperCase();
  const first = (s.first_name || '').trim().toUpperCase();
  const middle = (s.middle_name || '').trim().toUpperCase();
  const ext = (s.name_extension || '').trim().toUpperCase();

  let name = last ? `${last}, ${first}` : first;
  if (middle) name += ` ${middle}`;
  if (ext) name += ` ${ext}`;
  return name.trim();
}

function normalizeScores(scores: (number | string)[] | undefined, count: number): (number | string)[] {
  const src = Array.isArray(scores) ? scores : [];
  return Array.from({ length: count }, (_, i) => src[i] ?? '');
}

function getStartYear(schoolYear: string): number {
  const match = String(schoolYear || '').match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : 2026;
}

export function getSSHSTermDescriptor(finalGrade: number | ''): string {
  if (finalGrade === '' || isNaN(Number(finalGrade))) return '';
  const g = Number(finalGrade);
  if (g >= 90) return 'Outstanding';
  if (g >= 85) return 'Very Satisfactory';
  if (g >= 80) return 'Satisfactory';
  if (g >= 75) return 'Fairly Satisfactory';
  return 'Did Not Meet Expectations';
}

export interface SSHSCatalogItem {
  category: 'SSHS - CORE' | 'SSHS - ACADEMIC' | 'SSHS - TECH-PRO';
  cluster: string;
  subject: string;
  gradeLvl: string;
  g11Terms: number;
  g12Terms: number;
  terms: number;
  ww: number;
  pt: number;
  ex: number;
  st1: number;
  st2: number;
  te: number;
}

export const SSHS_FULL_CATALOG: SSHSCatalogItem[] = [
  {
    category: "SSHS - CORE",
    cluster: "CORE",
    subject: "Effective Communication",
    gradeLvl: "11",
    g11Terms: 3,
    g12Terms: 0,
    terms: 3,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - CORE",
    cluster: "CORE",
    subject: "General Mathematics",
    gradeLvl: "11",
    g11Terms: 3,
    g12Terms: 0,
    terms: 3,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - CORE",
    cluster: "CORE",
    subject: "General Science",
    gradeLvl: "11",
    g11Terms: 3,
    g12Terms: 0,
    terms: 3,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - CORE",
    cluster: "CORE",
    subject: "Life and Career Skills",
    gradeLvl: "11",
    g11Terms: 3,
    g12Terms: 0,
    terms: 3,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - CORE",
    cluster: "CORE",
    subject: "Mabisang Komunikasyon",
    gradeLvl: "11",
    g11Terms: 3,
    g12Terms: 0,
    terms: 3,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - CORE",
    cluster: "CORE",
    subject: "Pag-aaral ng Kasaysayan at Lipunang Pilipino",
    gradeLvl: "11",
    g11Terms: 3,
    g12Terms: 0,
    terms: 3,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "ARTS, SOCIAL SCIENCES, AND HUMANITIES",
    subject: "Art Criticism and Creative Markets",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 60,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "ARTS, SOCIAL SCIENCES, AND HUMANITIES",
    subject: "Citizenship and Civic Engagement",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "ARTS, SOCIAL SCIENCES, AND HUMANITIES",
    subject: "Contemporary Literature 1",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "ARTS, SOCIAL SCIENCES, AND HUMANITIES",
    subject: "Contemporary Literature 2",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "ARTS, SOCIAL SCIENCES, AND HUMANITIES",
    subject: "Creative Composition 1",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "ARTS, SOCIAL SCIENCES, AND HUMANITIES",
    subject: "Creative Composition 2",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "ARTS, SOCIAL SCIENCES, AND HUMANITIES",
    subject: "Creative Industries - Applied and Traditional Arts",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 60,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "ARTS, SOCIAL SCIENCES, AND HUMANITIES",
    subject: "Creative Industries - Dance",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 60,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "ARTS, SOCIAL SCIENCES, AND HUMANITIES",
    subject: "Creative Industries - Literary Arts",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 60,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "ARTS, SOCIAL SCIENCES, AND HUMANITIES",
    subject: "Creative Industries - Media Arts",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 60,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "ARTS, SOCIAL SCIENCES, AND HUMANITIES",
    subject: "Creative Industries - Music",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 60,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "ARTS, SOCIAL SCIENCES, AND HUMANITIES",
    subject: "Creative Industries - Theater Arts",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 60,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "ARTS, SOCIAL SCIENCES, AND HUMANITIES",
    subject: "Creative Industries - Visual Arts",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 60,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "ARTS, SOCIAL SCIENCES, AND HUMANITIES",
    subject: "Filipino 1 (Wika at Komunikasyon sa Akademikong Filipino)",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "ARTS, SOCIAL SCIENCES, AND HUMANITIES",
    subject: "Filipino 2 (Filipino sa Isports)",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "ARTS, SOCIAL SCIENCES, AND HUMANITIES",
    subject: "Filipino 2 (Filipino sa Larang Teknikal-Propesyonal)",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "ARTS, SOCIAL SCIENCES, AND HUMANITIES",
    subject: "Filipino 2 (Filipino sa Sining at Disenyo)",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "ARTS, SOCIAL SCIENCES, AND HUMANITIES",
    subject: "Filipino Identity Through the Arts",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 60,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "ARTS, SOCIAL SCIENCES, AND HUMANITIES",
    subject: "Introduction to the Philosophy of the Human Person",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "ARTS, SOCIAL SCIENCES, AND HUMANITIES",
    subject: "Leadership and Management in the Arts",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 60,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "ARTS, SOCIAL SCIENCES, AND HUMANITIES",
    subject: "Malikhaing Pagsulat",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "ARTS, SOCIAL SCIENCES, AND HUMANITIES",
    subject: "Performance Criticism and Creative Markets",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 60,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "ARTS, SOCIAL SCIENCES, AND HUMANITIES",
    subject: "Philippine Governance (Philippine Politics and Governance)",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "ARTS, SOCIAL SCIENCES, AND HUMANITIES",
    subject: "Social Sciences (Theory and Practice)",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "ARTS, SOCIAL SCIENCES, AND HUMANITIES",
    subject: "Creative Production and Presentation",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 15,
    pt: 70,
    ex: 15,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "BUSINESS AND ENTREPRENEURSHIP",
    subject: "Business 1 (Basic Accounting)",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "BUSINESS AND ENTREPRENEURSHIP",
    subject: "Business 2 (Business Finance and Income Taxation)",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "BUSINESS AND ENTREPRENEURSHIP",
    subject: "Contemporary Marketing",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "BUSINESS AND ENTREPRENEURSHIP",
    subject: "Entrepreneurship",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "BUSINESS AND ENTREPRENEURSHIP",
    subject: "Introduction to Organization and Management",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "BUSINESS AND ENTREPRENEURSHIP",
    subject: "Business 3 (Business Economics)",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "FIELD EXPERIENCE",
    subject: "Design and Innovation",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 40,
    pt: 60,
    ex: 0,
    st1: 0,
    st2: 0,
    te: 0
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "FIELD EXPERIENCE",
    subject: "Research 1",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 40,
    pt: 60,
    ex: 0,
    st1: 0,
    st2: 0,
    te: 0
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "FIELD EXPERIENCE",
    subject: "Research 2",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 40,
    pt: 60,
    ex: 0,
    st1: 0,
    st2: 0,
    te: 0
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "FIELD EXPERIENCE",
    subject: "Arts Apprenticeship – Dance",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 15,
    pt: 70,
    ex: 15,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "FIELD EXPERIENCE",
    subject: "Arts Apprenticeship - Literary Arts",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 15,
    pt: 70,
    ex: 15,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "FIELD EXPERIENCE",
    subject: "Arts Apprenticeship - Media Arts",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 15,
    pt: 70,
    ex: 15,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "FIELD EXPERIENCE",
    subject: "Arts Apprenticeship – Music",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 15,
    pt: 70,
    ex: 15,
    st1: 0,
    st2: 0,
    te: 100
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "FIELD EXPERIENCE",
    subject: "Arts Apprenticeship – Theater Arts",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 15,
    pt: 70,
    ex: 15,
    st1: 0,
    st2: 0,
    te: 100
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "FIELD EXPERIENCE",
    subject: "Arts Apprenticeship – Traditional Cultural Expressions",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 15,
    pt: 70,
    ex: 15,
    st1: 0,
    st2: 0,
    te: 100
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "FIELD EXPERIENCE",
    subject: "Arts Apprenticeship – Visual Arts",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 15,
    pt: 70,
    ex: 15,
    st1: 0,
    st2: 0,
    te: 100
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "FIELD EXPERIENCE",
    subject: "Field Exposure (Off Campus)",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 15,
    pt: 70,
    ex: 15,
    st1: 0,
    st2: 0,
    te: 100
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "FIELD EXPERIENCE",
    subject: "In-Campus Field Exposure for Sports",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 15,
    pt: 70,
    ex: 15,
    st1: 0,
    st2: 0,
    te: 100
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "FIELD EXPERIENCE",
    subject: "Work Immersion for Academic Track",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 80,
    ex: 0,
    st1: 0,
    st2: 0,
    te: 100
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Advanced Mathematics",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 0,
    st2: 0,
    te: 100
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Basic Calculus",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 0,
    st2: 0,
    te: 100
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Biology 1",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Biology 2",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Biology 3",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Chemistry 1",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Chemistry 2",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Chemistry 3",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Earth and Space Science 1",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Earth and Space Science 2",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Earth and Space Science 3",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Empowerment Technologies",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Finite Mathematics 1",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Finite Mathematics 2",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Physics 1",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Physics 2",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Physics 3",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Pre-Calculus",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Biology 4",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Chemistry 4",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Conceptual Biology and Earth and Space Science",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Conceptual Physics and Chemistry in Daily Life",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Database Management",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Earth and Space Science 4",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Fundamentals of Data Analytics",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS",
    subject: "Physics 4",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 50,
    ex: 30,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SPORTS, HEALTH, AND WELLNESS",
    subject: "Exercise and Sports Programming",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 60,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SPORTS, HEALTH, AND WELLNESS",
    subject: "First Aid",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 60,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SPORTS, HEALTH, AND WELLNESS",
    subject: "Fundamentals of Basic Life Support",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 60,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SPORTS, HEALTH, AND WELLNESS",
    subject: "Human Movement 1 (Basic Anatomy in Sports and Exercise)",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 60,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SPORTS, HEALTH, AND WELLNESS",
    subject: "Human Movement 2 (Motor Skills Development)",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 60,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SPORTS, HEALTH, AND WELLNESS",
    subject: "Physical Education 1 (Fitness and Recreation)",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 60,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SPORTS, HEALTH, AND WELLNESS",
    subject: "Physical Education 2 (Sports and Dance)",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 60,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SPORTS, HEALTH, AND WELLNESS",
    subject: "Sports Activity Management",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 60,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SPORTS, HEALTH, AND WELLNESS",
    subject: "Sports Coaching",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 60,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "SPORTS, HEALTH, AND WELLNESS",
    subject: "Sports Officiating",
    gradeLvl: "11, 12",
    g11Terms: 1,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 60,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - ACADEMIC",
    cluster: "OTHER ELECTIVE / SPECIAL CURRICULAR PROGRAM",
    subject: "0",
    gradeLvl: "11, 12",
    g11Terms: 0,
    g12Terms: 0,
    terms: 1,
    ww: 0,
    pt: 0,
    ex: 0,
    st1: 0,
    st2: 0,
    te: 0
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "AESTHETIC, WELLNESS, AND HUMAN CARE",
    subject: "Caregiving (Adult Care)",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "AESTHETIC, WELLNESS, AND HUMAN CARE",
    subject: "Caregiving (Child Care)",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "AESTHETIC, WELLNESS, AND HUMAN CARE",
    subject: "Hairdressing Services",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "AGRI-FISHERY BUSINESS AND FOOD INNOVATION  ",
    subject: "Agricultural Crops Production",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "AGRI-FISHERY BUSINESS AND FOOD INNOVATION  ",
    subject: "Agro-entrepreneurship",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "AGRI-FISHERY BUSINESS AND FOOD INNOVATION  ",
    subject: "Aquaculture",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "AGRI-FISHERY BUSINESS AND FOOD INNOVATION  ",
    subject: "Fish Capture Operation",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "AGRI-FISHERY BUSINESS AND FOOD INNOVATION  ",
    subject: "Food Processing",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "AGRI-FISHERY BUSINESS AND FOOD INNOVATION  ",
    subject: "Organic Agriculture Production",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "AGRI-FISHERY BUSINESS AND FOOD INNOVATION  ",
    subject: "Poultry Production (Chicken)",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "AGRI-FISHERY BUSINESS AND FOOD INNOVATION  ",
    subject: "Ruminants Production",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "AGRI-FISHERY BUSINESS AND FOOD INNOVATION  ",
    subject: "Swine Production",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "ARTISANRY AND CREATIVE ENTERPRISE ",
    subject: "Garments Artisanry",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "ARTISANRY AND CREATIVE ENTERPRISE ",
    subject: "Handicrafts: Weaving",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "AUTOMOTIVE AND SMALL ENGINE TECHNOLOGIES ",
    subject: "Driving and Automotive Servicing",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "AUTOMOTIVE AND SMALL ENGINE TECHNOLOGIES ",
    subject: "Motorcycle and Small Engine Servicing",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "AUTOMOTIVE AND SMALL ENGINE TECHNOLOGIES ",
    subject: "Automotive Servicing (Electrical Repair)",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "AUTOMOTIVE AND SMALL ENGINE TECHNOLOGIES ",
    subject: "Automotive Servicing (Engine and Chassis Repairs)",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "CONSTRUCTION AND BUILDING TECHNOLOGIES",
    subject: "Carpentry",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "CONSTRUCTION AND BUILDING TECHNOLOGIES",
    subject: "Construction Operation",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "CONSTRUCTION AND BUILDING TECHNOLOGIES",
    subject: "Manual Metal Arc Welding",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "CONSTRUCTION AND BUILDING TECHNOLOGIES",
    subject: "Technical Drafting",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "CREATIVE ARTS AND DESIGN TECHNOLOGIES",
    subject: "Animation",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "CREATIVE ARTS AND DESIGN TECHNOLOGIES",
    subject: "Illustration",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "CREATIVE ARTS AND DESIGN TECHNOLOGIES",
    subject: "Visual Graphic Design",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "HOSPITALITY AND TOURISM",
    subject: "Bakery Operations",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "HOSPITALITY AND TOURISM",
    subject: "Events Management Services",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "HOSPITALITY AND TOURISM",
    subject: "Food and Beverage Operation",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "HOSPITALITY AND TOURISM",
    subject: "Hotel Operations (Front Office Services)",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "HOSPITALITY AND TOURISM",
    subject: "Hotel Operations (Housekeeping Services)",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "HOSPITALITY AND TOURISM",
    subject: "Kitchen Operations",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "ICT SUPPORT AND COMPUTER PROGRAMMING TECHNOLOGIES",
    subject: "Broadband Installation",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "ICT SUPPORT AND COMPUTER PROGRAMMING TECHNOLOGIES",
    subject: "Computer Programming (.Net Technology)",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "ICT SUPPORT AND COMPUTER PROGRAMMING TECHNOLOGIES",
    subject: "Computer Programming (Java) ( NC III )",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "ICT SUPPORT AND COMPUTER PROGRAMMING TECHNOLOGIES",
    subject: "Computer Programming (Java)",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "ICT SUPPORT AND COMPUTER PROGRAMMING TECHNOLOGIES",
    subject: "Computer Programming (Oracle Database)",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "ICT SUPPORT AND COMPUTER PROGRAMMING TECHNOLOGIES",
    subject: "Computer Systems Servicing",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "ICT SUPPORT AND COMPUTER PROGRAMMING TECHNOLOGIES",
    subject: "Contact Center Services",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "INDUSTRIAL TECHNOLOGIES",
    subject: "Domestic Refrigeration and Air-Conditioning Servicing",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "INDUSTRIAL TECHNOLOGIES",
    subject: "Electrical Installation and Maintenance",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "INDUSTRIAL TECHNOLOGIES",
    subject: "Electronic Products Assembly and Servicing",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "INDUSTRIAL TECHNOLOGIES",
    subject: "Photovoltaic Systems Installation",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "INDUSTRIAL TECHNOLOGIES",
    subject: "Commercial Air-Conditioning Installation and Servicing",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "INDUSTRIAL TECHNOLOGIES",
    subject: "Mechatronics",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "MARITIME",
    subject: "Marine Engineering at the Support Level",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "MARITIME",
    subject: "Marine Transportation at the Support Level",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "MARITIME",
    subject: "Ships Catering Services",
    gradeLvl: "11, 12",
    g11Terms: 3,
    g12Terms: 1,
    terms: 3,
    ww: 15,
    pt: 65,
    ex: 20,
    st1: 30,
    st2: 30,
    te: 40
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "WORK IMMERSION",
    subject: "Work Immersion for Tech-Pro Track (320 hours)",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 80,
    ex: 0,
    st1: 0,
    st2: 0,
    te: 0
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "WORK IMMERSION",
    subject: "Work Immersion for Tech-Pro Track (540 hours) - 1 Term",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 80,
    ex: 0,
    st1: 0,
    st2: 0,
    te: 0
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "WORK IMMERSION",
    subject: "Work Immersion for Tech-Pro Track (640 hours) - 1 Term",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 1,
    terms: 1,
    ww: 20,
    pt: 80,
    ex: 0,
    st1: 0,
    st2: 0,
    te: 0
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "WORK IMMERSION",
    subject: "Work Immersion for Tech-Pro Track (540 hours) - 2 Terms",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 2,
    terms: 2,
    ww: 20,
    pt: 80,
    ex: 0,
    st1: 0,
    st2: 0,
    te: 0
  },
  {
    category: "SSHS - TECH-PRO",
    cluster: "WORK IMMERSION",
    subject: "Work Immersion for Tech-Pro Track (640 hours) - 2 Terms",
    gradeLvl: "gr 12",
    g11Terms: 0,
    g12Terms: 2,
    terms: 2,
    ww: 20,
    pt: 80,
    ex: 0,
    st1: 0,
    st2: 0,
    te: 0
  },
];


export const SSHS_GRADE11_CATALOG = SSHS_FULL_CATALOG;

export interface ResolvedSSHSMetadata extends SSHSCatalogItem {
  unitsPerTerm: number;
  unitsPerYear: number;
  weights: {
    ww: number;
    pt: number;
    ex: number;
    st1: number;
    st2: number;
    te: number;
  };
}

/**
 * Resolves full SSHS metadata (Category, Cluster, Subject Name, Terms, Units, Weights)
 * adhering strictly to the official HELPER sheet in DepEd DO 15 s. 2026.
 * Supports both Grade 11 and Grade 12.
 */
export function resolveSSHSMetadata(subject: Subject, gradeLevel = 11): ResolvedSSHSMetadata {
  const normSubj = (subject.subject_name || '').trim().toLowerCase();
  const rawCat = ((subject as any).category || (subject as any).subject_category || '').toUpperCase();
  const rawClust = ((subject as any).cluster || (subject as any).subject_cluster || '').toUpperCase();

  const isG12 = gradeLevel === 12;

  // 1. Exact catalog match by subject name
  let found = SSHS_FULL_CATALOG.find(e => e.subject.toLowerCase() === normSubj);

  // 2. Fuzzy match within catalog if exact not found
  if (!found) {
    found = SSHS_FULL_CATALOG.find(e =>
      normSubj.includes(e.subject.toLowerCase()) || e.subject.toLowerCase().includes(normSubj)
    );
  }

  if (found) {
    let terms = isG12 ? (found.g12Terms > 0 ? found.g12Terms : found.terms) : (found.g11Terms > 0 ? found.g11Terms : found.terms);
    if (!terms || terms <= 0) terms = isG12 ? 1 : 3;

    let category = found.category;
    let cluster = found.cluster;

    if (isG12 && category === 'SSHS - CORE') {
      category = 'SSHS - ACADEMIC';
      cluster = 'ARTS, SOCIAL SCIENCES, AND HUMANITIES';
      terms = 1;
    }

    if (subject.term === 1 || subject.term === 2 || subject.term === 3 || String(subject.term) === '1' || String(subject.term) === '2' || String(subject.term) === '3') {
      terms = 1;
    } else if (subject.term === 'all') {
      terms = 3;
    }

    const explicitUnits = Number((subject as any)?.units);
    let unitsPerTerm = !isNaN(explicitUnits) && explicitUnits > 0 
      ? explicitUnits 
      : (category === 'SSHS - CORE' ? 2 : (category === 'SSHS - TECH-PRO' ? (isG12 ? 12 : 4) : 3));

    if (!explicitUnits && (subject as any)?.hours) {
      const h = Number((subject as any).hours);
      if (h >= 320) unitsPerTerm = isG12 ? 12 : 4;
      else if (h >= 160) unitsPerTerm = terms === 3 ? 2 : 6;
      else if (h >= 80) unitsPerTerm = 3;
    }

    const unitsPerYear = unitsPerTerm * terms;

    return {
      ...found,
      category,
      cluster,
      terms,
      unitsPerTerm,
      unitsPerYear,
      weights: {
        ww: found.ww,
        pt: found.pt,
        ex: found.ex,
        st1: found.st1,
        st2: found.st2,
        te: found.te
      }
    };
  }

  // 3. Fallback resolution for custom or unlisted subjects
  let category: 'SSHS - CORE' | 'SSHS - ACADEMIC' | 'SSHS - TECH-PRO' = 'SSHS - ACADEMIC';
  if (!isG12 && (rawCat.includes('CORE') || normSubj.includes('komunikasyon') || normSubj.includes('general mathematics') || normSubj.includes('general science') || normSubj.includes('kasaysayan') || normSubj.includes('life and career'))) {
    category = 'SSHS - CORE';
  } else if (rawCat.includes('TECH') || rawCat.includes('PRO') || normSubj.includes('welding') || normSubj.includes('automotive') || normSubj.includes('carpentry') || normSubj.includes('caregiving') || normSubj.includes('tourism') || normSubj.includes('maritime') || normSubj.includes('electrical')) {
    category = 'SSHS - TECH-PRO';
  }

  let cluster = 'CORE';
  if (category === 'SSHS - CORE') {
    cluster = 'CORE';
  } else if (category === 'SSHS - TECH-PRO') {
    cluster = rawClust || 'CONSTRUCTION AND BUILDING TECHNOLOGIES';
  } else if (rawClust) {
    cluster = rawClust;
  } else if (normSubj.includes('calculus') || normSubj.includes('math') || normSubj.includes('physics') || normSubj.includes('chemistry') || normSubj.includes('biology')) {
    cluster = 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS';
  } else if (normSubj.includes('business') || normSubj.includes('accounting') || normSubj.includes('management') || normSubj.includes('entrepreneurship')) {
    cluster = 'BUSINESS AND ENTREPRENEURSHIP';
  } else if (normSubj.includes('research') || normSubj.includes('innovation') || normSubj.includes('immersion') || normSubj.includes('apprenticeship')) {
    cluster = 'FIELD EXPERIENCE';
  } else if (normSubj.includes('sports') || normSubj.includes('physical education') || normSubj.includes('health') || normSubj.includes('first aid')) {
    cluster = 'SPORTS, HEALTH, AND WELLNESS';
  } else {
    cluster = 'ARTS, SOCIAL SCIENCES, AND HUMANITIES';
  }

  let terms = category === 'SSHS - CORE' ? 3 : 1;
  if (subject.term === 1 || subject.term === 2 || subject.term === 3 || String(subject.term) === '1' || String(subject.term) === '2' || String(subject.term) === '3') {
    terms = 1;
  } else if (subject.term === 'all') {
    terms = 3;
  }

  const explicitUnits = Number((subject as any)?.units);
  let unitsPerTerm = !isNaN(explicitUnits) && explicitUnits > 0 
    ? explicitUnits 
    : (category === 'SSHS - CORE' ? 2 : (category === 'SSHS - TECH-PRO' ? (isG12 ? 12 : 4) : 3));

  if (!explicitUnits && (subject as any)?.hours) {
    const h = Number((subject as any).hours);
    if (h >= 320) unitsPerTerm = isG12 ? 12 : 4;
    else if (h >= 160) unitsPerTerm = terms === 3 ? 2 : 6;
    else if (h >= 80) unitsPerTerm = 3;
  }

  const unitsPerYear = unitsPerTerm * terms;

  // Default weights per DepEd Order 15, s. 2026
  let ww = 20;
  let pt = 50;
  let ex = 30;
  let st1 = 30;
  let st2 = 30;
  let te = 40;

  if (category === 'SSHS - TECH-PRO') {
    if (cluster.includes('IMMERSION') || normSubj.includes('immersion')) {
      ww = 20; pt = 80; ex = 0; st1 = 0; st2 = 0; te = 0;
    } else {
      ww = 15; pt = 65; ex = 20; st1 = 30; st2 = 30; te = 40;
    }
  } else if (cluster === 'FIELD EXPERIENCE') {
    if (normSubj.includes('research') || normSubj.includes('innovation') || normSubj.includes('design')) {
      ww = 40; pt = 60; ex = 0; st1 = 0; st2 = 0; te = 0;
    } else if (normSubj.includes('immersion')) {
      ww = 20; pt = 80; ex = 0; st1 = 0; st2 = 0; te = 100;
    } else {
      ww = 15; pt = 70; ex = 15; st1 = 0; st2 = 0; te = 100;
    }
  } else if (cluster === 'ARTS, SOCIAL SCIENCES, AND HUMANITIES') {
    const isStudioOrArts = normSubj.includes('art') || normSubj.includes('creative') || normSubj.includes('music') ||
      normSubj.includes('theater') || normSubj.includes('dance') || normSubj.includes('media');
    if (isStudioOrArts) {
      ww = 20; pt = 60; ex = 20; st1 = 30; st2 = 30; te = 40;
    } else {
      ww = 20; pt = 50; ex = 30; st1 = 30; st2 = 30; te = 40;
    }
  } else if (cluster === 'SPORTS, HEALTH, AND WELLNESS') {
    ww = 20; pt = 60; ex = 20; st1 = 30; st2 = 30; te = 40;
  } else if (cluster === 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS') {
    ww = 20; pt = 50; ex = 30; st1 = 0; st2 = 0; te = 100;
  }

  return {
    category,
    cluster,
    subject: subject.subject_name.trim(),
    gradeLvl: isG12 ? '12' : '11',
    g11Terms: isG12 ? 0 : terms,
    g12Terms: isG12 ? terms : 0,
    terms,
    unitsPerTerm,
    unitsPerYear,
    ww, pt, ex, st1, st2, te,
    weights: { ww, pt, ex, st1, st2, te }
  };
}

/**
 * Categorizes an SSHS subject to its valid official dropdown values:
 * Category: "SSHS - CORE", "SSHS - ACADEMIC", "SSHS - TECH-PRO"
 */
export function getSSHSCategory(subject: Subject, gradeLevel = 11): string {
  return resolveSSHSMetadata(subject, gradeLevel).category;
}

/**
 * Maps subject cluster to official SSHS Cluster options.
 */
export function getSSHSCluster(subject: Subject, gradeLevel = 11): string {
  return resolveSSHSMetadata(subject, gradeLevel).cluster;
}

/**
 * Sorts students alphabetically by last_name, first_name, middle_name according to standard DepEd sorting.
 */
export function sortStudentsAlphabetically(list: Student[]): Student[] {
  return [...list].sort((a, b) => {
    const lastA = (a.last_name || '').trim().toLowerCase();
    const lastB = (b.last_name || '').trim().toLowerCase();
    if (lastA !== lastB) return lastA.localeCompare(lastB);

    const firstA = (a.first_name || '').trim().toLowerCase();
    const firstB = (b.first_name || '').trim().toLowerCase();
    if (firstA !== firstB) return firstA.localeCompare(firstB);

    const midA = (a.middle_name || '').trim().toLowerCase();
    const midB = (b.middle_name || '').trim().toLowerCase();
    return midA.localeCompare(midB);
  });
}

/**
 * Accurately matches records by subject ID, clean name, peer subject mapping, or legacy fallback.
 */
export function isMatchingRecordSubject(
  targetSubject: Subject,
  recSubjectId?: string,
  recSubjectName?: string
): boolean {
  if (!recSubjectId && !recSubjectName) return false;
  if (targetSubject.id && recSubjectId === targetSubject.id) return true;
  if (targetSubject.subject_name) {
    if (recSubjectName && isSameSubject(targetSubject.id, targetSubject.subject_name, recSubjectId || '', recSubjectName)) {
      return true;
    }
    if (isMatchingSubject(targetSubject.subject_name, recSubjectId || '', recSubjectName || '')) {
      return true;
    }
  }
  return false;
}

/**
 * Normalizes school year variations (e.g. "2026-2027", "2026 – 2027", "2026")
 */
export function isMatchingSchoolYear(recSy?: string, targetSy?: string): boolean {
  if (!recSy || !targetSy) return true;
  const cleanRec = recSy.replace(/[\s–—-]+/g, '-').trim();
  const cleanTarget = targetSy.replace(/[\s–—-]+/g, '-').trim();
  if (cleanRec === cleanTarget) return true;
  const startYear = getStartYear(targetSy);
  return recSy.includes(String(startYear));
}

/**
 * Intelligently resolves the number of terms and term block for SSHS (Grade 11 & Grade 12)
 * based on curriculum rules (DO 017 Core universal 3-terms), section metadata, subject settings,
 * encoded grades in classRecords/hpsRecords, and official defaults.
 */
export function resolveSSHSTerms(
  subject?: Subject,
  section?: Section,
  classRecords?: ClassRecord[],
  hpsRecords?: HPSRecord[],
  schoolYear?: string,
  explicitTermBlock?: string,
  explicitNumTerms?: number
): ResolvedSSHSTerms {
  const norm = (subject?.subject_name || '').toLowerCase();
  const sName = subject?.subject_name || '';
  const sId = subject?.id || '';
  const gradeMatch = String(section?.section_grade_level || (subject as any)?.grade_level || '').match(/(\d+)/);
  const gradeLevel = gradeMatch ? parseInt(gradeMatch[1], 10) : 11;

  // 1. Grade 11 Universal Core Subjects are ALWAYS 3 terms per DepEd DO 017, s. 2026
  if (gradeLevel === 11 && (isGrade11CoreSubject(sName) || [
    'effective communication', 'mabisang komunikasyon',
    'general mathematics', 'general science',
    'life and career skills', 'pag-aaral ng kasaysayan at lipunang pilipino', 'kasaysayan at lipunang pilipino'
  ].some(c => norm.includes(c)))) {
    return { numTerms: 3, termBlock: '', termDesc: '1ST, 2ND, 3RD', code: 33 };
  }

  // 2. Explicit term block override if provided and NOT the generic unconfigured '1ST, 2ND, 3RD'
  if (explicitTermBlock && explicitTermBlock !== '1ST, 2ND, 3RD') {
    const tb = String(explicitTermBlock).toUpperCase();
    const nt = explicitNumTerms || 1;
    if (nt === 3 || tb.includes('ALL')) {
      return { numTerms: 3, termBlock: '', termDesc: '1ST, 2ND, 3RD', code: 33 };
    }
    if (nt === 2) {
      if (tb.includes('2ND') || tb.includes('SECOND') || tb.includes('TERM 2') || tb.includes('T2')) {
        return { numTerms: 2, termBlock: 'SECOND TERM', termDesc: '2ND & 3RD', code: 22 };
      }
      return { numTerms: 2, termBlock: 'FIRST TERM', termDesc: '1ST & 2ND', code: 21 };
    }
    if (tb.includes('3RD') || tb.includes('THIRD') || tb.includes('TERM 3') || tb.includes('T3')) {
      return { numTerms: 1, termBlock: 'THIRD TERM', termDesc: '3RD', code: 13 };
    }
    if (tb.includes('2ND') || tb.includes('SECOND') || tb.includes('TERM 2') || tb.includes('T2')) {
      return { numTerms: 1, termBlock: 'SECOND TERM', termDesc: '2ND', code: 12 };
    }
    return { numTerms: 1, termBlock: 'FIRST TERM', termDesc: '1ST', code: 11 };
  }

  // 3. Check section_metadata.subjectTerms
  const subjectTermsMeta = (section?.section_metadata as Record<string, unknown> | undefined)?.subjectTerms as Record<string, unknown> | undefined;
  const metaTerm = subjectTermsMeta?.[sName] ?? subjectTermsMeta?.[sId];
  if (metaTerm !== undefined && metaTerm !== null) {
    if (metaTerm === 1 || metaTerm === '1') return { numTerms: 1, termBlock: 'FIRST TERM', termDesc: '1ST', code: 11 };
    if (metaTerm === 2 || metaTerm === '2') return { numTerms: 1, termBlock: 'SECOND TERM', termDesc: '2ND', code: 12 };
    if (metaTerm === 3 || metaTerm === '3') return { numTerms: 1, termBlock: 'THIRD TERM', termDesc: '3RD', code: 13 };
    if (metaTerm === 'all') return { numTerms: 3, termBlock: '', termDesc: '1ST, 2ND, 3RD', code: 33 };
    if (typeof metaTerm === 'string' && metaTerm.includes(',')) {
      const parts = metaTerm.split(',').map(p => Number(p.trim())).filter(n => n >= 1 && n <= 3);
      if (parts.length === 3) return { numTerms: 3, termBlock: '', termDesc: '1ST, 2ND, 3RD', code: 33 };
      if (parts.length === 2) {
        if (parts.includes(2) && parts.includes(3)) return { numTerms: 2, termBlock: 'SECOND TERM', termDesc: '2ND & 3RD', code: 22 };
        return { numTerms: 2, termBlock: 'FIRST TERM', termDesc: '1ST & 2ND', code: 21 };
      }
      if (parts.length === 1) {
        if (parts[0] === 2) return { numTerms: 1, termBlock: 'SECOND TERM', termDesc: '2ND', code: 12 };
        if (parts[0] === 3) return { numTerms: 1, termBlock: 'THIRD TERM', termDesc: '3RD', code: 13 };
        return { numTerms: 1, termBlock: 'FIRST TERM', termDesc: '1ST', code: 11 };
      }
    }
  }

  // 4. Check subject.term
  if (subject?.term === 1 || String(subject?.term) === '1') return { numTerms: 1, termBlock: 'FIRST TERM', termDesc: '1ST', code: 11 };
  if (subject?.term === 2 || String(subject?.term) === '2') return { numTerms: 1, termBlock: 'SECOND TERM', termDesc: '2ND', code: 12 };
  if (subject?.term === 3 || String(subject?.term) === '3') return { numTerms: 1, termBlock: 'THIRD TERM', termDesc: '3RD', code: 13 };
  if (subject?.term === 'all') return { numTerms: 3, termBlock: '', termDesc: '1ST, 2ND, 3RD', code: 33 };

  // 5. Scan active quarters in classRecords and hpsRecords
  const sy = schoolYear || '';
  const dummySubj: Subject = subject || ({ id: sId, subject_name: sName, grade_level: `Grade ${gradeLevel}` } as Subject);
  const activeTerms = [1, 2, 3].filter(t => {
    const hasHps = (hpsRecords || []).some(h =>
      isMatchingRecordSubject(dummySubj, h.subject_id, h.subject_name) &&
      isMatchingSchoolYear(h.school_year, sy) &&
      Number(h.quarter) === t &&
      ((h.written_works && h.written_works.some(w => w !== '' && w !== 0 && w !== null && !isNaN(Number(w)))) ||
       (h.performance_tasks && h.performance_tasks.some(p => p !== '' && p !== 0 && p !== null && !isNaN(Number(p)))) ||
       (h.quarterly_exam !== undefined && h.quarterly_exam !== '' && h.quarterly_exam !== null && Number(h.quarterly_exam) > 0))
    );
    const hasScores = (classRecords || []).some(c =>
      isMatchingRecordSubject(dummySubj, c.subject_id, c.subject_name) &&
      isMatchingSchoolYear(c.school_year, sy) &&
      Number(c.quarter) === t &&
      ((c.written_works && c.written_works.some(w => w !== '' && w !== 0 && w !== null && !isNaN(Number(w)))) ||
       (c.performance_tasks && c.performance_tasks.some(p => p !== '' && p !== 0 && p !== null && !isNaN(Number(p)))) ||
       (c.quarterly_exam !== undefined && c.quarterly_exam !== '' && c.quarterly_exam !== null && Number(c.quarterly_exam) > 0) ||
       (c.final_grade !== undefined && c.final_grade !== '' && c.final_grade !== null && Number(c.final_grade) > 0))
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
    return { numTerms: 3, termBlock: '', termDesc: '1ST, 2ND, 3RD', code: 33 };
  }

  // 6. Curriculum sequence default (e.g. Chemistry 1 = Term 1, Chemistry 2 = Term 2)
  if (sName) {
    const defTerm = getDefaultTermForSubject(sName, gradeLevel);
    if (defTerm === 1) return { numTerms: 1, termBlock: 'FIRST TERM', termDesc: '1ST', code: 11 };
    if (defTerm === 2) return { numTerms: 1, termBlock: 'SECOND TERM', termDesc: '2ND', code: 12 };
    if (defTerm === 3) return { numTerms: 1, termBlock: 'THIRD TERM', termDesc: '3RD', code: 13 };
    if (defTerm === 'all') return { numTerms: 3, termBlock: '', termDesc: '1ST, 2ND, 3RD', code: 33 };
  }

  // 7. Catalog metadata fallback
  const meta = resolveSSHSMetadata(dummySubj, gradeLevel);
  if (meta.terms === 3) return { numTerms: 3, termBlock: '', termDesc: '1ST, 2ND, 3RD', code: 33 };
  if (meta.terms === 2) return { numTerms: 2, termBlock: 'FIRST TERM', termDesc: '1ST & 2ND', code: 21 };

  return { numTerms: 1, termBlock: 'FIRST TERM', termDesc: '1ST', code: 11 };
}

/**
 * Populates sheet2.xml (INPUT DATA).
 */
function populateSSHSInputDataXml(sheetXml: string, options: SSHSExportOptions): string {
  const { schoolProfile, schoolYear, section, subject, students, teacherName } = options;

  const startYear = getStartYear(schoolYear);
  const region = normalizeRegionForECR(schoolProfile?.region || 'Region III');
  const division = (schoolProfile?.division || '').toUpperCase();
  const schoolId = schoolProfile?.school_id || '';
  const schoolName = (schoolProfile?.name || '').toUpperCase();
  const teacher = (teacherName || section.adviser_name || '').toUpperCase();
  const gradeMatch = String(section.section_grade_level || (subject as any).grade_level || '').match(/(\d+)/);
  const gradeLevel = gradeMatch ? parseInt(gradeMatch[1], 10) : 11;
  const sectionName = (section.section_name || '').toUpperCase();

  const meta = resolveSSHSMetadata(subject, gradeLevel);
  const category = meta.category;
  const cluster = meta.cluster;
  const subjectName = meta.subject;

  const resolvedTerms = options.resolvedTerms || resolveSSHSTerms(
    subject,
    section,
    options.classRecords,
    options.hpsRecords,
    schoolYear,
    options.termBlock,
    options.numTerms
  );

  const numTermsTaught = resolvedTerms.numTerms;
  const termBlockDisplay = resolvedTerms.termBlock;
  const termBlockNum = resolvedTerms.numTerms === 3 ? 3 : (resolvedTerms.termBlock === 'FIRST TERM' ? 1 : resolvedTerms.termBlock === 'SECOND TERM' ? 2 : 3);
  const helperCode = resolvedTerms.code;

  const males = sortStudentsAlphabetically(
    students.filter(s => (s.gender || '').toLowerCase() === 'male')
  ).slice(0, MAX_STUDENTS_PER_GENDER);

  const females = sortStudentsAlphabetically(
    students.filter(s => (s.gender || '').toLowerCase() === 'female')
  ).slice(0, MAX_STUDENTS_PER_GENDER);

  let xml = sheetXml;

  // Split into rows (safely handling self-closing rows)
  const rowRegex = /<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g;
  xml = xml.replace(rowRegex, (fullMatch, attrs, rowContent) => {
    if (rowContent === undefined) return fullMatch;
    const rMatch = attrs.match(/\br="(\d+)"/);
    const r = rMatch ? parseInt(rMatch[1], 10) : -1;
    let updated = `<row${attrs}>${rowContent}</row>`;

    if (r === 10) updated = setCellString(updated, 'F', 10, region);
    if (r === 11) updated = setCellString(updated, 'F', 11, division);
    if (r === 13) updated = setCellString(updated, 'F', 13, schoolId);
    if (r === 14) updated = setCellString(updated, 'F', 14, schoolName);
    if (r === 16) updated = setCellNumber(updated, 'F', 16, startYear);
    if (r === 22) updated = setCellString(updated, 'F', 22, teacher);
    if (r === 24) updated = setCellNumber(updated, 'F', 24, gradeLevel);
    if (r === 25) updated = setCellString(updated, 'F', 25, sectionName);
    if (r === 28) updated = setCellString(updated, 'F', 28, category);
    if (r === 29) updated = setCellString(updated, 'F', 29, cluster);
    if (r === 30) updated = setCellString(updated, 'F', 30, subjectName);

    if (r === 33) {
      updated = updateCellFormulaValue(updated, 'F', 33, numTermsTaught);
      updated = updateCellFormulaValue(updated, 'H', 33, termBlockDisplay, 'str');
      updated = updateCellFormulaValue(updated, 'I', 33, termBlockNum);
    }
    if (r === 34) {
      updated = updateCellFormulaValue(updated, 'F', 34, meta.unitsPerTerm);
      updated = updateCellFormulaValue(updated, 'I', 34, helperCode);
    }
    if (r === 35) {
      updated = updateCellFormulaValue(updated, 'F', 35, meta.unitsPerYear);
    }

    // Student Rosters (Rows 11 to 60)
    if (r >= 11 && r <= 60) {
      const idx = r - 11;

      // Male (Cols N & O)
      if (idx < males.length) {
        const m = males[idx];
        updated = setCellString(updated, 'N', r, m.lrn || '');
        updated = setCellString(updated, 'O', r, formatDepEdStudentName(m));
      } else {
        updated = setCellString(updated, 'N', r, '');
        updated = setCellString(updated, 'O', r, '');
      }

      // Female (Cols R & S)
      if (idx < females.length) {
        const f = females[idx];
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
 * Populates a single Term grading sheet (sheet3 = Term 1, sheet4 = Term 2, sheet5 = Term 3).
 * Injects raw scores, preserves OpenXML formulas, and pre-computes cached formula values
 * (<v>) for Totals, PS, WS, Initial Grade, and Transmuted Term Grade.
 */
function populateSSHSTermXml(
  sheetXml: string,
  term: 1 | 2 | 3,
  options: SSHSExportOptions
): string {
  const { schoolProfile, schoolYear, section, subject, students, classRecords, hpsRecords, teacherName } = options;

  const gradeMatch = String(section.section_grade_level || (subject as any).grade_level || '').match(/(\d+)/);
  const gradeLevel = gradeMatch ? parseInt(gradeMatch[1], 10) : 11;
  const sectionName = (section.section_name || '').toUpperCase();
  const teacher = (teacherName || section.adviser_name || '').toUpperCase();
  const meta = resolveSSHSMetadata(subject, gradeLevel);
  const cluster = meta.cluster;
  const subjectName = (subject.subject_name || meta.subject || '').toUpperCase();

  const resolvedTerms = options.resolvedTerms || resolveSSHSTerms(
    subject,
    section,
    classRecords,
    hpsRecords,
    schoolYear,
    options.termBlock,
    options.numTerms
  );

  const isTermActive =
    resolvedTerms.numTerms === 3 ||
    (resolvedTerms.numTerms === 2 ? (resolvedTerms.termBlock === 'SECOND TERM' ? (term === 2 || term === 3) : (term === 1 || term === 2)) : false) ||
    (resolvedTerms.numTerms === 1 ? (resolvedTerms.termBlock === 'FIRST TERM' ? term === 1 : resolvedTerms.termBlock === 'SECOND TERM' ? term === 2 : term === 3) : false);

  // Find HPS Record for this term
  const hps = (hpsRecords || []).find(
    h => isMatchingRecordSubject(subject, h.subject_id, h.subject_name) &&
         Number(h.quarter) === term &&
         isMatchingSchoolYear(h.school_year, schoolYear)
  ) || {
    written_works: [],
    performance_tasks: [],
    quarterly_exam: '',
    summative_tests: []
  };

  const wwHps = normalizeScores(hps.written_works, SSHS_WW_COUNT);
  const ptHps = normalizeScores(hps.performance_tasks, SSHS_PT_COUNT);
  const stHps = normalizeScores((hps as any)?.summative_tests, SSHS_ST_COUNT);
  const teHps = hps.quarterly_exam ?? '';

  const males = sortStudentsAlphabetically(
    students.filter(s => (s.gender || '').toLowerCase() === 'male')
  ).slice(0, MAX_STUDENTS_PER_GENDER);

  const females = sortStudentsAlphabetically(
    students.filter(s => (s.gender || '').toLowerCase() === 'female')
  ).slice(0, MAX_STUDENTS_PER_GENDER);

  const wwCols = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
  const ptCols = ['Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  // Calculate HPS totals
  const wwHpsTotal = wwHps.reduce<number>((acc, v) => acc + (v !== '' && !isNaN(Number(v)) ? Number(v) : 0), 0);
  const ptHpsTotal = ptHps.reduce<number>((acc, v) => acc + (v !== '' && !isNaN(Number(v)) ? Number(v) : 0), 0);
  const st1HpsVal = stHps[0] !== '' && !isNaN(Number(stHps[0])) ? Number(stHps[0]) : 0;
  const st2HpsVal = stHps[1] !== '' && !isNaN(Number(stHps[1])) ? Number(stHps[1]) : 0;
  const teHpsVal = teHps !== '' && !isNaN(Number(teHps)) ? Number(teHps) : 0;

  let xml = sheetXml;
  const rowRegex = /<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g;

  xml = xml.replace(rowRegex, (fullMatch, attrs, rowContent) => {
    if (rowContent === undefined) return fullMatch;
    const rMatch = attrs.match(/\br="(\d+)"/);
    const r = rMatch ? parseInt(rMatch[1], 10) : -1;
    let updated = `<row${attrs}>${rowContent}</row>`;

    // Header updates
    if (r === 6) {
      updated = setCellString(updated, 'H', 6, normalizeRegionForECR(schoolProfile?.region || 'Region III'));
      updated = setCellString(updated, 'P', 6, (schoolProfile?.division || '').toUpperCase());
      updated = setCellString(updated, 'AA', 6, schoolProfile?.school_id || '');
    }
    if (r === 7) {
      updated = setCellString(updated, 'H', 7, (schoolProfile?.name || '').toUpperCase());
    }

    // Row 8: Set B8 warning if inactive term sheet, or empty string if active
    if (r === 8) {
      if (isTermActive) {
        updated = updateCellFormulaValue(updated, 'B', 8, '', 'str');
      } else {
        updated = updateCellFormulaValue(updated, 'B', 8, 'INCORRECT SHEET. Do not use this sheet to input data.', 'str');
      }
    }

    // Row 9 & 10: Metadata headers
    if (r === 9) {
      updated = setCellNumber(updated, 'H', 9, gradeLevel);
      updated = setCellString(updated, 'N', 9, sectionName);
      updated = setCellString(updated, 'U', 9, subjectName);
    }
    if (r === 10) {
      updated = setCellString(updated, 'H', 10, teacher);
      updated = setCellString(updated, 'U', 10, cluster);
    }

    // Row 14: Highest Possible Score (HPS)
    if (r === 14) {
      if (isTermActive) {
        wwCols.forEach((col, idx) => {
          const val = wwHps[idx];
          updated = setCellNumber(updated, col, 14, val !== '' && !isNaN(Number(val)) ? Number(val) : '');
        });
        updated = updateCellFormulaValue(updated, 'N', 14, wwHpsTotal > 0 ? wwHpsTotal : 0);

        ptCols.forEach((col, idx) => {
          const val = ptHps[idx];
          updated = setCellNumber(updated, col, 14, val !== '' && !isNaN(Number(val)) ? Number(val) : '');
        });
        updated = updateCellFormulaValue(updated, 'AA', 14, ptHpsTotal > 0 ? ptHpsTotal : 0);

        // ST 1 (AD), ST 2 (AE), TE (AF)
        updated = setCellNumber(updated, 'AD', 14, st1HpsVal > 0 ? st1HpsVal : '');
        updated = setCellNumber(updated, 'AE', 14, st2HpsVal > 0 ? st2HpsVal : '');
        updated = setCellNumber(updated, 'AF', 14, teHpsVal > 0 ? teHpsVal : '');
      } else {
        wwCols.forEach(col => { updated = setCellNumber(updated, col, 14, ''); });
        updated = updateCellFormulaValue(updated, 'N', 14, 0);
        ptCols.forEach(col => { updated = setCellNumber(updated, col, 14, ''); });
        updated = updateCellFormulaValue(updated, 'AA', 14, 0);
        updated = setCellNumber(updated, 'AD', 14, '');
        updated = setCellNumber(updated, 'AE', 14, '');
        updated = setCellNumber(updated, 'AF', 14, '');
      }
    }

    // Helper to compute and inject student scores & cached values
    const populateStudentRow = (student: Student | undefined, rowIdx: number) => {
      if (isTermActive && student) {
        const studentName = formatDepEdStudentName(student);
        updated = updateCellFormulaValue(updated, 'C', rowIdx, studentName, 'str');

        const record = (classRecords || []).find(
          c => c.student_lrn === student.lrn &&
               isMatchingRecordSubject(subject, c.subject_id, c.subject_name) &&
               Number(c.quarter) === term &&
               isMatchingSchoolYear(c.school_year, schoolYear)
        );

        const wwScores = normalizeScores(record?.written_works, SSHS_WW_COUNT);
        const ptScores = normalizeScores(record?.performance_tasks, SSHS_PT_COUNT);
        const stScores = normalizeScores((record as any)?.summative_tests, SSHS_ST_COUNT);
        const teScore = record?.quarterly_exam ?? '';

        let wwSum = 0;
        let hasWW = false;
        wwCols.forEach((col, i) => {
          const val = wwScores[i];
          const hasVal = val !== '' && !isNaN(Number(val));
          if (hasVal) {
            wwSum += Number(val);
            hasWW = true;
          }
          updated = setCellNumber(updated, col, rowIdx, hasVal ? Number(val) : '');
        });

        let ptSum = 0;
        let hasPT = false;
        ptCols.forEach((col, i) => {
          const val = ptScores[i];
          const hasVal = val !== '' && !isNaN(Number(val));
          if (hasVal) {
            ptSum += Number(val);
            hasPT = true;
          }
          updated = setCellNumber(updated, col, rowIdx, hasVal ? Number(val) : '');
        });

        const st1Val = stScores[0];
        const hasST1 = st1Val !== '' && !isNaN(Number(st1Val));
        const st2Val = stScores[1];
        const hasST2 = st2Val !== '' && !isNaN(Number(st2Val));
        const hasTE = teScore !== '' && !isNaN(Number(teScore));

        updated = setCellNumber(updated, 'AD', rowIdx, hasST1 ? Number(st1Val) : '');
        updated = setCellNumber(updated, 'AE', rowIdx, hasST2 ? Number(st2Val) : '');
        updated = setCellNumber(updated, 'AF', rowIdx, hasTE ? Number(teScore) : '');

        // Pre-compute formulas
        const wwTotal = hasWW ? wwSum : '';
        const wwPS = hasWW && wwHpsTotal > 0 ? Math.round((wwSum / wwHpsTotal) * 100 * 100) / 100 : '';
        const wwWS = wwPS !== '' ? Math.round(Number(wwPS) * (meta.weights.ww / 100) * 100) / 100 : '';

        const ptTotal = hasPT ? ptSum : '';
        const ptPS = hasPT && ptHpsTotal > 0 ? Math.round((ptSum / ptHpsTotal) * 100 * 100) / 100 : '';
        const ptWS = ptPS !== '' ? Math.round(Number(ptPS) * (meta.weights.pt / 100) * 100) / 100 : '';

        const st1WS = hasST1 && st1HpsVal > 0 ? Math.round((Number(st1Val) / st1HpsVal) * meta.weights.st1 * 100) / 100 : '';
        const st2WS = hasST2 && st2HpsVal > 0 ? Math.round((Number(st2Val) / st2HpsVal) * meta.weights.st2 * 100) / 100 : '';
        const teWS = hasTE && teHpsVal > 0 ? Math.round((Number(teScore) / teHpsVal) * meta.weights.te * 100) / 100 : '';

        const hasExScore = hasST1 || hasST2 || hasTE;
        let exPS: number | '' = '';
        let exWS: number | '' = '';

        if (meta.weights.ex > 0) {
          if (hasExScore) {
            const sumWs = (hasST1 ? Number(st1WS) : 0) + (hasST2 ? Number(st2WS) : 0) + (hasTE ? Number(teWS) : 0);
            const sumHpsWeights = (meta.weights.st1 > 0 ? meta.weights.st1 : 0) +
                                  (meta.weights.st2 > 0 ? meta.weights.st2 : 0) +
                                  (meta.weights.te > 0 ? meta.weights.te : 0);
            exPS = sumHpsWeights > 0 ? Math.round((sumWs / sumHpsWeights) * 100 * 100) / 100 : 0;
            exWS = Math.round(Number(exPS) * (meta.weights.ex / 100) * 100) / 100;
          }
        }

        const hasAnyScore = hasWW || hasPT || hasExScore;
        let initialGrade: number | '' = '';
        let termGrade: number | '' = '';

        if (hasAnyScore) {
          initialGrade = Math.round(((Number(wwWS) || 0) + (Number(ptWS) || 0) + (Number(exWS) || 0)) * 100) / 100;
          termGrade = transmuteGrade(initialGrade, schoolYear);
        }

        updated = updateCellFormulaValue(updated, 'N', rowIdx, wwTotal);
        updated = updateCellFormulaValue(updated, 'O', rowIdx, wwPS !== '' ? Number(wwPS).toFixed(2) : '');
        updated = updateCellFormulaValue(updated, 'P', rowIdx, wwWS !== '' ? Number(wwWS).toFixed(2) : '');

        updated = updateCellFormulaValue(updated, 'AA', rowIdx, ptTotal);
        updated = updateCellFormulaValue(updated, 'AB', rowIdx, ptPS !== '' ? Number(ptPS).toFixed(2) : '');
        updated = updateCellFormulaValue(updated, 'AC', rowIdx, ptWS !== '' ? Number(ptWS).toFixed(2) : '');

        updated = updateCellFormulaValue(updated, 'AG', rowIdx, st1WS !== '' ? Number(st1WS).toFixed(2) : '');
        updated = updateCellFormulaValue(updated, 'AH', rowIdx, st2WS !== '' ? Number(st2WS).toFixed(2) : '');
        updated = updateCellFormulaValue(updated, 'AI', rowIdx, teWS !== '' ? Number(teWS).toFixed(2) : '');
        updated = updateCellFormulaValue(updated, 'AJ', rowIdx, exPS !== '' ? Number(exPS).toFixed(2) : '');
        updated = updateCellFormulaValue(updated, 'AK', rowIdx, exWS !== '' ? Number(exWS).toFixed(2) : '');

        updated = updateCellFormulaValue(updated, 'AL', rowIdx, initialGrade !== '' ? Number(initialGrade).toFixed(2) : '');
        updated = updateCellFormulaValue(updated, 'AM', rowIdx, termGrade);
      }
    };

    // Male Students: Rows 17 to 66
    if (r >= 17 && r <= 66) {
      const idx = r - 17;
      if (idx < males.length) {
        populateStudentRow(males[idx], r);
      }
    }

    // Female Students: Rows 68 to 117
    if (r >= 68 && r <= 117) {
      const idx = r - 68;
      if (idx < females.length) {
        populateStudentRow(females[idx], r);
      }
    }

    return updated;
  });

  return xml;
}

/**
 * Computes a student's term grade for a specific term using official DO 15 calculation.
 */
function computeStudentTermGrade(
  student: Student,
  term: 1 | 2 | 3,
  options: SSHSExportOptions,
  meta: ResolvedSSHSMetadata
): number | '' {
  const { schoolYear, subject, classRecords, hpsRecords } = options;

  const record = (classRecords || []).find(
    c => c.student_lrn === student.lrn &&
         isMatchingRecordSubject(subject, c.subject_id, c.subject_name) &&
         Number(c.quarter) === term &&
         isMatchingSchoolYear(c.school_year, schoolYear)
  );
  if (!record) return '';

  const hps = (hpsRecords || []).find(
    h => isMatchingRecordSubject(subject, h.subject_id, h.subject_name) &&
         Number(h.quarter) === term &&
         isMatchingSchoolYear(h.school_year, schoolYear)
  );
  if (!hps) {
    if (record.final_grade !== undefined && record.final_grade !== '' && record.final_grade !== null && !isNaN(Number(record.final_grade))) {
      return Number(record.final_grade);
    }
    return '';
  }

  const wwHps = normalizeScores(hps.written_works, SSHS_WW_COUNT);
  const ptHps = normalizeScores(hps.performance_tasks, SSHS_PT_COUNT);
  const stHps = normalizeScores((hps as any)?.summative_tests, SSHS_ST_COUNT);
  const teHps = hps.quarterly_exam ?? '';

  const wwScores = normalizeScores(record.written_works, SSHS_WW_COUNT);
  const ptScores = normalizeScores(record.performance_tasks, SSHS_PT_COUNT);
  const stScores = normalizeScores((record as any)?.summative_tests, SSHS_ST_COUNT);
  const teScore = record.quarterly_exam ?? '';

  const wwHpsTotal = wwHps.reduce<number>((acc, v) => acc + (v !== '' && !isNaN(Number(v)) ? Number(v) : 0), 0);
  const ptHpsTotal = ptHps.reduce<number>((acc, v) => acc + (v !== '' && !isNaN(Number(v)) ? Number(v) : 0), 0);
  const st1HpsVal = stHps[0] !== '' && !isNaN(Number(stHps[0])) ? Number(stHps[0]) : 0;
  const st2HpsVal = stHps[1] !== '' && !isNaN(Number(stHps[1])) ? Number(stHps[1]) : 0;
  const teHpsVal = teHps !== '' && !isNaN(Number(teHps)) ? Number(teHps) : 0;

  let wwSum = 0;
  let hasWW = false;
  wwScores.forEach(v => {
    if (v !== '' && !isNaN(Number(v))) {
      wwSum += Number(v);
      hasWW = true;
    }
  });

  let ptSum = 0;
  let hasPT = false;
  ptScores.forEach(v => {
    if (v !== '' && !isNaN(Number(v))) {
      ptSum += Number(v);
      hasPT = true;
    }
  });

  const hasST1 = stScores[0] !== '' && !isNaN(Number(stScores[0]));
  const hasST2 = stScores[1] !== '' && !isNaN(Number(stScores[1]));
  const hasTE = teScore !== '' && !isNaN(Number(teScore));

  const hasAnyScore = hasWW || hasPT || hasST1 || hasST2 || hasTE;
  if (!hasAnyScore) {
    if (record.final_grade !== undefined && record.final_grade !== '' && record.final_grade !== null && !isNaN(Number(record.final_grade))) {
      return Number(record.final_grade);
    }
    return '';
  }

  const wwPS = hasWW && wwHpsTotal > 0 ? (wwSum / wwHpsTotal) * 100 : 0;
  const wwWS = (wwPS * meta.weights.ww) / 100;

  const ptPS = hasPT && ptHpsTotal > 0 ? (ptSum / ptHpsTotal) * 100 : 0;
  const ptWS = (ptPS * meta.weights.pt) / 100;

  const st1WS = hasST1 && st1HpsVal > 0 ? (Number(stScores[0]) / st1HpsVal) * meta.weights.st1 : 0;
  const st2WS = hasST2 && st2HpsVal > 0 ? (Number(stScores[1]) / st2HpsVal) * meta.weights.st2 : 0;
  const teWS = hasTE && teHpsVal > 0 ? (Number(teScore) / teHpsVal) * meta.weights.te : 0;

  let exWS = 0;
  if (meta.weights.ex > 0) {
    const sumWs = (hasST1 ? st1WS : 0) + (hasST2 ? st2WS : 0) + (hasTE ? teWS : 0);
    const sumHpsWeights = (meta.weights.st1 > 0 ? meta.weights.st1 : 0) +
                          (meta.weights.st2 > 0 ? meta.weights.st2 : 0) +
                          (meta.weights.te > 0 ? meta.weights.te : 0);
    const exPS = sumHpsWeights > 0 ? (sumWs / sumHpsWeights) * 100 : 0;
    exWS = (exPS * meta.weights.ex) / 100;
  }

  const initialGrade = Math.round((wwWS + ptWS + exWS) * 100) / 100;
  return transmuteGrade(initialGrade, schoolYear);
}

/**
 * Populates sheet6.xml (FINAL GRADES).
 * Injects pre-calculated Term Grades, Final Grade, Descriptors, and Remarks
 * while strictly preserving all official Excel formulas.
 */
function populateSSHSFinalGradesXml(sheetXml: string, options: SSHSExportOptions): string {
  const { schoolProfile, section, subject, students, teacherName, schoolYear } = options;
  const gradeMatch = String(section.section_grade_level || (subject as any).grade_level || '').match(/(\d+)/);
  const gradeLevel = gradeMatch ? parseInt(gradeMatch[1], 10) : 11;
  const sectionName = (section.section_name || '').toUpperCase();
  const teacher = (teacherName || section.adviser_name || '').toUpperCase();
  const meta = resolveSSHSMetadata(subject, gradeLevel);
  const subjectName = (subject.subject_name || meta.subject || '').toUpperCase();

  const resolvedTerms = options.resolvedTerms || resolveSSHSTerms(
    subject,
    section,
    options.classRecords,
    options.hpsRecords,
    schoolYear,
    options.termBlock,
    options.numTerms
  );

  const isT1Active =
    resolvedTerms.numTerms === 3 ||
    (resolvedTerms.numTerms === 2 && resolvedTerms.termBlock === 'FIRST TERM') ||
    (resolvedTerms.numTerms === 1 && resolvedTerms.termBlock === 'FIRST TERM');

  const isT2Active =
    resolvedTerms.numTerms === 3 ||
    resolvedTerms.numTerms === 2 ||
    (resolvedTerms.numTerms === 1 && resolvedTerms.termBlock === 'SECOND TERM');

  const isT3Active =
    resolvedTerms.numTerms === 3 ||
    (resolvedTerms.numTerms === 2 && resolvedTerms.termBlock === 'SECOND TERM') ||
    (resolvedTerms.numTerms === 1 && resolvedTerms.termBlock === 'THIRD TERM');

  const termDesc = resolvedTerms.termDesc;
  const numTerms = resolvedTerms.numTerms;

  const males = sortStudentsAlphabetically(
    students.filter(s => (s.gender || '').toLowerCase() === 'male')
  ).slice(0, MAX_STUDENTS_PER_GENDER);

  const females = sortStudentsAlphabetically(
    students.filter(s => (s.gender || '').toLowerCase() === 'female')
  ).slice(0, MAX_STUDENTS_PER_GENDER);

  let xml = sheetXml;
  const rowRegex = /<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g;

  xml = xml.replace(rowRegex, (fullMatch, attrs, rowContent) => {
    if (rowContent === undefined) return fullMatch;
    const rMatch = attrs.match(/\br="(\d+)"/);
    const r = rMatch ? parseInt(rMatch[1], 10) : -1;
    let updated = `<row${attrs}>${rowContent}</row>`;

    // Administrative headers in sheet6.xml (All have existing formulas pointing to 'INPUT DATA' & 'HELPER')
    if (r === 5) {
      updated = updateCellFormulaValue(updated, 'E', 5, normalizeRegionForECR(schoolProfile?.region || 'Region III'), 'str');
      updated = updateCellFormulaValue(updated, 'G', 5, (schoolProfile?.division || '').toUpperCase(), 'str');
      updated = updateCellFormulaValue(updated, 'I', 5, schoolProfile?.school_id || '', 'str');
    }
    if (r === 6) {
      updated = updateCellFormulaValue(updated, 'E', 6, (schoolProfile?.name || '').toUpperCase(), 'str');
    }
    if (r === 9) {
      updated = updateCellFormulaValue(updated, 'D', 9, gradeLevel);
      updated = updateCellFormulaValue(updated, 'G', 9, subjectName, 'str');
    }
    if (r === 10) {
      updated = updateCellFormulaValue(updated, 'D', 10, sectionName, 'str');
    }
    if (r === 11) {
      updated = updateCellFormulaValue(updated, 'G', 11, teacher, 'str');
    }
    if (r === 12) {
      updated = updateCellFormulaValue(updated, 'D', 12, (section.strand || section.track || '').toUpperCase(), 'str');
    }

    // Row 13 & 16: Terms configuration and active term filters
    if (r === 13) {
      updated = updateCellFormulaValue(updated, 'F', 13, numTerms);
      updated = updateCellFormulaValue(updated, 'G', 13, termDesc, 'str');
      updated = updateCellFormulaValue(updated, 'I', 13, meta.unitsPerTerm);
      updated = updateCellFormulaValue(updated, 'J', 13, meta.unitsPerYear);
    }
    if (r === 16) {
      updated = updateCellFormulaValue(updated, 'E', 16, isT1Active ? 1 : 0);
      updated = updateCellFormulaValue(updated, 'F', 16, isT2Active ? 1 : 0);
      updated = updateCellFormulaValue(updated, 'G', 16, isT3Active ? 1 : 0);
    }

    const populateFinalGradeRow = (student: Student | undefined, rowIdx: number) => {
      if (student) {
        const studentName = formatDepEdStudentName(student);
        updated = updateCellFormulaValue(updated, 'C', rowIdx, student.lrn || '', 'str');
        updated = updateCellFormulaValue(updated, 'D', rowIdx, studentName, 'str');

        const t1Grade = isT1Active ? computeStudentTermGrade(student, 1, options, meta) : '';
        const t2Grade = isT2Active ? computeStudentTermGrade(student, 2, options, meta) : '';
        const t3Grade = isT3Active ? computeStudentTermGrade(student, 3, options, meta) : '';

        updated = updateCellFormulaValue(updated, 'E', rowIdx, t1Grade);
        updated = updateCellFormulaValue(updated, 'F', rowIdx, t2Grade);
        updated = updateCellFormulaValue(updated, 'G', rowIdx, t3Grade);

        // Compute Final Grade
        const activeGrades: number[] = [];
        if (isT1Active && t1Grade !== '') activeGrades.push(Number(t1Grade));
        if (isT2Active && t2Grade !== '') activeGrades.push(Number(t2Grade));
        if (isT3Active && t3Grade !== '') activeGrades.push(Number(t3Grade));

        let finalGrade: number | '' = '';
        let descriptor = '';
        let remarks = '';

        if (activeGrades.length === numTerms) {
          const sum = activeGrades.reduce((a, b) => a + b, 0);
          finalGrade = Math.round(sum / numTerms);
          descriptor = getSSHSTermDescriptor(finalGrade);
          remarks = finalGrade >= 75 ? 'PASSED' : 'FAILED';
        }

        updated = updateCellFormulaValue(updated, 'H', rowIdx, finalGrade);
        updated = updateCellFormulaValue(updated, 'I', rowIdx, descriptor, 'str');
        updated = updateCellFormulaValue(updated, 'J', rowIdx, remarks, 'str');
      }
    };

    // Male (Rows 17 to 66)
    if (r >= 17 && r <= 66) {
      const idx = r - 17;
      if (idx < males.length) {
        populateFinalGradeRow(males[idx], r);
      }
    }

    // Female (Rows 68 to 117)
    if (r >= 68 && r <= 117) {
      const idx = r - 68;
      if (idx < females.length) {
        populateFinalGradeRow(females[idx], r);
      }
    }

    return updated;
  });

  return xml;
}

/**
 * Populates sheet7.xml (HELPER) to guarantee dropdown lookup formulas never resolve to #VALUE! or #N/A.
 */
function populateSSHSHelperXml(sheetXml: string, options: SSHSExportOptions): string {
  const { section, subject, schoolYear } = options;
  const gradeMatch = String(section.section_grade_level || (subject as any).grade_level || '').match(/(\d+)/);
  const gradeLevel = gradeMatch ? parseInt(gradeMatch[1], 10) : 11;
  const meta = resolveSSHSMetadata(subject, gradeLevel);
  const subjectName = (subject.subject_name || meta.subject || '').toUpperCase();

  const resolvedTerms = options.resolvedTerms || resolveSSHSTerms(
    subject,
    section,
    options.classRecords,
    options.hpsRecords,
    schoolYear,
    options.termBlock,
    options.numTerms
  );

  let xml = sheetXml;
  const rowRegex = /<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g;

  xml = xml.replace(rowRegex, (fullMatch, attrs, rowContent) => {
    if (rowContent === undefined) return fullMatch;
    const rMatch = attrs.match(/\br="(\d+)"/);
    const r = rMatch ? parseInt(rMatch[1], 10) : -1;
    let updated = `<row${attrs}>${rowContent}</row>`;

    if (r === 7) updated = setCellNumber(updated, 'F', 7, gradeLevel);
    if (r === 8) updated = setCellString(updated, 'G', 8, meta.category);
    if (r === 9) updated = setCellString(updated, 'G', 9, meta.cluster);
    if (r === 10) updated = setCellString(updated, 'G', 10, subjectName);
    if (r === 23) {
      updated = updateCellFormulaValue(updated, 'F', 23, resolvedTerms.code);
      updated = updateCellFormulaValue(updated, 'G', 23, resolvedTerms.termDesc, 'str');
    }

    return updated;
  });

  return xml;
}

/**
 * Loads the SSHS template workbook from public directory.
 */
export async function fetchSSHSTemplateBuffer(): Promise<Uint8Array> {
  const cleanBase = (import.meta.env.BASE_URL || '/').endsWith('/') 
    ? (import.meta.env.BASE_URL || '/') 
    : `${import.meta.env.BASE_URL}/`;
  const timestamp = Date.now();

  const candidateUrls = [
    `${cleanBase}templates/${encodeURIComponent(TEMPLATE_SSHS_G11)}?t=${timestamp}`,
    `/templates/${encodeURIComponent(TEMPLATE_SSHS_G11)}?t=${timestamp}`,
    `templates/${encodeURIComponent(TEMPLATE_SSHS_G11)}?t=${timestamp}`,
    `${cleanBase}templates/${TEMPLATE_SSHS_G11}?t=${timestamp}`,
    `/templates/${TEMPLATE_SSHS_G11}?t=${timestamp}`,
    `${cleanBase}templates/${encodeURIComponent('ECR_3Term - SSHS - SY2026-2027.xlsx')}?t=${timestamp}`,
    `/templates/${encodeURIComponent('ECR_3Term - SSHS - SY2026-2027.xlsx')}?t=${timestamp}`,
    `templates/${encodeURIComponent('ECR_3Term - SSHS - SY2026-2027.xlsx')}?t=${timestamp}`,
  ];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const ab = await res.arrayBuffer();
        const bytes = new Uint8Array(ab);
        // Ensure the response is an actual Excel/ZIP archive (PK\x03\x04), not an HTML SPA fallback or 0 bytes
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
        for (const f of [TEMPLATE_SSHS_G11, 'ECR_3Term - SSHS - SY2026-2027.xlsx']) {
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

  throw new Error(`Failed to load valid SSHS template: ${TEMPLATE_SSHS_G11}. Please ensure the template file exists in public/templates.`);
}

/**
 * Populates the entire SSHS Excel workbook Zip (Grade 11 and Grade 12).
 */
export async function populateSSHSWorkbookZip(
  templateBuffer: Uint8Array,
  options: SSHSExportOptions
): Promise<JSZip> {
  const resolvedTerms = options.resolvedTerms || resolveSSHSTerms(
    options.subject,
    options.section,
    options.classRecords,
    options.hpsRecords,
    options.schoolYear,
    options.termBlock,
    options.numTerms
  );

  const resolvedOptions: SSHSExportOptions = {
    ...options,
    termBlock: resolvedTerms.termBlock,
    numTerms: resolvedTerms.numTerms,
    resolvedTerms
  };

  const zip = await JSZip.loadAsync(templateBuffer);

  // 1. Remove stale calcChain & external links to eliminate Excel repair warning
  zip.remove('xl/calcChain.xml');
  zip.remove('xl/externalLinks/externalLink1.xml');
  zip.remove('xl/externalLinks/_rels/externalLink1.xml.rels');

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

  function cleanXmlErrors(xml: string): string {
    return xml
      .replace(/\s+t="e"/g, '')
      .replace(/<v>#(?:VALUE!|N\/A|REF!)<\/v>/g, '<v/>');
  }

  // 1b. Clean sheet1.xml (INSTRUCTIONS)
  const sheet1File = zip.file('xl/worksheets/sheet1.xml');
  if (sheet1File) {
    const rawXml = await sheet1File.async('text');
    zip.file('xl/worksheets/sheet1.xml', cleanXmlErrors(rawXml));
  }

  // 2. INPUT DATA (sheet2.xml)
  const sheet2File = zip.file('xl/worksheets/sheet2.xml');
  if (sheet2File) {
    const rawXml = await sheet2File.async('text');
    const updatedXml = populateSSHSInputDataXml(rawXml, resolvedOptions);
    zip.file('xl/worksheets/sheet2.xml', cleanXmlErrors(updatedXml));
  }

  // 3. Term 1 (sheet3.xml)
  const sheet3File = zip.file('xl/worksheets/sheet3.xml');
  if (sheet3File) {
    const rawXml = await sheet3File.async('text');
    const updatedXml = populateSSHSTermXml(rawXml, 1, resolvedOptions);
    zip.file('xl/worksheets/sheet3.xml', cleanXmlErrors(updatedXml));
  }

  // 4. Term 2 (sheet4.xml)
  const sheet4File = zip.file('xl/worksheets/sheet4.xml');
  if (sheet4File) {
    const rawXml = await sheet4File.async('text');
    const updatedXml = populateSSHSTermXml(rawXml, 2, resolvedOptions);
    zip.file('xl/worksheets/sheet4.xml', cleanXmlErrors(updatedXml));
  }

  // 5. Term 3 (sheet5.xml)
  const sheet5File = zip.file('xl/worksheets/sheet5.xml');
  if (sheet5File) {
    const rawXml = await sheet5File.async('text');
    const updatedXml = populateSSHSTermXml(rawXml, 3, resolvedOptions);
    zip.file('xl/worksheets/sheet5.xml', cleanXmlErrors(updatedXml));
  }

  // 6. FINAL GRADES (sheet6.xml)
  const sheet6File = zip.file('xl/worksheets/sheet6.xml');
  if (sheet6File) {
    const rawXml = await sheet6File.async('text');
    const updatedXml = populateSSHSFinalGradesXml(rawXml, resolvedOptions);
    zip.file('xl/worksheets/sheet6.xml', cleanXmlErrors(updatedXml));
  }

  // 7. HELPER (sheet7.xml)
  const sheet7File = zip.file('xl/worksheets/sheet7.xml');
  if (sheet7File) {
    const rawXml = await sheet7File.async('text');
    const updatedXml = populateSSHSHelperXml(rawXml, resolvedOptions);
    zip.file('xl/worksheets/sheet7.xml', cleanXmlErrors(updatedXml));
  }

  // 8. Ensure full calculation on load and clean broken definedNames & externalReferences in xl/workbook.xml
  const wbFile = zip.file('xl/workbook.xml');
  if (wbFile) {
    let wbXml = await wbFile.async('text');
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
        const cleanAttrs = attrs.replace(/\s*fullCalcOnLoad="[^"]*"/g, '').replace(/\s*calcCompleted="[^"]*"/g, '');
        return `<calcPr${cleanAttrs} fullCalcOnLoad="1"/>`;
      });
    } else {
      wbXml = wbXml.replace('</workbook>', '<calcPr fullCalcOnLoad="1"/></workbook>');
    }
    zip.file('xl/workbook.xml', wbXml);
  }

  return zip;
}

/**
 * High-level export function to download the populated SSHS E-Class Record (Grade 11 and Grade 12).
 */
export async function exportSSHSEClassRecord(options: SSHSExportOptions): Promise<void> {
  const templateBuffer = await fetchSSHSTemplateBuffer();
  const zip = await populateSSHSWorkbookZip(templateBuffer, options);
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const gradeMatch = String(options.section.section_grade_level || (options.subject as any).grade_level || '').match(/(\d+)/);
  const gradeLevel = gradeMatch ? parseInt(gradeMatch[1], 10) : 11;

  const subjectCode = (options.subject.subject_name || 'Subject').replace(/[^a-zA-Z0-9]/g, '_');
  const secName = (options.section.section_name || 'Section').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `ECR_SSHS_G${gradeLevel}_${secName}_${subjectCode}_SY${options.schoolYear.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
