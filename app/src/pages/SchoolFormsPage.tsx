import { useMemo } from 'react';
import { useAppStore } from '../stores';
import { useAuthStore } from '../stores/auth-store';
import { filterSF9Sections } from '../lib/rbac';
import { 
    Files, 
    FileText, 
    CheckCircle2, 
    HeartPulse,
    Printer,
    TrendingUp,
    Users,
    Tag
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── Activity Log System (IndexedDB) ──────────────────────────────────
import { db as idb } from '../services/database';

interface ActivityEntry {
    id: string;
    type: 'sf9' | 'sf10' | 'sf8' | 'sf6' | 'sf5' | 'attendance';
    action: string;
    detail: string;
    timestamp: number; // epoch ms
    user_id: string;
}

async function pushActivity(type: ActivityEntry['type'], action: string, detail: string, user_id: string) {
    const entry: ActivityEntry = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type,
        action,
        detail,
        timestamp: Date.now(),
        user_id,
    };
    await idb.addActivityEntry(entry);
}

// ── Circular Progress Ring ───────────────────────────────────────────
function ProgressRing({ progress, color, size = 18 }: { progress: number; color: string; size?: number }) {
    const strokeWidth = 2.5;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    const colorMap: Record<string, string> = {
        emerald: '#10b981',
        blue: '#3b82f6',
        amber: '#f59e0b',
    };

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-slate-100 dark:text-white/5" />
            <circle
                cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke={colorMap[color] || '#10b981'}
                strokeWidth={strokeWidth} strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
            />
        </svg>
    );
}

// ── Optimized Viewport-Filling Form Card ──────────────────────────────
interface FormCardProps {
    title: string;
    description?: string;
    icon: LucideIcon;
    color: string;
    badge?: string;
    stats?: { label: string; value: string | number; isProgress?: boolean }[];
    onSelect: () => void;
}

function FormCard({ title, description, icon: Icon, color, stats, onSelect }: FormCardProps) {
    const colorMap: Record<string, { bg: string; text: string; border: string; accent: string; gradient: string }> = {
        emerald: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20', accent: '#10b981', gradient: 'from-emerald-500 to-teal-500' },
        blue: { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20', accent: '#3b82f6', gradient: 'from-blue-500 to-indigo-500' },
        amber: { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20', accent: '#f59e0b', gradient: 'from-amber-500 to-orange-500' },
        rose: { bg: 'bg-rose-500/10 dark:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20', accent: '#f43f5e', gradient: 'from-rose-500 to-pink-500' },
        violet: { bg: 'bg-violet-500/10 dark:bg-violet-500/20', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500/20', accent: '#8b5cf6', gradient: 'from-violet-500 to-purple-500' },
        indigo: { bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20', accent: '#6366f1', gradient: 'from-indigo-500 to-blue-500' },
        cyan: { bg: 'bg-cyan-500/10 dark:bg-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/20', accent: '#06b6d4', gradient: 'from-cyan-500 to-teal-500' },
        orange: { bg: 'bg-orange-500/10 dark:bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/20', accent: '#f97316', gradient: 'from-orange-500 to-amber-500' },
    };

    const c = colorMap[color] || colorMap.emerald;

    return (
        <div
            onClick={onSelect}
            className="group relative flex flex-col justify-between p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-500/40 transition-all duration-300 cursor-pointer overflow-hidden text-center items-center"
        >
            {/* Background Icon Watermark */}
            <div className={`absolute -right-5 -bottom-5 opacity-[0.05] dark:opacity-[0.08] group-hover:opacity-[0.12] transition-all duration-500 pointer-events-none transform -rotate-12 group-hover:rotate-0 group-hover:scale-110 ${c.text}`}>
                <Icon className="w-32 h-32" />
            </div>

            <div className="relative z-10 flex flex-col items-center w-full">
                {/* Centered Icon Header */}
                <div className="flex items-center justify-center mb-3">
                    <div className={`w-12 h-12 rounded-2xl bg-linear-to-br ${c.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                        <Icon className="w-6 h-6" />
                    </div>
                </div>

                {/* Form Title */}
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-center">
                    {title}
                </h3>

                {description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 text-center max-w-[95%]">
                        {description}
                    </p>
                )}
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 relative z-10 w-full">
                {/* Minimal Stat Badges - Centered */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                    {stats?.map((stat, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {stat.isProgress ? (
                                <>
                                    <ProgressRing progress={Number(String(stat.value).replace('%', ''))} color={color} size={15} />
                                    <span>{stat.value}</span>
                                </>
                            ) : (
                                <span>{stat.label}: <strong className="font-black text-slate-900 dark:text-white">{stat.value}</strong></span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Main Page Component ──────────────────────────────────────────────
export function SchoolFormsPage() {
    const activeStudentsCount = useAppStore((s) => s.students.length);
    const sections = useAppStore((s) => s.sections);
    const students = useAppStore((s) => s.students);
    const subjects = useAppStore((s) => s.subjects);
    const gradingSheetRecords = useAppStore((s) => s.gradingSheetRecords);
    const activeSchoolYear = useAppStore((s) => s.activeSchoolYear);
    const setCurrentView = useAppStore((s) => s.setCurrentView);
    const user = useAuthStore((s) => s.user);

    const officialSections = useMemo(() => {
        return filterSF9Sections(user, sections);
    }, [sections, user]);

    const activeSectionsCount = officialSections.length;

    const officialStudents = useMemo(() => {
        const sectionIds = new Set(officialSections.map(s => s.id));
        const sectionNames = new Set(officialSections.map(s => s.section_name));
        return students.filter(st =>
            st.student_section && (sectionIds.has(st.student_section) || sectionNames.has(st.student_section))
        );
    }, [students, officialSections]);

    const officialStudentLrns = useMemo(() => new Set(officialStudents.map(s => s.lrn)), [officialStudents]);

    const officialSubjects = useMemo(() => {
        const validGradeLevels = new Set(officialSections.map(s => s.section_grade_level));
        return subjects.filter(s => validGradeLevels.has(s.grade_level) && !s.is_teaching_load);
    }, [subjects, officialSections]);

    const officialSubjectIds = useMemo(() => new Set(officialSubjects.map(s => s.id)), [officialSubjects]);

    const sf9Progress = useMemo(() => {
        if (activeStudentsCount === 0 || officialSubjects.length === 0) return 0;
        const uniqueRecords = new Set(
            gradingSheetRecords
                .filter(r => officialStudentLrns.has(r.student_lrn) && officialSubjectIds.has(r.subject_id))
                .map(r => `${r.student_lrn}_${r.subject_id}_${r.quarter}`)
        );
        const totalPossible = activeStudentsCount * officialSubjects.length * 4;
        return totalPossible > 0 ? Math.min(Math.round((uniqueRecords.size / totalPossible) * 100), 100) : 0;
    }, [gradingSheetRecords, activeStudentsCount, officialSubjects, officialStudentLrns, officialSubjectIds]);

    const currentMonth = useMemo(() => {
        return new Date().toLocaleString('en-US', { month: 'long' }).toUpperCase();
    }, []);

    const forms = [
        {
            id: 'attendance',
            title: 'SF2 Daily Attendance',
            description: 'Daily Attendance Report. Tracking presence, tardiness, and absences.',
            icon: CheckCircle2,
            color: 'orange',
            stats: [
                { label: 'Learners', value: activeStudentsCount },
                { label: 'Month', value: currentMonth },
            ],
        },
        {
            id: 'sf5',
            title: 'SF5 Report on Promotion',
            description: 'Report on Promotion and Learning Progress & Achievement.',
            icon: Users,
            color: 'blue',
            stats: [
                { label: 'Learners', value: activeStudentsCount },
                { label: 'Sections', value: activeSectionsCount },
            ],
        },
        {
            id: 'sf6',
            title: 'SF6 Summarized Report',
            description: 'Summarized report on promotion and learning progress & achievement per section.',
            icon: TrendingUp,
            color: 'indigo',
            stats: [
                { label: 'Learners', value: activeStudentsCount },
                { label: 'Sections', value: activeSectionsCount },
            ],
        },
        {
            id: 'sf8',
            title: 'SF8 Basic Health and Nutrition',
            description: 'Learner\'s Basic Health and Nutrition Report with section-based roster and summary table.',
            icon: HeartPulse,
            color: 'rose',
            stats: [
                { label: 'Learners', value: activeStudentsCount },
                { label: 'Sections', value: activeSectionsCount },
            ],
        },
        {
            id: 'sf9',
            title: 'SF9 Report Card',
            description: 'Learner\'s Progress Report Card (Form 138). Term-based grading and progress summary.',
            icon: Files,
            color: 'emerald',
            stats: [
                { label: 'Encoding', value: `${sf9Progress}%`, isProgress: true },
                { label: 'School Year', value: activeSchoolYear },
            ],
        },
        {
            id: 'sf10',
            title: 'SF10 Permanent Record',
            description: 'Learner\'s Permanent Academic Record (Form 137). Scholastic history and certifications.',
            icon: FileText,
            color: 'violet',
            stats: [
                { label: 'Learners', value: activeStudentsCount },
                { label: 'Sections', value: activeSectionsCount },
            ],
        },
        {
            id: 'name-tags',
            title: 'Name Tag Generator',
            description: 'Generate batch-printable name tags for students with multiple premium templates.',
            icon: Tag,
            color: 'cyan',
            stats: [
                { label: 'Templates', value: 3 },
                { label: 'Layout', value: '2x4 Grid' },
            ],
        },
        {
            id: 'lir',
            title: 'Learner\'s Individual Record',
            description: 'Comprehensive learner record featuring academic grade tracking, written works, performance tasks, and cumulative attendance monitoring.',
            icon: FileText,
            color: 'blue',
            stats: [
                { label: 'Learners', value: activeStudentsCount },
                { label: 'Sections', value: activeSectionsCount },
            ],
        },
        {
            id: 'tgs',
            title: 'Temporary Grade Slip',
            description: 'Generate compact, print-ready grade slips for students (4 per page).',
            icon: Printer,
            color: 'orange',
            stats: [
                { label: 'Learners', value: activeStudentsCount },
                { label: 'Sections', value: activeSectionsCount },
            ],
        },
        {
            id: 'pace',
            title: 'PACE Form',
            description: 'Performance Assessment in Reading and Literacy (PACE Form 138-Reading). DepEd MATATAG competency assessment.',
            icon: FileText,
            color: 'amber',
            stats: [
                { label: 'Competencies', value: 27 },
                { label: 'Terms', value: 3 },
            ],
        },
    ];

    const handleFormOpen = (id: string) => {
        if (!user) return;
        if (id === 'attendance') {
            void pushActivity('attendance', 'Opened SF2 Attendance', 'Navigated to SF2 Daily Attendance module', user.uid);
            setCurrentView('attendance');
        } else if (id === 'sf5') {
            void pushActivity('sf5', 'Opened SF5 Report', 'Navigated to SF5 Report on Promotion module', user.uid);
            setCurrentView('sf5');
        } else if (id === 'sf6') {
            void pushActivity('sf6', 'Opened SF6 Report', 'Navigated to SF6 Summarized Report module', user.uid);
            setCurrentView('sf6');
        } else if (id === 'sf8') {
            void pushActivity('sf8', 'Opened SF8 Report', 'Navigated to SF8 Basic Health & Nutrition module', user.uid);
            setCurrentView('sf8');
        } else if (id === 'sf9') {
            void pushActivity('sf9', 'Opened SF9 Report Card', 'Navigated to SF9 Form 138 module', user.uid);
            setCurrentView('sf9');
        } else if (id === 'sf10') {
            void pushActivity('sf10', 'Opened SF10 Permanent Record', 'Navigated to SF10 Form 137 module', user.uid);
            setCurrentView('sf10');
        } else if (id === 'name-tags') {
            setCurrentView('name-tags');
        } else if (id === 'lir') {
            setCurrentView('lir');
        } else if (id === 'tgs') {
            setCurrentView('tgs');
        } else if (id === 'pace') {
            setCurrentView('pace');
        }
    };

    return (
        <div className="max-w-7xl mx-auto flex flex-col min-h-[calc(100vh-6rem)] justify-between pb-3">
            {/* Main Cards Grid — Clean Viewport Fill */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 flex-1">
                {forms.map((form) => (
                    <FormCard
                        key={form.id}
                        title={form.title}
                        description={form.description}
                        icon={form.icon}
                        color={form.color}
                        stats={form.stats}
                        onSelect={() => handleFormOpen(form.id)}
                    />
                ))}
            </div>
        </div>
    );
}
