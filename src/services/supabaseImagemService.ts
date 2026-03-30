import { Session } from 'next-auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export interface Imagem {
  id: string;
  mapa_id: string;
  nome: string | null;
  caminho: string;
  tamanho: number;
  caminho_miniatura: string | null;
  created_at: string;
}

export interface CriarImagemInput {
  mapaId: string;
  nome: string;
  caminho: string;
  tamanho: number;
  caminhoMiniatura?: string;
}

export async function listarImagensMapa(session: Session, mapaId: string): Promise<Imagem[]> {
  const supabase = getSupabaseAdmin();
  const userId = (session as any).userId as string;

  const { data: mapa, error: mapaError } = await supabase
    .from('mapas')
    .select('id, dono_id, publico')
    .eq('id', mapaId)
    .single();

  if (mapaError || !mapa) throw new Error('Mapa não encontrado');
  if (mapa.dono_id !== userId && !mapa.publico) throw new Error('Sem permissão');

  const { data, error } = await supabase
    .from('imagens')
    .select('*')
    .eq('mapa_id', mapaId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Imagem[];
}

export async function criarImagem(session: Session, input: CriarImagemInput): Promise<Imagem> {
  const supabase = getSupabaseAdmin();
  const userId = (session as any).userId as string;

  const { data: mapa, error: mapaError } = await supabase
    .from('mapas')
    .select('id, dono_id')
    .eq('id', input.mapaId)
    .eq('dono_id', userId)
    .single();

  if (mapaError || !mapa) throw new Error('Mapa não encontrado ou sem permissão');

  const { data, error } = await supabase
    .from('imagens')
    .insert({
      mapa_id: input.mapaId,
      nome: input.nome,
      caminho: input.caminho,
      tamanho: input.tamanho,
      caminho_miniatura: input.caminhoMiniatura ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Imagem;
}

export async function getTotalStorageUsed(userId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('imagens')
    .select('tamanho, mapas!inner(dono_id)')
    .eq('mapas.dono_id', userId);

  if (error) throw new Error(error.message);
  return (data as any[]).reduce((sum, img) => sum + (img.tamanho ?? 0), 0);
}

export async function deletarImagem(session: Session, imagemId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const userId = (session as any).userId as string;

  const { data: imagem, error: fetchError } = await supabase
    .from('imagens')
    .select('id, mapa_id, caminho')
    .eq('id', imagemId)
    .single();

  if (fetchError || !imagem) throw new Error('Imagem não encontrada');

  const { data: mapa, error: mapaError } = await supabase
    .from('mapas')
    .select('dono_id')
    .eq('id', imagem.mapa_id)
    .eq('dono_id', userId)
    .single();

  if (mapaError || !mapa) throw new Error('Sem permissão para deletar esta imagem');

  const { error } = await supabase.from('imagens').delete().eq('id', imagemId);
  if (error) throw new Error(error.message);
}
