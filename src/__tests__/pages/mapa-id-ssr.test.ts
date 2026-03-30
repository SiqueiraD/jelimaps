/**
 * Testes — getServerSideProps da página mapa/[id]
 *
 * Módulo: SSR de página de mapa com controle de permissão
 *
 * Casos cobertos:
 * 1 - Não autenticado visualiza mapa publicado → permissao: 'view'
 * 1b - ID inválido → redirect /nao-encontrado
 * 2 - Não autenticado acessa mapa privado → redirect /403
 * 3 - Autenticado visualiza mapa publicado (auto-registro) → permissao: 'view'
 * 4 - Autenticado (dono) → permissao: 'dono'
 * 5 - Autenticado com permissão edit → permissao: 'edit'
 */

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
  autoRegistrarVisualizador: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/stores/mapaStore', () => ({
  useMapaStore: jest.fn(() => ({
    clearStore: jest.fn(),
    dispatch: jest.fn(),
    setStore: jest.fn(),
  })),
}));

import { getSupabaseAdmin } from '@/lib/supabase';
import { getServerSideProps } from '@/pages/mapa/[id]';
import { autoRegistrarVisualizador } from '@/services/supabaseMapaService';
import { getServerSession } from 'next-auth/next';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeQueryBuilder(response: any) {
  const builder: any = {};
  ['select', 'eq'].forEach((m) => {
    builder[m] = jest.fn().mockReturnValue(builder);
  });
  builder.single = jest.fn().mockResolvedValue(response);
  builder.maybeSingle = jest.fn().mockResolvedValue(response);
  return builder;
}

function makeContext(id: string) {
  return {
    params: { id },
    req: {} as any,
    res: {} as any,
  } as any;
}

const MAPA_PUBLICO = {
  id: '11111111-1111-1111-1111-111111111111',
  titulo: 'Mapa Público',
  publico: true,
  dono_id: 'owner-uuid',
  informacoes: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const MAPA_PRIVADO = {
  ...MAPA_PUBLICO,
  id: '22222222-2222-2222-2222-222222222222',
  publico: false,
};

const VALID_UUID = '11111111-1111-1111-1111-111111111111';
const PRIVATE_UUID = '22222222-2222-2222-2222-222222222222';
const OWNER_ID = 'owner-uuid';

// ── Caso 1: Não autenticado visualiza mapa publicado ────────────────────────

describe('Não autenticado visualiza mapa publicado', () => {
  beforeEach(() => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const mapaBuilder = makeQueryBuilder({ data: MAPA_PUBLICO, error: null });
    (getSupabaseAdmin as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue(mapaBuilder),
    });
  });

  it('retorna props com permissao: view para mapa público sem autenticação', async () => {
    const result = await getServerSideProps(makeContext(VALID_UUID));

    expect(result).toEqual({
      props: {
        mapa: expect.objectContaining({ id: VALID_UUID, publico: true }),
        permissao: 'view',
      },
    });
  });

  it('autoRegistrarVisualizador NÃO é chamado quando usuário não está autenticado', async () => {
    await getServerSideProps(makeContext(VALID_UUID));

    expect(autoRegistrarVisualizador).not.toHaveBeenCalled();
  });
});

// ── Caso 1b: ID inválido → redirect ─────────────────────────────────────────

describe('ID inválido redireciona para nao-encontrado', () => {
  it('retorna redirect para /mapa/nao-encontrado quando id não é UUID', async () => {
    const result = await getServerSideProps(makeContext('nao-e-um-uuid'));

    expect(result).toEqual({
      redirect: { destination: '/mapa/nao-encontrado', permanent: false },
    });
  });

  it('retorna redirect quando mapa não existe no banco', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const mapaBuilder = makeQueryBuilder({
      data: null,
      error: { message: 'not found' },
    });
    (getSupabaseAdmin as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue(mapaBuilder),
    });

    const result = await getServerSideProps(makeContext(VALID_UUID));

    expect(result).toEqual({
      redirect: { destination: '/mapa/nao-encontrado', permanent: false },
    });
  });
});

// ── Caso 2: Não autenticado acessa mapa privado → 403 ──────────────────────

describe('Não autenticado não pode acessar mapa privado', () => {
  it('retorna redirect para /403 quando mapa é privado e usuário não está autenticado', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const mapaBuilder = makeQueryBuilder({ data: MAPA_PRIVADO, error: null });
    (getSupabaseAdmin as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue(mapaBuilder),
    });

    const result = await getServerSideProps(makeContext(PRIVATE_UUID));

    expect(result).toEqual({
      redirect: { destination: '/403', permanent: false },
    });
  });
});

// ── Caso 3: Autenticado visualiza mapa publicado (auto-registro) ────────────

describe('Autenticado visualiza mapa publicado com auto-registro', () => {
  const USER_ID = 'novo-usuario-id';

  beforeEach(() => {
    (getServerSession as jest.Mock).mockResolvedValue({
      userId: USER_ID,
      user: { name: 'Novo', email: 'novo@test.com' },
      expires: '2099-01-01',
    });
    jest.clearAllMocks();
    (autoRegistrarVisualizador as jest.Mock).mockResolvedValue(undefined);
    (getServerSession as jest.Mock).mockResolvedValue({
      userId: USER_ID,
      user: { name: 'Novo', email: 'novo@test.com' },
      expires: '2099-01-01',
    });
  });

  it('retorna permissao: view e chama autoRegistrarVisualizador para usuário sem permissão prévia', async () => {
    const mapaBuilder = makeQueryBuilder({ data: MAPA_PUBLICO, error: null });
    const permBuilder = makeQueryBuilder({ data: null, error: null });

    const from = jest
      .fn()
      .mockReturnValueOnce(mapaBuilder)
      .mockReturnValueOnce(permBuilder);

    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    const result = await getServerSideProps(makeContext(VALID_UUID));

    expect(result).toEqual({
      props: {
        mapa: expect.objectContaining({ id: VALID_UUID }),
        permissao: 'view',
      },
    });
    expect(autoRegistrarVisualizador).toHaveBeenCalledWith(USER_ID, VALID_UUID);
  });

  it('retorna permissao: view sem chamar autoRegistrarVisualizador quando já tem permissão', async () => {
    const mapaBuilder = makeQueryBuilder({ data: MAPA_PUBLICO, error: null });
    const permBuilder = makeQueryBuilder({
      data: { permissao: 'view' },
      error: null,
    });

    const from = jest
      .fn()
      .mockReturnValueOnce(mapaBuilder)
      .mockReturnValueOnce(permBuilder);

    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    const result = await getServerSideProps(makeContext(VALID_UUID));

    expect(result).toEqual({
      props: {
        mapa: expect.objectContaining({ id: VALID_UUID }),
        permissao: 'view',
      },
    });
    expect(autoRegistrarVisualizador).not.toHaveBeenCalled();
  });
});

// ── Caso 4: Autenticado é o dono ────────────────────────────────────────────

describe('Autenticado é o dono do mapa', () => {
  beforeEach(() => {
    (getServerSession as jest.Mock).mockResolvedValue({
      userId: OWNER_ID,
      user: { name: 'Dono', email: 'dono@test.com' },
      expires: '2099-01-01',
    });
  });

  it('retorna permissao: dono quando userId === dono_id do mapa', async () => {
    const mapaBuilder = makeQueryBuilder({ data: MAPA_PUBLICO, error: null });
    (getSupabaseAdmin as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue(mapaBuilder),
    });

    const result = await getServerSideProps(makeContext(VALID_UUID));

    expect(result).toEqual({
      props: {
        mapa: expect.objectContaining({ id: VALID_UUID }),
        permissao: 'dono',
      },
    });
  });

  it('dono acessa mapa privado e obtém permissao: dono', async () => {
    const mapaBuilder = makeQueryBuilder({ data: MAPA_PRIVADO, error: null });
    (getSupabaseAdmin as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue(mapaBuilder),
    });

    const result = await getServerSideProps(makeContext(PRIVATE_UUID));

    expect(result).toEqual({
      props: {
        mapa: expect.objectContaining({ id: PRIVATE_UUID }),
        permissao: 'dono',
      },
    });
  });
});

// ── Caso 5: Autenticado com permissão edit ──────────────────────────────────

describe('Autenticado com permissão explícita de edição', () => {
  const EDITOR_ID = 'editor-uuid';

  beforeEach(() => {
    (getServerSession as jest.Mock).mockResolvedValue({
      userId: EDITOR_ID,
      user: { name: 'Editor', email: 'editor@test.com' },
      expires: '2099-01-01',
    });
  });

  it('retorna permissao: edit quando usuario_mapas contém permissao edit', async () => {
    const mapaBuilder = makeQueryBuilder({ data: MAPA_PRIVADO, error: null });
    const permBuilder = makeQueryBuilder({
      data: { permissao: 'edit' },
      error: null,
    });

    const from = jest
      .fn()
      .mockReturnValueOnce(mapaBuilder)
      .mockReturnValueOnce(permBuilder);

    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    const result = await getServerSideProps(makeContext(PRIVATE_UUID));

    expect(result).toEqual({
      props: {
        mapa: expect.objectContaining({ id: PRIVATE_UUID }),
        permissao: 'edit',
      },
    });
  });

  it('retorna redirect /403 quando usuário não tem nenhuma permissão no mapa privado', async () => {
    const mapaBuilder = makeQueryBuilder({ data: MAPA_PRIVADO, error: null });
    const permBuilder = makeQueryBuilder({ data: null, error: null });

    const from = jest
      .fn()
      .mockReturnValueOnce(mapaBuilder)
      .mockReturnValueOnce(permBuilder);

    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    const result = await getServerSideProps(makeContext(PRIVATE_UUID));

    expect(result).toEqual({
      redirect: { destination: '/403', permanent: false },
    });
  });
});
