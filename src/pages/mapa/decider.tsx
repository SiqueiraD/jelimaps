import { useMapaContext, useMapaDispatch } from '@/components/Mapa/MapaContext';
import dynamic from 'next/dynamic';

const Apresentacao = dynamic(() => import('@/components/Mapa/Apresentacao'), {
  ssr: false,
});

const Studio = dynamic(() => import('@/components/Studio'), {
  ssr: false,
});

const Decider = () => {
  const dispatch = useMapaDispatch();
  const mapaContext = useMapaContext();
  if (mapaContext.playStatus === 2 && mapaContext.elementoFoco !== null)
    dispatch({ type: 'selecionarElementoFoco' });
  return mapaContext.playStatus === 2 ? <Apresentacao /> : <Studio />;
};
export default Decider;
