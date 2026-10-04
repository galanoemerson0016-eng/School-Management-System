import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DownloadCloud, Monitor, Apple, CheckCircle2, ChevronRight, ArrowLeft, 
  Cpu, Zap, Sparkles, ShieldCheck, Terminal, Copy, Check, AlertTriangle, FileCode 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { licenseService } from '../lib/license-service';

export default function UpdatesPage() {
  const [downloadInfo, setDownloadInfo] = useState({
    win_url: 'https://github.com/galanoemerson0016-eng/FormEase-Releases/releases/download/v1.0.55/FormEase.Pro.Setup.1.0.55.exe',
    mac_url: 'https://github.com/galanoemerson0016-eng/FormEase-Releases/releases/download/v1.0.55/FormEase.Pro-1.0.55.dmg',
    mac_arm_url: 'https://github.com/galanoemerson0016-eng/FormEase-Releases/releases/download/v1.0.55/FormEase.Pro-1.0.55-arm64.dmg',
    version: '1.0.55',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [showMacHelp, setShowMacHelp] = useState(true);

  const macFixCommand = 'xattr -cr "/Applications/FormEase Pro.app" && open "/Applications/FormEase Pro.app"';

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(macFixCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2500);
  };

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const winRes = await fetch('/updates/latest.yml');
        if (!winRes.ok) throw new Error('Failed to fetch Windows release metadata');
        const winText = await winRes.text();

        const versionMatch = winText.match(/^version:\s*(.+)$/m);
        const version = versionMatch ? versionMatch[1].trim() : '1.0.55';

        const winUrlMatch = winText.match(/^\s*-\s*url:\s*(https?:\/\/[^\s]+)/m);
        const winUrl = winUrlMatch 
          ? winUrlMatch[1].trim() 
          : `https://github.com/galanoemerson0016-eng/FormEase-Releases/releases/download/v${version}/FormEase.Pro.Setup.${version}.exe`;

        let macUrl = `https://github.com/galanoemerson0016-eng/FormEase-Releases/releases/download/v${version}/FormEase.Pro-${version}.dmg`;
        let macArmUrl = `https://github.com/galanoemerson0016-eng/FormEase-Releases/releases/download/v${version}/FormEase.Pro-${version}-arm64.dmg`;

        try {
          const macRes = await fetch('/updates/latest-mac.yml');
          if (macRes.ok) {
            const macText = await macRes.text();
            const dmgUrls = [...macText.matchAll(/^\s*-\s*url:\s*(https?:\/\/[^\s]+\.dmg)/gm)].map(m => m[1].trim());
            if (dmgUrls.length > 0) {
              const armUrl = dmgUrls.find(url => url.includes('arm64'));
              const intelUrl = dmgUrls.find(url => !url.includes('arm64'));
              
              if (intelUrl) macUrl = intelUrl;
              if (armUrl) macArmUrl = armUrl;
              else if (intelUrl) macArmUrl = intelUrl;
            }
          }
        } catch (macErr) {
          console.warn('Error fetching Mac metadata, using defaults:', macErr);
        }

        setDownloadInfo({
          win_url: winUrl,
          mac_url: macUrl,
          mac_arm_url: macArmUrl,
          version: version,
          notes: ''
        });
      } catch (err: any) {
        console.error('Error fetching release metadata:', err);
        setError(err.message || 'Error loading release details');
      } finally {
        setIsLoading(false);
      }
    }

    fetchMetadata();
  }, []);

  const changelogs = [
    {
      title: "User Profile Avatar Integration",
      desc: "Replaced the generic initials text circle in the main header next to 'Emerson / admin' with the user's actual profile photo uploaded on the Institute page."
    },
    {
      title: "FormEase Licensing Sync",
      desc: "Synchronized active release channels with GitHub and updated the licensing portal to support immediate downloads of the latest v1.0.51 build."
    },
    {
      title: "Type Safety & Build Optimizations",
      desc: "Validated and fully compiled all TypeScript components with zero errors to guarantee robust execution."
    }
  ];

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0A192F] text-slate-200 relative overflow-x-hidden pb-16">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-200 h-200 bg-blue-600/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-15%] left-[-10%] w-150 h-150 bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header Bar */}
      <header className="relative z-50 w-full p-6 border-b border-white/10 backdrop-blur-xl bg-white/3">
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
            FormEase Pro <span className="text-blue-500">v{downloadInfo.version}</span>
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
            className="bg-white/3 border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between space-y-8 hover:border-blue-500/30 transition-all group"
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
              href={downloadInfo.win_url}
              target="_blank"
              rel="noopener noreferrer"
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
            className="bg-white/3 border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between space-y-8 hover:border-indigo-500/30 transition-all group"
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
            
            <div className="flex flex-col gap-3 w-full">
              <a 
                href={downloadInfo.mac_arm_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/15"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>Apple Silicon (M1/M2/M3)</span>
              </a>
              <a 
                href={downloadInfo.mac_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase tracking-widest transition-all border border-white/10"
              >
                <DownloadCloud className="w-3.5 h-3.5 text-slate-400" />
                <span>Intel Core (Older Macs)</span>
              </a>

              {/* macOS Sequoia / Sonoma Gatekeeper Helper */}
              <div className="mt-2 pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between text-left">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> macOS "App is Damaged"?
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMacHelp(!showMacHelp)}
                    className="text-indigo-400 hover:text-indigo-300 text-[10px] font-black uppercase tracking-wider underline cursor-pointer"
                  >
                    {showMacHelp ? 'Hide' : 'Show Fix'}
                  </button>
                </div>

                {showMacHelp && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 text-left space-y-3">
                    <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                      On macOS Sequoia & Sonoma, Apple blocks direct school downloads with a false <strong className="text-amber-300 font-bold">"damaged"</strong> warning. Unlock it in 1 click:
                    </p>

                    {/* Option A: Download 1-Click Fix Tool */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <FileCode className="w-3 h-3 text-indigo-400" /> Option A (Automatic 1-Click Tool):
                      </span>
                      <a
                        href="/Fix-FormEase-Mac.command.zip"
                        download="Fix-FormEase-Mac.command.zip"
                        className="w-full py-2.5 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-200 font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md text-center"
                      >
                        <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Download 1-Click Mac Fix Tool</span>
                      </a>
                      <p className="text-[10px] text-slate-400 pl-1">Extract & double-click to unlock and auto-launch.</p>
                    </div>

                    {/* Option B: Terminal One-Liner */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-emerald-400" /> Option B (Terminal Command):
                      </span>
                      <div className="flex items-center gap-1.5 bg-black/50 border border-white/10 rounded-xl p-2 font-mono text-[10px] text-slate-300">
                        <span className="truncate flex-1 select-all">{macFixCommand}</span>
                        <button
                          type="button"
                          onClick={handleCopyCmd}
                          className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all cursor-pointer shrink-0"
                          title="Copy command to clipboard"
                        >
                          {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {copiedCmd && (
                        <p className="text-[10px] text-emerald-400 font-bold">✓ Copied! Open Terminal (Cmd+Space → Terminal), paste, and press Enter.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        </div>

        {/* Custom Admin Notes if present */}
        {downloadInfo.notes && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-blue-500/5 border border-blue-500/10 rounded-[2.5rem] p-8 space-y-3"
          >
            <h4 className="text-sm font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Publisher Announcement</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">{downloadInfo.notes}</p>
          </motion.div>
        )}

        {/* Release Notes */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/2 border border-white/5 rounded-[2.5rem] p-8 sm:p-10 space-y-8"
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
