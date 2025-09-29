import Leaflet, { LatLngBoundsExpression } from 'leaflet';

/**
 * Função auxiliar para montar o mapContext ao selecionar um elemento
 * Centraliza a lógica de criação do contexto do mapa baseado no tipo de elemento
 * Busca informações da cena se o elemento tem cenaInicio
 */
export const montarMapContextParaElemento = (elemento: any, mapaContextAtual: any) => {
  if (!elemento) {
    return mapaContextAtual;
  }

  // Busca informações da cena baseado no cenaInicio do elemento
  let cenaBounds = null;
  let cenaZoom = null;
  
  if (elemento.cenaInicio && mapaContextAtual?.cenas) {
    const cena = mapaContextAtual.cenas.find((c: any) => 
      elemento.cenaInicio >= c.cenaInicio && elemento.cenaInicio <= c.cenaFim
    );
    if (cena) {
      cenaBounds = cena.bounds;
      cenaZoom = cena.zoom;
    }
  }

  // Para Markers, usa as coordenadas diretamente, mas com zoom da cena se disponível
  if (elemento.dataRef === "Marker" && elemento.geometry.coordinates) {
    return {
      ...mapaContextAtual,
      bounds: cenaBounds || (elemento.geometry.coordinates as LatLngBoundsExpression),
      center: cenaBounds 
        ? Leaflet.latLngBounds(cenaBounds._northEast, cenaBounds._southWest).getCenter()
        : new Leaflet.LatLng(
            elemento.geometry.coordinates[0] as number,
            elemento.geometry.coordinates[1] as number
          ),
      zoom: cenaZoom || elemento.zoom || mapaContextAtual.zoom,
    };
  }

  // Para outros elementos, prioriza bounds da cena
  if (cenaBounds) {
    return {
      ...mapaContextAtual,
      bounds: cenaBounds,
      center: Leaflet.latLngBounds(
        cenaBounds._northEast,
        cenaBounds._southWest
      ).getCenter(),
      zoom: cenaZoom || elemento.zoom || mapaContextAtual.zoom,
    };
  }

  // Para outros elementos (Polygon, LineString, etc.) que têm bounds
  if (elemento.bounds) {
    return {
      ...mapaContextAtual,
      bounds: elemento.bounds,
      center: Leaflet.latLngBounds(
        elemento.bounds._northEast,
        elemento.bounds._southWest
      ).getCenter(),
      zoom: elemento.zoom || mapaContextAtual.zoom,
    };
  }

  // Se não tem bounds mas tem geometry, tenta criar bounds a partir da geometria
  if (elemento.geometry) {
    try {
      const geoJSON = new Leaflet.GeoJSON(elemento);
      const bounds = geoJSON.getBounds();
      if (bounds && bounds.isValid()) {
        return {
          ...mapaContextAtual,
          bounds: bounds,
          center: bounds.getCenter(),
          zoom: elemento.zoom || mapaContextAtual.zoom,
        };
      }
    } catch (error) {
      console.warn('Não foi possível criar bounds para o elemento', elemento);
    }
  }

  // Fallback - retorna o contexto atual sem alterações
  return mapaContextAtual;
};

/**
 * Função auxiliar completa para montar o dispatch de selecionarElementoFoco
 * @param elemento - O elemento a ser selecionado
 * @param mapaContextAtual - O contexto atual do mapa
 * @returns Objeto com todos os parâmetros necessários para o dispatch
 */
export const montarDispatchSelecionarElemento = (elemento: any, mapaContextAtual: any) => {
  const dispatch: any = {
    type: 'selecionarElementoFoco',
    elemento: elemento,
  };

  // Adiciona o tempo se o elemento tem cenaInicio
  if (elemento?.cenaInicio) {
    dispatch.time = elemento.cenaInicio;
  }

  // Adiciona o mapContext montado
  dispatch.mapContext = montarMapContextParaElemento(elemento, mapaContextAtual);

  return dispatch;
};
