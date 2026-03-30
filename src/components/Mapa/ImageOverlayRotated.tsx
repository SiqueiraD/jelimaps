import { usePresignedUrl } from '@/hooks/usePresignedUrl';
import L, { Bounds, LatLng } from 'leaflet';
import 'leaflet-imageoverlay-rotated';
import 'leaflet.path.drag';
import { useEffect, useRef } from 'react';
import { Marker, useMap } from 'react-leaflet';
import { useMapaContext, useMapaDispatch } from './MapaContext';
import { elementoComBounds } from './mapaContextTypes';

type Props = {
  x: elementoComBounds;
  cliqueElementoNoMapa?: (elemento: any, evento: any) => void;
  isApresentacao?: boolean;
};

const ImageOverlayRotated = (props: Props) => {
  const { x, cliqueElementoNoMapa, isApresentacao } = props;
  const map = useMap();
  const dispatch = useMapaDispatch();
  const mapaContext = useMapaContext();
  const imageCurrentRef = useRef<any>(null);
  const isAddedToMapRef = useRef(false);
  const eventMoveRef = useRef<any>(null);

  // Refs para manter valores atualizados sem recriar a camada
  const cliqueRef = useRef(cliqueElementoNoMapa);
  const xRef = useRef(x);
  cliqueRef.current = cliqueElementoNoMapa;
  xRef.current = x;

  const [resolvedUrl, refreshUrl] = usePresignedUrl(
    x.urlImagem,
    mapaContext.id
  );

  // Visibilidade baseada no tempo
  const isVisible =
    new Date(x.cenaInicio) <= new Date(mapaContext.tempo) &&
    new Date(x.cenaFim) >= new Date(mapaContext.tempo);

  // Criar a camada Leaflet UMA VEZ quando a URL resolver (ou mudar)
  useEffect(() => {
    if (!resolvedUrl || !(L.imageOverlay as any).rotated) return;

    const im = (L.imageOverlay as any).rotated(
      resolvedUrl,
      xRef.current.positionTL,
      xRef.current.positionTR,
      xRef.current.positionBL,
      {
        interactive: !!cliqueRef.current,
        bubblingMouseEvents: false,
        ...xRef.current,
      }
    );

    if (cliqueRef.current && !isApresentacao)
      im.on('click', (e: any) => cliqueRef.current?.(xRef.current, e));
    im.on('error', () => refreshUrl());
    imageCurrentRef.current = im;
    isAddedToMapRef.current = false;

    return () => {
      if (isAddedToMapRef.current) {
        map.removeLayer(im);
        isAddedToMapRef.current = false;
      }
      im.off('click');
      im.off('error');
      imageCurrentRef.current = null;
    };
  }, [resolvedUrl, map, isApresentacao, refreshUrl]);

  // Controlar visibilidade: adicionar/remover do mapa apenas quando isVisible muda
  useEffect(() => {
    if (!imageCurrentRef.current) return;

    if (isVisible && !isAddedToMapRef.current) {
      map.addLayer(imageCurrentRef.current);
      isAddedToMapRef.current = true;
    } else if (!isVisible && isAddedToMapRef.current) {
      map.removeLayer(imageCurrentRef.current);
      isAddedToMapRef.current = false;
    }
  }, [isVisible, map, imageCurrentRef, resolvedUrl]);

  // Atualizar posições sem recriar a camada
  useEffect(() => {
    if (imageCurrentRef.current) {
      imageCurrentRef.current.reposition(
        x.positionTL,
        x.positionTR,
        x.positionBL
      );
    }
  }, [x.positionTL, x.positionTR, x.positionBL]);

  const centerUpdated = new LatLng(
    new Bounds(
      [x.positionTR[1], x.positionTR[0]],
      [x.positionBL[1], x.positionBL[0]]
    ).getCenter().y,
    new Bounds(
      [x.positionTR[1], x.positionTR[0]],
      [x.positionBL[1], x.positionBL[0]]
    ).getCenter().x
  );

  const dispatchReposition = (
    nomePropriedade: 'positionTL' | 'positionTR' | 'positionBL'
  ) => {
    dispatch({
      type: 'editarPropriedade',
      id: x.id,
      tipo: 'ImageOverlay',
      nomePropriedade,
      valorPropriedade: [
        eventMoveRef.current.latlng.lat,
        eventMoveRef.current.latlng.lng,
      ],
    });
  };

  const reposition = (
    nomePropriedade: 'positionTL' | 'positionTR' | 'positionBL',
    valorPropriedade: any
  ) => {
    eventMoveRef.current = valorPropriedade;
    if (imageCurrentRef.current)
      switch (nomePropriedade) {
        case 'positionTL':
          imageCurrentRef.current.reposition(
            valorPropriedade.latlng,
            x.positionTR,
            x.positionBL
          );
          break;
        case 'positionTR':
          imageCurrentRef.current.reposition(
            x.positionTL,
            valorPropriedade.latlng,
            x.positionBL
          );
          break;
        case 'positionBL':
          imageCurrentRef.current.reposition(
            x.positionTL,
            x.positionTR,
            valorPropriedade.latlng
          );
          break;

        default:
          break;
      }
  };

  const getDiffPositionsByCenter = (valorPropriedade: any) => {
    const diffLat =
      (centerUpdated ?? valorPropriedade.oldLatLng).lat -
      valorPropriedade.latlng.lat;
    const diffLng =
      (centerUpdated ?? valorPropriedade.oldLatLng).lng -
      valorPropriedade.latlng.lng;
    return {
      positionTL: [x.positionTL[0] - diffLat, x.positionTL[1] - diffLng],
      positionTR: [x.positionTR[0] - diffLat, x.positionTR[1] - diffLng],
      positionBL: [x.positionBL[0] - diffLat, x.positionBL[1] - diffLng],
    };
  };

  const dispatchRepositionCenter = () => {
    const diffPositions = getDiffPositionsByCenter(eventMoveRef.current);
    dispatch({
      type: 'movendoImagem',
      id: x.id,
      valor: diffPositions,
    });
  };

  const repositionCenter = (valorPropriedade: any) => {
    eventMoveRef.current = valorPropriedade;
    const diffPositions = getDiffPositionsByCenter(valorPropriedade);

    if (imageCurrentRef.current)
      imageCurrentRef.current.reposition(
        diffPositions.positionTL,
        diffPositions.positionTR,
        diffPositions.positionBL
      );
  };

  // Renderizar markers de edição apenas se visível e selecionado
  if (!isVisible) return null;

  return (x.draggable &&
    mapaContext.elementosFoco &&
    mapaContext.elementosFoco.length > 0 &&
    mapaContext.elementosFoco?.some((z) => z.id === x.id)) ||
    mapaContext.elementoFoco?.id === x.id ? (
    <>
      <Marker
        position={x.positionTL}
        draggable={x.draggable}
        eventHandlers={{
          move: (e: any) => reposition('positionTL', e),
          moveend: () => dispatchReposition('positionTL'),
        }}
      />
      <Marker
        position={x.positionTR}
        draggable={x.draggable}
        eventHandlers={{
          move: (e: any) => reposition('positionTR', e),
          moveend: () => dispatchReposition('positionTR'),
        }}
      />
      <Marker
        position={x.positionBL}
        draggable={x.draggable}
        eventHandlers={{
          move: (e: any) => reposition('positionBL', e),
          moveend: () => dispatchReposition('positionBL'),
        }}
      />
      <Marker
        position={centerUpdated}
        draggable={x.draggable}
        eventHandlers={{
          move: (e: any) => repositionCenter(e),
          moveend: () => dispatchRepositionCenter(),
        }}
      />
    </>
  ) : null;
};

export default ImageOverlayRotated;
