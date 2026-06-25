/**
 * Section-scoped student checklist for bulk ID generation. Shows a missing-photo
 * badge so issuers can spot incomplete records, plus select-all / only-with-photo
 * helpers. Selection is a Set<lrn> owned by the page.
 */
import { useMemo } from 'react';
import { Search, ImageOff } from 'lucide-react';
import type { Student } from '../../types';
import { composeNameLastFirst } from '../../services/id-card/idCardData';

interface Props {
    students: Student[];
    selected: Set<string>;
    onToggle: (lrn: string) => void;
    onSelectAll: (lrns: string[]) => void;
    onClear: () => void;
    search: string;
    onSearch: (q: string) => void;
}

export function StudentMultiSelect({ students, selected, onToggle, onSelectAll, onClear, search, onSearch }: Props) {
    const sorted = useMemo(() => {
        const q = search.trim().toLowerCase();
        return [...students]
            .filter((s) => !q || `${s.last_name} ${s.first_name}`.toLowerCase().includes(q) || s.lrn.includes(q))
            .sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''));
    }, [students, search]);

    const withPhoto = sorted.filter((s) => s.photo_url);

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder="Search name or LRN"
                    className="w-full pl-8 pr-2 py-1.5 text-sm border border-slate-200 rounded-lg"
                />
            </div>
            <div className="flex items-center gap-2 text-xs mb-2">
                <button onClick={() => onSelectAll(sorted.map((s) => s.lrn))} className="text-deped-blue font-semibold hover:underline">Select all ({sorted.length})</button>
                <span className="text-slate-300">|</span>
                <button onClick={() => onSelectAll(withPhoto.map((s) => s.lrn))} className="text-deped-blue font-semibold hover:underline">With photo ({withPhoto.length})</button>
                <span className="text-slate-300">|</span>
                <button onClick={onClear} className="text-slate-500 font-semibold hover:underline">Clear</button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                {sorted.length === 0 && (
                    <div className="p-4 text-center text-sm text-slate-400">No students in this section.</div>
                )}
                {sorted.map((s) => (
                    <label key={s.lrn} className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={selected.has(s.lrn)}
                            onChange={() => onToggle(s.lrn)}
                            className="accent-deped-blue w-4 h-4 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                            <div className="text-sm text-slate-800 truncate">{composeNameLastFirst(s)}</div>
                            <div className="text-[11px] text-slate-400">{s.lrn}</div>
                        </div>
                        {!s.photo_url && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">
                                <ImageOff className="w-3 h-3" /> No photo
                            </span>
                        )}
                    </label>
                ))}
            </div>
            <div className="text-xs text-slate-500 mt-2">{selected.size} selected</div>
        </div>
    );
}
