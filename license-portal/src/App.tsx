import { 
  Key, Shield, Plus, List, Trash2, Copy, Check, Search, Filter, Cpu, User, Calendar, 
  Download, DownloadCloud, FileText, BarChart3, Activity, Clock, RotateCcw, Settings, Type
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { licenseService } from './lib/license-service';

// License Type
interface License {
  id: string;
  serial: string;
  status: 'pending' | 'activated' | 'expired';
  machine_id: string;
  activated_at: string | null;
  registered_to: string | null;
  expires_at: string;
  created_at?: string;
  batch_id?: string;
  duration_months?: number;
}

export default function App() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'manage'>('generate');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // New States
  const [generateCount, setGenerateCount] = useState(1);
  const [batchName, setBatchName] = useState('');
  const [duration, setDuration] = useState(12); // 12 months default
  const [isManual, setIsManual] = useState(false);
  const [manualSerial, setManualSerial] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'activated' | 'pending' | 'expired'>('all');

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    setIsLoading(true);
    try {
      const data = await licenseService.getAllLicenses();
      setLicenses(data as License[]);
    } catch (error) {
      console.error("Failed to load licenses", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to generate a serial key
  const generateSerial = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${segment()}-${segment()}-${segment()}-${segment()}`;
  };

  const handleCreateLicense = async () => {
    if (!isManual && generateCount < 1) return;
    if (isManual && !manualSerial.trim()) {
      alert("Please enter a serial key");
      return;
    }
    
    setIsLoading(true);
    try {
      if (isManual) {
        await licenseService.createLicense(manualSerial.trim().toUpperCase(), batchName, duration);
      } else if (generateCount === 1) {
        const serial = generateSerial();
        await licenseService.createLicense(serial, batchName, duration);
      } else {
        const serials = Array.from({ length: generateCount }, () => generateSerial());
        await licenseService.bulkCreate(serials, batchName, duration);
      }
      
      await loadLicenses();
      setBatchName('');
      setGenerateCount(1);
      setManualSerial('');
      setActiveTab('manage');
      setStatusFilter('all');
    } catch (error) {
      console.error("Failed to create license", error);
      alert("Failed to save to database. Check Firebase rules!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (serial: string) => {
    if (window.confirm(`Are you sure you want to revoke ${serial}?`)) {
      try {
        await licenseService.revokeLicense(serial);
        await loadLicenses();
      } catch (error) {
        console.error("Failed to revoke", error);
      }
    }
  };

  const handleReset = async (serial: string) => {
    if (window.confirm(`Reset device binding for ${serial}? User can activate on a new machine.`)) {
      setIsLoading(true);
      try {
        await licenseService.resetLicense(serial);
        await loadLicenses();
      } catch (error) {
        console.error("Failed to reset", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCopy = (serial: string) => {
    navigator.clipboard.writeText(serial);
    setCopiedId(serial);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLicenses = licenses.filter(l => {
    const matchesSearch = l.serial.includes(searchTerm) || 
      (l.registered_to?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.batch_id?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = useMemo(() => {
    return {
      total: licenses.length,
      activated: licenses.filter(l => l.status === 'activated').length,
      pending: licenses.filter(l => l.status === 'pending').length,
      expired: licenses.filter(l => l.status === 'expired').length
    };
  }, [licenses]);

  const downloadAsCSV = () => {
    const headers = ['Serial', 'Status', 'Machine ID', 'Registered To', 'Expires At', 'Created At', 'Batch'];
    const csvContent = [
      headers.join(','),
      ...filteredLicenses.map(l => [
        l.serial,
        l.status,
        l.machine_id || '',
        l.registered_to || '',
        l.expires_at,
        l.created_at || '',
        l.batch_id || ''
      ].map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FormEase_Licenses_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const downloadAsTXT = () => {
    const content = filteredLicenses.map(l => l.serial).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FormEase_Keys_${new Date().toISOString().split('T')[0]}.txt`);
    link.click();
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0A192F] text-slate-200">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation Header */}
      <nav className="relative z-50 w-full p-6 flex items-center justify-between border-b border-white/10 backdrop-blur-xl bg-white/[0.03]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">FormEase <span className="text-blue-500">Console</span></h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">License Management Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
          <button 
            onClick={() => setActiveTab('generate')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'generate' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'}`}
          >
            Generate
          </button>
          <button 
            onClick={() => setActiveTab('manage')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'manage' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'}`}
          >
            Manage Keys
          </button>
        </div>
      </nav>

      <main className="relative z-10 flex-1 p-8 max-w-7xl mx-auto w-full">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { id: 'all', label: 'Total Keys', value: stats.total, icon: Key, color: 'blue' },
            { id: 'activated', label: 'Activated', value: stats.activated, icon: Activity, color: 'green' },
            { id: 'pending', label: 'Pending', value: stats.pending, icon: Clock, color: 'amber' },
            { id: 'expired', label: 'Expired', value: stats.expired, icon: Trash2, color: 'red' },
          ].map((stat, idx) => (
            <button 
              key={idx} 
              onClick={() => {
                setStatusFilter(stat.id as any);
                setActiveTab('manage');
              }}
              className={`text-left transition-all duration-300 bg-white/[0.03] border rounded-3xl p-6 flex items-center gap-4 hover:bg-white/[0.06] hover:scale-[1.02] active:scale-[0.98] ${
                statusFilter === stat.id 
                ? `border-${stat.color}-500/50 bg-${stat.color}-500/5 shadow-lg shadow-${stat.color}-500/10` 
                : 'border-white/10'
              }`}
            >
              <div className={`p-3 rounded-2xl ${
                stat.color === 'blue' ? 'bg-blue-500/10' :
                stat.color === 'green' ? 'bg-green-500/10' :
                stat.color === 'amber' ? 'bg-amber-500/10' : 'bg-red-500/10'
              }`}>
                <stat.icon className={`w-5 h-5 ${
                  stat.color === 'blue' ? 'text-blue-400' :
                  stat.color === 'green' ? 'text-green-400' :
                  stat.color === 'amber' ? 'text-amber-400' : 'text-red-400'
                }`} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</p>
                <p className="text-2xl font-black text-white">{stat.value}</p>
              </div>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'generate' ? (
            <motion.div 
              key="generate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-10 text-center"
            >
              <div className="w-24 h-24 bg-blue-600/20 rounded-[2rem] flex items-center justify-center mb-8 border border-blue-500/30">
                <DownloadCloud className="w-10 h-10 text-blue-400" />
              </div>
              <h2 className="text-4xl font-black text-white mb-4 tracking-tight">License Generator</h2>
              
              <div className="flex gap-2 mb-10 bg-white/5 p-1 rounded-2xl border border-white/10">
                <button 
                  onClick={() => setIsManual(false)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isManual ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'}`}
                >
                  Random Bulk
                </button>
                <button 
                  onClick={() => setIsManual(true)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isManual ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-white'}`}
                >
                  Manual Entry
                </button>
              </div>
              
              <div className="w-full max-w-xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 text-left">
                {!isManual ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 flex items-center gap-2">
                      <List className="w-3 h-3" /> Quantity
                    </label>
                    <input 
                      type="number"
                      min="1"
                      max="100"
                      value={generateCount}
                      onChange={(e) => setGenerateCount(parseInt(e.target.value) || 1)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 flex items-center gap-2">
                      <Type className="w-3 h-3" /> Custom Serial Key
                    </label>
                    <input 
                      type="text"
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      value={manualSerial}
                      onChange={(e) => setManualSerial(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-mono font-bold placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 flex items-center gap-2">
                    <Clock className="w-3 h-3" /> License Duration
                  </label>
                  <select 
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value={1} className="bg-[#0A192F]">1 Month (Trial)</option>
                    <option value={6} className="bg-[#0A192F]">6 Months (Standard)</option>
                    <option value={12} className="bg-[#0A192F]">1 Year (Commercial)</option>
                    <option value={-1} className="bg-[#0A192F]">Lifetime (Infinite)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4 flex items-center gap-2">
                    <Settings className="w-3 h-3" /> Batch Label (Optional)
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Distributor-Name-May2026"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                  />
                </div>
              </div>

              <button 
                onClick={handleCreateLicense}
                disabled={isLoading}
                className="group relative px-10 py-5 bg-blue-600 hover:bg-blue-500 rounded-3xl font-black text-white transition-all shadow-2xl shadow-blue-600/40 hover:scale-105 active:scale-95 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    {isManual ? 'Register Key' : `Generate ${generateCount} ${generateCount > 1 ? 'Keys' : 'Key'}`}
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="manage"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative flex-1 w-full max-w-md group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text"
                    placeholder="Search by Serial, Name, or Batch..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                  />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                   <button 
                    onClick={downloadAsTXT}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 text-slate-200 font-bold transition-all"
                   >
                     <FileText className="w-4 h-4" />
                     Keys (.txt)
                   </button>
                   <button 
                    onClick={downloadAsCSV}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-blue-600/10 border border-blue-600/20 rounded-2xl hover:bg-blue-600/20 text-blue-400 font-bold transition-all"
                   >
                     <Download className="w-4 h-4" />
                     Export (.csv)
                   </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLicenses.map((license) => (
                  <motion.div 
                    layout
                    key={license.id}
                    className="group bg-white/[0.03] border border-white/10 rounded-[2rem] p-6 hover:bg-white/[0.05] transition-all hover:border-blue-500/30 shadow-xl"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex flex-col gap-1">
                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block w-fit ${
                          license.status === 'activated' ? 'bg-green-500/10 text-green-400' : 
                          license.status === 'pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {license.status}
                        </div>
                        <div className="flex gap-2">
                          {license.batch_id && (
                            <p className="text-[9px] font-bold text-blue-500/70 uppercase tracking-widest ml-1">{license.batch_id}</p>
                          )}
                          {license.duration_months && (
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">• {license.duration_months === -1 ? 'Lifetime' : `${license.duration_months}M`}</p>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleCopy(license.serial)}
                        className="p-2 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/5"
                      >
                        {copiedId === license.serial ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    <h3 className="text-xl font-mono font-black text-white tracking-widest mb-6 bg-white/5 p-3 rounded-xl border border-white/5 group-hover:border-blue-500/20 transition-all text-center">
                      {license.serial}
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-slate-400">
                        <div className="p-2 bg-white/5 rounded-lg">
                          <Cpu className="w-4 h-4" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Machine ID</p>
                            {license.status === 'activated' && (
                              <button 
                                onClick={() => handleReset(license.serial)}
                                className="text-[8px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest flex items-center gap-1"
                              >
                                <RotateCcw className="w-2 h-2" /> Reset
                              </button>
                            )}
                          </div>
                          <p className="text-xs font-mono font-bold truncate">{license.machine_id || 'Not yet bound'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-slate-400">
                        <div className="p-2 bg-white/5 rounded-lg">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Registered To</p>
                          <p className="text-xs font-bold">{license.registered_to || 'Unregistered'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-slate-400">
                        <div className="p-2 bg-white/5 rounded-lg">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Expires At</p>
                          <p className="text-xs font-bold">{new Date(license.expires_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-between items-center border-t border-white/5 pt-4">
                      <p className="text-[8px] font-bold text-slate-700 uppercase tracking-widest">
                        {license.created_at ? `Created ${new Date(license.created_at).toLocaleDateString()}` : 'Legacy Key'}
                      </p>
                      <button 
                        onClick={() => handleRevoke(license.serial)}
                        className="text-[10px] font-black uppercase tracking-widest text-red-500/30 hover:text-red-500 transition-colors flex items-center gap-2 p-2"
                      >
                        <Trash2 className="w-3 h-3" />
                        Revoke
                      </button>
                    </div>
                  </motion.div>
                ))}

                {filteredLicenses.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-white/[0.02] border-2 border-dashed border-white/5 rounded-[3rem]">
                    <List className="w-10 h-10 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold">No licenses found matching your search.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-8 border-t border-white/5 text-center">
        <div className="flex justify-center gap-8 mb-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            System Secure
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            Cloud Synced
          </div>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600">
          FormEase Secure Licensing Infrastructure &copy; 2026
        </p>
      </footer>
    </div>
  );
}
