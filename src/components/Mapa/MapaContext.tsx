import React from "react";
import { useMapaContext as useMapaContextStore, useMapaDispatch as useMapaDispatchStore, useMapaUndo as useMapaUndoStore } from "@/stores/mapaStore";

// Funções exportadas para compatibilidade com código existente
export function useMapaContext() {
  return useMapaContextStore();
}

export function useMapaDispatch() {
  return useMapaDispatchStore();
}

export function useMapaUndo() {
  return useMapaUndoStore();
}

// MapaProvider agora é apenas um wrapper para manter compatibilidade
// Todo o estado agora é gerenciado pelo Zustand

export function MapaProvider({ children }) {
  // O Provider agora é apenas um wrapper simples
  // Todo o estado é gerenciado pelo Zustand store
  return <>{children}</>;
}
