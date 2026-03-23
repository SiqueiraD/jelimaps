import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { listarCompartilhamentos, compartilharMapa } from '@/services/supabaseMapaService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const { id } = req.query as { id: string };

  if (req.method === 'GET') {
    try {
      const compartilhamentos = await listarCompartilhamentos(session, id);
      return res.status(200).json(compartilhamentos);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      return res.status(500).json({ error: message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { usuarioId, permissao } = req.body;
      if (!usuarioId || !permissao) {
        return res.status(400).json({ error: 'usuarioId e permissao são obrigatórios' });
      }
      await compartilharMapa(session, id, usuarioId, permissao);
      return res.status(201).json({ ok: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      return res.status(500).json({ error: message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
