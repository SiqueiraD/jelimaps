import CustomControlLeaflet, {
  POSITION_CLASSES_CUSTOM_CONTROL,
} from '@/components/CustomControlLeaflet/CustomControlLeaflet';
import { useMapaContext, useMapaDispatch } from '@/components/Mapa/MapaContext';
import { usePresignedUrl } from '@/hooks/usePresignedUrl';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  Grid2,
} from '@mui/material';
import Leaflet, { LatLng, LatLngBounds, Map } from 'leaflet';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ImageOverlay, MapContainer } from 'react-leaflet';
// import Elementos from "./Elementos";
import ImageUploadField from '@/components/Atomic/ImageUploadField';
import ImageResolver from '@/components/ImageUrlResolver';
import { elementos } from '@/main/constants/elementos';
import { KeyboardDoubleArrowUp, PlaylistPlay } from '@mui/icons-material';
import { TerraDraw } from 'terra-draw';
import useCaixaDialogo from '../CaixaDialogo/useCaixaDialogo';
import ConteudoMapa from '../Mapa/ConteudoMapa';
import MapaContextChanger from '../Mapa/ContextChangers';
import { MODO_VISAO, tipoElemento } from '../Mapa/mapaContextTypes';
import { getImageDimensions } from '../Mapa/MapaUtils';
import PlanoFundoMapaComum from '../Mapa/PlanoFundoMapaComum/PlanoFundoMapaComum';
import SliderLinhaTempo from '../Mapa/SliderLinhaTempo';
import SearchLocationControl from '../SearchBox/SearchLocationControl';
import UndoControl from './UndoControl';
import useWindowDimensions from './useWindowDimensions';

delete (Leaflet.Icon.Default.prototype as any)._getIconUrl;
Leaflet.Icon.Default.mergeOptions({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
});

export default function Mapa(propsMapa: {
  altura: number;
  largura: number;
  draw: TerraDraw;
  setMapa: React.Dispatch<React.SetStateAction<Leaflet.Map>>;
  conteudoElementosRef: React.MutableRefObject<tipoElemento[]>;
}) {
  const { setMapa, conteudoElementosRef } = propsMapa;
  const [isMounted, setIsMounted] = React.useState(false);
  const { width, height } = useWindowDimensions();
  const [map, setMap] = useState<Map>(null);
  const caixaDialogoRef = useRef<String>(null);
  const mapaContext = useMapaContext();
  const dispatch = useMapaDispatch();
  const position = useMemo(
    () =>
      mapaContext.modoVisao === MODO_VISAO.openstreetmap
        ? [-22.906659526195618, -43.1333403313017]
        : [0.5, 0.75],
    [mapaContext.modoVisao]
  );
  const moveStartedRef = useRef<boolean>(false);
  useEffect(() => {
    if (map && !isMounted) {
      map.on('moveend', () => {
        if (!moveStartedRef.current)
          setTimeout(() => {
            if (
              !mapaContext.center ||
              map.distance(mapaContext.center, map.getCenter()) > 1
            ) {
              dispatch({ type: 'alteraPropriedadesMapa', map: map });
            }
          }, 100);
        else moveStartedRef.current = false;
      });

      setMapa(map);
      setIsMounted(true);
    }
  }, [map, isMounted, mapaContext, dispatch, setMapa]);

  const center = useMemo(
    () => new LatLng(position[0], position[1]),
    [position]
  );
  const zoom = mapaContext.modoVisao === MODO_VISAO.openstreetmap ? 15 : 9;
  useEffect(() => {
    if (map != null) {
      moveStartedRef.current = true;
      map.setView(center, zoom);
    }
  }, [mapaContext.modoVisao, map, center, zoom]);

  const [resolvedUrlMapaProprio] = usePresignedUrl(
    mapaContext.urlMapaProprio,
    mapaContext.id
  );
  const urlImageRef = useRef<string>();
  const { openModalConfirm, closeModalConfirm, onConfirm } = useCaixaDialogo();

  //TODO: Função undo não pode reabrir popup de inserção de elemento????
  const handleDispatchInserirImageOverlay = React.useCallback(async () => {
    dispatch({
      type: 'adicionarImageOverlay',
      tipo: 'ImageOverlay',
      valor: await ImageResolver.UrlResolver(urlImageRef.current),
    });
    propsMapa.draw.setMode(elementos.Hand.nome);
    closeModalConfirm(null, null);
    caixaDialogoRef.current = urlImageRef.current = null;
  }, [dispatch, closeModalConfirm, propsMapa.draw]);

  const handleInserirImagem = React.useCallback(() => {
    openModalConfirm({
      title: '',
      onClosed: () => {
        caixaDialogoRef.current = null;
      },
      message: '',
      onConfirm,
      cancelarNotVisible: true,
      confirmarNotVisible: true,
      componentMessage: (
        <div>
          <DialogTitle>
            Por favor, insira a url da imagem do seu mapa!
          </DialogTitle>
          <DialogContent dividers>
            <ImageUploadField
              defaultValue={urlImageRef.current ?? ''}
              onChange={(url) => {
                urlImageRef.current = url;
              }}
              mapaId={mapaContext.id}
              previewWidth={Math.round(width * 0.21)}
              previewHeight={Math.round(height * 0.21)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDispatchInserirImageOverlay}>Salvar</Button>
          </DialogActions>
        </div>
      ),
    });
  }, [
    openModalConfirm,
    onConfirm,
    width,
    height,
    mapaContext.id,
    handleDispatchInserirImageOverlay,
  ]);

  useEffect(() => {
    if (
      mapaContext.center &&
      map &&
      mapaContext.center?.lat !== map.getCenter().lat &&
      mapaContext.center?.lng !== map.getCenter().lng
    ) {
      moveStartedRef.current = true;
      map.setView(mapaContext.center, mapaContext.zoom);
    }
    if (
      mapaContext.caixaDialogo &&
      mapaContext.caixaDialogo !== caixaDialogoRef.current &&
      mapaContext.caixaDialogo !== ''
    ) {
      caixaDialogoRef.current = mapaContext.caixaDialogo;
      dispatch({
        type: 'limpaCaixaDialogo',
      });
      handleInserirImagem();
    }

    if (map) map.setMaxZoom(mapaContext.tipoMapaComum?.maxZoom ?? 23);
    console.log('mapaContext', mapaContext);
    conteudoElementosRef.current =
      MapaContextChanger.retornaListaElementosConteudoCenaAtual(mapaContext);
  });
  if (propsMapa.draw && (propsMapa.draw as any)._mode?._state == 'selecting') {
    propsMapa.draw.clear();
  }

  const [bounds, setBounds] = useState<LatLngBounds>(
    new LatLngBounds([0, 0], [1, 1.5])
  );
  useEffect(() => {
    if (
      mapaContext.modoVisao === MODO_VISAO.mapaProprio &&
      resolvedUrlMapaProprio
    )
      getImageDimensions(resolvedUrlMapaProprio).then((dimensions) =>
        setBounds(
          new LatLngBounds(
            [0, 0],
            [(dimensions as any).height, (dimensions as any).width]
          )
        )
      );
  }, [mapaContext.modoVisao, resolvedUrlMapaProprio]);

  return (
    <Grid2 size={'grow'} id={'idMapa'}>
      <div
        style={{
          height: propsMapa.altura,
          width: propsMapa.largura,
          display: 'grid',
        }}
      >
        <MapContainer
          center={mapaContext.mapOptions?.center ?? center}
          zoom={mapaContext.mapOptions?.zoom ?? zoom}
          ref={setMap}
          maxZoom={mapaContext.tipoMapaComum?.maxZoom ?? 23}
          minZoom={mapaContext.modoVisao === MODO_VISAO.mapaProprio ? 9 : 3}
        >
          {mapaContext.modoVisao === MODO_VISAO.openstreetmap && (
            <PlanoFundoMapaComum />
          )}
          {mapaContext.modoVisao === MODO_VISAO.mapaProprio &&
            resolvedUrlMapaProprio && (
              <ImageOverlay bounds={bounds} url={resolvedUrlMapaProprio} />
            )}
          {(mapaContext.modoVisao === MODO_VISAO.openstreetmap ||
            (mapaContext.modoVisao === MODO_VISAO.mapaProprio &&
              resolvedUrlMapaProprio)) && (
            <ConteudoMapa draw={propsMapa.draw} />
          )}
          {/* <CustomControlLeaflet
            position={POSITION_CLASSES_CUSTOM_CONTROL.bottomright}
          >
            <Elementos altura={props.altura} />
          </CustomControlLeaflet> */}
          {mapaContext.modoVisao === MODO_VISAO.openstreetmap && (
            <SearchLocationControl
              position="topleft"
              onLocationFound={(location) => {
                // Verifica se é MultiPolygon para adicionar cada polígono separadamente
                if (
                  location.geojson &&
                  location.geojson.type === 'MultiPolygon'
                ) {
                  // Itera sobre cada polígono do MultiPolygon
                  const multiPolygonCoords = location.geojson
                    .coordinates as any;
                  multiPolygonCoords.forEach(
                    (polygonCoords: any, index: number) => {
                      dispatch({
                        type: 'addElemento',
                        textoElemento: location.display_name,
                        nomeElemento:
                          (location as any).name ?? location.display_name,
                        posicao: polygonCoords as any,
                        tipo: 'Polygon',
                        valor: {
                          ...location,
                          properties: {
                            mode: 'polygon',
                            name: `${
                              location.display_name.split(',')[0]
                            } - Parte ${index + 1}`,
                          },
                        },
                      });
                    }
                  );
                } else if (location.geojson) {
                  if (location.geojson.type === 'Point') {
                    location.geojson.type = 'Marker';
                    location.geojson.coordinates = [
                      (location.geojson.coordinates as any)[1],
                      (location.geojson.coordinates as any)[0],
                    ];
                  }

                  // Para outros tipos (Polygon, Point, LineString), adiciona normalmente
                  dispatch({
                    type: 'addElemento',
                    posicao: location.geojson.coordinates as any,
                    tipo: location.geojson.type,
                    textoElemento: location.display_name,
                    nomeElemento:
                      (location as any).name ?? location.display_name,
                    valor: {
                      ...location,
                      properties: { mode: location.geojson.type.toLowerCase() },
                    },
                  });
                }
                console.log('Localização encontrada:', location);
              }}
            />
          )}
          <CustomControlLeaflet
            classCustom={'leaflet-control custom-control-undo'}
          >
            <UndoControl />
          </CustomControlLeaflet>
          <CustomControlLeaflet
            position={POSITION_CLASSES_CUSTOM_CONTROL.topright}
          >
            <Fab
              color="primary"
              onClick={() => dispatch({ type: 'slideToogle' })}
              sx={{ zIndex: 100000 }}
              id="botaoTR"
            >
              <PlaylistPlay
                sx={{
                  transform: !mapaContext.slidePropriedade ? 'scaleX(-1)' : '',
                }}
              />
            </Fab>
          </CustomControlLeaflet>
          <CustomControlLeaflet
            position={POSITION_CLASSES_CUSTOM_CONTROL.bottomright}
          >
            <Fab
              color="primary"
              onClick={() =>
                dispatch({
                  type: 'slideToogle',
                  nomePropriedade: 'slideLinhaTempo',
                  valorPropriedade: !mapaContext.slideLinhaTempo,
                })
              }
              sx={{ zIndex: 100000 }}
            >
              <KeyboardDoubleArrowUp
                sx={{
                  transform: !mapaContext.slideLinhaTempo ? '' : 'scaleY(-1)',
                }}
              />
            </Fab>
          </CustomControlLeaflet>
          {/* <AddElementoInteracao /> */}
          {!mapaContext.slideLinhaTempo && (
            <CustomControlLeaflet
              position={POSITION_CLASSES_CUSTOM_CONTROL.bottomleft}
              classCustom={
                'leaflet-control leaflet-bar leaflet-speeddial leaflet-speeddial-full-width'
              }
            >
              <SliderLinhaTempo />
            </CustomControlLeaflet>
          )}
        </MapContainer>
      </div>
    </Grid2>
  );
}
