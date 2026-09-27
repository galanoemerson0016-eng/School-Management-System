import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Check, ArrowRight, Download, Monitor, Apple,
  MessageCircle, Mail, HelpCircle, Lock, Key, Clock, CreditCard,
  Copy, ExternalLink, AlertCircle, ShoppingCart, Info, Loader2,
  ChevronRight, Upload, X, QrCode, Maximize2, Sparkles, CheckCircle2,
  Laptop, RefreshCw, Send, ShieldCheck
} from 'lucide-react';
import { licenseService } from '../lib/license-service';

interface QrOption {
  id: string;
  name: string;
  badge: string;
  color: string;
  borderColor: string;
  img: string;
  accountName: string;
  instructions: string[];
}

const PAYMENT_METHODS: QrOption[] = [
  {
    id: 'GCash',
    name: 'GCash',
    badge: 'Fastest Verification',
    color: 'from-blue-600/30 to-blue-500/10',
    borderColor: 'border-blue-500/40',
    img: '/qrs/gcash_new.png',
    accountName: 'EMERSON G. (FormEase Lead Developer)',
    instructions: [
      'Open your GCash app and tap "Scan QR".',
      'Scan the QR code shown below or upload screenshot.',
      'Enter the exact amount for your chosen edition.',
      'Save/screenshot your transaction receipt with Reference No.',
      'Enter your details and upload the receipt screenshot below.'
    ]
  },
  {
    id: 'Maya',
    name: 'Maya',
    badge: 'Instant QR Ph',
    color: 'from-emerald-600/30 to-teal-500/10',
    borderColor: 'border-emerald-500/40',
    img: '/qrs/maya.jpg',
    accountName: 'EMERSON G. (FormEase Official)',
    instructions: [
      'Open your Maya app and tap "Scan to Pay".',
      'Scan the QR code below or save the image.',
      'Confirm the exact payment amount.',
      'Capture a clear screenshot of the confirmed payment receipt.',
      'Paste your Reference ID and upload the receipt below.'
    ]
  },
  {
    id: 'Landbank',
    name: 'Landbank / InstaPay',
    badge: 'DepEd Payroll Friendly',
    color: 'from-amber-600/30 to-emerald-500/10',
    borderColor: 'border-amber-500/40',
    img: '/qrs/landbank.jpg',
    accountName: 'EMERSON G. / Landbank of the Philippines',
    instructions: [
      'Open Landbank Mobile Banking or any bank app via InstaPay.',
      'Scan or upload the QR code below.',
      'Review and transfer the exact subscription amount.',
      'Save your transaction slip showing the Reference Number.',
      'Submit the form below with your reference details.'
    ]
  }
];

export default function Storefront() {
  const [activeTab, setActiveTab] = useState<'buy' | 'retrieve' | 'faq'>('buy');
  const [selectedPlatform, setSelectedPlatform] = useState<'windows' | 'mac'>('windows');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('GCash');

  // Retrieval states
  const [retrievalEmail, setRetrievalEmail] = useState('');
  const [retrievalRef, setRetrievalRef] = useState('');
  const [retrievalResults, setRetrievalResults] = useState<any[]>([]);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [retrievalError, setRetrievalError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // QR Lightbox preview
  const [previewQr, setPreviewQr] = useState<QrOption | null>(null);

  // Form submission states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    proof_id: '',
    proof_image: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessData, setSubmitSuccessData] = useState<{
    name: string;
    email: string;
    refNo: string;
    platform: string;
    amount: number;
    channel: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedMethod = PAYMENT_METHODS.find(m => m.id === selectedMethodId) || PAYMENT_METHODS[0];
  const price = selectedPlatform === 'mac' ? 499 : 399;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB. Please select or compress a smaller screenshot.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, proof_image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter your full name as it should appear on your license.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    if (!formData.proof_id.trim()) {
      alert('Please enter the payment Reference Number from your receipt.');
      return;
    }
    if (!formData.proof_image) {
      alert('Please upload a screenshot of your payment receipt.');
      return;
    }

    setIsSubmitting(true);
    try {
      await licenseService.submitRequest({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        payment_method: selectedMethod.name,
        duration: 12,
        proof_id: formData.proof_id.trim().toUpperCase(),
        platform: selectedPlatform,
        proof_image: formData.proof_image
      });

      setSubmitSuccessData({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        refNo: formData.proof_id.trim().toUpperCase(),
        platform: selectedPlatform,
        amount: price,
        channel: selectedMethod.name
      });

      // Clear form
      setFormData({
        name: '',
        email: '',
        proof_id: '',
        proof_image: ''
      });
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err) {
      console.error('Failed to submit purchase request:', err);
      alert('Unable to submit order. Please check your internet connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetrieve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retrievalEmail.trim() || !retrievalRef.trim()) return;

    setIsRetrieving(true);
    setRetrievalError('');
    setRetrievalResults([]);

    try {
      const results = await licenseService.checkRequestStatus(
        retrievalEmail.trim().toLowerCase(),
        retrievalRef.trim().toLowerCase()
      );
      if (results.length === 0) {
        setRetrievalError('No order found matching this email and reference number. Please double-check for typos.');
      } else {
        setRetrievalResults(results);
      }
    } catch (err) {
      console.error('Error retrieving key:', err);
      setRetrievalError('Unable to check order status right now. Please try again in a few moments.');
    } finally {
      setIsRetrieving(false);
    }
  };

  const quickTrackFromSuccess = () => {
    if (!submitSuccessData) return;
    setRetrievalEmail(submitSuccessData.email);
    setRetrievalRef(submitSuccessData.refNo);
    setActiveTab('retrieve');
    setSubmitSuccessData(null);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-blue-500/30 antialiased relative overflow-x-hidden">
      {/* Dynamic ambient background glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-1/4 w-162.5 h-162.5 bg-blue-600/12 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute top-[40%] right-[-10%] w-137.5 h-137.5 bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-150 h-150 bg-cyan-600/10 rounded-full blur-[150px]" />
      </div>

      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-linear-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                FormEase <span className="bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Pro</span>
              </span>
              <span className="block text-[9px] uppercase tracking-[0.2em] font-black text-slate-500">Official Licensing Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="https://facebook.com/xshame14"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-black text-blue-400 hover:text-white hover:bg-blue-600/20 border border-blue-500/20 transition-all flex items-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Contact Developer (Facebook)</span>
              <span className="md:hidden">FB Support</span>
            </a>
            <button
              onClick={() => setActiveTab('buy')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'buy'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Get License
            </button>
            <button
              onClick={() => setActiveTab('retrieve')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeTab === 'retrieve'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              Retrieve Key
            </button>
            <button
              onClick={() => setActiveTab('faq')}
              className={`hidden sm:inline-flex px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'faq'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              FAQ
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        
        {/* Hero Section */}
        <div className="text-center mb-16 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-300">
              DepEd MATATAG Ready · 100% Offline & Private
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6"
          >
            Empower Your Teaching. <br />
            <span className="bg-linear-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              One Key, Unlocked for 1 Year.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto font-medium leading-relaxed"
          >
            Official commercial license for Philippine Public & Private School Teachers.
            Automate SF9 (Form 138), SF10, SF2, SF5, PACE 138, and grading records effortlessly.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-bold text-slate-400"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Lifetime Updates for Active Year
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
              <Laptop className="w-4 h-4 text-blue-400" /> No Monthly Subscriptions
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
              <Check className="w-4 h-4 text-cyan-400" /> DepEd Form Compliance Certified
            </div>
          </motion.div>
        </div>

        {/* Tab Content Switching */}
        <AnimatePresence mode="wait">
          {activeTab === 'buy' && (
            <motion.div
              key="buy-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {submitSuccessData ? (
                /* Post-submission confirmation card */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-2xl mx-auto p-8 sm:p-12 bg-linear-to-br from-slate-900/90 to-slate-950/90 border border-emerald-500/30 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-center"
                >
                  <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-3xl flex items-center justify-center mx-auto mb-6 text-emerald-400">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-black text-white mb-2">Order Request Submitted!</h2>
                  <p className="text-slate-400 text-sm font-medium mb-8">
                    Thank you, Teacher <strong className="text-white">{submitSuccessData.name}</strong>. Your payment via {submitSuccessData.channel} is now in our verification queue.
                  </p>

                  <div className="p-6 bg-white/3 border border-white/10 rounded-2xl text-left space-y-3 mb-8">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-bold uppercase tracking-wider">Reference Number</span>
                      <div className="flex items-center gap-2 font-mono font-black text-blue-400 text-sm">
                        <span>{submitSuccessData.refNo}</span>
                        <button
                          onClick={() => handleCopy(submitSuccessData.refNo, 'submitted-ref')}
                          className="p-1 hover:text-white transition-colors"
                          title="Copy Reference"
                        >
                          {copiedId === 'submitted-ref' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-bold uppercase tracking-wider">Registered Email</span>
                      <span className="text-slate-200 font-bold">{submitSuccessData.email}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-bold uppercase tracking-wider">Edition</span>
                      <span className="text-slate-200 font-bold capitalize">{submitSuccessData.platform} Edition (₱{submitSuccessData.amount})</span>
                    </div>
                    <div className="flex justify-between text-xs pt-2 border-t border-white/5">
                      <span className="text-slate-500 font-bold uppercase tracking-wider">Estimated Review</span>
                      <span className="text-emerald-400 font-bold">15 to 30 Minutes</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={quickTrackFromSuccess}
                      className="flex-1 py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2"
                    >
                      <Key className="w-4 h-4" /> Track & Retrieve Key
                    </button>
                    <button
                      onClick={() => setSubmitSuccessData(null)}
                      className="py-4 px-6 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl font-bold text-sm transition-all border border-white/10"
                    >
                      New Submission
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* Standard Purchasing Wizard */
                <div className="space-y-16">
                  {/* Step 1: Select Edition */}
                  <div>
                    <div className="text-center mb-8">
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400">Step 1</span>
                      <h2 className="text-3xl font-black text-white mt-1">Choose Your Platform Edition</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                      {/* Windows Card */}
                      <div
                        onClick={() => setSelectedPlatform('windows')}
                        className={`p-8 rounded-[2.5rem] border cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
                          selectedPlatform === 'windows'
                            ? 'bg-linear-to-br from-blue-600/20 via-blue-950/40 to-slate-950 border-blue-500 shadow-2xl shadow-blue-600/20 ring-2 ring-blue-500/40'
                            : 'bg-white/3 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-6">
                          <div className={`p-4 rounded-2xl ${selectedPlatform === 'windows' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400'}`}>
                            <Monitor className="w-8 h-8" />
                          </div>
                          <span className="px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Most Popular
                          </span>
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-white mb-1">Windows Edition</h3>
                          <p className="text-slate-400 text-xs font-medium mb-6">For Windows 10 & 11 laptops, desktops, and DepEd DCP packages.</p>
                          <div className="flex items-baseline gap-2 mb-6">
                            <span className="text-4xl font-black text-white">₱399</span>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">/ 1-Year License</span>
                          </div>
                          <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
                            <li className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-blue-400 shrink-0" /> Full Automated SF9 (MATATAG & Standard)
                            </li>
                            <li className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-blue-400 shrink-0" /> Unlimited Learners & Sections
                            </li>
                            <li className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-blue-400 shrink-0" /> Fast Offline Excel & PDF Export
                            </li>
                          </ul>
                        </div>
                        <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-black">
                          <span className={selectedPlatform === 'windows' ? 'text-blue-400' : 'text-slate-500'}>
                            {selectedPlatform === 'windows' ? '● Selected for Checkout' : 'Click to Select'}
                          </span>
                          <span className="text-slate-500">v3.5.20 Compatible</span>
                        </div>
                      </div>

                      {/* macOS Card */}
                      <div
                        onClick={() => setSelectedPlatform('mac')}
                        className={`p-8 rounded-[2.5rem] border cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
                          selectedPlatform === 'mac'
                            ? 'bg-linear-to-br from-indigo-600/20 via-indigo-950/40 to-slate-950 border-indigo-500 shadow-2xl shadow-indigo-600/20 ring-2 ring-indigo-500/40'
                            : 'bg-white/3 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-6">
                          <div className={`p-4 rounded-2xl ${selectedPlatform === 'mac' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400'}`}>
                            <Apple className="w-8 h-8" />
                          </div>
                          <span className="px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Apple Silicon & Intel
                          </span>
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-white mb-1">macOS Edition</h3>
                          <p className="text-slate-400 text-xs font-medium mb-6">Native build for Apple MacBook Air, Pro, and iMac computers.</p>
                          <div className="flex items-baseline gap-2 mb-6">
                            <span className="text-4xl font-black text-white">₱499</span>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">/ 1-Year License</span>
                          </div>
                          <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
                            <li className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-indigo-400 shrink-0" /> Native M1/M2/M3/M4 & Intel Support
                            </li>
                            <li className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-indigo-400 shrink-0" /> High-Resolution Retina Form Rendering
                            </li>
                            <li className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-indigo-400 shrink-0" /> Full Automated SF9, SF10 & Attendance
                            </li>
                          </ul>
                        </div>
                        <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-black">
                          <span className={selectedPlatform === 'mac' ? 'text-indigo-400' : 'text-slate-500'}>
                            {selectedPlatform === 'mac' ? '● Selected for Checkout' : 'Click to Select'}
                          </span>
                          <span className="text-slate-500">Universal Binary</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 & 3: Scan QR & Submit Proof */}
                  <div className="max-w-5xl mx-auto bg-linear-to-br from-slate-900/80 to-slate-950/80 border border-white/10 rounded-[3rem] p-6 sm:p-10 shadow-2xl relative">
                    <div className="text-center mb-10">
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400">Step 2 & 3</span>
                      <h2 className="text-3xl font-black text-white mt-1">Scan QR & Submit Payment Proof</h2>
                      <p className="text-slate-400 text-xs font-medium mt-1">
                        Amount to transfer: <span className="text-emerald-400 font-black text-sm">₱{price}.00</span> for {selectedPlatform === 'mac' ? 'macOS' : 'Windows'} 1-Year License
                      </p>
                      <div className="mt-3">
                        <a
                          href="https://facebook.com/xshame14"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-bold text-blue-300 hover:text-white hover:bg-blue-500/20 transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
                          <span>Prefer direct chat? Message Emerson M. Galano on Facebook</span>
                        </a>
                      </div>
                    </div>

                    {/* Payment Channel Selector Tabs */}
                    <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
                      {PAYMENT_METHODS.map(method => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setSelectedMethodId(method.id)}
                          className={`px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2.5 border ${
                            selectedMethodId === method.id
                              ? `${method.borderColor} bg-white/10 text-white shadow-xl scale-105`
                              : 'border-white/5 bg-white/2 text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <QrCode className="w-4 h-4" />
                          <span>{method.name}</span>
                          <span className="text-[9px] opacity-75 hidden sm:inline">({method.badge})</span>
                        </button>
                      ))}
                    </div>

                    {/* Two-Column Studio: Left = QR & Guide, Right = Order Submission */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      
                      {/* Left Column: QR Card */}
                      <div className="lg:col-span-5 space-y-6">
                        <div
                          onClick={() => setPreviewQr(selectedMethod)}
                          className={`p-6 rounded-3xl border ${selectedMethod.borderColor} bg-linear-to-br ${selectedMethod.color} text-center space-y-4 group cursor-pointer relative shadow-xl`}
                        >
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-black text-white uppercase tracking-wider">{selectedMethod.name} QR Code</span>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-blue-300">
                              <Maximize2 className="w-3.5 h-3.5" /> Enlarge
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-2xl shadow-2xl inline-block max-w-70 mx-auto w-full aspect-square relative">
                            <img
                              src={selectedMethod.img}
                              alt={`${selectedMethod.name} QR Code`}
                              className="w-full h-full object-contain rounded-xl"
                            />
                          </div>

                          <div className="pt-1">
                            <p className="text-[11px] text-slate-300 font-bold leading-tight">{selectedMethod.accountName}</p>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Scan or tap to preview fullscreen</p>
                          </div>
                        </div>

                        {/* Quick Instructions Card */}
                        <div className="p-5 bg-white/2 border border-white/5 rounded-2xl space-y-2.5 text-xs">
                          <p className="font-black text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-blue-400" /> Instructions for {selectedMethod.name}
                          </p>
                          <ol className="space-y-1.5 text-slate-400 text-[11px] font-medium list-decimal list-inside leading-relaxed">
                            {selectedMethod.instructions.map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      </div>

                      {/* Right Column: Order Form */}
                      <div className="lg:col-span-7">
                        <form onSubmit={handlePurchaseSubmit} className="space-y-5 bg-white/2 border border-white/5 p-6 sm:p-8 rounded-3xl">
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                              1. Teacher Full Name <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Maria Santos Dela Cruz"
                              value={formData.name}
                              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full bg-slate-950/60 border border-white/10 rounded-2xl py-3.5 px-4 text-white text-sm font-bold placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            />
                            <p className="text-[10px] text-slate-500 font-medium mt-1">This name will be registered to your official license certificate.</p>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                              2. Registered Email Address <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="email"
                              required
                              placeholder="e.g. maria.delacruz@deped.gov.ph"
                              value={formData.email}
                              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full bg-slate-950/60 border border-white/10 rounded-2xl py-3.5 px-4 text-white text-sm font-bold placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            />
                            <p className="text-[10px] text-slate-500 font-medium mt-1">Used to retrieve and re-download your key anytime.</p>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                              3. Payment Reference Number <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 100293847581 or Trace Ref"
                              value={formData.proof_id}
                              onChange={(e) => setFormData(prev => ({ ...prev, proof_id: e.target.value }))}
                              className="w-full bg-slate-950/60 border border-white/10 rounded-2xl py-3.5 px-4 text-white text-sm font-bold placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono"
                            />
                            <p className="text-[10px] text-slate-500 font-medium mt-1">Found on your {selectedMethod.name} payment confirmation receipt.</p>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                              4. Upload Payment Screenshot <span className="text-rose-400">*</span>
                            </label>
                            
                            <div
                              onClick={() => fileInputRef.current?.click()}
                              className={`w-full h-36 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                                formData.proof_image
                                  ? 'border-emerald-500/50 bg-emerald-500/5'
                                  : 'border-white/10 bg-slate-950/40 hover:border-blue-500/40'
                              }`}
                            >
                              {formData.proof_image ? (
                                <div className="relative w-full h-full p-2 flex items-center justify-center">
                                  <img
                                    src={formData.proof_image}
                                    alt="Payment Proof"
                                    className="max-h-full max-w-full object-contain rounded-lg"
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFormData(prev => ({ ...prev, proof_image: '' }));
                                      if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                    className="absolute top-3 right-3 p-1.5 bg-rose-600 text-white rounded-xl shadow-lg hover:bg-rose-500 transition-colors"
                                    title="Remove Screenshot"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="text-center space-y-1.5 p-4">
                                  <Upload className="w-7 h-7 text-slate-500 mx-auto" />
                                  <p className="text-xs font-bold text-slate-300">Click to upload screenshot</p>
                                  <p className="text-[10px] text-slate-500 font-medium">PNG, JPG or JPEG (Max 2MB)</p>
                                </div>
                              )}
                            </div>
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept="image/*"
                              className="hidden"
                            />
                          </div>

                          {/* Submit Action */}
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 px-6 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm tracking-wide transition-all shadow-xl shadow-blue-600/25 disabled:opacity-50 flex items-center justify-center gap-2 mt-4 cursor-pointer"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Submitting Request...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" /> Submit Order & Request License Key
                              </>
                            )}
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'retrieve' && (
            <motion.div
              key="retrieve-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-400">
                  <Key className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-white">Retrieve Your License Key</h2>
                <p className="text-slate-400 text-sm font-medium mt-1">
                  Enter your email and Reference Number to view your approved license.
                </p>
              </div>

              <form onSubmit={handleRetrieve} className="space-y-4 mb-10 bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Registered Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. maria.delacruz@deped.gov.ph"
                    value={retrievalEmail}
                    onChange={(e) => setRetrievalEmail(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/10 rounded-2xl py-3.5 px-4 text-white text-sm font-bold placeholder:text-slate-600 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Payment Reference Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GCash / Maya Reference Number"
                    value={retrievalRef}
                    onChange={(e) => setRetrievalRef(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/10 rounded-2xl py-3.5 px-4 text-white text-sm font-bold placeholder:text-slate-600 focus:border-blue-500 outline-none transition-all font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isRetrieving}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-blue-600/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isRetrieving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying Order Status...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" /> Check Order Status
                    </>
                  )}
                </button>

                {retrievalError && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{retrievalError}</span>
                  </div>
                )}
              </form>

              {/* Retrieval Results List */}
              <div className="space-y-6">
                {retrievalResults.map((req) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 sm:p-8 bg-slate-900/80 border border-white/10 rounded-3xl relative overflow-hidden shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <span
                        className={`px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          req.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : req.status === 'declined'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {req.status === 'approved' ? '✓ Approved' : req.status === 'declined' ? '✗ Verification Needed' : '⏳ Review Pending'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 font-bold">
                        Platform: {req.platform?.toUpperCase() || 'WINDOWS'}
                      </span>
                    </div>

                    {req.status === 'approved' ? (
                      <div className="space-y-6">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                            Your 1-Year License Key
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-950/80 border border-blue-500/30 rounded-2xl p-4 font-mono text-lg sm:text-xl font-black text-blue-300 tracking-widest text-center select-all">
                              {req.license_key}
                            </div>
                            <button
                              onClick={() => handleCopy(req.license_key, req.id)}
                              className="p-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
                              title="Copy License Key"
                            >
                              {copiedId === req.id ? <Check className="w-5 h-5 text-emerald-300" /> : <Copy className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        {/* Activation Guide Box */}
                        <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-xs space-y-2">
                          <p className="font-black text-blue-300 uppercase tracking-wider text-[10px]">How to Activate in FormEase Pro:</p>
                          <ol className="text-slate-400 text-[11px] font-medium space-y-1 list-decimal list-inside">
                            <li>Open your FormEase Pro desktop application on your computer.</li>
                            <li>Go to <strong className="text-white">Settings</strong> → <strong className="text-white">Activation</strong>.</li>
                            <li>Paste your Serial Key and enter your Full Name, then click <strong className="text-white">Activate Now</strong>.</li>
                          </ol>
                        </div>
                      </div>
                    ) : req.status === 'declined' ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300">
                          <p className="font-bold">Decline Reason: {req.decline_reason || 'Payment details could not be matched with bank record.'}</p>
                          <p className="text-[11px] text-slate-400 mt-1">Please contact Emerson Galano to clarify or resubmit your receipt.</p>
                        </div>
                        <a
                          href="https://facebook.com/xshame14"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-400 hover:text-blue-300"
                        >
                          <MessageCircle className="w-4 h-4" /> Message Developer on Facebook
                        </a>
                      </div>
                    ) : (
                      <div className="text-center py-6 space-y-3">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto text-amber-400 animate-pulse">
                          <Clock className="w-6 h-6" />
                        </div>
                        <h4 className="text-base font-black text-white">Payment Under Review</h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                          Your submission is currently in the verification queue. Review typically takes 15–30 minutes during school hours. Please check back shortly.
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'faq' && (
            <motion.div
              key="faq-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-white">Frequently Asked Questions</h2>
                <p className="text-slate-400 text-sm font-medium mt-1">
                  Everything you need to know about FormEase Pro licenses and activation.
                </p>
              </div>

              {[
                {
                  q: 'How long does payment verification take?',
                  a: 'Payment verification typically takes 15 to 30 minutes during daytime hours. Once verified, your license key is instantly available in the "Retrieve Key" tab using your email and Reference Number.'
                },
                {
                  q: 'Does FormEase Pro work completely offline?',
                  a: 'Yes! FormEase Pro is engineered from the ground up for Philippine public schools. All learner data, grades, and forms are stored locally and encrypted on your computer with zero cloud dependency required.'
                },
                {
                  q: 'Can I transfer my license if I change or reformat my laptop?',
                  a: 'Yes. If you change laptops or reformat your operating system, simply contact our support channel with your registered email and reference number, and we will safely reset your license binding so you can reactivate on your new machine.'
                },
                {
                  q: 'What is included in the 1-Year Commercial License?',
                  a: 'Your license grants unlimited access to all features: Automated SF9 (both DepEd MATATAG and Standard), SF10 permanent records, SF2 monthly attendance, SF5 promotions, SF6 summaries, PACE Form 138-Reading, Certificate Generator, ID Card Maker, and all official updates throughout your active subscription.'
                }
              ].map((faq, i) => (
                <div key={i} className="p-6 bg-slate-900/60 border border-white/5 rounded-2xl space-y-2">
                  <h4 className="text-base font-black text-white flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
                    {faq.q}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed pl-6">
                    {faq.a}
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* QR Code Fullscreen Modal */}
        <AnimatePresence>
          {previewQr && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-2xl bg-black/80"
              onClick={() => setPreviewQr(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative max-w-sm w-full bg-slate-900 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setPreviewQr(null)}
                  className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-xl font-black text-white mb-1">{previewQr.name} Official QR</h3>
                <p className="text-xs text-slate-400 font-medium mb-6">Scan to pay ₱{price}.00 for {selectedPlatform} Edition</p>

                <div className="bg-white p-4 rounded-2xl shadow-xl max-w-65 mx-auto mb-6">
                  <img src={previewQr.img} alt={previewQr.name} className="w-full h-full object-contain" />
                </div>

                <div className="p-3 bg-white/5 rounded-xl text-xs font-bold text-slate-300 mb-6">
                  {previewQr.accountName}
                </div>

                <button
                  onClick={() => setPreviewQr(null)}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-black text-white text-xs uppercase tracking-wider transition-colors"
                >
                  Done
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-slate-500">
          <div>
            <p className="font-bold text-slate-400">FormEase Pro Licensing System</p>
            <p className="text-[11px]">Crafted with pride for Filipino Educators across DepEd.</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <a
              href="https://facebook.com/xshame14"
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Support
            </a>
            <span className="text-slate-700">·</span>
            <span className="text-slate-500">v3.5.20 Certified</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
