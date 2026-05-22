import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Printer, ChevronDown, Plus, Minus, HeartPulse } from 'lucide-react';
import { useAppStore } from '../stores';
import type { Student } from '../types';

function formatMonthYear(schoolYear: string) {
    return schoolYear || '2026-2027';
}

function getAge(studentBirthday?: string) {
    if (!studentBirthday) return '';
    const birthday = new Date(studentBirthday);
    if (Number.isNaN(birthday.getTime())) return '';
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
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

function formatNumber(value: number, digits = 1) {
    return Number.isFinite(value) ? value.toFixed(digits).replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1') : '';
}

function parseHealthValue(value: string) {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function getBmiCategory(bmi: number) {
    if (bmi < 14) return 'Severely Wasted';
    if (bmi < 16) return 'Wasted';
    if (bmi < 24) return 'Normal';
    if (bmi < 27) return 'Overweight';
    return 'Obese';
}

function getHeightForAge(student: HealthStudent, heightMeters: number) {
    const age = typeof student.age === 'number' && Number.isFinite(student.age) && student.age > 0 ? student.age : getAge(student.birthday);
    const ageValue = typeof age === 'number' ? age : 0;
    const expectedCentimeters = (student.gender === 'Male' ? 50.5 : 49.5) + (ageValue * (student.gender === 'Male' ? 6.2 : 6.0));
    const heightCentimeters = heightMeters * 100;

    if (heightCentimeters <= expectedCentimeters - 10) return 'Severely Stunted';
    if (heightCentimeters <= expectedCentimeters - 5) return 'Stunted';
    if (heightCentimeters <= expectedCentimeters + 5) return 'Normal';
    return 'Tall';
}

function getRemarks(bmiCategory: string, hfa: string) {
    if (bmiCategory === 'Severely Wasted' || hfa === 'Severely Stunted') return 'For Immediate Intervention';
    if (bmiCategory === 'Wasted' || hfa === 'Stunted') return 'For Monitoring';
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

    const heightSquared = height * height;
    const bmi = weight / heightSquared;
    const bmiCategory = getBmiCategory(bmi);
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
    const [paperSize, setPaperSize] = useState<PaperSize>('a4');
    const [zoom, setZoom] = useState(1);

    const sortedSections = useMemo(() => {
        return [...sections].sort((a, b) => {
            const gradeA = getSectionGrade(a.section_grade_level);
            const gradeB = getSectionGrade(b.section_grade_level);
            if (gradeA !== gradeB) return gradeA - gradeB;
            return a.section_name.localeCompare(b.section_name);
        });
    }, [sections]);

    const groupedSections = useMemo(() => {
        const groups: Record<string, any[]> = {
            'ELEMENTARY': [],
            'JUNIOR HIGH SCHOOL': [],
            'SENIOR HIGH SCHOOL': []
        };
        
        sortedSections.forEach(s => {
            const gl = (s.section_grade_level || '').toLowerCase();
            const num = parseInt(gl.replace(/\D/g, '')) || 0;
            
            if (gl.includes('kinder') || (num >= 1 && num <= 6)) {
                groups['ELEMENTARY'].push(s);
            } else if (num >= 7 && num <= 10) {
                groups['JUNIOR HIGH SCHOOL'].push(s);
            } else if (num >= 11 && num <= 12) {
                groups['SENIOR HIGH SCHOOL'].push(s);
            }
        });
        
        return groups;
    }, [sortedSections]);

    const singleAvailableSection = sortedSections.length === 1 ? sortedSections[0] : null;
    const effectiveSelectedSection = selectedSection || (singleAvailableSection ? (singleAvailableSection.id || singleAvailableSection.section_name) : '');

    useEffect(() => {
        if (!selectedSection && singleAvailableSection) {
            setSelectedSection(singleAvailableSection.id || singleAvailableSection.section_name);
        }
    }, [selectedSection, singleAvailableSection]);

    const selectedSectionObj = useMemo(() => {
        return sections.find(section => section.section_name === effectiveSelectedSection || section.id === effectiveSelectedSection) || null;
    }, [sections, effectiveSelectedSection]);

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

    const handlePrint = () => {
        const sectionName = selectedSectionObj?.section_name || 'Record';
        const originalTitle = document.title;
        document.title = `SF8_${schoolProfile.name || 'School'}_${sectionName}_${formatMonthYear(activeSchoolYear)}_${paperSize.toUpperCase()}`;
        window.print();
        document.title = originalTitle;
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
        const rows = Array.from({ length: Math.max(items.length, 18) });

        return rows.map((_, index) => {
            const student = items[index] as HealthStudent | undefined;
            const healthFields = calculateHealthFields(student);
            return (
                <tr key={student?.lrn || `blank-${index}`} className="border-b border-black/20 hover:bg-slate-50/50 transition-colors">
                    <td className="border-r border-black/20 text-center text-[10px] py-1.5 w-[4%] font-bold">{index + 1}</td>
                    <td className="border-r border-black/20 text-center text-[10px] py-1.5 w-[8%] tracking-tighter">{student?.lrn || ''}</td>
                    <td className="border-r border-black/20 text-[10px] py-1.5 w-[28%] leading-none px-2 whitespace-nowrap overflow-hidden font-black">
                        {student ? `${student.last_name}, ${student.first_name} ${student.middle_name || ''} ${student.name_extension || ''}`.trim().toUpperCase() : ''}
                    </td>
                    <td className="border-r border-black/20 text-center text-[10px] py-1.5 w-[9%]">{student?.birthday || ''}</td>
                    <td className="border-r border-black/20 text-center text-[10px] py-1.5 w-[4%] font-bold">{student ? getAge(student.birthday) : ''}</td>
                    <td className="border-r border-black/20 text-center text-[10px] py-1.5 w-[5%]">
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
                        <span className="hidden print:inline">{healthFields.weight !== '' ? formatNumber(Number(healthFields.weight), 1) : ''}</span>
                    </td>
                    <td className="border-r border-black/20 text-center text-[10px] py-1.5 w-[5%]">
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
                        <span className="hidden print:inline">{healthFields.height !== '' ? formatNumber(Number(healthFields.height), 2) : ''}</span>
                    </td>
                    <td className="border-r border-black/20 text-center text-[10px] py-1.5 w-[5%]">{healthFields.heightSquared !== '' ? formatNumber(Number(healthFields.heightSquared), 2) : ''}</td>
                    <td className="border-r border-black/20 text-center text-[10px] py-1.5 w-[5%] font-bold">{healthFields.bmi !== '' ? formatNumber(Number(healthFields.bmi), 1) : ''}</td>
                    <td className="border-r border-black/20 text-center text-[10px] py-1.5 w-[8%] font-black text-blue-600 uppercase tracking-tighter">{healthFields.bmi_category}</td>
                    <td className="border-r border-black/20 text-center text-[10px] py-1.5 w-[9%] font-black text-amber-600 uppercase tracking-tighter">{healthFields.hfa}</td>
                    <td className="text-center text-[10px] py-1.5 w-[10%] font-bold italic opacity-70">{healthFields.remarks}</td>
                </tr>
            );
        });
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 relative overflow-hidden font-sans">
             {/* Sticky Premium Top Toolbar */}
             <div className="h-24 px-8 flex items-center justify-between z-100 bg-white/90 backdrop-blur-3xl border-b border-slate-200 shadow-sm relative print:hidden shrink-0 w-full overflow-x-auto custom-scrollbar">
                <div className="flex items-center gap-8">
                    {/* Brand/Back Hook */}
                    <div className="flex items-center gap-5">
                        <button 
                            onClick={() => setCurrentView('school-forms')}
                            className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all group"
                            title="Back to Hub"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">SF8 Health</h2>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Nutrition Report</p>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-2" />

                    {/* Section Selector */}
                    {!singleAvailableSection && (
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Section</span>
                            <div className="relative group">
                                <select 
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                    className="appearance-none bg-slate-100 border border-slate-200 rounded-2xl px-5 py-2.5 pr-10 text-[12px] font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer min-w-[220px]"
                                >
                                    <option value="">Select Section</option>
                                    {sortedSections.map(section => (
                                        <option key={section.id || section.section_name} value={section.id || section.section_name}>
                                            {section.section_grade_level} - {section.section_name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-600 transition-colors" />
                            </div>
                        </div>
                    )}

                    {/* Paper Size */}
                    <div className="flex flex-col ml-4">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Paper Size</span>
                        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                            <button
                                onClick={() => setPaperSize('a4')}
                                className={`px-5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paperSize === 'a4' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                A4
                            </button>
                            <button
                                onClick={() => setPaperSize('folio')}
                                className={`px-5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paperSize === 'folio' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Folio
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Zoom Control */}
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">View Zoom</span>
                        <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                            <button 
                                onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))}
                                className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-[11px] font-black text-slate-900 w-12 text-center tabular-nums">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button 
                                onClick={() => setZoom(prev => Math.min(1.5, prev + 0.1))}
                                className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white rounded-xl transition-all shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="h-10 w-px bg-slate-200" />

                    {/* Print Primary Button */}
                    <button
                        onClick={handlePrint}
                        disabled={!effectiveSelectedSection}
                        className="h-14 px-10 rounded-2.5xl bg-blue-600 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-3 group"
                    >
                        <Printer className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                        Print Official SF8
                    </button>
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
                            <div className="sf8-page mx-auto w-full max-w-[1123px] bg-white text-black border border-black/10 shadow-[0_20px_50px_rgba(0,0,0,0.08)] print:shadow-none print:border-none">
                    <div className="sf8-page-content p-3 sm:p-4 flex flex-col">
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <img src={`${import.meta.env.BASE_URL || '/'}deped_logo_left.png`} alt="DepEd" className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0 w-full overflow-x-auto custom-scrollbar" />
                            <div className="flex-1 text-center leading-tight px-1">
                                <p className="text-[17px] sm:text-[20px] font-bold">Department of Education</p>
                                <p className="text-[16px] sm:text-[18px] font-bold">School Form 8 Learner&apos;s Basic Health and Nutrition Report (SF8)</p>
                                <p className="text-[13px] sm:text-[14px] italic">(For All Grade Levels)</p>
                            </div>
                            <img src={`${import.meta.env.BASE_URL}deped_logo_right.png`} alt="DepEd" className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0 w-full overflow-x-auto custom-scrollbar" />
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
                                    <tr className="bg-slate-100">
                                        <th className="border-r border-black/30 py-1 w-[4%]">No.</th>
                                        <th className="border-r border-black/30 py-1 w-[8%]">LRN</th>
                                        <th className="border-r border-black/30 py-1 w-[30%]">Learner&apos;s Name</th>
                                        <th className="border-r border-black/30 py-1 w-[9%]">Birthdate</th>
                                        <th className="border-r border-black/30 py-1 w-[4%]">Age</th>
                                        <th className="border-r border-black/30 py-1 w-[5%]">Weight (kg)</th>
                                        <th className="border-r border-black/30 py-1 w-[5%]">Height (m)</th>
                                        <th className="border-r border-black/30 py-1 w-[5%]">Height² (m²)</th>
                                        <th className="border-r border-black/30 py-1 w-[5%]">BMI</th>
                                        <th className="border-r border-black/30 py-1 w-[8%]">BMI Category</th>
                                        <th className="border-r border-black/30 py-1 w-[9%]">Height for Age (HFA)</th>
                                        <th className="py-1 w-[8%]">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colSpan={12} className="border-y border-black/30 bg-slate-200 font-bold text-left px-2 py-1 uppercase">Male</td>
                                    </tr>
                                    {renderStudentRows(maleStudents)}
                                    <tr>
                                        <td colSpan={12} className="border-y border-black/30 bg-slate-200 font-bold text-left px-2 py-1 uppercase">Female</td>
                                    </tr>
                                    {renderStudentRows(femaleStudents)}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-3 print:break-inside-avoid">
                            <p className="text-center font-bold text-[15px] uppercase mb-2">Summary Table</p>
                            <table className="w-full table-fixed border-collapse text-[11px] sm:text-[12px] border border-black">
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

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 text-[12px] sm:text-[13px] print:break-inside-avoid">
                            <div>
                                <p className="mb-8">Date of Assessment:</p>
                                <div className="border-b border-black h-5"></div>
                            </div>
                            <div>
                                <p className="mb-8">Conducted/Assessed By:</p>
                                <div className="border-b border-black h-5"></div>
                            </div>
                            <div>
                                <p className="mb-8">Certified Correct By:</p>
                                <div className="border-b border-black h-5"></div>
                            </div>
                            <div>
                                <p className="mb-8">Reviewed By:</p>
                                <div className="border-b border-black h-5"></div>
                            </div>
                        </div>

                        <p className="text-right text-[11px] italic mt-4 pt-4">SFRT 2017</p>
                    </div>
                </div>
            </div>
        </div>
    )}

            <style>{`
                @media print {
                    @page { size: ${paperSize === 'folio' ? 'Folio landscape' : 'A4 landscape'}; margin: 0.15in; }
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
