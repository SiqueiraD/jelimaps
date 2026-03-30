import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getTotalStorageUsed } from '@/services/supabaseImagemService';
import { getSupabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const userId = (session as any).userId as string;
  const supabase = getSupabaseAdmin();

  if (req.method === 'GET') {
    try {
      const quota = parseInt(process.env.STORAGE_QUOTA_BYTES ?? '52428800', 10);

      const [totalUsado, { count: totalMapas }, { data: usuario }] = await Promise.all([
        getTotalStorageUsed(userId),
        supabase.from('mapas').select('id', { count: 'exact', head: true }).eq('dono_id', userId),
        supabase.from('usuarios').select('nome').eq('id', userId).single(),
      ]);

      return res.status(200).json({
        nome: usuario?.nome ?? session.user?.name ?? null,
        quota,
        totalUsado,
        disponivel: Math.max(0, quota - totalUsado),
        totalMapas: totalMapas ?? 0,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      return res.status(500).json({ error: message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { nome } = req.body;
      if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
        return res.status(400).json({ error: 'Nome inválido' });
      }

      const { error } = await supabase
        .from('usuarios')
        .update({ nome: nome.trim() })
        .eq('id', userId);

      if (error) throw new Error(error.message);

      return res.status(200).json({ nome: nome.trim() });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      return res.status(500).json({ error: message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
