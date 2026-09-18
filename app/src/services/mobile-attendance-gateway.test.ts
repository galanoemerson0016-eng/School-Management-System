import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createRequire } from 'node:module';

interface GatewayModule {
  app: Parameters<typeof createServer>[0];
  startAttendancePairing: (ttlMs?: number) => { token: string; expiresAt: number };
  revokeAttendancePairing: (token?: string) => boolean;
  isAttendancePairingValid: (token: string) => boolean;
  updateActiveSession: (data: unknown) => boolean;
  pushSyncEvent: (event: unknown) => boolean;
  getSyncEventsSince: (since: number) => { events: unknown[]; serverTime: number };
}

const require = createRequire(import.meta.url);
const gateway = require('../../server.js') as GatewayModule;

describe('mobile attendance gateway security', () => {
  let server: Server;
  let baseUrl = '';

  beforeAll(async () => {
    server = createServer(gateway.app);
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  });

  beforeEach(() => {
    gateway.revokeAttendancePairing();
  });

  async function pair() {
    const response = await fetch(`${baseUrl}/api/attendance/pairing`, { method: 'POST' });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    return response.json() as Promise<{ token: string; expiresAt: number }>;
  }

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  it('requires a valid bearer token for session data', async () => {
    const missing = await fetch(`${baseUrl}/api/attendance/session`);
    expect(missing.status).toBe(401);

    const wrong = await fetch(`${baseUrl}/api/attendance/session`, { headers: auth('wrong-token') });
    expect(wrong.status).toBe(401);

    const pairing = await pair();
    expect(pairing.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(pairing.expiresAt).toBeGreaterThan(Date.now());

    const accepted = await fetch(`${baseUrl}/api/attendance/session`, { headers: auth(pairing.token) });
    expect(accepted.status).toBe(200);
    expect(accepted.headers.get('cache-control')).toBe('no-store');
  });

  it('rotates and revokes pairings immediately', async () => {
    const first = await pair();
    const second = await pair();

    expect((await fetch(`${baseUrl}/api/attendance/session`, { headers: auth(first.token) })).status).toBe(401);
    expect((await fetch(`${baseUrl}/api/attendance/session`, { headers: auth(second.token) })).status).toBe(200);

    const revoked = await fetch(`${baseUrl}/api/attendance/pairing`, {
      method: 'DELETE',
      headers: auth(second.token),
    });
    expect(revoked.status).toBe(204);
    expect((await fetch(`${baseUrl}/api/attendance/session`, { headers: auth(second.token) })).status).toBe(401);
  });

  it('rejects disallowed browser origins before exposing the gateway', async () => {
    const response = await fetch(`${baseUrl}/api/attendance/pairing`, {
      method: 'POST',
      headers: { Origin: 'https://attacker.example' },
    });
    expect(response.status).toBe(403);
  });

  it('validates desktop sessions and phone attendance updates', async () => {
    const { token } = await pair();
    const headers = { ...auth(token), 'Content-Type': 'application/json' };

    const badSession = await fetch(`${baseUrl}/api/attendance/session`, {
      method: 'POST', headers, body: JSON.stringify({ students: 'not-an-array' }),
    });
    expect(badSession.status).toBe(400);

    const session = await fetch(`${baseUrl}/api/attendance/session`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        date: '2026-09-18',
        students: [{ lrn: '123', first_name: 'Juan', last_name: 'Dela Cruz', gender: 'Male', grade_level: 'Grade 7', address: 'private', parent_contact: 'secret' }],
        sections: [{ id: 's1', section_name: 'Narra', is_advisory: true, adviser_name: 'private' }],
        records: [],
        schoolProfile: { name: 'Test School', activation_key: 'secret', head_signature_url: 'private' },
      }),
    });
    expect(session.status).toBe(200);

    const minimized = await fetch(`${baseUrl}/api/attendance/session`, { headers: auth(token) });
    const minimizedPayload = await minimized.json() as {
      students: Array<Record<string, unknown>>;
      sections: Array<Record<string, unknown>>;
      schoolProfile: Record<string, unknown>;
    };
    expect(minimizedPayload.students[0]).toMatchObject({ lrn: '123', first_name: 'Juan', last_name: 'Dela Cruz' });
    expect(minimizedPayload.students[0]).not.toHaveProperty('address');
    expect(minimizedPayload.students[0]).not.toHaveProperty('parent_contact');
    expect(minimizedPayload.sections[0]).not.toHaveProperty('adviser_name');
    expect(minimizedPayload.schoolProfile).toEqual({ name: 'Test School' });

    const invalidUpdate = await fetch(`${baseUrl}/api/attendance/update`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ type: 'ATTENDANCE_UPDATE', record: { student_lrn: '', date: 'bad', status: 'hacked' } }),
    });
    expect(invalidUpdate.status).toBe(400);

    const validUpdate = await fetch(`${baseUrl}/api/attendance/update`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'ATTENDANCE_UPDATE',
        sourceDevice: 'Smartphone',
        record: { id: '123_2026-09-18', student_lrn: '123', section_id: 's1', date: '2026-09-18', status: 'present' },
      }),
    });
    expect(validUpdate.status).toBe(200);

    const updates = await fetch(`${baseUrl}/api/attendance/updates?since=0`, { headers: auth(token) });
    const payload = await updates.json() as { events: Array<{ record: { student_lrn: string }; timestamp: number }> };
    expect(payload.events.some(event => event.record.student_lrn === '123')).toBe(true);
    expect(payload.events.at(-1)?.timestamp).toBeGreaterThan(0);
  });

  it('expires tokens and keeps trusted IPC-style operations independent of HTTP auth', () => {
    const now = vi.spyOn(Date, 'now');
    now.mockReturnValue(1_000_000);
    const pairing = gateway.startAttendancePairing(1000);
    expect(gateway.isAttendancePairingValid(pairing.token)).toBe(true);
    now.mockReturnValue(pairing.expiresAt);
    expect(gateway.isAttendancePairingValid(pairing.token)).toBe(false);
    now.mockRestore();

    expect(gateway.updateActiveSession({ students: [], sections: [], records: [], date: '2026-09-18' })).toBe(true);
    expect(gateway.pushSyncEvent({
      type: 'ATTENDANCE_UPDATE',
      record: { student_lrn: '456', date: '2026-09-18', status: 'late' },
    })).toBe(true);
    expect(gateway.getSyncEventsSince(0).events.length).toBeGreaterThan(0);
  });
});
