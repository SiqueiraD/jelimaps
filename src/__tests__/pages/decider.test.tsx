/**
 * @jest-environment jsdom
 */

/**
 * Testes — Página Decider
 *
 * Módulo: roteamento entre Apresentação e Studio
 *
 * Cobre:
 * - Quando playStatus === 2 → renderiza Apresentacao
 * - Quando playStatus !== 2 → renderiza Studio
 * - Quando playStatus === 2 e elementoFoco !== null → dispatch é chamado
 */

import { render, screen } from '@testing-library/react';
import React from 'react';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockDispatch = jest.fn();
let mockContext: Record<string, any> = {};

jest.mock('@/components/Mapa/MapaContext', () => ({
  useMapaContext: () => mockContext,
  useMapaDispatch: () => mockDispatch,
}));

// Mock dos componentes carregados dinamicamente
jest.mock('@/components/Mapa/Apresentacao', () => {
  const MockApresentacao = () => (
    <div data-testid="apresentacao">Apresentação</div>
  );
  MockApresentacao.displayName = 'Apresentacao';
  return { __esModule: true, default: MockApresentacao };
});

jest.mock('@/components/Studio', () => {
  const MockStudio = () => <div data-testid="studio">Studio</div>;
  MockStudio.displayName = 'Studio';
  return { __esModule: true, default: MockStudio };
});

// Reimplementar next/dynamic para que realmente renderize os componentes mockados
jest.mock('next/dynamic', () => {
  return (loaderFn: () => Promise<any>) => {
    const LazyComponent = React.lazy(loaderFn);
    const Wrapper = () => (
      <React.Suspense fallback={<div>Loading...</div>}>
        <LazyComponent />
      </React.Suspense>
    );
    return Wrapper;
  };
});

import Decider from '@/pages/mapa/decider';

// ── Testes ───────────────────────────────────────────────────────────────────

describe('Decider – roteamento entre Apresentação e Studio', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    mockContext = { playStatus: -1, elementoFoco: null };
  });

  it('renderiza Studio quando playStatus !== 2', async () => {
    mockContext = { playStatus: -1, elementoFoco: null };

    render(<Decider />);

    const studio = await screen.findByTestId('studio');
    expect(studio).toBeInTheDocument();
    expect(screen.queryByTestId('apresentacao')).not.toBeInTheDocument();
  });

  it('renderiza Apresentacao quando playStatus === 2', async () => {
    mockContext = { playStatus: 2, elementoFoco: null };

    render(<Decider />);

    const apresentacao = await screen.findByTestId('apresentacao');
    expect(apresentacao).toBeInTheDocument();
    expect(screen.queryByTestId('studio')).not.toBeInTheDocument();
  });

  it('chama dispatch para limpar elementoFoco quando playStatus=2 e elementoFoco não é null', async () => {
    mockContext = { playStatus: 2, elementoFoco: 'algum-elemento' };

    render(<Decider />);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'selecionarElementoFoco',
    });
  });

  it('NÃO chama dispatch quando playStatus=2 mas elementoFoco é null', async () => {
    mockContext = { playStatus: 2, elementoFoco: null };

    render(<Decider />);

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('NÃO chama dispatch quando playStatus !== 2', () => {
    mockContext = { playStatus: 0, elementoFoco: 'algum-elemento' };

    render(<Decider />);

    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
