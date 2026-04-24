import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, 
    Wand2, 
    FilePieChart, 
    Puzzle, 
    LayoutGrid,
    CheckCircle2,
    Bolt,
    Brain,
    Facebook,
    Mail,
    Globe,
    Award,
    ExternalLink,
    ShieldCheck,
    Cpu,
    Monitor,
    ShieldAlert,
    Rocket,
    Shield,
    Users,
    Heart,
    Sparkles,
    GraduationCap,
    Lightbulb,
    Lock,
    Cloud,
    Key,
    Bot,
    Terminal,
    Database,
    FileText,
    CheckSquare
} from 'lucide-react';
import { useState } from 'react';

export function AboutPage() {
    const [activeTab, setActiveTab] = useState<'app' | 'innovator'>('innovator');
    const [selectedCert, setSelectedCert] = useState<any>(null);

    const fadeInUp = {
        initial: { opacity: 0, y: 15 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as any }
    };

    const certifications = [
        {
            title: "Google for Education Certified Educator 1",
            org: "Google for Education",
            issued: "2025",
            expires: "2028",
            desc: "Validates standard technology implementation abilities and skills in using Google’s tools for education.",
            image: "innovator/google-level-1.png",
            id: "Verified"
        },
        {
            title: "Google for Education Certified Educator 2",
            org: "Google for Education",
            issued: "2025",
            expires: "2028",
            desc: "Validates advanced technology implementation skills for super users in the classroom using Google tools.",
            image: "innovator/google-level-2.png",
            id: "Verified"
        },
        {
            title: "Gemini Certified",
            org: "Google Cloud",
            issued: "2025",
            expires: "2028",
            desc: "Demonstrates foundational knowledge of generative AI concepts and leveraging Gemini for productivity.",
            image: "innovator/gemini-certified.png",
            id: "Verified"
        },
        {
            title: "Adobe Creative Educator L1",
            org: "Adobe Education",
            issued: "2024",
            expires: "Never",
            desc: "Validates creativity in education and proficiency with Adobe Express and Creative Cloud tools.",
            image: "innovator/adobe-level-1.png",
            id: "Verified"
        },
        {
            title: "Introduction to Modern AI",
            org: "Cisco",
            issued: "2024",
            expires: "Never",
            desc: "Foundational understanding of modern AI concepts, ethics, and practical applications in technology.",
            image: "innovator/cisco-ai.png",
            id: "Verified"
        },
        {
            title: "JavaScript Essentials 1",
            org: "Cisco",
            issued: "2023",
            expires: "Never",
            desc: "Proficiency in JavaScript core concepts, data structures, and functional programming syntax.",
            image: "innovator/cisco-js.png",
            id: "Verified"
        },
        {
            title: "Python Essentials 1",
            org: "Cisco",
            issued: "2023",
            expires: "Never",
            desc: "Fundamental programming concepts and Python syntax mastery for data and automation.",
            image: "innovator/cisco-python-1.png",
            id: "Verified"
        },
        {
            title: "Python Essentials 2",
            org: "Cisco",
            issued: "2023",
            expires: "Never",
            desc: "Intermediate Python skills including OOP, modules, packages, and file processing.",
            image: "innovator/cisco-python-2.png",
            id: "Verified"
        },
        {
            title: "Introduction to Cybersecurity",
            org: "Cisco",
            issued: "2023",
            expires: "Never",
            desc: "Fundamental knowledge of cybersecurity threats, defense mechanisms, and data protection.",
            image: "innovator/cisco-cybersecurity.png",
            id: "Verified"
        }
    ];

    const platforms = [
        {
            name: "FormEase Main Platform",
            desc: "An ecosystem designed to automate curriculum creation and school documentation through AI.",
            icon: Rocket,
            color: "from-blue-600 to-indigo-600",
            tags: ["AI-Powered", "Enterprise"]
        },
        {
            name: "AI DLL Generator",
            desc: "DepEd-Aligned tools that save hours of manual planning. Automated DLL/DLP systems.",
            icon: Wand2,
            color: "from-purple-600 to-pink-600",
            tags: ["DepEd", "Automation"]
        },
        {
            name: "Lesson → PowerPoint",
            desc: "Transform planning logs into presentation-ready teaching slides in minutes.",
            icon: FilePieChart,
            color: "from-orange-600 to-amber-600",
            tags: ["PPTX", "Interactive"]
        },
        {
            name: "Activity & Worksheet Gen",
            desc: "Interactive exercises and subject-specific activities tailored to objectives.",
            icon: Puzzle,
            color: "from-emerald-600 to-teal-600",
            tags: ["Assessment", "LAS"]
        },
        {
            name: "SMS Automation",
            desc: "Student Management System Automation: Data Handling, Forms, and Records.",
            icon: LayoutGrid,
            color: "from-slate-700 to-slate-900",
            tags: ["Records", "Efficiency"]
        }
    ];

    return (
        <div className="h-full overflow-y-auto custom-scrollbar bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30">
            {/* Navigation Toggle */}
            <div className="sticky top-0 z-50 px-4 pt-6 flex justify-center">
                <div className="bg-[#1e293b]/80 backdrop-blur-2xl rounded-2xl p-1 flex gap-1 border border-white/5 shadow-2xl">
                    {['app', 'innovator'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all duration-300 ${
                                activeTab === tab
                                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {tab === 'app' ? 'The App' : 'The Innovator'}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'app' ? (
                    <motion.div 
                        key="app"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-0 pb-16"
                    >
                        {/* APP HERO */}
                        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden px-6 text-center">
                            <div className="absolute inset-0 z-0">
                                <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a]" />
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
                            </div>

                            <div className="relative z-10 max-w-4xl space-y-6">
                                <motion.div {...fadeInUp}>
                                    <span className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest backdrop-blur-xl">
                                        Comprehensive School Management System
                                    </span>
                                </motion.div>
                                <motion.h1 
                                    {...fadeInUp}
                                    className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.1] text-white"
                                >
                                    FormEase: The Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">School Administration.</span>
                                </motion.h1>
                                <motion.p 
                                    {...fadeInUp}
                                    className="text-lg text-slate-400 max-w-3xl mx-auto font-medium"
                                >
                                    A robust, all-in-one ecosystem designed to automate academic records, streamline administrative workflows, and empower teachers through intelligent technology.
                                </motion.p>
                            </div>
                        </section>

                        {/* SYSTEM FEATURES GRID */}
                        <section className="max-w-7xl mx-auto px-6 py-12">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                                {/* ADMINISTRATIVE HUB */}
                                <motion.div {...fadeInUp} className="p-8 bg-[#1e293b]/40 border border-white/5 rounded-3xl space-y-6 group hover:bg-[#1e293b]/60 transition-all">
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
                                        <LayoutGrid className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-white">Administrative Hub</h3>
                                    <ul className="space-y-3">
                                        {[
                                            { label: 'Smart Dashboard', desc: 'Real-time school analytics and overview.' },
                                            { label: 'Classes & Sections', desc: 'Dynamic management of grade levels and advisory loads.' },
                                            { label: 'Student Information', desc: 'Centralized SF1 records with bulk import & export.' },
                                            { label: 'Institute Profile', desc: 'Custom branding and school information management.' }
                                        ].map((f, i) => (
                                            <li key={i} className="space-y-1">
                                                <p className="text-sm font-bold text-slate-200">{f.label}</p>
                                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{f.desc}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>

                                {/* ACADEMIC ENGINE */}
                                <motion.div {...fadeInUp} className="p-8 bg-[#1e293b]/40 border border-white/5 rounded-3xl space-y-6 group hover:bg-[#1e293b]/60 transition-all">
                                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
                                        <GraduationCap className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-white">Academic Engine</h3>
                                    <ul className="space-y-3">
                                        {[
                                            { label: 'Automated E-Class Record', desc: 'DepEd-aligned grading for Written Works & PT.' },
                                            { label: 'Grade Management', desc: 'Consolidated master reference for all subject areas.' },
                                            { label: 'Subject Management', desc: 'Flexible curriculum mapping and teacher assignments.' },
                                            { label: 'School Calendar', desc: 'Integrated event scheduling and deadline tracking.' }
                                        ].map((f, i) => (
                                            <li key={i} className="space-y-1">
                                                <p className="text-sm font-bold text-slate-200">{f.label}</p>
                                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{f.desc}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>

                                {/* COMMUNICATION & REPORTING */}
                                <motion.div {...fadeInUp} className="p-8 bg-[#1e293b]/40 border border-white/5 rounded-3xl space-y-6 group hover:bg-[#1e293b]/60 transition-all">
                                    <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400">
                                        <FilePieChart className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-white">Communication & Reporting</h3>
                                    <ul className="space-y-3">
                                        {[
                                            { label: 'One-Click School Forms', desc: 'Generate SF1, SF2, SF5, SF9, and SF10 instantly.' },
                                            { label: 'Statistical Reports', desc: 'Automated quarterly reports and performance charts.' },
                                            { label: 'School Announcements', desc: 'Centralized communication hub for students and faculty.' },
                                            { label: 'Academic Transcripts', desc: 'Automated generation of permanent records (SF10).' }
                                        ].map((f, i) => (
                                            <li key={i} className="space-y-1">
                                                <p className="text-sm font-bold text-slate-200">{f.label}</p>
                                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{f.desc}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            </div>

                            {/* TECHNICAL HIGHLIGHTS */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {[
                                    { icon: Monitor, label: 'Desktop Native', desc: 'Built with Electron for performance.' },
                                    { icon: Cloud, label: 'Hybrid Sync', desc: 'Offline-first with cloud backup.' },
                                    { icon: Shield, label: 'Data Privacy', desc: 'Role-based access & encryption.' },
                                    { icon: Zap, label: 'Ultra-Fast', desc: 'Instant form generation.' }
                                ].map((h, i) => (
                                    <motion.div key={i} {...fadeInUp} className="flex items-center gap-4 p-5 bg-[#1e293b]/40 border border-white/5 rounded-2xl">
                                        <h.icon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-200">{h.label}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">{h.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="innovator"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="pb-24"
                    >
                        {/* INNOVATOR HERO */}
                        <section className="relative min-h-[80vh] flex flex-col items-center justify-center px-6 text-center pt-20">
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                <div className="absolute top-[15%] left-[20%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
                                <div className="absolute bottom-[15%] right-[20%] w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px]" />
                            </div>

                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="relative z-10 space-y-8 max-w-4xl"
                            >
                                <div className="space-y-4">
                                    <span className="text-blue-500 font-black tracking-[0.4em] uppercase text-[10px]">The Innovator</span>
                                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white">Emerson M. Galano</h2>
                                    <p className="text-base md:text-lg text-slate-400 font-medium max-w-2xl mx-auto">
                                        Bridging the gap between classroom reality and intelligent technology.
                                    </p>
                                </div>

                                <div className="relative inline-block py-4">
                                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full blur-2xl opacity-10" />
                                    <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-white/5 shadow-2xl">
                                        <img src="innovator/emerson-galano.jpg" alt="Emerson M. Galano" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-emerald-500 text-white rounded-full text-[9px] font-black uppercase tracking-[0.3em] shadow-xl whitespace-nowrap">
                                        Active Innovator
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <p className="text-sm md:text-base text-blue-400 font-black uppercase tracking-widest">
                                        EdTech Innovator | Developer | Teacher
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {[
                                            { label: 'SHS Teacher', icon: GraduationCap },
                                            { label: 'ICT Coordinator', icon: Monitor },
                                            { label: 'SDRRM Coordinator', icon: ShieldAlert }
                                        ].map((role) => (
                                            <div key={role.label} className="flex items-center gap-2 px-5 py-2.5 bg-[#1e293b]/60 rounded-2xl border border-white/5 backdrop-blur-xl">
                                                <role.icon className="w-4 h-4 text-emerald-400" />
                                                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">{role.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-center gap-4 pt-6">
                                    {[
                                        { icon: Facebook, href: "https://www.facebook.com/xshame14/", color: "hover:text-blue-500" },
                                        { icon: Mail, href: "mailto:galanoemerson0014@gmail.com", color: "hover:text-red-500" },
                                        { icon: Globe, href: "https://form-ease-app.web.app/", color: "hover:text-white" }
                                    ].map((social, i) => (
                                        <a 
                                            key={i}
                                            href={social.href} 
                                            className={`w-10 h-10 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-slate-400 ${social.color} transition-all duration-300`}
                                        >
                                            <social.icon className="w-5 h-5" />
                                        </a>
                                    ))}
                                </div>
                            </motion.div>
                        </section>

                        {/* MISSION COMPACT */}
                        <section className="py-20 px-6 bg-[#1e293b]/20 border-y border-white/5">
                            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
                                <div className="md:col-span-5 space-y-4">
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">The Mission</span>
                                    <h3 className="text-2xl md:text-3xl font-black italic leading-tight text-white">
                                        "Simplify the digital workload—so teachers can focus on teaching, not paperwork."
                                    </h3>
                                </div>
                                <div className="md:col-span-7">
                                    <p className="text-base text-slate-400 leading-relaxed font-medium">
                                        FormEase was built from the classroom out. I saw a clear gap between what teachers need and what most digital tools offer. Many platforms add complexity instead of clarity. Built by a teacher, for teachers, to automate school forms and reclaim lost hours.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* DOMAIN EXPERTISE GRID */}
                        <section className="py-20 px-6 max-w-6xl mx-auto">
                            <div className="text-center mb-16 space-y-2">
                                <span className="text-indigo-500 font-black tracking-[0.4em] uppercase text-[10px]">Expertise</span>
                                <h3 className="text-3xl font-black tracking-tight text-white">Domain Specialization</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    {
                                        title: "Strategic Pedagogy",
                                        icon: Brain,
                                        color: "text-blue-400",
                                        items: ["Educational Mastery", "Records Standards", "Curriculum Mapping", "Automated Assessment"]
                                    },
                                    {
                                        title: "Infrastructure",
                                        icon: Cpu,
                                        color: "text-emerald-400",
                                        items: ["ICT & EdTech", "School Tech Leadership", "Data Ecosystems", "Instructional Systems"]
                                    },
                                    {
                                        title: "Future-Ready",
                                        icon: Rocket,
                                        color: "text-purple-400",
                                        items: ["Digital Transformation", "Core Workflow Design", "Form Automation", "Database Logic"]
                                    }
                                ].map((pillar, i) => (
                                    <motion.div 
                                        key={i}
                                        {...fadeInUp}
                                        className="p-8 bg-[#1e293b]/40 border border-white/5 rounded-3xl group hover:bg-[#1e293b]/60 transition-all"
                                    >
                                        <pillar.icon className={`w-8 h-8 ${pillar.color} mb-6`} />
                                        <h4 className="text-xl font-black mb-6 text-white">{pillar.title}</h4>
                                        <ul className="space-y-3">
                                            {pillar.items.map(item => (
                                                <li key={item} className="text-slate-400 text-xs flex items-center gap-2 font-bold">
                                                    <div className="w-1 h-1 rounded-full bg-white/20" /> {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        {/* PRIVACY - COMPACT GRID */}
                        <section className="py-20 px-6 max-w-6xl mx-auto">
                            <div className="bg-[#1e293b]/40 border border-white/5 rounded-[2.5rem] p-10 md:p-16">
                                <div className="flex flex-col md:flex-row items-center gap-8 mb-12 border-b border-white/5 pb-8">
                                    <ShieldCheck className="w-10 h-10 text-emerald-400" />
                                    <div className="text-center md:text-left">
                                        <h3 className="text-2xl font-black text-white">Privacy-First Architecture</h3>
                                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Built with data security as the core foundation.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { title: "Privacy", desc: "No data collection or tracking.", icon: Lock },
                                        { title: "Security", desc: "Encrypted storage protocols.", icon: Shield },
                                        { title: "Infrastructure", desc: "Secure Firebase backend.", icon: Cloud },
                                        { title: "Access", desc: "Role-based permissions.", icon: Key }
                                    ].map((item, i) => (
                                        <div key={i} className="space-y-3">
                                            <item.icon className="w-5 h-5 text-emerald-500/60" />
                                            <h4 className="text-base font-black text-slate-200">{item.title}</h4>
                                            <p className="text-slate-400 text-xs leading-relaxed font-medium">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* CERTIFICATIONS - MINI GRID */}
                        <section className="py-20 px-6 max-w-6xl mx-auto">
                            <div className="text-center mb-12">
                                <span className="text-blue-500 font-black tracking-[0.4em] uppercase text-[10px]">Credentials</span>
                                <h3 className="text-3xl font-black text-white">Certified Expertise</h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                {certifications.map((cert, i) => (
                                    <motion.div 
                                        key={i}
                                        {...fadeInUp}
                                        onClick={() => setSelectedCert(cert)}
                                        className="bg-[#1e293b]/40 border border-white/5 p-6 rounded-2xl flex flex-col items-center text-center space-y-4 group hover:border-blue-500/40 hover:bg-[#1e293b]/60 transition-all cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ExternalLink className="w-3 h-3 text-blue-400" />
                                        </div>
                                        <div className="w-16 h-16 relative grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105">
                                            <img src={cert.image} alt={cert.title} className="w-full h-full object-contain" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-[10px] font-black leading-tight uppercase group-hover:text-blue-400 transition-colors text-slate-200">{cert.title}</h4>
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{cert.org}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        {/* PROJECTS COMPACT */}
                        <section className="py-20 px-6 bg-slate-950/50">
                            <div className="max-w-6xl mx-auto">
                                <div className="text-center mb-12">
                                    <h3 className="text-2xl font-black text-white">Platforms & Projects</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[
                                        {
                                            name: "FormEase SMS",
                                            desc: "A centralized ecosystem designed to automate student records, e-class recording, and DepEd school forms.",
                                            icon: Database,
                                            color: "from-blue-600 to-indigo-600",
                                            tags: ["Records", "Efficiency"]
                                        },
                                        {
                                            name: "School Forms Engine",
                                            desc: "DepEd-aligned automation for SF1, SF2, SF5, SF9, and SF10, reducing manual data entry by 90%.",
                                            icon: FileText,
                                            color: "from-emerald-600 to-teal-600",
                                            tags: ["DepEd", "Automation"]
                                        },
                                        {
                                            name: "E-Class Master",
                                            desc: "Automated grading system that syncs directly with consolidated reports and student profiles.",
                                            icon: CheckSquare,
                                            color: "from-purple-600 to-pink-600",
                                            tags: ["Grading", "Interactive"]
                                        }
                                    ].map((project, i) => (
                                        <div key={i} className="p-8 bg-[#1e293b]/40 border border-white/5 rounded-2xl space-y-4 group">
                                            <div className={`w-10 h-10 bg-gradient-to-br ${project.color} rounded-lg flex items-center justify-center text-white shadow-lg`}>
                                                <project.icon className="w-5 h-5" />
                                            </div>
                                            <h4 className="text-lg font-black text-slate-200">{project.name}</h4>
                                            <p className="text-slate-400 text-xs font-medium leading-relaxed">{project.desc}</p>
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {project.tags.map(tag => (
                                                    <span key={tag} className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-black text-slate-500 uppercase">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* PHILOSOPHY & CLOSING */}
                        <section className="py-24 px-6 max-w-5xl mx-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center border-t border-white/5 pt-16">
                                <div className="space-y-6">
                                    <h3 className="text-3xl font-black text-white">Teaching Philosophy</h3>
                                    <p className="text-base text-slate-400 italic leading-relaxed font-medium">
                                        "From ICT coordination to the endless cycle of school forms and grading, I experienced the struggle—and turned it into my motivation for a more sustainable, efficient, and data-driven teaching environment."
                                    </p>
                                    <div className="space-y-4 pt-4">
                                        {[
                                            { title: "Student-Centered", icon: Heart },
                                            { title: "Innovation-Driven", icon: Lightbulb },
                                            { title: "Community-First", icon: Users }
                                        ].map((v) => (
                                            <div key={v.title} className="flex items-center gap-3">
                                                <v.icon className="w-4 h-4 text-emerald-400" />
                                                <span className="text-sm font-black uppercase tracking-widest text-slate-300">{v.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-8 text-center lg:text-left">
                                    <p className="text-lg text-white font-bold leading-tight">
                                        "To every teacher staying up late reconciling grades and generating school forms—I see you. I am you. FormEase is my way of giving back."
                                    </p>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">With gratitude,</p>
                                        <p className="text-2xl font-black text-white">Emerson M. Galano</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CERTIFICATION MODAL - BALANCED THEME */}
            <AnimatePresence>
                {selectedCert && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm"
                        onClick={() => setSelectedCert(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#1e293b] border border-white/10 rounded-[2.5rem] overflow-hidden max-w-4xl w-full flex flex-col md:flex-row shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative"
                        >
                            {/* Close Button */}
                            <button 
                                onClick={() => setSelectedCert(null)}
                                className="absolute top-6 right-6 w-10 h-10 bg-black/20 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors z-10"
                            >
                                <Zap className="w-5 h-5 rotate-45" />
                            </button>

                            {/* Left Side: Badge */}
                            <div className="md:w-2/5 bg-[#0f172a] flex items-center justify-center p-12 border-r border-white/5">
                                <div className="relative group">
                                    <div className="absolute -inset-10 bg-blue-500/10 rounded-full blur-[100px] opacity-50" />
                                    <img src={selectedCert.image} alt={selectedCert.title} className="w-48 h-48 md:w-64 md:h-64 object-contain relative z-10" />
                                </div>
                            </div>

                            {/* Right Side: Info */}
                            <div className="md:w-3/5 p-10 md:p-14 space-y-10">
                                <div className="space-y-6">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                                        <Award className="w-3.5 h-3.5 text-blue-400" />
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">{selectedCert.org}</span>
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black tracking-tighter leading-tight text-white">{selectedCert.title}</h2>
                                    <p className="text-base text-slate-400 font-medium leading-relaxed">{selectedCert.desc}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-6 bg-[#0f172a] border border-white/5 rounded-2xl space-y-1">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Issue Date</p>
                                        <p className="text-lg font-black text-white">{selectedCert.issued}</p>
                                    </div>
                                    <div className="p-6 bg-[#0f172a] border border-white/5 rounded-2xl space-y-1">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Expiration</p>
                                        <p className="text-lg font-black text-white">{selectedCert.expires}</p>
                                    </div>
                                </div>

                                <div className="p-6 bg-[#0f172a] border border-white/5 rounded-2xl flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Credential ID</p>
                                        <p className="text-xs font-black text-blue-400">{selectedCert.id}</p>
                                    </div>
                                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400/50" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FOOTER */}
            <footer className="py-12 border-t border-white/5 text-center">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">
                    FormEase • The Teaching Operating System • © 2026
                </p>
                <div className="flex justify-center gap-8">
                    {['Docs', 'Privacy', 'Support'].map(link => (
                        <button key={link} className="text-[9px] font-black text-slate-500 hover:text-blue-400 transition-colors uppercase tracking-widest">{link}</button>
                    ))}
                </div>
            </footer>
        </div>
    );
}
