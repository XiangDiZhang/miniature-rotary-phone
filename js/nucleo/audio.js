// Sonido: efectos y música sintetizados en el momento (Web Audio), sin archivos de audio
let audio = null;
// contexto de audio único; se crea con la primera pulsación y se reanuda si el navegador lo había pausado
function actx() {
  audio = audio || new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === 'suspended') { const p = audio.resume(); if (p && p.catch) p.catch(() => {}); }
  return audio;
}
function beep(freq = 660, dur = 0.08, vol = 0.04, type = 'sine') {
  if (!soundOn) return;
  try {
    actx();
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(vol, audio.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
    o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + dur + 0.02);
  } catch (e) {}
}
const chord = notes => notes.forEach((f, i) => setTimeout(() => beep(f, 0.22, 0.04), i * 70));
// objeto conseguido: fanfarria corta (ta-ta-ta-táaa), como al recibir un objeto en los juegos
function itemSfx() {
  if (!soundOn) return;
  [[784, 0, .1], [988, .09, .1], [1175, .18, .1], [1568, .3, .42]].forEach(([f, t, d]) => setTimeout(() => { beep(f, d, .05, 'triangle'); beep(f / 2, d, .025, 'square'); }, t * 1000));
}
// ✦ sonido shiny: tres destellos agudos, un barrido que sube brillando y una campanita final
function shinySfx() {
  if (!soundOn) return;
  try {
    actx();
    const t0 = audio.currentTime, out = audio.createGain(); out.gain.value = 1; out.connect(audio.destination);
    const ping = (f, t, d = .12, v = .05, type = 'triangle') => { const o = audio.createOscillator(), g = audio.createGain(); o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g).connect(out); o.start(t); o.stop(t + d + .03); };
    [2637, 3520, 3136, 4186].forEach((f, i) => ping(f, t0 + i * .07, .1, .045));
    // barrido brillante con vibrato
    const o = audio.createOscillator(), g = audio.createGain(), lfo = audio.createOscillator(), lg = audio.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(900, t0 + .3); o.frequency.exponentialRampToValueAtTime(2800, t0 + .75);
    lfo.frequency.value = 22; lg.gain.value = 60; lfo.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(.0001, t0 + .3); g.gain.exponentialRampToValueAtTime(.035, t0 + .4); g.gain.exponentialRampToValueAtTime(.0001, t0 + .8);
    o.connect(g).connect(out); o.start(t0 + .3); o.stop(t0 + .85); lfo.start(t0 + .3); lfo.stop(t0 + .85);
    // campanita
    [1568, 2093, 2637, 3136].forEach((f, i) => ping(f, t0 + .82 + i * .025, 1.1, .03, 'sine'));
    [5274, 4699, 5920].forEach((f, i) => ping(f, t0 + 1 + i * .09, .08, .02));
  } catch (e) {}
}

// ---- Kit de música «de rey medieval»: trompetas heráldicas, trompas en quintas, timbales, caja y campanas (todo sintetizado, composición propia) ----
function royalKit() {
  if (!soundOn) return null;
  let ctx;
  try { ctx = actx(); } catch (e) { return null; }
  const out = ctx.createGain(); out.gain.value = .8;
  // sala de castillo: un par de ecos para dar amplitud
  const mkEcho = (time, fbv, wv) => { const d = ctx.createDelay(), f = ctx.createGain(), w = ctx.createGain(); d.delayTime.value = time; f.gain.value = fbv; w.gain.value = wv; out.connect(d); d.connect(f).connect(d); d.connect(w).connect(ctx.destination); };
  out.connect(ctx.destination); mkEcho(.19, .32, .2); mkEcho(.37, .2, .12);
  const N = s => { const m = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }; const r = /^([A-G])(#|b)?(\d)$/.exec(s); return 440 * Math.pow(2, (m[r[1]] + (r[2] === '#' ? 1 : r[2] === 'b' ? -1 : 0) + (r[3] - 4) * 12 - 9) / 12); };
  const T = () => ctx.currentTime;
  const brass = (f, t, d, v = .05, bright = 7) => {
    const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 3;
    lp.frequency.setValueAtTime(f * 1.4, t); lp.frequency.exponentialRampToValueAtTime(Math.min(9500, f * bright), t + .045); lp.frequency.exponentialRampToValueAtTime(Math.min(6000, f * (bright * .55)), t + Math.max(.12, d * .7));
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .03); g.gain.setValueAtTime(v * .85, t + Math.max(.05, d - .05)); g.gain.exponentialRampToValueAtTime(.0001, t + d + .09);
    const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 5.2; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * .007, t + Math.min(.45, d)); vib.connect(vg);
    [0, 7, -6].forEach((c, i) => { const o = ctx.createOscillator(); o.type = i === 2 ? 'square' : 'sawtooth'; o.frequency.value = f; o.detune.value = c; vg.connect(o.frequency); o.connect(lp); o.start(t); o.stop(t + d + .14); });
    vib.start(t); vib.stop(t + d + .14); lp.connect(g).connect(out);
  };
  // trompa suave (para el bordón de quintas, muy medieval)
  const horn = (f, t, d, v = .02) => { const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = f * 3;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .35); g.gain.setValueAtTime(v, t + Math.max(.4, d - .4)); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    ['sawtooth', 'triangle'].forEach((ty, i) => { const o = ctx.createOscillator(); o.type = ty; o.frequency.value = f; o.detune.value = i ? 4 : -4; o.connect(lp); o.start(t); o.stop(t + d + .05); }); lp.connect(g).connect(out); };
  const timp = (f, t, v = .24) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f * 1.45, t); o.frequency.exponentialRampToValueAtTime(f, t + .07);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .6); o.connect(g).connect(out); o.start(t); o.stop(t + .65); };
  const noise = (t, d, v, hp = 5000, lpf) => { const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * d), ctx.sampleRate), x = b.getChannelData(0); for (let i = 0; i < x.length; i++) x[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = b; f.type = 'highpass'; f.frequency.value = hp; let n = s.connect(f);
    if (lpf) { const l = ctx.createBiquadFilter(); l.type = 'lowpass'; l.frequency.value = lpf; n = n.connect(l); }
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); n.connect(g).connect(out); s.start(t); };
  const snare = (t, v = .06) => { noise(t, .14, v, 1800, 7000); const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = 190; g.gain.setValueAtTime(v * .8, t); g.gain.exponentialRampToValueAtTime(.0001, t + .08); o.connect(g).connect(out); o.start(t); o.stop(t + .1); };
  const roll = (t, d, v = .045) => { for (let x = 0; x < d; x += .045) snare(t + x, v * (.5 + x / d * .6)); };
  const bell = (f, t, d = 1.2, v = .025) => [1, 2.76, 5.4].forEach((h, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f * h;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v / (i + 1), t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + d / (i + 1)); o.connect(g).connect(out); o.start(t); o.stop(t + d + .05); });
  const cymbal = (t, d = 2, v = .05) => noise(t, d, v, 5500);
  // toca una lista de notas [nota, inicio, duración] como trompeta, con una 2.ª voz una sexta por debajo
  const line = (t, notes, v = .05, harm = true) => notes.forEach(([n, at, d]) => { const f = N(n); brass(f, t + at, d, v); if (harm) brass(f * Math.pow(2, -9 / 12), t + at, d, v * .55, 5); });
  return { ctx, N, T, brass, horn, timp, snare, roll, bell, cymbal, line };
}

// ---- Música de la evolución: heraldos anunciando, cada vez más alto, y una fanfarria real al final ----
function evoAudio() {
  const K = royalKit(), none = { pulse() {}, climax() {}, stop() {} };
  if (!K) return none;
  const { N, T, brass, horn, timp, snare, roll, bell, cymbal, line } = K;
  const t0 = T() + .05;
  // bordón de quintas (Re–La) de fondo, como en una corte medieval
  horn(N('D3'), t0, 9, .016); horn(N('A3'), t0, 9, .012);
  // llamada del heraldo: ta – da – DAAA (con ritmo con puntillo)
  line(t0, [['A4', 0, .16], ['A4', .2, .07], ['D5', .3, .55]], .04); timp(N('D2'), t0 + .3, .2);
  // cada cambio de silueta: una llamada de trompeta (ritmo con puntillo) que sube por la escala de Re
  const RISE = ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5', 'E5', 'F#5'];
  let k = 0;
  return {
    pulse() { const t = T() + .01, n = RISE[Math.min(k, RISE.length - 1)], up = RISE[Math.min(k + 2, RISE.length - 1)]; k++;
      line(t, [[n, 0, .17], [n, .21, .07], [up, .3, .3]], .036); timp(N(k % 2 ? 'A1' : 'D2'), t, .15 + k * .012); snare(t + .21, .03 + k * .004);
      if (k >= 6) roll(t + .3, .3, .03); },
    climax() {
      const t = T() + .04;
      timp(N('D2'), t, .34); cymbal(t, 2.4, .07); roll(t - .5, .5, .05);
      // fanfarria real (propia): ta-ta-TAAA · ta-ta-ta-TAAA · ta-da-da-DAAAAA
      line(t, [['D5', 0, .14], ['D5', .17, .14], ['A5', .34, .48], ['F#5', .9, .13], ['G5', 1.05, .13], ['A5', 1.2, .13], ['B5', 1.35, .45], ['A5', 1.88, .16], ['F#5', 2.06, .1], ['G5', 2.18, .1], ['A5', 2.3, 1.5]], .052);
      // trompas y timbales marcando el paso del rey
      [['D3', 0, .8], ['G3', .9, .9], ['A3', 1.88, .4], ['D3', 2.3, 1.6]].forEach(([n, at, d]) => { horn(N(n), t + at, d + .2, .03); horn(N(n) * 1.5, t + at, d + .2, .02); });
      [0, .34, .9, 1.35, 1.88, 2.3, 2.45].forEach((at, i) => timp(N(i % 2 ? 'A1' : 'D2'), t + at, .26));
      cymbal(t + 2.3, 2.6, .06);
      ['D6', 'F#6', 'A6', 'D7'].forEach((n, i) => bell(N(n), t + 2.45 + i * .1, 1.6, .02));
    },
    stop() {},
  };
}

// ---- Captura de un legendario: himno solemne (composición propia) en Re menor que se abre a Re mayor, con trompas, timbales y platillo ----
function legendMusic() {
  const K = royalKit(); if (!K) return;
  const { N, T, horn, timp, roll, bell, cymbal, line } = K;
  const t = T() + .1;
  horn(N('D3'), t, 5.5, .02); horn(N('A3'), t, 5.5, .015);
  roll(t, .6, .05); timp(N('D2'), t + .6, .3);
  // llamada grave y solemne: DA – da-DAAA (menor)
  line(t + .6, [['D4', 0, .55], ['F4', .6, .2], ['A4', .85, .7], ['G4', 1.6, .25], ['F4', 1.9, .25], ['E4', 2.2, .5]], .05);
  [['D3', .6, 1.4], ['Bb2', 2, .8]].forEach(([n, at, d]) => horn(N(n), t + at, d, .03));
  [1.45, 2.2].forEach(at => timp(N('A1'), t + at, .22));
  // y se abre a mayor: la gloria de haberlo atrapado
  const c = t + 2.9;
  roll(c - .5, .5, .05); cymbal(c, 2.6, .07); timp(N('D2'), c, .34);
  line(c, [['A4', 0, .18], ['D5', .2, .18], ['F#5', .4, .18], ['A5', .6, 1.6]], .056);
  [['D3', 0, 2.2], ['A3', 0, 2.2]].forEach(([n, at, d]) => horn(N(n), c + at, d, .03));
  ['D6', 'A6', 'D7'].forEach((n, i) => bell(N(n), c + .6 + i * .14, 1.8, .02));
}
// ---- Captura de un mítico: música misteriosa y mágica (propia): arpegios de campanitas en escala de tonos enteros, un coro suave y un brillo final ----
function mythMusic() {
  if (!soundOn) return;
  let ctx; try { ctx = actx(); } catch (e) { return; }
  const out = ctx.createGain(); out.gain.value = .9; out.connect(ctx.destination);
  const d1 = ctx.createDelay(), fb = ctx.createGain(), wet = ctx.createGain(); d1.delayTime.value = .28; fb.gain.value = .38; wet.gain.value = .35; out.connect(d1); d1.connect(fb).connect(d1); d1.connect(wet).connect(ctx.destination);
  const f = (s, o) => 261.63 * Math.pow(2, s / 12 + o);
  const bell = (fr, t, d = 1.4, v = .03) => [1, 2.01, 3.98].forEach((h, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = fr * h;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v / (i + 1.5), t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d / (i + 1)); o.connect(g).connect(out); o.start(t); o.stop(t + d + .05); });
  // «coro»: tres voces suaves con vibrato lento
  const pad = (fr, t, d, v = .012) => [0, 7, -5].forEach(dt => { const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = fr; o.detune.value = dt; lp.type = 'lowpass'; lp.frequency.value = 1800; lfo.frequency.value = 4.5; lg.gain.value = fr * .006; lfo.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .6); g.gain.setValueAtTime(v, t + d - .7); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(lp).connect(g).connect(out); o.start(t); o.stop(t + d + .05); lfo.start(t); lfo.stop(t + d + .05); });
  const t = ctx.currentTime + .08;
  // arpegio de tonos enteros que sube y baja (misterio)
  [0, 2, 4, 6, 8, 10, 12, 14, 16, 14, 12, 10].forEach((s, i) => bell(f(s, 1), t + i * .13, 1.2, .028));
  pad(f(0, -1), t, 2.4); pad(f(6, -1), t + .2, 2.2, .009);
  // resolución luminosa en Mi mayor con destellos agudos
  const c = t + 1.75;
  pad(f(4, -1), c, 2.6, .013); pad(f(11, -1), c, 2.6, .01); pad(f(8, 0), c + .1, 2.4, .009);
  [4, 8, 11, 16, 20, 23, 28].forEach((s, i) => bell(f(s, 1), c + i * .09, 1.8, .026));
  [2637, 3136, 3951, 4699].forEach((fr, i) => bell(fr, c + .9 + i * .12, .6, .012));
}

// ---- Derrota: lluvia, tus Pokémon caen debilitados uno a uno y suena un lamento ----
function loseMusic() {
  const K = royalKit(); if (!K) return;
  const { N, T, brass, horn, timp, bell } = K;
  const t = T() + .15;
  horn(N('A2'), t, 7, .02); horn(N('E3'), t, 7, .012);
  // lamento (propio): una trompeta lenta que baja en menor
  [['E5', 0, .9], ['D5', 1, .45], ['C5', 1.5, .45], ['B4', 2, .9], ['A4', 3, 1.4], ['G#4', 4.6, .5], ['A4', 5.1, 2.2]].forEach(([n, at, d]) => brass(N(n), t + at, d, .03, 4));
  [['A3', 0, 1.9], ['F3', 2, 1], ['E3', 3, 1.5], ['A2', 4.6, 3]].forEach(([n, at, d]) => horn(N(n), t + at, d, .02));
  [0, 2, 4.6].forEach(at => timp(N('A1'), t + at, .14));
  [5.1, 6.1, 7.1].forEach(at => bell(N('A4'), t + at, 2.2, .02));
}

// ---- Hall de la Fama: tus Pokémon desfilan por la alfombra roja y te coronan nuevo Campeón ----
function hofMusic() {
  const K = royalKit(); if (!K) return;
  const { N, T, horn, timp, snare, roll, bell, cymbal, line } = K;
  const t = T() + .1, beat = .5;
  // marcha procesional (propia) en Re: 4 compases de 4 tiempos, dos veces
  const melody = [['D5', 0, .7], ['A4', .75, .22], ['D5', 1, .22], ['F#5', 1.25, .22], ['A5', 1.5, .45], ['G5', 2, .7], ['F#5', 2.75, .22], ['E5', 3, .45], ['D5', 3.5, .45],
    ['E5', 4, .7], ['F#5', 4.75, .22], ['G5', 5, .45], ['A5', 5.5, .45], ['B5', 6, .45], ['A5', 6.5, .22], ['G5', 6.75, .22], ['F#5', 7, .9]];
  [0, 8].forEach(off => line(t + off * beat, melody.map(([n, at, d]) => [n, at * beat, d * beat]), .045));
  for (let b = 0; b < 16; b++) { const tt = t + b * beat; timp(N(b % 4 === 2 ? 'A1' : 'D2'), tt, b % 4 === 0 ? .26 : .14); if (b % 2) snare(tt, .04); if (b % 4 === 3) snare(tt + beat * .75, .03); }
  horn(N('D3'), t, 8.4, .018); horn(N('A3'), t, 8.4, .014);
  // coronación: redoble, platillo y la fanfarria final con campanas
  const c = t + 16 * beat;
  roll(c - 1.2, 1.2, .055);
  line(c, [['A4', 0, .13], ['D5', .16, .13], ['F#5', .32, .13], ['A5', .48, .7], ['F#5', 1.25, .15], ['A5', 1.42, .15], ['D6', 1.6, 2]], .056);
  [['D3', 0, 1.2], ['G3', 1.25, .35], ['D3', 1.6, 2.2]].forEach(([n, at, d]) => { horn(N(n), c + at, d, .032); horn(N(n) * 1.5, c + at, d, .022); });
  [0, .48, 1.25, 1.6, 1.75, 1.9].forEach(at => timp(N('D2'), c + at, .3));
  cymbal(c, 2.5, .07); cymbal(c + 1.6, 3, .07);
  for (let i = 0; i < 8; i++) bell(N(['D6', 'A6', 'F#6', 'D7'][i % 4]), c + 1.8 + i * .18, 1.4, .018);
  return c + 1.6 - T();   // segundos hasta el momento de la corona
}
