// Sprites de entrenadores (assets/sprites/entrenadores.js, TRAINER_SPR: nombre del archivo -> imagen)
// Líderes de gimnasio, capitanes y kahunas, Alto Mando y Campeones: su nombre en el juego -> su sprite
// (los que salen en varias regiones, como Koga, Bruno o Lance, son la misma persona y usan el mismo)
// (los que son varios personajes, una lista: salen todos juntos)
// (se usan versiones de pie: Brock, Aníbal, Camus, Camila y Roy tienen la normal agachada, de rodillas o tumbada; Bruno, Denio, Mirto
//  y Koga no tienen ninguna de pie en la carpeta)
const LEADER_SPR = {
  // Kanto
  'Brock': 'brock-masters', 'Misty': 'misty', 'Teniente Surge': 'ltsurge', 'Erika': 'erika', 'Koga': 'koga', 'Sabrina': 'sabrina', 'Blaine': 'blaine', 'Giovanni': 'giovanni',
  'Lorelei': 'lorelei-lgpe', 'Bruno': 'bruno', 'Agatha': 'agatha-lgpe', 'Lance': 'lance', 'Azul': 'blue',
  // Johto
  'Pegaso': 'falkner', 'Antón': 'bugsy', 'Blanca': 'whitney', 'Morti': 'morty', 'Aníbal': 'chuck-gen2', 'Yasmina': 'jasmine', 'Fredo': 'pryce', 'Débora': 'clair',
  'Mento': 'will', 'Karen': 'karen',
  // Hoenn
  'Petra': 'roxanne', 'Marcial': 'brawly', 'Erico': 'wattson', 'Candela': 'flannery', 'Norman': 'norman', 'Alana': 'winona', 'Vito y Leti': ['tate', 'liza'], 'Galano': 'juan',
  'Sixto': 'sidney', 'Fátima': 'phoebe-gen6', 'Nívea': 'glacia', 'Dracón': 'drake-gen3', 'Máximo': 'steven',
  // Sinnoh
  'Roco': 'roark', 'Gardenia': 'gardenia', 'Fantina': 'fantina', 'Brega': 'maylene', 'Mananti': 'crasherwake', 'Acerón': 'byron', 'Inverna': 'candice', 'Lectro': 'volkner',
  'Alecrán': 'aaron', 'Gaia': 'bertha', 'Fausto': 'flint', 'Delos': 'lucian', 'Cintia': 'cynthia',
  // Teselia
  'Millo, Zeo y Maíz': ['chili', 'cilan', 'cress'], 'Aloe': 'lenora', 'Camus': 'burgh-masters', 'Camila': 'elesa-masters2', 'Yakón': 'clay', 'Gerania': 'skyla', 'Junco': 'brycen', 'Lirio': 'drayden',
  'Anís': 'shauntal', 'Aza': 'marshal', 'Catleya': 'caitlin', 'Lotto': 'grimsley', 'Mirto': 'alder',
  // Kalos
  'Violeta': 'viola', 'Lino': 'grant', 'Corelia': 'korrina', 'Amaro': 'ramos', 'Lem': 'clemont', 'Valeria': 'valerie', 'Ástrid': 'olympia', 'Édel': 'wulfric',
  'Malva': 'malva', 'Narciso': 'siebold', 'Tileo': 'wikstrom', 'Drácena': 'drasna', 'Dianta': 'diantha',
  // Alola
  'Liam': 'ilima', 'Kaudan': 'hala', 'Nereida': 'lana', 'Kiawe': 'kiawe', 'Lulú': 'mallow', 'Mayla': 'olivia', 'Denio': 'nanu', 'Hela': 'hapu',
  'Zarala': 'acerola', 'Kahili': 'kahili', 'Kukui': 'kukui',
  // Galar
  'Milo': 'milo', 'Cathy': 'nessa', 'Kabu': 'kabu', 'Judith': 'bea', 'Sally': 'opal', 'Gordon': 'gordie', 'Nerio': 'piers', 'Roy': 'raihan-masters',
  'Roxy': 'marnie', 'Berto': 'bede', 'Lionel': 'leon',
  // Paldea
  'Araceli': 'katy', 'Brais': 'brassius', 'e-Nigma': 'iono', 'Fuco': 'kofu', 'Laureano': 'larry', 'Lima': 'ryme', 'Tuli': 'tulip', 'Grusha': 'grusha',
  'Cayena': 'rika', 'Pola': 'poppy', 'Hesperio': 'hassel', 'Ságita': 'geeta',
};
// imágenes (data URL) del sprite de un líder: una lista, porque algunos son varios personajes juntos
// (Vito y Leti; Millo, Zeo y Maíz, con Millo en medio); vacía si no hay
const leaderSprs = name => { const v = LEADER_SPR[name]; if (!v || typeof TRAINER_SPR === 'undefined') return []; return (Array.isArray(v) ? v : [v]).map(k => TRAINER_SPR[k]).filter(Boolean); };

// Tu sprite de entrenador (se elige en Opciones; sale en la imagen del historial)
const TRAINER_DEFAULT = 'red';
const playerTrainer = () => { const k = store.get('ruleta-trainer-spr'); return typeof TRAINER_SPR !== 'undefined' && TRAINER_SPR[k] ? k : TRAINER_DEFAULT; };
const playerTrainerSpr = () => (typeof TRAINER_SPR !== 'undefined' && TRAINER_SPR[playerTrainer()]) || null;

// Rivales (por su nombre en el juego) y villanos (por su equipo: dos reclutas, chico y chica): salen como los líderes mientras
// te enfrentas a ellos (en la tarjeta de información y de cuerpo entero en el escenario)
const RIVAL_SPR = { 'Azul': 'blue', 'Plata': 'silver', 'Aura': 'may', 'Israel': 'barry', 'Cheren': 'cheren', 'Serena': 'serena', 'Tilo': 'hau', 'Paul': 'hop', 'Mencía': 'nemona-v' };
const VILLAIN_SPR = { rocket: ['rocketgrunt', 'rocketgruntf'], magma: ['magmagrunt', 'magmagruntf'], galaxia: ['galacticgrunt', 'galacticgruntf'],
  plasma: ['plasmagrunt', 'plasmagruntf-gen5bw'], flare: ['flaregrunt', 'flaregruntf'], skull: ['skullgrunt', 'skullgruntf'], yell: ['yellgrunt', 'yellgruntf'], star: ['stargrunt-s', 'stargruntf-s'] };
const trainerSprs = keys => typeof TRAINER_SPR === 'undefined' ? [] : [].concat(keys || []).map(k => TRAINER_SPR[k]).filter(Boolean);
const rivalSprs = name => trainerSprs(RIVAL_SPR[name]);
const villainSprs = key => trainerSprs(VILLAIN_SPR[key]);
// Jefes de los equipos villanos: a partir de 6 medallas, el que te sale al paso es el jefe en persona (con su nombre en el juego)
const VILLAIN_BOSS = { rocket: ['Giovanni', 'giovanni'], magma: ['Magno', 'maxie-gen6'], galaxia: ['Helio', 'cyrus'], plasma: ['Ghechis', 'ghetsis'],
  flare: ['Lysson', 'lysandre'], skull: ['Guzmán', 'guzma-masters'], yell: ['Nerio', 'piers'], star: ['Cassiopea', 'penny'] };
const BOSS_BADGES = 6;
// a quién te enfrentas del equipo villano ahora: { boss, name (quien te reta), sprs }
function villainFoe() {
  const key = REG().villain || 'rocket', V = VIL(), B = badges() >= BOSS_BADGES && VILLAIN_BOSS[key];
  return B ? { boss: true, name: `${B[0]}, el jefe del ${V.name},`, short: B[0], sprs: trainerSprs(B[1]), tip: typeof bioOf === 'function' ? bioOf(B[0]) : '' }
    : { boss: false, name: V.grunt, short: V.grunt, sprs: villainSprs(key), tip: typeof BIO_VILLAIN !== 'undefined' ? BIO_VILLAIN[key] || '' : '' };
}

// Entrenadores del camino: por su clase (la primera palabra o dos de su nombre) → el sprite de esa clase, una de sus variantes al azar
// (siempre la misma para el mismo entrenador). Sin clase conocida, uno genérico al azar. Nunca personajes clave.
const CLASS_SPR = { 'Entrenador Guay': 'acetrainer', 'Entrenadora Guay': 'acetrainerf', 'Pescador': 'fisherman', 'Pescadora': 'fisher', 'Médium': 'medium',
  'Montañero': 'hiker', 'Montañera': 'hiker', 'Joven': 'youngster', 'Cazabichos': 'bugcatcher', 'Marinero': 'sailor', 'Pokémaníaco': 'pokemaniac',
  'Esquiadora': 'skierf', 'Esquiador': 'skier', 'Domadragones': 'dragontamer', 'Experta': 'expertf', 'Experto': 'expert', 'Excursionista': 'backpacker',
  'Dominguera': 'picnicker', 'Campista': 'camper', 'Bañista': 'tuber', 'Ornitólogo': 'birdkeeper', 'Ornitóloga': 'birdkeeper', 'Nadadora': 'swimmerf', 'Nadador': 'swimmer',
  'Karateka': 'blackbelt', 'Dama Rica': 'lady', 'Científico': 'scientist', 'Científica': 'scientistf', 'Ciclista': 'cyclist', 'Chica': 'lass', 'Bailarina': 'dancer',
  'Supernecio': 'supernerd', 'Secretaria': 'officeworkerf', 'Sabio': 'sage', 'Repartidor': 'courier', 'Ranchero': 'rancher', 'Punki': 'punkguy',
  'Preescolar': 'preschooler', 'Patinador': 'rollerskater', 'Ninja': 'ninjaboy', 'Caballero': 'gentleman', 'Belleza': 'beauty', 'Psíquico': 'psychic', 'Psíquica': 'psychicf',
  'Policía': 'policeman', 'Mochilero': 'backpacker', 'Turista': 'tourist', 'Artista': 'artist', 'Músico': 'musician', 'Guitarrista': 'guitarist', 'Motorista': 'biker',
  'Criador': 'pokemonbreeder', 'Criadora': 'pokemonbreederf', 'Pokéfan': 'pokefan', 'Colegial': 'schoolboy', 'Colegiala': 'schoolgirl', 'Payaso': 'clown', 'Camarera': 'waitress' };
// personajes con nombre que salen como entrenadores del camino
const NAMED_SPR = { 'Gladio': 'gladion', 'N': 'n', 'Bel': 'bianca', 'Arturo': 'arven', 'Xana': 'shauna', 'Trovato': 'trevor' };
const GENERIC_SPR = ['acetrainer', 'acetrainerf', 'youngster', 'lass', 'hiker', 'fisherman', 'bugcatcher', 'picnicker', 'camper', 'swimmer', 'swimmerf', 'beauty',
  'blackbelt', 'battlegirl', 'gentleman', 'lady', 'psychic', 'psychicf', 'scientist', 'cyclist', 'cyclistf', 'birdkeeper', 'sailor', 'pokefan', 'pokefanf', 'backpacker', 'backpackerf', 'tourist', 'rancher'];
const strHash = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
function routeTrainerSprs(name) {
  if (typeof TRAINER_SPR === 'undefined') return [];
  const first = String(name).split(' ')[0];
  if (RIVAL_SPR[first]) return rivalSprs(first);
  if (NAMED_SPR[first]) return trainerSprs(NAMED_SPR[first]);
  // reclutas, soldados, comandos e hinchas: un recluta del equipo villano de la región
  if (/^(Recluta|Soldado|Comando|Hincha|Admin)/.test(name)) { const v = villainSprs(REG().villain || 'rocket'); return v.length ? [v[strHash(name) % v.length]] : []; }
  const cls = Object.keys(CLASS_SPR).filter(c => name === c || name.startsWith(c + ' ')).sort((a, b) => b.length - a.length)[0];
  const base = cls ? CLASS_SPR[cls] : GENERIC_SPR[strHash(name) % GENERIC_SPR.length];
  const vars = Object.keys(TRAINER_SPR).filter(k => k === base || k.startsWith(base + '-'));
  return vars.length ? [TRAINER_SPR[vars[strHash(name) % vars.length]]] : [];
}
