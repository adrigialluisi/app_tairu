/** acima disso o nome não cabe bem ao lado do botão "Dicas" num celular de 360px (ajustes-95b/100) */
const MAX_CITY_LABEL = 14;

/**
 * Rótulo curto da cidade: "San Pedro de Atacama" → "San Pedro" (corta antes do primeiro "de/del/do/da";
 * sem isso, as duas primeiras palavras). O nome completo fica no aria-label e nos cabeçalhos dos dias.
 * Era das abas de cidade do Roteiro (DestinationTabs, removidas no ajustes-100); hoje vale pro select
 * de cidade e pro "Ver sugestões pra {cidade}" do dia vazio.
 */
export function shortCityLabel(city: string): string {
  if (city.length <= MAX_CITY_LABEL) return city;
  const beforeLink = city.split(/\s+(?:de|del|do|da|dos|das|di)\s+/i)[0];
  if (beforeLink && beforeLink !== city) return beforeLink;
  return city.split(/\s+/).slice(0, 2).join(' ');
}
