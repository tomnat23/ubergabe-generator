// Testy wysyłki na Telegram (webhook n8n). Użycie: node tests/wysylka.test.js [index.html] [-v]
// Atrapa przeglądarki i fetch: nic nie jest nigdzie wysyłane, adresy webhooka są fikcyjne.
const fs = require('fs'), vm = require('vm'), path = require('path');
const args = process.argv.slice(2), verbose = args.includes('-v');
const html = fs.readFileSync(args.find(x => x !== '-v') || path.join(__dirname, '..', 'index.html'), 'utf8');
const js = html.match(/<script>([\s\S]*)<\/script>/)[1];
const URL1 = 'https://n8n.example.test/webhook/abc-123';
const Q = 'Raport zostanie wysłany przez n8n na grupę Telegram. Wysłać?';

function boot(store = {}, broken = false) {
  const els = {}; let cap = ''; const calls = []; const timers = [];
  function node(tag) {
    const n = { tag, className: '', children: [], _t: '', value: '', disabled: false, hidden: false, attrs: {}, ev: {}, selectedIndex: 0,
      appendChild(c) { this.children.push(c); c.parentNode = this; return c; }, addEventListener(e, f) { this.ev[e] = f; },
      setAttribute(k, v) { this.attrs[k] = v; }, focus() {}, select() {}, querySelector() { return null; } };
    Object.defineProperty(n, 'textContent', { get() { return this._t; }, set(v) { this._t = v; this.children = []; } });
    return n;
  }
  const all = n => [n, ...n.children.flatMap(all)];
  const guard = () => { if (broken) throw new Error('blocked'); };
  const ls = { getItem: k => { guard(); return k in store ? store[k] : null; }, setItem: (k, v) => { guard(); store[k] = String(v); }, removeItem: k => { guard(); delete store[k]; } };
  const get = id => els[id] || (els[id] = node('#' + id));
  get('shift').value = 'Frühschicht'; get('confirm').hidden = true;
  const fetch = (url, opt) => new Promise((resolve, reject) => {
    const c = { url, opt,
      reply(status, body) { resolve({ ok: status >= 200 && status < 300, status, text: () => Promise.resolve(body) }); },
      fail() { reject(new TypeError('Failed to fetch')); } };
    if (opt.signal) opt.signal.addEventListener('abort', () => reject(new Error('AbortError')));
    calls.push(c);
  });
  vm.runInNewContext(js, { document: { getElementById: get, createElement: node, body: node('body') }, localStorage: ls,
    navigator: { clipboard: { writeText: t => { cap = t; return { then: a => a() }; } } },
    fetch, AbortController,
    setTimeout: (f, ms) => { timers.push({ f, ms, off: false }); return timers.length; },
    clearTimeout: id => { if (timers[id - 1]) timers[id - 1].off = true; } });
  const fire = (n, e = 'click') => n.ev[e] && n.ev[e]();
  const a = { els, get, all, fire, calls, timers, store,
    click: id => fire(get(id)),
    copy() { fire(get('copy')); return cap; },
    type(n, v) { n.value = v; fire(n, 'input'); },
    btn: (root, label) => all(root).filter(x => x.tag === 'button' && x._t.startsWith(label)),
    inputs: f => all(get('report')).filter(x => x.attrs['data-field'] === f),
    report() { a.click('sample'); a.click('gen'); },
    setUrl(u = URL1) { a.type(get('webhook'), u); },
    send() { a.click('send'); a.click('confirmYes'); },
    state: () => get('sendState')._t, stateErr: () => get('sendState').className.includes('err') };
  return a;
}
const tick = () => new Promise(r => setImmediate(r));
let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; if (!c || verbose) console.log((c ? 'PASS ' : 'FAIL ') + m); };

async function run(name, f) { try { await f(); } catch (e) { fail++; console.log('FAIL ' + name + ' (wyjątek: ' + e.message + ')'); } }

(async () => {
  await run('HTML', () => {
    ok(/<details[^>]*id="settings"(?![^>]*\sopen)[^>]*>\s*<summary>Ustawienia<\/summary>/.test(html), 'zwijana sekcja Ustawienia, domyślnie zwinięta');
    ok(/Adres webhooka n8n[\s\S]{0,120}id="webhook"/.test(html), 'pole Adres webhooka n8n');
    ok(/<input[^>]*id="webhook"(?![^>]*\svalue=)[^>]*>/.test(html), 'pole bez wartości w kodzie');
    ok(/id="print"[^\n]*\n\s*<span class="send-box">\s*<button id="send" disabled[^>]*>Wyślij na Telegram<\/button>\s*<small id="sendHint"/.test(html), 'przycisk przy Kopiuj/Drukuj, startowo nieaktywny, podpowiedź pod nim');
    ok(html.includes('Dane zostają w tej przeglądarce, chyba że sam klikniesz „Wyślij na Telegram”.'), 'tekst pod tytułem');
    ok(!/\b(alert|confirm|prompt)\(/.test(js), 'bez alert/confirm/prompt');
  });

  await run('aktywność przycisku', () => {
    const a = boot();
    ok(a.get('send').disabled === true, 'start: nieaktywny');
    a.report();
    ok(a.get('send').disabled === true, 'raport bez adresu: nieaktywny');
    a.setUrl('   ');
    ok(a.get('send').disabled === true, 'same spacje: nieaktywny');
    for (const bad of ['abc', 'webhook/abc', 'https://', 'ftp://x/y', 'https://a b']) {
      a.setUrl(bad);
      ok(a.get('send').disabled === true, 'zły adres nieaktywny: ' + bad);
    }
    a.setUrl();
    ok(a.get('send').disabled === false, 'raport + adres: aktywny');
    a.setUrl('');
    ok(a.get('send').disabled === true, 'po skasowaniu adresu: nieaktywny');
    a.setUrl(); a.click('clear');
    ok(a.get('send').disabled === true, 'bez raportu: nieaktywny');
  });

  await run('zapis adresu', () => {
    const store = {}; const a = boot(store);
    a.setUrl('  ' + URL1 + '  '); a.report();
    ok(store['uebergabe.webhook.v1'] === JSON.stringify(URL1), 'adres zapisany w localStorage (przycięty)');
    const others = Object.keys(store).filter(k => k !== 'uebergabe.webhook.v1');
    ok(others.length >= 2 && others.every(k => !store[k].includes('n8n.example')), 'adresu nie ma w wersji roboczej ani historii');
    ok(!a.copy().includes('n8n.example'), 'adresu nie ma w tekście raportu');
    const b = boot(store);
    ok(b.get('webhook').value === URL1 && b.get('send').disabled === false, 'po odświeżeniu adres wraca, przycisk aktywny');
    b.setUrl('');
    ok(!('uebergabe.webhook.v1' in store), 'puste pole usuwa wpis');
  });

  const KEY = 'uebergabe.webhook.v1', saved = st => st[KEY] === JSON.stringify(URL1);

  await run('zapis od razu: input i change', () => {
    for (const ev of ['input', 'change']) {
      const st = {}; const a = boot(st);
      a.get('webhook').value = URL1; a.fire(a.get('webhook'), ev);
      ok(saved(st), 'samo zdarzenie ' + ev + ' zapisuje adres');
      const b = boot(st);
      ok(b.get('webhook').value === URL1, ev + ': po F5 adres w polu (bez raportu)');
      ok(b.get('send').disabled === true, ev + ': bez raportu przycisk nieaktywny');
      b.report();
      ok(b.get('send').disabled === false, ev + ': adres + raport = aktywny');
    }
  });

  await run('adres w polu bez zdarzenia', () => {
    const st = {}; const a = boot(st);
    a.get('webhook').value = URL1; a.report();
    ok(a.get('send').disabled === false && saved(st), 'aktywny przycisk oznacza zapisany adres (po Generuj)');
    const st2 = {}; const b = boot(st2); b.report(); b.setUrl('https://stary.example.test/x');
    b.get('webhook').value = URL1; b.send();
    ok(b.calls[0].url === URL1 && saved(st2), 'zapisuje się adres, na który idzie wysyłka');
  });

  await run('klucz usunięty w innej karcie', () => {
    const st = {}; const a = boot(st); a.report(); a.setUrl();
    delete st[KEY];
    a.send();
    ok(saved(st), 'po wysyłce adres znowu zapisany');
    ok(boot(st).get('webhook').value === URL1, 'po F5 adres w polu');
  });

  await run('Wyczyść dane zostawia adres', () => {
    const st = {}; const a = boot(st); a.report(); a.setUrl(); a.type(a.get('who'), 'Anna Test');
    a.click('wipe');
    ok(a.get('confirmText')._t.includes('Adres webhooka n8n zostanie'), 'pytanie mówi, że adres zostaje');
    a.click('confirmYes');
    ok(Object.keys(st).join() === KEY && saved(st), 'zostaje tylko adres -> ' + Object.keys(st).join());
    ok(a.get('webhook').value === URL1, 'pole nie jest czyszczone');
    ok(a.get('who').value === '' && a.get('orders').value === '', 'reszta wyczyszczona');
    ok(a.get('send').disabled === true && a.get('sendHint')._t === 'Najpierw wygeneruj raport', 'po wyczyszczeniu brakuje tylko raportu');
    const b = boot(st);
    ok(b.get('webhook').value === URL1, 'po F5 adres nadal jest');
    b.setUrl('');
    ok(!(KEY in st), 'adres usuwa się przez wyczyszczenie pola');
  });

  await run('podpowiedź pod przyciskiem', async () => {
    const a = boot(); const hint = () => a.get('sendHint')._t;
    ok(hint() === 'Ustaw adres webhooka', 'start bez adresu i raportu');
    a.report();
    ok(hint() === 'Ustaw adres webhooka', 'raport bez adresu');
    a.setUrl('abc');
    ok(hint() === 'Ustaw adres webhooka', 'niepełny adres');
    a.setUrl();
    ok(hint() === '' && a.get('send').disabled === false, 'aktywny: bez podpowiedzi');
    a.click('clear');
    ok(hint() === 'Najpierw wygeneruj raport', 'adres bez raportu');
    a.report(); a.send();
    ok(hint() === '', 'w trakcie wysyłki bez podpowiedzi');
    a.calls[0].reply(200, '{"ok":true}'); await tick();
    ok(hint() === '' && a.state() === 'Wysłano ✓', 'po wysyłce bez podpowiedzi');
    ok(boot({ [KEY]: JSON.stringify(URL1) }).get('sendHint')._t === 'Najpierw wygeneruj raport', 'po F5 z adresem, bez raportu');
  });

  await run('potwierdzenie', () => {
    const a = boot(); a.report(); a.setUrl();
    a.click('send');
    ok(a.get('confirm').hidden === false && a.get('confirmText')._t === Q, 'pytanie na stronie, dokładny tekst');
    ok(a.calls.length === 0, 'przed potwierdzeniem nic nie wychodzi');
    a.click('confirmNo');
    ok(a.calls.length === 0 && a.get('confirm').hidden === true, 'Anuluj: brak wysyłki');
    a.click('send'); a.click('clear'); a.click('confirmYes');
    ok(a.calls.length === 0, 'po Wyczyść pola stare potwierdzenie nie wysyła');
  });

  await run('żądanie i sukces', async () => {
    const a = boot(); a.report(); a.setUrl();
    a.type(a.inputs('person')[0], 'EditPerson');
    a.fire(a.btn(a.get('report'), 'usuń')[11]);
    a.fire(a.btn(a.get('report'), 'Dodaj punkt')[0]);
    a.type(a.inputs('sache').slice(-1)[0], 'Dodany punkt XYZ');
    const copied = a.copy();
    a.send();
    const c = a.calls[0];
    ok(a.calls.length === 1 && c.url === URL1, 'jedno żądanie na ustawiony adres');
    ok(c.opt.method === 'POST', 'POST');
    ok(c.opt.headers['Content-Type'] === 'application/json', 'Content-Type application/json');
    const body = JSON.parse(c.opt.body);
    ok(Object.keys(body).join() === 'text', 'body ma tylko pole text');
    ok(body.text === copied, 'text identyczny jak przy Kopiuj');
    ok(body.text.includes('EditPerson') && body.text.includes('Dodany punkt XYZ'), 'text ma ręczne zmiany');
    ok(a.get('send').disabled === true, 'w trakcie: przycisk zablokowany');
    ok(a.state() === 'Wysyłanie…', 'w trakcie: status');
    a.send(); a.click('confirmYes');
    ok(a.calls.length === 1, 'drugie kliknięcie w trakcie nie wysyła');
    a.click('gen'); a.setUrl(URL1 + 'x');
    ok(a.get('send').disabled === true, 'Generuj i zmiana adresu nie odblokowują w trakcie');
    c.reply(200, '{"ok":true}'); await tick();
    ok(a.state() === 'Wysłano ✓' && !a.stateErr(), 'Wysłano ✓');
    ok(a.get('send').disabled === false, 'po wysyłce odblokowany');
    ok(a.timers.length === 1 && a.timers[0].off, 'limit czasu wyłączony po odpowiedzi');
    a.type(a.inputs('person')[0], 'Inna');
    ok(a.state() === '', 'po zmianie raportu stary status znika');
  });

  await run('podwójne Tak', async () => {
    const a = boot(); a.report(); a.setUrl();
    a.click('send'); a.click('confirmYes'); a.click('confirmYes');
    ok(a.calls.length === 1, 'dwa razy Tak = jedna wysyłka');
  });

  async function outcome(status, body) {
    const a = boot(); a.report(); a.setUrl(); a.send();
    if (status === null) a.calls[0].fail(); else a.calls[0].reply(status, body);
    await tick();
    return a;
  }
  await run('błędy', async () => {
    const cases = [
      [200, '{"ok":false,"error":"chat not found"}', 'chat not found'],
      [400, '{"ok":false,"description":"Bad Request: message is too long"}', 'message is too long'],
      [404, '{"code":404,"message":"The requested webhook is not registered."}', 'The requested webhook is not registered.'],
      [500, '{"error":{"message":"boom w workflow"}}', 'boom w workflow'],
      [502, 'Bad Gateway', 'Bad Gateway'],
      [200, '{"message":"Workflow was started"}', 'Workflow was started'],
      [200, '{"ok":"true"}', '{"ok":"true"}'],
      [200, '', 'pusta odpowiedź'],
      [500, '{"ok":true}', 'HTTP 500']
    ];
    for (const [status, body, expected] of cases) {
      const a = await outcome(status, body);
      ok(a.state().includes(expected) && a.state().startsWith('Błąd n8n (HTTP ' + status + ')') && a.stateErr() && a.get('send').disabled === false,
        'błąd ' + status + ' ' + body + ' -> ' + a.state());
    }
    const long = await outcome(500, 'x'.repeat(5000));
    ok(long.state().length < 360, 'długa treść błędu przycięta');
    const net = await outcome(null);
    ok(net.state() === 'Brak połączenia z n8n' && net.stateErr() && net.get('send').disabled === false, 'brak sieci -> Brak połączenia z n8n');
    net.send();
    ok(net.calls.length === 2, 'po błędzie można wysłać ponownie');
  });

  await run('limit czasu', async () => {
    const a = boot(); a.report(); a.setUrl(); a.send();
    ok(a.timers.length === 1 && a.timers[0].ms === 20000, 'limit 20 s');
    a.timers[0].f(); await tick();
    ok(a.state().startsWith('Brak odpowiedzi z n8n') && a.state().includes('Sprawdź grupę') && a.get('send').disabled === false,
      'po limicie: komunikat z ostrzeżeniem, przycisk odblokowany -> ' + a.state());
  });

  await run('zablokowany localStorage', async () => {
    const a = boot({}, true); a.report(); a.setUrl();
    ok(a.get('send').disabled === false, 'bez localStorage adres działa do odświeżenia');
    a.send(); a.calls[0].reply(200, '{"ok":true}'); await tick();
    ok(a.state() === 'Wysłano ✓', 'bez localStorage wysyłka działa');
  });

  console.log('Wynik: ' + pass + ' PASS, ' + fail + ' FAIL');
  process.exitCode = fail ? 1 : 0;
})();
