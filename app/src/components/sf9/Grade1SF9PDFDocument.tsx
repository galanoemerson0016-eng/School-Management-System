import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import type { Student, SchoolProfile } from '../../types';
import { formatLearnerName } from '../../utils/student-name';
import { getStudentBoSyEoSyAge, formatDateToMMDDYYYY } from '../../services/sf9-g1-excel-export';

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
  // Ignore re-registration
}

export interface Grade1SF9Remarks {
  term1CanDo?: string;
  term1ToImprove?: string;
  term2CanDo?: string;
  term2ToImprove?: string;
  term3CanDo?: string;
  term3ToImprove?: string;
}

export interface Grade1SF9Attendance {
  months: string[];
  schoolDays: number[];
  daysPresent: number[];
  daysAbsent: number[];
}

export interface Grade1SF9PDFDocumentProps {
  student: Student;
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section: string;
  adviser: string;
  principal?: string;
  principalTitle?: string;
  g1Remarks?: Grade1SF9Remarks;
  attendance?: Grade1SF9Attendance;
  pageSize?: 'A4' | 'LETTER';
}

const styles = StyleSheet.create({
  singleBorderWrapper: { 
    borderWidth: 1, 
    borderColor: '#000', 
    paddingTop: 6, 
    paddingBottom: 6, 
    paddingHorizontal: 10, 
    flex: 1, 
    flexDirection: 'column' 
  },
  singleHeaderContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 3 
  },
  singleLogo: { 
    width: 46, 
    height: 46 
  },
  singleHeaderCenter: { 
    flex: 1, 
    alignItems: 'center', 
    paddingHorizontal: 6 
  },
  singleHeaderText: { 
    fontSize: 7.5, 
    textAlign: 'center', 
    marginBottom: 1,
    fontFamily: 'BookmanOldStyle'
  },
  singleReportTitle: { 
    fontFamily: 'BookmanOldStyle-Bold', 
    fontSize: 11, 
    textAlign: 'center' 
  },
  singleSchoolYear: { 
    fontFamily: 'BookmanOldStyle', 
    fontSize: 7.5, 
    textAlign: 'center' 
  },
  singleInfoValue: { 
    borderBottomWidth: 1, 
    borderBottomColor: '#000', 
    paddingBottom: 1 
  },
});

export const Grade1SF9PDFDocument: React.FC<Grade1SF9PDFDocumentProps> = ({
  student,
  schoolProfile,
  schoolYear,
  section,
  adviser,
  principal,
  g1Remarks = {},
  attendance,
  pageSize = 'A4'
}) => {
  const cleanDivision = (schoolProfile.division || '')
    .replace(/schools division office of/i, '')
    .replace(/schools division of/i, '')
    .trim()
    .toUpperCase();

  const muniCity = schoolProfile?.municipality || schoolProfile?.city || '';
  const prov = schoolProfile?.province || '';
  const muniCityProvince = (muniCity && prov) ? `${muniCity}, ${prov}` : (muniCity || prov || 'Municipality/City, Province');

  const childAge = getStudentBoSyEoSyAge(student.birthday, schoolYear, student.age);
  const formattedBirthday = student.birthday ? formatDateToMMDDYYYY(student.birthday) : '';

  const termConfig = [
    { title: 'TERM 1 (UNANG TERMINO)', canDo: g1Remarks.term1CanDo || '', toImprove: g1Remarks.term1ToImprove || '' },
    { title: 'TERM 2 (IKALAWANG TERMINO)', canDo: g1Remarks.term2CanDo || '', toImprove: g1Remarks.term2ToImprove || '' },
    { title: 'TERM 3 (IKATLONG TERMINO)', canDo: g1Remarks.term3CanDo || '', toImprove: g1Remarks.term3ToImprove || '' },
  ];

  const attDays = attendance?.schoolDays || [];
  const attPres = attendance?.daysPresent || [];
  const attAbs = attendance?.daysAbsent || [];

  const calcTotal = (arr: number[]) => {
    const valid = arr.slice(0, 11).filter(v => v >= 0);
    return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) : '';
  };

  const getAttVal = (arr: number[], idx: number) => {
    return arr[idx] !== undefined && arr[idx] >= 0 ? arr[idx] : '';
  };

  return (
    <Document>
      <Page size={pageSize} orientation="portrait" style={{ padding: 10, fontFamily: 'BookmanOldStyle' }}>
        <View style={styles.singleBorderWrapper}>
          <View style={{ flex: 1, padding: 8 }}>
            
            {/* Header */}
            <View style={styles.singleHeaderContainer}>
              <Image 
                src={`${assetBase}deped_logo_left.png`} 
                style={styles.singleLogo} 
              />
              <View style={styles.singleHeaderCenter}>
                <Text style={styles.singleHeaderText}>Republic of the Philippines</Text>
                <Text style={styles.singleHeaderText}>Department of Education</Text>
                <Text style={styles.singleHeaderText}>{schoolProfile.region || 'Region VIII'}</Text>
                <Text style={[styles.singleHeaderText, { fontFamily: 'BookmanOldStyle-Bold', fontSize: 7.5 }]}>
                  {(() => {
                    const raw = (cleanDivision || 'LEYTE').trim().toUpperCase();
                    if (raw.startsWith('SCHOOLS DIVISION OFFICE OF')) return raw;
                    if (raw.startsWith('DIVISION OF')) return `SCHOOLS DIVISION OFFICE OF ${raw.slice(11).trim()}`;
                    return `SCHOOLS DIVISION OFFICE OF ${raw}`;
                  })()}
                </Text>
                <Text style={styles.singleHeaderText}>
                  {(() => {
                    const raw = (schoolProfile.district || '').trim();
                    if (!raw) return 'District';
                    return raw.toLowerCase().includes('district') ? raw : `${raw} District`;
                  })()}
                </Text>
                <Text style={styles.singleHeaderText}>{muniCityProvince}</Text>
                <Text style={[styles.singleHeaderText, { marginTop: 2, fontFamily: 'BookmanOldStyle-Bold', fontSize: 9 }]}>
                  {schoolProfile.name || 'ELEMENTARY SCHOOL'}
                </Text>
              </View>
              <Image 
                src={schoolProfile.logo_url || `${assetBase}school-logo.png`} 
                style={styles.singleLogo} 
              />
            </View>

            {/* Title */}
            <Text style={{ textAlign: 'center', marginBottom: 3, marginTop: 1 }}>
              <Text style={styles.singleReportTitle}>{"LEARNER'S PROGRESS REPORT CARD\n"}</Text>
              <Text style={styles.singleSchoolYear}>{"School Year: " + schoolYear}</Text>
            </Text>

            {/* Learner Info Bar (Full width, 3-Row Official DepEd MATATAG Format) */}
            <View style={{ marginBottom: 5 }}>
              {/* Row 1: Name, LRN */}
              <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                <View style={{ width: '74%', flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6.8, width: 30 }}>Name:</Text>
                  <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'left', paddingLeft: 6, fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.8 }]}>
                    {formatLearnerName(student).toUpperCase()}
                  </Text>
                </View>
                <View style={{ width: '26%', flexDirection: 'row', alignItems: 'center', paddingLeft: 8 }}>
                  <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6.8, width: 26 }}>LRN:</Text>
                  <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.8 }]}>
                    {student.lrn || ' '}
                  </Text>
                </View>
              </View>

              {/* Row 2: Section, Teacher, Birthdate */}
              <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                <View style={{ width: '32%', flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6.8, width: 34 }}>Section:</Text>
                  <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.8 }]}>
                    {section || ' '}
                  </Text>
                </View>
                <View style={{ width: '38%', flexDirection: 'row', alignItems: 'center', paddingLeft: 6 }}>
                  <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6.8, width: 36 }}>Teacher:</Text>
                  <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.8 }]}>
                    {adviser ? adviser.toUpperCase() : ' '}
                  </Text>
                </View>
                <View style={{ width: '30%', flexDirection: 'row', alignItems: 'center', paddingLeft: 6 }}>
                  <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6.8, width: 44 }}>Birthdate:</Text>
                  <Text style={[styles.singleInfoValue, { flex: 1, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.8 }]}>
                    {formattedBirthday || ' '}
                  </Text>
                </View>
              </View>

              {/* Row 3: Age of the Child (Beginning of SY): Years: [ ] Months: [ ] & Age of the Child (End of SY): Years: [ ] Months: [ ] */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: '51%', flexDirection: 'row', alignItems: 'center', paddingRight: 4 }}>
                  <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6.2 }}>Age of the Child (Beginning of SY): Years:</Text>
                  <Text style={[styles.singleInfoValue, { width: 22, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.2, marginLeft: 2 }]}>
                    {childAge.boSy.years !== '' ? String(childAge.boSy.years) : ' '}
                  </Text>
                  <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6.2, marginLeft: 4 }}>Months:</Text>
                  <Text style={[styles.singleInfoValue, { width: 22, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.2, marginLeft: 2 }]}>
                    {childAge.boSy.months !== '' ? String(childAge.boSy.months) : ' '}
                  </Text>
                </View>
                <View style={{ width: '49%', flexDirection: 'row', alignItems: 'center', paddingLeft: 4 }}>
                  <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6.2 }}>Age of the Child (End of SY): Years:</Text>
                  <Text style={[styles.singleInfoValue, { width: 22, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.2, marginLeft: 2 }]}>
                    {childAge.eoSy.years !== '' ? String(childAge.eoSy.years) : ' '}
                  </Text>
                  <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6.2, marginLeft: 4 }}>Months:</Text>
                  <Text style={[styles.singleInfoValue, { width: 22, textAlign: 'center', fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.2, marginLeft: 2 }]}>
                    {childAge.eoSy.months !== '' ? String(childAge.eoSy.months) : ' '}
                  </Text>
                </View>
              </View>
            </View>

            {/* Descriptive Note Spanning Full Width (Rows 19-20 of Official DepEd Template) */}
            <View style={{ marginBottom: 4 }}>
              <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 5.8, lineHeight: 1.25, textAlign: 'justify', marginBottom: 2 }}>
                This report provides a descriptive account of your child’s learning progress for each term. It highlights what your child can already do, what they are currently developing, and how they can be further supported.
              </Text>
              <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 5.8, lineHeight: 1.25, textAlign: 'justify' }}>
                This report is based on varied evidence of learning, including classroom activities, observations, learner outputs, and assessments. It is designed to give a clearer and more meaningful understanding of your child’s development rather than relying on numerical or letter grades.
              </Text>
            </View>

            {/* Main 2-Column Content */}
            <View style={{ flexDirection: 'row', flex: 1 }}>
              {/* Left Column: Progress Notes */}
              <View style={{ width: '49%', paddingRight: 8, justifyContent: 'space-between' }}>
                {termConfig.map((tItem, tIdx) => (
                  <View key={tIdx} style={{ flex: 1, marginBottom: tIdx === 2 ? 0 : 6, justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 7.2, textAlign: 'center', marginBottom: 2 }}>
                      {tItem.title}
                    </Text>
                    <View style={{ borderWidth: 1, borderColor: '#000', flex: 1, minHeight: 46, flexDirection: 'row', marginBottom: 2 }}>
                      <View style={{ width: '38%', borderRightWidth: 1, borderColor: '#000', padding: 2, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 5.5, textAlign: 'center' }}>
                          {"What Your Child\nCan Do\n(Mga Nagagawa)"}
                        </Text>
                      </View>
                      <View style={{ width: '62%', padding: 3, justifyContent: 'center' }}>
                        <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 5.4, lineHeight: 1.25 }}>
                          {tItem.canDo}
                        </Text>
                      </View>
                    </View>
                    <View style={{ borderWidth: 1, borderColor: '#000', flex: 1, minHeight: 46, flexDirection: 'row', marginBottom: 2 }}>
                      <View style={{ width: '38%', borderRightWidth: 1, borderColor: '#000', padding: 2, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 5.5, textAlign: 'center' }}>
                          {"What Your Child\nIs Learning to Improve\n(Dapat Linangin)"}
                        </Text>
                      </View>
                      <View style={{ width: '62%', padding: 3, justifyContent: 'center' }}>
                        <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 5.4, lineHeight: 1.25 }}>
                          {tItem.toImprove}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, marginBottom: 2 }}>
                      <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 6.2, width: 108 }}>
                        Parent's/Guardian's Signature:
                      </Text>
                      <View style={{ flex: 1, borderBottomWidth: 1, borderColor: '#000' }} />
                    </View>
                  </View>
                ))}
              </View>

              {/* Right Column: Attendance & Certificate */}
              <View style={{ width: '49%', paddingLeft: 8 }}>
                <View>
                  <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 8.5, textAlign: 'center', marginBottom: 3 }}>
                    ATTENDANCE RECORD
                  </Text>
                  <View style={{ borderWidth: 1, borderColor: '#000', marginBottom: 4 }}>
                    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', backgroundColor: '#F9FAFB' }}>
                      <View style={{ width: '12%', borderRightWidth: 1, borderColor: '#000', padding: 1.5, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.5 }}>Term</Text>
                      </View>
                      <View style={{ width: '20%', borderRightWidth: 1, borderColor: '#000', padding: 1.5, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.5 }}>Month</Text>
                      </View>
                      <View style={{ width: '23%', borderRightWidth: 1, borderColor: '#000', padding: 1.5, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6, textAlign: 'center' }}>{"No. of Class\nDays"}</Text>
                      </View>
                      <View style={{ width: '23%', borderRightWidth: 1, borderColor: '#000', padding: 1.5, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6, textAlign: 'center' }}>{"No. Days\nPresent"}</Text>
                      </View>
                      <View style={{ width: '22%', padding: 1.5, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6, textAlign: 'center' }}>{"No. of Times\nAbsent"}</Text>
                      </View>
                    </View>

                    {[
                      { term: '1', months: [{ name: 'June', idx: 0 }, { name: 'July', idx: 1 }, { name: 'August', idx: 2 }, { name: 'September', idx: 3 }] },
                      { term: '2', months: [{ name: 'September', idx: 4 }, { name: 'October', idx: 5 }, { name: 'November', idx: 6 }, { name: 'December', idx: 7 }] },
                      { term: '3', months: [{ name: 'January', idx: 8 }, { name: 'February', idx: 9 }, { name: 'March', idx: 10 }, { name: 'April', idx: 11 }] },
                    ].map((tg, tgIdx) => (
                      <View key={tgIdx} style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' }}>
                        <View style={{ width: '12%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.8 }}>{tg.term}</Text>
                        </View>
                        <View style={{ width: '88%' }}>
                          {tg.months.map((m, mInTerm) => (
                            <View key={m.idx} style={{ flexDirection: 'row', borderBottomWidth: mInTerm === 3 ? 0 : 1, borderColor: '#000', height: 12.5 }}>
                              <View style={{ width: '22.727%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 5.8 }}>{m.name}</Text>
                              </View>
                              <View style={{ width: '26.136%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 5.8 }}>{getAttVal(attDays, m.idx)}</Text>
                              </View>
                              <View style={{ width: '26.136%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 5.8 }}>{getAttVal(attPres, m.idx)}</Text>
                              </View>
                              <View style={{ width: '25%', justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 5.8 }}>{getAttVal(attAbs, m.idx)}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}

                    <View style={{ flexDirection: 'row', height: 14 }}>
                      <View style={{ width: '32%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.2 }}>TOTAL</Text>
                      </View>
                      <View style={{ width: '23%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.2 }}>{calcTotal(attDays)}</Text>
                      </View>
                      <View style={{ width: '23%', borderRightWidth: 1, borderColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.2 }}>{calcTotal(attPres)}</Text>
                      </View>
                      <View style={{ width: '22%', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.2 }}>{calcTotal(attAbs)}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Important Note to Parents / Performance Levels */}
                <View style={{ marginTop: 5, marginBottom: 2 }}>
                  <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 7.5, textAlign: 'center', marginBottom: 2 }}>
                    IMPORTANT NOTE TO PARENTS/GUARDIANS
                  </Text>
                  <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 5.2, marginTop: 1, marginBottom: 2, lineHeight: 1.3, textAlign: 'justify' }}>
                    A detailed record of your child's progress across specific learning competencies is attached in the succeeding pages. This includes the monitoring of skills in Reading and Literacy, Language, Mathematics, Good Manners and Right Conduct, and Makabansa.
                  </Text>
                  <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 5.2, marginTop: 2, marginBottom: 2 }}>
                    Performance levels used in monitoring:
                  </Text>
                  <View style={{ borderWidth: 1, borderColor: '#000' }}>
                    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', backgroundColor: '#F9FAFB' }}>
                      <View style={{ width: '14%', borderRightWidth: 1, borderColor: '#000', paddingVertical: 4, paddingHorizontal: 1.5, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 4.8, textAlign: 'center' }}>{"Letter\nGrade"}</Text>
                      </View>
                      <View style={{ width: '28%', borderRightWidth: 1, borderColor: '#000', paddingVertical: 4, paddingHorizontal: 1.5, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 4.8, textAlign: 'center' }}>Descriptor</Text>
                      </View>
                      <View style={{ width: '58%', paddingVertical: 4, paddingHorizontal: 1.5, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 4.8, textAlign: 'center' }}>Description</Text>
                      </View>
                    </View>
                    {[
                      { grade: 'A', desc: 'Advancing\n(Namumukod-tangi)', detail: 'Consistently demonstrates skills and understanding beyond expectations; applies learning independently and confidently.' },
                      { grade: 'B', desc: 'Benchmarking\n(Naipamamalas)', detail: 'Meets expected learning standards; demonstrates skills and understanding with consistency.' },
                      { grade: 'C', desc: 'Connecting\n(Natutungo)', detail: 'Shows developing understanding and skills; requires minimal guidance to meet expectations.' },
                      { grade: 'D', desc: 'Developing\n(Nagpapaunlad)', detail: 'Demonstrates emerging skills and understanding; requires regular guidance and support.' },
                      { grade: 'E', desc: 'Emerging\n(Nagsisimula)', detail: 'Beginning to demonstrate basic skills; requires close supervision and targeted intervention.' },
                    ].map((rItem, rIdx) => (
                      <View key={rIdx} style={{ flexDirection: 'row', borderBottomWidth: rIdx === 4 ? 0 : 1, borderColor: '#000' }}>
                        <View style={{ width: '14%', borderRightWidth: 1, borderColor: '#000', paddingVertical: 4, paddingHorizontal: 1.5, justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 5.2 }}>{rItem.grade}</Text>
                        </View>
                        <View style={{ width: '28%', borderRightWidth: 1, borderColor: '#000', paddingVertical: 4, paddingHorizontal: 1.5, justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 4.4, textAlign: 'center', lineHeight: 1.35 }}>{rItem.desc}</Text>
                        </View>
                        <View style={{ width: '58%', paddingVertical: 4, paddingHorizontal: 1.5, justifyContent: 'center' }}>
                          <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 4.2, lineHeight: 1.38 }}>{rItem.detail}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Certificate of Transfer */}
                <View style={{ marginTop: 6 }}>
                  <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 7.5, textAlign: 'center', marginBottom: 6 }}>
                    CERTIFICATE OF TRANSFER
                  </Text>
                  <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 5.2, marginBottom: 8, lineHeight: 1.35 }}>
                    This is to certify that the above-named learner has satisfactorily completed the requirements for the grade level indicated.
                  </Text>
                  <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                    <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 5.2 }}>Admitted to Grade: </Text>
                    <View style={{ width: '65%', borderBottomWidth: 1, borderColor: '#000' }} />
                  </View>
                  <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                    <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 5.2 }}>Eligible for Admission to Grade: </Text>
                    <View style={{ width: '45%', borderBottomWidth: 1, borderColor: '#000' }} />
                  </View>
                  <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 5.2, marginBottom: 8 }}>Approved:</Text>

                  <View style={{ alignItems: 'center', width: '80%', alignSelf: 'center', marginBottom: 9 }}>
                    <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.2, borderBottomWidth: 1, borderColor: '#000', width: '100%', textAlign: 'center' }}>
                      {adviser ? adviser.toUpperCase() : ' '}
                    </Text>
                    <Text style={{ fontFamily: 'BookmanOldStyle-Italic', fontSize: 5.2, marginTop: 1 }}>Adviser</Text>
                  </View>

                  <View style={{ alignItems: 'center', width: '80%', alignSelf: 'center', marginBottom: 9 }}>
                    <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.2, borderBottomWidth: 1, borderColor: '#000', width: '100%', textAlign: 'center' }}>
                      {principal ? principal : ' '}
                    </Text>
                    <Text style={{ fontFamily: 'BookmanOldStyle-Italic', fontSize: 5.2, marginTop: 1 }}>School Head</Text>
                  </View>

                  <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 7, textAlign: 'center', marginTop: 6, marginBottom: 6 }}>
                    CANCELLATION OF ELIGIBILITY TO TRANSFER
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 }}>
                    <View style={{ width: '60%', flexDirection: 'row' }}>
                      <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 5.2 }}>Admitted in: </Text>
                      <View style={{ flex: 1, borderBottomWidth: 1, borderColor: '#000' }} />
                    </View>
                    <View style={{ width: '36%', flexDirection: 'row' }}>
                      <Text style={{ fontFamily: 'BookmanOldStyle', fontSize: 5.2 }}>Date: </Text>
                      <View style={{ flex: 1, borderBottomWidth: 1, borderColor: '#000' }} />
                    </View>
                  </View>
                  <View style={{ alignItems: 'center', width: '80%', alignSelf: 'center' }}>
                    <Text style={{ fontFamily: 'BookmanOldStyle-Bold', fontSize: 6.2, borderBottomWidth: 1, borderColor: '#000', width: '100%', textAlign: 'center' }}>
                      {principal ? principal : ' '}
                    </Text>
                    <Text style={{ fontFamily: 'BookmanOldStyle-Italic', fontSize: 5.2, marginTop: 1 }}>School Head</Text>
                  </View>
                </View>

              </View>
            </View>

          </View>
        </View>
      </Page>
    </Document>
  );
};
