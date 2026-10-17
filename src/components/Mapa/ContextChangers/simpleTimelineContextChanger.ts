import moment from 'moment';
import { v4 } from 'uuid';
import {
    actionContextChange,
    mapaContextSchema,
    tipoElemento,
} from '../mapaContextTypes';

const formatDate = (value: moment.MomentInput) =>
  moment(value).format('yyyy-MM-DDTHH:mm:ss');

const durationSeconds = (cena: tipoElemento) =>
  Math.max(1, moment(cena.cenaFim).diff(moment(cena.cenaInicio), 'seconds'));

const sceneInteriorTime = (cena: tipoElemento) => {
  const inicio = moment(cena.cenaInicio);
  const duration = Math.max(1, moment(cena.cenaFim).diff(inicio, 'milliseconds'));
  return inicio
    .clone()
    .add(Math.floor(duration / 2), 'milliseconds')
    .format('yyyy-MM-DDTHH:mm:ss.SSS');
};

const intersects = (elemento: tipoElemento, cena: tipoElemento) =>
  moment(elemento.cenaInicio).isBefore(moment(cena.cenaFim)) &&
  moment(elemento.cenaFim).isAfter(moment(cena.cenaInicio));

const applyChanges = (elemento: tipoElemento, at: moment.MomentInput) => {
  const alteracoes = [...(elemento.alteracoes ?? [])]
    .filter((alteracao) =>
      moment(alteracao.cenaInicio).isSameOrBefore(moment(at))
    )
    .sort(
      (a, b) =>
        moment(a.cenaInicio).valueOf() - moment(b.cenaInicio).valueOf()
    );

  return alteracoes.reduce<tipoElemento>((snapshot, alteracao) => {
    if (!alteracao.tipo) return snapshot;
    return { ...snapshot, [alteracao.tipo]: alteracao.valor } as tipoElemento;
  }, elemento);
};

const mapElementArrays = (
  context: mapaContextSchema,
  mapper: (elemento: tipoElemento) => tipoElemento[]
) =>
  Object.fromEntries(
    Object.entries(context.conteudo).map(([key, value]) => {
      if (key === 'cenas') return [key, value];
      return [key, value.flatMap(mapper)];
    })
  ) as mapaContextSchema['conteudo'];

const alignElementsToScenes = (
  context: mapaContextSchema,
  cenas: tipoElemento[]
) => {
  const byId = new Map(cenas.map((cena) => [cena.id, cena]));
  return mapElementArrays(context, (elemento) => {
    const cena = byId.get(elemento.cenaSelecionada);
    return [
      cena
        ? {
            ...elemento,
            cenaInicio: cena.cenaInicio,
            cenaFim: cena.cenaFim,
          }
        : elemento,
    ];
  });
};

const rebuildScenes = (
  context: mapaContextSchema,
  orderedScenes: tipoElemento[],
  durations = new Map(orderedScenes.map((cena) => [cena.id, durationSeconds(cena)]))
): mapaContextSchema => {
  let cursor = moment(context.cenaInicio ?? orderedScenes[0]?.cenaInicio);
  const cenas = orderedScenes.map((cena) => {
    const cenaInicio = formatDate(cursor);
    cursor = cursor.clone().add(durations.get(cena.id) ?? 1, 'seconds');
    return { ...cena, cenaInicio, cenaFim: formatDate(cursor) };
  });
  const conteudo = alignElementsToScenes(context, cenas);
  const activeScene =
    cenas.find((cena) => cena.id === context.activeSceneId) ?? cenas[0];

  return {
    ...context,
    activeSceneId: activeScene?.id,
    cenaInicio: cenas[0]?.cenaInicio ?? context.cenaInicio,
    cenaFim: cenas[cenas.length - 1]?.cenaFim ?? context.cenaFim,
    tempo: activeScene ? sceneInteriorTime(activeScene) : context.tempo,
    conteudo: { ...conteudo, cenas },
  };
};

const convertToSimpleTimeline = (context: mapaContextSchema) => {
  const cenas = context.conteudo.cenas;
  if (!cenas.length) return context;

  const conteudo = mapElementArrays(context, (elemento) => {
    const matchingScenes = cenas.filter((cena) => intersects(elemento, cena));
    const targetScenes = matchingScenes.length ? matchingScenes : [cenas[0]];
    return targetScenes.map((cena) => {
      const snapshot = { ...applyChanges(elemento, cena.cenaInicio) };
      delete snapshot.alteracoes;
      return {
        ...snapshot,
        id: v4(),
        cenaSelecionada: cena.id,
        cenaInicio: cena.cenaInicio,
        cenaFim: cena.cenaFim,
      } as tipoElemento;
    });
  });
  const activeScene =
    cenas.find((cena) => cena.id === context.activeSceneId) ?? cenas[0];

  return {
    ...context,
    timelineMode: 'simple' as const,
    activeSceneId: activeScene.id,
    tempo: sceneInteriorTime(activeScene),
    elementoFoco: null,
    elementosFoco: null,
    center: activeScene.center ?? context.center,
    zoom: activeScene.zoom ?? context.zoom,
    bounds: activeScene.bounds ?? context.bounds,
    conteudo: { ...conteudo, cenas },
  };
};

const changeTimelineMode = (
  context: mapaContextSchema,
  action: actionContextChange
) =>
  action.timelineMode === 'simple'
    ? convertToSimpleTimeline(context)
    : { ...context, timelineMode: 'advanced' as const };

const selectSimpleScene = (
  context: mapaContextSchema,
  action: actionContextChange
) => {
  const cena = context.conteudo.cenas.find((item) => item.id === action.id);
  if (!cena) return context;
  return {
    ...context,
    activeSceneId: cena.id,
    tempo: sceneInteriorTime(cena),
    slidePropriedade: true,
    elementoFoco: null,
    elementosFoco: null,
    center: cena.center ?? context.center,
    zoom: cena.zoom ?? context.zoom,
    bounds: cena.bounds ?? context.bounds,
  };
};

const reorderSimpleScenes = (
  context: mapaContextSchema,
  action: actionContextChange
) => {
  const byId = new Map(context.conteudo.cenas.map((cena) => [cena.id, cena]));
  const cenas = (action.sceneIds ?? []).map((id) => byId.get(id)).filter(Boolean);
  if (cenas.length !== context.conteudo.cenas.length) return context;
  return rebuildScenes(context, cenas);
};

const changeSimpleSceneDuration = (
  context: mapaContextSchema,
  action: actionContextChange
) => {
  if (
    !Number.isInteger(action.durationSeconds) ||
    action.durationSeconds < 1 ||
    !context.conteudo.cenas.some((cena) => cena.id === action.id)
  )
    return context;
  const durations = new Map(
    context.conteudo.cenas.map((cena) => [
      cena.id,
      cena.id === action.id ? action.durationSeconds : durationSeconds(cena),
    ])
  );
  return rebuildScenes(context, context.conteudo.cenas, durations);
};

const addSimpleScene = (context: mapaContextSchema, cena: tipoElemento) =>
  rebuildScenes(
    { ...context, activeSceneId: cena.id },
    [...context.conteudo.cenas, cena]
  );

const deleteSimpleScene = (
  context: mapaContextSchema,
  action: actionContextChange
) => {
  if (context.conteudo.cenas.length <= 1) return context;
  const removedIndex = context.conteudo.cenas.findIndex(
    (cena) => cena.id === action.id
  );
  if (removedIndex < 0) return context;
  const cenas = context.conteudo.cenas.filter((cena) => cena.id !== action.id);
  const activeScene = cenas[Math.min(removedIndex, cenas.length - 1)];
  const conteudo = mapElementArrays(context, (elemento) =>
    elemento.cenaSelecionada === action.id ? [] : [elemento]
  );
  return rebuildScenes(
    {
      ...context,
      activeSceneId: activeScene.id,
      elementoFoco: null,
      elementosFoco: null,
      conteudo: { ...conteudo, cenas },
    },
    cenas
  );
};

const simpleTimelineContextChanger = {
  addSimpleScene,
  changeSimpleSceneDuration,
  changeTimelineMode,
  convertToSimpleTimeline,
  deleteSimpleScene,
  rebuildScenes,
  reorderSimpleScenes,
  selectSimpleScene,
};

export default simpleTimelineContextChanger;
export { applyChanges, durationSeconds, intersects, sceneInteriorTime };
