import React, { useState, useMemo } from 'react';
import { 
  BookOpen, ExternalLink, Search, Bot, Monitor, Copy, Check
} from 'lucide-react';
import { LessonPlannerTemplates } from '../components/games-tools/LessonPlannerTemplates';

export interface GeneratorCard {
  id: string;
  title: string;
  badge: string;
  badgeColor: 'amber' | 'teal' | 'fuchsia' | 'blue' | 'green' | 'purple' | 'rose' | 'yellow' | 'slate' | 'red';
  description: string;
  url?: string;
  category: 'daily-ilaw' | 'weekly-ilaw' | 'semi-ilaw' | 'weekly-matatag' | 'semi-detailed' | 'trimester' | 'detailed' | 'exemplars';
}

const ALL_GENERATORS: GeneratorCard[] = [
  // FEATURED EXEMPLARS
  {
    id: 'looker-studio-exemplars',
    title: 'K12 Lesson Exemplars (Looker Studio)',
    badge: 'Looker Studio',
    badgeColor: 'green',
    description: 'Access the interactive Looker Studio reporting dashboard to browse, filter, and utilize compiled K-12 lesson exemplars.',
    url: 'https://datastudio.google.com/u/0/reporting/810a7b7f-c378-4926-8b89-11f58f67ca67/page/RlaxF',
    category: 'exemplars'
  },
  // DAILY (ILAW)
  {
    id: 'dll_ilaw_daily',
    title: 'DLL ILAW Format (Separate Each Day)',
    badge: 'Daily ILAW',
    badgeColor: 'amber',
    description: 'ILAW-based Daily Lesson Log with individual sections for each instructional day of the week.',
    url: 'https://gemini.google.com/share/4c7a51091c42',
    category: 'daily-ilaw'
  },
  {
    id: 'dll_ilaw_daily_selectable',
    title: 'DLL ILAW FORMAT (SEPARATE EACH DAY) with selectable Lesson Flow',
    badge: 'Daily ILAW',
    badgeColor: 'amber',
    description: 'ILAW-based Daily Lesson Log with selectable Lesson Flow elements and individual sections for each day.',
    url: 'https://gemini.google.com/share/5bcb25b0daa3',
    category: 'daily-ilaw'
  },
  {
    id: 'dlp_ilaw_2',
    title: 'DLP ILAW #2 (Flow - Review - Motivation - Discussion)',
    badge: 'New',
    badgeColor: 'green',
    description: 'Daily Lesson Log structure focusing on the Review, Motivation, and Discussion flow within the ILAW framework.',
    url: 'https://share.gemini.google/1JNqnilImeJs',
    category: 'daily-ilaw'
  },
  {
    id: 'ilaw_dlp_4as',
    title: 'ILAW DLP 4A\'s Format',
    badge: 'New',
    badgeColor: 'green',
    description: 'Daily Lesson Plan format structured around the Activity, Analysis, Abstraction, and Application (4A\'s) model under the ILAW framework.',
    url: 'https://share.gemini.google/uu6uJ9RANIre',
    category: 'daily-ilaw'
  },
  {
    id: 'ilaw_dlp_short',
    title: 'ILAW DLP (Short)',
    badge: 'New',
    badgeColor: 'green',
    description: 'A condensed Daily Lesson Plan template following the ILAW framework for quick lesson preparation.',
    url: 'https://share.gemini.google/ZFbXOcwMy4aG',
    category: 'daily-ilaw'
  },
  {
    id: 'ilaw_filipino_only',
    title: 'ILAW Filipino Only',
    badge: 'New',
    badgeColor: 'green',
    description: 'Daily Lesson Plan template customized specifically for Filipino language instruction under the ILAW framework.',
    url: 'https://gemini.google/share/7d91cb3c79a6?skid=af51d5f5-030e-433d-b6c7-e098186de797',
    category: 'daily-ilaw'
  },
  {
    id: 'ilaw_co_maker_daily',
    title: 'ILAW CO maker (Daily)',
    badge: 'New',
    badgeColor: 'green',
    description: 'Daily Classroom Observation (CO) lesson plan maker aligned with the ILAW framework.',
    url: 'https://share.gemini.google/J7qeJVhdZ47A',
    category: 'daily-ilaw'
  },
  // WEEKLY (ILAW)
  {
    id: 'dll_ilaw_weekly',
    title: 'DLL ILAW Format (Weekly)',
    badge: 'Weekly ILAW',
    badgeColor: 'teal',
    description: 'ILAW-structured weekly Daily Lesson Log consolidating all instructional days in a single view.',
    url: 'https://gemini.google.com/share/bcac87affd11',
    category: 'weekly-ilaw'
  },
  {
    id: 'dll_ilaw_weekly_selectable',
    title: 'ILAW Weekly DLL with Selectable Lesson Flow',
    badge: 'Weekly ILAW',
    badgeColor: 'slate',
    description: 'ILAW-structured weekly Daily Lesson Log consolidating all instructional days with selectable Lesson Flow.',
    url: 'https://gemini.google.com/share/b213e0a2aefb',
    category: 'weekly-ilaw'
  },
  // SEMI-DETAILED (ILAW)
  {
    id: 'dlp_trimester_ilaw',
    title: 'Semi-detailed ILAW Format',
    badge: 'Semi-Detailed ILAW',
    badgeColor: 'fuchsia',
    description: 'A streamlined lesson planner focusing on Intentions (I), Learning Experiences (L), Assessment (A), and Ways Forward (W).',
    url: 'https://gemini.google.com/share/8d696fc086ec',
    category: 'semi-ilaw'
  },
  // WEEKLY LESSON PLANNER
  {
    id: '9b58e5a1f0f8',
    title: 'MATATAG + Exemplar + Summative Test',
    badge: 'Matatag Standard',
    badgeColor: 'blue',
    description: 'Complete weekly log generation with integrated exemplar uploads and assessment creation.',
    url: 'https://gemini.google.com/share/9b58e5a1f0f8',
    category: 'weekly-matatag'
  },
  {
    id: 'ea9323e60569',
    title: 'Revised Matatag Weekly Planner',
    badge: 'Updated v2.0',
    badgeColor: 'green',
    description: 'Optimized for the latest curriculum adjustments. Faster generation with streamlined prompts.',
    url: 'https://gemini.google.com/share/ea9323e60569',
    category: 'weekly-matatag'
  },
  {
    id: 'a8f51e51cc31',
    title: 'K-12 Format Weekly',
    badge: 'DepEd Official',
    badgeColor: 'slate',
    description: 'Standard DepEd format for K-12. Reliable and compliant for submission.',
    url: 'https://gemini.google.com/share/a8f51e51cc31',
    category: 'weekly-matatag'
  },
  {
    id: '0b1f834a1b72',
    title: 'K-12 Filipino Subject Planner',
    badge: 'Filipino',
    badgeColor: 'yellow',
    description: 'Designed specifically for subjects taught in Filipino (ESP, AP, Filipino).',
    url: 'https://gemini.google.com/share/0b1f834a1b72',
    category: 'weekly-matatag'
  },
  {
    id: 'eb4d60eea4d9',
    title: 'Revised K-12 Weekly Planner',
    badge: 'New Release',
    badgeColor: 'slate',
    description: 'Updated fields for better alignment with 2025 observation tools.',
    url: 'https://gemini.google.com/share/eb4d60eea4d9',
    category: 'weekly-matatag'
  },
  {
    id: '1f3a9ad9b96f',
    title: '4A\'s Weekly Lesson Planner',
    badge: '4A\'s Method',
    badgeColor: 'purple',
    description: 'Strictly follows the Activity, Analysis, Abstraction, Application flow.',
    url: 'https://gemini.google.com/share/1f3a9ad9b96f',
    category: 'weekly-matatag'
  },
  {
    id: 'b794457e459d',
    title: 'Revised MELC Format',
    badge: 'MELC Based',
    badgeColor: 'slate',
    description: 'Focuses on Most Essential Learning Competencies for streamlined delivery.',
    url: 'https://gemini.google.com/share/b794457e459d',
    category: 'weekly-matatag'
  },
  {
    id: '4b678d686ea0',
    title: 'SHS Lesson Planner',
    badge: 'Senior High',
    badgeColor: 'slate',
    description: 'Tailored fields for Core, Applied, and Specialized SHS subjects.',
    url: 'https://gemini.google.com/share/4b678d686ea0',
    category: 'weekly-matatag'
  },
  {
    id: '883b56c0bdb0',
    title: 'WEELMAT Generator',
    badge: 'Auto-Gen',
    badgeColor: 'red',
    description: 'All-in-one generator for Weekly Learning Materials and Activity sheets.',
    url: 'https://gemini.google.com/share/883b56c0bdb0',
    category: 'weekly-matatag'
  },
  // SEMI DETAILED LESSON PLANNER
  {
    id: '234221a94346',
    title: 'Semi-Detailed K-12 Format',
    badge: 'Classic Format',
    badgeColor: 'slate',
    description: 'Standard semi-detailed format suitable for daily logs.',
    url: 'https://gemini.google.com/share/234221a94346',
    category: 'semi-detailed'
  },
  {
    id: '68ffbb53d5e7',
    title: 'Detailed K-12 CO (PMES/COI)',
    badge: 'CO Ready',
    badgeColor: 'rose',
    description: 'Includes explicit indicators for Classroom Observation (CO) and PMES.',
    url: 'https://gemini.google.com/share/68ffbb53d5e7',
    category: 'semi-detailed'
  },
  {
    id: 'e19dca7d2e01',
    title: 'Semi-Detailed Matatag Format',
    badge: 'Matatag SD',
    badgeColor: 'slate',
    description: 'Simplified Matatag layout for quick daily planning.',
    url: 'https://gemini.google.com/share/e19dca7d2e01',
    category: 'semi-detailed'
  },
  {
    id: 'a7db5f0ed258',
    title: 'Matatag Semi-Detailed + PMES COI',
    badge: 'COI Aligned',
    badgeColor: 'rose',
    description: 'Matatag aligned with embedded indicators for performance evaluation.',
    url: 'https://gemini.google.com/share/a7db5f0ed258',
    category: 'semi-detailed'
  },
  {
    id: '63005656c51c',
    title: 'SHS Daily Planner',
    badge: 'Daily Log',
    badgeColor: 'slate',
    description: 'Day-by-day lesson logging for Senior High School tracks.',
    url: 'https://gemini.google.com/share/63005656c51c',
    category: 'semi-detailed'
  },
  {
    id: 'c828ed20ea73',
    title: '4A\'s Semi-Detailed AI',
    badge: 'Simplified 4A',
    badgeColor: 'purple',
    description: 'Concise 4A\'s framework for quicker preparation.',
    url: 'https://gemini.google.com/share/c828ed20ea73',
    category: 'semi-detailed'
  },
  // TRIMESTER LESSON PLANNER
  {
    id: 'dlp_trimester',
    title: 'Trimester Semi-Detailed Lesson Planner',
    badge: 'Trimester',
    badgeColor: 'slate',
    description: 'Comprehensive semi-detailed planner designed for schools following a trimester academic calendar.',
    url: 'https://gemini.google.com/share/9a7491b432ca',
    category: 'trimester'
  },
  {
    id: 'dll_trimester_weekly',
    title: 'Trimester DLL Weekly Format',
    badge: 'Trimester',
    badgeColor: 'slate',
    description: 'Efficient weekly Daily Lesson Log format optimized for trimester schedules.',
    url: 'https://gemini.google.com/share/d8c230ab537a',
    category: 'trimester'
  },
  {
    id: 'dll_trimester_daily',
    title: 'Trimester DLL (Separate Each Day)',
    badge: 'Trimester',
    badgeColor: 'slate',
    description: 'Detailed Daily Lesson Log format with distinct sections for each instructional day.',
    url: 'https://gemini.google.com/share/ffd12f51f1f3',
    category: 'trimester'
  },
  // DETAILED LESSON PLANNER
  {
    id: 'dlp_1',
    title: 'Detailed Lesson Plan 1',
    badge: 'Comprehensive',
    badgeColor: 'slate',
    description: 'Full script format covering teacher\'s activity and student\'s expected response.',
    url: 'https://gemini.google.com/share/f98c14afc2e9',
    category: 'detailed'
  },
  {
    id: 'dlp_4a',
    title: '4A\'s Detailed Lesson Planner',
    badge: '4A\'s Expert',
    badgeColor: 'purple',
    description: 'Deep dive into the 4A\'s with specific prompts for each stage.',
    url: 'https://gemini.google.com/share/e4c200369e65',
    category: 'detailed'
  },
  {
    id: 'dlp_matatag',
    title: 'Matatag Detailed Planner',
    badge: 'New Matatag',
    badgeColor: 'blue',
    description: 'Detailed script aligned with the new Matatag curriculum structure.',
    url: 'https://gemini.google.com/share/658da4b65b61',
    category: 'detailed'
  },
  {
    id: 'dlp_7e',
    title: '7E\'s Detailed Lesson Planner',
    badge: '7E Cycle',
    badgeColor: 'green',
    description: 'Inquiry-based model: Elicit, Engage, Explore, Explain, Elaborate, Evaluate, Extend.',
    url: 'https://gemini.google.com/share/7fa907ce9a59',
    category: 'detailed'
  },
  {
    id: 'dlp_annotated',
    title: 'Annotated Lesson Planner',
    badge: 'With Notes',
    badgeColor: 'amber',
    description: 'Includes side-columns for teacher annotations and post-lesson reflections.',
    url: 'https://gemini.google.com/share/4560eeb21b7f',
    category: 'detailed'
  },
  {
    id: 'dlp_exemplar',
    title: 'Daily Lesson Log (DLL) + Exemplar',
    badge: 'DLL + Exemplar',
    badgeColor: 'blue',
    description: 'One-day DLL format with integrated lesson exemplar upload for streamlined daily preparation.',
    url: 'https://gemini.google.com/share/3bc0dd129f42',
    category: 'detailed'
  }
];

type PlannerType = 'daily-ilaw' | 'weekly-ilaw' | 'semi-ilaw' | 'weekly-matatag' | 'semi-detailed' | 'trimester' | 'detailed';

export function OnlineGeneratorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [subview, setSubview] = useState<{ plannerType: PlannerType; title: string; badge: string; description: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Generators', count: ALL_GENERATORS.length },
    { id: 'daily-ilaw', label: 'Daily ILAW', count: ALL_GENERATORS.filter(g => g.category === 'daily-ilaw').length },
    { id: 'weekly-ilaw', label: 'Weekly ILAW', count: ALL_GENERATORS.filter(g => g.category === 'weekly-ilaw').length },
    { id: 'semi-ilaw', label: 'Semi-Detailed ILAW', count: ALL_GENERATORS.filter(g => g.category === 'semi-ilaw').length },
    { id: 'weekly-matatag', label: 'Weekly Planners', count: ALL_GENERATORS.filter(g => g.category === 'weekly-matatag').length },
    { id: 'semi-detailed', label: 'Semi-Detailed', count: ALL_GENERATORS.filter(g => g.category === 'semi-detailed').length },
    { id: 'trimester', label: 'Trimester', count: ALL_GENERATORS.filter(g => g.category === 'trimester').length },
    { id: 'detailed', label: 'Detailed Planners', count: ALL_GENERATORS.filter(g => g.category === 'detailed').length },
  ];

  const filteredGenerators = useMemo(() => {
    return ALL_GENERATORS.filter(g => {
      const matchesCat = activeCategory === 'all' || g.category === activeCategory;
      const matchesSearch = !searchQuery.trim() || 
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.badge.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleLaunch = (gen: GeneratorCard) => {
    if (gen.url) {
      window.open(gen.url, '_blank', 'noopener,noreferrer');
    } else {
      // Map to interactive subview
      let pType: PlannerType = 'daily-ilaw';
      if (gen.category === 'weekly-ilaw') pType = 'weekly-ilaw';
      if (gen.category === 'semi-ilaw') pType = 'semi-ilaw';
      if (gen.category === 'weekly-matatag') pType = 'weekly-matatag';
      if (gen.category === 'semi-detailed') pType = 'semi-detailed';
      if (gen.category === 'trimester') pType = 'trimester';
      if (gen.category === 'detailed') pType = 'detailed';

      setSubview({
        plannerType: pType,
        title: gen.title,
        badge: gen.badge,
        description: gen.description
      });
    }
  };

  const handleCopyOutline = (gen: GeneratorCard, e: React.MouseEvent) => {
    e.stopPropagation();
    const outline = `DepEd Lesson Plan Template: ${gen.title}\nCategory: ${gen.category}\nBadge: ${gen.badge}\nDescription: ${gen.description}\n\n[Prompt Outline Structure]\n- Intention (I): Learning Objectives & Alignment\n- Learning Experience (L): Student Activities & Engagement\n- Assessment (A): Formative Evaluation\n- Ways Forward (W): Reflection & Remediation Strategy`;
    navigator.clipboard.writeText(outline);
    setCopiedId(gen.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (subview) {
    return (
      <LessonPlannerTemplates
        plannerType={subview.plannerType}
        title={subview.title}
        badge={subview.badge}
        description={subview.description}
        onBack={() => setSubview(null)}
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header & Title */}
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-white/5 p-6 lg:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> DepEd Academic Instructional Tools
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            DepEd Instructional & Lesson Planning Suite
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
            Generate DepEd-compliant Daily Lesson Logs (DLL), Detailed Lesson Plans (DLP), MATATAG curriculum guides, and ILAW framework exemplars instantly.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-70">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search 34+ DepEd planners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Featured Banner: Looker Studio K12 Lesson Exemplars */}
      <div className="bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
            <Monitor className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-wider">
              Looker Studio Portal
            </span>
            <h3 className="text-xl lg:text-2xl font-black text-white">
              K-12 Lesson Exemplars & Directory
            </h3>
            <p className="text-xs text-emerald-100/80 font-medium max-w-xl">
              Access the interactive Looker Studio reporting dashboard to browse, filter, and utilize compiled DepEd K-12 lesson exemplars.
            </p>
          </div>
        </div>

        <a
          href="https://datastudio.google.com/u/0/reporting/810a7b7f-c378-4926-8b89-11f58f67ca67/page/RlaxF"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-lg shadow-emerald-500/30 active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <span>Open Dashboard</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Filter Tabs - Balanced 4x2 Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide flex items-center justify-between transition-all cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-700/80'
            }`}
          >
            <span className="truncate">{cat.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold shrink-0 ml-1.5 ${
              activeCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
            }`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Generators Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {filteredGenerators.map((gen) => (
          <div
            key={gen.id}
            onClick={() => handleLaunch(gen)}
            className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs hover:shadow-lg hover:border-indigo-500/30 transition-all flex flex-col justify-between group hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                  <Bot className="w-4.5 h-4.5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider whitespace-nowrap bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                  {gen.badge}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-xs sm:text-sm leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                  {gen.title}
                </h4>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              {gen.url ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => handleCopyOutline(gen, e)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                    title="Copy Template Outline"
                  >
                    {copiedId === gen.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(gen.url, '_blank', 'noopener,noreferrer');
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <span>Use Template</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={(e) => handleCopyOutline(gen, e)}
                  className="w-full py-1.5 rounded-lg bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <span>{copiedId === gen.id ? 'Copied!' : 'Copy Outline'}</span>
                  {copiedId === gen.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
