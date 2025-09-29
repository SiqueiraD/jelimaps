import React, { useEffect, useRef, useState } from "react";
import Propriedades from "./Propriedades";
import LinhaTempo from "./LinhaTempo/Index";
import { Grid2 } from "@mui/material";
import Mapa from "./MapaAdapter";
import { Rnd } from "react-rnd";
import useWindowDimensions from "./useWindowDimensions";
import { ElementosLateral } from "./Elementos";
import L from "leaflet";
import { TerraDraw } from "terra-draw";
import { useMapaContext, useMapaDispatch } from "../Mapa/MapaContext";
import { tipoElemento } from "../Mapa/mapaContextTypes";
import MapaContextChanger from "../Mapa/ContextChangers";
import terraDrawSetup from "./terraDrawSetup";
import DraggerResize from "../DraggerResize";
import useBarraAlerta from "../BarraAlerta/useBarraAlerta";
import Tutoriais from "./Tutoriais";
import { useSession } from "next-auth/react";
import DefaultTemplate from "@/main/template/DefaultTemplate";
// import moment from "moment";

// Define a função para inserir um texto no clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Falha ao copiar texto: ", err);
  }
}

const Studio = () => {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const { height, width } = useWindowDimensions();
  const [rndRef, setRndRef] = useState<Rnd>();
  const [map, setMap] = useState<L.Map>();
  const conteudoElementosRef = useRef<tipoElemento[]>(null);
  const mapaContext = useMapaContext();
  const tempoAtualRef = useRef(null);
  const elementosSelecionadosRef = useRef(null);
  const [draw, setDraw] = useState<TerraDraw>(null);
  const [altura, setAltura] = useState(height * 0.25);
  const displaYNoneStyle = { display: "none" };
  const [larguraPropriedades, setLargurasPropriedades] = useState(
    mapaContext.larguraPropriedades ?? 250
  );
  const dispatch = useMapaDispatch();
  const barraAlerta = useBarraAlerta();

  const handleKeyDown = React.useCallback(
    (eventLeaflet) => {
      if (
        eventLeaflet.originalEvent.ctrlKey &&
        eventLeaflet.originalEvent.keyCode === 67
      ) {
        if (elementosSelecionadosRef.current?.length === 1) {
          const text = JSON.stringify(
            MapaContextChanger.retornaListaElementosConteudo(mapaContext).find(
              (x) => x.id === elementosSelecionadosRef.current[0]
            )
          );
          copyToClipboard(text);
        }
      }
      if (
        eventLeaflet.originalEvent.ctrlKey &&
        eventLeaflet.originalEvent.keyCode === 86
      ) {
        navigator.clipboard.readText().then((x) => {
          if (x) {
            try {
              const elementoAntigo = JSON.parse(x) as tipoElemento;
              if (!verificaTipo(elementoAntigo)) throw new Error("");
              dispatch({
                type: "addElementoCopiado",
                elemento: elementoAntigo,
              });
            } catch (error) {
              barraAlerta.showSnackBar({
                text: "Não é um elemento válido",
                color: "error",
              });
            }
          }
        });
      }
    },
    [barraAlerta, dispatch, mapaContext]
  );

  function verificaTipo(obj: any): obj is tipoElemento {
    return obj && typeof obj.id === "string" && typeof obj.dataRef === "string";
  }

  useEffect(() => {
    if (map) {
      map.addEventListener("keydown", handleKeyDown);
      return () => {
        map.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [handleKeyDown, map]);

  useEffect(() => {
    if (mapaContext.elementosFoco && mapaContext.elementosFoco.length > 0)
      elementosSelecionadosRef.current = mapaContext.elementosFoco.map(
        (x) => x.id
      );
    else if (mapaContext.elementoFoco)
      elementosSelecionadosRef.current = [mapaContext.elementoFoco.id];
    else elementosSelecionadosRef.current = null;
  }, [mapaContext.elementosFoco, mapaContext.elementoFoco]);

  const pegarConteudoElementos = () => conteudoElementosRef.current;

  useEffect(() => {
    if (map && !draw) {
      const _draw = terraDrawSetup(dispatch, map, pegarConteudoElementos);
      setDraw(_draw);
      map.on("click", () => {
        const modeDraw = (_draw as any)._mode;
        if (modeDraw?._state == "selecting")
          setTimeout(() => {
            const features = _draw.getSnapshot();
            _draw.clear();
            if (
              features.some((x) =>
                elementosSelecionadosRef.current.includes(x.id)
              )
            )
              _draw.addFeatures(
                features.filter((x) =>
                  elementosSelecionadosRef.current.includes(x.id)
                )
              );
            if (features?.length > 0 && features[0].id)
              setTimeout(() => {
                try {
                  _draw.selectFeature(features[0].id);
                } catch (error) {
                  console.log("deueurro", { error });
                }
              }, 250);
          }, 100);
      });
    }
  }, [dispatch, draw, map]);

  useEffect(() => {
    if (draw)
      if (!elementosSelecionadosRef.current) {
        (draw as any)._modes.select.deselect();
      } else {
        if (elementosSelecionadosRef.current.length == 1)
          (draw as any)._modes.select.selected =
            elementosSelecionadosRef.current;
      }
  }, [
    draw,
    mapaContext.conteudo,
    mapaContext.elementoFoco,
    mapaContext.elementosFoco,
  ]);

  if (loading)
    return (
      <DefaultTemplate>
        <h1>Aguarde...</h1>
      </DefaultTemplate>
    );
  if (!session)
    return (
      <DefaultTemplate>
        <h1>Faça login para continuar</h1>
      </DefaultTemplate>
    );

  return (
    <Grid2 container sx={{ height: "100%" }} id="studioMapa">
      {
        <>
          <Grid2 container size={12}>
            <ElementosLateral
              altura={mapaContext.slideLinhaTempo ? height - altura : height}
              draw={draw}
            />
            <Mapa
              altura={mapaContext.slideLinhaTempo ? height - altura : height}
              largura={
                (mapaContext?.slidePropriedade
                  ? width - larguraPropriedades
                  : width) - 65
              }
              setMapa={setMap}
              draw={draw}
              conteudoElementosRef={conteudoElementosRef}
            />
            {map && (
              <Propriedades
                altura={mapaContext.slideLinhaTempo ? height - altura : height}
                tempoAtualRef={tempoAtualRef}
                larguraPropriedades={larguraPropriedades}
                setLargurasPropriedades={setLargurasPropriedades}
                map={map}
              />
            )}
          </Grid2>
          {mapaContext.slideLinhaTempo && (
            <Rnd
              ref={(c) => {
                setRndRef(c);
              }}
              maxHeight={height * 0.9}
              minHeight={height * 0.05}
              resizeHandleStyles={{
                bottom: displaYNoneStyle,
                left: displaYNoneStyle,
                right: displaYNoneStyle,
                topLeft: displaYNoneStyle,
                topRight: displaYNoneStyle,
                bottomLeft: displaYNoneStyle,
                bottomRight: displaYNoneStyle,
                top: { height: 25 },
              }}
              size={{ height: altura, width: "100%" }}
              disableDragging
              position={{ y: height - altura, x: 0 }}
              resizeHandleComponent={{
                top: (
                  <DraggerResize
                    id={"parentSeletorResize"}
                    sx={{
                      borderStyle: "outset",
                      borderBottom: 2,
                      height: 20,
                      backgroundColor: "#e2e2e2",
                      marginTop: 0.6,
                    }}
                  ></DraggerResize>
                ),
              }}
              onResize={(e, dir, ref) => {
                if (rndRef && rndRef.updatePosition)
                  rndRef?.updatePosition({
                    x: 0,
                    y: height - ref.offsetHeight,
                  });
                setAltura(ref.offsetHeight);
              }}
            >
              <Grid2
                container
                size={12}
                mt={2.2}
                sx={{ height: "95%", maxHeight: altura }}
              >
                <LinhaTempo tempoAtualRef={tempoAtualRef} altura={altura} />
              </Grid2>
            </Rnd>
          )}
        </>
      }
      {map && <Tutoriais />}
    </Grid2>
  );
};

export default Studio;
