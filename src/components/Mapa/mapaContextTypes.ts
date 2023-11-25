import { elementoProto } from "@/main/constants/elementos";
import { LatLng, LatLngBoundsExpression, MapOptions, Map } from "leaflet";
import { NIL } from "uuid";
import { DateType, TimelineOptions } from "vis-timeline";
import { FormikProps } from "formik";
// import { GeoJSONStoreFeatures } from "terra-draw";

export type tipoGenericoElementoTimeline = periodoInicioFim & {
  id: NIL;
  nome: string;
  type:
    | "Point"
    | "MultiPoint"
    | "LineString"
    | "MultiLineString"
    | "Polygon"
    | "MultiPolygon"
    | "GeometryCollection"
    | "Feature"
    | "FeatureCollection";
  visTimelineObject?: { type: "box" | "background" };
  dataRef?: string;
  group?: NIL;
  style?: string;
  collapse?: boolean;
  collapseTimeline?: boolean;
  draggable?: boolean;
  order?: any;
};

export type elementoPadrao = tipoGenericoElementoTimeline & {
  geometry?: {
    type: string;
    coordinates: [number, number] | [number, number][] | [number, number][][];
  };
  properties?: { createdAt: number; updatedAt: number };
  texto?: string;
  color?: string;
  opacity?: number;
  alteracoes?: alteracaoElemento[];
  eventTimeout?: any;
};
type periodoInicioFim = {
  cenaFim: DateType;
  cenaInicio: DateType;
};
export type alteracaoElemento = tipoGenericoElementoTimeline & {
  nome: string;
  tipo: any;
  valor: any;
};

export type elementoComBounds = {
  bounds: LatLngBoundsExpression;
  urlImagem?: string;
  positionTL?: [number, number];
  positionBL?: [number, number];
  positionTR?: [number, number];
} & elementoPadrao;
export type mapaContextSchema = periodoInicioFim &
  telaMapa & {
    elementoInteracao: elementoProto;
    elementoFoco?: tipoElemento;
    elementosFoco?: { id: NIL }[];
    slidePropriedade: boolean;
    modoVisao?: string;
    conteudo: conteudoType & {
      Marker?: arrayPadraoType;
      Point?: arrayPadraoType;
      LineString?: arrayPadraoType;
      Polygon?: arrayPadraoType;
      Circle?: arrayPadraoType;
      Rectangle?: arrayRectangleType;
      ImageOverlay?: arrayRectangleType;
      cenas: (elementoPadrao & telaMapa & { exibirLimite?: boolean })[];
    };
    fit?: boolean;
    tempo: DateType;
    mapOptions: MapOptions;
    timelineOptions: TimelineOptions;
    reloadTimelineOptions?: boolean;
    playStatus: number;
    caixaDialogo?: string;
  };
type telaMapa = {
  center?: LatLng;
  zoom?: number;
  bounds?: LatLngBoundsExpression;
  urlMapaProprio?: string;
};
type conteudoType = {
  [key: string]: arrayElemento;
};

export type arrayPadraoType = arrayElementoGenerico<elementoPadrao>;
export type arrayRectangleType = arrayElementoGenerico<elementoComBounds>;
type basePrototypeArray = { collapse?: boolean };
type arrayElementoGenerico<T> = basePrototypeArray & T[];
type arrayElemento = basePrototypeArray & tipoElemento[];
export type tipoElemento = elementoPadrao | elementoComBounds;

export type actionContextChange = {
  type: string;
  id?: NIL;
  group?: NIL;
  ids?: NIL[];
  arg?: elementoProto;
  elemento?: tipoElemento;
  elementos?: tipoElemento[];
  tipo?: string;
  valor?: any;
  posicao?: [number, number] | [number, number][] | [number, number][][];
  indiceElemento?: number;
  nomeElemento?: string;
  nomePropriedade?: string;
  valorPropriedade?: any;
  valorBooleano?: boolean;
  start?: DateType;
  end?: DateType;
  time?: DateType;
  formik?: FormikProps<any>;
  mapContext?: mapaContextSchema;
  map?: Map;
};