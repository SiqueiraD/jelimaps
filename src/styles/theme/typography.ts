// Sistema de tipografia padronizado
export const typography = {
  fontFamily: {
    primary: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    secondary: "'Inter', 'system-ui', sans-serif",
    monospace: "'Roboto Mono', 'Courier New', monospace",
  },
  
  fontSize: {
    // Base sizes
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    
    // Component specific
    h1: '2.5rem',     // 40px
    h2: '2rem',       // 32px
    h3: '1.75rem',    // 28px
    h4: '1.5rem',     // 24px
    h5: '1.25rem',    // 20px
    h6: '1.125rem',   // 18px
    body1: '1rem',    // 16px
    body2: '0.875rem',// 14px
    caption: '0.75rem',// 12px
    button: '0.875rem',// 14px
  },
  
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
    
    // Component specific
    heading: 1.2,
    body: 1.5,
    button: 1.75,
  },
  
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// Estilos de texto pré-definidos
export const textStyles = {
  h1: {
    fontSize: typography.fontSize.h1,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.heading,
    letterSpacing: typography.letterSpacing.tight,
  },
  h2: {
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.heading,
    letterSpacing: typography.letterSpacing.tight,
  },
  h3: {
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.heading,
  },
  h4: {
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.heading,
  },
  h5: {
    fontSize: typography.fontSize.h5,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.heading,
  },
  h6: {
    fontSize: typography.fontSize.h6,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.heading,
  },
  body1: {
    fontSize: typography.fontSize.body1,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.body,
  },
  body2: {
    fontSize: typography.fontSize.body2,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.body,
  },
  button: {
    fontSize: typography.fontSize.button,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.button,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
  },
  overline: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase' as const,
  },
} as const;
