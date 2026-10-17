import focoInteracaoContextChanger from '@/components/Mapa/ContextChangers/focoInteracaoContextChanger';
import simpleTimelineContextChanger from '@/components/Mapa/ContextChangers/simpleTimelineContextChanger';
import { mapaContextSchema } from '@/components/Mapa/mapaContextTypes';

const scene = (id: string, start: string, end: string) => ({
  id,
  nome: id,
  dataRef: 'cenas',
  type: 'FeatureCollection',
  cenaInicio: start,
  cenaFim: end,
});

const createContext = (): mapaContextSchema =>
  ({
    timelineMode: 'advanced',
    cenaInicio: '2026-01-01T00:00:00',
    cenaFim: '2026-01-01T00:00:20',
    tempo: '2026-01-01T00:00:00',
    elementoInteracao: {},
    slidePropriedade: false,
    slideLinhaTempo: true,
    mapOptions: {},
    timelineOptions: {},
    playStatus: -1,
    conteudo: {
      cenas: [
        scene('scene-1', '2026-01-01T00:00:00', '2026-01-01T00:00:10'),
        scene('scene-2', '2026-01-01T00:00:10', '2026-01-01T00:00:20'),
      ],
      Marker: [
        {
          id: 'element-1',
          nome: 'Element',
          dataRef: 'Marker',
          type: 'Feature',
          cenaInicio: '2026-01-01T00:00:05',
          cenaFim: '2026-01-01T00:00:15',
          color: 'red',
          alteracoes: [
            {
              id: 'change-1',
              nome: 'Change',
              type: 'Feature',
              cenaInicio: '2026-01-01T00:00:09',
              cenaFim: '2026-01-01T00:00:09',
              tipo: 'color',
              valor: 'blue',
            },
          ],
        },
      ],
    },
  } as unknown as mapaContextSchema);

describe('simpleTimelineContextChanger', () => {
  it('creates independent snapshots for every intersected scene', () => {
    const result = simpleTimelineContextChanger.convertToSimpleTimeline(
      createContext()
    );
    const copies = result.conteudo.Marker;

    expect(copies).toHaveLength(2);
    expect(new Set(copies.map((item) => item.id)).size).toBe(2);
    expect(copies.map((item) => item.cenaSelecionada)).toEqual([
      'scene-1',
      'scene-2',
    ]);
    expect(copies[0].color).toBe('red');
    expect(copies[1].color).toBe('blue');
    expect(copies.every((item) => item.alteracoes === undefined)).toBe(true);
    expect(copies[0].cenaInicio).toBe('2026-01-01T00:00:00');
    expect(copies[1].cenaFim).toBe('2026-01-01T00:00:20');
  });

  it('moves elements outside all scenes to the first scene', () => {
    const context = createContext();
    context.conteudo.Marker[0].cenaInicio = '2026-01-02T00:00:00';
    context.conteudo.Marker[0].cenaFim = '2026-01-02T00:00:01';

    const result = simpleTimelineContextChanger.convertToSimpleTimeline(context);

    expect(result.conteudo.Marker).toHaveLength(1);
    expect(result.conteudo.Marker[0].cenaSelecionada).toBe('scene-1');
  });

  it('reorders contiguous scenes and moves their elements with them', () => {
    const converted = simpleTimelineContextChanger.convertToSimpleTimeline(
      createContext()
    );
    const result = simpleTimelineContextChanger.reorderSimpleScenes(converted, {
      type: 'reorderSimpleScenes',
      sceneIds: ['scene-2', 'scene-1'],
    });

    expect(result.conteudo.cenas.map((item) => item.id)).toEqual([
      'scene-2',
      'scene-1',
    ]);
    expect(result.conteudo.cenas[0].cenaInicio).toBe('2026-01-01T00:00:00');
    expect(result.conteudo.cenas[0].cenaFim).toBe('2026-01-01T00:00:10');
    expect(
      result.conteudo.Marker.find(
        (item) => item.cenaSelecionada === 'scene-2'
      ).cenaInicio
    ).toBe('2026-01-01T00:00:00');
  });

  it('accepts only positive integer durations', () => {
    const converted = simpleTimelineContextChanger.convertToSimpleTimeline(
      createContext()
    );
    const unchanged = simpleTimelineContextChanger.changeSimpleSceneDuration(
      converted,
      {
        type: 'changeSimpleSceneDuration',
        id: 'scene-1',
        durationSeconds: 0,
      }
    );
    const changed = simpleTimelineContextChanger.changeSimpleSceneDuration(
      converted,
      {
        type: 'changeSimpleSceneDuration',
        id: 'scene-1',
        durationSeconds: 15,
      }
    );

    expect(unchanged).toBe(converted);
    expect(changed.conteudo.cenas[0].cenaFim).toBe(
      '2026-01-01T00:00:15'
    );
    expect(changed.conteudo.cenas[1].cenaInicio).toBe(
      '2026-01-01T00:00:15'
    );
  });

  it('deletes scene elements in cascade and keeps a valid active scene', () => {
    const converted = simpleTimelineContextChanger.convertToSimpleTimeline(
      createContext()
    );
    const result = simpleTimelineContextChanger.deleteSimpleScene(converted, {
      type: 'deletarCena',
      id: 'scene-1',
    });

    expect(result.conteudo.cenas.map((item) => item.id)).toEqual(['scene-2']);
    expect(result.conteudo.Marker).toHaveLength(1);
    expect(result.conteudo.Marker[0].cenaSelecionada).toBe('scene-2');
    expect(result.activeSceneId).toBe('scene-2');
  });

  it('places current time inside the selected scene instead of its boundary', () => {
    const converted = simpleTimelineContextChanger.convertToSimpleTimeline(
      createContext()
    );
    const result = simpleTimelineContextChanger.selectSimpleScene(converted, {
      type: 'selectSimpleScene',
      id: 'scene-2',
    });

    expect(result.activeSceneId).toBe('scene-2');
    expect(result.tempo).toBe('2026-01-01T00:00:15.000');
  });

  it('activates the owning scene when selecting one of its elements', () => {
    const converted = simpleTimelineContextChanger.convertToSimpleTimeline(
      createContext()
    );
    const element = converted.conteudo.Marker.find(
      (item) => item.cenaSelecionada === 'scene-2'
    );
    const result = focoInteracaoContextChanger.changeElementoFoco(converted, {
      type: 'selecionarElementoFoco',
      elemento: element,
    });

    expect(result.elementoFoco.id).toBe(element.id);
    expect(result.activeSceneId).toBe('scene-2');
    expect(result.tempo).toBe('2026-01-01T00:00:15.000');
  });
});
