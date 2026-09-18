/**
 * Reads bundled template files only when running in a real Node/test context.
 * Browser and Electron renderer builds must use their normal public/template URL.
 * Keeping the specifiers runtime-only prevents Vite from bundling Node fs/path.
 */
export async function readNodeTemplateFallback(
  filenames: string[],
  minimumBytes = 4,
): Promise<Uint8Array | null> {
  const isNodeRuntime = typeof process !== 'undefined' && Boolean(process.versions?.node);
  const isBrowserRuntime = typeof window !== 'undefined' && import.meta.env.MODE !== 'test';
  if (!isNodeRuntime || isBrowserRuntime) return null;

  try {
    const fsSpecifier = 'node:fs';
    const pathSpecifier = 'node:path';
    const [fs, nodePath] = await Promise.all([
      import(/* @vite-ignore */ fsSpecifier),
      import(/* @vite-ignore */ pathSpecifier),
    ]);

    const processWithResources = process as typeof process & { resourcesPath?: string };
    const baseDirectories = [
      nodePath.resolve(process.cwd(), 'app', 'public', 'templates'),
      nodePath.resolve(process.cwd(), 'public', 'templates'),
      ...(processWithResources.resourcesPath
        ? [
            nodePath.resolve(processWithResources.resourcesPath, 'templates'),
            nodePath.resolve(processWithResources.resourcesPath, 'app', 'public', 'templates'),
          ]
        : []),
    ];

    for (const directory of baseDirectories) {
      for (const filename of filenames) {
        const fullPath = nodePath.join(directory, filename);
        if (!fs.existsSync(fullPath)) continue;
        const buffer = fs.readFileSync(fullPath);
        if (buffer.length < minimumBytes) continue;
        return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      }
    }
  } catch {
    // The browser-safe URL loader remains the source of truth.
  }

  return null;
}

export function isZipTemplate(bytes: Uint8Array | null): bytes is Uint8Array {
  return Boolean(
    bytes &&
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04,
  );
}
