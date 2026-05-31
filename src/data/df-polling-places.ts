/**
 * Referência local de locais de votação no DF (amostra).
 * O TRE-DF não expõe API pública simples — consulta oficial:
 * https://www.tre-df.jus.br/servicos-eleitorais/locais-de-votacao
 * Lista completa pode ser importada no banco futuramente.
 */
export type DfPollingPlace = {
  id: string;
  name: string;
  municipality: string;
  address: string | null;
  state_uf: "DF";
};

export const DF_POLLING_PLACES: DfPollingPlace[] = [
  { id: "df-1", name: "CENTRO DE ENSINO MÉDIO 01 DE BRASÍLIA", municipality: "Brasília", address: "Asa Sul", state_uf: "DF" },
  { id: "df-2", name: "CENTRO DE ENSINO MÉDIO 02 DE BRASÍLIA", municipality: "Brasília", address: "Asa Norte", state_uf: "DF" },
  { id: "df-3", name: "CENTRO DE ENSINO MÉDIO 03 DE BRASÍLIA", municipality: "Brasília", address: "Ceilândia", state_uf: "DF" },
  { id: "df-4", name: "CENTRO DE ENSINO MÉDIO 04 DE BRASÍLIA", municipality: "Brasília", address: "Taguatinga", state_uf: "DF" },
  { id: "df-5", name: "CENTRO DE ENSINO MÉDIO 05 DE BRASÍLIA", municipality: "Brasília", address: "Samambaia", state_uf: "DF" },
  { id: "df-6", name: "CENTRO DE ENSINO MÉDIO 06 DE BRASÍLIA", municipality: "Brasília", address: "Planaltina", state_uf: "DF" },
  { id: "df-7", name: "CENTRO DE ENSINO MÉDIO 07 DE BRASÍLIA", municipality: "Brasília", address: "Gama", state_uf: "DF" },
  { id: "df-8", name: "CENTRO DE ENSINO MÉDIO 08 DE BRASÍLIA", municipality: "Brasília", address: "São Sebastião", state_uf: "DF" },
  { id: "df-9", name: "CENTRO DE ENSINO MÉDIO 09 DE BRASÍLIA", municipality: "Brasília", address: "Santa Maria", state_uf: "DF" },
  { id: "df-10", name: "CENTRO DE ENSINO MÉDIO 10 DE BRASÍLIA", municipality: "Brasília", address: "Sobradinho", state_uf: "DF" },
  { id: "df-11", name: "CENTRO DE ENSINO MÉDIO 11 DE BRASÍLIA", municipality: "Brasília", address: "Recanto das Emas", state_uf: "DF" },
  { id: "df-12", name: "CENTRO DE ENSINO MÉDIO 12 DE BRASÍLIA", municipality: "Brasília", address: "Riacho Fundo", state_uf: "DF" },
  { id: "df-13", name: "CENTRO DE ENSINO MÉDIO 13 DE BRASÍLIA", municipality: "Brasília", address: "Núcleo Bandeirante", state_uf: "DF" },
  { id: "df-14", name: "CENTRO DE ENSINO MÉDIO 14 DE BRASÍLIA", municipality: "Brasília", address: "Paranoá", state_uf: "DF" },
  { id: "df-15", name: "CENTRO DE ENSINO MÉDIO 15 DE BRASÍLIA", municipality: "Brasília", address: "Guará", state_uf: "DF" },
  { id: "df-16", name: "EEEFM ANÍSIO TEIXEIRA", municipality: "Brasília", address: "Ceilândia", state_uf: "DF" },
  { id: "df-17", name: "EEEFM CEF 01", municipality: "Brasília", address: "Asa Norte", state_uf: "DF" },
  { id: "df-18", name: "EEEFM CEF 02", municipality: "Brasília", address: "Asa Sul", state_uf: "DF" },
  { id: "df-19", name: "EEEFM CEF 03", municipality: "Brasília", address: "Taguatinga", state_uf: "DF" },
  { id: "df-20", name: "EEEFM CEF 04", municipality: "Brasília", address: "Ceilândia", state_uf: "DF" },
  { id: "df-21", name: "EEEFM CEF 05", municipality: "Brasília", address: "Samambaia", state_uf: "DF" },
  { id: "df-22", name: "EEEFM CEF 06", municipality: "Brasília", address: "Gama", state_uf: "DF" },
  { id: "df-23", name: "EEEFM CEF 07", municipality: "Brasília", address: "Planaltina", state_uf: "DF" },
  { id: "df-24", name: "EEEFM CEF 08", municipality: "Brasília", address: "Sobradinho", state_uf: "DF" },
  { id: "df-25", name: "EEEFM CEF 09", municipality: "Brasília", address: "Santa Maria", state_uf: "DF" },
  { id: "df-26", name: "EEEFM CEF 10", municipality: "Brasília", address: "São Sebastião", state_uf: "DF" },
  { id: "df-27", name: "EEEFM CEF 11", municipality: "Brasília", address: "Recanto das Emas", state_uf: "DF" },
  { id: "df-28", name: "EEEFM CEF 12", municipality: "Brasília", address: "Riacho Fundo", state_uf: "DF" },
  { id: "df-29", name: "EEEFM CEF 13", municipality: "Brasília", address: "Núcleo Bandeirante", state_uf: "DF" },
  { id: "df-30", name: "EEEFM CEF 14", municipality: "Brasília", address: "Paranoá", state_uf: "DF" },
  { id: "df-31", name: "EEEFM CEF 15", municipality: "Brasília", address: "Guará", state_uf: "DF" },
  { id: "df-32", name: "EEEFM CEF 16", municipality: "Brasília", address: "Cruzeiro", state_uf: "DF" },
  { id: "df-33", name: "EEEFM CEF 17", municipality: "Brasília", address: "Lago Sul", state_uf: "DF" },
  { id: "df-34", name: "EEEFM CEF 18", municipality: "Brasília", address: "Lago Norte", state_uf: "DF" },
  { id: "df-35", name: "EEEFM CEF 19", municipality: "Brasília", address: "Sudoeste/Octogonal", state_uf: "DF" },
  { id: "df-36", name: "EEEFM CEF 20", municipality: "Brasília", address: "Vicente Pires", state_uf: "DF" },
  { id: "df-37", name: "EEEFM CEF 21", municipality: "Brasília", address: "Arniqueira", state_uf: "DF" },
  { id: "df-38", name: "EEEFM CEF 22", municipality: "Brasília", address: "Águas Claras", state_uf: "DF" },
  { id: "df-39", name: "EEEFM CEF 23", municipality: "Brasília", address: "Sobradinho II", state_uf: "DF" },
  { id: "df-40", name: "EEEFM CEF 24", municipality: "Brasília", address: "Fercal", state_uf: "DF" },
  { id: "df-41", name: "COLÉGIO CATÓLICO DE BRASÍLIA", municipality: "Brasília", address: "Asa Sul", state_uf: "DF" },
  { id: "df-42", name: "COLÉGIO MARISTA", municipality: "Brasília", address: "Asa Sul", state_uf: "DF" },
  { id: "df-43", name: "COLÉGIO BENNETT", municipality: "Brasília", address: "Lago Sul", state_uf: "DF" },
  { id: "df-44", name: "ESCOLA CLASSE A", municipality: "Brasília", address: "Asa Norte", state_uf: "DF" },
  { id: "df-45", name: "UNB - CAMPUS DARCY RIBEIRO", municipality: "Brasília", address: "Asa Norte", state_uf: "DF" },
  { id: "df-46", name: "IFB - CAMPUS BRASÍLIA", municipality: "Brasília", address: "Asa Norte", state_uf: "DF" },
  { id: "df-47", name: "IFB - CAMPUS PLANALTINA", municipality: "Planaltina", address: "Planaltina", state_uf: "DF" },
  { id: "df-48", name: "IFB - CAMPUS GAMA", municipality: "Gama", address: "Gama", state_uf: "DF" },
  { id: "df-49", name: "IFB - CAMPUS SAMAMBAIA", municipality: "Samambaia", address: "Samambaia", state_uf: "DF" },
  { id: "df-50", name: "CENTRO DE ENSINO MÉDIO DE TAGUATINGA", municipality: "Taguatinga", address: "Taguatinga Centro", state_uf: "DF" },
  { id: "df-51", name: "CENTRO DE ENSINO MÉDIO DE CEILÂNDIA", municipality: "Ceilândia", address: "Ceilândia Centro", state_uf: "DF" },
  { id: "df-52", name: "CENTRO DE ENSINO MÉDIO DE SAMAMBAIA", municipality: "Samambaia", address: "Samambaia Sul", state_uf: "DF" },
  { id: "df-53", name: "CENTRO DE ENSINO MÉDIO DE SOBRADINHO", municipality: "Sobradinho", address: "Sobradinho", state_uf: "DF" },
  { id: "df-54", name: "CENTRO DE ENSINO MÉDIO DE PLANALTINA", municipality: "Planaltina", address: "Planaltina", state_uf: "DF" },
  { id: "df-55", name: "CENTRO DE ENSINO MÉDIO DE GAMA", municipality: "Gama", address: "Gama", state_uf: "DF" },
  { id: "df-56", name: "CENTRO DE ENSINO MÉDIO DE SÃO SEBASTIÃO", municipality: "São Sebastião", address: "São Sebastião", state_uf: "DF" },
  { id: "df-57", name: "CENTRO DE ENSINO MÉDIO DE SANTA MARIA", municipality: "Santa Maria", address: "Santa Maria", state_uf: "DF" },
  { id: "df-58", name: "CENTRO DE ENSINO MÉDIO DE RECANTO DAS EMAS", municipality: "Recanto das Emas", address: "Recanto das Emas", state_uf: "DF" },
  { id: "df-59", name: "CENTRO DE ENSINO MÉDIO DE RIACHO FUNDO", municipality: "Riacho Fundo", address: "Riacho Fundo", state_uf: "DF" },
  { id: "df-60", name: "CENTRO DE ENSINO MÉDIO DE PARANOÁ", municipality: "Paranoá", address: "Paranoá", state_uf: "DF" },
  { id: "df-61", name: "CENTRO DE ENSINO MÉDIO DE ÁGUAS CLARAS", municipality: "Águas Claras", address: "Águas Claras", state_uf: "DF" },
  { id: "df-62", name: "CENTRO DE ENSINO MÉDIO DE VICENTE PIRES", municipality: "Vicente Pires", address: "Vicente Pires", state_uf: "DF" },
  { id: "df-63", name: "CENTRO DE ENSINO MÉDIO DE LUZIÂNIA", municipality: "Luziânia", address: "Luziânia", state_uf: "DF" },
  { id: "df-64", name: "CENTRO DE ENSINO MÉDIO DE FORMOSA", municipality: "Formosa", address: "Formosa", state_uf: "DF" },
  { id: "df-65", name: "CENTRO DE ENSINO MÉDIO DE VALPARAÍSO", municipality: "Valparaíso de Goiás", address: "Valparaíso", state_uf: "DF" },
];

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function searchDfPollingPlaces(query: string, limit = 25): DfPollingPlace[] {
  const q = normalizeSearchText(query);
  if (q.length < 2) return [];
  return DF_POLLING_PLACES.filter((place) => {
    const hay = normalizeSearchText(
      `${place.name} ${place.municipality} ${place.address ?? ""}`,
    );
    return hay.includes(q);
  }).slice(0, limit);
}
