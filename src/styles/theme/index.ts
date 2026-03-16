// Arquivo principal do tema - exporta todos os tokens de design
export { colors, darkColors } from './colors';
export { spacing, getSpacing, getSpacingRem, spacingClasses } from './spacing';
export { typography, textStyles } from './typography';
export { breakpoints, container, grid } from './breakpoints';
export { shadows, applyShadow } from './shadows';

// Tema unificado
import { colors, darkColors } from './colors';
import { spacing } from './spacing';
import { typography, textStyles } from './typography';
import { breakpoints, container, grid } from './breakpoints';
import { shadows } from './shadows';

export const theme = {
  colors,
  darkColors,
  spacing,
  typography,
  textStyles,
  breakpoints,
  container,
  grid,
  shadows,
  
  // Configurações adicionais
  shape: {
    borderRadius: {
      none: 0,
      sm: 2,
      md: 4,
      lg: 8,
      xl: 12,
      full: 9999,
    },
  },
  
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  
  zIndex: {
    mobileStepper: 1000,
    fab: 1050,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
} as const;

export default theme;
