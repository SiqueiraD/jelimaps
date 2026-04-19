/**
 * @jest-environment jsdom
 */

/**
 * Testes unitários — componente ConteudoLegenda
 *
 * Módulo: legenda do modo Apresentação
 *
 * Cobre:
 * - Elemento com chave R2 como imagemURL: resolve e exibe img com presigned URL
 * - Elemento com URL externa: exibe img diretamente
 * - Elemento sem imagemURL: não renderiza img
 * - Exibe nome e texto do elemento
 */

import { ConteudoLegenda } from '@/components/Mapa/Apresentacao/legenda';
import { tipoElemento } from '@/components/Mapa/mapaContextTypes';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

jest.mock('leaflet', () => ({
  Map: jest.fn(),
  LatLng: jest.fn(),
  LatLngBounds: jest.fn(),
  Icon: {
    Default: {
      prototype: {},
      mergeOptions: jest.fn(),
    },
  },
}));

jest.mock('react-leaflet', () => ({
  MapContainer: jest.fn(() => null),
  ImageOverlay: jest.fn(() => null),
}));

jest.mock('@/components/Mapa/ContextChangers', () => ({
  __esModule: true,
  default: {
    bordasDoElemento: jest.fn(() => null),
    retornaListaElementosConteudoCenaAtual: jest.fn(() => []),
  },
}));

jest.mock('@/components/Mapa/MapaContext', () => ({
  useMapaContext: jest.fn(() => ({ conteudo: {}, tempo: null })),
  useMapaDispatch: jest.fn(() => jest.fn()),
}));

jest.mock('@/components/Studio/useWindowDimensions', () => ({
  __esModule: true,
  default: jest.fn(() => ({ width: 1024, height: 768 })),
}));

jest.mock('@/components/Mapa/Apresentacao', () => ({
  isMobile: jest.fn(() => false),
}));

jest.mock('@/components/Mapa/Apresentacao/legenda/lateral', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('@/components/Mapa/Apresentacao/legenda/mobile', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

const theme = createTheme();
const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const CHAVE_R2 = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890/foto.jpg';
const URL_EXTERNA = 'https://exemplo.com/foto.jpg';
const PRESIGNED_URL = 'https://r2.example.com/signed?token=abc123';

const makeElemento = (overrides: Partial<tipoElemento> = {}): tipoElemento =>
  ({
    id: 'elem-1' as any,
    nome: 'Ponto A',
    texto: 'Descrição do ponto',
    dataRef: 'Marker',
    type: 'Point',
    cenaInicio: null,
    cenaFim: null,
    geometry: { type: 'Point', coordinates: [-43.1, -22.9] },
    ...overrides,
  } as tipoElemento);

const mapMock = {
  flyTo: jest.fn(),
  flyToBounds: jest.fn(),
} as any;

beforeEach(() => {
  (global.fetch as jest.Mock) = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ConteudoLegenda – exibição do nome e texto', () => {
  it('exibe o nome do elemento', () => {
    renderWithTheme(
      <ConteudoLegenda
        elementosVisiveis={[makeElemento()]}
        larguraLegenda={250}
        map={mapMock}
      />
    );
    expect(screen.getByText('Ponto A')).toBeInTheDocument();
  });

  it('exibe o texto do elemento', () => {
    renderWithTheme(
      <ConteudoLegenda
        elementosVisiveis={[makeElemento()]}
        larguraLegenda={250}
        map={mapMock}
      />
    );
    expect(screen.getByText('Descrição do ponto')).toBeInTheDocument();
  });
});

describe('ConteudoLegenda – elemento sem imagemURL', () => {
  it('não renderiza img quando imagemURL está ausente', () => {
    renderWithTheme(
      <ConteudoLegenda
        elementosVisiveis={[makeElemento({ imagemURL: undefined })]}
        larguraLegenda={250}
        map={mapMock}
      />
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('ConteudoLegenda – elemento com URL externa', () => {
  it('renderiza img com a URL externa diretamente', async () => {
    renderWithTheme(
      <ConteudoLegenda
        elementosVisiveis={[makeElemento({ imagemURL: URL_EXTERNA })]}
        larguraLegenda={250}
        map={mapMock}
      />
    );

    await waitFor(() => {
      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute(
        'src',
        expect.stringContaining('exemplo.com')
      );
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('ConteudoLegenda – elemento com chave R2 como imagemURL', () => {
  it('resolve a presigned URL via fetch e renderiza img com a URL resolvida', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ signedUrl: PRESIGNED_URL }),
    });

    renderWithTheme(
      <ConteudoLegenda
        elementosVisiveis={[makeElemento({ imagemURL: CHAVE_R2 })]}
        larguraLegenda={250}
        map={mapMock}
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
      expect(img).toHaveAttribute(
        'src',
        expect.stringContaining('r2.example.com')
      );
    });
  });

  it('não renderiza img enquanto a presigned URL não foi resolvida (estado inicial)', () => {
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));

    renderWithTheme(
      <ConteudoLegenda
        elementosVisiveis={[makeElemento({ imagemURL: CHAVE_R2 })]}
        larguraLegenda={250}
        map={mapMock}
      />
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
