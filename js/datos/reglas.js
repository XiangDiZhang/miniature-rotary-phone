// Reglas de la partida: puntos, probabilidades, ruletas de aventura y formas de combate
// Puntos de la partida: solo son la puntuación (no se gastan en nada)
const PTS = { capture: 50, shiny: 500, legend: 1000, win: 100, rival: 150, rocket: 150, evolve: 80, badge: 300, elite: 400, champ: 1500 };
const EVO_CHANCES = [1 / 4, 1 / 3, 1 / 2, 1];        // ruleta tras cada victoria: si falla, la siguiente es más fácil… hasta que es segura
// ---- Captura según la rareza (ratio de captura oficial) y lo que has avanzado ----
// Ruleta de 12 quesitos. Base por rareza; cada medalla suma un poco, con un tope para que nunca sea regalado.
const CAP_N = 12;
const RARITY = [   // [nombre, ratio de captura mínimo, probabilidad base, extra por medalla, tope]
  ['Común', 190, .66, .025, .85],
  ['Poco común', 120, .58, .025, .78],
  ['Raro', 45, .5, .025, .72],
  ['Muy raro', 0, .4, .025, .62],
];
const LEGEND_RARITY = ['Legendario', 0, .25, .02, .42];

const LEGEND_W = .03;                               // hueco del legendario en la ruleta de Pokémon salvaje (~3 %)

// evoluciones que solo hace la forma regional (Corsola de Galar → Cursola…): en la partida no cuentan
const REGIONAL_EVO = new Set([862, 863, 864, 865, 866, 867, 902, 903, 904, 980]);

// ---- Caja PC: 30 huecos (6 × 5), cada Pokémon en el hueco que elijas ----
const BOX_N = 30;

// ---- Formas: regionales (Corsola de Galar…) y variantes naturales (Basculin raya blanca, tallas de Pumpkaboo…) ----
const CAPTURE_FORMS = new Set([10016, 10247, 10004, 10005, 10025, 10027, 10028, 10029, 10030, 10031, 10032, 10123, 10124, 10125, 10126, 10152, 10184, 10191, 10186, 10248, 10254, 10257, 10258, 10259, 10260, 10261, 10262, 10255, 10263,
  ...VARIANTS.filter(v => v[2] === 666).map(v => v[0])]);   // los motivos de Vivillon
// Pumpkaboo y Gourgeist: sus tamaños usan el mismo dibujo, así que se ven a otra escala (pequeño, grande, extragrande)
const SIZE_SCALE = { 10027: .74, 10028: 1.16, 10029: 1.32, 10030: .78, 10031: 1.12, 10032: 1.26 };
const sizeStyle = id => SIZE_SCALE[id] ? `scale:${SIZE_SCALE[id]};transform-origin:50% 100%;` : '';
const BASE_FORM_NAME = { 550: 'Raya Roja', 413: 'Tronco Planta', 678: 'Macho', 710: 'Tamaño Normal', 711: 'Tamaño Normal', 741: 'Estilo Apasionado', 745: 'Forma Diurna', 849: 'Forma Aguda', 892: 'Estilo Brusco', 876: 'Macho', 902: 'Macho', 916: 'Macho', 925: 'Familia de cuatro', 931: 'Plumaje verde', 978: 'Forma curvada', 982: 'Binodular', 999: 'Forma cofre', 666: 'Motivo Floral', 869: 'Crema de Vainilla · Confite Fresa' };
// evoluciones que solo hace una forma concreta
const REG_REQ = { 862: 10175, 863: 10161, 864: 10173, 865: 10166, 866: 10168, 867: 10179, 902: 10247, 903: 10235, 904: 10234, 980: 10253 };
// evoluciones con varias variantes: al evolucionar, una ruleta decide cuál sale (0 = forma normal).
// Alcremie va en dos tiradas: primero la crema y luego el confite (ver evoVariant en flujo.js).
const EVO_VARIANTS = {
  413: [0, 10004, 10005],                   // Wormadam: tronco planta, arena o basura
  666: [0, ...VARIANTS.filter(v => v[2] === 666).map(v => v[0])],   // Vivillon: 20 motivos
  678: [0, 10025],                          // Meowstic macho o hembra
  745: [0, 10126, 10152],                   // Lycanroc diurno, nocturno o crepuscular
  849: [0, 10184],                          // Toxtricity agudo o grave
  869: 'alcremie',
  892: [0, 10191],                          // Urshifu brusco o fluido
  902: [0, 10248],                          // Basculegion macho o hembra
  916: [0, 10254],                          // Oinkologne macho o hembra
  925: [0, 10257],                          // Maushold: familia de cuatro o de tres
  982: [0, 10255],                          // Dudunsparce binodular o trinodular
};

// ---- Megaevolución y Dinamax/Gigamax ----
// Megapiedra: al ganar a un líder de gimnasio, uno de tus Pokémon que pueda megaevolucionar recibe la suya (la lleva equipada).
// Gigamax: los Pokémon con forma Gigamax oficial reciben la Banda Dinamax en el primer gimnasio que superes después de conseguirlos.
// En combate se pulsa la piedra (o la banda) de su ficha: se transforma solo durante ese giro. Un Pokémon transformado vale +1 de poder.
const MEGA_FORM_ONLY = { 10326: 10025, 10323: 10258, 10324: 10259, 10318: -1, 10296: 10061 };   // megas que pide una forma concreta (-1: ninguna de la partida)
const GMAX_FORM_ONLY = { 10228: 10184, 10227: 10191 };                                         // Toxtricity grave, Urshifu fluido
// el resto de megas y gigamax son de la forma normal (ni regionales ni otras formas, salvo las variantes de Alcremie)
function transformsOf(m, cls) {
  const only = cls === 'mega' ? MEGA_FORM_ONLY : GMAX_FORM_ONLY, form = m.bf !== undefined ? m.bf : m.tf ? m.tf.from : (m.form || 0);   // (transformado: su forma de antes)
  const plain = !form || (m.n === 869 && form >= 20000);
  return (FORMS[m.n] || []).filter(f => f[8] === cls && (only[f[0]] !== undefined ? only[f[0]] === form : plain)).map(f => f[0]);
}
const megaForms = m => transformsOf(m, 'mega');
// Megapiedra de cada megaevolución: id de la mega -> [icono (items/ de PokeAPI), nombre]. Los iconos van en assets/sprites/objetos.js
// (herramientas/generar-sprites.ps1 lee esta tabla). Kyogre y Groudon usan sus orbes; Rayquaza, el Meteorito.
const MEGA_STONES = {
  10033: ['venusaurite', 'Venusaurita'], 10034: ['charizardite-x', 'Charizardita X'], 10035: ['charizardite-y', 'Charizardita Y'], 10036: ['blastoisinite', 'Blastoisinita'],
  10037: ['alakazite', 'Alakazamita'], 10038: ['gengarite', 'Gengarita'], 10039: ['kangaskhanite', 'Kangaskhanita'], 10040: ['pinsirite', 'Pinsirita'],
  10041: ['gyaradosite', 'Gyaradosita'], 10042: ['aerodactylite', 'Aerodactylita'], 10043: ['mewtwonite-x', 'Mewtwonita X'], 10044: ['mewtwonite-y', 'Mewtwonita Y'],
  10045: ['ampharosite', 'Ampharosita'], 10046: ['scizorite', 'Scizorita'], 10047: ['heracronite', 'Heracrossita'], 10048: ['houndoominite', 'Houndoomita'],
  10049: ['tyranitarite', 'Tyranitarita'], 10050: ['blazikenite', 'Blazikenita'], 10051: ['gardevoirite', 'Gardevoirita'], 10052: ['mawilite', 'Mawilita'],
  10053: ['aggronite', 'Aggronita'], 10054: ['medichamite', 'Medichamita'], 10055: ['manectite', 'Manectricita'], 10056: ['banettite', 'Banettita'],
  10057: ['absolite', 'Absolita'], 10058: ['garchompite', 'Garchompita'], 10059: ['lucarionite', 'Lucarita'], 10060: ['abomasite', 'Abomasnowita'],
  10062: ['latiasite', 'Latiasita'], 10063: ['latiosite', 'Latiosita'], 10064: ['swampertite', 'Swampertita'], 10065: ['sceptilite', 'Sceptilita'],
  10066: ['sablenite', 'Sableynita'], 10067: ['altarianite', 'Altarianita'], 10068: ['galladite', 'Galladita'], 10069: ['audinite', 'Audinita'],
  10070: ['sharpedonite', 'Sharpedonita'], 10071: ['slowbronite', 'Slowbronita'], 10072: ['steelixite', 'Steelixita'], 10073: ['pidgeotite', 'Pidgeotita'],
  10074: ['glalitite', 'Glalita'], 10075: ['diancite', 'Diancita'], 10076: ['metagrossite', 'Metagrossita'], 10077: ['blue-orb', 'Prisma Azul'],
  10078: ['red-orb', 'Prisma Rojo'], 10079: ['meteorite', 'Meteorito'], 10087: ['cameruptite', 'Cameruptita'], 10088: ['lopunnite', 'Lopunnita'],
  10089: ['salamencite', 'Salamencita'], 10090: ['beedrillite', 'Beedrillita'],
  // Leyendas Pokémon Z-A y su ampliación
  10278: ['gen9/clefablite', 'Clefablita'], 10279: ['gen9/victreebelite', 'Victreebelita'], 10280: ['gen9/starminite', 'Starminita'], 10281: ['gen9/dragoninite', 'Dragoninita'],
  10282: ['gen9/meganiumite', 'Meganiumita'], 10283: ['gen9/feraligite', 'Feraligatrita'], 10284: ['gen9/skarmorite', 'Skarmorita'], 10285: ['gen9/froslassite', 'Froslassita'],
  10286: ['gen9/emboarite', 'Emboarita'], 10287: ['gen9/excadrite', 'Excadrillita'], 10288: ['gen9/scolipite', 'Scolipedita'], 10289: ['gen9/scraftinite', 'Scraftynita'],
  10290: ['gen9/eelektrossite', 'Eelektrossita'], 10291: ['gen9/chandelurite', 'Chandelurita'], 10292: ['gen9/chesnaughtite', 'Chesnaughtita'], 10293: ['gen9/delphoxite', 'Delphoxita'],
  10294: ['gen9/greninjite', 'Greninjita'], 10295: ['gen9/pyroarite', 'Pyroarita'], 10296: ['gen9/floettite', 'Floettita'], 10297: ['gen9/malamarite', 'Malamarita'],
  10298: ['gen9/barbaracite', 'Barbaracleita'], 10299: ['gen9/dragalgite', 'Dragalgita'], 10300: ['gen9/hawluchanite', 'Hawluchanita'], 10301: ['gen9/zygardite', 'Zygardita'],
  10302: ['gen9/drampanite', 'Drampanita'], 10303: ['gen9/falinksite', 'Falinksita'], 10304: ['gen9/raichunite-x', 'Raichunita X'], 10305: ['gen9/raichunite-y', 'Raichunita Y'],
  10306: ['gen9/chimechite', 'Chimechita'], 10307: ['gen9/absolite-z', 'Absolita Z'], 10308: ['gen9/staraptite', 'Staraptorita'], 10309: ['gen9/garchompite-z', 'Garchompita Z'],
  10310: ['gen9/lucarionite-z', 'Lucarita Z'], 10311: ['gen9/heatranite', 'Heatranita'], 10312: ['gen9/darkranite', 'Darkrainita'], 10313: ['gen9/golurkite', 'Golurkita'],
  10314: ['gen9/meowsticite', 'Meowsticita'], 10326: ['gen9/meowsticite', 'Meowsticita'], 10315: ['gen9/crabominite', 'Crabominablita'], 10316: ['gen9/golisopite', 'Golisopodita'],
  10317: ['gen9/magearnite', 'Magearnita'], 10318: ['gen9/magearnite', 'Magearnita'], 10319: ['gen9/zeraorite', 'Zeraorita'], 10320: ['gen9/scovillainite', 'Scovillainita'],
  10321: ['gen9/glimmoranite', 'Glimmoranita'], 10322: ['gen9/tatsugirinite', 'Tatsugirinita'], 10323: ['gen9/tatsugirinite', 'Tatsugirinita'], 10324: ['gen9/tatsugirinite', 'Tatsugirinita'],
  10325: ['gen9/baxcalibrite', 'Baxcalibrita'],
};
const stoneName = id => (MEGA_STONES[id] || [0, 'Megapiedra'])[1];
const stoneIcon = id => { const s = MEGA_STONES[id]; return s && SPR.item && SPR.item.get(s[0]); };
const gmaxForms = m => transformsOf(m, 'gmax');

// ---- Pociones de premio: mejoran con las medallas (0-2: Poción · 3-5: Superpoción · 6+: Hiperpoción) ----
const potionTier = (b = run.badges.length) => b >= 6 ? 'hyper' : b >= 3 ? 'super' : 'potion';

// ---- Primeros combates más fáciles (hasta la 2.ª medalla, es decir, los dos primeros líderes y lo de antes):
// quesitos verdes extra y la fuerza del rival cuenta la mitad ----
const ROOKIE_BONUS = b => b < 1 ? 3 : b < 2 ? 2 : 0;
const ROOKIE_FOE = b => b < 2 ? 1 : 2;              // quesitos rojos por cada punto de poder medio del rival

// 1 % de que el Pokémon capturado sea shiny: ya no hay ruleta, simplemente aparece (con su sonido especial)
const SHINY_RATE = 1 / 100;

// ===== Ruleta de aventura (Johto): inspirada en la Ruleta Pokémon original =====
// Cada tramo entre gimnasios tiene varias tiradas; cada quesito es un suceso del camino.
const ADV_ACTS = [
  { k: 'capture', label: 'Capturar', color: '#7ac74c', w: 8 },
  { k: 'trainer', label: 'Entrenador', color: '#ff5a46', w: 2 },
  { k: 'shop', label: 'Tienda', color: '#6390f0', w: 1.5 },
  { k: 'straight', label: 'Paseo', color: '#8592ab', w: 1 },
  { k: 'catchTwo', label: 'Capturar dos', color: '#62b33a', w: 1.6 },
  { k: 'catchThree', label: 'Capturar tres', color: '#4f9a2d', w: 0.8 },
  { k: 'daycare', label: 'Guardería', color: '#f4a6c8', w: 0.8 },
  { k: 'rocket', label: 'Team Rocket', color: '#a33ea1', w: 0.8 },
  { k: 'egg', label: 'Huevo misterioso', color: '#f2e27a', w: 0.6 },
  { k: 'legend', label: 'Legendario', color: '#ffd84a', w: 0.3 },
  { k: 'trade', label: 'Intercambio', color: '#5ad1c8', w: 0.8 },
  { k: 'item', label: 'Objeto', color: '#b46cff', w: 1.5 },
  { k: 'cave', label: 'Cueva', color: '#9a7b55', w: 1.2 },
  { k: 'tree', label: 'Árbol raro', color: '#3f8f4a', w: 0.6 },
  { k: 'multitask', label: 'Multitarea', color: '#e0a040', w: 0.8 },
  { k: 'fish', label: 'Pescar', color: '#4aa3df', w: 1.2 },
  { k: 'rival', label: 'Rival', color: '#d0505a', w: 0.8 },
];
// primer camino: ruleta sencilla, como el inicio de la aventura de la web
const START_ACTS = [
  { k: 'capture', label: 'Capturar', color: '#7ac74c', w: 6 },
  { k: 'catchTwo', label: 'Capturar dos', color: '#62b33a', w: 1.6 },
  { k: 'catchThree', label: 'Capturar tres', color: '#4f9a2d', w: 0.8 },
  { k: 'trainer', label: 'Entrenador', color: '#ff5a46', w: 2 },
  { k: 'shop', label: 'Tienda', color: '#6390f0', w: 1.5 },
  { k: 'straight', label: 'Paseo', color: '#8592ab', w: 1 },
];
// Meseta Añil: la ruleta normal de aventura (capturas, Team Rocket, Multitarea…) más Entrenar
const PREP_ACTS = [...ADV_ACTS, { k: 'train', label: 'Entrenar', color: '#7ac74c', w: 1.5 }];
const ROCKET_TEAMS = [[19, 41], [19, 41, 109], [24, 109, 41], [24, 109, 41], [42, 110, 20], [42, 110, 20], [42, 110, 24, 20], [42, 110, 24, 229], [42, 110, 24, 229]];

// los legendarios y singulares tienen un quesito mucho más pequeño (¼) que el resto
const LEG_SLICE = .25;

const CAVE_TYPES = ['Roca', 'Tierra', 'Lucha', 'Acero', 'Siniestro', 'Fantasma', 'Hielo', 'Veneno'];

// ---- Formas de combate: Pokémon cuya habilidad cambia su aspecto al combatir (Cambio Táctico, Modo Daruma, Banco…).
// Al empezar el combate se transforman (con su sprite y sus tipos de esa forma) y al acabar vuelven a como estaban.
const BATTLE_FORMS = {
  '681:0': [10026, 'Cambio Táctico'],                 // Aegislash → Forma Filo
  '555:0': [10017, 'Modo Daruma'], '555:10177': [10178, 'Modo Daruma'],   // Darmanitan (y el de Galar)
  '746:0': [10127, 'Banco'],                          // Wishiwashi → Forma Banco
  '718:0': [10120, 'Agrupamiento'], '718:10181': [10120, 'Agrupamiento'],  // Zygarde → Forma Completa
  '845:0': [[10182, 10183], 'Tragamisil'],            // Cramorant → Tragatodo o Engulletodo
  '875:0': [10185, 'Cara de Hielo'],                  // Eiscue → Cara Deshielo
  '877:0': [10187, 'Mutapetito'],                     // Morpeko → Forma Voraz
  '351:0': [[10013, 10014, 10015], 'Predicción'],     // Castform → según el clima del combate
  '964:0': [10256, 'Cambio Heroico'],                 // Palafin → Palafin Heroico
  '1024:0': [10276, 'Teracambio'],                    // Terapagos → Forma Teracristal
  '774:0': [10136, 'Escudo Limitado'],                // Minior → Núcleo
};
