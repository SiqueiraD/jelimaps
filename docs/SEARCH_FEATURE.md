# Funcionalidade de Busca com Fronteiras Poligonais - JeliMaps

## 📍 Visão Geral

Foi implementada uma nova funcionalidade de busca de localizações que permite pesquisar e visualizar fronteiras completas (polígonos) de lugares, não apenas bounding boxes retangulares.

## 🚀 Características

### **Busca Inteligente**
- Busca por cidades, países, estados, bairros, etc.
- Resultados com autocompletar em tempo real
- Indicação visual de quais resultados possuem fronteiras disponíveis

### **Visualização de Fronteiras Poligonais**
- **Polígonos Completos**: Desenha as fronteiras reais de localizações (não apenas retângulos)
- **Multi-Polígonos**: Suporta territórios com múltiplas áreas (ex: ilhas)
- **Linhas**: Suporta elementos lineares como rios e estradas
- **Estilização**: Fronteiras destacadas com cor azul e transparência

### **Interface do Usuário**
- Botão de busca no canto superior esquerdo do mapa
- Caixa de busca expansível/retrátil
- Informações detalhadas sobre cada resultado:
  - Nome principal
  - Localização completa
  - Tipo de lugar (País, Estado, Cidade, etc.)
  - Indicador de disponibilidade de fronteiras

## 🔧 Tecnologias Utilizadas

### **Nominatim API (OpenStreetMap)**
- API gratuita e open source
- Retorna geometrias completas GeoJSON
- Suporta múltiplos idiomas
- Não requer chave de API

### **Componentes Criados**

1. **`nominatimService.ts`**
   - Serviço para comunicação com a API Nominatim
   - Conversão de GeoJSON para formato Leaflet
   - Tratamento de erros e cache

2. **`SearchBox.tsx`**
   - Componente de autocompletar com Material-UI
   - Debounce para otimizar requisições
   - Interface visual rica com ícones e chips

3. **`SearchLocationControl.tsx`**
   - Controle integrado ao mapa Leaflet
   - Renderização de polígonos e marcadores
   - Ajuste automático de zoom para mostrar toda a área

## 📝 Como Usar

### **Para o Usuário Final**

1. **Abrir a Busca**
   - Clique no ícone de lupa no canto superior esquerdo do mapa

2. **Buscar Localização**
   - Digite pelo menos 3 caracteres
   - Aguarde os resultados aparecerem
   - Localizações com chip "Fronteiras" possuem polígonos disponíveis

3. **Selecionar Resultado**
   - Clique no resultado desejado
   - O mapa automaticamente:
     - Desenha as fronteiras (se disponível)
     - Ajusta o zoom para mostrar toda a área
     - Mostra um popup com informações

4. **Fechar a Busca**
   - Clique no X para fechar a caixa de busca
   - As fronteiras permanecerão visíveis no mapa

### **Para Desenvolvedores**

#### Exemplo de Uso do Serviço

```typescript
import nominatimService from '@/services/nominatimService';

// Buscar localizações
const results = await nominatimService.search('Rio de Janeiro', {
  limit: 5,
  includePolygon: true
});

// Converter GeoJSON para Leaflet
const coordinates = nominatimService.geoJsonToLeaflet(results[0].geojson);
```

#### Personalização do Componente

```tsx
<SearchLocationControl 
  position="topleft"
  onLocationFound={(location) => {
    // Ação customizada ao encontrar localização
    console.log('Localização:', location);
    
    // Salvar no contexto, banco de dados, etc.
    saveLocation(location);
  }}
/>
```

## 🌟 Exemplos de Busca

### **Fronteiras Disponíveis**
- ✅ Brasil (país completo)
- ✅ Rio de Janeiro (estado)
- ✅ São Paulo (cidade)
- ✅ Copacabana (bairro)
- ✅ França (incluindo territórios ultramarinos)
- ✅ Estados Unidos (incluindo Alaska e Hawaii)

### **Tipos de Geometria**
- **Polígono Simples**: Maioria das cidades e estados
- **Multi-Polígono**: Países com ilhas (Japão, Indonésia)
- **Linhas**: Rios, estradas principais
- **Pontos**: Endereços específicos, POIs

## 🎨 Personalização Visual

As fronteiras podem ser customizadas editando o arquivo `SearchLocationControl.tsx`:

```typescript
// Estilo do polígono
const polygonStyle = {
  color: '#2196F3',        // Cor da borda
  weight: 3,               // Espessura da borda
  opacity: 0.8,            // Opacidade da borda
  fillColor: '#2196F3',    // Cor do preenchimento
  fillOpacity: 0.2,        // Opacidade do preenchimento
  dashArray: '10, 5'       // Linha tracejada (opcional)
};
```

## ⚠️ Limitações e Considerações

1. **Taxa de Requisições**
   - Nominatim tem limite de uso justo
   - Implementado debounce de 500ms
   - Máximo de 8 resultados por busca

2. **Precisão das Fronteiras**
   - Depende dos dados do OpenStreetMap
   - Algumas áreas podem ter fronteiras simplificadas
   - Fronteiras disputadas podem variar

3. **Performance**
   - Polígonos muito complexos podem impactar performance
   - Recomendado limitar zoom máximo para áreas grandes

## 🔄 Próximas Melhorias Sugeridas

1. **Cache Local**
   - Armazenar buscas recentes no localStorage
   - Reduzir requisições à API

2. **Integração com Terra-Draw**
   - Permitir edição das fronteiras obtidas
   - Salvar fronteiras modificadas no projeto

3. **Múltiplas Seleções**
   - Permitir buscar e mostrar múltiplas localizações
   - Comparar tamanhos de diferentes áreas

4. **Exportação**
   - Exportar fronteiras como GeoJSON
   - Integração com outros sistemas GIS

## 📚 Referências

- [Nominatim API Documentation](https://nominatim.org/release-docs/latest/api/Search/)
- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [GeoJSON Specification](https://geojson.org/)
- [OpenStreetMap](https://www.openstreetmap.org/)

---

**Desenvolvido para o projeto JeliMaps** - Mapeamento interativo com linha do tempo
