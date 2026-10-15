// Utilidades generales (DOM, números, texto y guardado en el navegador)
const $ = id => document.getElementById(id);
const TAU = Math.PI * 2;
const mod = (a, m) => ((a % m) + m) % m;
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));   // entero al azar entre a y b (incluidos)

// números de la Pokédex: 001…999 y 1000+
const pad = n => String(n).padStart(3, '0');
const padN = n => String(n).padStart(n > 999 ? 4 : 3, '0');
const pct = p => Math.round(p * 100) + '%';

// colores en hexadecimal (#rrggbb): con transparencia y luminosidad (para elegir texto claro u oscuro encima)
function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
const lum = h => { const n = parseInt(h.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };

// texto: «a, b y c», etiqueta corta de una casilla, sin tildes (para buscar) y sin nada más que letras y números
const listJoin = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1] : a[0] || '';
const shortOf = l => l.toUpperCase().slice(0, 12);
const norm = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const slug = t => norm(t).replace(/♀/g, 'f').replace(/♂/g, 'm').replace(/[^a-z0-9]/g, '');

// localStorage a prueba de fallos: si el navegador no deja guardar (modo privado, vista previa…), el juego sigue sin guardar
const store = {
  get(key, fallback = null) { try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch (e) { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch (e) {} },
  remove(key) { try { localStorage.removeItem(key); } catch (e) {} },
  getJSON(key, fallback = null) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (e) { return fallback; } },
  setJSON(key, value) { this.set(key, JSON.stringify(value)); },
};
