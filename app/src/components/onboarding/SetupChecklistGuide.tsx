import React, { useState } from 'react';
import { 
    School, 
    BookOpen, 
    Layers, 
    Users, 
    FileSpreadsheet, 
    ArrowRight, 
    Sparkles, 
    AlertTriangle, 
    ChevronDown, 
    ChevronUp, 
    HelpCircle, 
    Check, 
    Compass, 
    ShieldCheck, 
    Info, 
    UserCheck,
    BookmarkCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../stores/app-store';

interface SetupChecklistGuideProps {
    isModal?: boolean;
    onClose?: () => void;
    showTourTrigger?: boolean;
}

export const SetupChecklistGuide: React.FC<SetupChecklistGuideProps> = ({
    isModal = false,
    onClose,
    showTourTrigger = true
}) => {
    const setCurrentView = useAppStore(state => state.setCurrentView);
    const schoolProfile = useAppStore(state => state.schoolProfile);
    const subjects = useAppStore(state => state.subjects);
    const sections = useAppStore(state => state.sections);
    const students = useAppStore(state => state.students);

    // Active state checks
    const isProfileComplete = Boolean(
        schoolProfile?.school_id && 
        schoolProfile?.name && 
        schoolProfile.name.trim() !== '' &&
        schoolProfile.school_id.trim() !== ''
    );
    const isSubjectsComplete = subjects && subjects.length > 0;
    const isSectionsComplete = sections && sections.length > 0;
    const isStudentsComplete = students && students.length > 0;
    const isGradingReady = isProfileComplete && isSubjectsComplete && isSectionsComplete && isStudentsComplete;

    // Track active expanded steps for accordion breakdown
    const [expandedStep, setExpandedStep] = useState<number | null>(
        !isProfileComplete ? 1 :
        !isSubjectsComplete ? 2 :
        !isSectionsComplete ? 3 :
        !isStudentsComplete ? 4 : 5
    );

    const [activeRoleTab, setActiveRoleTab] = useState<'adviser_teaching' | 'subject_teacher' | 'self_contained'>('adviser_teaching');

    // Calculate completion score
    const completedStepsCount = [
        isProfileComplete,
        isSubjectsComplete,
        isSectionsComplete,
        isStudentsComplete
    ].filter(Boolean).length;

    const progressPercentage = Math.round((completedStepsCount / 4) * 100);

    const steps = [
        {
            stepNumber: 1,
            title: "Institute Profile & Academic Year",
            subtitle: "Set your official DepEd School ID, School Name, and active School Year.",
            icon: School,
            color: "from-blue-600 to-indigo-600",
            badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
            isComplete: isProfileComplete,
            completionText: isProfileComplete ? `${schoolProfile.name || 'Configured'} (ID: ${schoolProfile.school_id})` : "Not configured yet",
            primaryAction: {
                label: isProfileComplete ? "Update Profile" : "Configure Institute Profile",
                onClick: () => {
                    setCurrentView('institute');
                    if (onClose) onClose();
                }
            },
            explanation: "All official DepEd forms (SF1, SF2, SF5, SF9, SF10) permanently inherit these credentials in their headers, banners, and signature fields. Setting this first ensures every class and grading record is properly anchored.",
            tips: [
                "Enter your official 6-digit DepEd School ID (e.g. 300123).",
                "Ensure the Active School Year matches your current academic cycle (e.g. 2025-2026).",
                "Upload a transparent PNG of the School Head / Principal's digital signature for 1-click stamped forms."
            ]
        },
        {
            stepNumber: 2,
            title: "Curriculum & Subjects Setup",
            subtitle: "Load the standardized DepEd learning areas using the Curriculum Wizard.",
            icon: BookOpen,
            color: "from-emerald-600 to-teal-600",
            badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
            isComplete: isSubjectsComplete,
            completionText: isSubjectsComplete ? `${subjects.length} standard subjects loaded` : "No subjects loaded yet",
            primaryAction: {
                label: isSubjectsComplete ? "Manage Subjects" : "Open Curriculum Wizard",
                onClick: () => {
                    setCurrentView('subjects');
                    if (onClose) onClose();
                }
            },
            explanation: "Subjects establish the official learning areas for your school. FormEase Pro assigns deterministic canonical IDs to each learning area to ensure report cards (SF9) and permanent records (SF10) match DepEd regulations.",
            criticalWarning: "⚠️ NEVER manually type standard subject names (e.g. typing 'Sci 7', 'Scie', or 'Math 7'). Always click 'Load Standard Curriculum' to ensure flawless grade calculations and cross-teacher exports.",
            tips: [
                "Select your school's official offering (Elementary MATATAG, JHS Grades 7–10, or SHS Strands).",
                "If you need unique electives (e.g., Campus Journalism or Robotics), add them as Custom Subjects after loading the standard curriculum."
            ]
        },
        {
            stepNumber: 3,
            title: "Classes & Sections (Advisory vs Teaching Load)",
            subtitle: "Configure section rosters and assign specific teaching loads without conflicts.",
            icon: Layers,
            color: "from-amber-600 to-orange-600",
            badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
            isComplete: isSectionsComplete,
            completionText: isSectionsComplete ? `${sections.length} section(s) configured` : "No sections created yet",
            primaryAction: {
                label: isSectionsComplete ? "Manage Sections" : "Create First Section",
                onClick: () => {
                    setCurrentView('sections');
                    if (onClose) onClose();
                }
            },
            explanation: "To prevent subject conflicts, understand the golden architectural distinction between Section Official Curriculum and Personal Teaching Load.",
            showRoleMatrix: true,
            tips: [
                "If subjects ever appear missing on SF9 or Consolidated Grades, click 'Reset to Standard DepEd Curriculum' in Section Edit.",
                "For Senior High School, verify that Track, Strand, and Semester (Sem 1 vs Sem 2) match your actual class schedule."
            ]
        },
        {
            stepNumber: 4,
            title: "Student Enrollment via 1-Click LIS SF1 Import",
            subtitle: "Import your official DepEd LIS School Form 1 (.xlsx) masterlist.",
            icon: Users,
            color: "from-purple-600 to-pink-600",
            badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
            isComplete: isStudentsComplete,
            completionText: isStudentsComplete ? `${students.length} student(s) enrolled` : "No students enrolled yet",
            primaryAction: {
                label: isStudentsComplete ? "View Student Masterlist" : "Import LIS SF1 File",
                onClick: () => {
                    setCurrentView('students');
                    if (onClose) onClose();
                }
            },
            explanation: "FormEase Pro features an intelligent parser built specifically for DepEd LIS SF1 spreadsheets. It extracts 12-digit LRNs, exact DepEd name order, and male/female segregation in under 2 seconds.",
            tips: [
                "Always download the clean SF1 (.xlsx) from the official DepEd LIS Portal.",
                "Using the same official SF1 guarantees student names and LRNs will match identically between the Adviser and all Subject Teachers."
            ]
        },
        {
            stepNumber: 5,
            title: "Grading & Consolidated Master Sheets",
            subtitle: "Encode scores in E-Class Record and consolidate grades automatically.",
            icon: FileSpreadsheet,
            color: "from-sky-600 to-cyan-600",
            badgeColor: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
            isComplete: isGradingReady,
            completionText: isGradingReady ? "Ready for Live Grading" : "Complete Steps 1–4 first",
            primaryAction: {
                label: "Open E-Class Record",
                onClick: () => {
                    setCurrentView('class-record');
                    if (onClose) onClose();
                }
            },
            secondaryAction: {
                label: "Consolidated Master Sheet",
                onClick: () => {
                    setCurrentView('consolidated-grades');
                    if (onClose) onClose();
                }
            },
            explanation: "Subject teachers encode raw scores in E-Class Record (WW, PT, QA) which live-transmutes via DepEd Order No. 8, s. 2015. Advisers open Consolidated Grades where their own subject auto-syncs and other teachers' grades are entered as protected manual values.",
            tips: [
                "In Consolidated Grades, subjects in your teaching load show [E-Class] badge and sync automatically.",
                "Subjects taught by other colleagues show [Manual] badge; your sync will never overwrite their entries!",
                "For MAPEH, use the top Component Selector to encode Music, Arts, PE, and Health separately."
            ]
        }
    ];

    const content = (
        <div className="w-full space-y-6">
            {/* Header banner */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-900 via-indigo-950 to-blue-900 p-6 md:p-8 text-white shadow-xl">
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold tracking-wider text-blue-200 uppercase">
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            Official DepEd Setup & Onboarding Guide
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                            Zero-Conflict Master Setup Checklist
                        </h2>
                        <p className="text-sm md:text-base text-blue-100/80 max-w-2xl leading-relaxed">
                            Follow these sequential steps to configure your school profile, standard curriculum, and teaching assignments so you never encounter missing subjects or role conflicts.
                        </p>
                    </div>

                    {/* Progress score */}
                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 min-w-45">
                        <div className="text-xs uppercase tracking-wider font-bold text-blue-200 mb-1">
                            Setup Readiness
                        </div>
                        <div className="text-3xl font-black tracking-tight text-white flex items-baseline gap-1">
                            {progressPercentage}%
                            <span className="text-xs text-blue-200 font-medium">({completedStepsCount}/4 Done)</span>
                        </div>
                        <div className="w-full bg-white/20 h-2 rounded-full mt-3 overflow-hidden">
                            <motion.div 
                                className="h-full bg-linear-to-r from-emerald-400 to-teal-300 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercentage}%` }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                </div>

                {/* Smoke-test friendly guidance anchor */}
                <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-blue-200/90">
                    <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-amber-300 shrink-0" />
                        <span><strong>Status:</strong> {completedStepsCount === 4 ? "All initial setup requirements are satisfied!" : "No records yet or setup is in progress. Complete each step in order."}</span>
                    </div>

                    {showTourTrigger && (
                        <button
                            id="btn-start-onboarding-tour-guide"
                            onClick={() => {
                                const event = new CustomEvent('formease-trigger-onboarding');
                                window.dispatchEvent(event);
                                if (onClose) onClose();
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white font-semibold text-xs transition-all active:scale-95 cursor-pointer"
                        >
                            <HelpCircle className="w-3.5 h-3.5 text-blue-300" />
                            Start Onboarding Tour
                        </button>
                    )}
                </div>
            </div>

            {/* Checklist Stepper */}
            <div className="space-y-4">
                {steps.map((step) => {
                    const isExpanded = expandedStep === step.stepNumber;
                    const Icon = step.icon;

                    return (
                        <div 
                            key={step.stepNumber}
                            id={`setup-step-${step.stepNumber}`}
                            className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                                step.isComplete 
                                    ? 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-sm' 
                                    : 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/60 shadow-md ring-1 ring-indigo-500/10'
                            }`}
                        >
                            {/* Step Header */}
                            <div 
                                onClick={() => setExpandedStep(isExpanded ? null : step.stepNumber)}
                                className="p-4 md:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                            >
                                <div className="flex items-center gap-3.5 min-w-0">
                                    {/* Number / Status Icon */}
                                    <div className="relative shrink-0">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-linear-to-br ${step.color} text-white shadow-md shadow-indigo-500/10`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        {step.isComplete ? (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white border-2 border-white dark:border-slate-900 shadow-xs">
                                                <Check className="w-3 h-3 stroke-3" />
                                            </div>
                                        ) : (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white dark:border-slate-900 shadow-xs">
                                                {step.stepNumber}
                                            </div>
                                        )}
                                    </div>

                                    {/* Titles */}
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                Step {step.stepNumber}
                                            </span>
                                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${step.badgeColor}`}>
                                                {step.completionText}
                                            </span>
                                        </div>
                                        <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white truncate">
                                            {step.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                                            {step.subtitle}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            step.primaryAction.onClick();
                                        }}
                                        className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-sm cursor-pointer ${
                                            step.isComplete
                                                ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                                                : 'bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-indigo-500/20'
                                        }`}
                                    >
                                        <span>{step.primaryAction.label}</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>

                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.25, ease: "easeInOut" }}
                                        className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-5 md:p-6 space-y-4"
                                    >
                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                            {step.explanation}
                                        </p>

                                        {/* Critical Warning if present */}
                                        {step.criticalWarning && (
                                            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3 text-amber-900 dark:text-amber-200 text-xs">
                                                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                                <div className="leading-relaxed">
                                                    {step.criticalWarning}
                                                </div>
                                            </div>
                                        )}

                                        {/* Step 3: Interactive Role Matrix */}
                                        {step.showRoleMatrix && (
                                            <div className="space-y-3 pt-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                        <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                        How to configure: Choose your role in this section
                                                    </span>

                                                    {/* Tabs */}
                                                    <div className="inline-flex p-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-xs font-semibold flex-wrap gap-1">
                                                        <button
                                                            onClick={() => setActiveRoleTab('adviser_teaching')}
                                                            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                                                                activeRoleTab === 'adviser_teaching'
                                                                    ? 'bg-white dark:bg-indigo-600 text-indigo-900 dark:text-white shadow-xs'
                                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                                            }`}
                                                        >
                                                            I am the Class Adviser (+ Teach My Subject)
                                                        </button>
                                                        <button
                                                            onClick={() => setActiveRoleTab('subject_teacher')}
                                                            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                                                                activeRoleTab === 'subject_teacher'
                                                                    ? 'bg-white dark:bg-indigo-600 text-indigo-900 dark:text-white shadow-xs'
                                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                                            }`}
                                                        >
                                                            I am a Subject Teacher only
                                                        </button>
                                                        <button
                                                            onClick={() => setActiveRoleTab('self_contained')}
                                                            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                                                                activeRoleTab === 'self_contained'
                                                                    ? 'bg-white dark:bg-indigo-600 text-indigo-900 dark:text-white shadow-xs'
                                                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                                            }`}
                                                        >
                                                            Elementary Self-Contained (All Subjects)
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Role Cards based on selection */}
                                                {activeRoleTab === 'adviser_teaching' && (
                                                    <div className="p-4 rounded-xl border bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800 shadow-xs space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2 font-bold text-sm text-indigo-900 dark:text-indigo-200">
                                                                <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                                Role: Class Adviser (who also teaches this class)
                                                            </div>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300">
                                                                Most Common Setup
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                                            Use this if you are the official Class Adviser and you also personally teach 1 or 2 learning areas (e.g. Science) to your advisory students:
                                                        </p>
                                                        <ul className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                                                            <li className="flex items-start gap-1.5">
                                                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                                                <span><strong>Check:</strong> [✓] <em>"Is this your Advisory Section?"</em></span>
                                                            </li>
                                                            <li className="flex items-start gap-1.5">
                                                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                                                <span><strong>Section Official Curriculum:</strong> Keep all 8–10 subjects enabled. (Required so SF9 Report Cards, SF10 Permanent Records, and Consolidated Sheets show every subject).</span>
                                                            </li>
                                                            <li className="flex items-start gap-1.5">
                                                                <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                                                <span><strong>My Teaching Load:</strong> Check <u>ONLY</u> the subject(s) you personally teach (e.g. Science). <strong>Do NOT check all subjects!</strong> Leave subjects taught by your colleagues unchecked in your load.</span>
                                                            </li>
                                                            <li className="flex items-start gap-1.5">
                                                                <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                                                                <span><strong>Grading Result:</strong> Your E-Class Record only shows Science. In Consolidated Grades, your Science grades sync live from E-Class, while other teachers' subjects remain as protected [Manual] entries that will never be overwritten.</span>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                )}

                                                {activeRoleTab === 'subject_teacher' && (
                                                    <div className="p-4 rounded-xl border bg-teal-50/70 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800 shadow-xs space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2 font-bold text-sm text-teal-900 dark:text-teal-200">
                                                                <BookmarkCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                                                Role: Subject Teacher in Another Teacher's Class
                                                            </div>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
                                                                Subject Load Only
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                                            Use this when you teach a subject (e.g. English) in a section where another teacher is the adviser:
                                                        </p>
                                                        <ul className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                                                            <li className="flex items-start gap-1.5">
                                                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                                                <span><strong>Leave UNCHECKED:</strong> [ ] <em>"Is this your Advisory Section?"</em></span>
                                                            </li>
                                                            <li className="flex items-start gap-1.5">
                                                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                                                <span><strong>My Teaching Load:</strong> Check <u>ONLY</u> the subject you teach in this section (e.g. English).</span>
                                                            </li>
                                                            <li className="flex items-start gap-1.5">
                                                                <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                                                                <span><strong>Grading Result:</strong> Your E-Class Record only shows English for this section. You won't be cluttered with advisory forms (SF9, SF10, SF5).</span>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                )}

                                                {activeRoleTab === 'self_contained' && (
                                                    <div className="p-4 rounded-xl border bg-purple-50/70 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800 shadow-xs space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2 font-bold text-sm text-purple-900 dark:text-purple-200">
                                                                <UserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                                Role: Elementary Self-Contained Adviser
                                                            </div>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300">
                                                                Grades 1–3 / All Subjects
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                                            Use this if you are a non-departmentalized elementary teacher teaching all subjects to your own classroom:
                                                        </p>
                                                        <ul className="text-xs space-y-1.5 text-slate-700 dark:text-slate-300">
                                                            <li className="flex items-start gap-1.5">
                                                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                                                <span><strong>Check:</strong> [✓] <em>"Is this your Advisory Section?"</em></span>
                                                            </li>
                                                            <li className="flex items-start gap-1.5">
                                                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                                                <span><strong>Section Official Curriculum:</strong> All standard grade-level subjects enabled.</span>
                                                            </li>
                                                            <li className="flex items-start gap-1.5">
                                                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                                                <span><strong>My Teaching Load:</strong> Check <u>ALL</u> subjects (since you teach every subject yourself).</span>
                                                            </li>
                                                            <li className="flex items-start gap-1.5">
                                                                <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                                                                <span><strong>Grading Result:</strong> Every subject appears in your E-Class Record and all sync seamlessly to Consolidated Grades and SF9!</span>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Multi-section teaching callout */}
                                                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
                                                    <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                                    <span><strong>Teaching in multiple sections?</strong> Configure your own advisory section under the first tab, and configure your other sections under the second tab. FormEase Pro keeps them completely separated and organized automatically!</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Tips list */}
                                        <div className="space-y-1.5 pt-2">
                                            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                Best Practices & Conflict Prevention:
                                            </div>
                                            <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-400 list-disc list-inside">
                                                {step.tips.map((tip, idx) => (
                                                    <li key={idx} className="leading-relaxed">
                                                        {tip}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Bottom Action Button (mobile or expanded) */}
                                        <div className="pt-3 flex flex-wrap items-center gap-3">
                                            <button
                                                onClick={step.primaryAction.onClick}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-md shadow-indigo-500/20 cursor-pointer"
                                            >
                                                <span>{step.primaryAction.label}</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </button>

                                            {step.secondaryAction && (
                                                <button
                                                    onClick={step.secondaryAction.onClick}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer"
                                                >
                                                    <span>{step.secondaryAction.label}</span>
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    if (isModal) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
                <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 max-h-[90vh] flex flex-col">
                    <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                        <div className="flex items-center gap-2">
                            <Compass className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <h3 className="font-bold text-base text-slate-900 dark:text-white">
                                FormEase Pro Setup & Onboarding Hub
                            </h3>
                        </div>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <div className="p-6 overflow-y-auto">
                        {content}
                    </div>
                </div>
            </div>
        );
    }

    return content;
};
