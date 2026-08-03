import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, 
    Layers, 
    Clock3, 
    UserCheck,
    LayoutDashboard,
    HelpCircle,
    Check, 
    ChevronRight, 
    ChevronLeft, 
    X,
    GraduationCap,
    School,
    FileSpreadsheet,
    BarChart3,
    ClipboardList,
    ClipboardCheck,
    IdCard,
    Megaphone,
    Calendar,
    Gamepad2,
    Settings,
    Users
} from 'lucide-react';

interface OnboardingWizardProps {
    onClose: () => void;
}

export function OnboardingWizard({ onClose }: OnboardingWizardProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

    const steps = [
        {
            title: "Welcome to FormEase Pro",
            description: "Your professional DepEd-compliant school management assistant. Let's take a quick guided tour to highlight the main sections of the system and help you get started.",
            elementSelector: null,
            icon: Sparkles,
            color: "from-blue-500 to-indigo-600",
            iconColor: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
            features: [
                "Official DepEd Forms (SF1–SF10)",
                "Automated Grade & Attendance Calculations",
                "Offline-First Encrypted Database",
                "Spotlight Interactive Guide"
            ]
        },
        {
            title: "Navigation Sidebar",
            description: "Access all system modules, class management views, school forms, and utility tools from this central collapsible menu panel.",
            elementSelector: '[data-tour="sidebar"]',
            icon: Layers,
            color: "from-emerald-500 to-teal-600",
            iconColor: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
            features: [
                "Quick module navigation",
                "Collapsible desktop menu",
                "Responsive mobile drawer",
                "App version status indicator"
            ]
        },
        {
            title: "Dashboard Module",
            description: "View real-time school stats, total student enrollment counts, attendance averages, grading progress, top achievers, and students at risk.",
            elementSelector: '[data-tour="sidebar-dashboard"]',
            icon: LayoutDashboard,
            color: "from-blue-500 to-indigo-600",
            iconColor: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
            features: [
                "Student enrollment analytics",
                "Grading progress tracking",
                "14-day attendance metrics",
                "Top achiever & at-risk summaries"
            ]
        },
        {
            title: "Subjects Management",
            description: "Manage the academic subject registry for Elementary, JHS, and SHS, including curriculum templates, grade level assignments, and subject descriptions.",
            elementSelector: '[data-tour="sidebar-subjects"]',
            icon: GraduationCap,
            color: "from-emerald-500 to-teal-600",
            iconColor: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
            features: [
                "Curriculum subject templates",
                "Elementary, JHS & SHS support",
                "Bulk clean duplicate records",
                "Custom subject descriptor editor"
            ]
        },
        {
            title: "Classes & Sections",
            description: "Create and organize class sections, assign grade levels, designate section advisers, and manage subject teaching loads.",
            elementSelector: '[data-tour="sidebar-sections"]',
            icon: Layers,
            color: "from-amber-500 to-orange-600",
            iconColor: "text-amber-500 bg-amber-50 dark:bg-amber-500/10",
            features: [
                "Section roster management",
                "Advisory class assignment",
                "Grade level classification",
                "Teaching load associations"
            ]
        },
        {
            title: "Student Information",
            description: "Your master list of learners. Manage learner LRNs, biological genders, birthdates, guardian contacts, addresses, and active enrollment statuses.",
            elementSelector: '[data-tour="sidebar-students"]',
            icon: Users,
            color: "from-purple-500 to-pink-600",
            iconColor: "text-purple-500 bg-purple-50 dark:bg-purple-500/10",
            features: [
                "Master student profile database",
                "LRN format validator",
                "Parent & guardian contacts",
                "Excel bulk student import"
            ]
        },
        {
            title: "Institute Profile",
            description: "Configure school metadata including official School Name, School ID, District, Division, Region, School Head details, and digital signature images.",
            elementSelector: '[data-tour="sidebar-institute"]',
            icon: School,
            color: "from-cyan-500 to-blue-600",
            iconColor: "text-cyan-500 bg-cyan-50 dark:bg-cyan-500/10",
            features: [
                "Official School ID & Region info",
                "School Head credentials",
                "Digital signature uploads",
                "Auto-population into DepEd forms"
            ]
        },
        {
            title: "Daily Attendance",
            description: "Log daily learner attendance (Present, Absent, Tardy), compute monthly School Form 2 (SF2) statistics, and view automatic absence alerts.",
            elementSelector: '[data-tour="sidebar-daily-attendance"]',
            icon: ClipboardCheck,
            color: "from-emerald-500 to-teal-600",
            iconColor: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
            features: [
                "Interactive SF2 daily grid",
                "Automatic ADA & Present counts",
                "Pre-enrollment cell protection",
                "Excel SF2 sheet export"
            ]
        },
        {
            title: "E-Class Record",
            description: "Electronic gradebook for JHS/Elementary and SHS. Input scores for Written Works, Performance Tasks, and Term Assessments with automatic DepEd transmutation.",
            elementSelector: '[data-tour="sidebar-eclass"]',
            icon: FileSpreadsheet,
            color: "from-indigo-500 to-purple-600",
            iconColor: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10",
            features: [
                "DepEd weighted score calculations",
                "Written Works & Performance Tasks",
                "Automatic grade transmutation",
                "Support for JHS, Elementary & SHS"
            ]
        },
        {
            title: "Grade Management",
            description: "Review consolidated class grade matrices across all subjects, monitor term grade averages, and track section progress.",
            elementSelector: '[data-tour="sidebar-consolidated-grades"]',
            icon: BarChart3,
            color: "from-rose-500 to-pink-600",
            iconColor: "text-rose-500 bg-rose-50 dark:bg-rose-500/10",
            features: [
                "Section consolidated grade matrix",
                "Term average summary",
                "Advisory class grade review",
                "Excel summary sheet export"
            ]
        },
        {
            title: "Official School Forms",
            description: "Generate, preview, and print official DepEd School Forms including SF9 (Report Card), SF10 (Form 137), SF8 (BMI/Nutritional), SF5 (Promotion), SF6, and LIR.",
            elementSelector: '[data-tour="sidebar-school-forms"]',
            icon: ClipboardList,
            color: "from-emerald-500 to-teal-600",
            iconColor: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
            features: [
                "Official SF9 Report Card printing",
                "SF10 Permanent Record generator",
                "SF8 Health & BMI calculations",
                "SF5 & SF6 promotion reports"
            ]
        },
        {
            title: "Student ID Generator",
            description: "Design and print professional student identification cards with customizable templates, barcodes, QR codes, and photo cropping tools.",
            elementSelector: '[data-tour="sidebar-student-id-generator"]',
            icon: IdCard,
            color: "from-blue-500 to-cyan-600",
            iconColor: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
            features: [
                "Custom ID card layout templates",
                "Bulk Student ID printing",
                "Barcode & QR code generation",
                "Photo upload & alignment"
            ]
        },
        {
            title: "School Calendar",
            description: "Schedule school events, holidays, examination dates, PTA assemblies, and administrative compliance deadlines.",
            elementSelector: '[data-tour="sidebar-calendar"]',
            icon: Calendar,
            color: "from-amber-500 to-orange-600",
            iconColor: "text-amber-500 bg-amber-50 dark:bg-amber-500/10",
            features: [
                "Interactive school calendar",
                "Event & holiday categorizer",
                "Exam & PTA meeting scheduler",
                "Deadline reminder badges"
            ]
        },
        {
            title: "Announcements",
            description: "Create and publish school announcements, division bulletins, and urgent updates with priority tags.",
            elementSelector: '[data-tour="sidebar-announcements"]',
            icon: Megaphone,
            color: "from-blue-500 to-indigo-600",
            iconColor: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
            features: [
                "Priority announcement alerts",
                "Category & tag organization",
                "Bulletin board feed view",
                "Local announcement logs"
            ]
        },
        {
            title: "Reports & Analytics",
            description: "Analyze visual charts for Mean Percentage Score (MPS), honor roll achievers, students at-risk, demographic breakdowns, and subject performance.",
            elementSelector: '[data-tour="sidebar-reports"]',
            icon: BarChart3,
            color: "from-purple-500 to-pink-600",
            iconColor: "text-purple-500 bg-purple-50 dark:bg-purple-500/10",
            features: [
                "Mean Percentage Score (MPS) charts",
                "Honor Roll & Awardee evaluators",
                "At-Risk student identification",
                "Gender & demographic analytics"
            ]
        },
        {
            title: "Games & Tools",
            description: "Interactive classroom games and activity tools including Wheel of Names, Quiz Show / Jeopardy, Bomb Pass, Noise Monitor, Team Splitter, Soundboard, and Puzzle Builders.",
            elementSelector: '[data-tour="sidebar-games-tools"]',
            icon: Gamepad2,
            color: "from-cyan-500 to-blue-600",
            iconColor: "text-cyan-500 bg-cyan-50 dark:bg-cyan-500/10",
            features: [
                "Wheel of Names & Random Pickers",
                "Quiz Show, Bomb Pass & Word Games",
                "Noise Detector, Timer & Whiteboard",
                "Team Splitters & Classroom Soundboard"
            ]
        },
        {
            title: "Online Generators",
            description: "Access DLL Generators and Lesson Plan templates in ILAW & MATATAG formats, including daily, weekly, 4A's, and classroom observation (CO) builders.",
            elementSelector: '[data-tour="sidebar-online-generators"]',
            icon: Sparkles,
            color: "from-amber-500 to-purple-600",
            iconColor: "text-amber-500 bg-amber-50 dark:bg-amber-500/10",
            features: [
                "DLL Generators (ILAW format)",
                "Daily & Weekly Lesson Logs",
                "MATATAG & 4A's Lesson Plans",
                "Interactive Lesson Exemplars"
            ]
        },
        {
            title: "System Settings",
            description: "Manage the active School Year, configure offline database backups, perform data import/export, adjust theme appearance, and check software version details.",
            elementSelector: '[data-tour="sidebar-settings"]',
            icon: Settings,
            color: "from-indigo-500 to-purple-600",
            iconColor: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10",
            features: [
                "Active School Year coordinator",
                "IndexedDB backup & restore",
                "Light & Dark theme toggle",
                "Software version & platform info"
            ]
        },
        {
            title: "Active School Year S.Y.",
            description: "Displays the current active School Year context. All class records, enrollments, attendance entries, and form exports automatically bind to this school year.",
            elementSelector: '[data-tour="school-year"]',
            icon: Clock3,
            color: "from-amber-500 to-orange-600",
            iconColor: "text-amber-500 bg-amber-50 dark:bg-amber-500/10",
            features: [
                "Active S.Y. context indicator",
                "Automatic record filtering",
                "Form year auto-population",
                "Settings shortcut selector"
            ]
        },
        {
            title: "Your Account Profile",
            description: "Displays your account name and role credentials. Your name automatically maps to DepEd school forms as the conducting adviser or certifying teacher.",
            elementSelector: '[data-tour="user-profile"]',
            icon: UserCheck,
            color: "from-purple-500 to-pink-600",
            iconColor: "text-purple-500 bg-purple-50 dark:bg-purple-500/10",
            features: [
                "User account display name",
                "DepEd role credential indicator",
                "Automatic signatory mapping",
                "Secure logout button access"
            ]
        },
        {
            title: "Main Workspace Canvas",
            description: "Your primary workspace. View interactive dashboards, manage student rosters, input scores, and download official printable school forms.",
            elementSelector: '[data-tour="workspace"]',
            icon: LayoutDashboard,
            color: "from-cyan-500 to-blue-600",
            iconColor: "text-cyan-500 bg-cyan-50 dark:bg-cyan-500/10",
            features: [
                "Interactive module workspace",
                "High-contrast printable sheets",
                "Direct PDF & Excel export actions",
                "Dark & Light mode integration"
            ]
        },
        {
            title: "Replay Tour Anytime",
            description: "Need a refresher? Click this Help icon in the top header at any time to replay this spotlight onboarding tour.",
            elementSelector: '[data-tour="help-button"]',
            icon: HelpCircle,
            color: "from-indigo-500 to-blue-600",
            iconColor: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10",
            features: [
                "One-click tour launcher",
                "Interactive spotlight guide",
                "Step-by-step feature breakdown",
                "Always accessible from header"
            ]
        }
    ];

    const ActiveStep = steps[currentStep];

    useEffect(() => {
        const updateRect = () => {
            const selector = ActiveStep.elementSelector;
            if (selector) {
                const elements = document.querySelectorAll(selector);
                let el: Element | null = null;
                for (let i = 0; i < elements.length; i++) {
                    const rect = elements[i].getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        el = elements[i];
                        break;
                    }
                }
                if (!el && elements.length > 0) {
                    el = elements[0];
                }

                if (el) {
                    // Scroll element into view automatically if inside scrollable sidebar
                    el.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
                    setHighlightRect(el.getBoundingClientRect());
                } else {
                    setHighlightRect(null);
                }
            } else {
                setHighlightRect(null);
            }
        };

        // Delay slightly to allow any layout transitions to complete
        const timer = setTimeout(updateRect, 100);
        window.addEventListener('resize', updateRect);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateRect);
        };
    }, [currentStep, ActiveStep.elementSelector]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleComplete = () => {
        try {
            localStorage.setItem('formease_onboarding_completed', 'true');
        } catch (e) {
            console.error('Failed to set onboarding complete state:', e);
        }
        onClose();
    };

    const getPopoverStyle = () => {
        if (!highlightRect) {
            return {
                position: 'fixed' as const,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 100
            };
        }

        const margin = 16;
        const selector = ActiveStep.elementSelector;

        // Position to the right of the Sidebar or its items
        if (selector && (selector === '[data-tour="sidebar"]' || selector.startsWith('[data-tour="sidebar-'))) {
            const cardWidth = window.innerWidth >= 768 ? 460 : 340;
            const hasSpaceOnRight = window.innerWidth - highlightRect.right >= cardWidth + margin * 2;

            if (hasSpaceOnRight) {
                return {
                    position: 'absolute' as const,
                    top: Math.max(margin, Math.min(highlightRect.top + (highlightRect.height - 380) / 2, window.innerHeight - 380 - margin)),
                    left: highlightRect.right + margin,
                    zIndex: 100
                };
            } else {
                // If there's no space on the right (mobile or narrow screen), center it at the bottom
                return {
                    position: 'fixed' as const,
                    bottom: margin,
                    left: (window.innerWidth - cardWidth) / 2,
                    zIndex: 100
                };
            }
        }

        // Position below S.Y. or Help or Profile Buttons
        if (
            selector && (
                selector === '[data-tour="school-year"]' || 
                selector === '[data-tour="help-button"]' || 
                selector === '[data-tour="user-profile"]'
            )
        ) {
            const cardWidth = window.innerWidth >= 768 ? 460 : 340;
            const leftPos = highlightRect.left + (highlightRect.width - cardWidth) / 2;
            const safeLeft = Math.max(margin, Math.min(leftPos, window.innerWidth - cardWidth - margin));
            return {
                position: 'absolute' as const,
                top: highlightRect.bottom + margin,
                left: safeLeft,
                zIndex: 100
            };
        }

        // Position on top of Workspace
        if (selector && selector === '[data-tour="workspace"]') {
            return {
                position: 'absolute' as const,
                top: highlightRect.top + 80,
                left: highlightRect.left + 80,
                zIndex: 100
            };
        }

        return {
            position: 'fixed' as const,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 100
        };
    };

    const StepIcon = ActiveStep.icon;

    return (
        <div className="fixed inset-0 z-100 p-4 no-print select-none">
            {/* Spotlight Mask overlay using SVG */}
            <AnimatePresence>
                {highlightRect ? (
                    <motion.svg 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 w-full h-full pointer-events-none z-90"
                    >
                        <defs>
                            <mask id="spotlight-mask">
                                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                                <rect
                                    x={highlightRect.left - 6}
                                    y={highlightRect.top - 6}
                                    width={highlightRect.width + 12}
                                    height={highlightRect.height + 12}
                                    rx="16"
                                    ry="16"
                                    fill="black"
                                />
                            </mask>
                        </defs>
                        {/* Dimmer Overlay */}
                        <rect
                            x="0"
                            y="0"
                            width="100%"
                            height="100%"
                            fill="rgba(15, 23, 42, 0.7)"
                            mask="url(#spotlight-mask)"
                            className="pointer-events-auto"
                        />
                        {/* Glowing Emerald border outline around the spotlight area */}
                        <rect
                            x={highlightRect.left - 6}
                            y={highlightRect.top - 6}
                            width={highlightRect.width + 12}
                            height={highlightRect.height + 12}
                            rx="16"
                            ry="16"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="3"
                            className="animate-pulse shadow-lg"
                        />
                    </motion.svg>
                ) : (
                    /* General modal backdrop overlay */
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-90 cursor-pointer"
                        onClick={handleComplete}
                    />
                )}
            </AnimatePresence>

            {/* Popover Content Modal */}
            <motion.div 
                key={currentStep}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={getPopoverStyle()}
                className="w-full max-w-85 md:max-w-115 bg-white dark:bg-slate-900 rounded-4xl border border-slate-200/80 dark:border-white/10 shadow-[0_20px_50px_rgba(15,23,42,0.18)] overflow-hidden flex flex-col md:flex-row min-h-75"
            >
                {/* Popover Header/Left Color bar */}
                <div className={`w-full md:w-30 bg-linear-to-br ${ActiveStep.color} p-4 flex flex-row md:flex-col justify-between text-white shrink-0 relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="relative z-10 text-[10px] font-black uppercase tracking-[0.2em] bg-white/20 px-2 py-0.5 rounded-full border border-white/10 self-start">Tour</div>
                    
                    <div className="relative z-10 mt-0 md:mt-10 self-center md:self-auto">
                        <span className="text-2xl font-black">{currentStep + 1}</span>
                        <span className="text-white/60 text-xs font-semibold"> / {steps.length}</span>
                    </div>
                </div>

                {/* Popover Main Body */}
                <div className="flex-1 p-5 flex flex-col justify-between">
                    {/* Top details */}
                    <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className={`p-2 rounded-xl ${ActiveStep.iconColor} shrink-0`}>
                                <StepIcon className="w-5 h-5" />
                            </div>
                            <button 
                                onClick={handleComplete}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                                title="Skip Tour"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <h2 className="text-md md:text-lg font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight mb-2">
                            {ActiveStep.title}
                        </h2>
                        <p className="text-[11px] md:text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                            {ActiveStep.description}
                        </p>

                        {/* Bullets */}
                        <div className="space-y-1 pt-3">
                            {ActiveStep.features.slice(0, 2).map((feature, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-[10px] md:text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                        <Check className="w-2 h-2 stroke-[3px]" />
                                    </div>
                                    <span className="truncate">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Controls Footer */}
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-3.5 mt-4 shrink-0 gap-2">
                        {/* Dot Indicators */}
                        <div className="flex items-center gap-1">
                        {/* Step indicator text for longer tours */}
                        {steps.length > 8 ? (
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                Step {currentStep + 1} of {steps.length}
                            </span>
                        ) : (
                            <div className="flex items-center gap-1">
                                {steps.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentStep(i)}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-3.5 bg-slate-800 dark:bg-white' : 'w-1.5 bg-slate-200 dark:bg-slate-700'}`}
                                        title={`Go to step ${i + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                        </div>

                        {/* Nav Buttons */}
                        <div className="flex items-center gap-1.5">
                            {currentStep > 0 && (
                                <button
                                    onClick={handleBack}
                                    className="h-7 px-2.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center gap-0.5 cursor-pointer"
                                >
                                    <ChevronLeft className="w-3 h-3" />
                                    Back
                                </button>
                            )}

                            <button
                                onClick={handleNext}
                                className="h-7 px-3.5 rounded-lg text-white font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95 transition-all flex items-center gap-1 cursor-pointer bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 hover:bg-slate-900 shadow-slate-900/10"
                            >
                                {currentStep === steps.length - 1 ? (
                                    <>
                                        Finish
                                        <Check className="w-3 h-3 stroke-[3px]" />
                                    </>
                                ) : (
                                    <>
                                        Next
                                        <ChevronRight className="w-3 h-3" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
