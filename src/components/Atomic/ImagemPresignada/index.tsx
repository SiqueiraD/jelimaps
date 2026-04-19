import React from 'react';
import { usePresignedUrl } from '@/hooks/usePresignedUrl';

interface ImagemPresignadaProps {
  imagemURL?: string | null;
  mapaId?: string | null;
  alt: string;
  width: number;
  height: number;
  style?: React.CSSProperties;
}

export default function ImagemPresignada({
  imagemURL,
  mapaId,
  alt,
  width,
  height,
  style,
}: ImagemPresignadaProps) {
  const [resolvedUrl] = usePresignedUrl(imagemURL, mapaId);

  if (!resolvedUrl) return null;

  return (
    <img
      src={resolvedUrl}
      alt={alt}
      width={width}
      height={height}
      style={{ objectFit: 'contain', maxWidth: '100%', ...style }}
    />
  );
}
