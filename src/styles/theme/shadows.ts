// Sistema de sombras padronizado
export const shadows = {
  // Elevações baseadas no Material Design
  elevation: {
    0: 'none',
    1: '0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)',
    2: '0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)',
    3: '0px 3px 3px -2px rgba(0,0,0,0.2), 0px 3px 4px 0px rgba(0,0,0,0.14), 0px 1px 8px 0px rgba(0,0,0,0.12)',
    4: '0px 2px 4px -1px rgba(0,0,0,0.2), 0px 4px 5px 0px rgba(0,0,0,0.14), 0px 1px 10px 0px rgba(0,0,0,0.12)',
    6: '0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px 0px rgba(0,0,0,0.14), 0px 1px 18px 0px rgba(0,0,0,0.12)',
    8: '0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)',
    12: '0px 7px 8px -4px rgba(0,0,0,0.2), 0px 12px 17px 2px rgba(0,0,0,0.14), 0px 5px 22px 4px rgba(0,0,0,0.12)',
    16: '0px 8px 10px -5px rgba(0,0,0,0.2), 0px 16px 24px 2px rgba(0,0,0,0.14), 0px 6px 30px 5px rgba(0,0,0,0.12)',
    24: '0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12)',
  },
  
  // Sombras customizadas
  custom: {
    // Sombras suaves
    soft: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
    
    // Sombras coloridas
    colored: {
      primary: '0 4px 14px 0 rgba(25, 118, 210, 0.39)',
      secondary: '0 4px 14px 0 rgba(220, 0, 78, 0.39)',
      success: '0 4px 14px 0 rgba(76, 175, 80, 0.39)',
      error: '0 4px 14px 0 rgba(244, 67, 54, 0.39)',
      warning: '0 4px 14px 0 rgba(255, 152, 0, 0.39)',
    },
    
    // Sombras internas
    inset: {
      sm: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      lg: 'inset 0 4px 6px 0 rgba(0, 0, 0, 0.1)',
    },
    
    // Sombra de foco
    focus: {
      primary: '0 0 0 3px rgba(25, 118, 210, 0.1)',
      secondary: '0 0 0 3px rgba(220, 0, 78, 0.1)',
      error: '0 0 0 3px rgba(244, 67, 54, 0.1)',
    },
  },
} as const;

// Função auxiliar para aplicar sombra
export const applyShadow = (elevation: number) => {
  const key = elevation as keyof typeof shadows.elevation;
  return shadows.elevation[key] || shadows.elevation[0];
};
