/**
 * Testes de integração — API GET/POST /api/mapas
 *
 * Módulo: listagem e criação de mapas via API
 *
 * Casos cobertos:
 * - Não-autenticado tenta criar/listar → 401
 * - Autenticado cria mapa → 201
 * - Autenticado lista mapas → 200
 * - Validação de body → 400
 * - Método não permitido → 405
 */

import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '@/pages/api/mapas/index';

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/pages/api/auth/[...nextauth]', () => ({
  authOptions: {},
}));

jest.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: jest.fn(),
}));

jest.mock('@/services/supabaseMapaService', () => ({
  listarMeusMapas: jest.fn(),
  criarMapa: jest.fn(),
}));

import { getServerSession } from 'next-auth/next';
import { listarMeusMapas, criarMapa } from '@/services/supabaseMapaService';

const SESSION_DONO = {
  userId: 'user-123',
  user: { name: 'Dono', email: 'dono@test.com', image: null },
  expires: '2099-01-01',
};

// ── Não autenticado ─────────────────────────────────────────────────────────

describe('Não autenticado não pode criar mapas', () => {
  beforeEach(() => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
  });

  it('POST /api/mapas sem sessão retorna 401', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { titulo: 'Teste', informacoes: {} },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res._getJSONData()).toEqual({ error: 'Não autenticado' });
  });

  it('GET /api/mapas sem sessão retorna 401', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET' });

    await handler(req, res);

    expect(res.statusCode).toBe(401);
  });
});

// ── Autenticado: criação e listagem ─────────────────────────────────────────

describe('Autenticado cria e lista mapas', () => {
  beforeEach(() => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION_DONO);
  });

  it('POST /api/mapas com sessão e body válido retorna 201 com id', async () => {
    (criarMapa as jest.Mock).mockResolvedValue('novo-mapa-id');

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { titulo: 'Meu Mapa', informacoes: { conteudo: {} } },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(201);
    expect(res._getJSONData()).toEqual({ id: 'novo-mapa-id' });
    expect(criarMapa).toHaveBeenCalledWith(
      SESSION_DONO,
      'Meu Mapa',
      { conteudo: {} },
      false
    );
  });

  it('POST /api/mapas sem titulo retorna 400', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { informacoes: {} },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().error).toContain('obrigatórios');
  });

  it('POST /api/mapas sem informacoes retorna 400', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { titulo: 'Mapa Sem Info' },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(400);
  });

  it('GET /api/mapas com sessão retorna 200 com lista', async () => {
    const mapas = [
      { id: 'a', titulo: 'Mapa A', permissao: 'dono' },
      { id: 'b', titulo: 'Mapa B', permissao: 'edit' },
    ];
    (listarMeusMapas as jest.Mock).mockResolvedValue(mapas);

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET' });

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual(mapas);
    expect(listarMeusMapas).toHaveBeenCalledWith(SESSION_DONO);
  });

  it('POST /api/mapas com publico=true passa o valor correto para o serviço', async () => {
    (criarMapa as jest.Mock).mockResolvedValue('mapa-publico-id');

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { titulo: 'Mapa Público', informacoes: {}, publico: true },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(201);
    expect(criarMapa).toHaveBeenCalledWith(SESSION_DONO, 'Mapa Público', {}, true);
  });

  it('POST /api/mapas retorna 500 quando serviço lança erro', async () => {
    (criarMapa as jest.Mock).mockRejectedValue(new Error('DB error'));

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: { titulo: 'Falha', informacoes: {} },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._getJSONData().error).toContain('DB error');
  });

  it('DELETE /api/mapas retorna 405 (método não permitido)', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'DELETE' });

    await handler(req, res);

    expect(res.statusCode).toBe(405);
  });
});
