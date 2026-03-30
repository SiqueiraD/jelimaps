import auxiliadorRetornoContext from '@/components/Mapa/ContextChangers/auxiliadorRetornoContext';
import {
  actionContextChange,
  mapaContextSchema,
} from '@/components/Mapa/mapaContextTypes';
import { mapaReducer } from '@/components/Mapa/MapaEventDispatcher';
import { elementos } from '@/main/constants/elementos';
import '@/utils/migrationHelper'; // Executa limpeza automática
import moment from 'moment';
import { v4 } from 'uuid';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { getIndexedDBStorage } from './indexedDBStorage';

const R2_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i;

function isR2Key(value: string) {
  return !!value && R2_KEY_PATTERN.test(value);
}

function cleanupRemovedElementImages(
  oldContext: mapaContextSchema,
  newContext: mapaContextSchema
) {
  const before =
    auxiliadorRetornoContext.retornaListaElementosConteudo(oldContext);
  const afterIds = new Set(
    auxiliadorRetornoContext
      .retornaListaElementosConteudo(newContext)
      .map((e) => e.id)
  );
  before.forEach((el) => {
    if (afterIds.has(el.id)) return;
    const url = (el as any).imagemURL || (el as any).urlImagem;
    if (url && typeof url === 'string' && isR2Key(url)) {
      fetch('/api/imagens/by-url', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: url }),
      }).catch(() => {});
    }
  });
}

interface UndoState<T> {
  past: T[];
  present: T;
  future: T[];
}

export type Compartilhamento = {
  usuario_id: string;
  email?: string;
  permissao: 'view' | 'edit';
  created_at: string;
};

export type MapaStoreSettable = {
  mapaId?: string | null;
  tituloMapa?: string;
  mapaPublico?: boolean | null;
  mapaPermissao?: 'dono' | 'edit' | 'view' | null;
  compartilhamentos?: Compartilhamento[];
  compartilhamentosMapaId?: string | null;
};

export type SetStoreOptions = {
  syncSavedVersion?: boolean;
};

interface MapaStore extends Required<MapaStoreSettable> {
  // Estado do mapa
  context: mapaContextSchema;

  // Rastreamento de alterações não salvas (O(1))
  contextVersion: number;
  savedContextVersion: number;

  // Estado undo/redo
  undoState: UndoState<mapaContextSchema>;

  // Actions
  dispatch: (action: actionContextChange) => void;
  setStore: (props: MapaStoreSettable, options?: SetStoreOptions) => void;
  reset: (newContext?: mapaContextSchema) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Helper para obter o contexto inicial
  getInitialContext: () => mapaContextSchema;

  // Verificar se existe contexto salvo
  hasStoredContext: () => boolean;

  // Limpar todo o armazenamento
  clearStore: () => void;
}

const createInitialContext = (): mapaContextSchema => {
  return {
    simpleTimeline: true,
    elementoInteracao: elementos.Hand,
    slidePropriedade: false,
    slideLinhaTempo: true,
    cenaInicio: moment().format('yyyy-MM-DDTHH:mm:ss'),
    cenaFim: moment().add(1, 'minutes').format('yyyy-MM-DDTHH:mm:ss'),
    tempo: moment().add(2, 'seconds').format('yyyy-MM-DDTHH:mm:ss'),
    mapOptions: {
      center: [0, 0],
    },
    playStatus: -1,
    conteudo: {
      cenas: [
        {
          cenaInicio: moment().format('yyyy-MM-DDTHH:mm:ss'),
          cenaFim: moment().add(1, 'minute').format('yyyy-MM-DDTHH:mm:ss'),
          id: v4(),
          nome: 'cena #1',
          dataRef: 'cenas',
          visTimelineObject: {
            type: 'background',
          },
          type: 'FeatureCollection',
          color: '#df000024',
        },
      ],
    },
    timelineOptions: {
      editable: { remove: true, updateTime: true },
      zoomKey: 'ctrlKey',
      preferZoom: false,
      start: moment().format('yyyy-MM-DDTHH:mm:ss'),
      end: moment().add(10, 'minutes').format('yyyy-MM-DDTHH:mm:ss'),
      autoResize: false,
      selectable: true,
      multiselect: false,
      orientation: { axis: 'top' },
      longSelectPressTime: 777,
      snap: (date: Date) => {
        return date;
      },
      rollingMode: { offset: 0, follow: false },
      showCurrentTime: false,
      groupHeightMode: 'fitItems',
      verticalScroll: true,
      margin: { item: { vertical: 20 } },
      zoomable: true,
      moveable: true,
      locale: 'pt_BR',
    },
  } as mapaContextSchema;
};

export const useMapaStore = create<MapaStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        context: createInitialContext(),
        mapaId: null,
        tituloMapa: 'Mapa sem título',
        mapaPublico: null,
        mapaPermissao: null,
        compartilhamentos: [],
        compartilhamentosMapaId: null,
        contextVersion: 0,
        savedContextVersion: -1,

        undoState: {
          past: [],
          present: createInitialContext(),
          future: [],
        },

        // Actions
        dispatch: (action: actionContextChange) => {
          set((state) => {
            const oldContext = state.undoState.present;

            let newContext: mapaContextSchema;

            if (action.type === 'reset') {
              newContext = action.mapContext
                ? {
                    ...action.mapContext,
                    timelineOptions: {
                      ...createInitialContext().timelineOptions,
                      ...action.mapContext.timelineOptions,
                    },
                  }
                : createInitialContext();
            } else if (action.type === 'use-undo') {
              // Usado internamente para undo/redo
              newContext = mapaReducer(oldContext, {
                ...action,
                type: 'trocaMapaContext',
              });
            } else {
              newContext = mapaReducer(oldContext, action);
              if (action.type === 'removeElements') {
                cleanupRemovedElementImages(oldContext, newContext);
              }
            }

            // Atualizar estado undo/redo
            if (action.type !== 'use-undo') {
              return {
                context: newContext,
                contextVersion: state.contextVersion + 1,
                undoState: {
                  past: [...state.undoState.past, oldContext].slice(-50), // Limitar histórico a 50 estados
                  present: newContext,
                  future: [],
                },
              };
            }

            return {
              context: newContext,
              contextVersion: state.contextVersion + 1,
              undoState: {
                ...state.undoState,
                present: newContext,
              },
            };
          });
        },

        setStore: (props: MapaStoreSettable, options?: SetStoreOptions) => {
          set((state) => ({
            ...props,
            ...(options?.syncSavedVersion
              ? { savedContextVersion: state.contextVersion }
              : {}),
          }));
        },

        reset: (newContext?: mapaContextSchema) => {
          const initialContext = newContext ?? createInitialContext();
          set({
            context: initialContext,
            mapaId: null,
            tituloMapa: initialContext.titulo || 'Mapa sem título',
            mapaPublico: null,
            mapaPermissao: null,
            compartilhamentos: [],
            compartilhamentosMapaId: null,
            contextVersion: 0,
            savedContextVersion: -1,
            undoState: {
              past: [],
              present: initialContext,
              future: [],
            },
          });
          console.log('reset FUNCTION com o novo context', initialContext);
        },

        undo: () => {
          set((state) => {
            if (state.undoState.past.length === 0) return state;

            const newPresent =
              state.undoState.past[state.undoState.past.length - 1];
            const newPast = state.undoState.past.slice(0, -1);

            return {
              context: newPresent,
              undoState: {
                past: newPast,
                present: newPresent,
                future: [state.undoState.present, ...state.undoState.future],
              },
            };
          });
        },

        redo: () => {
          set((state) => {
            if (state.undoState.future.length === 0) return state;

            const newPresent = state.undoState.future[0];
            const newFuture = state.undoState.future.slice(1);

            return {
              context: newPresent,
              undoState: {
                past: [...state.undoState.past, state.undoState.present],
                present: newPresent,
                future: newFuture,
              },
            };
          });
        },

        canUndo: () => {
          const state = get();
          return state.undoState.past.length > 0;
        },

        canRedo: () => {
          const state = get();
          return state.undoState.future.length > 0;
        },

        getInitialContext: () => createInitialContext(),

        hasStoredContext: () => {
          const state = get();
          return state.context !== null && state.context !== undefined;
        },

        clearStore: () => {
          const initialContext = createInitialContext();
          set({
            context: initialContext,
            mapaId: null,
            tituloMapa: 'Mapa sem título',
            mapaPublico: null,
            mapaPermissao: null,
            compartilhamentos: [],
            compartilhamentosMapaId: null,
            undoState: {
              past: [],
              present: initialContext,
              future: [],
            },
          });
        },
      }),
      {
        name: 'mapa-context-storage', // nome da chave no storage
        storage: getIndexedDBStorage(), // Usar IndexedDB ao invés de localStorage
        partialize: (state) => {
          // Apenas salvar o context, não o estado completo
          // Isso reduz significativamente o tamanho do armazenamento
          return {
            context: state.context,
            mapaId: state.mapaId,
            tituloMapa: state.tituloMapa,
          } as MapaStore;
        },
        onRehydrateStorage: () => (state) => {
          // Ao restaurar do storage, inicializar undoState corretamente
          if (state) {
            state.undoState = {
              past: [],
              present: state.context,
              future: [],
            };
          }
        },
        version: 1, // Versão do schema para migrações futuras
      }
    ),
    {
      name: 'mapa-store',
    }
  )
);

// Hooks convenientes para uso nos componentes
export const useMapaContext = () => useMapaStore((state) => state.context);
export const useMapaDispatch = () => useMapaStore((state) => state.dispatch);
export const useMapaUndo = () => {
  const undo = useMapaStore((state) => state.undo);
  const redo = useMapaStore((state) => state.redo);
  const canUndo = useMapaStore((state) => state.canUndo());
  const canRedo = useMapaStore((state) => state.canRedo());
  const reset = useMapaStore((state) => state.reset);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
  };
};
