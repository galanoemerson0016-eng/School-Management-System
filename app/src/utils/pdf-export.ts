/**
 * Vector PDF export pipeline (shared by all DepEd form pages).
 *
 * Strategy: clone the on-screen print element(s), flatten form controls into plain
 * text, embed the app's compiled CSS, and hand a complete standalone HTML document
 * to the Electron main process. There a hidden BrowserWindow renders it and calls
 * `webContents.printToPDF`, producing a crisp, selectable, true-WYSIWYG vector PDF.
 *
 * This replaces the html2canvas + jsPDF rasterization path (blurry image PDFs) for
 * the desktop build. Because every form is styled with the same Tailwind sheet the
 * UI uses, inlining `document.styleSheets` keeps the PDF identical to the preview —
 * no per-form CSS needs to be hand-maintained.
 */

export type PaperSize = 'letter' | 'a4' | 'folio';
export type Orientation = 'portrait' | 'landscape';

/** CSS `@page size` value — drives the real PDF page dimensions via preferCSSPageSize. */
const PAGE_SIZE_CSS: Record<PaperSize, Record<Orientation, string>> = {
    letter: { portrait: '8.5in 11in', landscape: '11in 8.5in' },
    a4: { portrait: '210mm 297mm', landscape: '297mm 210mm' },
    folio: { portrait: '8.5in 13in', landscape: '13in 8.5in' },
};

/** Pixel size for the headless render window so the layout reflows like on screen. */
const WINDOW_PX: Record<PaperSize, Record<Orientation, { width: number; height: number }>> = {
    letter: { portrait: { width: 816, height: 1056 }, landscape: { width: 1056, height: 816 } },
    a4: { portrait: { width: 794, height: 1123 }, landscape: { width: 1123, height: 794 } },
    folio: { portrait: { width: 816, height: 1248 }, landscape: { width: 1248, height: 816 } },
};

export function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Downscale an image to a self-contained PNG data URL (keeps logos sharp + small). */
export function resizeImageForDoc(src: string, maxW: number, maxH: number): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            let w = img.naturalWidth || img.width;
            let h = img.naturalHeight || img.height;
            if (!w || !h) {
                resolve(src);
                return;
            }
            const scale = Math.min(maxW / w, maxH / h, 1);
            w = Math.max(1, Math.round(w * scale));
            h = Math.max(1, Math.round(h * scale));
            try {
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(src);
                    return;
                }
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/png'));
            } catch {
                // Tainted canvas (cross-origin) — fall back to the original src
                resolve(src);
            }
        };
        img.onerror = () => resolve(src);
        img.src = src;
    });
}

/** Resolve relative <img> sources to absolute and embed them as data URLs. */
async function normalizeImages(clone: HTMLElement): Promise<void> {
    const tasks: Promise<void>[] = [];
    clone.querySelectorAll('img').forEach((img) => {
        const el = img as HTMLImageElement;
        let src = el.getAttribute('src') || '';
        if (!src) return;
        if (src.startsWith('/')) src = `${window.location.origin}${src}`;
        if (src.startsWith('data:')) return; // already embedded
        // Logos are small; cap them so they embed cleanly without bloating the PDF.
        const rect = el.getBoundingClientRect();
        const maxW = Math.max(48, Math.round(rect.width) || 96);
        const maxH = Math.max(48, Math.round(rect.height) || 96);
        tasks.push(
            resizeImageForDoc(src, maxW, maxH).then((normalized) => {
                el.setAttribute('src', normalized);
            }),
        );
    });
    await Promise.all(tasks);
}

/**
 * Replace inputs/selects/textareas in the clone with spans holding their current
 * value, so typed/edited content renders in the PDF (cloned controls keep no value).
 */
function flattenFormControls(original: HTMLElement, clone: HTMLElement): void {
    const origControls = original.querySelectorAll('input, select, textarea');
    const cloneControls = clone.querySelectorAll('input, select, textarea');
    origControls.forEach((origEl, idx) => {
        const cloneEl = cloneControls[idx] as HTMLElement | undefined;
        if (!cloneEl) return;

        let value = '';
        if (origEl instanceof HTMLSelectElement) {
            value = origEl.options[origEl.selectedIndex]?.text ?? origEl.value;
        } else {
            value = (origEl as HTMLInputElement | HTMLTextAreaElement).value || '';
        }

        const span = document.createElement('span');
        span.textContent = value;
        span.className = cloneEl.className;
        span.setAttribute('style', cloneEl.getAttribute('style') || '');
        span.style.display = 'inline-flex';
        span.style.alignItems = 'center';
        span.style.justifyContent = cloneEl.classList.contains('text-left') ? 'flex-start' : 'center';
        span.style.width = '100%';
        span.style.height = '100%';
        cloneEl.parentNode?.replaceChild(span, cloneEl);
    });
}

/** Gather every readable CSS rule from the document (same-origin in the Electron build). */
function collectDocumentCss(): string {
    let css = '';
    for (const sheet of Array.from(document.styleSheets)) {
        try {
            css += Array.from(sheet.cssRules).map((rule) => rule.cssText).join('\n') + '\n';
        } catch {
            // Cross-origin stylesheet — not readable, skip it.
        }
    }
    return css;
}

export interface BuildPrintDocumentOptions {
    /** On-screen print element(s); each becomes one paginated sheet, in order. */
    elements: HTMLElement[];
    title?: string;
    paperSize: PaperSize;
    orientation?: Orientation;
    /** CSS `@page margin` (e.g. '0.35in'). Defaults to no margin. */
    pageMargin?: string;
    /** Extra per-form CSS appended after the document styles. */
    extraCss?: string;
}

/** Build a complete, standalone print-ready HTML document from live DOM element(s). */
export async function buildPrintDocument(options: BuildPrintDocumentOptions): Promise<string> {
    const { elements, title = 'Document', paperSize, orientation = 'portrait', pageMargin = '0', extraCss = '' } = options;
    if (!elements.length) return '';

    const documentCss = collectDocumentCss();

    const pages: string[] = [];
    for (const original of elements) {
        const clone = original.cloneNode(true) as HTMLElement;
        flattenFormControls(original, clone);
        await normalizeImages(clone);
        pages.push(`<div class="pdf-page">${clone.outerHTML}</div>`);
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
${documentCss}
@page {
    size: ${PAGE_SIZE_CSS[paperSize][orientation]};
    margin: ${pageMargin};
}
html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}
.pdf-page {
    break-after: page;
    page-break-after: always;
    /* Strip the on-screen sheet chrome so only the form prints. */
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
    margin: 0 auto !important;
}
.pdf-page:last-child {
    break-after: auto;
    page-break-after: auto;
}
/* Keep all text selectable in the produced PDF. */
*, body * {
    user-select: text !important;
    -webkit-user-select: text !important;
}
${extraCss}
</style>
</head>
<body>
${pages.join('\n')}
</body>
</html>`;
}

export interface ExportElementsToPdfOptions extends BuildPrintDocumentOptions {
    /** Save dialog default filename (with or without .pdf). */
    filename: string;
}

export interface PdfExportResult {
    success: boolean;
    filePath?: string;
    cancelled?: boolean;
    error?: string;
}

/**
 * Build the print document and hand it to Electron for vector PDF export.
 * Returns `{ cancelled: true }` if the user dismisses the save dialog.
 * Throws if not running in the Electron desktop build (no `exportHtmlPdf` bridge).
 */
export async function exportElementsToPdf(options: ExportElementsToPdfOptions): Promise<PdfExportResult> {
    const api = window.electronAPI;
    if (!api?.exportHtmlPdf) {
        throw new Error('PDF export is only available in the desktop app.');
    }

    const { paperSize, orientation = 'portrait' } = options;
    const html = await buildPrintDocument(options);
    if (!html) {
        return { success: false, error: 'Nothing to export.' };
    }

    const win = WINDOW_PX[paperSize][orientation];
    return api.exportHtmlPdf({
        html,
        defaultFilename: options.filename,
        paperSize,
        pageWidthPx: win.width,
        pageHeightPx: win.height,
    });
}
