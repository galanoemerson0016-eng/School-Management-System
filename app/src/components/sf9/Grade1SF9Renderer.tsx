import React, { useState } from 'react';
import type { Student, SchoolProfile } from '../../types';
import type { Grade1SF9Remarks, Grade1SF9Attendance } from './Grade1SF9PDFDocument';
import { formatLearnerName } from '../../utils/student-name';
import { Sparkles, Edit3, Check, Printer, Download, BookOpen } from 'lucide-react';

interface Grade1SF9RendererProps {
  student: Student;
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section: string;
  adviser: string;
  principal?: string;
  principalTitle?: string;
  g1Remarks: Grade1SF9Remarks;
  attendance?: Grade1SF9Attendance;
  onUpdateRemarks: (updated: Grade1SF9Remarks) => void;
  onPrint?: () => void;
  onDownloadPdf?: () => void;
  isSaving?: boolean;
}

const COMMON_CAN_DO_SUGGESTIONS = [
  'Consistently demonstrates active participation and enthusiasm in class activities.',
  'Easily identifies letter names, sounds, and forms simple phonetic combinations.',
  'Expresses ideas clearly through drawings, basic writing, and oral storytelling.',
  'Demonstrates positive peer relations, sharing materials, and following instructions.',
  'Shows strong number sense, counting accurately and recognizing numeric values.',
];

const COMMON_TO_IMPROVE_SUGGESTIONS = [
  'Encourage daily home reading practice for 10-15 minutes to improve phonetic fluency.',
  'Practice proper pencil grip and fine motor control during guided handwriting tasks.',
  'Continue reinforcing patience, active listening, and raising hands before speaking.',
  'Provide additional guided support in subtracting single-digit numbers using objects.',
  'Regularly practice following multi-step classroom and home routines independently.',
];

export const Grade1SF9Renderer: React.FC<Grade1SF9RendererProps> = ({
  student,
  schoolProfile,
  schoolYear,
  section,
  adviser,
  principal,
  g1Remarks,
  attendance,
  onUpdateRemarks,
  onPrint,
  onDownloadPdf,
  isSaving = false
}) => {
  const [activeSuggestionField, setActiveSuggestionField] = useState<keyof Grade1SF9Remarks | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTempRemarks, setModalTempRemarks] = useState<Grade1SF9Remarks>(g1Remarks);

  const cleanDivision = (schoolProfile.division || '')
    .replace(/schools division office of/i, '')
    .replace(/schools division of/i, '')
    .trim()
    .toUpperCase();

  const muniCity = schoolProfile?.municipality || schoolProfile?.city || '';
  const prov = schoolProfile?.province || '';
  const muniCityProvince = (muniCity && prov) ? `${muniCity}, ${prov}` : (muniCity || prov || 'Municipality/City, Province');

  const handleRemarkChange = (field: keyof Grade1SF9Remarks, val: string) => {
    onUpdateRemarks({
      ...g1Remarks,
      [field]: val
    });
  };

  const handleApplySuggestion = (text: string) => {
    if (!activeSuggestionField) return;
    const current = (g1Remarks[activeSuggestionField] || '').trim();
    const updated = current ? `${current}\n• ${text}` : `• ${text}`;
    handleRemarkChange(activeSuggestionField, updated);
    setActiveSuggestionField(null);
  };

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
    <div className="w-full flex flex-col items-center space-y-4 font-serif">
      {/* Action Strip above document */}
      <div className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs font-sans">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>Official Grade 1 School Form 9 (Learner's Progress Report)</span>
          {isSaving ? (
            <span className="text-amber-500 font-bold ml-2 animate-pulse text-[11px]">Saving remarks...</span>
          ) : (
            <span className="text-emerald-500 font-bold ml-2 text-[11px] flex items-center gap-1">
              <Check className="w-3 h-3" /> Auto-saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setModalTempRemarks(g1Remarks);
              setIsModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800 text-xs font-bold hover:bg-purple-100 transition-all flex items-center gap-1.5 active:scale-95"
            title="Open Fullscreen Remarks Editor"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit In Modal</span>
          </button>

          {onPrint && (
            <button
              onClick={onPrint}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs shadow-blue-500/20 transition-all flex items-center gap-1.5 active:scale-95"
              title="Print official Grade 1 SF9"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print SF9</span>
            </button>
          )}

          {onDownloadPdf && (
            <button
              onClick={onDownloadPdf}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 active:scale-95"
              title="Download Grade 1 SF9 PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Suggestion Popover Bar if active */}
      {activeSuggestionField && (
        <div className="w-full max-w-5xl bg-purple-500/10 border border-purple-500/30 p-3 rounded-2xl font-sans space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-purple-900 dark:text-purple-300">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>
                Quick Phrase Bank for {activeSuggestionField.includes('CanDo') ? "What Child Can Do" : "What Child Is Learning to Improve"}
              </span>
            </div>
            <button
              onClick={() => setActiveSuggestionField(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-0.5 rounded-md hover:bg-white/50"
            >
              Close
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(activeSuggestionField.includes('CanDo') ? COMMON_CAN_DO_SUGGESTIONS : COMMON_TO_IMPROVE_SUGGESTIONS).map((phrase, pIdx) => (
              <button
                key={pIdx}
                onClick={() => handleApplySuggestion(phrase)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/60 text-slate-800 dark:text-slate-200 text-[11px] font-medium hover:bg-purple-600 hover:text-white transition-all text-left"
              >
                + {phrase}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Authentic DepEd Grade 1 SF9 Paper Document */}
      <div 
        className="w-full max-w-5xl bg-white text-black p-6 sm:p-8 rounded-2xl shadow-xl border border-black select-text"
        style={{ minHeight: '1050px', fontFamily: '"Bookman Old Style", Georgia, "Times New Roman", serif' }}
      >
        {/* Full Inner Border Container */}
        <div className="border border-black p-4 flex flex-col justify-between h-full">
          
          {/* Header */}
          <div className="flex items-start justify-between border-b border-black pb-3 mb-3">
            <img 
              src={`${import.meta.env.BASE_URL}deped_logo_left.png`} 
              alt="DepEd Seal" 
              className="w-14 h-14 object-contain shrink-0" 
            />
            <div className="flex-1 text-center px-4 leading-tight">
              <p className="text-[11px]">Republic of the Philippines</p>
              <p className="text-[11px]">Department of Education</p>
              <p className="text-[11px]">{schoolProfile.region || 'Region VIII'}</p>
              <p className="text-[12px] font-bold tracking-wide">{cleanDivision || 'LEYTE'}</p>
              <p className="text-[11px]">{schoolProfile.district || 'District'}</p>
              <p className="text-[11px]">{muniCityProvince}</p>
              <p className="text-[13px] font-bold mt-1 tracking-wide uppercase">
                {schoolProfile.name || 'ELEMENTARY SCHOOL'}
              </p>
            </div>
            <img 
              src={schoolProfile.logo_url || `${import.meta.env.BASE_URL}school-logo.png`} 
              alt="School Logo" 
              className="w-14 h-14 object-contain shrink-0" 
            />
          </div>

          {/* Report Title */}
          <div className="text-center mb-3">
            <h2 className="text-[16px] font-bold tracking-tight">LEARNER'S PROGRESS REPORT</h2>
            <p className="text-[11px]">School Year: {schoolYear}</p>
          </div>

          {/* Learner Info Bar */}
          <div className="border-b border-black pb-2 mb-3 text-[11px] leading-relaxed">
            <div className="grid grid-cols-12 gap-2 mb-1">
              <div className="col-span-3 flex items-center gap-1">
                <span className="font-semibold">LRN:</span>
                <span className="flex-1 border-b border-black font-bold text-center">{student.lrn || '—'}</span>
              </div>
              <div className="col-span-7 flex items-center gap-1">
                <span className="font-semibold">Name:</span>
                <span className="flex-1 border-b border-black font-bold text-center uppercase tracking-wide">
                  {formatLearnerName(student)}
                </span>
              </div>
              <div className="col-span-2 flex items-center gap-1">
                <span className="font-semibold">Sex:</span>
                <span className="flex-1 border-b border-black font-bold text-center uppercase">{student.gender || '—'}</span>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-3 flex items-center gap-1">
                <span className="font-semibold">Grade & Sec:</span>
                <span className="flex-1 border-b border-black font-bold text-center">{`1 - ${section}`}</span>
              </div>
              <div className="col-span-7 flex items-center gap-1">
                <span className="font-semibold">Adviser:</span>
                <span className="flex-1 border-b border-black font-bold text-center uppercase">{adviser || '—'}</span>
              </div>
              <div className="col-span-2 flex items-center gap-1">
                <span className="font-semibold">Age:</span>
                <span className="flex-1 border-b border-black font-bold text-center">{student.age || '—'}</span>
              </div>
            </div>
          </div>

          {/* Main 2-Column Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 text-[10.5px]">
            
            {/* Left Column: Descriptive Learning Progress */}
            <div className="border-r border-black pr-5 flex flex-col justify-between space-y-4">
              <div className="text-[10px] leading-snug text-justify text-slate-800">
                <p className="font-bold mb-1">Dear Parents/Guardians,</p>
                <p>
                  This report provides a descriptive account of your child's learning progress for each term. It highlights what your child can already do, what they are currently developing, and how they can be further supported.
                </p>
                <p className="mt-1">
                  This report is based on varied evidence of learning including classroom activities, observations, learner outputs, and assessments. It is designed to give a clearer development rather than relying on numerical or letter grades.
                </p>
              </div>

              {/* Term 1 */}
              <div className="border border-black p-2 rounded-none space-y-2 bg-slate-50/40">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-center flex-1">
                    TERM 1 (UNANG TERMINO)
                  </h4>
                </div>

                <div className="border border-black flex flex-col">
                  <div className="flex items-center justify-between bg-slate-100 border-b border-black px-2 py-1 font-bold text-[9.5px]">
                    <span>What Your Child Can Do (Mga Nagagawa)</span>
                    <button
                      type="button"
                      onClick={() => setActiveSuggestionField('term1CanDo')}
                      className="text-purple-700 hover:text-purple-900 text-[9px] flex items-center gap-0.5 underline font-sans"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> Suggestions
                    </button>
                  </div>
                  <textarea
                    value={g1Remarks.term1CanDo || ''}
                    onChange={(e) => handleRemarkChange('term1CanDo', e.target.value)}
                    rows={3}
                    placeholder="Describe specific strengths, competencies achieved, and demonstrable skills in Term 1..."
                    className="w-full p-2 text-[10px] font-serif bg-transparent focus:bg-amber-500/5 focus:outline-none resize-y border-none"
                  />
                </div>

                <div className="border border-black flex flex-col">
                  <div className="flex items-center justify-between bg-slate-100 border-b border-black px-2 py-1 font-bold text-[9.5px]">
                    <span>What Your Child Is Learning to Improve (Dapat Linangin)</span>
                    <button
                      type="button"
                      onClick={() => setActiveSuggestionField('term1ToImprove')}
                      className="text-purple-700 hover:text-purple-900 text-[9px] flex items-center gap-0.5 underline font-sans"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> Suggestions
                    </button>
                  </div>
                  <textarea
                    value={g1Remarks.term1ToImprove || ''}
                    onChange={(e) => handleRemarkChange('term1ToImprove', e.target.value)}
                    rows={3}
                    placeholder="Describe areas needing guided practice, targeted support, or growth opportunities..."
                    className="w-full p-2 text-[10px] font-serif bg-transparent focus:bg-amber-500/5 focus:outline-none resize-y border-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1 text-[9.5px]">
                  <span>Parent's/Guardian Signature:</span>
                  <div className="flex-1 border-b border-black" />
                </div>
              </div>

              {/* Term 2 */}
              <div className="border border-black p-2 rounded-none space-y-2 bg-slate-50/40">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-center flex-1">
                    TERM 2 (IKALAWANG TERMINO)
                  </h4>
                </div>

                <div className="border border-black flex flex-col">
                  <div className="flex items-center justify-between bg-slate-100 border-b border-black px-2 py-1 font-bold text-[9.5px]">
                    <span>What Your Child Can Do (Mga Nagagawa)</span>
                    <button
                      type="button"
                      onClick={() => setActiveSuggestionField('term2CanDo')}
                      className="text-purple-700 hover:text-purple-900 text-[9px] flex items-center gap-0.5 underline font-sans"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> Suggestions
                    </button>
                  </div>
                  <textarea
                    value={g1Remarks.term2CanDo || ''}
                    onChange={(e) => handleRemarkChange('term2CanDo', e.target.value)}
                    rows={3}
                    placeholder="Describe specific achievements and progress in Term 2..."
                    className="w-full p-2 text-[10px] font-serif bg-transparent focus:bg-amber-500/5 focus:outline-none resize-y border-none"
                  />
                </div>

                <div className="border border-black flex flex-col">
                  <div className="flex items-center justify-between bg-slate-100 border-b border-black px-2 py-1 font-bold text-[9.5px]">
                    <span>What Your Child Is Learning to Improve (Dapat Linangin)</span>
                    <button
                      type="button"
                      onClick={() => setActiveSuggestionField('term2ToImprove')}
                      className="text-purple-700 hover:text-purple-900 text-[9px] flex items-center gap-0.5 underline font-sans"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> Suggestions
                    </button>
                  </div>
                  <textarea
                    value={g1Remarks.term2ToImprove || ''}
                    onChange={(e) => handleRemarkChange('term2ToImprove', e.target.value)}
                    rows={3}
                    placeholder="Describe competencies to reinforce in Term 2..."
                    className="w-full p-2 text-[10px] font-serif bg-transparent focus:bg-amber-500/5 focus:outline-none resize-y border-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1 text-[9.5px]">
                  <span>Parent's/Guardian Signature:</span>
                  <div className="flex-1 border-b border-black" />
                </div>
              </div>

              {/* Term 3 */}
              <div className="border border-black p-2 rounded-none space-y-2 bg-slate-50/40">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-center flex-1">
                    TERM 3 (IKATLONG TERMINO)
                  </h4>
                </div>

                <div className="border border-black flex flex-col">
                  <div className="flex items-center justify-between bg-slate-100 border-b border-black px-2 py-1 font-bold text-[9.5px]">
                    <span>What Your Child Can Do (Mga Nagagawa)</span>
                    <button
                      type="button"
                      onClick={() => setActiveSuggestionField('term3CanDo')}
                      className="text-purple-700 hover:text-purple-900 text-[9px] flex items-center gap-0.5 underline font-sans"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> Suggestions
                    </button>
                  </div>
                  <textarea
                    value={g1Remarks.term3CanDo || ''}
                    onChange={(e) => handleRemarkChange('term3CanDo', e.target.value)}
                    rows={3}
                    placeholder="Describe mastery and end-of-year achievements in Term 3..."
                    className="w-full p-2 text-[10px] font-serif bg-transparent focus:bg-amber-500/5 focus:outline-none resize-y border-none"
                  />
                </div>

                <div className="border border-black flex flex-col">
                  <div className="flex items-center justify-between bg-slate-100 border-b border-black px-2 py-1 font-bold text-[9.5px]">
                    <span>What Your Child Is Learning to Improve (Dapat Linangin)</span>
                    <button
                      type="button"
                      onClick={() => setActiveSuggestionField('term3ToImprove')}
                      className="text-purple-700 hover:text-purple-900 text-[9px] flex items-center gap-0.5 underline font-sans"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> Suggestions
                    </button>
                  </div>
                  <textarea
                    value={g1Remarks.term3ToImprove || ''}
                    onChange={(e) => handleRemarkChange('term3ToImprove', e.target.value)}
                    rows={3}
                    placeholder="Describe recommendations for continuous learning entering Grade 2..."
                    className="w-full p-2 text-[10px] font-serif bg-transparent focus:bg-amber-500/5 focus:outline-none resize-y border-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1 text-[9.5px]">
                  <span>Parent's/Guardian Signature:</span>
                  <div className="flex-1 border-b border-black" />
                </div>
              </div>
            </div>

            {/* Right Column: Attendance, Descriptors, Certificate */}
            <div className="flex flex-col justify-between space-y-4">
              
              {/* Attendance Record */}
              <div>
                <h3 className="font-bold text-[12px] text-center mb-1 uppercase tracking-wide">ATTENDANCE RECORD</h3>
                <div className="border border-black text-[10px]">
                  <div className="grid grid-cols-12 bg-slate-100 font-bold border-b border-black text-center py-1">
                    <div className="col-span-2 border-r border-black">Term</div>
                    <div className="col-span-3 border-r border-black">Month</div>
                    <div className="col-span-2 border-r border-black">School Days</div>
                    <div className="col-span-2 border-r border-black">Present</div>
                    <div className="col-span-3">Absent</div>
                  </div>

                  {/* Term 1 */}
                  {[
                    { term: '1', name: 'June', idx: 0 },
                    { term: '1', name: 'July', idx: 1 },
                    { term: '1', name: 'August', idx: 2 },
                    { term: '1', name: 'September', idx: 3 },
                  ].map((row, rIdx) => (
                    <div key={rIdx} className="grid grid-cols-12 border-b border-black text-center py-0.5">
                      {rIdx === 0 && (
                        <div className="col-span-2 border-r border-black font-bold flex items-center justify-center row-span-4">
                          1
                        </div>
                      )}
                      <div className={`col-span-3 border-r border-black ${rIdx > 0 ? 'col-start-3' : ''}`}>
                        {row.name}
                      </div>
                      <div className="col-span-2 border-r border-black">{getAttVal(attDays, row.idx)}</div>
                      <div className="col-span-2 border-r border-black">{getAttVal(attPres, row.idx)}</div>
                      <div className="col-span-3">{getAttVal(attAbs, row.idx)}</div>
                    </div>
                  ))}

                  {/* Term 2 */}
                  {[
                    { term: '2', name: 'September', idx: 4 },
                    { term: '2', name: 'October', idx: 5 },
                    { term: '2', name: 'November', idx: 6 },
                    { term: '2', name: 'December', idx: 7 },
                  ].map((row, rIdx) => (
                    <div key={rIdx} className="grid grid-cols-12 border-b border-black text-center py-0.5">
                      {rIdx === 0 && (
                        <div className="col-span-2 border-r border-black font-bold flex items-center justify-center row-span-4">
                          2
                        </div>
                      )}
                      <div className={`col-span-3 border-r border-black ${rIdx > 0 ? 'col-start-3' : ''}`}>
                        {row.name}
                      </div>
                      <div className="col-span-2 border-r border-black">{getAttVal(attDays, row.idx)}</div>
                      <div className="col-span-2 border-r border-black">{getAttVal(attPres, row.idx)}</div>
                      <div className="col-span-3">{getAttVal(attAbs, row.idx)}</div>
                    </div>
                  ))}

                  {/* Term 3 */}
                  {[
                    { term: '3', name: 'January', idx: 8 },
                    { term: '3', name: 'February', idx: 9 },
                    { term: '3', name: 'March', idx: 10 },
                    { term: '3', name: 'April', idx: 11 },
                  ].map((row, rIdx) => (
                    <div key={rIdx} className="grid grid-cols-12 border-b border-black text-center py-0.5">
                      {rIdx === 0 && (
                        <div className="col-span-2 border-r border-black font-bold flex items-center justify-center row-span-4">
                          3
                        </div>
                      )}
                      <div className={`col-span-3 border-r border-black ${rIdx > 0 ? 'col-start-3' : ''}`}>
                        {row.name}
                      </div>
                      <div className="col-span-2 border-r border-black">{getAttVal(attDays, row.idx)}</div>
                      <div className="col-span-2 border-r border-black">{getAttVal(attPres, row.idx)}</div>
                      <div className="col-span-3">{getAttVal(attAbs, row.idx)}</div>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="grid grid-cols-12 bg-slate-50 font-bold text-center py-1">
                    <div className="col-span-5 border-r border-black tracking-wider">TOTAL</div>
                    <div className="col-span-2 border-r border-black">{calcTotal(attDays)}</div>
                    <div className="col-span-2 border-r border-black">{calcTotal(attPres)}</div>
                    <div className="col-span-3">{calcTotal(attAbs)}</div>
                  </div>
                </div>
              </div>

              {/* Note to Parents & Descriptors */}
              <div>
                <h4 className="font-bold text-[10.5px] text-center mb-1 uppercase tracking-wide">
                  IMPORTANT NOTE TO PARENTS/GUARDIANS
                </h4>
                <p className="text-[9.5px] leading-snug mb-2 text-slate-700">
                  A detailed record of your child's progress across specific learning competencies is attached in the succeeding pages. This includes the monitoring of skills in Reading and Literacy, Language, Mathematics, Good Manners and Right Conduct, and Makabansa.
                </p>
                <p className="text-[9.5px] font-bold mb-1">Performance levels used in monitoring:</p>
                
                <div className="border border-black text-[9.5px]">
                  <div className="grid grid-cols-12 bg-slate-100 font-bold border-b border-black py-0.5 text-center">
                    <div className="col-span-2 border-r border-black">Grade</div>
                    <div className="col-span-4 border-r border-black">Descriptor</div>
                    <div className="col-span-6">Description</div>
                  </div>
                  {[
                    { grade: 'A', desc: 'Advancing (Namumukod-tangi)', detail: 'Consistently demonstrates skills and understanding beyond expectations; applies learning independently.' },
                    { grade: 'B', desc: 'Benchmarking (Naipamamalas)', detail: 'Meets expected learning standards; demonstrates skills and understanding with consistency.' },
                    { grade: 'C', desc: 'Connecting (Natutungo)', detail: 'Shows developing understanding and skills; requires minimal guidance to meet expectations.' },
                    { grade: 'D', desc: 'Developing (Napauunlad)', detail: 'Demonstrates emerging skills and understanding; requires regular guidance and support.' },
                    { grade: 'E', desc: 'Emerging (Nagsisimula)', detail: 'Beginning to demonstrate basic skills; requires close supervision and targeted intervention.' },
                  ].map((r, idx) => (
                    <div key={idx} className="grid grid-cols-12 border-b last:border-b-0 border-black py-1">
                      <div className="col-span-2 border-r border-black font-bold text-center flex items-center justify-center">{r.grade}</div>
                      <div className="col-span-4 border-r border-black px-1 font-semibold flex items-center">{r.desc}</div>
                      <div className="col-span-6 px-1.5 text-[9px] leading-tight flex items-center">{r.detail}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certificate of Transfer */}
              <div className="text-[9.5px] space-y-1.5 pt-1">
                <h4 className="font-bold text-[10.5px] text-center uppercase tracking-wide">
                  CERTIFICATE OF TRANSFER
                </h4>
                <p className="leading-snug">
                  This is to certify that the above-named learner has satisfactory completed the requirements for the grade level indicated.
                </p>
                <div className="flex items-center gap-2">
                  <span>Admitted to Grade:</span>
                  <div className="flex-1 border-b border-black" />
                </div>
                <div className="flex items-center gap-2">
                  <span>Eligible for Admission to Grade:</span>
                  <div className="flex-1 border-b border-black" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 text-center">
                  <div className="flex flex-col items-center">
                    <span className="w-full border-b border-black font-bold uppercase tracking-wider pb-0.5">
                      {adviser || ' '}
                    </span>
                    <span className="text-[9px] italic mt-0.5">Adviser</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="w-full border-b border-black font-bold uppercase tracking-wider pb-0.5">
                      {principal || ' '}
                    </span>
                    <span className="text-[9px] italic mt-0.5">School Head</span>
                  </div>
                </div>

                <div className="pt-2 text-[9px] space-y-1">
                  <p className="font-bold text-center uppercase">Cancellation of Eligibility to Transfer</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-1">
                      <span>Admitted in:</span>
                      <div className="flex-1 border-b border-black" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Date:</span>
                      <div className="flex-1 border-b border-black" />
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* Fullscreen Remarks Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Grade 1 Learner Progress Notes
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {formatLearnerName(student)} • Terms 1, 2, & 3
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {[
                { term: 1, title: 'TERM 1 (UNANG TERMINO)', canDo: 'term1CanDo' as const, toImp: 'term1ToImprove' as const },
                { term: 2, title: 'TERM 2 (IKALAWANG TERMINO)', canDo: 'term2CanDo' as const, toImp: 'term2ToImprove' as const },
                { term: 3, title: 'TERM 3 (IKATLONG TERMINO)', canDo: 'term3CanDo' as const, toImp: 'term3ToImprove' as const },
              ].map((t) => (
                <div key={t.term} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-black uppercase text-purple-700 dark:text-purple-400 tracking-wider">
                    {t.title}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        What Your Child Can Do (Mga Nagagawa)
                      </label>
                      <textarea
                        value={modalTempRemarks[t.canDo] || ''}
                        onChange={(e) => setModalTempRemarks(prev => ({ ...prev, [t.canDo]: e.target.value }))}
                        rows={4}
                        placeholder="Achievements and strengths..."
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        What Your Child Is Learning to Improve (Dapat Linangin)
                      </label>
                      <textarea
                        value={modalTempRemarks[t.toImp] || ''}
                        onChange={(e) => setModalTempRemarks(prev => ({ ...prev, [t.toImp]: e.target.value }))}
                        rows={4}
                        placeholder="Areas needing guidance..."
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpdateRemarks(modalTempRemarks);
                  setIsModalOpen(false);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-500/20 active:scale-95 transition-all"
              >
                Save Progress Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
