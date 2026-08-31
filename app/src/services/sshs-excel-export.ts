/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * SSHS Grade 11 Electronic Class Record (ECR) Excel Export Service
 *
 * Implements official Strengthened Senior High School (SSHS) 3-Term E-Class Record
 * pursuant to DepEd Order No. 15, series of 2026.
 *
 * Direct OpenXML injection into:
 * "public/templates/SSHS E-Class Record SY 2026-2027.xlsx"
 */

import JSZip from 'jszip';
import type { SchoolProfile, Section, Subject, Student, ClassRecord, HPSRecord } from '../types';
import { normalizeRegionForECR } from './ecr-excel-export';

export const TEMPLATE_SSHS_G11 = 'SSHS E-Class Record SY 2026-2027.xlsx';

const MAX_STUDENTS_PER_GENDER = 50;
const SSHS_WW_COUNT = 10;
const SSHS_PT_COUNT = 10;
const SSHS_ST_COUNT = 3;

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
  const cellRegex = new RegExp(`(<c\\s+r="${cellRef}"([^>]*))(?:>(?:<f[^>]*>[\\s\\S]*?<\\/f>)?(?:<v>[^<]*<\\/v>|<is><t[^>]*>[\\s\\S]*?<\\/t><\\/is>)?<\\/c>|\\/>)`, 'g');

  let found = false;
  let newRowXml = rowXml.replace(cellRegex, (_match, _openTag, attrs) => {
    found = true;
    const sMatch = attrs.match(/s="(\d+)"/);
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
 * Updates or inserts a cell with a numeric value in an OpenXML worksheet row.
 */
function setCellNumber(rowXml: string, colRef: string, rowNum: number, value: number | ''): string {
  return updateOrInsertCell(rowXml, colRef, rowNum, value, true);
}

/**
 * Updates or inserts a string cell in an OpenXML worksheet row.
 */
function setCellString(rowXml: string, colRef: string, rowNum: number, value: string): string {
  return updateOrInsertCell(rowXml, colRef, rowNum, value, false);
}

/**
 * Formats student full name according to DepEd Standard: LASTNAME, FIRSTNAME MIDDLENAME EXT
 */
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

/**
 * Normalizes scores into fixed array length.
 */
function normalizeScores(scores: (number | string)[] | undefined, count: number): (number | string)[] {
  const src = Array.isArray(scores) ? scores : [];
  return Array.from({ length: count }, (_, i) => src[i] ?? '');
}

/**
 * Normalizes start year string from School Year (e.g. "2026-2027" -> 2026).
 */
function getStartYear(schoolYear: string): number {
  const match = String(schoolYear || '').match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : 2026;
}

export interface SSHSCatalogItem {
  category: 'SSHS - CORE' | 'SSHS - ACADEMIC' | 'SSHS - TECH-PRO';
  cluster: string;
  subject: string;
  terms: number;
}

export const SSHS_FULL_CATALOG: SSHSCatalogItem[] = [

  // SSHS - CORE
  // Cluster: CORE
  { category: 'SSHS - CORE', cluster: 'CORE', subject: 'Effective Communication', terms: 3 },
  { category: 'SSHS - CORE', cluster: 'CORE', subject: 'General Mathematics', terms: 3 },
  { category: 'SSHS - CORE', cluster: 'CORE', subject: 'General Science', terms: 3 },
  { category: 'SSHS - CORE', cluster: 'CORE', subject: 'Life and Career Skills', terms: 3 },
  { category: 'SSHS - CORE', cluster: 'CORE', subject: 'Mabisang Komunikasyon', terms: 3 },
  { category: 'SSHS - CORE', cluster: 'CORE', subject: 'Pag-aaral ng Kasaysayan at Lipunang Pilipino', terms: 3 },

  // SSHS - ACADEMIC
  // Cluster: ARTS, SOCIAL SCIENCES, AND HUMANITIES
  { category: 'SSHS - ACADEMIC', cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES', subject: 'Art Criticism and Creative Markets', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES', subject: 'Citizenship and Civic Engagement', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES', subject: 'Contemporary Literature 1', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES', subject: 'Contemporary Literature 2', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES', subject: 'Creative Composition 1', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES', subject: 'Creative Composition 2', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES', subject: 'Creative Industries - Applied and Traditional Arts', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES', subject: 'Creative Industries - Dance', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES', subject: 'Creative Industries - Literary Arts', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES', subject: 'Creative Industries - Media Arts', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES', subject: 'Creative Industries - Music', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES', subject: 'Creative Industries - Theater Arts', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES', subject: 'Creative Industries - Visual Arts', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES', subject: 'Filipino 1 (Wika at Komunikasyon sa Akademikong Filipino)', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES', subject: 'Filipino 2 (Filipino sa Isports)', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES', subject: 'Filipino 2 (Filipino sa Larang Teknikal-Propesyonal)', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES', subject: 'Filipino 2 (Filipino sa Sining at Disenyo)', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES', subject: 'Filipino Identity Through the Arts', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES', subject: 'Introduction to the Philosophy of the Human Person', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES', subject: 'Leadership and Management in the Arts', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES', subject: 'Malikhaing Pagsulat', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES', subject: 'Performance Criticism and Creative Markets', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES', subject: 'Philippine Governance (Philippine Politics and Governance)', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES', subject: 'Social Sciences (Theory and Practice)', terms: 1 },
  // Cluster: BUSINESS AND ENTREPRENEURSHIP
  { category: 'SSHS - ACADEMIC', cluster: 'BUSINESS AND ENTREPRENEURSHIP', subject: 'Business 1 (Basic Accounting)', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'BUSINESS AND ENTREPRENEURSHIP', subject: 'Business 2 (Business Finance and Income Taxation)', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'BUSINESS AND ENTREPRENEURSHIP', subject: 'Contemporary Marketing', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'BUSINESS AND ENTREPRENEURSHIP', subject: 'Entrepreneurship', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'BUSINESS AND ENTREPRENEURSHIP', subject: 'Introduction to Organization and Management', terms: 1 },
  // Cluster: FIELD EXPERIENCE
  { category: 'SSHS - ACADEMIC', cluster: 'FIELD EXPERIENCE', subject: 'Design and Innovation', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'FIELD EXPERIENCE', subject: 'Research 1', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'FIELD EXPERIENCE', subject: 'Research 2', terms: 1 },
  // Cluster: SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Advanced Mathematics', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Basic Calculus', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Biology 1', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Biology 2', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Biology 3', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Chemistry 1', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Chemistry 2', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Chemistry 3', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Earth and Space Science 1', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Earth and Space Science 2', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Earth and Space Science 3', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Empowerment Technologies', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Finite Mathematics 1', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Finite Mathematics 2', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Physics 1', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Physics 2', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Physics 3', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Pre-Calculus', terms: 1 },
  // Cluster: SPORTS, HEALTH, AND WELLNESS
  { category: 'SSHS - ACADEMIC', cluster: 'SPORTS, HEALTH, AND WELLNESS', subject: 'Exercise and Sports Programming', terms: 3 },
  { category: 'SSHS - ACADEMIC', cluster: 'SPORTS, HEALTH, AND WELLNESS', subject: 'First Aid', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SPORTS, HEALTH, AND WELLNESS', subject: 'Fundamentals of Basic Life Support', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SPORTS, HEALTH, AND WELLNESS', subject: 'Human Movement 1 (Basic Anatomy in Sports and Exercise)', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SPORTS, HEALTH, AND WELLNESS', subject: 'Human Movement 2 (Motor Skills Development)', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SPORTS, HEALTH, AND WELLNESS', subject: 'Physical Education 1 (Fitness and Recreation)', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SPORTS, HEALTH, AND WELLNESS', subject: 'Physical Education 2 (Sports and Dance)', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SPORTS, HEALTH, AND WELLNESS', subject: 'Sports Activity Management', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SPORTS, HEALTH, AND WELLNESS', subject: 'Sports Coaching', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SPORTS, HEALTH, AND WELLNESS', subject: 'Sports Officiating', terms: 1 },

  // SSHS - TECH-PRO
  // Cluster: AESTHETIC, WELLNESS, AND HUMAN CARE
  { category: 'SSHS - TECH-PRO', cluster: 'AESTHETIC, WELLNESS, AND HUMAN CARE', subject: 'Aesthetic Services (Beauty Care)', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'AESTHETIC, WELLNESS, AND HUMAN CARE', subject: 'Caregiving (Adult Care)', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'AESTHETIC, WELLNESS, AND HUMAN CARE', subject: 'Caregiving (Child Care)', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'AESTHETIC, WELLNESS, AND HUMAN CARE', subject: 'Hairdressing Services', terms: 3 },
  // Cluster: AGRI-FISHERY BUSINESS AND FOOD INNOVATION
  { category: 'SSHS - TECH-PRO', cluster: 'AGRI-FISHERY BUSINESS AND FOOD INNOVATION', subject: 'Agricultural Crops Production', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'AGRI-FISHERY BUSINESS AND FOOD INNOVATION', subject: 'Agro-entrepreneurship', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'AGRI-FISHERY BUSINESS AND FOOD INNOVATION', subject: 'Aquaculture', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'AGRI-FISHERY BUSINESS AND FOOD INNOVATION', subject: 'Fish Capture Operation', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'AGRI-FISHERY BUSINESS AND FOOD INNOVATION', subject: 'Food Processing', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'AGRI-FISHERY BUSINESS AND FOOD INNOVATION', subject: 'Organic Agriculture Production', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'AGRI-FISHERY BUSINESS AND FOOD INNOVATION', subject: 'Poultry Production (Chicken)', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'AGRI-FISHERY BUSINESS AND FOOD INNOVATION', subject: 'Ruminants Production', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'AGRI-FISHERY BUSINESS AND FOOD INNOVATION', subject: 'Swine Production', terms: 3 },
  // Cluster: ARTISANRY AND CREATIVE ENTERPRISE
  { category: 'SSHS - TECH-PRO', cluster: 'ARTISANRY AND CREATIVE ENTERPRISE', subject: 'Garments Artisanry', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'ARTISANRY AND CREATIVE ENTERPRISE', subject: 'Handicrafts: Weaving', terms: 3 },
  // Cluster: AUTOMOTIVE AND SMALL ENGINE TECHNOLOGIES
  { category: 'SSHS - TECH-PRO', cluster: 'AUTOMOTIVE AND SMALL ENGINE TECHNOLOGIES', subject: 'Driving and Automotive Servicing', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'AUTOMOTIVE AND SMALL ENGINE TECHNOLOGIES', subject: 'Motorcycle and Small Engine Servicing', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'AUTOMOTIVE AND SMALL ENGINE TECHNOLOGIES', subject: 'Automotive Servicing (Electrical Repair)', terms: 1 },
  { category: 'SSHS - TECH-PRO', cluster: 'AUTOMOTIVE AND SMALL ENGINE TECHNOLOGIES', subject: 'Automotive Servicing (Engine and Chassis Repairs)', terms: 1 },
  // Cluster: CONSTRUCTION AND BUILDING TECHNOLOGIES
  { category: 'SSHS - TECH-PRO', cluster: 'CONSTRUCTION AND BUILDING TECHNOLOGIES', subject: 'Carpentry', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'CONSTRUCTION AND BUILDING TECHNOLOGIES', subject: 'Construction Operation', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'CONSTRUCTION AND BUILDING TECHNOLOGIES', subject: 'Manual Metal Arc Welding', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'CONSTRUCTION AND BUILDING TECHNOLOGIES', subject: 'Technical Drafting', terms: 3 },
  // Cluster: CREATIVE ARTS AND DESIGN TECHNOLOGIES
  { category: 'SSHS - TECH-PRO', cluster: 'CREATIVE ARTS AND DESIGN TECHNOLOGIES', subject: 'Animation', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'CREATIVE ARTS AND DESIGN TECHNOLOGIES', subject: 'Illustration', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'CREATIVE ARTS AND DESIGN TECHNOLOGIES', subject: 'Visual Graphic Design', terms: 3 },
  // Cluster: HOSPITALITY AND TOURISM
  { category: 'SSHS - TECH-PRO', cluster: 'HOSPITALITY AND TOURISM', subject: 'Bakery Operations', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'HOSPITALITY AND TOURISM', subject: 'Events Management Services', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'HOSPITALITY AND TOURISM', subject: 'Food and Beverage Operation', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'HOSPITALITY AND TOURISM', subject: 'Hotel Operations (Front Office Services)', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'HOSPITALITY AND TOURISM', subject: 'Hotel Operations (Housekeeping Services)', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'HOSPITALITY AND TOURISM', subject: 'Kitchen Operations', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'HOSPITALITY AND TOURISM', subject: 'Tourism Services', terms: 3 },
  // Cluster: ICT SUPPORT AND COMPUTER PROGRAMMING TECHNOLOGIES
  { category: 'SSHS - TECH-PRO', cluster: 'ICT SUPPORT AND COMPUTER PROGRAMMING TECHNOLOGIES', subject: 'Broadband Installation', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'ICT SUPPORT AND COMPUTER PROGRAMMING TECHNOLOGIES', subject: 'Computer Programming (.Net Technology)', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'ICT SUPPORT AND COMPUTER PROGRAMMING TECHNOLOGIES', subject: 'Computer Programming (Java)', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'ICT SUPPORT AND COMPUTER PROGRAMMING TECHNOLOGIES', subject: 'Computer Programming (Oracle Database)', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'ICT SUPPORT AND COMPUTER PROGRAMMING TECHNOLOGIES', subject: 'Computer Systems Servicing', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'ICT SUPPORT AND COMPUTER PROGRAMMING TECHNOLOGIES', subject: 'Contact Center Services', terms: 3 },
  // Cluster: INDUSTRIAL TECHNOLOGIES
  { category: 'SSHS - TECH-PRO', cluster: 'INDUSTRIAL TECHNOLOGIES', subject: 'Domestic Refrigeration and Air-Conditioning Servicing', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'INDUSTRIAL TECHNOLOGIES', subject: 'Electrical Installation and Maintenance', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'INDUSTRIAL TECHNOLOGIES', subject: 'Electronic Products Assembly and Servicing', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'INDUSTRIAL TECHNOLOGIES', subject: 'Photovoltaic Systems Installation', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'INDUSTRIAL TECHNOLOGIES', subject: 'Commercial Air-Conditioning Installation and Servicing', terms: 1 },
  { category: 'SSHS - TECH-PRO', cluster: 'INDUSTRIAL TECHNOLOGIES', subject: 'Mechatronics', terms: 1 },
  // Cluster: MARITIME
  { category: 'SSHS - TECH-PRO', cluster: 'MARITIME', subject: 'Marine Engineering at the Support Level', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'MARITIME', subject: 'Marine Transportation at the Support Level', terms: 3 },
  { category: 'SSHS - TECH-PRO', cluster: 'MARITIME', subject: 'Ships Catering Services', terms: 3 },

  // SSHS - ACADEMIC
  // Cluster: ARTS, SOCIAL SCIENCES, AND HUMANITIES
  { category: 'SSHS - ACADEMIC', cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES', subject: 'Creative Production and Presentation', terms: 1 },
  // Cluster: BUSINESS AND ENTREPRENEURSHIP
  { category: 'SSHS - ACADEMIC', cluster: 'BUSINESS AND ENTREPRENEURSHIP', subject: 'Business 3 (Business Economics)', terms: 1 },
  // Cluster: FIELD EXPERIENCE
  { category: 'SSHS - ACADEMIC', cluster: 'FIELD EXPERIENCE', subject: 'Arts Apprenticeship – Dance', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'FIELD EXPERIENCE', subject: 'Arts Apprenticeship - Literary Arts', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'FIELD EXPERIENCE', subject: 'Arts Apprenticeship - Media Arts', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'FIELD EXPERIENCE', subject: 'Arts Apprenticeship – Music', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'FIELD EXPERIENCE', subject: 'Arts Apprenticeship – Theater Arts', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'FIELD EXPERIENCE', subject: 'Arts Apprenticeship – Traditional Cultural Expressions', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'FIELD EXPERIENCE', subject: 'Arts Apprenticeship – Visual Arts', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'FIELD EXPERIENCE', subject: 'Field Exposure (Off Campus)', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'FIELD EXPERIENCE', subject: 'In-Campus Field Exposure for Sports', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'FIELD EXPERIENCE', subject: 'Work Immersion for Academic Track', terms: 1 },
  // Cluster: SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Biology 4', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Chemistry 4', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Conceptual Biology and Earth and Space Science', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Conceptual Physics and Chemistry in Daily Life', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Database Management', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Earth and Space Science 4', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Fundamentals of Data Analytics', terms: 1 },
  { category: 'SSHS - ACADEMIC', cluster: 'SCIENCE, TECHNOLOGY, ENGINEERING, AND MATHEMATICS', subject: 'Physics 4', terms: 1 },

  // SSHS - TECH-PRO
  // Cluster: WORK IMMERSION
  { category: 'SSHS - TECH-PRO', cluster: 'WORK IMMERSION', subject: 'Work Immersion for Tech-Pro Track (320 hours)', terms: 1 },
  { category: 'SSHS - TECH-PRO', cluster: 'WORK IMMERSION', subject: 'Work Immersion for Tech-Pro Track (540 hours) - 1 Term', terms: 1 },
  { category: 'SSHS - TECH-PRO', cluster: 'WORK IMMERSION', subject: 'Work Immersion for Tech-Pro Track (640 hours) - 1 Term', terms: 1 },
  { category: 'SSHS - TECH-PRO', cluster: 'WORK IMMERSION', subject: 'Work Immersion for Tech-Pro Track (540 hours) - 2 Terms', terms: 2 },
  { category: 'SSHS - TECH-PRO', cluster: 'WORK IMMERSION', subject: 'Work Immersion for Tech-Pro Track (640 hours) - 2 Terms', terms: 2 },
];

export const SSHS_GRADE11_CATALOG = SSHS_FULL_CATALOG;

/**
 * Resolves full SSHS metadata (Category, Cluster, Subject Name, Terms)
 * adhering strictly to the official HELPER sheet in DepEd DO 15 s. 2026.
 */
export function resolveSSHSMetadata(subject: Subject, gradeLevel = 11): SSHSCatalogItem {
  const normSubj = (subject.subject_name || '').trim().toLowerCase();
  const rawCat = ((subject as any).category || (subject as any).subject_category || '').toUpperCase();
  const rawClust = ((subject as any).cluster || (subject as any).subject_cluster || '').toUpperCase();

  // 1. Exact catalog match by subject name
  const exact = SSHS_GRADE11_CATALOG.find(e => e.subject.toLowerCase() === normSubj);
  if (exact) {
    if (gradeLevel === 12 && exact.category === 'SSHS - CORE') {
      return {
        ...exact,
        category: 'SSHS - ACADEMIC',
        cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES'
      };
    }
    return exact;
  }

  // 2. Fuzzy match within catalog
  const fuzzy = SSHS_GRADE11_CATALOG.find(e =>
    normSubj.includes(e.subject.toLowerCase()) || e.subject.toLowerCase().includes(normSubj)
  );
  if (fuzzy) {
    if (gradeLevel === 12 && fuzzy.category === 'SSHS - CORE') {
      return {
        ...fuzzy,
        category: 'SSHS - ACADEMIC',
        cluster: 'ARTS, SOCIAL SCIENCES, AND HUMANITIES'
      };
    }
    return fuzzy;
  }

  // 3. Fallback resolution
  let category: 'SSHS - CORE' | 'SSHS - ACADEMIC' | 'SSHS - TECH-PRO' = 'SSHS - ACADEMIC';
  if (gradeLevel !== 12 && (rawCat.includes('CORE') || normSubj.includes('komunikasyon') || normSubj.includes('general mathematics') || normSubj.includes('general science') || normSubj.includes('kasaysayan') || normSubj.includes('life and career'))) {
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

  return {
    category,
    cluster,
    subject: subject.subject_name.trim(),
    terms: category === 'SSHS - CORE' ? 3 : 1
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
 * Populates sheet2.xml (INPUT DATA).
 */
function populateSSHSInputDataXml(sheetXml: string, options: SSHSExportOptions): string {
  const { schoolProfile, schoolYear, section, subject, students, teacherName, termBlock } = options;

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

  // Format term block according to data validation in H33: "FIRST TERM", "SECOND TERM", "THIRD TERM"
  let formattedTermBlock = 'FIRST TERM';
  const tb = String(termBlock || '').toUpperCase();
  if (tb.includes('3') || tb.includes('THIRD') || tb.includes('3RD')) {
    formattedTermBlock = 'THIRD TERM';
  } else if (tb.includes('2') || tb.includes('SECOND') || tb.includes('2ND')) {
    formattedTermBlock = 'SECOND TERM';
  } else {
    formattedTermBlock = 'FIRST TERM';
  }

  const males = sortStudentsAlphabetically(
    students.filter(s => (s.gender || '').toLowerCase() === 'male')
  ).slice(0, MAX_STUDENTS_PER_GENDER);

  const females = sortStudentsAlphabetically(
    students.filter(s => (s.gender || '').toLowerCase() === 'female')
  ).slice(0, MAX_STUDENTS_PER_GENDER);

  let xml = sheetXml;

  // Split into rows
  const rowRegex = /<row r="(\d+)"[^>]*>[\s\S]*?<\/row>/g;
  xml = xml.replace(rowRegex, (rowXml, rStr) => {
    const r = parseInt(rStr, 10);
    let updated = rowXml;

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
      updated = setCellString(updated, 'H', 33, formattedTermBlock);
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
 */
function populateSSHSTermXml(
  sheetXml: string,
  term: 1 | 2 | 3,
  options: SSHSExportOptions
): string {
  const { subject, schoolYear, students, classRecords, hpsRecords } = options;

  // Find HPS Record for this term
  const hps = hpsRecords.find(
    h => h.subject_id === subject.id && h.quarter === term && h.school_year === schoolYear
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

  let xml = sheetXml;
  const rowRegex = /<row r="(\d+)"[^>]*>[\s\S]*?<\/row>/g;

  xml = xml.replace(rowRegex, (rowXml, rStr) => {
    const r = parseInt(rStr, 10);
    let updated = rowXml;

    // Row 14: Highest Possible Score (HPS)
    if (r === 14) {
      wwCols.forEach((col, idx) => {
        const val = wwHps[idx];
        updated = setCellNumber(updated, col, 14, val !== '' && !isNaN(Number(val)) ? Number(val) : '');
      });

      ptCols.forEach((col, idx) => {
        const val = ptHps[idx];
        updated = setCellNumber(updated, col, 14, val !== '' && !isNaN(Number(val)) ? Number(val) : '');
      });

      // ST 1 (AD), ST 2 (AE), TE (AF)
      const st1Val = stHps[0];
      const st2Val = stHps[1];
      const teVal = teHps;
      updated = setCellNumber(updated, 'AD', 14, st1Val !== '' && !isNaN(Number(st1Val)) ? Number(st1Val) : '');
      updated = setCellNumber(updated, 'AE', 14, st2Val !== '' && !isNaN(Number(st2Val)) ? Number(st2Val) : '');
      updated = setCellNumber(updated, 'AF', 14, teVal !== '' && !isNaN(Number(teVal)) ? Number(teVal) : '');
    }

    // Male Students: Rows 17 to 66
    if (r >= 17 && r <= 66) {
      const idx = r - 17;
      if (idx < males.length) {
        const student = males[idx];
        const record = classRecords.find(
          c => c.student_lrn === student.lrn && c.subject_id === subject.id && c.quarter === term && c.school_year === schoolYear
        );

        const wwScores = normalizeScores(record?.written_works, SSHS_WW_COUNT);
        const ptScores = normalizeScores(record?.performance_tasks, SSHS_PT_COUNT);
        const stScores = normalizeScores((record as any)?.summative_tests, SSHS_ST_COUNT);
        const teScore = record?.quarterly_exam ?? '';

        wwCols.forEach((col, i) => {
          const val = wwScores[i];
          updated = setCellNumber(updated, col, r, val !== '' && !isNaN(Number(val)) ? Number(val) : '');
        });

        ptCols.forEach((col, i) => {
          const val = ptScores[i];
          updated = setCellNumber(updated, col, r, val !== '' && !isNaN(Number(val)) ? Number(val) : '');
        });

        const st1Val = stScores[0];
        const st2Val = stScores[1];
        updated = setCellNumber(updated, 'AD', r, st1Val !== '' && !isNaN(Number(st1Val)) ? Number(st1Val) : '');
        updated = setCellNumber(updated, 'AE', r, st2Val !== '' && !isNaN(Number(st2Val)) ? Number(st2Val) : '');
        updated = setCellNumber(updated, 'AF', r, teScore !== '' && !isNaN(Number(teScore)) ? Number(teScore) : '');
      } else {
        // Clear unused rows
        wwCols.forEach(col => { updated = setCellNumber(updated, col, r, ''); });
        ptCols.forEach(col => { updated = setCellNumber(updated, col, r, ''); });
        updated = setCellNumber(updated, 'AD', r, '');
        updated = setCellNumber(updated, 'AE', r, '');
        updated = setCellNumber(updated, 'AF', r, '');
      }
    }

    // Female Students: Rows 68 to 117
    if (r >= 68 && r <= 117) {
      const idx = r - 68;
      if (idx < females.length) {
        const student = females[idx];
        const record = classRecords.find(
          c => c.student_lrn === student.lrn && c.subject_id === subject.id && c.quarter === term && c.school_year === schoolYear
        );

        const wwScores = normalizeScores(record?.written_works, SSHS_WW_COUNT);
        const ptScores = normalizeScores(record?.performance_tasks, SSHS_PT_COUNT);
        const stScores = normalizeScores((record as any)?.summative_tests, SSHS_ST_COUNT);
        const teScore = record?.quarterly_exam ?? '';

        wwCols.forEach((col, i) => {
          const val = wwScores[i];
          updated = setCellNumber(updated, col, r, val !== '' && !isNaN(Number(val)) ? Number(val) : '');
        });

        ptCols.forEach((col, i) => {
          const val = ptScores[i];
          updated = setCellNumber(updated, col, r, val !== '' && !isNaN(Number(val)) ? Number(val) : '');
        });

        const st1Val = stScores[0];
        const st2Val = stScores[1];
        updated = setCellNumber(updated, 'AD', r, st1Val !== '' && !isNaN(Number(st1Val)) ? Number(st1Val) : '');
        updated = setCellNumber(updated, 'AE', r, st2Val !== '' && !isNaN(Number(st2Val)) ? Number(st2Val) : '');
        updated = setCellNumber(updated, 'AF', r, teScore !== '' && !isNaN(Number(teScore)) ? Number(teScore) : '');
      } else {
        wwCols.forEach(col => { updated = setCellNumber(updated, col, r, ''); });
        ptCols.forEach(col => { updated = setCellNumber(updated, col, r, ''); });
        updated = setCellNumber(updated, 'AD', r, '');
        updated = setCellNumber(updated, 'AE', r, '');
        updated = setCellNumber(updated, 'AF', r, '');
      }
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

  throw new Error(`Failed to load valid SSHS template: ${TEMPLATE_SSHS_G11}. Please ensure the template file exists in public/templates.`);
}

/**
 * Populates the entire SSHS Grade 11 Excel workbook Zip.
 */
export async function populateSSHSWorkbookZip(
  templateBuffer: Uint8Array,
  options: SSHSExportOptions
): Promise<JSZip> {
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

  // 2. INPUT DATA (sheet2.xml)
  const sheet2File = zip.file('xl/worksheets/sheet2.xml');
  if (sheet2File) {
    const rawXml = await sheet2File.async('text');
    const updatedXml = populateSSHSInputDataXml(rawXml, options);
    zip.file('xl/worksheets/sheet2.xml', updatedXml);
  }

  // 3. Term 1 (sheet3.xml)
  const sheet3File = zip.file('xl/worksheets/sheet3.xml');
  if (sheet3File) {
    const rawXml = await sheet3File.async('text');
    const updatedXml = populateSSHSTermXml(rawXml, 1, options);
    zip.file('xl/worksheets/sheet3.xml', updatedXml);
  }

  // 4. Term 2 (sheet4.xml)
  const sheet4File = zip.file('xl/worksheets/sheet4.xml');
  if (sheet4File) {
    const rawXml = await sheet4File.async('text');
    const updatedXml = populateSSHSTermXml(rawXml, 2, options);
    zip.file('xl/worksheets/sheet4.xml', updatedXml);
  }

  // 5. Term 3 (sheet5.xml)
  const sheet5File = zip.file('xl/worksheets/sheet5.xml');
  if (sheet5File) {
    const rawXml = await sheet5File.async('text');
    const updatedXml = populateSSHSTermXml(rawXml, 3, options);
    zip.file('xl/worksheets/sheet5.xml', updatedXml);
  }

  // 6. Ensure full calculation on load and clean broken definedNames & externalReferences in xl/workbook.xml
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
 * High-level export function to download the populated SSHS E-Class Record.
 */
export async function exportSSHSEClassRecord(options: SSHSExportOptions): Promise<void> {
  const templateBuffer = await fetchSSHSTemplateBuffer();
  const zip = await populateSSHSWorkbookZip(templateBuffer, options);
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const subjectCode = (options.subject.subject_name || 'Subject').replace(/[^a-zA-Z0-9]/g, '_');
  const secName = (options.section.section_name || 'Section').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `ECR_SSHS_G11_${secName}_${subjectCode}_SY${options.schoolYear.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
