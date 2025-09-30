// Helper para migração e limpeza de dados antigos

export const cleanupOldStorage = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Remover chaves antigas do localStorage
    const keysToRemove = [
      'mapaContext',
      'mapa-context-storage', // Chave que pode ter sido criada antes da migração para IndexedDB
    ];
    
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log(`Removendo chave antiga do localStorage: ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    // Limpar todo o localStorage se estiver muito cheio
    const storageSize = new Blob(Object.values(localStorage)).size;
    if (storageSize > 4 * 1024 * 1024) { // Se maior que 4MB
      console.warn('localStorage muito grande, limpando tudo exceto auth');
      
      // Salvar dados de autenticação se existir
      const authKeys = Object.keys(localStorage).filter(key => 
        key.includes('next-auth') || key.includes('session')
      );
      const authData: Record<string, string> = {};
      authKeys.forEach(key => {
        authData[key] = localStorage.getItem(key) || '';
      });
      
      // Limpar tudo
      localStorage.clear();
      
      // Restaurar dados de auth
      Object.entries(authData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    }
  } catch (error) {
    console.error('Erro ao limpar storage antigo:', error);
  }
};

// Executar limpeza automaticamente ao carregar o módulo
if (typeof window !== 'undefined') {
  cleanupOldStorage();
}
