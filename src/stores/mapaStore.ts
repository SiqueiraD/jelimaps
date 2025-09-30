import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { mapaContextSchema, actionContextChange } from '@/components/Mapa/mapaContextTypes';
import { elementos } from '@/main/constants/elementos';
import { mapaReducer } from '@/components/Mapa/MapaEventDispatcher';
import { v4 } from 'uuid';
import moment from 'moment';
import { getIndexedDBStorage } from './indexedDBStorage';
import '@/utils/migrationHelper'; // Executa limpeza automática

interface UndoState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface MapaStore {
  // Estado do mapa
  context: mapaContextSchema;
  
  // Estado undo/redo
  undoState: UndoState<mapaContextSchema>;
  
  // Actions
  dispatch: (action: actionContextChange) => void;
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
          nome: "cena #1",
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
      zoomKey: "ctrlKey",
      preferZoom: false,
      start: moment().format("yyyy-MM-DDTHH:mm:ss"),
      end: moment().add(10, "minutes").format("yyyy-MM-DDTHH:mm:ss"),
      autoResize: false,
      selectable: true,
      multiselect: false,
      orientation: { axis: "top" },
      longSelectPressTime: 777,
      snap: (date: Date) => {
        return date;
      },
      rollingMode: { offset: 0, follow: false },
      showCurrentTime: false,
      groupHeightMode: "fitItems",
      verticalScroll: true,
      margin: { item: { vertical: 20 } },
      zoomable: true,
      moveable: true,
      locale: "pt_BR",
    },
  } as mapaContextSchema;
};

export const useMapaStore = create<MapaStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        context: createInitialContext(),
        
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
              newContext = mapaReducer(
                oldContext, 
                { ...action, type: 'trocaMapaContext' }
              );
            } else {
              newContext = mapaReducer(oldContext, action);
            }
            
            // Atualizar estado undo/redo
            if (action.type !== 'use-undo') {
              return {
                context: newContext,
                undoState: {
                  past: [...state.undoState.past, oldContext].slice(-50), // Limitar histórico a 50 estados
                  present: newContext,
                  future: [],
                },
              };
            }
            
            return {
              context: newContext,
              undoState: {
                ...state.undoState,
                present: newContext,
              },
            };
          });
        },
        
        reset: (newContext?: mapaContextSchema) => {
          const initialContext = newContext ?? createInitialContext();
          set({
            context: initialContext,
            undoState: {
              past: [],
              present: initialContext,
              future: [],
            },
          });
          console.log("reset FUNCTION com o novo context", initialContext);
        },
        
        undo: () => {
          set((state) => {
            if (state.undoState.past.length === 0) return state;
            
            const newPresent = state.undoState.past[state.undoState.past.length - 1];
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
          return { context: state.context } as MapaStore;
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
