import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

export interface ButtonProps extends MuiButtonProps {
  loading?: boolean;
  fullWidth?: boolean;
}

const StyledButton = styled(MuiButton)(({ theme }) => ({
  // Usa os tokens do tema para garantir consistência
  '&.MuiButton-root': {
    transition: 'all 0.3s ease',
  },
}));

export const Button: React.FC<ButtonProps> = ({
  children,
  loading = false,
  disabled = false,
  startIcon,
  fullWidth = false,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  ...props
}) => {
  return (
    <StyledButton
      variant={variant}
      color={color}
      size={size}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : startIcon}
      fullWidth={fullWidth}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

export default Button;
