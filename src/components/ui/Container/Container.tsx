import React from 'react';
import { Box, BoxProps } from '@mui/material';
import { styled } from '@mui/material/styles';
import { spacing } from '@/styles/theme';

export interface ContainerProps extends BoxProps {
  variant?: 'default' | 'section' | 'card' | 'form';
  noPadding?: boolean;
  centered?: boolean;
  fullHeight?: boolean;
}

const StyledContainer = styled(Box, {
  shouldForwardProp: (prop) => !['variant', 'noPadding', 'centered', 'fullHeight'].includes(prop as string),
})<ContainerProps>(({ theme, variant = 'default', noPadding, centered, fullHeight }) => {
  const paddingMap = {
    default: spacing.md,
    section: spacing.lg,
    card: spacing.md,
    form: spacing.lg,
  };

  return {
    padding: noPadding ? 0 : paddingMap[variant],
    ...(centered && {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    ...(fullHeight && {
      minHeight: '100vh',
    }),
    ...(variant === 'section' && {
      marginBottom: spacing.section,
    }),
    ...(variant === 'card' && {
      backgroundColor: theme.palette.background.paper,
      borderRadius: theme.shape.borderRadius,
      boxShadow: theme.shadows[1],
    }),
  };
});

export const Container: React.FC<ContainerProps> = ({
  children,
  variant = 'default',
  noPadding = false,
  centered = false,
  fullHeight = false,
  ...props
}) => {
  return (
    <StyledContainer
      variant={variant}
      noPadding={noPadding}
      centered={centered}
      fullHeight={fullHeight}
      {...props}
    >
      {children}
    </StyledContainer>
  );
};

export default Container;
