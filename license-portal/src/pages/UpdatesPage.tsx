import React from 'react';
import { motion } from 'framer-motion';
import { 
  DownloadCloud, Monitor, Apple, CheckCircle2, ChevronRight, ArrowLeft, 
  Cpu, Zap, Sparkles, ShieldCheck 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UpdatesPage() {
  const currentVersion = "1.0.49";

  const changelogs = [
    {
      title: "Zoom Controls Restored",
      desc: "Re-enabled smooth system-wide zoom controls. Users can zoom in and out using Ctrl + Mouse Scroll, pinch gestures, or keyboard shortcuts."
    },
    {
      title: "Cloud-Verified Free Trial",
      desc: "Upgraded the 1-hour free trial validation. Trial states are now securely bound to unique motherboard and CPU hardware IDs in the cloud, completely blocking bypass techniques."
    },
    {
      title: "One-Click Trial Login Bypass",
      desc: "Free trial testers can now immediately access the dashboard without creating or entering any login credentials."
    },
    {
      title: "System Reset Reliability",
      desc: "Fixed the 'Reset System' database locking bug. Clearing all school and enrollment records is now instant, safe, and highly reliable."
    },
    {
      title: "Automatic Fullscreen",
      desc: "The desktop application now automatically launches in immersive fullscreen mode by default on both Windows and macOS."
    }
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0A192F] text-slate-200 relative overflow-x-hidden pb-16">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header Bar */}
      <header className="relative z-50 w-full p-6 border-b border-white/10 backdrop-blur-xl bg-white/[0.03]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-slate-400 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Back to Portal</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Live Release Server</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-6 pt-16 space-y-12">
        
        {/* Banner Section */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Latest Stable Release</span>
          </motion.div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            FormEase Pro <span className="text-blue-500">v{currentVersion}</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto font-medium leading-relaxed">
            Download the official high-speed installation bundles or review the latest changelog details below.
          </p>
        </div>

        {/* Installer Download Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Windows Card */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between space-y-8 hover:border-blue-500/30 transition-all group"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                <Monitor className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Windows Installer</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Windows 10 / 11 (x64)</p>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Standard offline auto-extracting setup package. Fully compatible with single-school network architecture.
              </p>
            </div>
            
            <a 
              href={`https://github.com/galanoemerson0016-eng/School-Management-System/releases/download/v${currentVersion}/FormEase.Pro.Setup.${currentVersion}.exe`}
              className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/15"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Download for Windows</span>
            </a>
          </motion.div>

          {/* macOS Card */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between space-y-8 hover:border-indigo-500/30 transition-all group"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                <Apple className="w-7 h-7 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">macOS DMG Bundle</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Apple Silicon / Intel</p>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Optimized app disk image for macOS systems. Supports native display scaling and keyboard layouts.
              </p>
            </div>
            
            <a 
              href={`https://github.com/galanoemerson0016-eng/School-Management-System/releases/download/v${currentVersion}/FormEase.Pro-${currentVersion}.dmg`}
              className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/15"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Download for macOS</span>
            </a>
          </motion.div>

        </div>

        {/* Release Notes */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 sm:p-10 space-y-8"
        >
          <div className="flex items-center gap-3 border-b border-white/5 pb-6">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-black text-white tracking-wide">Version Release Notes</h2>
          </div>

          <div className="space-y-6">
            {changelogs.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-start">
                <div className="mt-1 p-1 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-sm">{item.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer info */}
        <div className="text-center space-y-2">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            FormEase Pro and its installer packages are verified secure by McAfee & Windows Defender.
          </p>
        </div>

      </main>
    </div>
  );
}
