/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type NextRequest } from 'next/server';

// Setup environment variables needed by createServerClient
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase-url.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';

// Mock variables to manipulate auth and db responses dynamically
// Note: Variable names must start with "mock" (case-insensitive) to be used inside hoisted vi.mock factories.
let mockUser: any = null;
let mockProfile: any = null;
let mockRegStatus: any = null;
let mockRegDeletedAt: any = null;
let mockQueryError: any = null;

// Mock @supabase/ssr
vi.mock('@supabase/ssr', () => {
  return {
    createServerClient: () => ({
      auth: {
        getUser: async () => {
          if (mockUser === null) {
            return { data: { user: null }, error: null };
          }
          return { data: { user: mockUser }, error: null };
        },
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => {
              if (mockQueryError) {
                return { data: null, error: mockQueryError };
              }
              if (!mockProfile) {
                return { data: null, error: null };
              }
              return {
                data: {
                  role: mockProfile.role,
                  is_onboarded: mockProfile.is_onboarded,
                  registrations: mockRegStatus || mockRegDeletedAt ? {
                    status: mockRegStatus,
                    deleted_at: mockRegDeletedAt,
                  } : null,
                },
                error: null,
              };
            },
          }),
        }),
      }),
    }),
  };
});

vi.mock('next/server', () => {
  return {
    NextResponse: {
      next: () => ({
        cookies: {
          set: () => {},
        },
        headers: new Map(),
        status: 200,
      }),
      redirect: (url: any) => {
        const targetUrl = typeof url === 'string' ? url : url.pathname;
        return {
          redirected: true,
          url: targetUrl,
          status: 307,
        };
      },
    },
  };
});

// Helper to create mock requests
function createMockRequest(pathname: string, headersList: Record<string, string> = {}) {
  const headers = new Map<string, string>(Object.entries(headersList));
  const cookiesMap = new Map<string, string>();

  const nextUrl = {
    pathname,
    hostname: 'localhost',
    clone() {
      return {
        pathname,
        hostname: 'localhost',
        clone() {
          return this;
        },
      };
    },
  };

  return {
    nextUrl,
    headers: {
      has: (key: string) => headers.has(key),
      get: (key: string) => headers.get(key),
    },
    cookies: {
      getAll: () => Array.from(cookiesMap.entries()).map(([name, value]) => ({ name, value })),
      set: (name: string, value: string) => cookiesMap.set(name, value),
    },
  } as unknown as NextRequest;
}

// Import the proxy module under test
import { proxy } from './proxy';

describe('Next.js Proxy Layer - Route Guarding tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
    mockProfile = null;
    mockRegStatus = null;
    mockRegDeletedAt = null;
    mockQueryError = null;
  });

  it('should bypass route guarding if the request is a Server Action', async () => {
    const req = createMockRequest('/dashboard', { 'next-action': 'action-id' });
    const res = await proxy(req);
    expect(res.redirected).toBeUndefined();
    expect(res.status).toBe(200);
  });

  it('should redirect to /login if user is not logged in and tries to access a protected route', async () => {
    const req = createMockRequest('/dashboard');
    const res = await proxy(req);
    expect(res.redirected).toBe(true);
    expect(res.url).toBe('/login');
  });

  it('should not redirect if user is not logged in but accesses a non-protected/auth route', async () => {
    const req = createMockRequest('/login');
    const res = await proxy(req);
    expect(res.redirected).toBeUndefined();
    expect(res.status).toBe(200);
  });

  describe('[Kondisi 1] Baru Register & Belum Mengisi Form', () => {
    beforeEach(() => {
      mockUser = { id: 'user-123', email: 'caang1@robotik.org' };
      mockProfile = { role: 'caang', is_onboarded: false };
      mockRegStatus = null; // empty registrations
    });

    it('should redirect internal routes to /onboarding', async () => {
      const routes = ['/dashboard', '/kegiatan', '/absensi', '/tugas'];
      for (const route of routes) {
        const req = createMockRequest(route);
        const res = await proxy(req);
        expect(res.redirected).toBe(true);
        expect(res.url).toBe('/onboarding');
      }
    });

    it('should allow accessing the /onboarding route', async () => {
      const req = createMockRequest('/onboarding');
      const res = await proxy(req);
      expect(res.redirected).toBeUndefined();
      expect(res.status).toBe(200);
    });

    it('should redirect auth routes to /onboarding', async () => {
      const req = createMockRequest('/login');
      const res = await proxy(req);
      expect(res.redirected).toBe(true);
      expect(res.url).toBe('/onboarding');
    });
  });

  describe('[Kondisi 2] Proses Onboarding Sedang Berjalan (Draft)', () => {
    beforeEach(() => {
      mockUser = { id: 'user-123', email: 'caang2@robotik.org' };
      mockProfile = { role: 'caang', is_onboarded: false };
      mockRegStatus = 'process';
    });

    it('should redirect internal routes to /onboarding', async () => {
      const routes = ['/dashboard', '/kegiatan', '/absensi', '/tugas'];
      for (const route of routes) {
        const req = createMockRequest(route);
        const res = await proxy(req);
        expect(res.redirected).toBe(true);
        expect(res.url).toBe('/onboarding');
      }
    });

    it('should allow accessing /onboarding route', async () => {
      const req = createMockRequest('/onboarding');
      const res = await proxy(req);
      expect(res.redirected).toBeUndefined();
      expect(res.status).toBe(200);
    });

    it('should redirect auth routes to /onboarding', async () => {
      const req = createMockRequest('/login');
      const res = await proxy(req);
      expect(res.redirected).toBe(true);
      expect(res.url).toBe('/onboarding');
    });
  });

  describe('[Kondisi 3] Berkas Pendaftaran Menunggu Verifikasi Admin', () => {
    beforeEach(() => {
      mockUser = { id: 'user-123', email: 'caang3@robotik.org' };
      mockProfile = { role: 'caang', is_onboarded: false };
      mockRegStatus = 'pending';
    });

    it('should redirect internal and onboarding/auth routes to /waiting', async () => {
      const routes = ['/dashboard', '/kegiatan', '/absensi', '/onboarding', '/login'];
      for (const route of routes) {
        const req = createMockRequest(route);
        const res = await proxy(req);
        expect(res.redirected).toBe(true);
        expect(res.url).toBe('/waiting');
      }
    });

    it('should allow accessing /waiting route', async () => {
      const req = createMockRequest('/waiting');
      const res = await proxy(req);
      expect(res.redirected).toBeUndefined();
      expect(res.status).toBe(200);
    });
  });

  describe('[Kondisi 4] Berkas Pendaftaran Ditolak oleh Admin OR', () => {
    beforeEach(() => {
      mockUser = { id: 'user-123', email: 'caang4@robotik.org' };
      mockProfile = { role: 'caang', is_onboarded: false };
      mockRegStatus = 'rejected';
    });

    it('should redirect internal, onboarding, waiting, and auth routes to /rejected', async () => {
      const routes = ['/dashboard', '/kegiatan', '/absensi', '/onboarding', '/waiting', '/login'];
      for (const route of routes) {
        const req = createMockRequest(route);
        const res = await proxy(req);
        expect(res.redirected).toBe(true);
        expect(res.url).toBe('/rejected');
      }
    });

    it('should allow accessing /rejected route', async () => {
      const req = createMockRequest('/rejected');
      const res = await proxy(req);
      expect(res.redirected).toBeUndefined();
      expect(res.status).toBe(200);
    });
  });

  describe('[Kondisi 5] Caang Resmi Terverifikasi (Masa Pembinaan/OR)', () => {
    beforeEach(() => {
      mockUser = { id: 'user-123', email: 'caang5@robotik.org' };
      mockProfile = { role: 'caang', is_onboarded: true };
      mockRegStatus = 'verified';
    });

    it('should allow access to /dashboard, /absensi, /kegiatan, and /tugas without redirect', async () => {
      const routes = ['/dashboard', '/absensi', '/kegiatan', '/tugas'];
      for (const route of routes) {
        const req = createMockRequest(route);
        const res = await proxy(req);
        expect(res.redirected).toBeUndefined();
        expect(res.status).toBe(200);
      }
    });

    it('should redirect other routes (like /piket or /manajemen-kelompok) to /dashboard', async () => {
      const routes = ['/piket', '/manajemen-kelompok', '/onboarding', '/waiting', '/rejected', '/login'];
      for (const route of routes) {
        const req = createMockRequest(route);
        const res = await proxy(req);
        expect(res.redirected).toBe(true);
        expect(res.url).toBe('/dashboard');
      }
    });
  });

  describe('[Kondisi 6] Anggota Tetap / Pengurus Lama (Legacy Member)', () => {
    beforeEach(() => {
      mockUser = { id: 'user-123', email: 'anggota@robotik.org' };
      mockProfile = { role: 'anggota', is_onboarded: true };
      mockRegStatus = null;
    });

    it('should allow access to /dashboard, /absensi, /kegiatan, and /piket without redirect', async () => {
      const routes = ['/dashboard', '/absensi', '/kegiatan', '/piket'];
      for (const route of routes) {
        const req = createMockRequest(route);
        const res = await proxy(req);
        expect(res.redirected).toBeUndefined();
        expect(res.status).toBe(200);
      }
    });

    it('should redirect other routes (like /tugas) to /dashboard', async () => {
      const routes = ['/tugas', '/magang', '/manajemen-kelompok', '/onboarding', '/waiting', '/rejected', '/login'];
      for (const route of routes) {
        const req = createMockRequest(route);
        const res = await proxy(req);
        expect(res.redirected).toBe(true);
        expect(res.url).toBe('/dashboard');
      }
    });
  });

  describe('[Kondisi 7] Caang di Soft-Delete / Nonaktif', () => {
    beforeEach(() => {
      mockUser = { id: 'user-123', email: 'deletedcaang@robotik.org' };
      mockProfile = { role: 'caang', is_onboarded: false };
      mockRegStatus = 'process';
      mockRegDeletedAt = '2026-05-30T15:00:00Z';
    });

    it('should redirect internal, onboarding, waiting, and auth routes to /deleted', async () => {
      const routes = [
        '/dashboard',
        '/kegiatan',
        '/absensi',
        '/tugas',
        '/magang',
        '/piket',
        '/manajemen-kelompok',
        '/manajemen-caang',
        '/onboarding',
        '/waiting',
        '/rejected',
        '/login'
      ];
      for (const route of routes) {
        const req = createMockRequest(route);
        const res = await proxy(req);
        expect(res.redirected).toBe(true);
        expect(res.url).toBe('/deleted');
      }
    });

    it('should allow accessing /deleted route', async () => {
      const req = createMockRequest('/deleted');
      const res = await proxy(req);
      expect(res.redirected).toBeUndefined();
      expect(res.status).toBe(200);
    });
  });
});
