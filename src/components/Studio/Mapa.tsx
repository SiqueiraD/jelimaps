import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  ImageOverlay,
  useMap,
  Polyline,
  Polygon,
  Circle,
  Rectangle,
} from "react-leaflet";
import { LatLngBounds, LatLng } from "leaflet";
import { useEffect, useMemo, useState } from "react";
import React from "react";
import CustomControlLeaflet, {
  POSITION_CLASSES_CUSTOM_CONTROL,
} from "@/components/CustomControlLeaflet/CustomControlLeaflet";
import dynamic from "next/dynamic";
import {
  useMapaContext,
  useMapaDispatch,
} from "@/components/Mapa/context/MapaContext";
import { Grid } from "@mui/material";
import { elementos } from "@/main/constants/elementos";
import Elementos from "./Elementos";
import AddMarker from "@/components/Mapa/AddMarker";

export const MODO_VISAO = {
  openstreetmap: "OpenStreetMap",
  mapaProprio: "Mapa Próprio",
};

export default function Mapa() {
  const [isMounted, setIsMounted] = React.useState(false);
  const [map, setMap] = useState(null);
  const mapaContext = useMapaContext();
  const dispatch = useMapaDispatch();
  const position = useMemo(
    () =>
      mapaContext.modoVisao === MODO_VISAO.openstreetmap
        ? [-22.906659526195618, -43.1333403313017]
        : [0.5, 0.75],
    [mapaContext.modoVisao]
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const center = useMemo(
    () => new LatLng(position[0], position[1]),
    [position]
  );
  const zoom = mapaContext.modoVisao === MODO_VISAO.openstreetmap ? 15 : 9;
  useEffect(() => {
    if (map != null) map.setView(center, zoom);
  }, [mapaContext.modoVisao, map, center, zoom]);

  const bounds = new LatLngBounds([0, 0], [1, 1.5]);

  const cliqueElementoNoMapa = (elemento, ...nsei) => {
    console.log("evento cliqueElementoNoMapa", elemento);
  };

  useEffect(() => {
    console.log("conteudo do mapa", mapaContext.conteudo);
  }, [mapaContext.conteudo]);

  return (
    isMounted && (
      <Grid item xs>
        <div style={{ height: "580px", display: "grid" }}>
          <MapContainer center={center} zoom={zoom} ref={setMap} maxZoom={18}>
            {mapaContext.modoVisao === MODO_VISAO.openstreetmap && (
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            )}
            {mapaContext.modoVisao === MODO_VISAO.mapaProprio && (
              <ImageOverlay bounds={bounds} url="/new-map.jpg" />
            )}
            {mapaContext.conteudo &&
              mapaContext.conteudo.Marker &&
              mapaContext.conteudo.Marker.length > 0 &&
              mapaContext.conteudo.Marker.map((x, i) => {
                return x?.position ? (
                  <Marker
                    {...x}
                    key={`marker#${i}`}
                    eventHandlers={{
                      click: () =>
                        mapaContext.elementoAdd?.nome !==
                          elementos.Marker.nome &&
                        x.dataRef === mapaContext.elementoAdd?.nome
                          ? dispatch({
                              type: `add${x.dataRef}`,
                              elemento: mapaContext.elementoAdd.nome,
                              posicao: x.position,
                            })
                          : cliqueElementoNoMapa(x),
                    }}
                  >
                    {/* <Popup>
                      A pretty CSS3 popup. <br /> Easily customizable.
                    </Popup> */}
                  </Marker>
                ) : null;
              })}
            {mapaContext.conteudo &&
              mapaContext.conteudo.Polyline &&
              mapaContext.conteudo.Polyline.length > 0 &&
              mapaContext.conteudo.Polyline.map((x, i) => {
                return x?.positions ? (
                  <Polyline
                    {...x}
                    key={`polyline#${i}`}
                    eventHandlers={{
                      click: () => cliqueElementoNoMapa(x),
                    }}
                  ></Polyline>
                ) : null;
              })}
            {mapaContext.conteudo &&
              mapaContext.conteudo.Polygon &&
              mapaContext.conteudo.Polygon.length > 0 &&
              mapaContext.conteudo.Polygon.map((x, i) => {
                return x?.positions ? (
                  <Polygon
                    {...x}
                    key={`polygon#${i}`}
                    eventHandlers={{
                      click: () => cliqueElementoNoMapa(x),
                    }}
                  ></Polygon>
                ) : null;
              })}
            {mapaContext.conteudo &&
              mapaContext.conteudo.Circle &&
              mapaContext.conteudo.Circle.length > 0 &&
              mapaContext.conteudo.Circle.map((x, i) => {
                return x?.center ? (
                  <Circle
                    {...x}
                    key={`circle#${i}`}
                    eventHandlers={{
                      click: () => cliqueElementoNoMapa(x),
                    }}
                  >
                    {/* <Popup>
                      A pretty CSS3 popup. <br /> Easily customizable.
                    </Popup> */}
                  </Circle>
                ) : null;
              })}
            {mapaContext.conteudo &&
              mapaContext.conteudo.Rectangle &&
              mapaContext.conteudo.Rectangle.length > 0 &&
              mapaContext.conteudo.Rectangle.map((x, i) => {
                return x?.bounds ? (
                  <Rectangle
                    {...x}
                    key={`Rectangle#${i}`}
                    eventHandlers={{
                      click: () => cliqueElementoNoMapa(x),
                    }}
                  >
                    {/* <Popup>
                        A pretty CSS3 popup. <br /> Easily customizable.
                      </Popup> */}
                  </Rectangle>
                ) : null;
              })}
            <CustomControlLeaflet
              position={POSITION_CLASSES_CUSTOM_CONTROL.bottomright}
            >
              <Elementos />
            </CustomControlLeaflet>
            <AddMarker />
          </MapContainer>
        </div>
      </Grid>
    )
  );
}