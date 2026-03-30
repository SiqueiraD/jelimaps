import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { deletarImagem } from '@/services/supabaseImagemService';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client } from '@/lib/r2';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'id é obrigatório' });
    }

    const { caminho } = req.body ?? {};

    await deletarImagem(session, id);

    if (caminho) {
      try {
        await getR2Client().send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: caminho,
          })
        );
      } catch (r2Err) {
        console.error('Aviso: erro ao deletar arquivo do R2:', r2Err);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return res.status(500).json({ error: message });
  }
}
