import { Marker, Rectangle, Popup } from "react-leaflet";
import {
  LatLngBounds,
  divIcon,
} from "leaflet";
import React from "react";
import { useMapaContext, useMapaDispatch } from "@/components/Mapa/MapaContext";
import { Button, ButtonGroup } from "@mui/material";
// import Elementos from "./Elementos";
import { LocationOn } from "@mui/icons-material";
import ReactDOMServer from "react-dom/server";
import useCaixaDialogo from "../CaixaDialogo/useCaixaDialogo";
import ImageOverlayRotated from "../Mapa/ImageOverlayRotated";
import { TerraDraw } from "terra-draw";
import MapaContextChanger from "../Mapa/ContextChangers";
import ConteudoElemento from "../Mapa/ConteudoElemento";
import { montarDispatchSelecionarElemento } from "./MapaUtils/selecionarElementoHelper";

const ConteudoMapa = (propsConteudoMapa: {
  draw?: TerraDraw;
  isApresentacao?: boolean;
}) => {
  const mapaContext = useMapaContext();
  const dispatch = useMapaDispatch();
  const { openModalConfirm } = useCaixaDialogo();

  const corItemSelecionadoFoco = (elemento) => {
    return MapaContextChanger.isElementoSelecionado(mapaContext, elemento.id)
      ? "#000000"
      : elemento.color ?? "#0d6efd";
  };
  const cliqueElementoNoMapa = (elemento, evento) => {
    if (evento.originalEvent.shiftKey || evento.originalEvent.ctrlKey)
      dispatch({ type: "adicionarElementoFoco", elemento: elemento });
    else
      dispatch(montarDispatchSelecionarElemento(elemento, mapaContext));
  };

  return (
    <>
      {mapaContext.conteudo &&
        mapaContext.conteudo.Marker &&
        mapaContext.conteudo.Marker.length > 0 &&
        mapaContext.conteudo.Marker.filter(
          (marker) =>
            new Date(marker.cenaInicio) <= new Date(mapaContext.tempo) &&
            new Date(marker.cenaFim) >= new Date(mapaContext.tempo)
        ).map((marker, index, origin) => {
          return (
            marker.geometry?.coordinates && (
              <Marker
                {...marker}
                position={marker.geometry.coordinates as [number, number]}
                draggable={
                  marker.draggable &&
                  MapaContextChanger.isElementoSelecionado(
                    mapaContext,
                    marker.id
                  ) &&
                  !propsConteudoMapa.isApresentacao
                }
                icon={divIcon({
                  className: "icon-marker",
                  html: ReactDOMServer.renderToString(
                    <LocationOn
                      id={marker.id}
                      style={{
                        color: corItemSelecionadoFoco(marker),
                        position: "absolute",
                        top: "-150%",
                        left: "-67%",
                      }}
                    />
                  ),
                })}
                key={`marker#${index}`}
                eventHandlers={{
                  click: (e) =>
                    !propsConteudoMapa.isApresentacao &&
                    cliqueElementoNoMapa(origin[index], e),
                  moveend: (e) => {
                    dispatch({
                      type: "editarPropriedade",
                      tipo: marker.dataRef,
                      id: marker.id,
                      nomePropriedade: "geometry",
                      valorPropriedade: {
                        ...marker.geometry,
                        coordinates: [
                          e.sourceTarget._latlng.lat,
                          e.sourceTarget._latlng.lng,
                        ],
                      },
                    });
                  },
                }}
              >
                {MapaContextChanger.isElementoSelecionado(
                  mapaContext,
                  marker.id
                ) &&
                  !propsConteudoMapa.isApresentacao && (
                    <Popup>
                      <ButtonGroup
                        variant="text"
                        aria-label="text button group"
                      >
                        <Button
                          onClick={() => {
                            openModalConfirm({
                              title: "Deletar item",
                              message: "Você tem certeza disso?",
                              onConfirm: () => {
                                dispatch({
                                  type: "removeElements",
                                });
                              },
                            });
                          }}
                        >
                          Excluir
                        </Button>
                      </ButtonGroup>
                    </Popup>
                  )}
              </Marker>
            )
          );
        })}
      {mapaContext.conteudo &&
        mapaContext.conteudo.Point &&
        mapaContext.conteudo.Point.length > 0 &&
        mapaContext.conteudo.Point.filter(
          (point) =>
            new Date(point.cenaInicio) <= new Date(mapaContext.tempo) &&
            new Date(point.cenaFim) >= new Date(mapaContext.tempo)
        ).map((point, index) => {
          return (
            <ConteudoElemento
              draw={propsConteudoMapa.draw}
              elemento={point}
              key={`Pointer#${index}`}
            />
          );
        })}
      {mapaContext.conteudo &&
        mapaContext.conteudo.Circle &&
        mapaContext.conteudo.Circle.length > 0 &&
        mapaContext.conteudo.Circle.filter(
          (circle) =>
            new Date(circle.cenaInicio) <= new Date(mapaContext.tempo) &&
            new Date(circle.cenaFim) >= new Date(mapaContext.tempo)
        ).map((circle, index) => {
          return (
            <ConteudoElemento
              draw={propsConteudoMapa.draw}
              elemento={circle}
              key={`Circle#${index}`}
            />
          );
        })}
      {mapaContext.conteudo &&
        mapaContext.conteudo.LineString &&
        mapaContext.conteudo.LineString.length > 0 &&
        mapaContext.conteudo.LineString.filter(
          (lineString) =>
            new Date(lineString.cenaInicio) <= new Date(mapaContext.tempo) &&
            new Date(lineString.cenaFim) >= new Date(mapaContext.tempo)
        ).map((lineString, index) => {
          return (
            <ConteudoElemento
              draw={propsConteudoMapa.draw}
              elemento={lineString}
              key={`LineString#${index}`}
            />
          );
        })}

      {mapaContext.conteudo &&
        mapaContext.conteudo.Polygon &&
        mapaContext.conteudo.Polygon.length > 0 &&
        mapaContext.conteudo.Polygon.filter(
          (polygon) =>
            new Date(polygon.cenaInicio) <= new Date(mapaContext.tempo) &&
            new Date(polygon.cenaFim) >= new Date(mapaContext.tempo)
        ).map((polygon, index) => {
          return (
            <ConteudoElemento
              draw={propsConteudoMapa.draw}
              elemento={polygon}
              key={`polygon#${index}`}
            />
          );
        })}
      {mapaContext.conteudo &&
        mapaContext.conteudo.ImageOverlay &&
        mapaContext.conteudo.ImageOverlay.length > 0 &&
        mapaContext.conteudo.ImageOverlay.filter(
          (image) =>
            new Date(image.cenaInicio) <= new Date(mapaContext.tempo) &&
            new Date(image.cenaFim) >= new Date(mapaContext.tempo)
        ).map((image, index) => {
          return (
            <ImageOverlayRotated
              key={`ImageOverlay#${index}`}
              x={image}
              cliqueElementoNoMapa={cliqueElementoNoMapa}
              isApresentacao={propsConteudoMapa.isApresentacao}
            />
          );
        })}

      {!propsConteudoMapa.isApresentacao &&
        mapaContext.exibirLimiteCenas &&
        mapaContext.conteudo &&
        mapaContext.conteudo.cenas &&
        mapaContext.conteudo.cenas.length > 0 &&
        mapaContext.conteudo.cenas
          // .filter(
          //   (cena) =>
          //     new Date(cena.cenaInicio) <= new Date(mapaContext.tempo) &&
          //     new Date(cena.cenaFim) >= new Date(mapaContext.tempo)
          // )
          .map((cena, index) => {
            return cena?.bounds ? (
              <Rectangle
                {...cena}
                fill={false}
                bounds={
                  new LatLngBounds(
                    (cena.bounds as any)._southWest,
                    (cena.bounds as any)._northEast
                  )
                }
                className="background-scene"
                key={`cena#${index}`}
              >
                {/* <Popup>
                  A pretty CSS3 popup. <br /> Easily customizable.
                </Popup> */}
              </Rectangle>
            ) : null;
          })}
    </>
  );
};

export default ConteudoMapa;
