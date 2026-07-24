/**
 * School-wide ID template/branding controls. Edits a working IdCardConfig; the
 * page persists it onto schoolProfile.id_card_config. Gated by canManageIdTemplates.
 */
import { useState } from 'react';
import type { IdCardConfig, IdCardTemplate } from '../../types';
import { ChevronDown, ChevronRight } from 'lucide-react';

const COLOR_PRESETS = [
    { name: 'DepEd Classic', primary: '#0A3D91', accent: '#ed1c24' },
    { name: 'Ivy Green/Gold', primary: '#15803d', accent: '#D4AF37' },
    { name: 'Maroon/Gold', primary: '#7f1d1d', accent: '#D4AF37' },
    { name: 'Navy/Yellow', primary: '#1e3a8a', accent: '#eab308' },
    { name: 'Sleek Slate/Amber', primary: '#1e293b', accent: '#f59e0b' },
];

const GRADIENT_PRESETS = [
    { name: 'Sunset Glow', primary: '#ff5e62', accent: '#ff9966' },
    { name: 'Ocean Breeze', primary: '#2b5876', accent: '#4e4376' },
    { name: 'Neon Purple', primary: '#f857a6', accent: '#ff5858' },
    { name: 'Forest Grass', primary: '#11998e', accent: '#38ef7d' },
    { name: 'Golden Glam', primary: '#f12711', accent: '#f5af19' },
    { name: 'Aurora Sky', primary: '#a18cd1', accent: '#fbc2eb' },
];

const QUICK_SWATCHES = [
    '#0A3D91', '#ed1c24', '#15803d', '#D4AF37', 
    '#1e3a8a', '#eab308', '#0284c7', '#10b981', 
    '#8b5cf6', '#f43f5e', '#1e293b', '#ffffff'
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
    { key: 'slot', label: 'Lanyard Slot Punch' },
];

interface Props {
    config: IdCardConfig;
    onChange: (patch: Partial<IdCardConfig>) => void;
    canEdit: boolean;
}

export function IdTemplateSettings({ config, onChange, canEdit }: Props) {
    const set = <K extends keyof IdCardConfig>(key: K, val: IdCardConfig[K]) => onChange({ [key]: val } as Partial<IdCardConfig>);
    const setShow = (key: keyof IdCardConfig['show'], val: boolean) => onChange({ show: { ...config.show, [key]: val } });

    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        layout: true,
        colors: false,
        typography: false,
        identity: false,
    });

    const toggle = (section: string) => {
        setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    const renderHeader = (id: string, label: string) => {
        const isOpen = expanded[id];
        return (
            <button
                type="button"
                onClick={() => toggle(id)}
                className="w-full flex items-center justify-between py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 border-b border-slate-150 select-none cursor-pointer outline-none mb-3"
            >
                <span>{label}</span>
                {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </button>
        );
    };

    return (
        <fieldset disabled={!canEdit} className="space-y-4 disabled:opacity-60 text-slate-800">
            {/* Section 1: Layout & Templates */}
            <div className="space-y-3">
                {renderHeader('layout', 'Layout & Templates')}
                {expanded.layout && (
                    <div className="space-y-4 pt-1">
                        <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1.5">Template Style</label>
                            <div className="grid grid-cols-3 gap-1">
                                {TEMPLATES.map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => set('template', t.id)}
                                        className={`text-center px-1 py-1.5 rounded-lg border transition-colors flex items-center justify-center min-h-8 cursor-pointer ${
                                            config.template === t.id
                                                ? 'border-deped-blue bg-deped-blue/5 ring-1 ring-deped-blue text-deped-blue'
                                                : 'border-slate-200 hover:border-slate-350 text-slate-700'
                                        }`}
                                    >
                                        <span className="text-[10px] font-bold leading-none">{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-2">Show / Hide Fields</label>
                            <div className="flex flex-col gap-2.5">
                                {TOGGLES.map((t) => (
                                    <div key={t.key} className="space-y-2">
                                        <label className="flex items-start gap-1.5 text-xs text-slate-650 cursor-pointer select-none leading-tight hover:text-slate-900">
                                            <input
                                                type="checkbox"
                                                checked={config.show[t.key]}
                                                onChange={(e) => setShow(t.key, e.target.checked)}
                                                className="accent-deped-blue w-3.5 h-3.5 mt-0.5 shrink-0"
                                            />
                                            <span>{t.label}</span>
                                        </label>

                                        {t.key === 'signature' && config.show.signature && (
                                            <div className="pl-5 space-y-2.5 border-l border-slate-200 ml-1.5 pt-1 pb-1">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-[9px] font-semibold text-slate-500 mb-0.5">Signatory (back)</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Defaults to School Head"
                                                            value={config.signatoryName || ''}
                                                            onChange={(e) => set('signatoryName', e.target.value)}
                                                            className="w-full px-2 py-0.5 text-xs border border-slate-200 rounded bg-white text-slate-805 focus:outline-none shadow-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[9px] font-semibold text-slate-500 mb-0.5">Position</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Principal II"
                                                            value={config.signatoryPosition || ''}
                                                            onChange={(e) => set('signatoryPosition', e.target.value)}
                                                            className="w-full px-2 py-0.5 text-xs border border-slate-200 rounded bg-white text-slate-805 focus:outline-none shadow-sm"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <label className="text-[9px] font-semibold text-slate-500">Signature Scale</label>
                                                            <span className="text-[9px] font-mono text-slate-500">{Math.round((config.signatureScale ?? 1.0) * 100)}%</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min={50}
                                                            max={200}
                                                            step={5}
                                                            value={Math.round((config.signatureScale ?? 1.0) * 100)}
                                                            onChange={(e) => set('signatureScale', parseInt(e.target.value) / 100)}
                                                            className="w-full h-1 cursor-pointer accent-deped-blue bg-slate-200 rounded appearance-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <label className="text-[9px] font-semibold text-slate-500">Vertical Offset (Y)</label>
                                                            <span className="text-[9px] font-mono text-slate-500">{config.signatureOffsetY ?? 0} mm</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min={-10}
                                                            max={10}
                                                            step={1}
                                                            value={config.signatureOffsetY ?? 0}
                                                            onChange={(e) => set('signatureOffsetY', parseInt(e.target.value))}
                                                            className="w-full h-1 cursor-pointer accent-deped-blue bg-slate-200 rounded appearance-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Section 2: Colors & Presets */}
            <div className="space-y-3">
                {renderHeader('colors', 'Colors & Presets')}
                {expanded.colors && (
                    <div className="space-y-4 pt-1">
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
                                        className="w-full min-w-0 px-1.5 py-1 text-xs border border-slate-200 rounded-lg font-mono bg-white text-slate-800 focus:outline-none"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1.5 max-w-37.5">
                                    {QUICK_SWATCHES.map((hex) => (
                                        <button
                                            key={`p-swatch-${hex}`}
                                            type="button"
                                            onClick={() => set('primaryColor', hex)}
                                            style={{ backgroundColor: hex }}
                                            className="w-3.5 h-3.5 rounded-full border border-black/10 hover:scale-110 active:scale-95 transition-all cursor-pointer shrink-0"
                                            title={hex}
                                        />
                                    ))}
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
                                        className="w-full min-w-0 px-1.5 py-1 text-xs border border-slate-200 rounded-lg font-mono bg-white text-slate-800 focus:outline-none"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1.5 max-w-37.5">
                                    {QUICK_SWATCHES.map((hex) => (
                                        <button
                                            key={`a-swatch-${hex}`}
                                            type="button"
                                            onClick={() => set('accentColor', hex)}
                                            style={{ backgroundColor: hex }}
                                            className="w-3.5 h-3.5 rounded-full border border-black/10 hover:scale-110 active:scale-95 transition-all cursor-pointer shrink-0"
                                            title={hex}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Color Presets */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-semibold text-slate-400">Solid Presets</label>
                            <div className="flex flex-wrap gap-1.5">
                                {COLOR_PRESETS.map((p) => (
                                    <button
                                        key={p.name}
                                        type="button"
                                        onClick={() => onChange({ primaryColor: p.primary, accentColor: p.accent })}
                                        className="group flex items-center gap-1.5 px-2 py-1 rounded border border-slate-200 hover:border-slate-350 hover:bg-slate-50 transition-all select-none cursor-pointer"
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

                        {/* Gradient Presets */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-semibold text-slate-400">Gradient Presets</label>
                            <div className="flex flex-wrap gap-1.5">
                                {GRADIENT_PRESETS.map((p) => (
                                    <button
                                        key={p.name}
                                        type="button"
                                        onClick={() => onChange({ primaryColor: p.primary, accentColor: p.accent })}
                                        className="group flex items-center gap-1.5 px-2 py-1 rounded border border-slate-200 hover:border-slate-350 hover:bg-slate-50 transition-all select-none cursor-pointer"
                                        title={p.name}
                                    >
                                        <div 
                                            style={{ background: `linear-gradient(135deg, ${p.primary} 0%, ${p.accent} 100%)` }} 
                                            className="w-5.5 h-2.5 rounded border border-black/10 shrink-0" 
                                        />
                                        <span className="text-[10px] font-semibold text-slate-500 group-hover:text-slate-700">{p.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Section 3: Typography & Fonts */}
            <div className="space-y-3">
                {renderHeader('typography', 'Typography & Fonts')}
                {expanded.typography && (
                    <div className="space-y-4 pt-1">
                        <div className="grid grid-cols-2 gap-2.5">
                            <div>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Text Color</label>
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
                                        className="w-full min-w-0 px-1.5 py-1 text-xs border border-slate-200 rounded-lg font-mono bg-white text-slate-800 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Font Family</label>
                                <select
                                    value={config.headerFontFamily || 'sans-serif'}
                                    onChange={(e) => set('headerFontFamily', e.target.value as IdCardConfig['headerFontFamily'])}
                                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 h-7 font-sans focus:outline-none cursor-pointer"
                                >
                                    <option value="sans-serif">Sans-Serif (Modern)</option>
                                    <option value="serif">Serif (Elegant)</option>
                                    <option value="monospace">Monospace (Classic)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-0.5">
                                <label className="text-[10px] font-semibold text-slate-500">Font Size Scale</label>
                                <span className="text-[10px] font-mono text-slate-655">{Math.round((config.headerFontSizeScale ?? 1.0) * 100)}%</span>
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

                        <div>
                            <div className="flex items-center justify-between mb-0.5">
                                <label className="text-[10px] font-semibold text-slate-500">Watermark Opacity</label>
                                <span className="text-[10px] font-mono text-slate-655">{Math.round((config.watermarkOpacity ?? 0.07) * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={50}
                                step={1}
                                value={Math.round((config.watermarkOpacity ?? 0.07) * 100)}
                                onChange={(e) => set('watermarkOpacity', parseInt(e.target.value) / 100)}
                                className="w-full h-1.5 accent-deped-blue cursor-pointer"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Section 4: School Identity Overrides */}
            <div className="space-y-3">
                {renderHeader('identity', 'School Identity Overrides')}
                {expanded.identity && (
                    <div className="space-y-4 pt-1 animate-fade-in">
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="col-span-2">
                                <label className="block text-[10px] font-semibold text-slate-500 mb-1">School Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Calibungan High School"
                                    value={config.schoolName || ''}
                                    onChange={(e) => set('schoolName', e.target.value)}
                                    className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-md placeholder:text-slate-455 bg-white text-slate-800 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Department</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Department of Education"
                                    value={config.deptName || ''}
                                    onChange={(e) => set('deptName', e.target.value)}
                                    className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-md placeholder:text-slate-455 bg-white text-slate-800 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Region</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Region III"
                                    value={config.regionName || ''}
                                    onChange={(e) => set('regionName', e.target.value)}
                                    className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-md placeholder:text-slate-455 bg-white text-slate-800 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Schools Division</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Schools Division of..."
                                    value={config.divisionName || ''}
                                    onChange={(e) => set('divisionName', e.target.value)}
                                    className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-md placeholder:text-slate-455 bg-white text-slate-800 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-1">District</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Victoria East District"
                                    value={config.districtName || ''}
                                    onChange={(e) => set('districtName', e.target.value)}
                                    className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-md placeholder:text-slate-455 bg-white text-slate-800 focus:outline-none"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Barangay</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Calibungan"
                                    value={config.barangayName || ''}
                                    onChange={(e) => set('barangayName', e.target.value)}
                                    className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-md placeholder:text-slate-455 bg-white text-slate-800 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Municipality</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Victoria"
                                    value={config.municipalityName || ''}
                                    onChange={(e) => set('municipalityName', e.target.value)}
                                    className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-md placeholder:text-slate-455 bg-white text-slate-800 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Province</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Tarlac"
                                    value={config.provinceName || ''}
                                    onChange={(e) => set('provinceName', e.target.value)}
                                    className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-md placeholder:text-slate-455 bg-white text-slate-800 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="w-full">
                            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Emergency Header (back)</label>
                            <input
                                type="text"
                                placeholder="e.g. In Case of Emergency..."
                                value={config.emergencyText || ''}
                                onChange={(e) => set('emergencyText', e.target.value)}
                                className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-md placeholder:text-slate-455 bg-white text-slate-800 focus:outline-none"
                            />
                        </div>
                    </div>
                )}
            </div>
        </fieldset>
    );
}
