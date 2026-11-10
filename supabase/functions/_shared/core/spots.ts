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
  { id: 'jacaraipe', name: 'Jacaraípe', city: 'Serra', state: 'ES', lat: -20.15, lon: -40.18, facing: 90, kind: 'beach' },
  { id: 'itacare', name: 'Tiririca', city: 'Itacaré', state: 'BA', lat: -14.29, lon: -38.99, facing: 90, kind: 'beach' },
  { id: 'stellamaris', name: 'Stella Maris', city: 'Salvador', state: 'BA', lat: -12.94, lon: -38.33, facing: 130, kind: 'reef' },
  { id: 'frances', name: 'Praia do Francês', city: 'Marechal Deodoro', state: 'AL', lat: -9.77, lon: -35.84, facing: 130, kind: 'reef' },
  { id: 'maracaipe', name: 'Maracaípe', city: 'Ipojuca', state: 'PE', lat: -8.53, lon: -34.995, facing: 110, kind: 'reef' },
  { id: 'pipa', name: 'Praia do Amor', city: 'Pipa', state: 'RN', lat: -6.23, lon: -35.04, facing: 90, kind: 'reef' },
  { id: 'paracuru', name: 'Paracuru', city: 'Paracuru', state: 'CE', lat: -3.4, lon: -39.03, facing: 0, kind: 'reef' },
  { id: 'jeri', name: 'Jericoacoara', city: 'Jijoca', state: 'CE', lat: -2.79, lon: -40.51, facing: 350, kind: 'point' },
  { id: 'cacimba', name: 'Cacimba do Padre', city: 'Fernando de Noronha', state: 'PE', region: 'PE · Fernando de Noronha', lat: -3.85, lon: -32.44, facing: 330, kind: 'beach' },
]

/** Estados no ar na produção. */
export const PROD_STATES = ['SC', 'SP', 'RJ']

export type SpotScope = 'prod' | 'baixada' | 'all'

/**
 * Picos de um escopo: 'prod' = estados da produção (SC, SP e RJ), só praias com onda; 'baixada' = só a
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
