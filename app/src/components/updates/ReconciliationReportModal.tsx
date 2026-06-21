import { useUpdateStore } from '../../stores/update-store';
import { ShieldCheck, ShieldAlert, ArrowLeftRight, Check, X, Undo2 } from 'lucide-react';

export function ReconciliationReportModal() {
  const { reconciliationReport, clearReconciliationReport, rollbackToPreUpdateBackup } = useUpdateStore();

  if (!reconciliationReport) return null;

  const isSuccess = reconciliationReport.status === 'success';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-100 p-4 animate-in fade-in duration-300">
      <div className="relative bg-white dark:bg-[#0d1225] border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className={`p-6 text-white text-center shrink-0 ${isSuccess ? 'bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-700' : 'bg-linear-to-r from-rose-600 via-red-600 to-rose-700'}`}>
          {isSuccess ? (
            <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-white/95 drop-shadow-md" />
          ) : (
            <ShieldAlert className="w-12 h-12 mx-auto mb-2 text-white/95 drop-shadow-md animate-bounce" />
          )}
          <h2 className="text-lg font-black uppercase tracking-wider">Data Reconciliation Report</h2>
          <p className="text-xs text-white/80 font-medium mt-0.5">Post-Update Validation & Reconciliation Check</p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Brief info */}
          <div className="text-center space-y-1">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Version Upgrade Details</p>
            <div className="flex items-center justify-center gap-2 text-sm font-extrabold text-slate-700 dark:text-gray-200">
              <span className="bg-slate-100 dark:bg-white/5 px-2.5 py-0.5 rounded-md">v{reconciliationReport.fromVersion}</span>
              <ArrowLeftRight className="w-4 h-4 text-slate-400" />
              <span className="bg-slate-100 dark:bg-white/5 px-2.5 py-0.5 rounded-md">v{reconciliationReport.toVersion}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Checked at: {new Date(reconciliationReport.timestamp).toLocaleString()}
            </p>
          </div>

          {/* Table counts list */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Database Table Counts Comparison</h3>
            <div className="divide-y divide-slate-100 dark:divide-white/5 border border-slate-150 dark:border-white/5 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-white/2">
              <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">
                <span>Record Category</span>
                <div className="flex items-center gap-6">
                  <span>Before</span>
                  <span>After</span>
                  <span className="w-12 text-right">Status</span>
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                {reconciliationReport.details.map((row: { table: string; before: number; after: number; match: boolean }) => (
                  <div key={row.table} className="flex items-center justify-between p-3 text-xs font-bold">
                    <span className="text-slate-600 dark:text-gray-300 capitalize">
                      {row.table.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <div className="flex items-center gap-6">
                      <span className="font-mono text-slate-500 w-8 text-right tabular-nums">{row.before}</span>
                      <span className="font-mono text-slate-500 w-8 text-right tabular-nums">{row.after}</span>
                      <span className="w-12 flex justify-end">
                        {row.match ? (
                          <span className="bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 p-0.5 rounded-full">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-0.5 rounded-full">
                            <X className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status-specific warning or success message */}
          {isSuccess ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 text-center space-y-1.5">
              <h4 className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Preservation Successful</h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium leading-relaxed">
                100% of your records match the pre-update state. All student profiles, class records, enrollments, and academic configurations have been successfully preserved.
              </p>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-950/15 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 text-center space-y-1.5 animate-pulse">
              <h4 className="text-xs font-extrabold text-red-800 dark:text-red-400 uppercase tracking-wider">⚠️ Data Discrepancy Alert</h4>
              <p className="text-xs text-red-700 dark:text-red-300 font-bold leading-relaxed">
                One or more record counts do not reconcile. This could indicate a migration failure. Please perform an emergency rollback to restore the pre-update backup.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            {!isSuccess && reconciliationReport.backupFilename && (
              <button
                onClick={() => rollbackToPreUpdateBackup(reconciliationReport.backupFilename!)}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-[13px] uppercase tracking-wider rounded-2xl shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Undo2 className="w-4 h-4" />
                Rollback & Restore Pre-Update Backup
              </button>
            )}

            <button
              onClick={clearReconciliationReport}
              className={`w-full py-3.5 font-black text-[13px] uppercase tracking-wider rounded-2xl transition-all cursor-pointer ${isSuccess ? 'bg-slate-800 hover:bg-slate-700 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:text-gray-200'}`}
            >
              {isSuccess ? 'Acknowledge & Continue' : 'Ignore & Proceed (Not Recommended)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
