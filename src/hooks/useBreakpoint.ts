import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

/**
 * Hook customizado para responsividade
 * Facilita o uso de breakpoints do sistema de design
 */
export const useBreakpoint = () => {
  const theme = useTheme();
  
  const xs = useMediaQuery(theme.breakpoints.up('xs'));
  const sm = useMediaQuery(theme.breakpoints.up('sm'));
  const md = useMediaQuery(theme.breakpoints.up('md'));
  const lg = useMediaQuery(theme.breakpoints.up('lg'));
  const xl = useMediaQuery(theme.breakpoints.up('xl'));
  
  const xsOnly = useMediaQuery(theme.breakpoints.only('xs'));
  const smOnly = useMediaQuery(theme.breakpoints.only('sm'));
  const mdOnly = useMediaQuery(theme.breakpoints.only('md'));
  const lgOnly = useMediaQuery(theme.breakpoints.only('lg'));
  const xlOnly = useMediaQuery(theme.breakpoints.only('xl'));
  
  const smDown = useMediaQuery(theme.breakpoints.down('sm'));
  const mdDown = useMediaQuery(theme.breakpoints.down('md'));
  const lgDown = useMediaQuery(theme.breakpoints.down('lg'));
  
  const isMobile = smDown;
  const isTablet = smOnly || mdOnly;
  const isDesktop = lg;
  
  return {
    // Breakpoint states
    xs,
    sm,
    md,
    lg,
    xl,
    
    // Only specific breakpoint
    xsOnly,
    smOnly,
    mdOnly,
    lgOnly,
    xlOnly,
    
    // Down from breakpoint
    smDown,
    mdDown,
    lgDown,
    
    // Device types
    isMobile,
    isTablet,
    isDesktop,
    
    // Current breakpoint
    current: xlOnly ? 'xl' : lgOnly ? 'lg' : mdOnly ? 'md' : smOnly ? 'sm' : 'xs',
  };
};

export default useBreakpoint;
