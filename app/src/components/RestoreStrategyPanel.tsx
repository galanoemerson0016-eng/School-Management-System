/**
 * Restore Strategy Selection Panel
 * Allows users to choose how to restore data and preview changes
 */

import { useState } from 'react';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import type { RestoreStrategy } from '../utils/restore-options';
import {
    RESTORE_STRATEGIES,
    generateRestorePreview,
    generateRestorePlan,
} from '../utils/restore-options';
import type { ComprehensiveBackup } from '../utils/backup-restore';

interface RestoreCurrentData {
    students?: Array<{ id?: string; lrn?: string }>;
    sections?: Array<{ id: string }>;
    subjects?: Array<{ id: string }>;
    users?: Array<{ uid: string }>;
}

interface RestoreStrategyPanelProps {
    backup: ComprehensiveBackup;
    currentData: RestoreCurrentData;
    selectedCategories: Record<string, boolean>;
    onStrategySelect: (strategy: RestoreStrategy) => void;
    isLoading?: boolean;
}

export function RestoreStrategyPanel({
    backup,
    currentData,
    selectedCategories,
    onStrategySelect,
    isLoading = false,
}: RestoreStrategyPanelProps) {
    const [selectedStrategy, setSelectedStrategy] = useState<RestoreStrategy>('merge');
    const [showPreview, setShowPreview] = useState(false);

    const preview = generateRestorePreview(
        currentData,
        backup,
        selectedStrategy,
        selectedCategories
    );

    const handleStrategySelect = (strategy: RestoreStrategy) => {
        setSelectedStrategy(strategy);
        onStrategySelect(strategy);
    };

    const strategies: RestoreStrategy[] = ['replace', 'merge', 'skip_existing'];

    return (
        <div className="space-y-4">
            {/* Strategy Selection Cards */}
            <div className="space-y-2">
                <p className="font-semibold text-gray-800 text-sm">Restore Strategy</p>
                <div className="grid grid-cols-3 gap-2">
                    {strategies.map(strategy => {
                        const config = RESTORE_STRATEGIES[strategy];
                        const isSelected = selectedStrategy === strategy;

                        return (
                            <button
                                key={strategy}
                                onClick={() => handleStrategySelect(strategy)}
                                disabled={isLoading}
                                className={`p-3 rounded-lg border-2 transition-all text-left disabled:opacity-50 ${
                                    isSelected
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                            >
                                <p className="text-2xl mb-1">{config.icon}</p>
                                <p className="font-bold text-xs text-gray-800">{config.name}</p>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {config.description.split('.')[0]}
                                </p>
                                {config.riskLevel !== 'none' && (
                                    <div className="mt-2 inline-block px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">
                                        {config.riskLevel.toUpperCase()}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Strategy Description */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                    <strong>
                        {RESTORE_STRATEGIES[selectedStrategy].name}:
                    </strong>{' '}
                    {RESTORE_STRATEGIES[selectedStrategy].description}
                </p>
            </div>

            {/* Risk Warning */}
            {RESTORE_STRATEGIES[selectedStrategy].riskLevel !== 'none' && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-200 flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">
                        <strong>⚠️ Warning:</strong> This strategy will make destructive changes to
                        your database. Please ensure you have a recent backup before proceeding.
                    </p>
                </div>
            )}

            {/* Preview Button */}
            <button
                onClick={() => setShowPreview(!showPreview)}
                className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-semibold text-sm transition-colors"
            >
                {showPreview ? '−' : '+'} {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>

            {/* Preview Section */}
            {showPreview && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        {/* Will Create */}
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                            <p className="text-xs font-bold text-green-700 uppercase mb-2">
                                Will Create (New)
                            </p>
                            <div className="text-sm space-y-1">
                                {preview.willCreate.students > 0 && (
                                    <p className="text-green-800">
                                        <CheckCircle2 className="w-3 h-3 inline mr-1" />
                                        {preview.willCreate.students} students
                                    </p>
                                )}
                                {preview.willCreate.sections > 0 && (
                                    <p className="text-green-800">
                                        <CheckCircle2 className="w-3 h-3 inline mr-1" />
                                        {preview.willCreate.sections} sections
                                    </p>
                                )}
                                {preview.willCreate.users > 0 && (
                                    <p className="text-green-800">
                                        <CheckCircle2 className="w-3 h-3 inline mr-1" />
                                        {preview.willCreate.users} users
                                    </p>
                                )}
                                {Object.values(preview.willCreate).every(v => v === 0) && (
                                    <p className="text-green-700 italic">No new records</p>
                                )}
                            </div>
                        </div>

                        {/* Will Overwrite */}
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <p className="text-xs font-bold text-yellow-700 uppercase mb-2">
                                Will {selectedStrategy === 'replace' ? 'Replace' : 'Update'}
                            </p>
                            <div className="text-sm space-y-1">
                                {preview.willOverwrite.students > 0 && (
                                    <p className="text-yellow-800">
                                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                                        {preview.willOverwrite.students} students
                                    </p>
                                )}
                                {preview.willOverwrite.sections > 0 && (
                                    <p className="text-yellow-800">
                                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                                        {preview.willOverwrite.sections} sections
                                    </p>
                                )}
                                {preview.willOverwrite.users > 0 && (
                                    <p className="text-yellow-800">
                                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                                        {preview.willOverwrite.users} users
                                    </p>
                                )}
                                {Object.values(preview.willOverwrite).every(v => v === 0) && (
                                    <p className="text-yellow-700 italic">No conflicts</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Estimate Time */}
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                        <p className="text-xs font-bold text-purple-700 uppercase mb-1">
                            Estimated Duration
                        </p>
                        <p className="text-sm text-purple-800">{preview.estimatedTime}</p>
                    </div>

                    {/* Conflicts List */}
                    {preview.conflicts.length > 0 && (
                        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                            <p className="text-xs font-bold text-red-700 uppercase mb-2">
                                Changes Summary
                            </p>
                            <div className="text-sm space-y-1">
                                {preview.conflicts.map((conflict, idx) => (
                                    <p key={idx} className="text-red-800">
                                        <span className="font-semibold">{conflict.type}:</span>{' '}
                                        {conflict.description}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Full Plan */}
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs font-bold text-gray-700 uppercase mb-2">
                            Full Operation Plan
                        </p>
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap wrap-break-word overflow-auto max-h-48 font-mono">
                            {generateRestorePlan(
                                preview,
                                new Date().toLocaleString()
                            )}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
