import { Session } from 'next-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { mapaContextSchema } from '@/components/Mapa/mapaContextTypes';

export type MapaResumo = {
  id: string;
  titulo: string;
  publico: boolean;
  created_at: string;
  updated_at: string;
  dono_id: string;
  permissao?: 'edit' | 'view' | 'dono';
};

export type MapaCompleto = MapaResumo & {
  informacoes: mapaContextSchema;
};

/**
 * Lista todos os mapas acessíveis pelo usuário (próprios + compartilhados).
 * Usa JWT do Supabase assinado pelo NextAuth — RLS aplica auth.uid() automaticamente.
 */
export async function listarMeusMapas(session: Session): Promise<MapaResumo[]> {
  const supabase = getSupabaseAdmin();
  const userId = session.userId!;

  const { data: ownedMaps, error: e1 } = await supabase
    .from('mapas')
    .select('id, titulo, publico, created_at, updated_at, dono_id')
    .eq('dono_id', userId);

  if (e1) throw new Error(`Erro ao listar mapas: ${e1.message}`);

  // RLS policy "Usuários podem ver seus próprios compartilhamentos" permite esta query
  const { data: sharedLinks, error: e2 } = await supabase
    .from('usuarios_mapas')
    .select('mapa_id, permissao')
    .eq('usuario_id', userId);

  if (e2) throw new Error(`Erro ao listar compartilhamentos: ${e2.message}`);

  let sharedMaps: MapaResumo[] = [];
  if (sharedLinks && sharedLinks.length > 0) {
    const ids = sharedLinks.map((l) => l.mapa_id);
    const { data: maps, error: e3 } = await supabase
      .from('mapas')
      .select('id, titulo, publico, created_at, updated_at, dono_id')
      .in('id', ids);

    if (e3) throw new Error(`Erro ao carregar mapas compartilhados: ${e3.message}`);

    sharedMaps = (maps ?? []).map((m) => ({
      ...m,
      permissao: sharedLinks.find((l) => l.mapa_id === m.id)?.permissao as 'view' | 'edit',
    }));
  }

  const all: MapaResumo[] = [
    ...(ownedMaps ?? []).map((m) => ({ ...m, permissao: 'dono' as const })),
    ...sharedMaps,
  ];

  return all.sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

/**
 * Carrega um mapa completo pelo ID.
 * RLS permite acesso se mapa é público, ou se usuário é dono/compartilhado.
 */
export async function carregarMapa(
  session: Session | null,
  mapaId: string
): Promise<MapaCompleto | null> {
  const supabase = getSupabaseAdmin();
  const userId = session?.userId;

  const { data, error } = await supabase
    .from('mapas')
    .select('id, titulo, publico, created_at, updated_at, dono_id, informacoes')
    .eq('id', mapaId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Erro ao carregar mapa: ${error.message}`);
  }

  if (!data) return null;

  const temAcesso =
    data.publico ||
    data.dono_id === userId ||
    (userId
      ? (await supabase
          .from('usuarios_mapas')
          .select('permissao')
          .eq('mapa_id', mapaId)
          .eq('usuario_id', userId)
          .maybeSingle()
        ).data !== null
      : false);

  if (!temAcesso) throw new Error('PERMISSION_DENIED');

  return data as MapaCompleto;
}

/**
 * Cria um novo mapa. RLS exige que dono_id = auth.uid().
 */
export async function criarMapa(
  session: Session,
  titulo: string,
  informacoes: mapaContextSchema,
  publico = false
): Promise<string> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('mapas')
    .insert({ dono_id: session.userId, titulo, publico, informacoes })
    .select('id')
    .single();

  if (error) throw new Error(`Erro ao criar mapa: ${error.message}`);

  return data.id;
}

/**
 * Atualiza um mapa. RLS permite apenas dono ou usuário com permissão 'edit'.
 */
export async function atualizarMapa(
  session: Session,
  mapaId: string,
  campos: Partial<{ titulo: string; informacoes: mapaContextSchema; publico: boolean }>
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const userId = session.userId!;

  const { data: mapa } = await supabase
    .from('mapas').select('dono_id').eq('id', mapaId).single();
  if (!mapa) throw new Error('Mapa não encontrado');

  if (mapa.dono_id !== userId) {
    const { data: perm } = await supabase
      .from('usuarios_mapas').select('permissao')
      .eq('mapa_id', mapaId).eq('usuario_id', userId).eq('permissao', 'edit').maybeSingle();
    if (!perm) throw new Error('Sem permissão para editar este mapa');
  }

  const { error } = await supabase.from('mapas').update(campos).eq('id', mapaId);
  if (error) throw new Error(`Erro ao atualizar mapa: ${error.message}`);
}

/**
 * Remove um mapa. RLS permite apenas o dono.
 */
export async function deletarMapa(session: Session, mapaId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('mapas').delete().eq('id', mapaId).eq('dono_id', session.userId!);
  if (error) throw new Error(`Erro ao deletar mapa: ${error.message}`);
}

/**
 * Lista compartilhamentos de um mapa. RLS permite ver apenas dono ou editores.
 */
export async function listarCompartilhamentos(
  session: Session,
  mapaId: string
): Promise<{ usuario_id: string; permissao: 'view' | 'edit'; created_at: string }[]> {
  const supabase = getSupabaseAdmin();
  const { data: mapa } = await supabase
    .from('mapas').select('dono_id').eq('id', mapaId).single();
  if (mapa?.dono_id !== session.userId)
    throw new Error('Sem permissão para ver compartilhamentos deste mapa');

  const { data, error } = await supabase
    .from('usuarios_mapas')
    .select('usuario_id, permissao, created_at')
    .eq('mapa_id', mapaId);

  if (error) throw new Error(`Erro ao listar compartilhamentos: ${error.message}`);
  return data ?? [];
}

/**
 * Adiciona ou atualiza um compartilhamento. RLS permite apenas o dono.
 */
export async function compartilharMapa(
  session: Session,
  mapaId: string,
  usuarioId: string,
  permissao: 'view' | 'edit'
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('usuarios_mapas')
    .upsert({ mapa_id: mapaId, usuario_id: usuarioId, permissao });

  if (error) throw new Error(`Erro ao compartilhar mapa: ${error.message}`);
}

/**
 * Remove um compartilhamento. RLS permite apenas o dono.
 */
export async function removerCompartilhamento(
  session: Session,
  mapaId: string,
  usuarioId: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('usuarios_mapas')
    .delete()
    .eq('mapa_id', mapaId)
    .eq('usuario_id', usuarioId);

  if (error) throw new Error(`Erro ao remover compartilhamento: ${error.message}`);
}
