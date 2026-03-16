// Sistema de breakpoints para responsividade
export const breakpoints = {
  values: {
    xs: 0,      // Extra small devices (phones)
    sm: 600,    // Small devices (tablets)
    md: 960,    // Medium devices (small laptops)
    lg: 1280,   // Large devices (desktops)
    xl: 1920,   // Extra large devices (large desktops)
  },
  
  // Media queries prontas para uso
  up: {
    xs: '@media (min-width: 0px)',
    sm: '@media (min-width: 600px)',
    md: '@media (min-width: 960px)',
    lg: '@media (min-width: 1280px)',
    xl: '@media (min-width: 1920px)',
  },
  
  down: {
    xs: '@media (max-width: 599.95px)',
    sm: '@media (max-width: 959.95px)',
    md: '@media (max-width: 1279.95px)',
    lg: '@media (max-width: 1919.95px)',
    xl: '@media (max-width: 2560px)',
  },
  
  between: (min: keyof typeof breakpoints.values, max: keyof typeof breakpoints.values) => {
    const minValue = breakpoints.values[min];
    const maxValue = breakpoints.values[max] - 0.05;
    return `@media (min-width: ${minValue}px) and (max-width: ${maxValue}px)`;
  },
  
  only: (key: keyof typeof breakpoints.values) => {
    const keys = Object.keys(breakpoints.values) as Array<keyof typeof breakpoints.values>;
    const index = keys.indexOf(key);
    
    if (index === keys.length - 1) {
      return breakpoints.up[key];
    }
    
    const nextKey = keys[index + 1];
    const minValue = breakpoints.values[key];
    const maxValue = breakpoints.values[nextKey] - 0.05;
    
    return `@media (min-width: ${minValue}px) and (max-width: ${maxValue}px)`;
  },
} as const;

// Container widths
export const container = {
  maxWidth: {
    xs: '100%',
    sm: '600px',
    md: '960px',
    lg: '1280px',
    xl: '1920px',
  },
  padding: {
    xs: 16,
    sm: 24,
    md: 24,
    lg: 24,
    xl: 24,
  },
} as const;

// Grid system
export const grid = {
  columns: 12,
  gutters: {
    xs: 16,
    sm: 24,
    md: 24,
    lg: 32,
    xl: 32,
  },
} as const;
