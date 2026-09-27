import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, CheckCircle2, Loader2, AlertCircle, Zap, Monitor, Apple, Key } from 'lucide-react';
import { useAppStore } from '../stores/app-store';
import { useAuthStore } from '../stores/auth-store';
import { getMachineId } from '../utils/machine-id';
import { TERMS_AND_CONDITIONS, PRIVACY_POLICY } from '../data/legalDocs';

async function hashMachineId(machineId: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(machineId));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function ActivationPage() {
  const { updateSchoolProfile, schoolProfile, showNotification } = useAppStore();
  const [key, setKey] = useState('');
  const [fullName, setFullName] = useState(schoolProfile.adviser_name || '');
  const [machineId, setMachineId] = useState('Detecting Hardware...');
  const [status, setStatus] = useState<'idle' | 'activating' | 'eula' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<Partial<typeof schoolProfile> | null>(null);
  const [eulaTab, setEulaTab] = useState<'terms' | 'privacy'>('terms');
  const [currentPlatform, setCurrentPlatform] = useState<'windows' | 'mac'>('windows');
  const redirectTimerRef = useRef<number | null>(null);

  // Detect if user was redirected here due to a license reset by admin
  const [wasLicenseReset, setWasLicenseReset] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem('formease-license-reset-detected') === 'true') {
        setWasLicenseReset(true);
        localStorage.removeItem('formease-license-reset-detected');
      }
      localStorage.removeItem('formease-license-offline-limit');
    } catch (error) {
      console.warn('Failed to read license reset from localStorage:', error);
    }
  }, []);

  const isExpired = React.useMemo(() => {
    if (!schoolProfile.is_activated) return false;
    
    // Check trial expiration (1 hour)
    if (schoolProfile.is_trial && schoolProfile.trial_activated_at) {
      const trialStart = new Date(schoolProfile.trial_activated_at);
      const now = new Date();
      const diffMs = now.getTime() - trialStart.getTime();
      return diffMs > (1 * 60 * 60 * 1000); // 1 Hour
    }

    // Check full activation (1 year)
    if (schoolProfile.subscription_end_date) {
      return new Date(schoolProfile.subscription_end_date) < new Date();
    }

    if (schoolProfile.activated_at) {
        const activationDate = new Date(schoolProfile.activated_at);
        const now = new Date();
        const diffDays = Math.ceil(Math.abs(now.getTime() - activationDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 365;
    }
    
    return false;
  }, [schoolProfile.is_activated, schoolProfile.activated_at, schoolProfile.is_trial, schoolProfile.trial_activated_at, schoolProfile.subscription_end_date]);

  // Detect Platform and Fetch Machine ID
  React.useEffect(() => {
    const init = async () => {
      // Detect OS via User Agent
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('mac')) {
        setCurrentPlatform('mac');
      } else {
        setCurrentPlatform('windows');
      }

      const id = await getMachineId();
      setMachineId(id);
    };
    init();
  }, []);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const handleKeyChange = (val: string) => {
    const clean = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 16);
    const parts = clean.match(/.{1,4}/g) || [];
    setKey(parts.join('-'));
  };

  const handleStartTrial = async () => {
    if (schoolProfile.is_trial) {
        setStatus('error');
        setErrorMessage('You have already used your free trial.');
        return;
    }

    if (!window.confirm('Start your 1-hour free trial? This will unlock all features temporarily.')) return;

    setStatus('activating');
    setErrorMessage('');

    try {
        const projectId = 'formease-licensing';
        const machineIdHash = await hashMachineId(machineId);
        const checkUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/artifacts/g7-special/public/data/trials/${machineIdHash}`;

        // Verify if this machine already used a trial
        const verifyRes = await fetch(checkUrl);
        if (verifyRes.status === 200) {
            throw new Error('This computer has already claimed its 1-hour free trial.');
        }

        const now = new Date();
        const expiry = new Date(now.getTime() + (1 * 60 * 60 * 1000)); // 1 Hour

        // Register the trial using the hashed machine ID as document ID (not raw machine ID).
        const createUrl = `${checkUrl}?updateMask.fieldPaths=machine_id_hash&updateMask.fieldPaths=started_at&updateMask.fieldPaths=platform`;
        const registerRes = await fetch(createUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              machine_id_hash: { stringValue: machineIdHash },
              started_at: { timestampValue: now.toISOString() },
              platform: { stringValue: currentPlatform }
            }
          })
        });

        if (!registerRes.ok) {
            throw new Error('Could not establish secure cloud trial session. Please check your internet connection.');
        }

        setPendingProfile({
            is_activated: true,
            is_trial: true,
            trial_activated_at: now.toISOString(),
            subscription_end_date: expiry.toISOString(),
            activated_at: now.toISOString(),
            adviser_name: 'Trial User'
        });

        setStatus('eula');
        showNotification('Activation key verified. Please review the terms of service.', 'info');

    } catch (error) {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to start trial.');
    }
  };

  const handleActivate = async () => {
    if (!key || !fullName) {
      setStatus('error');
      setErrorMessage('Please enter both your Serial Key and Full Name.');
      return;
    }

    setStatus('activating');
    setErrorMessage('');

    try {
      const serial = key.trim().toUpperCase();

      if (window.electronAPI?.licenseActivate) {
        // Desktop: the main process verifies the serial against the licensing
        // service, binds this machine, and stores the tamper-evident license
        // record. The renderer only receives the result.
        const result = await window.electronAPI.licenseActivate({
          serial,
          fullName: fullName.trim(),
          platform: currentPlatform,
        });

        if (!result.success) {
          throw new Error(result.error || 'Verification failed.');
        }

        // Profile fields are display/metadata only — the activation verdict
        // itself comes from the main process.
        setPendingProfile({
          is_activated: true,
          is_trial: false,
          activation_key: serial,
          activated_at: result.activatedAt || new Date().toISOString(),
          subscription_end_date: result.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          adviser_name: fullName.trim()
        });

        setStatus('eula');
        showNotification('Activation key verified. Please review the terms of service.', 'info');
        return;
      }

      // --- Web build fallback: renderer-side verification ---
      const projectId = 'formease-licensing';
      const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/artifacts/g7-special/public/data/licenses/${serial}`;

      const response = await fetch(baseUrl);

      if (response.status === 404) {
        throw new Error(`Serial Key "${serial}" was not found.`);
      }

      if (!response.ok) {
        throw new Error('Server connection failed.');
      }

      const docData = await response.json();
      const fields = docData.fields || {};
      const existingMachineId = fields.machine_id?.stringValue || '';
      const licensePlatform = fields.platform?.stringValue || 'windows';

      // --- PLATFORM SECURITY CHECK ---
      if (licensePlatform !== currentPlatform) {
        throw new Error(`Invalid License: This is a ${licensePlatform.toUpperCase()} key, but you are running on ${currentPlatform.toUpperCase()}.`);
      }

      if (existingMachineId && existingMachineId !== machineId) {
        throw new Error('This license is registered to another computer.');
      }

      if (!existingMachineId) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

        const patchUrl = `${baseUrl}?updateMask.fieldPaths=machine_id&updateMask.fieldPaths=activated_at&updateMask.fieldPaths=registered_to&updateMask.fieldPaths=status&updateMask.fieldPaths=expires_at`;
        await fetch(patchUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              machine_id: { stringValue: machineId },
              activated_at: { timestampValue: now.toISOString() },
              expires_at: { timestampValue: expiresAt.toISOString() },
              registered_to: { stringValue: fullName.trim() },
              status: { stringValue: 'activated' }
            }
          })
        });
      }

      setPendingProfile({
        is_activated: true,
        is_trial: false, // Reset trial flag on full activation
        activation_key: serial,
        activated_at: new Date().toISOString(),
        subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        adviser_name: fullName.trim()
      });
      setStatus('eula');
      showNotification('Activation key verified. Please review the terms of service.', 'info');

    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Verification failed.');
    }
  };

  const handleAcceptEula = async () => {
    if (!agreeTerms || !agreePrivacy || !pendingProfile) return;

    setStatus('success');
    try {
      await updateSchoolProfile({
        ...schoolProfile,
        ...pendingProfile
      });

      try {
        localStorage.removeItem('formease-license-offline-limit');
      } catch { /* ignore */ }

      redirectTimerRef.current = window.setTimeout(async () => {
        await useAuthStore.getState().logout();
        if (!pendingProfile.is_trial) {
          // Tell App to re-query the main-process license verdict
          window.dispatchEvent(new Event('formease-license-changed'));
        }
      }, 2500);
    } catch {
      setStatus('error');
      setErrorMessage('Failed to finalize activation profile.');
    }
  };

  const handleDeclineEula = () => {
    setStatus('error');
    setErrorMessage('Activation cancelled. You must read and accept the Terms and Conditions and Privacy Policy to activate the application.');
    setPendingProfile(null);
    setAgreeTerms(false);
    setAgreePrivacy(false);
  };

  const handleReset = async () => {
    if (window.confirm('WARNING: This will PERMANENTLY delete all data. Are you sure?')) {
      try {
        const { db } = await import('../services/database');
        await db.nukeDatabase();
        window.location.reload();
      } catch {
        alert('Failed to reset system.');
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0A192F] relative overflow-hidden font-sans p-4">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-8 md:p-10 shadow-2xl overflow-hidden relative">
          
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-12">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20 mb-8">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-black text-white mb-2">Success!</h2>
                <p className="text-slate-400 font-medium">{pendingProfile?.is_trial ? 'Trial started. You have 1 hour.' : 'FormEase Pro is now unlocked.'}</p>
                <div className="mt-8 flex items-center gap-2 text-green-400 font-bold text-xs uppercase tracking-widest animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Restarting app...
                </div>
              </motion.div>
            ) : status === 'eula' ? (
              <motion.div key="eula" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col h-full space-y-5">
                <div className="text-center">
                  <h2 className="text-2xl font-black text-white leading-tight">License Agreement</h2>
                  <p className="text-xs text-slate-400 font-medium mt-1">Please read and accept the terms to finalize activation.</p>
                </div>

                {/* Doc Content Box */}
                <div className="bg-slate-950/40 border border-white/5 rounded-2xl overflow-hidden flex flex-col h-80">
                  {/* Tab Selector */}
                  <div className="bg-slate-900 flex border-b border-white/5 p-1 gap-1 shrink-0">
                    <button
                      onClick={() => setEulaTab('terms')}
                      className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                        eulaTab === 'terms' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Terms & Conditions
                    </button>
                    <button
                      onClick={() => setEulaTab('privacy')}
                      className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                        eulaTab === 'privacy' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Privacy Policy
                    </button>
                  </div>

                  {/* Scrollable text */}
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar text-left space-y-4 bg-slate-950/20">
                    {(eulaTab === 'terms' ? TERMS_AND_CONDITIONS : PRIVACY_POLICY).map(sec => (
                      <div key={sec.id} className="space-y-1.5">
                        <h4 className="text-xs font-black text-white">{sec.title}</h4>
                        {sec.content.map((p, idx) => (
                          <p key={idx} className="text-[11px] text-slate-400 leading-relaxed font-medium">
                            {p}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer group text-left">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 w-4.5 h-4.5 rounded bg-white/5 border border-white/10 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-300 font-bold group-hover:text-white transition-colors leading-relaxed">
                      I agree to the FormEase Pro Terms and Conditions
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group text-left">
                    <input
                      type="checkbox"
                      checked={agreePrivacy}
                      onChange={(e) => setAgreePrivacy(e.target.checked)}
                      className="mt-0.5 w-4.5 h-4.5 rounded bg-white/5 border border-white/10 text-emerald-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-300 font-bold group-hover:text-white transition-colors leading-relaxed">
                      I agree to the FormEase Pro Privacy Policy
                    </span>
                  </label>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleDeclineEula}
                    className="flex-1 py-3.5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    Decline
                  </button>
                  <button
                    onClick={handleAcceptEula}
                    disabled={!agreeTerms || !agreePrivacy}
                    className={`flex-1 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${
                      agreeTerms && agreePrivacy
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Accept & Proceed
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" exit={{ opacity: 0, scale: 0.95 }}>
                <div className="flex flex-col items-center text-center mb-10">
                  <div className={`w-16 h-16 ${isExpired ? 'bg-red-600' : 'bg-blue-600'} rounded-2xl flex items-center justify-center shadow-lg mb-6 relative group`}>
                    <ShieldCheck className="w-8 h-8 text-white" />
                    <div className="absolute -bottom-2 -right-2 bg-slate-800 border border-white/20 rounded-lg p-1.5 shadow-xl">
                       {currentPlatform === 'windows' ? <Monitor className="w-3 h-3 text-blue-400" /> : <Apple className="w-3 h-3 text-blue-400" />}
                    </div>
                  </div>
                  <h1 className="text-3xl font-black text-white tracking-tight mb-2">
                    {isExpired ? 'Access Expired' : 'Product Activation'}
                  </h1>
                  <p className="text-slate-400 text-sm font-medium">
                    {isExpired ? 'Your access has ended. Please enter a new key to continue.' : 'Unlock the full power of FormEase Pro'}
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Reset Warning */}
                  {wasLicenseReset && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-red-400 uppercase tracking-widest">License Disconnected</p>
                        <p className="text-[10px] text-red-200/50 font-bold leading-relaxed">This device has been disconnected from the license by an administrator. Please reactivate or use a different key.</p>
                      </div>
                    </motion.div>
                  )}


                  {/* Trial Option (Only if not already used and not activated) */}
                  {!schoolProfile.is_activated && !schoolProfile.is_trial && (
                    <button 
                      onClick={handleStartTrial}
                      disabled={status === 'activating'}
                      className="w-full p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between hover:bg-amber-500/20 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                          <Zap className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-black text-white uppercase tracking-widest">Start 1-Hour Trial</p>
                          <p className="text-[10px] text-amber-200/50 font-bold">Experience all features for free</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}

                  <div className="relative flex items-center gap-4 py-2">
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Or Activation Key</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Serial Key</label>
                       <span className="text-[9px] font-black text-blue-500/50 uppercase tracking-widest">For {currentPlatform === 'windows' ? 'Windows' : 'macOS'}</span>
                    </div>
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => handleKeyChange(e.target.value)}
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      maxLength={19}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm font-mono font-bold tracking-widest focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                  </div>

                  {/* Online Licensing Portal Link */}
                  <a
                    href="https://formease-licensing.web.app"
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 bg-blue-600/10 border border-blue-500/20 hover:border-blue-500/40 rounded-2xl flex items-center justify-between transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600/20 rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
                        <Key className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black text-white">Need a License Key?</p>
                        <p className="text-[10px] text-blue-300/70 font-medium">Get a 1-Year Commercial License online (GCash / Maya / Landbank)</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform shrink-0" />
                  </a>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                    <input
                      type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                      placeholder="Juan A. Dela Cruz"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm font-bold focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <AnimatePresence>
                    {status === 'error' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {errorMessage}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={handleActivate} disabled={status === 'activating'}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3"
                  >
                    {status === 'activating' ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Activate Now</span>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="mt-8 flex flex-col items-center gap-4">
          <button onClick={handleReset} className="text-[9px] text-slate-600 hover:text-red-500 font-black uppercase tracking-widest transition-colors">
            Reset All Data
          </button>
          <div className="flex items-center gap-3">
             <a href="https://facebook.com/xshame14" target="_blank" rel="noreferrer" className="text-[9px] text-blue-400 font-black uppercase tracking-widest hover:underline">Message Developer</a>
             <div className="w-1 h-1 bg-slate-700 rounded-full" />
             <p className="text-slate-600 text-[9px] font-bold uppercase tracking-widest">ID: {machineId.slice(0, 8)}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
