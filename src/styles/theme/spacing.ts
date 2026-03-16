// Sistema de espaçamento padronizado baseado em múltiplos de 4px
export const spacing = {
  // Espaçamentos básicos (múltiplos de 4)
  xxs: 4,    // 4px
  xs: 8,     // 8px
  sm: 12,    // 12px
  md: 16,    // 16px
  lg: 24,    // 24px
  xl: 32,    // 32px
  xxl: 40,   // 40px
  xxxl: 48,  // 48px

  // Espaçamentos específicos
  gutter: 16,      // Espaçamento padrão entre elementos
  section: 32,     // Espaçamento entre seções
  container: 24,   // Padding de containers
  
  // Espaçamentos de formulário
  form: {
    fieldGap: 16,     // Espaço entre campos
    labelGap: 8,      // Espaço entre label e campo
    sectionGap: 24,   // Espaço entre seções do formulário
  },

  // Espaçamentos de componentes
  component: {
    button: {
      paddingX: 16,
      paddingY: 8,
      gap: 8,
    },
    card: {
      padding: 16,
      gap: 12,
    },
    dialog: {
      padding: 24,
      gap: 16,
    },
    list: {
      itemPadding: 12,
      itemGap: 8,
    },
  },
} as const;

// Funções auxiliares para espaçamento
export const getSpacing = (value: number) => `${value}px`;
export const getSpacingRem = (value: number) => `${value / 16}rem`;

// Mapeamento para classes do Tailwind
export const spacingClasses = {
  margin: {
    xxs: 'm-1',
    xs: 'm-2',
    sm: 'm-3',
    md: 'm-4',
    lg: 'm-6',
    xl: 'm-8',
    xxl: 'm-10',
    xxxl: 'm-12',
  },
  padding: {
    xxs: 'p-1',
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
    xxl: 'p-10',
    xxxl: 'p-12',
  },
  gap: {
    xxs: 'gap-1',
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
    xxl: 'gap-10',
    xxxl: 'gap-12',
  },
} as const;
