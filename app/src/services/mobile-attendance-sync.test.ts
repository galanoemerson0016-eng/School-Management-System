import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('mobile attendance pairing client', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    window.history.replaceState({}, '', '/');
    Object.defineProperty(window, 'electronAPI', { configurable: true, value: undefined });
  });

  it('reads a pairing secret from the hash and sends it only as a bearer header', async () => {
    window.history.replaceState({}, '', '/#/mobile-attendance?pair=hash-secret');
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const service = await import('./mobile-attendance-sync');

    expect(service.getAttendancePairingToken()).toBe('hash-secret');
    expect(service.getAttendancePairingHeaders()).toEqual({ Authorization: 'Bearer hash-secret' });

    service.broadcastAttendanceUpdate(
      { id: '1', student_lrn: '123', section_id: 's1', date: '2026-09-18', status: 'present' },
      'Learner',
      undefined,
      'Smartphone',
    );
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).not.toContain('hash-secret');
    expect(options.headers).toMatchObject({ Authorization: 'Bearer hash-secret' });
  });

  it('uses the search query only as a legacy token source', async () => {
    window.history.replaceState({}, '', '/?pair=search-secret#/mobile-attendance');
    const service = await import('./mobile-attendance-sync');
    expect(service.getAttendancePairingToken()).toBe('search-secret');
  });

  it('uses the Vite HTTP gateway in Electron development and revokes through the same transport', async () => {
    const ipcStart = vi.fn();
    const ipcRevoke = vi.fn();
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      value: { startAttendancePairing: ipcStart, revokeAttendancePairing: ipcRevoke },
    });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: 'dev-token', expiresAt: Date.now() + 60_000 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const service = await import('./mobile-attendance-sync');

    const pairing = await service.startAttendancePairing();
    expect(pairing.token).toBe('dev-token');
    expect(ipcStart).not.toHaveBeenCalled();
    expect(fetchMock.mock.calls[0][0]).toBe('/api/attendance/pairing');

    await service.revokeAttendancePairing(pairing.token);
    expect(ipcRevoke).not.toHaveBeenCalled();
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: 'DELETE',
      headers: { Authorization: 'Bearer dev-token' },
    });
  });

  it('uses the isolated IPC gateway for a packaged file renderer', async () => {
    window.history.replaceState({}, '', '/');
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: new URL('file:///C:/FormEase/dist/index.html'),
    });
    const ipcStart = vi.fn().mockResolvedValue({ token: 'ipc-token', expiresAt: Date.now() + 60_000 });
    const ipcRevoke = vi.fn().mockResolvedValue({ success: true });
    Object.defineProperty(window, 'electronAPI', {
      configurable: true,
      value: { startAttendancePairing: ipcStart, revokeAttendancePairing: ipcRevoke },
    });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const service = await import('./mobile-attendance-sync');

    const pairing = await service.startAttendancePairing();
    expect(pairing.token).toBe('ipc-token');
    expect(ipcStart).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();

    await service.revokeAttendancePairing(pairing.token);
    expect(ipcRevoke).toHaveBeenCalledWith('ipc-token');
  });
});
