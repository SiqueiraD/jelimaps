import ImagemPresignada from '@/components/Atomic/ImagemPresignada';
import contextChangers from '@/components/Mapa/ContextChangers';
import { useMapaContext } from '@/components/Mapa/MapaContext';
import { tipoElemento } from '@/components/Mapa/mapaContextTypes';
import useWindowDimensions from '@/components/Studio/useWindowDimensions';
import {
  Card,
  CardActionArea,
  CardContent,
  Paper,
  Typography,
} from '@mui/material';
import Leaflet, { Map } from 'leaflet';
import React, { useState } from 'react';
import { isMobile } from '..';
import LegendaLateral from './lateral';
import LegendaMobile from './mobile';

const LegendaCardItem = ({
  elemento,
  larguraLegenda,
  map,
}: {
  elemento: tipoElemento;
  map: Map;
  larguraLegenda: number;
}) => {
  return (
    <Card sx={{}} key={elemento.id}>
      <CardActionArea
        onClick={() => {
          if (
            elemento.dataRef === 'Marker' &&
            (elemento.geometry.coordinates as [number, number])
          ) {
            map.flyTo(
              elemento.geometry.coordinates as [number, number],
              elemento.zoom
            );
          } else if (!elemento.center) {
            const bordas = contextChangers.bordasDoElemento(
              elemento,
              map,
              Leaflet,
              larguraLegenda
            );
            bordas && map.flyToBounds(bordas);
          } else {
            map.flyTo(elemento.center, elemento.zoom);
          }
        }}
      >
        {elemento.imagemURL && (
          <ImagemPresignada
            imagemURL={elemento.imagemURL}
            alt={`imagem do ${elemento.nome}`}
            width={larguraLegenda}
            height={Math.round(larguraLegenda * 0.6)}
            style={{ width: '100%', height: 'auto' }}
          />
        )}
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {elemento.nome}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {elemento.texto}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export const ConteudoLegenda = ({
  elementosVisiveis,
  larguraLegenda,
  map,
}: {
  elementosVisiveis: tipoElemento[];
  map: Map;
  larguraLegenda: number;
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        overflowWrap: 'anywhere',
        overflowY: 'scroll',
      }}
    >
      {elementosVisiveis &&
        elementosVisiveis.map((x) => (
          <LegendaCardItem
            key={x.id}
            elemento={x}
            larguraLegenda={larguraLegenda}
            map={map}
          />
        ))}
    </Paper>
  );
};

const Legenda = (props: {
  map: Map;
  larguraLegenda: number;
  setLarguraLegenda: React.Dispatch<React.SetStateAction<number>>;
  alturaLegenda: number;
  setAlturaLegenda: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const {
    map,
    setLarguraLegenda,
    larguraLegenda,
    alturaLegenda,
    setAlturaLegenda,
  } = props;
  const mapaContext = useMapaContext();
  const { height, width } = useWindowDimensions();
  const [elementosVisiveis, setElementosVisiveis] = React.useState(
    contextChangers.retornaListaElementosConteudoCenaAtual(mapaContext)
  );
  const [cenaAtual, setCenaAtual] = useState(null);

  React.useEffect(() => {
    const el = document.getElementById('seletorResize');
    if (el) el.parentElement.id = 'parentSeletorResize';
  }, []);

  const moverMapaParaCena = React.useCallback(
    (cena: tipoElemento) => {
      try {
        if (cena.center && map) {
          setCenaAtual((c) => {
            if (c?.center !== cena.center) {
              map.flyTo(cena.center, cena.zoom, {
                animate: true,
                duration: 1.5,
                easeLinearity: 1,
              });
            }
            return cena;
          });
        }
      } catch (error) {
        /* empty */
      }
    },
    [map]
  );

  React.useEffect(() => {
    const els = contextChangers.retornaListaElementosConteudoCenaAtual(
      mapaContext,
      mapaContext.tempo
    );
    if (!cenaAtual || (els?.length > 0 && cenaAtual.id !== els[0].id))
      moverMapaParaCena(els[0]);
    setElementosVisiveis(els);
  }, [cenaAtual, mapaContext, mapaContext.tempo, moverMapaParaCena]);

  return isMobile(height, width) ? (
    <LegendaMobile
      ConteudoLegenda={ConteudoLegenda}
      elementosVisiveis={elementosVisiveis}
      map={map}
      setAlturaLegenda={setAlturaLegenda}
      alturaLegenda={alturaLegenda}
    />
  ) : (
    <LegendaLateral
      ConteudoLegenda={ConteudoLegenda}
      elementosVisiveis={elementosVisiveis}
      map={map}
      setLarguraLegenda={setLarguraLegenda}
      larguraLegenda={larguraLegenda}
    />
  );
};

export default Legenda;
