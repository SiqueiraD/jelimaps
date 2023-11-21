import { Dispatch, createContext, useContext, useReducer } from "react";
import React from "react";
import { mapaReducer } from "./MapaDispatchEvents";
import { elementos } from "@/main/constants/elementos";
import { mapaContextSchema, actionContextChange } from "./mapaContextTypes";
import { v4 } from "uuid";
import moment from "moment";
import useUndo from "use-undo";

const initialMapaContexto: () => mapaContextSchema = () => {
  const mapaLocal =
    typeof window !== "undefined"
      ? localStorage?.getItem("mapaContext")
      : "false";
  return mapaLocal && JSON.parse(mapaLocal)
    ? JSON.parse(mapaLocal)
    : ({
        elementoInteracao: elementos.Hand,
        slidePropriedade: false,
        cenaInicio: moment().format("yyyy-MM-DDTHH:mm:ss"),
        cenaFim: moment().add(1, "minutes").format("yyyy-MM-DDTHH:mm:ss"),
        tempo: moment().add(2, "seconds").format("yyyy-MM-DDTHH:mm:ss"),
        mapOptions: {
          center: [0, 0],
        },
        playStatus: -1,
        conteudo: {
          cenas: [
            {
              cenaInicio: moment().format("yyyy-MM-DDTHH:mm:ss"),
              cenaFim: moment().add(1, "minute").format("yyyy-MM-DDTHH:mm:ss"),
              id: v4(),
              nome: "Primeira cena",
              dataRef: "cenas",
              visTimelineObject: {
                type: "background",
              },
              type: "FeatureCollection",
              color: "#df000024",
            },
          ],
        },
        timelineOptions: {
          editable: { remove: true, updateTime: true },
          // zoomKey: "ctrlKey",
          preferZoom: true,
          start: moment().format("yyyy-MM-DDTHH:mm:ss"),
          end: moment().add(10, "minutes").format("yyyy-MM-DDTHH:mm:ss"),
          autoResize: false,
          selectable: true,
          multiselect: true,
          orientation: { axis: "top" },
          longSelectPressTime: 777,
          snap: (date: Date) => {
            return date;
          },
          rollingMode: { offset: 0, follow: false },
          showCurrentTime: false,
          // groupEditable: { order: true },
          groupHeightMode: "fitItems",
          verticalScroll: true,
          margin: { item: { vertical: 20 } },
          zoomable: true,
          moveable: true,
          order: (a, b) => b.order - a.order,
          groupOrder: (a, b) => b.order - a.order,
          locale: "pt_BR",
        },
      } as mapaContextSchema);
};

const MapaContext = createContext<mapaContextSchema>(initialMapaContexto());
export function useMapaContext() {
  return { ...useContext(MapaContext) };
}

const MapaDispatchContext = createContext<Dispatch<actionContextChange>>(
  () => {}
);
export function useMapaDispatch() {
  return useContext(MapaDispatchContext);
}

const MapaUndoContext = createContext<{
  // set: (newPresent: mapaContextSchema, checkpoint?: boolean) => void;
  reset: (newContext?: mapaContextSchema) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}>(null);
export function useMapaUndo() {
  return useContext(MapaUndoContext);
}

export function MapaProvider({ children }) {
  const [context, { set, reset, undo, redo, canUndo, canRedo }] = useUndo(
    initialMapaContexto()
  );
  const [, dispatch] = useReducer(
    (old: mapaContextSchema, e: actionContextChange) => {
      console.log("dispatch original", e);
      const newContext =
        e.type !== "reset"
          ? mapaReducer(
              old,
              e.type === "use-undo" ? { ...e, type: "trocaMapaContext" } : e
            )
          : e.mapContext ?? initialMapaContexto();
      if (e.type !== "use-undo") set(newContext, false);
      localStorage.setItem("mapaContext", JSON.stringify(newContext));
      return newContext;
    },
    initialMapaContexto()
  );
  // const mapaContexto = useMapaContext();
  return (
    <MapaUndoContext.Provider
      value={{
        reset: (newContext?: mapaContextSchema) => {
          localStorage.clear();
          dispatch({
            type: "reset",
            mapContext: newContext ?? initialMapaContexto(),
          });
          reset(newContext ?? initialMapaContexto());
        },
        undo: () => {
          dispatch({
            type: "use-undo",
            mapContext: context.past[context.past.length - 1],
          });
          undo();
        },
        redo: () => {
          dispatch({
            type: "use-undo",
            mapContext: context.future[context.future.length - 1],
          });
          redo();
        },
        canUndo,
        canRedo,
      }}
    >
      <MapaContext.Provider value={context.present}>
        <MapaDispatchContext.Provider value={dispatch}>
          {children}
        </MapaDispatchContext.Provider>
      </MapaContext.Provider>
    </MapaUndoContext.Provider>
  );
}
