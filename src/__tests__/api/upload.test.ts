/**
 * Testes de integração — API POST /api/upload
 *
 * Módulo: geração de presigned URL para upload de imagem no R2
 *
 * Casos cobertos:
 * - Autenticação (não autenticado → 401)
 * - Método HTTP (GET → 405)
 * - Validação de entrada (campos obrigatórios → 400)
 * - Cota de armazenamento (STORAGE_QUOTA_BYTES)
 */

import { createRequest, createResponse } from 'node-mocks-http';
import handler from '@/pages/api/upload';

jest.mock('next-auth/next', () => ({ getServerSession: jest.fn() }));
jest.mock('@/pages/api/auth/[...nextauth]', () => ({ authOptions: {} }));
jest.mock('@/lib/r2', () => ({ getR2Client: jest.fn(() => ({})) }));
jest.mock('@aws-sdk/client-s3', () => ({ PutObjectCommand: jest.fn() }));
jest.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: jest.fn() }));
jest.mock('@/services/supabaseImagemService', () => ({ getTotalStorageUsed: jest.fn() }));

import { getServerSession } from 'next-auth/next';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getTotalStorageUsed } from '@/services/supabaseImagemService';

const mockSession = getServerSession as jest.Mock;
const mockSignedUrl = getSignedUrl as jest.Mock;
const mockStorageUsed = getTotalStorageUsed as jest.Mock;

const QUOTA_50MB = 52428800;
const SESSION = { userId: 'user-uuid-123', user: { name: 'Tester' } };

describe('POST /api/upload — presigned URL para upload de imagem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STORAGE_QUOTA_BYTES = String(QUOTA_50MB);
    process.env.R2_BUCKET_NAME = 'test-bucket';
  });

  describe('autenticação', () => {
    it('não-autenticado: tenta solicitar URL de upload → 401', async () => {
      mockSession.mockResolvedValue(null);

      const req = createRequest({
        method: 'POST',
        body: { fileName: 'foto.jpg', fileType: 'image/jpeg', fileSize: 100000 },
      });
      const res = createResponse();
      await handler(req, res);

      expect(res.statusCode).toBe(401);
      expect(res._getJSONData().error).toMatch(/não autenticado/i);
    });
  });

  describe('método HTTP', () => {
    it('método GET em rota de upload → 405', async () => {
      const req = createRequest({ method: 'GET' });
      const res = createResponse();
      await handler(req, res);

      expect(res.statusCode).toBe(405);
    });
  });

  describe('validação de entrada', () => {
    it('autenticado sem body → 400 com mensagem de campos obrigatórios', async () => {
      mockSession.mockResolvedValue(SESSION);

      const req = createRequest({ method: 'POST', body: {} });
      const res = createResponse();
      await handler(req, res);

      expect(res.statusCode).toBe(400);
    });

    it('autenticado sem fileSize → 400', async () => {
      mockSession.mockResolvedValue(SESSION);

      const req = createRequest({
        method: 'POST',
        body: { fileName: 'foto.jpg', fileType: 'image/jpeg' },
      });
      const res = createResponse();
      await handler(req, res);

      expect(res.statusCode).toBe(400);
    });
  });

  describe('cota de armazenamento (STORAGE_QUOTA_BYTES)', () => {
    it('autenticado: upload dentro da cota → 200 com signedUrl e uniqueFileName', async () => {
      mockSession.mockResolvedValue(SESSION);
      mockStorageUsed.mockResolvedValue(0);
      mockSignedUrl.mockResolvedValue('https://r2.example.com/put-signed');

      const req = createRequest({
        method: 'POST',
        body: { fileName: 'mapa.png', fileType: 'image/png', fileSize: 500000 },
      });
      const res = createResponse();
      await handler(req, res);

      expect(res.statusCode).toBe(200);
      const data = res._getJSONData();
      expect(data.signedUrl).toBe('https://r2.example.com/put-signed');
      expect(data.uniqueFileName).toMatch(/^user-uuid-123\/.+mapa\.png$/);
    });

    it('autenticado: cota esgotada ao tentar enviar arquivo → 400 QUOTA_EXCEEDED com bytes disponíveis', async () => {
      mockSession.mockResolvedValue(SESSION);
      mockStorageUsed.mockResolvedValue(52000000);

      const req = createRequest({
        method: 'POST',
        body: { fileName: 'video.mp4', fileType: 'video/mp4', fileSize: 1000000 },
      });
      const res = createResponse();
      await handler(req, res);

      expect(res.statusCode).toBe(400);
      const data = res._getJSONData();
      expect(data.code).toBe('QUOTA_EXCEEDED');
      expect(typeof data.disponivel).toBe('number');
      expect(typeof data.quota).toBe('number');
      expect(data.disponivel).toBeLessThan(1000000);
    });

    it('autenticado: arquivo exatamente no limite da cota → 400 QUOTA_EXCEEDED', async () => {
      mockSession.mockResolvedValue(SESSION);
      mockStorageUsed.mockResolvedValue(QUOTA_50MB - 100);

      const req = createRequest({
        method: 'POST',
        body: { fileName: 'grande.jpg', fileType: 'image/jpeg', fileSize: 200 },
      });
      const res = createResponse();
      await handler(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._getJSONData().code).toBe('QUOTA_EXCEEDED');
    });

    it('autenticado: cota configurável via env — STORAGE_QUOTA_BYTES menor → rejeita arquivo menor', async () => {
      process.env.STORAGE_QUOTA_BYTES = '1048576';
      mockSession.mockResolvedValue(SESSION);
      mockStorageUsed.mockResolvedValue(900000);

      const req = createRequest({
        method: 'POST',
        body: { fileName: 'foto.jpg', fileType: 'image/jpeg', fileSize: 200000 },
      });
      const res = createResponse();
      await handler(req, res);

      expect(res.statusCode).toBe(400);
      expect(res._getJSONData().code).toBe('QUOTA_EXCEEDED');
    });
  });
});
