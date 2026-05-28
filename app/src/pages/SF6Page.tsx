import { Fragment, useMemo, useState } from 'react';
import { ArrowLeft, Printer, Plus, Minus, ChevronDown, Award } from 'lucide-react';
import { useAppStore } from '../stores';

type PaperSize = 'a4' | 'folio';
type GenderKey = 'male' | 'female' | 'total';
type StatusKey = 'promoted' | 'conditional' | 'retained';
type ProficiencyKey =
    | 'didNotMeet'
    | 'fairlySatisfactory'
    | 'satisfactory'
    | 'verySatisfactory'
    | 'outstanding'
    | 'total';

interface GenderCounts {
    male: number;
    female: number;
    total: number;
}

interface BucketSummary {
    id: string;
    label: string;
    enrollment: GenderCounts;
    status: Record<StatusKey, GenderCounts>;
    proficiency: Record<ProficiencyKey, GenderCounts>;
}

const BUCKET_DEFS = [
    { id: 'g1g7', label: 'GRADE 1 /GRADE 7', grades: [1, 7] },
    { id: 'g2g8', label: 'GRADE 2 /GRADE 8', grades: [2, 8] },
    { id: 'g3g9', label: 'GRADE 3 /GRADE 9', grades: [3, 9] },
    { id: 'g4g10', label: 'GRADE 4 /GRADE 10', grades: [4, 10] },
    { id: 'g5g11', label: 'GRADE 5 /GRADE 11', grades: [5, 11] },
    { id: 'g6g12', label: 'GRADE 6 /GRADE 12', grades: [6, 12] },
];

function getGradeNumber(value: string): number {
    const match = value.match(/\d+/);
    return match ? Number(match[0]) : 0;
}

function createCounts(): GenderCounts {
    return { male: 0, female: 0, total: 0 };
}

function createSummaryBucket(id: string, label: string): BucketSummary {
    return {
        id,
        label,
        enrollment: createCounts(),
        status: {
            promoted: createCounts(),
            conditional: createCounts(),
            retained: createCounts(),
        },
        proficiency: {
            didNotMeet: createCounts(),
            fairlySatisfactory: createCounts(),
            satisfactory: createCounts(),
            verySatisfactory: createCounts(),
            outstanding: createCounts(),
            total: createCounts(),
        },
    };
}

function addToCounts(target: GenderCounts, gender: GenderKey) {
    target.total += 1;
    if (gender === 'male') target.male += 1;
    if (gender === 'female') target.female += 1;
}

function addBucketData(target: BucketSummary, source: BucketSummary) {
    const statusKeys: StatusKey[] = ['promoted', 'conditional', 'retained'];
    const proficiencyKeys: ProficiencyKey[] = [
        'didNotMeet',
        'fairlySatisfactory',
        'satisfactory',
        'verySatisfactory',
        'outstanding',
        'total',
    ];

    target.enrollment.male += source.enrollment.male;
    target.enrollment.female += source.enrollment.female;
    target.enrollment.total += source.enrollment.total;

    statusKeys.forEach((key) => {
        target.status[key].male += source.status[key].male;
        target.status[key].female += source.status[key].female;
        target.status[key].total += source.status[key].total;
    });

    proficiencyKeys.forEach((key) => {
        target.proficiency[key].male += source.proficiency[key].male;
        target.proficiency[key].female += source.proficiency[key].female;
        target.proficiency[key].total += source.proficiency[key].total;
    });
}

export function SF6Page() {
    const {
        students,
        sections,
        subjects,
        gradingSheetRecords,
        schoolProfile,
        activeSchoolYear,
        setCurrentView,
    } = useAppStore();

    const [paperSize, setPaperSize] = useState<PaperSize>('a4');
    const [previewZoom, setPreviewZoom] = useState<number>(1);

    const handlePrintSF6 = () => {
        const originalTitle = document.title;
        document.title = `SF6_${schoolProfile.name || 'School'}_${activeSchoolYear}`;
        window.print();
        document.title = originalTitle;
    };

    const buckets = useMemo(() => {
        const sectionById = new Map(sections.map((s) => [s.id, s]));
        const sectionByName = new Map(sections.map((s) => [s.section_name, s]));

        const bucketMap = new Map<string, BucketSummary>();
        BUCKET_DEFS.forEach((def) => {
            bucketMap.set(def.id, createSummaryBucket(def.id, def.label));
        });

        students.forEach((student) => {
            const sectionMatch = sectionById.get(student.student_section || '') || sectionByName.get(student.student_section || '');
            const gradeSource = sectionMatch?.section_grade_level || student.grade_level || '';
            const gradeNum = getGradeNumber(gradeSource);

            const bucketDef = BUCKET_DEFS.find((def) => def.grades.includes(gradeNum));
            if (!bucketDef) return;

            const bucket = bucketMap.get(bucketDef.id);
            if (!bucket) return;

            const genderValue = (student.gender || '').toLowerCase();
            const gender: GenderKey = genderValue === 'male' ? 'male' : genderValue === 'female' ? 'female' : 'total';

            addToCounts(bucket.enrollment, gender);

            const studentRecords = gradingSheetRecords.filter((record) => record.student_lrn === student.lrn);
            const recordsBySubject = new Map<string, typeof gradingSheetRecords>();

            studentRecords.forEach((record) => {
                if (!recordsBySubject.has(record.subject_id)) {
                    recordsBySubject.set(record.subject_id, []);
                }
                recordsBySubject.get(record.subject_id)?.push(record);
            });

            let finalGradesTotal = 0;
            let subjectsCount = 0;
            let failedCount = 0;

            recordsBySubject.forEach((records, subjectId) => {
                const linkedSubject = subjects.find((subject) => subject.id === subjectId);
                if (!linkedSubject || linkedSubject.term === 'none') return;

                const graded = records.filter((record) => (Number(record.final_grade) || 0) > 0);
                if (graded.length === 0) return;

                const average = graded.reduce((sum, item) => sum + (Number(item.final_grade) || 0), 0) / graded.length;
                const finalGrade = Math.round(average);

                finalGradesTotal += finalGrade;
                subjectsCount += 1;

                if (finalGrade < 75) failedCount += 1;
            });

            if (subjectsCount === 0) return;

            const genAve = Math.round(finalGradesTotal / subjectsCount);

            if (failedCount === 0) addToCounts(bucket.status.promoted, gender);
            else if (failedCount <= 2) addToCounts(bucket.status.conditional, gender);
            else addToCounts(bucket.status.retained, gender);

            if (genAve < 75) addToCounts(bucket.proficiency.didNotMeet, gender);
            else if (genAve <= 79) addToCounts(bucket.proficiency.fairlySatisfactory, gender);
            else if (genAve <= 84) addToCounts(bucket.proficiency.satisfactory, gender);
            else if (genAve <= 89) addToCounts(bucket.proficiency.verySatisfactory, gender);
            else addToCounts(bucket.proficiency.outstanding, gender);

            addToCounts(bucket.proficiency.total, gender);
        });

        const baseBuckets = BUCKET_DEFS.map((def) => bucketMap.get(def.id) || createSummaryBucket(def.id, def.label));
        const grandTotal = createSummaryBucket('total', 'TOTAL');
        baseBuckets.forEach((bucket) => addBucketData(grandTotal, bucket));

        return [...baseBuckets, grandTotal];
    }, [students, sections, subjects, gradingSheetRecords]);

    const renderTripletCells = (getCounts: (bucket: BucketSummary) => GenderCounts) => {
        return buckets.map((bucket) => {
            const counts = getCounts(bucket);
            return (
                <Fragment key={`${bucket.id}-triplet`}>
                    <td className="border border-black p-0.5 text-center">{counts.male || ''}</td>
                    <td className="border border-black p-0.5 text-center">{counts.female || ''}</td>
                    <td className="border border-black p-0.5 text-center">{counts.total || ''}</td>
                </Fragment>
            );
        });
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 relative overflow-hidden font-sans">
             {/* Sticky Premium Top Toolbar */}
             <div className="z-20 bg-white/90 backdrop-blur-3xl border-b border-slate-200 shadow-sm relative print:hidden shrink-0 w-full">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30" />
                <div className="h-16 px-3 lg:px-4 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar scroll-smooth">
                    <div className="flex items-center gap-2 min-w-0 shrink-0">
                        <button 
                            onClick={() => setCurrentView('school-forms')}
                            className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 hover:border-slate-300 transition-all group shrink-0 active:scale-95 duration-200"
                            title="Back to Hub"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0 select-none">
                            <Award className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-[11px] lg:text-[13px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1">SF6 Report</h2>
                            <p className="text-[8.5px] font-black text-blue-600 uppercase tracking-widest">Summarized Promotion</p>
                        </div>
                    </div>

                    <div className="h-6 w-px bg-slate-200 shrink-0" />
                    
                    <div className="flex-1 min-w-[12px]" />

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Paper Size */}
                        <div className="relative group shrink-0">
                            <select
                                value={paperSize}
                                onChange={(e) => {
                                    const size = e.target.value as PaperSize;
                                    setPaperSize(size);
                                    setPreviewZoom(size === 'a4' ? 1 : 0.9);
                                }}
                                className="appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-8 text-[10px] lg:text-[11px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer w-[80px] lg:w-[90px] duration-200"
                            >
                                <option value="a4">A4</option>
                                <option value="folio">Folio</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors" />
                        </div>

                        <div className="h-6 w-px bg-slate-200 shrink-0" />

                        {/* Zoom Control */}
                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0">
                            <button 
                                onClick={() => setPreviewZoom(prev => Math.max(0.4, prev - 0.1))}
                                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm active:scale-90 duration-200"
                                title="Zoom Out"
                            >
                                <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] font-black text-slate-900 w-8 text-center tabular-nums">
                                {Math.round(previewZoom * 100)}%
                            </span>
                            <button 
                                onClick={() => setPreviewZoom(prev => Math.min(1.5, prev + 0.1))}
                                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm active:scale-90 duration-200"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Print Primary Button */}
                        <button
                            onClick={handlePrintSF6}
                            className="h-9 px-3.5 lg:px-4 rounded-xl bg-blue-600 text-white font-black text-[9px] uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/30 hover:scale-[1.01] hover:-translate-y-px active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1.5 group whitespace-nowrap duration-200"
                        >
                            <Printer className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                            Print Official SF6
                        </button>
                    </div>
                </div>
             </div>

            {/* Main Workspace Area */}
            <div className="flex-1 overflow-auto relative bg-slate-100 print:bg-white custom-scrollbar">
                <div className="w-full min-h-full flex justify-center py-20 px-8 print:p-0 print:block overflow-x-auto">
                    <div
                        className="origin-top transition-all duration-700 ease-out print:scale-100"
                        style={{ transform: `scale(${previewZoom})` }}
                    >
                        <div
                            className={`bg-white text-black shadow-[0_20px_50px_rgba(0,0,0,0.08)] print:shadow-none p-3 print:p-[5mm] relative box-border font-sans print-landscape print:flex print:flex-col sf6-print-page ${
                                paperSize === 'a4' ? 'w-[297mm] min-h-[210mm] print-a4 sf6-a4-page' : 'w-[330mm] min-h-[216mm] print-legal'
                            }`}
                            style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                        >
                            <div className="px-3 pt-2 pb-2.5 border-b border-black">
                                <div className="flex items-start gap-3">
                                    <img
                                        src={`${import.meta.env.BASE_URL || '/'}deped_logo_left.png`}
                                        alt="DepEd Logo"
                                        className="w-[92px] h-[92px] object-contain shrink-0 mt-0.5"
                                    />

                                    <div className="flex-1">
                                        <div className="text-center leading-tight mt-0">
                                            <h1 className="text-[22px] font-black tracking-tight">School Form 6 (SF6)</h1>
                                            <h2 className="text-[20px] font-black tracking-tight mt-0.5">Summarized Report on Promotion and Learning Progress & Achievement</h2>
                                            <p className="text-[10px] italic mt-0.5">Revised to conform with the instructions of DepEd Order 8, s. 2015</p>
                                        </div>

                                        <div className="mt-2.5 text-[11px] space-y-2">
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-[68px] text-right text-slate-500 font-bold uppercase tracking-tighter">School ID</span>
                                                    <div className="w-[135px] h-7 border border-black bg-transparent px-1.5 flex items-center font-black">{schoolProfile.school_id || ''}</div>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-[52px] text-right text-slate-500 font-bold uppercase tracking-tighter">Region</span>
                                                    <div className="w-[120px] h-7 border border-black bg-transparent px-1.5 flex items-center font-black">{schoolProfile.region || ''}</div>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-[56px] text-right text-slate-500 font-bold uppercase tracking-tighter">Division</span>
                                                    <div className="w-[185px] h-7 border border-black bg-transparent px-1.5 flex items-center font-black">{schoolProfile.division || ''}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-center gap-3">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-[78px] text-right text-slate-500 font-bold uppercase tracking-tighter">School Name</span>
                                                    <div className="w-[390px] h-7 border border-black bg-transparent px-1.5 flex items-center font-black">{schoolProfile.name || ''}</div>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-[46px] text-right text-slate-500 font-bold uppercase tracking-tighter">District</span>
                                                    <div className="w-[185px] h-7 border border-black bg-transparent px-1.5 flex items-center font-black">{schoolProfile.district || ''}</div>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-[66px] text-right text-slate-500 font-bold uppercase tracking-tighter">School Year</span>
                                                    <div className="w-[95px] h-7 border border-black bg-transparent px-1.5 flex items-center font-black">{activeSchoolYear}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <table className="w-full border-collapse table-fixed text-[9px] leading-tight mt-2">
                                <thead>
                                    <tr className="h-[56px]">
                                        <th className="border border-black p-0.5 font-bold" rowSpan={2} style={{ width: '14.5%' }}>
                                            SUMMARY TABLE
                                        </th>
                                        {buckets.map((bucket) => (
                                            <th key={bucket.id} className="border border-black p-0.5 font-bold" colSpan={3}>
                                                {bucket.label}
                                            </th>
                                        ))}
                                    </tr>
                                    <tr className="h-[26px]">
                                        {buckets.map((bucket) => (
                                            <Fragment key={`${bucket.id}-gender-head`}>
                                                <th className="border border-black p-0.5 font-normal">MALE</th>
                                                <th className="border border-black p-0.5 font-normal">FEMALE</th>
                                                <th className="border border-black p-0.5 font-normal">TOTAL</th>
                                            </Fragment>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr className="h-[24px]">
                                        <td className="border border-black p-0.5 font-bold uppercase">PROMOTED</td>
                                        {renderTripletCells((bucket) => bucket.status.promoted)}
                                    </tr>
                                    <tr className="h-[24px]">
                                        <td className="border border-black p-0.5 font-bold uppercase">CONDITIONAL</td>
                                        {renderTripletCells((bucket) => bucket.status.conditional)}
                                    </tr>
                                    <tr className="h-[24px]">
                                        <td className="border border-black p-0.5 font-bold uppercase">RETAINED</td>
                                        {renderTripletCells((bucket) => bucket.status.retained)}
                                    </tr>

                                    <tr className="h-[48px]">
                                        <td className="border border-black p-0.5 font-bold text-center uppercase">
                                            LEARNING PROGRESS &<br />
                                            ACHIEVEMENT (based on Learners'<br />
                                            General Average)
                                        </td>
                                        {buckets.map((bucket) => (
                                            <Fragment key={`${bucket.id}-prog-head`}>
                                                <td className="border border-black p-0.5 text-center font-bold">MALE</td>
                                                <td className="border border-black p-0.5 text-center font-bold">FEMALE</td>
                                                <td className="border border-black p-0.5 text-center font-bold">TOTAL</td>
                                            </Fragment>
                                        ))}
                                    </tr>

                                    <tr className="h-[40px]">
                                        <td className="border border-black p-0.5 font-bold text-center uppercase">Did Not Meet Expectations<br />( 74 and below)</td>
                                        {renderTripletCells((bucket) => bucket.proficiency.didNotMeet)}
                                    </tr>
                                    <tr className="h-[40px]">
                                        <td className="border border-black p-0.5 font-bold text-center uppercase">Fairly Satisfactory<br />(75-79)</td>
                                        {renderTripletCells((bucket) => bucket.proficiency.fairlySatisfactory)}
                                    </tr>
                                    <tr className="h-[40px]">
                                        <td className="border border-black p-0.5 font-bold text-center uppercase">Satisfactory<br />(80-84)</td>
                                        {renderTripletCells((bucket) => bucket.proficiency.satisfactory)}
                                    </tr>
                                    <tr className="h-[40px]">
                                        <td className="border border-black p-0.5 font-bold text-center uppercase">Very Satisfactory<br />(85-89)</td>
                                        {renderTripletCells((bucket) => bucket.proficiency.verySatisfactory)}
                                    </tr>
                                    <tr className="h-[40px]">
                                        <td className="border border-black p-0.5 font-bold text-center uppercase">Outstanding<br />(90-100)</td>
                                        {renderTripletCells((bucket) => bucket.proficiency.outstanding)}
                                    </tr>
                                    <tr className="h-[34px]">
                                        <td className="border border-black p-0.5 font-bold text-center uppercase bg-slate-50/50">TOTAL</td>
                                        {renderTripletCells((bucket) => bucket.proficiency.total)}
                                    </tr>
                                </tbody>
                            </table>

                            <div className="px-3 py-1.5 text-[8px] italic border-t border-black">Revised as of 3/10/2016 SFRT</div>

                            <div className="px-3 pt-2 pb-1.5 text-[8px] grid grid-cols-3 gap-5 items-end">
                                <div>
                                    <p className="mb-4">Prepared and Submitted by:</p>
                                    <div className="border-t border-black text-center pt-1 uppercase font-black">SCHOOL HEAD</div>
                                </div>
                                <div>
                                    <p className="mb-4">Reviewed & Validated by:</p>
                                    <div className="border-t border-black text-center pt-1 uppercase font-black">DIVISION REPRESENTATIVE</div>
                                </div>
                                <div>
                                    <p className="mb-4">Noted by:</p>
                                    <div className="border-t border-black text-center pt-1 uppercase font-black">SCHOOLS DIVISION SUPERINTENDENT</div>
                                </div>
                            </div>

                            <div className="px-3 pb-2 text-[7px] leading-snug">
                                <p className="font-bold uppercase mb-0.5">Guidelines:</p>
                                <p>1. After receiving and validating the Report for Promotion submitted by the class adviser, the School Head shall compute the grade level total and school total.</p>
                                <p>2. This report together with the copy of Report for Promotion submitted by the class adviser shall be forwarded to the Division Office by the end of the school year.</p>
                                <p>3. The Report on Promotion per grade level is reflected in the End of School Year Report of GESP/GSSP.</p>
                                <p>4. Protocols of validation & submission is under the discretion of the Schools Division Superintendent.</p>
                            </div>
                         </div>
                     </div>
                 </div>
             </div>
            <style dangerouslySetInnerHTML={{ __html: `
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                @media print {
                    @page { 
                        size: ${paperSize === 'a4' ? 'A4 landscape' : '13in 8.5in'}; 
                        margin: 0.15in !important; 
                    }
                    html, body {
                        width: 100% !important;
                        height: auto !important;
                        background: #fff !important;
                        overflow: visible !important;
                    }
                    .sf6-print-page {
                        width: 100% !important;
                        height: auto !important;
                        min-height: auto !important;
                        zoom: 1 !important;
                        max-width: none !important;
                        margin: 0 auto !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                }
            ` }} />
         </div>
     );
 }
