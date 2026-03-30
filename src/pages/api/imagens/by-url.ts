import { getR2Client } from '@/lib/r2';
import { getSupabaseAdmin } from '@/lib/supabase';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const { key } = req.body ?? {};

  if (!key || typeof key !== 'string') {
    return res.status(400).json({ error: 'key é obrigatório' });
  }

  const supabase = getSupabaseAdmin();
  const userId = (session as any).userId as string;

  const { data: imagem } = await supabase
    .from('imagens')
    .select('id, mapa_id, caminho')
    .eq('caminho', key)
    .maybeSingle();

  if (!imagem) {
    return res
      .status(403)
      .json({ error: 'Sem permissão para deletar este arquivo' });
  }

  const { data: mapa } = await supabase
    .from('mapas')
    .select('dono_id')
    .eq('id', imagem.mapa_id)
    .eq('dono_id', userId)
    .maybeSingle();

  if (!mapa) {
    return res
      .status(403)
      .json({ error: 'Sem permissão para deletar este arquivo' });
  }

  await supabase.from('imagens').delete().eq('id', imagem.id);

  try {
    await getR2Client().send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      })
    );
  } catch (r2Err) {
    console.error('Aviso: erro ao deletar arquivo do R2:', r2Err);
  }

  return res.status(200).json({ ok: true });
}
