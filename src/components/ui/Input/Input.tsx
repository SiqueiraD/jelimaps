import React from 'react';
import { TextField, TextFieldProps, InputAdornment } from '@mui/material';
import { styled } from '@mui/material/styles';

export interface InputProps extends Omit<TextFieldProps, 'variant'> {
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  loading?: boolean;
}

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    transition: 'all 0.3s ease',
    '&.Mui-focused': {
      boxShadow: `0 0 0 2px ${theme.palette.primary.main}20`,
    },
  },
}));

export const Input: React.FC<InputProps> = ({
  startIcon,
  endIcon,
  loading = false,
  disabled = false,
  size = 'small',
  fullWidth = true,
  ...props
}) => {
  const InputProps: any = {};
  
  if (startIcon) {
    InputProps.startAdornment = (
      <InputAdornment position="start">{startIcon}</InputAdornment>
    );
  }
  
  if (endIcon) {
    InputProps.endAdornment = (
      <InputAdornment position="end">{endIcon}</InputAdornment>
    );
  }

  return (
    <StyledTextField
      variant="outlined"
      size={size}
      fullWidth={fullWidth}
      disabled={disabled || loading}
      InputProps={InputProps}
      {...props}
    />
  );
};

export default Input;
