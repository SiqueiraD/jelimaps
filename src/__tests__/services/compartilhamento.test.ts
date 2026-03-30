/**
 * Testes unitários — Serviço de Compartilhamento
 *
 * Módulo: compartilhamento de mapas, busca de usuários, listagem de permissões
 *
 * Funções cobertas:
 * - compartilharMapa (ownership check)
 * - removerCompartilhamento (ownership check)
 * - buscarUsuarioPorEmail (consulta tabela usuarios)
 * - listarCompartilhamentos (resolve emails via tabela usuarios)
 * - listarMeusMapas (mapa compartilhado aparece para convidado)
 */

import { getSupabaseAdmin } from '@/lib/supabase';
import {
  buscarUsuarioPorEmail,
  compartilharMapa,
  listarCompartilhamentos,
  listarMeusMapas,
  removerCompartilhamento,
} from '@/services/supabaseMapaService';

jest.mock('@/lib/supabase');
jest.mock('@/lib/r2');

// ── Helpers ──────────────────────────────────────────────────────────────────

const OWNER_ID = 'owner-uuid-aaa';
const GUEST_ID = 'guest-uuid-bbb';
const STRANGER_ID = 'stranger-uuid-ccc';
const MAPA_ID = 'mapa-privado-uuid-111';

function makeSession(userId: string) {
  return {
    userId,
    user: { name: 'Test', email: 'test@test.com' },
    expires: '2099-01-01',
  } as any;
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
  c.then = (resolve: (v: any) => any, reject: (e: any) => any) =>
    Promise.resolve({ data: null, error: null }).then(resolve, reject);
  Object.assign(c, overrides);
  return c;
}

function buildSupabaseMock() {
  const chains: Record<string, ReturnType<typeof makeChain>> = {
    mapas: makeChain(),
    usuarios_mapas: makeChain(),
    usuarios: makeChain(),
    imagens: makeChain(),
  };

  const fromMock = jest.fn().mockImplementation((table: string) => {
    if (!chains[table]) chains[table] = makeChain();
    return chains[table];
  });

  (getSupabaseAdmin as jest.Mock).mockReturnValue({ from: fromMock });
  return chains;
}

// ── compartilharMapa — verificação de ownership ─────────────────────────────

describe('compartilharMapa — verificação de ownership', () => {
  beforeEach(() => jest.clearAllMocks());

  it('não-dono tenta compartilhar mapa alheio → deve lançar erro de permissão', async () => {
    buildSupabaseMock();
    const chains = buildSupabaseMock();

    chains['mapas'].single.mockResolvedValue({
      data: { dono_id: OWNER_ID },
      error: null,
    });

    await expect(
      compartilharMapa(makeSession(STRANGER_ID), MAPA_ID, GUEST_ID, 'view')
    ).rejects.toThrow(/permissão|dono/i);
  });

  it('dono compartilha mapa privado com usuário convidado (view) → deve resolver sem erro', async () => {
    const chains = buildSupabaseMock();

    chains['mapas'].single.mockResolvedValue({
      data: { dono_id: OWNER_ID },
      error: null,
    });
    chains['usuarios_mapas'] = {
      ...chains['usuarios_mapas'],
      upsert: jest.fn().mockResolvedValue({ error: null }),
    } as any;

    await expect(
      compartilharMapa(makeSession(OWNER_ID), MAPA_ID, GUEST_ID, 'view')
    ).resolves.toBeUndefined();
  });

  it('mapa não encontrado ao tentar compartilhar → deve lançar erro', async () => {
    const chains = buildSupabaseMock();

    chains['mapas'].single.mockResolvedValue({ data: null, error: null });

    await expect(
      compartilharMapa(makeSession(OWNER_ID), MAPA_ID, GUEST_ID, 'view')
    ).rejects.toThrow(/não encontrado|mapa/i);
  });
});

// ── removerCompartilhamento — verificação de ownership ──────────────────────

describe('removerCompartilhamento — verificação de ownership', () => {
  beforeEach(() => jest.clearAllMocks());

  it('dono do mapa pode remover compartilhamento', async () => {
    const mapasChain = makeChain();
    mapasChain.single.mockResolvedValue({
      data: { dono_id: OWNER_ID },
      error: null,
    });

    const usuariosMapasChain = makeChain();
    usuariosMapasChain.then = (resolve: any) =>
      Promise.resolve({ error: null }).then(resolve);

    const from = jest.fn().mockImplementation((table: string) => {
      if (table === 'mapas') return mapasChain;
      if (table === 'usuarios_mapas') return usuariosMapasChain;
      return makeChain();
    });

    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    await expect(
      removerCompartilhamento(makeSession(OWNER_ID), MAPA_ID, GUEST_ID)
    ).resolves.toBeUndefined();
  });

  it('não-dono NÃO pode remover compartilhamento — deve lançar erro', async () => {
    const mapasChain = makeChain();
    mapasChain.single.mockResolvedValue({
      data: { dono_id: OWNER_ID },
      error: null,
    });

    const from = jest.fn().mockImplementation((table: string) => {
      if (table === 'mapas') return mapasChain;
      return makeChain();
    });

    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    await expect(
      removerCompartilhamento(makeSession(STRANGER_ID), MAPA_ID, GUEST_ID)
    ).rejects.toThrow(/permissão|dono/i);
  });

  it('mapa não encontrado ao tentar remover compartilhamento — deve lançar erro', async () => {
    const mapasChain = makeChain();
    mapasChain.single.mockResolvedValue({ data: null, error: null });

    const from = jest.fn().mockImplementation((table: string) => {
      if (table === 'mapas') return mapasChain;
      return makeChain();
    });

    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    await expect(
      removerCompartilhamento(makeSession(OWNER_ID), MAPA_ID, GUEST_ID)
    ).rejects.toThrow(/não encontrado/i);
  });
});

// ── buscarUsuarioPorEmail — consulta tabela usuarios ────────────────────────

describe('buscarUsuarioPorEmail — consulta tabela usuarios', () => {
  beforeEach(() => jest.clearAllMocks());

  it('encontra usuário pela tabela usuarios', async () => {
    const usuariosChain = makeChain();
    usuariosChain.maybeSingle.mockResolvedValue({
      data: { id: 'found-user-id' },
      error: null,
    });

    const from = jest.fn().mockImplementation((table: string) => {
      if (table === 'usuarios') return usuariosChain;
      return makeChain();
    });

    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    const result = await buscarUsuarioPorEmail('user@example.com');

    expect(result).toBe('found-user-id');
    expect(from).toHaveBeenCalledWith('usuarios');
  });

  it('retorna null quando email não encontrado', async () => {
    const usuariosChain = makeChain();
    usuariosChain.maybeSingle.mockResolvedValue({ data: null, error: null });

    const from = jest.fn().mockImplementation(() => usuariosChain);
    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    const result = await buscarUsuarioPorEmail('nobody@example.com');

    expect(result).toBeNull();
  });

  it('é case-insensitive', async () => {
    const usuariosChain = makeChain();
    usuariosChain.maybeSingle.mockResolvedValue({
      data: { id: 'user-ci' },
      error: null,
    });

    const from = jest.fn().mockImplementation(() => usuariosChain);
    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    const result = await buscarUsuarioPorEmail('User@Example.COM');

    expect(result).toBe('user-ci');
  });
});

// ── listarCompartilhamentos — resolve emails via tabela usuarios ────────────

describe('listarCompartilhamentos — consulta tabela usuarios', () => {
  beforeEach(() => jest.clearAllMocks());

  it('resolve emails via tabela usuarios, não auth.admin', async () => {
    const mapasChain = makeChain();
    mapasChain.single.mockResolvedValue({
      data: { dono_id: OWNER_ID },
      error: null,
    });

    const usuariosMapasChain = makeChain();
    usuariosMapasChain.then = (resolve: any) =>
      Promise.resolve({
        data: [
          { usuario_id: GUEST_ID, permissao: 'view', created_at: '2025-01-01' },
        ],
        error: null,
      }).then(resolve);

    const usuariosChain = makeChain();
    usuariosChain.then = (resolve: any) =>
      Promise.resolve({
        data: [{ id: GUEST_ID, email: 'guest@test.com' }],
        error: null,
      }).then(resolve);

    const from = jest.fn().mockImplementation((table: string) => {
      if (table === 'mapas') return mapasChain;
      if (table === 'usuarios_mapas') return usuariosMapasChain;
      if (table === 'usuarios') return usuariosChain;
      return makeChain();
    });

    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    const result = await listarCompartilhamentos(
      makeSession(OWNER_ID),
      MAPA_ID
    );

    expect(result).toHaveLength(1);
    expect(result[0].email).toBe('guest@test.com');
    expect(from).toHaveBeenCalledWith('usuarios');
  });
});

// ── listarMeusMapas — mapa compartilhado aparece para convidado ─────────────

describe('listarMeusMapas — visibilidade de mapas compartilhados', () => {
  beforeEach(() => jest.clearAllMocks());

  it('mapa privado compartilhado com permissão view aparece na lista do convidado', async () => {
    const mapaMock = {
      id: MAPA_ID,
      titulo: 'Mapa Privado do Dono',
      publico: false,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      dono_id: OWNER_ID,
    };

    const from = jest.fn().mockImplementation((table: string) => {
      if (table === 'mapas') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({ data: [mapaMock], error: null }),
          single: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      if (table === 'usuarios_mapas') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: [{ mapa_id: MAPA_ID, permissao: 'view' }],
            error: null,
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
    });

    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    const result = await listarMeusMapas(makeSession(GUEST_ID));

    const mapaCompartilhado = result.find((m) => m.id === MAPA_ID);
    expect(mapaCompartilhado).toBeDefined();
    expect(mapaCompartilhado?.permissao).toBe('view');
    expect(mapaCompartilhado?.publico).toBe(false);
  });

  it('mapa privado NÃO compartilhado não aparece na lista de outro usuário', async () => {
    const from = jest.fn().mockImplementation((table: string) => {
      if (table === 'mapas') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          in: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      if (table === 'usuarios_mapas') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };
    });

    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    const result = await listarMeusMapas(makeSession(STRANGER_ID));

    expect(result.find((m) => m.id === MAPA_ID)).toBeUndefined();
  });
});
