/**
 * Student ID Generator — QR & barcode rasterization.
 *
 * The PDF pipeline (utils/pdf-export.ts) serializes the card DOM via `outerHTML`,
 * which DROPS any pixels drawn on a live <canvas>. So QR/barcodes must be baked
 * into PNG data URLs and rendered as <img> (the pipeline's normalizeImages only
 * embeds <img>). These helpers return data URLs and memoize results so bulk runs
 * over a section don't re-encode identical payloads.
 *
 * Libraries are dynamically imported (matching the codebase's lazy-import pattern)
 * so they stay out of the initial bundle.
 */

const qrCache = new Map<string, string>();
const barcodeCache = new Map<string, string>();

export interface QrOptions {
    /** Pixel size of the square QR (default 256). */
    size?: number;
    /** Quiet-zone margin in modules (default 1). */
    margin?: number;
    darkColor?: string;
    lightColor?: string;
}

/** Encode `payload` as a PNG data URL QR code. Returns '' on failure. */
export async function generateQrDataUrl(payload: string, opts: QrOptions = {}): Promise<string> {
    const { size = 256, margin = 1, darkColor = '#000000', lightColor = '#ffffff' } = opts;
    const key = `${size}|${margin}|${darkColor}|${lightColor}|${payload}`;
    const cached = qrCache.get(key);
    if (cached) return cached;

    try {
        const QRCode = (await import('qrcode')).default;
        const url = await QRCode.toDataURL(payload, {
            width: size,
            margin,
            errorCorrectionLevel: 'M',
            color: { dark: darkColor, light: lightColor },
        });
        qrCache.set(key, url);
        return url;
    } catch {
        return '';
    }
}

export interface BarcodeOptions {
    /** Symbology — Code128 suits alphanumeric LRNs/serials. */
    format?: 'CODE128' | 'CODE39';
    /** Bar height in px (default 40). */
    height?: number;
    /** Per-bar width in px (default 1.6). */
    barWidth?: number;
    /** Print the human-readable value under the bars. */
    displayValue?: boolean;
    lineColor?: string;
}

/** Render `value` (e.g. the LRN) to a PNG-barcode data URL. Returns '' on failure. */
export async function generateBarcodeDataUrl(value: string, opts: BarcodeOptions = {}): Promise<string> {
    const {
        format = 'CODE128',
        height = 40,
        barWidth = 1.6,
        displayValue = true,
        lineColor = '#000000',
    } = opts;
    if (!value) return '';
    const key = `${format}|${height}|${barWidth}|${displayValue}|${lineColor}|${value}`;
    const cached = barcodeCache.get(key);
    if (cached) return cached;

    try {
        const JsBarcode = (await import('jsbarcode')).default;
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, value, {
            format,
            height,
            width: barWidth,
            displayValue,
            fontSize: 14,
            margin: 4,
            lineColor,
            background: '#ffffff',
        });
        const url = canvas.toDataURL('image/png');
        barcodeCache.set(key, url);
        return url;
    } catch {
        return '';
    }
}
