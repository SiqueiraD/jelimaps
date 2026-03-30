/**
 * @jest-environment jsdom
 */

/**
 * Testes unitários — hook usePresignedUrl
 *
 * Módulo: resolução de chaves R2 em presigned URLs
 *
 * Cobre:
 * - Retorna null quando value é null/undefined
 * - Retorna a URL diretamente quando NÃO é chave R2
 * - Busca presigned URL via fetch quando é chave R2
 * - Retry em caso de falha (1 tentativa extra)
 * - Retorna null após falha em todas as tentativas
 * - refresh() refaz a busca
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { usePresignedUrl } from '@/hooks/usePresignedUrl';

// ── Setup ────────────────────────────────────────────────────────────────────

const CHAVE_R2 = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890/imagem.png';
const URL_NORMAL = 'https://example.com/imagem.png';
const PRESIGNED_URL = 'https://r2.example.com/signed?token=abc123';

beforeEach(() => {
  jest.useFakeTimers();
  (global.fetch as jest.Mock) = jest.fn();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

// ── Testes ───────────────────────────────────────────────────────────────────

describe('usePresignedUrl – valores nulos', () => {
  it('retorna null quando value é null', () => {
    const { result } = renderHook(() => usePresignedUrl(null));
    expect(result.current[0]).toBeNull();
  });

  it('retorna null quando value é undefined', () => {
    const { result } = renderHook(() => usePresignedUrl(undefined));
    expect(result.current[0]).toBeNull();
  });

  it('retorna null quando value é string vazia', () => {
    const { result } = renderHook(() => usePresignedUrl(''));
    expect(result.current[0]).toBeNull();
  });
});

describe('usePresignedUrl – URL normal (não é chave R2)', () => {
  it('retorna a URL diretamente sem chamar fetch', async () => {
    const { result } = renderHook(() => usePresignedUrl(URL_NORMAL));

    await waitFor(() => {
      expect(result.current[0]).toBe(URL_NORMAL);
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('usePresignedUrl – chave R2', () => {
  it('busca presigned URL via /api/download quando é chave R2', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ signedUrl: PRESIGNED_URL }),
    });

    const { result } = renderHook(() => usePresignedUrl(CHAVE_R2, 'mapa-123'));

    await waitFor(() => {
      expect(result.current[0]).toBe(PRESIGNED_URL);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/download?key=')
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('mapaId=mapa-123')
    );
  });

  it('retorna null após falha em todas as tentativas (2 tentativas)', async () => {
    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => usePresignedUrl(CHAVE_R2));

    // Primeira tentativa falha imediatamente
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Avança timer para o retry (1500ms)
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    // Após todas as tentativas falharem, retorna null
    await waitFor(() => {
      expect(result.current[0]).toBeNull();
    });
  });
});

describe('usePresignedUrl – refresh', () => {
  it('refresh() refaz a busca para chave R2', async () => {
    const NOVA_URL = 'https://r2.example.com/signed?token=new';

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ signedUrl: PRESIGNED_URL }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ signedUrl: NOVA_URL }),
      });

    const { result } = renderHook(() => usePresignedUrl(CHAVE_R2));

    await waitFor(() => {
      expect(result.current[0]).toBe(PRESIGNED_URL);
    });

    // Chamar refresh
    act(() => {
      result.current[1](); // refresh()
    });

    await waitFor(() => {
      expect(result.current[0]).toBe(NOVA_URL);
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
