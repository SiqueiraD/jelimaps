/**
 * Testes unitários — Serviço de Mapas (supabaseMapaService)
 *
 * Módulo: CRUD de mapas + permissões de acesso
 *
 * Casos de uso cobertos:
 * 1 - Usuário não autenticado visualiza mapa publicado
 * 2 - Usuário não autenticado tenta criar/editar mapa (sem session = sem acesso)
 * 3 - Usuário autenticado visualiza mapa publicado (auto-registro de view)
 * 4 - Usuário autenticado cria e edita mapas que é dono
 * 5 - Usuário autenticado edita mapa com permissão 'edit'
 * 6 - deletarMapa verifica ownership antes de deletar imagens R2
 */

import { getR2Client } from '@/lib/r2';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  atualizarMapa,
  autoRegistrarVisualizador,
  carregarMapa,
  criarMapa,
  deletarMapa,
} from '@/services/supabaseMapaService';
import { Session } from 'next-auth';

jest.mock('@/lib/supabase');
jest.mock('@/lib/r2');

// ── Helpers ────────────────────────────────────────────────────────────────

function makeQueryBuilder(defaultResponse: any = { data: null, error: null }) {
  const builder: any = {};

  const chainMethods = [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'is',
  ];
  chainMethods.forEach((m) => {
    builder[m] = jest.fn().mockReturnValue(builder);
  });

  builder.single = jest.fn().mockResolvedValue(defaultResponse);
  builder.maybeSingle = jest.fn().mockResolvedValue(defaultResponse);

  builder.then = (resolve: any, reject: any) =>
    Promise.resolve(defaultResponse).then(resolve, reject);

  return builder;
}

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

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    user: { name: 'Test User', email: 'test@example.com', image: null },
    expires: '2099-01-01',
    userId: 'user-123',
    ...overrides,
  } as Session;
}

const MAPA_PUBLICO = {
  id: 'mapa-abc',
  titulo: 'Mapa Público',
  publico: true,
  dono_id: 'owner-999',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  informacoes: {},
};

const MAPA_PRIVADO = {
  ...MAPA_PUBLICO,
  id: 'mapa-xyz',
  titulo: 'Mapa Privado',
  publico: false,
};

// ── CASO 1: Usuário não autenticado visualiza mapa publicado ─────────────────

describe('Caso 1 – Usuário não autenticado visualiza mapa publicado', () => {
  it('carregarMapa retorna o mapa quando session=null e mapa é público', async () => {
    const mapaBuilder = makeQueryBuilder({ data: MAPA_PUBLICO, error: null });
    (getSupabaseAdmin as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue(mapaBuilder),
    });

    const result = await carregarMapa(null, 'mapa-abc');

    expect(result).toMatchObject({ id: 'mapa-abc', publico: true });
  });

  it('carregarMapa retorna null quando mapa não existe (PGRST116)', async () => {
    const mapaBuilder = makeQueryBuilder({
      data: null,
      error: { code: 'PGRST116', message: 'not found' },
    });
    (getSupabaseAdmin as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue(mapaBuilder),
    });

    const result = await carregarMapa(null, 'mapa-inexistente');

    expect(result).toBeNull();
  });

  it('carregarMapa lança PERMISSION_DENIED quando session=null e mapa é privado', async () => {
    const mapaBuilder = makeQueryBuilder({ data: MAPA_PRIVADO, error: null });
    (getSupabaseAdmin as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue(mapaBuilder),
    });

    await expect(carregarMapa(null, 'mapa-xyz')).rejects.toThrow(
      'PERMISSION_DENIED'
    );
  });
});

// ── CASO 2: Usuário não autenticado tenta criar/editar ───────────────────────
// A camada de serviço exige session, a verificação de 401 ocorre nas API routes
// Aqui testamos que atualizarMapa lança erro quando não é dono nem tem permissão

describe('Caso 2 – Usuário não autenticado não pode criar/editar (sem session)', () => {
  it('atualizarMapa lança erro quando mapa não é encontrado (proteção robusta)', async () => {
    const from = jest.fn();
    const mapaBuilder = makeQueryBuilder({ data: null, error: null });
    from.mockReturnValue(mapaBuilder);

    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    const session = makeSession({ userId: 'estranho-user' });

    await expect(
      atualizarMapa(session, 'mapa-xyz', { titulo: 'Hack' })
    ).rejects.toThrow('Mapa não encontrado');
  });
});

// ── CASO 3: Usuário autenticado visualiza mapa publicado (auto-registro) ─────

describe('Caso 3 – Usuário autenticado visualiza mapa publicado (auto-registro de view)', () => {
  it('carregarMapa retorna mapa público para usuário autenticado sem entrada em usuarios_mapas', async () => {
    const from = jest.fn();
    const mapaBuilder = makeQueryBuilder({ data: MAPA_PUBLICO, error: null });
    const permBuilder = makeQueryBuilder({ data: null, error: null });

    from.mockImplementation((table: string) => {
      if (table === 'mapas') return mapaBuilder;
      if (table === 'usuarios_mapas') return permBuilder;
      return makeQueryBuilder();
    });

    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    const session = makeSession({ userId: 'novo-usuario' });
    const result = await carregarMapa(session, 'mapa-abc');

    expect(result).toMatchObject({ id: 'mapa-abc', publico: true });
  });

  it('autoRegistrarVisualizador insere permissão view quando não existe entrada prévia', async () => {
    const from = jest.fn();
    const selectBuilder = makeQueryBuilder({ data: null, error: null });
    const insertBuilder = makeQueryBuilder({ data: null, error: null });

    let callCount = 0;
    from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return selectBuilder;
      return insertBuilder;
    });

    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    await autoRegistrarVisualizador('user-abc', 'mapa-abc');

    expect(insertBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        usuario_id: 'user-abc',
        mapa_id: 'mapa-abc',
        permissao: 'view',
      })
    );
  });

  it('autoRegistrarVisualizador NÃO insere quando permissão já existe', async () => {
    const from = jest.fn();
    const selectBuilder = makeQueryBuilder({
      data: { permissao: 'view' },
      error: null,
    });

    from.mockReturnValue(selectBuilder);
    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    await autoRegistrarVisualizador('user-abc', 'mapa-abc');

    expect(selectBuilder.insert).not.toHaveBeenCalled();
  });
});

// ── CASO 4: Usuário autenticado cria e edita mapas que é dono ────────────────

describe('Caso 4 – Usuário autenticado cria e edita mapas (é o dono)', () => {
  it('criarMapa retorna o id do novo mapa', async () => {
    const mapaBuilder = makeQueryBuilder({
      data: { id: 'novo-mapa-id' },
      error: null,
    });
    (getSupabaseAdmin as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue(mapaBuilder),
    });

    const session = makeSession({ userId: 'user-123' });
    const id = await criarMapa(session, 'Meu Mapa', {} as any);

    expect(id).toBe('novo-mapa-id');
  });

  it('criarMapa lança erro quando Supabase retorna erro', async () => {
    const mapaBuilder = makeQueryBuilder({
      data: null,
      error: { message: 'DB error' },
    });
    (getSupabaseAdmin as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue(mapaBuilder),
    });

    const session = makeSession({ userId: 'user-123' });

    await expect(criarMapa(session, 'Meu Mapa', {} as any)).rejects.toThrow(
      'Erro ao criar mapa'
    );
  });

  it('atualizarMapa permite atualização quando usuário é o dono', async () => {
    const OWNER_ID = 'user-123';
    const from = jest.fn();

    const selectBuilder = makeQueryBuilder({
      data: { dono_id: OWNER_ID },
      error: null,
    });
    const updateBuilder = makeQueryBuilder({ data: null, error: null });

    let callCount = 0;
    from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return selectBuilder;
      return updateBuilder;
    });

    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    const session = makeSession({ userId: OWNER_ID });

    await expect(
      atualizarMapa(session, 'mapa-abc', { titulo: 'Novo Título' })
    ).resolves.not.toThrow();

    expect(updateBuilder.update).toHaveBeenCalledWith({
      titulo: 'Novo Título',
    });
  });

  it('atualizarMapa lança erro quando Supabase retorna erro no update', async () => {
    const OWNER_ID = 'user-123';
    const from = jest.fn();

    const selectBuilder = makeQueryBuilder({
      data: { dono_id: OWNER_ID },
      error: null,
    });
    const updateBuilder = makeQueryBuilder({
      data: null,
      error: { message: 'constraint violation' },
    });

    let callCount = 0;
    from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return selectBuilder;
      return updateBuilder;
    });

    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    const session = makeSession({ userId: OWNER_ID });

    await expect(
      atualizarMapa(session, 'mapa-abc', { titulo: 'X' })
    ).rejects.toThrow('Erro ao atualizar mapa');
  });
});

// ── CASO 5: Usuário autenticado edita mapa com permissão 'edit' ──────────────

describe('Caso 5 – Usuário autenticado edita mapa com permissão de editar', () => {
  it('atualizarMapa permite quando usuário tem permissão edit', async () => {
    const OWNER_ID = 'outro-dono';
    const USER_ID = 'user-editor';
    const from = jest.fn();

    const selectMapaBuilder = makeQueryBuilder({
      data: { dono_id: OWNER_ID },
      error: null,
    });
    const selectPermBuilder = makeQueryBuilder({
      data: { permissao: 'edit' },
      error: null,
    });
    const updateBuilder = makeQueryBuilder({ data: null, error: null });

    let callCount = 0;
    from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return selectMapaBuilder;
      if (callCount === 2) return selectPermBuilder;
      return updateBuilder;
    });

    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    const session = makeSession({ userId: USER_ID });

    await expect(
      atualizarMapa(session, 'mapa-abc', { titulo: 'Editado' })
    ).resolves.not.toThrow();
    expect(updateBuilder.update).toHaveBeenCalledWith({ titulo: 'Editado' });
  });

  it('atualizarMapa BLOQUEIA quando usuário tem apenas permissão view', async () => {
    const OWNER_ID = 'outro-dono';
    const USER_ID = 'user-viewer';
    const from = jest.fn();

    const selectMapaBuilder = makeQueryBuilder({
      data: { dono_id: OWNER_ID },
      error: null,
    });
    const selectPermBuilder = makeQueryBuilder({ data: null, error: null });

    let callCount = 0;
    from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return selectMapaBuilder;
      return selectPermBuilder;
    });

    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    const session = makeSession({ userId: USER_ID });

    await expect(
      atualizarMapa(session, 'mapa-abc', { titulo: 'Hack' })
    ).rejects.toThrow('Sem permissão para editar este mapa');
  });

  it('atualizarMapa BLOQUEIA quando usuário não tem nenhum compartilhamento', async () => {
    const OWNER_ID = 'outro-dono';
    const USER_ID = 'user-sem-acesso';
    const from = jest.fn();

    const selectMapaBuilder = makeQueryBuilder({
      data: { dono_id: OWNER_ID },
      error: null,
    });
    const selectPermBuilder = makeQueryBuilder({ data: null, error: null });

    let callCount = 0;
    from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return selectMapaBuilder;
      return selectPermBuilder;
    });

    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    const session = makeSession({ userId: USER_ID });

    await expect(
      atualizarMapa(session, 'mapa-abc', { titulo: 'Invasão' })
    ).rejects.toThrow('Sem permissão para editar este mapa');
  });
});

// ── CASO 6: deletarMapa verifica ownership antes de deletar R2 ──────────────

describe('Caso 6 – deletarMapa verifica ownership antes de deletar imagens R2', () => {
  const OWNER_ID = 'owner-uuid-aaa';
  const STRANGER_ID = 'stranger-uuid-ccc';
  const MAPA_ID = 'mapa-uuid-111';

  beforeEach(() => jest.clearAllMocks());

  it('não-dono NÃO consegue deletar imagens R2 de mapa alheio', async () => {
    const mockSend = jest.fn().mockResolvedValue({});
    (getR2Client as jest.Mock).mockReturnValue({ send: mockSend });

    const mapasChain = makeChain();
    mapasChain.single.mockResolvedValue({
      data: { dono_id: OWNER_ID },
      error: null,
    });

    const imagensChain = makeChain();
    imagensChain.then = (resolve: any) =>
      Promise.resolve({
        data: [{ caminho: 'img1.png' }, { caminho: 'img2.png' }],
        error: null,
      }).then(resolve);

    const from = jest.fn().mockImplementation((table: string) => {
      if (table === 'mapas') return mapasChain;
      if (table === 'imagens') return imagensChain;
      return makeChain();
    });

    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    await expect(
      deletarMapa(makeSession({ userId: STRANGER_ID }) as any, MAPA_ID)
    ).rejects.toThrow(/permissão|não encontrado/i);

    expect(mockSend).not.toHaveBeenCalled();
  });

  it('dono pode deletar mapa e suas imagens R2', async () => {
    const mockSend = jest.fn().mockResolvedValue({});
    (getR2Client as jest.Mock).mockReturnValue({ send: mockSend });

    const ownerCheckChain = makeChain();
    ownerCheckChain.single.mockResolvedValue({
      data: { dono_id: OWNER_ID },
      error: null,
    });

    const imagensSelectChain = makeChain();
    imagensSelectChain.then = (resolve: any) =>
      Promise.resolve({
        data: [{ caminho: 'img1.png' }],
        error: null,
      }).then(resolve);

    const imagensDeleteChain = makeChain();
    imagensDeleteChain.then = (resolve: any) =>
      Promise.resolve({ error: null }).then(resolve);

    const mapasDeleteChain = makeChain();
    mapasDeleteChain.then = (resolve: any) =>
      Promise.resolve({ error: null }).then(resolve);

    let fromCallCount = 0;
    const from = jest.fn().mockImplementation(() => {
      fromCallCount++;
      if (fromCallCount === 1) return ownerCheckChain;
      if (fromCallCount === 2) return imagensSelectChain;
      if (fromCallCount === 3) return imagensDeleteChain;
      return mapasDeleteChain;
    });

    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    await expect(
      deletarMapa(makeSession({ userId: OWNER_ID }) as any, MAPA_ID)
    ).resolves.toBeUndefined();

    expect(mockSend).toHaveBeenCalledTimes(1);
  });
});
