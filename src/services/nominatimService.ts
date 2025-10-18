// Serviço para buscar localizações e suas fronteiras usando Nominatim API
import { getSession } from 'next-auth/react';

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
  // Campos específicos do reverse geocoding
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    municipality?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  extratags?: Record<string, string>;
  namedetails?: Record<string, string>;
  error?: string;
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

    // Adiciona o email do usuário se estiver logado
    await this.addUserEmailToParams(params);

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

    // Adiciona o email do usuário se estiver logado
    await this.addUserEmailToParams(params);

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
   * Busca informações de localização com base em coordenadas (Reverse Geocoding)
   * @param lat - Latitude
   * @param lon - Longitude
   * @param options - Opções adicionais para a busca reversa
   */
  async reverse(
    lat: number,
    lon: number,
    options: {
      zoom?: number;
      acceptLanguage?: string;
      includePolygon?: boolean;
      addressDetails?: boolean;
      extraTags?: boolean;
      nameDetails?: boolean;
    } = {}
  ): Promise<NominatimResult | null> {
    const {
      zoom = 18,
      acceptLanguage = 'pt-BR',
      includePolygon = true,
      addressDetails = true,
      extraTags = false,
      nameDetails = false
    } = options;

    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      format: 'json',
      zoom: zoom.toString(),
      'accept-language': acceptLanguage,
      polygon_geojson: includePolygon ? '1' : '0',
      addressdetails: addressDetails ? '1' : '0',
      extratags: extraTags ? '1' : '0',
      namedetails: nameDetails ? '1' : '0'
    });

    // Adiciona o email do usuário se estiver logado
    await this.addUserEmailToParams(params);

    try {
      const response = await fetch(
        `${this.baseUrl}/reverse?${params.toString()}`,
        {
          headers: {
            'User-Agent': 'JeliMaps/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erro na busca reversa: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Verifica se encontrou algum resultado
      if (result.error) {
        console.warn('Nenhum resultado encontrado para as coordenadas:', { lat, lon });
        return null;
      }

      return result;
    } catch (error) {
      console.error('Erro ao fazer busca reversa:', error);
      // throw error;
    }
  }

  /**
   * Adiciona o email do usuário aos parâmetros da requisição se estiver logado
   * @param params - URLSearchParams para adicionar o email
   */
  private async addUserEmailToParams(params: URLSearchParams): Promise<void> {
    try {
      const session = await getSession();
      if (session?.user?.email) {
        params.set('email', session.user.email);
      }
    } catch (error) {
      // Falha silenciosa - se não conseguir obter a sessão, continua sem o email
      console.debug('Não foi possível obter sessão do usuário para Nominatim API:', error);
    }
  }

  /**
   * Formata o endereço do resultado de reverse geocoding de forma mais legível
   * @param result - Resultado do reverse geocoding
   */
  formatAddress(result: NominatimResult): string {
    if (!result.address) {
      return result.display_name;
    }

    const address = result.address;
    const parts: string[] = [];

    // Endereço específico
    if (address.house_number && address.road) {
      parts.push(`${address.road}, ${address.house_number}`);
    } else if (address.road) {
      parts.push(address.road);
    }

    // Bairro/Área
    if (address.neighbourhood) {
      parts.push(address.neighbourhood);
    } else if (address.suburb) {
      parts.push(address.suburb);
    }

    // Cidade
    if (address.city) {
      parts.push(address.city);
    } else if (address.municipality) {
      parts.push(address.municipality);
    }

    // Estado/Região
    if (address.state) {
      parts.push(address.state);
    }

    // País
    if (address.country) {
      parts.push(address.country);
    }

    return parts.length > 0 ? parts.join(', ') : result.display_name;
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
