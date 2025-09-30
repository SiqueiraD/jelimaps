/**
 * Conta o total de pontos de coordenadas em um elemento geográfico
 * @param elemento - Elemento com geometria
 * @returns Número total de pontos de coordenadas
 */
export function contarPontosCoordenadas(elemento: any): number {
  if (!elemento?.geometry?.coordinates) {
    return 0;
  }

  const geometryType = elemento.geometry.type;
  let totalPoints = 0;

  if (geometryType === "Polygon") {
    // Para Polygon: array de arrays de coordenadas [[[x,y], [x,y], ...]]
    if (Array.isArray(elemento.geometry.coordinates)) {
      elemento.geometry.coordinates.forEach((ring: any) => {
        if (Array.isArray(ring)) {
          totalPoints += ring.length;
        }
      });
    }
  }

  return totalPoints;
}

/**
 * Verifica se um elemento é um polígono grande (mais de 2000 pontos)
 * @param elemento - Elemento a verificar
 * @returns true se o polígono tem mais de 2000 pontos
 */
export function isPoligonoGrande(elemento: any): boolean {
  const geometryType = elemento?.geometry?.type;
  const isPolygon = geometryType === "Polygon";
  
  if (!isPolygon) {
    return false;
  }
  
  return contarPontosCoordenadas(elemento) > 2000;
}

/**
 * Retorna conteúdo HTML para o tooltip de polígonos grandes
 * @param totalPoints - Número total de pontos
 * @returns String HTML com o conteúdo do tooltip
 */
export function getTooltipPoligonoGrande(totalPoints: number): string {
  return `
    <div style="padding: 10px; max-width: 300px;">
      <strong>Polígono com muitos pontos (${totalPoints} pontos)</strong><br/><br/>
      Este elemento possui mais de 2000 pontos de coordenadas e não pode ter suas coordenadas editadas diretamente no mapa.<br/><br/>
      <em>Você pode:</em>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Excluir o elemento</li>
        <li>Editar suas propriedades na barra lateral (nome, tempo, texto, cor, etc.)</li>
      </ul>
    </div>
  `;
}
