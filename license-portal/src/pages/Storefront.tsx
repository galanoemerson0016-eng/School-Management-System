import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Check, ArrowRight, Download, Laptop, Smartphone, Monitor, Apple, 
  MessageCircle, Mail, HelpCircle, Lock, Key, Clock, CreditCard, ChevronDown,
  Copy, ExternalLink, AlertCircle, ShoppingCart, Info, Loader2, ChevronRight, Image as ImageIcon,
  Upload, X, QrCode, Smartphone as PhoneIcon, Maximize2
} from 'lucide-react';
import { licenseService } from '../lib/license-service';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Storefront() {
  const [activeTab, setActiveTab] = useState<'buy' | 'retrieve'>('buy');
  const [retrievalEmail, setRetrievalEmail] = useState('');
  const [retrievalRef, setRetrievalRef] = useState('');
  const [retrievalResults, setRetrievalResults] = useState<any[]>([]);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [retrievalError, setRetrievalError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewQr, setPreviewQr] = useState<{ name: string; img: string } | null>(null);

  const [paymentType, setPaymentType] = useState<'online' | 'manual'>('online');
  const [pollingOrderId, setPollingOrderId] = useState<string | null>(null);
  const [pollStatus, setPollStatus] = useState<'verifying' | 'success' | 'failed' | null>(null);
  const [polledLicense, setPolledLicense] = useState<string | null>(null);

  const [purchaseData, setPurchaseData] = useState({
    name: '',
    email: '',
    payment_method: 'GCash',
    proof_id: '',
    platform: 'windows',
    proof_image: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const orderId = params.get('order_id');

    if (status === 'success' && orderId) {
      // Clean query params to keep URL clean
      window.history.replaceState({}, document.title, window.location.pathname);
      setActiveTab('retrieve');
      setPollingOrderId(orderId);
    } else if (status === 'failed') {
      window.history.replaceState({}, document.title, window.location.pathname);
      alert('Payment failed or was cancelled. Please try again.');
    }
  }, []);

  useEffect(() => {
    if (!pollingOrderId) return;

    setPollStatus('verifying');
    setPolledLicense(null);

    const docRef = doc(db, 'artifacts/g7-special/admin/data/purchase_requests', pollingOrderId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === 'approved' && data.license_key) {
          setPollStatus('success');
          setPolledLicense(data.license_key);
          setRetrievalResults([
            {
              id: pollingOrderId,
              name: data.name,
              email: data.email,
              platform: data.platform,
              status: 'approved',
              license_key: data.license_key,
              created_at: data.created_at
            }
          ]);
          setPollingOrderId(null);
        } else if (data.status === 'expired' || data.status === 'failed' || data.status === 'declined') {
          setPollStatus('failed');
          setPollingOrderId(null);
        }
      }
    }, (error) => {
      console.error("Firestore polling error:", error);
      setPollStatus('failed');
      setPollingOrderId(null);
    });

    // Timeout polling after 2 minutes
    const timeout = setTimeout(() => {
      unsubscribe();
      setPollStatus((prev) => (prev === 'verifying' ? 'failed' : prev));
      setPollingOrderId(null);
    }, 120000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [pollingOrderId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image too large. Please select a file smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPurchaseData({ ...purchaseData, proof_image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRetrieve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retrievalEmail || !retrievalRef) return;
    
    setIsRetrieving(true);
    setRetrievalError('');
    setRetrievalResults([]);

    try {
      const results = await licenseService.checkRequestStatus(retrievalEmail, retrievalRef);
      if (results.length === 0) {
        setRetrievalError('No matching request found. Please check your email and reference number.');
      } else {
        setRetrievalResults(results);
      }
    } catch (err) {
      setRetrievalError('Something went wrong. Please try again later.');
    } finally {
      setIsRetrieving(false);
    }
  };
  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentType === 'online') {
      setIsSubmitting(true);
      try {
        const checkoutUrl = import.meta.env.VITE_CHECKOUT_URL || 'https://createcheckoutsession-uuirvvcyvq-uc.a.run.app';
        
        const response = await fetch(checkoutUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: purchaseData.name,
            email: purchaseData.email,
            platform: purchaseData.platform
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to create checkout session');
        }

        const data = await response.json();
        if (data.invoice_url) {
          // Redirect the user to Xendit's secure payment checkout screen
          window.location.href = data.invoice_url;
        } else {
          throw new Error('No invoice URL returned from payment provider');
        }
      } catch (err: any) {
        console.error("Payment initiation error:", err);
        alert(err.message || 'Failed to initiate secure online payment. Please check your network and try again.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Manual flow
    if (!purchaseData.proof_image) {
      alert("Please upload a screenshot of your payment.");
      return;
    }
    setIsSubmitting(true);
    try {
      await licenseService.submitRequest({
        ...purchaseData,
        duration: 12
      });
      setSubmitSuccess(true);
    } catch (err) {
      alert("Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const qrCodes = [
    { name: 'GCash', img: '/qrs/gcash_new.png' },
    { name: 'Maya', img: '/qrs/maya.jpg' },
    { name: 'Landbank', img: '/qrs/landbank.jpg' }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-500/30">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <nav className="relative z-50 border-b border-white/5 backdrop-blur-md bg-black/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-900/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">FormEase <span className="text-blue-500">Shop</span></span>
          </div>
          <div className="flex gap-8">
            {['Home', 'Support', 'Retrieve Key'].map((item) => (
              <button 
                key={item}
                onClick={() => item === 'Retrieve Key' ? setActiveTab('retrieve') : setActiveTab('buy')}
                className="text-sm font-bold text-slate-400 hover:text-white transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">NEW: 1-Hour Free Trial Available in the App!</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-6xl md:text-7xl font-black text-white mb-6 leading-tight">
            Simplify Your <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">Teaching Career.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
            The most powerful school management system for DepEd Teachers. Generate SF9, SF2, and more with just one click. Secure, Offline, and Fast.
          </motion.p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <button className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2">
              Get Started Now <ChevronRight className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              <a href="https://tinyurl.com/FORMEASE-WINDOWS" target="_blank" className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group" title="Download for Windows">
                <Monitor className="w-5 h-5 text-slate-400 group-hover:text-white" />
              </a>
              <a href="https://tinyurl.com/FORMEASE-MAC" target="_blank" className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group" title="Download for macOS">
                <Apple className="w-5 h-5 text-slate-400 group-hover:text-white" />
              </a>
            </div>
          </div>
        </div>

        <section className="mb-32">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-black text-white mb-2">Commercial Licenses</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">1-Year Subscription • All Features Unlocked</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-10 bg-gradient-to-br from-blue-600/20 to-transparent border border-blue-500/30 rounded-[3rem] relative overflow-hidden group">
              <div className="absolute top-8 right-8 px-4 py-1 bg-blue-500 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/20">Recommended</div>
              <Monitor className="w-12 h-12 text-blue-500 mb-8" />
              <h3 className="text-3xl font-black text-white mb-4">Windows Edition</h3>
              <p className="text-slate-400 font-medium mb-8">Optimized for DepEd Teachers using Windows 10 or 11 laptops and desktops.</p>
              <div className="space-y-4 mb-10">
                {[
                  '₱399/ 1-Year',
                  '100% Secure & Offline',
                  'Full SF9/SF2 Access',
                  'Unlimited Students',
                  'Premium Support'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center"><Check className="w-3 h-3 text-blue-500" /></div>
                    <span className="text-sm font-bold text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => {
                  setPurchaseData({ ...purchaseData, platform: 'windows' });
                  document.getElementById('checkout-form')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-600/10"
              >
                Buy Now
              </button>
            </div>

            <div className="p-10 bg-gradient-to-br from-indigo-600/20 to-transparent border border-indigo-500/30 rounded-[3rem] relative overflow-hidden group">
              <div className="absolute top-8 right-8 px-4 py-1 bg-indigo-500 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-600/20">Recommended</div>
              <Apple className="w-12 h-12 text-indigo-500 mb-8" />
              <h3 className="text-3xl font-black text-white mb-4">macOS Edition</h3>
              <p className="text-slate-400 font-medium mb-8">Specially built for teachers using Apple MacBooks (Air/Pro) or iMac computers.</p>
              <div className="space-y-4 mb-10">
                {[
                  '₱499/ 1-Year',
                  '100% Secure & Offline',
                  'Full SF9/SF2 Access',
                  'Unlimited Students',
                  'Premium Support'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center"><Check className="w-3 h-3 text-indigo-500" /></div>
                    <span className="text-sm font-bold text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => {
                  setPurchaseData({ ...purchaseData, platform: 'mac' });
                  document.getElementById('checkout-form')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-indigo-600/10"
              >
                Buy Now
              </button>
            </div>
          </div>
        </section>

        <section id="checkout-form" className="max-w-6xl mx-auto mb-32">
          <div className="flex gap-4 p-2 bg-white/5 border border-white/10 rounded-3xl mb-12 max-w-2xl mx-auto">
            <button onClick={() => setActiveTab('buy')} className={`flex-1 py-4 rounded-2xl text-sm font-black transition-all ${activeTab === 'buy' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>1. Payment Details</button>
            <button onClick={() => setActiveTab('retrieve')} className={`flex-1 py-4 rounded-2xl text-sm font-black transition-all ${activeTab === 'retrieve' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>2. Retrieve Key</button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'buy' ? (
              <motion.div key="buy" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-12">
                {submitSuccess ? (
                  <div className="text-center p-20 bg-white/5 border border-white/10 rounded-[3rem]">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8"><Check className="w-10 h-10 text-green-500" /></div>
                    <h3 className="text-3xl font-black text-white mb-4">Request Submitted!</h3>
                    <p className="text-slate-400 font-medium mb-10">We are verifying your payment. Please come back in 1-2 hours to retrieve your key using your email and reference number.</p>
                    <button onClick={() => { setSubmitSuccess(false); setActiveTab('retrieve'); }} className="px-10 py-4 bg-blue-600 rounded-2xl font-black text-white">Go to Retrieval</button>
                  </div>
                ) : (
                  <div className="space-y-8">

                    {/* === ONLINE PAYMENT (Primary) === */}
                    {paymentType === 'online' && (
                      <motion.div key="online-flow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
                        <form onSubmit={handlePurchase} className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 border border-blue-500/20 rounded-[3rem] shadow-2xl space-y-6">
                          {/* Header */}
                          <div className="flex items-center gap-4 pb-6 border-b border-white/5">
                            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 flex items-center justify-center shadow-lg shadow-blue-500/10">
                              <Shield className="w-7 h-7 text-blue-400" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-black text-white">Secure Checkout</h3>
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Powered by Xendit · GCash / Maya / Cards</p>
                            </div>
                          </div>

                          {/* Product Summary */}
                          <div className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selected Plan</p>
                              <p className="text-lg font-black text-white capitalize mt-1">{purchaseData.platform === 'mac' ? 'macOS' : 'Windows'} Edition</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">1-Year Subscription · All Features</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</p>
                              <p className="text-3xl font-black text-blue-400 mt-1">₱{purchaseData.platform === 'mac' ? '499' : '399'}</p>
                            </div>
                          </div>

                          {/* Name & Email */}
                          <div className="space-y-3">
                            <input
                              type="text"
                              placeholder="Full Name"
                              required
                              value={purchaseData.name}
                              onChange={(e) => setPurchaseData({...purchaseData, name: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold placeholder:text-slate-600 focus:border-blue-500 transition-all outline-none"
                            />
                            <input
                              type="email"
                              placeholder="Email Address (where you'll receive your key)"
                              required
                              value={purchaseData.email}
                              onChange={(e) => setPurchaseData({...purchaseData, email: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold placeholder:text-slate-600 focus:border-blue-500 transition-all outline-none"
                            />
                          </div>

                          {/* Pay Button */}
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl font-black text-white shadow-xl shadow-blue-600/25 disabled:opacity-50 flex items-center justify-center gap-3 text-lg transition-all"
                          >
                            {isSubmitting
                              ? <><Loader2 className="w-5 h-5 animate-spin" /> Redirecting to Xendit...</>
                              : <><CreditCard className="w-5 h-5" /> Pay Now · ₱{purchaseData.platform === 'mac' ? '499' : '399'}</>
                            }
                          </button>

                          {/* Trust badges */}
                          <div className="flex items-center justify-center gap-6 pt-2">
                            {['GCash', 'Maya', 'Visa/MC', 'GrabPay'].map(method => (
                              <span key={method} className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{method}</span>
                            ))}
                          </div>

                          {/* Manual fallback link */}
                          <div className="text-center pt-2 border-t border-white/5">
                            <button
                              type="button"
                              onClick={() => setPaymentType('manual')}
                              className="text-xs text-slate-600 hover:text-slate-400 font-bold transition-colors underline underline-offset-2"
                            >
                              Can't pay online? Use manual QR payment instead →
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}

                    {/* === MANUAL PAYMENT (Secondary / Fallback) === */}
                    {paymentType === 'manual' && (
                      <motion.div key="manual-flow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="flex items-center justify-between max-w-2xl mx-auto">
                          <h3 className="text-lg font-black text-white flex items-center gap-2"><QrCode className="w-5 h-5 text-blue-500" /> Manual QR Payment</h3>
                          <button
                            type="button"
                            onClick={() => setPaymentType('online')}
                            className="text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors flex items-center gap-1"
                          >
                            ← Back to Online Payment
                          </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                          <div className="space-y-8">
                             <div className="flex justify-center">
                                <AnimatePresence mode="wait">
                                  {qrCodes.filter(qr => qr.name === purchaseData.payment_method).map((qr) => (
                                     <motion.div 
                                        key={qr.name} 
                                        initial={{ opacity: 0, scale: 0.95 }} 
                                        animate={{ opacity: 1, scale: 1 }} 
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="w-full max-w-sm p-6 bg-white/5 border border-white/10 rounded-[2.5rem] text-center space-y-4 group cursor-pointer relative"
                                        onClick={() => setPreviewQr(qr)}
                                     >
                                        <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />
                                        <div className="flex items-center justify-between px-2">
                                           <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{qr.name} QR Code</p>
                                           <Maximize2 className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                                        </div>
                                        <img src={qr.img} alt={qr.name} className="w-full aspect-square object-cover rounded-3xl shadow-2xl border border-white/5" />
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pt-2">Click to enlarge</p>
                                     </motion.div>
                                  ))}
                                </AnimatePresence>
                             </div>
                             <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl space-y-4">
                                <div className="flex items-center gap-3">
                                   <Info className="w-5 h-5 text-blue-500" />
                                   <p className="text-xs font-bold text-slate-400">How to Pay via {purchaseData.payment_method}</p>
                                </div>
                                <ul className="text-[10px] text-slate-500 font-black uppercase tracking-wider space-y-2 leading-relaxed">
                                   <li>1. Open your {purchaseData.payment_method} App</li>
                                   <li>2. Scan the QR code shown above</li>
                                   <li>3. Pay: <span className="text-blue-400">₱{purchaseData.platform === 'mac' ? '499' : '399'}</span></li>
                                   <li>4. Save the screenshot of your receipt</li>
                                   <li>5. Fill in the form and submit</li>
                                </ul>
                             </div>
                          </div>

                          <form onSubmit={handlePurchase} className="space-y-6">
                            <div className="flex items-center gap-3">
                               <PhoneIcon className="w-6 h-6 text-blue-500" />
                               <h3 className="text-2xl font-black text-white">Order Information</h3>
                            </div>
                            <div className="space-y-4">
                              <input type="text" placeholder="Full Name" required value={purchaseData.name} onChange={(e) => setPurchaseData({...purchaseData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold placeholder:text-slate-600 focus:border-blue-500 transition-all outline-none" />
                              <input type="email" placeholder="Email Address" required value={purchaseData.email} onChange={(e) => setPurchaseData({...purchaseData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold placeholder:text-slate-600 focus:border-blue-500 transition-all outline-none" />
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="relative">
                                    <select 
                                       value={purchaseData.payment_method} 
                                       onChange={(e) => setPurchaseData({...purchaseData, payment_method: e.target.value})} 
                                       className="w-full bg-[#020617] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer"
                                    >
                                       <option value="GCash">GCash</option>
                                       <option value="Maya">Maya</option>
                                       <option value="Landbank">Landbank</option>
                                    </select>
                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                 </div>
                                 <input type="text" placeholder="Reference Number" required value={purchaseData.proof_id} onChange={(e) => setPurchaseData({...purchaseData, proof_id: e.target.value})} className="bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold placeholder:text-slate-600 focus:border-blue-500 transition-all outline-none" />
                              </div>
                              
                              <div className="space-y-2">
                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Payment Screenshot</p>
                                 <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`w-full h-40 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer transition-all ${purchaseData.proof_image ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10 bg-white/5 hover:border-blue-500/30'}`}
                                 >
                                    {purchaseData.proof_image ? (
                                       <div className="relative w-full h-full p-2">
                                          <img src={purchaseData.proof_image} alt="Proof" className="w-full h-full object-contain rounded-2xl" />
                                          <button onClick={(e) => { e.stopPropagation(); setPurchaseData({...purchaseData, proof_image: ''}); }} className="absolute top-4 right-4 p-2 bg-red-500 rounded-xl text-white shadow-xl"><X className="w-4 h-4" /></button>
                                       </div>
                                    ) : (
                                       <div className="text-center space-y-2">
                                          <Upload className="w-8 h-8 text-slate-600 mx-auto" />
                                          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Click to upload screenshot</p>
                                       </div>
                                    )}
                                 </div>
                                 <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                              </div>

                              <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-blue-600 rounded-2xl font-black text-white shadow-xl shadow-blue-600/20 disabled:opacity-50 mt-6 flex items-center justify-center gap-3">
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShoppingCart className="w-5 h-5" /> Submit Order</>}
                              </button>
                            </div>
                          </form>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="retrieve" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6"><Key className="w-8 h-8 text-blue-500" /></div>
                    <h3 className="text-3xl font-black text-white mb-2">My Licenses</h3>
                    <p className="text-slate-400 font-medium">Enter your email and Reference Number or Order ID to view your license keys.</p>
                  </div>

                  {pollStatus === 'verifying' && (
                    <div className="mb-12 p-10 bg-white/5 border border-white/10 rounded-[3rem] text-center space-y-6 shadow-2xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-blue-600/5 pointer-events-none blur-3xl rounded-[3rem]" />
                      <div className="relative w-16 h-16 mx-auto">
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
                        />
                        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                          <CreditCard className="w-6 h-6 text-blue-400" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-white">Verifying Online Payment...</h4>
                        <p className="text-xs text-blue-400 font-black uppercase tracking-widest mt-2 animate-pulse">Checking status with Xendit</p>
                      </div>
                      <p className="text-sm text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
                        We are waiting for Xendit to confirm your deposit. Once verified, your license key will be generated and displayed below automatically. This usually takes 5-15 seconds.
                      </p>
                    </div>
                  )}

                  {pollStatus === 'failed' && (
                    <div className="mb-12 p-10 bg-red-500/5 border border-red-500/15 rounded-[3rem] text-center space-y-6 shadow-2xl relative overflow-hidden">
                      <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-red-400">Payment Verification Timeout</h4>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">Status: Pending manual check</p>
                      </div>
                      <p className="text-sm text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
                        We could not verify your payment automatically in the last 2 minutes. If you have completed the checkout, your key is safe! Please try searching by email and Order ID manually below.
                      </p>
                      <button type="button" onClick={() => setPollStatus(null)} className="px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-white transition-all">Dismiss</button>
                    </div>
                  )}

                  <form onSubmit={handleRetrieve} className="space-y-4 mb-12 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Email Address</label>
                        <input type="email" placeholder="example@email.com" value={retrievalEmail} onChange={(e) => setRetrievalEmail(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:border-blue-500 outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Ref Number / Order ID</label>
                        <input type="text" placeholder="Reference Number or req_..." value={retrievalRef} onChange={(e) => setRetrievalRef(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold focus:border-blue-500 outline-none transition-all" />
                      </div>
                    </div>
                    <button type="submit" disabled={isRetrieving} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50">
                      {isRetrieving ? 'Verifying...' : 'Check Order Status'}
                    </button>
                    {retrievalError && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {retrievalError}</div>}
                  </form>

                  <div className="space-y-6">
                    {retrievalResults.map((req: any) => (
                      <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${req.status === 'approved' ? 'bg-green-500/10 text-green-400' : req.status === 'declined' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                              {req.status}
                            </span>
                          </div>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Order ID: {req.id.slice(0, 8)}</span>
                        </div>

                        {req.status === 'approved' ? (
                          <div className="space-y-6">
                            <div>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Your License Key</p>
                              <div className="flex items-center gap-3">
                                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-5 font-mono text-xl font-black text-white tracking-widest">
                                  {req.license_key}
                                </div>
                                <button onClick={() => handleCopy(req.license_key, req.id)} className="p-5 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white transition-all shadow-lg shadow-blue-600/20">
                                  {copiedId === req.id ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                                </button>
                              </div>
                            </div>
                            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-[10px] text-slate-400 font-bold uppercase leading-relaxed text-center">
                              🔑 Locked to your machine upon activation. Do not share.
                            </div>
                          </div>
                        ) : req.status === 'declined' ? (
                          <div className="space-y-4">
                            <p className="text-red-400 font-bold text-sm">Reason: {req.decline_reason}</p>
                            <p className="text-slate-400 text-xs font-medium">Please message Emerson Galano on Facebook to appeal or clarify your payment details.</p>
                            <a href="https://www.facebook.com/galanoemerson0014" target="_blank" className="inline-flex items-center gap-2 text-blue-400 text-xs font-black uppercase tracking-widest hover:text-blue-300">Message Emerson <ExternalLink className="w-3 h-3" /></a>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center py-6 space-y-4">
                            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center"><Clock className="w-6 h-6 text-amber-500 animate-spin" /></div>
                            <p className="text-slate-300 font-bold">Verification in progress...</p>
                            <p className="text-xs text-slate-500 max-w-sm">We are manually checking your payment reference. Please check back in a few minutes.</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* QR Preview Modal */}
        <AnimatePresence>
          {previewQr && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/80" onClick={() => setPreviewQr(null)}>
               <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative max-w-md w-full bg-[#0A192F] p-8 rounded-[3rem] border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                  <div className="text-center mb-6">
                     <h3 className="text-2xl font-black text-white">{previewQr.name} Payment</h3>
                     <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Scan to pay ₱{purchaseData.platform === 'mac' ? '499' : '399'}</p>
                  </div>
                  <img src={previewQr.img} alt={previewQr.name} className="w-full aspect-square object-contain rounded-[2.5rem] shadow-2xl border border-white/5 bg-white/5" />
                  <button onClick={() => setPreviewQr(null)} className="absolute -top-4 -right-4 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all shadow-xl">
                     <X className="w-6 h-6" />
                  </button>
                  <div className="mt-8">
                     <button onClick={() => setPreviewQr(null)} className="w-full py-4 bg-blue-600 rounded-2xl font-black text-white shadow-xl">Close</button>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        <footer className="pt-20 border-t border-white/5 text-center">
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Powered by FormEase Secure Shop Infrastructure</p>
          <div className="flex justify-center gap-6">
            <HelpCircle className="w-5 h-5 text-slate-700" />
            <Lock className="w-5 h-5 text-slate-700" />
            <Shield className="w-5 h-5 text-slate-700" />
          </div>
        </footer>
      </main>
    </div>
  );
}
