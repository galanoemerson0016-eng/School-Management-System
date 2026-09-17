import { Fragment, useMemo, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Printer, Plus, Minus, ChevronDown, Download, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../stores';
import type { Subject } from '../types';
import { resolveStudentQuarterGrade } from '../utils/grading-helpers';

type PaperSize = 'a4' | 'folio';
type GenderKey = 'male' | 'female' | 'total';
type StatusKey = 'promoted' | 'conditional' | 'retained';
type ProficiencyKey =
    | 'emerging'
    | 'developing'
    | 'connecting'
    | 'benchmarking'
    | 'advancing'
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
            emerging: createCounts(),
            developing: createCounts(),
            connecting: createCounts(),
            benchmarking: createCounts(),
            advancing: createCounts(),
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
        'emerging',
        'developing',
        'connecting',
        'benchmarking',
        'advancing',
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
        classRecords,
        hpsRecords,
        schoolProfile,
        activeSchoolYear,
        setCurrentView,
    } = useAppStore();

    const showNotification = useAppStore((s) => s.showNotification);
    const [paperSize, setPaperSize] = useState<PaperSize>('a4');
    const [previewZoom, setPreviewZoom] = useState<number>(0.8);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [showHeadSig, setShowHeadSig] = useState<boolean>(() => {
        return localStorage.getItem('formease_sf6_show_head_sig') !== 'false';
    });
    const [sigDropdownOpen, setSigDropdownOpen] = useState(false);
    const sigBtnRef = useRef<HTMLButtonElement>(null);

    const handlePrintSF6 = () => {
        const originalTitle = document.title;
        document.title = `SF6_${schoolProfile.name || 'School'}_${activeSchoolYear}`;
        window.print();
        document.title = originalTitle;
    };

    const handleDownloadSF6 = async () => {
        const filename = `SF6_${schoolProfile.name || 'School'}_${activeSchoolYear}.pdf`;

        const printPages = Array.from(document.querySelectorAll('.sf6-print-page')) as HTMLElement[];
        if (printPages.length === 0) {
            showNotification('Nothing to download.', 'error');
            return;
        }

        setIsDownloading(true);
        const parentTransforms: string[] = [];
        const parentsToRestore: HTMLElement[] = [];

        try {
            const html2canvas = (await import('html2canvas-pro')).default;
            const { jsPDF } = await import('jspdf');

            // Temporarily reset zoom scale transforms on the parent wrappers
            printPages.forEach(p => {
                const parent = p.parentElement;
                if (parent) {
                    parentTransforms.push(parent.style.transform);
                    parentsToRestore.push(parent);
                    parent.style.transform = 'none';
                }
            });

            // Force a layout reflow
            if (parentsToRestore.length > 0) {
                void parentsToRestore[0].offsetHeight;
            }

            // Derive PDF dimensions dynamically from the selected paperSize
            const paperWidthMm = paperSize === 'a4' ? 297 : 330.2;
            const paperHeightMm = paperSize === 'a4' ? 210 : 215.9;
            const pdfFormat = [paperWidthMm, paperHeightMm];

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: pdfFormat
            });

            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const margin = 4;
            const usableW = pageW - margin * 2;
            const usableH = pageH - margin * 2;
            const pdfRatio = usableW / usableH;

            for (let i = 0; i < printPages.length; i++) {
                if (i > 0) {
                    pdf.addPage(pdfFormat, 'landscape');
                }
                const pageEl = printPages[i];

                const canvas = await html2canvas(pageEl, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    onclone: (clonedDoc) => {
                        const style = clonedDoc.createElement('style');
                        style.innerHTML = `
                            ::-webkit-scrollbar {
                                display: none !important;
                            }
                            * {
                                scrollbar-width: none !important;
                                -ms-overflow-style: none !important;
                            }
                        `;
                        clonedDoc.head.appendChild(style);
                    }
                });

                const imgData = canvas.toDataURL('image/png');
                const canvasRatio = canvas.width / canvas.height;

                let imgW = usableW;
                let imgH = usableH;
                let xOffset = margin;
                let yOffset = margin;

                if (canvasRatio > pdfRatio) {
                    imgW = usableW;
                    imgH = usableW / canvasRatio;
                    yOffset = margin + (usableH - imgH) / 2;
                } else {
                    imgH = usableH;
                    imgW = usableH * canvasRatio;
                    xOffset = margin + (usableW - imgW) / 2;
                }

                pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgW, imgH);
            }

            pdf.save(filename);
            showNotification('SF6 Report downloaded successfully!', 'success');
        } catch (err) {
            console.error('Download failed:', err);
            showNotification('Failed to download SF6 Report. Please try again.', 'error');
        } finally {
            // Restore original parent transforms
            parentsToRestore.forEach((parent, idx) => {
                parent.style.transform = parentTransforms[idx] || '';
            });
            setIsDownloading(false);
        }
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

            const sectionSubjects = subjects.filter(s => (s.section_id === sectionMatch?.id || (s as Subject & { section_name?: string }).section_name === student.student_section) && s.term !== 'none');

            let finalGradesTotal = 0;
            let subjectsCount = 0;
            let failedCount = 0;

            sectionSubjects.forEach((subject) => {
                const quarterGrades: number[] = [];
                for (let q = 1; q <= 3; q++) {
                    const gradeVal = resolveStudentQuarterGrade(
                        student.lrn,
                        subject.id,
                        q,
                        activeSchoolYear,
                        classRecords,
                        gradingSheetRecords,
                        hpsRecords,
                        sectionMatch?.section_grade_level,
                        sectionMatch?.track
                    );
                    if (gradeVal > 0) {
                        quarterGrades.push(gradeVal);
                    }
                }

                if (quarterGrades.length > 0) {
                    const finalGrade = Math.round(quarterGrades.reduce((sum, g) => sum + g, 0) / quarterGrades.length);
                    finalGradesTotal += finalGrade;
                    subjectsCount += 1;
                    if (finalGrade < 75) failedCount += 1;
                }
            });

            if (subjectsCount === 0) return;

            const genAve = Math.round(finalGradesTotal / subjectsCount);

            if (failedCount === 0) addToCounts(bucket.status.promoted, gender);
            else if (failedCount <= 2) addToCounts(bucket.status.conditional, gender);
            else addToCounts(bucket.status.retained, gender);

            if (genAve < 65) addToCounts(bucket.proficiency.emerging, gender);
            else if (genAve <= 74) addToCounts(bucket.proficiency.developing, gender);
            else if (genAve <= 79) addToCounts(bucket.proficiency.connecting, gender);
            else if (genAve <= 89) addToCounts(bucket.proficiency.benchmarking, gender);
            else addToCounts(bucket.proficiency.advancing, gender);

            addToCounts(bucket.proficiency.total, gender);
        });

        const baseBuckets = BUCKET_DEFS.map((def) => bucketMap.get(def.id) || createSummaryBucket(def.id, def.label));
        const grandTotal = createSummaryBucket('total', 'TOTAL');
        baseBuckets.forEach((bucket) => addBucketData(grandTotal, bucket));

        return [...baseBuckets, grandTotal];
    }, [students, sections, subjects, gradingSheetRecords, classRecords, hpsRecords, activeSchoolYear]);

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
        <div className="flex flex-col h-full min-h-0 bg-slate-50 dark:bg-[#080d1a] relative overflow-hidden font-sans">
             <div className="z-20 bg-white/90 dark:bg-[#0d1225]/95 backdrop-blur-3xl border-b border-slate-200 dark:border-white/10 shadow-sm relative print:hidden shrink-0 w-full">
                <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-500 z-30" />
                <div className="h-12 px-2 flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
                    <div className="flex items-center gap-1.5 min-w-0 shrink-0">
                        <button 
                            onClick={() => setCurrentView('school-forms')}
                            className="w-7 h-7 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20 transition-all group shrink-0 active:scale-95 duration-200"
                            title="Back to Hub"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <h2 className="text-[8.5px] lg:text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                            SF6 Report
                        </h2>
                    </div>

                    <div className="h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0" />
                    
                    <div className="flex-1 min-w-1.5" />

                    <div className="flex items-center gap-1.5 shrink-0">
                        {/* Signatures Toggle */}
                        <div className="shrink-0">
                            <button
                                ref={sigBtnRef}
                                onClick={() => setSigDropdownOpen(prev => !prev)}
                                className="h-7 px-2 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 rounded-lg text-[7.5px] lg:text-[8.5px] font-black text-slate-900 dark:text-white flex items-center gap-1 transition-all duration-200 select-none"
                            >
                                <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                <span>Signatures</span>
                                <ChevronDown className={`w-2.5 h-2.5 text-slate-400 transition-transform duration-200 ${sigDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {sigDropdownOpen && createPortal(
                                <>
                                    <div className="fixed inset-0 z-9998" onClick={() => setSigDropdownOpen(false)} />
                                    <div
                                        className="fixed w-44 bg-white dark:bg-[#0d1225] border border-slate-200 dark:border-white/10 rounded-lg shadow-xl p-2.5 z-9999 space-y-2"
                                        style={(() => {
                                            const rect = sigBtnRef.current?.getBoundingClientRect();
                                            if (!rect) return { top: 0, left: 0 };
                                            return { top: rect.bottom + 4, left: Math.max(8, rect.right - 176) };
                                        })()}
                                    >
                                        <label className="flex items-center gap-2 cursor-pointer select-none text-[9px] font-bold text-slate-900 dark:text-white">
                                            <input
                                                type="checkbox"
                                                checked={showHeadSig}
                                                onChange={(e) => {
                                                    const val = e.target.checked;
                                                    setShowHeadSig(val);
                                                    localStorage.setItem('formease_sf6_show_head_sig', String(val));
                                                }}
                                                className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 focus:ring-offset-0 focus:ring-2"
                                            />
                                            <span>School Head Signature</span>
                                        </label>
                                    </div>
                                </>,
                                document.body
                            )}
                        </div>

                        {/* Paper Size */}
                        <div className="relative group shrink-0">
                            <select
                                value={paperSize}
                                onChange={(e) => {
                                    const size = e.target.value as PaperSize;
                                    setPaperSize(size);
                                    setPreviewZoom(size === 'a4' ? 1 : 0.9);
                                }}
                                className="appearance-none h-7 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 hover:bg-slate-200/60 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/20 rounded-lg px-1.5 pr-6 text-[7.5px] lg:text-[8.5px] font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-white/15 transition-all cursor-pointer w-16 lg:w-18 duration-200"
                            >
                                <option value="a4">A4</option>
                                <option value="folio">Folio</option>
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                        </div>

                        <div className="h-5 w-px bg-slate-200 dark:bg-white/10 shrink-0" />

                        {/* Zoom Control */}
                        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-white/10 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 shrink-0">
                            <button 
                                onClick={() => setPreviewZoom(prev => Math.max(0.4, prev - 0.1))}
                                className="w-5.5 h-5.5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/15 rounded transition-all shadow-xs active:scale-90 duration-200"
                                title="Zoom Out"
                            >
                                <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-[7.5px] font-black text-slate-900 dark:text-white w-6.5 text-center tabular-nums">
                                {Math.round(previewZoom * 100)}%
                            </span>
                            <button 
                                onClick={() => setPreviewZoom(prev => Math.min(1.5, prev + 0.1))}
                                className="w-5.5 h-5.5 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-all shadow-xs active:scale-90 duration-200"
                                title="Zoom In"
                            >
                                <Plus className="w-2.5 h-2.5" />
                            </button>
                        </div>

                        {/* Download PDF Button */}
                        <button
                            onClick={handleDownloadSF6}
                            disabled={isDownloading}
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center group duration-200"
                            title="Download PDF"
                        >
                            <Download className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                        </button>

                        {/* Print Primary Button */}
                        <button
                            onClick={handlePrintSF6}
                            className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center group duration-200"
                            title="Print Official SF6"
                        >
                            <Printer className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
             </div>

            {/* Main Workspace Area */}
            <div className="flex-1 overflow-auto relative bg-slate-100 dark:bg-[#080d1a] print:bg-white custom-scrollbar">
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
                                        className="w-23 h-23 object-contain shrink-0 mt-0.5"
                                    />

                                    <div className="flex-1">
                                        <div className="text-center leading-tight mt-0">
                                            <h1 className="text-[22px] font-black tracking-tight">School Form 6 (SF6)</h1>
                                            <h2 className="text-[20px] font-black tracking-tight mt-0.5">Summarized Report on Promotion and Learning Progress & Achievement</h2>
                                            <p className="text-[10px] italic mt-0.5">Revised to conform with the instructions of DepEd Order 15, s. 2026</p>
                                        </div>

                                        <div className="mt-2.5 text-[11px] space-y-2">
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-17 text-right text-black font-bold uppercase tracking-tighter">School ID</span>
                                                    <div className="w-33.75 h-7 border border-black bg-transparent px-1.5 flex items-center font-black">{schoolProfile.school_id || ''}</div>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-13 text-right text-black font-bold uppercase tracking-tighter">Region</span>
                                                    <div className="w-30 h-7 border border-black bg-transparent px-1.5 flex items-center font-black">{schoolProfile.region || ''}</div>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-14 text-right text-black font-bold uppercase tracking-tighter">Division</span>
                                                    <div className="w-46.25 h-7 border border-black bg-transparent px-1.5 flex items-center font-black">{schoolProfile.division || ''}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-center gap-3">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-19.5 text-right text-black font-bold uppercase tracking-tighter">School Name</span>
                                                    <div className="w-97.5 h-7 border border-black bg-transparent px-1.5 flex items-center font-black">{schoolProfile.name || ''}</div>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-11.5 text-right text-black font-bold uppercase tracking-tighter">District</span>
                                                    <div className="w-46.25 h-7 border border-black bg-transparent px-1.5 flex items-center font-black">{schoolProfile.district || ''}</div>
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                     <span className="w-21 text-right text-black font-bold uppercase tracking-tighter whitespace-nowrap">School Year</span>
                                                     <div className="w-19.25 h-7 border border-black bg-transparent px-1.5 flex items-center font-black">{activeSchoolYear}</div>
                                                 </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <table className="w-full border-collapse table-fixed text-[9px] leading-tight mt-2">
                                <thead>
                                    <tr className="h-14">
                                        <th className="border border-black p-0.5 font-bold" rowSpan={2} style={{ width: '14.5%' }}>
                                            SUMMARY TABLE
                                        </th>
                                        {buckets.map((bucket) => (
                                            <th key={bucket.id} className="border border-black p-0.5 font-bold" colSpan={3}>
                                                {bucket.label}
                                            </th>
                                        ))}
                                    </tr>
                                    <tr className="h-6.5">
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
                                    <tr className="h-6">
                                        <td className="border border-black p-0.5 font-bold uppercase">PROMOTED</td>
                                        {renderTripletCells((bucket) => bucket.status.promoted)}
                                    </tr>
                                    <tr className="h-6">
                                        <td className="border border-black p-0.5 font-bold uppercase">CONDITIONAL</td>
                                        {renderTripletCells((bucket) => bucket.status.conditional)}
                                    </tr>
                                    <tr className="h-6">
                                        <td className="border border-black p-0.5 font-bold uppercase">RETAINED</td>
                                        {renderTripletCells((bucket) => bucket.status.retained)}
                                    </tr>

                                    <tr className="h-12">
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

                                    <tr className="h-10">
                                        <td className="border border-black p-0.5 font-bold text-center uppercase">Emerging<br />(64 and below)</td>
                                        {renderTripletCells((bucket) => bucket.proficiency.emerging)}
                                    </tr>
                                    <tr className="h-10">
                                        <td className="border border-black p-0.5 font-bold text-center uppercase">Developing<br />(65-74)</td>
                                        {renderTripletCells((bucket) => bucket.proficiency.developing)}
                                    </tr>
                                    <tr className="h-10">
                                        <td className="border border-black p-0.5 font-bold text-center uppercase">Connecting<br />(75-79)</td>
                                        {renderTripletCells((bucket) => bucket.proficiency.connecting)}
                                    </tr>
                                    <tr className="h-10">
                                        <td className="border border-black p-0.5 font-bold text-center uppercase">Benchmarking<br />(80-89)</td>
                                        {renderTripletCells((bucket) => bucket.proficiency.benchmarking)}
                                    </tr>
                                    <tr className="h-10">
                                        <td className="border border-black p-0.5 font-bold text-center uppercase">Advancing<br />(90-100)</td>
                                        {renderTripletCells((bucket) => bucket.proficiency.advancing)}
                                    </tr>
                                    <tr className="h-8.5">
                                        <td className="border border-black p-0.5 font-bold text-center uppercase bg-slate-50/50">TOTAL</td>
                                        {renderTripletCells((bucket) => bucket.proficiency.total)}
                                    </tr>
                            </tbody>
                            </table>

                            <div className="px-3 py-1.5 text-[8px] italic border-t border-black">Revised as of 3/10/2016 SFRT</div>

                            <div className="px-3 pt-2 pb-1.5 text-[8px] grid grid-cols-3 gap-5 items-end">
                                <div>
                                    <p className="mb-1">Prepared and Submitted by:</p>
                                    <div className="relative h-10 flex flex-col justify-end items-center">
                                        {showHeadSig && schoolProfile?.head_signature_url && (
                                            <div className="absolute inset-x-0 bottom-3 h-9 flex items-center justify-center pointer-events-none z-10">
                                                <img 
                                                    src={schoolProfile.head_signature_url} 
                                                    alt="School Head Signature" 
                                                    className="max-h-full max-w-full object-contain" 
                                                />
                                            </div>
                                        )}
                                        <div className="text-center font-bold tracking-wide uppercase text-[9px] mb-0.5">
                                            {schoolProfile?.head_name || 'SCHOOL HEAD'}
                                        </div>
                                    </div>
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
            <style>{`
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
            `}</style>
         </div>
     );
 }
