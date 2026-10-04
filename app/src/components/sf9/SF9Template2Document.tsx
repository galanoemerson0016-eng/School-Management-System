import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import type { SchoolProfile } from '../../types';
import { formatLearnerName } from '../../utils/student-name';
import { formatGradeForDisplay } from '../../lib/grading';
import { normalizeSubjectName } from '../../lib/subjectConfig';
import { resolveSubjectOfferedTerms } from '../../lib/curriculum';

Font.registerHyphenationCallback((word) => [word]);

const hasHttpLocation = typeof window !== 'undefined' && Boolean(window.location?.protocol?.startsWith('http'));
const isVitest = typeof process !== 'undefined' && (Boolean(process.env?.VITEST) || !hasHttpLocation);
const base = import.meta.env.BASE_URL || '/';
const fontPath = isVitest ? 'public/fonts' : `${base.endsWith('/') ? base : base + '/'}fonts`;
const assetBase = isVitest ? 'public/' : (base.endsWith('/') ? base : `${base}/`);

try {
  Font.register({ family: 'BookmanOldStyle', src: `${fontPath}/BOOKOS.TTF` });
  Font.register({ family: 'BookmanOldStyle-Bold', src: `${fontPath}/BOOKOSB.TTF` });
  Font.register({ family: 'BookmanOldStyle-Italic', src: `${fontPath}/BOOKOSI.TTF` });
  Font.register({ family: 'BookmanOldStyle-BoldItalic', src: `${fontPath}/BOOKOSBI.TTF` });
} catch {
  // Ignore font re-registration
}

import {
  type SF9Template2LearnerData,
  type SF9Template2DocumentProps,
  type SF9Template2BatchDocumentProps,
  TEMPLATE2_DESCRIPTORS,
  getTemplate2Remarks,
  createTemplate2Pairs,
} from './sf9Template2Utils';

const ATTENDANCE_MONTHS_SHORT = ['JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR'];

// =========================================================================
// 2-UP PORTRAIT STYLES
// Strictly Portrait Orientation (A4 / Letter), split in 2 vertically:
// Page 1 = 2 Front Slips side-by-side with central cut guide
// Page 2 = 2 Back Slips side-by-side with central cut guide
// =========================================================================
const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontFamily: 'BookmanOldStyle',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: '100%',
  },
  slipColumn: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 1,
  },
  cutGuide: {
    width: 6,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cutGuideLine: {
    width: 0,
    height: '100%',
    borderLeftWidth: 1,
    borderLeftColor: '#94A3B8',
    borderStyle: 'dashed',
  },
  slipContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  // Top Tag
  topLabel: {
    fontSize: 9,
    fontFamily: 'BookmanOldStyle-Bold',
    marginBottom: 1,
    textTransform: 'uppercase',
  },

  // Header Section
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  headerLogo: {
    width: 48,
    height: 48,
    objectFit: 'contain',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  headerTextTiny: {
    fontSize: 8,
    fontFamily: 'BookmanOldStyle',
    textAlign: 'center',
    lineHeight: 1.15,
    marginBottom: 4,
  },
  headerTextTinyBold: {
    fontSize: 8,
    fontFamily: 'BookmanOldStyle-Bold',
    textAlign: 'center',
    lineHeight: 1.15,
    marginBottom: 4,
  },
  headerSchoolName: {
    fontSize: 11,
    fontFamily: 'BookmanOldStyle-Bold',
    textAlign: 'center',
    marginTop: 1,
    marginBottom: 1,
    letterSpacing: 0.2,
  },
  reportTitle: {
    fontSize: 12,
    fontFamily: 'BookmanOldStyle-Bold',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 1,
    letterSpacing: 0.3,
  },
  schoolYearText: {
    fontSize: 10,
    fontFamily: 'BookmanOldStyle-Bold',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 2,
  },

  // Student Info Block
  infoContainer: {
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 9,
    fontFamily: 'BookmanOldStyle-Bold',
    marginRight: 3,
  },
  infoLine: {
    borderBottomWidth: 1,
    borderColor: '#000',
    paddingBottom: 0.5,
    justifyContent: 'flex-end',
  },
  infoValue: {
    fontSize: 8.5,
    fontFamily: 'BookmanOldStyle-Bold',
    textAlign: 'center',
  },
  infoValueLeft: {
    fontSize: 8.5,
    fontFamily: 'BookmanOldStyle-Bold',
    paddingLeft: 4,
  },

  // Dear Parents Note
  dearParentsContainer: {
    marginBottom: 2,
  },
  dearParentsTitle: {
    fontSize: 9,
    fontFamily: 'BookmanOldStyle-Bold',
    marginBottom: 6,
  },
  dearParentsBody: {
    fontSize: 8,
    fontFamily: 'BookmanOldStyle',
    lineHeight: 1.25,
    textAlign: 'justify',
  },

  // Section Heading
  tableHeading: {
    fontSize: 9.5,
    fontFamily: 'BookmanOldStyle-Bold',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 1.5,
    letterSpacing: 0.3,
  },

  // Grades Table
  gradesTable: {
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'solid',
    marginTop: 15,
    marginBottom: 2,
    backgroundColor: '#FFFFFF',
  },
  gradesHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
    height: 28,
  },
  cellSubjectHeader: {
    width: '41%',
    borderRightWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellTermsHeader: {
    width: '27%',
    boxSizing: 'border-box',
    borderRightWidth: 1,
    borderColor: '#000',
    flexDirection: 'column',
  },
  subTermHeaderTop: {
    height: 10.5,
    borderBottomWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subTermRow: {
    flexDirection: 'row',
    flex: 1,
  },
  subTermCell: {
    flex: 1,
    boxSizing: 'border-box',
    borderRightWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subTermCellLast: {
    flex: 1,
    boxSizing: 'border-box',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellFinalHeader: {
    width: '13%',
    borderRightWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellRemarksHeader: {
    width: '19%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTextBold: {
    fontSize: 8,
    fontFamily: 'BookmanOldStyle-Bold',
    textAlign: 'center',
  },
  gradesRow: {
    flexDirection: 'row',
    minHeight: 22,
    alignItems: 'stretch',
  },
  cellSubjectData: {
    width: '41%',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    paddingLeft: 3,
    paddingVertical: 1,
  },
  cellTermData: {
    width: '9%',
    boxSizing: 'border-box',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellFinalData: {
    width: '13%',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellRemarksData: {
    width: '19%',
    borderBottomWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  subjectText: {
    fontSize: 8,
    fontFamily: 'BookmanOldStyle-Bold',
  },
  componentSubjectText: {
    fontSize: 7.5,
    fontFamily: 'BookmanOldStyle',
    paddingLeft: 8,
  },
  gradeText: {
    fontSize: 8,
    fontFamily: 'BookmanOldStyle-Bold',
    textAlign: 'center',
  },
  remarksText: {
    fontSize: 7.5,
    fontFamily: 'BookmanOldStyle',
    textAlign: 'center',
  },

  // General Average Row (Merged across Cols 1 to 4)
  gradesRowLast: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
    height: 22,
    alignItems: 'stretch',
  },
  cellGenAvgMerged: {
    width: '68%',
    borderRightWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  genAvgText: {
    fontSize: 8.5,
    fontFamily: 'BookmanOldStyle-BoldItalic',
    textAlign: 'center',
  },

  // Descriptors Table
  descriptorsContainer: {
    marginTop: -18,
    paddingHorizontal: 2,
  },
  descriptorsTitle: {
    fontSize: 9,
    fontFamily: 'BookmanOldStyle-Bold',
    marginBottom: 16.5,
  },
  descriptorsHeaderRow: {
    flexDirection: 'row',
    marginBottom: 7,
  },
  descriptorsDataRow: {
    flexDirection: 'row',
    marginBottom: 6.5,
  },
  colGradingScale: {
    width: '32%',
  },
  colDescription: {
    width: '38%',
    textAlign: 'center',
  },
  colRemarks: {
    width: '30%',
    textAlign: 'right',
    paddingRight: 6,
  },
  descriptorTextBold: {
    fontSize: 8,
    fontFamily: 'BookmanOldStyle-Bold',
  },
  descriptorText: {
    fontSize: 7.5,
    fontFamily: 'BookmanOldStyle',
  },

  // PAGE 2 (BACK) - ATTENDANCE & TRANSFER
  attTable: {
    width: '96%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 3,
    backgroundColor: '#FFFFFF',
  },
  attHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
    height: 22,
    alignItems: 'center',
  },
  attRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
    height: 24,
    alignItems: 'center',
  },
  attRowLast: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#000',
    height: 24,
    alignItems: 'center',
  },
  attColMonth: {
    width: '19%',
    boxSizing: 'border-box',
    alignSelf: 'stretch',
    borderRightWidth: 1,
    borderColor: '#000',
    paddingLeft: 2,
    justifyContent: 'center',
  },
  attColDay: {
    width: '6.3%',
    boxSizing: 'border-box',
    alignSelf: 'stretch',
    borderRightWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attColTotal: {
    width: '11.7%',
    boxSizing: 'border-box',
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attTextTiny: {
    fontSize: 5.5,
    fontFamily: 'BookmanOldStyle',
    textAlign: 'center',
  },
  attTextTinyBold: {
    fontSize: 5.5,
    fontFamily: 'BookmanOldStyle-Bold',
    textAlign: 'center',
  },

  // Comments / Remarks Boxes
  commentsTitle: {
    fontSize: 9,
    fontFamily: 'BookmanOldStyle-Bold',
    textAlign: 'center',
    marginTop: 22,
    marginBottom: 1.5,
  },
  commentsBoxContainer: {
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 3,
    backgroundColor: '#FFFFFF',
  },
  commentBox: {
    borderBottomWidth: 1,
    borderColor: '#000',
    padding: 3,
    height: 110,
    flexShrink: 0,
  },
  commentBoxLast: {
    padding: 3,
    height: 110,
    flexShrink: 0,
  },
  commentTermLabel: {
    fontSize: 8,
    fontFamily: 'BookmanOldStyle-Bold',
    marginBottom: 1,
  },
  commentBody: {
    fontSize: 7.5,
    fontFamily: 'BookmanOldStyle',
    lineHeight: 1.2,
  },

  // Signatures Block
  signaturesTitle: {
    fontSize: 9,
    fontFamily: 'BookmanOldStyle-Bold',
    textDecoration: 'underline',
    marginBottom: 2,
    marginTop: 21,
    textAlign: 'center',
  },
  signatureLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  sigTermLabel: {
    fontSize: 8,
    fontFamily: 'BookmanOldStyle-Bold',
    width: 42,
  },
  sigLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
  },

  // Transfer Certificate Block
  transferTitle: {
    fontSize: 9,
    fontFamily: 'BookmanOldStyle-Bold',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 1,
  },
  transferBody: {
    fontSize: 7.5,
    fontFamily: 'BookmanOldStyle',
    textAlign: 'center',
    lineHeight: 1.2,
    marginBottom: 2,
  },
  transferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  transferLabel: {
    fontSize: 8,
    fontFamily: 'BookmanOldStyle',
    marginRight: 3,
  },
  transferUnderline: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  approvedText: {
    fontSize: 8,
    fontFamily: 'BookmanOldStyle-Bold',
    marginTop: 12,
    marginBottom: 6,
  },
  sigPairRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 4,
  },
  sigCol: {
    width: '45%',
    alignItems: 'center',
  },
  sigPersonLine: {
    width: '100%',
    height: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    marginTop: 4,
    marginBottom: 1.5,
  },
  sigRoleText: {
    fontSize: 8,
    fontFamily: 'BookmanOldStyle-Bold',
    textAlign: 'center',
  },

  // Cancellation of Eligibility to Transfer
  cancelTitle: {
    fontSize: 9,
    fontFamily: 'BookmanOldStyle-Bold',
    textAlign: 'center',
    marginTop: 22,
    marginBottom: 1.5,
  },
  cancelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 8,
  },
});



interface SubjectRowDef {
  code?: string;
  name: string;
  isComponent?: boolean;
  isHeader?: boolean;
  isReserved?: boolean;
}

const DEFAULT_SUBJECTS: SubjectRowDef[] = [
  { code: 'filipino', name: 'FILIPINO' },
  { code: 'english', name: 'ENGLISH' },
  { code: 'mathematics', name: 'MATHEMATICS' },
  { code: 'science', name: 'SCIENCE' },
  { code: 'ap', name: 'ARALING PANLIPUNAN (AP)' },
  { code: 'values_ed', name: 'VALUES EDUCATION' },
  { code: 'tle', name: 'TECHNOLOGY AND LIVELIHOOD EDUCATION (TLE)' },
  { code: 'mapeh', name: 'MAPEH' },
  { code: 'music_arts', name: 'MUSIC & ARTS', isComponent: true },
  { code: 'pe_health', name: 'PHYSICAL EDUCATION & HEALTH', isComponent: true },
];

function resolveGradesForSubject(name: string, isComponent: boolean, grades: Record<string, number[]>): number[] {
  const normTarget = normalizeSubjectName(name);

  // 1. Direct key match (exact or normalized)
  if (grades[name]) return grades[name];
  for (const [key, vals] of Object.entries(grades)) {
    if (normalizeSubjectName(key) === normTarget) {
      return vals;
    }
  }

  // 2. Keyword fallback match
  if (normTarget.includes('filipino')) return grades['Filipino'] || grades['FILIPINO'] || [0, 0, 0];
  if (normTarget.includes('english')) return grades['English'] || grades['ENGLISH'] || [0, 0, 0];
  if (normTarget.includes('generalmath') || normTarget.includes('genmath')) {
    return grades['General Mathematics'] || grades['GEN MATH'] || grades['Math'] || [0, 0, 0];
  }
  if (normTarget.includes('generalscience') || normTarget.includes('gensci')) {
    return grades['General Science'] || grades['Science'] || [0, 0, 0];
  }
  if (normTarget.includes('math')) return grades['Mathematics'] || grades['Math'] || [0, 0, 0];
  if (normTarget.includes('science')) return grades['Science'] || [0, 0, 0];
  if (normTarget.includes('araling') || normTarget === 'ap') return grades['Araling Panlipunan'] || grades['AP'] || [0, 0, 0];
  if (normTarget.includes('value') || normTarget.includes('esp') || normTarget.includes('gmrc') || normTarget.includes('edukasyon sa pagpapakatao')) {
    return grades['Values Education'] || grades['Edukasyon sa Pagpapakatao'] || grades['EsP'] || grades['GMRC'] || [0, 0, 0];
  }
  if (normTarget.includes('technology') || normTarget.includes('tle') || normTarget.includes('epp')) {
    return grades['Technology and Livelihood Education'] || grades['TLE'] || grades['EPP'] || [0, 0, 0];
  }
  if (normTarget.includes('music') && normTarget.includes('art')) {
    return grades['Music and Arts'] || grades['Music & Arts'] || grades['Music'] || [0, 0, 0];
  }
  if (normTarget.includes('physical') || normTarget.includes('pe')) {
    return grades['Physical Education and Health'] || grades['PE & Health'] || grades['PE'] || [0, 0, 0];
  }
  if (normTarget === 'mapeh' && !isComponent) {
    const ma = resolveGradesForSubject('MUSIC & ARTS', true, grades);
    const pe = resolveGradesForSubject('PHYSICAL EDUCATION & HEALTH', true, grades);
    const result: number[] = [];
    for (let t = 0; t < 3; t++) {
      const v1 = ma[t] || 0;
      const v2 = pe[t] || 0;
      if (v1 > 0 && v2 > 0) result.push(Math.round((v1 + v2) / 2));
      else if (v1 > 0) result.push(v1);
      else if (v2 > 0) result.push(v2);
      else result.push(0);
    }
    return result;
  }
  if (normTarget.includes('effectivecommunication') && normTarget.includes('mabisangkomunikasyon')) {
    const ec = resolveGradesForSubject('Effective Communication', true, grades);
    const mk = resolveGradesForSubject('Mabisang Komunikasyon', true, grades);
    const result: number[] = [];
    for (let t = 0; t < 3; t++) {
      const v1 = ec[t] || 0;
      const v2 = mk[t] || 0;
      if (v1 > 0 && v2 > 0) result.push(Math.round((v1 + v2) / 2));
      else result.push(0);
    }
    return result;
  }

  return [0, 0, 0];
}

function calculateFinalGrade(terms: number[], offeredTerms: number[]): number | null {
  const offeredGrades = offeredTerms.map((term) => terms[term - 1] || 0);
  if (offeredGrades.length === 0 || !offeredGrades.every((grade) => grade > 0)) return null;
  return Math.round(offeredGrades.reduce((a, b) => a + b, 0) / offeredGrades.length);
}

// Single Slip Front Component (fits half of portrait sheet)
export function SF9Template2SlipFront({
  learner,
  schoolProfile,
  schoolYear,
  section,
  gradeLevel,
  logoUrl,
}: {
  learner?: SF9Template2LearnerData | null;
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section: string;
  gradeLevel?: string;
  logoUrl?: string;
  isSingleUp?: boolean;
}) {
  const s = styles;

  if (!learner) {
    return <View style={s.slipContainer} />;
  }

  const { student, grades = {} } = learner;
  const fullName = formatLearnerName(student).toUpperCase();
  const effectiveGrade = (student.grade_level || gradeLevel || '').replace(/grade\s*/i, '').trim();
  const divisionText = schoolProfile.division
    ? (schoolProfile.division.toUpperCase().startsWith('SCHOOLS')
      ? schoolProfile.division.toUpperCase()
      : `SCHOOLS DIVISION OFFICE OF ${schoolProfile.division.toUpperCase()}`)
    : 'SCHOOLS DIVISION OFFICE OF DAVAO DEL NORTE';
  const divisionFontSize = Math.max(5, Math.min(8, 230 / divisionText.length));

  // Determine list of subjects:
  // If learner.subjects is provided and non-empty, use it.
  // Otherwise fall back to DEFAULT_SUBJECTS for backward compatibility with tests/fallback.
  const rawSubjects = (learner.subjects && learner.subjects.length > 0)
    ? learner.subjects
        .map((subItem) => {
          const s = subItem as unknown as Record<string, unknown>;
          return {
            name: (String(s.subject_name || s.name || '')).trim(),
            isComponent: Boolean(s.isComponent),
            isHeader: Boolean(s.isHeader),
            isReserved: Boolean(s.isReserved),
            term: s.term as string | number | undefined,
            offered_terms: s.offered_terms as (1 | 2 | 3)[] | undefined,
          };
        })
        .filter((subItem) => !subItem.isReserved && subItem.name)
    : DEFAULT_SUBJECTS;

  // Compute final grades and general average
  const subjectRowsWithGrades = rawSubjects.map((sub) => {
    if (sub.isHeader) {
      return {
        ...sub,
        row: [0, 0, 0],
        finalGrade: null,
        remarks: '',
      };
    }
    const row = resolveGradesForSubject(sub.name, sub.isComponent || false, grades);
    const isCommunicationComposite = normalizeSubjectName(sub.name) === 'effectivecommunicationmabisangkomunikasyon';
    const subjectOffering = sub as typeof sub & {
      term?: string | number;
      offered_terms?: (1 | 2 | 3)[];
    };
    const offeredTerms = isCommunicationComposite
      ? [1, 2, 3]
      : resolveSubjectOfferedTerms(
        { subject_name: sub.name, term: subjectOffering.term, offered_terms: subjectOffering.offered_terms },
        { section_grade_level: gradeLevel }
      );
    const finalGrade = calculateFinalGrade(row, offeredTerms);
    const remarks = finalGrade ? getTemplate2Remarks(finalGrade) : '';
    return { ...sub, row, finalGrade, remarks };
  });

  const learningAreas = subjectRowsWithGrades.filter((sub) => !sub.isComponent && !sub.isHeader);
  // The report card must not publish a yearly General Average from only the
  // completed electives while other required offerings are still in progress.
  const areAllOfferingsComplete = learningAreas.length > 0 && learningAreas.every((sub) => sub.finalGrade !== null);
  const mainAreas = learningAreas.filter((sub) => sub.finalGrade !== null);
  const genAvg = areAllOfferingsComplete && mainAreas.length > 0
    ? Math.round(mainAreas.reduce((sum, item) => sum + (item.finalGrade || 0), 0) / mainAreas.length)
    : null;
  const genAvgRemarks = genAvg ? getTemplate2Remarks(genAvg) : '';

  // Blank rows to ensure consistent table height matching official template (minimum 12 rows)
  const minTableRows = 12;
  const blankRowsCount = Math.max(0, minTableRows - subjectRowsWithGrades.length);
  const blankRows = Array.from({ length: blankRowsCount });

  // Dynamic row height so larger subject lists fit on a single portrait page without spilling over
  const rowMinHeight = subjectRowsWithGrades.length > 11 ? 18 : 22;
  const subjectFontSize = subjectRowsWithGrades.length > 11 ? 7.2 : 8;

  return (
    <View style={s.slipContainer}>
      {/* Main Content Group (Header + Info + Grades) */}
      <View>
        {/* 1. Header Section */}
        <View>
          <Text style={s.topLabel}>SCHOOL FORM 9</Text>

          <View style={s.headerRow}>
            <Image src={`${assetBase}deped_logo_left.png`} style={s.headerLogo} />
            <View style={s.headerCenter}>
              <Text style={s.headerTextTiny}>Republic of the Philippines</Text>
              <Text style={s.headerTextTinyBold}>Department of Education</Text>
              <Text style={s.headerTextTiny}>{schoolProfile.region || 'Region XI'}</Text>
              <Text
                style={[s.headerTextTinyBold, { fontSize: divisionFontSize }]}
                wrap={false}
              >
                {divisionText}
              </Text>
              <Text style={s.headerTextTinyBold}>{schoolProfile.district ? `${schoolProfile.district.toUpperCase()} DISTRICT` : 'NEW CORELLA DISTRICT'}</Text>
              <Text style={s.headerTextTiny}>{schoolProfile.province ? schoolProfile.province.toUpperCase() : 'DAVAO DEL NORTE'}</Text>
            </View>
            <Image src={logoUrl || `${assetBase}school-logo.png`} style={s.headerLogo} />
          </View>

          <Text style={s.headerSchoolName}>
            {schoolProfile.name ? schoolProfile.name.toUpperCase() : 'NEW CORELLA NATIONAL HIGH SCHOOL'}
          </Text>
          <Text style={s.reportTitle}>LEARNER'S PERFORMANCE REPORT</Text>
          <Text style={s.schoolYearText}>{`School Year ${schoolYear}`}</Text>
        </View>

        {/* 2. Learner Info & Dear Parents Letter Block */}
        <View style={{ marginTop: 10 }}>
          <View style={s.infoContainer}>
            {/* Name Row */}
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Name:</Text>
              <View style={[s.infoLine, { flex: 1 }]}>
                <Text style={s.infoValueLeft}>{fullName}</Text>
              </View>
            </View>

            {/* LRN, Age, Sex Row */}
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>LRN:</Text>
              <View style={[s.infoLine, { flex: 1 }]}>
                <Text style={s.infoValue}>{student.lrn}</Text>
              </View>
              <Text style={[s.infoLabel, { marginLeft: 6 }]}>Age:</Text>
              <View style={[s.infoLine, { width: 34 }]}>
                <Text style={s.infoValue}>{student.age || ' '}</Text>
              </View>
              <Text style={[s.infoLabel, { marginLeft: 6 }]}>Sex:</Text>
              <View style={[s.infoLine, { width: 48 }]}>
                <Text style={s.infoValue}>{(student.gender || ' ').toUpperCase()}</Text>
              </View>
            </View>

            {/* Grade and Section Row */}
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Grade:</Text>
              <View style={[s.infoLine, { width: 45 }]}>
                <Text style={s.infoValue}>{effectiveGrade || ' '}</Text>
              </View>
              <Text style={[s.infoLabel, { marginLeft: 6 }]}>Section:</Text>
              <View style={[s.infoLine, { flex: 1 }]}>
                <Text style={s.infoValueLeft}>{section.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          <View style={s.dearParentsContainer}>
            <Text style={s.dearParentsTitle}>Dear Parents,</Text>
            <Text style={s.dearParentsBody}>
              {"        The Performance Report shows the ability and progress your child has made in the different learning areas as well as his/her core values."}
            </Text>
            <Text style={[s.dearParentsBody, { marginTop: 17 }]}> 
              {"        The school welcomes you should you desire to know more about your child's progress."}
            </Text>
          </View>
        </View>

        {/* 3. Grades & General Average Block */}
        <View style={{ marginTop: 20 }}>
          <Text style={s.tableHeading}>LEARNING PROGRESS AND ACHIEVEMENT</Text>

          <View style={s.gradesTable}>
            {/* Table Header */}
            <View style={s.gradesHeaderRow}>
              <View style={s.cellSubjectHeader}>
                <Text style={s.headerTextBold}>LEARNING AREAS</Text>
              </View>
              <View style={s.cellTermsHeader}>
                <View style={s.subTermHeaderTop}>
                  <Text style={s.headerTextBold}>TERM</Text>
                </View>
                <View style={s.subTermRow}>
                  <View style={s.subTermCell}><Text style={s.headerTextBold}>1</Text></View>
                  <View style={s.subTermCell}><Text style={s.headerTextBold}>2</Text></View>
                  <View style={s.subTermCellLast}><Text style={s.headerTextBold}>3</Text></View>
                </View>
              </View>
              <View style={s.cellFinalHeader}>
                <Text style={s.headerTextBold}>{"FINAL\nGRADE"}</Text>
              </View>
              <View style={s.cellRemarksHeader}>
                <Text style={s.headerTextBold}>REMARKS</Text>
              </View>
            </View>

            {/* Subject Data Rows */}
            {subjectRowsWithGrades.map((sub, idx) => {
              if (sub.isHeader) {
                return (
                  <View key={idx} style={[s.gradesRow, { minHeight: rowMinHeight, backgroundColor: '#F8FAFC' }]}>
                    <View style={[s.cellSubjectData, { width: '100%', borderRightWidth: 0 }]}>
                      <Text style={[s.subjectText, { fontFamily: 'BookmanOldStyle-Bold', fontSize: subjectFontSize }]}>
                        {sub.name}
                      </Text>
                    </View>
                  </View>
                );
              }
              return (
                <View key={idx} style={[s.gradesRow, { minHeight: rowMinHeight }]}>
                  <View style={s.cellSubjectData}>
                    <Text style={[sub.isComponent ? s.componentSubjectText : s.subjectText, { fontSize: sub.isComponent ? subjectFontSize - 0.5 : subjectFontSize }]}>
                      {sub.name}
                    </Text>
                  </View>
                  <View style={s.cellTermData}>
                    <Text style={[s.gradeText, { fontSize: subjectFontSize }]}>{sub.row[0] ? formatGradeForDisplay(sub.row[0], student.grade_level) : ''}</Text>
                  </View>
                  <View style={s.cellTermData}>
                    <Text style={[s.gradeText, { fontSize: subjectFontSize }]}>{sub.row[1] ? formatGradeForDisplay(sub.row[1], student.grade_level) : ''}</Text>
                  </View>
                  <View style={s.cellTermData}>
                    <Text style={[s.gradeText, { fontSize: subjectFontSize }]}>{sub.row[2] ? formatGradeForDisplay(sub.row[2], student.grade_level) : ''}</Text>
                  </View>
                  <View style={s.cellFinalData}>
                    <Text style={[s.gradeText, { fontSize: subjectFontSize }]}>{sub.finalGrade ? formatGradeForDisplay(sub.finalGrade, student.grade_level) : ''}</Text>
                  </View>
                  <View style={s.cellRemarksData}>
                    <Text style={[s.remarksText, { fontSize: subjectFontSize - 0.5 }]}>{sub.remarks}</Text>
                  </View>
                </View>
              );
            })}

            {/* Blank Rows Matching Official Template */}
            {blankRows.map((_, bIdx) => (
              <View key={`blank-${bIdx}`} style={[s.gradesRow, { minHeight: rowMinHeight }]}>
                <View style={s.cellSubjectData}><Text style={s.subjectText}> </Text></View>
                <View style={s.cellTermData}><Text style={s.gradeText}> </Text></View>
                <View style={s.cellTermData}><Text style={s.gradeText}> </Text></View>
                <View style={s.cellTermData}><Text style={s.gradeText}> </Text></View>
                <View style={s.cellFinalData}><Text style={s.gradeText}> </Text></View>
                <View style={s.cellRemarksData}><Text style={s.remarksText}> </Text></View>
              </View>
            ))}

            {/* General Average Row (Merged across Cols 1 to 4) */}
            <View style={s.gradesRowLast}>
              <View style={s.cellGenAvgMerged}>
                <Text style={s.genAvgText}>GENERAL AVERAGE</Text>
              </View>
              <View style={s.cellFinalData}>
                <Text style={s.gradeText}>{genAvg ? formatGradeForDisplay(genAvg, student.grade_level) : ''}</Text>
              </View>
              <View style={s.cellRemarksData}>
                <Text style={[s.remarksText, { fontFamily: 'BookmanOldStyle-Bold' }]}>{genAvgRemarks}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 4. PERFORMANCE DESCRIPTORS (pushed to bottom by space-between) */}
      <View style={s.descriptorsContainer}>
        <Text style={s.descriptorsTitle}>PERFORMANCE DESCRIPTORS</Text>
        <View style={s.descriptorsHeaderRow}>
          <Text style={[s.descriptorTextBold, s.colGradingScale]}>Grading Scale</Text>
          <Text style={[s.descriptorTextBold, s.colDescription]}>Description</Text>
          <Text style={[s.descriptorTextBold, s.colRemarks]}>Remarks</Text>
        </View>
        {TEMPLATE2_DESCRIPTORS.map((d, i) => (
          <View key={i} style={s.descriptorsDataRow}>
            <Text style={[s.descriptorText, s.colGradingScale]}>{d.scale}</Text>
            <Text style={[s.descriptorText, s.colDescription]}>{d.desc}</Text>
            <Text style={[s.descriptorText, s.colRemarks]}>{d.remark}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// Single Slip Back Component (fits half of portrait sheet)
export function SF9Template2SlipBack({
  learner,
  adviser,
  principal,
  principalTitle,
}: {
  learner?: SF9Template2LearnerData | null;
  adviser: string;
  principal?: string;
  principalTitle?: string;
  isSingleUp?: boolean;
}) {
  const s = styles;

  if (!learner) {
    return <View style={s.slipContainer} />;
  }

  const { attendance, comments = ['', '', ''] } = learner;

  const calculateTotal = (dataArr?: number[]) => {
    if (!dataArr) return '';
    const valid = dataArr.slice(0, 11).filter((v) => v >= 0);
    return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) : '';
  };

  return (
    <View style={s.slipContainer}>
      {/* Main Content Group (Attendance + Comments + Signatures) */}
      <View>
        {/* 1. Attendance Record Table */}
        <View>
          <Text style={[s.tableHeading, { marginTop: 8 }]}>ATTENDANCE RECORD</Text>
          <View style={s.attTable}>
            {/* Header */}
            <View style={s.attHeaderRow}>
              <View style={s.attColMonth}>
                <Text style={s.attTextTinyBold}>MONTH</Text>
              </View>
              {ATTENDANCE_MONTHS_SHORT.map((m, i) => (
                <View key={i} style={s.attColDay}>
                  <Text style={s.attTextTinyBold}>{m}</Text>
                </View>
              ))}
              <View style={s.attColTotal}>
                <Text style={s.attTextTinyBold}>TOTAL</Text>
              </View>
            </View>

            {/* School Days */}
            <View style={s.attRow}>
              <View style={s.attColMonth}>
                <Text style={s.attTextTiny}>{'NO. OF\nCLASS\nDAYS'}</Text>
              </View>
              {ATTENDANCE_MONTHS_SHORT.map((_, i) => {
                const val = attendance?.schoolDays?.[i];
                return (
                  <View key={i} style={s.attColDay}>
                    <Text style={s.attTextTiny}>{val !== undefined && val >= 0 ? val : ''}</Text>
                  </View>
                );
              })}
              <View style={s.attColTotal}>
                <Text style={s.attTextTinyBold}>{calculateTotal(attendance?.schoolDays)}</Text>
              </View>
            </View>

            {/* Days Present */}
            <View style={s.attRow}>
              <View style={s.attColMonth}>
                <Text style={s.attTextTiny}>{'NO. OF\nDAYS\nPRESENT'}</Text>
              </View>
              {ATTENDANCE_MONTHS_SHORT.map((_, i) => {
                const val = attendance?.daysPresent?.[i];
                return (
                  <View key={i} style={s.attColDay}>
                    <Text style={s.attTextTiny}>{val !== undefined && val >= 0 ? val : ''}</Text>
                  </View>
                );
              })}
              <View style={s.attColTotal}>
                <Text style={s.attTextTinyBold}>{calculateTotal(attendance?.daysPresent)}</Text>
              </View>
            </View>

            {/* Days Absent */}
            <View style={s.attRowLast}>
              <View style={s.attColMonth}>
                <Text style={s.attTextTiny}>{'NO. OF\nDAYS\nABSENT'}</Text>
              </View>
              {ATTENDANCE_MONTHS_SHORT.map((_, i) => {
                const val = attendance?.daysAbsent?.[i];
                return (
                  <View key={i} style={s.attColDay}>
                    <Text style={s.attTextTiny}>{val !== undefined && val >= 0 ? val : ''}</Text>
                  </View>
                );
              })}
              <View style={s.attColTotal}>
                <Text style={s.attTextTinyBold}>{calculateTotal(attendance?.daysAbsent)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 2. Teacher's Comments / Remarks */}
        <View>
          <Text style={s.commentsTitle}>TEACHER'S COMMENTS / REMARKS</Text>
          <View style={s.commentsBoxContainer}>
            <View style={s.commentBox}>
              <Text style={s.commentTermLabel}>Term 1</Text>
              <Text style={s.commentBody}>{comments[0] || ''}</Text>
            </View>
            <View style={s.commentBox}>
              <Text style={s.commentTermLabel}>Term 2</Text>
              <Text style={s.commentBody}>{comments[1] || ''}</Text>
            </View>
            <View style={s.commentBoxLast}>
              <Text style={s.commentTermLabel}>Term 3</Text>
              <Text style={s.commentBody}>{comments[2] || ''}</Text>
            </View>
          </View>
        </View>

        {/* 3. Parent / Guardian's Signature */}
        <View>
          <Text style={s.signaturesTitle}>PARENT / GUARDIAN'S SIGNATURE</Text>
          <View style={{ marginTop: 30 }}>
            <View style={s.signatureLineRow}>
              <Text style={s.sigTermLabel}>Term 1</Text>
              <View style={s.sigLine} />
            </View>
            <View style={s.signatureLineRow}>
              <Text style={s.sigTermLabel}>Term 2</Text>
              <View style={s.sigLine} />
            </View>
            <View style={s.signatureLineRow}>
              <Text style={s.sigTermLabel}>Term 3</Text>
              <View style={s.sigLine} />
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Section (Certificate of Transfer + Cancellation - pushed to bottom) */}
      <View style={{ marginBottom: 75 }}>
        {/* 4. Certificate of Transfer */}
        <View>
          <Text style={s.transferTitle}>CERTIFICATE OF TRANSFER</Text>
          <Text style={[s.transferBody, { marginTop: 10 }]}>
            This is to certify that the above-named learner has satisfactorily completed the requirements for the grade level indicated.
          </Text>
          <View style={[s.transferRow, { marginTop: 20 }]}>
            <Text style={s.transferLabel}>Admitted to Grade:</Text>
            <View style={s.transferUnderline} />
          </View>
          <View style={[s.transferRow, { marginTop: 10 }]}>
            <Text style={s.transferLabel}>Eligible for Admission to Grade :</Text>
            <View style={s.transferUnderline} />
          </View>
          <Text style={s.approvedText}>Approved:</Text>

          <View style={s.sigPairRow}>
            <View style={s.sigCol}>
              <Text style={[s.sigRoleText, { fontSize: 7.5 }]} wrap={false}>{principal ? principal : ' '}</Text>
              <View style={s.sigPersonLine}>
              </View>
              <Text style={s.sigRoleText}>{principalTitle || 'School Head'}</Text>
            </View>
            <View style={s.sigCol}>
              <Text style={[s.sigRoleText, { fontSize: 7.5 }]} wrap={false}>{adviser ? adviser.toUpperCase() : ' '}</Text>
              <View style={s.sigPersonLine}>
              </View>
              <Text style={s.sigRoleText}>Adviser</Text>
            </View>
          </View>
        </View>

        {/* 5. Cancellation of Eligibility to Transfer */}
        <View>
          <Text style={s.cancelTitle}>CANCELLATION OF ELIGIBILITY TO TRANSFER</Text>
          <View style={s.cancelRow}>
            <View style={{ flexDirection: 'row', width: '60%', alignItems: 'center' }}>
              <Text style={s.transferLabel}>Admitted in :</Text>
              <View style={s.transferUnderline} />
            </View>
            <View style={{ flexDirection: 'row', width: '35%', alignItems: 'center' }}>
              <Text style={s.transferLabel}>Date:</Text>
              <View style={s.transferUnderline} />
            </View>
          </View>

          <View style={{ alignItems: 'center', width: '45%', alignSelf: 'center', marginTop: 10, marginBottom: 2 }}>
            <Text style={[s.sigRoleText, { fontSize: 7.5 }]} wrap={false}>{principal ? principal : ' '}</Text>
            <View style={s.sigPersonLine}>
            </View>
            <Text style={s.sigRoleText}>{principalTitle || 'School Head'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// Full Document: 2-Page Portrait Print
// Split vertically into 2:
// Page 1 = 2 Fronts side-by-side with center cut guide
// Page 2 = 2 Backs side-by-side with center cut guide (duplex-aligned)
export function SF9Template2Document({
  learnerA,
  learnerB,
  schoolProfile,
  schoolYear,
  section,
  gradeLevel,
  adviser,
  principal,
  principalTitle,
  pageSize = 'A4',
  logoUrl,
  duplexMode = 'long-edge',
}: SF9Template2DocumentProps) {
  const frontLeft = learnerA;
  const frontRight = learnerB || learnerA;

  // On portrait duplex printing (flip on long edge):
  // Left of front backs onto Right of back, and Right of front backs onto Left of back.
  const backLeft = duplexMode === 'short-edge' ? frontLeft : frontRight;
  const backRight = duplexMode === 'short-edge' ? frontRight : frontLeft;

  return (
    <Document title={`SF9_${section}_${learnerA.student.last_name}_${schoolYear}`}>
      {/* Page 1 (Front Side - 2 Fronts side-by-side) */}
      <Page size={pageSize} orientation="portrait" style={styles.page}>
        <View style={styles.slipColumn}>
          <SF9Template2SlipFront
            learner={frontLeft}
            schoolProfile={schoolProfile}
            schoolYear={schoolYear}
            section={section}
            gradeLevel={gradeLevel}
            logoUrl={logoUrl}
          />
        </View>
        <View style={styles.cutGuide}>
          <View style={styles.cutGuideLine} />
        </View>
        <View style={styles.slipColumn}>
          <SF9Template2SlipFront
            learner={frontRight}
            schoolProfile={schoolProfile}
            schoolYear={schoolYear}
            section={section}
            gradeLevel={gradeLevel}
            logoUrl={logoUrl}
          />
        </View>
      </Page>

      {/* Page 2 (Back Side - 2 Backs side-by-side) */}
      <Page size={pageSize} orientation="portrait" style={styles.page}>
        <View style={styles.slipColumn}>
          <SF9Template2SlipBack
            learner={backLeft}
            adviser={adviser}
            principal={principal}
            principalTitle={principalTitle}
          />
        </View>
        <View style={styles.cutGuide}>
          <View style={styles.cutGuideLine} />
        </View>
        <View style={styles.slipColumn}>
          <SF9Template2SlipBack
            learner={backRight}
            adviser={adviser}
            principal={principal}
            principalTitle={principalTitle}
          />
        </View>
      </Page>
    </Document>
  );
}

// Batch Document: Guaranteed strictly A4/Letter Portrait format
// Pairs learners into 2-up portrait sheets (Page 1 = 2 Fronts, Page 2 = 2 Backs)
export function SF9Template2BatchDocument({
  learners,
  schoolProfile,
  schoolYear,
  section,
  gradeLevel,
  adviser,
  principal,
  principalTitle,
  pageSize = 'A4',
  logoUrl,
  duplexMode = 'long-edge',
}: SF9Template2BatchDocumentProps) {
  const pairs = createTemplate2Pairs(learners, true);

  return (
    <Document title={`SF9_BATCH_${section}_${schoolYear}`}>
      {pairs.map(([l1, l2], pairIdx) => {
        const frontLeft = l1;
        const frontRight = l2 || l1;

        const backLeft = duplexMode === 'short-edge' ? frontLeft : frontRight;
        const backRight = duplexMode === 'short-edge' ? frontRight : frontLeft;

        return (
          <React.Fragment key={`pair-${l1.student.lrn}-${pairIdx}`}>
            {/* Sheet Page 1: 2 Fronts side-by-side in Portrait */}
            <Page size={pageSize} orientation="portrait" style={styles.page}>
              <View style={styles.slipColumn}>
                <SF9Template2SlipFront
                  learner={frontLeft}
                  schoolProfile={schoolProfile}
                  schoolYear={schoolYear}
                  section={section}
                  gradeLevel={gradeLevel}
                  logoUrl={logoUrl}
                />
              </View>
              <View style={styles.cutGuide}>
                <View style={styles.cutGuideLine} />
              </View>
              <View style={styles.slipColumn}>
                <SF9Template2SlipFront
                  learner={frontRight}
                  schoolProfile={schoolProfile}
                  schoolYear={schoolYear}
                  section={section}
                  gradeLevel={gradeLevel}
                  logoUrl={logoUrl}
                />
              </View>
            </Page>

            {/* Sheet Page 2: 2 Backs side-by-side in Portrait */}
            <Page size={pageSize} orientation="portrait" style={styles.page}>
              <View style={styles.slipColumn}>
                <SF9Template2SlipBack
                  learner={backLeft}
                  adviser={adviser}
                  principal={principal}
                  principalTitle={principalTitle}
                />
              </View>
              <View style={styles.cutGuide}>
                <View style={styles.cutGuideLine} />
              </View>
              <View style={styles.slipColumn}>
                <SF9Template2SlipBack
                  learner={backRight}
                  adviser={adviser}
                  principal={principal}
                  principalTitle={principalTitle}
                />
              </View>
            </Page>
          </React.Fragment>
        );
      })}
    </Document>
  );
}
