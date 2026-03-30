/**
 * Testes de integração — API DELETE /api/imagens/by-url
 *
 * Módulo: deleção de imagens com verificação de ownership
 *
 * Casos cobertos:
 * - Não-dono autenticado NÃO deleta objeto do R2 → 403
 * - Dono autenticado deleta imagem do R2 e do banco → 200
 * - Imagem não encontrada no banco → 403 (sem deleção R2 cega)
 */

jest.mock('next-auth/next', () => ({ getServerSession: jest.fn() }));
jest.mock('@/pages/api/auth/[...nextauth]', () => ({ authOptions: {} }));
jest.mock('@/lib/supabase', () => ({ getSupabaseAdmin: jest.fn() }));
jest.mock('@/lib/r2', () => ({ getR2Client: jest.fn() }));

const OWNER_ID = 'owner-uuid-aaa';
const STRANGER_ID = 'stranger-uuid-ccc';
const MAPA_ID = 'mapa-uuid-111';

function makeChain(overrides: Record<string, any> = {}) {
  const c: Record<string, any> = {};
  c.select = jest.fn().mockReturnValue(c);
  c.insert = jest.fn().mockReturnValue(c);
  c.update = jest.fn().mockReturnValue(c);
  c.delete = jest.fn().mockReturnValue(c);
  c.upsert = jest.fn().mockReturnValue(c);
  c.eq = jest.fn().mockReturnValue(c);
  c.in = jest.fn().mockReturnValue(c);
  c.order = jest.fn().mockReturnValue(c);
  c.single = jest.fn().mockResolvedValue({ data: null, error: null });
  c.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  c.then = (resolve: any, reject: any) =>
    Promise.resolve({ data: null, error: null }).then(resolve, reject);
  Object.assign(c, overrides);
  return c;
}

describe('DELETE /api/imagens/by-url — ownership gate para R2', () => {
  let handler: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();

    jest.mock('next-auth/next', () => ({ getServerSession: jest.fn() }));
    jest.mock('@/pages/api/auth/[...nextauth]', () => ({ authOptions: {} }));
    jest.mock('@/lib/supabase', () => ({ getSupabaseAdmin: jest.fn() }));
    jest.mock('@/lib/r2', () => ({ getR2Client: jest.fn() }));

    handler = (await import('@/pages/api/imagens/by-url')).default;
  });

  function createMockReqRes(method: string, body: any) {
    const { createRequest, createResponse } = require('node-mocks-http');
    const req = createRequest({ method, body });
    const res = createResponse();
    return { req, res };
  }

  it('não-dono autenticado NÃO deleta objeto do R2 → 403', async () => {
    const { getServerSession } = require('next-auth/next');
    const { getSupabaseAdmin: mockGetAdmin } = require('@/lib/supabase');
    const { getR2Client: mockGetR2 } = require('@/lib/r2');

    (getServerSession as jest.Mock).mockResolvedValue({ userId: STRANGER_ID });

    const mockSend = jest.fn().mockResolvedValue({});
    (mockGetR2 as jest.Mock).mockReturnValue({ send: mockSend });

    const imagensChain = makeChain();
    imagensChain.maybeSingle.mockResolvedValue({
      data: { id: 'img-1', mapa_id: MAPA_ID, caminho: 'some-key' },
      error: null,
    });

    const mapasChain = makeChain();
    mapasChain.maybeSingle.mockResolvedValue({ data: null, error: null });

    const from = jest.fn().mockImplementation((table: string) => {
      if (table === 'imagens') return imagensChain;
      if (table === 'mapas') return mapasChain;
      return makeChain();
    });

    (mockGetAdmin as jest.Mock).mockReturnValue({ from });

    const { req, res } = createMockReqRes('DELETE', { key: 'some-key' });
    await handler(req, res);

    expect(mockSend).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });

  it('dono autenticado deleta imagem do R2 e do banco → 200', async () => {
    const { getServerSession } = require('next-auth/next');
    const { getSupabaseAdmin: mockGetAdmin } = require('@/lib/supabase');
    const { getR2Client: mockGetR2 } = require('@/lib/r2');

    (getServerSession as jest.Mock).mockResolvedValue({ userId: OWNER_ID });

    const mockSend = jest.fn().mockResolvedValue({});
    (mockGetR2 as jest.Mock).mockReturnValue({ send: mockSend });

    const imagensChain = makeChain();
    imagensChain.maybeSingle.mockResolvedValue({
      data: { id: 'img-1', mapa_id: MAPA_ID, caminho: 'some-key' },
      error: null,
    });

    const mapasChain = makeChain();
    mapasChain.maybeSingle.mockResolvedValue({
      data: { dono_id: OWNER_ID },
      error: null,
    });

    const imagensDeleteChain = makeChain();

    let imagensCalls = 0;
    const from = jest.fn().mockImplementation((table: string) => {
      if (table === 'imagens') {
        imagensCalls++;
        if (imagensCalls === 1) return imagensChain;
        return imagensDeleteChain;
      }
      if (table === 'mapas') return mapasChain;
      return makeChain();
    });

    (mockGetAdmin as jest.Mock).mockReturnValue({ from });

    const { req, res } = createMockReqRes('DELETE', { key: 'some-key' });
    await handler(req, res);

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
  });

  it('imagem não encontrada no banco → NÃO deleta R2, retorna 403', async () => {
    const { getServerSession } = require('next-auth/next');
    const { getSupabaseAdmin: mockGetAdmin } = require('@/lib/supabase');
    const { getR2Client: mockGetR2 } = require('@/lib/r2');

    (getServerSession as jest.Mock).mockResolvedValue({ userId: STRANGER_ID });

    const mockSend = jest.fn().mockResolvedValue({});
    (mockGetR2 as jest.Mock).mockReturnValue({ send: mockSend });

    const imagensChain = makeChain();
    imagensChain.maybeSingle.mockResolvedValue({ data: null, error: null });

    const from = jest.fn().mockImplementation(() => imagensChain);
    (mockGetAdmin as jest.Mock).mockReturnValue({ from });

    const { req, res } = createMockReqRes('DELETE', { key: 'orphan-key' });
    await handler(req, res);

    expect(mockSend).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });
});
