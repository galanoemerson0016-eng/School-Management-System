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

// 'cr80' is a single CR80 ID card (53.98 x 85.6 mm) — used for one-ID-per-page
// output on dedicated card printers. Because the main process renders with
// preferCSSPageSize: true, the @page size below becomes the real PDF page size.
export type PaperSize = 'letter' | 'a4' | 'folio' | 'cr80';
export type Orientation = 'portrait' | 'landscape';

/** CSS `@page size` value — drives the real PDF page dimensions via preferCSSPageSize. */
const PAGE_SIZE_CSS: Record<PaperSize, Record<Orientation, string>> = {
    letter: { portrait: '8.5in 11in', landscape: '11in 8.5in' },
    a4: { portrait: '210mm 297mm', landscape: '297mm 210mm' },
    folio: { portrait: '8.5in 13in', landscape: '13in 8.5in' },
    cr80: { portrait: '53.98mm 85.6mm', landscape: '85.6mm 53.98mm' },
};

/** Pixel size for the headless render window so the layout reflows like on screen. */
const WINDOW_PX: Record<PaperSize, Record<Orientation, { width: number; height: number }>> = {
    letter: { portrait: { width: 816, height: 1056 }, landscape: { width: 1056, height: 816 } },
    a4: { portrait: { width: 794, height: 1123 }, landscape: { width: 1123, height: 794 } },
    folio: { portrait: { width: 816, height: 1248 }, landscape: { width: 1248, height: 816 } },
    cr80: { portrait: { width: 204, height: 324 }, landscape: { width: 324, height: 204 } },
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
        if (src.startsWith('/')) {
            src = `${window.location.origin}${src}`;
            el.setAttribute('src', src);
        }
        // Blob and data URLs are already local and high quality, no need to touch them.
        if (src.startsWith('blob:') || src.startsWith('data:')) {
            return;
        }
        // Logos and background templates should not be aggressively downsized
        const maxW = 2048;
        const maxH = 2048;
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
/* Keep all text selectable in the produced PDF and force background colors/images to print. */
*, body * {
    user-select: text !important;
    -webkit-user-select: text !important;
    print-color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
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
 * Perform a direct client-side PDF export using html2canvas and jsPDF.
 * Renders the HTML elements, converts them to canvas rasters, and downloads the PDF file.
 */
export async function exportElementsToPdfBrowserDirect(
    options: ExportElementsToPdfOptions,
    onProgressChange?: (progress: number) => void
): Promise<PdfExportResult> {
    try {
        const html2canvas = (await import('html2canvas-pro')).default;
        const { jsPDF } = await import('jspdf');

        const { elements, paperSize, orientation = 'portrait', filename } = options;
        if (!elements.length) {
            return { success: false, error: 'Nothing to export.' };
        }

        // Determine PDF page format
        let format: string | number[] = 'a4';
        if (paperSize === 'cr80') {
            format = [53.98, 85.6];
        } else if (paperSize === 'letter') {
            format = 'letter';
        } else if (paperSize === 'folio') {
            format = [215.9, 330.2]; // standard legal/folio
        }

        const pdf = new jsPDF({
            orientation,
            unit: 'mm',
            format
        });

        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();

        const total = elements.length;
        for (let i = 0; i < total; i++) {
            if (i > 0) {
                pdf.addPage(format, orientation);
            }

            const element = elements[i];
            // Capture at ~300 DPI for the physical page so small text / QR / ID
            // backgrounds stay crisp instead of the blurry ~192 DPI a fixed scale
            // gives. Derived from the element's CSS width vs. the mm page width.
            const cssWidth = element.offsetWidth || element.getBoundingClientRect().width || 1;
            const targetPx = (pageW / 25.4) * 300; // 300 DPI across the page width
            const scale = Math.min(4, Math.max(2, targetPx / cssWidth));
            const canvas = await html2canvas(element, {
                scale,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                logging: false,
            });

            // PNG (lossless) keeps QR codes and edges sharp; JPEG artifacts them.
            const imgData = canvas.toDataURL('image/png');

            pdf.addImage(imgData, 'PNG', 0, 0, pageW, pageH);

            if (onProgressChange) {
                onProgressChange(Math.round(((i + 1) / total) * 100));
            }
        }

        pdf.save(`${filename.endsWith('.pdf') ? filename : `${filename}.pdf`}`);
        return { success: true };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Direct download failed.' };
    }
}

/**
 * Build the print document and hand it to Electron for vector PDF export.
 * If not running in the desktop app (no electronAPI), falls back to standard
 * browser-direct jspdf/html2canvas download.
 */
export async function exportElementsToPdf(options: ExportElementsToPdfOptions): Promise<PdfExportResult> {
    const api = window.electronAPI;
    if (api?.exportHtmlPdf) {
        const html = await buildPrintDocument(options);
        if (!html) {
            return { success: false, error: 'Nothing to export.' };
        }
        const { paperSize, orientation = 'portrait' } = options;
        const win = WINDOW_PX[paperSize][orientation];
        return api.exportHtmlPdf({
            html,
            defaultFilename: options.filename,
            paperSize,
            pageWidthPx: win.width,
            pageHeightPx: win.height,
            landscape: orientation === 'landscape',
        });
    } else {
        // Fall back to direct browser download using html2canvas + jspdf
        return exportElementsToPdfBrowserDirect(options);
    }
}

/**
 * Print elements directly via a hidden iframe (opens the system print dialog).
 * Works in both the web browser and Electron desktop environment.
 */
export async function printElements(options: BuildPrintDocumentOptions): Promise<PdfExportResult> {
    const html = await buildPrintDocument(options);
    if (!html) {
        return { success: false, error: 'Nothing to print.' };
    }

    return new Promise<PdfExportResult>((resolve) => {
        try {
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            iframe.style.zIndex = '-9999';
            document.body.appendChild(iframe);

            const doc = iframe.contentWindow?.document || iframe.contentDocument;
            if (!doc) {
                document.body.removeChild(iframe);
                resolve({ success: false, error: 'Failed to access iframe document.' });
                return;
            }

            doc.open();
            doc.write(html);
            doc.close();

            iframe.onload = () => {
                // Give a small delay to make sure styles/images are parsed
                setTimeout(() => {
                    try {
                        iframe.contentWindow?.focus();
                        iframe.contentWindow?.print();
                        resolve({ success: true });
                    } catch (err) {
                        resolve({ success: false, error: err instanceof Error ? err.message : 'Print failed.' });
                    } finally {
                        // Delay removing the iframe slightly so browser print preview can load it
                        setTimeout(() => {
                            if (document.body.contains(iframe)) {
                                document.body.removeChild(iframe);
                            }
                        }, 5000);
                    }
                }, 500);
            };
        } catch (err) {
            resolve({ success: false, error: err instanceof Error ? err.message : 'Print failed.' });
        }
    });
}


