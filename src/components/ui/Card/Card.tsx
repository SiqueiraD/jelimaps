import React from 'react';
import { Card as MuiCard, CardProps as MuiCardProps, CardContent, CardActions, CardHeader } from '@mui/material';
import { styled } from '@mui/material/styles';

export interface CardProps extends Omit<MuiCardProps, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
  hoverable?: boolean;
}

const StyledCard = styled(MuiCard, {
  shouldForwardProp: (prop) => prop !== 'hoverable',
})<{ hoverable?: boolean }>(({ theme, hoverable }) => ({
  transition: 'all 0.3s ease',
  ...(hoverable && {
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[8],
    },
  }),
}));

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  actions,
  children,
  noPadding = false,
  hoverable = false,
  ...props
}) => {
  return (
    <StyledCard hoverable={hoverable} {...props}>
      {(title || subtitle) && (
        <CardHeader 
          title={title} 
          subheader={subtitle}
          titleTypographyProps={{ variant: 'h6' }}
        />
      )}
      {noPadding ? (
        children
      ) : (
        <CardContent>{children}</CardContent>
      )}
      {actions && (
        <CardActions>{actions}</CardActions>
      )}
    </StyledCard>
  );
};

export default Card;
