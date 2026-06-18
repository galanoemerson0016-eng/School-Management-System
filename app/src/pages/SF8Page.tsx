import { useMemo, useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Printer, ChevronDown, Plus, Minus, HeartPulse, Download } from 'lucide-react';
import { useAppStore } from '../stores';
import type { Student } from '../types';

import { formatLearnerName } from '../utils/student-name';
import { getBMICategoryForAge, getHeightForAge as getHFAStatus } from '../utils/sf8ReferenceData';

function formatMonthYear(schoolYear: string) {
    return schoolYear || '2026-2027';
}

function getAge(studentBirthday?: string) {
    if (!studentBirthday) return '';
    const birthday = new Date(studentBirthday);
    if (Number.isNaN(birthday.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const m = today.getMonth() - birthday.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
        age--;
    }
    return age;
}

// SF8 displays age as years.months (e.g. 13 years 8 months = "13.08"), not a decimal fraction of a year.
function getAgeDisplay(studentBirthday?: string) {
    if (!studentBirthday) return '';
    const birthday = new Date(studentBirthday);
    if (Number.isNaN(birthday.getTime())) return '';
    const today = new Date();
    let years = today.getFullYear() - birthday.getFullYear();
    let months = today.getMonth() - birthday.getMonth();
    if (today.getDate() < birthday.getDate()) {
        months--;
    }
    if (months < 0) {
        years--;
        months += 12;
    }
    return `${years}.${months.toString().padStart(2, '0')}`;
}

type PaperSize = 'a4' | 'folio';

function getSectionGrade(sectionName: string) {
    const match = sectionName.match(/\d+/);
    return match ? Number(match[0]) : 0;
}

type HealthStudent = Student & {
    age?: number;
    weight?: number | string;
    height?: number | string;
    heightSquared?: number | string;
    bmi?: number | string;
    bmi_category?: string;
    hfa?: string;
    remarks?: string;
};

type NutritionalStatusKey = 'Severely Wasted' | 'Wasted' | 'Normal' | 'Overweight' | 'Obese';
type HfaKey = 'Severely Stunted' | 'Stunted' | 'Normal' | 'Tall';

const nutritionalStatusKeys: NutritionalStatusKey[] = ['Severely Wasted', 'Wasted', 'Normal', 'Overweight', 'Obese'];
const hfaKeys: HfaKey[] = ['Severely Stunted', 'Stunted', 'Normal', 'Tall'];



function parseHealthValue(value: string) {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function getBmiCategory(bmi: number, age: number, gender: string) {
    return getBMICategoryForAge(bmi, age, gender as 'Male' | 'Female');
}

function getHeightForAge(student: HealthStudent, heightMeters: number) {
    const age = typeof student.age === 'number' && Number.isFinite(student.age) && student.age > 0 ? student.age : getAge(student.birthday);
    const ageValue = typeof age === 'number' ? age : 0;
    const heightCm = heightMeters * 100;
    return getHFAStatus(heightCm, ageValue, student.gender as 'Male' | 'Female');
}

function getRemarks(bmiCategory: string, hfa: string) {
    if (bmiCategory === 'Severely Wasted' || hfa === 'Severely Stunted') return 'For Immediate Intervention';
    if (bmiCategory === 'Wasted' || hfa === 'Moderately Stunted' || hfa === 'Stunted') return 'For Monitoring';
    if (bmiCategory === 'Overweight' || bmiCategory === 'Obese') return 'Monitor Nutrition';
    return 'Normal';
}

function calculateHealthFields(student?: HealthStudent) {
    const weight = parseHealthValue(String(student?.weight ?? ''));
    const height = parseHealthValue(String(student?.height ?? ''));

    if (!student || !weight || !height || height <= 0) {
        return {
            weight: student?.weight ?? '',
            height: student?.height ?? '',
            heightSquared: '',
            bmi: '',
            bmi_category: '',
            hfa: '',
            remarks: '',
        };
    }

    const heightSquared = Math.round((height * height) * 100) / 100;
    const bmi = Math.round((weight / heightSquared) * 10) / 10;
    const age = typeof student.age === 'number' ? student.age : getAge(student.birthday);
    const bmiCategory = getBmiCategory(bmi, age || 0, student.gender);
    const hfa = getHeightForAge(student, height);

    return {
        weight: weight,
        height: height,
        heightSquared: heightSquared,
        bmi: bmi,
        bmi_category: bmiCategory,
        hfa,
        remarks: getRemarks(bmiCategory, hfa),
    };
}

function createCountMap<T extends string>(keys: T[]) {
    return keys.reduce((counts, key) => {
        counts[key] = 0;
        return counts;
    }, {} as Record<T, number>);
}

const SF8_SIGNATORIES_KEY_PREFIX = 'formease_sf8_signatories_';

interface SF8Signatories {
    dateOfAssessment: string;
    conductedBy: string;
    certifiedBy: string;
    reviewedBy: string;
}

function getEmptySignatories(): SF8Signatories {
    return { dateOfAssessment: '', conductedBy: '', certifiedBy: '', reviewedBy: '' };
}

function getEmptySummary() {
    return {
        males: 0,
        females: 0,
        total: 0,
        nutritional: {
            male: createCountMap(nutritionalStatusKeys),
            female: createCountMap(nutritionalStatusKeys),
            total: createCountMap(nutritionalStatusKeys),
        },
        hfa: {
            male: createCountMap(hfaKeys),
            female: createCountMap(hfaKeys),
            total: createCountMap(hfaKeys),
        },
    };
}

export function SF8Page() {
    const { students, sections, schoolProfile, activeSchoolYear, setCurrentView, updateStudent } = useAppStore();
    const [selectedSection, setSelectedSection] = useState('');
    const [paperSize, setPaperSize] = useState<PaperSize>('folio');
    const [zoom, setZoom] = useState(1);
    const [isDownloading, setIsDownloading] = useState(false);

    const sortedSections = useMemo(() => {
        return [...sections].sort((a, b) => {
            const gradeA = getSectionGrade(a.section_grade_level);
            const gradeB = getSectionGrade(b.section_grade_level);
            if (gradeA !== gradeB) return gradeA - gradeB;
            return a.section_name.localeCompare(b.section_name);
        });
    }, [sections]);

    const singleAvailableSection = sortedSections.length === 1 ? sortedSections[0] : null;
    const effectiveSelectedSection = selectedSection || (singleAvailableSection ? (singleAvailableSection.id || singleAvailableSection.section_name) : '');

    const selectedSectionObj = useMemo(() => {
        return sections.find(section => section.section_name === effectiveSelectedSection || section.id === effectiveSelectedSection) || null;
    }, [sections, effectiveSelectedSection]);

    const [signatories, setSignatories] = useState<SF8Signatories>(getEmptySignatories());
    const [loadedSignatoriesKey, setLoadedSignatoriesKey] = useState('');

    const signatoriesKey = useMemo(() => {
        const sectionKey = selectedSectionObj?.id || selectedSectionObj?.section_name || effectiveSelectedSection;
        return sectionKey ? `${SF8_SIGNATORIES_KEY_PREFIX}${activeSchoolYear}_${sectionKey}` : '';
    }, [selectedSectionObj, effectiveSelectedSection, activeSchoolYear]);

    if (signatoriesKey !== loadedSignatoriesKey) {
        setLoadedSignatoriesKey(signatoriesKey);
        if (!signatoriesKey) {
            setSignatories(getEmptySignatories());
        } else {
            try {
                const raw = localStorage.getItem(signatoriesKey);
                setSignatories(raw ? JSON.parse(raw) : getEmptySignatories());
            } catch {
                setSignatories(getEmptySignatories());
            }
        }
    }

    const handleSignatoryChange = (field: keyof SF8Signatories, value: string) => {
        setSignatories(prev => {
            const next = { ...prev, [field]: value };
            if (signatoriesKey) {
                try {
                    localStorage.setItem(signatoriesKey, JSON.stringify(next));
                } catch {
                    // ignore storage errors
                }
            }
            return next;
        });
    };

    const selectedStudents = useMemo(() => {
        if (!selectedSectionObj && !effectiveSelectedSection) return [];
        const sectionName = selectedSectionObj?.section_name || effectiveSelectedSection;
        const sectionId = selectedSectionObj?.id;
        return students
            .filter(student => student.student_section === sectionName || student.student_section === sectionId)
            .sort((a, b) => {
                if (a.gender !== b.gender) return a.gender.localeCompare(b.gender);
                return `${a.last_name}, ${a.first_name}`.localeCompare(`${b.last_name}, ${b.first_name}`);
            });
    }, [students, selectedSectionObj, effectiveSelectedSection]);

    const femaleStudents = selectedStudents.filter(student => student.gender === 'Female');
    const maleStudents = selectedStudents.filter(student => student.gender === 'Male');

    const summary = useMemo(() => {
        const result = getEmptySummary();

        selectedStudents.forEach((student) => {
            const healthFields = calculateHealthFields(student as HealthStudent);
            const genderBucket = student.gender === 'Female' ? 'female' : 'male';

            if (student.gender === 'Male') {
                result.males += 1;
            } else {
                result.females += 1;
            }
            result.total += 1;

            const bmiCategory = healthFields.bmi_category as NutritionalStatusKey | '';
            if (bmiCategory && nutritionalStatusKeys.includes(bmiCategory)) {
                result.nutritional[genderBucket][bmiCategory] += 1;
                result.nutritional.total[bmiCategory] += 1;
            }

            const hfaCategory = healthFields.hfa as HfaKey | '';
            if (hfaCategory && hfaKeys.includes(hfaCategory)) {
                result.hfa[genderBucket][hfaCategory] += 1;
                result.hfa.total[hfaCategory] += 1;
            }
        });

        return result;
    }, [selectedStudents]);

    const handlePrint = useCallback(() => {
        const sectionName = selectedSectionObj?.section_name || 'Record';
        const originalTitle = document.title;
        document.title = `SF8_${schoolProfile.name || 'School'}_${sectionName}_${formatMonthYear(activeSchoolYear)}_${paperSize.toUpperCase()}`;
        window.print();
        document.title = originalTitle;
    }, [selectedSectionObj, schoolProfile, activeSchoolYear, paperSize]);

    // Override Ctrl+P shortcut to use handlePrint
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                handlePrint();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlePrint]);

    const handleDownload = async () => {
        const sectionName = selectedSectionObj?.section_name || 'Record';
        const filename = `SF8_${schoolProfile.name || 'School'}_${sectionName}_${activeSchoolYear}.pdf`;
        const el = document.getElementById('sf8-printable-area');
        if (!el) return;

        setIsDownloading(true);
        el.classList.add('html-capture');
        try {
            if (window.electronAPI?.printToPDF) {
                await window.electronAPI.printToPDF({ defaultFilename: filename, autoSave: true });
            } else {
                const html2canvas = (await import('html2canvas-pro')).default;
                const { jsPDF } = await import('jspdf');

                // Temporarily reset zoom/scale transform for capture
                const prevTransform = el.style.transform || '';
                el.style.transform = 'none';

                const canvas = await html2canvas(el, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    onclone: (clonedDoc, clonedEl) => {
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

                        // Swap inputs to static spans to capture values
                        const origInputs = el.querySelectorAll('input');
                        const clonedInputs = clonedEl.querySelectorAll('input');
                        origInputs.forEach((origInput, idx) => {
                            const clonedInput = clonedInputs[idx];
                            if (clonedInput) {
                                const val = (origInput as HTMLInputElement).value || '';
                                const span = clonedDoc.createElement('span');
                                span.textContent = val;
                                span.className = clonedInput.className;
                                span.style.cssText = clonedInput.style.cssText;
                                span.style.display = 'flex';
                                span.style.alignItems = 'center';
                                span.style.justifyContent = 'center';
                                span.style.width = '100%';
                                span.style.height = '100%';
                                if (clonedInput.parentNode) {
                                    clonedInput.parentNode.replaceChild(span, clonedInput);
                                }
                            }
                        });
                    }
                });

                el.style.transform = prevTransform;

                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: paperSize === 'folio' ? 'legal' : 'a4'
                });

                const pageW = pdf.internal.pageSize.getWidth();
                const pageH = pdf.internal.pageSize.getHeight();
                const margin = 4;
                const usableW = pageW - margin * 2;
                const usableH = pageH - margin * 2;

                const canvasW = canvas.width;
                const canvasH = canvas.height;
                const scaleX = usableW / canvasW;
                const scaleY = usableH / canvasH;
                const scale = Math.min(scaleX, scaleY);

                const drawW = canvasW * scale;
                const drawH = canvasH * scale;
                const offsetX = margin + (usableW - drawW) / 2;
                const offsetY = margin;

                const imgData = canvas.toDataURL('image/png');
                pdf.addImage(imgData, 'PNG', offsetX, offsetY, drawW, drawH);
                pdf.save(filename);
            }
        } catch (error) {
            console.error('Failed to download PDF:', error);
        } finally {
            el.classList.remove('html-capture');
            setIsDownloading(false);
        }
    };

    const handleHealthFieldChange = async (student: HealthStudent, field: 'weight' | 'height', value: string) => {
        const parsedValue = parseHealthValue(value);
        const nextStudent = {
            ...student,
            [field]: parsedValue ?? '',
        } as HealthStudent;
        const calculated = calculateHealthFields(nextStudent);

        await updateStudent(student.lrn, {
            [field]: parsedValue ?? '',
            heightSquared: calculated.heightSquared,
            bmi: calculated.bmi,
            bmi_category: calculated.bmi_category,
            hfa: calculated.hfa,
            remarks: calculated.remarks,
        });
    };

    const renderStudentRows = (items: typeof selectedStudents) => {
        const rows = Array.from({ length: Math.max(items.length, 4) });

        return rows.map((_, index) => {
            const student = items[index] as HealthStudent | undefined;
            const healthFields = calculateHealthFields(student);
            const ageDisplay = student ? getAgeDisplay(student.birthday) : '';
            return (
                <tr key={student?.lrn || `blank-${index}`} className="border-b border-black hover:bg-slate-50/50 transition-colors">
                    <td className="border-r border-black text-center text-[10px] py-0.5 w-[4%] font-bold">{index + 1}</td>
                    <td className="border-r border-black text-center text-[10px] py-0.5 w-[8%] tracking-tighter">{student?.lrn || ''}</td>
                    <td className="border-r border-black text-[10px] py-0.5 w-[28%] leading-none px-2 whitespace-nowrap overflow-hidden font-black">
                        {student ? formatLearnerName(student).toUpperCase() : ''}
                    </td>
                    <td className="border-r border-black text-center text-[10px] py-0.5 w-[9%]">{student?.birthday || ''}</td>
                    <td className="border-r border-black text-center text-[10px] py-0.5 w-[4%] font-bold">{ageDisplay}</td>
                    <td className="border-r border-black text-center text-[10px] py-0.5 w-[5%]">
                        {student ? (
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={student.weight ?? ''}
                                onChange={(e) => handleHealthFieldChange(student, 'weight', e.target.value)}
                                className="w-full bg-blue-50/50 rounded px-1 text-center outline-none focus:bg-blue-100 transition-colors print:hidden font-bold"
                            />
                        ) : ''}
                        <span className="hidden print:inline">{healthFields.weight !== '' ? Number(healthFields.weight).toFixed(1) : ''}</span>
                    </td>
                    <td className="border-r border-black text-center text-[10px] py-0.5 w-[5%]">
                        {student ? (
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={student.height ?? ''}
                                onChange={(e) => handleHealthFieldChange(student, 'height', e.target.value)}
                                className="w-full bg-blue-50/50 rounded px-1 text-center outline-none focus:bg-blue-100 transition-colors print:hidden font-bold"
                            />
                        ) : ''}
                        <span className="hidden print:inline">{healthFields.height !== '' ? Number(healthFields.height).toFixed(2) : ''}</span>
                    </td>
                    <td className="border-r border-black text-center text-[10px] py-0.5 w-[5%]">{healthFields.heightSquared !== '' ? Number(healthFields.heightSquared).toFixed(2) : ''}</td>
                    <td className="border-r border-black text-center text-[10px] py-0.5 w-[5%] font-bold">{healthFields.bmi !== '' ? Number(healthFields.bmi).toFixed(1) : ''}</td>
                    <td className="border-r border-black text-center text-[10px] py-0.5 w-[8%] font-black text-blue-600 uppercase tracking-tighter">{healthFields.bmi_category}</td>
                    <td className="border-r border-black text-center text-[10px] py-0.5 w-[9%] font-black text-amber-600 uppercase tracking-tighter">{healthFields.hfa}</td>
                    <td className="text-center text-[10px] py-0.5 w-[10%] font-bold italic opacity-70">{healthFields.remarks}</td>
                </tr>
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
                        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0 select-none animate-pulse">
                            <HeartPulse className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-[11px] lg:text-[13px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1">SF8 Health</h2>
                            <p className="text-[8.5px] font-black text-blue-600 uppercase tracking-widest">Nutrition Report</p>
                        </div>
                    </div>

                    <div className="h-6 w-px bg-slate-200 shrink-0" />

                    {/* Section Selector */}
                    {!singleAvailableSection && (
                        <div className="relative group shrink-0">
                            <select 
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                className="appearance-none h-9 bg-slate-100 border border-slate-200 hover:bg-slate-200/60 hover:border-slate-300 rounded-xl px-2.5 pr-8 text-[10px] lg:text-[11px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all cursor-pointer min-w-[130px] lg:min-w-[150px] duration-200"
                            >
                                <option value="">Select Section</option>
                                {sortedSections.map(section => (
                                    <option key={section.id || section.section_name} value={section.id || section.section_name}>
                                        {section.section_grade_level} - {section.section_name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors" />
                        </div>
                    )}

                    <div className="flex-1 min-w-[12px]" />

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Paper Size Selector */}
                        <div className="relative group shrink-0">
                            <select
                                value={paperSize}
                                onChange={(e) => setPaperSize(e.target.value as PaperSize)}
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
                                onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))}
                                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm active:scale-90 duration-200"
                                title="Zoom Out"
                            >
                                <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] font-black text-slate-900 w-8 text-center tabular-nums">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button 
                                onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm active:scale-90 duration-200"
                                title="Zoom In"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Print Primary Button */}
                        <button
                            onClick={handlePrint}
                            disabled={!effectiveSelectedSection}
                            className="h-9 px-3.5 lg:px-4 rounded-xl bg-blue-600 text-white font-black text-[9px] uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/30 hover:scale-[1.01] hover:-translate-y-px active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1.5 group whitespace-nowrap duration-200"
                        >
                            <Printer className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                            Print Official SF8
                        </button>

                        {/* Download Button */}
                        <button
                            onClick={handleDownload}
                            disabled={!effectiveSelectedSection || isDownloading}
                            className="h-9 px-3.5 lg:px-4 rounded-xl bg-green-600 text-white font-black text-[9px] uppercase tracking-wider shadow-lg shadow-green-500/20 hover:bg-green-700 hover:shadow-green-500/30 hover:scale-[1.01] hover:-translate-y-px active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-1.5 group whitespace-nowrap duration-200"
                        >
                            {isDownloading ? (
                                <>
                                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                    Downloading…
                                </>
                            ) : (
                                <>
                                    <Download className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                                    Download PDF
                                </>
                            )}
                        </button>
                    </div>
                </div>
             </div>

             {/* Main Workspace Area */}
             <div className="flex-1 overflow-auto relative bg-slate-100 print:bg-white custom-scrollbar">
                {!effectiveSelectedSection ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-10 p-10 z-10">
                        <div className="relative">
                            <div className="absolute -inset-20 bg-blue-500/5 blur-[100px] rounded-full" />
                            <div className="relative w-48 h-48 bg-white rounded-[3rem] border border-slate-200 flex items-center justify-center transform rotate-6 border-dashed">
                                <HeartPulse className="w-20 h-20 text-slate-200" />
                                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-xl">
                                    <span className="text-2xl font-black text-blue-600 italic">SF8</span>
                                </div>
                            </div>
                        </div>
                        <div className="max-w-md space-y-4">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Health Report Hub</h2>
                            <p className="text-slate-500 font-bold leading-relaxed">
                                Please select a section from the toolbar above to generate the Learner&apos;s Basic Health and Nutrition Report.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="w-full min-h-full flex justify-center py-20 px-8 print:p-0 print:block overflow-x-auto">
                        <div 
                            className="transition-all duration-700 ease-out origin-top print:scale-100"
                            style={{ transform: `scale(${zoom})` }}
                        >
                            <div id="sf8-printable-area" className="sf8-page mx-auto w-full max-w-[1123px] bg-white text-black border border-black/10 shadow-[0_20px_50px_rgba(0,0,0,0.08)] print:shadow-none print:border-none">
                    <div className="sf8-page-content p-3 sm:p-4 flex flex-col">
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <img src={`${import.meta.env.BASE_URL || '/'}deped_logo_left.png`} alt="DepEd" className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0" />
                            <div className="flex-1 text-center leading-tight px-1">
                                <p className="text-[17px] sm:text-[20px] font-bold">Department of Education</p>
                                <p className="text-[16px] sm:text-[18px] font-bold">School Form 8 Learner&apos;s Basic Health and Nutrition Report (SF8)</p>
                                <p className="text-[13px] sm:text-[14px] italic">(For All Grade Levels)</p>
                            </div>
                            <img src={`${import.meta.env.BASE_URL}deped_logo_right.png`} alt="DepEd" className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0" />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[11px] sm:text-[12px] mb-2.5">
                            <div className="border border-black px-1.5 py-0.5 leading-none whitespace-nowrap overflow-hidden"><span className="font-bold">School Name:</span><span className="ml-1">{schoolProfile.name}</span></div>
                            <div className="border border-black px-1.5 py-0.5 leading-none whitespace-nowrap overflow-hidden"><span className="font-bold">District:</span><span className="ml-1">{schoolProfile.district}</span></div>
                            <div className="border border-black px-1.5 py-0.5 leading-none whitespace-nowrap overflow-hidden"><span className="font-bold">Division:</span><span className="ml-1">{schoolProfile.division}</span></div>
                            <div className="border border-black px-1.5 py-0.5 leading-none whitespace-nowrap overflow-hidden"><span className="font-bold">Region:</span><span className="ml-1">{schoolProfile.region}</span></div>
                            <div className="border border-black px-1.5 py-0.5 leading-none whitespace-nowrap overflow-hidden"><span className="font-bold">School ID:</span><span className="ml-1">{schoolProfile.school_id}</span></div>
                            <div className="border border-black px-1.5 py-0.5 leading-none whitespace-nowrap overflow-hidden"><span className="font-bold">Grade:</span><span className="ml-1">{selectedSectionObj?.section_grade_level || ''}</span></div>
                            <div className="border border-black px-1.5 py-0.5 leading-none whitespace-nowrap overflow-hidden"><span className="font-bold">Section:</span><span className="ml-1">{selectedSectionObj?.section_name || ''}</span></div>
                            <div className="border border-black px-1.5 py-0.5 leading-none whitespace-nowrap overflow-hidden"><span className="font-bold">School Year:</span><span className="ml-1">{activeSchoolYear}</span></div>
                        </div>

                        <div className="border border-black print:break-inside-auto">
                            <table className="w-full table-fixed border-collapse text-[11px] sm:text-[12px]">
                                <thead>
                                    <tr className="bg-slate-100 border-b border-black">
                                        <th className="border-r border-black py-1 w-[4%]">No.</th>
                                        <th className="border-r border-black py-1 w-[8%]">LRN</th>
                                        <th className="border-r border-black py-1 w-[30%]">Learner&apos;s Name</th>
                                        <th className="border-r border-black py-1 w-[9%]">Birthdate</th>
                                        <th className="border-r border-black py-1 w-[4%]">Age</th>
                                        <th className="border-r border-black py-1 w-[5%]">Weight (kg)</th>
                                        <th className="border-r border-black py-1 w-[5%]">Height (m)</th>
                                        <th className="border-r border-black py-1 w-[5%]">Height² (m²)</th>
                                        <th className="border-r border-black py-1 w-[5%]">BMI</th>
                                        <th className="border-r border-black py-1 w-[8%]">BMI Category</th>
                                        <th className="border-r border-black py-1 w-[9%]">Height for Age (HFA)</th>
                                        <th className="py-1 w-[8%]">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colSpan={12} className="border-y border-black bg-slate-200 font-bold text-left px-2 py-1 uppercase">Male</td>
                                    </tr>
                                    {renderStudentRows(maleStudents)}
                                    <tr>
                                        <td colSpan={12} className="border-y border-black bg-slate-200 font-bold text-left px-2 py-1 uppercase">Female</td>
                                    </tr>
                                    {renderStudentRows(femaleStudents)}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-3 print:break-inside-avoid">
                            <p className="sf8-summary-table-title text-center font-bold uppercase mb-2">Summary Table</p>
                            <table className="sf8-summary-table w-full table-fixed border-collapse text-[11px] sm:text-[12px] border border-black">
                                <thead>
                                    <tr className="bg-slate-100">
                                        <th className="border border-black px-2 py-1 text-center" rowSpan={2}>Sex</th>
                                        <th className="border border-black px-2 py-1 text-center" colSpan={6}>Nutritional Status</th>
                                        <th className="border border-black px-2 py-1 text-center" colSpan={5}>Height for Age (HFA)</th>
                                    </tr>
                                    <tr className="bg-slate-50">
                                        <th className="border border-black px-2 py-1 text-center">Severely Wasted</th>
                                        <th className="border border-black px-2 py-1 text-center">Wasted</th>
                                        <th className="border border-black px-2 py-1 text-center">Normal</th>
                                        <th className="border border-black px-2 py-1 text-center">Overweight</th>
                                        <th className="border border-black px-2 py-1 text-center">Obese</th>
                                        <th className="border border-black px-2 py-1 text-center">Total</th>
                                        <th className="border border-black px-2 py-1 text-center">Severely Stunted</th>
                                        <th className="border border-black px-2 py-1 text-center">Stunted</th>
                                        <th className="border border-black px-2 py-1 text-center">Normal</th>
                                        <th className="border border-black px-2 py-1 text-center">Tall</th>
                                        <th className="border border-black px-2 py-1 text-center">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-black px-2 py-1 font-bold text-center">Male</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.nutritional.male['Severely Wasted']}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.nutritional.male.Wasted}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.nutritional.male.Normal}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.nutritional.male.Overweight}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.nutritional.male.Obese}</td>
                                        <td className="border border-black px-2 py-1 font-bold text-center">{summary.males}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.hfa.male['Severely Stunted']}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.hfa.male.Stunted}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.hfa.male.Normal}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.hfa.male.Tall}</td>
                                        <td className="border border-black px-2 py-1 font-bold text-center">{summary.males}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black px-2 py-1 font-bold text-center">Female</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.nutritional.female['Severely Wasted']}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.nutritional.female.Wasted}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.nutritional.female.Normal}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.nutritional.female.Overweight}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.nutritional.female.Obese}</td>
                                        <td className="border border-black px-2 py-1 font-bold text-center">{summary.females}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.hfa.female['Severely Stunted']}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.hfa.female.Stunted}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.hfa.female.Normal}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.hfa.female.Tall}</td>
                                        <td className="border border-black px-2 py-1 font-bold text-center">{summary.females}</td>
                                    </tr>
                                    <tr className="font-bold bg-slate-50">
                                        <td className="border border-black px-2 py-1 text-center">Total</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.nutritional.total['Severely Wasted']}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.nutritional.total.Wasted}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.nutritional.total.Normal}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.nutritional.total.Overweight}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.nutritional.total.Obese}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.total}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.hfa.total['Severely Stunted']}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.hfa.total.Stunted}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.hfa.total.Normal}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.hfa.total.Tall}</td>
                                        <td className="border border-black px-2 py-1 text-center">{summary.total}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="sf8-signatories-section grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-[12px] sm:text-[13px] print:break-inside-avoid">
                            <div>
                                <p className="mb-1">Date of Assessment:</p>
                                <input
                                    type="text"
                                    value={signatories.dateOfAssessment}
                                    onChange={(e) => handleSignatoryChange('dateOfAssessment', e.target.value)}
                                    className="w-full bg-transparent border-b border-black h-7 px-1 text-center font-bold outline-none focus:bg-blue-50 print:bg-transparent"
                                />
                            </div>
                            <div>
                                <p className="mb-1">Conducted/Assessed By:</p>
                                <input
                                    type="text"
                                    value={signatories.conductedBy}
                                    onChange={(e) => handleSignatoryChange('conductedBy', e.target.value)}
                                    className="w-full bg-transparent border-b border-black h-7 px-1 text-center font-bold outline-none focus:bg-blue-50 print:bg-transparent"
                                />
                            </div>
                            <div>
                                <p className="mb-1">Certified Correct By:</p>
                                <input
                                    type="text"
                                    value={signatories.certifiedBy}
                                    onChange={(e) => handleSignatoryChange('certifiedBy', e.target.value)}
                                    className="w-full bg-transparent border-b border-black h-7 px-1 text-center font-bold outline-none focus:bg-blue-50 print:bg-transparent"
                                />
                            </div>
                            <div>
                                <p className="mb-1">Reviewed By:</p>
                                <input
                                    type="text"
                                    value={signatories.reviewedBy}
                                    onChange={(e) => handleSignatoryChange('reviewedBy', e.target.value)}
                                    className="w-full bg-transparent border-b border-black h-7 px-1 text-center font-bold outline-none focus:bg-blue-50 print:bg-transparent"
                                />
                            </div>
                        </div>

                        <p className="sf8-footer-text text-right italic mt-2 pt-2">SFRT 2017</p>
                    </div>
                </div>
            </div>
        </div>
    )}

            <style>{`
                #sf8-printable-area.html-capture input {
                    display: none !important;
                }
                #sf8-printable-area.html-capture .print\\:inline {
                    display: inline !important;
                }
                .sf8-summary-table-title {
                    font-size: 13px !important;
                    margin-bottom: 4px !important;
                }
                .sf8-summary-table th,
                .sf8-summary-table td {
                    padding-top: 2px !important;
                    padding-bottom: 2px !important;
                    font-size: 9.5px !important;
                    line-height: 1.1 !important;
                }
                .sf8-signatories-section {
                    margin-top: 10px !important;
                }
                .sf8-signatories-section p {
                    margin-bottom: 2px !important;
                    font-size: 11px !important;
                }
                .sf8-signatories-section input,
                .sf8-signatories-section span {
                    height: 22px !important;
                    font-size: 11px !important;
                }
                .sf8-footer-text {
                    font-size: 9.5px !important;
                    margin-top: 6px !important;
                    padding-top: 0px !important;
                }
                @media print {
                    @page { size: ${paperSize === 'folio' ? 'Folio portrait' : 'A4 portrait'}; margin: 0.15in; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .sf8-page {
                        width: 100%;
                        max-width: none;
                        border: none !important;
                        box-shadow: none !important;
                        transform: none;
                        transform-origin: top center;
                    }
                    .sf8-page-content {
                        min-height: auto;
                    }
                    .sf8-page table,
                    .sf8-page th,
                    .sf8-page td {
                        font-size: 9px !important;
                    }
                    .sf8-page th,
                    .sf8-page td {
                        padding-top: 1px !important;
                        padding-bottom: 1px !important;
                    }
                }
            `}</style>
        </div>
    </div>
    );
}
