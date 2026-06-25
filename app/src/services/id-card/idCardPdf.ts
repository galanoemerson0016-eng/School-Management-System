/**
 * Student ID Generator — export orchestration helpers (non-React parts).
 *
 * The React page renders the card/sheet DOM offscreen and hands the elements to
 * utils/pdf-export.exportElementsToPdf; these helpers prepare the view models
 * (baking in QR/barcode data URLs, chunked to keep the UI responsive) and derive
 * filenames / pagination.
 */
import type { IdCardConfig, SchoolProfile, Student } from '../../types';
import { buildIdCardModel, type IdCardViewModel } from './idCardData';
import { generateBarcodeDataUrl, generateQrDataUrl } from './codes';

export function chunk<T>(items: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
    return out;
}

/**
 * Build render-ready models with QR/barcode baked in. Processes in small batches
 * and yields to the event loop between them so large sections don't freeze the UI;
 * `onProgress(done, total)` reports advancement.
 */
export async function prepareModels(
    students: Student[],
    profile: SchoolProfile,
    config: IdCardConfig,
    onProgress?: (done: number, total: number) => void,
): Promise<IdCardViewModel[]> {
    const models: IdCardViewModel[] = [];
    const batches = chunk(students, 20);
    let done = 0;

    for (const batch of batches) {
        const built = await Promise.all(
            batch.map(async (student) => {
                const model = buildIdCardModel(student, profile, config);
                if (model.show.qr) {
                    model.qrDataUrl = await generateQrDataUrl(model.qrPayload, { size: 256 });
                }
                if (model.show.barcode) {
                    model.barcodeDataUrl = await generateBarcodeDataUrl(model.lrn || model.serial);
                }
                return model;
            }),
        );
        models.push(...built);
        done += batch.length;
        onProgress?.(done, students.length);
        // Let the UI paint the progress update before the next batch.
        await new Promise((r) => setTimeout(r, 0));
    }
    return models;
}

/** Sanitize a string into a safe PDF filename stem. */
export function safeFilename(stem: string): string {
    return stem.replace(/[^\w-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'student-id';
}
