// Serviço para buscar localizações e suas fronteiras usando Nominatim API
export interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
  geojson?: {
    type: string;
    coordinates: number[][][] | number[][];
  };
  polygonpoints?: number[][];
}

class NominatimService {
  private baseUrl = 'https://nominatim.openstreetmap.org';
  
  /**
   * Busca localizações com base em uma query
   * @param query - Texto de busca (ex: "Rio de Janeiro", "Brasil", etc)
   * @param options - Opções adicionais para a busca
   */
  async search(
    query: string,
    options: {
      limit?: number;
      acceptLanguage?: string;
      includePolygon?: boolean;
    } = {}
  ): Promise<NominatimResult[]> {
    const {
      limit = 5,
      acceptLanguage = 'pt-BR',
      includePolygon = true
    } = options;

    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: limit.toString(),
      'accept-language': acceptLanguage,
      polygon_geojson: includePolygon ? '1' : '0',
      polygon_threshold: '0.0' // Garante que obtemos polígonos completos
    });

    try {
      const response = await fetch(
        `${this.baseUrl}/search?${params.toString()}`,
        {
          headers: {
            'User-Agent': 'JeliMaps/1.0' // Importante: Nominatim requer User-Agent
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erro na busca: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar localização:', error);
      throw error;
    }
  }

  /**
   * Busca detalhes de um lugar específico pelo ID
   * @param placeId - ID do lugar no OpenStreetMap
   */
  async getDetails(placeId: number): Promise<NominatimResult> {
    const params = new URLSearchParams({
      place_id: placeId.toString(),
      format: 'json',
      polygon_geojson: '1',
      polygon_threshold: '0.0'
    });

    try {
      const response = await fetch(
        `${this.baseUrl}/details?${params.toString()}`,
        {
          headers: {
            'User-Agent': 'JeliMaps/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao buscar detalhes: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar detalhes do lugar:', error);
      throw error;
    }
  }

  /**
   * Converte GeoJSON para formato Leaflet
   */
  geoJsonToLeaflet(geojson: any): [number, number][] | [number, number][][] {
    if (!geojson) return [];

    if (geojson.type === 'Point') {
      return [[geojson.coordinates[1], geojson.coordinates[0]]];
    }

    if (geojson.type === 'Polygon') {
      // Inverte lat/lon para formato Leaflet
      return geojson.coordinates[0].map((coord: number[]) => [coord[1], coord[0]]);
    }

    if (geojson.type === 'MultiPolygon') {
      // Para MultiPolygon, retorna array de arrays
      return geojson.coordinates.map((polygon: number[][][]) =>
        polygon[0].map((coord: number[]) => [coord[1], coord[0]])
      );
    }

    return [];
  }
}

const nominatimService = new NominatimService();
export default nominatimService;
