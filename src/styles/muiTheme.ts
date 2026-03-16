import { createTheme } from '@mui/material/styles';
import { colors, spacing, typography, shadows } from './theme';

// Cria tema MUI baseado nos design tokens
export const muiTheme = createTheme({
  palette: {
    primary: {
      main: colors.primary.main,
      light: colors.primary.light,
      dark: colors.primary.dark,
      contrastText: colors.primary.contrastText,
    },
    secondary: {
      main: colors.secondary.main,
      light: colors.secondary.light,
      dark: colors.secondary.dark,
      contrastText: colors.secondary.contrastText,
    },
    error: {
      main: colors.error.main,
      light: colors.error.light,
      dark: colors.error.dark,
      contrastText: colors.error.contrastText,
    },
    warning: {
      main: colors.warning.main,
      light: colors.warning.light,
      dark: colors.warning.dark,
      contrastText: colors.warning.contrastText,
    },
    info: {
      main: colors.info.main,
      light: colors.info.light,
      dark: colors.info.dark,
      contrastText: colors.info.contrastText,
    },
    success: {
      main: colors.success.main,
      light: colors.success.light,
      dark: colors.success.dark,
      contrastText: colors.success.contrastText,
    },
    grey: colors.grey,
    text: colors.text,
    background: colors.background,
    divider: colors.divider,
    action: colors.action,
  },
  
  typography: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 14,
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
      textTransform: 'uppercase',
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
      textTransform: 'uppercase',
    },
  },
  
  spacing: (factor: number) => `${spacing.xxs * factor}px`,
  
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  
  shape: {
    borderRadius: 4,
  },
  
  shadows: [
    'none',
    shadows.elevation[1],
    shadows.elevation[2],
    shadows.elevation[3],
    shadows.elevation[4],
    shadows.elevation[4], // 5 usa o mesmo que 4
    shadows.elevation[6],
    shadows.elevation[6], // 7 usa o mesmo que 6
    shadows.elevation[8],
    shadows.elevation[8], // 9 usa o mesmo que 8
    shadows.elevation[8], // 10 usa o mesmo que 8
    shadows.elevation[8], // 11 usa o mesmo que 8
    shadows.elevation[12],
    shadows.elevation[12], // 13 usa o mesmo que 12
    shadows.elevation[12], // 14 usa o mesmo que 12
    shadows.elevation[12], // 15 usa o mesmo que 12
    shadows.elevation[16],
    shadows.elevation[16], // 17 usa o mesmo que 16
    shadows.elevation[16], // 18 usa o mesmo que 16
    shadows.elevation[16], // 19 usa o mesmo que 16
    shadows.elevation[16], // 20 usa o mesmo que 16
    shadows.elevation[16], // 21 usa o mesmo que 16
    shadows.elevation[16], // 22 usa o mesmo que 16
    shadows.elevation[16], // 23 usa o mesmo que 16
    shadows.elevation[24],
  ],
  
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: 'none',
          fontWeight: typography.fontWeight.medium,
        },
        contained: {
          boxShadow: shadows.elevation[2],
          '&:hover': {
            boxShadow: shadows.elevation[4],
          },
        },
        sizeSmall: {
          padding: `${spacing.xs}px ${spacing.md}px`,
        },
        sizeMedium: {
          padding: `${spacing.xs}px ${spacing.lg}px`,
        },
        sizeLarge: {
          padding: `${spacing.sm}px ${spacing.xl}px`,
        },
      },
    },
    
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
        fullWidth: true,
      },
      styleOverrides: {
        root: {
          marginBottom: spacing.md,
        },
      },
    },
    
    MuiFormControl: {
      styleOverrides: {
        root: {
          marginBottom: spacing.md,
        },
      },
    },
    
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: shadows.elevation[1],
        },
        elevation2: {
          boxShadow: shadows.elevation[2],
        },
        elevation3: {
          boxShadow: shadows.elevation[3],
        },
        elevation4: {
          boxShadow: shadows.elevation[4],
        },
      },
    },
    
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: shadows.elevation[2],
          '&:hover': {
            boxShadow: shadows.elevation[4],
          },
        },
      },
    },
    
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: shadows.elevation[4],
        },
      },
    },
    
    MuiDrawer: {
      styleOverrides: {
        paper: {
          boxShadow: shadows.elevation[16],
        },
      },
    },
    
    MuiDialog: {
      styleOverrides: {
        paper: {
          boxShadow: shadows.elevation[24],
        },
      },
    },
    
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: colors.grey[700],
          fontSize: typography.fontSize.caption,
        },
      },
    },
    
    MuiSnackbar: {
      styleOverrides: {
        root: {
          boxShadow: shadows.elevation[6],
        },
      },
    },
  },
});

export default muiTheme;
