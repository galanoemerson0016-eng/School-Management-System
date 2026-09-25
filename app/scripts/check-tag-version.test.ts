import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { validateReleaseTag } = require('./check-tag-version.cjs') as {
  validateReleaseTag: (tag: string, version: string) => { ok: boolean; message: string };
};

describe('validateReleaseTag', () => {
  it('accepts an exact v3.5.19 tag and package version', () => {
    expect(validateReleaseTag('v3.5.19', '3.5.19')).toEqual({
      ok: true,
      message: 'Release tag v3.5.19 matches app/package.json version 3.5.19.',
    });
  });

  it.each([
    ['v3.5.19', '3.5.18'],
    ['v3.5.20', '3.5.19'],
  ])('rejects a mismatched tag (%s) and package version (%s)', (tag, version) => {
    const result = validateReleaseTag(tag, version);

    expect(result.ok).toBe(false);
    expect(result.message).toContain('does not match');
  });

  it.each(['3.5.19', 'release-3.5.19', 'v3.5', 'v3.5.19!'])('rejects malformed tags (%s)', (tag) => {
    const result = validateReleaseTag(tag, '3.5.19');

    expect(result.ok).toBe(false);
    expect(result.message).toContain('must use the v<version> format');
  });
});
