import { 
  Key, Shield, Plus, List, Trash2, Copy, Check, Search, Filter, Cpu, User, Calendar, 
  Download, DownloadCloud, FileText, BarChart3, Activity, Clock, RotateCcw, Settings, Type,
  LogOut, Lock, Mail, AlertCircle, ShoppingCart, UserCheck, XCircle, Monitor, Apple, RefreshCcw, Smartphone, Wrench, Loader2,
  ChevronRight, ExternalLink, Image as ImageIcon, X, Megaphone, Bell, Radio, Send, Globe, Sparkles, CheckCircle2, AlertTriangle, Info,
  Bug, MessageSquare, Building, RefreshCw, CheckCheck
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { licenseService } from '../lib/license-service';
import { auth, db } from '../lib/firebase';
import { signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

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
  platform?: 'windows' | 'mac';
}

export interface BroadcastNotice {
  id: string;
  title: string;
  content: string;
  severity: 'info' | 'warning' | 'urgent' | 'success';
  display_type: 'banner' | 'modal';
  action_label?: string;
  action_url?: string;
  is_active: boolean;
  created_at: string;
  expires_at?: string | null;
  product?: string;
}

export interface DiagnosticReportItem {
  id: string;
  ticket_id: string;
  created_at: string;
  timestamp: number;
  app_version: string;
  machine_id: string;
  status: 'open' | 'in_progress' | 'resolved';
  category: string;
  user_note?: string;
  section_name?: string;
  grade_level?: string;
  student_lrn?: string;
  student_name?: string;
  total_mismatches: number;
  sync_rate: number;
  active_school_year?: string;
  school?: {
    id?: string;
    name?: string;
    division?: string;
    region?: string;
  };
  submitted_by?: {
    name?: string;
    email?: string;
    role?: string;
  };
  client_info?: {
    userAgent?: string;
    platform?: string;
    screen?: string;
  };
  report_markdown: string;
  technical_details?: Record<string, unknown>;
}

export default function AdminPortal({ user }: { user: FirebaseUser }) {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [trials, setTrials] = useState<any[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastNotice[]>([]);
  const [diagnosticReports, setDiagnosticReports] = useState<DiagnosticReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<DiagnosticReportItem | null>(null);
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeProduct, setActiveProduct] = useState<'formease-pro' | 'anecdotal-record' | 'id-generator'>('formease-pro');
  const [activeTab, setActiveTab] = useState<'generate' | 'manage' | 'requests' | 'trials' | 'system' | 'advertisement' | 'broadcasts' | 'diagnostics'>('generate');
  const [manageSubTab, setManageSubTab] = useState<'all' | 'windows' | 'mac'>('all');
  const [requestStatusFilter, setRequestStatusFilter] = useState<'pending' | 'approved' | 'declined' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Broadcast Form State
  const [isSubmittingBroadcast, setIsSubmittingBroadcast] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    content: '',
    severity: 'info' as 'info' | 'warning' | 'urgent' | 'success',
    display_type: 'banner' as 'banner' | 'modal',
    action_label: '',
    action_url: '',
    is_active: true,
    expires_at: '',
    product: 'formease-pro'
  });
  
  // For Decline Modal
  const [declineModal, setDeclineModal] = useState<{ isOpen: boolean; requestId: string | null; reason: string }>({
    isOpen: false,
    requestId: null,
    reason: 'Invalid Reference Number'
  });

  const declineReasons = [
    'Invalid Reference Number',
    'Incorrect Payment Amount',
    'Receipt Already Used',
    'Payment Not Received',
    'Fraudulent Activity Detected',
    'Other (Contact Support)'
  ];

  const handleLogout = () => signOut(auth);
  
  const parseDate = (date: any) => {
    if (!date) return null;
    try {
      if (date instanceof Date) return date;
      if (typeof date === 'string') {
        const d = new Date(date);
        return isNaN(d.getTime()) ? null : d;
      }
      if (typeof date === 'object') {
        if (date.seconds) return new Date(date.seconds * 1000);
        if (typeof date.toDate === 'function') return date.toDate();
        // Handle ISO string in an object (e.g. { _seconds: ... } or similar)
        if (date._seconds) return new Date(date._seconds * 1000);
      }
      const d = new Date(date);
      return isNaN(d.getTime()) ? null : d;
    } catch (e) {
      return null;
    }
  };
  
  const [generateCount, setGenerateCount] = useState(1);
  const [batchName, setBatchName] = useState('');
  const [duration, setDuration] = useState(12);
  const [selectedPlatform, setSelectedPlatform] = useState<'windows' | 'mac'>('windows');
  const [statusFilter, setStatusFilter] = useState<'all' | 'activated' | 'pending' | 'expired'>('all');

  // Download config states
  const [downloadWinUrl, setDownloadWinUrl] = useState('');
  const [downloadMacUrl, setDownloadMacUrl] = useState('');
  const [downloadVersion, setDownloadVersion] = useState('1.0.49');
  const [downloadNotes, setDownloadNotes] = useState('');
  const [isUpdatingDownloads, setIsUpdatingDownloads] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeProduct]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const licenseData = await licenseService.getAllLicenses();
      const requestData = await licenseService.getAllRequests();
      const trialData = await licenseService.getAllTrials();
      const downloadData = await licenseService.getDownloadsInfo();
      const broadcastData = await licenseService.getAllBroadcasts();
      const reportData = await licenseService.getAllDiagnosticReports();
      
      setLicenses(Array.isArray(licenseData) ? (licenseData as License[]) : []);
      setRequests(Array.isArray(requestData) ? requestData : []);
      setTrials(Array.isArray(trialData) ? trialData : []);
      setBroadcasts(Array.isArray(broadcastData) ? (broadcastData as BroadcastNotice[]) : []);
      setDiagnosticReports(Array.isArray(reportData) ? (reportData as DiagnosticReportItem[]) : []);

      if (downloadData) {
        setDownloadWinUrl(downloadData.win_url || '');
        setDownloadMacUrl(downloadData.mac_url || '');
        setDownloadVersion(downloadData.version || '1.0.49');
        setDownloadNotes(downloadData.notes || '');
      }
    } catch (error) {
      console.error("Load failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateReportStatus = async (ticketId: string, newStatus: 'open' | 'in_progress' | 'resolved') => {
    try {
      await licenseService.updateDiagnosticReportStatus(ticketId, newStatus);
      setDiagnosticReports(prev => prev.map(r => (r.ticket_id === ticketId || r.id === ticketId) ? { ...r, status: newStatus } : r));
      if (selectedReport && (selectedReport.ticket_id === ticketId || selectedReport.id === ticketId)) {
        setSelectedReport(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update report status');
    }
  };

  const handleDeleteReport = async (ticketId: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete report #${ticketId}?`)) return;
    try {
      await licenseService.deleteDiagnosticReport(ticketId);
      setDiagnosticReports(prev => prev.filter(r => r.ticket_id !== ticketId && r.id !== ticketId));
      if (selectedReport && (selectedReport.ticket_id === ticketId || selectedReport.id === ticketId)) {
        setSelectedReport(null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete report');
    }
  };

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.content.trim()) {
      alert("Title and content are required.");
      return;
    }
    setIsSubmittingBroadcast(true);
    try {
      await licenseService.createBroadcast({
        title: broadcastForm.title,
        content: broadcastForm.content,
        severity: broadcastForm.severity,
        display_type: broadcastForm.display_type,
        action_label: broadcastForm.action_label,
        action_url: broadcastForm.action_url,
        is_active: broadcastForm.is_active,
        expires_at: broadcastForm.expires_at ? new Date(broadcastForm.expires_at).toISOString() : null,
        product: activeProduct,
      });
      setBroadcastForm({
        title: '',
        content: '',
        severity: 'info',
        display_type: 'banner',
        action_label: '',
        action_url: '',
        is_active: true,
        expires_at: '',
        product: activeProduct,
      });
      await loadData();
      alert("📢 Broadcast notice published! All connected client apps will receive it.");
    } catch (err: any) {
      console.error("Publish broadcast error:", err);
      alert("Failed to publish broadcast: " + (err.message || String(err)));
    } finally {
      setIsSubmittingBroadcast(false);
    }
  };

  const handleToggleBroadcast = async (id: string, currentStatus: boolean) => {
    try {
      await licenseService.updateBroadcast(id, { is_active: !currentStatus });
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to toggle broadcast status");
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    if (!window.confirm("Are you sure you want to PERMANENTLY DELETE this broadcast notice?")) return;
    try {
      await licenseService.deleteBroadcast(id);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete broadcast");
    }
  };

  const handleRevokeTrial = async (trialId: string) => {
    if (window.confirm('Are you sure you want to delete this trial record? This will allow the computer to claim a new free trial.')) {
      setIsLoading(true);
      try {
        await licenseService.deleteTrial(trialId);
        await loadData();
      } catch (error) {
        console.error('Revoke trial failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUpdateDownloads = async () => {
    setIsUpdatingDownloads(true);
    try {
      await licenseService.updateDownloadsInfo({
        win_url: downloadWinUrl,
        mac_url: downloadMacUrl,
        version: downloadVersion,
        notes: downloadNotes
      });
      alert('Download URLs and version updated successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to update downloads info');
    } finally {
      setIsUpdatingDownloads(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateSerial = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${segment()}-${segment()}-${segment()}-${segment()}`;
  };

  const handleCreateLicense = async () => {
    if (generateCount < 1) return;
    setIsLoading(true);
    try {
      if (generateCount === 1) {
        await licenseService.createLicense(generateSerial(), batchName, duration, null, selectedPlatform);
      } else {
        const serials = Array.from({ length: generateCount }, () => generateSerial());
        await licenseService.bulkCreate(serials, batchName, duration, selectedPlatform);
      }
      await loadData();
      setBatchName('');
      setGenerateCount(1);
      setActiveTab('manage');
      setManageSubTab(selectedPlatform);
    } catch (error) {
      console.error(error);
      alert("Failed to save.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveRequest = async (request: any) => {
    if (!window.confirm(`Approve request from ${request.email}?`)) return;
    setIsLoading(true);
    try {
      const serial = generateSerial();
      const platform = request.platform || 'windows';
      await licenseService.approveRequest(request.id, serial, platform, request.name);
      
      alert(`Request Approved! Serial generated: ${serial} (${platform.toUpperCase()})`);
      
      await loadData();
      setActiveTab('manage');
      setManageSubTab(platform);
    } catch (error) {
      console.error(error);
      alert("Failed to approve request.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete this request? This will remove it from the customer Storefront retrieval.")) return;
    setIsLoading(true);
    try {
      await licenseService.deleteRequest(requestId);
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Failed to delete request.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePlatform = async (serial: string, current: string) => {
    const next = current === 'mac' ? 'windows' : 'mac';
    if (!window.confirm(`Switch this license to ${next.toUpperCase()}?`)) return;
    try {
        await setDoc(doc(db, 'artifacts/g7-special/public/data/licenses', serial), { platform: next }, { merge: true });
        await loadData();
    } catch (e) {
        alert("Failed to update platform.");
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm("WARNING: This will PERMANENTLY delete all unactivated (Pending) keys. Activated keys will be kept. Continue?")) return;
    setIsLoading(true);
    try {
        const count = await licenseService.cleanupPendingLicenses();
        alert(`Successfully deleted ${count} pending licenses.`);
        await loadData();
    } catch (e) {
        alert("Cleanup failed.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleRepairExpirations = async () => {
    if (!window.confirm("This will scan all activated licenses and set their expiration to exactly 1 year after their activation date. Continue?")) return;
    setIsLoading(true);
    try {
        const count = await licenseService.repairExpirations();
        alert(`Successfully repaired ${count} licenses.`);
        await loadData();
    } catch (error) {
      console.error(error);
      alert("Repair failed.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleResetLicense = async (serial: string) => {
    if (!window.confirm(`Are you sure you want to RESET this license? \n\nThe current device using this key will be forced to reactivate, and the key will be available for use on another device.`)) return;
    
    setIsLoading(true);
    try {
      await licenseService.resetLicense(serial);
      await loadData();
      alert("License successfully reset.");
    } catch (error) {
      console.error(error);
      alert("Failed to reset license.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLicense = async (serial: string) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE/REMOVE this license key: ${serial}? \n\nThe device using this key will immediately lose access to the application!`)) return;
    
    setIsLoading(true);
    try {
      await licenseService.revokeLicense(serial);
      await loadData();
      alert("License successfully deleted.");
    } catch (error) {
      console.error(error);
      alert("Failed to delete license.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineRequest = async () => {
    if (!declineModal.requestId) return;
    setIsLoading(true);
    try {
      await licenseService.declineRequest(declineModal.requestId, declineModal.reason);
      setDeclineModal({ isOpen: false, requestId: null, reason: 'Invalid Reference Number' });
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Failed to decline request.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLicenses = useMemo(() => {
    if (!Array.isArray(licenses)) return [];
    const search = (searchTerm || '').toLowerCase();
    
    const sorted = [...licenses].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });

    return sorted.filter((l: License) => {
      const serial = (l.serial || '').toLowerCase();
      const user = (l.registered_to || '').toLowerCase();
      const batch = (l.batch_id || '').toLowerCase();
      
      const matchesSearch = serial.includes(search) || 
        user.includes(search) ||
        batch.includes(search);
        
      const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
      const matchesPlatform = manageSubTab === 'all' || l.platform === manageSubTab;
      
      return matchesSearch && matchesStatus && matchesPlatform;
    });
  }, [licenses, searchTerm, statusFilter, manageSubTab]);

  const stats = useMemo(() => {
    const safeLicenses = Array.isArray(licenses) ? licenses : [];
    const safeRequests = Array.isArray(requests) ? requests : [];
    const safeTrials = Array.isArray(trials) ? trials : [];
    const safeReports = Array.isArray(diagnosticReports) ? diagnosticReports : [];
    return {
      total: safeLicenses.length,
      activated: safeLicenses.filter((l: License) => l.status === 'activated').length,
      pending: safeLicenses.filter((l: License) => l.status === 'pending').length,
      windows: safeLicenses.filter((l: License) => l.platform === 'windows').length,
      mac: safeLicenses.filter((l: License) => l.platform === 'mac').length,
      requests: safeRequests.filter(r => r.status === 'pending').length,
      all_requests: safeRequests.length,
      trials: safeTrials.length,
      open_reports: safeReports.filter(r => r.status === 'open').length,
      total_reports: safeReports.length
    };
  }, [licenses, requests, trials, diagnosticReports]);

  const filteredDiagnosticReports = useMemo(() => {
    if (!Array.isArray(diagnosticReports)) return [];
    const q = (reportSearchTerm || '').toLowerCase().trim();

    return diagnosticReports.filter((r) => {
      const matchesSearch = !q ||
        r.ticket_id?.toLowerCase().includes(q) ||
        r.school?.name?.toLowerCase().includes(q) ||
        r.school?.id?.toLowerCase().includes(q) ||
        r.submitted_by?.name?.toLowerCase().includes(q) ||
        r.submitted_by?.email?.toLowerCase().includes(q) ||
        r.section_name?.toLowerCase().includes(q) ||
        r.student_name?.toLowerCase().includes(q) ||
        r.student_lrn?.includes(q) ||
        r.user_note?.toLowerCase().includes(q);

      const matchesStatus = reportStatusFilter === 'all' || r.status === reportStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [diagnosticReports, reportSearchTerm, reportStatusFilter]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0A192F] text-slate-200">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-200 h-200 bg-blue-600/20 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-15%] left-[-10%] w-150 h-150 bg-indigo-600/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <nav className="relative z-50 w-full p-6 flex items-center justify-between border-b border-white/10 backdrop-blur-xl bg-white/3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">FormEase <span className="text-blue-500">Console</span></h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Admin Environment</p>
            </div>
          </div>
          
          <div className="h-8 w-px bg-white/10 mx-2" />
          
          <div className="flex flex-col">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5 ml-1">Select Product Database</label>
            <select
              value={activeProduct}
              onChange={(e) => {
                const prod = e.target.value as 'formease-pro' | 'anecdotal-record' | 'id-generator';
                licenseService.setProduct(prod);
                setActiveProduct(prod);
              }}
              className="bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-xs font-black text-white outline-none cursor-pointer hover:bg-white/10 transition-colors"
            >
              <option value="formease-pro" className="bg-[#0A192F]">FormEase Pro (Student Management)</option>
              <option value="anecdotal-record" className="bg-[#0A192F]">ASRS Anecdotal Record</option>
              <option value="id-generator" className="bg-[#0A192F]">FormEase ID Generator</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
          <button onClick={() => setActiveTab('generate')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'generate' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>Generate</button>
          <button onClick={() => setActiveTab('requests')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'requests' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
            Requests {stats.requests > 0 && <span className="px-1.5 py-0.5 bg-red-500 rounded-full text-[8px]">{stats.requests}</span>}
          </button>
          <button onClick={() => setActiveTab('manage')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'manage' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>Manage</button>
          <button onClick={() => setActiveTab('trials')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'trials' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400'}`}>
            Trials <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-500 rounded-full text-[8px] font-black">{stats.trials}</span>
          </button>
          <button onClick={() => setActiveTab('broadcasts')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'broadcasts' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400'}`}>
            <Megaphone className="w-3.5 h-3.5" />
            <span>Broadcasts</span>
            {broadcasts.filter(b => b.is_active).length > 0 && (
              <span className="px-1.5 py-0.5 bg-cyan-400 text-slate-950 rounded-full text-[8px] font-black">
                {broadcasts.filter(b => b.is_active).length}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab('diagnostics')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'diagnostics' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400'}`}>
            <Bug className="w-3.5 h-3.5" />
            <span>Bug Reports</span>
            {stats.open_reports > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[8px] font-black animate-pulse">
                {stats.open_reports}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab('advertisement')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'advertisement' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-400'}`}>Advertisement</button>
          <button onClick={() => setActiveTab('system')} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'system' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400'}`}>System</button>
          <div className="w-px h-6 bg-white/10 mx-2" />
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 transition-colors"><LogOut className="w-5 h-5" /></button>
        </div>
      </nav>

      <main className="relative z-10 flex-1 p-8 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'diagnostics' ? (
            <motion.div key="diagnostics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              {/* Header & Refresh */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-600/20 text-amber-400 rounded-2xl border border-amber-500/30">
                      <Bug className="w-6 h-6" />
                    </div>
                    <h2 className="text-3xl font-black text-white">Client Bug Reports & Diagnostics</h2>
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                    Live diagnostic logs, grade synchronization discrepancies, and user notes submitted directly from FormEase Pro desktop apps.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={loadData}
                    disabled={isLoading}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black text-slate-300 flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
                    <span>Refresh Reports</span>
                  </button>
                  <span className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-black text-amber-400 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" />
                    {stats.open_reports} Open Issue{stats.open_reports === 1 ? '' : 's'}
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 rounded-3xl bg-white/3 border border-white/5 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Submissions</span>
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-3xl font-black text-white">{stats.total_reports}</p>
                  <p className="text-xs text-slate-500 font-bold mt-1">All-time received</p>
                </div>

                <div className="p-6 rounded-3xl bg-white/3 border border-white/5 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Open Tickets</span>
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <p className="text-3xl font-black text-red-400">{stats.open_reports}</p>
                  <p className="text-xs text-red-400/70 font-bold mt-1">Requires inspection</p>
                </div>

                <div className="p-6 rounded-3xl bg-white/3 border border-white/5 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">In Progress</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-3xl font-black text-amber-400">
                    {diagnosticReports.filter(r => r.status === 'in_progress').length}
                  </p>
                  <p className="text-xs text-amber-400/70 font-bold mt-1">Being reviewed</p>
                </div>

                <div className="p-6 rounded-3xl bg-white/3 border border-white/5 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Resolved</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-3xl font-black text-emerald-400">
                    {diagnosticReports.filter(r => r.status === 'resolved').length}
                  </p>
                  <p className="text-xs text-emerald-400/70 font-bold mt-1">Fixed & closed</p>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="p-4 bg-white/3 border border-white/10 rounded-3xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {(['all', 'open', 'in_progress', 'resolved'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setReportStatusFilter(st)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        reportStatusFilter === st
                          ? st === 'open'
                            ? 'bg-red-600 text-white shadow-lg'
                            : st === 'in_progress'
                            ? 'bg-amber-600 text-white shadow-lg'
                            : st === 'resolved'
                            ? 'bg-emerald-600 text-white shadow-lg'
                            : 'bg-blue-600 text-white shadow-lg'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {st.replace('_', ' ')} (
                        {st === 'all'
                          ? diagnosticReports.length
                          : diagnosticReports.filter(r => r.status === st).length}
                      )
                    </button>
                  ))}
                </div>

                <div className="relative min-w-65 sm:min-w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={reportSearchTerm}
                    onChange={(e) => setReportSearchTerm(e.target.value)}
                    placeholder="Search by School, Teacher, LRN, Ticket..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Reports List */}
              <div className="space-y-4">
                {filteredDiagnosticReports.length > 0 ? (
                  filteredDiagnosticReports.map((report) => (
                    <div
                      key={report.id || report.ticket_id}
                      className="p-6 bg-white/3 border border-white/5 hover:border-white/15 rounded-3xl backdrop-blur-xl transition-all space-y-4 hover:shadow-2xl"
                    >
                      {/* Top Row: Ticket ID, Date, Status */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-black text-xs">
                            #{report.ticket_id}
                          </span>
                          <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A'}
                          </span>
                          <span className="text-xs text-slate-500 font-bold">
                            App v{report.app_version || '3.2.0'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={report.status}
                            onChange={(e) => handleUpdateReportStatus(report.ticket_id, e.target.value as any)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border outline-none cursor-pointer transition-all ${
                              report.status === 'open'
                                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                : report.status === 'in_progress'
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            }`}
                          >
                            <option value="open" className="bg-[#0A192F] text-red-400">🔴 Open</option>
                            <option value="in_progress" className="bg-[#0A192F] text-amber-400">🟡 In Progress</option>
                            <option value="resolved" className="bg-[#0A192F] text-emerald-400">🟢 Resolved</option>
                          </select>
                        </div>
                      </div>

                      {/* Main Grid: School & Submitter Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        {/* School Info */}
                        <div className="p-3.5 rounded-2xl bg-white/2 border border-white/5 space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-blue-400" />
                            School Information
                          </span>
                          <p className="font-bold text-white text-sm truncate">
                            {report.school?.name || 'Unknown School'}
                          </p>
                          <p className="text-slate-400 text-[11px]">
                            ID: {report.school?.id || 'N/A'} • {report.school?.division || 'Division'}
                          </p>
                        </div>

                        {/* Submitter Info */}
                        <div className="p-3.5 rounded-2xl bg-white/2 border border-white/5 space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-indigo-400" />
                            Submitted By
                          </span>
                          <p className="font-bold text-white text-sm truncate">
                            {report.submitted_by?.name || 'Anonymous User'}
                          </p>
                          <p className="text-slate-400 text-[11px] truncate">
                            {report.submitted_by?.email || 'N/A'} ({report.submitted_by?.role || 'teacher'})
                          </p>
                        </div>

                        {/* Section & Student Context */}
                        <div className="p-3.5 rounded-2xl bg-white/2 border border-white/5 space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-purple-400" />
                            Context & Discrepancies
                          </span>
                          <p className="font-bold text-white text-sm truncate">
                            {report.section_name || 'All Sections'} ({report.grade_level || 'Grade Level'})
                          </p>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-red-400 font-bold">
                              {report.total_mismatches} Mismatch(es)
                            </span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400">
                              SY {report.active_school_year || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* User Note */}
                      {report.user_note && (
                        <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-2.5">
                          <MessageSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                              Client Note / Description
                            </p>
                            <p className="text-xs text-slate-200 leading-relaxed italic">
                              "{report.user_note}"
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Actions Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
                          >
                            <Search className="w-3.5 h-3.5" />
                            <span>Inspect Full Diagnostic Log</span>
                          </button>

                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(report.report_markdown);
                              handleCopy(report.report_markdown, report.ticket_id);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            {copiedId === report.ticket_id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedId === report.ticket_id ? 'Copied!' : 'Copy Markdown'}</span>
                          </button>

                          {report.submitted_by?.email && report.submitted_by.email !== 'N/A' && (
                            <a
                              href={`mailto:${report.submitted_by.email}?subject=${encodeURIComponent(`[FormEase Pro Support] Re: Issue Report #${report.ticket_id}`)}`}
                              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Email Teacher</span>
                            </a>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteReport(report.ticket_id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                          title="Delete Report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center bg-white/2 border-2 border-dashed border-white/5 rounded-3xl space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-60" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-sm">
                      No Bug Reports Found
                    </p>
                    <p className="text-xs text-slate-500">
                      All clients are operating smoothly with 0 reported grade synchronization discrepancies.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeTab === 'broadcasts' ? (
            <motion.div key="broadcasts" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-600/20 text-cyan-400 rounded-2xl border border-cyan-500/30">
                      <Megaphone className="w-6 h-6" />
                    </div>
                    <h2 className="text-3xl font-black text-white">Global Broadcast Notices</h2>
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                    Send real-time alerts, maintenance memos, or DepEd advisories directly to all active FormEase Pro client apps when online.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-3.5 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs font-black text-cyan-400 flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                    {broadcasts.filter(b => b.is_active).length} Active Online Broadcasts
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Create Broadcast Form */}
                <div className="lg:col-span-5 bg-white/3 border border-white/10 rounded-[2.5rem] p-7 shadow-2xl backdrop-blur-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-2.5">
                      <Send className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Publish New Broadcast</h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      Live to All Clients
                    </span>
                  </div>

                  <form onSubmit={handleCreateBroadcast} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notice Title</label>
                      <input
                        type="text"
                        value={broadcastForm.title}
                        onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                        placeholder="e.g. Important Advisory: Grade 11 SF9 Format Released"
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all placeholder:text-slate-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notice Content / Message</label>
                      <textarea
                        value={broadcastForm.content}
                        onChange={(e) => setBroadcastForm({ ...broadcastForm, content: e.target.value })}
                        placeholder="Type the message that will be shown to all school advisers..."
                        required
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all placeholder:text-slate-600 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Severity / Color</label>
                        <select
                          value={broadcastForm.severity}
                          onChange={(e) => setBroadcastForm({ ...broadcastForm, severity: e.target.value as any })}
                          className="w-full bg-[#0A192F] border border-white/10 rounded-2xl py-3 px-4 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
                        >
                          <option value="info">🔵 Info (Blue / Standard)</option>
                          <option value="warning">🟡 Warning (Amber / Advisory)</option>
                          <option value="urgent">🔴 Urgent (Red / Critical)</option>
                          <option value="success">🟢 Success (Green / New Feature)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Style</label>
                        <select
                          value={broadcastForm.display_type}
                          onChange={(e) => setBroadcastForm({ ...broadcastForm, display_type: e.target.value as any })}
                          className="w-full bg-[#0A192F] border border-white/10 rounded-2xl py-3 px-4 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
                        >
                          <option value="banner">📌 Top Sticky Banner</option>
                          <option value="modal">💬 Interactive Popup Modal</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Action Button Text (Optional)</label>
                        <input
                          type="text"
                          value={broadcastForm.action_label}
                          onChange={(e) => setBroadcastForm({ ...broadcastForm, action_label: e.target.value })}
                          placeholder="e.g. View Guidelines"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all placeholder:text-slate-600"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Action Button URL (Optional)</label>
                        <input
                          type="text"
                          value={broadcastForm.action_url}
                          onChange={(e) => setBroadcastForm({ ...broadcastForm, action_url: e.target.value })}
                          placeholder="https://... or download link"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all placeholder:text-slate-600"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-white/2 border border-white/5 rounded-2xl">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          id="is_active_toggle"
                          checked={broadcastForm.is_active}
                          onChange={(e) => setBroadcastForm({ ...broadcastForm, is_active: e.target.checked })}
                          className="w-4 h-4 rounded text-cyan-500 bg-white/5 border-white/20 focus:ring-cyan-500"
                        />
                        <label htmlFor="is_active_toggle" className="text-xs font-bold text-slate-300 cursor-pointer">
                          Activate Immediately
                        </label>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">Live on save</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingBroadcast}
                      className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 active:scale-[0.98]"
                    >
                      {isSubmittingBroadcast ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Publish to All Client Apps</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Broadcasts List */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                      Broadcasts History & Status ({broadcasts.length})
                    </h3>
                  </div>

                  {broadcasts.length > 0 ? (
                    <div className="space-y-4">
                      {broadcasts.map((b) => {
                        const isInfo = b.severity === 'info';
                        const isWarning = b.severity === 'warning';
                        const isUrgent = b.severity === 'urgent';
                        const isSuccess = b.severity === 'success';

                        const borderColor = isUrgent
                          ? 'border-red-500/30 bg-red-500/5'
                          : isWarning
                          ? 'border-amber-500/30 bg-amber-500/5'
                          : isSuccess
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : 'border-cyan-500/30 bg-cyan-500/5';

                        const badgeColor = isUrgent
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : isSuccess
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';

                        return (
                          <div
                            key={b.id}
                            className={`rounded-3xl border p-6 space-y-4 transition-all ${borderColor} relative overflow-hidden`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                                    {b.severity}
                                  </span>
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                                    {b.display_type === 'modal' ? '💬 Modal Popup' : '📌 Top Banner'}
                                  </span>
                                  {b.is_active ? (
                                    <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                      Active Live
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30">
                                      Paused / Inactive
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-base font-black text-white mt-2">{b.title}</h4>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleBroadcast(b.id, b.is_active)}
                                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                                    b.is_active
                                      ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20'
                                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                                  }`}
                                >
                                  {b.is_active ? 'Pause' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => handleDeleteBroadcast(b.id)}
                                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                                  title="Delete Broadcast"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <p className="text-xs font-medium text-slate-300 whitespace-pre-wrap bg-black/20 p-4 rounded-2xl border border-white/5">
                              {b.content}
                            </p>

                            {b.action_label && (
                              <div className="flex items-center gap-2 text-[11px] font-bold text-cyan-400">
                                <span>Button:</span>
                                <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">{b.action_label}</span>
                                {b.action_url && <span className="text-slate-500 truncate max-w-50">({b.action_url})</span>}
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 pt-2 border-t border-white/5">
                              <span>Posted: {new Date(b.created_at).toLocaleString()}</span>
                              <span>Target: {b.product || 'All Products'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-slate-500 font-bold text-sm bg-white/2 border border-white/5 border-dashed rounded-3xl">
                      No broadcast notices published yet. Use the form on the left to broadcast an announcement to your users.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'trials' ? (
             <motion.div key="trials" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-white">Trial Devices</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active 1-hour trial machines calculated by unique hardware ID</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {trials.length > 0 ? (
                      trials.map((t) => (
                         <div key={t.id} className="bg-white/3 border border-white/10 rounded-4xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden">
                            <div className="flex items-start justify-between">
                               <div className="flex items-center gap-4">
                                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                                     {t.platform === 'mac' ? <Apple className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                                  </div>
                                  <div>
                                     <h4 className="font-black text-white text-sm truncate max-w-37.5">{t.platform === 'mac' ? 'macOS Device' : 'Windows Device'}</h4>
                                     <p className="text-[10px] text-slate-500 font-mono select-all uppercase tracking-wide truncate max-w-37.5">{t.machine_id}</p>
                                  </div>
                                </div>
                               {(() => {
                                  const startedAt = parseDate(t.started_at);
                                  const isExpired = startedAt ? (new Date().getTime() - startedAt.getTime() > 1 * 60 * 60 * 1000) : true;
                                  return isExpired ? (
                                     <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-500 text-[8px] font-black uppercase tracking-widest">Expired</span>
                                  ) : (
                                     <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-500 text-[8px] font-black uppercase tracking-widest">Active Trial</span>
                                  );
                               })()}
                            </div>
                            <div className="border-t border-white/5 pt-4 space-y-2">
                               <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                                   <span>Claimed At:</span>
                                   <span>{t.started_at ? (parseDate(t.started_at)?.toLocaleString() || 'N/A') : 'N/A'}</span>
                               </div>
                            </div>
                            <button onClick={() => handleRevokeTrial(t.id)} className="w-full py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/20 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                               <Trash2 className="w-3.5 h-3.5" />
                               <span>Delete Trial Record</span>
                            </button>
                         </div>
                      ))
                   ) : (
                      <div className="col-span-full py-16 text-center text-slate-400 font-bold text-sm bg-white/2 border border-white/5 border-dashed rounded-3xl">No trial devices registered.</div>
                   )}
                </div>
             </motion.div>
          ) : activeTab === 'system' ? (
             <motion.div key="system" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto py-10 space-y-10">
                <div className="text-center">
                   <h2 className="text-3xl font-black text-white mb-2">System Maintenance</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-white/3 border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center text-center space-y-6">
                      <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20"><Trash2 className="w-8 h-8 text-red-500" /></div>
                      <h3 className="text-xl font-black text-white">Database Cleanup</h3>
                      <button onClick={handleCleanup} className="w-full py-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/20 rounded-2xl font-black text-xs uppercase tracking-widest">Delete Pending Keys</button>
                   </div>
                   <div className="bg-white/3 border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center text-center space-y-6">
                      <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20"><Wrench className="w-8 h-8 text-blue-500" /></div>
                      <h3 className="text-xl font-black text-white">Repair Expirations</h3>
                      <button onClick={handleRepairExpirations} className="w-full py-4 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 border border-red-600/20 rounded-2xl font-black text-xs uppercase tracking-widest">Fix Expiry Dates</button>
                   </div>
                </div>

                <div className="bg-white/3 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-blue-600/10 rounded-xl text-blue-500"><DownloadCloud className="w-6 h-6" /></div>
                       <div className="text-left">
                          <h3 className="text-xl font-black text-white">Live Updates & Installer Links</h3>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Configure links shown on the /updates downloads page</p>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Latest App Version</label>
                          <input 
                             type="text" 
                             value={downloadVersion} 
                             onChange={(e) => setDownloadVersion(e.target.value)} 
                             className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                             placeholder="e.g. 1.0.49"
                          />
                       </div>
                       
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Windows Installer URL (Google Drive / Dropbox)</label>
                          <input 
                             type="text" 
                             value={downloadWinUrl} 
                             onChange={(e) => setDownloadWinUrl(e.target.value)} 
                             className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                             placeholder="https://drive.google.com/..."
                          />
                       </div>
                       
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">macOS DMG URL (Google Drive / Dropbox)</label>
                          <input 
                             type="text" 
                             value={downloadMacUrl} 
                             onChange={(e) => setDownloadMacUrl(e.target.value)} 
                             className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                             placeholder="https://drive.google.com/..."
                          />
                       </div>

                       <div className="space-y-2 md:col-span-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Publisher Announcement / Custom Update Notes</label>
                          <textarea 
                             rows={3}
                             value={downloadNotes} 
                             onChange={(e) => setDownloadNotes(e.target.value)} 
                             className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all resize-none"
                             placeholder="Optional custom announcements or release logs..."
                          />
                       </div>
                    </div>
                    
                    <button 
                       onClick={handleUpdateDownloads} 
                       disabled={isUpdatingDownloads}
                       className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                       {isUpdatingDownloads ? 'Saving...' : 'Save Update & Installer Settings'}
                    </button>
                 </div>
              </motion.div>
          ) : activeTab === 'requests' ? (
             <motion.div key="requests" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-white">Purchase Requests</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Verify payments & approve licenses</p>
                  </div>
                  <select value={requestStatusFilter} onChange={(e) => setRequestStatusFilter(e.target.value as any)} className="bg-white/5 border border-white/10 rounded-xl py-3 px-6 text-xs font-bold text-white outline-none">
                     <option value="pending" className="bg-[#0A192F]">Pending ({stats.requests})</option>
                     <option value="approved" className="bg-[#0A192F]">Approved</option>
                     <option value="declined" className="bg-[#0A192F]">Declined</option>
                     <option value="all" className="bg-[#0A192F]">All Requests ({stats.all_requests})</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {Array.isArray(requests) && requests.filter(r => requestStatusFilter === 'all' || r.status === requestStatusFilter).map((req) => (
                    <div key={req.id} className="bg-white/3 border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div className={`p-4 rounded-2xl ${req.platform === 'mac' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-blue-500/10 text-blue-400'}`}>
                          {req.platform === 'mac' ? <Apple className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-lg font-black text-white">{req.name}</h4>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${req.status === 'approved' ? 'bg-green-500/20 text-green-400' : req.status === 'declined' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                              {req.status}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-500">{req.email}</p>
                        </div>
                        <div className="h-10 w-px bg-white/10 mx-4" />
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Platform</p>
                          <p className={`text-sm font-black uppercase tracking-widest ${req.platform === 'mac' ? 'text-indigo-400' : 'text-blue-400'}`}>{req.platform || 'windows'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Payment Ref</p>
                          <p className="text-sm font-mono font-bold text-slate-300">{req.proof_id}</p>
                        </div>
                        {req.proof_image && (
                          <button onClick={() => setPreviewImage(req.proof_image)} className="p-3 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-all flex items-center gap-2 border border-blue-500/20">
                             <ImageIcon className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-widest">View Receipt</span>
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {req.status === 'pending' && (
                          <>
                            <button onClick={() => handleApproveRequest(req)} className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-black text-xs text-white">Approve</button>
                            <button onClick={() => setDeclineModal({ isOpen: true, requestId: req.id, reason: 'Invalid Reference Number' })} className="px-6 py-3 bg-red-600/10 text-red-500 rounded-xl font-black text-xs">Decline</button>
                          </>
                        )}
                        <button onClick={() => handleDeleteRequest(req.id)} className="p-3 bg-red-600/10 text-red-500 hover:bg-red-600/20 rounded-xl transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!requests || requests.filter(r => requestStatusFilter === 'all' || r.status === requestStatusFilter).length === 0) && (
                    <div className="py-20 text-center bg-white/2 border-2 border-dashed border-white/5 rounded-3xl">
                      <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No requests found in this category</p>
                    </div>
                  )}
                </div>
             </motion.div>
          ) : activeTab === 'generate' ? (
             <motion.div key="gen">
                <div className="text-center py-10">
                   <h2 className="text-3xl font-black text-white mb-8">Quick Generator</h2>
                   <div className="max-w-md mx-auto space-y-6 bg-white/3 p-10 rounded-[3rem] border border-white/10">
                      <div className="flex gap-3 p-1 bg-white/5 rounded-2xl border border-white/10">
                        <button onClick={() => setSelectedPlatform('windows')} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black transition-all ${selectedPlatform === 'windows' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}><Monitor className="w-4 h-4" /> Windows</button>
                        <button onClick={() => setSelectedPlatform('mac')} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black transition-all ${selectedPlatform === 'mac' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}><Apple className="w-4 h-4" /> macOS</button>
                      </div>
                      <input type="number" value={generateCount} onChange={(e) => setGenerateCount(parseInt(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold" />
                      <button onClick={handleCreateLicense} className="w-full py-5 bg-blue-600 rounded-2xl font-black text-white shadow-xl">Generate Keys</button>
                   </div>
                </div>
             </motion.div>
          ) : activeTab === 'advertisement' ? (
              <motion.div key="advertisement" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full flex items-center justify-center pt-2 pb-10 px-4">
                <div className="relative w-full max-w-300 p-0.5 rounded-[3rem] bg-linear-to-br from-blue-500/80 via-indigo-500/80 to-purple-600/80 shadow-[0_0_100px_-20px_rgba(79,70,229,0.3)] overflow-hidden flex flex-col">
                  <div className="absolute inset-0 bg-linear-to-br from-blue-500/30 via-indigo-500/30 to-purple-600/30 blur-3xl opacity-60 pointer-events-none" />
                  <div className="relative bg-[#040814] rounded-[3rem] px-8 py-10 lg:py-12 w-full h-full flex flex-col justify-center text-center overflow-hidden">
                      <div className="absolute top-[-20%] right-[-10%] w-150 h-150 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
                      <div className="absolute bottom-[-20%] left-[-10%] w-150 h-150 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
                      
                      <div className="relative z-10 flex flex-col items-center justify-center">
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 mb-5 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                              <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                              </span>
                              <span className="text-[11px] font-black text-green-400 uppercase tracking-[0.2em]">Live Deployment</span>
                          </div>

                          <h2 className="text-5xl lg:text-[4rem] font-black text-transparent bg-clip-text bg-linear-to-r from-blue-300 via-indigo-300 to-purple-300 mb-3 drop-shadow-lg tracking-tight leading-tight">FormEase Pro is Changing the Game!</h2>
                          <p className="text-lg lg:text-xl text-slate-400 font-bold mb-8 max-w-4xl mx-auto leading-relaxed">Join the rapidly growing community of educators who have already streamlined their workflow. Secure your spot before the current batch sells out!</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-8 mb-8 w-full max-w-5xl mx-auto">
                              <div className="bg-linear-to-b from-white/5 to-transparent backdrop-blur-xl border border-white/5 rounded-4xl p-6 shadow-2xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                                  <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                  <div className="w-14 h-14 lg:w-16 lg:h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-shadow duration-300">
                                      <Monitor className="w-7 h-7 lg:w-8 lg:h-8 text-blue-400" />
                                  </div>
                                  <h3 className="text-5xl lg:text-6xl font-black text-white mb-1 drop-shadow-md">{stats.windows}</h3>
                                  <p className="text-[10px] lg:text-[11px] font-black text-blue-400 uppercase tracking-[0.15em]">Windows Devices</p>
                              </div>
                              
                              <div className="bg-linear-to-b from-white/5 to-transparent backdrop-blur-xl border border-white/5 rounded-4xl p-6 shadow-2xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                                  <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                  <div className="w-14 h-14 lg:w-16 lg:h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.15)] group-hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-shadow duration-300">
                                      <Apple className="w-7 h-7 lg:w-8 lg:h-8 text-indigo-400" />
                                  </div>
                                  <h3 className="text-5xl lg:text-6xl font-black text-white mb-1 drop-shadow-md">{stats.mac}</h3>
                                  <p className="text-[10px] lg:text-[11px] font-black text-indigo-400 uppercase tracking-[0.15em]">macOS Devices</p>
                              </div>

                              <div className="bg-linear-to-b from-white/5 to-transparent backdrop-blur-xl border border-white/5 rounded-4xl p-6 shadow-2xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                                  <div className="absolute inset-0 bg-linear-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                  <div className="w-14 h-14 lg:w-16 lg:h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.15)] group-hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-shadow duration-300">
                                      <Key className="w-7 h-7 lg:w-8 lg:h-8 text-green-400" />
                                  </div>
                                  <h3 className="text-5xl lg:text-6xl font-black text-white mb-1 drop-shadow-md">{stats.total}</h3>
                                  <p className="text-[10px] lg:text-[11px] font-black text-green-400 uppercase tracking-[0.15em]">Licenses Generated</p>
                              </div>
                          </div>

                          <div className="w-full max-w-4xl mx-auto bg-linear-to-r from-white/2 to-white/5 border border-white/8 rounded-4xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
                              <div className="relative z-10 flex justify-between items-end mb-3">
                                  <div className="text-left">
                                      <p className="text-[10px] lg:text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Batch 1 Capacity</p>
                                      <div className="flex items-baseline gap-2">
                                          <p className="text-3xl lg:text-4xl font-black text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.5)]">{Math.max(0, 150 - stats.total)}</p>
                                          <p className="text-base lg:text-lg font-bold text-slate-300">Slots Left</p>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-2xl font-black text-white drop-shadow-md">{Math.min(100, Math.round((stats.total / 150) * 100))}% <span className="text-xs lg:text-sm text-slate-400 font-bold">Claimed</span></p>
                                  </div>
                              </div>
                              <div className="relative h-4 lg:h-5 bg-black/60 rounded-full overflow-hidden border border-white/10 shadow-inner">
                                  <div className="absolute inset-0 bg-white/2 mix-blend-overlay" />
                                  <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${Math.min(100, Math.round((stats.total / 150) * 100))}%` }}
                                      transition={{ duration: 1.5, ease: "easeOut" }}
                                      className="h-full bg-linear-to-r from-green-400 via-blue-500 to-indigo-500 rounded-full relative"
                                  >
                                      <div className="absolute inset-0 bg-linear-to-b from-white/20 to-transparent" />
                                      <div className="absolute right-0 top-0 bottom-0 w-10 bg-linear-to-l from-white/40 to-transparent blur-sm" />
                                  </motion.div>
                              </div>
                              <p className="text-[9px] lg:text-[10px] font-black text-slate-500 mt-3 uppercase tracking-[0.15em] flex items-center justify-center gap-2">
                                  <AlertCircle className="w-3 h-3 text-amber-500" />
                                  Warning: Prices may increase for the next deployment batch.
                              </p>
                          </div>
                      </div>
                  </div>
                </div>
              </motion.div>
           ) : (
            <motion.div key="manage" className="space-y-8">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 bg-white/5 p-1 rounded-2xl border border-white/10">
                     <button onClick={() => setManageSubTab('all')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${manageSubTab === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>All Keys ({stats.total})</button>
                     <button onClick={() => setManageSubTab('windows')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${manageSubTab === 'windows' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}><Monitor className="w-4 h-4" /> Windows ({stats.windows})</button>
                     <button onClick={() => setManageSubTab('mac')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${manageSubTab === 'mac' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}><Apple className="w-4 h-4" /> macOS ({stats.mac})</button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                     <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs font-bold w-64" />
                     </div>
                     <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="bg-[#0A192F] border border-white/10 rounded-xl py-2 px-4 text-xs font-bold text-white outline-none">
                        <option value="all">All Status</option>
                        <option value="pending">Pending Only</option>
                        <option value="activated">Activated Only</option>
                     </select>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredLicenses.map(license => (
                    <div key={license.id} className={`p-6 border rounded-[2.5rem] relative overflow-hidden transition-all ${license.status === 'activated' ? 'bg-green-500/3 border-green-500/20 shadow-xl shadow-green-500/5' : 'bg-blue-500/3 border-blue-500/30'}`}>
                       <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 ${license.status === 'activated' ? 'bg-green-500/10' : 'bg-blue-500/10'}`} />
                       
                       <div className="flex justify-between items-start mb-6">
                          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${license.status === 'activated' ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}>
                             {license.status}
                          </div>
                            <div className="flex items-center gap-2">
                              {license.status?.toLowerCase() === 'activated' && (
                                 <button 
                                   onClick={() => handleResetLicense(license.serial)} 
                                   title="Reset License"
                                   className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all border border-red-500/20 flex items-center gap-2"
                                 >
                                    <RotateCcw className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest md:hidden">Reset</span>
                                 </button>
                              )}
                              <button 
                                onClick={() => handleDeleteLicense(license.serial)} 
                                title="Delete License"
                                className="p-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-500 rounded-xl transition-all border border-red-600/20 flex items-center gap-2"
                              >
                                 <Trash2 className="w-4 h-4" />
                                 <span className="text-[10px] font-black uppercase tracking-widest md:hidden">Delete</span>
                              </button>
                              <button onClick={() => handleTogglePlatform(license.serial, license.platform || 'windows')} className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/5">
                                 {license.platform === 'mac' ? <Apple className="w-4 h-4 text-indigo-400" /> : <Monitor className="w-4 h-4 text-blue-400" />}
                              </button>
                           </div>
                       </div>

                       <div className="flex items-center justify-between mb-6">
                          <div className="space-y-1">
                             <h3 className="text-xl font-mono font-black text-white tracking-wider">{license.serial}</h3>
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Serial Number</p>
                          </div>
                          <button onClick={() => handleCopy(license.serial, license.id)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                             {copiedId === license.id ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-slate-400" />}
                          </button>
                       </div>
                       
                       <div className="space-y-4">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                                <User className="w-4 h-4 text-slate-500" />
                             </div>
                             <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Registered To</p>
                                <p className="text-sm font-bold text-slate-200 truncate">{license.registered_to || 'Unassigned'}</p>
                             </div>
                          </div>

                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                                <Smartphone className="w-4 h-4 text-slate-500" />
                             </div>
                             <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Hardware Binding</p>
                                <p className="text-sm font-mono font-bold text-blue-400/70 truncate">{license.machine_id || 'Waiting for Activation...'}</p>
                             </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                             <div>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Start Date</p>
                                <p className="text-xs font-bold text-slate-400">{parseDate(license.activated_at)?.toLocaleDateString() || 'Pending'}</p>
                             </div>
                             <div>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">End Date</p>
                                <p className="text-xs font-bold text-slate-400">
                                   {parseDate(license.expires_at)?.toLocaleDateString() || 
                                    (parseDate(license.activated_at) ? 
                                      new Date(parseDate(license.activated_at)!.getTime() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString() : 
                                      'Pending'
                                    )
                                   }
                                </p>
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <div className="fixed inset-0 z-200 flex items-center justify-center p-6 backdrop-blur-xl bg-black/80" onClick={() => setPreviewImage(null)}>
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
                <img src={previewImage} alt="Receipt Preview" className="w-full h-full object-contain rounded-[3rem] shadow-2xl border border-white/10" />
                <button onClick={() => setPreviewImage(null)} className="absolute -top-4 -right-4 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all shadow-xl">
                   <X className="w-6 h-6" />
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Decline Modal */}
      <AnimatePresence>
        {declineModal.isOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-[#0A192F] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
               <div className="mb-6 text-center">
                  <h3 className="text-xl font-black text-white">Decline Request</h3>
                  <p className="text-xs text-slate-500 font-bold mt-1">Reason for rejection:</p>
               </div>
              <select value={declineModal.reason} onChange={(e) => setDeclineModal({ ...declineModal, reason: e.target.value })} className="w-full bg-[#0A192F] border border-white/10 rounded-xl py-4 px-6 text-white font-bold mb-6 outline-none">
                {declineReasons.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div className="flex gap-3">
                <button onClick={() => setDeclineModal({ isOpen: false, requestId: null, reason: '' })} className="flex-1 py-4 bg-white/5 rounded-xl font-black text-xs">Cancel</button>
                <button onClick={handleDeclineRequest} className="flex-1 py-4 bg-red-600 rounded-xl font-black text-xs text-white">Confirm Decline</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Diagnostic Report Inspector Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div
            className="fixed inset-0 z-200 flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-black/80 overflow-y-auto"
            onClick={() => setSelectedReport(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative max-w-4xl w-full bg-[#0A192F] border border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Top Strip */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                    <Bug className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black text-amber-400">
                        #{selectedReport.ticket_id}
                      </span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-400 font-bold">
                        {selectedReport.created_at ? new Date(selectedReport.created_at).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white mt-0.5">
                      Client Diagnostic & Error Inspector
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={selectedReport.status}
                    onChange={(e) => handleUpdateReportStatus(selectedReport.ticket_id, e.target.value as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border outline-none cursor-pointer ${
                      selectedReport.status === 'open'
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : selectedReport.status === 'in_progress'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}
                  >
                    <option value="open" className="bg-[#0A192F] text-red-400">🔴 Open</option>
                    <option value="in_progress" className="bg-[#0A192F] text-amber-400">🟡 In Progress</option>
                    <option value="resolved" className="bg-[#0A192F] text-emerald-400">🟢 Resolved</option>
                  </select>

                  <button
                    onClick={() => setSelectedReport(null)}
                    className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body: Scrollable */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                
                {/* School & Submitter Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-white/2 border border-white/5 space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-blue-400" />
                      School Profile
                    </span>
                    <p className="font-bold text-white text-sm">
                      {selectedReport.school?.name || 'Unknown School'}
                    </p>
                    <p className="text-slate-400">
                      School ID: <strong className="text-white">{selectedReport.school?.id || 'N/A'}</strong>
                    </p>
                    <p className="text-slate-400">
                      Division: {selectedReport.school?.division || 'N/A'} • Region: {selectedReport.school?.region || 'N/A'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/2 border border-white/5 space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      Submitter & Device
                    </span>
                    <p className="font-bold text-white text-sm">
                      {selectedReport.submitted_by?.name || 'Anonymous'} ({selectedReport.submitted_by?.role || 'teacher'})
                    </p>
                    <p className="text-slate-400 truncate">
                      Email: <strong className="text-white">{selectedReport.submitted_by?.email || 'N/A'}</strong>
                    </p>
                    <p className="text-slate-400 text-[11px] font-mono">
                      Machine: {selectedReport.machine_id ? selectedReport.machine_id.substring(0, 16) + '...' : 'N/A'} • App v{selectedReport.app_version || '3.2.0'}
                    </p>
                  </div>
                </div>

                {/* Teacher's Note */}
                {selectedReport.user_note && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                    <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
                      <MessageSquare className="w-4 h-4" />
                      <span>Teacher's Note</span>
                    </div>
                    <p className="text-sm text-slate-200 italic leading-relaxed pt-1">
                      "{selectedReport.user_note}"
                    </p>
                  </div>
                )}

                {/* Markdown Diagnostic Report Output */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      Full Raw Diagnostic Log Payload
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedReport.report_markdown);
                        handleCopy(selectedReport.report_markdown, selectedReport.ticket_id);
                      }}
                      className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-all"
                    >
                      {copiedId === selectedReport.ticket_id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === selectedReport.ticket_id ? 'Copied!' : 'Copy Full Log'}</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto custom-scrollbar">
                    {selectedReport.report_markdown}
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="border-t border-white/10 pt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {selectedReport.status === 'open' && (
                    <button
                      onClick={() => handleUpdateReportStatus(selectedReport.ticket_id, 'in_progress')}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-amber-600/20 active:scale-95"
                    >
                      Mark In Progress
                    </button>
                  )}
                  {selectedReport.status !== 'resolved' && (
                    <button
                      onClick={() => handleUpdateReportStatus(selectedReport.ticket_id, 'resolved')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 active:scale-95"
                    >
                      Mark as Resolved
                    </button>
                  )}
                  {selectedReport.status === 'resolved' && (
                    <button
                      onClick={() => handleUpdateReportStatus(selectedReport.ticket_id, 'open')}
                      className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-black text-xs rounded-xl transition-all"
                    >
                      Re-open Ticket
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {selectedReport.submitted_by?.email && selectedReport.submitted_by.email !== 'N/A' && (
                    <a
                      href={`mailto:${selectedReport.submitted_by.email}?subject=${encodeURIComponent(`[FormEase Pro Support] Ticket #${selectedReport.ticket_id} Resolved`)}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Reply via Email</span>
                    </a>
                  )}
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-xl transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

