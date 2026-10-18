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
