import '../../styles/certificate-styles.css';
import { useAppStore } from '../../stores/app-store';

export interface CertificateData {
  learnerName: string;
  lrn: string;
  awardTitleTagalog: string;
  awardTitleEnglish: string;
  excellenceAward: string;
  dateDate: string;
  dateMonth: string;
  dateYear: string;
  signatory1Name: string;
  signatory1TitleTagalog: string;
  signatory1TitleEnglish: string;
  signatory2Name: string;
  signatory2TitleTagalog: string;
  signatory2TitleEnglish: string;
  givenInTagalog: string;
  givenInEnglish: string;
  headerRegionTagalog: string;
  headerRegionEnglish: string;
  headerDivisionTagalog: string;
  headerDivisionEnglish: string;
  headerDistrictTagalog: string;
  headerDistrictEnglish: string;
  headerSchoolName: string;
  signatureUrl1?: string;
  signatureUrl2?: string;
}

interface CertificateRendererProps {
  data: CertificateData;
}

// Helpers for localized date formatting
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
  
  // If user already typed "16th", just return it
  if (/[a-z]/i.test(dayStr)) return dayStr;

  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const getPureNumber = (dayStr: string) => {
  return dayStr.replace(/\D/g, '') || dayStr;
};

export const CertificateRenderer: React.FC<CertificateRendererProps> = ({ data }) => {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const { schoolProfile } = useAppStore();

  return (
    <div
      className="certificate-renderer mx-auto relative bg-white overflow-hidden"
      style={{
        width: '11in',
        height: '8.5in',
        minWidth: '11in',
        minHeight: '8.5in',
        maxWidth: '11in',
        maxHeight: '8.5in'
      }}
    >
      <div className="w-full h-full flex flex-col items-center relative">
        <div className="cert-logos">
          <img src={`${baseUrl}deped_logo_left.png`} className="logo-left" alt="DepEd Logo" />
          <img src={schoolProfile.logo_url || `${baseUrl}school-logo.png`} className="logo-right" alt="School Logo" />
        </div>

        {/* Header */}
        <div className="cert-header relative z-10 w-full mb-2">
          <p className="line-republic-tg font-old-english mb-0">Republika ng Pilipinas</p>
          <p className="line-republic-en font-old-english mb-1">Republic of the Philippines</p>

          <p className="line-dept-tg font-old-english mb-0">Kagawaran ng Edukasyon</p>
          <p className="line-dept-en font-old-english mb-1">Department of Education</p>

          <div className="mt-1 flex flex-col items-center text-center">
            <p className="line-region-tg font-bookman uppercase mb-0">{data.headerRegionTagalog}</p>
            <p className="line-region-en font-bookman mb-[2px] uppercase">{data.headerRegionEnglish}</p>

            <p className="line-division-tg font-bookman uppercase mb-0">{data.headerDivisionTagalog}</p>
            <p className="line-division-en font-bookman mb-[2px] uppercase">{data.headerDivisionEnglish}</p>

            <p className="line-district-tg font-bookman uppercase mb-0">{data.headerDistrictTagalog}</p>
            <p className="line-district-en font-bookman mb-[2px] uppercase">{data.headerDistrictEnglish}</p>

            <p className="line-school-name font-bookman uppercase mt-0">{data.headerSchoolName}</p>
          </div>
        </div>

        {/* Content Container */}
        <div className="cert-content-container w-full flex-1 flex flex-col">
          {/* Title */}
          <div className="text-center mt-1">
            <h1 className="line-cert-title font-old-english">Certificate of Recognition</h1>
          </div>

          {/* Award Sentence */}
          <div className="text-center mt-2">
            <p className="line-awarded-to font-bookman">ay iginagawad kay</p>
            <p className="text-[10pt] italic font-bookman leading-none mt-1">is hereby awarded to</p>
          </div>

          {/* Learner Name */}
          <div className="text-center mt-4">
            <h2 className="line-learner-name font-bookman uppercase tracking-wide">
              {data.learnerName}
            </h2>
            <p className="line-lrn font-bookman mt-0.5">
              Learner Reference Number (LRN): {data.lrn}
            </p>
          </div>

          {/* Award Body */}
          <div className="text-center mt-6 px-[1.2in] leading-[1.3]">
            <div className="flex flex-col items-center mb-4">
              <p className="line-award-text font-bookman mb-0">
                {data.awardTitleTagalog}
              </p>
              <p className="text-[11pt] font-bookman italic mb-1">
                ({data.awardTitleEnglish})
              </p>
            </div>

            {data.excellenceAward === 'Subject Excellence Award' ? (
              <>
                <p className="text-[11pt] font-bookman mb-0">
                  bilang pagkilala sa natatanging pagganap sa asignaturang {data.awardTitleEnglish.split('in ')[1] || 'Asignatura'}.
                </p>
                <p className="text-[9pt] font-bookman italic mb-4">
                  in recognition of outstanding academic performance in {data.awardTitleEnglish.split('in ')[1] || 'Subject'}.
                </p>
              </>
            ) : (
              <>
                <p className="text-[11pt] font-bookman mb-0">
                  bilang pagkilala sa matagumpay na pagtamo ng karangalang itinakda ng Kagawaran ng Edukasyon para sa mga mag-aaral sa antas sekundarya.
                </p>
                <p className="text-[9pt] font-bookman italic mb-4">
                  in recognition of having satisfactorily met the standards for academic honors prescribed by the Department of Education for learners in the secondary level.
                </p>
              </>
            )}

            <div className="flex flex-col items-center">
              <h3 className="line-award-title font-bookman uppercase tracking-wider text-black mb-0">
                {data.excellenceAward.split(' (')[0]}
              </h3>
              {data.excellenceAward.includes(' (') && (
                <p className="text-[10pt] font-bookman italic mt-1">
                  ({data.excellenceAward.split(' (')[1]}
                </p>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="text-center mt-4">
            <p className="text-[11pt] font-bookman mb-0.5">
              Iginawad sa {data.givenInTagalog}, Pilipinas, ngayong ika-{getPureNumber(data.dateDate)} ng {getTagalogMonth(data.dateMonth)} {data.dateYear}.
            </p>
            <p className="text-[9pt] font-bookman italic leading-none">
              Given in the {data.givenInEnglish}, Philippines, this {getOrdinal(data.dateDate)} day of {data.dateMonth} {data.dateYear}.
            </p>
          </div>

          {/* Signatories */}
          <div className="w-full flex justify-between px-[0.6in] mt-12">
            <div className="text-center w-[40%] flex flex-col items-center relative">
              {data.signatureUrl1 && (
                <img
                  src={data.signatureUrl1}
                  className="cert-signature-overlay h-24 absolute -top-16 opacity-90 mix-blend-multiply"
                  alt="Signature"
                />
              )}
              <p className="line-signatory-name font-bookman uppercase px-4">{data.signatory1Name}</p>
              <p className="line-signatory-title font-bookman leading-tight">
                {data.signatory1TitleTagalog} ({data.signatory1TitleEnglish})
              </p>
            </div>
            <div className="text-center w-[40%] flex flex-col items-center relative">
              {data.signatureUrl2 && (
                <img
                  src={data.signatureUrl2}
                  className="cert-signature-overlay h-24 absolute -top-16 opacity-90 mix-blend-multiply"
                  alt="Signature"
                />
              )}
              <p className="line-signatory-name font-bookman uppercase px-4">{data.signatory2Name}</p>
              <p className="line-signatory-title font-bookman leading-tight">
                {data.signatory2TitleTagalog} ({data.signatory2TitleEnglish})
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

