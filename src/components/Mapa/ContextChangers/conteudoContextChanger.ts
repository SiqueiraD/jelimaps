import { elementos } from "@/main/constants/elementos";
import {
  actionContextChange,
  elementoPadrao,
  mapaContextSchema,
  alteracaoElemento,
  tipoElemento,
  arrayRectangleType,
} from "../mapaContextTypes";
import { v4, NIL } from "uuid";
import moment from "moment";
import auxiliadorRetornoContext from "./auxiliadorRetornoContext";

const padraoElementoNovoAdicionado = (oldMapaContext: mapaContextSchema) => {
  return {
    cenaInicio: moment(oldMapaContext.conteudo.cenas[0].cenaInicio)
      .add(1, "seconds")
      .format("yyyy-MM-DDTHH:mm:ss"),
    cenaFim: moment(
      oldMapaContext.conteudo.cenas[oldMapaContext.conteudo.cenas.length - 1]
        .cenaFim
    )
      .add(-1, "seconds")
      .format("yyyy-MM-DDTHH:mm:ss"),
    order:
      auxiliadorRetornoContext
        .retornaListaElementosConteudo(oldMapaContext)
        .filter((x) => !(x.visTimelineObject?.type === "background")).length ??
      0,
    draggable: true,
  };
};

const movendoImagem = (
  oldMapaContext: mapaContextSchema,
  actionContextChange: actionContextChange
): mapaContextSchema => {
  const elemento = oldMapaContext.conteudo.ImageOverlay.find(
    (x) => x.id === actionContextChange.id
  );
  elemento.positionTL = actionContextChange.valor.positionTL;
  elemento.positionTR = actionContextChange.valor.positionTR;
  elemento.positionBL = actionContextChange.valor.positionBL;
  return {
    ...oldMapaContext,
  };
};

const addAlteracaoElemento = (
  oldMapaContext: mapaContextSchema,
  actionContextChange: actionContextChange
): mapaContextSchema => {
  const elemento = auxiliadorRetornoContext
    .retornaListaElementosConteudo(oldMapaContext)
    .find((x) => x.id === actionContextChange.group);

  if (
    elemento &&
    new Date(elemento.cenaInicio) < new Date(actionContextChange.start) &&
    new Date(elemento.cenaFim) > new Date(actionContextChange.start)
  ) {
    const conten = {
      id: v4(),
      cenaInicio: moment(actionContextChange.start).format(
        "yyyy-MM-DDTHH:mm:ss"
      ),
      cenaFim: actionContextChange.start,
      nome: `Alteração #${(elemento.alteracoes?.length ?? 0) + 1} do ${
        elemento.nome
      }`,
      valor: 0,
      tipo: "",
      visTimelineObject: { type: "box" },
    } as alteracaoElemento;
    if (
      oldMapaContext.conteudo[elemento.dataRef].find(
        (x) => x.id === elemento.id
      ).alteracoes
    )
      oldMapaContext.conteudo[elemento.dataRef]
        .find((x) => x.id === elemento.id)
        .alteracoes.push(conten);
    else
      oldMapaContext.conteudo[elemento.dataRef].find(
        (x) => x.id === elemento.id
      ).alteracoes = [conten];
  }
  return {
    ...oldMapaContext,
  };
};

const editarPropriedadeElemento = (
  oldMapaContext: mapaContextSchema,
  actionContextChange: actionContextChange
): mapaContextSchema => {
  const {
    tipo: tipoElemento,
    id,
    nomePropriedade,
    valorPropriedade: novoValor,
  } = actionContextChange;
  const newListaConteudoTipo = oldMapaContext.conteudo[tipoElemento].map(
    (elemento) =>
      elemento.id === id
        ? { ...elemento, [nomePropriedade]: novoValor }
        : elemento
  );
  return {
    ...oldMapaContext,
    conteudo: {
      ...oldMapaContext.conteudo,
      [tipoElemento]: [...newListaConteudoTipo],
    },
  };
};

const alteraCoordinatesElemento = (
  oldMapaContext: mapaContextSchema,
  actionContextChange: actionContextChange
): mapaContextSchema => {
  const conteudo =
    auxiliadorRetornoContext.retornaListaElementosConteudo(oldMapaContext);
  const newElement = conteudo.find((x) => x.id === actionContextChange.id);
  if (!newElement) return { ...oldMapaContext };
  // oldMapaContext.conteudo[ds.dataRef][
  //   oldMapaContext.conteudo[ds.dataRef].findIndex((x) => x.id === ds.id)
  // ].geometry.coordinates = actionContextChange.posicao;
  const newListaConteudoTipo = oldMapaContext.conteudo[newElement.dataRef].map(
    (elemento) =>
      elemento.id === actionContextChange.id
        ? {
            ...elemento,
            geometry: {
              ...elemento.geometry,
              coordinates: actionContextChange.posicao,
            },
          }
        : elemento
  );
  return {
    ...oldMapaContext,
    conteudo: {
      ...oldMapaContext.conteudo,
      [newElement.dataRef]: [...newListaConteudoTipo],
    },
  };
};

const addElementoPadrao = (
  oldMapaContext: mapaContextSchema,
  actionContext: actionContextChange
): mapaContextSchema => {
  if (
    actionContext.id &&
    oldMapaContext.conteudo[actionContext.tipo]?.some(
      (x) => x.id === actionContext.id
    )
  )
    return {
      ...oldMapaContext,
    };
  const newMarker: elementoPadrao = {
    geometry: actionContext.valor?.geometry ?? {
      coordinates: actionContext.posicao,
      type: actionContext.tipo,
    },
    dataRef: actionContext.tipo,
    nome: actionContext.nomeElemento ?? `${actionContext.tipo}#${
      oldMapaContext.conteudo?.Marker?.length + 1 || 1
    }`,
    texto: actionContext.textoElemento ?? "",
    properties: actionContext.valor?.properties,
    id: actionContext.id ?? v4(),
    type: "Feature",
    ...padraoElementoNovoAdicionado(oldMapaContext),
  };
  //oldMapaContext.conteudo[actionContext.tipo]
  const newArrayConteudoTipo = oldMapaContext.conteudo[actionContext.tipo]
    ? [...oldMapaContext.conteudo[actionContext.tipo], newMarker]
    : [newMarker];
  return {
    ...oldMapaContext,
    elementoFoco: newMarker, //null,
    conteudo: {
      ...oldMapaContext.conteudo,
      [actionContext.tipo]: [...newArrayConteudoTipo],
    },
  };
};

const addElementoImagem = (
  oldMapaContext: mapaContextSchema,
  actionContextChange: actionContextChange
): mapaContextSchema => {
  const { tipo } = actionContextChange;
  const newImageOverlay = {
    bounds: oldMapaContext.bounds,
    positionTL: [
      oldMapaContext.bounds["_northEast"]["lat"],
      oldMapaContext.bounds["_southWest"]["lng"],
    ] as [number, number],
    positionBL: [
      oldMapaContext.bounds["_southWest"]["lat"],
      oldMapaContext.bounds["_southWest"]["lng"],
    ] as [number, number],
    positionTR: [
      oldMapaContext.bounds["_northEast"]["lat"],
      oldMapaContext.bounds["_northEast"]["lng"],
    ] as [number, number],
    dataRef: tipo,
    nome: `imagem#${oldMapaContext.conteudo?.ImageOverlay?.length + 1 || 1}`,
    urlImagem: actionContextChange.valor,
    id: actionContextChange.id ?? v4(),
    type: "Feature",
    ...padraoElementoNovoAdicionado(oldMapaContext),
  } as tipoElemento;
  return {
    ...oldMapaContext,
    elementoFoco: newImageOverlay,
    conteudo: {
      ...oldMapaContext.conteudo,
      ImageOverlay: (oldMapaContext.conteudo?.ImageOverlay
        ? [...oldMapaContext.conteudo.ImageOverlay, newImageOverlay]
        : [newImageOverlay]) as arrayRectangleType,
    },
    elementoInteracao: elementos.Hand,
  };
};

const removeElemento = (
  oldMapaContext: mapaContextSchema,
  actionContextChange: actionContextChange
): mapaContextSchema => {
  const listaElementos =
    auxiliadorRetornoContext.retornaListaElementosConteudo(oldMapaContext);
  let newConteudo = { ...oldMapaContext.conteudo };
  const removerUmElemento = (elementos: any[], id: NIL) => {
    let newElementos = [...elementos];
    newElementos.splice(
      elementos.findIndex((x) => x.id === id),
      1
    );
    return newElementos;
  };
  oldMapaContext.elementosFoco
    ? oldMapaContext.elementosFoco.forEach((element) => {
        if (listaElementos.some((x) => x.id === element.id))
          newConteudo[listaElementos.find((x) => x.id === element.id).dataRef] =
            removerUmElemento(
              oldMapaContext.conteudo[
                listaElementos.find((x) => x.id === element.id).dataRef
              ],
              element.id
            );
        else {
          const listaAlteracoesConteudo =
            auxiliadorRetornoContext.retornaListaAlteracoesConteudo(
              oldMapaContext
            );
          if (listaAlteracoesConteudo.some((x) => x.id === element.id)) {
            const elementoPai = listaElementos.find((x) =>
              x.alteracoes?.some((x) => x.id === element.id)
            );
            newConteudo[elementoPai.dataRef].find(
              (x) => x.id === elementoPai.id
            ).alteracoes = removerUmElemento(
              oldMapaContext.conteudo[elementoPai.dataRef].find(
                (x) => x.id === elementoPai.id
              ).alteracoes,
              element.id
            );
          }
        }
      })
    : oldMapaContext.elementoFoco
    ? (newConteudo[oldMapaContext.elementoFoco.dataRef] = removerUmElemento(
        oldMapaContext.conteudo[oldMapaContext.elementoFoco.dataRef],
        oldMapaContext.elementoFoco.id
      ))
    : actionContextChange.id
    ? (newConteudo[
        listaElementos.find((x) => x.id === actionContextChange.id).dataRef
      ] = removerUmElemento(
        oldMapaContext.conteudo[
          listaElementos.find((x) => x.id === actionContextChange.id).dataRef
        ],
        actionContextChange.id
      ))
    : null;

  return {
    ...oldMapaContext,
    conteudo: newConteudo,
    elementoFoco: null,
    elementosFoco: null,
  };
};

const atualizaLinhaTempoElemento = (
  oldMapaContext: mapaContextSchema,
  actionContextChange: actionContextChange
): mapaContextSchema => {
  const listaElementos =
    auxiliadorRetornoContext.retornaListaElementosConteudo(oldMapaContext);
  const elementoAlvo = listaElementos.find(
    (x) =>
      x.id === actionContextChange.id ||
      x.alteracoes?.some((z) => z.id === actionContextChange.id)
  );
  const cenaInicio = moment(actionContextChange.start).format(
    "yyyy-MM-DDTHH:mm:ss"
  );
  const cenaFim = moment(actionContextChange.end).format("yyyy-MM-DDTHH:mm:ss");
  if (elementoAlvo.id === actionContextChange.id) {
    elementoAlvo.cenaFim = cenaFim;
    elementoAlvo.cenaInicio = cenaInicio;
  } else {
    const alteracaoAlvo = elementoAlvo.alteracoes.find(
      (x) => x.id === actionContextChange.id
    );
    alteracaoAlvo.cenaFim = cenaFim;
    alteracaoAlvo.cenaInicio = cenaInicio;
  }
  return {
    ...oldMapaContext,
  };
};

const addElementoCopiado = (
  oldMapaContext: mapaContextSchema,
  actionContext: actionContextChange
): mapaContextSchema => {
  const propsPadrao = padraoElementoNovoAdicionado(oldMapaContext);
  const elementoNovo: elementoPadrao = {
    ...actionContext.elemento,
    dataRef: actionContext.elemento.dataRef,
    nome: `${actionContext.elemento.dataRef}#${
      oldMapaContext.conteudo[actionContext.elemento.dataRef].length + 1 || 1
    }`,
    texto: "",
    id: v4(),
    type: "Feature",
    order: propsPadrao.order,
  };
  //oldMapaContext.conteudo[actionContext.elemento.dataRef]
  const newArrayConteudoTipo = [
    ...oldMapaContext.conteudo[actionContext.elemento.dataRef],
    elementoNovo,
  ];
  return {
    ...oldMapaContext,
    elementoFoco: elementoNovo, //null,
    conteudo: {
      ...oldMapaContext.conteudo,
      [actionContext.elemento.dataRef]: [...newArrayConteudoTipo],
    },
  };
};

const moverElementoParaCenaSelecionada = (
  oldMapaContext: mapaContextSchema,
  actionContext: actionContextChange
): mapaContextSchema => {
  const cenaSelecionada = oldMapaContext.conteudo.cenas.find(
    (x) => x.id === actionContext.id
  );
  const { tipo: tipoElemento } = actionContext;
  const newListaConteudoTipo = oldMapaContext.conteudo[tipoElemento].map(
    (elemento) =>
      elemento.id === actionContext.elemento.id
        ? {
            ...elemento,
            cenaInicio: cenaSelecionada.cenaInicio,
            cenaFim: cenaSelecionada.cenaFim,
            cenaSelecionada: cenaSelecionada.id,
          }
        : elemento
  );
  return {
    ...oldMapaContext,
    conteudo: {
      ...oldMapaContext.conteudo,
      [tipoElemento]: [...newListaConteudoTipo],
    },
  };
};

const conteudoContextChanger = {
  movendoImagem,
  removeElemento,
  addElementoPadrao,
  addElementoImagem,
  addElementoCopiado,
  addAlteracaoElemento,
  alteraCoordinatesElemento,
  editarPropriedadeElemento,
  atualizaLinhaTempoElemento,
  moverElementoParaCenaSelecionada,
};
export default conteudoContextChanger;
