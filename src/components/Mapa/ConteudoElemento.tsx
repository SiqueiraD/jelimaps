import { useEffect } from "react";
import { elementoPadrao } from "./mapaContextTypes";
import Leaflet from "leaflet";
import { useMap } from "react-leaflet";
import { GeoJSONStoreFeatures, TerraDraw } from "terra-draw";
import { useMapaContext, useMapaDispatch } from "./MapaContext";
import MapaContextChanger from "./ContextChangers";
import { elementos } from "@/main/constants/elementos";
import { montarDispatchSelecionarElemento } from "./MapaUtils/selecionarElementoHelper";

const ConteudoElemento = (propsConteudoElemento: {
  elemento: elementoPadrao;
  draw?: TerraDraw;
}) => {
  const map = useMap();
  const mapaContext = useMapaContext();
  const dispatch = useMapaDispatch();

  const corItemSelecionadoFoco = (elemento) => {
    return MapaContextChanger.isElementoSelecionado(mapaContext, elemento.id)
      ? "#000000"
      : elemento.color ?? "#0d6efd";
  };

  const functionRemoveDraw = () => {
    if (
      MapaContextChanger.retornaListaElementosConteudo(mapaContext).some(
        (elemento) => elemento.id === propsConteudoElemento.elemento.id
      )
    ) {
      if (
        (propsConteudoElemento.draw as any)._store &&
        (propsConteudoElemento.draw as any)._store.store[
          propsConteudoElemento.elemento.id.toString()
        ]
      )
        propsConteudoElemento.draw.removeFeatures([
          propsConteudoElemento.elemento.id.toString(),
        ]);
      return true;
    }
    return false;
  };

  function selecionarElementoPeloDraw() {
    if (
      !(propsConteudoElemento.draw as any)._mode.selected.includes(
        propsConteudoElemento.elemento.id
      )
    ) {
      if (
        (propsConteudoElemento.draw as any).hasFeature([
          propsConteudoElemento.elemento.id.toString(),
        ])
      )
        propsConteudoElemento.draw.selectFeature(
          propsConteudoElemento.elemento.id
        );
      else {
        (propsConteudoElemento.draw as any).addFeatures([
          {
            ...propsConteudoElemento.elemento,
            properties: {
              ...propsConteudoElemento.elemento.properties,
              selected: true,
            },
          },
        ]);
      }
    }
  }

  useEffect(() => {
    const elementoGeoJSON = new Leaflet.GeoJSON(propsConteudoElemento.elemento);

    function insereElementoSemDraw() {
      if (propsConteudoElemento.draw)
        elementoGeoJSON.on("click", () => {
          // Adiciona bounds ao elemento para facilitar o cálculo no helper
          const elementoComBounds = {
            ...propsConteudoElemento.elemento,
            bounds: elementoGeoJSON.getBounds()
          };
          dispatch(montarDispatchSelecionarElemento(elementoComBounds, mapaContext));
        });
      elementoGeoJSON.setStyle({
        color: corItemSelecionadoFoco(propsConteudoElemento.elemento),
      });
      map.addLayer(elementoGeoJSON);
    }

    if (map)
      if (propsConteudoElemento.draw) {
        if (
          propsConteudoElemento.elemento.draggable &&
          MapaContextChanger.isElementoSelecionado(
            mapaContext,
            propsConteudoElemento.elemento.id
          )
        ) {
          const elementoConteudo = {
            ...propsConteudoElemento.elemento,
            properties: {
              ...propsConteudoElemento.elemento.properties,
              selected: true,
            },
          } as GeoJSONStoreFeatures;
          try {
            propsConteudoElemento.draw?.addFeatures([elementoConteudo]);

            if ((propsConteudoElemento.draw as any)._mode.selected) {
              selecionarElementoPeloDraw();
            } else {
              (propsConteudoElemento.draw as any).setMode(elementos.Hand.nome);
              dispatch({
                type: "selecionarElementoInteracao",
                arg: elementos.Hand,
              });
              selecionarElementoPeloDraw();
            }
          } catch (error) {
            dispatch({
              type: "removeElements",
              id: propsConteudoElemento.elemento.id,
            });
          }
        } else {
          insereElementoSemDraw();
        }
        return () => {
          try {
            if (
              propsConteudoElemento.elemento.draggable &&
              MapaContextChanger.isElementoSelecionado(
                mapaContext,
                propsConteudoElemento.elemento.id
              )
            )
              functionRemoveDraw();
            else {
              map.removeLayer(elementoGeoJSON);
            }
          } catch (error) {
            if (!functionRemoveDraw()) {
              map.removeLayer(elementoGeoJSON);
            }
          }
        };
      } else {
        insereElementoSemDraw();

        return () => {
          map.removeLayer(elementoGeoJSON);
        };
      }
  });
  return null;
};

export default ConteudoElemento;
