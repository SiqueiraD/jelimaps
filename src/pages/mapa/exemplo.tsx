'use client';
import { useMapaStore } from '@/stores/mapaStore';
import 'leaflet/dist/leaflet.css';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const EXEMPLOS = ['one-piece', 'pequena-africa', 'golpe-64'];

export default function Exemplo() {
  const router = useRouter();
  const { clearStore, dispatch } = useMapaStore();

  useEffect(() => {
    const { id } = router.query;
    if (!id || typeof id !== 'string') return;

    clearStore();

    if (EXEMPLOS.includes(id)) {
      const su = require(`@/pages/examples/${id}.json`);
      dispatch({ type: 'reset', mapContext: su });
    }

    router.push('/mapa');
  }, [router, clearStore, dispatch]);

  return null;
}
