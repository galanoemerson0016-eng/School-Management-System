import { Document, Page, View, Text, Image, StyleSheet, Font } from '@react-pdf/renderer';
import type { CertificateData } from './CertificateRenderer';
import bookosRegular from '../../assets/fonts/BOOKOS.TTF?inline';
import bookosBold from '../../assets/fonts/BOOKOSB.TTF?inline';
import bookosItalic from '../../assets/fonts/BOOKOSI.TTF?inline';
import bookosBoldItalic from '../../assets/fonts/BOOKOSBI.TTF?inline';
import oldEnglishTextMT from '../../assets/fonts/OLDENGL.TTF?inline';

// Fonts are inlined as base64 data URIs because the packaged app runs on
// file://, where react-pdf's fetch()-based font loader cannot reach local files.
Font.register({
  family: 'BookmanOldStyle',
  src: bookosRegular
});
Font.register({
  family: 'BookmanOldStyle-Bold',
  src: bookosBold
});
Font.register({
  family: 'BookmanOldStyle-Italic',
  src: bookosItalic
});
Font.register({
  family: 'BookmanOldStyle-BoldItalic',
  src: bookosBoldItalic
});

// Old English Text MT matches the on-screen preview (.font-old-english). It ships
// no italic face; register the same file for both styles so react-pdf can resolve
// fontStyle: 'italic' instead of throwing.
Font.register({
  family: 'OldEnglishTextMT',
  fonts: [
    { src: oldEnglishTextMT },
    { src: oldEnglishTextMT, fontStyle: 'italic' }
  ]
});

// Sizes and margins mirror the on-screen preview (certificate-styles.css +
// CertificateRenderer.tsx tailwind classes); px values converted to pt (x0.75).
const styles = StyleSheet.create({
  page: {
    // Explicit dimensions: with wrap={false} react-pdf would otherwise size
    // the page to its content instead of exact Letter landscape.
    width: '11in',
    height: '8.5in',
    minHeight: '8.5in',
    backgroundColor: '#ffffff',
    paddingTop: 25, // 0.35in
    paddingLeft: 36, // 0.5in
    paddingRight: 36,
    paddingBottom: 47, // 0.65in
    fontFamily: 'BookmanOldStyle',
    // Fallback for any text without an explicit lineHeight; react-pdf would
    // otherwise use raw font metrics (very tall for Old English Text MT).
    lineHeight: 1.2,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  logoLeft: {
    position: 'absolute',
    left: 43, // 0.6in
    top: 22,
    width: 101, // 1.4in
    height: 101,
  },
  logoRight: {
    position: 'absolute',
    right: 43,
    top: 22,
    width: 101,
    height: 101,
  },
  // Fixed-height flow area (8.5in minus page paddings): long content overflows
  // into the bottom padding like the HTML preview instead of growing the page.
  mainArea: {
    width: '100%',
    height: 540,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    width: '100%',
    textAlign: 'center',
    lineHeight: 0.95,
    marginTop: 8,
    marginBottom: 6,
  },
  republicTg: {
    fontFamily: 'OldEnglishTextMT',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 0.95,
    color: '#000000',
  },
  republicEn: {
    fontFamily: 'OldEnglishTextMT',
    fontSize: 11.5,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 0.95,
    color: '#000000',
    marginBottom: 3,
  },
  deptTg: {
    fontFamily: 'OldEnglishTextMT',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 0.95,
    color: '#000000',
  },
  deptEn: {
    fontFamily: 'OldEnglishTextMT',
    fontSize: 11.5,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 0.95,
    color: '#000000',
    marginBottom: 3,
  },
  subHeaderTg: {
    fontSize: 11,
    fontFamily: 'BookmanOldStyle-Bold',
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 0.95,
  },
  subHeaderEn: {
    fontSize: 8,
    fontFamily: 'BookmanOldStyle-BoldItalic',
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 0.95,
    marginBottom: 1.5,
  },
  schoolName: {
    fontSize: 16,
    fontFamily: 'BookmanOldStyle-Bold',
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 0.95,
  },
  contentContainer: {
    width: '100%',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 7, // 0.1in
  },
  certTitle: {
    fontFamily: 'OldEnglishTextMT',
    fontSize: 32,
    textAlign: 'center',
    lineHeight: 1.2,
    marginTop: 3,
  },
  awardSentenceTg: {
    fontSize: 14,
    fontFamily: 'BookmanOldStyle-Italic',
    textAlign: 'center',
    lineHeight: 1.2,
    marginTop: 6,
  },
  awardSentenceEn: {
    fontSize: 10,
    fontFamily: 'BookmanOldStyle-Italic',
    textAlign: 'center',
    lineHeight: 1,
    marginTop: 3,
  },
  learnerName: {
    fontSize: 18,
    fontFamily: 'BookmanOldStyle-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    lineHeight: 1.2,
    marginTop: 12,
    textDecoration: 'underline',
  },
  lrn: {
    fontSize: 9,
    fontFamily: 'BookmanOldStyle-Bold',
    textAlign: 'center',
    lineHeight: 1.2,
    marginTop: 1.5,
  },
  awardBody: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 18,
    paddingLeft: 86, // 1.2in
    paddingRight: 86,
    lineHeight: 1.3,
  },
  awardTitleTg: {
    fontSize: 16,
    fontFamily: 'BookmanOldStyle-Bold',
    textAlign: 'center',
    lineHeight: 1.3,
    width: '100%',
  },
  awardTitleEn: {
    fontSize: 11,
    fontFamily: 'BookmanOldStyle-Italic',
    textAlign: 'center',
    lineHeight: 1.3,
    marginBottom: 15,
    width: '100%',
  },
  bodyTextTg: {
    fontSize: 11,
    fontFamily: 'BookmanOldStyle',
    textAlign: 'center',
    lineHeight: 1.3,
    width: '100%',
  },
  bodyTextEn: {
    fontSize: 9,
    fontFamily: 'BookmanOldStyle-Italic',
    textAlign: 'center',
    lineHeight: 1.3,
    marginBottom: 12,
    width: '100%',
  },
  projectContainer: {
    width: '100%',
    marginTop: 9,
    marginBottom: 12,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  projectTitle: {
    fontSize: 10,
    fontFamily: 'BookmanOldStyle-Bold',
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 1.3,
    width: '100%',
  },
  projectMembers: {
    fontSize: 8,
    fontFamily: 'BookmanOldStyle-Italic',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 1.3,
    marginTop: 1.5,
    width: '100%',
  },
  excellenceAwardTitle: {
    fontSize: 16,
    fontFamily: 'BookmanOldStyle-Bold',
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 1.3,
    width: '100%',
    marginTop: 14,
  },
  excellenceAwardSub: {
    fontSize: 10,
    fontFamily: 'BookmanOldStyle-Italic',
    textAlign: 'center',
    lineHeight: 1.3,
    marginTop: 3,
    width: '100%',
    marginBottom: 6,
  },
  dateLineTg: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 1.2,
    marginTop: 18,
    marginBottom: 1.5,
    width: '100%',
  },
  dateLineEn: {
    fontSize: 9,
    fontFamily: 'BookmanOldStyle-Italic',
    textAlign: 'center',
    lineHeight: 1,
    width: '100%',
  },
  signatoriesContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 43, // 0.6in
    paddingRight: 43,
    marginTop: 36,
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
    top: -48,
    height: 72,
    width: 140,
    opacity: 0.9,
    objectFit: 'contain',
  },
  signatoryName: {
    fontSize: 12,
    fontFamily: 'BookmanOldStyle-Bold',
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 1.2,
    paddingTop: 3,
    width: '100%',
  },
  signatoryTitle: {
    fontSize: 10,
    fontFamily: 'BookmanOldStyle',
    textAlign: 'center',
    marginTop: 1.5,
    lineHeight: 1.25,
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
      <Page size="LETTER" orientation="landscape" style={styles.page} wrap={false}>
        {/* Logos */}
        {logoLeftUrl && <Image src={logoLeftUrl} style={styles.logoLeft} />}
        {logoRightUrl && <Image src={logoRightUrl} style={styles.logoRight} />}

        <View style={styles.mainArea}>
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
              <>
                <Text style={styles.bodyTextTg}>{data.bodyTextTagalog}</Text>
                <Text style={styles.bodyTextEn}>{data.bodyTextEnglish}</Text>
              </>
            ) : data.excellenceAward === 'Subject Excellence Award' ? (
              <>
                <Text style={styles.bodyTextTg}>
                  bilang pagkilala sa natatanging pagganap sa asignaturang {data.awardTitleEnglish.split('in ')[1] || 'Asignatura'}.
                </Text>
                <Text style={styles.bodyTextEn}>
                  in recognition of outstanding academic performance in {data.awardTitleEnglish.split('in ')[1] || 'Subject'}.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.bodyTextTg}>
                  bilang pagkilala sa matagumpay na pagtamo ng karangalang itinakda ng Kagawaran ng Edukasyon para sa mga mag-aaral.
                </Text>
                <Text style={styles.bodyTextEn}>
                  in recognition of having satisfactorily met the standards for academic honors prescribed by the Department of Education.
                </Text>
              </>
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
        </View>
      </Page>
    </Document>
  );
}
