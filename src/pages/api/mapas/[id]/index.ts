import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { carregarMapa, atualizarMapa, deletarMapa } from '@/services/supabaseMapaService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  if (req.method === 'GET') {
    const session = await getServerSession(req, res, authOptions);
    try {
      const mapa = await carregarMapa(session, id);
      if (!mapa) return res.status(404).json({ error: 'Mapa não encontrado' });
      return res.status(200).json(mapa);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'PERMISSION_DENIED')
        return res.status(403).json({ error: 'Acesso negado a este mapa' });
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      return res.status(500).json({ error: message });
    }
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Não autenticado' });

  if (req.method === 'PUT') {
    try {
      await atualizarMapa(session, id, req.body);
      return res.status(200).json({ ok: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      return res.status(500).json({ error: message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await deletarMapa(session, id);
      return res.status(204).end();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      return res.status(500).json({ error: message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
