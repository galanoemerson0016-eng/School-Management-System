import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, ShieldCheck, ArrowRight, Lock, User, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useAppStore } from '../stores';

export function ActivationPage() {
  const { updateSchoolProfile } = useAppStore();
  const [key, setKey] = useState('');
  const [fullName, setFullName] = useState('');
  const [machineId, setMachineId] = useState('Detecting Hardware...');
  const [status, setStatus] = useState<'idle' | 'activating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch unique Hardware ID from Electron on mount
  React.useEffect(() => {
    const fetchId = async () => {
      try {
        const id = await (window as any).electronAPI.getMachineId();
        setMachineId(id.toUpperCase());
      } catch (e) {
        setMachineId('BROWSER-' + Math.random().toString(36).substring(2, 10).toUpperCase());
      }
    };
    fetchId();
  }, []);

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
      const projectId = 'form-ease-app';
      const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/artifacts/g7-special/public/data/licenses/${serial}`;

      // 1. Fetch License Data via REST API
      const response = await fetch(baseUrl);
      
      if (response.status === 404) {
        throw new Error(`Serial Key "${serial}" was not found in our records.`);
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Server connection failed.');
      }

      const docData = await response.json();
      const fields = docData.fields || {};
      
      const existingMachineId = fields.machine_id?.stringValue || '';

      // 2. Machine ID Check
      if (existingMachineId && existingMachineId !== machineId) {
        throw new Error('This license is already registered to another computer.');
      }

      // 3. Update Machine ID if needed via PATCH
      if (!existingMachineId) {
        const patchUrl = `${baseUrl}?updateMask.fieldPaths=machine_id&updateMask.fieldPaths=activated_at&updateMask.fieldPaths=registered_to&updateMask.fieldPaths=status`;
        
        await fetch(patchUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              machine_id: { stringValue: machineId },
              activated_at: { timestampValue: new Date().toISOString() },
              registered_to: { stringValue: fullName.trim() },
              status: { stringValue: 'activated' }
            }
          })
        });
      }
      
      // 4. Update Local Store
      await updateSchoolProfile({
        ...useAppStore.getState().schoolProfile,
        is_activated: true,
        activation_key: serial,
        adviser_name: fullName.trim()
      });
      
      setStatus('success');
      
      // 5. Success Transition
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Something went wrong. Please check your internet.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0A192F] relative overflow-hidden font-sans">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-lg p-8"
      >
        <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-10 shadow-2xl overflow-hidden relative">
          
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center py-12"
              >
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20 mb-8">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-black text-white mb-2">Activated!</h2>
                <p className="text-slate-400 font-medium">FormEase G7 Special is now unlocked.</p>
                <div className="mt-8 flex items-center gap-2 text-green-400 font-bold text-xs uppercase tracking-widest animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Preparing Dashboard...
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" exit={{ opacity: 0, scale: 0.95 }}>
                {/* Header */}
                <div className="flex flex-col items-center text-center mb-10">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 mb-6">
                    <ShieldCheck className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-3xl font-black text-white tracking-tight mb-2">Product Activation</h1>
                  <p className="text-slate-400 text-sm font-medium tracking-wide">Enter your credentials to unlock FormEase</p>
                </div>

                <div className="space-y-6">
                  {/* Serial Key */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Serial License Key</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Key className="h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => setKey(e.target.value.toUpperCase())}
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-bold placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all tracking-widest"
                      />
                    </div>
                  </div>

                  {/* Machine ID */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Device Fingerprint</label>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                      <code className="text-xs text-blue-400 font-mono font-bold">{machineId}</code>
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">Locked</span>
                    </div>
                  </div>

                  {/* Adviser Info */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Adviser Information (Permanent)</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Example: Juan A. Dela Cruz"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-bold placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                      />
                    </div>
                  </div>

                  {/* Lock Warning */}
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4">
                    <div className="flex gap-3">
                      <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-200/60 leading-relaxed font-medium">
                        The Adviser Name will be permanently locked into all official scholastic records for this license.
                      </p>
                    </div>
                  </div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {status === 'error' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {errorMessage}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="button"
                    onClick={handleActivate}
                    disabled={status === 'activating'}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 group"
                  >
                    {status === 'activating' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Activate License</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <p className="text-center mt-8 text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
          Powered by FormEase Pro
        </p>
      </motion.div>
    </div>
  );
}
