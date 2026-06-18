import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '../stores';
import { useAuthStore } from '../stores/auth-store';
import { filterSF9Sections } from '../lib/rbac';
import { 
    Files, 
    FileText, 
    CheckCircle2, 
    ArrowRight, 
    Clock, 
    Info, 
    Sparkles,
    ShieldCheck,
    HeartPulse,
    Download,
    Printer,
    Lightbulb,
    TrendingUp,
    Users,
    Tag,
    X
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

function formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;

    return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
}

function formatFullTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
    });
}

function getActivityColor(type: ActivityEntry['type']): string {
    if (type === 'sf9') return 'emerald';
    if (type === 'sf10') return 'blue';
    if (type === 'sf5') return 'blue';
    return 'amber';
}

function AnimatedNumber({ value, suffix = '' }: { value: number | string; suffix?: string }) {
    return <>{value}{suffix}</>;
}

// ── Circular Progress Ring ───────────────────────────────────────────
function ProgressRing({ progress, color, size = 36 }: { progress: number; color: string; size?: number }) {
    const strokeWidth = 3.5;
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

// ── Compact Form Card ────────────────────────────────────────────────
interface FormCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    color: string;
    badge?: string;
    stats?: { label: string; value: string | number; isProgress?: boolean }[];
    onSelect: () => void;
    delay?: number;
}

function FormCard({ title, description, icon: Icon, color, badge, stats, onSelect }: FormCardProps) {
    const colorMap: Record<string, { bg: string; text: string; border: string; accent: string; gradient: string }> = {
        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20', accent: '#10b981', gradient: 'from-emerald-500 to-teal-400' },
        blue: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20', accent: '#3b82f6', gradient: 'from-blue-500 to-indigo-400' },
        amber: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20', accent: '#f59e0b', gradient: 'from-amber-500 to-orange-400' },
        rose: { bg: 'bg-rose-500/10', text: 'text-rose-600', border: 'border-rose-500/20', accent: '#f43f5e', gradient: 'from-rose-500 to-pink-400' },
        violet: { bg: 'bg-violet-500/10', text: 'text-violet-600', border: 'border-violet-500/20', accent: '#8b5cf6', gradient: 'from-violet-500 to-purple-400' },
        indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-600', border: 'border-indigo-500/20', accent: '#6366f1', gradient: 'from-indigo-500 to-blue-400' },
        cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-600', border: 'border-cyan-500/20', accent: '#06b6d4', gradient: 'from-cyan-500 to-teal-400' },
        orange: { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500/20', accent: '#f97316', gradient: 'from-orange-500 to-amber-400' },
    };

    const c = colorMap[color] || colorMap.emerald;

    return (
        <div
            onClick={onSelect}
            className={`group relative flex flex-col items-center text-center p-5 backdrop-blur-xl rounded-[22px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-[0_20px_60px_rgba(31,38,135,0.12)] hover:-translate-y-1.5 hover:scale-[1.015] ${
                color === 'emerald' ? 'bg-emerald-50/80 dark:bg-emerald-500/5 hover:bg-emerald-100/80' : 
                color === 'blue' ? 'bg-blue-50/80 dark:bg-blue-500/5 hover:bg-blue-100/80' : 
                color === 'rose' ? 'bg-rose-50/80 dark:bg-rose-500/5 hover:bg-rose-100/80' :
                color === 'violet' ? 'bg-violet-50/80 dark:bg-violet-500/5 hover:bg-violet-100/80' :
                color === 'indigo' ? 'bg-indigo-50/80 dark:bg-indigo-500/5 hover:bg-indigo-100/80' :
                color === 'cyan' ? 'bg-cyan-50/80 dark:bg-cyan-500/5 hover:bg-cyan-100/80' :
                color === 'orange' ? 'bg-orange-50/80 dark:bg-orange-500/5 hover:bg-orange-100/80' :
                'bg-amber-50/80 dark:bg-amber-500/5 hover:bg-amber-100/80'
            }`}
        >
            {/* Top accent gradient bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${c.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

            {/* Background Icon Watermark */}
            <div className={`absolute -right-6 -bottom-6 opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-[0.08] transition-all duration-700 pointer-events-none transform -rotate-12 group-hover:rotate-0 group-hover:scale-110 ${c.text}`}>
                <Icon className="w-40 h-40" />
            </div>

            {/* Header row: icon + badge */}
            <div className="flex flex-col items-center mb-3 relative z-10 w-full">
                <div className={`p-3 rounded-2xl ${c.bg} ${c.text} group-hover:scale-110 transition-transform duration-300 mb-2`}>
                    <Icon className="w-6 h-6" />
                </div>
                {badge && (
                    <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${c.bg} ${c.text} border ${c.border}`}>
                        {badge}
                    </span>
                )}
            </div>

            {/* Title + short description */}
            <div className="mb-4 relative z-10">
                <h3 className="text-[17px] font-black text-slate-800 dark:text-white tracking-tight leading-snug mb-1">{title}</h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium leading-normal line-clamp-2 px-2">{description}</p>
            </div>

            {/* Compact Stats */}
            <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-slate-100 dark:border-white/5 relative z-10">
                {stats?.map((stat, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.12em] mb-1">{stat.label}</p>
                        {stat.isProgress ? (
                            <div className="flex items-center gap-2">
                                <ProgressRing progress={Number(String(stat.value).replace('%', ''))} color={color} size={26} />
                                <span className="text-[14px] font-black text-slate-700 dark:text-slate-200">{stat.value}</span>
                            </div>
                        ) : (
                            <p className="text-[14px] font-black text-slate-700 dark:text-slate-200">
                                <AnimatedNumber value={typeof stat.value === 'number' ? stat.value : stat.value} />
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className={`mt-4 flex items-center justify-center gap-2 text-[12px] font-bold transition-all duration-300 ${c.text} group-hover:gap-3 relative z-10`}>
                Open Form View <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
        </div>
    );
}

function FullLogsModal({ logs, onClose, currentUserId }: { logs: ActivityEntry[]; onClose: () => void; currentUserId: string }) {
    // Filter logs to show only current user's activity
    const userLogs = logs.filter(log => log.user_id === currentUserId);
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/10">
                    <div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white">Your Activity Logs</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{userLogs.length} entries recorded</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Logs list */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                    {userLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Clock className="w-10 h-10 text-slate-200 mb-4" />
                            <p className="text-sm font-bold text-slate-400">No activity yet</p>
                            <p className="text-xs text-slate-400 mt-1">Open any school form to start logging your activity.</p>
                        </div>
                    ) : (
                        userLogs.map((entry) => {
                            const color = getActivityColor(entry.type);
                            return (
                                <div key={entry.id} className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${
                                    color === 'emerald' ? 'border-emerald-100 dark:border-emerald-500/10' :
                                    color === 'blue' ? 'border-blue-100 dark:border-blue-500/10' :
                                    'border-amber-100 dark:border-amber-500/10'
                                }`}>
                                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                                        color === 'emerald' ? 'bg-emerald-500' :
                                        color === 'blue' ? 'bg-blue-500' :
                                        'bg-amber-500'
                                    }`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{entry.action}</p>
                                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                                                color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600' :
                                                color === 'blue' ? 'bg-blue-500/10 text-blue-600' :
                                                'bg-amber-500/10 text-amber-600'
                                            }`}>{entry.type === 'attendance' ? 'SF2' : entry.type.toUpperCase()}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{entry.detail}</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1">{formatFullTimestamp(entry.timestamp)}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-white/10 flex justify-between items-center">
                    <p className="text-[10px] text-slate-400 font-medium">Logs are stored locally on this device.</p>
                    <button onClick={onClose} className="px-5 py-2 bg-slate-900 dark:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-[0.97]">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Tips Data ────────────────────────────────────────────────────────
const TIPS = [
    { text: 'You can generate all SF9 report cards at once by selecting "Batch Download" inside the form view.', icon: Download },
    { text: 'SF10 Permanent Records are auto-populated from your E-Class Record grades data.', icon: TrendingUp },
    { text: 'SF2 now auto-populates school-day dates for each month, so no manual date-fill action is needed.', icon: Lightbulb },
    { text: 'All school forms support both A4 and Letter paper sizes for flexible printing.', icon: Printer },
    { text: 'You can edit any cell on the SF10 by clicking directly on it for quick corrections.', icon: Info },
];

// ── Main Page Component ──────────────────────────────────────────────
export function SchoolFormsPage() {
    const setCurrentView = useAppStore(state => state.setCurrentView);
    const students = useAppStore(state => state.students);
    const gradingSheetRecords = useAppStore(state => state.gradingSheetRecords);
    const subjects = useAppStore(state => state.subjects);
    const sections = useAppStore(state => state.sections);
    const activeSchoolYear = useAppStore(state => state.activeSchoolYear);
    const { user } = useAuthStore();
    const [tipIndex, setTipIndex] = useState(0);
    const [showLogsModal, setShowLogsModal] = useState(false);
    const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);

    useEffect(() => {
        idb.getActivityLog<ActivityEntry>().then(setActivityLog).catch(() => {});
    }, []);

    // Rotate tips every 8 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setTipIndex(prev => (prev + 1) % TIPS.length);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    // ── Navigate + Log Activity ──────────────────────────────────────
    const handleFormOpen = useCallback((formId: string) => {
        const actionMap: Record<string, { type: ActivityEntry['type']; action: string; detail: string }> = {
            sf9: { type: 'sf9', action: 'Opened SF9 Report Card', detail: `S.Y. ${activeSchoolYear}` },
            sf10: { type: 'sf10', action: 'Opened SF10 Permanent Record', detail: `${students.length} learners available` },
            sf8: { type: 'sf8', action: 'Opened SF8 Basic Health and Nutrition Report', detail: `S.Y. ${activeSchoolYear}` },
            sf6: { type: 'sf6', action: 'Opened SF6 Summarized Report', detail: `S.Y. ${activeSchoolYear}` },
            sf5: { type: 'sf5', action: 'Opened SF5 Report on Promotion', detail: `S.Y. ${activeSchoolYear}` },
            attendance: { type: 'attendance', action: 'Opened SF2 Attendance', detail: `Month: ${new Date().toLocaleString('en-US', { month: 'long' })}` },
            'name-tags': { type: 'sf10', action: 'Opened Name Tag Generator', detail: `Preparing batch tags for sections` },
            lir: { type: 'sf10', action: 'Opened Learner\'s Individual Record', detail: `S.Y. ${activeSchoolYear}` },
            tgs: { type: 'sf9', action: 'Opened Temporary Grade Slip', detail: `S.Y. ${activeSchoolYear}` },
        };
        const entry = actionMap[formId];
        if (entry && user) {
            pushActivity(entry.type, entry.action, entry.detail, user.uid)
                .then(() => idb.getActivityLog<ActivityEntry>().then(setActivityLog))
                .catch(() => {});
        }
        setCurrentView(formId);
    }, [setCurrentView, activeSchoolYear, students.length, user]);

    // ── Live Statistics (Filtered by Advisory/Official Class) ─────────
    const officialSections = useMemo(() => {
        return filterSF9Sections(user, sections);
    }, [user, sections]);

    const officialStudents = useMemo(() => {
        if (officialSections.length === 0) return [];
        const validIds = new Set(officialSections.map(s => s.id));
        const validNames = new Set(officialSections.map(s => s.section_name));
        return students.filter(s => 
            s.student_section && (validIds.has(s.student_section) || validNames.has(s.student_section))
        );
    }, [students, officialSections]);

    const activeStudentsCount = officialStudents.length;
    const activeSectionsCount = officialSections.length;

    const sf9Progress = useMemo(() => {
        if (activeStudentsCount === 0) return 0;
        const validSectionIds = new Set(officialSections.map(s => s.id));
        const officialSubjects = subjects.filter(s => s.section_id && validSectionIds.has(s.section_id));
        if (officialSubjects.length === 0) return 0;
        const officialSubjectIds = new Set(officialSubjects.map(s => s.id));
        const officialStudentLrns = new Set(officialStudents.map(s => s.lrn));

        const uniqueRecords = new Set(
            gradingSheetRecords
                .filter(r => officialStudentLrns.has(r.student_lrn) && officialSubjectIds.has(r.subject_id))
                .map(r => `${r.student_lrn}_${r.subject_id}_${r.quarter}`)
        );
        const totalPossible = activeStudentsCount * officialSubjects.length * 4;
        return totalPossible > 0 ? Math.min(Math.round((uniqueRecords.size / totalPossible) * 100), 100) : 0;
    }, [gradingSheetRecords, activeStudentsCount, officialSections, officialStudents, subjects]);

    const currentMonth = useMemo(() => {
        return new Date().toLocaleString('en-US', { month: 'long' }).toUpperCase();
    }, []);

    // Recent activity (latest 3)
    const recentActivity = activityLog.slice(0, 3);

    const forms = [
        {
            id: 'attendance',
            title: 'SF2 Daily Attendance',
            description: 'Daily Attendance Report. Tracking presence, tardiness, and absences.',
            icon: CheckCircle2,
            color: 'orange',
            badge: 'Active',
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
            badge: 'Active',
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
            badge: 'Active',
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
            badge: 'New',
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
            badge: sf9Progress > 80 ? 'Data Ready' : sf9Progress > 0 ? 'In Progress' : 'Not Started',
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
            badge: 'Verified',
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
            badge: 'Tool',
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
            badge: 'New',
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
            badge: 'Tool',
            stats: [
                { label: 'Learners', value: activeStudentsCount },
                { label: 'Sections', value: activeSectionsCount },
            ],
        },
    ];

    const currentTip = TIPS[tipIndex];

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Hub Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-xl">
                            <Sparkles className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em]">Management Hub</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-800 dark:text-white tracking-tighter">School Forms</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl leading-relaxed">
                        A centralized portal for generating and managing official DepEd school forms.
                    </p>
                </div>

                <div className="flex gap-3">
                    <div className="px-4 py-3 bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 flex items-center gap-3 group hover:shadow-lg transition-shadow">
                        <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><ShieldCheck className="w-4 h-4" /></div>
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none mb-0.5">Status</p>
                            <p className="text-xs font-black text-slate-700 dark:text-slate-200">System Verified</p>
                        </div>
                    </div>
                    <div className="px-4 py-3 bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 flex items-center gap-3 group hover:shadow-lg transition-shadow">
                        <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform"><Users className="w-4 h-4" /></div>
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none mb-0.5">Learners</p>
                            <p className="text-xs font-black text-slate-700 dark:text-slate-200"><AnimatedNumber value={activeStudentsCount} /></p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Main Cards Grid */}
                <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {forms.map((form) => (
                        <FormCard
                            key={form.id}
                            title={form.title}
                            description={form.description}
                            icon={form.icon}
                            color={form.color}
                            badge={form.badge}
                            stats={form.stats}
                            onSelect={() => handleFormOpen(form.id)}
                        />
                    ))}
                </div>

                {/* Right Sidebar */}
                <div className="space-y-5">
                    {/* Recent Activity */}
                    <div className="p-5 bg-white/70 dark:bg-white/5 backdrop-blur-xl rounded-[24px] border border-white/60 dark:border-white/10 shadow-[0_8px_32px_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                        <h4 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-[0.15em] mb-5 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> Recent Activity
                        </h4>

                        <div className="space-y-4">
                            {recentActivity.length === 0 ? (
                                <div className="text-center py-6">
                                    <Clock className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                                    <p className="text-[11px] text-slate-400 font-medium">No activity yet. Open a form to start logging.</p>
                                </div>
                            ) : (
                                recentActivity.map((entry) => {
                                    const color = getActivityColor(entry.type);
                                    return (
                                        <div
                                            key={entry.id}
                                            className={`group relative pl-3.5 border-l-2 transition-colors duration-300 ${
                                                color === 'emerald' ? 'border-emerald-200 hover:border-emerald-500' :
                                                color === 'blue' ? 'border-blue-200 hover:border-blue-500' :
                                                'border-amber-200 hover:border-amber-500'
                                            }`}
                                        >
                                            <p className={`text-[9px] font-black uppercase tracking-[0.12em] transition-colors ${
                                                color === 'emerald' ? 'text-slate-400 group-hover:text-emerald-500' :
                                                color === 'blue' ? 'text-slate-400 group-hover:text-blue-500' :
                                                'text-slate-400 group-hover:text-amber-500'
                                            }`}>{formatRelativeTime(entry.timestamp)}</p>
                                            <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 mt-0.5">{entry.action}</p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{entry.detail}</p>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <button
                            onClick={() => setShowLogsModal(true)}
                            className="w-full mt-5 py-2.5 bg-slate-900 dark:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-slate-800 dark:hover:bg-white/20 transition-all active:scale-[0.98]"
                        >
                            View Full Logs
                        </button>
                    </div>

                    {/* Rotating Tips */}
                    <div className="p-4 bg-emerald-500/5 rounded-[24px] border border-emerald-500/10">
                        <div className="flex items-center gap-2 mb-2">
                            <currentTip.icon className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.15em]">Pro Tip</span>
                            <div className="flex-1" />
                            <div className="flex gap-1">
                                {TIPS.map((_, i) => (
                                    <button key={i} onClick={() => setTipIndex(i)} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === tipIndex ? 'bg-emerald-500 w-3.5' : 'bg-emerald-500/20 hover:bg-emerald-500/40'}`} />
                                ))}
                            </div>
                        </div>
                        <p className="text-[11px] text-emerald-800/70 dark:text-emerald-400/70 font-medium leading-relaxed">{currentTip.text}</p>
                    </div>

                </div>
            </div>

            {/* Full Logs Modal */}
            {showLogsModal && user && (
                <FullLogsModal logs={activityLog} onClose={() => setShowLogsModal(false)} currentUserId={user.uid} />
            )}
        </div>
    );
}
