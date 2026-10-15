// Tipos: colores, tabla de efectividad (atacante -> defensor) e iconos
const TYPE_COLORS = { Normal:'#a8a77a', Fuego:'#ee8130', Agua:'#6390f0', Eléctrico:'#f7d02c', Planta:'#7ac74c', Hielo:'#96d9d6', Lucha:'#c22e28', Veneno:'#a33ea1', Tierra:'#e2bf65', Volador:'#a98ff3', Psíquico:'#f95587', Bicho:'#a6b91a', Roca:'#b6a136', Fantasma:'#735797', Dragón:'#6f35fc', Siniestro:'#705746', Acero:'#b7b7ce', Hada:'#d685ad' };

// Tabla de tipos: atacante -> { defensor: multiplicador } (solo lo que no es x1)
const CHART = {
  Normal: { Roca: .5, Fantasma: 0, Acero: .5 },
  Fuego: { Fuego: .5, Agua: .5, Planta: 2, Hielo: 2, Bicho: 2, Roca: .5, 'Dragón': .5, Acero: 2 },
  Agua: { Fuego: 2, Agua: .5, Planta: .5, Tierra: 2, Roca: 2, 'Dragón': .5 },
  'Eléctrico': { Agua: 2, 'Eléctrico': .5, Planta: .5, Tierra: 0, Volador: 2, 'Dragón': .5 },
  Planta: { Fuego: .5, Agua: 2, Planta: .5, Veneno: .5, Tierra: 2, Volador: .5, Bicho: .5, Roca: 2, 'Dragón': .5, Acero: .5 },
  Hielo: { Fuego: .5, Agua: .5, Planta: 2, Hielo: .5, Tierra: 2, Volador: 2, 'Dragón': 2, Acero: .5 },
  Lucha: { Normal: 2, Hielo: 2, Veneno: .5, Volador: .5, 'Psíquico': .5, Bicho: .5, Roca: 2, Fantasma: 0, Siniestro: 2, Acero: 2, Hada: .5 },
  Veneno: { Planta: 2, Veneno: .5, Tierra: .5, Roca: .5, Fantasma: .5, Acero: 0, Hada: 2 },
  Tierra: { Fuego: 2, 'Eléctrico': 2, Planta: .5, Veneno: 2, Volador: 0, Bicho: .5, Roca: 2, Acero: 2 },
  Volador: { 'Eléctrico': .5, Planta: 2, Lucha: 2, Bicho: 2, Roca: .5, Acero: .5 },
  'Psíquico': { Lucha: 2, Veneno: 2, 'Psíquico': .5, Siniestro: 0, Acero: .5 },
  Bicho: { Fuego: .5, Planta: 2, Lucha: .5, Veneno: .5, Volador: .5, 'Psíquico': 2, Fantasma: .5, Siniestro: 2, Acero: .5, Hada: .5 },
  Roca: { Fuego: 2, Hielo: 2, Lucha: .5, Tierra: .5, Volador: 2, Bicho: 2, Acero: .5 },
  Fantasma: { Normal: 0, 'Psíquico': 2, Fantasma: 2, Siniestro: .5 },
  'Dragón': { 'Dragón': 2, Acero: .5, Hada: 0 },
  Siniestro: { Lucha: .5, 'Psíquico': 2, Fantasma: 2, Siniestro: .5, Hada: .5 },
  Acero: { Fuego: .5, Agua: .5, 'Eléctrico': .5, Hielo: 2, Roca: 2, Acero: .5, Hada: 2 },
  Hada: { Fuego: .5, Lucha: 2, Veneno: .5, 'Dragón': 2, Siniestro: 2, Acero: .5 },
};

// Iconos de tipo: dibujos geométricos propios (24×24)
const TYPE_ICONS = {
  Normal: '<circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" stroke-width="3"/>',
  Fuego: '<path d="M12 2c1 4.5 6.5 6.5 6.5 12.5a6.5 6.5 0 0 1-13 0c0-3.2 1.8-5.4 3.2-6.6 0 2.2 1 3.4 2.3 3.6-.4-4.2-.6-6.9 1-9.5z"/>',
  Agua: '<path d="M12 2.5C9 7.2 5.8 10.6 5.8 14.8a6.2 6.2 0 0 0 12.4 0c0-4.2-3.2-7.6-6.2-12.3z"/>',
  'Eléctrico': '<path d="M14 2 4.8 13.6h6.1L9.6 22l9.6-12.3h-6.3L14 2z"/>',
  Planta: '<path d="M20.5 3.5C10 3.5 3.5 8.7 3.5 15.8c0 1.5.3 2.7.9 3.8C5.8 13.7 9.6 10.4 15 8.3c-4.2 3-7.3 6.7-8.9 12.6.9.4 2 .6 3.1.6 7 0 11.3-7 11.3-18z"/>',
  Hielo: '<g fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><path d="M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6"/><path d="M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5"/></g>',
  Lucha: '<path d="M5.5 9.5a2.2 2.2 0 0 1 4.4 0v-1a2.2 2.2 0 0 1 4.4 0v.4a2.2 2.2 0 0 1 4.2 1v5.3c0 4-3 6.8-6.8 6.8-3.6 0-6.2-2.6-6.2-6.2V9.5z"/>',
  Veneno: '<circle cx="9" cy="14.5" r="5.5"/><circle cx="16.5" cy="8" r="3.6"/><circle cx="17.2" cy="17.5" r="2.4"/>',
  Tierra: '<path d="M2.5 6h19v3.4h-19zM5 11.3h14v3.4H5zM8 16.6h8V20H8z"/>',
  Volador: '<path d="M2.5 14.5c4.6.2 8.5-3 10.6-9.5 1.3 4.2.4 7.4-1.6 9.7 3.3.2 6.3-.8 8.9-3.2-.8 4.8-5.2 8.8-10.6 8.8-3.4 0-5.9-2.2-7.3-5.8z"/>',
  'Psíquico': '<path fill-rule="evenodd" d="M1.8 12S6 5.6 12 5.6 22.2 12 22.2 12 18 18.4 12 18.4 1.8 12 1.8 12zm10.2 3.6a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2z"/>',
  Bicho: '<path d="M12 6c3.6 0 6 3.6 6 8s-2.4 8-6 8-6-3.6-6-8 2.4-8 6-8z"/><path d="M8.6 2.5 10.4 6M15.4 2.5 13.6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  Roca: '<path d="M7.2 3.5h8.6l5.2 6.4-3.2 10.6H7L3 12.2z"/>',
  Fantasma: '<path d="M12 2.8a7.2 7.2 0 0 0-7.2 7.2v11.2l2.5-2 2.3 2 2.4-2 2.4 2 2.3-2 2.5 2V10A7.2 7.2 0 0 0 12 2.8z"/>',
  'Dragón': '<path d="M4.5 20.5c0-9 5-16 16-17.5-4 3.2-6.2 6.2-6.2 9.4 2-1 4.2-1.1 6.2 0-4.2.9-7.3 4-8.3 8.1H4.5z"/>',
  Siniestro: '<path d="M15 2.6a9.4 9.4 0 1 0 6.4 15.6A7.6 7.6 0 0 1 15 2.6z"/>',
  Acero: '<path fill-rule="evenodd" d="m12 2 8.7 5v10L12 22l-8.7-5V7L12 2zm0 6.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2z"/>',
  Hada: '<path d="M11 3c.8 5 2.9 7.1 7.9 7.9-5 .8-7.1 2.9-7.9 7.9-.8-5-2.9-7.1-7.9-7.9C8.1 10.1 10.2 8 11 3z"/><path d="M18.5 15.5c.3 2 1.1 2.8 3 3.1-1.9.3-2.7 1.1-3 3-.3-1.9-1.1-2.7-3-3 1.9-.3 2.7-1.1 3-3.1z"/>',
};
