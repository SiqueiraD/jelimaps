import { useState, useEffect, useCallback } from 'react';

const R2_KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i;

function isR2Key(value: string) {
  return !!value && R2_KEY_PATTERN.test(value);
}

async function fetchPresignedUrl(key: string, mapaId?: string | null): Promise<string> {
  const mapaIdParam = mapaId ? `&mapaId=${encodeURIComponent(mapaId)}` : '';
  const res = await fetch(`/api/download?key=${encodeURIComponent(key)}${mapaIdParam}`);
  if (!res.ok) throw new Error('Falha ao obter presigned URL');
  const { signedUrl } = await res.json();
  return signedUrl;
}

export function usePresignedUrl(
  value: string | null | undefined,
  mapaId?: string | null
): [string | null, () => void] {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  const resolve = useCallback(async (val: string, attempt = 0) => {
    if (!val) { setResolvedUrl(null); return; }
    if (!isR2Key(val)) { setResolvedUrl(val); return; }
    try {
      const url = await fetchPresignedUrl(val, mapaId);
      setResolvedUrl(url);
    } catch {
      if (attempt < 1) {
        setTimeout(() => resolve(val, attempt + 1), 1500);
      } else {
        setResolvedUrl(null);
      }
    }
  }, [mapaId]);

  useEffect(() => {
    resolve(value ?? '');
  }, [value, resolve]);

  const refresh = useCallback(() => {
    resolve(value ?? '');
  }, [value, resolve]);

  return [resolvedUrl, refresh];
}
