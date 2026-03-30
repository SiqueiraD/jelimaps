import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { listarImagensMapa, criarImagem } from '@/services/supabaseImagemService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  if (req.method === 'GET') {
    try {
      const { mapaId } = req.query;
      if (!mapaId || typeof mapaId !== 'string') {
        return res.status(400).json({ error: 'mapaId é obrigatório' });
      }
      const imagens = await listarImagensMapa(session, mapaId);
      return res.status(200).json(imagens);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      return res.status(500).json({ error: message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { mapaId, nome, caminho, tamanho, caminhoMiniatura } = req.body;
      if (!mapaId || !caminho || !tamanho) {
        return res.status(400).json({ error: 'mapaId, caminho e tamanho são obrigatórios' });
      }
      const imagem = await criarImagem(session, { mapaId, nome, caminho, tamanho, caminhoMiniatura });
      return res.status(201).json(imagem);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      return res.status(500).json({ error: message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
