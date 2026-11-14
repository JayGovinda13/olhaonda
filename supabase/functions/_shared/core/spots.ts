// Código compartilhado entre o site e as Edge Functions: dados puros, sem import.meta.env.

export type Spot = {
  id: string
  name: string
  city: string
  state: string
  lat: number
  lon: number
  /** Direção (graus) para onde a praia está voltada, ou seja, de onde vem o swell "de frente". */
  facing: number
  kind: 'beach' | 'reef' | 'point'
  /** Grupo no seletor de picos (padrão: o estado). */
  region?: string
  /** Referência para achar o pico. */
  note?: string
  /** Ajuste da altura na arrebentação para este pico (fundo, bancadas, laje). Padrão 1. */
  surfFactor?: number
  /** Praia abrigada: só quebra com swell grande ou de direção específica. */
  sheltered?: boolean
  /** Faz parte da Baixada Santista (lista de produção). */
  baixada?: boolean
  /** Porto de referência da maré (id em tidePorts.ts); padrão: o mais próximo. */
  tidePort?: string
}

/** Cidade da Baixada Santista: o grupo no seletor é só o nome da cidade; maré pelo Porto de Santos. */
const bx = (city: string) => ({ city, state: 'SP', region: city, baixada: true, tidePort: 'santos' }) as const

const G = bx('Guarujá')

/**
 * Todas as praias do Guarujá (e o The Rock, fundo de pedra), de oeste (canal de Santos) para leste (canal de Bertioga).
 * As do canal e as enseadas fechadas estão marcadas como abrigadas.
 */
const GUARUJA: Spot[] = [
  { id: 'gua-goes', name: 'Praia do Góes', ...G, lat: -23.998, lon: -46.334, facing: 300, kind: 'beach', sheltered: true },
  { id: 'gua-santacruz', name: 'Santa Cruz dos Navegantes', ...G, lat: -23.992, lon: -46.307, facing: 330, kind: 'beach', sheltered: true },
  { id: 'gua-cheiralimao', name: 'Cheira Limão', ...G, lat: -24.001, lon: -46.318, facing: 290, kind: 'beach', sheltered: true },
  { id: 'gua-sangava', name: 'Sangava', ...G, lat: -24.012, lon: -46.321, facing: 220, kind: 'beach', sheltered: true },
  { id: 'gua-monduba', name: 'Monduba', ...G, lat: -24.009, lon: -46.296, facing: 200, kind: 'beach', sheltered: true },
  { id: 'gua-guaiuba', name: 'Guaiúba', ...G, lat: -24.01811, lon: -46.29233, facing: 233, kind: 'beach' },
  // Tombo, olhando para o mar: Bostrô (canto esquerdo, lado do The Rock), Palanque (meio), Canto do Forte (direito)
  { id: 'gua-tombo-forte', name: 'Tombo - Canto do Forte', ...G, lat: -24.0163, lon: -46.276, facing: 140, kind: 'beach' },
  { id: 'gua-tombo-palanque', name: 'Tombo - Palanque', ...G, lat: -24.0147, lon: -46.2737, facing: 150, kind: 'beach' },
  { id: 'gua-tombo-bostro', name: 'Tombo - Bostrô', ...G, lat: -24.0129, lon: -46.2702, facing: 163, kind: 'beach' },
  { id: 'gua-therock', name: 'The Rock', ...G, lat: -24.013653, lon: -46.264532, facing: 185, kind: 'reef' },
  { id: 'gua-ast-cantobarcos', name: 'Astúrias - Canto dos Barcos', ...G, lat: -24.0098, lon: -46.267, facing: 50, kind: 'beach' },
  { id: 'gua-ast-beco', name: 'Astúrias - Beco', ...G, lat: -24.0073, lon: -46.2681, facing: 98, kind: 'beach' },
  { id: 'gua-ast-sobreasondas', name: 'Astúrias - Sobre as Ondas', ...G, lat: -24.0044, lon: -46.2667, facing: 125, kind: 'beach' },
  { id: 'gua-pit-avelinos', name: 'Pitangueiras - Avelinos', ...G, lat: -24.002, lon: -46.2647, facing: 140, kind: 'beach' },
  { id: 'gua-pit-ilha', name: 'Pitangueiras - Ilha', ...G, lat: -23.9984, lon: -46.2562, facing: 148, kind: 'beach' },
  { id: 'gua-pit-maluf', name: 'Pitangueiras - Maluf', ...G, lat: -23.9954, lon: -46.2518, facing: 165, kind: 'beach' },
  { id: 'gua-ens-caveira', name: 'Enseada - Caveira', ...G, lat: -23.9932, lon: -46.2478, facing: 150, kind: 'beach' },
  { id: 'gua-enseada', name: 'Enseada', ...G, lat: -23.98801, lon: -46.22994, facing: 170, kind: 'beach' },
  { id: 'gua-marcasado', name: 'Mar Casado', ...G, lat: -23.96741, lon: -46.1856, facing: 90, kind: 'beach' },
  { id: 'gua-pernambuco', name: 'Pernambuco', ...G, lat: -23.96286, lon: -46.18399, facing: 123, kind: 'beach' },
  { id: 'gua-sorocotuba', name: 'Sorocotuba', ...G, lat: -23.951, lon: -46.175, facing: 110, kind: 'beach', sheltered: true },
  { id: 'gua-eden', name: 'Praia do Éden', ...G, lat: -23.943, lon: -46.168, facing: 110, kind: 'beach', sheltered: true },
  { id: 'gua-iporanga', name: 'Iporanga', ...G, lat: -23.90234, lon: -46.15279, facing: 83, kind: 'beach' },
  { id: 'gua-saopedro', name: 'São Pedro', ...G, lat: -23.8811, lon: -46.1409, facing: 85, kind: 'beach' },
  { id: 'gua-pereque', name: 'Perequê', ...G, lat: -23.937, lon: -46.18, facing: 60, kind: 'beach', sheltered: true },
  { id: 'gua-branca', name: 'Praia Branca', ...G, lat: -23.87238, lon: -46.1385, facing: 123, kind: 'beach' },
]

/**
 * Baixada Santista: praias com onda, de sudoeste (Peruíbe) para nordeste (Bertioga).
 * Coordenadas conferidas no OpenStreetMap (nov/2026): ponto na linha d'água em frente ao bairro/praia
 * de mesmo nome, e `facing` medido pelo desenho real da costa. Iporanga pelo ponto da CETESB (meio da praia); São Pedro estimado pela enseada ao norte do Iporanga (confirmar).
 * Pitangueiras (Avelinos, Ilha, Maluf) e Astúrias (Canto dos Barcos, Sobre as Ondas, Beco) divididas por pico.
 */
const PERUIBE = bx('Peruíbe')
const ITANHAEM = bx('Itanhaém')
const MONGAGUA = bx('Mongaguá')
const PG = bx('Praia Grande')
const SV = bx('São Vicente')
const SANTOS = bx('Santos')
const BERTIOGA = bx('Bertioga')

const BAIXADA_SUL: Spot[] = [
  { id: 'per-guarau', name: 'Guaraú', ...PERUIBE, lat: -24.36969, lon: -47.01174, facing: 123, kind: 'beach' },
  { id: 'per-centro', name: 'Peruíbe - Centro', ...PERUIBE, lat: -24.32431, lon: -46.99382, facing: 133, kind: 'beach' },
  { id: 'ita-cibratel', name: 'Cibratel', ...ITANHAEM, lat: -24.21523, lon: -46.83964, facing: 145, kind: 'beach' },
  { id: 'ita-sonhos', name: 'Praia dos Sonhos', ...ITANHAEM, lat: -24.1912, lon: -46.79254, facing: 131, kind: 'beach' },
  { id: 'ita-suarao', name: 'Praião - Suarão', ...ITANHAEM, lat: -24.16681, lon: -46.74959, facing: 150, kind: 'beach' },
  { id: 'mon-veracruz', name: 'Vera Cruz', ...MONGAGUA, lat: -24.10477, lon: -46.63621, facing: 150, kind: 'beach' },
  { id: 'mon-agenor', name: 'Agenor de Campos', ...MONGAGUA, lat: -24.13201, lon: -46.68809, facing: 148, kind: 'beach' },
  { id: 'mon-centro', name: 'Praia do Pier', ...MONGAGUA, lat: -24.09782, lon: -46.62199, facing: 153, kind: 'beach' },
  { id: 'mon-riomongagua', name: 'Rio Mongaguá', ...MONGAGUA, lat: -24.0962, lon: -46.6178, facing: 153, kind: 'beach' },
  { id: 'pg-solemar', name: 'Solemar', ...PG, lat: -24.07991, lon: -46.58556, facing: 150, kind: 'beach' },
  { id: 'pg-caicara', name: 'Caiçara', ...PG, lat: -24.05176, lon: -46.52507, facing: 155, kind: 'beach' },
  { id: 'pg-ocian', name: 'Ocian', ...PG, lat: -24.03054, lon: -46.47406, facing: 160, kind: 'beach' },
  { id: 'pg-tupi', name: 'Tupi', ...PG, lat: -24.02485, lon: -46.45764, facing: 158, kind: 'beach' },
  { id: 'pg-aviacao', name: 'Aviação', ...PG, lat: -24.02034, lon: -46.44285, facing: 163, kind: 'beach' },
  { id: 'pg-guilhermina', name: 'Guilhermina', ...PG, lat: -24.01596, lon: -46.42592, facing: 170, kind: 'beach' },
  { id: 'pg-boqueirao', name: 'Boqueirão', ...PG, lat: -24.01487, lon: -46.41443, facing: 180, kind: 'beach' },
  { id: 'pg-cantodoforte', name: 'Canto do Forte', ...PG, lat: -24.01621, lon: -46.40514, facing: 197, kind: 'beach' },
  { id: 'sv-itaquitanduva', name: 'Itaquitanduva', ...SV, lat: -23.9978, lon: -46.3923, facing: 125, kind: 'beach' },
  { id: 'san-divisa', name: 'Divisa', ...SANTOS, lat: -23.97033, lon: -46.356, facing: 183, kind: 'beach' },
  { id: 'sv-itarare', name: 'Itararé', ...SV, lat: -23.97133, lon: -46.36122, facing: 163, kind: 'beach' },
  { id: 'san-josemenino', name: 'José Menino - Quebra-Mar', ...SANTOS, lat: -23.97039, lon: -46.34932, facing: 170, kind: 'beach' },
  { id: 'san-pompeia', name: 'Pompéia', ...SANTOS, lat: -23.97061, lon: -46.34183, facing: 185, kind: 'beach' },
  { id: 'san-gonzaga', name: 'Gonzaga', ...SANTOS, lat: -23.97178, lon: -46.33381, facing: 192, kind: 'beach' },
  { id: 'san-boqueirao', name: 'Boqueirão', ...SANTOS, lat: -23.97397, lon: -46.32614, facing: 200, kind: 'beach' },
  { id: 'san-embare', name: 'Embaré', ...SANTOS, lat: -23.97711, lon: -46.31991, facing: 205, kind: 'beach' },
  { id: 'san-aparecida', name: 'Aparecida', ...SANTOS, lat: -23.98252, lon: -46.31321, facing: 215, kind: 'beach' },
]

const BAIXADA_NORTE: Spot[] = [
  { id: 'ber-enseada', name: 'Enseada', ...BERTIOGA, lat: -23.82718, lon: -46.10173, facing: 155, kind: 'beach' },
  { id: 'ber-vistalinda', name: 'Vista Linda', ...BERTIOGA, lat: -23.81719, lon: -46.0769, facing: 160, kind: 'beach' },
  { id: 'ber-indaia', name: 'Indaiá', ...BERTIOGA, lat: -23.81372, lon: -46.05974, facing: 185, kind: 'beach' },
  { id: 'ber-riviera', name: 'Riviera de São Lourenço', ...BERTIOGA, lat: -23.80338, lon: -46.02007, facing: 158, kind: 'beach' },
  { id: 'ber-itaguare', name: 'Itaguaré', ...BERTIOGA, lat: -23.78944, lon: -45.98531, facing: 155, kind: 'beach' },
  { id: 'ber-guaratuba', name: 'Guaratuba', ...BERTIOGA, lat: -23.77641, lon: -45.94927, facing: 165, kind: 'beach' },
  { id: 'ber-boraceia', name: 'Boracéia', ...BERTIOGA, lat: -23.75867, lon: -45.85189, facing: 173, kind: 'beach' },
]

/** Cidade do litoral paulista fora da Baixada: grupo = cidade; maré pelo porto mais próximo. */
const sp = (city: string, tidePort: string) => ({ city, state: 'SP', region: city, tidePort }) as const
const IGUAPE = sp('Iguape', 'cananeia')
const ILHA_COMPRIDA = sp('Ilha Comprida', 'cananeia')
const SSE = sp('São Sebastião', 'saosebastiao')
const ILHABELA = sp('Ilhabela', 'saosebastiao')
const CARAGUA = sp('Caraguatatuba', 'saosebastiao')
const UBATUBA = sp('Ubatuba', 'ubatuba')

/**
 * Litoral Sul (Vale do Ribeira): Juréia e Ilha Comprida, mar aberto de frente para sudeste.
 * Posições pelo OpenStreetMap (nov/2026), linha d'água; `facing` medido pela costa.
 */
const LITORAL_SUL: Spot[] = [
  { id: 'ico-boqueiraosul', name: 'Ilha Comprida - Boqueirão Sul', ...ILHA_COMPRIDA, lat: -25.03, lon: -47.862, facing: 135, kind: 'beach' },
  { id: 'ico-juruvauva', name: 'Ilha Comprida - Juruvaúva', ...ILHA_COMPRIDA, lat: -24.948, lon: -47.811, facing: 135, kind: 'beach' },
  { id: 'ico-pedrinhas', name: 'Ilha Comprida - Pedrinhas', ...ILHA_COMPRIDA, lat: -24.902, lon: -47.765, facing: 135, kind: 'beach' },
  { id: 'ico-adriana', name: 'Ilha Comprida - Adriana', ...ILHA_COMPRIDA, lat: -24.76556, lon: -47.57411, facing: 145, kind: 'beach' },
  { id: 'ico-centro', name: 'Ilha Comprida - Centro', ...ILHA_COMPRIDA, lat: -24.74973, lon: -47.54855, facing: 145, kind: 'beach' },
  { id: 'ico-boqueirao', name: 'Ilha Comprida - Boqueirão Norte', ...ILHA_COMPRIDA, lat: -24.70857, lon: -47.47264, facing: 148, kind: 'beach' },
  { id: 'igu-una', name: 'Praia do Una', ...IGUAPE, note: 'Juréia', lat: -24.44275, lon: -47.06987, facing: 145, kind: 'beach' },
]

/**
 * Litoral Norte, de Bertioga para o Rio de Janeiro: costa sul de São Sebastião, Ilhabela,
 * Caraguatatuba e Ubatuba. Posições conferidas no OpenStreetMap (nov/2026).
 */
const LITORAL_NORTE: Spot[] = [
  { id: 'sse-boraceia', name: 'Boracéia', ...SSE, lat: -23.7605, lon: -45.806, facing: 190, kind: 'beach' },
  { id: 'sse-engenho', name: 'Engenho', ...SSE, lat: -23.76437, lon: -45.781, facing: 175, kind: 'beach' },
  { id: 'sse-barradouna', name: 'Barra do Una', ...SSE, lat: -23.76279, lon: -45.76399, facing: 185, kind: 'beach' },
  { id: 'sse-jureia', name: 'Juréia', ...SSE, lat: -23.76751, lon: -45.74523, facing: 175, kind: 'beach' },
  { id: 'sse-juquehy', name: 'Juquehy', ...SSE, lat: -23.76961, lon: -45.72787, facing: 190, kind: 'beach' },
  { id: 'sse-preta', name: 'Praia Preta', ...SSE, lat: -23.7732, lon: -45.7164, facing: 168, kind: 'beach' },
  { id: 'sse-sahy', name: 'Barra do Sahy', ...SSE, lat: -23.77385, lon: -45.69714, facing: 205, kind: 'beach' },
  { id: 'sse-baleia', name: 'Baleia', ...SSE, lat: -23.77487, lon: -45.67284, facing: 188, kind: 'beach' },
  { id: 'sse-camburi', name: 'Camburi', ...SSE, lat: -23.7785, lon: -45.6525, facing: 170, kind: 'beach' },
  { id: 'sse-camburizinho', name: 'Camburizinho', ...SSE, lat: -23.77758, lon: -45.64373, facing: 190, kind: 'beach' },
  { id: 'sse-boicucanga', name: 'Boiçucanga', ...SSE, lat: -23.7845, lon: -45.632, facing: 195, kind: 'beach' },
  { id: 'sse-brava', name: 'Praia Brava', ...SSE, lat: -23.7987, lon: -45.609, facing: 180, kind: 'beach' },
  { id: 'sse-maresias', name: 'Maresias', ...SSE, lat: -23.7918, lon: -45.5621, facing: 190, kind: 'beach' },
  { id: 'sse-pauba', name: 'Paúba', ...SSE, lat: -23.8026, lon: -45.55268, facing: 230, kind: 'beach' },
  { id: 'sse-santiago', name: 'Santiago', ...SSE, lat: -23.81037, lon: -45.54243, facing: 213, kind: 'beach' },
  { id: 'sse-toquetoquepequeno', name: 'Toque-Toque Pequeno', ...SSE, lat: -23.81788, lon: -45.5348, facing: 235, kind: 'beach' },
  { id: 'sse-toquetoquegrande', name: 'Toque-Toque Grande', ...SSE, lat: -23.83334, lon: -45.51142, facing: 200, kind: 'beach' },
  { id: 'sse-guaeca', name: 'Guaecá', ...SSE, lat: -23.82106, lon: -45.46079, facing: 205, kind: 'beach' },
  { id: 'ilb-bonete', name: 'Bonete', ...ILHABELA, lat: -23.91742, lon: -45.34513, facing: 200, kind: 'beach' },
  { id: 'ilb-castelhanos', name: 'Castelhanos', ...ILHABELA, lat: -23.85814, lon: -45.28894, facing: 95, kind: 'beach' },
  { id: 'car-centro', name: 'Praia do Centro', ...CARAGUA, lat: -23.62466, lon: -45.40809, facing: 145, kind: 'beach' },
  { id: 'car-martimdesa', name: 'Martim de Sá', ...CARAGUA, lat: -23.62485, lon: -45.379, facing: 155, kind: 'beach' },
  { id: 'car-massaguacu', name: 'Massaguaçu', ...CARAGUA, lat: -23.58511, lon: -45.32892, facing: 140, kind: 'beach' },
  { id: 'car-tabatinga', name: 'Tabatinga', ...CARAGUA, lat: -23.57422, lon: -45.27851, facing: 210, kind: 'beach' },
  { id: 'uba-cedro', name: 'Cedro', ...UBATUBA, lat: -23.521, lon: -45.1655, facing: 85, kind: 'beach' },
  { id: 'uba-sape', name: 'Sapê', ...UBATUBA, lat: -23.52424, lon: -45.21167, facing: 145, kind: 'beach' },
  { id: 'uba-lagoinha', name: 'Lagoinha', ...UBATUBA, lat: -23.52041, lon: -45.20054, facing: 173, kind: 'beach' },
  { id: 'uba-sununga', name: 'Sununga', ...UBATUBA, lat: -23.50996, lon: -45.1318, facing: 205, kind: 'beach' },
  { id: 'uba-lazaro', name: 'Lázaro', ...UBATUBA, lat: -23.50222, lon: -45.13678, facing: 210, kind: 'beach' },
  { id: 'uba-enseada', name: 'Enseada', ...UBATUBA, lat: -23.49276, lon: -45.09174, facing: 190, kind: 'beach' },
  { id: 'uba-toninhas', name: 'Toninhas', ...UBATUBA, lat: -23.48749, lon: -45.07414, facing: 100, kind: 'beach' },
  { id: 'uba-grande', name: 'Praia Grande', ...UBATUBA, lat: -23.4706, lon: -45.065, facing: 128, kind: 'beach' },
  { id: 'uba-tenorio', name: 'Tenório', ...UBATUBA, lat: -23.465, lon: -45.05681, facing: 153, kind: 'beach' },
  { id: 'uba-vermelhacentro', name: 'Vermelha do Centro', ...UBATUBA, lat: -23.4612, lon: -45.0465, facing: 145, kind: 'beach' },
  { id: 'uba-vermelhanorte', name: 'Vermelha do Norte', ...UBATUBA, lat: -23.417, lon: -45.0378, facing: 130, kind: 'beach' },
  { id: 'uba-itamambuca', name: 'Itamambuca', ...UBATUBA, lat: -23.40164, lon: -45.00186, facing: 145, kind: 'beach' },
  { id: 'uba-felix', name: 'Félix', ...UBATUBA, note: 'Onda no canto esquerdo', lat: -23.3868, lon: -44.9712, facing: 140, kind: 'beach' },
  { id: 'uba-prumirim', name: 'Prumirim', ...UBATUBA, lat: -23.37914, lon: -44.95635, facing: 170, kind: 'beach' },
  { id: 'uba-puruba', name: 'Puruba', ...UBATUBA, lat: -23.3538, lon: -44.93073, facing: 163, kind: 'beach' },
  { id: 'uba-ubatumirim', name: 'Ubatumirim', ...UBATUBA, lat: -23.33555, lon: -44.90058, facing: 195, kind: 'beach' },
  { id: 'uba-fazenda', name: 'Fazenda', ...UBATUBA, note: 'Picinguaba', lat: -23.3625, lon: -44.847, facing: 205, kind: 'beach' },
  { id: 'uba-bravacamburi', name: 'Brava do Camburi', ...UBATUBA, lat: -23.3708, lon: -44.8058, facing: 150, kind: 'beach' },
]

/** Cidade de Santa Catarina: grupo no seletor = cidade; maré pelo porto de referência da região. */
const sc = (city: string, tidePort: string) => ({ city, state: 'SC', region: city, tidePort }) as const
const SC_PDT = sc('Passo de Torres', 'imbituba')
const SC_GAI = sc('Balneário Gaivota', 'imbituba')
const SC_AAS = sc('Balneário Arroio do Silva', 'imbituba')
const SC_ARA = sc('Araranguá', 'imbituba')
const SC_RIN = sc('Balneário Rincão', 'imbituba')
const SC_JAG = sc('Jaguaruna', 'imbituba')
const SC_LAG = sc('Laguna', 'imbituba')
const SC_IMB = sc('Imbituba', 'imbituba')
const SC_GAR = sc('Garopaba', 'florianopolis')
const SC_PLO = sc('Paulo Lopes', 'florianopolis')
const SC_PAL = sc('Palhoça', 'florianopolis')
const SC_FLN = sc('Florianópolis', 'florianopolis')
const SC_GCR = sc('Governador Celso Ramos', 'florianopolis')
const SC_TIJ = sc('Tijucas', 'itajai')
const SC_BOM = sc('Bombinhas', 'itajai')
const SC_PTB = sc('Porto Belo', 'itajai')
const SC_ITM = sc('Itapema', 'itajai')
const SC_BC = sc('Balneário Camboriú', 'itajai')
const SC_ITJ = sc('Itajaí', 'itajai')
const SC_NAV = sc('Navegantes', 'itajai')
const SC_PEN = sc('Penha', 'itajai')
const SC_PIC = sc('Balneário Piçarras', 'itajai')
const SC_BVE = sc('Barra Velha', 'itajai')
const SC_ARQ = sc('Araquari', 'saofranciscodosul')
const SC_BBS = sc('Balneário Barra do Sul', 'saofranciscodosul')
const SC_SFS = sc('São Francisco do Sul', 'saofranciscodosul')
const SC_ITP = sc('Itapoá', 'saofranciscodosul')

/** Litoral de Santa Catarina, de Passo de Torres (divisa com o RS) a Itapoá (divisa com o PR). */
const SANTA_CATARINA: Spot[] = [
  { id: 'pdt-molhes', name: 'Molhes', ...SC_PDT, lat: -29.3213, lon: -49.7116, facing: 125, kind: 'beach' },
  { id: 'pdt-bellatorres', name: 'Bella Torres', ...SC_PDT, lat: -29.2915, lon: -49.6898, facing: 125, kind: 'beach' },
  { id: 'pdt-rosadomar', name: 'Rosa do Mar', ...SC_PDT, lat: -29.2549, lon: -49.6592, facing: 128, kind: 'beach' },
  { id: 'gai-gaivota', name: 'Balneário Gaivota', ...SC_GAI, lat: -29.1591, lon: -49.5748, facing: 130, kind: 'beach' },
  { id: 'aas-arroio', name: 'Arroio do Silva', ...SC_AAS, lat: -28.9879, lon: -49.4104, facing: 133, kind: 'beach' },
  { id: 'ara-conventos', name: 'Morro dos Conventos', ...SC_ARA, lat: -28.9445, lon: -49.3631, facing: 135, kind: 'beach' },
  { id: 'rin-rincao', name: 'Rincão', ...SC_RIN, lat: -28.8271, lon: -49.2194, facing: 140, kind: 'beach' },
  { id: 'jag-esplanada', name: 'Balneário Esplanada', ...SC_JAG, lat: -28.757, lon: -49.112, facing: 140, kind: 'beach' },
  { id: 'jag-campobom', name: 'Campo Bom', ...SC_JAG, lat: -28.718, lon: -49.056, facing: 140, kind: 'beach' },
  { id: 'jag-jaguaruna', name: 'Jaguaruna', ...SC_JAG, lat: -28.6958, lon: -49.0169, facing: 140, kind: 'beach' },
  { id: 'jag-camacho', name: 'Camacho', ...SC_JAG, lat: -28.6192, lon: -48.867, facing: 145, kind: 'beach' },
  { id: 'jag-cigana', name: 'Cigana', ...SC_JAG, lat: -28.612, lon: -48.852, facing: 150, kind: 'beach' },
  { id: 'jag-farol', name: 'Farol de Santa Marta', ...SC_JAG, lat: -28.6014, lon: -48.8171, facing: 120, kind: 'beach' },
  { id: 'lag-cardoso', name: 'Cardoso', ...SC_LAG, lat: -28.6062, lon: -48.8234, facing: 135, kind: 'beach' },
  { id: 'lag-prainha', name: 'Prainha', ...SC_LAG, lat: -28.6022, lon: -48.8166, facing: 120, kind: 'beach' },
  { id: 'lag-santamarta', name: 'Santa Marta', ...SC_LAG, lat: -28.578, lon: -48.808, facing: 130, kind: 'beach' },
  { id: 'lag-cavalinho', name: 'Cavalinho', ...SC_LAG, lat: -28.5416, lon: -48.7739, facing: 130, kind: 'beach' },
  { id: 'lag-tereza', name: 'Tereza', ...SC_LAG, lat: -28.5251, lon: -48.7633, facing: 120, kind: 'beach' },
  { id: 'lag-margrosso', name: 'Mar Grosso', ...SC_LAG, lat: -28.4832, lon: -48.7654, facing: 95, kind: 'beach' },
  { id: 'lag-galheta', name: 'Galheta', ...SC_LAG, lat: -28.4696, lon: -48.7659, facing: 93, kind: 'beach' },
  { id: 'lag-ypua', name: 'Ypuã', ...SC_LAG, lat: -28.4452, lon: -48.7586, facing: 115, kind: 'beach' },
  { id: 'lag-ravena', name: 'Ravena', ...SC_LAG, lat: -28.3986, lon: -48.7441, facing: 105, kind: 'beach' },
  { id: 'imb-itapirubasul', name: 'Itapirubá Sul', ...SC_IMB, lat: -28.341, lon: -48.708, facing: 115, kind: 'beach' },
  { id: 'imb-itapirubanorte', name: 'Itapirubá Norte', ...SC_IMB, lat: -28.322, lon: -48.703, facing: 120, kind: 'beach' },
  { id: 'imb-dagua', name: 'Praia D\'Água', ...SC_IMB, lat: -28.2588, lon: -48.6769, facing: 128, kind: 'beach' },
  { id: 'imb-vila', name: 'Praia da Vila (Castelinho)', ...SC_IMB, lat: -28.2437, lon: -48.6615, facing: 110, kind: 'beach' },
  { id: 'imb-porto', name: 'Praia do Porto', ...SC_IMB, lat: -28.2233, lon: -48.6638, facing: 90, kind: 'beach' },
  { id: 'imb-ribanceira', name: 'Ribanceira', ...SC_IMB, lat: -28.1908, lon: -48.6626, facing: 95, kind: 'beach' },
  { id: 'imb-luz', name: 'Praia do Luz', ...SC_IMB, lat: -28.1795, lon: -48.662, facing: 100, kind: 'beach' },
  { id: 'imb-ibiraquera', name: 'Ibiraquera', ...SC_IMB, lat: -28.1594, lon: -48.6542, facing: 113, kind: 'beach' },
  { id: 'imb-rosa', name: 'Praia do Rosa', ...SC_IMB, lat: -28.1298, lon: -48.6415, facing: 108, kind: 'beach' },
  { id: 'gar-ouvidor', name: 'Ouvidor', ...SC_GAR, lat: -28.1032, lon: -48.6338, facing: 128, kind: 'beach' },
  { id: 'gar-vermelha', name: 'Praia Vermelha', ...SC_GAR, lat: -28.0886, lon: -48.6311, facing: 110, kind: 'beach' },
  { id: 'gar-ferrugem', name: 'Ferrugem', ...SC_GAR, lat: -28.0743, lon: -48.6246, facing: 130, kind: 'beach' },
  { id: 'gar-silveira', name: 'Silveira', ...SC_GAR, lat: -28.0422, lon: -48.6097, facing: 100, kind: 'point' },
  { id: 'gar-centro', name: 'Garopaba - Centro', ...SC_GAR, lat: -28.0215, lon: -48.62, facing: 40, kind: 'beach' },
  { id: 'gar-barra', name: 'Praia da Barra', ...SC_GAR, lat: -28.0205, lon: -48.6145, facing: 20, kind: 'beach' },
  { id: 'gar-siriu', name: 'Siriú', ...SC_GAR, lat: -27.9763, lon: -48.6285, facing: 108, kind: 'beach' },
  { id: 'gar-gamboa', name: 'Gamboa', ...SC_GAR, lat: -27.9572, lon: -48.6256, facing: 100, kind: 'beach' },
  { id: 'plo-guarda', name: 'Guarda do Embaú', ...SC_PLO, lat: -27.9054, lon: -48.588, facing: 130, kind: 'beach' },
  { id: 'pal-prainhaguarda', name: 'Prainha da Guarda', ...SC_PAL, lat: -27.9082, lon: -48.591, facing: 120, kind: 'beach' },
  { id: 'pal-pinheira', name: 'Pinheira', ...SC_PAL, lat: -27.8661, lon: -48.6017, facing: 75, kind: 'beach' },
  { id: 'pal-cima', name: 'Praia de Cima', ...SC_PAL, lat: -27.8546, lon: -48.5802, facing: 60, kind: 'beach' },
  { id: 'fln-naufragados', name: 'Naufragados', ...SC_FLN, lat: -27.8338, lon: -48.5647, facing: 170, kind: 'beach' },
  { id: 'fln-saquinho', name: 'Saquinho', ...SC_FLN, lat: -27.8071, lon: -48.5352, facing: 88, kind: 'beach' },
  { id: 'fln-solidao', name: 'Solidão', ...SC_FLN, lat: -27.7916, lon: -48.5314, facing: 125, kind: 'beach' },
  { id: 'fln-acores', name: 'Açores', ...SC_FLN, lat: -27.7835, lon: -48.5224, facing: 150, kind: 'beach' },
  { id: 'fln-lagoinhaleste', name: 'Lagoinha do Leste', ...SC_FLN, lat: -27.773, lon: -48.4858, facing: 123, kind: 'beach' },
  { id: 'fln-matadeiro', name: 'Matadeiro', ...SC_FLN, lat: -27.7564, lon: -48.4973, facing: 60, kind: 'beach' },
  { id: 'fln-armacao', name: 'Armação', ...SC_FLN, lat: -27.7477, lon: -48.5059, facing: 80, kind: 'beach' },
  { id: 'fln-morrodaspedras', name: 'Morro das Pedras', ...SC_FLN, lat: -27.7116, lon: -48.5004, facing: 115, kind: 'beach' },
  { id: 'fln-areiascampeche', name: 'Areias do Campeche', ...SC_FLN, lat: -27.6976, lon: -48.4899, facing: 115, kind: 'beach' },
  { id: 'fln-campeche', name: 'Campeche', ...SC_FLN, lat: -27.6862, lon: -48.4809, facing: 112, kind: 'beach' },
  { id: 'fln-novocampeche', name: 'Novo Campeche', ...SC_FLN, lat: -27.6662, lon: -48.4756, facing: 112, kind: 'beach' },
  { id: 'fln-joaquina', name: 'Joaquina', ...SC_FLN, lat: -27.6297, lon: -48.4496, facing: 125, kind: 'beach' },
  { id: 'fln-mole', name: 'Praia Mole', ...SC_FLN, lat: -27.603, lon: -48.4331, facing: 120, kind: 'beach' },
  { id: 'fln-galheta', name: 'Galheta', ...SC_FLN, lat: -27.594, lon: -48.4271, facing: 110, kind: 'beach' },
  { id: 'fln-barradalagoa', name: 'Barra da Lagoa', ...SC_FLN, lat: -27.5734, lon: -48.4251, facing: 60, kind: 'beach' },
  { id: 'fln-mocambique', name: 'Moçambique', ...SC_FLN, lat: -27.5011, lon: -48.4015, facing: 110, kind: 'beach' },
  { id: 'fln-aranhas', name: 'Canto das Aranhas', ...SC_FLN, lat: -27.476, lon: -48.391, facing: 105, kind: 'beach' },
  { id: 'fln-santinho', name: 'Santinho', ...SC_FLN, lat: -27.463, lon: -48.3769, facing: 100, kind: 'beach' },
  { id: 'fln-jurere', name: 'Jurerê', ...SC_FLN, lat: -27.4372, lon: -48.4968, facing: 8, kind: 'beach' },
  { id: 'fln-ingleses', name: 'Ingleses', ...SC_FLN, lat: -27.4338, lon: -48.3925, facing: 45, kind: 'beach' },
  { id: 'fln-canajure', name: 'Canajurê', ...SC_FLN, lat: -27.4317, lon: -48.4789, facing: 5, kind: 'beach' },
  { id: 'fln-brava', name: 'Praia Brava', ...SC_FLN, lat: -27.3971, lon: -48.4138, facing: 60, kind: 'beach' },
  { id: 'fln-lagoinhanorte', name: 'Lagoinha do Norte', ...SC_FLN, lat: -27.3893, lon: -48.425, facing: 10, kind: 'beach' },
  { id: 'gcr-grande', name: 'Praia Grande', ...SC_GCR, lat: -27.3625, lon: -48.5356, facing: 70, kind: 'beach' },
  { id: 'gcr-palmas', name: 'Palmas', ...SC_GCR, lat: -27.3278, lon: -48.5367, facing: 63, kind: 'beach' },
  { id: 'tij-tijucas', name: 'Tijucas', ...SC_TIJ, lat: -27.245, lon: -48.613, facing: 85, kind: 'beach' },
  { id: 'bom-conceicao', name: 'Conceição', ...SC_BOM, lat: -27.2023, lon: -48.4912, facing: 110, kind: 'beach' },
  { id: 'bom-cantogrande', name: 'Canto Grande - Mar de Fora', ...SC_BOM, lat: -27.1945, lon: -48.4972, facing: 100, kind: 'beach' },
  { id: 'bom-mariscal', name: 'Mariscal', ...SC_BOM, lat: -27.1734, lon: -48.4991, facing: 100, kind: 'beach' },
  { id: 'bom-quatroilhas', name: 'Quatro Ilhas', ...SC_BOM, lat: -27.1541, lon: -48.4829, facing: 100, kind: 'beach' },
  { id: 'bom-bombinhas', name: 'Bombinhas', ...SC_BOM, lat: -27.1484, lon: -48.4876, facing: 20, kind: 'beach' },
  { id: 'bom-retiro', name: 'Retiro dos Padres', ...SC_BOM, lat: -27.1451, lon: -48.4768, facing: 20, kind: 'beach' },
  { id: 'bom-bombas', name: 'Bombas', ...SC_BOM, lat: -27.1406, lon: -48.5073, facing: 50, kind: 'beach' },
  { id: 'ptb-pereque', name: 'Perequê', ...SC_PTB, lat: -27.1521, lon: -48.5723, facing: 30, kind: 'beach' },
  { id: 'itm-cabeco', name: 'Cabeço', ...SC_ITM, lat: -27.132, lon: -48.599, facing: 45, kind: 'beach' },
  { id: 'itm-meiapraia', name: 'Meia Praia', ...SC_ITM, lat: -27.12, lon: -48.609, facing: 60, kind: 'beach' },
  { id: 'itm-centro', name: 'Itapema - Centro', ...SC_ITM, lat: -27.0947, lon: -48.6121, facing: 100, kind: 'beach' },
  { id: 'itm-mato', name: 'Mato de Camboriú', ...SC_ITM, lat: -27.08, lon: -48.59, facing: 83, kind: 'beach' },
  { id: 'itm-grossa', name: 'Praia Grossa', ...SC_ITM, lat: -27.0716, lon: -48.5935, facing: 70, kind: 'beach' },
  { id: 'itm-ilhota', name: 'Ilhota', ...SC_ITM, lat: -27.0628, lon: -48.5941, facing: 100, kind: 'beach' },
  { id: 'bc-estaleirinho', name: 'Estaleirinho', ...SC_BC, lat: -27.0495, lon: -48.5876, facing: 93, kind: 'beach' },
  { id: 'bc-estaleiro', name: 'Estaleiro', ...SC_BC, lat: -27.0322, lon: -48.5815, facing: 95, kind: 'beach' },
  { id: 'bc-buraco', name: 'Praia do Buraco', ...SC_BC, lat: -27.0026, lon: -48.6046, facing: 40, kind: 'beach' },
  { id: 'bc-central', name: 'Balneário Camboriú - Central', ...SC_BC, lat: -26.9911, lon: -48.6283, facing: 68, kind: 'beach' },
  { id: 'itj-brava', name: 'Praia Brava', ...SC_ITJ, lat: -26.9489, lon: -48.6288, facing: 95, kind: 'beach' },
  { id: 'itj-solidao', name: 'Solidão', ...SC_ITJ, lat: -26.935, lon: -48.6268, facing: 100, kind: 'beach' },
  { id: 'itj-cabecudas', name: 'Cabeçudas', ...SC_ITJ, lat: -26.9275, lon: -48.6329, facing: 50, kind: 'beach' },
  { id: 'itj-atalaia', name: 'Atalaia', ...SC_ITJ, lat: -26.9186, lon: -48.642, facing: 53, kind: 'beach' },
  { id: 'nav-molhes', name: 'Molhes do Pontal', ...SC_NAV, lat: -26.9041, lon: -48.6425, facing: 88, kind: 'beach' },
  { id: 'nav-centro', name: 'Navegantes - Centro', ...SC_NAV, lat: -26.9012, lon: -48.6433, facing: 100, kind: 'beach' },
  { id: 'nav-gravata', name: 'Gravatá', ...SC_NAV, lat: -26.8354, lon: -48.6281, facing: 108, kind: 'beach' },
  { id: 'pen-vermelha', name: 'Praia Vermelha', ...SC_PEN, lat: -26.8033, lon: -48.5972, facing: 95, kind: 'beach' },
  { id: 'pen-armacao', name: 'Armação', ...SC_PEN, lat: -26.7903, lon: -48.6148, facing: 30, kind: 'beach' },
  { id: 'pen-saudade', name: 'Saudade', ...SC_PEN, lat: -26.789, lon: -48.606, facing: 20, kind: 'beach' },
  { id: 'pen-grande', name: 'Praia Grande', ...SC_PEN, lat: -26.7811, lon: -48.5973, facing: 50, kind: 'beach' },
  { id: 'pen-quilombo', name: 'Quilombo', ...SC_PEN, lat: -26.7732, lon: -48.6383, facing: 20, kind: 'beach' },
  { id: 'pen-alegre', name: 'Praia Alegre', ...SC_PEN, lat: -26.7726, lon: -48.6547, facing: 20, kind: 'beach' },
  { id: 'pic-centro', name: 'Piçarras - Centro', ...SC_PIC, lat: -26.7635, lon: -48.6713, facing: 75, kind: 'beach' },
  { id: 'pic-jacques', name: 'Ponta do Jacques', ...SC_PIC, lat: -26.735, lon: -48.676, facing: 90, kind: 'point' },
  { id: 'bve-itajuba', name: 'Itajubá', ...SC_BVE, lat: -26.7042, lon: -48.6812, facing: 93, kind: 'beach' },
  { id: 'bve-cerro', name: 'Praia do Cerro', ...SC_BVE, lat: -26.7032, lon: -48.6816, facing: 100, kind: 'beach' },
  { id: 'bve-grant', name: 'Praia do Grant', ...SC_BVE, lat: -26.665, lon: -48.6867, facing: 98, kind: 'beach' },
  { id: 'bve-costao', name: 'Costão', ...SC_BVE, lat: -26.6461, lon: -48.6833, facing: 100, kind: 'beach' },
  { id: 'bve-central', name: 'Praia Central', ...SC_BVE, lat: -26.6346, lon: -48.6811, facing: 113, kind: 'beach' },
  { id: 'bve-barrinha', name: 'Barrinha', ...SC_BVE, lat: -26.6111, lon: -48.6758, facing: 108, kind: 'beach' },
  { id: 'arq-itapocu', name: 'Barra do Itapocu', ...SC_ARQ, lat: -26.585, lon: -48.664, facing: 95, kind: 'beach' },
  { id: 'bbs-bispo', name: 'Praia do Bispo', ...SC_BBS, lat: -26.469, lon: -48.6083, facing: 100, kind: 'beach' },
  { id: 'sfs-grande', name: 'Praia Grande', ...SC_SFS, lat: -26.2963, lon: -48.539, facing: 118, kind: 'beach' },
  { id: 'sfs-prainha', name: 'Prainha', ...SC_SFS, lat: -26.2309, lon: -48.5008, facing: 118, kind: 'beach' },
  { id: 'sfs-enseada', name: 'Enseada', ...SC_SFS, lat: -26.2261, lon: -48.5061, facing: 60, kind: 'beach' },
  { id: 'sfs-petrobras', name: 'Praia da Petrobras', ...SC_SFS, lat: -26.2183, lon: -48.493, facing: 75, kind: 'beach' },
  { id: 'itp-itapoa', name: 'Itapoá', ...SC_ITP, lat: -26.115, lon: -48.616, facing: 80, kind: 'beach' },
  { id: 'itp-itapema', name: 'Itapema do Norte', ...SC_ITP, lat: -26.0694, lon: -48.6071, facing: 80, kind: 'beach' },
  { id: 'itp-barradosai', name: 'Barra do Saí', ...SC_ITP, lat: -25.972, lon: -48.598, facing: 80, kind: 'beach' },
]

/** Cidade do Rio de Janeiro (estado): grupo no seletor = cidade; maré pelo porto de referência da região. */
const rj = (city: string, tidePort: string) => ({ city, state: 'RJ', region: city, tidePort }) as const
const RJ_PTY = rj('Paraty', 'angra')
const RJ_AGR = rj('Angra dos Reis', 'angra')
const RJ_ILG = rj('Ilha Grande', 'angra')
const RJ_MGT = rj('Mangaratiba', 'angra')
const RJ_ITG = rj('Itaguaí', 'angra')
const RJ_RIO = rj('Rio de Janeiro', 'ilhafiscal')
const RJ_NIT = rj('Niterói', 'ilhafiscal')
const RJ_MRC = rj('Maricá', 'ilhafiscal')
const RJ_SQR = rj('Saquarema', 'cabofrio')
const RJ_ARR = rj('Araruama', 'cabofrio')
const RJ_ARC = rj('Arraial do Cabo', 'cabofrio')
const RJ_CBF = rj('Cabo Frio', 'cabofrio')
const RJ_BZS = rj('Armação dos Búzios', 'cabofrio')
const RJ_CAS = rj('Casimiro de Abreu', 'cabofrio')
const RJ_RDO = rj('Rio das Ostras', 'macae')
const RJ_MAC = rj('Macaé', 'macae')
const RJ_CRP = rj('Carapebus', 'macae')
const RJ_QSS = rj('Quissamã', 'macae')
const RJ_CMP = rj('Campos dos Goytacazes', 'macae')
const RJ_SJB = rj('São João da Barra', 'macae')
const RJ_SFI = rj('São Francisco de Itabapoana', 'macae')

/** Litoral do Rio de Janeiro, de Paraty (divisa com SP) a São Francisco de Itabapoana (divisa com o ES). */
const RIO_DE_JANEIRO: Spot[] = [
  { id: 'pty-trindade', name: 'Praia Brava de Trindade', ...RJ_PTY, lat: -23.3444, lon: -44.7133, facing: 150, kind: 'beach' },
  { id: 'pty-cepilho', name: 'Cepilho', ...RJ_PTY, lat: -23.3458, lon: -44.7173, facing: 150, kind: 'beach' },
  { id: 'pty-coqueiro', name: 'Praia do Coqueiro', ...RJ_PTY, lat: -23.347, lon: -44.7192, facing: 150, kind: 'beach' },
  { id: 'pty-sono', name: 'Praia do Sono', ...RJ_PTY, lat: -23.3334, lon: -44.6343, facing: 170, kind: 'beach' },
  { id: 'pty-antigos', name: 'Praia dos Antigos', ...RJ_PTY, lat: -23.342, lon: -44.629, facing: 150, kind: 'beach' },
  { id: 'pty-laranjeiras', name: 'Laranjeiras', ...RJ_PTY, lat: -23.3383, lon: -44.6673, facing: 180, kind: 'beach' },
  { id: 'pty-martimdesa', name: 'Martim de Sá', ...RJ_PTY, lat: -23.3163, lon: -44.5605, facing: 110, kind: 'beach' },
  { id: 'pty-sumaca', name: 'Sumaca', ...RJ_PTY, lat: -23.365, lon: -44.607, facing: 170, kind: 'beach' },
  { id: 'pty-prainha', name: 'Prainha (Mambucaba)', ...RJ_PTY, lat: -23.0282, lon: -44.533, facing: 158, kind: 'beach' },
  { id: 'pty-mambucaba', name: 'Mambucaba', ...RJ_PTY, lat: -23.0261, lon: -44.5165, facing: 168, kind: 'beach' },
  { id: 'agr-brava', name: 'Praia Brava', ...RJ_AGR, lat: -23.0074, lon: -44.4613, facing: 181, kind: 'beach' },
  { id: 'agr-ribeira', name: 'Ribeira', ...RJ_AGR, lat: -22.9618, lon: -44.3054, facing: 200, kind: 'beach' },
  { id: 'agr-garatucaia', name: 'Garatucaia', ...RJ_AGR, lat: -23.03, lon: -44.183, facing: 170, kind: 'beach' },
  { id: 'ilg-aventureiro', name: 'Aventureiro', ...RJ_ILG, lat: -23.1882, lon: -44.3183, facing: 160, kind: 'beach' },
  { id: 'ilg-sul', name: 'Praia do Sul', ...RJ_ILG, lat: -23.1781, lon: -44.3027, facing: 165, kind: 'beach' },
  { id: 'ilg-leste', name: 'Praia do Leste', ...RJ_ILG, lat: -23.1794, lon: -44.2864, facing: 180, kind: 'beach' },
  { id: 'ilg-parnaioca', name: 'Parnaioca', ...RJ_ILG, lat: -23.1913, lon: -44.2518, facing: 190, kind: 'beach' },
  { id: 'ilg-doisrios', name: 'Dois Rios', ...RJ_ILG, lat: -23.1829, lon: -44.1884, facing: 160, kind: 'beach' },
  { id: 'ilg-lopesmendes', name: 'Lopes Mendes', ...RJ_ILG, lat: -23.1669, lon: -44.138, facing: 110, kind: 'beach' },
  { id: 'ilg-santoantonio', name: 'Santo Antônio', ...RJ_ILG, lat: -23.171, lon: -44.153, facing: 150, kind: 'beach' },
  { id: 'mgt-jacarei', name: 'Conceição de Jacareí', ...RJ_MGT, lat: -23.0322, lon: -44.1618, facing: 160, kind: 'beach' },
  { id: 'mgt-saco', name: 'Praia do Saco', ...RJ_MGT, lat: -22.9446, lon: -44.0541, facing: 170, kind: 'beach' },
  { id: 'mgt-portoreal', name: 'Porto Real', ...RJ_MGT, lat: -22.9358, lon: -43.9891, facing: 170, kind: 'beach' },
  { id: 'mgt-itacuruca', name: 'Itacuruçá', ...RJ_MGT, lat: -22.93, lon: -43.91, facing: 180, kind: 'beach' },
  { id: 'itg-porto', name: 'Porto de Itaguaí', ...RJ_ITG, lat: -22.9312, lon: -43.8344, facing: 170, kind: 'beach' },
  { id: 'rio-sepetiba', name: 'Sepetiba', ...RJ_RIO, lat: -22.9784, lon: -43.7054, facing: 180, kind: 'beach' },
  { id: 'rio-barradeguaratiba', name: 'Barra de Guaratiba', ...RJ_RIO, lat: -23.0625, lon: -43.567, facing: 180, kind: 'beach' },
  { id: 'rio-grumari', name: 'Grumari', ...RJ_RIO, lat: -23.0499, lon: -43.5326, facing: 165, kind: 'beach' },
  { id: 'rio-prainha', name: 'Prainha', ...RJ_RIO, lat: -23.0412, lon: -43.5056, facing: 165, kind: 'beach' },
  { id: 'rio-macumba', name: 'Macumba', ...RJ_RIO, lat: -23.0339, lon: -43.4864, facing: 163, kind: 'beach' },
  { id: 'rio-recreio', name: 'Recreio dos Bandeirantes', ...RJ_RIO, lat: -23.027, lon: -43.4601, facing: 165, kind: 'beach' },
  { id: 'rio-reserva', name: 'Reserva', ...RJ_RIO, lat: -23.0133, lon: -43.3897, facing: 175, kind: 'beach' },
  { id: 'rio-barra', name: 'Barra da Tijuca', ...RJ_RIO, lat: -23.0122, lon: -43.33, facing: 170, kind: 'beach' },
  { id: 'rio-joatinga', name: 'Joatinga', ...RJ_RIO, lat: -23.0148, lon: -43.2901, facing: 170, kind: 'beach' },
  { id: 'rio-pepino', name: 'Pepino', ...RJ_RIO, lat: -23.0017, lon: -43.2722, facing: 163, kind: 'beach' },
  { id: 'rio-saoconrado', name: 'São Conrado', ...RJ_RIO, lat: -23.0003, lon: -43.2649, facing: 170, kind: 'beach' },
  { id: 'rio-leblon', name: 'Leblon', ...RJ_RIO, lat: -22.9879, lon: -43.2237, facing: 168, kind: 'beach' },
  { id: 'rio-ipanema', name: 'Ipanema', ...RJ_RIO, lat: -22.9876, lon: -43.2022, facing: 182, kind: 'beach' },
  { id: 'rio-arpoador', name: 'Arpoador', ...RJ_RIO, lat: -22.9891, lon: -43.192, facing: 180, kind: 'point' },
  { id: 'rio-diabo', name: 'Praia do Diabo', ...RJ_RIO, lat: -22.988, lon: -43.1889, facing: 160, kind: 'beach' },
  { id: 'rio-copacabana', name: 'Copacabana', ...RJ_RIO, lat: -22.9725, lon: -43.1832, facing: 135, kind: 'beach' },
  { id: 'rio-leme', name: 'Leme', ...RJ_RIO, lat: -22.9632, lon: -43.166, facing: 140, kind: 'beach' },
  { id: 'rio-vermelha', name: 'Praia Vermelha', ...RJ_RIO, lat: -22.9552, lon: -43.1645, facing: 170, kind: 'beach' },
  { id: 'rio-flamengo', name: 'Flamengo', ...RJ_RIO, lat: -22.9335, lon: -43.1713, facing: 75, kind: 'beach' },
  { id: 'nit-icarai', name: 'Icaraí', ...RJ_NIT, lat: -22.9091, lon: -43.112, facing: 200, kind: 'beach' },
  { id: 'nit-itapuca', name: 'Pedra de Itapuca', ...RJ_NIT, lat: -22.9053, lon: -43.1228, facing: 200, kind: 'reef' },
  { id: 'nit-adaoeva', name: 'Adão e Eva', ...RJ_NIT, lat: -22.9331, lon: -43.1138, facing: 85, kind: 'beach' },
  { id: 'nit-piratininga', name: 'Piratininga', ...RJ_NIT, lat: -22.9535, lon: -43.0822, facing: 170, kind: 'beach' },
  { id: 'nit-camboinhas', name: 'Camboinhas', ...RJ_NIT, lat: -22.9618, lon: -43.0575, facing: 190, kind: 'beach' },
  { id: 'nit-canal', name: 'Canal de Itaipu', ...RJ_NIT, lat: -22.9655, lon: -43.048, facing: 190, kind: 'beach' },
  { id: 'nit-itaipu', name: 'Itaipu', ...RJ_NIT, lat: -22.9685, lon: -43.0459, facing: 200, kind: 'beach' },
  { id: 'nit-itacoatiara', name: 'Itacoatiara', ...RJ_NIT, lat: -22.9749, lon: -43.0325, facing: 180, kind: 'beach' },
  { id: 'mrc-recanto', name: 'Recanto de Itaipuaçu', ...RJ_MRC, lat: -22.9708, lon: -43.0101, facing: 165, kind: 'beach' },
  { id: 'mrc-itaipuacu', name: 'Itaipuaçu', ...RJ_MRC, lat: -22.9698, lon: -42.9934, facing: 180, kind: 'beach' },
  { id: 'mrc-barra', name: 'Barra de Maricá', ...RJ_MRC, lat: -22.9619, lon: -42.8192, facing: 178, kind: 'beach' },
  { id: 'mrc-pontanegra', name: 'Ponta Negra', ...RJ_MRC, lat: -22.9575, lon: -42.6965, facing: 213, kind: 'beach' },
  { id: 'mrc-prainha', name: 'Prainha (da Sacristia)', ...RJ_MRC, lat: -22.9596, lon: -42.6852, facing: 147, kind: 'beach' },
  { id: 'mrc-jacone', name: 'Jaconé (Maricá)', ...RJ_MRC, lat: -22.9403, lon: -42.6577, facing: 168, kind: 'beach' },
  { id: 'sqr-jacone', name: 'Jaconé', ...RJ_SQR, lat: -22.9345, lon: -42.6, facing: 170, kind: 'beach' },
  { id: 'sqr-vila', name: 'Praia da Vila', ...RJ_SQR, lat: -22.9345, lon: -42.5, facing: 188, kind: 'beach' },
  { id: 'sqr-itauna', name: 'Itaúna', ...RJ_SQR, lat: -22.9374, lon: -42.4764, facing: 191, kind: 'beach' },
  { id: 'sqr-barrinha', name: 'Barrinha', ...RJ_SQR, lat: -22.9359, lon: -42.4645, facing: 168, kind: 'beach' },
  { id: 'sqr-barranova', name: 'Barra Nova', ...RJ_SQR, lat: -22.935, lon: -42.42, facing: 182, kind: 'beach' },
  { id: 'sqr-vilatur', name: 'Vilatur', ...RJ_SQR, lat: -22.9382, lon: -42.355, facing: 180, kind: 'beach' },
  { id: 'arr-vargas', name: 'Praia do Vargas', ...RJ_ARR, lat: -22.9382, lon: -42.3, facing: 180, kind: 'beach' },
  { id: 'arr-massambaba', name: 'Massambaba', ...RJ_ARR, lat: -22.939, lon: -42.2538, facing: 180, kind: 'beach' },
  { id: 'arc-figueira', name: 'Figueira', ...RJ_ARC, lat: -22.9519, lon: -42.105, facing: 188, kind: 'beach' },
  { id: 'arc-novoarraial', name: 'Novo Arraial', ...RJ_ARC, lat: -22.9567, lon: -42.07, facing: 190, kind: 'beach' },
  { id: 'arc-grande', name: 'Praia Grande', ...RJ_ARC, lat: -22.9689, lon: -42.0355, facing: 225, kind: 'beach' },
  { id: 'arc-pontal', name: 'Pontal', ...RJ_ARC, lat: -22.9668, lon: -42.0157, facing: 90, kind: 'beach' },
  { id: 'arc-brava', name: 'Praia Brava', ...RJ_ARC, lat: -22.9785, lon: -42.0104, facing: 48, kind: 'beach' },
  { id: 'cbf-foguete', name: 'Foguete', ...RJ_CBF, lat: -22.911, lon: -42.035, facing: 120, kind: 'beach' },
  { id: 'cbf-forte', name: 'Praia do Forte', ...RJ_CBF, lat: -22.8862, lon: -42.0174, facing: 140, kind: 'beach' },
  { id: 'cbf-brava', name: 'Praia Brava', ...RJ_CBF, lat: -22.8838, lon: -41.9965, facing: 158, kind: 'beach' },
  { id: 'cbf-conchas', name: 'Praia das Conchas', ...RJ_CBF, lat: -22.8611, lon: -41.9859, facing: 73, kind: 'beach' },
  { id: 'cbf-pero', name: 'Peró', ...RJ_CBF, lat: -22.843, lon: -41.981, facing: 110, kind: 'beach' },
  { id: 'cbf-pontalpero', name: 'Pontal do Peró', ...RJ_CBF, lat: -22.8242, lon: -41.9713, facing: 120, kind: 'beach' },
  { id: 'cbf-rasa', name: 'Praia Rasa', ...RJ_CBF, lat: -22.7324, lon: -41.9669, facing: 28, kind: 'beach' },
  { id: 'cbf-unamar', name: 'Unamar (Tamoios)', ...RJ_CBF, lat: -22.621, lon: -41.9988, facing: 95, kind: 'beach' },
  { id: 'bzs-tucuns', name: 'Tucuns', ...RJ_BZS, lat: -22.7972, lon: -41.9288, facing: 113, kind: 'beach' },
  { id: 'bzs-geriba', name: 'Geribá', ...RJ_BZS, lat: -22.7799, lon: -41.9127, facing: 170, kind: 'beach' },
  { id: 'bzs-brava', name: 'Praia Brava', ...RJ_BZS, lat: -22.7544, lon: -41.8726, facing: 70, kind: 'beach' },
  { id: 'cas-praiao', name: 'Praião (Barra de São João)', ...RJ_CAS, lat: -22.5885, lon: -41.9874, facing: 103, kind: 'beach' },
  { id: 'rdo-tartarugas', name: 'Praia das Tartarugas', ...RJ_RDO, lat: -22.5326, lon: -41.9378, facing: 120, kind: 'beach' },
  { id: 'rdo-costaazul', name: 'Costa Azul', ...RJ_RDO, lat: -22.5217, lon: -41.9193, facing: 115, kind: 'beach' },
  { id: 'rdo-mardonorte', name: 'Mar do Norte', ...RJ_RDO, lat: -22.4502, lon: -41.8548, facing: 105, kind: 'beach' },
  { id: 'mac-campistas', name: 'Praia dos Campistas', ...RJ_MAC, lat: -22.3936, lon: -41.7789, facing: 150, kind: 'beach' },
  { id: 'mac-cavaleiros', name: 'Praia dos Cavaleiros', ...RJ_MAC, lat: -22.3963, lon: -41.784, facing: 150, kind: 'beach' },
  { id: 'mac-pecado', name: 'Praia do Pecado', ...RJ_MAC, lat: -22.407, lon: -41.807, facing: 150, kind: 'beach' },
  { id: 'mac-aeroporto', name: 'Praia do Aeroporto', ...RJ_MAC, lat: -22.3501, lon: -41.7597, facing: 143, kind: 'beach' },
  { id: 'mac-barreto', name: 'São José do Barreto', ...RJ_MAC, lat: -22.3352, lon: -41.7343, facing: 140, kind: 'beach' },
  { id: 'mac-lagomar', name: 'Lagomar', ...RJ_MAC, lat: -22.3046, lon: -41.6958, facing: 143, kind: 'beach' },
  { id: 'crp-carapebus', name: 'Carapebus', ...RJ_CRP, lat: -22.2524, lon: -41.5872, facing: 155, kind: 'beach' },
  { id: 'crp-jurubatiba', name: 'Jurubatiba (Praia Grande)', ...RJ_CRP, lat: -22.232, lon: -41.495, facing: 155, kind: 'beach' },
  { id: 'qss-visgueiro', name: 'Visgueiro', ...RJ_QSS, lat: -22.172, lon: -41.33, facing: 150, kind: 'beach' },
  { id: 'qss-barradofurado', name: 'Barra do Furado', ...RJ_QSS, lat: -22.1, lon: -41.1391, facing: 145, kind: 'beach' },
  { id: 'cmp-farol', name: 'Farol de São Thomé', ...RJ_CMP, lat: -22.0432, lon: -41.0485, facing: 130, kind: 'beach' },
  { id: 'cmp-xexe', name: 'Balneário do Xexé', ...RJ_CMP, lat: -21.985, lon: -40.984, facing: 100, kind: 'beach' },
  { id: 'cmp-mariadarosa', name: 'Maria da Rosa', ...RJ_CMP, lat: -21.922, lon: -40.99, facing: 95, kind: 'beach' },
  { id: 'sjb-acu', name: 'Barra do Açu', ...RJ_SJB, lat: -21.895, lon: -40.979, facing: 85, kind: 'beach' },
  { id: 'sjb-grussai', name: 'Grussaí', ...RJ_SJB, lat: -21.6946, lon: -41.0232, facing: 95, kind: 'beach' },
  { id: 'sjb-atafona', name: 'Atafona', ...RJ_SJB, lat: -21.6243, lon: -41.0136, facing: 98, kind: 'beach' },
  { id: 'sfi-guriri', name: 'Guriri', ...RJ_SFI, lat: -21.5412, lon: -41.0449, facing: 90, kind: 'beach' },
  { id: 'sfi-buena', name: 'Buena', ...RJ_SFI, lat: -21.478, lon: -41.03, facing: 90, kind: 'beach' },
  { id: 'sfi-santaclara', name: 'Santa Clara', ...RJ_SFI, lat: -21.3926, lon: -40.9843, facing: 165, kind: 'beach' },
  { id: 'sfi-guaxindiba', name: 'Guaxindiba', ...RJ_SFI, lat: -21.3823, lon: -40.977, facing: 133, kind: 'beach' },
  { id: 'sfi-lagoadoce', name: 'Lagoa Doce', ...RJ_SFI, lat: -21.3541, lon: -40.963, facing: 78, kind: 'beach' },
]

const es = (city: string) => ({ city, state: 'ES', region: city, tidePort: 'vitoria' }) as const
const ES_PKE = es('Presidente Kennedy')
const ES_MTZ = es('Marataízes')
const ES_IPM = es('Itapemirim')
const ES_PIM = es('Piúma')
const ES_ANC = es('Anchieta')
const ES_GPR = es('Guarapari')
const ES_VVL = es('Vila Velha')
const ES_VIX = es('Vitória')
const ES_SER = es('Serra')
const ES_FUN = es('Fundão')
const ES_ARZ = es('Aracruz')
const ES_LIN = es('Linhares')
const ES_SMT = es('São Mateus')
const ES_CDB = es('Conceição da Barra')
/** Litoral do Espírito Santo, de Presidente Kennedy (divisa com o RJ) a Conceição da Barra (divisa com a BA). */
const ESPIRITO_SANTO: Spot[] = [
  { id: 'pke-neves', name: 'Praia das Neves', ...ES_PKE, lat: -21.2765, lon: -40.962, facing: 130, kind: 'beach' },
  { id: 'mtz-pontal', name: 'Pontal', ...ES_MTZ, lat: -20.998, lon: -40.806, facing: 100, kind: 'beach' },
  { id: 'mtz-moroba', name: 'Morobá', ...ES_MTZ, lat: -21.19, lon: -40.93, facing: 130, kind: 'beach' },
  { id: 'mtz-lagoadantas', name: 'Lagoa Dantas', ...ES_MTZ, lat: -21.089, lon: -40.846, facing: 115, kind: 'beach' },
  { id: 'mtz-colonia', name: 'Praia da Colônia', ...ES_MTZ, lat: -21.074, lon: -40.84, facing: 115, kind: 'beach' },
  { id: 'mtz-pitas', name: 'Praia das Pitas', ...ES_MTZ, lat: -21.055, lon: -40.8318, facing: 118, kind: 'beach' },
  { id: 'mtz-marataizes', name: 'Marataízes', ...ES_MTZ, lat: -21.0437, lon: -40.8244, facing: 148, kind: 'beach' },
  { id: 'mtz-cidadenova', name: 'Cidade Nova', ...ES_MTZ, lat: -21.0264, lon: -40.8115, facing: 100, kind: 'beach' },
  { id: 'mtz-barraitapemirim', name: 'Barra do Itapemirim', ...ES_MTZ, lat: -21.0108, lon: -40.8081, facing: 113, kind: 'beach' },
  { id: 'ipm-itaoca', name: 'Itaoca', ...ES_IPM, lat: -20.9093, lon: -40.7828, facing: 120, kind: 'beach' },
  { id: 'ipm-itaipava', name: 'Itaipava', ...ES_IPM, lat: -20.8916, lon: -40.7717, facing: 130, kind: 'beach' },
  { id: 'pim-paugrande', name: 'Pau Grande', ...ES_PIM, lat: -20.853, lon: -40.738, facing: 150, kind: 'beach' },
  { id: 'pim-piuma', name: 'Piúma', ...ES_PIM, lat: -20.8422, lon: -40.7267, facing: 160, kind: 'beach' },
  { id: 'anc-namorados', name: 'Praia dos Namorados', ...ES_ANC, lat: -20.83, lon: -40.6902, facing: 145, kind: 'beach' },
  { id: 'anc-santahelena', name: 'Santa Helena', ...ES_ANC, lat: -20.823, lon: -40.6762, facing: 165, kind: 'beach' },
  { id: 'anc-guanabara', name: 'Guanabara', ...ES_ANC, lat: -20.8135, lon: -40.663, facing: 160, kind: 'beach' },
  { id: 'anc-anchieta', name: 'Anchieta', ...ES_ANC, lat: -20.8084, lon: -40.6462, facing: 180, kind: 'beach' },
  { id: 'anc-castelhanos', name: 'Castelhanos', ...ES_ANC, lat: -20.8343, lon: -40.623, facing: 148, kind: 'beach' },
  { id: 'anc-areiapreta', name: 'Areia Preta', ...ES_ANC, lat: -20.8241, lon: -40.6155, facing: 113, kind: 'beach' },
  { id: 'anc-alem', name: 'Praia do Além', ...ES_ANC, lat: -20.815, lon: -40.605, facing: 140, kind: 'beach' },
  { id: 'anc-ubu', name: 'Ubu', ...ES_ANC, lat: -20.8027, lon: -40.588, facing: 150, kind: 'beach' },
  { id: 'gpr-maeba', name: 'Mãe-Bá', ...ES_GPR, lat: -20.7648, lon: -40.5705, facing: 123, kind: 'beach' },
  { id: 'gpr-guaibura', name: 'Guaibura', ...ES_GPR, lat: -20.7284, lon: -40.5225, facing: 113, kind: 'beach' },
  { id: 'gpr-siribeira', name: 'Ponta da Siribeira', ...ES_GPR, lat: -20.7109, lon: -40.5085, facing: 110, kind: 'beach' },
  { id: 'gpr-cerca', name: 'Praia da Cerca', ...ES_GPR, lat: -20.684, lon: -40.5045, facing: 120, kind: 'beach' },
  { id: 'gpr-alem', name: 'Praia do Além', ...ES_GPR, lat: -20.679, lon: -40.501, facing: 120, kind: 'beach' },
  { id: 'gpr-coralzinho', name: 'Coralzinho', ...ES_GPR, lat: -20.6752, lon: -40.4953, facing: 125, kind: 'beach' },
  { id: 'gpr-morro', name: 'Praia do Morro', ...ES_GPR, lat: -20.6531, lon: -40.4839, facing: 160, kind: 'beach' },
  { id: 'gpr-bororo', name: 'Bororó', ...ES_GPR, lat: -20.6458, lon: -40.4681, facing: 125, kind: 'beach' },
  { id: 'gpr-ule', name: 'Praia do Ulé', ...ES_GPR, lat: -20.6376, lon: -40.4505, facing: 160, kind: 'beach' },
  { id: 'gpr-santamonica', name: 'Santa Mônica', ...ES_GPR, lat: -20.6247, lon: -40.4511, facing: 180, kind: 'beach' },
  { id: 'gpr-setiba', name: 'Setiba', ...ES_GPR, lat: -20.6342, lon: -40.4379, facing: 181, kind: 'beach' },
  { id: 'gpr-setibapina', name: 'Setiba Pina', ...ES_GPR, lat: -20.6305, lon: -40.43, facing: 150, kind: 'beach' },
  { id: 'gpr-setibao', name: 'Setibão', ...ES_GPR, lat: -20.621, lon: -40.4255, facing: 120, kind: 'beach' },
  { id: 'vvl-pontafruta', name: 'Ponta da Fruta', ...ES_VVL, lat: -20.5085, lon: -40.3587, facing: 108, kind: 'beach' },
  { id: 'vvl-belina', name: 'Ponta da Belina', ...ES_VVL, lat: -20.4979, lon: -40.3538, facing: 123, kind: 'beach' },
  { id: 'vvl-buraco', name: 'Praia do Buraco', ...ES_VVL, lat: -20.4405, lon: -40.3279, facing: 115, kind: 'beach' },
  { id: 'vvl-barrajucu', name: 'Barra do Jucu', ...ES_VVL, lat: -20.4291, lon: -40.3228, facing: 120, kind: 'beach' },
  { id: 'vvl-recifes', name: 'Praia dos Recifes', ...ES_VVL, lat: -20.4447, lon: -40.3297, facing: 108, kind: 'reef' },
  { id: 'vvl-itaparica', name: 'Itaparica', ...ES_VVL, lat: -20.3704, lon: -40.3018, facing: 118, kind: 'beach' },
  { id: 'vvl-itapua', name: 'Itapuã', ...ES_VVL, lat: -20.3559, lon: -40.2869, facing: 148, kind: 'beach' },
  { id: 'vvl-costa', name: 'Praia da Costa', ...ES_VVL, lat: -20.3358, lon: -40.2803, facing: 123, kind: 'beach' },
  { id: 'vix-camburi', name: 'Camburi', ...ES_VIX, lat: -20.272, lon: -40.287, facing: 110, kind: 'beach' },
  { id: 'ser-carapebus', name: 'Carapebus', ...ES_SER, lat: -20.2343, lon: -40.2153, facing: 105, kind: 'beach' },
  { id: 'ser-baleia', name: 'Praia da Baleia', ...ES_SER, lat: -20.1758, lon: -40.188, facing: 115, kind: 'beach' },
  { id: 'ser-manguinhos', name: 'Manguinhos', ...ES_SER, lat: -20.1911, lon: -40.1909, facing: 85, kind: 'beach' },
  { id: 'ser-jacaraipe', name: 'Jacaraípe', ...ES_SER, lat: -20.1512, lon: -40.1845, facing: 85, kind: 'beach' },
  { id: 'fun-grande', name: 'Praia Grande', ...ES_FUN, lat: -20.043, lon: -40.174, facing: 100, kind: 'beach' },
  { id: 'fun-califa', name: 'Califa (Kalifa)', ...ES_FUN, lat: -20.025, lon: -40.157, facing: 100, kind: 'beach' },
  { id: 'fun-gramute', name: 'Gramuté', ...ES_FUN, lat: -20.058, lon: -40.175, facing: 100, kind: 'beach' },
  { id: 'arz-secret', name: 'Arrecife Secret', ...ES_ARZ, lat: -19.9409, lon: -40.1395, facing: 165, kind: 'reef' },
  { id: 'arz-coqueiral', name: 'Coqueiral', ...ES_ARZ, lat: -19.9364, lon: -40.1322, facing: 135, kind: 'beach' },
  { id: 'arz-padres', name: 'Praia dos Padres', ...ES_ARZ, lat: -19.9317, lon: -40.1214, facing: 168, kind: 'beach' },
  { id: 'arz-barrasahy', name: 'Barra do Sahy', ...ES_ARZ, lat: -19.8797, lon: -40.085, facing: 118, kind: 'beach' },
  { id: 'arz-barrariacho', name: 'Barra do Riacho', ...ES_ARZ, lat: -19.8275, lon: -40.0582, facing: 98, kind: 'beach' },
  { id: 'lin-comboios', name: 'Comboios', ...ES_LIN, lat: -19.748, lon: -39.975, facing: 130, kind: 'beach' },
  { id: 'lin-tamar', name: 'Reserva (point Tamar)', ...ES_LIN, lat: -19.663, lon: -39.855, facing: 125, kind: 'point' },
  { id: 'lin-regencia', name: 'Regência (Boca do Rio)', ...ES_LIN, lat: -19.655, lon: -39.8287, facing: 120, kind: 'beach' },
  { id: 'lin-povoacao', name: 'Povoação', ...ES_LIN, lat: -19.5833, lon: -39.7824, facing: 115, kind: 'beach' },
  { id: 'lin-ipiranga', name: 'Pontal do Ipiranga', ...ES_LIN, lat: -19.191, lon: -39.7064, facing: 80, kind: 'beach' },
  { id: 'smt-barranova', name: 'Barra Nova', ...ES_SMT, lat: -18.9487, lon: -39.7396, facing: 90, kind: 'beach' },
  { id: 'smt-guriri', name: 'Guriri', ...ES_SMT, lat: -18.7328, lon: -39.7461, facing: 90, kind: 'beach' },
  { id: 'smt-pedras', name: 'Praia das Pedras', ...ES_SMT, lat: -18.7005, lon: -39.7458, facing: 93, kind: 'beach' },
  { id: 'cdb-pontalsul', name: 'Pontal do Sul', ...ES_CDB, lat: -18.6049, lon: -39.7271, facing: 100, kind: 'beach' },
  { id: 'cdb-barra', name: 'Praia da Barra', ...ES_CDB, lat: -18.5829, lon: -39.7299, facing: 78, kind: 'beach' },
  { id: 'cdb-itaunas', name: 'Itaúnas', ...ES_CDB, lat: -18.4221, lon: -39.7004, facing: 108, kind: 'beach' },
  { id: 'cdb-riachodoce', name: 'Riacho Doce', ...ES_CDB, lat: -18.3469, lon: -39.6683, facing: 115, kind: 'beach' },
]

const ce = (city: string) => ({ city, state: 'CE', region: city, tidePort: 'mucuripe' }) as const
const CE_ACA = ce('Aracati')
const CE_FTM = ce('Fortim')
const CE_BBE = ce('Beberibe')
const CE_CSC = ce('Cascavel')
const CE_AQZ = ce('Aquiraz')
const CE_FOR = ce('Fortaleza')
const CE_CAU = ce('Caucaia')
const CE_SGA = ce('São Gonçalo do Amarante')
const CE_PRC = ce('Paracuru')
const CE_PPB = ce('Paraipaba')
const CE_TRA = ce('Trairi')
const CE_IPC = ce('Itapipoca')
const CE_AMT = ce('Amontada')
const CE_ITR = ce('Itarema')
const CE_ACR = ce('Acaraú')
const CE_CRZ = ce('Cruz')
const CE_JIJ = ce('Jijoca de Jericoacoara')
const CE_CMC = ce('Camocim')
const CE_BRQ = ce('Barroquinha')
/** Litoral do Ceará, de Aracati (leste) a Barroquinha (divisa com o PI). */
const CEARA: Spot[] = [
  { id: 'aca-majorlandia', name: 'Majorlândia', ...CE_ACA, lat: -4.5512, lon: -37.6728, facing: 50, kind: 'beach' },
  { id: 'aca-canoa', name: 'Canoa Quebrada', ...CE_ACA, lat: -4.5219, lon: -37.7042, facing: 38, kind: 'beach' },
  { id: 'ftm-pirangi', name: 'Barra de Pirangi', ...CE_FTM, lat: -4.393, lon: -37.827, facing: 30, kind: 'beach' },
  { id: 'ftm-fortim', name: 'Fortim', ...CE_FTM, lat: -4.405, lon: -37.775, facing: 30, kind: 'beach' },
  { id: 'bbe-parajuru', name: 'Parajuru', ...CE_BBE, lat: -4.3777, lon: -37.8569, facing: 18, kind: 'beach' },
  { id: 'bbe-paraiso', name: 'Praia do Paraíso', ...CE_BBE, lat: -4.3236, lon: -37.9246, facing: 45, kind: 'beach' },
  { id: 'bbe-sucatinga', name: 'Barra da Sucatinga', ...CE_BBE, lat: -4.2512, lon: -38.0092, facing: 43, kind: 'beach' },
  { id: 'bbe-uruau', name: 'Uruaú (Marambaia)', ...CE_BBE, lat: -4.2215, lon: -38.0413, facing: 38, kind: 'beach' },
  { id: 'bbe-fontes', name: 'Praia das Fontes', ...CE_BBE, lat: -4.181, lon: -38.0806, facing: 45, kind: 'beach' },
  { id: 'bbe-morrobranco', name: 'Morro Branco', ...CE_BBE, lat: -4.1505, lon: -38.1135, facing: 45, kind: 'beach' },
  { id: 'csc-balbino', name: 'Balbino', ...CE_CSC, lat: -4.021, lon: -38.214, facing: 45, kind: 'beach' },
  { id: 'csc-barravelha', name: 'Barra Velha', ...CE_CSC, lat: -4.0702, lon: -38.1709, facing: 55, kind: 'beach' },
  { id: 'csc-caponga', name: 'Caponga', ...CE_CSC, lat: -4.0382, lon: -38.1976, facing: 25, kind: 'beach' },
  { id: 'csc-barranova', name: 'Barra Nova', ...CE_CSC, lat: -4.0332, lon: -38.204, facing: 43, kind: 'beach' },
  { id: 'csc-aguasbelas', name: 'Águas Belas', ...CE_CSC, lat: -4.0538, lon: -38.1823, facing: 53, kind: 'beach' },
  { id: 'aqz-batoque', name: 'Batoque', ...CE_AQZ, lat: -3.9987, lon: -38.2304, facing: 53, kind: 'beach' },
  { id: 'aqz-morrobranco', name: 'Morro Branco (Aquiraz)', ...CE_AQZ, lat: -3.9666, lon: -38.2559, facing: 55, kind: 'beach' },
  { id: 'aqz-iguape', name: 'Iguape', ...CE_AQZ, lat: -3.9406, lon: -38.2946, facing: 23, kind: 'beach' },
  { id: 'aqz-presidio', name: 'Presídio', ...CE_AQZ, lat: -3.9323, lon: -38.3094, facing: 33, kind: 'beach' },
  { id: 'aqz-prainha', name: 'Prainha', ...CE_AQZ, lat: -3.9013, lon: -38.3455, facing: 45, kind: 'beach' },
  { id: 'aqz-portodasdunas', name: 'Porto das Dunas', ...CE_AQZ, lat: -3.8447, lon: -38.3884, facing: 55, kind: 'beach' },
  { id: 'for-sabiaguaba', name: 'Sabiaguaba', ...CE_FOR, lat: -3.7928, lon: -38.4215, facing: 33, kind: 'beach' },
  { id: 'for-abreulandia', name: 'Abreulândia', ...CE_FOR, lat: -3.811, lon: -38.4092, facing: 58, kind: 'beach' },
  { id: 'for-cacaepesca', name: 'Caça e Pesca', ...CE_FOR, lat: -3.7866, lon: -38.4251, facing: 60, kind: 'beach' },
  { id: 'for-futuro', name: 'Praia do Futuro', ...CE_FOR, lat: -3.7378, lon: -38.4527, facing: 63, kind: 'beach' },
  { id: 'for-portao', name: 'Praia do Portão', ...CE_FOR, lat: -3.7286, lon: -38.4575, facing: 65, kind: 'beach' },
  { id: 'for-titanzinho', name: 'Titanzinho', ...CE_FOR, lat: -3.7096, lon: -38.4641, facing: 55, kind: 'point' },
  { id: 'for-mansa', name: 'Praia Mansa', ...CE_FOR, lat: -3.7121, lon: -38.4751, facing: 295, kind: 'beach' },
  { id: 'for-meireles', name: 'Meireles', ...CE_FOR, lat: -3.7236, lon: -38.5, facing: 10, kind: 'beach' },
  { id: 'for-iracema', name: 'Iracema', ...CE_FOR, lat: -3.7185, lon: -38.5156, facing: 5, kind: 'beach' },
  { id: 'for-arpoador', name: 'Arpoador', ...CE_FOR, lat: -3.7173, lon: -38.5352, facing: 18, kind: 'beach' },
  { id: 'for-lesteoeste', name: 'Leste Oeste', ...CE_FOR, lat: -3.7113, lon: -38.5478, facing: 28, kind: 'beach' },
  { id: 'for-pirambu', name: 'Pirambu', ...CE_FOR, lat: -3.7084, lon: -38.553, facing: 35, kind: 'beach' },
  { id: 'for-barradoceara', name: 'Barra do Ceará', ...CE_FOR, lat: -3.6985, lon: -38.5753, facing: 40, kind: 'beach' },
  { id: 'cau-icarai', name: 'Icaraí', ...CE_CAU, lat: -3.6837, lon: -38.6502, facing: 25, kind: 'beach' },
  { id: 'cau-tabuba', name: 'Tabuba', ...CE_CAU, lat: -3.652, lon: -38.6897, facing: 53, kind: 'beach' },
  { id: 'cau-cumbuco', name: 'Cumbuco', ...CE_CAU, lat: -3.6254, lon: -38.7256, facing: 23, kind: 'beach' },
  { id: 'cau-cauipe', name: 'Barra do Cauípe', ...CE_CAU, lat: -3.5873, lon: -38.7778, facing: 58, kind: 'beach' },
  { id: 'sga-pecem', name: 'Pecém', ...CE_SGA, lat: -3.5459, lon: -38.8277, facing: 20, kind: 'beach' },
  { id: 'sga-taiba', name: 'Taíba', ...CE_SGA, lat: -3.5062, lon: -38.9046, facing: 20, kind: 'beach' },
  { id: 'prc-ronco', name: 'Ronco do Mar', ...CE_PRC, lat: -3.4038, lon: -39.0176, facing: 20, kind: 'reef' },
  { id: 'prc-quebramar', name: 'Quebra Mar', ...CE_PRC, lat: -3.4041, lon: -39.0259, facing: 348, kind: 'reef' },
  { id: 'prc-pedrameio', name: 'Pedra do Meio', ...CE_PRC, lat: -3.4047, lon: -39.0288, facing: 343, kind: 'reef' },
  { id: 'prc-bocadopoco', name: 'Boca do Poço', ...CE_PRC, lat: -3.401, lon: -39.012, facing: 20, kind: 'reef' },
  { id: 'prc-havaizinho', name: 'Havaizinho', ...CE_PRC, lat: -3.408, lon: -39.05, facing: 0, kind: 'beach' },
  { id: 'prc-munguba', name: 'Munguba', ...CE_PRC, lat: -3.396, lon: -39.088, facing: 45, kind: 'beach' },
  { id: 'ppb-lagoinha', name: 'Lagoinha', ...CE_PPB, lat: -3.3457, lon: -39.1375, facing: 30, kind: 'beach' },
  { id: 'tra-emboaca', name: 'Embuaca', ...CE_TRA, lat: -3.2667, lon: -39.2067, facing: 53, kind: 'beach' },
  { id: 'tra-guajiru', name: 'Guajiru', ...CE_TRA, lat: -3.2375, lon: -39.2346, facing: 20, kind: 'beach' },
  { id: 'tra-fleixeiras', name: 'Fleixeiras', ...CE_TRA, lat: -3.2168, lon: -39.2852, facing: 18, kind: 'beach' },
  { id: 'tra-mundau', name: 'Mundaú', ...CE_TRA, lat: -3.1793, lon: -39.3743, facing: 20, kind: 'beach' },
  { id: 'ipc-baleia', name: 'Praia da Baleia', ...CE_IPC, lat: -3.148, lon: -39.4398, facing: 30, kind: 'beach' },
  { id: 'ipc-sabiaguaba', name: 'Sabiaguaba (Itapipoca)', ...CE_IPC, lat: -3.078, lon: -39.54, facing: 30, kind: 'beach' },
  { id: 'amt-caetanos', name: 'Caetanos', ...CE_AMT, lat: -3.0465, lon: -39.6093, facing: 63, kind: 'beach' },
  { id: 'amt-icaraizinho', name: 'Icaraizinho', ...CE_AMT, lat: -3.0239, lon: -39.6475, facing: 20, kind: 'beach' },
  { id: 'amt-moitas', name: 'Moitas', ...CE_AMT, lat: -2.9988, lon: -39.6835, facing: 30, kind: 'beach' },
  { id: 'itr-guajiru', name: 'Ilha do Guajiru', ...CE_ITR, lat: -2.9684, lon: -39.7597, facing: 30, kind: 'beach' },
  { id: 'itr-torroes', name: 'Torrões', ...CE_ITR, lat: -2.9528, lon: -39.7941, facing: 23, kind: 'beach' },
  { id: 'itr-almofala', name: 'Almofala', ...CE_ITR, lat: -2.9309, lon: -39.824, facing: 40, kind: 'beach' },
  { id: 'acr-barrinha', name: 'Barrinha (Acaraú)', ...CE_ACR, lat: -2.855, lon: -40.1, facing: 15, kind: 'beach' },
  { id: 'crz-prea', name: 'Preá', ...CE_CRZ, lat: -2.8109, lon: -40.43, facing: 5, kind: 'beach' },
  { id: 'jij-pedrafurada', name: 'Pedra Furada', ...CE_JIJ, lat: -2.7862, lon: -40.4936, facing: 25, kind: 'beach' },
  { id: 'jij-jericoacoara', name: 'Jericoacoara', ...CE_JIJ, lat: -2.7965, lon: -40.5188, facing: 300, kind: 'point' },
  { id: 'jij-malhada', name: 'Malhada', ...CE_JIJ, lat: -2.7905, lon: -40.5192, facing: 330, kind: 'beach' },
  { id: 'cmc-tatajuba', name: 'Tatajuba', ...CE_CMC, lat: -2.851, lon: -40.695, facing: 5, kind: 'beach' },
  { id: 'cmc-maceio', name: 'Praia do Maceió', ...CE_CMC, lat: -2.849, lon: -40.67, facing: 5, kind: 'beach' },
  { id: 'cmc-imburanas', name: 'Imburanas', ...CE_CMC, lat: -2.853, lon: -40.73, facing: 5, kind: 'beach' },
  { id: 'cmc-caraubas', name: 'Caraúbas', ...CE_CMC, lat: -2.861, lon: -40.79, facing: 5, kind: 'beach' },
  { id: 'cmc-moreia', name: 'Moréia', ...CE_CMC, lat: -2.8783, lon: -40.82, facing: 5, kind: 'beach' },
  { id: 'cmc-farol', name: 'Praia do Farol', ...CE_CMC, lat: -2.8705, lon: -40.8551, facing: 58, kind: 'beach' },
  { id: 'cmc-barrinha', name: 'Barrinha', ...CE_CMC, lat: -2.873, lon: -40.89, facing: 5, kind: 'beach' },
  { id: 'cmc-olhodagua', name: 'Olho d\'Água', ...CE_CMC, lat: -2.8784, lon: -40.9578, facing: 5, kind: 'beach' },
  { id: 'cmc-remedios', name: 'Barra dos Remédios', ...CE_CMC, lat: -2.895, lon: -41.0496, facing: 5, kind: 'beach' },
  { id: 'brq-curima', name: 'Curimã', ...CE_BRQ, lat: -2.8914, lon: -41.1862, facing: 5, kind: 'beach' },
  { id: 'brq-bitupita', name: 'Bitupitá', ...CE_BRQ, lat: -2.8924, lon: -41.2762, facing: 5, kind: 'beach' },
]

const al = (city: string) => ({ city, state: 'AL', region: city, tidePort: 'maceio' }) as const
const AL_MGG = al('Maragogi')
const AL_JPT = al('Japaratinga')
const AL_PPD = al('Porto de Pedras')
const AL_PCM = al('Passo de Camaragibe')
const AL_BSA = al('Barra de Santo Antônio')
const AL_PRP = al('Paripueira')
const AL_MCZ = al('Maceió')
const AL_MDD = al('Marechal Deodoro')
const AL_BSM = al('Barra de São Miguel')
const AL_JEQ = al('Jequiá da Praia')
const AL_CRR = al('Coruripe')
const AL_FDZ = al('Feliz Deserto')
const AL_PCB = al('Piaçabuçu')
/** Litoral de Alagoas, de Maragogi (divisa com PE) a Piaçabuçu (divisa com SE). */
const ALAGOAS: Spot[] = [
  { id: 'mgg-pontademangue', name: 'Ponta de Mangue', ...AL_MGG, lat: -8.9575, lon: -35.1729, facing: 113, kind: 'beach' },
  { id: 'jpt-boqueirao', name: 'Barreiras do Boqueirão', ...AL_JPT, lat: -9.0755, lon: -35.2433, facing: 115, kind: 'beach' },
  { id: 'jpt-pontal', name: 'Pontal (Japaratinga)', ...AL_JPT, lat: -9.095, lon: -35.2584, facing: 98, kind: 'beach' },
  { id: 'ppd-patacho', name: 'Patacho', ...AL_PPD, lat: -9.1458, lon: -35.2867, facing: 100, kind: 'beach' },
  { id: 'ppd-tatuamunha', name: 'Tatuamunha', ...AL_PPD, lat: -9.2195, lon: -35.3291, facing: 113, kind: 'beach' },
  { id: 'pcm-morro', name: 'Praia do Morro', ...AL_PCM, lat: -9.3, lon: -35.3951, facing: 113, kind: 'beach' },
  { id: 'pcm-marceneiro', name: 'Marceneiro', ...AL_PCM, lat: -9.335, lon: -35.4309, facing: 90, kind: 'beach' },
  { id: 'bsa-carroquebrado', name: 'Carro Quebrado', ...AL_BSA, lat: -9.3624, lon: -35.47, facing: 110, kind: 'beach' },
  { id: 'bsa-tabuba', name: 'Tabuba', ...AL_BSA, lat: -9.3853, lon: -35.493, facing: 113, kind: 'beach' },
  { id: 'prp-sonhoverde', name: 'Sonho Verde', ...AL_PRP, lat: -9.4543, lon: -35.5291, facing: 100, kind: 'beach' },
  { id: 'mcz-ipioca', name: 'Ipioca', ...AL_MCZ, lat: -9.5128, lon: -35.5878, facing: 120, kind: 'beach' },
  { id: 'mcz-sereia', name: 'Praia da Sereia', ...AL_MCZ, lat: -9.553, lon: -35.633, facing: 125, kind: 'beach' },
  { id: 'mcz-riachodoce', name: 'Riacho Doce', ...AL_MCZ, lat: -9.566, lon: -35.648, facing: 130, kind: 'beach' },
  { id: 'mcz-garcatorta', name: 'Garça Torta', ...AL_MCZ, lat: -9.5852, lon: -35.6612, facing: 130, kind: 'beach' },
  { id: 'mcz-jacarecica', name: 'Jacarecica', ...AL_MCZ, lat: -9.6192, lon: -35.6903, facing: 120, kind: 'beach' },
  { id: 'mcz-cruzdasalmas', name: 'Cruz das Almas', ...AL_MCZ, lat: -9.634, lon: -35.6969, facing: 108, kind: 'beach' },
  { id: 'mcz-jatiuca', name: 'Jatiúca', ...AL_MCZ, lat: -9.6486, lon: -35.6996, facing: 110, kind: 'beach' },
  { id: 'mcz-pajucara', name: 'Pajuçara', ...AL_MCZ, lat: -9.6715, lon: -35.7148, facing: 125, kind: 'beach' },
  { id: 'mcz-avenida', name: 'Praia da Avenida', ...AL_MCZ, lat: -9.6712, lon: -35.7373, facing: 165, kind: 'beach' },
  { id: 'mcz-sobral', name: 'Sobral', ...AL_MCZ, lat: -9.6786, lon: -35.7544, facing: 150, kind: 'beach' },
  { id: 'mcz-pontaldabarra', name: 'Pontal da Barra', ...AL_MCZ, lat: -9.6948, lon: -35.7736, facing: 138, kind: 'beach' },
  { id: 'mdd-frances', name: 'Praia do Francês', ...AL_MDD, lat: -9.7733, lon: -35.8436, facing: 130, kind: 'reef' },
  { id: 'bsm-barra', name: 'Barra de São Miguel', ...AL_BSM, lat: -9.8279, lon: -35.8807, facing: 123, kind: 'beach' },
  { id: 'jeq-gunga', name: 'Gunga', ...AL_JEQ, lat: -9.852, lon: -35.9148, facing: 110, kind: 'beach' },
  { id: 'jeq-lagoaazeda', name: 'Lagoa Azeda', ...AL_JEQ, lat: -9.9916, lon: -35.9954, facing: 128, kind: 'beach' },
  { id: 'jeq-marape', name: 'Dunas de Marapé', ...AL_JEQ, lat: -10.0453, lon: -36.0267, facing: 120, kind: 'beach' },
  { id: 'crr-poxim', name: 'Barra do Poxim', ...AL_CRR, lat: -10.072, lon: -36.088, facing: 125, kind: 'beach' },
  { id: 'crr-lagoadopau', name: 'Lagoa do Pau', ...AL_CRR, lat: -10.1194, lon: -36.1057, facing: 118, kind: 'beach' },
  { id: 'crr-pontal', name: 'Pontal de Coruripe', ...AL_CRR, lat: -10.158, lon: -36.135, facing: 120, kind: 'beach' },
  { id: 'crr-miai', name: 'Miaí de Cima', ...AL_CRR, lat: -10.2488, lon: -36.2411, facing: 125, kind: 'beach' },
  { id: 'fdz-japu', name: 'Praia do Japu', ...AL_FDZ, lat: -10.3149, lon: -36.2993, facing: 130, kind: 'beach' },
  { id: 'pcb-peba', name: 'Pontal do Peba', ...AL_PCB, lat: -10.3561, lon: -36.2954, facing: 133, kind: 'beach' },
]

/** Amapá: costa de manguezal e foz do Amazonas, com maré de vários metros. Posições aproximadas. */
const AMAPA: Spot[] = [
  { id: 'mcp-parazinho', name: 'Ilha do Parazinho', city: 'Macapá', state: 'AP', region: 'Macapá', tidePort: 'bailique', lat: 0.93, lon: -49.92, facing: 60, kind: 'beach', note: 'Reserva Biológica do Parazinho, na foz do Amazonas' },
  { id: 'oia-caboorange', name: 'Cabo Orange', city: 'Oiapoque', state: 'AP', region: 'Oiapoque', tidePort: 'caboorange', lat: 4.38, lon: -51.47, facing: 50, kind: 'beach', note: 'Parque Nacional do Cabo Orange' },
]

const ba = (city: string, tidePort: string) => ({ city, state: 'BA', region: city, tidePort }) as const
const BA_JDR = ba('Jandaíra', 'salvador')
const BA_CND = ba('Conde', 'salvador')
const BA_ESP = ba('Esplanada', 'salvador')
const BA_ENT = ba('Entre Rios', 'salvador')
const BA_MSJ = ba('Mata de São João', 'salvador')
const BA_CAM = ba('Camaçari', 'salvador')
const BA_LDF = ba('Lauro de Freitas', 'salvador')
const BA_SSA = ba('Salvador', 'salvador')
const BA_VCZ = ba('Vera Cruz', 'salvador')
const BA_JGP = ba('Jaguaripe', 'salvador')
const BA_VAL = ba('Valença', 'salvador')
const BA_CAI = ba('Cairu', 'salvador')
const BA_NIP = ba('Nilo Peçanha', 'salvador')
const BA_ITB = ba('Ituberá', 'salvador')
const BA_IGP = ba('Igrapiúna', 'salvador')
const BA_MAU = ba('Maraú', 'ilheus')
const BA_ITC = ba('Itacaré', 'ilheus')
const BA_URC = ba('Uruçuca', 'ilheus')
const BA_ILH = ba('Ilhéus', 'ilheus')
const BA_UNA = ba('Una', 'ilheus')
const BA_CNV = ba('Canavieiras', 'portoseguro')
const BA_BLM = ba('Belmonte', 'portoseguro')
const BA_SCC = ba('Santa Cruz Cabrália', 'portoseguro')
const BA_PSE = ba('Porto Seguro', 'portoseguro')
const BA_PRD = ba('Prado', 'portoseguro')
const BA_ALC = ba('Alcobaça', 'caravelas')
const BA_CRV = ba('Caravelas', 'caravelas')
const BA_NVI = ba('Nova Viçosa', 'caravelas')
const BA_MUC = ba('Mucuri', 'caravelas')
/** Litoral da Bahia, de Mangue Seco (divisa com SE) a Mucuri (divisa com o ES). */
const BAHIA: Spot[] = [
  { id: 'jdr-mangueseco', name: 'Mangue Seco', ...BA_JDR, lat: -11.462, lon: -37.364, facing: 100, kind: 'beach' },
  { id: 'jdr-coqueiro', name: 'Coqueiro', ...BA_JDR, lat: -11.49, lon: -37.385, facing: 110, kind: 'beach' },
  { id: 'jdr-costaazul', name: 'Costa Azul', ...BA_JDR, lat: -11.5136, lon: -37.3922, facing: 125, kind: 'beach' },
  { id: 'cnd-mangueseco', name: 'Mangue Seco (Conde)', ...BA_CND, lat: -11.5366, lon: -37.4066, facing: 120, kind: 'beach' },
  { id: 'cnd-siribinha', name: 'Siribinha', ...BA_CND, lat: -11.6188, lon: -37.4499, facing: 115, kind: 'beach' },
  { id: 'cnd-costaazul', name: 'Costa Azul (Conde)', ...BA_CND, lat: -11.6737, lon: -37.4772, facing: 115, kind: 'beach' },
  { id: 'cnd-sitiodoconde', name: 'Sítio do Conde', ...BA_CND, lat: -11.8556, lon: -37.5647, facing: 115, kind: 'beach' },
  { id: 'cnd-itariri', name: 'Barra do Itariri', ...BA_CND, lat: -11.9604, lon: -37.6133, facing: 118, kind: 'beach' },
  { id: 'esp-baixio', name: 'Baixio', ...BA_ESP, lat: -12.1043, lon: -37.6896, facing: 120, kind: 'beach' },
  { id: 'ent-massarandupio', name: 'Massarandupió', ...BA_ENT, lat: -12.1473, lon: -37.715, facing: 120, kind: 'beach' },
  { id: 'ent-sabauma', name: 'Sabaúma', ...BA_ENT, lat: -12.2004, lon: -37.74, facing: 125, kind: 'beach' },
  { id: 'ent-portodesauipe', name: 'Porto de Sauípe', ...BA_ENT, lat: -12.3839, lon: -37.8762, facing: 123, kind: 'beach' },
  { id: 'msj-costadesauipe', name: 'Costa de Sauípe', ...BA_MSJ, lat: -12.44, lon: -37.924, facing: 130, kind: 'beach' },
  { id: 'msj-sabauma', name: 'Sabaúma (Mata de São João)', ...BA_MSJ, lat: -12.2997, lon: -37.8195, facing: 128, kind: 'beach' },
  { id: 'msj-imbassai', name: 'Imbassaí', ...BA_MSJ, lat: -12.4938, lon: -37.9561, facing: 120, kind: 'beach' },
  { id: 'msj-santoantonio', name: 'Santo Antônio', ...BA_MSJ, lat: -12.5349, lon: -37.9799, facing: 190, kind: 'beach' },
  { id: 'msj-pedragrande', name: 'Pedra Grande', ...BA_MSJ, lat: -12.5501, lon: -37.9859, facing: 118, kind: 'beach' },
  { id: 'msj-lord', name: 'Praia do Lord', ...BA_MSJ, lat: -12.5645, lon: -37.9938, facing: 110, kind: 'beach' },
  { id: 'msj-praiadoforte', name: 'Praia do Forte', ...BA_MSJ, lat: -12.5792, lon: -38.0047, facing: 145, kind: 'beach' },
  { id: 'cam-barradojacuipe', name: 'Barra do Jacuípe', ...BA_CAM, lat: -12.6304, lon: -38.0446, facing: 100, kind: 'beach' },
  { id: 'cam-guarajuba', name: 'Guarajuba', ...BA_CAM, lat: -12.665, lon: -38.0676, facing: 90, kind: 'beach' },
  { id: 'cam-itacimirim', name: 'Itacimirim', ...BA_CAM, lat: -12.69, lon: -38.0567, facing: 270, kind: 'beach' },
  { id: 'cam-buscavida', name: 'Busca Vida', ...BA_CAM, lat: -12.73, lon: -38.1335, facing: 90, kind: 'beach' },
  { id: 'cam-arembepe', name: 'Arembepe', ...BA_CAM, lat: -12.7722, lon: -38.1752, facing: 125, kind: 'beach' },
  { id: 'cam-genipabu', name: 'Genipabu', ...BA_CAM, lat: -12.8364, lon: -38.2334, facing: 125, kind: 'beach' },
  { id: 'cam-interlagos', name: 'Interlagos', ...BA_CAM, lat: -12.8618, lon: -38.2565, facing: 178, kind: 'beach' },
  { id: 'cam-jaua', name: 'Jauá', ...BA_CAM, lat: -12.8751, lon: -38.2728, facing: 95, kind: 'beach' },
  { id: 'ldf-villas', name: 'Villas do Atlântico', ...BA_LDF, lat: -12.8745, lon: -38.2708, facing: 170, kind: 'beach' },
  { id: 'ldf-ipitanga', name: 'Ipitanga', ...BA_LDF, lat: -12.8828, lon: -38.2818, facing: 125, kind: 'beach' },
  { id: 'ldf-buraquinho', name: 'Buraquinho', ...BA_LDF, lat: -12.8965, lon: -38.2935, facing: 130, kind: 'beach' },
  { id: 'ssa-flamengo', name: 'Flamengo', ...BA_SSA, lat: -12.9306, lon: -38.3202, facing: 140, kind: 'beach' },
  { id: 'ssa-stellamaris', name: 'Stella Maris', ...BA_SSA, lat: -12.9405, lon: -38.3306, facing: 135, kind: 'reef' },
  { id: 'ssa-itapoa', name: 'Itapuã', ...BA_SSA, lat: -12.951, lon: -38.3638, facing: 208, kind: 'beach' },
  { id: 'ssa-catussaba', name: 'Catussaba', ...BA_SSA, lat: -12.9557, lon: -38.3516, facing: 145, kind: 'beach' },
  { id: 'ssa-barravento', name: 'Barravento', ...BA_SSA, lat: -12.9529, lon: -38.3625, facing: 225, kind: 'beach' },
  { id: 'ssa-jaguaribe', name: 'Jaguaribe', ...BA_SSA, lat: -12.9586, lon: -38.391, facing: 150, kind: 'beach' },
  { id: 'ssa-corsario', name: 'Corsário', ...BA_SSA, lat: -12.9664, lon: -38.4035, facing: 140, kind: 'beach' },
  { id: 'ssa-paciencia', name: 'Paciência', ...BA_SSA, lat: -12.9766, lon: -38.4186, facing: 153, kind: 'beach' },
  { id: 'ssa-bocadorio', name: 'Boca do Rio', ...BA_SSA, lat: -12.98, lon: -38.4253, facing: 143, kind: 'beach' },
  { id: 'ssa-armacao', name: 'Armação', ...BA_SSA, lat: -12.9883, lon: -38.4347, facing: 130, kind: 'beach' },
  { id: 'ssa-jardimdealah', name: 'Jardim de Alah', ...BA_SSA, lat: -12.9993, lon: -38.4469, facing: 145, kind: 'beach' },
  { id: 'ssa-pituba', name: 'Pituba', ...BA_SSA, lat: -13.0039, lon: -38.4521, facing: 143, kind: 'beach' },
  { id: 'ssa-terceiraponte', name: 'Terceira Ponte', ...BA_SSA, lat: -13.0015, lon: -38.4725, facing: 150, kind: 'beach' },
  { id: 'ssa-amaralina', name: 'Amaralina', ...BA_SSA, lat: -13.014, lon: -38.4735, facing: 180, kind: 'beach' },
  { id: 'ssa-riovermelho', name: 'Rio Vermelho', ...BA_SSA, lat: -13.0121, lon: -38.4921, facing: 208, kind: 'beach' },
  { id: 'ssa-jardimdosnamorados', name: 'Jardim dos Namorados', ...BA_SSA, lat: -13.011, lon: -38.5032, facing: 188, kind: 'beach' },
  { id: 'ssa-ondina', name: 'Ondina', ...BA_SSA, lat: -13.0113, lon: -38.5116, facing: 175, kind: 'beach' },
  { id: 'ssa-farol', name: 'Farol da Barra', ...BA_SSA, lat: -13.0097, lon: -38.5267, facing: 195, kind: 'beach' },
  { id: 'ssa-portodabarra', name: 'Porto da Barra', ...BA_SSA, lat: -13.0072, lon: -38.533, facing: 200, kind: 'beach' },
  { id: 'vcz-penha', name: 'Praia da Penha', ...BA_VCZ, lat: -12.88, lon: -38.617, facing: 270, kind: 'beach' },
  { id: 'vcz-ilhadosol', name: 'Ilha do Sol', ...BA_VCZ, lat: -12.9029, lon: -38.64, facing: 18, kind: 'beach' },
  { id: 'vcz-acapulco', name: 'Acapulco', ...BA_VCZ, lat: -12.9695, lon: -38.6096, facing: 115, kind: 'beach' },
  { id: 'vcz-barradogil', name: 'Barra do Gil', ...BA_VCZ, lat: -12.9952, lon: -38.6306, facing: 138, kind: 'beach' },
  { id: 'vcz-paratinga', name: 'Paratinga', ...BA_VCZ, lat: -12.9962, lon: -38.7039, facing: 298, kind: 'beach' },
  { id: 'vcz-barragrande', name: 'Barra Grande (Vera Cruz)', ...BA_VCZ, lat: -13.0383, lon: -38.6732, facing: 148, kind: 'beach' },
  { id: 'vcz-canoa', name: 'Praia da Canoa', ...BA_VCZ, lat: -13.0283, lon: -38.7236, facing: 309, kind: 'beach' },
  { id: 'vcz-cachapregos', name: 'Cacha Pregos', ...BA_VCZ, lat: -13.038, lon: -38.7257, facing: 20, kind: 'beach' },
  { id: 'vcz-conceicao', name: 'Praia da Conceição', ...BA_VCZ, lat: -13.0158, lon: -38.6444, facing: 123, kind: 'beach' },
  { id: 'vcz-araua', name: 'Enseada do Arauá', ...BA_VCZ, lat: -13.0548, lon: -38.6945, facing: 138, kind: 'beach' },
  { id: 'vcz-barradopote', name: 'Barra do Pote', ...BA_VCZ, lat: -13.0773, lon: -38.7269, facing: 270, kind: 'beach' },
  { id: 'jgp-pontinha', name: 'Pontinha', ...BA_JGP, lat: -13.1499, lon: -38.8224, facing: 160, kind: 'beach' },
  { id: 'jgp-pontadogarcez', name: 'Ponta do Garcez', ...BA_JGP, lat: -13.1803, lon: -38.8641, facing: 120, kind: 'beach' },
  { id: 'jgp-jiquirica', name: 'Barra do Jiquiriçá', ...BA_JGP, lat: -13.2142, lon: -38.915, facing: 160, kind: 'beach' },
  { id: 'val-taquari', name: 'Taquari', ...BA_VAL, lat: -13.3105, lon: -38.9663, facing: 90, kind: 'beach' },
  { id: 'val-guaibim', name: 'Guaibim', ...BA_VAL, lat: -13.2839, lon: -38.9627, facing: 105, kind: 'beach' },
  { id: 'val-pontadocurral', name: 'Ponta do Curral', ...BA_VAL, lat: -13.3679, lon: -38.9715, facing: 210, kind: 'beach' },
  { id: 'cai-primeira', name: 'Primeira Praia', ...BA_CAI, lat: -13.3803, lon: -38.9099, facing: 48, kind: 'beach' },
  { id: 'cai-quarta', name: 'Quarta Praia', ...BA_CAI, lat: -13.3801, lon: -38.9213, facing: 333, kind: 'beach' },
  { id: 'cai-cueira', name: 'Cueira', ...BA_CAI, lat: -13.3885, lon: -38.9311, facing: 335, kind: 'beach' },
  { id: 'cai-forte', name: 'Praia do Forte (Cairu)', ...BA_CAI, lat: -13.3972, lon: -38.942, facing: 333, kind: 'beach' },
  { id: 'cai-pontal', name: 'Pontal (Cairu)', ...BA_CAI, lat: -13.4038, lon: -38.9545, facing: 350, kind: 'beach' },
  { id: 'cai-morere', name: 'Moreré', ...BA_CAI, lat: -13.5117, lon: -38.9251, facing: 120, kind: 'beach' },
  { id: 'nip-pontal', name: 'Pontal (Nilo Peçanha)', ...BA_NIP, lat: -13.6576, lon: -38.8972, facing: 150, kind: 'beach' },
  { id: 'itb-serinhaem', name: 'Barra do Serinhaém', ...BA_ITB, lat: -13.8252, lon: -38.9846, facing: 100, kind: 'beach' },
  { id: 'itb-pratigi', name: 'Pratigi', ...BA_ITB, lat: -13.7135, lon: -38.9865, facing: 118, kind: 'beach' },
  { id: 'igp-quiepe', name: 'Ilha de Quiepe', ...BA_IGP, lat: -13.85, lon: -39.011, facing: 100, kind: 'beach' },
  { id: 'mau-barragrande', name: 'Barra Grande', ...BA_MAU, lat: -13.882, lon: -38.9426, facing: 98, kind: 'beach' },
  { id: 'mau-taipus', name: 'Taipus de Fora', ...BA_MAU, lat: -14.0309, lon: -38.9475, facing: 110, kind: 'beach' },
  { id: 'mau-algodoes', name: 'Algodões', ...BA_MAU, lat: -14.1722, lon: -38.9813, facing: 130, kind: 'beach' },
  { id: 'mau-saquaira', name: 'Saquaíra', ...BA_MAU, lat: -14.07, lon: -38.957, facing: 95, kind: 'beach' },
  { id: 'mau-cassange', name: 'Cassange', ...BA_MAU, lat: -14.1002, lon: -38.9631, facing: 120, kind: 'beach' },
  { id: 'mau-pontadomuta', name: 'Ponta do Mutá', ...BA_MAU, lat: -13.93, lon: -38.931, facing: 95, kind: 'beach' },
  { id: 'mau-bombaca', name: 'Bombaça', ...BA_MAU, lat: -14.1398, lon: -38.9753, facing: 100, kind: 'beach' },
  { id: 'mau-trescoqueiros', name: 'Três Coqueiros', ...BA_MAU, lat: -14.205, lon: -38.991, facing: 95, kind: 'beach' },
  { id: 'itc-camboinha', name: 'Camboinha', ...BA_ITC, lat: -14.2245, lon: -38.9901, facing: 118, kind: 'beach' },
  { id: 'itc-piracanga', name: 'Piracanga', ...BA_ITC, lat: -14.2116, lon: -38.9915, facing: 80, kind: 'beach' },
  { id: 'itc-ribeira', name: 'Ribeira', ...BA_ITC, lat: -14.2693, lon: -38.9942, facing: 73, kind: 'beach' },
  { id: 'itc-pontal', name: 'Pontal (Itacaré)', ...BA_ITC, lat: -14.2738, lon: -38.9923, facing: 50, kind: 'beach' },
  { id: 'itc-costa', name: 'Praia da Costa', ...BA_ITC, lat: -14.2854, lon: -38.9851, facing: 103, kind: 'beach' },
  { id: 'itc-tiririca', name: 'Tiririca', ...BA_ITC, lat: -14.2883, lon: -38.9853, facing: 78, kind: 'beach' },
  { id: 'itc-resende', name: 'Resende', ...BA_ITC, lat: -14.2899, lon: -38.9847, facing: 58, kind: 'beach' },
  { id: 'itc-prainha', name: 'Prainha', ...BA_ITC, lat: -14.3066, lon: -38.9881, facing: 125, kind: 'beach' },
  { id: 'itc-saojose', name: 'São José', ...BA_ITC, lat: -14.3136, lon: -38.9913, facing: 128, kind: 'beach' },
  { id: 'itc-havaizinho', name: 'Havaizinho', ...BA_ITC, lat: -14.3203, lon: -38.9937, facing: 100, kind: 'beach' },
  { id: 'itc-engenhoca', name: 'Engenhoca', ...BA_ITC, lat: -14.3585, lon: -39.0007, facing: 130, kind: 'beach' },
  { id: 'itc-itacarezinho', name: 'Itacarezinho', ...BA_ITC, lat: -14.3694, lon: -39.0074, facing: 118, kind: 'beach' },
  { id: 'itc-jeribucacu', name: 'Jeribucaçu', ...BA_ITC, lat: -14.411, lon: -39.0124, facing: 90, kind: 'beach' },
  { id: 'itc-corais', name: 'Arrecife Corais', ...BA_ITC, lat: -14.3297, lon: -38.9963, facing: 115, kind: 'beach' },
  { id: 'urc-sargi', name: 'Sargi', ...BA_URC, lat: -14.4407, lon: -39.0221, facing: 103, kind: 'beach' },
  { id: 'urc-pompilho', name: 'Pompilho', ...BA_URC, lat: -14.47, lon: -39.0269, facing: 105, kind: 'beach' },
  { id: 'urc-pedeserra', name: 'Pé de Serra', ...BA_URC, lat: -14.4996, lon: -39.035, facing: 90, kind: 'beach' },
  { id: 'ilh-batuba', name: 'Batuba', ...BA_ILH, lat: -14.6088, lon: -39.057, facing: 188, kind: 'beach' },
  { id: 'ilh-mamoa', name: 'Mamoã', ...BA_ILH, lat: -14.6306, lon: -39.063, facing: 98, kind: 'beach' },
  { id: 'ilh-juerana', name: 'Juerana', ...BA_ILH, lat: -14.6682, lon: -39.0654, facing: 93, kind: 'beach' },
  { id: 'ilh-saomiguel', name: 'São Miguel', ...BA_ILH, lat: -14.6899, lon: -39.04, facing: 180, kind: 'beach' },
  { id: 'ilh-norte', name: 'Praia do Norte', ...BA_ILH, lat: -14.7324, lon: -39.03, facing: 180, kind: 'beach' },
  { id: 'ilh-pontadoramo', name: 'Ponta do Ramo', ...BA_ILH, lat: -14.7809, lon: -39.031, facing: 5, kind: 'beach' },
  { id: 'ilh-avenida', name: 'Praia da Avenida', ...BA_ILH, lat: -14.7838, lon: -39.0291, facing: 60, kind: 'beach' },
  { id: 'ilh-malhado', name: 'Malhado', ...BA_ILH, lat: -14.795, lon: -39.0278, facing: 100, kind: 'beach' },
  { id: 'ilh-backdoor', name: 'Back Door', ...BA_ILH, lat: -14.8001, lon: -39.029, facing: 103, kind: 'beach' },
  { id: 'ilh-pontadatulha', name: 'Ponta da Tulha', ...BA_ILH, lat: -14.8076, lon: -39.0279, facing: 5, kind: 'beach' },
  { id: 'ilh-sul', name: 'Praia do Sul', ...BA_ILH, lat: -14.8195, lon: -39.0247, facing: 90, kind: 'beach' },
  { id: 'ilh-milionarios', name: 'Milionários', ...BA_ILH, lat: -14.8395, lon: -39.0247, facing: 90, kind: 'beach' },
  { id: 'ilh-miache', name: 'Miache', ...BA_ILH, lat: -14.8595, lon: -39.0241, facing: 90, kind: 'beach' },
  { id: 'una-acuipe', name: 'Acuípe', ...BA_UNA, lat: -15.1079, lon: -38.9964, facing: 88, kind: 'beach' },
  { id: 'una-itapororoca', name: 'Itapororoca', ...BA_UNA, lat: -15.297, lon: -38.9883, facing: 75, kind: 'beach' },
  { id: 'una-comandatuba', name: 'Comandatuba', ...BA_UNA, lat: -15.3519, lon: -38.979, facing: 80, kind: 'beach' },
  { id: 'cnv-barravelha', name: 'Barra Velha', ...BA_CNV, lat: -15.5992, lon: -38.9407, facing: 88, kind: 'beach' },
  { id: 'cnv-costa', name: 'Praia da Costa', ...BA_CNV, lat: -15.6577, lon: -38.9364, facing: 10, kind: 'beach' },
  { id: 'cnv-atalaia', name: 'Atalaia', ...BA_CNV, lat: -15.6694, lon: -38.9339, facing: 75, kind: 'beach' },
  { id: 'cnv-norte', name: 'Praia do Norte (Barra do Albino)', ...BA_CNV, lat: -15.738, lon: -38.924, facing: 95, kind: 'beach' },
  { id: 'blm-norte', name: 'Praia do Norte', ...BA_BLM, lat: -15.8424, lon: -38.867, facing: 131, kind: 'beach' },
  { id: 'blm-barra', name: 'Praia da Barra', ...BA_BLM, lat: -15.8613, lon: -38.8624, facing: 103, kind: 'beach' },
  { id: 'blm-marmoreno', name: 'Mar Moreno', ...BA_BLM, lat: -15.8992, lon: -38.8747, facing: 113, kind: 'beach' },
  { id: 'blm-garuzau', name: 'Garuzau', ...BA_BLM, lat: -15.9402, lon: -38.88, facing: 180, kind: 'beach' },
  { id: 'blm-mogiquicaba', name: 'Mogiquiçaba', ...BA_BLM, lat: -16.0511, lon: -38.9136, facing: 90, kind: 'beach' },
  { id: 'scc-arakakai', name: 'Arakakai', ...BA_SCC, lat: -16.2487, lon: -39.0079, facing: 30, kind: 'beach' },
  { id: 'scc-mutari', name: 'Mutari', ...BA_SCC, lat: -16.2777, lon: -39.0191, facing: 108, kind: 'beach' },
  { id: 'scc-guaiau', name: 'Guaiaú', ...BA_SCC, lat: -16.3096, lon: -39, facing: 180, kind: 'beach' },
  { id: 'scc-coroavermelha', name: 'Coroa Vermelha', ...BA_SCC, lat: -16.3559, lon: -39.0129, facing: 78, kind: 'beach' },
  { id: 'pse-pescadores', name: 'Pescadores', ...BA_PSE, lat: -16.4299, lon: -39.0602, facing: 113, kind: 'beach' },
  { id: 'pse-mucuge', name: 'Mucugê', ...BA_PSE, lat: -16.4939, lon: -39.0683, facing: 105, kind: 'beach' },
  { id: 'pse-apagafogo', name: 'Apaga Fogo', ...BA_PSE, lat: -16.478, lon: -39.0645, facing: 118, kind: 'beach' },
  { id: 'pse-itacimirim', name: 'Itacimirim (Porto Seguro)', ...BA_PSE, lat: -16.4976, lon: -39.0694, facing: 108, kind: 'beach' },
  { id: 'pse-riodoverde', name: 'Rio Verde', ...BA_PSE, lat: -16.5098, lon: -39.06, facing: 180, kind: 'beach' },
  { id: 'pse-taipe', name: 'Taípe', ...BA_PSE, lat: -16.5283, lon: -39.0805, facing: 103, kind: 'beach' },
  { id: 'pse-riodosfrades', name: 'Barra do Rio dos Frades', ...BA_PSE, lat: -16.62, lon: -39.0564, facing: 270, kind: 'beach' },
  { id: 'pse-caraiva', name: 'Barra de Caraíva', ...BA_PSE, lat: -16.7974, lon: -39.1446, facing: 90, kind: 'beach' },
  { id: 'prd-novoprado', name: 'Novo Prado', ...BA_PRD, lat: -17.3426, lon: -39.2163, facing: 90, kind: 'beach' },
  { id: 'prd-barra', name: 'Praia da Barra', ...BA_PRD, lat: -17.3314, lon: -39.2181, facing: 83, kind: 'beach' },
  { id: 'prd-paixao', name: 'Paixão', ...BA_PRD, lat: -17.338, lon: -39.1825, facing: 90, kind: 'beach' },
  { id: 'prd-ostras', name: 'Praia das Ostras', ...BA_PRD, lat: -17.3506, lon: -39.2, facing: 180, kind: 'beach' },
  { id: 'prd-mestrecharles', name: 'Mestre Charles', ...BA_PRD, lat: -17.3829, lon: -39.2083, facing: 75, kind: 'beach' },
  { id: 'prd-barradocai', name: 'Barra do Caí', ...BA_PRD, lat: -17.4008, lon: -39.203, facing: 83, kind: 'beach' },
  { id: 'prd-japaramirim', name: 'Japara Mirim', ...BA_PRD, lat: -17.4493, lon: -39.1921, facing: 88, kind: 'beach' },
  { id: 'prd-tororao', name: 'Tororão', ...BA_PRD, lat: -17.4693, lon: -39.1923, facing: 90, kind: 'beach' },
  { id: 'alc-alcobaca', name: 'Alcobaça', ...BA_ALC, lat: -17.5212, lon: -39.1917, facing: 90, kind: 'beach' },
  { id: 'alc-coqueiro', name: 'Coqueiro (Alcobaça)', ...BA_ALC, lat: -17.5497, lon: -39.1895, facing: 80, kind: 'beach' },
  { id: 'crv-pontadabaleia', name: 'Ponta da Baleia', ...BA_CRV, lat: -17.6859, lon: -39.117, facing: 120, kind: 'beach' },
  { id: 'crv-barranova', name: 'Barra Nova', ...BA_CRV, lat: -17.7537, lon: -39.1973, facing: 330, kind: 'beach' },
  { id: 'nvi-barravelha', name: 'Barra Velha (Nova Viçosa)', ...BA_NVI, lat: -17.86, lon: -39.302, facing: 100, kind: 'beach' },
  { id: 'nvi-costadoatlantico', name: 'Costa do Atlântico', ...BA_NVI, lat: -17.8843, lon: -39.3051, facing: 83, kind: 'beach' },
  { id: 'nvi-lugarcomum', name: 'Lugar Comum', ...BA_NVI, lat: -17.891, lon: -39.3509, facing: 185, kind: 'beach' },
  { id: 'nvi-coroavermelha', name: 'Ilha da Coroa Vermelha', ...BA_NVI, lat: -17.8991, lon: -39.3609, facing: 85, kind: 'beach' },
  { id: 'muc-jucutinga', name: 'Jucutinga', ...BA_MUC, lat: -18.0511, lon: -39.5268, facing: 120, kind: 'beach' },
  { id: 'muc-mucuri', name: 'Mucuri', ...BA_MUC, lat: -18.0887, lon: -39.5464, facing: 118, kind: 'beach' },
  { id: 'muc-costadourada', name: 'Costa Dourada', ...BA_MUC, lat: -18.1046, lon: -39.5531, facing: 128, kind: 'beach' },
]

const pe = (city: string) => ({ city, state: 'PE', region: city, tidePort: 'recife' }) as const
const PE_GOI = pe('Goiana')
const PE_ITK = pe('Ilha de Itamaracá')
const PE_PLS = pe('Paulista')
const PE_OLI = pe('Olinda')
const PE_REC = pe('Recife')
const PE_JAB = pe('Jaboatão dos Guararapes')
const PE_CAB = pe('Cabo de Santo Agostinho')
const PE_IPJ = pe('Ipojuca')
const PE_SIR = pe('Sirinhaém')
const PE_TAM = pe('Tamandaré')
const PE_BRR = pe('Barreiros')
const PE_SJC = pe('São José da Coroa Grande')
/** Litoral de Pernambuco, de Goiana (divisa com a PB) a São José da Coroa Grande (divisa com AL). */
const PERNAMBUCO: Spot[] = [
  { id: 'goi-carnedevaca', name: 'Carne de Vaca', ...PE_GOI, lat: -7.5768, lon: -34.8304, facing: 75, kind: 'beach' },
  { id: 'itk-jaguaribe', name: 'Jaguaribe', ...PE_ITK, lat: -7.7312, lon: -34.8251, facing: 80, kind: 'beach' },
  { id: 'itk-pilar', name: 'Pilar', ...PE_ITK, lat: -7.7511, lon: -34.8235, facing: 95, kind: 'beach' },
  { id: 'itk-forteorange', name: 'Forte Orange', ...PE_ITK, lat: -7.811, lon: -34.838, facing: 110, kind: 'beach' },
  { id: 'pls-mariafarinha', name: 'Maria Farinha', ...PE_PLS, lat: -7.8534, lon: -34.8351, facing: 78, kind: 'beach' },
  { id: 'pls-conceicao', name: 'Praia da Conceição', ...PE_PLS, lat: -7.8834, lon: -34.8254, facing: 65, kind: 'beach' },
  { id: 'pls-pauamarelo', name: 'Pau Amarelo', ...PE_PLS, lat: -7.9059, lon: -34.8248, facing: 75, kind: 'beach' },
  { id: 'pls-janga', name: 'Janga', ...PE_PLS, lat: -7.9323, lon: -34.8221, facing: 107, kind: 'beach' },
  { id: 'oli-bairronovo', name: 'Bairro Novo', ...PE_OLI, lat: -8.0022, lon: -34.8394, facing: 100, kind: 'beach' },
  { id: 'oli-delchifre', name: 'Del Chifre (Milagres)', ...PE_OLI, lat: -8.0216, lon: -34.8505, facing: 110, kind: 'beach' },
  { id: 'rec-pina', name: 'Pina', ...PE_REC, lat: -8.092, lon: -34.881, facing: 100, kind: 'beach' },
  { id: 'rec-boaviagem', name: 'Boa Viagem', ...PE_REC, lat: -8.1258, lon: -34.8969, facing: 108, kind: 'beach' },
  { id: 'jab-piedade', name: 'Piedade', ...PE_JAB, lat: -8.1751, lon: -34.9155, facing: 105, kind: 'beach' },
  { id: 'jab-candeias', name: 'Candeias', ...PE_JAB, lat: -8.195, lon: -34.9174, facing: 82, kind: 'beach' },
  { id: 'cab-paiva', name: 'Paiva', ...PE_CAB, lat: -8.2746, lon: -34.9462, facing: 100, kind: 'beach' },
  { id: 'cab-itapuama', name: 'Itapuama', ...PE_CAB, lat: -8.298, lon: -34.9524, facing: 68, kind: 'beach' },
  { id: 'cab-xareu', name: 'Pedra do Xaréu', ...PE_CAB, lat: -8.3027, lon: -34.9477, facing: 90, kind: 'beach' },
  { id: 'cab-nordestao', name: 'Nordestão', ...PE_CAB, lat: -8.3125, lon: -34.9469, facing: 110, kind: 'beach' },
  { id: 'cab-enseadadoscorais', name: 'Enseada dos Corais', ...PE_CAB, lat: -8.322, lon: -34.9485, facing: 100, kind: 'beach' },
  { id: 'cab-gaibu', name: 'Gaibu', ...PE_CAB, lat: -8.3366, lon: -34.9507, facing: 85, kind: 'beach' },
  { id: 'cab-calhetas', name: 'Calhetas', ...PE_CAB, lat: -8.3453, lon: -34.9406, facing: 60, kind: 'beach' },
  { id: 'ipj-suape', name: 'Porto de Suape', ...PE_IPJ, lat: -8.3988, lon: -34.9596, facing: 116, kind: 'beach' },
  { id: 'ipj-muroalto', name: 'Muro Alto', ...PE_IPJ, lat: -8.4274, lon: -34.9776, facing: 112, kind: 'beach' },
  { id: 'ipj-cupe', name: 'Cupe', ...PE_IPJ, lat: -8.4627, lon: -34.988, facing: 128, kind: 'beach' },
  { id: 'ipj-portodegalinhas', name: 'Porto de Galinhas', ...PE_IPJ, lat: -8.5055, lon: -35.0004, facing: 100, kind: 'beach' },
  { id: 'ipj-borete', name: 'Borete', ...PE_IPJ, lat: -8.515, lon: -35.0051, facing: 110, kind: 'beach' },
  { id: 'ipj-maracaipe', name: 'Maracaípe', ...PE_IPJ, lat: -8.531, lon: -35.0069, facing: 83, kind: 'reef' },
  { id: 'ipj-pontalmaracaipe', name: 'Pontal de Maracaípe', ...PE_IPJ, lat: -8.5435, lon: -35.005, facing: 110, kind: 'beach' },
  { id: 'ipj-serrambi', name: 'Ponta de Serrambi', ...PE_IPJ, lat: -8.5599, lon: -35.0177, facing: 130, kind: 'reef' },
  { id: 'sir-barra', name: 'Barra de Sirinhaém', ...PE_SIR, lat: -8.6126, lon: -35.0478, facing: 120, kind: 'beach' },
  { id: 'sir-santoaleixo', name: 'Ilha de Santo Aleixo', ...PE_SIR, lat: -8.6124, lon: -35.0221, facing: 94, kind: 'beach' },
  { id: 'tam-carneiros', name: 'Carneiros', ...PE_TAM, lat: -8.7007, lon: -35.0772, facing: 113, kind: 'beach' },
  { id: 'tam-tamandare', name: 'Tamandaré', ...PE_TAM, lat: -8.7604, lon: -35.0985, facing: 110, kind: 'beach' },
  { id: 'brr-porto', name: 'Praia do Porto', ...PE_BRR, lat: -8.8099, lon: -35.1209, facing: 118, kind: 'beach' },
  { id: 'brr-varzeadouna', name: 'Várzea do Una', ...PE_BRR, lat: -8.8386, lon: -35.1342, facing: 98, kind: 'beach' },
  { id: 'sjc-saojose', name: 'São José da Coroa Grande', ...PE_SJC, lat: -8.8909, lon: -35.1428, facing: 98, kind: 'beach' },
]

/** Fernando de Noronha (PE): Mar de Dentro (Vila dos Remédios, voltado para noroeste) e Mar de Fora (sudeste). */
const NORONHA = { city: 'Fernando de Noronha', state: 'PE', region: 'Fernando de Noronha', tidePort: 'noronha' } as const
const FERNANDO_DE_NORONHA: Spot[] = [
  { id: 'fn-porto', name: 'Praia do Porto', ...NORONHA, lat: -3.834, lon: -32.4007, facing: 320, kind: 'beach', note: 'Vila dos Remédios' },
  { id: 'fn-ampesca', name: 'Ampesca', ...NORONHA, lat: -3.8362, lon: -32.4041, facing: 328, kind: 'beach', note: 'Vila dos Remédios' },
  { id: 'fn-abras', name: 'Abras', ...NORONHA, lat: -3.8368, lon: -32.4051, facing: 335, kind: 'beach', note: 'Vila dos Remédios' },
  { id: 'fn-biboca', name: 'Biboca', ...NORONHA, lat: -3.8383, lon: -32.4071, facing: 340, kind: 'beach', note: 'Vila dos Remédios' },
  { id: 'fn-cachorro', name: 'Praia do Cachorro', ...NORONHA, lat: -3.8393, lon: -32.4115, facing: 330, kind: 'beach', note: 'Vila dos Remédios' },
  { id: 'fn-meio', name: 'Praia do Meio', ...NORONHA, lat: -3.8396, lon: -32.4135, facing: 331, kind: 'beach', note: 'Vila dos Remédios' },
  { id: 'fn-conceicao', name: 'Conceição', ...NORONHA, lat: -3.8413, lon: -32.4175, facing: 335, kind: 'beach', note: 'Vila dos Remédios' },
  { id: 'fn-boldro', name: 'Boldró', ...NORONHA, lat: -3.8445, lon: -32.4275, facing: 333, kind: 'beach', note: 'Vila dos Remédios' },
  { id: 'fn-bode', name: 'Praia do Bode', ...NORONHA, lat: -3.849, lon: -32.4375, facing: 340, kind: 'beach', note: 'Vila dos Remédios' },
  { id: 'fn-quixaba', name: 'Quixaba', ...NORONHA, lat: -3.8508, lon: -32.4405, facing: 330, kind: 'beach', note: 'Vila dos Remédios' },
  { id: 'fn-cacimba', name: 'Cacimba do Padre', ...NORONHA, lat: -3.8535, lon: -32.4425, facing: 320, kind: 'beach', note: 'Vila dos Remédios' },
  { id: 'fn-caieira', name: 'Enseada da Caieira', ...NORONHA, lat: -3.8389, lon: -32.3997, facing: 78, kind: 'beach', note: 'Mar de Fora' },
  { id: 'fn-sueste', name: 'Baía do Sueste', ...NORONHA, lat: -3.8663, lon: -32.4255, facing: 138, kind: 'beach', note: 'Mar de Fora' },
  { id: 'fn-leao', name: 'Praia do Leão', ...NORONHA, lat: -3.8704, lon: -32.4376, facing: 167, kind: 'beach', note: 'Mar de Fora' },
]

/**
 * Picos do litoral brasileiro, do Sul ao Nordeste.
 * Coordenadas e orientação aproximadas; ajuste conforme o conhecimento local.
 */
export const ALL_SPOTS: Spot[] = [
  { id: 'torres', name: 'Praia da Cal', city: 'Torres', state: 'RS', lat: -29.344, lon: -49.722, facing: 110, kind: 'beach' },
  ...SANTA_CATARINA,
  { id: 'matinhos', name: 'Matinhos', city: 'Matinhos', state: 'PR', lat: -25.82, lon: -48.53, facing: 110, kind: 'beach' },
  ...LITORAL_SUL,
  ...BAIXADA_SUL,
  ...GUARUJA,
  ...BAIXADA_NORTE,
  ...LITORAL_NORTE,
  ...RIO_DE_JANEIRO,
  ...ESPIRITO_SANTO,
  ...BAHIA,
  ...ALAGOAS,
  ...PERNAMBUCO,
  { id: 'pipa', name: 'Praia do Amor', city: 'Pipa', state: 'RN', lat: -6.23, lon: -35.04, facing: 90, kind: 'reef' },
  ...CEARA,
  ...AMAPA,
  ...FERNANDO_DE_NORONHA,
]

/** Estados no ar na produção. */
export const PROD_STATES = ['SC', 'SP', 'RJ', 'ES', 'AL', 'CE', 'AP', 'BA', 'PE']

export type SpotScope = 'prod' | 'baixada' | 'all'

/**
 * Picos de um escopo: 'prod' = estados da produção (SC, SP, RJ, ES, BA, AL, PE, CE e AP), só praias com onda; 'baixada' = só a
 * Baixada Santista; 'all' = todos. Sempre sem as praias abrigadas, menos em 'all'.
 */
export function spotsForScope(scope: SpotScope): Spot[] {
  if (scope === 'all') return ALL_SPOTS
  if (scope === 'baixada') return ALL_SPOTS.filter((s) => s.baixada && !s.sheltered)
  return ALL_SPOTS.filter((s) => PROD_STATES.includes(s.state) && !s.sheltered)
}

/** ids antigos que viraram outros picos (links salvos continuam funcionando) */
export const SPOT_ALIASES: Record<string, string> = {
  'gua-tombo': 'gua-tombo-palanque',
  maresias: 'sse-maresias',
  juquehy: 'sse-juquehy',
  itamambuca: 'uba-itamambuca',
  silveira: 'gar-silveira',
  imbituba: 'imb-vila',
  guarda: 'plo-guarda',
  joaquina: 'fln-joaquina',
  mole: 'fln-mole',
  'jag-cardoso': 'lag-cardoso',
  prainha: 'rio-prainha',
  barra: 'rio-barra',
  arpoador: 'rio-arpoador',
  itauna: 'sqr-itauna',
  geriba: 'bzs-geriba',
  jacaraipe: 'ser-jacaraipe',
  paracuru: 'prc-pedrameio',
  jeri: 'jij-jericoacoara',
  frances: 'mdd-frances',
  maracaipe: 'ipj-maracaipe',
  cacimba: 'fn-cacimba',
  itacare: 'itc-tiririca',
  stellamaris: 'ssa-stellamaris',
}

export const KIND_LABEL: Record<Spot['kind'], string> = {
  beach: 'Beach break',
  reef: 'Fundo de pedra',
  point: 'Point break',
}

/** Distância em km (haversine). */
export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLon = toRad(bLon - aLon)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
