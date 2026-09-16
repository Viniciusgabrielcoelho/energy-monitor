export const TARIFFS = {
  AC: { name: 'Acre', tariff: 0.83, distributor: 'Energisa AC' },
  AL: { name: 'Alagoas', tariff: 0.851, distributor: 'Equatorial AL' },
  AP: { name: 'Amapá', tariff: 0.825, distributor: 'Equatorial AP' },
  AM: { name: 'Amazonas', tariff: 0.876, distributor: 'Amazonas Energia' },
  BA: { name: 'Bahia', tariff: 0.878, distributor: 'Coelba' },
  CE: { name: 'Ceará', tariff: 0.702, distributor: 'Enel CE' },
  DF: { name: 'Distrito Federal', tariff: 0.827, distributor: 'Neoenergia Brasília' },
  ES: { name: 'Espírito Santo', tariff: 0.844, distributor: 'EDP ES' },
  GO: { name: 'Goiás', tariff: 0.892, distributor: 'Equatorial GO' },
  MA: { name: 'Maranhão', tariff: 0.889, distributor: 'Equatorial MA' },
  MT: { name: 'Mato Grosso', tariff: 0.899, distributor: 'Energisa MT' },
  MS: { name: 'Mato Grosso do Sul', tariff: 0.987, distributor: 'Energisa MS' },
  MG: { name: 'Minas Gerais', tariff: 0.903, distributor: 'CEMIG' },
  PA: { name: 'Pará', tariff: 0.978, distributor: 'Equatorial PA' },
  PB: { name: 'Paraíba', tariff: 0.676, distributor: 'Energisa PB' },
  PR: { name: 'Paraná', tariff: 0.768, distributor: 'COPEL' },
  PE: { name: 'Pernambuco', tariff: 0.799, distributor: 'Neoenergia PE' },
  PI: { name: 'Piauí', tariff: 0.947, distributor: 'Equatorial PI' },
  RJ: { name: 'Rio de Janeiro', tariff: 0.881, distributor: 'Light' },
  RN: { name: 'Rio Grande do Norte', tariff: 0.776, distributor: 'Cosern' },
  RS: { name: 'Rio Grande do Sul', tariff: 0.822, distributor: 'CEEE Equatorial' },
  RO: { name: 'Rondônia', tariff: 0.762, distributor: 'Energisa RO' },
  RR: { name: 'Roraima', tariff: 0.789, distributor: 'Âmbar Energia' },
  SC: { name: 'Santa Catarina', tariff: 0.76, distributor: 'Celesc' },
  SP: { name: 'São Paulo', tariff: 0.789, distributor: 'Enel SP' },
  SE: { name: 'Sergipe', tariff: 0.755, distributor: 'Energisa SE' },
  TO: { name: 'Tocantins', tariff: 0.993, distributor: 'Energisa TO' },
}

export const UF_LIST = Object.keys(TARIFFS).sort()

export const CAPITALS = {
  'rio branco': 'AC',
  'maceio': 'AL',
  'macapa': 'AP',
  'manaus': 'AM',
  'salvador': 'BA',
  'fortaleza': 'CE',
  'brasilia': 'DF',
  'vitoria': 'ES',
  'goiania': 'GO',
  'sao luis': 'MA',
  'cuiaba': 'MT',
  'campo grande': 'MS',
  'belo horizonte': 'MG',
  'belem': 'PA',
  'joao pessoa': 'PB',
  'curitiba': 'PR',
  'recife': 'PE',
  'teresina': 'PI',
  'rio de janeiro': 'RJ',
  'natal': 'RN',
  'porto alegre': 'RS',
  'porto velho': 'RO',
  'boa vista': 'RR',
  'florianopolis': 'SC',
  'sao paulo': 'SP',
  'aracaju': 'SE',
  'palmas': 'TO',
}

export function normalizeCity(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}