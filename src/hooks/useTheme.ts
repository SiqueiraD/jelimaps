import { useTheme as useMuiTheme } from '@mui/material/styles';
import { colors, spacing, typography, shadows } from '@/styles/theme';

/**
 * Hook customizado para acessar o tema e tokens de design
 * Fornece acesso fácil aos tokens de design padronizados
 */
export const useTheme = () => {
  const muiTheme = useMuiTheme();
  
  return {
    // MUI Theme
    muiTheme,
    
    // Design Tokens
    colors,
    spacing,
    typography,
    shadows,
    
    // Utility functions
    getSpacing: (multiplier: number) => spacing.xs * multiplier,
    getColor: (path: string) => {
      const keys = path.split('.');
      let result: any = colors;
      for (const key of keys) {
        result = result[key];
      }
      return result;
    },
  };
};

export default useTheme;
