// Escenarios de prueba: #scene=… (captura) o #flow=región (partida automática con traza)
(function () {
  const P = new URLSearchParams(location.hash.slice(1));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const report = {};
  const txt = id => (document.getElementById(id) || {}).textContent || '';
  async function play(region, steps) {
    window.__noCine = true;
    advStart(true, region);
    const trace = [];
    for (let i = 0; i < steps; i++) {
      await wait(30);
      const btn = [...document.querySelectorAll('#advBtns button:not([disabled])')].find(b => !b.classList.contains('ghostbtn'));
      let act;
      if (advWheel.enabled && !advWheel.spinning) { act = 'spin'; advWheel.spin(1); }
      else if (btn) { act = 'btn:' + btn.textContent; btn.click(); }
      else { act = 'idle'; }
      await wait(30);
      trace.push(`${i} ${act} | ${txt('advStep')} | ${txt('advText')} | pts=${run.points} team=${run.team.map(m => m.n + (m.form ? '/' + m.form : '') + (m.shiny ? '*' : '')).join(',')} box=${run.box.filter(Boolean).length} step=${run.step}`);
    }
    return trace;
  }
  async function scene(sc) {
    switch (sc) {
      case 'home': break;
      case 'menu': show('menu'); break;
      case 'roulette': show('roulette'); break;
      case 'roulette-landed': show('roulette'); spin(); await wait(7000); break;
      case 'chosen': pick(GENS[0]); break;
      case 'dex': show('dex'); break;
      case 'dex-filter': show('dex'); document.querySelector('#dexTypes [data-t="Fuego"]').click(); document.querySelector('#dexGens [data-v="1"]').click(); break;
      case 'dex-search': show('dex'); { const i = $('dexSearch'); i.value = 'char'; i.dispatchEvent(new Event('input')); } break;
      case 'dex-regional': show('dex'); setNum('original-johto'); break;
      case 'dex-scroll': show('dex'); await wait(100);
        for (let i = 0; i < 30; i++) { $('dexBox').dispatchEvent(new WheelEvent('wheel', { deltaY: 900, cancelable: true })); await wait(40); }
        await wait(1500); break;
      case 'info': show('dex'); await wait(50); openInfo(6); break;
      case 'info-form': show('dex'); await wait(50); openInfo(6, null, 10034); break;
      case 'info-next': show('dex'); await wait(50); openInfo(25); await wait(50); stepInfo(1); break;
      case 'options': show('options'); break;
      case 'adv': { window.__noCine = true; advStart(true, P.get('region') || 'kanto'); await wait(50);
        for (let i = 0; i < +(P.get('steps') || 6); i++) { const b = [...document.querySelectorAll('#advBtns button:not([disabled])')].find(b => !b.classList.contains('ghostbtn'));
          if (advWheel.enabled && !advWheel.spinning) advWheel.spin(1); else if (b) b.click(); await wait(40); } } break;
      case 'pc': { window.__noCine = true; advStart(true, 'johto'); await wait(50);
        for (let i = 0; i < 14; i++) { const b = [...document.querySelectorAll('#advBtns button:not([disabled])')].find(b => !b.classList.contains('ghostbtn'));
          if (advWheel.enabled && !advWheel.spinning) advWheel.spin(1); else if (b) b.click(); await wait(40); }
        openPC(); } break;
      case 'hof': $('optHof').click(); await wait(9000); break;
      case 'lose': $('optLose').click(); await wait(7000); break;
    }
  }
  addEventListener('load', async () => {
    await wait(100);
    try {
      if (P.get('flow')) report.trace = await play(P.get('flow'), +(P.get('steps') || 200));
      else await scene(P.get('scene') || 'home');
    } catch (e) { __errors.push('test: ' + e.message + ' ' + (e.stack || '').split('\n')[1]); }
    await wait(300);
    report.errors = __errors;
    const pre = document.createElement('pre'); pre.id = '__report'; pre.hidden = true; pre.textContent = JSON.stringify(report); document.body.appendChild(pre);
  });
})();
