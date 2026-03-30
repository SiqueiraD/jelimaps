/**
 * Testes de integração — API GET /api/download
 *
 * Módulo: geração de presigned URL para download de imagem do R2
 *
 * Casos cobertos:
 * - Validação de entrada (key obrigatória, método HTTP)
 * - Imagem não registrada (fallback por prefixo ou mapaId)
 * - Não autenticado acessa mapa público/privado
 * - Autenticado: dono, compartilhamento, estranho
 */

import { createRequest, createResponse } from 'node-mocks-http';
import handler from '@/pages/api/download';

jest.mock('next-auth/next', () => ({ getServerSession: jest.fn() }));
jest.mock('@/pages/api/auth/[...nextauth]', () => ({ authOptions: {} }));
jest.mock('@/lib/r2', () => ({ getR2Client: jest.fn(() => ({})) }));
jest.mock('@aws-sdk/client-s3', () => ({ GetObjectCommand: jest.fn() }));
jest.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: jest.fn() }));
jest.mock('@/lib/supabase', () => ({ getSupabaseAdmin: jest.fn() }));

import { getServerSession } from 'next-auth/next';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getSupabaseAdmin } from '@/lib/supabase';

const mockSession = getServerSession as jest.Mock;
const mockSignedUrl = getSignedUrl as jest.Mock;
const mockGetSupabaseAdmin = getSupabaseAdmin as jest.Mock;

const OWNER_ID = 'owner-uuid';
const KEY = `${OWNER_ID}/abc123-foto.png`;
const MAPA_ID = 'mapa-uuid-111';
const GUEST_ID = 'guest-uuid';
const STRANGER_ID = 'stranger-uuid';

function buildSupabaseMock({
  imagemData,
  mapaData,
  compartilhamentoData = null,
}: {
  imagemData: object | null;
  mapaData: object | null;
  compartilhamentoData?: object | null;
}) {
  const makeChain = (resolveWith: () => Promise<{ data: object | null }>, kind: 'single' | 'maybeSingle') => {
    const chain: Record<string, jest.Mock> = {};
    chain.select = jest.fn().mockReturnValue(chain);
    chain.eq = jest.fn().mockReturnValue(chain);
    chain[kind] = jest.fn().mockImplementation(resolveWith);
    return chain;
  };

  const imagemChain = makeChain(() => Promise.resolve({ data: imagemData }), 'maybeSingle');
  const mapaChain = makeChain(() => Promise.resolve({ data: mapaData }), 'single');
  const compartChain = makeChain(() => Promise.resolve({ data: compartilhamentoData }), 'maybeSingle');

  let callCount = 0;
  const fromMock = jest.fn().mockImplementation(() => {
    const calls = [imagemChain, mapaChain, compartChain];
    return calls[callCount++] ?? compartChain;
  });

  mockGetSupabaseAdmin.mockReturnValue({ from: fromMock });
}

describe('GET /api/download — presigned URL para download de imagem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.R2_BUCKET_NAME = 'test-bucket';
    mockSignedUrl.mockResolvedValue('https://r2.example.com/download-signed');
  });

  describe('validação de entrada', () => {
    it('sem parâmetro key → 400', async () => {
      mockSession.mockResolvedValue(null);
      buildSupabaseMock({ imagemData: null, mapaData: null });

      const req = createRequest({ method: 'GET', query: {} });
      const res = createResponse();
      await handler(req, res);

      expect(res.statusCode).toBe(400);
    });

    it('método POST em rota de download → 405', async () => {
      const req = createRequest({ method: 'POST', query: { key: KEY } });
      const res = createResponse();
      await handler(req, res);

      expect(res.statusCode).toBe(405);
    });

    it('key não encontrada no banco e usuário não autenticado → 403', async () => {
      mockSession.mockResolvedValue(null);
      buildSupabaseMock({ imagemData: null, mapaData: null });

      const req = createRequest({ method: 'GET', query: { key: KEY } });
      const res = createResponse();
      await handler(req, res);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('imagem não registrada (mapaId ainda nulo)', () => {
    describe('sem mapaId na query — verifica prefixo da key', () => {
      it('dono acessa imagem própria não registrada no banco → 200', async () => {
        mockSession.mockResolvedValue({ userId: OWNER_ID });
        buildSupabaseMock({ imagemData: null, mapaData: null });

        const req = createRequest({ method: 'GET', query: { key: KEY } });
        const res = createResponse();
        await handler(req, res);

        expect(res.statusCode).toBe(200);
        expect(res._getJSONData().signedUrl).toBeDefined();
      });

      it('usuário diferente tenta acessar imagem não registrada do dono → 403', async () => {
        mockSession.mockResolvedValue({ userId: STRANGER_ID });
        buildSupabaseMock({ imagemData: null, mapaData: null });

        const req = createRequest({ method: 'GET', query: { key: KEY } });
        const res = createResponse();
        await handler(req, res);

        expect(res.statusCode).toBe(403);
      });
    });

    describe('com mapaId na query — verifica permissão do mapa', () => {
      it('usuário não autenticado acessa imagem de mapa público → 200', async () => {
        mockSession.mockResolvedValue(null);
        buildSupabaseMock({
          imagemData: null,
          mapaData: { dono_id: OWNER_ID, publico: true },
        });

        const req = createRequest({ method: 'GET', query: { key: KEY, mapaId: MAPA_ID } });
        const res = createResponse();
        await handler(req, res);

        expect(res.statusCode).toBe(200);
        expect(res._getJSONData().signedUrl).toBeDefined();
      });

      it('usuário não autenticado acessa imagem de mapa privado → 403', async () => {
        mockSession.mockResolvedValue(null);
        buildSupabaseMock({
          imagemData: null,
          mapaData: { dono_id: OWNER_ID, publico: false },
        });

        const req = createRequest({ method: 'GET', query: { key: KEY, mapaId: MAPA_ID } });
        const res = createResponse();
        await handler(req, res);

        expect(res.statusCode).toBe(403);
      });

      it('dono acessa imagem não registrada de mapa privado via mapaId → 200', async () => {
        mockSession.mockResolvedValue({ userId: OWNER_ID });
        buildSupabaseMock({
          imagemData: null,
          mapaData: { dono_id: OWNER_ID, publico: false },
        });

        const req = createRequest({ method: 'GET', query: { key: KEY, mapaId: MAPA_ID } });
        const res = createResponse();
        await handler(req, res);

        expect(res.statusCode).toBe(200);
      });

      it('usuário com compartilhamento acessa imagem não registrada de mapa privado via mapaId → 200', async () => {
        mockSession.mockResolvedValue({ userId: GUEST_ID });
        buildSupabaseMock({
          imagemData: null,
          mapaData: { dono_id: OWNER_ID, publico: false },
          compartilhamentoData: { permissao: 'view' },
        });

        const req = createRequest({ method: 'GET', query: { key: KEY, mapaId: MAPA_ID } });
        const res = createResponse();
        await handler(req, res);

        expect(res.statusCode).toBe(200);
      });
    });
  });

  describe('não-autenticado', () => {
    it('faz download de imagem de mapa público → 200 com signedUrl', async () => {
      mockSession.mockResolvedValue(null);
      buildSupabaseMock({
        imagemData: { mapa_id: MAPA_ID },
        mapaData: { dono_id: OWNER_ID, publico: true },
      });

      const req = createRequest({ method: 'GET', query: { key: KEY } });
      const res = createResponse();
      await handler(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData().signedUrl).toBe('https://r2.example.com/download-signed');
    });

    it('tenta fazer download de imagem de mapa privado → 403', async () => {
      mockSession.mockResolvedValue(null);
      buildSupabaseMock({
        imagemData: { mapa_id: MAPA_ID },
        mapaData: { dono_id: OWNER_ID, publico: false },
      });

      const req = createRequest({ method: 'GET', query: { key: KEY } });
      const res = createResponse();
      await handler(req, res);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('autenticado', () => {
    it('dono faz download de imagem de mapa privado → 200', async () => {
      mockSession.mockResolvedValue({ userId: OWNER_ID });
      buildSupabaseMock({
        imagemData: { mapa_id: MAPA_ID },
        mapaData: { dono_id: OWNER_ID, publico: false },
      });

      const req = createRequest({ method: 'GET', query: { key: KEY } });
      const res = createResponse();
      await handler(req, res);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData().signedUrl).toBeDefined();
    });

    it('usuário com compartilhamento view faz download de imagem privada → 200', async () => {
      mockSession.mockResolvedValue({ userId: GUEST_ID });
      buildSupabaseMock({
        imagemData: { mapa_id: MAPA_ID },
        mapaData: { dono_id: OWNER_ID, publico: false },
        compartilhamentoData: { permissao: 'view' },
      });

      const req = createRequest({ method: 'GET', query: { key: KEY } });
      const res = createResponse();
      await handler(req, res);

      expect(res.statusCode).toBe(200);
    });

    it('usuário sem compartilhamento tenta download de imagem privada → 403', async () => {
      mockSession.mockResolvedValue({ userId: STRANGER_ID });
      buildSupabaseMock({
        imagemData: { mapa_id: MAPA_ID },
        mapaData: { dono_id: OWNER_ID, publico: false },
        compartilhamentoData: null,
      });

      const req = createRequest({ method: 'GET', query: { key: KEY } });
      const res = createResponse();
      await handler(req, res);

      expect(res.statusCode).toBe(403);
    });

    it('usuário faz download de imagem de mapa público → 200', async () => {
      mockSession.mockResolvedValue({ userId: GUEST_ID });
      buildSupabaseMock({
        imagemData: { mapa_id: MAPA_ID },
        mapaData: { dono_id: OWNER_ID, publico: true },
      });

      const req = createRequest({ method: 'GET', query: { key: KEY } });
      const res = createResponse();
      await handler(req, res);

      expect(res.statusCode).toBe(200);
    });
  });
});
