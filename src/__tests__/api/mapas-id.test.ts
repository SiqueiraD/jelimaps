/**
 * Testes de integração — API GET/PUT/DELETE /api/mapas/[id]
 *
 * Módulo: operações em mapa individual via API
 *
 * Casos cobertos:
 * 1 - Não autenticado visualiza mapa publicado → 200
 * 2 - Não autenticado tenta editar/deletar → 401
 * 3 - Autenticado visualiza mapa publicado → 200
 * 4 - Autenticado (dono) edita e deleta mapa → 200/204
 * 5 - Autenticado (editor) edita mapa → 200
 */

import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '@/pages/api/mapas/[id]/index';

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
  carregarMapa: jest.fn(),
  atualizarMapa: jest.fn(),
  deletarMapa: jest.fn(),
}));

import { getServerSession } from 'next-auth/next';
import { carregarMapa, atualizarMapa, deletarMapa } from '@/services/supabaseMapaService';

const MAPA_PUBLICO = {
  id: 'mapa-pub',
  titulo: 'Mapa Público',
  publico: true,
  dono_id: 'owner-999',
  informacoes: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const SESSION_DONO = {
  userId: 'owner-999',
  user: { name: 'Dono', email: 'dono@test.com', image: null },
  expires: '2099-01-01',
};

const SESSION_EDITOR = {
  userId: 'editor-111',
  user: { name: 'Editor', email: 'editor@test.com', image: null },
  expires: '2099-01-01',
};

// ── Caso 1: Não autenticado visualiza mapa publicado ────────────────────────

describe('Não autenticado visualiza mapa publicado', () => {
  beforeEach(() => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
  });

  it('GET /api/mapas/[id] sem sessão com mapa público retorna 200', async () => {
    (carregarMapa as jest.Mock).mockResolvedValue(MAPA_PUBLICO);

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { id: 'mapa-pub' },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toMatchObject({ id: 'mapa-pub', publico: true });
    expect(carregarMapa).toHaveBeenCalledWith(null, 'mapa-pub');
  });

  it('GET /api/mapas/[id] sem sessão quando mapa não existe retorna 404', async () => {
    (carregarMapa as jest.Mock).mockResolvedValue(null);

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { id: 'mapa-inexistente' },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(404);
  });

  it('GET /api/mapas/[id] sem sessão com mapa privado retorna 403', async () => {
    (carregarMapa as jest.Mock).mockRejectedValue(new Error('PERMISSION_DENIED'));

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { id: 'mapa-privado' },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(403);
    expect(res._getJSONData()).toEqual({ error: 'Acesso negado a este mapa' });
  });
});

// ── Caso 2: Não autenticado não pode editar/deletar ─────────────────────────

describe('Não autenticado não pode editar/deletar', () => {
  beforeEach(() => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
  });

  it('PUT /api/mapas/[id] sem sessão retorna 401', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'PUT',
      query: { id: 'mapa-pub' },
      body: { titulo: 'Hack' },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res._getJSONData()).toEqual({ error: 'Não autenticado' });
    expect(atualizarMapa).not.toHaveBeenCalled();
  });

  it('DELETE /api/mapas/[id] sem sessão retorna 401', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'DELETE',
      query: { id: 'mapa-pub' },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(deletarMapa).not.toHaveBeenCalled();
  });
});

// ── Caso 3: Autenticado visualiza mapa publicado ────────────────────────────

describe('Autenticado visualiza mapa publicado', () => {
  beforeEach(() => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION_EDITOR);
  });

  it('GET /api/mapas/[id] com sessão e mapa público retorna 200', async () => {
    (carregarMapa as jest.Mock).mockResolvedValue(MAPA_PUBLICO);

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
      query: { id: 'mapa-pub' },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toMatchObject({ id: 'mapa-pub' });
    expect(carregarMapa).toHaveBeenCalledWith(SESSION_EDITOR, 'mapa-pub');
  });
});

// ── Caso 4: Dono edita e deleta mapa ────────────────────────────────────────

describe('Dono edita e deleta mapa', () => {
  beforeEach(() => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION_DONO);
  });

  it('PUT /api/mapas/[id] com sessão do dono retorna 200', async () => {
    (atualizarMapa as jest.Mock).mockResolvedValue(undefined);

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'PUT',
      query: { id: 'mapa-pub' },
      body: { titulo: 'Novo Título' },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({ ok: true });
    expect(atualizarMapa).toHaveBeenCalledWith(SESSION_DONO, 'mapa-pub', { titulo: 'Novo Título' });
  });

  it('DELETE /api/mapas/[id] com sessão do dono retorna 204', async () => {
    (deletarMapa as jest.Mock).mockResolvedValue(undefined);

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'DELETE',
      query: { id: 'mapa-pub' },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(204);
    expect(deletarMapa).toHaveBeenCalledWith(SESSION_DONO, 'mapa-pub');
  });

  it('PUT /api/mapas/[id] retorna 500 quando serviço lança erro genérico', async () => {
    (atualizarMapa as jest.Mock).mockRejectedValue(new Error('DB error'));

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'PUT',
      query: { id: 'mapa-pub' },
      body: { titulo: 'X' },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._getJSONData().error).toContain('DB error');
  });
});

// ── Caso 5: Editor edita mapa ───────────────────────────────────────────────

describe('Editor edita mapa', () => {
  beforeEach(() => {
    (getServerSession as jest.Mock).mockResolvedValue(SESSION_EDITOR);
  });

  it('PUT /api/mapas/[id] com sessão do editor (tem permissão edit) retorna 200', async () => {
    (atualizarMapa as jest.Mock).mockResolvedValue(undefined);

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'PUT',
      query: { id: 'mapa-pub' },
      body: { titulo: 'Editado pelo editor' },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(atualizarMapa).toHaveBeenCalledWith(SESSION_EDITOR, 'mapa-pub', {
      titulo: 'Editado pelo editor',
    });
  });

  it('PUT /api/mapas/[id] quando serviço lança "Sem permissão" retorna 500 com mensagem', async () => {
    (atualizarMapa as jest.Mock).mockRejectedValue(
      new Error('Sem permissão para editar este mapa')
    );

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'PUT',
      query: { id: 'mapa-privado' },
      body: { titulo: 'Hack' },
    });

    await handler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._getJSONData().error).toContain('Sem permissão');
  });
});
