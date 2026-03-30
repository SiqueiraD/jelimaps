/**
 * @jest-environment jsdom
 */

/**
 * Testes unitários — componente Button
 *
 * Módulo: componente UI Button do design system
 *
 * Cobre:
 * - Renderização com texto
 * - Estado loading (desabilita e mostra spinner)
 * - Estado disabled
 * - Callback onClick
 * - Variantes (contained, outlined, text)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Button from '@/components/ui/Button/Button';

// Wrapper com ThemeProvider para componentes MUI
const theme = createTheme();
const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('Button – renderização básica', () => {
  it('renderiza o texto do botão', () => {
    renderWithTheme(<Button>Salvar</Button>);
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
  });

  it('aplica variant="contained" por padrão', () => {
    renderWithTheme(<Button>Teste</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('MuiButton-contained');
  });

  it('aplica variant="outlined" quando especificado', () => {
    renderWithTheme(<Button variant="outlined">Outline</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('MuiButton-outlined');
  });
});

describe('Button – estado loading', () => {
  it('desabilita o botão quando loading=true', () => {
    renderWithTheme(<Button loading>Carregando</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('exibe CircularProgress quando loading=true', () => {
    renderWithTheme(<Button loading>Carregando</Button>);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('NÃO exibe CircularProgress quando loading=false', () => {
    renderWithTheme(<Button>Normal</Button>);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});

describe('Button – estado disabled', () => {
  it('desabilita o botão quando disabled=true', () => {
    renderWithTheme(<Button disabled>Desabilitado</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('Button – interação', () => {
  it('chama onClick quando clicado', () => {
    const handleClick = jest.fn();
    renderWithTheme(<Button onClick={handleClick}>Clique</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('NÃO chama onClick quando disabled', () => {
    const handleClick = jest.fn();
    renderWithTheme(
      <Button disabled onClick={handleClick}>
        Desabilitado
      </Button>
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('NÃO chama onClick quando loading', () => {
    const handleClick = jest.fn();
    renderWithTheme(
      <Button loading onClick={handleClick}>
        Carregando
      </Button>
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
