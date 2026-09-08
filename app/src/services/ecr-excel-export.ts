/**
 * Official DepEd Grades 2-10 3-Term Electronic Class Record (ECR) Excel Export Service
 * 
 * Direct OpenXML SpreadsheetML Population Engine:
 * - Supports official separated DepEd templates:
 *   1. Academic (Science, Math, English, Filipino, GMRC-VE, Araling Panlipunan, Makabansa)
 *   2. EPP / TLE (EPP/TLE for Grades 4-6, TLE for Grades 7-10)
 *   3. MAPEH (9-sheet composite workbook with Music & Arts and PE & Health)
 * - Modifies raw value cells in sheet1.xml (INPUT DATA) and grading sheets.
 * - Leaves 100% of OpenXML formula nodes (<f>...</f>), drawing relationships,
 *   styles, print properties, and summary sheets in their original authentic state.
 * - Full calculation on open (calcPr fullCalcOnLoad="1").
 */

import JSZip from 'jszip';
import type { SchoolProfile, Student, Section, Subject, ClassRecord, HPSRecord } from '../types';
import { formatLearnerName } from '../utils/student-name';

const WW_COUNT = 5;
const PT_COUNT = 3;
const ST_COUNT = 3;
const MAX_STUDENTS_PER_GENDER = 50;

export const TEMPLATE_ACADEMIC = '[Grades 2-10] 3Term E-Class Record (for Science, Math, English, Filipino, Araling Panlipunan).xlsx';
export const TEMPLATE_GMRC_VE = '[Grades 2-10] 3Term E-Class Record (for GMRC - Values Education).xlsx';
export const TEMPLATE_EPP_TLE = '[Grades 2-10] 3Term E-Class Record (for EPP-TLE).xlsx';
export const TEMPLATE_EPP_TLE_COMPONENTS = 'UPDATED [Grades 2-10] 3Term E-Class Record (for EPP-TLE) - per component.xlsx';
export const TEMPLATE_MAPEH = '[Grades 2-10] 3Term E-Class Record (for Music and Arts, Physical Education and Health).xlsx';
export const TEMPLATE_MAPEH_LEGACY = '[Grades 2-10] 3Term E-Class Record (for Music and Arts, P.E. and Health).xlsx';
export const TEMPLATE_SPFL = 'UPDATED [Grades 4-10] 3Term E-Class Record (for SPFL).xlsx';
export const TEMPLATE_SPJ = 'UPDATED [Grades 4-10] 3Term E-Class Record (for SPJ).xlsx';
export const TEMPLATE_SPA = 'UPDATED [Grades 4-10] 3Term E-Class Record (for SPA).xlsx';
export const TEMPLATE_SPS = 'UPDATED [Grades 4-10] 3Term E-Class Record (for SPS).xlsx';
export const TEMPLATE_SPTVE = 'UPDATED [Grades 4-10] 3Term E-Class Record (for SPTVE).xlsx';
export const TEMPLATE_SSES_SPSTEM = 'UPDATED [Grades 4-10] 3Term E-Class Record (for SSES and SPSTEM).xlsx';

export const SPFL_SUBJECTS = [
  'Special Program in Foreign Language - Spanish',
  'Special Program in Foreign Language - Japanese',
  'Special Program in Foreign Language - French',
  'Special Program in Foreign Language - German',
  'Special Program in Foreign Language - Chinese',
  'Special Program in Foreign Language - Korean',
] as const;

export const SPJ_SUBJECTS = [
  'Special Program in Journalism (Journalism)',
  'Special Program in Journalism (Pamamahayag)',
] as const;

export const SPA_SUBJECTS = [
  'Special Program in the Arts (SPA)',
  'Special Program in the Arts',
  'SPA - Visual Arts',
  'SPA - Music (Vocal)',
  'SPA - Music (Instrumental)',
  'SPA - Dance (Folk & Contemporary)',
  'SPA - Theater Arts',
  'SPA - Creative Writing (Malikhaing Pagsulat)',
  'SPA - Media Arts',
] as const;

export const SPS_SUBJECTS = [
  'Special Program in Sports (SPS)',
  'Special Program in Sports',
  'SPS - Foundations of Sports & Individual/Dual Sports',
  'SPS - Team Sports & Biomechanics',
  'SPS - Sports Science, Physiology & Nutrition',
  'SPS - Sports Officiating & Sports Management',
] as const;

export const SPTVE_SUBJECTS = [
  'Applied Technical Drawing',
  'Applied Entrepreneurship',
  'TVE Specialization',
  'Special Program in Technical-Vocational Education (SPTVE)',
  'Special Program in Technical-Vocational Education',
] as const;

export const SSES_SPSTEM_SUBJECTS = [
  'Enhanced Science',
  'Enhanced Mathematics',
  'Creative Technology',
  'Research MIM/SIP',
  'Special Science Elementary Schools (SSES)',
  'Special Program in STEM (SPSTEM)',
  'Special Program in Science, Technology, Engineering, and Mathematics',
] as const;

export type ECRTemplateType = 'academic' | 'gmrc_ve' | 'epp_tle' | 'epp_tle_components' | 'mapeh' | 'spfl' | 'spj' | 'spa' | 'sps' | 'sptve' | 'sses_spstem';

export interface ECRExcelExportOptions {
  schoolProfile: SchoolProfile | null;
  schoolYear: string;
  section: Section;
  subject: Subject;
  allSubjects?: Subject[];
  teacherName?: string;
  students: Student[];
  classRecords: ClassRecord[];
  hpsRecords: HPSRecord[];
  templateOverride?: ECRTemplateType;
}

/**
 * Helper to determine if a grade level is within the official Grades 2-10 range.
 * Excludes Kindergarten, Grade 1 (which uses PACE), and Senior High (Grade 11 & Grade 12).
 */
export function isGrade2To10(gradeLevel?: string): boolean {
  if (!gradeLevel) return false;
  const match = String(gradeLevel).match(/\d+/);
  if (!match) return false;
  const num = parseInt(match[0], 10);
  return num >= 2 && num <= 10;
}

export function isGmrcVeSubject(subjectName: string): boolean {
  const norm = String(subjectName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  return (
    norm.includes('gmrc') ||
    norm.includes('valueseducation') ||
    norm.includes('values') ||
    norm.includes('goodmanners') ||
    norm.includes('goodmoral') ||
    norm.includes('edukasyonsapagpapakatao') ||
    norm === 'esp' ||
    norm.includes('pagpapakatao')
  );
}

export function isMapehSubject(subjectName: string): boolean {
  const norm = String(subjectName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  return (
    norm.includes('mapeh') ||
    norm.includes('music') ||
    norm.includes('art') ||
    norm.includes('physicaleducation') ||
    norm.includes('peandhealth') ||
    norm.includes('pehealth') ||
    (norm.includes('pe') && norm.includes('health')) ||
    norm.includes('health')
  );
}

export function isMusicArtsSubject(subjectName?: string): boolean {
  const norm = String(subjectName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  return (
    norm.includes('musicandart') ||
    norm.includes('musicart') ||
    norm === 'music' ||
    norm === 'art' ||
    norm === 'arts' ||
    (norm.includes('music') && norm.includes('art'))
  );
}

export function isPeHealthSubject(subjectName?: string): boolean {
  const norm = String(subjectName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  return (
    norm.includes('physicaleducationandhealth') ||
    norm.includes('peandhealth') ||
    norm.includes('pehealth') ||
    norm.includes('physicaleducation') ||
    norm === 'pe' ||
    norm === 'health' ||
    (norm.includes('pe') && norm.includes('health')) ||
    (norm.includes('physical') && norm.includes('health'))
  );
}

export function isEppTleSubject(subjectName: string): boolean {
  const norm = String(subjectName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  return (
    norm.includes('epp') ||
    norm.includes('tle') ||
    norm.includes('technologyandlivelihood') ||
    norm.includes('edukasyongpantahanan') ||
    norm.includes('tvl') ||
    norm.includes('specialization')
  );
}

export function isIctComponent(subjectName?: string): boolean {
  const norm = String(subjectName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  return (
    norm.includes('ict') ||
    norm.includes('informationandcommunication') ||
    norm.includes('informationtechnology') ||
    norm.includes('computer') ||
    norm.includes('css') ||
    norm.includes('programming') ||
    norm.includes('animation') ||
    norm.includes('technicaldrafting')
  );
}

export function isAfaComponent(subjectName?: string): boolean {
  const norm = String(subjectName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  return (
    norm.includes('afa') ||
    norm.includes('agri') ||
    norm.includes('fishery') ||
    norm.includes('agriculture') ||
    norm.includes('crop') ||
    norm.includes('horticulture') ||
    norm.includes('aquaculture') ||
    norm.includes('animal') ||
    norm.includes('poultry') ||
    norm.includes('swine') ||
    norm.includes('organic')
  );
}

export function isFcsComponent(subjectName?: string): boolean {
  const norm = String(subjectName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  return (
    norm.includes('fcs') ||
    norm.includes('homeeconomics') ||
    norm.includes('he') ||
    norm.includes('cookery') ||
    norm.includes('bread') ||
    norm.includes('pastry') ||
    norm.includes('food') ||
    norm.includes('beverage') ||
    norm.includes('caregiving') ||
    norm.includes('beauty') ||
    norm.includes('dressmaking') ||
    norm.includes('tailoring') ||
    norm.includes('frontoffice') ||
    norm.includes('housekeeping') ||
    norm.includes('bartending')
  );
}

export function isIaComponent(subjectName?: string): boolean {
  const norm = String(subjectName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  return (
    norm.includes('ia') ||
    norm.includes('industrialarts') ||
    norm.includes('carpentry') ||
    norm.includes('electrical') ||
    norm.includes('electronics') ||
    norm.includes('eim') ||
    norm.includes('welding') ||
    norm.includes('smaw') ||
    norm.includes('automotive') ||
    norm.includes('masonry') ||
    norm.includes('plumbing') ||
    norm.includes('refrigeration')
  );
}

export function isEppTleComponent(subjectName?: string): boolean {
  return isIctComponent(subjectName) || isAfaComponent(subjectName) || isFcsComponent(subjectName) || isIaComponent(subjectName);
}

export function isSpflSubject(subjectName: string): boolean {
  const norm = String(subjectName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  return (
    norm.includes('spfl') ||
    norm.includes('foreignlanguage') ||
    norm.includes('spanish') ||
    norm.includes('espanol') ||
    norm.includes('nihongo') ||
    norm.includes('japanese') ||
    norm.includes('french') ||
    norm.includes('francais') ||
    norm.includes('german') ||
    norm.includes('deutsch') ||
    norm.includes('mandarin') ||
    norm.includes('chinese') ||
    norm.includes('korean') ||
    norm.includes('hangul')
  );
}

export function isSpjSubject(subjectName: string): boolean {
  const norm = String(subjectName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  return (
    norm.includes('journalism') ||
    norm.includes('pamamahayag') ||
    norm.includes('spj')
  );
}

export function isSpaSubject(subjectName: string): boolean {
  const norm = String(subjectName || '').toLowerCase().trim();
  const stripped = norm.replace(/[^a-z0-9]/g, '');
  if (
    stripped === 'spa' ||
    stripped.startsWith('spa') ||
    stripped.includes('specialprograminthearts') ||
    stripped.includes('specialprogramarts') ||
    norm.includes('special program in the arts')
  ) {
    return true;
  }
  // Standalone SPA disciplines (excluding standard core subjects)
  if (
    norm.includes('theater arts') ||
    norm.includes('media arts') ||
    norm.includes('visual arts') ||
    norm.includes('malikhaing pagsulat') ||
    norm.includes('creative writing') ||
    norm.includes('dulaan') ||
    norm.includes('sayaw')
  ) {
    return true;
  }
  return false;
}

export function isSpsSubject(subjectName: string): boolean {
  const norm = String(subjectName || '').toLowerCase().trim();
  const stripped = norm.replace(/[^a-z0-9]/g, '');
  if (
    stripped === 'sps' ||
    stripped.startsWith('sps') ||
    stripped.includes('specialprograminsports') ||
    stripped.includes('specialprogramsports') ||
    norm.includes('special program in sports')
  ) {
    return true;
  }
  if (
    norm.includes('sports officiating') ||
    norm.includes('sports management') ||
    norm.includes('sports science') ||
    norm.includes('biomechanics') ||
    norm.includes('foundations of sports')
  ) {
    return true;
  }
  return false;
}

export function isSptveSubject(subjectName: string): boolean {
  const norm = String(subjectName || '').toLowerCase().trim();
  const stripped = norm.replace(/[^a-z0-9]/g, '');
  if (
    stripped === 'sptve' ||
    stripped.startsWith('sptve') ||
    stripped.includes('specialprogramintechnicalvocationaleducation') ||
    stripped.includes('specialprogramtechnicalvocationaleducation') ||
    norm.includes('special program in technical-vocational education') ||
    norm.includes('special program in technical vocational education')
  ) {
    return true;
  }
  if (
    norm.includes('technical-vocational education') ||
    norm.includes('technical vocational education') ||
    norm.includes('applied technical drawing') ||
    norm.includes('applied entrepreneurship') ||
    norm.includes('tve specialization') ||
    norm.startsWith('tve ') ||
    norm.startsWith('tve-') ||
    norm === 'tve'
  ) {
    return true;
  }
  return false;
}

export function isSsesSpstemSubject(subjectName: string): boolean {
  const norm = String(subjectName || '').toLowerCase().trim();
  const stripped = norm.replace(/[^a-z0-9]/g, '');
  if (
    stripped === 'sses' ||
    stripped.startsWith('sses') ||
    stripped === 'spstem' ||
    stripped.startsWith('spstem') ||
    stripped.includes('specialscienceelementaryschool') ||
    stripped.includes('specialprograminstem') ||
    stripped.includes('specialprograminscience') ||
    norm.includes('special science elementary schools') ||
    norm.includes('special program in stem')
  ) {
    return true;
  }
  if (
    norm.includes('enhanced science') ||
    norm.includes('enhanced math') ||
    norm.includes('creative technology') ||
    norm.includes('research mim') ||
    norm.includes('research sip') ||
    norm.includes('mim/sip') ||
    norm.includes('science investigatory project')
  ) {
    return true;
  }
  return false;
}

export function getECRTemplateType(subjectName: string, _gradeLevel?: string): ECRTemplateType {
  if (isSsesSpstemSubject(subjectName)) return 'sses_spstem';
  if (isSptveSubject(subjectName)) return 'sptve';
  if (isSpsSubject(subjectName)) return 'sps';
  if (isSpaSubject(subjectName)) return 'spa';
  if (isSpflSubject(subjectName)) return 'spfl';
  if (isSpjSubject(subjectName)) return 'spj';
  if (isGmrcVeSubject(subjectName)) return 'gmrc_ve';
  if (isMapehSubject(subjectName)) return 'mapeh';
  if (isEppTleSubject(subjectName)) return 'epp_tle';
  return 'academic';
}

export function getECRTemplateFilename(subjectName: string, gradeLevel?: string, templateOverride?: ECRTemplateType): string {
  if (gradeLevel && !isGrade2To10(gradeLevel)) {
    throw new Error(`Official DepEd 3-Term E-Class Record templates are only available for Grades 2 to 10 (received "${gradeLevel}").`);
  }
  if (templateOverride === 'epp_tle_components') return TEMPLATE_EPP_TLE_COMPONENTS;
  const type = templateOverride || getECRTemplateType(subjectName, gradeLevel);
  if (type === 'sses_spstem') return TEMPLATE_SSES_SPSTEM;
  if (type === 'sptve') return TEMPLATE_SPTVE;
  if (type === 'sps') return TEMPLATE_SPS;
  if (type === 'spa') return TEMPLATE_SPA;
  if (type === 'spfl') return TEMPLATE_SPFL;
  if (type === 'spj') return TEMPLATE_SPJ;
  if (type === 'gmrc_ve') return TEMPLATE_GMRC_VE;
  if (type === 'mapeh') return TEMPLATE_MAPEH;
  if (type === 'epp_tle') return TEMPLATE_EPP_TLE;
  if (type === 'epp_tle_components') return TEMPLATE_EPP_TLE_COMPONENTS;
  return TEMPLATE_ACADEMIC;
}

export async function fetchECRTemplateBuffer(templateFilename: string): Promise<ArrayBuffer> {
  const baseUrl = import.meta.env.BASE_URL || './';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const timestamp = Date.now();

  let aliasFilename = 'ECR_Template_Academic_G2_G10.xlsx';
  if (templateFilename.includes('component') || templateFilename.includes('Components')) {
    aliasFilename = 'ECR_Template_EPP_TLE_Components_G2_G10.xlsx';
  } else if (templateFilename.includes('SPFL') || templateFilename.includes('Foreign Language')) {
    aliasFilename = 'ECR_Template_SPFL_G4_G10.xlsx';
  } else if (templateFilename.includes('SPJ') || templateFilename.includes('Journalism') || templateFilename.includes('Pamamahayag')) {
    aliasFilename = 'ECR_Template_SPJ_G4_G10.xlsx';
  } else if (templateFilename.includes('(for SPA)') || templateFilename.includes('SPA_G4_G10') || templateFilename.includes('Special Program in the Arts')) {
    aliasFilename = 'ECR_Template_SPA_G4_G10.xlsx';
  } else if (templateFilename.includes('(for SPS)') || templateFilename.includes('SPS_G4_G10') || templateFilename.includes('Special Program in Sports')) {
    aliasFilename = 'ECR_Template_SPS_G4_G10.xlsx';
  } else if (templateFilename.includes('(for SPTVE)') || templateFilename.includes('SPTVE_G4_G10') || templateFilename.includes('SPTVE') || templateFilename.includes('Technical-Vocational Education')) {
    aliasFilename = 'ECR_Template_SPTVE_G4_G10.xlsx';
  } else if (
    templateFilename.includes('(for SSES and SPSTEM)') ||
    templateFilename.includes('SSES_SPSTEM_G4_G10') ||
    templateFilename.includes('SSES') ||
    templateFilename.includes('SPSTEM') ||
    templateFilename.includes('Special Science')
  ) {
    aliasFilename = 'ECR_Template_SSES_SPSTEM_G4_G10.xlsx';
  } else if (templateFilename.includes('GMRC') || templateFilename.includes('Values Education') || templateFilename.includes('GMRC_VE')) {
    aliasFilename = 'ECR_Template_GMRC_VE_G2_G10.xlsx';
  } else if (templateFilename.includes('EPP-TLE') || templateFilename.includes('EPP_TLE')) {
    aliasFilename = 'ECR_Template_EPP_TLE_G2_G10.xlsx';
  } else if (templateFilename.includes('Music and Arts') || templateFilename.includes('MAPEH') || templateFilename.includes('Physical Education') || templateFilename.includes('PE and Health') || templateFilename.includes('P.E.')) {
    aliasFilename = 'ECR_Template_MAPEH_G2_G10.xlsx';
  }

  const candidateUrls: string[] = [
    `${cleanBase}templates/${aliasFilename}?t=${timestamp}`,
    `/templates/${aliasFilename}?t=${timestamp}`,
    `templates/${aliasFilename}?t=${timestamp}`,
    `${cleanBase}templates/${encodeURI(templateFilename)}?t=${timestamp}`,
    `/templates/${encodeURI(templateFilename)}?t=${timestamp}`,
    `templates/${encodeURI(templateFilename)}?t=${timestamp}`,
    `${cleanBase}templates/${templateFilename}?t=${timestamp}`,
    `/templates/${templateFilename}?t=${timestamp}`,
  ];

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        // Ensure the response is an actual Excel/ZIP archive (PK\x03\x04), not an HTML SPA fallback
        if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
          return buffer;
        }
      }
    } catch {
      // Try next candidate path
    }
  }

  throw new Error(`Could not load official DepEd Excel template binary for "${templateFilename}". Please ensure template files exist in public/templates.`);
}

/**
 * Updates or sets a cell in a Worksheet XML string cleanly, preserving cell styles.
 */
function updateCellInXml(sheetXml: string, cellRef: string, value: string | number | null | undefined, type: 'string' | 'number' = 'number'): string {
  const cellRegex = new RegExp(`(<c\\s+r="${cellRef}"[^>]*?)(?:/>|>(.*?)</c>)`, 's');
  const match = sheetXml.match(cellRegex);

  if (value === null || value === undefined || value === '') {
    if (match) {
      const sMatch = match[1].match(/\s+s="\d+"/);
      const styleAttr = sMatch ? sMatch[0] : '';
      return sheetXml.replace(cellRegex, `<c r="${cellRef}"${styleAttr}/>`);
    }
    return sheetXml;
  }

  const sMatch = match ? match[1].match(/\s+s="\d+"/) : null;
  const styleAttr = sMatch ? sMatch[0] : '';

  let newCellXml = '';
  if (type === 'string') {
    const escaped = String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    newCellXml = `<c r="${cellRef}"${styleAttr} t="inlineStr"><is><t>${escaped}</t></is></c>`;
  } else {
    const num = Number(value);
    newCellXml = `<c r="${cellRef}"${styleAttr}><v>${isNaN(num) ? 0 : num}</v></c>`;
  }

  if (match) {
    return sheetXml.replace(cellRegex, newCellXml);
  } else {
    const rowNum = parseInt(cellRef.replace(/\D/g, ''), 10);
    const rowRegex = new RegExp(`(<row\\s+r="${rowNum}"[^>]*>)(.*?)(</row>)`, 's');
    if (sheetXml.match(rowRegex)) {
      return sheetXml.replace(rowRegex, `$1$2${newCellXml}$3`);
    }
    return sheetXml;
  }
}

export const normalizeScores = (scores: (number | string)[] | undefined, count: number): (number | string)[] => {
  const src = Array.isArray(scores) ? scores : [];
  return Array.from({ length: count }, (_, i) => src[i] ?? '');
};

export const parseNumericScore = (val: number | string | null | undefined): number | null => {
  if (val === '' || val === null || val === undefined) return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
};

const OFFICIAL_REGIONS = [
  'Select Region', 'CAR', 'NCR', 'Region I', 'Region II', 'Region III', 'Region IV-A', 'MIMAROPA',
  'Region V', 'Region VI', 'Region VII', 'Region VIII', 'NIR', 'Region IX', 'Region X', 'Region XI',
  'Region XII', 'CARAGA', 'BARMM'
];

/**
 * Normalizes input region string to match the exact official DepEd dropdown value in E10.
 */
export function normalizeRegionForECR(raw?: string): string {
  if (!raw) return 'Select Region';
  const clean = String(raw).trim();
  const directMatch = OFFICIAL_REGIONS.find(r => r.toLowerCase() === clean.toLowerCase());
  if (directMatch) return directMatch;

  const upper = clean.toUpperCase();
  if (upper.includes('IV-A') || upper.includes('4-A') || upper.includes('4A') || upper.includes('CALABARZON')) return 'Region IV-A';
  if (upper.includes('IV-B') || upper.includes('4-B') || upper.includes('4B') || upper.includes('MIMAROPA')) return 'MIMAROPA';
  if (upper.includes('CARAGA') || upper.includes('XIII') || upper.includes(' 13') || upper.includes('REGION 13')) return 'CARAGA';
  if (upper.includes('BARMM') || upper.includes('BANGSAMORO') || upper.includes('ARMM')) return 'BARMM';
  if (upper.includes('CAR') || upper.includes('CORDILLERA')) return 'CAR';
  if (upper.includes('NCR') || upper.includes('NATIONAL CAPITAL')) return 'NCR';
  if (upper.includes('NIR') || upper.includes('NEGROS')) return 'NIR';

  // Check from highest to lowest index to prevent single-digit prefix collisions
  if (upper.includes('XII') || upper.includes(' 12') || upper.includes('REGION 12') || upper.includes('SOCCSKSARGEN')) return 'Region XII';
  if (upper.includes('XI') || upper.includes(' 11') || upper.includes('REGION 11') || upper.includes('DAVAO')) return 'Region XI';
  if (upper.includes('X') || upper.includes(' 10') || upper.includes('REGION 10') || upper.includes('NORTHERN MINDANAO')) return 'Region X';
  if (upper.includes('IX') || upper.includes(' 9') || upper.includes('REGION 9') || upper.includes('ZAMBOANGA')) return 'Region IX';
  if (upper.includes('VIII') || upper.includes(' 8') || upper.includes('REGION 8') || upper.includes('EASTERN VISAYAS')) return 'Region VIII';
  if (upper.includes('VII') || upper.includes(' 7') || upper.includes('REGION 7') || upper.includes('CENTRAL VISAYAS')) return 'Region VII';
  if (upper.includes('VI') || upper.includes(' 6') || upper.includes('REGION 6') || upper.includes('WESTERN VISAYAS')) return 'Region VI';
  if (upper.includes('V') || upper.includes(' 5') || upper.includes('REGION 5') || upper.includes('BICOL')) return 'Region V';
  if (upper.includes('III') || upper.includes(' 3') || upper.includes('REGION 3') || upper.includes('CENTRAL LUZON')) return 'Region III';
  if (upper.includes('II') || upper.includes(' 2') || upper.includes('REGION 2') || upper.includes('CAGAYAN')) return 'Region II';
  if (upper.includes(' I') || upper.includes(' 1') || upper.includes('REGION 1') || upper.includes('ILOCOS')) return 'Region I';

  return clean;
}

/**
 * Normalizes input grade level string to match the exact official DepEd numeric dropdown value (2, 3, 4, 5, 6, 7, 8, 9, 10) in E25.
 */
export function normalizeGradeLevelForECR(raw?: string): string {
  if (!raw) return '2';
  const match = String(raw).match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    if (num >= 2 && num <= 10) {
      return String(num);
    }
  }
  return String(raw).trim();
}

/**
 * Normalizes input subject name to match the exact official DepEd dropdown value in E24.
 * Template 1 (Academic): Science, Mathematics, GMRC, Values Education, Filipino, English, Araling Panlipunan, Makabansa
 * Template 2 (EPP/TLE): EPP/TLE, TLE
 * Template 3 (MAPEH): MAPEH
 */
export function normalizeSubjectForECR(
  subjectName: string,
  templateType?: ECRTemplateType,
  gradeLevel?: string
): string {
  const actualType = templateType || getECRTemplateType(subjectName, gradeLevel);
  const norm = String(subjectName || '').trim().toLowerCase();
  const gradeNum = parseInt(normalizeGradeLevelForECR(gradeLevel), 10) || 0;

  if (actualType === 'mapeh') {
    return 'MAPEH';
  }

  if (actualType === 'spfl') {
    if (norm.includes('span') || norm.includes('espanol')) return 'Special Program in Foreign Language - Spanish';
    if (norm.includes('japan') || norm.includes('nihon')) return 'Special Program in Foreign Language - Japanese';
    if (norm.includes('french') || norm.includes('francais')) return 'Special Program in Foreign Language - French';
    if (norm.includes('german') || norm.includes('deutsch')) return 'Special Program in Foreign Language - German';
    if (norm.includes('chin') || norm.includes('mandarin')) return 'Special Program in Foreign Language - Chinese';
    if (norm.includes('korean') || norm.includes('hangul')) return 'Special Program in Foreign Language - Korean';

    const exact = SPFL_SUBJECTS.find(s => s.toLowerCase() === norm);
    if (exact) return exact;
    return 'Special Program in Foreign Language - Spanish';
  }

  if (actualType === 'spj') {
    if (norm.includes('pamamahayag') || norm.includes('filipino') || norm.includes('tagalog')) {
      return 'Special Program in Journalism (Pamamahayag)';
    }
    return 'Special Program in Journalism (Journalism)';
  }

  if (actualType === 'spa') {
    return 'Special Program in the Arts (SPA)';
  }

  if (actualType === 'sps') {
    return 'Special Program in Sports (SPS)';
  }

  if (actualType === 'sptve') {
    if (norm.includes('drawing') || norm.includes('drafting')) {
      return 'Applied Technical Drawing';
    }
    if (norm.includes('entrepreneur') || norm.includes('entrep')) {
      return 'Applied Entrepreneurship';
    }
    return 'TVE Specialization';
  }

  if (actualType === 'sses_spstem') {
    if (norm.includes('math')) {
      return 'Enhanced Mathematics';
    }
    if (norm.includes('creat') || norm.includes('tech')) {
      return 'Creative Technology';
    }
    if (norm.includes('research') || norm.includes('mim') || norm.includes('sip') || norm.includes('investigat')) {
      return 'Research MIM/SIP';
    }
    return 'Enhanced Science';
  }

  if (actualType === 'gmrc_ve') {
    // Data validation dropdown in E24: "GMRC, Values Education"
    return gradeNum >= 7 ? 'Values Education' : 'GMRC';
  }

  if (templateType === 'epp_tle') {
    if (norm.includes('epp') && !norm.includes('tle')) return 'EPP/TLE';
    if (norm.includes('tle') || norm.includes('tvl') || norm.includes('technol')) {
      return gradeNum <= 6 ? 'EPP/TLE' : 'TLE';
    }
    return gradeNum <= 6 ? 'EPP/TLE' : 'TLE';
  }

  // Academic subjects
  if (norm.includes('sci')) return 'Science';
  if (norm.includes('math')) return 'Mathematics';
  if (norm.includes('eng')) return 'English';
  if (norm.includes('fil')) return 'Filipino';
  if (norm.includes('makabansa')) return 'Makabansa';
  if (norm.includes('aral') || norm === 'ap' || norm.includes('panlipunan') || norm.includes('social')) return 'Araling Panlipunan';

  const acList = ['Science', 'Mathematics', 'Filipino', 'English', 'Araling Panlipunan', 'Makabansa'];
  const exact = acList.find(x => x.toLowerCase() === norm);
  if (exact) return exact;

  return subjectName.trim() || 'Science';
}

/**
 * Internal helper to populate a single term's score sheet (WWs, PTs, STs, Exam).
 */
function populateTermGradingXml(
  sheetXml: string,
  targetSubject: Subject | string | Set<string>,
  term: 1 | 2 | 3,
  schoolYear: string,
  section: Section,
  maleStudents: Student[],
  femaleStudents: Student[],
  classRecords: ClassRecord[],
  hpsRecords: HPSRecord[],
  templateType: ECRTemplateType = 'academic',
  candidateSubjectIds?: Set<string>
): string {
  const isGmrc = templateType === 'gmrc_ve';
  const wwCount = isGmrc ? 10 : WW_COUNT;
  const ptCount = isGmrc ? 9 : PT_COUNT;
  const hpsRow = isGmrc ? 16 : 15;
  const maleStartRow = isGmrc ? 19 : 18;
  const femaleStartRow = isGmrc ? 70 : 69;

  const targetIds = new Set<string>();
  if (typeof targetSubject === 'string') {
    targetIds.add(targetSubject);
  } else if (targetSubject instanceof Set) {
    targetSubject.forEach(id => targetIds.add(id));
  } else if (targetSubject && typeof targetSubject === 'object') {
    if (targetSubject.id) targetIds.add(targetSubject.id);
    if (targetSubject.subject_name) targetIds.add(targetSubject.subject_name);
  }
  if (candidateSubjectIds) {
    candidateSubjectIds.forEach(id => targetIds.add(id));
  }

  const isTargetSubject = (subjId?: string, subjName?: string) => {
    if (!subjId && !subjName) return false;
    if (subjId && targetIds.has(subjId)) return true;
    if (subjName && targetIds.has(subjName)) return true;
    
    // Case-insensitive / normalized match against all candidate IDs and names
    const normSubjId = String(subjId || '').trim().toLowerCase();
    const normSubjName = String(subjName || '').trim().toLowerCase();
    for (const tid of targetIds) {
      const normTid = tid.trim().toLowerCase();
      if (normSubjId === normTid || normSubjName === normTid) return true;
    }
    return false;
  };

  const isSyMatch = (sy?: string) => {
    if (!sy || !schoolYear) return true;
    const cleanR = String(sy).trim().replace(/\s+/g, '');
    const cleanTarget = String(schoolYear).trim().replace(/\s+/g, '');
    return cleanR === cleanTarget || cleanR.includes(cleanTarget) || cleanTarget.includes(cleanR);
  };

  const isTermMatch = (q?: string | number) => {
    return Number(q) === term;
  };

  const secId = section.id;
  const secName = section.section_name;
  const fullSecName = `${section.section_grade_level} - ${section.section_name}`;

  const isSecMatch = (sId?: string, recId?: string) => {
    if (!sId && !recId) return false;
    if (sId === secId || sId === secName || sId === fullSecName) return true;
    if (recId && (recId.includes(secId) || recId.includes(secName))) return true;
    return false;
  };

  const hpsRecord = hpsRecords.find(
    r =>
      isTargetSubject(r.subject_id) &&
      isTermMatch(r.quarter) &&
      isSyMatch(r.school_year) &&
      isSecMatch(r.section_id, r.id)
  ) || hpsRecords.find(
    r =>
      isTargetSubject(r.subject_id) &&
      isTermMatch(r.quarter) &&
      isSyMatch(r.school_year) &&
      !r.section_id
  ) || hpsRecords.find(
    r =>
      isTargetSubject(r.subject_id) &&
      isTermMatch(r.quarter) &&
      isSecMatch(r.section_id, r.id)
  ) || hpsRecords.find(
    r =>
      isTargetSubject(r.subject_id) &&
      isTermMatch(r.quarter)
  );

  const rawQaHps = (hpsRecord as (HPSRecord & { summative_tests?: (number | string)[] }) | undefined)?.summative_tests;
  const hps_ww = normalizeScores(hpsRecord?.written_works, wwCount);
  const hps_pt = normalizeScores(hpsRecord?.performance_tasks, ptCount);
  const hps_qa = normalizeScores(rawQaHps, ST_COUNT);
  if (hps_qa[2] === '' && hpsRecord?.quarterly_exam !== '' && hpsRecord?.quarterly_exam !== undefined) {
    hps_qa[2] = hpsRecord.quarterly_exam;
  }

  if (isGmrc) {
    // GMRC & Values Education template
    // WW Cognitive (indices 0..4)
    ['F', 'G', 'H', 'I', 'J'].forEach((col, idx) => {
      sheetXml = updateCellInXml(sheetXml, `${col}${hpsRow}`, parseNumericScore(hps_ww[idx]), 'number');
    });
    // WW Affective (indices 5..9)
    ['N', 'O', 'P', 'Q', 'R'].forEach((col, idx) => {
      sheetXml = updateCellInXml(sheetXml, `${col}${hpsRow}`, parseNumericScore(hps_ww[5 + idx]), 'number');
    });
    // PT Cognitive (indices 0..2)
    ['V', 'W', 'X'].forEach((col, idx) => {
      sheetXml = updateCellInXml(sheetXml, `${col}${hpsRow}`, parseNumericScore(hps_pt[idx]), 'number');
    });
    // PT Affective (indices 3..5)
    ['AB', 'AC', 'AD'].forEach((col, idx) => {
      sheetXml = updateCellInXml(sheetXml, `${col}${hpsRow}`, parseNumericScore(hps_pt[3 + idx]), 'number');
    });
    // PT Behavioral (indices 6..8)
    ['AH', 'AI', 'AJ'].forEach((col, idx) => {
      sheetXml = updateCellInXml(sheetXml, `${col}${hpsRow}`, parseNumericScore(hps_pt[6 + idx]), 'number');
    });
    sheetXml = updateCellInXml(sheetXml, `AN${hpsRow}`, parseNumericScore(hps_qa[0]), 'number');
    sheetXml = updateCellInXml(sheetXml, `AO${hpsRow}`, parseNumericScore(hps_qa[1]), 'number');
    sheetXml = updateCellInXml(sheetXml, `AP${hpsRow}`, parseNumericScore(hps_qa[2]), 'number');

    // Subweights (30 / 30 / 40)
    sheetXml = updateCellInXml(sheetXml, `AQ${hpsRow}`, 30, 'number');
    sheetXml = updateCellInXml(sheetXml, `AR${hpsRow}`, 30, 'number');
    sheetXml = updateCellInXml(sheetXml, `AS${hpsRow}`, 40, 'number');
  } else {
    // Academic, EPP/TLE & MAPEH
    const wwCols = ['F', 'G', 'H', 'I', 'J'];
    const ptCols = ['N', 'O', 'P'];

    wwCols.forEach((col, idx) => {
      sheetXml = updateCellInXml(sheetXml, `${col}15`, parseNumericScore(hps_ww[idx]), 'number');
    });
    ptCols.forEach((col, idx) => {
      sheetXml = updateCellInXml(sheetXml, `${col}15`, parseNumericScore(hps_pt[idx]), 'number');
    });
    sheetXml = updateCellInXml(sheetXml, 'T15', parseNumericScore(hps_qa[0]), 'number');
    sheetXml = updateCellInXml(sheetXml, 'U15', parseNumericScore(hps_qa[1]), 'number');
    sheetXml = updateCellInXml(sheetXml, 'V15', parseNumericScore(hps_qa[2]), 'number');

    // Subweights (30 / 30 / 40)
    sheetXml = updateCellInXml(sheetXml, 'W15', 30, 'number');
    sheetXml = updateCellInXml(sheetXml, 'X15', 30, 'number');
    sheetXml = updateCellInXml(sheetXml, 'Y15', 40, 'number');
  }

  // Populate student scores
  const populateRosterScores = (list: Student[], startRow: number) => {
    for (let i = 0; i < MAX_STUDENTS_PER_GENDER; i++) {
      const row = startRow + i;
      if (i < list.length) {
        const st = list[i];
        const rec = classRecords.find(
          r =>
            (r.student_lrn === st.lrn || String(r.student_lrn).trim() === String(st.lrn).trim()) &&
            isTargetSubject(r.subject_id) &&
            isTermMatch(r.quarter) &&
            isSyMatch(r.school_year)
        ) || classRecords.find(
          r =>
            (r.student_lrn === st.lrn || String(r.student_lrn).trim() === String(st.lrn).trim()) &&
            isTargetSubject(r.subject_id) &&
            isTermMatch(r.quarter)
        );

        const rawQa = (rec as (ClassRecord & { summative_tests?: (number | string)[] }) | undefined)?.summative_tests;
        const ww = normalizeScores(rec?.written_works, wwCount);
        const pt = normalizeScores(rec?.performance_tasks, ptCount);
        const qa = normalizeScores(rawQa, ST_COUNT);
        if (qa[2] === '' && rec?.quarterly_exam !== '' && rec?.quarterly_exam !== undefined) {
          qa[2] = rec.quarterly_exam;
        }

        if (isGmrc) {
          // WW Cognitive (indices 0..4)
          ['F', 'G', 'H', 'I', 'J'].forEach((col, cIdx) => {
            sheetXml = updateCellInXml(sheetXml, `${col}${row}`, parseNumericScore(ww[cIdx]), 'number');
          });
          // WW Affective (indices 5..9)
          ['N', 'O', 'P', 'Q', 'R'].forEach((col, cIdx) => {
            sheetXml = updateCellInXml(sheetXml, `${col}${row}`, parseNumericScore(ww[5 + cIdx]), 'number');
          });
          // PT Cognitive (indices 0..2)
          ['V', 'W', 'X'].forEach((col, cIdx) => {
            sheetXml = updateCellInXml(sheetXml, `${col}${row}`, parseNumericScore(pt[cIdx]), 'number');
          });
          // PT Affective (indices 3..5)
          ['AB', 'AC', 'AD'].forEach((col, cIdx) => {
            sheetXml = updateCellInXml(sheetXml, `${col}${row}`, parseNumericScore(pt[3 + cIdx]), 'number');
          });
          // PT Behavioral (indices 6..8)
          ['AH', 'AI', 'AJ'].forEach((col, cIdx) => {
            sheetXml = updateCellInXml(sheetXml, `${col}${row}`, parseNumericScore(pt[6 + cIdx]), 'number');
          });
          sheetXml = updateCellInXml(sheetXml, `AN${row}`, parseNumericScore(qa[0]), 'number');
          sheetXml = updateCellInXml(sheetXml, `AO${row}`, parseNumericScore(qa[1]), 'number');
          sheetXml = updateCellInXml(sheetXml, `AP${row}`, parseNumericScore(qa[2]), 'number');
        } else {
          const wwCols = ['F', 'G', 'H', 'I', 'J'];
          const ptCols = ['N', 'O', 'P'];
          wwCols.forEach((col, cIdx) => {
            sheetXml = updateCellInXml(sheetXml, `${col}${row}`, parseNumericScore(ww[cIdx]), 'number');
          });
          ptCols.forEach((col, cIdx) => {
            sheetXml = updateCellInXml(sheetXml, `${col}${row}`, parseNumericScore(pt[cIdx]), 'number');
          });
          sheetXml = updateCellInXml(sheetXml, `T${row}`, parseNumericScore(qa[0]), 'number');
          sheetXml = updateCellInXml(sheetXml, `U${row}`, parseNumericScore(qa[1]), 'number');
          sheetXml = updateCellInXml(sheetXml, `V${row}`, parseNumericScore(qa[2]), 'number');
        }
      } else {
        // Clear row scores
        if (isGmrc) {
          ['F', 'G', 'H', 'I', 'J', 'N', 'O', 'P', 'Q', 'R', 'V', 'W', 'X', 'AB', 'AC', 'AD', 'AH', 'AI', 'AJ', 'AN', 'AO', 'AP'].forEach((col) => {
            sheetXml = updateCellInXml(sheetXml, `${col}${row}`, null, 'number');
          });
        } else {
          ['F', 'G', 'H', 'I', 'J', 'N', 'O', 'P', 'T', 'U', 'V'].forEach((col) => {
            sheetXml = updateCellInXml(sheetXml, `${col}${row}`, null, 'number');
          });
        }
      }
    }
  };

  populateRosterScores(maleStudents, maleStartRow);
  populateRosterScores(femaleStudents, femaleStartRow);

  return sheetXml;
}

/**
 * Populates official data directly into the OpenXML template archive.
 */
export async function populateECRWorkbookZip(
  templateBuffer: ArrayBuffer | Uint8Array,
  opts: ECRExcelExportOptions
): Promise<JSZip> {
  const {
    schoolProfile,
    schoolYear,
    section,
    subject,
    allSubjects,
    teacherName,
    students,
    classRecords,
    hpsRecords
  } = opts;

  const zip = await JSZip.loadAsync(templateBuffer);
  const templateType = opts.templateOverride || getECRTemplateType(subject.subject_name, section.section_grade_level);

  // Filter students for section & subject
  let sectionStudents = students.filter(
    s => s.student_section === section.id || s.student_section === section.section_name
  );

  if (subject.enrolled_student_lrns && subject.enrolled_student_lrns.length > 0) {
    sectionStudents = sectionStudents.filter(s => subject.enrolled_student_lrns?.includes(s.lrn));
  }

  const maleStudents = sectionStudents
    .filter(s => s.gender === 'Male')
    .sort((a, b) => `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`))
    .slice(0, MAX_STUDENTS_PER_GENDER);

  const femaleStudents = sectionStudents
    .filter(s => s.gender === 'Female')
    .sort((a, b) => `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`))
    .slice(0, MAX_STUDENTS_PER_GENDER);

  // 1. Populate INPUT DATA (sheet1.xml)
  const sheet1File = zip.file('xl/worksheets/sheet1.xml');
  if (sheet1File) {
    let sheet1Xml = await sheet1File.async('text');
    sheet1Xml = updateCellInXml(sheet1Xml, 'E10', normalizeRegionForECR(schoolProfile?.region), 'string');
    sheet1Xml = updateCellInXml(sheet1Xml, 'E11', (schoolProfile?.division || '').toUpperCase(), 'string');
    sheet1Xml = updateCellInXml(sheet1Xml, 'E13', schoolProfile?.school_id || '', 'string');
    sheet1Xml = updateCellInXml(sheet1Xml, 'E14', (schoolProfile?.name || '').toUpperCase(), 'string');
    sheet1Xml = updateCellInXml(sheet1Xml, 'E15', schoolYear || '', 'string');
    sheet1Xml = updateCellInXml(sheet1Xml, 'E16', (schoolProfile?.head_name || '').toUpperCase(), 'string');
    sheet1Xml = updateCellInXml(sheet1Xml, 'E23', (teacherName || section.adviser_name || schoolProfile?.adviser_name || '').toUpperCase(), 'string');
    sheet1Xml = updateCellInXml(sheet1Xml, 'E24', normalizeSubjectForECR(subject.subject_name, templateType === 'epp_tle_components' ? 'epp_tle' : templateType, section.section_grade_level), 'string');
    sheet1Xml = updateCellInXml(sheet1Xml, 'E25', normalizeGradeLevelForECR(section.section_grade_level), 'string');
    sheet1Xml = updateCellInXml(sheet1Xml, 'E26', section.section_name.toUpperCase(), 'string');

    // Male Learner Names (K11..K60)
    for (let i = 0; i < MAX_STUDENTS_PER_GENDER; i++) {
      const nameVal = i < maleStudents.length ? formatLearnerName(maleStudents[i]).toUpperCase() : null;
      sheet1Xml = updateCellInXml(sheet1Xml, `K${11 + i}`, nameVal, 'string');
    }

    // Female Learner Names (N11..N60)
    for (let i = 0; i < MAX_STUDENTS_PER_GENDER; i++) {
      const nameVal = i < femaleStudents.length ? formatLearnerName(femaleStudents[i]).toUpperCase() : null;
      sheet1Xml = updateCellInXml(sheet1Xml, `N${11 + i}`, nameVal, 'string');
    }

    zip.file('xl/worksheets/sheet1.xml', sheet1Xml);
  }

  // 2. Populate Grading Sheets
  if (templateType === 'mapeh') {
    // MAPEH Template has 6 grading sheets:
    // sheet2.xml: TERM 1 Music and Arts, sheet3.xml: TERM 1 PE and Health
    // sheet4.xml: TERM 2 Music and Arts, sheet5.xml: TERM 2 PE and Health
    // sheet6.xml: TERM 3 Music and Arts, sheet7.xml: TERM 3 PE and Health

    // 1. Gather all candidate subjects matching this section first
    const sectionScopedSubjects = (allSubjects || []).filter(s =>
      s.section_id === section.id ||
      s.section_id === section.section_name ||
      s.grade_level === section.section_grade_level ||
      (s.grade_level && normalizeGradeLevelForECR(s.grade_level) === normalizeGradeLevelForECR(section.section_grade_level))
    );

    const pool = sectionScopedSubjects.length > 0
      ? sectionScopedSubjects
      : (allSubjects && allSubjects.length > 0 ? allSubjects : [subject]);

    // Find section-specific MA and PE subjects
    const maSubject = pool.find(s => isMusicArtsSubject(s.subject_name)) ||
      (allSubjects || []).find(s => isMusicArtsSubject(s.subject_name)) ||
      subject;

    const peSubject = pool.find(s => isPeHealthSubject(s.subject_name)) ||
      (allSubjects || []).find(s => isPeHealthSubject(s.subject_name)) ||
      subject;

    // Build comprehensive candidate ID sets so records saved under IDs or Names or Aliases match
    const maCandidateIds = new Set<string>();
    pool.filter(s => isMusicArtsSubject(s.subject_name)).forEach(s => {
      maCandidateIds.add(s.id);
      maCandidateIds.add(s.subject_name);
    });
    if (maSubject?.id) maCandidateIds.add(maSubject.id);
    if (maSubject?.subject_name) maCandidateIds.add(maSubject.subject_name);
    maCandidateIds.add('Music and Arts');
    maCandidateIds.add('Music & Arts');
    maCandidateIds.add('Music and Art');
    maCandidateIds.add('Music & Art');
    maCandidateIds.add('Music');
    maCandidateIds.add('Arts');

    const peCandidateIds = new Set<string>();
    pool.filter(s => isPeHealthSubject(s.subject_name)).forEach(s => {
      peCandidateIds.add(s.id);
      peCandidateIds.add(s.subject_name);
    });
    if (peSubject?.id) peCandidateIds.add(peSubject.id);
    if (peSubject?.subject_name) peCandidateIds.add(peSubject.subject_name);
    peCandidateIds.add('Physical Education and Health');
    peCandidateIds.add('PE and Health');
    peCandidateIds.add('PE & Health');
    peCandidateIds.add('P.E. and Health');
    peCandidateIds.add('P.E. & Health');
    peCandidateIds.add('Physical Education');
    peCandidateIds.add('Health');
    peCandidateIds.add('PE');
    peCandidateIds.add('P.E.');

    const terms: Array<1 | 2 | 3> = [1, 2, 3];
    for (const term of terms) {
      const maSheetPath = `xl/worksheets/sheet${(term - 1) * 2 + 2}.xml`;
      const peSheetPath = `xl/worksheets/sheet${(term - 1) * 2 + 3}.xml`;

      const maFile = zip.file(maSheetPath);
      if (maFile) {
        let xml = await maFile.async('text');
        xml = populateTermGradingXml(xml, maSubject, term, schoolYear, section, maleStudents, femaleStudents, classRecords, hpsRecords, templateType, maCandidateIds);
        zip.file(maSheetPath, xml);
      }

      const peFile = zip.file(peSheetPath);
      if (peFile) {
        let xml = await peFile.async('text');
        xml = populateTermGradingXml(xml, peSubject, term, schoolYear, section, maleStudents, femaleStudents, classRecords, hpsRecords, templateType, peCandidateIds);
        zip.file(peSheetPath, xml);
      }
    }
  } else if (templateType === 'epp_tle_components') {
    // EPP/TLE Per-Component Template has 6 grading sheets:
    // sheet2.xml: TERM 1 ICT, sheet3.xml: TERM 1 AFA
    // sheet4.xml: TERM 2 ICT, sheet5.xml: TERM 2 FCS
    // sheet6.xml: TERM 3 ICT, sheet7.xml: TERM 3 IA

    const sectionScopedSubjects = (allSubjects || []).filter(s =>
      s.section_id === section.id ||
      s.section_id === section.section_name ||
      s.grade_level === section.section_grade_level ||
      (s.grade_level && normalizeGradeLevelForECR(s.grade_level) === normalizeGradeLevelForECR(section.section_grade_level))
    );

    const pool = sectionScopedSubjects.length > 0
      ? sectionScopedSubjects
      : (allSubjects && allSubjects.length > 0 ? allSubjects : [subject]);

    const ictSubject = pool.find(s => isIctComponent(s.subject_name)) ||
      (allSubjects || []).find(s => isIctComponent(s.subject_name)) ||
      subject;

    const afaSubject = pool.find(s => isAfaComponent(s.subject_name)) ||
      (allSubjects || []).find(s => isAfaComponent(s.subject_name)) ||
      subject;

    const fcsSubject = pool.find(s => isFcsComponent(s.subject_name)) ||
      (allSubjects || []).find(s => isFcsComponent(s.subject_name)) ||
      subject;

    const iaSubject = pool.find(s => isIaComponent(s.subject_name)) ||
      (allSubjects || []).find(s => isIaComponent(s.subject_name)) ||
      subject;

    const ictCandidateIds = new Set<string>();
    pool.filter(s => isIctComponent(s.subject_name)).forEach(s => {
      ictCandidateIds.add(s.id);
      ictCandidateIds.add(s.subject_name);
    });
    if (ictSubject?.id) ictCandidateIds.add(ictSubject.id);
    if (ictSubject?.subject_name) ictCandidateIds.add(ictSubject.subject_name);
    if (ictSubject === subject) {
      ictCandidateIds.add(subject.id);
      ictCandidateIds.add(subject.subject_name);
    }
    ictCandidateIds.add('ICT');
    ictCandidateIds.add('Information and Communications Technology');
    ictCandidateIds.add('Information & Communications Technology');
    ictCandidateIds.add('Computer');

    const afaCandidateIds = new Set<string>();
    pool.filter(s => isAfaComponent(s.subject_name)).forEach(s => {
      afaCandidateIds.add(s.id);
      afaCandidateIds.add(s.subject_name);
    });
    if (afaSubject?.id) afaCandidateIds.add(afaSubject.id);
    if (afaSubject?.subject_name) afaCandidateIds.add(afaSubject.subject_name);
    if (afaSubject === subject) {
      afaCandidateIds.add(subject.id);
      afaCandidateIds.add(subject.subject_name);
    }
    afaCandidateIds.add('AFA');
    afaCandidateIds.add('Agri-Fishery Arts');
    afaCandidateIds.add('Agriculture and Fishery Arts');
    afaCandidateIds.add('Agriculture');

    const fcsCandidateIds = new Set<string>();
    pool.filter(s => isFcsComponent(s.subject_name)).forEach(s => {
      fcsCandidateIds.add(s.id);
      fcsCandidateIds.add(s.subject_name);
    });
    if (fcsSubject?.id) fcsCandidateIds.add(fcsSubject.id);
    if (fcsSubject?.subject_name) fcsCandidateIds.add(fcsSubject.subject_name);
    if (fcsSubject === subject) {
      fcsCandidateIds.add(subject.id);
      fcsCandidateIds.add(subject.subject_name);
    }
    fcsCandidateIds.add('FCS');
    fcsCandidateIds.add('Family and Consumer Science');
    fcsCandidateIds.add('Family and Consumer Sciences');
    fcsCandidateIds.add('Home Economics');
    fcsCandidateIds.add('HE');

    const iaCandidateIds = new Set<string>();
    pool.filter(s => isIaComponent(s.subject_name)).forEach(s => {
      iaCandidateIds.add(s.id);
      iaCandidateIds.add(s.subject_name);
    });
    if (iaSubject?.id) iaCandidateIds.add(iaSubject.id);
    if (iaSubject?.subject_name) iaCandidateIds.add(iaSubject.subject_name);
    if (iaSubject === subject) {
      iaCandidateIds.add(subject.id);
      iaCandidateIds.add(subject.subject_name);
    }
    iaCandidateIds.add('IA');
    iaCandidateIds.add('Industrial Arts');

    // TERM 1 ICT (sheet2.xml)
    const s2File = zip.file('xl/worksheets/sheet2.xml');
    if (s2File) {
      let xml = await s2File.async('text');
      xml = populateTermGradingXml(xml, ictSubject, 1, schoolYear, section, maleStudents, femaleStudents, classRecords, hpsRecords, 'academic', ictCandidateIds);
      zip.file('xl/worksheets/sheet2.xml', xml);
    }

    // TERM 1 AFA (sheet3.xml)
    const s3File = zip.file('xl/worksheets/sheet3.xml');
    if (s3File) {
      let xml = await s3File.async('text');
      xml = populateTermGradingXml(xml, afaSubject, 1, schoolYear, section, maleStudents, femaleStudents, classRecords, hpsRecords, 'academic', afaCandidateIds);
      zip.file('xl/worksheets/sheet3.xml', xml);
    }

    // TERM 2 ICT (sheet4.xml)
    const s4File = zip.file('xl/worksheets/sheet4.xml');
    if (s4File) {
      let xml = await s4File.async('text');
      xml = populateTermGradingXml(xml, ictSubject, 2, schoolYear, section, maleStudents, femaleStudents, classRecords, hpsRecords, 'academic', ictCandidateIds);
      zip.file('xl/worksheets/sheet4.xml', xml);
    }

    // TERM 2 FCS (sheet5.xml)
    const s5File = zip.file('xl/worksheets/sheet5.xml');
    if (s5File) {
      let xml = await s5File.async('text');
      xml = populateTermGradingXml(xml, fcsSubject, 2, schoolYear, section, maleStudents, femaleStudents, classRecords, hpsRecords, 'academic', fcsCandidateIds);
      zip.file('xl/worksheets/sheet5.xml', xml);
    }

    // TERM 3 ICT (sheet6.xml)
    const s6File = zip.file('xl/worksheets/sheet6.xml');
    if (s6File) {
      let xml = await s6File.async('text');
      xml = populateTermGradingXml(xml, ictSubject, 3, schoolYear, section, maleStudents, femaleStudents, classRecords, hpsRecords, 'academic', ictCandidateIds);
      zip.file('xl/worksheets/sheet6.xml', xml);
    }

    // TERM 3 IA (sheet7.xml)
    const s7File = zip.file('xl/worksheets/sheet7.xml');
    if (s7File) {
      let xml = await s7File.async('text');
      xml = populateTermGradingXml(xml, iaSubject, 3, schoolYear, section, maleStudents, femaleStudents, classRecords, hpsRecords, 'academic', iaCandidateIds);
      zip.file('xl/worksheets/sheet7.xml', xml);
    }
  } else {
    // Academic, GMRC/VE & standard EPP/TLE Templates:
    // sheet2.xml: TERM 1, sheet3.xml: TERM 2, sheet4.xml: TERM 3
    const candidateIds = new Set<string>();
    candidateIds.add(subject.id);
    candidateIds.add(subject.subject_name);
    (allSubjects || [])
      .filter(s => s.subject_name.trim().toLowerCase() === subject.subject_name.trim().toLowerCase())
      .forEach(s => candidateIds.add(s.id));

    const terms: Array<1 | 2 | 3> = [1, 2, 3];
    for (const term of terms) {
      const sheetPath = `xl/worksheets/sheet${term + 1}.xml`;
      const sheetFile = zip.file(sheetPath);
      if (!sheetFile) continue;

      let sheetXml = await sheetFile.async('text');
      sheetXml = populateTermGradingXml(sheetXml, subject, term, schoolYear, section, maleStudents, femaleStudents, classRecords, hpsRecords, templateType, candidateIds);
      zip.file(sheetPath, sheetXml);
    }
  }

  // 3. Ensure full calculation on open (calcPr fullCalcOnLoad="1")
  const wbFile = zip.file('xl/workbook.xml');
  if (wbFile) {
    let wbXml = await wbFile.async('text');
    if (wbXml.includes('<calcPr')) {
      wbXml = wbXml.replace(/<calcPr([^>]*?)(?:\/>|>.*?<\/calcPr>)/, '<calcPr$1 fullCalcOnLoad="1"/>');
    } else {
      wbXml = wbXml.replace('</workbook>', '<calcPr fullCalcOnLoad="1"/></workbook>');
    }
    zip.file('xl/workbook.xml', wbXml);
  }

  return zip;
}

/**
 * Exports a single Subject's official 3-Term E-Class Record to Excel (.xlsx).
 * Available only for Grades 2 to 10.
 */
export async function exportECRToExcel(opts: ECRExcelExportOptions): Promise<void> {
  const gradeLevel = opts.section.section_grade_level;
  if (!isGrade2To10(gradeLevel)) {
    throw new Error(`Official DepEd 3-Term E-Class Record export is only available for Grades 2 to 10. Grade Level "${gradeLevel || 'unknown'}" is not supported.`);
  }

  const templateType = opts.templateOverride || getECRTemplateType(opts.subject.subject_name, opts.section.section_grade_level);
  const templateName = getECRTemplateFilename(opts.subject.subject_name, opts.section.section_grade_level, opts.templateOverride);
  const templateBuffer = await fetchECRTemplateBuffer(templateName);
  const zip = await populateECRWorkbookZip(templateBuffer, opts);

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const isMapeh = isMapehSubject(opts.subject.subject_name);
  const isPerComp = templateType === 'epp_tle_components';
  const cleanGrade = (opts.section.section_grade_level || 'Grade').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanSection = (opts.section.section_name || 'Section').replace(/[^a-zA-Z0-9]/g, '_');
  let cleanSubject = isMapeh ? 'MAPEH' : (opts.subject.subject_name || 'Subject').replace(/[^a-zA-Z0-9]/g, '_');
  if (isPerComp) {
    cleanSubject = 'EPP_TLE_PerComponent';
  }
  const cleanSY = (opts.schoolYear || '').replace(/[^a-zA-Z0-9-]/g, '_');

  const filename = `ECR_${cleanGrade}_${cleanSection}_${cleanSubject}_${cleanSY}.xlsx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Batch export all subjects for a section into a ZIP archive containing individual ECR workbooks.
 * Automatically consolidates MAPEH component subjects into a single official MAPEH workbook.
 * Available only for Grades 2 to 10.
 */
export async function exportECRBatchToZip(
  batchOpts: ECRExcelExportOptions[],
  zipFilename: string,
  onProgress?: (pct: number) => void
): Promise<void> {
  const validBatchOpts = batchOpts.filter(o => isGrade2To10(o.section.section_grade_level));
  if (validBatchOpts.length === 0) {
    throw new Error('No valid Grade 2 to Grade 10 subjects to export in batch.');
  }

  const academicTemplateBuffer = await fetchECRTemplateBuffer(TEMPLATE_ACADEMIC).catch(() => null);
  const ssesSpstemTemplateBuffer = await fetchECRTemplateBuffer(TEMPLATE_SSES_SPSTEM).catch(() => null);
  const sptveTemplateBuffer = await fetchECRTemplateBuffer(TEMPLATE_SPTVE).catch(() => null);
  const spsTemplateBuffer = await fetchECRTemplateBuffer(TEMPLATE_SPS).catch(() => null);
  const spaTemplateBuffer = await fetchECRTemplateBuffer(TEMPLATE_SPA).catch(() => null);
  const spflTemplateBuffer = await fetchECRTemplateBuffer(TEMPLATE_SPFL).catch(() => null);
  const spjTemplateBuffer = await fetchECRTemplateBuffer(TEMPLATE_SPJ).catch(() => null);
  const gmrcVeTemplateBuffer = await fetchECRTemplateBuffer(TEMPLATE_GMRC_VE).catch(() => null);
  const eppTleTemplateBuffer = await fetchECRTemplateBuffer(TEMPLATE_EPP_TLE).catch(() => null);
  const eppTleComponentsTemplateBuffer = await fetchECRTemplateBuffer(TEMPLATE_EPP_TLE_COMPONENTS).catch(() => null);
  const mapehTemplateBuffer = await fetchECRTemplateBuffer(TEMPLATE_MAPEH).catch(() => null);

  const mainZip = new JSZip();

  // Deduplicate and consolidate MAPEH into one workbook if multiple components exist
  const allSectionSubjects = validBatchOpts.map(o => o.subject);
  const finalExportList: ECRExcelExportOptions[] = [];
  let mapehProcessed = false;

  for (const opt of validBatchOpts) {
    const isMapeh = isMapehSubject(opt.subject.subject_name);
    if (isMapeh) {
      if (!mapehProcessed) {
        mapehProcessed = true;
        finalExportList.push({
          ...opt,
          subject: { id: opt.subject.id, subject_name: 'MAPEH' } as Subject,
          allSubjects: allSectionSubjects
        });
      }
    } else {
      finalExportList.push({
        ...opt,
        allSubjects: allSectionSubjects
      });
    }
  }

  const total = finalExportList.length;

  for (let i = 0; i < total; i++) {
    const opts = finalExportList[i];
    const templateType = opts.templateOverride || getECRTemplateType(opts.subject.subject_name, opts.section.section_grade_level);
    
    let templateBuffer: ArrayBuffer | null = null;
    if (templateType === 'sses_spstem') {
      templateBuffer = ssesSpstemTemplateBuffer || (await fetchECRTemplateBuffer(TEMPLATE_SSES_SPSTEM));
    } else if (templateType === 'sptve') {
      templateBuffer = sptveTemplateBuffer || (await fetchECRTemplateBuffer(TEMPLATE_SPTVE));
    } else if (templateType === 'sps') {
      templateBuffer = spsTemplateBuffer || (await fetchECRTemplateBuffer(TEMPLATE_SPS));
    } else if (templateType === 'spa') {
      templateBuffer = spaTemplateBuffer || (await fetchECRTemplateBuffer(TEMPLATE_SPA));
    } else if (templateType === 'spfl') {
      templateBuffer = spflTemplateBuffer || (await fetchECRTemplateBuffer(TEMPLATE_SPFL));
    } else if (templateType === 'spj') {
      templateBuffer = spjTemplateBuffer || (await fetchECRTemplateBuffer(TEMPLATE_SPJ));
    } else if (templateType === 'gmrc_ve') {
      templateBuffer = gmrcVeTemplateBuffer || (await fetchECRTemplateBuffer(TEMPLATE_GMRC_VE));
    } else if (templateType === 'mapeh') {
      templateBuffer = mapehTemplateBuffer || (await fetchECRTemplateBuffer(TEMPLATE_MAPEH));
    } else if (templateType === 'epp_tle_components') {
      templateBuffer = eppTleComponentsTemplateBuffer || (await fetchECRTemplateBuffer(TEMPLATE_EPP_TLE_COMPONENTS));
    } else if (templateType === 'epp_tle') {
      templateBuffer = eppTleTemplateBuffer || (await fetchECRTemplateBuffer(TEMPLATE_EPP_TLE));
    } else {
      templateBuffer = academicTemplateBuffer || (await fetchECRTemplateBuffer(TEMPLATE_ACADEMIC));
    }

    const zip = await populateECRWorkbookZip(templateBuffer, opts);
    const outBuffer = await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    const isMapeh = templateType === 'mapeh';
    const isPerComp = templateType === 'epp_tle_components';
    const cleanGrade = (opts.section.section_grade_level || 'Grade').replace(/[^a-zA-Z0-9]/g, '_');
    const cleanSection = (opts.section.section_name || 'Section').replace(/[^a-zA-Z0-9]/g, '_');
    const cleanSubject = isMapeh
      ? 'MAPEH'
      : isPerComp
      ? 'EPP_TLE_PerComponent'
      : (opts.subject.subject_name || 'Subject').replace(/[^a-zA-Z0-9]/g, '_');
    const cleanSY = (opts.schoolYear || '').replace(/[^a-zA-Z0-9-]/g, '_');

    const fileName = `ECR_${cleanGrade}_${cleanSection}_${cleanSubject}_${cleanSY}.xlsx`;
    mainZip.file(fileName, outBuffer);

    if (onProgress) {
      onProgress(Math.round(((i + 1) / total) * 90));
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  const zipContent = await mainZip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipContent);

  const a = document.createElement('a');
  a.href = url;
  a.download = zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  if (onProgress) {
    onProgress(100);
  }
}
