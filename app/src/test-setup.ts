import '@testing-library/jest-dom';

// Node 20 / jsdom VM realm compatibility for WebCrypto SubtleCrypto.digest:
// TypedArrays created in jsdom VM realm fail instanceof checks in Node 20 webcrypto.
if (typeof globalThis.crypto?.subtle?.digest === 'function') {
  const originalDigest = globalThis.crypto.subtle.digest.bind(globalThis.crypto.subtle);
  globalThis.crypto.subtle.digest = (async (algorithm: AlgorithmIdentifier, data: BufferSource) => {
    let normalized = data;
    if (typeof Buffer !== 'undefined') {
      if (ArrayBuffer.isView(data)) {
        normalized = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
      } else if (data && typeof data === 'object' && 'byteLength' in data) {
        normalized = Buffer.from(data as ArrayBuffer);
      }
    }
    return originalDigest(algorithm, normalized as BufferSource);
  }) as typeof globalThis.crypto.subtle.digest;
}
