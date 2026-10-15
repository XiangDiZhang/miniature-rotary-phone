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
const CAPTURE_FORMS = new Set([10016, 10247, 10004, 10005, 10025, 10027, 10028, 10029, 10030, 10031, 10032, 10123, 10124, 10125, 10126, 10152, 10184, 10191, 10186, 10248, 10254, 10257, 10258, 10259, 10260, 10261, 10262, 10255, 10263]);
const BASE_FORM_NAME = { 550: 'Raya Roja', 413: 'Tronco Planta', 678: 'Macho', 710: 'Tamaño Normal', 711: 'Tamaño Normal', 741: 'Estilo Apasionado', 745: 'Forma Diurna', 849: 'Forma Aguda', 892: 'Estilo Brusco', 876: 'Macho', 902: 'Macho', 916: 'Macho', 925: 'Familia de cuatro', 931: 'Plumaje verde', 978: 'Forma curvada', 982: 'Binodular', 999: 'Forma cofre' };
// evoluciones que solo hace una forma concreta
const REG_REQ = { 862: 10175, 863: 10161, 864: 10173, 865: 10166, 866: 10168, 867: 10179, 902: 10247, 903: 10235, 904: 10234, 980: 10253 };

// 1 % de que el Pokémon capturado sea shiny: ya no hay ruleta, simplemente aparece (con su sonido especial)
const SHINY_RATE = 1 / 100;

// ===== Ruleta de aventura (Johto): inspirada en la Ruleta Pokémon original =====
// Cada tramo entre gimnasios tiene varias tiradas; cada quesito es un suceso del camino.
const ADV_ACTS = [
  { k: 'capture', label: 'Capturar', color: '#7ac74c', w: 5 },
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
  { k: 'capture', label: 'Capturar', color: '#7ac74c', w: 4 },
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
