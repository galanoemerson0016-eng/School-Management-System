import { Document, Page, View, Text, Image, StyleSheet, Font } from '@react-pdf/renderer';
import type { CertificateData } from './CertificateRenderer';

// Helper to resolve absolute URLs for fonts and assets in client-side React-PDF
const base = typeof window !== 'undefined' ? (window.location.origin + (import.meta.env.BASE_URL || '/')) : '/';
const fontPath = `${base.endsWith('/') ? base : base + '/'}fonts`;

// Register Bookman Old Style fonts
Font.register({
  family: 'BookmanOldStyle',
  src: `${fontPath}/BOOKOS.TTF`
});
Font.register({
  family: 'BookmanOldStyle-Bold',
  src: `${fontPath}/BOOKOSB.TTF`
});
Font.register({
  family: 'BookmanOldStyle-Italic',
  src: `${fontPath}/BOOKOSI.TTF`
});
Font.register({
  family: 'BookmanOldStyle-BoldItalic',
  src: `${fontPath}/BOOKOSBI.TTF`
});

// Register Gothic font for Republic/Title sections
Font.register({
  family: 'MedievalSharp',
  src: 'https://fonts.gstatic.com/s/medievalsharp/v23/PN_o7K43Fz4Q3v79Gv21-4wM-vW4wQ.ttf'
});

const styles = StyleSheet.create({
  page: {
    width: '11in',
    height: '8.5in',
    backgroundColor: '#ffffff',
    paddingTop: 25,
    paddingLeft: 36,
    paddingRight: 36,
    paddingBottom: 35,
    fontFamily: 'BookmanOldStyle',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  },
  logoLeft: {
    position: 'absolute',
    left: 43.2, // 0.6in * 72
    top: 30,
    width: 90,
    height: 90,
  },
  logoRight: {
    position: 'absolute',
    right: 43.2, // 0.6in * 72
    top: 30,
    width: 90,
    height: 90,
  },
  header: {
    textAlign: 'center',
    marginBottom: 5,
  },
  republicTg: {
    fontFamily: 'MedievalSharp',
    fontSize: 13,
    color: '#000000',
    marginBottom: 1,
  },
  republicEn: {
    fontFamily: 'MedievalSharp',
    fontSize: 10.5,
    fontStyle: 'italic',
    color: '#000000',
    marginBottom: 2,
  },
  deptTg: {
    fontFamily: 'MedievalSharp',
    fontSize: 13,
    color: '#000000',
    marginBottom: 1,
  },
  deptEn: {
    fontFamily: 'MedievalSharp',
    fontSize: 10.5,
    fontStyle: 'italic',
    color: '#000000',
    marginBottom: 3,
  },
  subHeaderTg: {
    fontSize: 9.5,
    fontFamily: 'BookmanOldStyle-Bold',
    textTransform: 'uppercase',
    marginBottom: 0,
    lineHeight: 1.1,
  },
  subHeaderEn: {
    fontSize: 7.5,
    fontFamily: 'BookmanOldStyle-BoldItalic',
    textTransform: 'uppercase',
    marginBottom: 2,
    lineHeight: 1.1,
  },
  schoolName: {
    fontSize: 14,
    fontFamily: 'BookmanOldStyle-Bold',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  contentContainer: {
    width: '100%',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 5,
  },
  certTitle: {
    fontFamily: 'MedievalSharp',
    fontSize: 28,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  awardSentenceTg: {
    fontSize: 12,
    fontFamily: 'BookmanOldStyle-Italic',
    textAlign: 'center',
  },
  awardSentenceEn: {
    fontSize: 8.5,
    fontFamily: 'BookmanOldStyle-Italic',
    textAlign: 'center',
    marginTop: 1,
  },
  learnerName: {
    fontSize: 17,
    fontFamily: 'BookmanOldStyle-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 8,
    textDecoration: 'underline',
  },
  lrn: {
    fontSize: 8,
    fontFamily: 'BookmanOldStyle-Bold',
    textAlign: 'center',
    marginTop: 2,
  },
  awardBody: {
    textAlign: 'center',
    marginTop: 10,
    paddingLeft: 70,
    paddingRight: 70,
  },
  awardTitleTg: {
    fontSize: 14,
    fontFamily: 'BookmanOldStyle-Bold',
    marginBottom: 1,
  },
  awardTitleEn: {
    fontSize: 10,
    fontFamily: 'BookmanOldStyle-Italic',
    marginBottom: 3,
  },
  bodyTextTg: {
    fontSize: 10,
    fontFamily: 'BookmanOldStyle',
    lineHeight: 1.2,
    marginBottom: 0,
  },
  bodyTextEn: {
    fontSize: 8,
    fontFamily: 'BookmanOldStyle-Italic',
    lineHeight: 1.2,
    marginBottom: 6,
  },
  projectContainer: {
    marginTop: 3,
    marginBottom: 6,
    textAlign: 'center',
  },
  projectTitle: {
    fontSize: 9,
    fontFamily: 'BookmanOldStyle-Bold',
    textTransform: 'uppercase',
  },
  projectMembers: {
    fontSize: 7.5,
    fontFamily: 'BookmanOldStyle-Italic',
    color: '#4b5563',
    marginTop: 1,
  },
  excellenceAwardTitle: {
    fontSize: 14,
    fontFamily: 'BookmanOldStyle-Bold',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  excellenceAwardSub: {
    fontSize: 9,
    fontFamily: 'BookmanOldStyle-Italic',
    marginTop: 1,
  },
  dateLineTg: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 10,
  },
  dateLineEn: {
    fontSize: 8,
    fontFamily: 'BookmanOldStyle-Italic',
    textAlign: 'center',
    marginTop: 1,
  },
  signatoriesContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 40,
    paddingRight: 40,
    marginTop: 28,
  },
  signatoryCol: {
    width: '40%',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
  },
  signatureOverlay: {
    position: 'absolute',
    top: -45,
    height: 60,
    width: 100,
    opacity: 0.9,
  },
  signatoryName: {
    fontSize: 10.5,
    fontFamily: 'BookmanOldStyle-Bold',
    textTransform: 'uppercase',
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 3,
    width: '100%',
  },
  signatoryTitle: {
    fontSize: 8.5,
    fontFamily: 'BookmanOldStyle',
    marginTop: 2,
    lineHeight: 1.1,
  },
});

interface CertificatePDFDocumentProps {
  data: CertificateData;
  logoLeftUrl: string;
  logoRightUrl: string;
}

// Helpers for localized date formatting in PDF generator
const getTagalogMonth = (enMonth: string) => {
  const months: Record<string, string> = {
    'January': 'Enero', 'February': 'Pebrero', 'March': 'Marso',
    'April': 'Abril', 'May': 'Mayo', 'June': 'Hunyo',
    'July': 'Hulyo', 'August': 'Agosto', 'September': 'Setyembre',
    'October': 'Oktubre', 'November': 'Nobyembre', 'December': 'Disyembre'
  };
  return months[enMonth] || enMonth;
};

const getOrdinal = (dayStr: string) => {
  const n = parseInt(dayStr.replace(/\D/g, ''));
  if (isNaN(n)) return dayStr;
  if (/[a-z]/i.test(dayStr)) return dayStr;
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const getPureNumber = (dayStr: string) => {
  return dayStr.replace(/\D/g, '') || dayStr;
};

export function CertificatePDFDocument({ data, logoLeftUrl, logoRightUrl }: CertificatePDFDocumentProps) {
  // Resolve excellence award split
  const mainAwardTitle = data.excellenceAward.split(' (')[0] || '';
  const subAwardTitle = data.excellenceAward.includes(' (') 
    ? `(${data.excellenceAward.split(' (')[1]}` 
    : '';

  return (
    <Document>
      <Page size="LETTER" orientation="landscape" style={styles.page}>
        {/* Logos */}
        {logoLeftUrl && <Image src={logoLeftUrl} style={styles.logoLeft} />}
        {logoRightUrl && <Image src={logoRightUrl} style={styles.logoRight} />}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.republicTg}>Republika ng Pilipinas</Text>
          <Text style={styles.republicEn}>Republic of the Philippines</Text>
          <Text style={styles.deptTg}>Kagawaran ng Edukasyon</Text>
          <Text style={styles.deptEn}>Department of Education</Text>

          <Text style={styles.subHeaderTg}>{data.headerRegionTagalog}</Text>
          <Text style={styles.subHeaderEn}>{data.headerRegionEnglish}</Text>

          <Text style={styles.subHeaderTg}>{data.headerDivisionTagalog}</Text>
          <Text style={styles.subHeaderEn}>{data.headerDivisionEnglish}</Text>

          <Text style={styles.subHeaderTg}>{data.headerDistrictTagalog}</Text>
          <Text style={styles.subHeaderEn}>{data.headerDistrictEnglish}</Text>

          <Text style={styles.schoolName}>{data.headerSchoolName}</Text>
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          <Text style={styles.certTitle}>Certificate of Recognition</Text>
          
          <Text style={styles.awardSentenceTg}>ay iginagawad kay</Text>
          <Text style={styles.awardSentenceEn}>is hereby awarded to</Text>

          <Text style={styles.learnerName}>{data.learnerName}</Text>
          <Text style={styles.lrn}>Learner Reference Number (LRN): {data.lrn}</Text>

          {/* Award Details Body */}
          <View style={styles.awardBody}>
            <Text style={styles.awardTitleTg}>{data.awardTitleTagalog}</Text>
            <Text style={styles.awardTitleEn}>({data.awardTitleEnglish})</Text>

            {data.bodyTextTagalog ? (
              <View>
                <Text style={styles.bodyTextTg}>{data.bodyTextTagalog}</Text>
                <Text style={styles.bodyTextEn}>{data.bodyTextEnglish}</Text>
              </View>
            ) : data.excellenceAward === 'Subject Excellence Award' ? (
              <View>
                <Text style={styles.bodyTextTg}>
                  bilang pagkilala sa natatanging pagganap sa asignaturang {data.awardTitleEnglish.split('in ')[1] || 'Asignatura'}.
                </Text>
                <Text style={styles.bodyTextEn}>
                  in recognition of outstanding academic performance in {data.awardTitleEnglish.split('in ')[1] || 'Subject'}.
                </Text>
              </View>
            ) : (
              <View>
                <Text style={styles.bodyTextTg}>
                  bilang pagkilala sa matagumpay na pagtamo ng karangalang itinakda ng Kagawaran ng Edukasyon para sa mga mag-aaral.
                </Text>
                <Text style={styles.bodyTextEn}>
                  in recognition of having satisfactorily met the standards for academic honors prescribed by the Department of Education.
                </Text>
              </View>
            )}

            {/* Custom projects/groups */}
            {data.projectTitle ? (
              <View style={styles.projectContainer}>
                <Text style={styles.projectTitle}>Project: "{data.projectTitle}"</Text>
                {data.projectMembers && data.projectMembers.length > 0 && (
                  <Text style={styles.projectMembers}>
                    Group Members: {data.projectMembers.join(', ')}
                  </Text>
                )}
              </View>
            ) : null}

            {/* Award Category Heading */}
            <Text style={styles.excellenceAwardTitle}>{mainAwardTitle}</Text>
            {subAwardTitle ? <Text style={styles.excellenceAwardSub}>{subAwardTitle}</Text> : null}
          </View>

          {/* Date */}
          <Text style={styles.dateLineTg}>
            Iginawad sa {data.givenInTagalog}, Pilipinas, ngayong ika-{getPureNumber(data.dateDate)} ng {getTagalogMonth(data.dateMonth)} {data.dateYear}.
          </Text>
          <Text style={styles.dateLineEn}>
            Given in the {data.givenInEnglish}, Philippines, this {getOrdinal(data.dateDate)} day of {data.dateMonth} {data.dateYear}.
          </Text>

          {/* Signatories */}
          <View style={styles.signatoriesContainer}>
            {/* Signatory 1 */}
            <View style={styles.signatoryCol}>
              {data.signatureUrl1 ? (
                <Image src={data.signatureUrl1} style={styles.signatureOverlay} />
              ) : null}
              <Text style={styles.signatoryName}>{data.signatory1Name}</Text>
              <Text style={styles.signatoryTitle}>
                {data.signatory1TitleTagalog} ({data.signatory1TitleEnglish})
              </Text>
            </View>

            {/* Signatory 2 */}
            <View style={styles.signatoryCol}>
              {data.signatureUrl2 ? (
                <Image src={data.signatureUrl2} style={styles.signatureOverlay} />
              ) : null}
              <Text style={styles.signatoryName}>{data.signatory2Name}</Text>
              <Text style={styles.signatoryTitle}>
                {data.signatory2TitleTagalog} ({data.signatory2TitleEnglish})
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
