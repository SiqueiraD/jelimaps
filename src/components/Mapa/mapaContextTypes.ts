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

export type elementoPadrao = tipoGenericoElementoTimeline &
  telaMapa & {
    geometry?: {
      type: string;
      coordinates: [number, number] | [number, number][] | [number, number][][];
    };
    properties?: { createdAt: number; updatedAt: number; selected?: boolean };
    texto?: string;
    imagemURL?: string;
    color?: string;
    opacity?: number;
    alteracoes?: alteracaoElemento[];
    zoom?: number;
    eventTimeout?: any;
  };
type periodoInicioFim = {
  cenaSelecionada?: NIL;
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

export const MODO_VISAO = {
  openstreetmap: "OpenStreetMap",
  mapaProprio: "Mapa Próprio",
};

export type mapaContextSchema = periodoInicioFim &
  telaMapa & {
    elementoInteracao: elementoProto;
    elementoFoco?: tipoElemento;
    elementosFoco?: { id: NIL }[];
    slidePropriedade: boolean;
    slideLinhaTempo: boolean;
    modoVisao?: "OpenStreetMap" | "Mapa Próprio";
    conteudo: conteudoType & {
      Marker?: arrayPadraoType;
      Point?: arrayPadraoType;
      LineString?: arrayPadraoType;
      Polygon?: arrayPadraoType;
      Circle?: arrayPadraoType;
      Rectangle?: arrayRectangleType;
      ImageOverlay?: arrayRectangleType;
      cenas: arrayPadraoType;
    };
    exibirLimiteCenas?: boolean;
    fit?: boolean;
    tempo: DateType;
    mapOptions: MapOptions;
    timelineOptions: TimelineOptions;
    reloadTimelineOptions?: boolean;
    playStatus: -1 | 0 | 1 | 2;
    // -1 := pausado
    // 0  := parado
    // 1  := reproduzindo
    // 2  := apresentando
    duracaoApresentacao?: number;
    simpleTimeline?: boolean;
    apenasApresentacao?: boolean;
    caixaDialogo?: string;
    larguraPropriedades?: number;
    tipoTempo?: "real" | "numerico"; // Define se o tempo será tratado como data real ou número inteiro
  };
type telaMapa = {
  center?: LatLng;
  zoom?: number;
  bounds?: LatLngBoundsExpression;
  urlMapaProprio?: string;
  tipoMapaComum?: tipoMapaComum;
};

export type tipoMapaComum = {
  nome: string;
  attribution: string;
  url: string;
  subdomains?: string | string[];
  maxZoom?: number;
  maxNativeZoom?: number;
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
  modoVisao?: "OpenStreetMap" | "Mapa Próprio";
  arg?: elementoProto;
  elemento?: tipoElemento;
  elementos?: tipoElemento[];
  tipo?: string;
  valor?: any;
  posicao?: [number, number] | [number, number][] | [number, number][][];
  indiceElemento?: number;
  nomeElemento?: string;
  textoElemento?: string;
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
