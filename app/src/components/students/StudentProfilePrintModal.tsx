import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Download } from 'lucide-react';
import type { Student, Section } from '../../types';
import { useAppStore } from '../../stores';
import { exportElementsToPdf } from '../../utils/pdf-export';

interface Props {
    student: Student;
    section: Section | null;
    onClose: () => void;
}

export function StudentProfilePrintModal({ student, section, onClose }: Props) {
    const { schoolProfile, activeSchoolYear } = useAppStore();
    const [pageSize, setPageSize] = useState<'letter' | 'a4' | 'folio'>('a4');

    const modalRootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        document.documentElement.classList.add('print-profile-html');
        document.body.classList.add('print-profile-mode');

        // Hide every other <body> child while printing using inline styles.
        // Inline styles override the global print stylesheet (index.css), which
        // otherwise forces #root { display: block !important } and prints the
        // whole app behind the form. Covers both the Print button and Ctrl+P.
        const hidden: { el: HTMLElement; prev: string }[] = [];
        const handleBeforePrint = () => {
            Array.from(document.body.children).forEach((child) => {
                const el = child as HTMLElement;
                if (el === modalRootRef.current) return;
                if (el.tagName === 'STYLE' || el.tagName === 'SCRIPT') return;
                hidden.push({ el, prev: el.style.display });
                el.style.display = 'none';
            });
        };
        const handleAfterPrint = () => {
            hidden.forEach(({ el, prev }) => { el.style.display = prev; });
            hidden.length = 0;
        };
        window.addEventListener('beforeprint', handleBeforePrint);
        window.addEventListener('afterprint', handleAfterPrint);

        return () => {
            document.documentElement.classList.remove('print-profile-html');
            document.body.classList.remove('print-profile-mode');
            window.removeEventListener('beforeprint', handleBeforePrint);
            window.removeEventListener('afterprint', handleAfterPrint);
            handleAfterPrint();
        };
    }, []);

    const sizeConfigs = {
        letter: {
            width: '215.9mm',
            height: '279.4mm',
            label: 'Letter (8.5" x 11")',
        },
        a4: {
            width: '210mm',
            height: '297mm',
            label: 'A4 (8.27" x 11.69")',
        },
        folio: {
            width: '215.9mm',
            height: '330.2mm',
            label: 'Folio (8.5" x 13")',
        }
    };

    // Determine school department level based on student's grade level
    const gradeVal = student.grade_level || '';
    const gradeNum = parseInt(gradeVal.replace(/\D/g, '')) || 0;
    
    // Exact matching logic for Elem, JHS, SHS
    const isElem = gradeVal.toLowerCase().includes('kinder') || (gradeNum >= 1 && gradeNum <= 6);
    const isSHS = gradeNum >= 11 && gradeNum <= 12;
    const isJHS = gradeNum >= 7 && gradeNum <= 10;

    const departmentLabel = isElem 
        ? 'ELEMENTARY DEPARTMENT' 
        : isJHS 
        ? 'JUNIOR HIGH SCHOOL DEPARTMENT' 
        : 'SENIOR HIGH SCHOOL DEPARTMENT';

    const printContainerRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = async () => {
        if (!printContainerRef.current) return;
        await exportElementsToPdf({
            elements: [printContainerRef.current],
            paperSize: pageSize,
            orientation: 'portrait',
            filename: `${student.last_name}_${student.first_name}_Profile_Sheet`,
            title: `${student.last_name}, ${student.first_name} - Enrollment Profile Sheet`,
        });
    };

    // Format Birthday for grids
    const birthdayStr = student.birthday || '';
    const bdayParts = birthdayStr.split('-'); // YYYY-MM-DD
    const birthYear = bdayParts[0] || '';
    const birthMonth = bdayParts[1] || '';
    const birthDay = bdayParts[2] || '';

    // Split values into character arrays for LRN and birth date grids
    // Clean temporary LRNs to blank for printing
    const cleanLrn = (student.lrn?.startsWith('TEMP-') ? '' : student.lrn || '').trim();
    const lrnChars = cleanLrn.padEnd(12, ' ').split('');
    const monthChars = birthMonth.padStart(2, ' ').split('');
    const dayChars = birthDay.padStart(2, ' ').split('');
    const yearChars = birthYear.padStart(4, ' ').split('');

    // Format First Day of Attendance for grids
    let attDateStr = student.first_day_attendance || '2026-06-08';
    if (!attDateStr && student.enrollment_date) {
        const d = new Date(student.enrollment_date);
        if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dayVal = String(d.getDate()).padStart(2, '0');
            attDateStr = `${y}-${m}-${dayVal}`;
        }
    }
    const attParts = attDateStr.split('-');
    const attYear = attParts[0] || '';
    const attMonth = attParts[1] || '';
    const attDay = attParts[2] || '';
    const attMonthChars = attMonth.padStart(2, ' ').split('');
    const attDayChars = attDay.padStart(2, ' ').split('');
    const attYearChars = attYear.padStart(4, ' ').split('');

    // Adviser resolution
    const adviserName = section?.adviser_name || '';

    // Address parts
    const currentAddress = student.address || '';



    // Calculate BMI and Category
    const heightVal = parseFloat(student.height as string) || 0;
    const heightCm = heightVal > 0 ? (heightVal < 3 ? Math.round(heightVal * 100) : Math.round(heightVal)) : 0;
    const weightKg = parseFloat(student.weight as string) || 0;
    const weightStr = weightKg > 0 ? weightKg.toString() : '';

    const heightM = heightVal > 0 ? (heightVal >= 3 ? heightVal / 100 : heightVal) : 0;
    const bmiVal = heightM > 0 && weightKg > 0 ? (weightKg / (heightM * heightM)).toFixed(1) : '';
    const bmiCategory = student.bmi_category || (bmiVal ? 'Normal' : '');

    // Form audit list (suggestions for completeness check)
    const suggestions: string[] = [];
    if (!student.photo_url) {
        suggestions.push("Upload a 2x2 ID Photo to display it automatically in the document frame.");
    }
    if (!cleanLrn) {
        suggestions.push("This student is enrolled with names only (No LRN). Please register the official LRN when available.");
    }
    if (!student.birthday) {
        suggestions.push("Birthdate is missing. Specify it in the student file to populate the DOB grid.");
    }
    if (!student.address) {
        suggestions.push("Home address is empty. Complete it to fill in the parent and student address fields.");
    }
    if (!student.parent_contact && !student.contact_number) {
        suggestions.push("No mobile contact found. Add a parent or student phone number for emergency contacts.");
    }
    if (heightVal === 0 || weightKg === 0) {
        suggestions.push("Nutritional status (height and weight) is blank. Provide metrics to calculate BMI automatically.");
    }
    if (isSHS && (!student.track || !student.strand)) {
        suggestions.push("For Senior High, Track and Strand (Cluster) must be configured in the enrollment profile.");
    }
    if (!student.req_birth_cert || !student.req_report_card || !student.req_sf10) {
        suggestions.push("Dynamic Checklist indicates missing credentials (e.g. Birth Certificate, SF9 Card, or SF10). Check them off in the Edit modal once received.");
    }

    return createPortal(
        <div ref={modalRootRef} className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto student-profile-print-modal-root print:p-0 print:bg-white print:absolute print:inset-0 print:overflow-hidden">
            {/* Modal Container */}
            <div data-modal-container className="bg-slate-100 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto print:shadow-none print:bg-white print:max-h-full print:overflow-hidden print:rounded-none">
                
                {/* Header (Hidden when printing) */}
                <div data-print-header className="bg-white border-b border-slate-200 px-6 py-3.5 flex justify-between items-center sticky top-0 z-10 print:hidden shadow-sm flex-nowrap min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-deped-blue/10 rounded-xl text-deped-blue shrink-0">
                            <Printer className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex items-center gap-3 min-w-0">
                            <h3 className="text-sm font-black text-slate-800 tracking-tight whitespace-nowrap">Print Student Profile</h3>
                            <div className="h-4 w-px bg-slate-200 shrink-0" />
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border shrink-0 ${
                                isElem 
                                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                    : isJHS 
                                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                    : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}>
                                {isElem ? 'Elementary' : isJHS ? 'Junior High' : 'Senior High'}
                            </span>
                            <span className="text-xs text-slate-400 font-semibold truncate hidden md:inline">
                                {schoolProfile.name || 'Logon NHS'}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0 flex-nowrap">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Paper Size:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(e.target.value as 'letter' | 'a4' | 'folio')}
                                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl py-1.5 px-3 cursor-pointer outline-none hover:bg-slate-100 hover:border-slate-300 transition-all"
                            >
                                <option value="letter">Letter</option>
                                <option value="a4">A4</option>
                                <option value="folio">Folio</option>
                            </select>
                        </div>
                        
                        <div className="h-4 w-px bg-slate-200 shrink-0" />
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrint}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-deped-blue hover:bg-deped-blue/90 text-white rounded-xl font-bold text-xs transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer whitespace-nowrap"
                            >
                                <Printer className="w-3.5 h-3.5" /> Print
                            </button>
                            <button
                                onClick={handleDownload}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer whitespace-nowrap"
                            >
                                <Download className="w-3.5 h-3.5" /> Download
                            </button>
                        </div>

                        <div className="h-4 w-px bg-slate-200 shrink-0" />

                        <button
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer shrink-0"
                        >
                            <X className="w-4.5 h-4.5" />
                        </button>
                    </div>
                </div>

                {/* Print Preview Stage */}
                <div data-preview-stage className="p-8 flex flex-col items-center bg-slate-200/50 print:bg-white print:p-0">
                    
                    {/* The actual Printable Document */}
                    <div 
                        ref={printContainerRef}
                        data-print-container
                        className="bg-white border border-slate-300 shadow-xl text-slate-900 font-sans leading-tight relative print:border-0 print:shadow-none"
                        style={{
                            width: sizeConfigs[pageSize].width,
                            height: sizeConfigs[pageSize].height,
                            padding: pageSize === 'letter' ? '8mm 10mm' : '10mm 12mm',
                            boxSizing: 'border-box',
                            printColorAdjust: 'exact',
                            WebkitPrintColorAdjust: 'exact',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                        }}
                    >
                        {/* CSS Print Styles Scoped to this Component */}
                        <style>{`
                            @page {
                                size: ${pageSize === 'letter' ? 'letter portrait' : pageSize === 'a4' ? 'A4 portrait' : '8.5in 13in portrait'};
                                margin: 0;
                            }
                            @media print {
                                /* Hide the entire app shell; only the portaled modal prints.
                                 * The #root / .app-container selectors carry ID-level specificity
                                 * on purpose, to override the global print reset in index.css
                                 * (which forces #root { display: block !important }). */
                                html.print-profile-html body.print-profile-mode #root,
                                html.print-profile-html body.print-profile-mode .app-container,
                                html.print-profile-html body.print-profile-mode [id^="headlessui-portal-root"],
                                html.print-profile-html body.print-profile-mode [id^="radix-"] {
                                    display: none !important;
                                }
                                html.print-profile-html body.print-profile-mode > *:not(.student-profile-print-modal-root) {
                                    display: none !important;
                                }
                                html.print-profile-html,
                                body.print-profile-mode {
                                    width: auto !important;
                                    height: auto !important;
                                    min-height: 0 !important;
                                    max-height: none !important;
                                    overflow: visible !important;
                                    margin: 0 !important;
                                    padding: 0 !important;
                                    background: #ffffff !important;
                                }
                                /*
                                 * Flatten the modal wrapper chain to normal flow with
                                 * auto height. Forcing position:absolute + height:100% here
                                 * makes Chromium's print engine resolve the height against the
                                 * whole paginated document, producing trailing blank pages.
                                 */
                                .student-profile-print-modal-root,
                                [data-modal-container],
                                [data-preview-stage] {
                                    position: static !important;
                                    display: block !important;
                                    width: auto !important;
                                    height: auto !important;
                                    min-height: 0 !important;
                                    max-height: none !important;
                                    overflow: visible !important;
                                    margin: 0 !important;
                                    padding: 0 !important;
                                    box-sizing: border-box !important;
                                    border: none !important;
                                    box-shadow: none !important;
                                    background: #ffffff !important;
                                    backdrop-filter: none !important;
                                    -webkit-backdrop-filter: none !important;
                                }
                                [data-print-header] {
                                    display: none !important;
                                }
                                [data-print-container] {
                                    position: relative !important;
                                    width: ${sizeConfigs[pageSize].width} !important;
                                    height: ${sizeConfigs[pageSize].height} !important;
                                    min-height: ${sizeConfigs[pageSize].height} !important;
                                    max-height: ${sizeConfigs[pageSize].height} !important;
                                    padding: ${pageSize === 'letter' ? '8mm 10mm' : pageSize === 'a4' ? '10mm 12mm' : '10mm 12mm'} !important;
                                    margin: 0 auto !important;
                                    border: none !important;
                                    box-shadow: none !important;
                                    box-sizing: border-box !important;
                                    overflow: hidden !important;
                                    background: #ffffff !important;
                                    display: flex !important;
                                    flex-direction: column !important;
                                    justify-content: space-between !important;
                                    page-break-after: avoid !important;
                                    page-break-inside: avoid !important;
                                    break-after: avoid !important;
                                    break-inside: avoid !important;
                                }
                                .print-border-black {
                                    border-color: #000000 !important;
                                }
                            }
                            .grid-cell-box {
                                width: ${pageSize === 'letter' ? '3.8mm' : '4.4mm'};
                                height: ${pageSize === 'letter' ? '4.4mm' : '4.8mm'};
                                border: 0.25mm solid #000000;
                                display: inline-flex;
                                align-items: center;
                                justify-content: center;
                                font-family: monospace;
                                font-weight: bold;
                                font-size: ${pageSize === 'letter' ? '9px' : '10px'};
                                margin-right: 0.3mm;
                                background-color: #ffffff;
                            }

                            /* Dynamic Layout Compression to guarantee single page printing */
                            ${pageSize === 'letter' ? `
                                [data-print-container] {
                                    font-size: 10px !important;
                                    line-height: 1.15 !important;
                                }
                                [data-print-container] .mb-4 {
                                    margin-bottom: 0.35rem !important;
                                }
                                [data-print-container] .mb-3 {
                                    margin-bottom: 0.25rem !important;
                                }
                                [data-print-container] .mb-2 {
                                    margin-bottom: 0.15rem !important;
                                }
                                [data-print-container] .mt-8 {
                                    margin-top: 1rem !important;
                                }
                                [data-print-container] .mt-6 {
                                    margin-top: 0.75rem !important;
                                }
                                [data-print-container] .pt-4 {
                                    padding-top: 0.5rem !important;
                                }
                                [data-print-container] .pb-3 {
                                    padding-bottom: 0.4rem !important;
                                }
                                [data-print-container] .pb-2.5 {
                                    padding-bottom: 0.3rem !important;
                                }
                                [data-print-container] .py-1.5 {
                                    padding-top: 0.25rem !important;
                                    padding-bottom: 0.25rem !important;
                                }
                                [data-print-container] .gap-4 {
                                    gap: 0.5rem !important;
                                }
                                [data-print-container] .space-y-2 > :not([hidden]) ~ :not([hidden]) {
                                    margin-top: 0.25rem !important;
                                }
                                [data-print-container] .space-y-1.5 > :not([hidden]) ~ :not([hidden]) {
                                    margin-top: 0.2rem !important;
                                }
                                [data-print-container] .text-xs {
                                    font-size: 10px !important;
                                }
                                [data-print-container] .text-[10px] {
                                    font-size: 8.5px !important;
                                }
                                [data-print-container] .text-[11px] {
                                    font-size: 9.5px !important;
                                }
                                [data-print-container] .text-[15px] {
                                    font-size: 12px !important;
                                }
                                [data-print-container] img.object-contain {
                                    max-height: 14mm !important;
                                }
                                [data-print-container] .w-\\[18mm\\] {
                                    width: 14mm !important;
                                }
                                [data-print-container] .h-\\[18mm\\] {
                                    height: 14mm !important;
                                }
                                [data-print-container] .w-\\[38mm\\] {
                                    width: 32mm !important;
                                }
                                [data-print-container] .h-\\[38mm\\] {
                                    height: 32mm !important;
                                }
                                [data-print-container] .px-12 {
                                    padding-left: 1.5rem !important;
                                    padding-right: 1.5rem !important;
                                }
                                [data-print-container] .gap-16 {
                                    gap: 1.5rem !important;
                                }
                            ` : ''}

                            ${pageSize === 'a4' ? `
                                [data-print-container] {
                                    font-size: 11.2px !important;
                                    line-height: 1.25 !important;
                                }
                                [data-print-container] .mb-4 {
                                    margin-bottom: 0.6rem !important;
                                }
                                [data-print-container] .mb-3 {
                                    margin-bottom: 0.45rem !important;
                                }
                                [data-print-container] .mb-2 {
                                    margin-bottom: 0.3rem !important;
                                }
                                [data-print-container] .mt-8 {
                                    margin-top: 1.75rem !important;
                                }
                                [data-print-container] .pt-4 {
                                    padding-top: 0.9rem !important;
                                }
                                [data-print-container] .pb-3 {
                                    padding-bottom: 0.65rem !important;
                                }
                                [data-print-container] .pb-2.5 {
                                    padding-bottom: 0.5rem !important;
                                }
                                [data-print-container] .py-1.5 {
                                    padding-top: 0.4rem !important;
                                    padding-bottom: 0.4rem !important;
                                }
                                [data-print-container] .text-xs {
                                    font-size: 11.2px !important;
                                }
                                [data-print-container] .text-[10px] {
                                    font-size: 9.8px !important;
                                }
                                [data-print-container] .text-[11px] {
                                    font-size: 10.8px !important;
                                }
                                [data-print-container] .text-[15px] {
                                    font-size: 14.5px !important;
                                }
                                [data-print-container] img.object-contain {
                                    max-height: 17mm !important;
                                }
                                [data-print-container] .w-\\[18mm\\] {
                                    width: 17mm !important;
                                }
                                [data-print-container] .h-\\[18mm\\] {
                                    height: 17mm !important;
                                }
                                [data-print-container] .w-\\[38mm\\] {
                                    width: 36mm !important;
                                }
                                [data-print-container] .h-\\[38mm\\] {
                                    height: 36mm !important;
                                }
                                [data-print-container] .px-12 {
                                    padding-left: 2.5rem !important;
                                    padding-right: 2.5rem !important;
                                }
                                [data-print-container] .gap-16 {
                                    gap: 3rem !important;
                                }
                            ` : ''}

                            ${pageSize === 'folio' ? `
                                [data-print-container] {
                                    font-size: 11px !important;
                                    line-height: 1.2 !important;
                                }
                                [data-print-container] .mb-4 {
                                    margin-bottom: 0.5rem !important;
                                }
                                [data-print-container] .mb-3 {
                                    margin-bottom: 0.4rem !important;
                                }
                                [data-print-container] .mb-2 {
                                    margin-bottom: 0.25rem !important;
                                }
                                [data-print-container] .mt-8 {
                                    margin-top: 1.5rem !important;
                                }
                                [data-print-container] .pt-4 {
                                    padding-top: 0.75rem !important;
                                }
                                [data-print-container] .pb-3 {
                                    padding-bottom: 0.5rem !important;
                                }
                                [data-print-container] .pb-2.5 {
                                    padding-bottom: 0.4rem !important;
                                }
                                [data-print-container] .py-1.5 {
                                    padding-top: 0.35rem !important;
                                    padding-bottom: 0.35rem !important;
                                }
                                [data-print-container] .text-xs {
                                    font-size: 11px !important;
                                }
                                [data-print-container] .text-[10px] {
                                    font-size: 9.5px !important;
                                }
                                [data-print-container] .text-[11px] {
                                    font-size: 10.5px !important;
                                }
                                [data-print-container] .text-[15px] {
                                    font-size: 14px !important;
                                }
                                [data-print-container] img.object-contain {
                                    max-height: 16mm !important;
                                }
                                [data-print-container] .w-\\[18mm\\] {
                                    width: 16mm !important;
                                }
                                [data-print-container] .h-\\[18mm\\] {
                                    height: 16mm !important;
                                }
                                [data-print-container] .w-\\[38mm\\] {
                                    width: 35mm !important;
                                }
                                [data-print-container] .h-\\[38mm\\] {
                                    height: 35mm !important;
                                }
                                [data-print-container] .px-12 {
                                    padding-left: 2rem !important;
                                    padding-right: 2rem !important;
                                }
                                [data-print-container] .gap-16 {
                                    gap: 2rem !important;
                                }
                            ` : ''}
                        `}</style>

                        {/* Top Branding Section - Logon NHS format */}
                        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
                            <div className="flex items-center flex-1 min-w-0 mr-4">
                                <div className="flex gap-2 mr-4 shrink-0">
                                    <div className="w-[18mm] h-[18mm]">
                                        <img 
                                            src={`${import.meta.env.BASE_URL}deped_logo_left.png`} 
                                            alt="DepEd Logo" 
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                e.currentTarget.src = `${import.meta.env.BASE_URL}app-logo.png`;
                                            }}
                                        />
                                    </div>
                                    <div className="w-[18mm] h-[18mm] bg-slate-50 rounded-full border border-slate-200 flex items-center justify-center overflow-hidden">
                                        <img 
                                            src={schoolProfile.logo_url || `${import.meta.env.BASE_URL}school-logo.png`} 
                                            alt="School Logo" 
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 leading-tight">
                                    <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                                        Republic of the Philippines
                                    </div>
                                    <div className="text-[9px] font-black text-slate-800 uppercase leading-none">
                                        Department of Education
                                    </div>
                                    <div className="text-[9px] font-bold text-slate-700 uppercase leading-none mt-0.5">
                                        {schoolProfile.region || 'Region / Regional Office'}
                                    </div>
                                    <div className="text-[9px] font-extrabold text-slate-800 uppercase leading-none mt-0.5">
                                        {schoolProfile.division ? `Schools Division of ${(schoolProfile.division || '').replace(/schools division office of/i, '').replace(/schools division of/i, '').replace(/division of/i, '').trim().toUpperCase()}` : 'Schools Division Office'}
                                    </div>
                                    <div className="text-[9px] font-black text-slate-700 tracking-wide uppercase mt-1">
                                        <span className="text-slate-950 font-extrabold">{departmentLabel}</span>
                                    </div>
                                    <h1 className="text-[15px] font-black text-slate-950 uppercase tracking-tight leading-none my-1">
                                        {schoolProfile.name || 'NAME OF SCHOOL / INSTITUTION'}
                                    </h1>
                                    <p className="text-[9px] text-slate-600 font-bold uppercase">
                                        {schoolProfile.district ? `${schoolProfile.district} District, ` : ''}
                                        {[
                                            schoolProfile.municipality || schoolProfile.city,
                                            schoolProfile.province
                                        ].filter(Boolean).join(', ') || 'School Address (District, Municipality, Province)'}
                                    </p>
                                </div>
                            </div>
                            
                            {/* 2x2 ID Photo Frame on top right */}
                            <div className="shrink-0">
                                <div className="w-[38mm] h-[38mm] border border-slate-400 bg-slate-50 flex items-center justify-center relative overflow-hidden rounded-md shadow-inner">
                                    {student.photo_url ? (
                                        <img src={student.photo_url} alt="2x2 ID" className="w-full h-full object-cover animate-fade-in" />
                                    ) : (
                                        <div className="text-center p-2 select-none">
                                            <span className="text-[28px] text-slate-300 font-black block uppercase tracking-wide leading-none">2x2</span>
                                            <span className="text-[7.5px] text-slate-400 font-extrabold block uppercase tracking-widest mt-1.5">ID PHOTO HERE</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Grade / Section Metadata Banner */}
                        <div className="grid grid-cols-4 gap-4 border-b border-slate-400 pb-2.5 mb-4 text-[10px]">
                            <div>
                                <span className="font-extrabold text-slate-700">GRADE:</span> 
                                <span className="ml-1.5 font-black uppercase text-slate-950 border-b border-slate-800 pb-0.5 px-3 min-w-12.5 inline-block text-center">{student.grade_level}</span>
                            </div>
                            <div>
                                <span className="font-extrabold text-slate-700">SECTION:</span> 
                                <span className="ml-1.5 font-black uppercase text-slate-950 border-b border-slate-800 pb-0.5 px-3 min-w-20 inline-block text-center">{student.student_section || ''}</span>
                            </div>
                            <div>
                                <span className="font-extrabold text-slate-700">S.Y.:</span> 
                                <span className="ml-1.5 font-black uppercase text-slate-950 border-b border-slate-800 pb-0.5 px-3 min-w-17.5 inline-block text-center">{activeSchoolYear || ''}</span>
                            </div>
                            <div className="text-right">
                                <span className="font-extrabold text-slate-700">Today's Date:</span> 
                                <span className="ml-1.5 font-bold border-b border-slate-800 pb-0.5 px-2 text-slate-950">{new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</span>
                            </div>
                        </div>

                        {/* SECTION I: PERSONAL INFORMATION */}
                        <div className="mb-4">
                            <div className="bg-slate-950 text-white font-black text-xs px-3 py-1.5 uppercase tracking-wider mb-3 flex justify-between print-border-black">
                                <span>I. Personal Information</span>
                            </div>

                            <div className="space-y-2">
                                {/* Track & Cluster (SHS Only) */}
                                {isSHS && (
                                    <div className="grid grid-cols-12 gap-2 mb-2 items-baseline text-[10px]">
                                        <div className="col-span-6 flex items-baseline">
                                            <span className="font-black text-slate-900 uppercase shrink-0">TRACK:</span>
                                            <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-bold uppercase min-h-3.5">
                                                {student.track || ''}
                                            </span>
                                        </div>
                                        <div className="col-span-6 flex items-baseline">
                                            <span className="font-black text-slate-900 uppercase shrink-0">CLUSTER:</span>
                                            <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-bold uppercase min-h-3.5">
                                                {student.strand || ''}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Student Name Block */}
                                 <div className="flex gap-2 items-end mb-2 text-[10px]">
                                     <div className="shrink-0 pb-3">
                                         <span className="font-black text-slate-900 uppercase">NAME:</span>
                                     </div>
                                     <div className="flex-1 min-w-0">
                                         <span className="font-black text-slate-950 uppercase border-b border-slate-800 block pb-0.5 text-center leading-none min-h-3.5">{student.last_name}</span>
                                         <span className="text-[7.5px] text-slate-500 font-bold text-center block uppercase mt-0.5">(Family Name)</span>
                                     </div>
                                     <div className="flex-1 min-w-0">
                                         <span className="font-black text-slate-950 uppercase border-b border-slate-800 block pb-0.5 text-center leading-none min-h-3.5">{student.first_name}</span>
                                         <span className="text-[7.5px] text-slate-500 font-bold text-center block uppercase mt-0.5">(Given Name)</span>
                                     </div>
                                     <div className="flex-1 min-w-0">
                                         <span className="font-black text-slate-950 uppercase border-b border-slate-800 block pb-0.5 text-center leading-none min-h-3.5">{student.middle_name || ''}</span>
                                         <span className="text-[7.5px] text-slate-500 font-bold text-center block uppercase mt-0.5">(Middle Name)</span>
                                     </div>
                                     <div className="w-14 shrink-0">
                                         <span className="font-black text-slate-950 uppercase border-b border-slate-800 block pb-0.5 text-center leading-none min-h-3.5">{student.name_extension || ''}</span>
                                         <span className="text-[7.5px] text-slate-500 font-bold text-center block uppercase mt-0.5">(Extension)</span>
                                     </div>
                                     <div className="flex gap-2.5 pb-2.5 shrink-0">
                                         <label className="flex items-center gap-1 cursor-pointer font-bold text-[9px] text-slate-900">
                                             <input type="checkbox" checked={student.gender === 'Male'} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                             <span>MALE</span>
                                         </label>
                                         <label className="flex items-center gap-1 cursor-pointer font-bold text-[9px] text-slate-900">
                                             <input type="checkbox" checked={student.gender === 'Female'} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                             <span>FEMALE</span>
                                         </label>
                                     </div>
                                 </div>

                                {/* Date of Birth Grid, Age & LRN Grid */}
                                <div className="grid grid-cols-12 gap-2 items-center mb-2 text-[10px]">
                                    {/* DOB Grid */}
                                    <div className="col-span-5 flex items-center gap-1.5">
                                        <span className="font-black text-slate-900 uppercase shrink-0">Date of Birth:</span>
                                        <div className="flex items-center">
                                            {monthChars.map((c, i) => <span key={`m-${i}`} className="grid-cell-box">{c}</span>)}
                                            <span className="mx-0.5 font-bold text-slate-600">/</span>
                                            {dayChars.map((c, i) => <span key={`d-${i}`} className="grid-cell-box">{c}</span>)}
                                            <span className="mx-0.5 font-bold text-slate-600">/</span>
                                            {yearChars.map((c, i) => <span key={`y-${i}`} className="grid-cell-box">{c}</span>)}
                                        </div>
                                    </div>

                                    {/* Age */}
                                    <div className="col-span-2 flex items-center gap-1">
                                        <span className="font-black text-slate-900 uppercase shrink-0">Age:</span>
                                        <span className="grid-cell-box">{student.age >= 10 ? Math.floor(student.age / 10) : ' '}</span>
                                        <span className="grid-cell-box">{student.age % 10}</span>
                                    </div>

                                    {/* LRN Grid */}
                                    <div className="col-span-5 flex items-center gap-1.5 justify-end">
                                        <span className="font-black text-slate-900 uppercase shrink-0">LRN:</span>
                                        <div className="flex">
                                            {lrnChars.map((c, i) => <span key={`l-${i}`} className="grid-cell-box">{c}</span>)}
                                        </div>
                                    </div>
                                </div>

                                {/* Complete Home Address */}
                                <div className="grid grid-cols-12 gap-2 mb-2 items-baseline text-[10px]">
                                    <div className="col-span-12 flex items-baseline">
                                        <span className="font-black text-slate-900 uppercase shrink-0">Complete Home Address:</span>
                                        <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-bold uppercase min-h-3.5">
                                            {currentAddress}
                                        </span>
                                    </div>
                                </div>

                                {/* Email & Mobile */}
                                <div className="grid grid-cols-12 gap-2 mb-2 items-baseline text-[10px]">
                                    <div className="col-span-7 flex items-baseline">
                                        <span className="font-black text-slate-900 uppercase shrink-0">Email Address (student):</span>
                                        <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-bold min-h-3.5">
                                            {student.parent_email || ''}
                                        </span>
                                    </div>
                                    <div className="col-span-5 flex items-baseline">
                                        <span className="font-black text-slate-900 uppercase shrink-0">Mobile Number:</span>
                                        <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-mono font-bold min-h-3.5">
                                            {student.contact_number || ''}
                                        </span>
                                    </div>
                                </div>

                                {/* Academic background: Elementary, JHS, Kinder completed (Dynamically adjusted) */}
                                {isElem ? (
                                    /* Elementary - Kindergarten Center details */
                                    <>
                                        <div className="grid grid-cols-12 gap-2 mb-2 items-baseline text-[10px] border-t border-dashed border-slate-200 pt-2">
                                            <div className="col-span-12 flex items-baseline">
                                                <span className="font-black text-slate-900 uppercase shrink-0">Name of Kindergarten / Day Care Center COMPLETED:</span>
                                                <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-bold uppercase min-h-3.5">
                                                    {student.elementary_school || ''}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-12 gap-2 mb-2 items-baseline text-[10px]">
                                            <div className="col-span-8 flex items-baseline">
                                                <span className="font-black text-slate-900 uppercase shrink-0">Address of Center:</span>
                                                <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-bold uppercase min-h-3.5">
                                                    {student.elementary_school_address || ''}
                                                </span>
                                            </div>
                                            <div className="col-span-4 flex justify-end gap-3 pb-0.5">
                                                <label className="flex items-center gap-1 cursor-pointer font-bold text-[9px] text-slate-900">
                                                    <input type="checkbox" checked={student.elementary_school_type === 'Public'} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                                    <span>PUBLIC</span>
                                                </label>
                                                <label className="flex items-center gap-1 cursor-pointer font-bold text-[9px] text-slate-900">
                                                    <input type="checkbox" checked={student.elementary_school_type === 'Private'} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                                    <span>PRIVATE</span>
                                                </label>
                                            </div>
                                        </div>
                                    </>
                                ) : isJHS ? (
                                    /* JHS - Eligibility for Secondary Enrolment details */
                                    <>
                                        <div className="grid grid-cols-12 gap-2 mb-1.5 items-baseline text-[10px] border-t border-dashed border-slate-200 pt-2">
                                            <div className="col-span-12 font-black text-slate-900 uppercase">
                                                Eligibility for Secondary Enrolment
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-12 gap-2 mb-2 items-center text-[10px]">
                                            <div className="col-span-4 font-black text-slate-900 uppercase shrink-0">
                                                Basis of SF10 Eligibility:
                                            </div>
                                            <div className="col-span-8 flex justify-start gap-4">
                                                <label className="flex items-center gap-1 cursor-pointer font-bold text-[9px] text-slate-900">
                                                    <input type="checkbox" checked={!!student.is_elem_completer} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                                    <span>Elem. Completer</span>
                                                </label>
                                                <label className="flex items-center gap-1 cursor-pointer font-bold text-[9px] text-slate-900">
                                                    <input type="checkbox" checked={!!student.is_pept_passer} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                                    <span>PEPT Passer</span>
                                                </label>
                                                <label className="flex items-center gap-1 cursor-pointer font-bold text-[9px] text-slate-900">
                                                    <input type="checkbox" checked={!!student.is_als_passer} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                                    <span>ALS A&E Passer</span>
                                                </label>
                                                <label className="flex items-center gap-1 cursor-pointer font-bold text-[9px] text-slate-900">
                                                    <input type="checkbox" checked={!!student.is_other_eligibility} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                                    <span>Others</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-12 gap-2 mb-2 items-baseline text-[10px]">
                                            <div className="col-span-8 flex items-baseline">
                                                <span className="font-black text-slate-900 uppercase shrink-0">NAME OF ELEMENTARY COMPLETED:</span>
                                                <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-bold uppercase min-h-3.5">
                                                    {student.elementary_school || ''}
                                                </span>
                                            </div>
                                            <div className="col-span-4 flex items-baseline">
                                                <span className="font-black text-slate-900 uppercase shrink-0">School ID:</span>
                                                <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-bold uppercase min-h-3.5">
                                                    {student.elementary_school_id || ''}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-12 gap-2 mb-2 items-baseline text-[10px]">
                                            <div className="col-span-8 flex items-baseline">
                                                <span className="font-black text-slate-900 uppercase shrink-0">ADDRESS OF SCHOOL:</span>
                                                <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-bold uppercase min-h-3.5">
                                                    {student.elementary_school_address || ''}
                                                </span>
                                            </div>
                                            <div className="col-span-4 flex justify-end gap-3 pb-0.5">
                                                <label className="flex items-center gap-1 cursor-pointer font-bold text-[9px] text-slate-900">
                                                    <input type="checkbox" checked={student.elementary_school_type === 'Public'} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                                    <span>PUBLIC</span>
                                                </label>
                                                <label className="flex items-center gap-1 cursor-pointer font-bold text-[9px] text-slate-900">
                                                    <input type="checkbox" checked={student.elementary_school_type === 'Private'} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                                    <span>PRIVATE</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-12 gap-2 mb-2 items-baseline text-[10px]">
                                            <div className="col-span-4 flex items-baseline">
                                                <span className="font-black text-slate-900 uppercase shrink-0">Gen. Average:</span>
                                                <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-bold uppercase min-h-3.5">
                                                    {student.average_grade || ''}
                                                </span>
                                            </div>
                                            <div className="col-span-8 flex items-baseline">
                                                <span className="font-black text-slate-900 uppercase shrink-0">Citation (if any):</span>
                                                <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-bold uppercase min-h-3.5">
                                                    {student.citation || ''}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    /* Secondary Levels (SHS) - Elementary details */
                                    <>
                                        <div className="grid grid-cols-12 gap-2 mb-2 items-baseline text-[10px] border-t border-dashed border-slate-200 pt-2">
                                            <div className="col-span-12 flex items-baseline">
                                                <span className="font-black text-slate-900 uppercase shrink-0">Name of Elementary COMPLETED:</span>
                                                <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-bold uppercase min-h-3.5">
                                                    {student.elementary_school || ''}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-12 gap-2 mb-2 items-baseline text-[10px]">
                                            <div className="col-span-8 flex items-baseline">
                                                <span className="font-black text-slate-900 uppercase shrink-0">Address of School:</span>
                                                <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-bold uppercase min-h-3.5">
                                                    {student.elementary_school_address || ''}
                                                </span>
                                            </div>
                                            <div className="col-span-4 flex justify-end gap-3 pb-0.5">
                                                <label className="flex items-center gap-1 cursor-pointer font-bold text-[9px] text-slate-900">
                                                    <input type="checkbox" checked={student.elementary_school_type === 'Public'} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                                    <span>PUBLIC</span>
                                                </label>
                                                <label className="flex items-center gap-1 cursor-pointer font-bold text-[9px] text-slate-900">
                                                    <input type="checkbox" checked={student.elementary_school_type === 'Private'} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                                    <span>PRIVATE</span>
                                                </label>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* JHS Completed Section (SHS only) */}
                                {isSHS && (
                                    <>
                                        <div className="grid grid-cols-12 gap-2 mb-2 items-baseline text-[10px] border-t border-dashed border-slate-200 pt-1">
                                            <div className="col-span-12 flex items-baseline">
                                                <span className="font-black text-slate-900 uppercase shrink-0">Name of JHS COMPLETED:</span>
                                                <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-bold uppercase min-h-3.5">
                                                    {student.jhs_school_name || ''}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-12 gap-2 mb-2 items-baseline text-[10px]">
                                            <div className="col-span-8 flex items-baseline">
                                                <span className="font-black text-slate-900 uppercase shrink-0">Address of School:</span>
                                                <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-bold uppercase min-h-3.5">
                                                    {student.jhs_school_address || ''}
                                                </span>
                                            </div>
                                            <div className="col-span-4 flex justify-end gap-3 pb-0.5">
                                                <label className="flex items-center gap-1 cursor-pointer font-bold text-[9px] text-slate-900">
                                                    <input type="checkbox" checked={student.jhs_school_type === 'Public'} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                                    <span>PUBLIC</span>
                                                </label>
                                                <label className="flex items-center gap-1 cursor-pointer font-bold text-[9px] text-slate-900">
                                                    <input type="checkbox" checked={student.jhs_school_type === 'Private'} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                                    <span>PRIVATE</span>
                                                </label>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Other Personal Information: Height, Weight, BMI & Shirt Size */}
                                <div className="grid grid-cols-12 gap-2 mb-2 items-baseline text-[10px] border-t border-dashed border-slate-200 pt-2.5">
                                    <div className="col-span-3 shrink-0">
                                        <span className="font-black text-slate-900 uppercase">Other Personal Info:</span>
                                    </div>
                                    <div className="col-span-9 flex items-baseline justify-between pr-4">
                                        <div className="flex items-baseline">
                                            <span className="font-extrabold text-slate-700 shrink-0">BMI:</span>
                                            <span className="ml-1.5 border-b border-slate-800 px-2 font-mono font-black text-slate-900 min-h-3.5 text-center min-w-22.5">
                                                {bmiVal ? `${bmiVal} (${bmiCategory})` : '     '}
                                            </span>
                                        </div>
                                        <div className="flex items-baseline">
                                            <span className="font-extrabold text-slate-700 shrink-0">Height:</span>
                                            <span className="ml-1.5 border-b border-slate-800 px-2 font-mono font-bold text-slate-900 min-h-3.5 text-center min-w-15">
                                                {heightCm || '   '}
                                            </span>
                                            <span className="text-slate-600 font-extrabold ml-0.5 text-[8.5px]">cm.</span>
                                        </div>
                                        <div className="flex items-baseline">
                                            <span className="font-extrabold text-slate-700 shrink-0">Weight:</span>
                                            <span className="ml-1.5 border-b border-slate-800 px-2 font-mono font-bold text-slate-900 min-h-3.5 text-center min-w-15">
                                                {weightStr || '   '}
                                            </span>
                                            <span className="text-slate-600 font-extrabold ml-0.5 text-[8.5px]">kg.</span>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* PARENT / GUARDIAN INFORMATION */}
                        <div className="mb-4">
                            <div className="bg-slate-950 text-white font-black text-xs px-3 py-1.5 uppercase tracking-wider mb-3 print-border-black">
                                II. Parent / Guardian's Information
                            </div>
                            <div className="space-y-2">
                                <div className="grid grid-cols-12 gap-4 mb-1.5 items-baseline text-[10px]">
                                    <div className="col-span-6 flex items-baseline">
                                        <span className="font-black text-slate-900 uppercase shrink-0">Mother's Name:</span>
                                        <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-bold uppercase min-h-3.5">
                                            {student.mother_name || ''}
                                        </span>
                                    </div>
                                    <div className="col-span-6 flex items-baseline">
                                        <span className="font-black text-slate-900 uppercase shrink-0">Father's Name:</span>
                                        <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-bold uppercase min-h-3.5">
                                            {student.father_name || ''}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-12 gap-4 mb-1.5 items-baseline text-[10px]">
                                    <div className="col-span-6 flex items-baseline">
                                        <span className="font-black text-slate-900 uppercase shrink-0">Email Address:</span>
                                        <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-bold min-h-3.5">
                                            {student.parent_email || ''}
                                        </span>
                                    </div>
                                    <div className="col-span-6 flex items-baseline">
                                        <span className="font-black text-slate-900 uppercase shrink-0">Email Address:</span>
                                        <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-bold min-h-3.5">
                                            {student.parent_email || ''}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-12 gap-4 mb-1.5 items-baseline text-[10px]">
                                    <div className="col-span-6 flex items-baseline">
                                        <span className="font-black text-slate-900 uppercase shrink-0">Mobile Number:</span>
                                        <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-mono font-bold min-h-3.5">
                                            {student.parent_contact || ''}
                                        </span>
                                    </div>
                                    <div className="col-span-6 flex items-baseline">
                                        <span className="font-black text-slate-900 uppercase shrink-0">Mobile Number:</span>
                                        <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-mono font-bold min-h-3.5">
                                            {student.parent_contact || ''}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-12 gap-2 mb-1.5 items-baseline text-[10px]">
                                    <div className="col-span-12 flex items-baseline">
                                        <span className="font-black text-slate-900 uppercase shrink-0">Complete Address of Parents:</span>
                                        <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-bold uppercase min-h-3.5">
                                            {currentAddress}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-12 gap-4 items-baseline text-[10px]">
                                    <div className="col-span-6 flex items-baseline">
                                        <span className="font-black text-slate-900 uppercase shrink-0">Guardian's Name:</span>
                                        <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-bold uppercase min-h-3.5">
                                            {student.guardian_name || ''}
                                        </span>
                                    </div>
                                    <div className="col-span-6 flex items-baseline">
                                        <span className="font-black text-slate-900 uppercase shrink-0">Mobile Number:</span>
                                        <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-mono font-bold min-h-3.5">
                                            {student.guardian_name ? student.parent_contact || '' : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION II: ATTACHMENT OF DOCUMENTS & PHOTO */}
                        <div className="mb-4">
                            <div className="bg-slate-950 text-white font-black text-xs px-3 py-1.5 uppercase tracking-wider mb-3 print-border-black">
                                III. Attachment of Personal Documents | Credentials
                            </div>
                            <div className="grid grid-cols-12 gap-4">
                                {/* Checkboxes in 3 Columns (col-span-12) */}
                                <div className="col-span-12 grid grid-cols-3 gap-x-4 gap-y-1.5 text-[10px] leading-tight font-bold text-slate-950">
                                    {/* Column 1: Core Personal Documents */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={!!student.req_birth_cert} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                            <span>PSA / NSO Birth Certificate (Clear Copy)</span>
                                        </label>
                                        
                                        {isElem ? (
                                            <>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={!!student.eccd_checklist} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                                    <span>ECCD Development Checklist</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={!!student.kinder_completion_cert} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                                    <span>Kinder Completion Certificate</span>
                                                </label>
                                            </>
                                        ) : (
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={!!student.req_sf10} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                                <span className="flex items-center gap-2">
                                                    <span>Form 137 / SF10:</span>
                                                    <span className="flex items-center gap-1 font-normal text-[9px] text-slate-600">
                                                        <input type="checkbox" checked={isJHS || isSHS} readOnly className="w-3 h-3 accent-slate-900" />
                                                        <span>Elem</span>
                                                    </span>
                                                    <span className="flex items-center gap-1 font-normal text-[9px] text-slate-600">
                                                        <input type="checkbox" checked={isSHS} readOnly className="w-3 h-3 accent-slate-900" />
                                                        <span>JHS</span>
                                                    </span>
                                                </span>
                                            </label>
                                        )}

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={!!student.req_report_card} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                            <span>Final Report Card (SF9)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={!!student.req_good_moral} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                            <span>Good Moral Certificate (for Transferee)</span>
                                        </label>
                                    </div>

                                    {/* Column 2: Guidance & School Slips */}
                                    <div className="space-y-2 border-l border-dashed border-slate-200 pl-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={!!student.req_homeroom_guidance} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                            <span>Homeroom Guidance Form</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={!!student.req_brigada_eskwela} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                            <span>Brigada Eskwela Slip</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={heightVal > 0 && weightKg > 0} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                            <span>Body Mass Index (BMI) Slip</span>
                                        </label>
                                        <div className="flex items-baseline mt-1.5">
                                            <span className="font-extrabold text-slate-700 shrink-0">Other Forms:</span>
                                            <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-bold text-[9px] min-h-3.5">
                                                {student.other_credentials || ''}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Column 3: Enrolment, LIS status & BMI checkoff */}
                                    <div className="space-y-2 border-l border-dashed border-slate-200 pl-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={!!student.req_beef} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                            <span>Enrolment Form (Annex 1)</span>
                                        </label>
                                        
                                        {isSHS && (
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={!!student.req_undertaking} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                                <span>Confirmation Slip</span>
                                            </label>
                                        )}

                                        <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                                            <input type="checkbox" checked={!!student.req_1st_term || !!student.req_2nd_term || !!student.req_3rd_term} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                            <span>LIS ENROLLED</span>
                                        </label>
                                        
                                        <div className="pl-5 space-y-1 text-[9px] font-bold text-slate-600">
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input type="checkbox" checked={!!student.req_1st_term} readOnly className="w-3 h-3 accent-slate-900" />
                                                <span>TERM 1</span>
                                            </label>
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input type="checkbox" checked={!!student.req_2nd_term} readOnly className="w-3 h-3 accent-slate-900" />
                                                <span>TERM 2</span>
                                            </label>
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input type="checkbox" checked={!!student.req_3rd_term} readOnly className="w-3 h-3 accent-slate-900" />
                                                <span>TERM 3</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION III: OTHERS */}
                        <div className="mb-4">
                            <div className="bg-slate-950 text-white font-black text-xs px-3 py-1.5 uppercase tracking-wider mb-3 print-border-black">
                                IV. Others
                            </div>
                            
                            <div className="grid grid-cols-12 gap-4 text-[10px] leading-tight text-slate-950">
                                <div className="col-span-12 flex items-baseline">
                                    <span className="font-black text-slate-900 uppercase shrink-0">Is your family a beneficiary of 4Ps?</span>
                                    <label className="flex items-center gap-1.5 cursor-pointer font-bold ml-4">
                                        <input type="checkbox" checked={!!student.is_4ps} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                        <span>Yes</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer font-bold ml-4">
                                        <input type="checkbox" checked={!student.is_4ps} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                        <span>No</span>
                                    </label>
                                    <span className="font-bold text-slate-700 ml-6 shrink-0">If Yes, Household ID Number:</span>
                                    <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-bold min-h-3.5">
                                        {student.is_4ps ? student.household_id || '' : ''}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-4 mt-2.5 text-[10px] leading-tight items-baseline border-t border-dashed border-slate-200 pt-2.5">
                                <div className="col-span-12 font-black text-slate-900 uppercase">
                                    Status of Enrolment:
                                </div>
                                {/* Left Column: Regular, Irregular, Transferee details */}
                                <div className="col-span-7 space-y-2">
                                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-950">
                                            <input type="checkbox" checked={student.enrollment_type === 'Regular' || !student.enrollment_type} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                            <span>Regular</span>
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-950">
                                            <input type="checkbox" checked={student.enrollment_type === 'Irregular'} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                            <span>Irregular</span>
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-950">
                                            <input type="checkbox" checked={student.enrollment_type === 'Transferee'} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                            <span>Transferee</span>
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-950">
                                            <input type="checkbox" checked={student.enrollment_type === 'Balik-Aral'} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                            <span>Balik-Aral</span>
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-950">
                                            <input type="checkbox" checked={student.enrollment_type === 'ALS' || !!student.is_als} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                            <span>ALS</span>
                                        </label>
                                    </div>
                                    <div className="flex items-baseline">
                                        <span className="font-bold text-slate-700 shrink-0">School Last Attended:</span>
                                        <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-bold min-h-3.5">
                                            {isSHS ? student.jhs_school_name || '' : isJHS ? student.elementary_school || '' : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="font-bold text-slate-700 shrink-0">First Day of Attendance:</span>
                                        <div className="flex items-center">
                                            {attMonthChars.map((c, i) => <span key={`am-${i}`} className="grid-cell-box">{c}</span>)}
                                            <span className="mx-0.5 font-bold text-slate-600">/</span>
                                            {attDayChars.map((c, i) => <span key={`ad-${i}`} className="grid-cell-box">{c}</span>)}
                                            <span className="mx-0.5 font-bold text-slate-600">/</span>
                                            {attYearChars.map((c, i) => <span key={`ay-${i}`} className="grid-cell-box">{c}</span>)}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Right Column: ALS, Address and Semesters (SHS only) */}
                                <div className="col-span-5 border-l border-dashed border-slate-300 pl-4 space-y-2">
                                    {/* Removed ALS Enrolled checkbox since ALS is in the main list */}
                                    <label className="hidden">
                                        <input type="checkbox" checked={student.enrollment_type === 'ALS' || !!student.is_als} readOnly className="w-3.5 h-3.5 accent-slate-900" />
                                        <span></span>
                                    </label>
                                    <div className="flex items-baseline">
                                        <span className="font-bold text-slate-700 shrink-0">ALS Center Address:</span>
                                        <span className="ml-2 border-b border-slate-800 flex-1 px-1 font-bold min-h-3.5">
                                            {student.als_center_address || ''}
                                        </span>
                                    </div>
                                    

                                </div>
                            </div>
                        </div>

                        {/* SECTION IV: CERTIFICATION & SIGNATURES */}
                        <div className="mt-8 border-t border-slate-400 pt-4">
                            <p className="text-[9px] text-slate-600 font-extrabold italic text-center mb-6 uppercase tracking-wider">
                                I HEREBY CERTIFY that the information provided in this form is complete, true and correct to the best of my knowledge.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-16 px-12 mb-2">
                                <div className="text-center">
                                    <div className="border-b border-slate-900 pb-1 font-black uppercase text-[10px] text-slate-950 min-h-4">
                                        {student.first_name} {student.middle_name ? student.middle_name.charAt(0) + '.' : ''} {student.last_name} {student.name_extension || ''}
                                    </div>
                                    <div className="text-[8px] text-slate-500 font-extrabold uppercase mt-1">Signature Over Printed Name of Student</div>
                                </div>
                                <div className="text-center relative">
                                    {schoolProfile?.adviser_signature_url && (
                                        <div className="absolute left-1/2 -translate-x-1/2 bottom-4.5 w-24 h-12 flex items-center justify-center pointer-events-none z-10">
                                            <img 
                                                src={schoolProfile.adviser_signature_url} 
                                                alt="Adviser Signature" 
                                                className="max-h-full max-w-full object-contain" 
                                            />
                                        </div>
                                    )}
                                    <div className="border-b border-slate-900 pb-1 font-black uppercase text-[10px] text-slate-950 min-h-4">
                                        {adviserName}
                                    </div>
                                    <div className="text-[8px] text-slate-500 font-extrabold uppercase mt-1">Signature Over Printed Name of Adviser</div>
                                </div>
                            </div>
                        </div>

                        {/* Removed Footer Section & Suggestions Audit Panels per request */}
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
}
