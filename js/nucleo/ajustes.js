// Estado global y ajustes guardados en el navegador (se cambian en Opciones)
let state = { scene: 'home', chosen: null };

let soundOn = true;                                              // sonido (no se guarda: empieza encendido)
let reduceMotion = store.get('ruleta-motion') === 'off';         // animaciones activadas por defecto
document.documentElement.classList.toggle('nomotion', reduceMotion);

// velocidad del texto: lenta, normal, rápida o al instante
const TSPEEDS = [{ n: 'LENTA', ms: 42 }, { n: 'NORMAL', ms: 18 }, { n: 'RÁPIDA', ms: 7 }, { n: 'AL INSTANTE', ms: 0 }];
let textSpeed = 1;
{ const v = store.get('ruleta-tspeed'); if (v !== null && TSPEEDS[+v]) textSpeed = +v; }

let ttsOn = store.get('ruleta-tts') === 'on';                    // locutor
let devMode = store.get('ruleta-mode') === 'dev';                // modo desarrollador: Pokédex completa
let shinyMode = store.get('ruleta-shiny') === '1';               // Pokédex con los sprites shiny
let theme = store.get('ruleta-theme') || 'dark';

// numeración de la Pokédex: nacional o la de una Pokédex regional
let numMode = store.get('ruleta-num') || 'national';
if (numMode !== 'national' && !REGIONAL.some(r => r.id === numMode)) numMode = 'national';
