import type { NextApiRequest, NextApiResponse } from 'next';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getR2Client } from '@/lib/r2';
import { getSupabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { key, mapaId } = req.query;
  if (!key || typeof key !== 'string') {
    return res.status(400).json({ error: 'key é obrigatório' });
  }

  const session = await getServerSession(req, res, authOptions);
  const supabase = getSupabaseAdmin();

  const userId = (session as any)?.userId as string | undefined;
  const mapaIdFromQuery = typeof mapaId === 'string' ? mapaId : null;

  // Buscar imagem filtrando por mapa_id quando disponível (otimização de índice composto)
  const baseQuery = supabase.from('imagens').select('mapa_id').eq('caminho', key);
  const { data: imagem } = await (
    mapaIdFromQuery ? baseQuery.eq('mapa_id', mapaIdFromQuery) : baseQuery
  ).maybeSingle();

  const resolvedMapaId: string | null = imagem?.mapa_id ?? mapaIdFromQuery;

  if (!resolvedMapaId) {
    // Sem contexto de mapa — apenas o dono (key com prefixo userId) pode acessar
    if (!userId || !key.startsWith(`${userId}/`)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
  } else {
    const { data: mapa } = await supabase
      .from('mapas')
      .select('dono_id, publico')
      .eq('id', resolvedMapaId)
      .single();

    if (!mapa) {
      return res.status(404).json({ error: 'Mapa não encontrado' });
    }

    // Mapa público: qualquer pessoa pode baixar as imagens sem autenticação
    if (!mapa.publico) {
      if (!userId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const ehDono = mapa.dono_id === userId;

      const temCompartilhamento =
        !ehDono
          ? (
              await supabase
                .from('usuarios_mapas')
                .select('permissao')
                .eq('mapa_id', resolvedMapaId)
                .eq('usuario_id', userId)
                .maybeSingle()
            ).data !== null
          : false;

      if (!ehDono && !temCompartilhamento) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
    }
  }

  try {
    const getCommand = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(getR2Client(), getCommand, { expiresIn: 3600 });
    return res.status(200).json({ signedUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('Erro ao gerar presigned URL de download:', err);
    return res.status(500).json({ error: message });
  }
}
