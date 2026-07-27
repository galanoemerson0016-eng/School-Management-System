import React from 'react';
import { ArrowLeft, ExternalLink, BookOpen, Sparkles, CheckCircle2, Monitor, Layers, Filter, FileText } from 'lucide-react';

interface LookerStudioExemplarsProps {
  onBack: () => void;
}

const DASHBOARD_URL = 'https://datastudio.google.com/u/0/reporting/810a7b7f-c378-4926-8b89-11f58f67ca67/page/RlaxF';

export function LookerStudioExemplars({ onBack }: LookerStudioExemplarsProps) {
  const handleOpenExternal = () => {
    window.open(DASHBOARD_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-[#0f172a] rounded-3xl border border-slate-200 dark:border-white/5 p-4 lg:p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              K-12 Lesson Exemplars (Looker Studio)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Interactive Google Looker Studio reporting dashboard for DepEd K-12 lesson exemplars
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenExternal}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-blue-500/20 active:scale-95"
        >
          <ExternalLink className="w-4 h-4" /> Launch Dashboard
        </button>
      </div>

      {/* Hero Portal Launcher Card */}
      <div className="bg-linear-to-r from-blue-900 via-slate-900 to-indigo-950 rounded-3xl p-8 lg:p-10 text-white shadow-xl relative overflow-hidden border border-blue-500/20 flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner">
          <BookOpen className="w-8 h-8" />
        </div>

        <div className="space-y-2 max-w-2xl">
          <span className="text-[10px] font-black uppercase tracking-widest px-3.5 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-full inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Interactive DepEd Reporting Portal
          </span>
          <h3 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
            K-12 Lesson Exemplars & Resource Directory
          </h3>
          <p className="text-xs lg:text-sm text-blue-100/80 leading-relaxed">
            Browse, filter, and access compiled K to 12 DepEd Lesson Exemplars, learning materials, and curriculum guides across Grade 1 to Grade 12.
          </p>
        </div>

        <button
          onClick={handleOpenExternal}
          className="px-8 py-4 bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-blue-500/30 active:scale-98 transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          <Monitor className="w-5 h-5" />
          OPEN LOOKER STUDIO REPORTING DASHBOARD
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0f172a] p-5 rounded-3xl border border-slate-200 dark:border-white/5 space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
            <Filter className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Filter by Grade & Subject</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Easily filter through Key Stage 1 to Key Stage 4 lesson plans by subject, quarter, and learning competency.
          </p>
        </div>

        <div className="bg-white dark:bg-[#0f172a] p-5 rounded-3xl border border-slate-200 dark:border-white/5 space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">DepEd Curriculum Aligned</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Aligned with MATATAG and DepEd K-12 learning standards for seamless classroom adoption.
          </p>
        </div>

        <div className="bg-white dark:bg-[#0f172a] p-5 rounded-3xl border border-slate-200 dark:border-white/5 space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Direct PDF Access</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Directly view and download full lesson exemplar PDFs, daily lesson logs, and teaching resources.
          </p>
        </div>
      </div>
    </div>
  );
}
