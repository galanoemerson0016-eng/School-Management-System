import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppStore } from '../stores';
import { useAuthStore } from '../stores/auth-store';
import { Printer, ArrowLeft, Calendar as CalendarIcon, Search, GraduationCap, FileText, CheckCircle2, RefreshCcw, Layers, Download } from 'lucide-react';
import { CertificateRenderer } from '../components/certificates/CertificateRenderer';
import { filterSF9Sections } from '../lib/rbac';
import type { CertificateType, HonorsInfo } from '../utils/certificateUtils';
import { getHonorsInfo, calculateStudentAverage } from '../utils/certificateUtils';
import { isDescriptiveGrading } from '../lib/grading';

const TEMPLATE_CONFIG: Record<CertificateType, { excellenceAward: string, dateMonth: string }> = {
    'EOSY': { excellenceAward: 'Akademikong Kahusayan (Academic Excellence Award)', dateMonth: 'March' },
    'T1': { excellenceAward: 'Akademikong Kahusayan para sa Unang Termino (Academic Excellence Award for the First Term)', dateMonth: 'November' },
    'T2': { excellenceAward: 'Akademikong Kahusayan para sa Ikalawang Termino (Academic Excellence Award for the Second Term)', dateMonth: 'January' },
    'T3': { excellenceAward: 'Akademikong Kahusayan para sa Ikatlong Termino (Academic Excellence Award for the Third Term)', dateMonth: 'March' },
};

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
}

interface BatchStudent {
    lrn: string;
    name: string;
    average: number;
    honors: HonorsInfo;
    selected: boolean;
}

interface CustomAward {
    id: string;
    lrn: string;
    studentName: string;
    awardType: string;
    awardTitleTagalog: string;
    awardTitleEnglish: string;
    excellenceAward: string;
    bodyTextTagalog: string;
    bodyTextEnglish: string;
    projectTitle: string;
    projectMembers: string[];
    selected: boolean;
}

export function CertificateGeneratorPage() {
    const { setCurrentView, students, schoolProfile, gradingSheetRecords, subjects, activeSchoolYear, sections, teachers } = useAppStore();
    const { user } = useAuthStore();
    
    // Generator View State
    // Generator State
    const [certType, setCertType] = useState<CertificateType>('T1');
    const [selectedSectionId, setSelectedSectionId] = useState<string>('');
    const [showAdviserSignature, setShowAdviserSignature] = useState(true);
    const [showHeadSignature, setShowHeadSignature] = useState(true);
    const [adviserSignatureUrl, setAdviserSignatureUrl] = useState<string | undefined>(undefined);
    
    // Batch Processing State
    const [batchStudents, setBatchStudents] = useState<BatchStudent[]>([]);
    const [subjectAwards, setSubjectAwards] = useState<{ subject: string, student: string, average: number, lrn: string, selected: boolean }[]>([]);
    const [customAwards, setCustomAwards] = useState<CustomAward[]>([]);
    const [isBatchScanning, setIsBatchScanning] = useState(false);
    const [certSidebarWidth, setCertSidebarWidth] = useState(336); // Default w-84 is 336px
    const [isCertResizing, setIsCertResizing] = useState(false);
    const [showAdvancedHeader, setShowAdvancedHeader] = useState(false);
    const certSidebarRef = useRef<HTMLDivElement>(null);
    
    // PDF Generation State
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [pdfProgress, setPdfProgress] = useState(0);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isCertResizing && certSidebarRef.current) {
                const rect = certSidebarRef.current.getBoundingClientRect();
                const newWidth = e.clientX - rect.left;
                if (newWidth >= 280 && newWidth <= 480) {
                    setCertSidebarWidth(newWidth);
                }
            }
        };
        const handleMouseUp = () => setIsCertResizing(false);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isCertResizing]);

    // Sorted Sections: Grade Level - Section (Alphabetical)
    // Filter by advisory class only for advisers
    const sortedSections = useMemo(() => {
        let filtered = [...sections];
        
        // Apply user-based filtering (adviser only sees advisory class)
        if (user) {
            filtered = filterSF9Sections(user, filtered);
        }
        
        return filtered.sort((a, b) => {
                // Natural sort for Grade levels (extract numbers, Kinder is sorted to the beginning)
                const numA = parseInt((a.section_grade_level || '').replace(/\D/g, '')) || (a.section_grade_level?.toLowerCase().includes('kinder') ? -1 : 0);
                const numB = parseInt((b.section_grade_level || '').replace(/\D/g, '')) || (b.section_grade_level?.toLowerCase().includes('kinder') ? -1 : 0);
                
                if (numA !== numB) return numA - numB;
                
                // Then sort alphabetically by section name
                return a.section_name.localeCompare(b.section_name);
            });
    }, [sections, user]);

    // Auto-select single section if it's the only one
    useEffect(() => {
        if (sortedSections.length === 1 && selectedSectionId !== sortedSections[0].id) {
            const timer = setTimeout(() => {
                setSelectedSectionId(sortedSections[0].id);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [sortedSections, selectedSectionId]);

    // Helper to get today's date parts with ordinal suffix
    const getTodayParts = () => {
        const today = new Date();
        const day = today.getDate();
        const month = today.toLocaleString('default', { month: 'long' });
        const year = today.getFullYear().toString();
        
        const getOrdinal = (n: number) => {
            const s = ["th", "st", "nd", "rd"];
            const v = n % 100;
            return n + (s[(v - 20) % 10] || s[v] || s[0]);
        };
        
        // Keep helper for future text formatting usage.
        getOrdinal(day);
        
        return {
            day: day.toString(), // e.g. "16"
            month,
            year
        };
    };

    const todayParts = useMemo(() => getTodayParts(), []);

    // Hardcoded Individual Data (Fallback for Renderer logic if needed)
    const [certData, setCertData] = useState<CertificateData>({
        learnerName: '',
        lrn: '',
        awardTitleTagalog: '',
        awardTitleEnglish: '',
        excellenceAward: TEMPLATE_CONFIG[certType].excellenceAward,
        dateDate: todayParts.day,
        dateMonth: todayParts.month,
        dateYear: todayParts.year,
        signatory1Name: schoolProfile?.adviser_name || '', 
        signatory1TitleTagalog: 'Tagapayo',
        signatory1TitleEnglish: 'Adviser',
        signatory2Name: schoolProfile?.head_name || 'AGAPITO S. GONZAGA',
        signatory2TitleTagalog: schoolProfile?.head_position?.toLowerCase().includes('principal') 
            ? schoolProfile.head_position.replace(/Principal/i, 'Punong-Guro') 
            : 'Punong-Guro',
        signatory2TitleEnglish: schoolProfile?.head_position || 'Officer-in-Charge, School Head',
        givenInTagalog: (schoolProfile?.division?.toLowerCase().includes('city') ? 'Lungsod ng ' : 'Lalawigan ng ') + (schoolProfile?.division?.replace(/Schools Division of/i, '').replace(/Province/i, '').replace(/City/i, '').trim() || 'Matatag'),
        givenInEnglish: (schoolProfile?.division?.toLowerCase().includes('city') ? 'City of ' : 'Province of ') + (schoolProfile?.division?.replace(/Schools Division of/i, '').replace(/Province/i, '').replace(/City/i, '').trim() || 'Matatag'),
        headerRegionTagalog: schoolProfile?.region?.replace(/Region/i, 'Rehiyon') || 'Rehiyon III',
        headerRegionEnglish: schoolProfile?.region || 'REGION III',
        headerDivisionTagalog: (schoolProfile?.division || 'Sangay ng Lalawigan ng Tarlac')
            .replace(/Schools Division of/i, 'Sangay ng')
            .replace(/Province/i, 'Lalawigan')
            .replace(/City/i, 'Lungsod'),
        headerDivisionEnglish: schoolProfile?.division || 'SCHOOLS DIVISION OF TARLAC PROVINCE',
        headerDistrictTagalog: (() => {
            const d = schoolProfile?.district || 'Victoria East District';
            const base = d.replace(/District/i, '').trim();
            let translated = base.replace(/East/i, 'Silangang').replace(/West/i, 'Kanlurang').replace(/North/i, 'Hilagang').replace(/South/i, 'Timog');
            if (translated.endsWith('Silangang')) translated = 'Silangang ' + translated.replace('Silangang', '').trim();
            else if (translated.endsWith('Kanlurang')) translated = 'Kanlurang ' + translated.replace('Kanlurang', '').trim();
            else if (translated.endsWith('Hilagang')) translated = 'Hilagang ' + translated.replace('Hilagang', '').trim();
            else if (translated.endsWith('Timog')) translated = 'Timog ' + translated.replace('Timog', '').trim();
            return d.toLowerCase().includes('district') ? `Distrito ng ${translated}` : d;
        })(),
        headerDistrictEnglish: schoolProfile?.district || 'VICTORIA EAST DISTRICT',
        headerSchoolName: schoolProfile?.name || 'School Name'
    });

    // Sync with school profile updates
    useEffect(() => {
        if (schoolProfile) {
            if (schoolProfile.adviser_signature_url && !adviserSignatureUrl) {
                setAdviserSignatureUrl(schoolProfile.adviser_signature_url);
            }
            const timer = setTimeout(() => {
                setCertData(prev => ({
                    ...prev,
                    signatory2Name: schoolProfile.head_name || prev.signatory2Name,
                    signatory2TitleTagalog: schoolProfile.head_position?.toLowerCase().includes('principal') 
                        ? schoolProfile.head_position.replace(/Principal/i, 'Punong-Guro') 
                        : 'Punong-Guro',
                    signatory2TitleEnglish: schoolProfile.head_position || prev.signatory2TitleEnglish,
                    signatory1Name: prev.signatory1Name || schoolProfile.adviser_name || '',
                    givenInTagalog: prev.givenInTagalog === 'Lalawigan ng Matatag' || prev.givenInTagalog === '' 
                        ? (schoolProfile.division?.toLowerCase().includes('city') ? 'Lungsod ng ' : 'Lalawigan ng ') + (schoolProfile.division?.replace(/Schools Division of/i, '').replace(/Province/i, '').replace(/City/i, '').trim() || 'Matatag')
                        : prev.givenInTagalog,
                    givenInEnglish: prev.givenInEnglish === 'Province of Matatag' || prev.givenInEnglish === ''
                        ? (schoolProfile.division?.toLowerCase().includes('city') ? 'City of ' : 'Province of ') + (schoolProfile.division?.replace(/Schools Division of/i, '').replace(/Province/i, '').replace(/City/i, '').trim() || 'Matatag')
                        : prev.givenInEnglish,
                    headerRegionTagalog: prev.headerRegionTagalog === 'Rehiyon III' || prev.headerRegionTagalog === '' ? schoolProfile.region?.replace(/Region/i, 'Rehiyon') : prev.headerRegionTagalog,
                    headerRegionEnglish: prev.headerRegionEnglish === 'REGION III' || prev.headerRegionEnglish === '' ? schoolProfile.region : prev.headerRegionEnglish,
                    headerDivisionTagalog: prev.headerDivisionTagalog === 'Sangay ng Lalawigan ng Tarlac' || prev.headerDivisionTagalog === '' ? schoolProfile.division?.replace(/Schools Division of/i, 'Sangay ng').replace(/Province/i, 'Lalawigan').replace(/City/i, 'Lungsod') : prev.headerDivisionTagalog,
                    headerDivisionEnglish: prev.headerDivisionEnglish === 'SCHOOLS DIVISION OF TARLAC PROVINCE' || prev.headerDivisionEnglish === '' ? schoolProfile.division : prev.headerDivisionEnglish,
                    headerDistrictTagalog: prev.headerDistrictTagalog === 'Distrito ng Silangang Victoria' || prev.headerDistrictTagalog === '' ? (() => {
                        const d = schoolProfile.district;
                        const base = d.replace(/District/i, '').trim();
                        let translated = base.replace(/East/i, 'Silangang').replace(/West/i, 'Kanlurang').replace(/North/i, 'Hilagang').replace(/South/i, 'Timog');
                        if (translated.endsWith('Silangang')) translated = 'Silangang ' + translated.replace('Silangang', '').trim();
                        else if (translated.endsWith('Kanlurang')) translated = 'Kanlurang ' + translated.replace('Kanlurang', '').trim();
                        return d.toLowerCase().includes('district') ? `Distrito ng ${translated}` : d;
                    })() : prev.headerDistrictTagalog,
                    headerDistrictEnglish: prev.headerDistrictEnglish === 'VICTORIA EAST DISTRICT' || prev.headerDistrictEnglish === '' ? schoolProfile.district : prev.headerDistrictEnglish,
                    headerSchoolName: prev.headerSchoolName === 'School Name' || prev.headerSchoolName === '' ? schoolProfile.name : prev.headerSchoolName
                }));
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [schoolProfile, adviserSignatureUrl]);

    // Batch Scanning Logic
    const handleBatchScan = () => {
        if (!selectedSectionId) return;
        setIsBatchScanning(true);
        
        setTimeout(() => {
const section = sections.find(s => s.id === selectedSectionId);
            const sectionStudents = students.filter(s => s.student_section === section?.section_name || (section?.id && s.student_section === section.id));
            const term = certType === 'EOSY' ? 'EOSY' : parseInt(certType.replace('T', '')) as 1 | 2 | 3;

            const qualifying = sectionStudents.map(s => {
                if (isDescriptiveGrading(section?.section_grade_level || '', activeSchoolYear)) return null;

                const average = calculateStudentAverage(s.lrn, term, gradingSheetRecords, subjects, activeSchoolYear);
                const honors = getHonorsInfo(average);
                if (honors) {
                    // Check if no grade below 80 in any subject for this term
                    const studentRecords = gradingSheetRecords.filter(r => 
                        r.student_lrn === s.lrn && 
                        r.school_year === activeSchoolYear
                    );
                    let hasGradeBelow80 = false;
                    const uniqueSubjectIds = Array.from(new Set(studentRecords.map(r => r.subject_id)));
                    uniqueSubjectIds.forEach(subId => {
                        const subject = subjects.find(sub => sub.id === subId);
                        if (!subject || subject.term === 'none') return;
                        if (term === 'EOSY') {
                            const termGrades = [1, 2, 3].map(q => {
                                const rec = studentRecords.find(r => r.subject_id === subId && r.quarter === q);
                                return Number(rec?.final_grade || 0);
                            }).filter(g => g > 0);
                            if (termGrades.length === 3) {
                                const finalSubGrade = Math.round(termGrades.reduce((a, b) => a + b, 0) / 3);
                                if (finalSubGrade < 80) hasGradeBelow80 = true;
                            }
                        } else {
                            const rec = studentRecords.find(r => r.subject_id === subId && r.quarter === term);
                            const grade = Number(rec?.final_grade || 0);
                            if (grade > 0 && grade < 80) hasGradeBelow80 = true;
                        }
                    });

                    if (hasGradeBelow80) return null;

                    return {
                        lrn: s.lrn,
                        name: `${s.first_name} ${s.middle_name ? s.middle_name[0] + '.' : ''} ${s.last_name}`.toUpperCase(),
                        average,
                        honors: {
                            tagalog: honors.tagalog,
                            english: honors.english
                        },
                        selected: true
                    };
                }
                return null;
            }).filter(Boolean) as BatchStudent[];

            // 2. Subject Excellence Detection (Top Scorer per Subject)
            let sectionSubjects = subjects.filter(sub => sub.section_id === selectedSectionId && sub.term !== 'none');
            if (sectionSubjects.length === 0 && section) {
                sectionSubjects = subjects.filter(sub => sub.grade_level === section.section_grade_level && !sub.section_id && sub.term !== 'none');
            }
            const sectionSubjectIds = new Set(sectionSubjects.map(sub => sub.id));
            const awards: typeof subjectAwards = [];

            sectionSubjectIds.forEach(subId => {
                if (isDescriptiveGrading(section?.section_grade_level || '', activeSchoolYear)) return;

                const subjectName = subjects.find(s => s.id === subId)?.subject_name || 'Subject';
                let topGrade = 0;
                let topLrn = '';
                let topName = '';

                sectionStudents.forEach(s => {
                    const rec = gradingSheetRecords.find(r => 
                        r.student_lrn === s.lrn && 
                        r.subject_id === subId && 
                        r.quarter === (term === 'EOSY' ? 3 : term)
                    );
                    const grade = Number(rec?.final_grade || 0);
                    if (grade > topGrade) {
                        topGrade = grade;
                        topLrn = s.lrn;
                        topName = `${s.first_name} ${s.middle_name ? s.middle_name[0] + '.' : ''} ${s.last_name}`.toUpperCase();
                    }
                });

                if (topGrade >= 90) { // Only award for 90+
                    awards.push({ subject: subjectName, student: topName, average: topGrade, lrn: topLrn, selected: false });
                }
            });

            // 3. Custom / Nominated / Classroom Awards Detection
            const nominated: CustomAward[] = [];
            sectionStudents.forEach(s => {
                const evals = s.awardEvaluations || [];
                const matchingEvals = evals.filter(e => 
                    e.schoolYear === activeSchoolYear && 
                    e.term === term
                );

                matchingEvals.forEach(e => {
                    let excellenceAward = '';
                    let awardTitleTagalog = '';
                    let awardTitleEnglish = '';
                    let bodyTextTagalog = '';
                    let bodyTextEnglish = '';
                    const projectTitle = e.projectTitle || '';
                    let projectMembersResolved: string[] = [];

                    if (e.projectMembers && e.projectMembers.length > 0) {
                        projectMembersResolved = e.projectMembers
                            .map(lrn => {
                                const stud = students.find(m => m.lrn === lrn);
                                return stud ? `${stud.first_name} ${stud.last_name}`.toUpperCase() : lrn;
                            })
                            .filter(Boolean);
                    }

                    switch (e.awardType) {
                        case 'PerfectAttendance':
                            excellenceAward = 'Gawad sa Katangi-tanging Pagpasok (Perfect Attendance Award)';
                            awardTitleTagalog = 'Katangi-tanging Pagpasok (Perfect Attendance)';
                            awardTitleEnglish = 'Perfect Attendance Award';
                            bodyTextTagalog = 'bilang pagkilala sa katangi-tanging pagpasok nang walang liban sa klase sa buong termino ng Taong Panuruan ' + activeSchoolYear + '.';
                            bodyTextEnglish = 'in recognition of outstanding attendance with no absences recorded during the term for School Year ' + activeSchoolYear + '.';
                            break;
                        case 'CharacterTrait':
                            excellenceAward = e.characterTraitTitle || 'Gawad sa Pagpapahalaga (Character Trait Award)';
                            awardTitleTagalog = e.characterTraitTitle || 'Gawad sa Katangi-tanging Asal';
                            awardTitleEnglish = `${e.characterTraitId || 'Core Value'} Trait Award`;
                            bodyTextTagalog = e.characterTraitDescription 
                                ? `bilang pagkilala sa pagpapakita ng ugaling ${e.characterTraitId || 'mabuti'}: ${e.characterTraitDescription}` 
                                : `bilang pagkilala sa pagpapakita ng ugaling ${e.characterTraitId || 'mabuti'}.`;
                            bodyTextEnglish = e.characterTraitDescription 
                                ? `in recognition of demonstrating behavior aligned with ${e.characterTraitId || 'core values'}: ${e.characterTraitDescription}` 
                                : `in recognition of demonstrating behavior aligned with ${e.characterTraitId || 'core values'}.`;
                            break;
                        case 'GMRCMerit':
                            excellenceAward = 'GMRC Certificate of Merit';
                            awardTitleTagalog = 'Katibayan ng Pagpapahalaga sa GMRC';
                            awardTitleEnglish = 'GMRC Certificate of Merit';
                            bodyTextTagalog = e.gmrcCompetency 
                                ? `bilang pagkilala sa natatanging pag-unlad at kahusayan sa GMRC: ${e.gmrcCompetency}` 
                                : 'bilang pagkilala sa natatanging pag-unlad at kahusayan sa GMRC.';
                            bodyTextEnglish = e.gmrcCompetency 
                                ? `in recognition of outstanding development and excellence in GMRC competency: ${e.gmrcCompetency}` 
                                : 'in recognition of outstanding development and excellence in GMRC.';
                            break;
                        case 'Leadership': {
                            excellenceAward = 'Gawad sa Katangi-tanging Pamumuno (Leadership Excellence Award)';
                            awardTitleTagalog = 'Katangi-tanging Pamumuno (Leadership Excellence)';
                            awardTitleEnglish = 'Leadership Excellence Award';
                            const pos = e.leadershipScores?.position || 'Pinuno ng Klase';
                            bodyTextTagalog = `bilang pagkilala sa ipinamalas na katangi-tanging pamumuno, responsibilidad, at pakikipagtulungan bilang ${pos}.`;
                            bodyTextEnglish = `in recognition of exemplary leadership, responsibility, and cooperation demonstrated as ${pos}.`;
                            break;
                        }
                        case 'Research':
                            excellenceAward = 'Gawad sa Kahusayan sa Pananaliksik (Excellence in Research Award)';
                            awardTitleTagalog = 'Kahusayan sa Pananaliksik (Excellence in Research)';
                            awardTitleEnglish = 'Excellence in Research Award';
                            bodyTextTagalog = e.projectTitle 
                                ? `bilang pagkilala sa natatanging kontribusyon at kahusayan sa pagpaplano at pagsasagawa ng pananaliksik na may pamagat na "${e.projectTitle}".` 
                                : 'bilang pagkilala sa natatanging kontribusyon at kahusayan sa pagpaplano at pagsasagawa ng pananaliksik.';
                            bodyTextEnglish = e.projectTitle 
                                ? `in recognition of outstanding contribution and excellence in planning and executing the research project entitled "${e.projectTitle}".` 
                                : 'in recognition of outstanding contribution and excellence in planning and executing the research project.';
                            break;
                        case 'Innovation':
                            excellenceAward = 'Gawad sa Kahusayan sa Disenyo at Inobasyon (Excellence in Design & Innovation Award)';
                            awardTitleTagalog = 'Kahusayan sa Disenyo at Inobasyon (Excellence in Design & Innovation)';
                            awardTitleEnglish = 'Excellence in Design and Innovation Award';
                            bodyTextTagalog = e.projectTitle 
                                ? `bilang pagkilala sa natatanging kontribusyon at kahusayan sa pagpaplano at pagbuo ng inobasyon na may pamagat na "${e.projectTitle}".` 
                                : 'bilang pagkilala sa natatanging kontribusyon at kahusayan sa pagpaplano at pagbuo ng inobasyon.';
                            bodyTextEnglish = e.projectTitle 
                                ? `in recognition of outstanding contribution and excellence in planning and developing the innovation entitled "${e.projectTitle}".` 
                                : 'in recognition of outstanding contribution and excellence in planning and developing the innovation.';
                            break;
                        case 'WorkImmersion': {
                            excellenceAward = 'Gawad sa Kahusayan sa Work Immersion (Excellence in Work Immersion Award)';
                            awardTitleTagalog = 'Kahusayan sa Work Immersion (Excellence in Work Immersion)';
                            awardTitleEnglish = 'Excellence in Work Immersion Award';
                            const wiGrade = e.workImmersionDetails?.grade || 90;
                            bodyTextTagalog = `bilang pagkilala sa natatanging kasipagan at kahusayan sa Work Immersion na may markang ${wiGrade} at mataas na rekomendasyon ng kasosyo sa industriya.`;
                            bodyTextEnglish = `in recognition of outstanding diligence and excellence in Work Immersion with a grade of ${wiGrade} and exemplary endorsement from the partner industry supervisor.`;
                            break;
                        }
                        case 'SpecialRecognition': {
                            excellenceAward = e.specialRecognitionTitle || 'Natatanging Pagkilala (Special Recognition)';
                            awardTitleTagalog = e.specialRecognitionTitle || 'Gawad ng Natatanging Pagkilala';
                            awardTitleEnglish = 'Special Recognition Award';
                            const lvl = e.specialRecognitionLevel || 'school';
                            bodyTextTagalog = `bilang pagkilala sa natatanging karangalang idinala sa paaralan sa pamamagitan ng pagwawagi o paglahok sa antas-${lvl} para sa: ${e.specialRecognitionTitle}.`;
                            bodyTextEnglish = `in recognition of the honor brought to the school by achieving distinction at the ${lvl} level for: ${e.specialRecognitionTitle}.`;
                            break;
                        }
                    }

                    nominated.push({
                        id: e.id,
                        lrn: s.lrn,
                        studentName: `${s.first_name} ${s.middle_name ? s.middle_name[0] + '.' : ''} ${s.last_name}`.toUpperCase(),
                        awardType: e.awardType,
                        awardTitleTagalog,
                        awardTitleEnglish,
                        excellenceAward,
                        bodyTextTagalog,
                        bodyTextEnglish,
                        projectTitle,
                        projectMembers: projectMembersResolved,
                        selected: true
                    });
                });
            });

            setBatchStudents(qualifying);
            setSubjectAwards(awards);
            setCustomAwards(nominated);

            // Fetch Adviser Name looking up the teacher UID
            const adviserId = section?.adviser_id;
            const teacher = teachers.find(t => t.uid === adviserId);
            const adviserName = teacher?.displayName || section?.adviser_name || 'Class Adviser';
            
            setCertData(prev => ({
                ...prev,
                signatory1Name: adviserName
            }));

            setIsBatchScanning(false);
        }, 1000);
    };


    const toggleStudentSelection = (lrn: string) => {
        setBatchStudents(prev => prev.map(s => 
            s.lrn === lrn ? { ...s, selected: !s.selected } : s
        ));
    };

    const generateBatchPDF = async () => {
        const selectedHonors = batchStudents.filter(s => s.selected);
        const selectedSubjects = subjectAwards.filter(s => s.selected);
        const selectedCustoms = customAwards.filter(s => s.selected);
        const totalCerts = selectedHonors.length + selectedSubjects.length + selectedCustoms.length;

        if (totalCerts === 0) {
            useAppStore.getState().showNotification('Please select at least one student or award to generate.', 'error');
            return;
        }

        setIsGeneratingPDF(true);
        setPdfProgress(0);

        try {
            const { PDFDocument } = await import('pdf-lib');
            const { pdf } = await import('@react-pdf/renderer');
            const { CertificatePDFDocument } = await import('../components/certificates/CertificatePDFDocument');
            const { certificateAssets } = await import('../components/certificates/certificateAssets');

            const mergedPdf = await PDFDocument.create();
            let renderedCount = 0;

            const logoLeftUrl = certificateAssets.depedLogoLeft;
            const logoRightUrl = schoolProfile?.logo_url || certificateAssets.schoolLogoFallback;

            // 1. Process Honors
            for (const student of selectedHonors) {
                const certDataForDoc = {
                    ...certData,
                    learnerName: student.name,
                    lrn: student.lrn,
                    awardTitleTagalog: student.honors.tagalog,
                    awardTitleEnglish: student.honors.english,
                    signatureUrl1: showAdviserSignature ? (adviserSignatureUrl || schoolProfile?.adviser_signature_url) : undefined,
                    signatureUrl2: showHeadSignature ? schoolProfile?.head_signature_url : undefined
                };

                const blob = await pdf(
                    <CertificatePDFDocument 
                        data={certDataForDoc}
                        logoLeftUrl={logoLeftUrl}
                        logoRightUrl={logoRightUrl}
                    />
                ).toBlob();

                const pdfDoc = await PDFDocument.load(await blob.arrayBuffer());
                const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));

                renderedCount++;
                setPdfProgress(Math.round((renderedCount / totalCerts) * 100));
                await new Promise((resolve) => setTimeout(resolve, 30));
            }

            // 2. Process Subject Awards
            for (const award of selectedSubjects) {
                const certDataForDoc = {
                    ...certData,
                    learnerName: award.student,
                    lrn: award.lrn,
                    awardTitleTagalog: `May Pinakamataas na Marka sa ${award.subject}`,
                    awardTitleEnglish: `Highest Grade in ${award.subject}`,
                    excellenceAward: 'Subject Excellence Award',
                    signatureUrl1: showAdviserSignature ? (adviserSignatureUrl || schoolProfile?.adviser_signature_url) : undefined,
                    signatureUrl2: showHeadSignature ? schoolProfile?.head_signature_url : undefined
                };

                const blob = await pdf(
                    <CertificatePDFDocument 
                        data={certDataForDoc}
                        logoLeftUrl={logoLeftUrl}
                        logoRightUrl={logoRightUrl}
                    />
                ).toBlob();

                const pdfDoc = await PDFDocument.load(await blob.arrayBuffer());
                const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));

                renderedCount++;
                setPdfProgress(Math.round((renderedCount / totalCerts) * 100));
                await new Promise((resolve) => setTimeout(resolve, 30));
            }

            // 3. Process Custom Awards
            for (const award of selectedCustoms) {
                const certDataForDoc = {
                    ...certData,
                    learnerName: award.studentName,
                    lrn: award.lrn,
                    awardTitleTagalog: award.awardTitleTagalog,
                    awardTitleEnglish: award.awardTitleEnglish,
                    excellenceAward: award.excellenceAward,
                    bodyTextTagalog: award.bodyTextTagalog,
                    bodyTextEnglish: award.bodyTextEnglish,
                    projectTitle: award.projectTitle,
                    projectMembers: award.projectMembers,
                    signatureUrl1: showAdviserSignature ? (adviserSignatureUrl || schoolProfile?.adviser_signature_url) : undefined,
                    signatureUrl2: showHeadSignature ? schoolProfile?.head_signature_url : undefined
                };

                const blob = await pdf(
                    <CertificatePDFDocument 
                        data={certDataForDoc}
                        logoLeftUrl={logoLeftUrl}
                        logoRightUrl={logoRightUrl}
                    />
                ).toBlob();

                const pdfDoc = await PDFDocument.load(await blob.arrayBuffer());
                const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));

                renderedCount++;
                setPdfProgress(Math.round((renderedCount / totalCerts) * 100));
                await new Promise((resolve) => setTimeout(resolve, 30));
            }

            // Save and download merged PDF file
            const mergedPdfBytes = await mergedPdf.save();
            const mergedBlob = new Blob([mergedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
            const url = URL.createObjectURL(mergedBlob);
            
            const a = document.createElement('a');
            a.href = url;
            const section = sections.find(s => s.id === selectedSectionId);
            const secLabel = section ? `${section.section_grade_level}_${section.section_name}`.replace(/\s+/g, '_') : 'Class';
            a.download = `Certificates_${secLabel}_${certType}_${activeSchoolYear}.pdf`;
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                if (document.body.contains(a)) {
                    document.body.removeChild(a);
                }
                URL.revokeObjectURL(url);
            }, 3000);

            useAppStore.getState().showNotification('Certificates PDF compiled and saved successfully!', 'success');
        } catch (error) {
            console.error('Batch Certificate PDF generation failed:', error);
            useAppStore.getState().showNotification('Failed to generate batch certificates PDF.', 'error');
        } finally {
            setIsGeneratingPDF(false);
            setPdfProgress(0);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-[#080d1a] overflow-hidden print:block print:h-auto print:overflow-visible print:bg-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-white/3 border-b border-gray-200 dark:border-white/5 shadow-sm no-print">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setCurrentView('reports')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-deped-blue dark:text-blue-400">Advanced Certificate Generator</h1>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> 11" x 8.5" Letter Size • Landscape
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={generateBatchPDF}
                        disabled={isGeneratingPDF}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl hover:bg-emerald-700 disabled:opacity-50 transition-all font-bold shadow-lg shadow-emerald-500/20 active:scale-95 border-b-4 border-emerald-900/50"
                    >
                        <Download className="w-4 h-4" /> Export Batch PDF
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-deped-blue text-white px-6 py-2.5 rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-500/20 active:scale-95 border-b-4 border-blue-900/50"
                    >
                        <Printer className="w-4 h-4" /> Print All
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden print:block print:overflow-visible">
                {/* Sidebar Editor */}
                <div 
                    ref={certSidebarRef}
                    style={{ width: `${certSidebarWidth}px` }}
                    className="border-r border-gray-200 dark:border-white/5 bg-white dark:bg-white/2 overflow-y-auto p-6 custom-scrollbar shadow-inner no-print relative group/certsidebar shrink-0"
                >
                    <div className="space-y-8">
                        {/* Section Selector */}
                        <section>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <GraduationCap className="w-3.5 h-3.5" /> Select Class Section
                            </h3>
                            <div className="space-y-4">
                                {sortedSections.length > 1 ? (
                                    <select 
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        value={selectedSectionId}
                                        onChange={(e) => setSelectedSectionId(e.target.value)}
                                    >
                                        <option value="">Choose Grade & Section...</option>
                                        {sortedSections.map(section => (
                                            <option key={section.id} value={section.id}>
                                                {section.section_grade_level} - {section.section_name}
                                            </option>
                                        ))}
                                    </select>
                                ) : sortedSections.length === 1 ? (
                                    <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/50 rounded-xl px-4 py-3">
                                        <p className="text-[10px] font-black text-blue-700 uppercase">
                                            Section: {sortedSections[0].section_grade_level} - {sortedSections[0].section_name}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200/50 rounded-xl px-4 py-3">
                                        <p className="text-[10px] font-black text-red-700 uppercase">
                                            No sections found
                                        </p>
                                    </div>
                                )}
                                
                                <button 
                                    onClick={handleBatchScan}
                                    disabled={!selectedSectionId || isBatchScanning}
                                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {isBatchScanning ? (
                                        <>
                                            <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> Scanning Section...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-3.5 h-3.5" /> Scan Section
                                        </>
                                    )}
                                </button>
                            </div>
                        </section>

                        {/* Template Settings */}
                        <section>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5" /> Template Configuration
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {(['T1', 'T2', 'T3', 'EOSY'] as CertificateType[]).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            setCertType(type);
                                            setCertData((prev) => ({
                                                ...prev,
                                                excellenceAward: TEMPLATE_CONFIG[type].excellenceAward,
                                            }));
                                        }}
                                        className={`px-3 py-2.5 rounded-xl text-[10px] font-black transition-all border ${certType === type ? 'bg-blue-50 dark:bg-blue-900/20 border-deped-blue text-blue-600' : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-500'}`}
                                    >
                                        {type === 'EOSY' ? 'Year-End' : `Term ${type.replace('T', '')}`}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Certificate Date */}
                        <section>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <CalendarIcon className="w-3.5 h-3.5" /> Certificate Date
                            </h3>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <p className="text-[8px] font-bold text-gray-400 uppercase mb-1 ml-1">Day</p>
                                    <input 
                                        type="text" 
                                        value={certData.dateDate}
                                        onChange={(e) => setCertData(prev => ({ ...prev, dateDate: e.target.value }))}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-700 dark:text-gray-200"
                                        placeholder="30th"
                                    />
                                </div>
                                <div className="flex-2">
                                    <p className="text-[8px] font-bold text-gray-400 uppercase mb-1 ml-1">Month</p>
                                    <input 
                                        type="text" 
                                        value={certData.dateMonth}
                                        onChange={(e) => setCertData(prev => ({ ...prev, dateMonth: e.target.value }))}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-700 dark:text-gray-200"
                                        placeholder="Month"
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[8px] font-bold text-gray-400 uppercase mb-1 ml-1">Year</p>
                                    <input 
                                        type="text" 
                                        value={certData.dateYear}
                                        onChange={(e) => setCertData(prev => ({ ...prev, dateYear: e.target.value }))}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-700 dark:text-gray-200"
                                        placeholder="Year"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 space-y-3">
                                <div>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase mb-1 ml-1">Given In (Tagalog)</p>
                                    <input 
                                        type="text" 
                                        value={certData.givenInTagalog}
                                        onChange={(e) => setCertData(prev => ({ ...prev, givenInTagalog: e.target.value }))}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-700 dark:text-gray-200"
                                        placeholder="e.g. Lalawigan ng Matatag"
                                    />
                                </div>
                                <div>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase mb-1 ml-1">Given In (English)</p>
                                    <input 
                                        type="text" 
                                        value={certData.givenInEnglish}
                                        onChange={(e) => setCertData(prev => ({ ...prev, givenInEnglish: e.target.value }))}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-700 dark:text-gray-200"
                                        placeholder="e.g. Province of Matatag"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Institutional Header Customization */}
                        <section className="p-4 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                            <button 
                                onClick={() => setShowAdvancedHeader(!showAdvancedHeader)}
                                className="w-full flex items-center justify-between group"
                            >
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 group-hover:text-deped-blue transition-colors">
                                    <Layers className="w-3.5 h-3.5" /> Institutional Header
                                </h3>
                                <span className="text-[10px] text-slate-400">{showAdvancedHeader ? '−' : '+'}</span>
                            </button>
                            
                            {showAdvancedHeader && (
                                <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase mb-1 ml-1">Region (TG)</p>
                                            <input type="text" value={certData.headerRegionTagalog} onChange={(e) => setCertData(prev => ({ ...prev, headerRegionTagalog: e.target.value }))} className="cert-sidebar-input" />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase mb-1 ml-1">Region (EN)</p>
                                            <input type="text" value={certData.headerRegionEnglish} onChange={(e) => setCertData(prev => ({ ...prev, headerRegionEnglish: e.target.value }))} className="cert-sidebar-input" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase mb-1 ml-1">Division (TG)</p>
                                            <input type="text" value={certData.headerDivisionTagalog} onChange={(e) => setCertData(prev => ({ ...prev, headerDivisionTagalog: e.target.value }))} className="cert-sidebar-input" />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase mb-1 ml-1">Division (EN)</p>
                                            <input type="text" value={certData.headerDivisionEnglish} onChange={(e) => setCertData(prev => ({ ...prev, headerDivisionEnglish: e.target.value }))} className="cert-sidebar-input" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase mb-1 ml-1">District (TG)</p>
                                            <input type="text" value={certData.headerDistrictTagalog} onChange={(e) => setCertData(prev => ({ ...prev, headerDistrictTagalog: e.target.value }))} className="cert-sidebar-input" />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase mb-1 ml-1">District (EN)</p>
                                            <input type="text" value={certData.headerDistrictEnglish} onChange={(e) => setCertData(prev => ({ ...prev, headerDistrictEnglish: e.target.value }))} className="cert-sidebar-input" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase mb-1 ml-1">School Name</p>
                                        <input type="text" value={certData.headerSchoolName} onChange={(e) => setCertData(prev => ({ ...prev, headerSchoolName: e.target.value }))} className="cert-sidebar-input" />
                                    </div>
                                </div>
                            )}
                        </section>                         {/* Signature Management */}
                        <section className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Signature Management
                            </h3>
                            <div className="space-y-3">
                                {/* Show Adviser Signature Checkbox */}
                                <label className="flex items-center justify-between cursor-pointer py-1">
                                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase">Show Class Adviser Signature</span>
                                    <input 
                                        type="checkbox" 
                                        checked={showAdviserSignature} 
                                        onChange={(e) => setShowAdviserSignature(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                </label>

                                {/* Show School Head Signature Checkbox */}
                                <label className="flex items-center justify-between cursor-pointer py-1">
                                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase">Show School Head Signature</span>
                                    <input 
                                        type="checkbox" 
                                        checked={showHeadSignature} 
                                        onChange={(e) => setShowHeadSignature(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                </label>
                            </div>
                        </section>

                        {(batchStudents.length > 0 || subjectAwards.length > 0 || customAwards.length > 0) && (
                            <div className="mt-6 space-y-4">
                                {batchStudents.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase ml-1">Honor Students ({batchStudents.length})</p>
                                        <div className="max-h-50 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                                            {batchStudents.map(student => (
                                                <div 
                                                    key={student.lrn}
                                                    className={`p-3 rounded-xl border transition-all flex items-center justify-between group ${student.selected ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/50' : 'bg-transparent border-transparent opacity-60'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[9px] font-black text-blue-600">
                                                            {student.average}
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-gray-700 dark:text-gray-200 uppercase truncate max-w-30">{student.name}</p>
                                                            <p className="text-[8px] text-gray-400 font-bold">{student.honors.english}</p>
                                                        </div>
                                                    </div>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={student.selected}
                                                        onChange={() => toggleStudentSelection(student.lrn)}
                                                        className="w-4 h-4 rounded-md border-gray-300 text-deped-blue focus:ring-deped-blue cursor-pointer"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {subjectAwards.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between px-1">
                                            <p className="text-[9px] font-bold text-purple-600 uppercase">Subject Awards ({subjectAwards.length})</p>
                                            <button 
                                                onClick={() => setSubjectAwards(prev => prev.map(a => ({ ...a, selected: !a.selected })))}
                                                className="text-[8px] font-black text-blue-500 uppercase hover:underline"
                                            >
                                                Toggle All
                                            </button>
                                        </div>
                                        <div className="max-h-50 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                                            {subjectAwards.map(award => (
                                                <div 
                                                    key={award.subject}
                                                    className={`p-3 rounded-xl border transition-all flex items-center justify-between group ${award.selected ? 'bg-purple-50 dark:bg-purple-900/10 border-purple-200/50' : 'bg-transparent border-transparent opacity-60'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-[9px] font-black text-purple-600">
                                                            {award.average}
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-gray-700 dark:text-gray-200 uppercase truncate max-w-30">{award.subject}</p>
                                                            <p className="text-[8px] text-purple-400 font-bold">{award.student}</p>
                                                        </div>
                                                    </div>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={award.selected}
                                                        onChange={() => setSubjectAwards(prev => prev.map(a => a.subject === award.subject ? { ...a, selected: !a.selected } : a))}
                                                        className="w-4 h-4 rounded-md border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {customAwards.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between px-1">
                                            <p className="text-[9px] font-black text-amber-600 uppercase">Custom & Classroom ({customAwards.length})</p>
                                            <button 
                                                onClick={() => setCustomAwards(prev => prev.map(a => ({ ...a, selected: !a.selected })))}
                                                className="text-[8px] font-black text-blue-500 uppercase hover:underline"
                                            >
                                                Toggle All
                                            </button>
                                        </div>
                                        <div className="max-h-62.5 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                                            {customAwards.map(award => (
                                                <div 
                                                    key={award.id}
                                                    className={`p-3 rounded-xl border transition-all flex items-center justify-between group ${award.selected ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-250/50' : 'bg-transparent border-transparent opacity-60'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-[9px] font-black text-amber-600">
                                                            {award.awardType.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-gray-700 dark:text-gray-200 uppercase truncate max-w-30">{award.excellenceAward.split(' (')[0]}</p>
                                                            <p className="text-[8px] text-amber-500 font-bold uppercase">{award.studentName}</p>
                                                        </div>
                                                    </div>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={award.selected}
                                                        onChange={() => setCustomAwards(prev => prev.map(a => a.id === award.id ? { ...a, selected: !a.selected } : a))}
                                                        className="w-4 h-4 rounded-md border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Preview Area (Screen Only) */}
                <div className="flex-1 overflow-y-auto p-12 bg-app-bg dark:bg-[#040711] custom-scrollbar no-print">
                    <div className="flex flex-col items-center gap-12 w-full">
                        {(batchStudents.filter(s => s.selected).length + subjectAwards.filter(s => s.selected).length + customAwards.filter(s => s.selected).length) === 0 ? (
                            <div className="flex flex-col items-center justify-center p-24 text-gray-400 bg-white/5 rounded-3xl border border-dashed border-white/10 w-full max-w-4xl">
                                <Layers className="w-12 h-12 mb-4 opacity-20" />
                                <p className="text-sm font-bold uppercase tracking-widest">No students selected for print</p>
                                <p className="text-xs opacity-50 mt-1">Scan a section and select students/awards from the sidebar</p>
                            </div>
                        ) : (
                            <>
                                {/* Honor Students */}
                                {batchStudents.filter(s => s.selected).map(student => (
                                    <div key={`honor-${student.lrn}`} className="flex flex-col items-center group relative w-full">
                                        <div className="absolute -top-5 left-1/2 translate-x-[-50%] bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-xl z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Preview: {student.name} (Honor)
                                        </div>
                                        <div className="shadow-2xl origin-top scale-[0.35] xl:scale-[0.5] 2xl:scale-[0.7] bg-white rounded-sm -mb-30 xl:-mb-45 2xl:-mb-25">
                                            <CertificateRenderer data={{
                                                ...certData,
                                                learnerName: student.name,
                                                lrn: student.lrn,
                                                awardTitleTagalog: student.honors.tagalog,
                                                awardTitleEnglish: student.honors.english,
                                                signatureUrl1: showAdviserSignature ? (adviserSignatureUrl || schoolProfile?.adviser_signature_url) : undefined,
                                                signatureUrl2: showHeadSignature ? schoolProfile?.head_signature_url : undefined
                                            }} />
                                        </div>
                                    </div>
                                ))}

                                {/* Subject Awards */}
                                {subjectAwards.filter(s => s.selected).map(award => (
                                    <div key={`award-${award.subject}`} className="flex flex-col items-center group relative w-full mt-12">
                                        <div className="absolute -top-5 left-1/2 translate-x-[-50%] bg-purple-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-xl z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Preview: {award.subject} Excellence
                                        </div>
                                        <div className="shadow-2xl origin-top scale-[0.35] xl:scale-[0.5] 2xl:scale-[0.7] bg-white rounded-sm -mb-30 xl:-mb-45 2xl:-mb-25">
                                            <CertificateRenderer data={{
                                                ...certData,
                                                learnerName: award.student,
                                                lrn: award.lrn,
                                                awardTitleTagalog: `May Pinakamataas na Marka sa ${award.subject}`,
                                                awardTitleEnglish: `Highest Grade in ${award.subject}`,
                                                excellenceAward: 'Subject Excellence Award',
                                                signatureUrl1: showAdviserSignature ? (adviserSignatureUrl || schoolProfile?.adviser_signature_url) : undefined,
                                                signatureUrl2: showHeadSignature ? schoolProfile?.head_signature_url : undefined
                                            }} />
                                        </div>
                                    </div>
                                ))}

                                {/* Custom nominated / classroom awards */}
                                {customAwards.filter(s => s.selected).map(award => (
                                    <div key={`custom-${award.id}`} className="flex flex-col items-center group relative w-full mt-12">
                                        <div className="absolute -top-5 left-1/2 translate-x-[-50%] bg-amber-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-xl z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Preview: {award.excellenceAward.split(' (')[0]} ({award.studentName})
                                        </div>
                                        <div className="shadow-2xl origin-top scale-[0.35] xl:scale-[0.5] 2xl:scale-[0.7] bg-white rounded-sm -mb-30 xl:-mb-45 2xl:-mb-25">
                                            <CertificateRenderer data={{
                                                ...certData,
                                                learnerName: award.studentName,
                                                lrn: award.lrn,
                                                awardTitleTagalog: award.awardTitleTagalog,
                                                awardTitleEnglish: award.awardTitleEnglish,
                                                excellenceAward: award.excellenceAward,
                                                bodyTextTagalog: award.bodyTextTagalog,
                                                bodyTextEnglish: award.bodyTextEnglish,
                                                projectTitle: award.projectTitle,
                                                projectMembers: award.projectMembers,
                                                signatureUrl1: showAdviserSignature ? (adviserSignatureUrl || schoolProfile?.adviser_signature_url) : undefined,
                                                signatureUrl2: showHeadSignature ? schoolProfile?.head_signature_url : undefined
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                {/* Print Only Layout */}
                <div className="hidden print:block w-full bg-white m-0 p-0 border-none">
                    {batchStudents.filter(s => s.selected).map(student => (
                        <div key={`print-honor-${student.lrn}`} className="certificate">
                            <CertificateRenderer data={{
                                ...certData,
                                learnerName: student.name,
                                lrn: student.lrn,
                                awardTitleTagalog: student.honors.tagalog,
                                awardTitleEnglish: student.honors.english,
                                signatureUrl1: showAdviserSignature ? (adviserSignatureUrl || schoolProfile?.adviser_signature_url) : undefined,
                                signatureUrl2: showHeadSignature ? schoolProfile?.head_signature_url : undefined
                            }} />
                        </div>
                    ))}
                    {subjectAwards.filter(s => s.selected).map(award => (
                        <div key={`print-award-${award.subject}`} className="certificate">
                            <CertificateRenderer data={{
                                ...certData,
                                learnerName: award.student,
                                lrn: award.lrn,
                                awardTitleTagalog: `May Pinakamataas na Marka sa ${award.subject}`,
                                awardTitleEnglish: `Highest Grade in ${award.subject}`,
                                excellenceAward: 'Subject Excellence Award',
                                signatureUrl1: showAdviserSignature ? (adviserSignatureUrl || schoolProfile?.adviser_signature_url) : undefined,
                                signatureUrl2: showHeadSignature ? schoolProfile?.head_signature_url : undefined
                            }} />
                        </div>
                    ))}
                    {customAwards.filter(s => s.selected).map(award => (
                        <div key={`print-custom-${award.id}`} className="certificate">
                            <CertificateRenderer data={{
                                ...certData,
                                learnerName: award.studentName,
                                lrn: award.lrn,
                                awardTitleTagalog: award.awardTitleTagalog,
                                awardTitleEnglish: award.awardTitleEnglish,
                                excellenceAward: award.excellenceAward,
                                bodyTextTagalog: award.bodyTextTagalog,
                                bodyTextEnglish: award.bodyTextEnglish,
                                projectTitle: award.projectTitle,
                                projectMembers: award.projectMembers,
                                signatureUrl1: showAdviserSignature ? (adviserSignatureUrl || schoolProfile?.adviser_signature_url) : undefined,
                                signatureUrl2: showHeadSignature ? schoolProfile?.head_signature_url : undefined
                            }} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Print styles injection */}
            <style>{`
                @media print {
                  /* FORCE CORRECT PAPER SIZE */
                  @page {
                    size: 11in 8.5in; /* Landscape */
                    margin: 0;
                  }

                  body, html {
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 100% !important;
                    height: auto !important;
                    background: white !important;
                  }

                  /* REMOVE UI ELEMENTS */
                  .sidebar,
                  .header,
                  .controls,
                  .no-print {
                    display: none !important;
                  }

                  /* EACH CERTIFICATE = 1 PAGE */
                  .certificate {
                    width: 11in !important;
                    height: 8.5in !important;
                    page-break-after: always !important;
                    break-after: page !important;
                    display: block !important;
                    position: relative !important;
                    overflow: hidden !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    border: none !important;
                    box-shadow: none !important;
                  }
                  
                  .certificate:last-child {
                      page-break-after: auto !important;
                      break-after: auto !important;
                  }
                  
                  .certificate-renderer {
                      margin: 0 !important;
                      box-shadow: none !important;
                      border: none !important;
                  }
                }
            `}</style>
            {isGeneratingPDF && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl shadow-inner">
                            <RefreshCcw className="w-10 h-10 animate-spin" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">Compiling Certificate PDF Batch</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Generating page {pdfProgress}%...</p>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-2 overflow-hidden border border-slate-150/50 dark:border-white/5 relative">
                            <div 
                                className="bg-blue-600 h-full rounded-full transition-all duration-300 relative"
                                style={{ width: `${pdfProgress}%` }}
                            >
                                <span className="absolute right-0 top-0 bottom-0 w-2 bg-white/40 blur-[1px] animate-pulse" />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold italic">Please keep this window active while the PDF compiles.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

