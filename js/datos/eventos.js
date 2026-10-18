// Sucesos de las ciudades, sitios especiales de cada camino y objetos
// Ruleta de evento de las ciudades (w = peso: los raros ocupan menos)
const EVENTS = {
  trainer: { label: 'Entrenador', short: 'ENTRENADOR', color: '#ff5a46', w: 1 },
  shop: { label: 'Tienda', short: 'TIENDA', color: '#6390f0', w: 1 },
  tea: { label: 'Té del anciano', short: 'TÉ', color: '#7ac74c', w: 1 },
  egg: { label: 'Huevo misterioso', short: 'HUEVO', color: '#f4a6c8', w: .5 },
  rocket: { label: 'Team Rocket', short: 'ROCKET', color: '#a33ea1', w: .5 },
  kurt: { label: 'Bonguri de Kurt', short: 'KURT', color: '#e0a040', w: 1 },
  casino: { label: 'Casino', short: 'CASINO', color: '#ffd84a', w: 1 },
  burned: { label: 'Torre Quemada', short: 'TORRE', color: '#ffd84a', w: .5 },
  lighthouse: { label: 'Faro de Olivo', short: 'FARO', color: '#f2e27a', w: 1 },
  pharmacy: { label: 'Medicina secreta', short: 'MEDICINA', color: '#b46cff', w: .5 },
  lake: { label: 'Lago de la Furia', short: 'LAGO', color: '#ff3b3b', w: .5 },
  dragon: { label: 'Guarida del Dragón', short: 'GUARIDA', color: '#7a6cff', w: .5 },
  togepi: { label: 'Huevo de Togepi', short: 'TOGEPI', color: '#f4a6c8', w: 1 },
  bellsprout: { label: 'Torre Bellsprout', short: 'TORRE', color: '#ff9f43', w: 1 },
  ruins: { label: 'Ruinas Alfa', short: 'RUINAS', color: '#ff9f43', w: 1 },
  // Kanto
  viridian: { label: 'Bosque Verde', short: 'BOSQUE', color: '#ff9f43', w: 1 },
  moon: { label: 'Mt. Moon', short: 'MT. MOON', color: '#ff9f43', w: 1 },
  magikarp: { label: 'Vendedor de Magikarp', short: 'MAGIKARP', color: '#ff9f43', w: 1, pw: .6 },
  bill: { label: 'Casa de Bill', short: 'BILL', color: '#ff9f43', w: 1 },
  ssanne: { label: 'S.S. Anne', short: 'S.S. ANNE', color: '#ff9f43', w: 1 },
  tunnel: { label: 'Túnel Roca', short: 'TÚNEL', color: '#ff9f43', w: 1 },
  tower: { label: 'Torre Pokémon', short: 'TORRE', color: '#a33ea1', w: 1 },
  hideoutk: { label: 'Escondite Rocket', short: 'ESCONDITE', color: '#a33ea1', w: 1 },
  snorlax: { label: 'Snorlax dormido', short: 'SNORLAX', color: '#ff9f43', w: 1 },
  safarik: { label: 'Zona Safari', short: 'SAFARI', color: '#ff9f43', w: 1 },
  silph: { label: 'Silph S.A.', short: 'SILPH', color: '#a33ea1', w: 1 },
  dojo: { label: 'Dojo Karate', short: 'DOJO', color: '#ff9f43', w: 1 },
  seafoam: { label: 'Islas Espuma', short: 'ESPUMA', color: '#4aa3df', w: 1, pw: .6 },
  mansion: { label: 'Mansión Pokémon', short: 'MANSIÓN', color: '#ff9f43', w: 1 },
  lab: { label: 'Laboratorio Pokémon', short: 'LABORATORIO', color: '#ff9f43', w: 1 },
  powerplant: { label: 'Central Energía', short: 'CENTRAL', color: '#f7d02c', w: 1, pw: .6 },
  ccave: { label: 'Cueva Celeste', short: 'C. CELESTE', color: '#a33ea1', w: 1, pw: .5 },
  victory: { label: 'Calle Victoria', short: 'VICTORIA', color: '#ff9f43', w: 1 },
  forest: { label: 'Encinar', short: 'ENCINAR', color: '#ff9f43', w: 1 },
  contest: { label: 'Concurso de bichos', short: 'CONCURSO', color: '#ff9f43', w: 1 },
  safari: { label: 'Zona Safari', short: 'SAFARI', color: '#ff9f43', w: 1 },
  tin: { label: 'Torre Hojalata', short: 'HOJALATA', color: '#ff9f43', w: 1, pw: .5 },
  icepath: { label: 'Ruta Helada', short: 'HELADA', color: '#ff9f43', w: 1 },
  mortar: { label: 'Monte Mortero', short: 'MORTERO', color: '#ff9f43', w: 1 },
  radio: { label: 'Torre Radio', short: 'RADIO', color: '#ff9f43', w: 1 },
  well: { label: 'Pozo Slowpoke', short: 'POZO', color: '#a33ea1', w: 1 },
  hideout: { label: 'Escondite Rocket', short: 'ESCONDITE', color: '#a33ea1', w: 1 },
  whirl: { label: 'Islas Remolino', short: 'REMOLINO', color: '#4aa3df', w: 1 },
};

// ---- Sitios especiales de Hoenn, Sinnoh, Teselia, Kalos, Alola, Galar y Paldea (quesitos naranjas de cada camino) ----
// Cada sitio se describe con datos (spot): t = qué pasa — wild (ruleta de salvajes por tipos o lista), legend, gift (ruleta de regalo),
// present (te regalan uno), catch (intento de captura), villain, trainer, rival, item, cave, fossil, evo, blocker (Snorlax/Sudowoodo) o mix (ruleta con varias de esas).
const SP = (label, short, spot, pw = 1, color = '#ff9f43') => ({ label, short, color, w: 1, pw, spot });
Object.assign(EVENTS, {
  // ----- Hoenn -----
  h_woods: SP('Bosque Petalia', 'BOSQUE', { txt: 'Te adentras en el Bosque Petalia. Algo se mueve entre los arbustos…', btn: 'Buscar', t: 'wild', types: ['Bicho', 'Planta'], center: 'BOSQUE' }),
  h_wally: SP('Blasco y su Ralts', 'RALTS', { txt: 'Ayudas al pequeño Blasco a buscar su primer Pokémon… ¡y aparece otro Ralts para ti!', btn: 'Lanzar la Poké Ball', t: 'catch', n: 280 }),
  h_devon: SP('Túnel Fervegal', 'FERVEGAL', { txt: 'Un recluta ha robado unas piezas de la Devon y se esconde en el Túnel Fervegal.', btn: 'Perseguirlo', t: 'villain', vt: 'El recluta Magma huye por el túnel con las piezas de la Devon.' }, 1, '#a33ea1'),
  h_granite: SP('Cueva Granito', 'GRANITO', { txt: 'En la Cueva Granito, a oscuras, un tal Máximo busca piedras raras…', btn: 'Explorar', t: 'mix', q: 'Pokémon de cueva, un Sableye… o un entrenador.', opts: [
    { label: 'Pokémon de cueva', short: 'CUEVA', color: '#9a7b55', w: 2, t: 'wild', list: [41, 63, 66, 74, 296, 299, 304], center: 'CUEVA' },
    { label: 'Sableye', short: 'SABLEYE', color: '#705898', t: 'catch', n: 302 }, { label: 'Mawile', short: 'MAWILE', color: '#b7b7ce', t: 'catch', n: 303 },
    { label: 'Entrenador', short: 'ENTRENADOR', color: '#ff5a46', t: 'trainer' }] }),
  h_museum: SP('Museo Oceánico', 'MUSEO', { txt: 'El Team Magma irrumpe en el Museo Oceánico de Ciudad Portual buscando unas piezas de submarino.', btn: 'Enfrentarte', t: 'villain' }, 1, '#a33ea1'),
  h_cycling: SP('Ruta Ciclista', 'BICI', { txt: 'Bajas a toda velocidad por la Ruta Ciclista… algo te sigue.', btn: 'Frenar', t: 'wild', list: [309, 311, 312, 316, 43, 100, 263, 278], center: 'RUTA' }),
  h_desert: SP('Desierto', 'DESIERTO', { txt: 'Te pones las Gafas Aislantes y cruzas la tormenta de arena del desierto.', btn: 'Cruzar', t: 'wild', list: [27, 328, 331, 343, 322], center: 'DESIERTO' }),
  h_chimney: SP('Monte Cenizo', 'CENIZO', { txt: 'En la cima del Monte Cenizo, el Team Magma quiere despertar algo dentro del volcán.', btn: 'Detenerlos', t: 'villain' }, 1, '#a33ea1'),
  h_fossil: SP('Ruinas del desierto', 'FÓSIL', { t: 'fossil', ft: 'Entre la arena del desierto aparecen dos fósiles; solo puedes llevarte uno.' }, 1, '#c9b37e'),
  h_ash: SP('Ruta de ceniza', 'CENIZA', { txt: 'En la Ruta 113 llueve ceniza del volcán. Algo se esconde bajo el polvo gris.', btn: 'Buscar', t: 'wild', list: [227, 327, 218, 333, 299], center: 'CENIZA' }),
  h_meteor: SP('Cascada Meteoro', 'METEORO', { txt: 'Entras en la Cascada Meteoro, una cueva llena de cascadas… dicen que en lo más hondo vive un pequeño dragón.', btn: 'Explorar', t: 'wild', list: [41, 337, 338, 339, 129, 371], center: 'METEORO' }),
  h_weather: SP('Instituto Meteorológico', 'CLIMA', { txt: 'Echas al Team Aqua del Instituto Meteorológico. Como agradecimiento, te regalan un Castform.', t: 'present', n: 351 }, 1, '#4aa3df'),
  h_kecleon: SP('Pokémon invisible', 'KECLEON', { t: 'blocker', n: 352, bt: 'Algo invisible te corta el paso en el puente… Con el Detector Devon descubres que es un Kecleon.' }),
  h_feebas: SP('Pesca en la Ruta 119', 'PESCA', { txt: 'Lanzas la caña bajo el puente de la Ruta 119. Dicen que aquí vive un Pokémon muy feo… que se vuelve precioso.', btn: 'Pescar', t: 'wild', list: [129, 349, 318, 339, 341, 118], center: 'PESCA' }, .8, '#4aa3df'),
  h_pyre: SP('Monte Pírico', 'PÍRICO', { txt: 'Subes al Monte Pírico, el cementerio de Hoenn. La niebla esconde fantasmas… y al Team Magma robando las esferas.', btn: 'Subir', t: 'mix', q: 'Fantasmas, el Team Magma o la vieja del monte.', opts: [
    { label: 'Fantasma', short: 'FANTASMA', color: '#705898', w: 2, t: 'wild', list: [353, 355, 358, 307], center: 'FANTASMA' },
    { label: 'Team Magma', short: 'MAGMA', color: '#a33ea1', t: 'villain' }, { label: 'Médium', short: 'MÉDIUM', color: '#ff5a46', t: 'trainer', who: { name: 'Médium del Monte Pírico', team: [353, 355] } }] }, 1, '#a33ea1'),
  h_safari: SP('Zona Safari', 'SAFARI', { txt: '¡Zona Safari de Hoenn! Aquí no hay que combatir: lo que salga en la ruleta, te lo llevas.', btn: 'Entrar', t: 'gift', ids: [25, 43, 84, 177, 202, 203, 231, 214, 127, 111, 44, 335], center: 'SAFARI' }),
  h_steven: SP('Casa de Máximo', 'MÁXIMO', { txt: 'En la casa de Máximo, en Ciudad Algaria, encuentras una Poké Ball con una nota: «Para ti».', t: 'present', n: 374 }),
  h_seafloor: SP('Cueva Abisal', 'ABISAL', { txt: 'Bajas en submarino hasta la Cueva Abisal. Allí duerme algo antiguo… y el Team Magma quiere despertarlo.', btn: 'Bucear', t: 'mix', q: 'El villano o uno de los dos colosos.', opts: [
    { label: 'Team Magma', short: 'MAGMA', color: '#a33ea1', w: 2, t: 'villain' }, { label: 'Kyogre', short: 'KYOGRE', color: '#ffd84a', t: 'legend', ids: [382] }, { label: 'Groudon', short: 'GROUDON', color: '#ffd84a', t: 'legend', ids: [383] }] }, .6, '#4aa3df'),
  h_skypillar: SP('Pilar Celeste', 'PILAR', { txt: 'Subes al Pilar Celeste, una torre que llega hasta las nubes. En lo alto, un dragón verde descansa…', btn: 'Acercarse', t: 'legend', ids: [384] }, .5, '#7a6cff'),
  h_regis: SP('Cámara Sellada', 'CÁMARA', { txt: 'Lees el braille de la Cámara Sellada y se abren tres cuevas antiguas…', btn: 'Entrar', t: 'legend', ids: [377, 378, 379] }, .5, '#a33ea1'),
  h_victory: SP('Calle Victoria', 'VICTORIA', { txt: 'La Calle Victoria de Hoenn: la última prueba antes del Alto Mando.', btn: 'Cruzar', t: 'mix', q: 'Pokémon de cueva o entrenadores.', opts: [
    { label: 'Pokémon de cueva', short: 'POKÉMON', color: '#9a7b55', w: 2, t: 'cave' }, { label: 'Entrenador', short: 'ENTRENADOR', color: '#ff5a46', t: 'trainer' }] }),
  h_southern: SP('Isla Sur', 'ISLA SUR', { txt: 'Un barco te deja en la Isla Sur. Junto a un árbol enorme, dos Pokémon que parecen aviones te observan…', btn: 'Acercarse', t: 'legend', ids: [380, 381] }, .5, '#4aa3df'),
  // ----- Sinnoh -----
  s_verity: SP('Lago Veraz', 'VERAZ', { txt: 'Llegas a la orilla del Lago Veraz. El agua brilla de una forma extraña…', btn: 'Mirar', t: 'mix', q: 'Pokémon del lago… o algo que se mueve bajo el agua.', opts: [
    { label: 'Pokémon del lago', short: 'LAGO', color: '#4aa3df', w: 3, t: 'wild', list: [396, 399, 54, 129, 183, 418], center: 'LAGO' }, { label: 'Mesprit', short: 'MESPRIT', color: '#ffd84a', t: 'legend', ids: [481] }] }, 1, '#4aa3df'),
  s_mine: SP('Mina Pirita', 'MINA', { txt: 'Bajas a la Mina Pirita, de donde sacan el carbón de la ciudad.', btn: 'Explorar', t: 'wild', list: [74, 41, 95, 66, 299, 524, 408, 410], center: 'MINA' }),
  s_windworks: SP('Valle Eólico', 'EÓLICO', { txt: 'El Equipo Galaxia ha tomado el Valle Eólico. Al lado, un globo morado flota con el viento…', btn: 'Ir', t: 'mix', q: 'El villano o un Drifloon.', opts: [
    { label: 'Equipo Galaxia', short: 'GALAXIA', color: '#a33ea1', w: 2, t: 'villain' }, { label: 'Drifloon', short: 'DRIFLOON', color: '#705898', t: 'catch', n: 425 }] }),
  s_forest: SP('Bosque Vetusta', 'BOSQUE', { txt: 'El Bosque Vetusta es tan espeso que casi no entra la luz.', btn: 'Buscar', t: 'wild', types: ['Bicho', 'Planta', 'Fantasma'], center: 'BOSQUE' }),
  s_chateau: SP('Vieja Mansión', 'MANSIÓN', { txt: 'Entras de noche en la Vieja Mansión. Una televisión se enciende sola…', btn: 'Entrar', t: 'wild', list: [92, 93, 479, 355, 200], center: 'MANSIÓN' }, 1, '#a33ea1'),
  s_wayward: SP('Cueva Extravío', 'EXTRAVÍO', { txt: 'Encuentras la entrada escondida de la Cueva Extravío. Algo con aletas se esconde en la arena.', btn: 'Explorar', t: 'mix', q: 'Pokémon de cueva o un Gible.', opts: [
    { label: 'Pokémon de cueva', short: 'CUEVA', color: '#9a7b55', w: 2, t: 'wild', list: [41, 74, 66, 433, 436], center: 'CUEVA' }, { label: 'Gible', short: 'GIBLE', color: '#7a6cff', t: 'catch', n: 443 }] }),
  s_lost: SP('Torre Perdida', 'TORRE', { txt: 'Subes a la Torre Perdida, un cementerio de Pokémon en lo alto de la ruta.', btn: 'Subir', t: 'wild', list: [92, 93, 355, 425, 41], center: 'FANTASMA' }, 1, '#a33ea1'),
  s_ruins: SP('Ruinas Sosiego', 'RUINAS', { txt: 'En las Ruinas Sosiego, unas letras misteriosas cobran vida…', btn: 'Mirar', t: 'catch', n: 201 }),
  s_marsh: SP('Gran Pantano', 'PANTANO', { txt: '¡Gran Pantano de Ciudad Pradera! Aquí no hay que combatir: lo que salga en la ruleta, te lo llevas.', btn: 'Entrar', t: 'gift', ids: [194, 195, 315, 453, 455, 451, 357, 183, 399, 114], center: 'PANTANO' }),
  s_warehouse: SP('Almacén Galaxia', 'ALMACÉN', { txt: 'El Equipo Galaxia esconde Pokémon robados en su almacén de Ciudad Rocavelo.', btn: 'Colarte', t: 'villain' }, 1, '#a33ea1'),
  s_iron: SP('Isla Hierro', 'HIERRO', { txt: 'En la Isla Hierro, Leto te acompaña por las minas… y al final te regala un Huevo.', btn: 'Bajar a la mina', t: 'mix', q: 'Pokémon de mina o el Huevo de Leto.', opts: [
    { label: 'Pokémon de mina', short: 'MINA', color: '#9a7b55', w: 2, t: 'wild', list: [74, 95, 66, 436, 304, 41], center: 'MINA' }, { label: 'Huevo de Riolu', short: 'RIOLU', color: '#f4a6c8', t: 'present', n: 447, got: '¡Leto te regala un Huevo, y de él sale un Riolu!' }] }),
  s_fullmoon: SP('Isla Plenilunio', 'PLENILUNIO', { txt: 'Un marinero te lleva a la Isla Plenilunio. En el lago, algo brilla como la luna llena…', btn: 'Acercarse', t: 'legend', ids: [488] }, .5, '#4aa3df'),
  s_lakes: SP('Los tres lagos', 'LAGOS', { txt: 'El Equipo Galaxia ataca los tres lagos de Sinnoh. ¿A cuál de los guardianes encontrarás?', btn: 'Correr al lago', t: 'legend', ids: [480, 481, 482] }, .6, '#4aa3df'),
  s_snow: SP('Ruta 216 nevada', 'NIEVE', { txt: 'Una ventisca cubre la Ruta 216. Entre la nieve, algo se mueve.', btn: 'Buscar', t: 'wild', list: [459, 215, 361, 220, 225, 433, 434], center: 'NIEVE' }),
  s_hq: SP('Edificio Galaxia', 'GALAXIA', { txt: 'Entras en el Edificio Galaxia de Ciudad Rocavelo. ¡Es su cuartel general!', btn: 'Asaltarlo', t: 'villain' }, 1, '#a33ea1'),
  s_spear: SP('Columna Lanza', 'COLUMNA', { txt: 'En lo más alto del Monte Corona, Helio abre una puerta al tiempo y al espacio…', btn: 'Subir', t: 'legend', ids: [483, 484] }, .5, '#ffd84a'),
  s_distortion: SP('Mundo Distorsión', 'DISTORSIÓN', { txt: 'Un portal te arrastra al Mundo Distorsión, donde nada tiene sentido. Una sombra gigante se acerca…', btn: 'Avanzar', t: 'legend', ids: [487] }, .5, '#7a6cff'),
  s_stark: SP('Monte Abrupto', 'ABRUPTO', { txt: 'Dentro del Monte Abrupto hace un calor insoportable. En lo más hondo hierve la lava…', btn: 'Bajar', t: 'legend', ids: [485] }, .5, '#ff5a46'),
  s_victory: SP('Calle Victoria', 'VICTORIA', { txt: 'La Calle Victoria de Sinnoh: la última cueva antes de la Liga.', btn: 'Cruzar', t: 'mix', q: 'Pokémon de cueva o entrenadores.', opts: [
    { label: 'Pokémon de cueva', short: 'POKÉMON', color: '#9a7b55', w: 2, t: 'cave' }, { label: 'Entrenador', short: 'ENTRENADOR', color: '#ff5a46', t: 'trainer' }] }),
  // ----- Teselia -----
  u_dream: SP('Solar de los Sueños', 'SOLAR', { txt: 'En el Solar de los Sueños flota un humo rosa… alguien está robando el humo de un Munna.', btn: 'Investigar', t: 'mix', q: 'Pokémon del solar o el Equipo Plasma.', opts: [
    { label: 'Pokémon del solar', short: 'SOLAR', color: '#f4a6c8', w: 2, t: 'wild', list: [517, 509, 504, 506, 519], center: 'SOLAR' }, { label: 'Equipo Plasma', short: 'PLASMA', color: '#a33ea1', t: 'villain' }] }),
  u_monkey: SP('Mono del Solar', 'MONO', { txt: 'Una chica del Solar te regala un mono que tiene ventaja contra el gimnasio de Ciudad Gres. ¿Cuál será?', btn: 'Recibirlo', t: 'gift', ids: [511, 513, 515], center: 'MONO' }),
  u_wellspring: SP('Cueva Manantial', 'MANANTIAL', { txt: 'En la Cueva Manantial, el Equipo Plasma está robando las colas de los Slowpoke… no, ¡los Pokémon de los niños!', btn: 'Entrar', t: 'villain' }, 1, '#a33ea1'),
  u_daycare: SP('Guardería', 'GUARDERÍA', { txt: 'Pasas por la Guardería de la Ruta 3 y los cuidadores entrenan a tu equipo.', t: 'evo', et: 'En la Guardería entrenan a tu equipo.' }),
  u_pinwheel: SP('Bosque Azulejo', 'AZULEJO', { txt: 'El Bosque Azulejo está lleno de Pokémon bicho.', btn: 'Buscar', t: 'wild', types: ['Bicho', 'Planta'], center: 'BOSQUE' }),
  u_museum: SP('Museo de Esmalte', 'MUSEO', { t: 'fossil', ft: 'En el Museo de Ciudad Esmalte te dejan revivir un fósil de los que tienen guardados.' }, 1, '#c9b37e'),
  u_desert: SP('Zona Desierto', 'DESIERTO', { txt: 'Una tormenta de arena barre la Zona Desierto.', btn: 'Cruzar', t: 'wild', list: [551, 554, 557, 562, 556, 627, 559, 631], center: 'DESIERTO' }),
  u_relic: SP('Castillo Ancestral', 'CASTILLO', { txt: 'Bajas por el Castillo Ancestral, medio enterrado en la arena. En lo más hondo arde una larva de fuego…', btn: 'Bajar', t: 'mix', q: 'Pokémon del castillo, un fósil o Larvesta.', opts: [
    { label: 'Pokémon del castillo', short: 'CASTILLO', color: '#c9b37e', w: 2, t: 'wild', list: [562, 551, 41, 557], center: 'CASTILLO' }, { label: 'Fósil', short: 'FÓSIL', color: '#c9b37e', t: 'fossil', ft: 'Entre la arena del castillo aparece un fósil.' },
    { label: 'Larvesta', short: 'LARVESTA', color: '#ff9f43', w: .5, t: 'catch', n: 636 }] }),
  u_castelia: SP('Ciudad Porcelana', 'PORCELANA', { txt: 'El Equipo Plasma da un discurso en la plaza de Ciudad Porcelana… y se lleva Pokémon «para liberarlos».', btn: 'Enfrentarte', t: 'villain' }, 1, '#a33ea1'),
  u_cold: SP('Almacenes Frigoríficos', 'FRIGORÍFICO', { txt: 'El Equipo Plasma se esconde en los Almacenes Frigoríficos de Ciudad Fayenza.', btn: 'Entrar', t: 'villain' }, 1, '#a33ea1'),
  u_route6: SP('Ruta 6', 'RUTA 6', { txt: 'La Ruta 6 cambia de color con las estaciones. Entre las hojas hay muchos Pokémon.', btn: 'Buscar', t: 'wild', list: [585, 590, 588, 616, 535, 532, 594], center: 'RUTA 6' }),
  u_charge: SP('Cueva Electrorroca', 'ELECTRORROCA', { txt: 'Las piedras de la Cueva Electrorroca flotan cargadas de electricidad.', btn: 'Explorar', t: 'wild', list: [595, 597, 599, 602, 524, 525, 41], center: 'CUEVA' }, 1, '#f7d02c'),
  u_celestial: SP('Torre de los Cielos', 'TORRE', { txt: 'Subes a la Torre de los Cielos, donde se recuerda a los Pokémon que ya no están.', btn: 'Subir', t: 'wild', list: [607, 562, 527, 605], center: 'TORRE' }, 1, '#a33ea1'),
  u_twist: SP('Monte Tuerca', 'TUERCA', { txt: 'El Monte Tuerca es una mina enorme llena de hielo y rocas.', btn: 'Explorar', t: 'wild', list: [525, 532, 613, 615, 527, 529, 95], center: 'CUEVA' }),
  u_dragonspiral: SP('Torre Dracoespiral', 'DRACOESPIRAL', { txt: 'La Torre Dracoespiral es la más antigua de Teselia. En la cima, un dragón legendario despierta…', btn: 'Subir', t: 'legend', ids: [643, 644] }, .5, '#ffd84a'),
  u_chasm: SP('Cuenca Gigante', 'CUENCA', { txt: 'En el fondo de la Cuenca Gigante el aire se congela. Un dragón gris duerme en la cueva…', btn: 'Bajar', t: 'legend', ids: [646] }, .5, '#7a6cff'),
  u_musketeers: SP('Los mosqueteros', 'ESPADAS', { txt: 'Tres Pokémon que protegen a los demás aparecen en tu camino. Uno de ellos te pone a prueba.', btn: 'Aceptar el reto', t: 'legend', ids: [638, 639, 640] }, .5, '#ffd84a'),
  u_forces: SP('Tormenta', 'TORMENTA', { txt: 'Se levanta una tormenta tremenda sobre la ruta: dos Pokémon se pelean entre las nubes.', btn: 'Mirar al cielo', t: 'legend', ids: [641, 642] }, .5, '#ffd84a'),
  u_victory: SP('Calle Victoria', 'VICTORIA', { txt: 'La Calle Victoria de Teselia, la más grande de todas.', btn: 'Cruzar', t: 'mix', q: 'Pokémon de cueva o entrenadores.', opts: [
    { label: 'Pokémon de cueva', short: 'POKÉMON', color: '#9a7b55', w: 2, t: 'cave' }, { label: 'Entrenador', short: 'ENTRENADOR', color: '#ff5a46', t: 'trainer' }] }),
  u_plasma: SP('Castillo de N', 'CASTILLO', { txt: 'Un castillo surge de la tierra rodeando la Liga: ¡es el del Equipo Plasma!', btn: 'Entrar', t: 'villain' }, 1, '#a33ea1'),
  // ----- Kalos -----
  x_forest: SP('Bosque de Novarte', 'BOSQUE', { txt: 'El Bosque de Novarte es tranquilo y luminoso.', btn: 'Buscar', t: 'wild', types: ['Bicho', 'Planta', 'Hada'], center: 'BOSQUE' }),
  x_friends: SP('Tus amigos', 'AMIGOS', { txt: 'Xana, Benigno y Trovato te esperan en Pueblo Acuarela. Uno de ellos quiere un combate de práctica.', btn: '¡A combatir!', t: 'trainer', who: { name: 'Xana', team: [661] } }),
  x_sycamore: SP('Laboratorio de Ciprés', 'CIPRÉS', { txt: 'El Profesor Ciprés te deja elegir uno de los iniciales de Kanto… la ruleta decide.', btn: 'Elegir', t: 'gift', ids: [1, 4, 7], center: 'KANTO' }),
  x_snorlax: SP('Snorlax en el puente', 'SNORLAX', { t: 'blocker', n: 143, bt: 'Un Snorlax duerme en el Puente de la Ruta 7… Tocas la Poké Flauta del Palacio Cénit y se despierta.' }),
  x_glitter: SP('Cueva Brillante', 'BRILLANTE', { txt: 'Los cristales de la Cueva Brillante brillan en la oscuridad… y el Team Flare anda por aquí.', btn: 'Entrar', t: 'mix', q: 'Pokémon de cueva, un fósil o el Team Flare.', opts: [
    { label: 'Pokémon de cueva', short: 'CUEVA', color: '#9a7b55', w: 2, t: 'wild', list: [95, 66, 74, 703, 213, 41], center: 'CUEVA' }, { label: 'Fósil', short: 'FÓSIL', color: '#c9b37e', t: 'fossil', ft: 'Un científico te deja revivir uno de los fósiles de la cueva.' },
    { label: 'Team Flare', short: 'FLARE', color: '#a33ea1', t: 'villain' }] }),
  x_reflection: SP('Cueva de los Reflejos', 'REFLEJOS', { txt: 'En la Cueva de los Reflejos ves a tus Pokémon reflejados en las paredes de espejo.', btn: 'Explorar', t: 'wild', list: [439, 524, 703, 597, 27, 302], center: 'CUEVA' }),
  x_mastery: SP('Torre Maestra', 'TORRE', { txt: 'En la Torre Maestra, el Gurú te pone a prueba y te regala un Lucario.', t: 'present', n: 448 }),
  x_lapras: SP('Lapras de la Ruta 12', 'LAPRAS', { txt: 'Un señor de la Ruta 12 te regala su Lapras para que puedas surcar el mar.', t: 'present', n: 131 }, 1, '#4aa3df'),
  x_azure: SP('Bahía Azul', 'BAHÍA', { txt: 'Navegas por la Bahía Azul a lomos de un Pokémon.', btn: 'Pescar', t: 'wild', list: [690, 692, 72, 278, 223, 131, 120], center: 'BAHÍA' }, 1, '#4aa3df'),
  x_powerplant: SP('Central de Kalos', 'CENTRAL', { txt: 'El Team Flare ha cortado la luz de Luminalia desde la Central de Kalos.', btn: 'Detenerlos', t: 'villain' }, 1, '#a33ea1'),
  x_wasteland: SP('Ruta 13', 'RUTA 13', { txt: 'La Ruta 13 es un páramo de arena junto a la central.', btn: 'Buscar', t: 'wild', list: [328, 449, 551, 694, 207], center: 'PÁRAMO' }),
  x_hotel: SP('Hotel Desolación', 'HOTEL', { txt: 'El Hotel Desolación está abandonado… pero algunas habitaciones siguen «habitadas».', btn: 'Entrar', t: 'wild', list: [708, 710, 92, 479, 509, 100], center: 'HOTEL' }, 1, '#a33ea1'),
  x_marsh: SP('Ruta 14 · ciénaga', 'CIÉNAGA', { txt: 'Atraviesas la ciénaga tenebrosa de la Ruta 14.', btn: 'Buscar', t: 'wild', list: [690, 692, 705, 453, 708, 193], center: 'CIÉNAGA' }),
  x_factory: SP('Fábrica Poké Balls', 'FÁBRICA', { txt: '¡El Team Flare ha tomado la Fábrica Poké Balls!', btn: 'Entrar', t: 'villain' }, 1, '#a33ea1'),
  x_frost: SP('Gruta Helada', 'HELADA', { txt: 'Entras en la Gruta Helada. Un Abomasnow furioso no deja pasar a nadie.', btn: 'Avanzar', t: 'mix', q: 'Pokémon de hielo o el Abomasnow.', opts: [
    { label: 'Pokémon de hielo', short: 'HIELO', color: '#96d9d6', w: 2, t: 'wild', list: [712, 459, 615, 220, 87, 361], center: 'HIELO' }, { label: 'Abomasnow', short: 'ABOMASNOW', color: '#7ac74c', t: 'catch', n: 460 }] }),
  x_flarehq: SP('Base Flare', 'BASE FLARE', { txt: 'Bajo el Café Lysson está la base secreta del Team Flare. En lo más hondo, un Pokémon legendario está atrapado…', btn: 'Asaltarla', t: 'mix', q: 'El Team Flare o el legendario.', opts: [
    { label: 'Team Flare', short: 'FLARE', color: '#a33ea1', w: 2, t: 'villain' }, { label: 'Legendario', short: 'LEGENDARIO', color: '#ffd84a', t: 'legend', ids: [716, 717] }] }, 1, '#a33ea1'),
  x_village: SP('Villa Pokémon', 'VILLA', { txt: 'En la Villa Pokémon viven Pokémon que se escondieron de las personas.', btn: 'Entrar', t: 'wild', list: [711, 707, 132, 427, 433, 571, 302], center: 'VILLA' }),
  x_terminus: SP('Cueva Desenlace', 'DESENLACE', { txt: 'En lo más hondo de la Cueva Desenlace, algo verde y negro vigila el ecosistema de Kalos…', btn: 'Acercarse', t: 'legend', ids: [718] }, .5, '#7ac74c'),
  x_victory: SP('Calle Victoria', 'VICTORIA', { txt: 'La Calle Victoria de Kalos, entre ruinas antiguas.', btn: 'Cruzar', t: 'mix', q: 'Pokémon de cueva o entrenadores.', opts: [
    { label: 'Pokémon de cueva', short: 'POKÉMON', color: '#9a7b55', w: 2, t: 'cave' }, { label: 'Entrenador', short: 'ENTRENADOR', color: '#ff5a46', t: 'trainer' }] }),
  x_birds: SP('Pájaro legendario', 'PÁJARO', { txt: 'Un pájaro legendario de Kanto vuela sobre Kalos… ¡y se posa delante de ti!', btn: 'Acercarse', t: 'legend', ids: [144, 145, 146] }, .5, '#ffd84a'),
  // ----- Alola -----
  a_meadow: SP('Jardín de Melemele', 'JARDÍN', { txt: 'En el Jardín de Melemele las flores amarillas bailan con el viento.', btn: 'Buscar', t: 'wild', list: [741, 742, 10, 12, 731, 734], center: 'JARDÍN' }),
  a_beach: SP('Playa de Hauoli', 'PLAYA', { txt: 'Paseas por la playa de Ciudad Hauoli.', btn: 'Buscar', t: 'wild', list: [72, 278, 747, 129, 120, 769], center: 'PLAYA' }, 1, '#4aa3df'),
  a_tenkarat: SP('Colina Diamante', 'DIAMANTE', { txt: 'Subes a la Colina Diamante. Un cachorro de roca te mira con curiosidad.', btn: 'Explorar', t: 'mix', q: 'Pokémon de cueva o el cachorro.', opts: [
    { label: 'Pokémon de cueva', short: 'CUEVA', color: '#9a7b55', w: 2, t: 'wild', list: [41, 74, 302, 303, 299, 66], center: 'CUEVA' }, { label: 'Rockruff', short: 'ROCKRUFF', color: '#b6a136', t: 'catch', n: 744 }] }),
  a_skull1: SP('Team Skull', 'SKULL', { txt: 'Dos soldados del Team Skull molestan a la gente del pueblo. «¡Yo, yo! ¿Quieres bronca?»', btn: 'Enfrentarte', t: 'villain' }, 1, '#a33ea1'),
  a_brooklet: SP('Colina Saltagua', 'SALTAGUA', { txt: 'Las cascadas de la Colina Saltagua están llenas de Pokémon de agua.', btn: 'Buscar', t: 'wild', types: ['Agua'], center: 'AGUA' }, 1, '#4aa3df'),
  a_aether1: SP('Fundación Æther', 'ÆTHER', { txt: 'Unos empleados de la Fundación Æther curan Pokémon heridos y te regalan uno que ya está recuperado.', btn: 'Recibirlo', t: 'gift', ids: [133, 25, 37, 50, 27, 52], center: 'ÆTHER' }),
  a_wela: SP('Volcán Wela', 'WELA', { txt: 'El Área Volcánica del Wela humea. Aquí viven Pokémon de fuego y de roca.', btn: 'Subir', t: 'wild', list: [757, 104, 74, 776, 218, 240], center: 'VOLCÁN' }, 1, '#ff5a46'),
  a_ranch: SP('Rancho Ohana', 'RANCHO', { txt: 'En el Rancho Ohana te dejan montar en Tauros… y te regalan algo.', btn: 'Visitarlo', t: 'mix', q: 'Un Pokémon del rancho o un Huevo.', opts: [
    { label: 'Pokémon del rancho', short: 'RANCHO', color: '#e0a040', w: 2, t: 'wild', list: [749, 241, 128, 506, 761], center: 'RANCHO' }, { label: 'Huevo de Eevee', short: 'EEVEE', color: '#f4a6c8', t: 'present', n: 133, got: '¡En el rancho te regalan un Huevo y sale un Eevee!' }] }),
  a_jungle: SP('Jungla Umbría', 'JUNGLA', { txt: 'La Jungla Umbría es densa y llena de vida.', btn: 'Buscar', t: 'wild', types: ['Planta', 'Bicho'], center: 'JUNGLA' }),
  a_life: SP('Ruinas de la Vida', 'RUINAS', { txt: 'Entras en las Ruinas de la Vida, el santuario del guardián de Akala…', btn: 'Entrar', t: 'legend', ids: [786] }, .5, '#ffd84a'),
  a_memorial: SP('Colina Memorial', 'MEMORIAL', { txt: 'Al anochecer, en la Colina Memorial, se oyen pasos que no son de nadie.', btn: 'Subir', t: 'wild', list: [92, 93, 41, 708, 769], center: 'FANTASMA' }, 1, '#a33ea1'),
  a_aether: SP('Paraíso Æther', 'PARAÍSO', { txt: 'Llegas al Paraíso Æther. La presidenta esconde algo… y el Team Skull vigila la entrada.', btn: 'Entrar', t: 'mix', q: 'El Team Skull, un regalo de Gladio o los Pokémon del Paraíso.', opts: [
    { label: 'Team Skull', short: 'SKULL', color: '#a33ea1', w: 2, t: 'villain' }, { label: 'Código Cero', short: 'CÓDIGO CERO', color: '#ffd84a', w: .5, t: 'present', n: 772, got: 'Gladio te confía a Código Cero.' },
    { label: 'Pokémon del Paraíso', short: 'PARAÍSO', color: '#4aa3df', t: 'wild', list: [133, 27, 50, 37, 79, 52], center: 'ÆTHER' }] }),
  a_megamart: SP('Súper Ultraganga', 'ULTRAGANGA', { txt: 'Entras en el Súper Ultraganga abandonado. Detrás de las cajas se mueve un disfraz de Pikachu…', btn: 'Entrar', t: 'mix', q: 'Fantasmas o el Mimikyu.', opts: [
    { label: 'Fantasma', short: 'FANTASMA', color: '#705898', w: 2, t: 'wild', list: [92, 93, 708, 710, 769], center: 'FANTASMA' }, { label: 'Mimikyu', short: 'MIMIKYU', color: '#f2e27a', t: 'catch', n: 778 }] }, 1, '#a33ea1'),
  a_pot: SP('Pueblo Po', 'PUEBLO PO', { txt: 'Pueblo Po es la base del Team Skull. Está lloviendo y te rodean los soldados.', btn: 'Entrar', t: 'villain' }, 1, '#a33ea1'),
  a_hokulani: SP('Pico Hokulani', 'HOKULANI', { txt: 'En el Pico Hokulani, cerca del observatorio, caen meteoritos con Pokémon dentro.', btn: 'Mirar', t: 'wild', list: [774, 81, 137, 35, 777, 737], center: 'PICO' }),
  a_canyon: SP('Cañón de Poni', 'CAÑÓN', { txt: 'Bajas por el Cañón de Poni, donde viven Pokémon dragón.', btn: 'Bajar', t: 'wild', list: [782, 783, 74, 745, 371, 95], center: 'CAÑÓN' }, 1, '#7a6cff'),
  a_altar: SP('Altar del Sol y la Luna', 'ALTAR', { txt: 'Al fondo del Cañón de Poni, en el Altar, Lylia toca la flauta y se abre el cielo…', btn: 'Mirar', t: 'legend', ids: [791, 792] }, .5, '#ffd84a'),
  a_ultra: SP('Ultraumbral', 'ULTRA', { txt: 'Se abre un Ultraumbral en el cielo y sale un Ultraente.', btn: 'Enfrentarte', t: 'wild', list: [793, 794, 795, 796, 797, 798, 799, 803, 805, 806], center: 'ULTRAENTE' }, .6, '#7a6cff'),
  a_lanakila: SP('Monte Lanakila', 'LANAKILA', { txt: 'Subes al Monte Lanakila, cubierto de nieve.', btn: 'Subir', t: 'wild', list: [740, 712, 361, 215, 37, 27], center: 'NIEVE' }),
  a_tapu: SP('Santuario de un Tapu', 'TAPU', { txt: 'Uno de los cuatro guardianes de las islas baja a ver quién es el nuevo Campeón.', btn: 'Esperar', t: 'legend', ids: [785, 786, 787, 788] }, .5, '#ffd84a'),
  // ----- Galar -----
  g_weald: SP('Bosque Oniria', 'ONIRIA', { txt: 'Entras en el Bosque Oniria a pesar de la niebla. Un Pokémon con una espada te mira…', btn: 'Avanzar', t: 'mix', q: 'Pokémon del bosque… o el lobo de la niebla.', opts: [
    { label: 'Pokémon del bosque', short: 'BOSQUE', color: '#7ac74c', w: 3, t: 'wild', list: [819, 824, 827, 829, 831, 10], center: 'BOSQUE' }, { label: 'El lobo de la niebla', short: '¿¿??', color: '#ffd84a', t: 'legend', ids: [888, 889] }] }),
  g_wild1: SP('Área Silvestre', 'SILVESTRE', { txt: 'Llegas al Área Silvestre: una llanura enorme donde el tiempo cambia sin parar.', btn: 'Explorar', t: 'wild', list: [819, 821, 824, 827, 829, 831, 833, 843, 846, 848, 850, 52, 133, 263], center: 'SILVESTRE' }),
  g_mine: SP('Mina de Galar', 'MINA', { txt: 'Bajas a la Mina de Galar, llena de carbón y vagonetas.', btn: 'Explorar', t: 'wild', list: [837, 838, 524, 95, 41, 66, 111], center: 'MINA' }),
  g_daycare: SP('Guardería', 'GUARDERÍA', { txt: 'Dejas a tus Pokémon un rato en la Guardería del Área Silvestre.', t: 'evo', et: 'Tus Pokémon han entrenado mucho en la Guardería.' }),
  g_mine2: SP('Mina de Galar n.º 2', 'MINA 2', { txt: 'La segunda mina tiene agua por todas partes.', btn: 'Explorar', t: 'wild', list: [833, 834, 524, 838, 220, 194, 339], center: 'MINA' }),
  g_wild2: SP('Lago Milotic', 'MILOTIC', { txt: 'Junto al Lago Milotic del Área Silvestre ves una nube oscura: ¡una incursión Dinamax!', btn: 'Unirte', t: 'wild', list: [130, 350, 131, 143, 115, 448, 133, 612], center: 'DINAMAX' }, .7, '#d0505a'),
  g_desert: SP('Ruta 6', 'RUTA 6', { txt: 'La Ruta 6 es un camino de piedra y arena entre acantilados.', btn: 'Buscar', t: 'wild', list: [843, 844, 551, 343, 878, 50], center: 'RUTA 6' }),
  g_fossil: SP('Fósiles de Ladera', 'FÓSIL', { t: 'fossil', ft: 'Un científico de la Ruta 6 junta dos mitades de fósil… ¡y revive algo muy raro!' }, 1, '#c9b37e'),
  g_glimwood: SP('Bosque Lumirinto', 'LUMIRINTO', { txt: 'El Bosque Lumirinto brilla con setas de colores.', btn: 'Buscar', t: 'wild', list: [856, 859, 755, 761, 590, 708], center: 'BOSQUE' }, 1, '#b46cff'),
  g_impidimp: SP('Pokémon travieso', 'TRAVIESO', { txt: 'Un Pokémon travieso te roba el gorro y se esconde entre las setas…', btn: 'Seguirlo', t: 'catch', n: 859 }),
  g_ruins: SP('Ruinas de Artejo', 'RUINAS', { txt: 'Unos hinchas del Team Yell no te dejan pasar por la Ruta 7… ¡a apartarlos!', btn: 'Enfrentarte', t: 'villain' }, 1, '#a33ea1'),
  g_route8: SP('Ruta 8', 'RUTA 8', { txt: 'La Ruta 8 cruza unas ruinas antiguas entre la niebla.', btn: 'Explorar', t: 'wild', list: [874, 852, 854, 874, 627, 553, 622], center: 'RUINAS' }),
  g_route9: SP('Ruta 9', 'RUTA 9', { txt: 'Cruzas el mar helado de la Ruta 9 con tu Pokébici.', btn: 'Buscar', t: 'wild', list: [847, 845, 875, 222, 223, 365], center: 'MAR' }, 1, '#4aa3df'),
  g_spikemuth: SP('Pueblo Crampón', 'CRAMPÓN', { txt: 'El Team Yell ha cerrado Pueblo Crampón para que nadie llegue al gimnasio.', btn: 'Pasar', t: 'villain' }, 1, '#a33ea1'),
  g_rose: SP('Torre Rose', 'TORRE', { txt: 'El presidente Rose quiere despertar algo enorme bajo Galar desde la Torre Rose…', btn: 'Subir', t: 'mix', q: 'Sus secretarios o el monstruo.', opts: [
    { label: 'Secretario de Rose', short: 'SECRETARIO', color: '#ff5a46', w: 2, t: 'trainer', who: { name: 'Secretaria Olivia', team: [879, 863] } }, { label: 'Eternatus', short: 'ETERNATUS', color: '#ffd84a', t: 'legend', ids: [890] }] }),
  g_lake: SP('Lago del Enfado', 'LAGO', { txt: 'En el Lago del Enfado del Área Silvestre el tiempo es horrible… y salen Pokémon fuertes.', btn: 'Buscar', t: 'wild', list: [887, 885, 884, 878, 849, 612, 373], center: 'LAGO' }),
  g_route10: SP('Ruta 10', 'RUTA 10', { txt: 'La Ruta 10 sube hasta Ciudad Puntera entre la nieve.', btn: 'Subir', t: 'wild', list: [872, 873, 875, 461, 712, 820], center: 'NIEVE' }),
  g_eternatus: SP('Supernido Dinamax', 'SUPERNIDO', { txt: 'Una luz roja sale de la tierra: un Supernido Dinamax. Dentro espera un Pokémon legendario.', btn: 'Entrar', t: 'legend', ids: [894, 895, 896, 897, 891] }, .5, '#d0505a'),
  // ----- Paldea -----
  p_poco: SP('Sendero de Cahíz', 'SENDERO', { txt: 'Bajas por el Sendero de Cahíz, rodeado de flores y Pokémon pequeños.', btn: 'Buscar', t: 'wild', list: [915, 917, 919, 921, 924, 926, 928, 931, 932, 194], center: 'SENDERO' }),
  p_academy: SP('Academia Naranja', 'ACADEMIA', { txt: 'En la Academia de Ciudad Meseta, un profesor te da una clase práctica… y entrena a tu equipo.', t: 'evo', et: 'Una clase práctica en la Academia.' }),
  p_star1: SP('Base del Team Star', 'TEAM STAR', { txt: 'El Team Star tiene una base junto al camino. ¡Hay que desmontarla!', btn: 'Asaltar la base', t: 'villain' }, 1, '#a33ea1'),
  p_titan1: SP('Pokémon Titánico', 'TITÁNICO', { txt: 'Arturo te pide ayuda: un Pokémon Titánico vigila la Hierba Mística de esta zona.', btn: 'Enfrentarte', t: 'trainer', who: { name: 'Klawf Titánico', team: [950] } }, 1, '#d0505a'),
  p_star2: SP('Escuadrón del Team Star', 'TEAM STAR', { txt: 'Otra base del Team Star aparece en las colinas del este.', btn: 'Asaltar la base', t: 'villain' }, 1, '#a33ea1'),
  p_wild3: SP('Teracristal', 'TERA', { txt: 'Un cristal brilla en el suelo: ¡una incursión Teracristal!', btn: 'Tocarlo', t: 'wild', list: [948, 940, 935, 944, 957, 962, 965, 970, 133], center: 'TERA' }, .7, '#d0505a'),
  p_titan2: SP('Bombirdier Titánico', 'TITÁNICO', { txt: 'Un Pokémon Titánico tira rocas desde lo alto del acantilado.', btn: 'Enfrentarte', t: 'trainer', who: { name: 'Bombirdier Titánico', team: [962] } }, 1, '#d0505a'),
  p_beach: SP('Costa de Cántara', 'COSTA', { txt: 'Pasas por la costa de Ciudad Cántara.', btn: 'Pescar', t: 'wild', list: [960, 963, 976, 977, 129, 194, 72], center: 'COSTA' }, 1, '#4aa3df'),
  p_desert: SP('Desierto Rostiz', 'ROSTIZ', { txt: 'El Desierto Rostiz quema bajo el sol.', btn: 'Cruzar', t: 'wild', list: [968, 951, 948, 449, 551, 970, 966], center: 'DESIERTO' }),
  p_star3: SP('Base de fuego del Team Star', 'TEAM STAR', { txt: 'Una base del Team Star, llena de coches, bloquea el desierto.', btn: 'Asaltar la base', t: 'villain' }, 1, '#a33ea1'),
  p_titan3: SP('Orthworm Titánico', 'TITÁNICO', { txt: 'El suelo tiembla: un Pokémon Titánico de acero sale de la tierra.', btn: 'Enfrentarte', t: 'trainer', who: { name: 'Orthworm Titánico', team: [968] } }, 1, '#d0505a'),
  p_tower: SP('Torre Inclinada', 'TORRE', { txt: 'Subes a la Torre Inclinada de Poza al anochecer.', btn: 'Subir', t: 'wild', list: [971, 999, 946, 92, 425, 198], center: 'TORRE' }, 1, '#a33ea1'),
  p_sinkhole: SP('Sima de Alforno', 'SIMA', { txt: 'Bajas por las paredes de la Sima de Alforno.', btn: 'Bajar', t: 'wild', list: [935, 957, 958, 944, 961, 590], center: 'SIMA' }),
  p_star4: SP('Base de hadas del Team Star', 'TEAM STAR', { txt: 'Una base del Team Star llena de purpurina y Pokémon de tipo Hada.', btn: 'Asaltar la base', t: 'villain' }, 1, '#a33ea1'),
  p_snow: SP('Sierra Napada', 'NAPADA', { txt: 'La Sierra Napada está cubierta de nieve todo el año.', btn: 'Subir', t: 'wild', list: [974, 996, 712, 459, 873, 970, 991], center: 'NIEVE' }),
  p_titan4: SP('Dondozo y Tatsugiri Titánicos', 'TITÁNICO', { txt: 'En el lago de la sierra, un Pokémon enorme se traga a uno pequeño… ¡y atacan juntos!', btn: 'Enfrentarte', t: 'trainer', who: { name: 'Dondozo Titánico', team: [977, 978] } }, 1, '#d0505a'),
  p_star5: SP('Base de lucha del Team Star', 'TEAM STAR', { txt: 'La última base del Team Star, entre montañas.', btn: 'Asaltar la base', t: 'villain' }, 1, '#a33ea1'),
  p_areazero: SP('Área Cero', 'ÁREA CERO', { txt: 'Bajas al fondo del Foso de Paldea, el Área Cero, donde viven Pokémon del pasado y del futuro.', btn: 'Bajar', t: 'mix', q: 'Pokémon paradoja o el legendario de tu leyenda.', opts: [
    { label: 'Pokémon paradoja', short: 'PARADOJA', color: '#b46cff', w: 3, t: 'wild', list: [984, 985, 986, 987, 988, 989, 990, 991, 992, 993, 994, 995], center: 'PARADOJA' }, { label: 'Legendario', short: 'LEGENDARIO', color: '#ffd84a', t: 'legend', ids: [1007, 1008] }] }),
  p_ruinous: SP('Santuario sellado', 'SANTUARIO', { txt: 'Arrancas una de las estacas que sellaban un santuario de Paldea… y algo antiguo despierta.', btn: 'Entrar', t: 'legend', ids: [1001, 1002, 1003, 1004] }, .5, '#a33ea1'),
});

const ITEMS = {
  potion: { name: 'Poción', color: '#b46cff', retries: 1, spr: 'potion', desc: 'Si pierdes un combate, te deja volver a girar una vez.' },
  super: { name: 'Superpoción', color: '#8f5bd6', retries: 2, spr: 'super-potion', desc: 'Si pierdes un combate, te deja volver a girar hasta dos veces.' },
  hyper: { name: 'Hiperpoción', color: '#6a3fc0', retries: 3, spr: 'hyper-potion', desc: 'Si pierdes un combate, te deja volver a girar hasta tres veces.' },
  rope: { name: 'Cuerda huida', color: '#c9a36a', spr: 'escape-rope', desc: 'Te saca de una cueva si te pierdes y te libra de un robo de los villanos.' },
  shoes: { name: 'Deportivas', color: '#4aa3df', desc: 'Una tirada más de la ruleta de aventura en cada tramo.' },
  share: { name: 'Repartir Exp.', color: '#ffd84a', spr: 'exp-share', desc: 'Cuando un Pokémon evoluciona, otro de tu equipo evoluciona también.' },
};
// spr: icono del objeto (nombre del archivo de items de PokeAPI, en assets/sprites/objetos.js); sin icono, se dibuja (BAG_ICON)
const BALL_SPR = { spr: 'level-ball' };   // Ball de Kurt
const DMAX_SPR = { spr: 'dynamax-band' }; // Banda Dinamax (dibujo oficial, reducido; en assets/sprites/originales/items)

// ---- Diario: cada entrada empieza por un emoji que dice qué ha pasado; aquí, cómo se dibuja ----
// spr: objeto de la esquina (o el icono, si no sale ningún Pokémon) · svg: dibujo propio · c: color
// mon: busca un Pokémon en el texto (last = el último: «A ha evolucionado a B», «Cambias A por B») · item: busca un objeto de la mochila
// place: llegada a un sitio (separador) · pts: puntos
const LOG_ICONS = {
  '📍': { place: 1, spr: 'town-map', c: '#5ad1c8' },
  '🎉': { mon: 1, spr: 'poke-ball', c: '#ffd84a' }, '🎯': { mon: 1, spr: 'poke-ball', c: '#7ac74c' },
  '🌿': { mon: 1, spr: 'poke-ball', c: '#7ac74c' }, '💨': { mon: 1, spr: 'poke-ball', c: '#8592ab', dim: 1 },
  '✨': { mon: 'last', spr: 'rare-candy', c: '#ffd84a' }, '🔸': { spr: 'everstone', c: '#8592ab' },
  '🧪': { item: 1, spr: 'potion', c: '#b46cff' }, '💊': { item: 1, spr: 'potion', c: '#b46cff' },
  '🎒': { item: 1, spr: 'dowsing-machine', c: '#b46cff' }, '🍬': { spr: 'rare-candy', c: '#5ad1c8' }, '🍵': { spr: 'tea', c: '#7ac74c' },
  '⚪': { spr: 'level-ball', c: '#e0a040' }, '🪢': { spr: 'escape-rope', c: '#c9a36a' },
  '💎': { mon: 1, spr: 'key-stone', c: '#5ad1c8' }, '↩️': { mon: 1, spr: 'key-stone', c: '#8592ab' }, '🔴': { mon: 1, spr: 'dynamax-band', c: '#ff2d55' },
  '🥚': { mon: 1, spr: 'mystery-egg', c: '#f2e27a' }, '🌟': { mon: 1, spr: 'master-ball', c: '#ffd84a' },
  '🦒': { mon: 1, spr: 'safari-ball', c: '#7ac74c' }, '🦴': { mon: 1, spr: 'old-amber', c: '#c9b37e' }, '🥋': { mon: 1, spr: 'black-belt', c: '#c22e28' },
  '🎰': { mon: 1, item: 1, spr: 'coin-case', c: '#ffd84a' }, '🎁': { mon: 1, item: 1, spr: 'poke-ball', c: '#ff9f43' },
  '🔄': { mon: 'last', svg: 'trade', c: '#5ad1c8' }, '🚨': { mon: 1, svg: 'alert', c: '#a33ea1' },
  '☠️': { svg: 'skull', c: '#ff5a46' }, '😤': { svg: 'vs', c: '#d0505a' }, '💢': { svg: 'vs', c: '#ff5a46' },
  '🔁': { svg: 'multi', c: '#e0a040' }, '🚶': { svg: 'walk', c: '#8592ab' }, '🌑': { svg: 'cave', c: '#5b6478' },
  '⭐': { pts: 1 }, '▼': { pts: 1 },
};
