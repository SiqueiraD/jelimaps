import { elementoProto, elementos } from "@/main/constants/elementos";
import {
  actionContextChange,
  mapaContextSchema,
  tipoElemento,
} from "./../mapaContextTypes";
import auxiliadorRetornoContext from "./auxiliadorRetornoContext";
import moment from "moment";

const changeElementoInteracao = (
  oldMapaContext: mapaContextSchema,
  elemento: elementoProto
): mapaContextSchema => {
  return {
    ...oldMapaContext,
    elementoInteracao: {
      ...elemento,
      iconComponent: null,
    },
    elementosFoco: null,
    elementoFoco: null,
  };
};

const changeElementoFoco = (
  oldMapaContext: mapaContextSchema,
  actionContextChange: actionContextChange
): mapaContextSchema => {
  const newElemntoFoco =
    actionContextChange.elemento ??
    (actionContextChange.id
      ? auxiliadorRetornoContext
          .retornaListaElementosConteudo(oldMapaContext)
          .find((x) => x.id === actionContextChange.id)
      : null);
  return {
    ...oldMapaContext,
    elementosFoco: null,
    elementoFoco: newElemntoFoco,
    elementoInteracao: elementos.Hand,
    bounds: actionContextChange.mapContext?.bounds ?? oldMapaContext.bounds,
    center: actionContextChange.mapContext?.center ?? oldMapaContext.center,
    zoom: actionContextChange.mapContext?.zoom ?? oldMapaContext.zoom,
    tempo: actionContextChange.time ?? oldMapaContext.tempo,
  };
};

const changeElementosFoco = (
  oldMapaContext: mapaContextSchema,
  actionContextChange: actionContextChange
): mapaContextSchema => {
  const elementoNaoSelecionado = !oldMapaContext.elementosFoco?.some(
    (x) => x.id === actionContextChange.elemento.id
  );
  const newElementsFoco = oldMapaContext.elementosFoco
    ? elementoNaoSelecionado
      ? // Caso elemento clicado não esteja focado deve adiciona-lo
        [...oldMapaContext.elementosFoco, actionContextChange.elemento]
      : // Caso elemento clicado esteja focado deve remove-lo
        oldMapaContext.elementosFoco.filter(
          (x) => x.id !== actionContextChange.elemento.id
        )
    : // Caso exista apenas um elemento focado, adiciona na lista os dois (antigo e novo)
      [oldMapaContext.elementoFoco, actionContextChange.elemento];
  return {
    ...oldMapaContext,
    elementoFoco: actionContextChange.elemento,
    elementosFoco: newElementsFoco,
    elementoInteracao: elementos.Hand,
  };
};

const changeTodosElementosFocoPorIds = (
  oldMapaContext: mapaContextSchema,
  actionContextChange: actionContextChange
): mapaContextSchema => {
  return changeTodosElementosFoco(oldMapaContext, {
    ...actionContextChange,
    elementos: actionContextChange.ids.map((x) => {
      return { id: x } as tipoElemento;
    }),
  });
};

const changeTodosElementosFoco = (
  oldMapaContext: mapaContextSchema,
  actionContextChange: actionContextChange
): mapaContextSchema => {
  return {
    ...oldMapaContext,
    elementoFoco: null,
    elementosFoco: actionContextChange.elementos,
  };
};

const changePropriedadeMapa = (
  oldMapaContext: mapaContextSchema,
  actionContextChange: actionContextChange
): mapaContextSchema => {
  if (actionContextChange.nomePropriedade.includes("cena")) {
    if (!actionContextChange.formik.isValid) return oldMapaContext;
    if (actionContextChange.nomePropriedade === "cenaInicio")
      oldMapaContext.conteudo.cenas[0].cenaInicio =
        actionContextChange.valorPropriedade;
    if (actionContextChange.nomePropriedade === "cenaFim")
      oldMapaContext.conteudo.cenas[
        oldMapaContext.conteudo.cenas.length - 1
      ].cenaFim = actionContextChange.valorPropriedade;
  }
  return {
    ...oldMapaContext,
    [actionContextChange.nomePropriedade]: actionContextChange.valorPropriedade,
  };
};

const selecionaModoVisao = (
  oldMapaContext: mapaContextSchema,
  actionContextChange: actionContextChange
): mapaContextSchema => {
  return {
    ...oldMapaContext,
    modoVisao: actionContextChange.modoVisao,
    urlMapaProprio: actionContextChange.valor ?? "",
  };
};

const changeCoordenadasMapa = (
  oldMapaContext: mapaContextSchema,
  actionContextChange: actionContextChange
): mapaContextSchema => {
  return {
    ...oldMapaContext,
    center: actionContextChange.map?.getCenter(),
    zoom: actionContextChange.map?.getZoom(),
    bounds: actionContextChange.map?.getBounds(),
  };
};

const changeCompletoMapaContext = (
  oldMapaContext: mapaContextSchema,
  actionContextChange: actionContextChange
): mapaContextSchema => {
  return {
    ...(actionContextChange.mapContext ?? oldMapaContext),
  };
};

const changeTempoAtual = (
  oldMapaContext: mapaContextSchema,
  actionContextChange: actionContextChange
): mapaContextSchema => {
  const novoTempo = actionContextChange.time ?? oldMapaContext.tempo;
  const cenaNova = oldMapaContext.conteudo.cenas.find(
    (x) =>
      moment(x.cenaInicio) <= moment(novoTempo) &&
      moment(x.cenaFim) >= moment(novoTempo) &&
      (moment(x.cenaInicio) > moment(oldMapaContext.tempo) ||
        moment(x.cenaFim) < moment(oldMapaContext.tempo))
  );
  if (cenaNova) {
    oldMapaContext.center = cenaNova.center;
    oldMapaContext.zoom = cenaNova.zoom;
    oldMapaContext.bounds = cenaNova.bounds;
  }
  return {
    ...oldMapaContext,
    tempo: moment(novoTempo).format("yyyy-MM-DDTHH:mm:ss"),
  };
};

const changeTempoInicioTempoFim = (
  oldMapaContext: mapaContextSchema,
  actionContextChange: actionContextChange
): mapaContextSchema => {
  return {
    ...oldMapaContext,
    cenaInicio: actionContextChange.start,
    cenaFim: actionContextChange.end,
  };
};

const focoInteracaoContextChanger = {
  changeTempoAtual,
  selecionaModoVisao,
  changeElementoFoco,
  changeElementosFoco,
  changePropriedadeMapa,
  changeCoordenadasMapa,
  changeElementoInteracao,
  changeTodosElementosFoco,
  changeCompletoMapaContext,
  changeTempoInicioTempoFim,
  changeTodosElementosFocoPorIds,
};
export default focoInteracaoContextChanger;
