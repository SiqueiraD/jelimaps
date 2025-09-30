const DB_NAME = 'JeliMapsDB';
const DB_VERSION = 1;
const STORE_NAME = 'mapaContext';

// Função para limpar objetos e remover propriedades não serializáveis
function cleanObjectForStorage(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Verificar se é um tipo primitivo
  if (typeof obj !== 'object') {
    return obj;
  }

  // Verificar se é uma Date
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Verificar se é um Array
  if (Array.isArray(obj)) {
    return obj.map(item => cleanObjectForStorage(item));
  }

  // Verificar se é um objeto React ou tem símbolos
  if (obj.$$typeof || typeof obj === 'symbol') {
    return null; // Remover elementos React
  }

  // Limpar objeto comum
  const cleaned: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      // Pular funções
      if (typeof value === 'function') {
        continue;
      }
      
      // Pular símbolos
      if (typeof value === 'symbol') {
        continue;
      }
      
      // Pular objetos com $$typeof (elementos React)
      if (value && typeof value === 'object' && value.$$typeof) {
        continue;
      }
      
      // Recursivamente limpar objeto aninhado
      cleaned[key] = cleanObjectForStorage(value);
    }
  }
  
  return cleaned;
}

// Função para restaurar funções necessárias após carregar do storage
function restoreRequiredFunctions(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // Se tem contexto com timelineOptions, restaurar função snap
  if (obj.context && obj.context.timelineOptions) {
    obj.context.timelineOptions.snap = (date: Date) => {
      return date; // Função padrão para snap
    };
  }

  return obj;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export const indexedDBStorage = () => ({
  getItem: async (name: string) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      return new Promise<any>((resolve) => {
        const request = store.get(name);
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            // Restaurar funções necessárias no timelineOptions
            const restored = restoreRequiredFunctions(result);
            resolve(restored);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => {
          console.error('Error reading from IndexedDB:', request.error);
          resolve(null);
        };
      });
    } catch (error) {
      console.error('Error accessing IndexedDB:', error);
      return null;
    }
  },
  
  setItem: async (name: string, value: any) => {
    try {
      // Limpar o objeto para remover funções, símbolos e elementos React
      const cleanValue = cleanObjectForStorage(value);
      
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      return new Promise<void>((resolve) => {
        const request = store.put(cleanValue, name);
        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error('Error writing to IndexedDB:', request.error);
          // Não lançar erro para evitar quebrar a aplicação
          resolve();
        };
      });
    } catch (error) {
      console.error('Error accessing IndexedDB:', error);
      // Falhar silenciosamente
    }
  },
  
  removeItem: async (name: string) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      return new Promise<void>((resolve) => {
        const request = store.delete(name);
        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error('Error deleting from IndexedDB:', request.error);
          resolve();
        };
      });
    } catch (error) {
      console.error('Error accessing IndexedDB:', error);
    }
  },
});

// Criar storage que funciona no servidor e cliente
export const getIndexedDBStorage = () => {
  if (typeof window === 'undefined') {
    // No servidor, retornar um storage dummy
    return {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
    };
  }
  
  return indexedDBStorage();
};
