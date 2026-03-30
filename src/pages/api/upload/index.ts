import type { NextApiRequest, NextApiResponse } from 'next';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getR2Client } from '@/lib/r2';
import { getTotalStorageUsed } from '@/services/supabaseImagemService';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  try {
    const { fileName, fileType, fileSize } = req.body;

    if (!fileName || !fileType || !fileSize) {
      return res.status(400).json({ error: 'fileName, fileType e fileSize são obrigatórios' });
    }

    const userId = (session as any).userId as string;
    const quota = parseInt(process.env.STORAGE_QUOTA_BYTES ?? '52428800', 10);
    const totalUsado = await getTotalStorageUsed(userId);

    if (totalUsado + fileSize > quota) {
      const disponivel = Math.max(0, quota - totalUsado);
      return res.status(400).json({
        error: `Cota de armazenamento excedida. Você tem ${formatBytes(disponivel)} disponíveis e está tentando enviar ${formatBytes(fileSize)}.`,
        code: 'QUOTA_EXCEEDED',
        disponivel,
        quota,
        totalUsado,
      });
    }

    const uniqueFileName = `${userId}/${crypto.randomUUID()}-${fileName}`;

    const putCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: uniqueFileName,
      ContentType: fileType,
      ContentLength: fileSize,
    });

    const signedUrl = await getSignedUrl(getR2Client(), putCommand, { expiresIn: 60 });

    return res.status(200).json({ signedUrl, uniqueFileName });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('Erro ao gerar presigned URL:', err);
    return res.status(500).json({ error: message });
  }
}
