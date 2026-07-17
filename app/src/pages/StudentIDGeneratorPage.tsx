/**
 * Student ID Generator — issue DepEd-style student IDs from existing records.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../stores';
import { useAuthStore } from '../stores/auth-store';
import { 
    ArrowLeft, 
    IdCard, 
    Download, 
    Loader2, 
    Users, 
    User, 
    SlidersHorizontal, 
    Minus, 
    Plus, 
    ImagePlus, 
    Trash2, 
    RotateCcw,
    PanelLeft,
    ChevronDown,
    ChevronRight,
    PenTool,
    Signature
} from 'lucide-react';
import { StudentSelector } from '../components/StudentSelector';
import { canGenerateStudentIds, canManageIdTemplates, filterOfficialSectionsForUser } from '../lib/rbac';
import type { IdCardConfig, Student } from '../types';
import { buildIdCardModel, resolveIdCardConfig, type IdCardViewModel } from '../services/id-card/idCardData';
import { generateBarcodeDataUrl, generateQrDataUrl } from '../services/id-card/codes';
import { prepareModels, chunk, safeFilename } from '../services/id-card/idCardPdf';
import { exportElementsToPdf } from '../utils/pdf-export';
import { IdCardPreview } from '../components/id-card/IdCardPreview';
import { IdCardFront } from '../components/id-card/IdCardFront';
import { IdCardBack } from '../components/id-card/IdCardBack';
import { IdCardSheet } from '../components/id-card/IdCardSheet';
import { sheetCapacity, type SheetPaper } from '../components/id-card/sheetLayout';
import { IdTemplateSettings } from '../components/id-card/IdTemplateSettings';
import { PhotoUploadCrop } from '../components/id-card/PhotoUploadCrop';
import { StudentMultiSelect } from '../components/id-card/StudentMultiSelect';

type Mode = 'individual' | 'bulk';
type ExportLayout = 'sheet' | 'per-card';

interface ExportJob {
    models: IdCardViewModel[];
    layout: ExportLayout;
    paper: SheetPaper;
}

export function StudentIDGeneratorPage() {
    const { students, sections, schoolProfile, updateStudent, updateSchoolProfile, showNotification, setCurrentView, activeSchoolYear } = useAppStore();
    const { user } = useAuthStore();

    const canGenerate = canGenerateStudentIds(user);
    const canEditTemplate = canManageIdTemplates(user);

    const [mode, setMode] = useState<Mode>('individual');
    const [sectionId, setSectionId] = useState('');
    const [individualLrn, setIndividualLrn] = useState<string | null>(null);
    const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
    const [bulkSearch, setBulkSearch] = useState('');
    
    // Collapsible sidebars states
    const [showLeftSidebar, setShowLeftSidebar] = useState(true);
    const [showSettings, setShowSettings] = useState(true);
    
    // Left sidebar collapsible sections
    const [expandedPhoto, setExpandedPhoto] = useState(true);
    const [expandedBg, setExpandedBg] = useState(false);
    const [expandedBranding, setExpandedBranding] = useState(false);

    const [zoomScale, setZoomScale] = useState(1.65);

    const [config, setConfig] = useState<IdCardConfig>(() => resolveIdCardConfig(schoolProfile.id_card_config));
    const [previewModel, setPreviewModel] = useState<IdCardViewModel | null>(null);

    const [exportLayout, setExportLayout] = useState<ExportLayout>('sheet');
    const [exportPaper, setExportPaper] = useState<SheetPaper>('a4');
    const [isExporting, setIsExporting] = useState(false);
    const [exportType, setExportType] = useState<'download' | 'print' | null>(null);
    const [progress, setProgress] = useState(0);
    const [exportJob, setExportJob] = useState<ExportJob | null>(null);

    const stageRef = useRef<HTMLDivElement>(null);
    const frontRef = useRef<HTMLDivElement>(null);
    const backRef = useRef<HTMLDivElement>(null);

    const bgFileInputRef = useRef<HTMLInputElement>(null);
    const sigFileInputRef = useRef<HTMLInputElement>(null);

    const [isUploadingBg, setIsUploadingBg] = useState(false);

    const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        setIsUploadingBg(true);
        try {
            const base64 = await resizeBgImage(file, 1080, 1720);
            setConfig((c) => ({ ...c, bgImageUrl: base64 }));
        } catch (error) {
            console.error('Background upload failed:', error);
            alert('Failed to process image. Please try another one.');
        } finally {
            setIsUploadingBg(false);
            if (bgFileInputRef.current) bgFileInputRef.current.value = '';
        }
    };



    const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result as string;
            await updateSchoolProfile({ head_signature_url: base64 } as Partial<typeof schoolProfile> as typeof schoolProfile);
        };
        reader.readAsDataURL(file);
    };

    const resetBgSettings = () => {
        setConfig((c) => ({
            ...c,
            bgImageUrl: undefined,
            bgImageOpacity: undefined,
            bgImageSize: undefined,
            bgImagePositionX: undefined,
            bgImagePositionY: undefined,
            bgImageScale: undefined,
            bgImageBlur: undefined,
            bgImageBrightness: undefined,
            bgImageApplyToBack: undefined,
        }));
    };

    // Sections visible to this user (advisers scoped to their advisory sections).
    const visibleSections = useMemo(() => {
        return filterOfficialSectionsForUser(user, sections).sort((a, b) => {
            const na = parseInt((a.section_grade_level || '').replace(/\D/g, '')) || 0;
            const nb = parseInt((b.section_grade_level || '').replace(/\D/g, '')) || 0;
            return na !== nb ? na - nb : a.section_name.localeCompare(b.section_name);
        });
    }, [sections, user]);

    const activeSection = visibleSections.find((s) => s.id === sectionId) || null;

    const sectionStudents = useMemo<Student[]>(() => {
        if (!activeSection) return [];
        return students.filter((s) => s.student_section === activeSection.section_name);
    }, [students, activeSection]);

    const selectedStudent = useMemo(
        () => sectionStudents.find((s) => s.lrn === individualLrn) || null,
        [sectionStudents, individualLrn],
    );

    // Persist template config to schoolProfile (debounced) so it survives reloads.
    // IMPORTANT: Only pass { id_card_config } — do NOT spread the whole schoolProfile,
    // because this effect may hold a stale closure and overwrite fields (e.g. logo_url)
    // that were updated from the Institute Profile page.
    useEffect(() => {
        const stored = JSON.stringify(resolveIdCardConfig(schoolProfile.id_card_config));
        if (JSON.stringify(config) === stored) return;
        const t = setTimeout(() => {
            updateSchoolProfile({ id_card_config: config } as Partial<typeof schoolProfile> as typeof schoolProfile);
        }, 600);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config]);

    // Rebuild the live single-card preview (with QR/barcode) when inputs change.
    useEffect(() => {
        let cancelled = false;
        if (!selectedStudent) {
            setPreviewModel(null);
            return;
        }
        const model = buildIdCardModel(selectedStudent, schoolProfile, config, activeSchoolYear);
        (async () => {
            if (model.show.qr) model.qrDataUrl = await generateQrDataUrl(model.qrPayload, { size: 256 });
            if (model.show.barcode) model.barcodeDataUrl = await generateBarcodeDataUrl(model.lrn || model.serial);
            if (!cancelled) setPreviewModel({ ...model });
        })();
        return () => { cancelled = true; };
    }, [selectedStudent, schoolProfile, config, activeSchoolYear]);

    const targets = useMemo<Student[]>(() => {
        if (mode === 'individual') return selectedStudent ? [selectedStudent] : [];
        return sectionStudents.filter((s) => bulkSelected.has(s.lrn));
    }, [mode, selectedStudent, sectionStudents, bulkSelected]);

    const executeExport = async () => {
        if (!canGenerate) return;
        if (targets.length === 0) {
            showNotification('Select at least one student to generate an ID.', 'error');
            return;
        }

        const missing = targets.filter((s) => !s.photo_url).length;
        if (missing > 0) {
            const proceed = window.confirm(`${missing} of ${targets.length} student(s) have no photo. Their IDs will show a "NO PHOTO" placeholder. Continue?`);
            if (!proceed) return;
        }

        setIsExporting(true);
        setExportType('download');
        setProgress(0);
        try {
            const models = await prepareModels(targets, schoolProfile, config, (done, total) =>
                setProgress(Math.round((done / total) * 80)),
                activeSchoolYear
            );
            const layout: ExportLayout = mode === 'individual' ? 'per-card' : exportLayout;
            setExportJob({ models, layout, paper: exportPaper });

            // Wait two frames for the offscreen stage to mount.
            await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
            setProgress(90);

            const nodes = stageRef.current
                ? (Array.from(stageRef.current.querySelectorAll('[data-export-node]')) as HTMLElement[])
                : [];
            if (nodes.length === 0) throw new Error('Nothing to export.');

            const filename =
                mode === 'individual' && selectedStudent
                    ? `ID_${safeFilename(`${selectedStudent.last_name}_${selectedStudent.first_name}`)}`
                    : `Student_IDs_${safeFilename(activeSection?.section_name || 'batch')}`;

            const result = await exportElementsToPdf({
                elements: nodes,
                filename,
                paperSize: layout === 'per-card' ? 'cr80' : exportPaper,
                orientation: layout === 'per-card' ? 'portrait' : 'landscape',
            });

            if (result.cancelled) {
                showNotification('Export cancelled.', 'info');
            } else if (result.success) {
                showNotification(
                    `Generated ${targets.length} ID${targets.length > 1 ? 's' : ''}.`,
                    'success'
                );
                const issuedAt = new Date().toISOString();
                targets.forEach((s) => {
                    const m = models.find((mm) => mm.lrn === s.lrn);
                    void updateStudent(s.lrn, { id_issued_at: issuedAt, id_serial: m?.serial });
                });
            } else {
                showNotification(result.error || 'Export failed.', 'error');
            }
        } catch (err) {
            showNotification(err instanceof Error ? err.message : 'Export failed.', 'error');
        } finally {
            setProgress(100);
            setExportJob(null);
            setIsExporting(false);
            setExportType(null);
        }
    };

    const toggleBulk = (lrn: string) =>
        setBulkSelected((prev) => {
            const next = new Set(prev);
            if (next.has(lrn)) next.delete(lrn);
            else next.add(lrn);
            return next;
        });

    return (
        <div className="h-full flex flex-col overflow-hidden bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                {/* Left: Title & Mode Switcher */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setCurrentView('dashboard')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        
                        {/* Toggle Left Sidebar Button */}
                        <button
                            onClick={() => setShowLeftSidebar((v) => !v)}
                            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                                showLeftSidebar 
                                    ? 'bg-slate-100 border-slate-200 text-slate-800' 
                                    : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                            title={showLeftSidebar ? "Collapse Left Sidebar" : "Expand Left Sidebar"}
                        >
                            <PanelLeft className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2">
                            <IdCard className="w-5 h-5 text-deped-blue" />
                            <h1 className="font-bold text-slate-800 text-base whitespace-nowrap">Student ID Generator</h1>
                        </div>
                    </div>
                    
                    {/* Vertical Divider */}
                    <div className="h-5 w-px bg-slate-200" />

                    {/* Mode switcher */}
                    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 overflow-hidden select-none">
                        <button
                            onClick={() => setMode('individual')}
                            className={`px-3.5 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 rounded-md transition-all ${
                                mode === 'individual'
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <User className="w-3.5 h-3.5" /> Individual
                        </button>
                        <button
                            onClick={() => setMode('bulk')}
                            className={`px-3.5 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 rounded-md transition-all ${
                                mode === 'bulk'
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Users className="w-3.5 h-3.5" /> Bulk
                        </button>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    {previewModel && (
                        <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50 select-none mr-1 shadow-sm">
                            <button
                                onClick={() => setZoomScale((z) => Math.max(1.0, z - 0.15))}
                                className="p-1 rounded hover:bg-white text-slate-600 disabled:opacity-40 transition-colors"
                                disabled={zoomScale <= 1.05}
                                title="Zoom Out"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-semibold text-slate-700 min-w-[36px] text-center select-none">
                                {Math.round(zoomScale * 100)}%
                            </span>
                            <button
                                onClick={() => setZoomScale((z) => Math.min(2.5, z + 0.15))}
                                className="p-1 rounded hover:bg-white text-slate-600 disabled:opacity-40 transition-colors"
                                disabled={zoomScale >= 2.45}
                                title="Zoom In"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    <button
                        onClick={() => setShowSettings((v) => !v)}
                        className={`p-2 rounded-lg border border-slate-200 transition-colors ${showSettings ? 'bg-slate-100 text-deped-blue' : 'text-slate-500 hover:bg-slate-50'}`}
                        title="Template settings"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => executeExport()}
                        disabled={isExporting || targets.length === 0 || !canGenerate}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-40 transition-colors shadow-sm"
                    >
                        {isExporting && exportType === 'download' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {isExporting && exportType === 'download' ? `Generating ${progress}%` : 'Download PDF'}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex min-h-0">
                {/* Left Panel: student selection & assets uploads */}
                {showLeftSidebar && (
                    <div className="w-80 border-r border-slate-200 bg-white p-4 flex flex-col min-h-0 shrink-0">
                        <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-24 min-h-0">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">Section</label>
                                <select
                                    value={sectionId}
                                    onChange={(e) => { setSectionId(e.target.value); setIndividualLrn(null); setBulkSelected(new Set()); }}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                                >
                                    <option value="">Select a section…</option>
                                    {visibleSections.map((s) => (
                                        <option key={s.id} value={s.id}>{s.section_grade_level} – {s.section_name}</option>
                                    ))}
                                </select>
                            </div>

                            {mode === 'individual' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">Student</label>
                                        <StudentSelector
                                            students={sectionStudents}
                                            selectedStudentLrn={individualLrn}
                                            onSelect={setIndividualLrn}
                                            disabled={!activeSection}
                                        />
                                    </div>
                                    
                                    {selectedStudent && (
                                        <div className="space-y-4">
                                            {/* Photo (Collapsible Card) */}
                                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 shadow-sm">
                                                <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5 mb-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedPhoto(!expandedPhoto)}
                                                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600 cursor-pointer select-none focus:outline-none"
                                                    >
                                                        {expandedPhoto ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                                        STUDENT PROFILE PHOTO
                                                    </button>
                                                </div>
                                                {expandedPhoto && (
                                                    <div className="animate-fade-in pt-1">
                                                        <PhotoUploadCrop
                                                            value={selectedStudent.photo_url}
                                                            onChange={(dataUrl) => updateStudent(selectedStudent.lrn, { photo_url: dataUrl })}
                                                            onRemove={() => updateStudent(selectedStudent.lrn, { photo_url: undefined })}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Custom Background (Collapsible Card) */}
                                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 shadow-sm">
                                                <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5 mb-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedBg(!expandedBg)}
                                                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600 cursor-pointer select-none focus:outline-none"
                                                    >
                                                        {expandedBg ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                                        CUSTOM ID BACKGROUND
                                                    </button>
                                                    {expandedBg && config.bgImageUrl && (
                                                        <button
                                                            type="button"
                                                            disabled={!canEditTemplate}
                                                            onClick={resetBgSettings}
                                                            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors"
                                                        >
                                                            <RotateCcw className="w-3 h-3" />
                                                            Reset
                                                        </button>
                                                    )}
                                                </div>
                                                {expandedBg && (
                                                    <div className="space-y-3 animate-fade-in pt-1">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-16 rounded border border-slate-200 bg-white flex items-center justify-center shrink-0 overflow-hidden relative shadow-sm">
                                                                {config.bgImageUrl ? (
                                                                    <img src={config.bgImageUrl} alt="Bg Preview" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="text-[8px] text-slate-400 font-bold text-center px-1">No Custom Bg</span>
                                                                )}
                                                                {isUploadingBg && (
                                                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                                        <Loader2 className="w-4 h-4 text-deped-blue animate-spin" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col gap-1.5 flex-1">
                                                                <button
                                                                    type="button"
                                                                    disabled={!canEditTemplate || isUploadingBg}
                                                                    onClick={() => bgFileInputRef.current?.click()}
                                                                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-deped-blue hover:bg-deped-blue/90 text-white disabled:opacity-40 transition-colors cursor-pointer"
                                                                >
                                                                    <ImagePlus className="w-3.5 h-3.5" />
                                                                    {config.bgImageUrl ? 'Change Bg' : 'Upload Bg'}
                                                                </button>
                                                                {config.bgImageUrl && (
                                                                    <button
                                                                        type="button"
                                                                        disabled={!canEditTemplate || isUploadingBg}
                                                                        onClick={() => setConfig((c) => ({ ...c, bgImageUrl: undefined, bgImageOpacity: undefined, bgImageSize: undefined, bgImagePositionX: undefined, bgImagePositionY: undefined, bgImageScale: undefined, bgImageBlur: undefined, bgImageBrightness: undefined, bgImageApplyToBack: undefined }))}
                                                                        className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-red-200 text-red-655 hover:bg-red-50 transition-colors cursor-pointer"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                        Remove
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <input
                                                                ref={bgFileInputRef}
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={handleBgUpload}
                                                                disabled={!canEditTemplate}
                                                            />
                                                        </div>
                                                        <p className="text-[9px] text-slate-450 leading-normal">
                                                            Upload custom ID background design. Recommended ratio: 54:86. Compressed dynamically.
                                                        </p>

                                                        {config.bgImageUrl && (
                                                            <div className="space-y-3 pt-2 border-t border-dashed border-slate-200">
                                                                {/* Opacity */}
                                                                <div>
                                                                    <div className="flex items-center justify-between mb-0.5">
                                                                        <label className="text-[10px] font-semibold text-slate-600">Opacity</label>
                                                                        <span className="text-[10px] font-mono text-slate-500">{Math.round((config.bgImageOpacity ?? 1) * 100)}%</span>
                                                                    </div>
                                                                    <input
                                                                        type="range"
                                                                        min={0}
                                                                        max={100}
                                                                        step={1}
                                                                        value={Math.round((config.bgImageOpacity ?? 1) * 100)}
                                                                        onChange={(e) => setConfig((c) => ({ ...c, bgImageOpacity: parseInt(e.target.value) / 100 }))}
                                                                        disabled={!canEditTemplate}
                                                                        className="w-full h-1.5 accent-deped-blue cursor-pointer"
                                                                    />
                                                                </div>

                                                                {/* Size Mode */}
                                                                <div>
                                                                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">Size Mode</label>
                                                                    <div className="grid grid-cols-4 gap-0.5">
                                                                        {([['cover', 'Cover'], ['contain', 'Contain'], ['stretch', 'Stretch'], ['actual', 'Actual']] as const).map(([val, label]) => (
                                                                            <button
                                                                                key={val}
                                                                                type="button"
                                                                                disabled={!canEditTemplate}
                                                                                onClick={() => setConfig((c) => ({ ...c, bgImageSize: val }))}
                                                                                className={`py-1 text-[9px] font-bold rounded transition-colors ${
                                                                                    (config.bgImageSize ?? 'cover') === val
                                                                                        ? 'bg-deped-blue text-white shadow-sm'
                                                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                                                }`}
                                                                            >
                                                                                {label}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {/* Position X */}
                                                                <div>
                                                                    <div className="flex items-center justify-between mb-0.5">
                                                                        <label className="text-[10px] font-semibold text-slate-600">Position X</label>
                                                                        <span className="text-[10px] font-mono text-slate-500">{config.bgImagePositionX ?? 50}%</span>
                                                                    </div>
                                                                    <input
                                                                        type="range"
                                                                        min={0}
                                                                        max={100}
                                                                        step={1}
                                                                        value={config.bgImagePositionX ?? 50}
                                                                        onChange={(e) => setConfig((c) => ({ ...c, bgImagePositionX: parseInt(e.target.value) }))}
                                                                        disabled={!canEditTemplate}
                                                                        className="w-full h-1.5 accent-deped-blue cursor-pointer"
                                                                    />
                                                                </div>

                                                                {/* Position Y */}
                                                                <div>
                                                                    <div className="flex items-center justify-between mb-0.5">
                                                                        <label className="text-[10px] font-semibold text-slate-600">Position Y</label>
                                                                        <span className="text-[10px] font-mono text-slate-500">{config.bgImagePositionY ?? 50}%</span>
                                                                    </div>
                                                                    <input
                                                                        type="range"
                                                                        min={0}
                                                                        max={100}
                                                                        step={1}
                                                                        value={config.bgImagePositionY ?? 50}
                                                                        onChange={(e) => setConfig((c) => ({ ...c, bgImagePositionY: parseInt(e.target.value) }))}
                                                                        disabled={!canEditTemplate}
                                                                        className="w-full h-1.5 accent-deped-blue cursor-pointer"
                                                                    />
                                                                </div>

                                                                {/* Scale / Zoom */}
                                                                <div>
                                                                    <div className="flex items-center justify-between mb-0.5">
                                                                        <label className="text-[10px] font-semibold text-slate-600">Scale / Zoom</label>
                                                                        <span className="text-[10px] font-mono text-slate-500">{config.bgImageScale ?? 100}%</span>
                                                                    </div>
                                                                    <input
                                                                        type="range"
                                                                        min={50}
                                                                        max={200}
                                                                        step={1}
                                                                        value={config.bgImageScale ?? 100}
                                                                        onChange={(e) => setConfig((c) => ({ ...c, bgImageScale: parseInt(e.target.value) }))}
                                                                        disabled={!canEditTemplate}
                                                                        className="w-full h-1.5 accent-deped-blue cursor-pointer"
                                                                    />
                                                                </div>

                                                                {/* Blur */}
                                                                <div>
                                                                    <div className="flex items-center justify-between mb-0.5">
                                                                        <label className="text-[10px] font-semibold text-slate-600">Blur</label>
                                                                        <span className="text-[10px] font-mono text-slate-500">{config.bgImageBlur ?? 0}px</span>
                                                                    </div>
                                                                    <input
                                                                        type="range"
                                                                        min={0}
                                                                        max={10}
                                                                        step={0.5}
                                                                        value={config.bgImageBlur ?? 0}
                                                                        onChange={(e) => setConfig((c) => ({ ...c, bgImageBlur: parseFloat(e.target.value) }))}
                                                                        disabled={!canEditTemplate}
                                                                        className="w-full h-1.5 accent-deped-blue cursor-pointer"
                                                                    />
                                                                </div>

                                                                {/* Brightness */}
                                                                <div>
                                                                    <div className="flex items-center justify-between mb-0.5">
                                                                        <label className="text-[10px] font-semibold text-slate-600">Brightness</label>
                                                                        <span className="text-[10px] font-mono text-slate-500">{config.bgImageBrightness ?? 100}%</span>
                                                                    </div>
                                                                    <input
                                                                        type="range"
                                                                        min={50}
                                                                        max={150}
                                                                        step={1}
                                                                        value={config.bgImageBrightness ?? 100}
                                                                        onChange={(e) => setConfig((c) => ({ ...c, bgImageBrightness: parseInt(e.target.value) }))}
                                                                        disabled={!canEditTemplate}
                                                                        className="w-full h-1.5 accent-deped-blue cursor-pointer"
                                                                    />
                                                                </div>

                                                                {/* Apply to Back */}
                                                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={config.bgImageApplyToBack ?? true}
                                                                        onChange={(e) => setConfig((c) => ({ ...c, bgImageApplyToBack: e.target.checked }))}
                                                                        disabled={!canEditTemplate}
                                                                        className="accent-deped-blue w-3.5 h-3.5"
                                                                    />
                                                                    <span className="text-[10px] font-semibold text-slate-600">Apply background to back side</span>
                                                                </label>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="min-h-0 flex flex-col space-y-3">
                                    <StudentMultiSelect
                                        students={sectionStudents}
                                        selected={bulkSelected}
                                        onToggle={toggleBulk}
                                        onSelectAll={(lrns) => setBulkSelected(new Set(lrns))}
                                        onClear={() => setBulkSelected(new Set())}
                                        search={bulkSearch}
                                        onSearch={setBulkSearch}
                                    />
                                    <div className="space-y-2 border-t border-slate-100 pt-3">
                                        <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">Output</label>
                                        <select value={exportLayout} onChange={(e) => setExportLayout(e.target.value as ExportLayout)} className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg">
                                            <option value="sheet">Multi-up cutting sheet</option>
                                            <option value="per-card">One ID per page (card printer)</option>
                                        </select>
                                        {exportLayout === 'sheet' && (
                                            <select value={exportPaper} onChange={(e) => setExportPaper(e.target.value as SheetPaper)} className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg">
                                                <option value="a4">A4 - Landscape Folding ({sheetCapacity('a4')}/sheet)</option>
                                                <option value="letter">Letter - Landscape Folding ({sheetCapacity('letter')}/sheet)</option>
                                                <option value="folio">Folio - Landscape Folding ({sheetCapacity('folio')}/sheet)</option>
                                            </select>
                                        )}
                                    </div>
                                    
                                    {/* Custom Background (Collapsible Card) for Bulk */}
                                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 shadow-sm mt-3">
                                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5 mb-0.5">
                                            <button
                                                type="button"
                                                onClick={() => setExpandedBg(!expandedBg)}
                                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600 cursor-pointer select-none focus:outline-none"
                                            >
                                                {expandedBg ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                                CUSTOM ID BACKGROUND
                                            </button>
                                            {expandedBg && config.bgImageUrl && (
                                                <button
                                                    type="button"
                                                    disabled={!canEditTemplate}
                                                    onClick={resetBgSettings}
                                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors"
                                                >
                                                    <RotateCcw className="w-3 h-3" />
                                                    Reset
                                                </button>
                                            )}
                                        </div>
                                        {expandedBg && (
                                            <div className="space-y-3 animate-fade-in pt-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-16 rounded border border-slate-200 bg-white flex items-center justify-center shrink-0 overflow-hidden relative shadow-sm">
                                                        {config.bgImageUrl ? (
                                                            <img src={config.bgImageUrl} alt="Bg Preview" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-[8px] text-slate-400 font-bold text-center px-1">No Custom Bg</span>
                                                        )}
                                                        {isUploadingBg && (
                                                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                                <Loader2 className="w-4 h-4 text-deped-blue animate-spin" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-1.5 flex-1">
                                                        <button
                                                            type="button"
                                                            disabled={!canEditTemplate || isUploadingBg}
                                                            onClick={() => bgFileInputRef.current?.click()}
                                                            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-deped-blue hover:bg-deped-blue/90 text-white disabled:opacity-40 transition-colors cursor-pointer"
                                                        >
                                                            <ImagePlus className="w-3.5 h-3.5" />
                                                            {config.bgImageUrl ? 'Change Bg' : 'Upload Bg'}
                                                        </button>
                                                        {config.bgImageUrl && (
                                                            <button
                                                                type="button"
                                                                disabled={!canEditTemplate || isUploadingBg}
                                                                onClick={() => setConfig((c) => ({ ...c, bgImageUrl: undefined, bgImageOpacity: undefined, bgImageSize: undefined, bgImagePositionX: undefined, bgImagePositionY: undefined, bgImageScale: undefined, bgImageBlur: undefined, bgImageBrightness: undefined, bgImageApplyToBack: undefined }))}
                                                                className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-red-200 text-red-655 hover:bg-red-50 transition-colors cursor-pointer"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                    <input
                                                        ref={bgFileInputRef}
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleBgUpload}
                                                        disabled={!canEditTemplate}
                                                    />
                                                </div>
                                                <p className="text-[9px] text-slate-450 leading-normal">
                                                    Upload custom ID background design. Recommended ratio: 54:86. Compressed dynamically.
                                                </p>

                                                {config.bgImageUrl && (
                                                    <div className="space-y-3 pt-2 border-t border-dashed border-slate-200">
                                                        {/* Opacity */}
                                                        <div>
                                                            <div className="flex items-center justify-between mb-0.5">
                                                                <label className="text-[10px] font-semibold text-slate-600">Opacity</label>
                                                                <span className="text-[10px] font-mono text-slate-500">{Math.round((config.bgImageOpacity ?? 1) * 100)}%</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min={0}
                                                                max={100}
                                                                step={1}
                                                                value={Math.round((config.bgImageOpacity ?? 1) * 100)}
                                                                onChange={(e) => setConfig((c) => ({ ...c, bgImageOpacity: parseInt(e.target.value) / 100 }))}
                                                                disabled={!canEditTemplate}
                                                                className="w-full h-1.5 accent-deped-blue cursor-pointer"
                                                            />
                                                        </div>

                                                        {/* Size Mode */}
                                                        <div>
                                                            <label className="block text-[10px] font-semibold text-slate-600 mb-1">Size Mode</label>
                                                            <div className="grid grid-cols-4 gap-0.5">
                                                                {([['cover', 'Cover'], ['contain', 'Contain'], ['stretch', 'Stretch'], ['actual', 'Actual']] as const).map(([val, label]) => (
                                                                    <button
                                                                        key={val}
                                                                        type="button"
                                                                        disabled={!canEditTemplate}
                                                                        onClick={() => setConfig((c) => ({ ...c, bgImageSize: val }))}
                                                                        className={`py-1 text-[9px] font-bold rounded transition-colors ${
                                                                            (config.bgImageSize ?? 'cover') === val
                                                                                ? 'bg-deped-blue text-white shadow-sm'
                                                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                                        }`}
                                                                    >
                                                                        {label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Position X */}
                                                        <div>
                                                            <div className="flex items-center justify-between mb-0.5">
                                                                <label className="text-[10px] font-semibold text-slate-600">Position X</label>
                                                                <span className="text-[10px] font-mono text-slate-500">{config.bgImagePositionX ?? 50}%</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min={0}
                                                                max={100}
                                                                step={1}
                                                                value={config.bgImagePositionX ?? 50}
                                                                onChange={(e) => setConfig((c) => ({ ...c, bgImagePositionX: parseInt(e.target.value) }))}
                                                                disabled={!canEditTemplate}
                                                                className="w-full h-1.5 accent-deped-blue cursor-pointer"
                                                            />
                                                        </div>

                                                        {/* Position Y */}
                                                        <div>
                                                            <div className="flex items-center justify-between mb-0.5">
                                                                <label className="text-[10px] font-semibold text-slate-600">Position Y</label>
                                                                <span className="text-[10px] font-mono text-slate-500">{config.bgImagePositionY ?? 50}%</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min={0}
                                                                max={100}
                                                                step={1}
                                                                value={config.bgImagePositionY ?? 50}
                                                                onChange={(e) => setConfig((c) => ({ ...c, bgImagePositionY: parseInt(e.target.value) }))}
                                                                disabled={!canEditTemplate}
                                                                className="w-full h-1.5 accent-deped-blue cursor-pointer"
                                                            />
                                                        </div>

                                                        {/* Scale / Zoom */}
                                                        <div>
                                                            <div className="flex items-center justify-between mb-0.5">
                                                                <label className="text-[10px] font-semibold text-slate-600">Scale / Zoom</label>
                                                                <span className="text-[10px] font-mono text-slate-500">{config.bgImageScale ?? 100}%</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min={50}
                                                                max={200}
                                                                step={1}
                                                                value={config.bgImageScale ?? 100}
                                                                onChange={(e) => setConfig((c) => ({ ...c, bgImageScale: parseInt(e.target.value) }))}
                                                                disabled={!canEditTemplate}
                                                                className="w-full h-1.5 accent-deped-blue cursor-pointer"
                                                            />
                                                        </div>

                                                        {/* Blur */}
                                                        <div>
                                                            <div className="flex items-center justify-between mb-0.5">
                                                                <label className="text-[10px] font-semibold text-slate-600">Blur</label>
                                                                <span className="text-[10px] font-mono text-slate-500">{config.bgImageBlur ?? 0}px</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min={0}
                                                                max={10}
                                                                step={0.5}
                                                                value={config.bgImageBlur ?? 0}
                                                                onChange={(e) => setConfig((c) => ({ ...c, bgImageBlur: parseFloat(e.target.value) }))}
                                                                disabled={!canEditTemplate}
                                                                className="w-full h-1.5 accent-deped-blue cursor-pointer"
                                                            />
                                                        </div>

                                                        {/* Brightness */}
                                                        <div>
                                                            <div className="flex items-center justify-between mb-0.5">
                                                                <label className="text-[10px] font-semibold text-slate-600">Brightness</label>
                                                                <span className="text-[10px] font-mono text-slate-500">{config.bgImageBrightness ?? 100}%</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min={50}
                                                                max={150}
                                                                step={1}
                                                                value={config.bgImageBrightness ?? 100}
                                                                onChange={(e) => setConfig((c) => ({ ...c, bgImageBrightness: parseInt(e.target.value) }))}
                                                                disabled={!canEditTemplate}
                                                                className="w-full h-1.5 accent-deped-blue cursor-pointer"
                                                            />
                                                        </div>

                                                        {/* Apply to Back */}
                                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                                            <input
                                                                type="checkbox"
                                                                checked={config.bgImageApplyToBack ?? true}
                                                                onChange={(e) => setConfig((c) => ({ ...c, bgImageApplyToBack: e.target.checked }))}
                                                                disabled={!canEditTemplate}
                                                                className="accent-deped-blue w-3.5 h-3.5"
                                                            />
                                                            <span className="text-[10px] font-semibold text-slate-600">Apply background to back side</span>
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Principal Signature (Collapsible Card) */}
                            {schoolProfile && (
                                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 shadow-sm">
                                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5 mb-0.5">
                                        <button
                                            type="button"
                                            onClick={() => setExpandedBranding(!expandedBranding)}
                                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600 cursor-pointer select-none focus:outline-none"
                                        >
                                            {expandedBranding ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                            PRINCIPAL SIGNATURE
                                        </button>
                                    </div>
                                    {expandedBranding && (
                                        <div className="space-y-3.5 animate-fade-in pt-1">
                                            {/* Principal Signature upload */}
                                            <div className="flex items-center gap-3 bg-white p-2.5 border border-slate-200 rounded-lg shadow-sm">
                                                <div className="w-10 h-10 rounded border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                                                    {schoolProfile.head_signature_url ? (
                                                        <img src={schoolProfile.head_signature_url} alt="" className="h-8 max-w-[36px] object-contain" />
                                                    ) : (
                                                        <PenTool className="w-4 h-4 text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <button
                                                        type="button"
                                                        disabled={!canEditTemplate}
                                                        onClick={() => sigFileInputRef.current?.click()}
                                                        className="px-2.5 py-1.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-350 inline-flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                                                    >
                                                        <Signature className="w-3 h-3 text-deped-blue" />
                                                        Upload Signature
                                                    </button>
                                                    <input
                                                        ref={sigFileInputRef}
                                                        type="file"
                                                        accept="image/*"
                                                        hidden
                                                        onChange={handleSignatureUpload}
                                                    />
                                                    {schoolProfile.head_signature_url && (
                                                        <button
                                                            type="button"
                                                            disabled={!canEditTemplate}
                                                            onClick={async () => {
                                                                if (window.confirm('Remove saved signature?')) {
                                                                    await updateSchoolProfile({ head_signature_url: '' } as Partial<typeof schoolProfile> as typeof schoolProfile);
                                                                }
                                                            }}
                                                            className="px-2 text-[9px] font-bold text-red-500 hover:text-red-400 hover:underline transition-all cursor-pointer text-left mt-0.5"
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}


                        </div>
                    </div>
                )}

                {/* Center: preview */}
                <div className="flex-1 overflow-auto p-8 pt-20 flex items-start justify-center bg-slate-50 relative">
                    {previewModel ? (
                        <IdCardPreview model={previewModel} frontRef={frontRef} backRef={backRef} scale={zoomScale} />
                    ) : (
                        <div className="text-center text-slate-400 mt-20">
                            <IdCard className="w-12 h-12 mx-auto mb-3 opacity-40" />
                            <p className="text-sm">
                                {mode === 'individual'
                                    ? 'Select a section and student to preview an ID.'
                                    : `Select students on the left, then Export PDF. ${bulkSelected.size} selected.`}
                            </p>
                        </div>
                    )}

                    {/* Floating Controls Bar */}
                    {previewModel && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-white border border-slate-200/80 shadow-lg rounded-full px-3 py-1.5 flex items-center gap-3 select-none">
                            {/* Zoom controls */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setZoomScale((z) => Math.max(1.0, z - 0.15))}
                                    className="p-1 rounded-full hover:bg-slate-50 text-slate-500 active:scale-95 transition-all cursor-pointer disabled:opacity-30"
                                    disabled={zoomScale <= 1.05}
                                    title="Zoom Out"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="text-[13px] font-black text-slate-800 min-w-[42px] text-center font-sans tracking-wide">
                                    {Math.round(zoomScale * 100)}%
                                </span>
                                <button
                                    onClick={() => setZoomScale((z) => Math.min(2.5, z + 0.15))}
                                    className="p-1 rounded-full hover:bg-slate-50 text-slate-500 active:scale-95 transition-all cursor-pointer disabled:opacity-30"
                                    disabled={zoomScale >= 2.45}
                                    title="Zoom In"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Separator */}
                            <div className="h-4 w-px bg-slate-200" />

                            {/* Sidebar Toggles */}
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setShowLeftSidebar((v) => !v)}
                                    className={`p-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                                        showLeftSidebar 
                                            ? 'bg-blue-50 text-blue-600 border border-blue-100/60 shadow-2xs' 
                                            : 'border border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                    }`}
                                    title={showLeftSidebar ? "Hide Left Sidebar" : "Show Left Sidebar"}
                                >
                                    <PanelLeft className="w-4 h-4" />
                                </button>

                                <button
                                    onClick={() => setShowSettings((v) => !v)}
                                    className={`p-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                                        showSettings 
                                            ? 'bg-blue-50 text-blue-600 border border-blue-100/60 shadow-2xs' 
                                            : 'border border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                    }`}
                                    title={showSettings ? "Hide Settings" : "Show Settings"}
                                >
                                    <SlidersHorizontal className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: settings */}
                {showSettings && (
                    <div className="w-72 border-l border-slate-200 bg-white p-4 overflow-y-auto shrink-0">
                        <h2 className="text-sm font-bold text-slate-800 mb-3">Template & Branding</h2>
                        {!canEditTemplate && <p className="text-xs text-amber-600 mb-2">You don't have permission to edit templates.</p>}
                        <IdTemplateSettings 
                            config={config} 
                            onChange={(patch) => setConfig((c) => ({ ...c, ...patch }))} 
                            canEdit={canEditTemplate}
                        />
                    </div>
                )}
            </div>

            {/* Offscreen export stage — real CR80 mm, handed to the PDF pipeline. */}
            {exportJob && (
                <div ref={stageRef} aria-hidden style={{ position: 'absolute', left: -99999, top: 0, pointerEvents: 'none' }}>
                    {exportJob.layout === 'per-card'
                        ? exportJob.models.flatMap((m) => [
                            <div data-export-node key={`f-${m.lrn}`}><IdCardFront model={m} /></div>,
                            <div data-export-node key={`b-${m.lrn}`}><IdCardBack model={m} /></div>,
                        ])
                        : chunk(exportJob.models, sheetCapacity(exportJob.paper)).map((group, i) => (
                            <div data-export-node key={`fold-${i}`}>
                                <IdCardSheet models={group} side="front" paper={exportJob.paper} />
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}

function resizeBgImage(file: File, maxWidth: number, maxHeight: number): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                }
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.92));
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}
