import React from 'react';
import type { Student, SchoolProfile } from '../../types';
import type { PaceFormData, PaceRatingDescriptor } from '../../types/pace';
import { 
  PACE_DOMAINS, 
  MACRO_SKILL_COLORS, 
  UNASSESSED_CELL_GREY, 
  PACE_MASTER_CELL_COLORS,
  type PaceSubRow
} from '../../services/pace-template-config';
import { 
  PACE_LANGUAGE_DOMAINS, 
  PACE_LANGUAGE_MASTER_CELL_COLORS 
} from '../../services/pace-language-template-config';
import { PACE_MATH_TERM_SECTIONS } from '../../services/pace-math-template-config';
import { PACE_GMRC_MAKABANSA_SUBJECTS } from '../../services/pace-gmrc-makabansa-template-config';
import { formatLearnerName } from '../../utils/student-name';

interface PaceFormRendererProps {
  student: Student;
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section: string;
  adviser: string;
  paceData: PaceFormData;
  formType?: 'reading' | 'language' | 'math' | 'gmrc-makabansa';
  onSetRating?: (ratingId: string, term: 't1' | 't2' | 't3', value: PaceRatingDescriptor) => void;
  editable?: boolean;
}

export const PaceFormRenderer: React.FC<PaceFormRendererProps> = ({
  student,
  section,
  paceData,
  formType = 'reading',
  onSetRating,
  editable = true
}) => {
  const fullName = formatLearnerName(student).toUpperCase();

  const isGmrcMakabansaForm = formType === 'gmrc-makabansa';
  const isMathForm = formType === 'math';
  const isLanguageForm = formType === 'language';
  const currentDomains = isLanguageForm ? PACE_LANGUAGE_DOMAINS : PACE_DOMAINS;
  const currentMasterColors = isLanguageForm ? PACE_LANGUAGE_MASTER_CELL_COLORS : PACE_MASTER_CELL_COLORS;

  const leftDomains = currentDomains.filter(d => d.columnGroup === 'left');
  const rightDomains = currentDomains.filter(d => d.columnGroup === 'right');

  const getRating = (id: string, term: 't1' | 't2' | 't3') => {
    return paceData.ratings?.[id]?.[term] || '';
  };

  /**
   * Exact Master Cell Background Color Resolution
   */
  const getCellBg = (_domainId: string, subId: string, term: 't1' | 't2' | 't3', _ratingVal: string, _skillColor: string) => {
    return currentMasterColors[subId]?.[term] || UNASSESSED_CELL_GREY;
  };

  const renderRatingCell = (
    domainId: string,
    subId: string,
    _label: string,
    term: 't1' | 't2' | 't3',
    _termLabel: string,
    ratingVal: string,
    skillColor: string,
    isBorderRight: boolean = true
  ) => {
    const isInteractive = editable && !!onSetRating;

    return (
      <td
        className={`text-center font-bold p-0 align-middle w-5 text-[9.5px] h-3.5 ${
          isBorderRight ? 'border-r border-black' : ''
        }`}
        style={{ 
          backgroundColor: getCellBg(domainId, subId, term, ratingVal, skillColor),
          textAlign: 'center',
          verticalAlign: 'middle'
        }}
      >
        {isInteractive ? (
          <input
            type="text"
            value={ratingVal}
            maxLength={1}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              if (['A', 'B', 'C', 'D', 'E', ''].includes(val)) {
                onSetRating(subId, term, val as PaceRatingDescriptor);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' || e.key === 'Delete') {
                onSetRating(subId, term, '' as PaceRatingDescriptor);
              }
            }}
            onFocus={(e) => e.target.select()}
            style={{ textAlign: 'center' }}
            className="w-full h-full text-center font-black text-[9.5px] uppercase bg-transparent border-none outline-none focus:ring-1 focus:ring-amber-500 focus:bg-amber-100/70 print:bg-transparent cursor-text p-0 m-0 leading-none mx-auto block"
            title="Type A, B, C, D, or E"
          />
        ) : (
          <span style={{ textAlign: 'center' }} className="print:text-black font-black leading-none flex items-center justify-center h-full w-full text-center">{ratingVal}</span>
        )}
      </td>
    );
  };

  const renderSingleRatingCell = (itemId: string, ratingVal: string) => {
    const isInteractive = editable && !!onSetRating;

    return (
      <td 
        className="text-center font-bold p-0 align-middle w-12 text-[9.5px] h-4 bg-white border-l border-black"
        style={{ textAlign: 'center', verticalAlign: 'middle' }}
      >
        {isInteractive ? (
          <input
            type="text"
            value={ratingVal}
            maxLength={1}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              if (['A', 'B', 'C', 'D', 'E', ''].includes(val)) {
                onSetRating(itemId, 't1', val as PaceRatingDescriptor);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' || e.key === 'Delete') {
                onSetRating(itemId, 't1', '' as PaceRatingDescriptor);
              }
            }}
            onFocus={(e) => e.target.select()}
            style={{ textAlign: 'center' }}
            className="w-full h-full text-center font-black text-[9.5px] uppercase bg-transparent border-none outline-none focus:ring-1 focus:ring-amber-500 focus:bg-amber-100/70 cursor-text p-0 m-0 leading-none mx-auto block"
            title="Type A, B, C, D, or E"
          />
        ) : (
          <span style={{ textAlign: 'center' }} className="print:text-black font-black leading-none flex items-center justify-center h-full w-full text-center">{ratingVal}</span>
        )}
      </td>
    );
  };

  const renderDomainTable = (domains: typeof currentDomains) => (
    <table className="w-full border-collapse border border-black text-[8.5px]">
      <thead>
        <tr className="bg-[#002060] text-white border-b border-black font-bold text-center">
          <th className="w-6 border-r border-slate-300 p-1 align-middle">No.</th>
          <th className="p-1 border-r border-slate-300 text-center align-middle">Learning Competencies</th>
          <th colSpan={3} className="w-16 p-0 align-top">
            <div className="p-0.5 border-b border-slate-300 text-[8.5px] font-bold">Rating</div>
            <div className="grid grid-cols-3 text-[8px] font-bold">
              <span className="border-r border-slate-300 py-0.5">T1</span>
              <span className="border-r border-slate-300 py-0.5">T2</span>
              <span className="py-0.5">T3</span>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        {domains.map(domain => (
          <React.Fragment key={domain.id}>
            {/* Domain Sky-Blue Header Banner */}
            {domain.showBanner !== false && (
              <tr className="bg-[#83CAEB] font-bold text-black border-b border-black">
                <td colSpan={5} className="p-1 text-[8.5px] align-middle">
                  {domain.title} <span className="font-normal italic">({domain.subtitle})</span>
                </td>
              </tr>
            )}

            {domain.competencies.map((comp) => {
              if (!comp.hasSubItems) {
                // Single Competency Item
                const subRows = comp.subRows || [];
                const totalRows = subRows.length;

                return (
                  <React.Fragment key={`comp_${comp.id}`}>
                    {subRows.map((sub, idx: number) => {
                      const ratingT1 = getRating(sub.id, 't1');
                      const ratingT2 = getRating(sub.id, 't2');
                      const ratingT3 = getRating(sub.id, 't3');
                      const skillColor = MACRO_SKILL_COLORS[sub.skill] || '#FFE598';
                      const compLabel = `${comp.number}. ${comp.description} (${sub.skill})`;

                      return (
                        <tr key={sub.id} className="border-b border-black">
                          {idx === 0 && (
                            <>
                              <td
                                rowSpan={totalRows}
                                className="text-center font-normal border-r border-b border-black p-1 align-middle"
                              >
                                {comp.number}
                              </td>
                              <td
                                rowSpan={totalRows}
                                className="border-r border-b border-black p-1 text-black font-normal align-middle leading-tight"
                              >
                                {comp.description}
                              </td>
                            </>
                          )}
                          {renderRatingCell(domain.id, sub.id, compLabel, 't1', 'Term 1', ratingT1, skillColor, true)}
                          {renderRatingCell(domain.id, sub.id, compLabel, 't2', 'Term 2', ratingT2, skillColor, true)}
                          {renderRatingCell(domain.id, sub.id, compLabel, 't3', 'Term 3', ratingT3, skillColor, false)}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              }

              // Multi Sub-Item Competency
              const mainRowCount = comp.mainSubRows ? comp.mainSubRows.length : 1;
              const totalSubRows = (comp.subItems || []).reduce((acc, item) => acc + item.subRows.length, 0);
              const totalRows = mainRowCount + totalSubRows;

              return (
                <React.Fragment key={`comp_group_${comp.id}`}>
                  {/* Parent Title Row */}
                  {comp.mainSubRows ? (
                    comp.mainSubRows.map((sub: PaceSubRow, mIdx: number) => {
                      const ratingT1 = getRating(sub.id, 't1');
                      const ratingT2 = getRating(sub.id, 't2');
                      const ratingT3 = getRating(sub.id, 't3');
                      const skillColor = MACRO_SKILL_COLORS[sub.skill] || '#FFE598';
                      const mainLabel = `${comp.number}. ${comp.description} (${sub.skill})`;

                      return (
                        <tr key={sub.id} className="border-b border-black">
                          {mIdx === 0 && (
                            <>
                              <td
                                rowSpan={totalRows}
                                className="text-center font-normal border-r border-b border-black p-1 align-middle"
                              >
                                {comp.number}
                              </td>
                              <td
                                rowSpan={mainRowCount}
                                className="border-r border-black p-1 text-black font-normal align-middle leading-tight"
                              >
                                {comp.description}
                              </td>
                            </>
                          )}
                          {renderRatingCell(domain.id, sub.id, mainLabel, 't1', 'Term 1', ratingT1, skillColor, true)}
                          {renderRatingCell(domain.id, sub.id, mainLabel, 't2', 'Term 2', ratingT2, skillColor, true)}
                          {renderRatingCell(domain.id, sub.id, mainLabel, 't3', 'Term 3', ratingT3, skillColor, false)}
                        </tr>
                      );
                    })
                  ) : (
                    <tr className="border-b border-black">
                      <td
                        rowSpan={totalRows}
                        className="text-center font-normal border-r border-b border-black p-1 align-middle"
                      >
                        {comp.number}
                      </td>
                      <td className="border-r border-black p-1 text-black font-normal align-middle leading-tight">
                        {comp.description}
                      </td>
                      {renderRatingCell(domain.id, `${comp.id}_main`, `${comp.number}. ${comp.description}`, 't1', 'Term 1', getRating(`${comp.id}_main`, 't1'), UNASSESSED_CELL_GREY, true)}
                      {renderRatingCell(domain.id, `${comp.id}_main`, `${comp.number}. ${comp.description}`, 't2', 'Term 2', getRating(`${comp.id}_main`, 't2'), UNASSESSED_CELL_GREY, true)}
                      {renderRatingCell(domain.id, `${comp.id}_main`, `${comp.number}. ${comp.description}`, 't3', 'Term 3', getRating(`${comp.id}_main`, 't3'), UNASSESSED_CELL_GREY, false)}
                    </tr>
                  )}

                  {/* Sub-Items and their Macro Skill Sub-Rows */}
                  {comp.subItems?.map((item) => {
                    const itemSubRows = item.subRows;
                    const itemTotalRows = itemSubRows.length;

                    return (
                      <React.Fragment key={item.id}>
                        {itemSubRows.map((sub, idx: number) => {
                          const ratingT1 = getRating(sub.id, 't1');
                          const ratingT2 = getRating(sub.id, 't2');
                          const ratingT3 = getRating(sub.id, 't3');
                          const skillColor = MACRO_SKILL_COLORS[sub.skill] || '#FFE598';
                          const itemLabel = `${comp.number}. ${item.label} (${sub.skill})`;

                          return (
                            <tr key={sub.id} className="border-b border-black">
                              {idx === 0 && (
                                <td
                                  rowSpan={itemTotalRows}
                                  className="border-r border-b border-black p-1 text-black font-normal align-middle leading-tight pl-3"
                                >
                                  {item.label}
                                </td>
                              )}
                              {renderRatingCell(domain.id, sub.id, itemLabel, 't1', 'Term 1', ratingT1, skillColor, true)}
                              {renderRatingCell(domain.id, sub.id, itemLabel, 't2', 'Term 2', ratingT2, skillColor, true)}
                              {renderRatingCell(domain.id, sub.id, itemLabel, 't3', 'Term 3', ratingT3, skillColor, false)}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="relative">
      {/* Main Document Preview Container */}
      <div
        className="pace-form-container mx-auto bg-white text-black select-none border border-slate-400 shadow-md print:shadow-none print:border-none print:p-0 print:m-0"
        style={{
          width: '8.5in',
          minHeight: '11in',
          fontFamily: "'Bookman Old Style', Georgia, Cambria, 'Times New Roman', serif",
          fontSize: '9px',
          lineHeight: '1.2'
        }}
      >
        <div className="p-5">
          {/* Top Main Title */}
          <div className="text-center mb-3">
            <h1 className="text-[13px] font-black tracking-wide uppercase border-b-2 border-black pb-0.5 inline-block">
              PERFORMANCE AND COMPETENCY EVALUATION (PACE) FORM
            </h1>
          </div>

          {/* Header Info Fields: LRN, Name, Section */}
          <div className="flex items-center justify-between gap-4 text-[9.5px] font-semibold mb-3">
            <div className="flex items-center gap-1.5 flex-1">
              <span>LRN:</span>
              <span className="font-bold border-b border-black flex-1 min-h-3.5">
                {student.lrn || ''}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-2">
              <span>Name:</span>
              <span className="font-bold border-b border-black flex-1 min-h-3.5">
                {fullName || ''}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-1 justify-end">
              <span>Section:</span>
              <span className="font-bold border-b border-black min-w-15 text-center">
                {(section || 'SAMPLE').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Document Type Title Header Banner */}
          <div className="text-center font-black text-[12px] uppercase tracking-widest my-2">
            {isGmrcMakabansaForm
              ? 'GOOD MANNERS AND RIGHT CONDUCT (GMRC) & MAKABANSA'
              : isMathForm
              ? 'MATHEMATICS'
              : isLanguageForm
              ? 'LANGUAGE'
              : 'READING AND LITERACY'}
          </div>

          {/* Form Content Layout */}
          {isGmrcMakabansaForm ? (
            /* GMRC & MAKABANSA SINGLE FULL-WIDTH COLUMN LAYOUT */
            <div className="space-y-4">
              {PACE_GMRC_MAKABANSA_SUBJECTS.map((subj) => {
                const isGmrc = subj.id === 'gmrc-subject';

                return (
                  <div key={subj.id} className="border border-black font-sans text-[8.5px]">
                    {/* Subject Big Banner Header */}
                    <div className="bg-slate-200 text-center font-black text-[11px] uppercase tracking-wider py-1 border-b border-black">
                      {subj.subjectTitle}
                    </div>

                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[#D9D9D9] border-b border-black font-bold text-center">
                          <th className="w-8 border-r border-black p-1 align-middle">No.</th>
                          {isGmrc && (
                            <th className="w-48 border-r border-black p-1 align-middle text-left">
                              Nililinang na Pagpapahalaga
                            </th>
                          )}
                          <th className="p-1 text-center align-middle">
                            {isGmrc ? 'Learning Competencies' : 'Nililinang na Pagpapahalaga / Competencies'}
                          </th>
                          <th className="w-12 border-l border-black p-1 text-center align-middle">Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subj.terms.map((termSec) => (
                          <React.Fragment key={termSec.id}>
                            {/* Term Section Header (Term 1 / Term 2 / Term 3) */}
                            <tr className="bg-[#BCE2F5] font-black text-black border-b border-black text-[9.5px]">
                              <td colSpan={isGmrc ? 4 : 3} className="p-1 uppercase tracking-wide">
                                {termSec.termTitle}
                              </td>
                            </tr>

                            {termSec.competencies.map((comp) => {
                              if (!comp.hasSubItems) {
                                const ratingVal = getRating(comp.id, 't1');
                                return (
                                  <tr key={comp.id} className="border-b border-black hover:bg-slate-50">
                                    <td className="text-center font-normal border-r border-black p-1 align-middle">
                                      {comp.number}
                                    </td>
                                    {isGmrc && (
                                      <td className="border-r border-black p-1 font-normal text-black align-middle leading-tight italic">
                                        {comp.valueFocus}
                                      </td>
                                    )}
                                    <td className="p-1 text-black font-normal align-middle leading-tight">
                                      {comp.description}
                                    </td>
                                    {renderSingleRatingCell(comp.id, ratingVal)}
                                  </tr>
                                );
                              }

                              // Multi sub-item competency (e.g. Makabansa Item 1)
                              const totalRows = 1 + (comp.subItems?.length || 0);

                              return (
                                <React.Fragment key={`gmrc_comp_${comp.id}`}>
                                  {/* Parent Title Row */}
                                  <tr className="border-b border-black hover:bg-slate-50">
                                    <td
                                      rowSpan={totalRows}
                                      className="text-center font-normal border-r border-black p-1 align-middle"
                                    >
                                      {comp.number}
                                    </td>
                                    {isGmrc && comp.valueFocus && (
                                      <td className="border-r border-black p-1 font-normal text-black align-middle leading-tight italic">
                                        {comp.valueFocus}
                                      </td>
                                    )}
                                    <td className="p-1 text-black font-normal align-middle leading-tight">
                                      {comp.description}
                                    </td>
                                    {renderSingleRatingCell(`${comp.id}_main`, getRating(`${comp.id}_main`, 't1'))}
                                  </tr>

                                  {/* Sub-items */}
                                  {comp.subItems?.map((item) => {
                                    const itemRating = getRating(item.id, 't1');
                                    return (
                                      <tr key={item.id} className="border-b border-black hover:bg-slate-50">
                                        {isGmrc && <td className="border-r border-black p-1" />}
                                        <td className="p-1 text-black font-normal align-middle leading-tight pl-4">
                                          {item.label}
                                        </td>
                                        {renderSingleRatingCell(item.id, itemRating)}
                                      </tr>
                                    );
                                  })}
                                </React.Fragment>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          ) : isMathForm ? (
            /* MATHEMATICS SINGLE FULL-WIDTH COLUMN LAYOUT */
            <div className="border border-black font-sans text-[8.5px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#002060] text-white border-b border-black font-bold text-center">
                    <th className="w-8 border-r border-slate-300 p-1 align-middle">No.</th>
                    <th className="p-1 text-center align-middle">Learning Competencies</th>
                    <th className="w-12 border-l border-slate-300 p-1 text-center align-middle">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {PACE_MATH_TERM_SECTIONS.map((termSec) => (
                    <React.Fragment key={termSec.id}>
                      {/* Term Section Sky Blue Header (Term 1 / Term 2 / Term 3) */}
                      <tr className="bg-[#BCE2F5] font-black text-black border-b border-black text-[9.5px]">
                        <td colSpan={3} className="p-1 uppercase tracking-wide">
                          {termSec.termTitle}
                        </td>
                      </tr>

                      {termSec.domains.map((dom) => (
                        <React.Fragment key={dom.id}>
                          {/* Domain Title Header */}
                          <tr className="bg-[#DCE6F1] font-bold text-black border-b border-black text-[8.5px]">
                            <td colSpan={3} className="p-1 pl-2 italic">
                              {dom.title}
                            </td>
                          </tr>

                          {dom.competencies.map((comp) => {
                            if (!comp.hasSubItems) {
                              const ratingVal = getRating(comp.id, 't1');
                              return (
                                <tr key={comp.id} className="border-b border-black hover:bg-slate-50">
                                  <td className="text-center font-normal border-r border-black p-1 align-middle">
                                    {comp.number}
                                  </td>
                                  <td className="p-1 text-black font-normal align-middle leading-tight">
                                    {comp.description}
                                  </td>
                                  {renderSingleRatingCell(comp.id, ratingVal)}
                                </tr>
                              );
                            }

                            // Multi sub-item competency in Math (e.g. Item 9, 3, 8, 14)
                            const totalRows = 1 + (comp.subItems?.length || 0);

                            return (
                              <React.Fragment key={`math_comp_${comp.id}`}>
                                {/* Parent Title Row */}
                                <tr className="border-b border-black hover:bg-slate-50">
                                  <td
                                    rowSpan={totalRows}
                                    className="text-center font-normal border-r border-black p-1 align-middle"
                                  >
                                    {comp.number}
                                  </td>
                                  <td className="p-1 text-black font-normal align-middle leading-tight">
                                    {comp.description}
                                  </td>
                                  {renderSingleRatingCell(`${comp.id}_main`, getRating(`${comp.id}_main`, 't1'))}
                                </tr>

                                {/* Sub-items */}
                                {comp.subItems?.map((item) => {
                                  const itemRating = getRating(item.id, 't1');
                                  return (
                                    <tr key={item.id} className="border-b border-black hover:bg-slate-50">
                                      <td className="p-1 text-black align-middle leading-tight pl-4">
                                        {item.label}
                                      </td>
                                      {renderSingleRatingCell(item.id, itemRating)}
                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* READING & LITERACY / LANGUAGE TWO-COLUMN LAYOUT */
            <div className="grid grid-cols-2 gap-3 border-t border-black pt-2">
              {/* LEFT COLUMN TABLE */}
              <div className="flex flex-col">
                {renderDomainTable(leftDomains)}
              </div>

              {/* RIGHT COLUMN TABLE */}
              <div className="flex flex-col justify-between">
                {renderDomainTable(rightDomains)}

                {/* Macro Skill Legend Box matching exact template image */}
                <div className="mt-3 text-[8.5px]">
                  <p className="italic text-black mb-1.5 leading-snug text-[8px]">
                    <strong>Note:</strong> Each colored square represents a language macro skill. Refer to the legend to identify the skill, and write the learner's rating directly on the colored square for each term.
                  </p>
                  <table className="w-full border-collapse border border-black text-[8px]">
                    <thead>
                      <tr>
                        <th colSpan={4} className="border-b border-black text-center font-bold py-0.5 tracking-wider uppercase bg-white">
                          LEGEND
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="w-6 border-r border-b border-black p-0 bg-[#FFE598] h-4"></td>
                        <td className="border-r border-b border-black px-2 py-0.5 font-medium text-black align-middle">
                          Listening
                        </td>
                        <td rowSpan={3} className="w-6 border-r border-black p-0 bg-[#C4E0B3]"></td>
                        <td rowSpan={3} className="px-2 py-1 font-medium text-black align-middle leading-tight">
                          Copying and Guided Writing in response to Comprehension Questions
                        </td>
                      </tr>
                      <tr>
                        <td className="w-6 border-r border-b border-black p-0 bg-[#C9A6E6] h-4"></td>
                        <td className="border-r border-b border-black px-2 py-0.5 font-medium text-black align-middle">
                          Speaking
                        </td>
                      </tr>
                      <tr>
                        <td className="w-6 border-r border-black p-0 bg-[#F7B083] h-4"></td>
                        <td className="border-r border-black px-2 py-0.5 font-medium text-black align-middle">
                          Reading
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
