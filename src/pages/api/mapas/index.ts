import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { listarMeusMapas, criarMapa } from '@/services/supabaseMapaService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  if (req.method === 'GET') {
    try {
      const mapas = await listarMeusMapas(session);
      return res.status(200).json(mapas);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      return res.status(500).json({ error: message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { titulo, informacoes, publico } = req.body;
      if (!titulo || !informacoes) {
        return res.status(400).json({ error: 'titulo e informacoes são obrigatórios' });
      }
      const id = await criarMapa(session, titulo, informacoes, publico ?? false);
      return res.status(201).json({ id });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      return res.status(500).json({ error: message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
