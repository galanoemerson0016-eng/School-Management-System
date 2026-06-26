/**
 * School-wide ID template/branding controls. Edits a working IdCardConfig; the
 * page persists it onto schoolProfile.id_card_config. Gated by canManageIdTemplates.
 */
import type { IdCardConfig, IdCardTemplate } from '../../types';

const COLOR_PRESETS = [
    { name: 'DepEd Classic', primary: '#0A3D91', accent: '#ed1c24' },
    { name: 'Ivy Green/Gold', primary: '#15803d', accent: '#D4AF37' },
    { name: 'Maroon/Gold', primary: '#7f1d1d', accent: '#D4AF37' },
    { name: 'Navy/Yellow', primary: '#1e3a8a', accent: '#eab308' },
    { name: 'Sleek Slate/Amber', primary: '#1e293b', accent: '#f59e0b' },
];

const TEMPLATES: { id: IdCardTemplate; label: string; hint: string }[] = [
    { id: 'standard', label: 'Standard', hint: 'Full header, balanced layout' },
    { id: 'compact', label: 'Compact', hint: 'Smaller photo, denser text' },
    { id: 'lanyard', label: 'Lanyard', hint: 'Large photo for distance' },
    { id: 'modern', label: 'Modern', hint: 'Gradients, micro-grids, side bars' },
    { id: 'corporate', label: 'Corporate', hint: 'Diagonal cuts, premium frames' },
    { id: 'academic', label: 'Academic', hint: 'Classic double frames, Serif name, elegant' },
    { id: 'minimalist', label: 'Minimalist', hint: 'Asymmetric, thin lines, offset clean layout' },
    { id: 'playful', label: 'Playful', hint: 'Curved waves, circular photo, vibrant pills' },
    { id: 'eco', label: 'Eco / Natural', hint: 'Earthy textures, organic leaf watermarks, round accents' },
    { id: 'glass', label: 'Glassmorphism', hint: 'Frosted overlays, colorful backdrop blur, premium depth' },
    { id: 'badges', label: 'Academy / Badge', hint: 'Bold header chevron, dynamic curved bottom, solid layout' },
    { id: 'aurora', label: 'Aurora Gradient', hint: 'Fluid multi-color mesh gradients, translucent panels' },
];

const TOGGLES: { key: keyof IdCardConfig['show']; label: string }[] = [
    { key: 'qr', label: 'QR Code' },
    { key: 'gradeSection', label: 'Grade & Section' },
    { key: 'signature', label: 'Principal Signature (back)' },
    { key: 'address', label: 'School Address (back)' },
    { key: 'slot', label: 'Lanyard Slot Punch' },
];

interface Props {
    config: IdCardConfig;
    onChange: (patch: Partial<IdCardConfig>) => void;
    canEdit: boolean;
    logoUrl?: string;
    signatureUrl?: string;
}

export function IdTemplateSettings({ config, onChange, canEdit, logoUrl, signatureUrl }: Props) {
    const set = <K extends keyof IdCardConfig>(key: K, val: IdCardConfig[K]) => onChange({ [key]: val } as Partial<IdCardConfig>);
    const setShow = (key: keyof IdCardConfig['show'], val: boolean) => onChange({ show: { ...config.show, [key]: val } });

    return (
        <fieldset disabled={!canEdit} className="space-y-5 disabled:opacity-60">
            <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Template</label>
                <div className="grid grid-cols-3 gap-1">
                    {TEMPLATES.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => set('template', t.id)}
                            className={`text-center px-1 py-1.5 rounded-lg border transition-colors flex items-center justify-center min-h-[32px] ${
                                config.template === t.id
                                    ? 'border-deped-blue bg-deped-blue/5 ring-1 ring-deped-blue'
                                    : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <span className="text-[10px] font-bold text-slate-800 leading-none">{t.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">Show / Hide</label>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {TOGGLES.map((t) => (
                        <label key={t.key} className="flex items-start gap-1.5 text-xs text-slate-600 cursor-pointer select-none leading-tight hover:text-slate-800">
                            <input
                                type="checkbox"
                                checked={config.show[t.key]}
                                onChange={(e) => setShow(t.key, e.target.checked)}
                                className="accent-deped-blue w-3.5 h-3.5 mt-0.5 shrink-0"
                            />
                            <span>{t.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Primary Color</label>
                    <div className="flex items-center gap-1.5">
                        <input
                            type="color"
                            value={config.primaryColor || '#0A3D91'}
                            onChange={(e) => set('primaryColor', e.target.value)}
                            className="w-7 h-7 rounded border border-slate-200 cursor-pointer shrink-0"
                        />
                        <input
                            type="text"
                            value={config.primaryColor || '#0A3D91'}
                            onChange={(e) => set('primaryColor', e.target.value)}
                            className="w-full min-w-0 px-1.5 py-1 text-xs border border-slate-200 rounded-lg font-mono"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Accent Color</label>
                    <div className="flex items-center gap-1.5">
                        <input
                            type="color"
                            value={config.accentColor || '#ed1c24'}
                            onChange={(e) => set('accentColor', e.target.value)}
                            className="w-7 h-7 rounded border border-slate-200 cursor-pointer shrink-0"
                        />
                        <input
                            type="text"
                            value={config.accentColor || '#ed1c24'}
                            onChange={(e) => set('accentColor', e.target.value)}
                            className="w-full min-w-0 px-1.5 py-1 text-xs border border-slate-200 rounded-lg font-mono"
                        />
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-100 pt-3.5 space-y-3.5">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Header Typography</span>
                <div className="grid grid-cols-2 gap-2.5">
                    <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">Text Color</label>
                        <div className="flex items-center gap-1.5">
                            <input
                                type="color"
                                value={config.headerTextColor || '#ffffff'}
                                onChange={(e) => set('headerTextColor', e.target.value)}
                                className="w-7 h-7 rounded border border-slate-200 cursor-pointer shrink-0"
                            />
                            <input
                                type="text"
                                value={config.headerTextColor || '#ffffff'}
                                onChange={(e) => set('headerTextColor', e.target.value)}
                                className="w-full min-w-0 px-1.5 py-1 text-xs border border-slate-200 rounded-lg font-mono"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">Font Family</label>
                        <select
                            value={config.headerFontFamily || 'sans-serif'}
                            onChange={(e) => set('headerFontFamily', e.target.value as IdCardConfig['headerFontFamily'])}
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white h-7 font-sans"
                        >
                            <option value="sans-serif">Sans-Serif (Modern)</option>
                            <option value="serif">Serif (Elegant)</option>
                            <option value="monospace">Monospace (Classic)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[10px] font-semibold text-slate-600">Font Size Scale</label>
                        <span className="text-[10px] font-mono text-slate-500">{Math.round((config.headerFontSizeScale ?? 1.0) * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min={50}
                        max={150}
                        step={1}
                        value={Math.round((config.headerFontSizeScale ?? 1.0) * 100)}
                        onChange={(e) => set('headerFontSizeScale', parseInt(e.target.value) / 100)}
                        className="w-full h-1.5 accent-deped-blue cursor-pointer"
                    />
                </div>
            </div>

            {/* School Presets */}
            <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Color Presets</label>
                <div className="flex flex-wrap gap-1.5">
                    {COLOR_PRESETS.map((p) => (
                        <button
                            key={p.name}
                            type="button"
                            onClick={() => onChange({ primaryColor: p.primary, accentColor: p.accent })}
                            className="group flex items-center gap-1.5 px-2 py-1 rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all select-none"
                            title={p.name}
                        >
                            <div className="flex gap-0.5 items-center">
                                <div style={{ background: p.primary }} className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" />
                                <div style={{ background: p.accent }} className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" />
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-700">{p.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="border-t border-slate-100 pt-3.5 space-y-3">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">School Identity & Year Overrides</span>
                <div className="grid grid-cols-2 gap-2.5">
                    <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">Department</label>
                        <input
                            type="text"
                            placeholder="e.g. Department of Education"
                            value={config.deptName || ''}
                            onChange={(e) => set('deptName', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md placeholder:text-slate-400 bg-white"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">Region</label>
                        <input
                            type="text"
                            placeholder="e.g. Region III"
                            value={config.regionName || ''}
                            onChange={(e) => set('regionName', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md placeholder:text-slate-400 bg-white"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">Schools Division</label>
                        <input
                            type="text"
                            placeholder="e.g. Schools Division of..."
                            value={config.divisionName || ''}
                            onChange={(e) => set('divisionName', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md placeholder:text-slate-400 bg-white"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">District</label>
                        <input
                            type="text"
                            placeholder="e.g. Victoria East District"
                            value={config.districtName || ''}
                            onChange={(e) => set('districtName', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md placeholder:text-slate-400 bg-white"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                    <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">Validity (back)</label>
                        <input
                            type="text"
                            placeholder="e.g. S.Y. 2026-2027"
                            value={config.validityText || ''}
                            onChange={(e) => set('validityText', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md placeholder:text-slate-400 bg-white"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">Emergency Header (back)</label>
                        <input
                            type="text"
                            placeholder="e.g. In Case of Emergency..."
                            value={config.emergencyText || ''}
                            onChange={(e) => set('emergencyText', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md placeholder:text-slate-400 bg-white"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Signatory (back)</label>
                    <input
                        type="text"
                        placeholder="Defaults to School Head name"
                        value={config.signatoryName || ''}
                        onChange={(e) => set('signatoryName', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md placeholder:text-slate-400"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Position</label>
                    <input
                        type="text"
                        placeholder="e.g. Principal II"
                        value={config.signatoryPosition || ''}
                        onChange={(e) => set('signatoryPosition', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md placeholder:text-slate-400"
                    />
                </div>
            </div>

            {(logoUrl || signatureUrl) && (
                <div className="border-t border-slate-100 pt-3.5 space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Active Branding Assets</label>
                    <div className="grid grid-cols-2 gap-2">
                        {logoUrl && (
                            <div className="p-2 border border-slate-150 rounded-lg bg-slate-50/50 flex flex-col items-center gap-1 shadow-sm">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">School Logo</span>
                                <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                            </div>
                        )}
                        {signatureUrl && (
                            <div className="p-2 border border-slate-150 rounded-lg bg-slate-50/50 flex flex-col items-center gap-1 shadow-sm">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Signature</span>
                                <img src={signatureUrl} alt="Signature" className="h-8 max-w-[45px] object-contain" />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </fieldset>
    );
}
