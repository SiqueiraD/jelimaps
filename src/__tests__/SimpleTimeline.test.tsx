import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SimpleTimeline from '@/components/Studio/LinhaTempo/SimpleTimeline';

const dispatch = jest.fn();
const openModalConfirm = jest.fn();
const context = {
  activeSceneId: 'scene-1',
  conteudo: {
    cenas: [
      {
        id: 'scene-1',
        nome: 'Primeira cena',
        dataRef: 'cenas',
        type: 'FeatureCollection',
        cenaInicio: '2026-01-01T00:00:00',
        cenaFim: '2026-01-01T00:00:05',
      },
      {
        id: 'scene-2',
        nome: 'Segunda cena',
        dataRef: 'cenas',
        type: 'FeatureCollection',
        cenaInicio: '2026-01-01T00:00:05',
        cenaFim: '2026-01-01T00:00:15',
      },
    ],
  },
};

jest.mock('@/components/Mapa/MapaContext', () => ({
  useMapaContext: () => context,
  useMapaDispatch: () => dispatch,
}));

jest.mock('@/components/CaixaDialogo/useCaixaDialogo', () => () => ({
  openModalConfirm,
}));

jest.mock('react-sortablejs', () => ({
  ReactSortable: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe('SimpleTimeline', () => {
  beforeEach(() => {
    dispatch.mockClear();
    openModalConfirm.mockClear();
  });

  it('renders scene names and durations', () => {
    render(<SimpleTimeline />);

    expect(screen.getByDisplayValue('Primeira cena')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Segunda cena')).toBeInTheDocument();
    expect(screen.getByText('5s')).toBeInTheDocument();
    expect(screen.getByText('10s')).toBeInTheDocument();
  });

  it('selects and adds scenes', () => {
    render(<SimpleTimeline />);

    fireEvent.click(screen.getByLabelText('Selecionar cena Segunda cena'));
    fireEvent.click(screen.getByLabelText('Adicionar cena'));

    expect(dispatch).toHaveBeenNthCalledWith(1, {
      type: 'selectSimpleScene',
      id: 'scene-2',
    });
    expect(dispatch).toHaveBeenNthCalledWith(2, {
      type: 'inserindoNovaCena',
    });
  });

  it('confirms cascade deletion', () => {
    render(<SimpleTimeline />);

    fireEvent.click(screen.getByLabelText('Excluir cena Primeira cena'));

    expect(openModalConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Deletar cena',
        onConfirm: expect.any(Function),
      })
    );
    openModalConfirm.mock.calls[0][0].onConfirm();
    expect(dispatch).toHaveBeenCalledWith({
      type: 'deletarCena',
      id: 'scene-1',
    });
  });
});
