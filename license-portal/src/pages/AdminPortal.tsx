import React, { useState, useEffect, useMemo } from 'react';
import { 
  Key, Shield, Plus, List, Trash2, Copy, Check, Search, Filter, Cpu, User, Calendar, 
  Download, DownloadCloud, FileText, BarChart3, Activity, Clock, RotateCcw, Settings, Type,
  LogOut, Lock, Mail, AlertCircle, ShoppingCart, UserCheck, XCircle, Monitor, Apple, RefreshCcw, 
  Smartphone, Wrench, Loader2, ChevronRight, ExternalLink, Image as ImageIcon, X, Megaphone, 
  Bell, Radio, Send, Globe, Sparkles, CheckCircle2, AlertTriangle, Info, Bug, MessageSquare, 
  Building, RefreshCw, CheckCheck, FileSpreadsheet, Layers, Laptop, Eye, HelpCircle, HardDrive, 
  Hash, ChevronDown, Tag, Terminal, Database, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { licenseService } from '../lib/license-service';
import { auth, db } from '../lib/firebase';
import { signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

// Types
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

interface GeneratedBatch {
  serials: string[];
  platform: 'windows' | 'mac';
  duration: number;
  batchName: string;
  timestamp: Date;
}

export default function AdminPortal({ user }: { user: FirebaseUser }) {
  // Main Data States
  const [licenses, setLicenses] = useState<License[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [trials, setTrials] = useState<any[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastNotice[]>([]);
  const [diagnosticReports, setDiagnosticReports] = useState<DiagnosticReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());

  // Active Context & Navigation
  const [activeProduct, setActiveProduct] = useState<'formease-pro' | 'anecdotal-record' | 'id-generator'>('formease-pro');
  const [activeTab, setActiveTab] = useState<'generate' | 'manage' | 'requests' | 'trials' | 'system' | 'advertisement' | 'broadcasts' | 'diagnostics'>('generate');

  // Generator State
  const [generateCount, setGenerateCount] = useState<number>(1);
  const [batchName, setBatchName] = useState('');
  const [duration, setDuration] = useState<number>(12);
  const [selectedPlatform, setSelectedPlatform] = useState<'windows' | 'mac'>('windows');
  const [lastGeneratedBatch, setLastGeneratedBatch] = useState<GeneratedBatch | null>(null);

  // Manage Tab States
  const [manageSubTab, setManageSubTab] = useState<'all' | 'windows' | 'mac'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'activated' | 'pending' | 'expired'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Requests Tab States
  const [requestStatusFilter, setRequestStatusFilter] = useState<'pending' | 'approved' | 'declined' | 'all'>('pending');
  const [requestSearchTerm, setRequestSearchTerm] = useState('');

  // Diagnostic State
  const [selectedReport, setSelectedReport] = useState<DiagnosticReportItem | null>(null);
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [reportSearchTerm, setReportSearchTerm] = useState('');

  // Shared Interaction States
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

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

  // Decline Modal State
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
    'Other (Contact Support via Facebook)'
  ];

  // Downloads Config States
  const [downloadWinUrl, setDownloadWinUrl] = useState('');
  const [downloadMacUrl, setDownloadMacUrl] = useState('');
  const [downloadVersion, setDownloadVersion] = useState('1.0.49');
  const [downloadNotes, setDownloadNotes] = useState('');
  const [isUpdatingDownloads, setIsUpdatingDownloads] = useState(false);

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const handleLogout = () => signOut(auth);

  const parseDate = (date: any): Date | null => {
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
        if (date._seconds) return new Date(date._seconds * 1000);
      }
      const d = new Date(date);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProduct]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [licenseData, requestData, trialData, downloadData, broadcastData, reportData] = await Promise.all([
        licenseService.getAllLicenses(),
        licenseService.getAllRequests(),
        licenseService.getAllTrials(),
        licenseService.getDownloadsInfo(),
        licenseService.getAllBroadcasts(),
        licenseService.getAllDiagnosticReports()
      ]);

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
      setLastSynced(new Date());
    } catch (error) {
      console.error("Load failed:", error);
      showToast("Failed to load records from cloud database.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string, label: string = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(label, 'success');
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
      let createdSerials: string[] = [];
      if (generateCount === 1) {
        const serial = generateSerial();
        createdSerials = [serial];
        await licenseService.createLicense(serial, batchName, duration, null, selectedPlatform);
      } else {
        createdSerials = Array.from({ length: generateCount }, () => generateSerial());
        await licenseService.bulkCreate(createdSerials, batchName, duration, selectedPlatform);
      }

      setLastGeneratedBatch({
        serials: createdSerials,
        platform: selectedPlatform,
        duration,
        batchName: batchName || `Batch ${new Date().toLocaleDateString()}`,
        timestamp: new Date()
      });

      showToast(`Successfully generated ${createdSerials.length} ${selectedPlatform.toUpperCase()} key(s)!`, 'success');
      await loadData();
    } catch (error) {
      console.error(error);
      showToast("Failed to save generated keys to database.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const exportSerialsAsTxt = (serials: string[], batchTitle: string) => {
    const textContent = `FormEase Pro License Keys\nBatch: ${batchTitle}\nGenerated: ${new Date().toLocaleString()}\nPlatform: ${selectedPlatform.toUpperCase()}\n\n` + serials.join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `formease-keys-${batchTitle.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded keys as text file.", "info");
  };

  const exportLicensesAsCsv = (licenseList: License[]) => {
    const headers = ['Serial Key', 'Platform', 'Status', 'Registered To', 'Hardware Machine ID', 'Created At', 'Activated At', 'Expires At', 'Batch Tag'];
    const rows = licenseList.map(l => [
      l.serial,
      l.platform || 'windows',
      l.status,
      `"${(l.registered_to || '').replace(/"/g, '""')}"`,
      l.machine_id || '',
      l.created_at || '',
      l.activated_at || '',
      l.expires_at || '',
      `"${(l.batch_id || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `formease-licenses-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Exported license records to CSV.", "success");
  };

  const handleApproveRequest = async (request: any) => {
    if (!window.confirm(`Approve purchase request for Teacher ${request.name} (${request.email})?`)) return;
    setIsLoading(true);
    try {
      const serial = generateSerial();
      const platform = request.platform || 'windows';
      await licenseService.approveRequest(request.id, serial, platform, request.name);
      
      showToast(`Request Approved! Generated key: ${serial}`, 'success');
      await loadData();
    } catch (error) {
      console.error(error);
      showToast("Failed to approve request.", 'error');
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
      showToast("Order request marked as declined.", 'info');
      await loadData();
    } catch (error) {
      console.error(error);
      showToast("Failed to decline request.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this request? This will remove it from the customer order lookup.")) return;
    setIsLoading(true);
    try {
      await licenseService.deleteRequest(requestId);
      showToast("Request record removed.", 'info');
      await loadData();
    } catch (error) {
      console.error(error);
      showToast("Failed to delete request.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePlatform = async (serial: string, current: string) => {
    const next = current === 'mac' ? 'windows' : 'mac';
    if (!window.confirm(`Switch this license platform to ${next.toUpperCase()}?`)) return;
    try {
      await setDoc(doc(db, 'artifacts/g7-special/public/data/licenses', serial), { platform: next }, { merge: true });
      showToast(`Platform switched to ${next.toUpperCase()}`, 'success');
      await loadData();
    } catch {
      showToast("Failed to update platform.", 'error');
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm("WARNING: This will PERMANENTLY delete all unactivated (Pending) keys. Activated keys will be safely kept. Continue?")) return;
    setIsLoading(true);
    try {
      const count = await licenseService.cleanupPendingLicenses();
      showToast(`Cleaned up ${count} unclaimed pending keys.`, 'success');
      await loadData();
    } catch {
      showToast("Cleanup failed.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepairExpirations = async () => {
    if (!window.confirm("This will scan all activated licenses and recalculate expiration to exactly 1 year from their activation date. Continue?")) return;
    setIsLoading(true);
    try {
      const count = await licenseService.repairExpirations();
      showToast(`Successfully repaired ${count} licenses.`, 'success');
      await loadData();
    } catch {
      showToast("Repair failed.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetLicense = async (serial: string) => {
    if (!window.confirm(`Reset hardware binding for key: ${serial}? \n\nThe device currently locked to this key will be unlocked, allowing the teacher to reactivate on their new laptop.`)) return;
    setIsLoading(true);
    try {
      await licenseService.resetLicense(serial);
      showToast("Hardware lock reset. Key is now ready for new device.", 'success');
      await loadData();
    } catch {
      showToast("Failed to reset license.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLicense = async (serial: string) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY REVOKE/DELETE key: ${serial}? \n\nThe desktop application using this key will immediately lose access!`)) return;
    setIsLoading(true);
    try {
      await licenseService.revokeLicense(serial);
      showToast("License key revoked and deleted.", 'info');
      await loadData();
    } catch {
      showToast("Failed to revoke license.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeTrial = async (trialId: string) => {
    if (!window.confirm(`Delete trial record for machine #${trialId}?`)) return;
    setIsLoading(true);
    try {
      await licenseService.deleteTrial(trialId);
      showToast("Trial record cleared.", 'success');
      await loadData();
    } catch {
      showToast("Failed to clear trial.", 'error');
    } finally {
      setIsLoading(false);
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
      showToast("Download links and latest version updated successfully!", 'success');
    } catch {
      showToast("Failed to update downloads info.", 'error');
    } finally {
      setIsUpdatingDownloads(false);
    }
  };

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.content.trim()) {
      showToast("Title and content are required.", 'error');
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
        product: activeProduct
      });
      showToast("Broadcast published to all connected apps!", 'success');
      await loadData();
    } catch {
      showToast("Failed to publish broadcast notice.", 'error');
    } finally {
      setIsSubmittingBroadcast(false);
    }
  };

  const handleToggleBroadcast = async (b: BroadcastNotice) => {
    try {
      await licenseService.updateBroadcast(b.id, { is_active: !b.is_active });
      showToast(`Broadcast ${!b.is_active ? 'activated' : 'paused'}.`, 'info');
      await loadData();
    } catch {
      showToast("Failed to toggle broadcast status.", 'error');
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    if (!window.confirm("Permanently delete this broadcast notification?")) return;
    try {
      await licenseService.deleteBroadcast(id);
      showToast("Broadcast deleted.", 'info');
      await loadData();
    } catch {
      showToast("Failed to delete broadcast.", 'error');
    }
  };

  const handleUpdateReportStatus = async (ticketId: string, newStatus: 'open' | 'in_progress' | 'resolved') => {
    try {
      await licenseService.updateDiagnosticReportStatus(ticketId, newStatus);
      setDiagnosticReports(prev => prev.map(r => (r.ticket_id === ticketId || r.id === ticketId) ? { ...r, status: newStatus } : r));
      if (selectedReport && (selectedReport.ticket_id === ticketId || selectedReport.id === ticketId)) {
        setSelectedReport(prev => prev ? { ...prev, status: newStatus } : null);
      }
      showToast(`Ticket #${ticketId} updated to ${newStatus.toUpperCase()}`, 'success');
    } catch {
      showToast("Failed to update report status.", 'error');
    }
  };

  const handleDeleteReport = async (ticketId: string) => {
    if (!window.confirm(`Permanently delete diagnostic ticket #${ticketId}?`)) return;
    try {
      await licenseService.deleteDiagnosticReport(ticketId);
      setDiagnosticReports(prev => prev.filter(r => r.ticket_id !== ticketId && r.id !== ticketId));
      if (selectedReport && (selectedReport.ticket_id === ticketId || selectedReport.id === ticketId)) {
        setSelectedReport(null);
      }
      showToast("Diagnostic report removed.", 'info');
    } catch {
      showToast("Failed to delete report.", 'error');
    }
  };

  // Computations & Filters
  const stats = useMemo(() => {
    const safeLicenses = Array.isArray(licenses) ? licenses : [];
    const safeRequests = Array.isArray(requests) ? requests : [];
    const safeTrials = Array.isArray(trials) ? trials : [];
    const safeReports = Array.isArray(diagnosticReports) ? diagnosticReports : [];
    
    return {
      total: safeLicenses.length,
      activated: safeLicenses.filter((l: License) => l.status === 'activated').length,
      pending: safeLicenses.filter((l: License) => l.status === 'pending').length,
      expired: safeLicenses.filter((l: License) => l.status === 'expired').length,
      windows: safeLicenses.filter((l: License) => l.platform === 'windows').length,
      mac: safeLicenses.filter((l: License) => l.platform === 'mac').length,
      requests: safeRequests.filter(r => r.status === 'pending').length,
      all_requests: safeRequests.length,
      trials: safeTrials.length,
      open_reports: safeReports.filter(r => r.status === 'open').length,
      total_reports: safeReports.length,
      active_broadcasts: broadcasts.filter(b => b.is_active).length
    };
  }, [licenses, requests, trials, diagnosticReports, broadcasts]);

  const filteredLicenses = useMemo(() => {
    if (!Array.isArray(licenses)) return [];
    const search = (searchTerm || '').toLowerCase().trim();
    
    const sorted = [...licenses].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });

    return sorted.filter((l: License) => {
      const serial = (l.serial || '').toLowerCase();
      const user = (l.registered_to || '').toLowerCase();
      const batch = (l.batch_id || '').toLowerCase();
      const machine = (l.machine_id || '').toLowerCase();
      
      const matchesSearch = !search || 
        serial.includes(search) || 
        user.includes(search) ||
        batch.includes(search) ||
        machine.includes(search);
        
      const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
      const matchesPlatform = manageSubTab === 'all' || l.platform === manageSubTab;
      
      return matchesSearch && matchesStatus && matchesPlatform;
    });
  }, [licenses, searchTerm, statusFilter, manageSubTab]);

  const filteredRequests = useMemo(() => {
    if (!Array.isArray(requests)) return [];
    const search = (requestSearchTerm || '').toLowerCase().trim();

    return requests.filter(r => {
      const matchesStatus = requestStatusFilter === 'all' || r.status === requestStatusFilter;
      const matchesSearch = !search ||
        (r.name || '').toLowerCase().includes(search) ||
        (r.email || '').toLowerCase().includes(search) ||
        (r.proof_id || '').toLowerCase().includes(search) ||
        (r.channel || '').toLowerCase().includes(search);
      return matchesStatus && matchesSearch;
    });
  }, [requests, requestStatusFilter, requestSearchTerm]);

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

  // Sidebar Menu Items Definition
  const NAV_ITEMS = [
    {
      group: 'LICENSING SUITE',
      items: [
        { id: 'generate', label: 'License Studio', icon: Key, badge: null },
        { id: 'requests', label: 'Order Requests', icon: ShoppingCart, badge: stats.requests > 0 ? stats.requests : null, badgeColor: 'bg-rose-500 text-white' },
        { id: 'manage', label: 'License Registry', icon: Database, badge: `${stats.total}`, badgeColor: 'bg-blue-500/20 text-blue-300' },
        { id: 'trials', label: 'Trial Devices', icon: Laptop, badge: stats.trials > 0 ? stats.trials : null, badgeColor: 'bg-amber-500/20 text-amber-300' },
      ]
    },
    {
      group: 'OPERATIONS & COMMS',
      items: [
        { id: 'broadcasts', label: 'Global Broadcasts', icon: Megaphone, badge: stats.active_broadcasts > 0 ? stats.active_broadcasts : null, badgeColor: 'bg-cyan-500/20 text-cyan-300' },
        { id: 'diagnostics', label: 'Bug Reports & Logs', icon: Bug, badge: stats.open_reports > 0 ? stats.open_reports : null, badgeColor: 'bg-rose-500 text-white' },
        { id: 'advertisement', label: 'Campaign Hub', icon: Sparkles, badge: null },
      ]
    },
    {
      group: 'MAINTENANCE',
      items: [
        { id: 'system', label: 'System & Releases', icon: Wrench, badge: null },
      ]
    }
  ];

  return (
    <div className="min-h-screen w-full flex bg-[#030712] text-slate-100 font-sans antialiased selection:bg-blue-600/30 overflow-x-hidden">
      
      {/* Toast Feedback */}
      <AnimatePresence>
        {feedbackToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-300 px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl text-xs font-black tracking-wide ${
              feedbackToast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : feedbackToast.type === 'info'
                ? 'bg-cyan-950/90 border-cyan-500/40 text-cyan-200'
                : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
            }`}
          >
            {feedbackToast.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            <span>{feedbackToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-180 h-180 bg-blue-600/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-160 h-160 bg-indigo-600/10 rounded-full blur-[160px]" />
      </div>

      {/* PRO SIDEBAR NAVIGATION */}
      <aside className="w-72 shrink-0 bg-slate-950/80 border-r border-white/5 backdrop-blur-2xl hidden lg:flex flex-col justify-between z-40 h-screen sticky top-0">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-white/5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-linear-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20 text-white flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                  FormEase <span className="text-blue-400 font-extrabold">Console</span>
                </span>
                <span className="block text-[9px] uppercase tracking-[0.2em] font-black text-slate-500">Commercial Cloud Admin</span>
              </div>
            </div>

            {/* Product Database Selector */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <Database className="w-3 h-3 text-blue-400" /> Database Scope
              </label>
              <select
                value={activeProduct}
                onChange={(e) => {
                  const prod = e.target.value as any;
                  licenseService.setProduct(prod);
                  setActiveProduct(prod);
                  showToast(`Switched active database to ${prod}`, 'info');
                }}
                className="w-full bg-white/3 border border-white/10 rounded-xl py-2 px-3 text-xs font-bold text-white outline-none cursor-pointer hover:bg-white/5 transition-colors"
              >
                <option value="formease-pro" className="bg-slate-900 text-white">FormEase Pro (Academic MS)</option>
                <option value="anecdotal-record" className="bg-slate-900 text-white">ASRS Anecdotal Record</option>
                <option value="id-generator" className="bg-slate-900 text-white">ID Card Studio</option>
              </select>
            </div>
          </div>

          {/* Navigation Groups */}
          <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-240px)]">
            {NAV_ITEMS.map((grp, gIdx) => (
              <div key={gIdx} className="space-y-1.5">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 px-3 mb-2">{grp.group}</p>
                {grp.items.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as any)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all group ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== null && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${item.badgeColor || 'bg-white/10 text-white'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-white/5 bg-white/1">
          <div className="p-3 bg-white/2 border border-white/5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/20 flex items-center justify-center font-black text-xs shrink-0">
                {user.email ? user.email.slice(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-white truncate">{user.email}</p>
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Super Administrator</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out of Console"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        
        {/* Top Command Bar */}
        <header className="sticky top-0 z-30 h-18 border-b border-white/5 backdrop-blur-xl bg-slate-950/60 flex items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-4">
            {/* Mobile Tab Scroller */}
            <div className="lg:hidden flex items-center gap-2 overflow-x-auto py-2 max-w-70 sm:max-w-md">
              {['generate', 'requests', 'manage', 'trials', 'broadcasts', 'diagnostics', 'system'].map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black capitalize whitespace-nowrap ${
                    activeTab === t ? 'bg-blue-600 text-white' : 'text-slate-400 bg-white/5'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-400">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Console</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-white capitalize">{activeTab}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold text-slate-300 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              title="Sync latest Firestore data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
              <span className="hidden sm:inline">Sync Cloud</span>
            </button>

            <span className="text-[10px] font-mono font-bold text-slate-500 hidden sm:inline">
              Last synced: {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>

            <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

            <button
              onClick={() => setActiveTab('generate')}
              className="px-4 py-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-600/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Keys</span>
            </button>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className="p-6 sm:p-8 md:p-10 max-w-7xl w-full mx-auto flex-1">
          <AnimatePresence mode="wait">
            
            {/* ========================================================================= */}
            {/* 1. LICENSE STUDIO & GENERATOR (Redesigned from the screenshot) */}
            {/* ========================================================================= */}
            {activeTab === 'generate' && (
              <motion.div
                key="tab-generate"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {/* Page Heading */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">License Studio & Generator</h2>
                    <p className="text-xs font-medium text-slate-400 mt-1">
                      Configure cryptographic 16-character commercial license batches for DepEd teachers and schools.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> SHA-256 Cloud Verified
                    </span>
                  </div>
                </div>

                {/* 2-Column Professional Studio */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column: Generator Configuration Card */}
                  <div className="lg:col-span-7 bg-white/2 border border-white/8 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <Settings className="w-4 h-4 text-blue-400" /> Key Configuration Matrix
                      </span>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        v3.5.20 Deployment Ready
                      </span>
                    </div>

                    {/* Step 1: Platform Selection Cards */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        1. Target Operating System Platform
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setSelectedPlatform('windows')}
                          className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                            selectedPlatform === 'windows'
                              ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-500/10 ring-1 ring-blue-500'
                              : 'bg-white/2 border-white/5 text-slate-400 hover:text-white hover:bg-white/4'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <Monitor className="w-6 h-6 text-blue-400" />
                            {selectedPlatform === 'windows' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                          </div>
                          <div>
                            <p className="text-sm font-black text-white">Windows Edition</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Windows 10/11 & DepEd DCP</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedPlatform('mac')}
                          className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                            selectedPlatform === 'mac'
                              ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                              : 'bg-white/2 border-white/5 text-slate-400 hover:text-white hover:bg-white/4'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <Apple className="w-6 h-6 text-indigo-400" />
                            {selectedPlatform === 'mac' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                          </div>
                          <div>
                            <p className="text-sm font-black text-white">macOS Edition</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Apple Silicon M1-M4 & Intel</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Step 2: License Duration Selection */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        2. License Validity Period
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { val: 12, label: '1-Year (Standard)' },
                          { val: 6, label: '6 Months' },
                          { val: 24, label: '2 Years' },
                          { val: -1, label: 'Lifetime' }
                        ].map(d => (
                          <button
                            key={d.val}
                            type="button"
                            onClick={() => setDuration(d.val)}
                            className={`py-3 px-2 rounded-xl text-xs font-bold text-center border transition-all ${
                              duration === d.val
                                ? 'bg-white/10 border-blue-500 text-white ring-1 ring-blue-500'
                                : 'bg-white/2 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Step 3: Quantity Stepper & Presets */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          3. Number of Keys to Generate
                        </label>
                        <span className="text-[10px] font-mono text-blue-400 font-bold">
                          {generateCount} unit{generateCount > 1 ? 's' : ''} requested
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-2">
                        {[1, 5, 10, 25, 50, 100].map(cnt => (
                          <button
                            key={cnt}
                            type="button"
                            onClick={() => setGenerateCount(cnt)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                              generateCount === cnt
                                ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                                : 'bg-white/3 border-white/5 text-slate-400 hover:text-white'
                            }`}
                          >
                            +{cnt}
                          </button>
                        ))}
                      </div>

                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={generateCount}
                        onChange={(e) => setGenerateCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl py-3.5 px-4 text-white font-mono font-black text-base focus:border-blue-500 outline-none"
                        placeholder="Custom quantity"
                      />
                    </div>

                    {/* Step 4: Batch Tagging / School Reference */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        4. Batch Label / School Reference (Optional)
                      </label>
                      <input
                        type="text"
                        value={batchName}
                        onChange={(e) => setBatchName(e.target.value)}
                        placeholder="e.g. SDO-Tarlac-Special-Batch-2026 or Online-Direct-Buyer"
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs font-bold focus:border-blue-500 outline-none placeholder:text-slate-600"
                      />
                      <p className="text-[10px] text-slate-500 ml-1">
                        Allows you to filter and audit keys by school division or sales batch in the License Registry.
                      </p>
                    </div>

                    {/* Live Generation Summary */}
                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-xs space-y-2">
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Platform:</span>
                        <span className="font-black text-white capitalize">{selectedPlatform} Edition</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Duration:</span>
                        <span className="font-black text-white">{duration === -1 ? 'Lifetime' : `${duration} Months`}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Commercial Retail Value:</span>
                        <span className="font-black text-emerald-400 font-mono text-sm">
                          ₱{(generateCount * (selectedPlatform === 'mac' ? 499 : 399)).toLocaleString()}.00
                        </span>
                      </div>
                    </div>

                    {/* Generate Action Button */}
                    <button
                      type="button"
                      onClick={handleCreateLicense}
                      disabled={isLoading}
                      className="w-full py-4 px-6 bg-linear-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm tracking-wide transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating & Encrypting...</span>
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4" />
                          <span>Generate {generateCount} {selectedPlatform.toUpperCase()} License Key{generateCount > 1 ? 's' : ''}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Right Column: Live Batch Feed & Recent Activity */}
                  <div className="lg:col-span-5 space-y-6">
                    {lastGeneratedBatch ? (
                      /* Newly Generated Batch Output Box */
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-emerald-950/20 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl backdrop-blur-xl relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
                          <div>
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Batch Generated Successfully
                            </span>
                            <h3 className="text-lg font-black text-white mt-1">{lastGeneratedBatch.batchName}</h3>
                            <p className="text-[10px] text-slate-400">
                              {lastGeneratedBatch.serials.length} key(s) · {lastGeneratedBatch.platform.toUpperCase()} · {lastGeneratedBatch.duration === -1 ? 'Lifetime' : `${lastGeneratedBatch.duration} Mos`}
                            </p>
                          </div>
                        </div>

                        {/* Batch Action Toolbar */}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleCopy(lastGeneratedBatch.serials.join('\n'), 'batch-copy', 'All batch keys copied!')}
                            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-all"
                          >
                            <Copy className="w-3.5 h-3.5 text-blue-400" />
                            <span>Copy All</span>
                          </button>
                          <button
                            onClick={() => exportSerialsAsTxt(lastGeneratedBatch.serials, lastGeneratedBatch.batchName)}
                            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-all"
                          >
                            <Download className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Download .TXT</span>
                          </button>
                          <button
                            onClick={() => setActiveTab('manage')}
                            className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-xs font-bold text-blue-300 flex items-center gap-1.5 transition-all ml-auto"
                          >
                            <span>View in Registry</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Keys Stream List */}
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                          {lastGeneratedBatch.serials.map((serial, idx) => (
                            <div
                              key={serial}
                              className="p-3 bg-slate-950/80 border border-white/5 rounded-xl flex items-center justify-between text-xs font-mono font-bold text-slate-200"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-slate-600 text-[10px] w-5">#{idx + 1}</span>
                                <span className="text-blue-400 select-all">{serial}</span>
                              </div>
                              <button
                                onClick={() => handleCopy(serial, serial, 'Key copied!')}
                                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-slate-500"
                                title="Copy Key"
                              >
                                {copiedId === serial ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      /* Live Distribution & Registry Quick Stats */
                      <div className="bg-white/2 border border-white/8 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl backdrop-blur-xl">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-blue-400" /> Key Distribution Metrics
                          </h3>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Live Scope</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-white/2 border border-white/5 rounded-2xl">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Windows Active</span>
                            <p className="text-2xl font-black text-white mt-1">{stats.windows}</p>
                            <span className="text-[10px] text-blue-400 font-bold">Standard DCP Deployments</span>
                          </div>
                          <div className="p-4 bg-white/2 border border-white/5 rounded-2xl">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">macOS Active</span>
                            <p className="text-2xl font-black text-white mt-1">{stats.mac}</p>
                            <span className="text-[10px] text-indigo-400 font-bold">Universal Binaries</span>
                          </div>
                          <div className="p-4 bg-white/2 border border-white/5 rounded-2xl">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Activated Units</span>
                            <p className="text-2xl font-black text-emerald-400 mt-1">{stats.activated}</p>
                            <span className="text-[10px] text-slate-400 font-bold">Bound to Hardware ID</span>
                          </div>
                          <div className="p-4 bg-white/2 border border-white/5 rounded-2xl">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pending Claim</span>
                            <p className="text-2xl font-black text-amber-400 mt-1">{stats.pending}</p>
                            <span className="text-[10px] text-slate-400 font-bold">Available for Activation</span>
                          </div>
                        </div>

                        <div className="p-4 bg-white/2 border border-white/5 rounded-2xl space-y-2">
                          <p className="text-xs font-bold text-slate-300">💡 Teacher Activation Flow</p>
                          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                            When teachers contact you on Facebook, generate a key here with their school name as the batch tag, copy the key, and paste it to them. They can paste it directly into FormEase Pro to unlock the 1-Year Commercial license.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========================================================================= */}
            {/* 2. ORDER VERIFICATIONS & REQUESTS */}
            {/* ========================================================================= */}
            {activeTab === 'requests' && (
              <motion.div
                key="tab-requests"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Order Verification Queue</h2>
                    <p className="text-xs font-medium text-slate-400 mt-1">
                      Review direct GCash, Maya, and Landbank payment receipts submitted through the customer storefront.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search ref #, email, name..."
                        value={requestSearchTerm}
                        onChange={(e) => setRequestSearchTerm(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-white w-60 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                      {[
                        { id: 'pending', label: `Pending (${stats.requests})` },
                        { id: 'approved', label: 'Approved' },
                        { id: 'declined', label: 'Declined' },
                        { id: 'all', label: 'All' }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setRequestStatusFilter(tab.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            requestStatusFilter === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Requests List */}
                <div className="space-y-3">
                  {filteredRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white/2 border border-white/8 rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-white/15 transition-all shadow-xl"
                    >
                      <div className="flex flex-wrap items-center gap-4 sm:gap-6 min-w-0">
                        <div className={`p-3.5 rounded-2xl shrink-0 ${req.platform === 'mac' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-blue-500/10 text-blue-400'}`}>
                          {req.platform === 'mac' ? <Apple className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
                        </div>

                        <div className="min-w-44">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-base font-black text-white truncate">{req.name}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              req.status === 'declined' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-medium">{req.email}</p>
                        </div>

                        <div className="h-8 w-px bg-white/5 hidden sm:block" />

                        <div>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Reference No.</span>
                          <span className="text-xs font-mono font-bold text-blue-400 select-all">{req.proof_id}</span>
                        </div>

                        <div>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Payment Channel</span>
                          <span className="text-xs font-bold text-slate-300">{req.channel || 'QR Code'}</span>
                        </div>

                        {req.proof_image && (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(req.proof_image)}
                            className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Inspect Receipt</span>
                          </button>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveRequest(req)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Issue Key
                            </button>
                            <button
                              onClick={() => setDeclineModal({ isOpen: true, requestId: req.id, reason: 'Invalid Reference Number' })}
                              className="px-4 py-2 bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-300 rounded-xl font-bold text-xs transition-all cursor-pointer"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteRequest(req.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredRequests.length === 0 && (
                    <div className="py-20 text-center bg-white/2 border border-dashed border-white/10 rounded-3xl space-y-2">
                      <p className="text-slate-400 font-bold text-sm">No orders matching your criteria</p>
                      <p className="text-xs text-slate-600 font-medium">All pending verification requests will appear here in real-time.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ========================================================================= */}
            {/* 3. LICENSE REGISTRY */}
            {/* ========================================================================= */}
            {activeTab === 'manage' && (
              <motion.div
                key="tab-manage"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Header Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">License Key Registry</h2>
                    <p className="text-xs font-medium text-slate-400 mt-1">
                      Manage all generated commercial serials, hardware device bindings, and subscriptions.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => exportLicensesAsCsv(filteredLicenses)}
                      className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-all"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Export CSV ({filteredLicenses.length})</span>
                    </button>
                    <button
                      onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                      className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-all"
                    >
                      {viewMode === 'grid' ? <List className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
                      <span>{viewMode === 'grid' ? 'Table View' : 'Card View'}</span>
                    </button>
                  </div>
                </div>

                {/* Filter Strip */}
                <div className="p-4 bg-white/2 border border-white/8 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => setManageSubTab('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        manageSubTab === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All ({stats.total})
                    </button>
                    <button
                      onClick={() => setManageSubTab('windows')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        manageSubTab === 'windows' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" /> Windows ({stats.windows})
                    </button>
                    <button
                      onClick={() => setManageSubTab('mac')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        manageSubTab === 'mac' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Apple className="w-3.5 h-3.5" /> macOS ({stats.mac})
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Filter by key, teacher, machine..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl py-1.5 pl-9 pr-4 text-xs font-bold text-white w-64 outline-none focus:border-blue-500"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="bg-slate-900 border border-white/10 rounded-xl py-1.5 px-3 text-xs font-bold text-white outline-none cursor-pointer"
                    >
                      <option value="all">All Status</option>
                      <option value="activated">Activated Only</option>
                      <option value="pending">Pending Only</option>
                      <option value="expired">Expired Only</option>
                    </select>
                  </div>
                </div>

                {/* Registry View: Cards or Table */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLicenses.map((lic) => {
                      const isActivated = lic.status === 'activated';
                      return (
                        <div
                          key={lic.id}
                          className={`p-6 rounded-3xl border relative overflow-hidden transition-all shadow-xl flex flex-col justify-between space-y-5 ${
                            isActivated
                              ? 'bg-emerald-950/15 border-emerald-500/20'
                              : 'bg-white/2 border-white/8 hover:border-white/15'
                          }`}
                        >
                          <div>
                            {/* Card Top Row */}
                            <div className="flex items-center justify-between mb-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                isActivated
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              }`}>
                                {lic.status}
                              </span>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleTogglePlatform(lic.serial, lic.platform || 'windows')}
                                  title="Toggle Windows / macOS"
                                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                >
                                  {lic.platform === 'mac' ? <Apple className="w-3.5 h-3.5 text-indigo-400" /> : <Monitor className="w-3.5 h-3.5 text-blue-400" />}
                                </button>
                                {isActivated && (
                                  <button
                                    onClick={() => handleResetLicense(lic.serial)}
                                    title="Reset Hardware Lock (for teacher laptop change)"
                                    className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg text-amber-400 transition-colors"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteLicense(lic.serial)}
                                  title="Revoke / Delete License"
                                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-rose-400 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Serial Key Strip */}
                            <div className="p-3 bg-slate-950/80 border border-white/5 rounded-2xl flex items-center justify-between mb-4">
                              <span className="font-mono font-black text-sm text-blue-400 tracking-wider select-all">
                                {lic.serial}
                              </span>
                              <button
                                onClick={() => handleCopy(lic.serial, lic.id, 'Key copied to clipboard!')}
                                className="p-1.5 text-slate-500 hover:text-white transition-colors"
                                title="Copy Serial"
                              >
                                {copiedId === lic.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>

                            {/* Details List */}
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center gap-2 text-slate-400">
                                <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="text-slate-500 text-[10px] uppercase font-bold">Teacher:</span>
                                <span className="font-bold text-white truncate">{lic.registered_to || 'Unregistered'}</span>
                              </div>

                              <div className="flex items-center gap-2 text-slate-400">
                                <Smartphone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span className="text-slate-500 text-[10px] uppercase font-bold">Device:</span>
                                <span className="font-mono text-[10px] text-slate-300 truncate">
                                  {lic.machine_id ? lic.machine_id.slice(0, 16) + '...' : 'Awaiting hardware...'}
                                </span>
                              </div>

                              {lic.batch_id && (
                                <div className="flex items-center gap-2 text-slate-400">
                                  <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span className="text-slate-500 text-[10px] uppercase font-bold">Batch:</span>
                                  <span className="font-bold text-slate-300 truncate">{lic.batch_id}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Expiration Footprint */}
                          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-slate-500">
                            <span>Expiry Date:</span>
                            <span className="text-slate-400 font-mono">
                              {lic.expires_at ? (parseDate(lic.expires_at)?.toLocaleDateString() || 'N/A') : (isActivated ? '1 Year Active' : 'Pending Activation')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Modern Table Layout */
                  <div className="bg-white/2 border border-white/8 rounded-2xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/2 text-[10px] uppercase tracking-wider font-black text-slate-400">
                          <th className="py-3.5 px-4">Serial Key</th>
                          <th className="py-3.5 px-4">Platform</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4">Registered Teacher</th>
                          <th className="py-3.5 px-4">Hardware Binding</th>
                          <th className="py-3.5 px-4">Expires</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-medium">
                        {filteredLicenses.map((lic) => (
                          <tr key={lic.id} className="hover:bg-white/3 transition-colors">
                            <td className="py-3 px-4 font-mono font-black text-blue-400 select-all">{lic.serial}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-white/5 text-slate-300">
                                {lic.platform || 'windows'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                lic.status === 'activated' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {lic.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-white">{lic.registered_to || '—'}</td>
                            <td className="py-3 px-4 font-mono text-[10px] text-slate-400">{lic.machine_id ? lic.machine_id.slice(0, 12) + '...' : 'Awaiting'}</td>
                            <td className="py-3 px-4 font-mono text-slate-400">{lic.expires_at ? parseDate(lic.expires_at)?.toLocaleDateString() : '—'}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleCopy(lic.serial, lic.id, 'Key copied!')}
                                  className="p-1.5 hover:text-white text-slate-400"
                                  title="Copy"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                {lic.status === 'activated' && (
                                  <button
                                    onClick={() => handleResetLicense(lic.serial)}
                                    className="p-1.5 hover:text-amber-400 text-slate-400"
                                    title="Reset Hardware"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteLicense(lic.serial)}
                                  className="p-1.5 hover:text-rose-400 text-slate-400"
                                  title="Revoke"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {filteredLicenses.length === 0 && (
                  <div className="py-20 text-center bg-white/2 border border-dashed border-white/10 rounded-3xl space-y-2">
                    <p className="text-slate-400 font-bold text-sm">No licenses found matching your filters</p>
                    <p className="text-xs text-slate-600 font-medium">Try clearing your search term or switching the status filter.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ========================================================================= */}
            {/* 4. TRIAL DEVICES */}
            {/* ========================================================================= */}
            {activeTab === 'trials' && (
              <motion.div
                key="tab-trials"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight">Active & Past Device Trials</h2>
                  <p className="text-xs font-medium text-slate-400 mt-1">
                    Unique hardware instances that initiated the 1-hour complimentary evaluation trial.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trials.map((t) => {
                    const startedAt = parseDate(t.started_at);
                    const isExpired = startedAt ? (new Date().getTime() - startedAt.getTime() > 1 * 60 * 60 * 1000) : true;

                    return (
                      <div
                        key={t.id}
                        className="bg-white/2 border border-white/8 rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-xl"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
                              {t.platform === 'mac' ? <Apple className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                            </div>
                            <div>
                              <h4 className="font-black text-white text-sm">{t.platform === 'mac' ? 'macOS Trial' : 'Windows Trial'}</h4>
                              <p className="text-[10px] font-mono text-slate-500 select-all truncate max-w-44">{t.machine_id}</p>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                            isExpired ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {isExpired ? 'Expired' : 'Active 1-Hr'}
                          </span>
                        </div>

                        <div className="pt-3 border-t border-white/5 space-y-1 text-[10px] font-bold text-slate-400">
                          <div className="flex justify-between">
                            <span>Claimed Date:</span>
                            <span className="text-white font-mono">{t.started_at ? parseDate(t.started_at)?.toLocaleString() : 'N/A'}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRevokeTrial(t.id)}
                          className="w-full py-2.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Trial Record
                        </button>
                      </div>
                    );
                  })}

                  {trials.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white/2 border border-dashed border-white/10 rounded-3xl">
                      <p className="text-slate-400 font-bold text-sm">No trial machines logged</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ========================================================================= */}
            {/* 5. GLOBAL BROADCASTS */}
            {/* ========================================================================= */}
            {activeTab === 'broadcasts' && (
              <motion.div
                key="tab-broadcasts"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight">Global In-App Broadcasts</h2>
                  <p className="text-xs font-medium text-slate-400 mt-1">
                    Publish real-time announcements, maintenance notices, and form updates directly to teacher desktop clients.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Broadcast Composer */}
                  <div className="lg:col-span-6 bg-white/2 border border-white/8 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl backdrop-blur-xl">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-white/5 pb-3">
                      <Send className="w-4 h-4 text-cyan-400" /> Compose Broadcast Memo
                    </span>

                    <form onSubmit={handleCreateBroadcast} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Title</label>
                        <input
                          type="text"
                          required
                          value={broadcastForm.title}
                          onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                          placeholder="e.g. Critical DepEd SF9 Template Update Ready"
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl py-3 px-4 text-white text-xs font-bold outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Message Content (Markdown Supported)</label>
                        <textarea
                          required
                          rows={4}
                          value={broadcastForm.content}
                          onChange={(e) => setBroadcastForm({ ...broadcastForm, content: e.target.value })}
                          placeholder="Please ensure your school year calendar is set to 2025-2026 before generating final quarterly report cards..."
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white text-xs font-medium outline-none focus:border-cyan-500 leading-relaxed"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Severity Level</label>
                          <select
                            value={broadcastForm.severity}
                            onChange={(e) => setBroadcastForm({ ...broadcastForm, severity: e.target.value as any })}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-3 text-xs font-bold text-white outline-none cursor-pointer"
                          >
                            <option value="info">🔵 Information (Normal)</option>
                            <option value="warning">🟡 Warning (Attention)</option>
                            <option value="urgent">🔴 Urgent (Critical Alert)</option>
                            <option value="success">🟢 Success (Good News)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Display Style</label>
                          <select
                            value={broadcastForm.display_type}
                            onChange={(e) => setBroadcastForm({ ...broadcastForm, display_type: e.target.value as any })}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-3 text-xs font-bold text-white outline-none cursor-pointer"
                          >
                            <option value="banner">Floating Top Banner</option>
                            <option value="modal">Centered Modal Dialog</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingBroadcast}
                        className="w-full py-3.5 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingBroadcast ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span>Publish Broadcast Live</span>
                      </button>
                    </form>
                  </div>

                  {/* Active Broadcasts List */}
                  <div className="lg:col-span-6 space-y-4">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <Radio className="w-4 h-4 text-cyan-400 animate-pulse" /> Active Broadcast Records ({broadcasts.length})
                    </span>

                    <div className="space-y-3">
                      {broadcasts.map((b) => (
                        <div
                          key={b.id}
                          className="bg-white/2 border border-white/8 rounded-2xl p-5 space-y-3 shadow-xl"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                                  b.severity === 'urgent' ? 'bg-rose-500/20 text-rose-400' :
                                  b.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-cyan-500/20 text-cyan-400'
                                }`}>
                                  {b.severity}
                                </span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase">{b.display_type}</span>
                              </div>
                              <h4 className="text-sm font-black text-white">{b.title}</h4>
                            </div>

                            <button
                              onClick={() => handleToggleBroadcast(b)}
                              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${
                                b.is_active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-slate-400'
                              }`}
                            >
                              {b.is_active ? '● Live' : 'Paused'}
                            </button>
                          </div>

                          <p className="text-xs text-slate-300 font-medium leading-relaxed">{b.content}</p>

                          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-slate-500">
                            <span>Created: {new Date(b.created_at).toLocaleDateString()}</span>
                            <button
                              onClick={() => handleDeleteBroadcast(b.id)}
                              className="text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          </div>
                        </div>
                      ))}

                      {broadcasts.length === 0 && (
                        <div className="py-16 text-center bg-white/2 border border-dashed border-white/10 rounded-2xl">
                          <p className="text-slate-400 font-bold text-xs">No active broadcasts published</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========================================================================= */}
            {/* 6. BUG REPORTS & DIAGNOSTICS */}
            {/* ========================================================================= */}
            {activeTab === 'diagnostics' && (
              <motion.div
                key="tab-diagnostics"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Bug Reports & Diagnostics</h2>
                    <p className="text-xs font-medium text-slate-400 mt-1">
                      Automated client diagnostic tickets and grade reconciliation discrepancies submitted by teachers.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search ticket #, school, error..."
                        value={reportSearchTerm}
                        onChange={(e) => setReportSearchTerm(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-white w-60 outline-none focus:border-amber-500"
                      />
                    </div>

                    <select
                      value={reportStatusFilter}
                      onChange={(e) => setReportStatusFilter(e.target.value as any)}
                      className="bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs font-bold text-white outline-none cursor-pointer"
                    >
                      <option value="all">All Tickets</option>
                      <option value="open">🔴 Open Issues</option>
                      <option value="in_progress">🟡 In Progress</option>
                      <option value="resolved">🟢 Resolved</option>
                    </select>
                  </div>
                </div>

                {/* Tickets Grid */}
                <div className="space-y-3">
                  {filteredDiagnosticReports.map((r) => (
                    <div
                      key={r.ticket_id || r.id}
                      className="bg-white/2 border border-white/8 rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-white/15 transition-all shadow-xl"
                    >
                      <div className="flex flex-wrap items-center gap-4 sm:gap-6 min-w-0">
                        <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 shrink-0">
                          <Bug className="w-6 h-6" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-black text-xs text-amber-400">#{r.ticket_id}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              r.status === 'open' ? 'bg-rose-500/20 text-rose-400' :
                              r.status === 'in_progress' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {r.status}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold">
                              {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recent'}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-white">{r.school?.name || 'School Profile Not Attached'}</h4>
                          <p className="text-[11px] text-slate-400 font-medium">Submitted by: {r.submitted_by?.name || 'Teacher'} ({r.submitted_by?.email || 'N/A'})</p>
                        </div>

                        <div className="h-8 w-px bg-white/5 hidden sm:block" />

                        <div>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">App Version</span>
                          <span className="text-xs font-mono font-bold text-slate-300">v{r.app_version || '3.5.20'}</span>
                        </div>

                        <div>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Sync Health</span>
                          <span className="text-xs font-black text-emerald-400">{r.sync_rate !== undefined ? `${Math.round(r.sync_rate)}%` : '100%'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setSelectedReport(r)}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                          <span>Inspect Report</span>
                        </button>
                        <button
                          onClick={() => handleDeleteReport(r.ticket_id || r.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                          title="Delete Ticket"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredDiagnosticReports.length === 0 && (
                    <div className="py-20 text-center bg-white/2 border border-dashed border-white/10 rounded-3xl space-y-2">
                      <p className="text-slate-400 font-bold text-sm">No diagnostic reports found</p>
                      <p className="text-xs text-slate-600 font-medium">Any error reports or audit tickets submitted from desktop clients appear here.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ========================================================================= */}
            {/* 7. CAMPAIGN & PROMOTIONS HUB */}
            {/* ========================================================================= */}
            {activeTab === 'advertisement' && (
              <motion.div
                key="tab-advertisement"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight">Campaign & Banner Hub</h2>
                  <p className="text-xs font-medium text-slate-400 mt-1">
                    Control promotion banners, special pricing notices, and commercial launch campaigns.
                  </p>
                </div>

                <div className="max-w-2xl bg-white/2 border border-white/8 rounded-3xl p-8 space-y-6 shadow-2xl backdrop-blur-xl">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs font-bold">
                    <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Commercial Licensing System is currently operating at 100% capacity with direct QR payments enabled.</span>
                  </div>

                  <div className="space-y-3 text-xs text-slate-300 font-medium">
                    <p>Current Storefront Pricing Tiers:</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl">
                        <p className="text-slate-500 uppercase font-black text-[10px]">Windows Edition</p>
                        <p className="text-2xl font-black text-white mt-1">₱399.00</p>
                        <span className="text-[10px] text-blue-400">1-Year License</span>
                      </div>
                      <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl">
                        <p className="text-slate-500 uppercase font-black text-[10px]">macOS Edition</p>
                        <p className="text-2xl font-black text-white mt-1">₱499.00</p>
                        <span className="text-[10px] text-indigo-400">1-Year License</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========================================================================= */}
            {/* 8. SYSTEM MAINTENANCE & RELEASE DOWNLOADS */}
            {/* ========================================================================= */}
            {activeTab === 'system' && (
              <motion.div
                key="tab-system"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight">System Engine & Release Hub</h2>
                  <p className="text-xs font-medium text-slate-400 mt-1">
                    Manage client download mirrors, installer package versions, and perform database integrity repairs.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Downloads & Updates Config */}
                  <div className="lg:col-span-7 bg-white/2 border border-white/8 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl backdrop-blur-xl">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-white/5 pb-3">
                      <DownloadCloud className="w-4 h-4 text-blue-400" /> Client Release Binary Links
                    </span>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Latest Production Version</label>
                        <input
                          type="text"
                          value={downloadVersion}
                          onChange={(e) => setDownloadVersion(e.target.value)}
                          placeholder="e.g. 3.5.20"
                          className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-3.5 text-white text-xs font-mono font-bold outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Windows Installer URL (Google Drive / GitHub)</label>
                        <input
                          type="text"
                          value={downloadWinUrl}
                          onChange={(e) => setDownloadWinUrl(e.target.value)}
                          placeholder="https://github.com/.../FormEase.Pro.Setup.exe"
                          className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-3.5 text-white text-xs font-mono outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">macOS DMG URL (Google Drive / GitHub)</label>
                        <input
                          type="text"
                          value={downloadMacUrl}
                          onChange={(e) => setDownloadMacUrl(e.target.value)}
                          placeholder="https://github.com/.../FormEase.Pro.dmg"
                          className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-3.5 text-white text-xs font-mono outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Changelog & Release Notes</label>
                        <textarea
                          rows={3}
                          value={downloadNotes}
                          onChange={(e) => setDownloadNotes(e.target.value)}
                          placeholder="Summary of bug fixes, DepEd SF form improvements..."
                          className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs font-medium outline-none focus:border-blue-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleUpdateDownloads}
                        disabled={isUpdatingDownloads}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isUpdatingDownloads ? <Loader2 className="w-4 h-4 animate-spin" /> : <SaveIcon className="w-4 h-4" />}
                        <span>Save Release Config</span>
                      </button>
                    </div>
                  </div>

                  {/* Database Integrity & Maintenance */}
                  <div className="lg:col-span-5 bg-white/2 border border-white/8 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-white/5 pb-3">
                      <Wrench className="w-4 h-4 text-amber-400" /> Database Maintenance Tools
                    </span>

                    <div className="p-4 bg-white/2 border border-white/5 rounded-2xl space-y-3">
                      <div>
                        <h4 className="text-sm font-black text-white">Repair Expiration Dates</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Recalculates active keys to expire exactly 365 days after their first activation date.</p>
                      </div>
                      <button
                        onClick={handleRepairExpirations}
                        className="w-full py-2.5 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 rounded-xl font-bold text-xs transition-all cursor-pointer"
                      >
                        Run Expiry Repair
                      </button>
                    </div>

                    <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl space-y-3">
                      <div>
                        <h4 className="text-sm font-black text-rose-300">Clean Unclaimed Pending Keys</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Permanently purges test or obsolete keys that have never been claimed on any computer.</p>
                      </div>
                      <button
                        onClick={handleCleanup}
                        className="w-full py-2.5 bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-300 rounded-xl font-bold text-xs transition-all cursor-pointer"
                      >
                        Purge Pending Keys
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Receipt Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <div
            className="fixed inset-0 z-300 flex items-center justify-center p-6 backdrop-blur-xl bg-black/85"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-3xl max-h-[90vh] w-full bg-slate-900 border border-white/10 rounded-3xl p-4 shadow-2xl flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">Payment Receipt Inspector</h3>
              <div className="w-full flex-1 overflow-auto rounded-2xl flex items-center justify-center bg-black/40">
                <img src={previewImage} alt="Payment Receipt" className="max-w-full max-h-[75vh] object-contain rounded-xl" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Decline Reason Modal */}
      <AnimatePresence>
        {declineModal.isOpen && (
          <div
            className="fixed inset-0 z-300 flex items-center justify-center p-6 backdrop-blur-xl bg-black/85"
            onClick={() => setDeclineModal({ isOpen: false, requestId: null, reason: '' })}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-md w-full bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <h3 className="text-xl font-black text-white">Decline Order Request</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Select the reason for rejection. This reason will be displayed to the teacher on the order status lookup page.
                </p>
              </div>

              <select
                value={declineModal.reason}
                onChange={(e) => setDeclineModal({ ...declineModal, reason: e.target.value })}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none cursor-pointer"
              >
                {declineReasons.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeclineModal({ isOpen: false, requestId: null, reason: '' })}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeclineRequest}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-xs transition-colors shadow-lg shadow-rose-600/30"
                >
                  Confirm Decline
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Diagnostic Ticket Inspector Slide-over / Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div
            className="fixed inset-0 z-300 flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-black/85 overflow-y-auto"
            onClick={() => setSelectedReport(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative max-w-4xl w-full bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
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
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        : selectedReport.status === 'in_progress'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}
                  >
                    <option value="open" className="bg-slate-900 text-rose-400">🔴 Open</option>
                    <option value="in_progress" className="bg-slate-900 text-amber-400">🟡 In Progress</option>
                    <option value="resolved" className="bg-slate-900 text-emerald-400">🟢 Resolved</option>
                  </select>

                  <button
                    onClick={() => setSelectedReport(null)}
                    className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-6 overflow-y-auto flex-1 pr-1 text-xs">
                {/* Meta summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-white/2 border border-white/5 rounded-xl">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">School</span>
                    <span className="font-bold text-white truncate block mt-0.5">{selectedReport.school?.name || 'Not Attached'}</span>
                  </div>
                  <div className="p-3 bg-white/2 border border-white/5 rounded-xl">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Client Version</span>
                    <span className="font-mono font-bold text-white block mt-0.5">v{selectedReport.app_version}</span>
                  </div>
                  <div className="p-3 bg-white/2 border border-white/5 rounded-xl">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Sync Health</span>
                    <span className="font-black text-emerald-400 block mt-0.5">{selectedReport.sync_rate !== undefined ? `${Math.round(selectedReport.sync_rate)}%` : '100%'}</span>
                  </div>
                  <div className="p-3 bg-white/2 border border-white/5 rounded-xl">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Mismatches</span>
                    <span className="font-black text-rose-400 block mt-0.5">{selectedReport.total_mismatches || 0}</span>
                  </div>
                </div>

                {/* Teacher Note */}
                {selectedReport.user_note && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Teacher Submitted Note:</span>
                    <p className="text-white font-medium italic">"{selectedReport.user_note}"</p>
                  </div>
                )}

                {/* Markdown Log */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Diagnostic Technical Log:</span>
                  <pre className="p-4 bg-slate-950 border border-white/5 rounded-2xl text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-72">
                    {selectedReport.report_markdown || 'No markdown body provided.'}
                  </pre>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs">
                <button
                  onClick={() => handleDeleteReport(selectedReport.ticket_id)}
                  className="px-4 py-2 bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-300 rounded-xl font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Ticket
                </button>

                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black transition-colors"
                >
                  Done Inspecting
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function SaveIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>
      <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/>
      <path d="M7 3v4a1 1 0 0 0 1 1h7"/>
    </svg>
  );
}
