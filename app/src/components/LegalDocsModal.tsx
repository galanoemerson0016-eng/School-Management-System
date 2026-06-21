import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Search, 
  Copy, 
  Check, 
  FileText, 
  Shield, 
  Scale, 
  ChevronRight
} from 'lucide-react';
import { TERMS_AND_CONDITIONS, PRIVACY_POLICY } from '../data/legalDocs';

interface LegalDocsModalProps {
  isOpen: boolean;
  initialTab?: 'terms' | 'privacy';
  onClose: () => void;
}

export function LegalDocsModal({ isOpen, initialTab = 'terms', onClose }: LegalDocsModalProps) {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Sync active tab state if initialTab changes while open
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const activeDoc = useMemo(() => {
    return activeTab === 'terms' ? TERMS_AND_CONDITIONS : PRIVACY_POLICY;
  }, [activeTab]);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return activeDoc;
    const query = searchQuery.toLowerCase();
    return activeDoc.filter(section => 
      section.title.toLowerCase().includes(query) ||
      section.content.some(paragraph => paragraph.toLowerCase().includes(query))
    );
  }, [activeDoc, searchQuery]);

  const handleCopy = () => {
    const fullText = activeDoc.map(sec => {
      return `${sec.title}\n\n${sec.content.join('\n')}`;
    }).join('\n\n=========================================\n\n');
    
    navigator.clipboard.writeText(`FormEase Pro - ${activeTab === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}\nLast Updated: June 2026\n\n${fullText}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSectionJump = (id: string) => {
    const targetElement = document.getElementById(`sec-${activeTab}-${id}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0f172a] border border-white/10 rounded-4xl w-full max-w-6xl h-[85vh] flex flex-col md:flex-row overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
          >
            {/* LEFT SIDEBAR: Table of Contents */}
            <div className="md:w-1/3 bg-[#090d16] border-r border-white/5 flex flex-col h-1/3 md:h-full">
              {/* Header inside sidebar */}
              <div className="p-6 border-b border-white/5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">FormEase Pro</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Legal Center</p>
                  </div>
                </div>

                {/* Tab selectors */}
                <div className="bg-slate-900 rounded-xl p-1 flex gap-1 border border-white/5">
                  <button
                    onClick={() => { setActiveTab('terms'); setSearchQuery(''); }}
                    className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'terms'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Terms
                  </button>
                  <button
                    onClick={() => { setActiveTab('privacy'); setSearchQuery(''); }}
                    className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'privacy'
                        ? 'bg-emerald-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Privacy
                  </button>
                </div>
              </div>

              {/* TOC Links scroll area */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-1">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-3 mb-2">Table of Contents</p>
                {activeDoc.map(sec => {
                  const isVisible = filteredSections.some(fs => fs.id === sec.id);
                  return (
                    <button
                      key={sec.id}
                      onClick={() => handleSectionJump(sec.id)}
                      disabled={!isVisible}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${
                        isVisible 
                          ? 'text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer'
                          : 'text-slate-600 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <span className="truncate pr-2">{sec.title}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT MAIN VIEW: Contents */}
            <div className="flex-1 flex flex-col h-2/3 md:h-full bg-slate-950/20">
              {/* Header: Actions / Search */}
              <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search terms or clauses..."
                    className="w-full bg-[#090d16] border border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Copy / Close */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-black uppercase tracking-wider text-slate-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Text
                      </>
                    )}
                  </button>

                  <button
                    onClick={onClose}
                    className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Document Details */}
              <div 
                ref={contentContainerRef}
                className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-8 scroll-smooth"
              >
                {/* Intro Card */}
                <div className="p-6 bg-linear-to-br from-blue-500/5 to-emerald-500/5 border border-white/5 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
                  <div className="relative z-10 space-y-2">
                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                      FormEase Pro Official Documentation
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                      {activeTab === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                      Last updated: June 21, 2026 • Version {activeTab === 'terms' ? '2.2 (Philippine Jurisdiction)' : '1.1 (RA 10173 Compliant)'}
                    </p>
                  </div>
                </div>

                {/* Filtered Sections List */}
                <div className="space-y-8 pb-12">
                  {filteredSections.length > 0 ? (
                    filteredSections.map(sec => (
                      <div 
                        key={sec.id} 
                        id={`sec-${activeTab}-${sec.id}`}
                        className="space-y-4 border-b border-white/5 pb-6 last:border-b-0"
                      >
                        <h4 className="text-base font-black text-white flex items-center gap-2 leading-snug">
                          {sec.title}
                        </h4>
                        <div className="space-y-3 pl-1">
                          {sec.content.map((paragraph, pIndex) => (
                            <p 
                              key={pIndex} 
                              className="text-[13px] text-slate-400 leading-relaxed font-medium"
                            >
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-16 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 mx-auto">
                        <Search className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-black text-slate-300">No results found</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        No section matches your search term "{searchQuery}". Try searching for words like "local", "backup", or "license".
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
