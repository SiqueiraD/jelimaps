/**
 * Testes de integração — API POST /api/mapas/[id]/compartilhamentos
 *
 * Módulo: controle de acesso ao endpoint de compartilhamento
 *
 * Casos cobertos:
 * - Não-autenticado → 401
 * - Não-dono autenticado → 403/500 com mensagem de permissão
 * - Dono compartilha mapa → 201
 * - Body sem usuarioId → 400
 */

import { createRequest, createResponse } from 'node-mocks-http';
import compartilhamentosHandler from '@/pages/api/mapas/[id]/compartilhamentos/index';

jest.mock('next-auth/next', () => ({ getServerSession: jest.fn() }));
jest.mock('@/pages/api/auth/[...nextauth]', () => ({ authOptions: {} }));
jest.mock('@/lib/supabase', () => ({ getSupabaseAdmin: jest.fn() }));
jest.mock('@/lib/r2', () => ({ getR2Client: jest.fn() }));

import { getServerSession } from 'next-auth/next';
import { getSupabaseAdmin } from '@/lib/supabase';

const mockSession = getServerSession as jest.Mock;
const mockGetSupabaseAdmin = getSupabaseAdmin as jest.Mock;

const OWNER_ID = 'owner-uuid-aaa';
const GUEST_ID = 'guest-uuid-bbb';
const STRANGER_ID = 'stranger-uuid-ccc';
const MAPA_ID = 'mapa-privado-uuid-111';

function makeChain() {
  const c: Record<string, jest.Mock> = {};
  c.select = jest.fn().mockReturnValue(c);
  c.eq = jest.fn().mockReturnValue(c);
  c.in = jest.fn().mockReturnValue(c);
  c.single = jest.fn().mockResolvedValue({ data: null, error: null });
  c.maybeSingle = jest.fn().mockResolvedValue({ data: null });
  c.upsert = jest.fn().mockResolvedValue({ error: null });
  c.delete = jest.fn().mockReturnValue(c);
  return c;
}

function buildSupabaseMock() {
  const chains: Record<string, ReturnType<typeof makeChain>> = {
    mapas: makeChain(),
    usuarios_mapas: makeChain(),
    imagens: makeChain(),
  };

  const fromMock = jest.fn().mockImplementation((table: string) => {
    if (!chains[table]) chains[table] = makeChain();
    return chains[table];
  });

  mockGetSupabaseAdmin.mockReturnValue({ from: fromMock });
  return chains;
}

// ── POST /api/mapas/[id]/compartilhamentos ──────────────────────────────────

describe('POST /api/mapas/[id]/compartilhamentos — compartilhamento privado via API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('não-autenticado tenta compartilhar mapa → 401', async () => {
    mockSession.mockResolvedValue(null);

    const req = createRequest({
      method: 'POST',
      query: { id: MAPA_ID },
      body: { usuarioId: GUEST_ID, permissao: 'view' },
    });
    const res = createResponse();
    await compartilhamentosHandler(req, res);

    expect(res.statusCode).toBe(401);
  });

  it('não-dono autenticado tenta compartilhar mapa alheio → 403 ou 500 com mensagem de permissão', async () => {
    mockSession.mockResolvedValue({ userId: STRANGER_ID });

    const chains = buildSupabaseMock();
    chains['mapas'].single.mockResolvedValue({
      data: { dono_id: OWNER_ID },
      error: null,
    });

    const req = createRequest({
      method: 'POST',
      query: { id: MAPA_ID },
      body: { usuarioId: GUEST_ID, permissao: 'view' },
    });
    const res = createResponse();
    await compartilhamentosHandler(req, res);

    expect([403, 500]).toContain(res.statusCode);
    expect(res._getJSONData().error).toMatch(/permissão|dono/i);
  });

  it('dono compartilha mapa privado com convidado (view) → 201', async () => {
    mockSession.mockResolvedValue({ userId: OWNER_ID });

    const chains = buildSupabaseMock();
    chains['mapas'].single.mockResolvedValue({
      data: { dono_id: OWNER_ID },
      error: null,
    });

    const req = createRequest({
      method: 'POST',
      query: { id: MAPA_ID },
      body: { usuarioId: GUEST_ID, permissao: 'view' },
    });
    const res = createResponse();
    await compartilhamentosHandler(req, res);

    expect(res.statusCode).toBe(201);
  });

  it('body sem usuarioId → 400', async () => {
    mockSession.mockResolvedValue({ userId: OWNER_ID });

    const req = createRequest({
      method: 'POST',
      query: { id: MAPA_ID },
      body: { permissao: 'view' },
    });
    const res = createResponse();
    await compartilhamentosHandler(req, res);

    expect(res.statusCode).toBe(400);
  });
});
