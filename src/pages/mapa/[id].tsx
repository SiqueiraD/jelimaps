'use client';
import { MapaProvider } from '@/components/Mapa/MapaContext';
import { getSupabaseAdmin } from '@/lib/supabase';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import Mapa from '@/pages/mapa/index';
import {
  autoRegistrarVisualizador,
  MapaCompleto,
} from '@/services/supabaseMapaService';
import { useMapaStore } from '@/stores/mapaStore';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import 'leaflet/dist/leaflet.css';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const Apresentacao = dynamic(() => import('@/components/Mapa/Apresentacao'), {
  ssr: false,
});

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Props {
  mapa: MapaCompleto & { publico: boolean };
  permissao: 'dono' | 'edit' | 'view';
}

export default function MapaById({ mapa, permissao }: Props) {
  const { clearStore, dispatch, setStore } = useMapaStore();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    clearStore();
    dispatch({
      type: 'reset',
      mapContext: {
        ...mapa.informacoes,
        id: mapa.id,
        titulo: mapa.titulo,
        apenasApresentacao: permissao === 'view',
        playStatus: permissao === 'view' ? 2 : -1,
      },
    });

    setStore(
      {
        mapaId: mapa.id,
        tituloMapa: mapa.titulo,
        mapaPublico: mapa.publico,
        mapaPermissao: permissao,
      },
      { syncSavedVersion: true }
    );

    setIsLoaded(true);
  }, [mapa, permissao, clearStore, dispatch, setStore]);

  if (!isLoaded) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (permissao === 'dono' || permissao === 'edit') {
    return <Mapa />;
  }

  return (
    <main style={{ height: '100%' }}>
      <MapaProvider>
        <Apresentacao />
      </MapaProvider>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };

  if (!UUID_REGEX.test(id)) {
    return {
      redirect: { destination: '/mapa/nao-encontrado', permanent: false },
    };
  }

  const session = await getServerSession(context.req, context.res, authOptions);
  const userId = (session as any)?.userId as string | undefined;

  const supabase = getSupabaseAdmin();

  const { data: mapa, error } = await supabase
    .from('mapas')
    .select('id, titulo, publico, dono_id, informacoes, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error || !mapa) {
    return {
      redirect: { destination: '/mapa/nao-encontrado', permanent: false },
    };
  }

  let permissao: 'dono' | 'edit' | 'view' | null = null;

  if (userId && mapa.dono_id === userId) {
    permissao = 'dono';
  } else if (userId) {
    const { data: perm } = await supabase
      .from('usuarios_mapas')
      .select('permissao')
      .eq('mapa_id', id)
      .eq('usuario_id', userId)
      .maybeSingle();

    if (perm) {
      permissao = perm.permissao as 'edit' | 'view';
    } else if (mapa.publico) {
      await autoRegistrarVisualizador(userId, id);
      permissao = 'view';
    }
  } else if (mapa.publico) {
    permissao = 'view';
  }

  if (!permissao) {
    return { redirect: { destination: '/403', permanent: false } };
  }

  return {
    props: {
      mapa: JSON.parse(JSON.stringify(mapa)),
      permissao,
    },
  };
};
