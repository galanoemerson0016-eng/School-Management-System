import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const temporaryRoots: string[] = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe('patch-metadata-ci', () => {
  it('stages versioned updater metadata without changing the live metadata pointer', () => {
    const root = mkdtempSync(join(tmpdir(), 'formease-release-metadata-'));
    temporaryRoots.push(root);
    const appDir = join(root, 'app');
    const releaseDir = join(appDir, 'release');
    const updateServerDir = join(root, 'update-server', 'updates');
    const licensePortalDir = join(root, 'license-portal', 'public', 'updates');

    mkdirSync(releaseDir, { recursive: true });
    mkdirSync(updateServerDir, { recursive: true });
    mkdirSync(licensePortalDir, { recursive: true });
    writeFileSync(join(appDir, 'package.json'), JSON.stringify({ version: '3.5.18' }));
    writeFileSync(join(updateServerDir, 'latest.yml'), 'version: previous-update-server\n');
    writeFileSync(join(licensePortalDir, 'latest.yml'), 'version: previous-license-portal\n');
    writeFileSync(join(releaseDir, 'FormEase Pro Setup 3.5.18.exe'), 'windows-installer');
    writeFileSync(join(releaseDir, 'FormEase Pro Setup 3.5.18.exe.blockmap'), 'windows-blockmap');
    writeFileSync(join(releaseDir, 'FormEase Pro-3.5.18-mac.zip'), 'mac-installer');
    writeFileSync(join(releaseDir, 'latest.yml'), [
      'version: 3.5.18',
      'files:',
      '  - url: FormEase Pro Setup 3.5.18.exe',
      '    sha512: stale',
      'path: FormEase Pro Setup 3.5.18.exe',
      'sha512: stale',
    ].join('\n'));
    writeFileSync(join(releaseDir, 'latest-mac.yml'), [
      'version: 3.5.18',
      'files:',
      '  - url: FormEase Pro-3.5.18-mac.zip',
      '    sha512: stale',
      'path: FormEase Pro-3.5.18-mac.zip',
      'sha512: stale',
    ].join('\n'));

    execFileSync(process.execPath, [join(process.cwd(), 'scripts', 'patch-metadata-ci.cjs')], {
      env: { ...process.env, FORMEASE_CI_ROOT_DIR: root },
      stdio: 'pipe',
    });

    const stagedUpdate = readFileSync(join(updateServerDir, 'staged', 'v3.5.18', 'latest.yml'), 'utf8');
    const stagedPortal = readFileSync(join(licensePortalDir, 'staged', 'v3.5.18', 'latest.yml'), 'utf8');
    expect(stagedUpdate).toContain('/releases/download/v3.5.18/FormEase.Pro.Setup.3.5.18.exe');
    expect(stagedUpdate).toMatch(/sha512: [A-Za-z0-9+/]+=*/);
    expect(stagedPortal).toBe(stagedUpdate);
    expect(readFileSync(join(updateServerDir, 'latest.yml'), 'utf8')).toBe('version: previous-update-server\n');
    expect(readFileSync(join(licensePortalDir, 'latest.yml'), 'utf8')).toBe('version: previous-license-portal\n');
    expect(readFileSync(join(updateServerDir, 'staged', 'v3.5.18', 'FormEase.Pro.Setup.3.5.18.exe.blockmap'), 'utf8')).toBe('windows-blockmap');
  });
});
