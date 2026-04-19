/**
 * @jest-environment jsdom
 */

/**
 * Testes unitários — componente ImagemPresignada
 *
 * Módulo: exibição de imagem com suporte a chaves R2 (presigned URL)
 *
 * Cobre:
 * - Renderiza img com presigned URL quando imagemURL é chave R2
 * - Renderiza img com URL direta quando não é chave R2
 * - Não renderiza img quando imagemURL é null ou vazio
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ImagemPresignada from '@/components/Atomic/ImagemPresignada';

const CHAVE_R2 = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890/foto.jpg';
const URL_EXTERNA = 'https://exemplo.com/foto.jpg';
const PRESIGNED_URL = 'https://r2.example.com/signed?token=abc123';

beforeEach(() => {
  (global.fetch as jest.Mock) = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ImagemPresignada – URL externa (não é chave R2)', () => {
  it('renderiza img com a URL diretamente sem chamar fetch', async () => {
    render(
      <ImagemPresignada
        imagemURL={URL_EXTERNA}
        alt="foto externa"
        width={200}
        height={150}
      />
    );

    await waitFor(() => {
      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', expect.stringContaining('exemplo.com'));
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('ImagemPresignada – chave R2', () => {
  it('chama fetch para resolver presigned URL e renderiza img com a URL resolvida', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ signedUrl: PRESIGNED_URL }),
    });

    render(
      <ImagemPresignada
        imagemURL={CHAVE_R2}
        mapaId="mapa-abc"
        alt="foto r2"
        width={200}
        height={150}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/download?key=')
      );
    });

    await waitFor(() => {
      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', expect.stringContaining('r2.example.com'));
    });
  });

  it('passa mapaId no request para /api/download', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ signedUrl: PRESIGNED_URL }),
    });

    render(
      <ImagemPresignada
        imagemURL={CHAVE_R2}
        mapaId="mapa-xyz"
        alt="foto r2 com mapaId"
        width={200}
        height={150}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('mapaId=mapa-xyz')
      );
    });
  });
});

describe('ImagemPresignada – ausência de URL', () => {
  it('não renderiza img quando imagemURL é null', () => {
    render(
      <ImagemPresignada
        imagemURL={null}
        alt="sem imagem"
        width={200}
        height={150}
      />
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('não renderiza img quando imagemURL é string vazia', () => {
    render(
      <ImagemPresignada
        imagemURL=""
        alt="sem imagem"
        width={200}
        height={150}
      />
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('não renderiza img quando imagemURL é undefined', () => {
    render(
      <ImagemPresignada
        imagemURL={undefined}
        alt="sem imagem"
        width={200}
        height={150}
      />
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
