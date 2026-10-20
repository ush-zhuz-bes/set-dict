/* Жиындар мен сөздіктер — оқу сайты.
 * Тек навигация, тест жауаптарын ашу, нұсқа таңдау, көшіру, басып шығару және
 * ағымдағы нұсқаны localStorage-та сақтау. Python бұл жерде орындалмайды. */
(function () {
  'use strict';

  /* Осы жерді өзгертіп, топ, кабинет және уақытты түзетуге болады. */
  var CONFIG = {
    group: '',            // мысалы: 'ИС-31'
    room: '',             // мысалы: '214'
    practiceMinutes: 50,
    labMinutes: 50,
    submitPlace: 'оқытушы көрсеткен орынға'
  };

  var STORE_KEY = 'pysd-variant';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function storeGet(key) { try { return window.localStorage.getItem(key); } catch (err) { return null; } }
  function storeSet(key, val) { try { window.localStorage.setItem(key, val); } catch (err) { /* қолжетімсіз */ } }

  /* ---------- CONFIG мәндерін бетке қою ---------- */
  $$('[data-cfg]').forEach(function (el) {
    var v = CONFIG[el.getAttribute('data-cfg')];
    if (v !== undefined && v !== null && String(v).trim() !== '') { el.textContent = String(v); }
  });

  /* ---------- Негізгі қойындылар ---------- */
  var tabs = $$('.tabs [role="tab"]');
  var lastSection = { practice: 's1', lab: 's5' };

  function modeOfSection(id) {
    var el = document.getElementById(id);
    var panel = el && el.closest('.mode');
    return panel ? panel.id.replace('mode-', '') : null;
  }

  function showMode(mode, focusTab) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-mode') === mode;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on && focusTab) { t.focus(); }
    });
    $$('.mode').forEach(function (p) { p.hidden = (p.id !== 'mode-' + mode); });
    showSection(lastSection[mode], false);
  }

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { showMode(t.getAttribute('data-mode'), false); });
    t.addEventListener('keydown', function (ev) {
      var j = null;
      if (ev.key === 'ArrowRight') { j = (i + 1) % tabs.length; }
      if (ev.key === 'ArrowLeft') { j = (i - 1 + tabs.length) % tabs.length; }
      if (j !== null) { ev.preventDefault(); showMode(tabs[j].getAttribute('data-mode'), true); }
    });
  });

  /* ---------- Бөлімдер ---------- */
  function showSection(id, scroll) {
    var mode = modeOfSection(id);
    if (!mode) { return; }
    lastSection[mode] = id;
    var panel = document.getElementById('mode-' + mode);
    $$('.section', panel).forEach(function (s) { s.classList.toggle('is-hidden', s.id !== id); });
    $$('.navbtn', panel).forEach(function (b) {
      if (b.getAttribute('data-section') === id) { b.setAttribute('aria-current', 'true'); }
      else { b.removeAttribute('aria-current'); }
    });
    if (scroll) {
      var tabbar = $('.tabbar');
      var top = document.getElementById('content').getBoundingClientRect().top + window.pageYOffset - (tabbar ? tabbar.offsetHeight : 0) - 8;
      window.scrollTo(0, Math.max(0, top));
    }
  }

  $$('.navbtn').forEach(function (b) {
    b.addEventListener('click', function () { showSection(b.getAttribute('data-section'), true); });
  });
  $$('[data-goto]').forEach(function (b) {
    b.addEventListener('click', function () { showSection(b.getAttribute('data-goto'), true); });
  });
  $$('[data-mode-goto]').forEach(function (b) {
    b.addEventListener('click', function () {
      showMode(b.getAttribute('data-mode-goto'), false);
      window.scrollTo(0, 0);
    });
  });

  /* ---------- Тест (қайталау) ---------- */
  $$('.q').forEach(function (q) {
    var correct = q.getAttribute('data-correct');
    var result = $('.q-result', q);
    var status = $('.q-status', q);
    $('.check', q).addEventListener('click', function () {
      var chosen = $('input:checked', q);
      $$('.opt', q).forEach(function (o) { o.classList.remove('is-correct', 'is-wrong'); });
      result.hidden = false;
      if (!chosen) {
        status.className = 'q-status none';
        status.textContent = 'Алдымен жауап нұсқасын таңдаңыз.';
        $$('.q-result p', q).forEach(function (p, i) { p.hidden = i > 0; });
        return;
      }
      $$('.q-result p', q).forEach(function (p) { p.hidden = false; });
      var key = chosen.value;
      var label = chosen.closest('.opt');
      if (key === correct) {
        status.className = 'q-status ok';
        status.textContent = 'Дұрыс!';
        label.classList.add('is-correct');
      } else {
        status.className = 'q-status bad';
        status.textContent = 'Дұрыс емес.';
        label.classList.add('is-wrong');
        var right = $('.opt[data-key="' + correct + '"]', q);
        if (right) { right.classList.add('is-correct'); }
      }
    });
  });

  var quizReset = document.getElementById('quiz-reset');
  if (quizReset) {
    quizReset.addEventListener('click', function () {
      $$('.q').forEach(function (q) {
        $$('input', q).forEach(function (i) { i.checked = false; });
        $$('.opt', q).forEach(function (o) { o.classList.remove('is-correct', 'is-wrong'); });
        $('.q-result', q).hidden = true;
      });
    });
  }

  /* ---------- Кеңес / түсіндірме ашу-жабу ---------- */
  $$('[data-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var target = document.getElementById(b.getAttribute('data-toggle'));
      if (!target) { return; }
      var open = target.hidden;
      target.hidden = !open;
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      b.textContent = open ? b.getAttribute('data-close') : b.getAttribute('data-open');
    });
  });

  /* ---------- Көшіріп алу ---------- */
  function fallbackCopy(text, node) {
    var ok = false;
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    if (!ok && node) {
      /* Соңғы амал: мәтінді белгілеп қою, пайдаланушы Ctrl+C басады */
      var range = document.createRange();
      range.selectNodeContents(node);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    return ok;
  }

  function flash(btn, text, ok) {
    var old = btn.getAttribute('data-label') || btn.textContent;
    btn.setAttribute('data-label', old);
    btn.textContent = text;
    btn.classList.toggle('done', ok);
    window.setTimeout(function () { btn.textContent = old; btn.classList.remove('done'); }, 2200);
  }

  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var node = document.getElementById(btn.getAttribute('data-copy'));
      if (!node) { return; }
      var text = node.textContent.replace(/\s+$/, '') + '\n';
      function done(ok) {
        flash(btn, ok ? 'Көшірілді ✓' : 'Белгіленді: Ctrl+C басыңыз', ok);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text, node)); });
      } else {
        done(fallbackCopy(text, node));
      }
    });
  });

  /* ---------- Нұсқа таңдау ---------- */
  var radios = $$('input[name="variant"]');
  var noVariant = document.getElementById('no-variant');

  function setVariant(n, save) {
    var has = n >= 1 && n <= 8;
    $$('.variant').forEach(function (v) { v.hidden = !(has && v.getAttribute('data-variant') === String(n)); });
    if (noVariant) { noVariant.hidden = has; }
    radios.forEach(function (r) { r.checked = has && r.value === String(n); });
    $$('[data-variant-label]').forEach(function (el) { el.textContent = has ? ('№' + n + ' нұсқа') : 'таңдалмаған'; });
    $$('[data-fname]').forEach(function (el) { el.textContent = el.getAttribute('data-fname') + '_variant_' + (has ? n : 'N') + '.py'; });
    if (save && has) { storeSet(STORE_KEY, String(n)); }
  }

  radios.forEach(function (r) {
    r.addEventListener('change', function () { setVariant(parseInt(r.value, 10), true); });
  });

  /* ---------- Басып шығару ---------- */
  $$('[data-print]').forEach(function (b) {
    b.addEventListener('click', function () { window.print(); });
  });

  /* ---------- Бастапқы күй ---------- */
  var saved = parseInt(storeGet(STORE_KEY), 10);
  setVariant(isNaN(saved) ? 0 : saved, false);

  var hash = (window.location.hash || '').replace('#', '');
  if (hash && document.getElementById(hash) && $('.section#' + hash)) {
    var m = modeOfSection(hash);
    lastSection[m] = hash;
    showMode(m, false);
  } else {
    showMode('practice', false);
  }
})();
