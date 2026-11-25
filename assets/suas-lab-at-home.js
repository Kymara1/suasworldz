(function () {
  'use strict';

  var root = document.querySelector('[data-suas-lah]');
  if (!root) return;

  var NOTES = window.SUAS_LAB_HOME_NOTES || [];
  var KITS = {
    perfume: {
      key: 'perfume',
      label: '30 mL Custom Perfume',
      shape: 'perfume',
      slots: [
        { role: 'base', amountMl: 15, label: '15 mL base' },
        { role: 'support', amountMl: 5, label: '5 mL support' },
        { role: 'support', amountMl: 5, label: '5 mL support' },
        { role: 'support', amountMl: 5, label: '5 mL support' }
      ]
    },
    oil: {
      key: 'oil',
      label: '30 mL Custom Body Oil',
      shape: 'oil',
      slots: [
        { role: 'base', amountMl: 15, label: '15 mL base' },
        { role: 'support', amountMl: 5, label: '5 mL support' },
        { role: 'support', amountMl: 5, label: '5 mL support' },
        { role: 'support', amountMl: 5, label: '5 mL support' }
      ]
    },
    rollon: {
      key: 'rollon',
      label: '10 mL Custom Roll-On',
      shape: 'rollon',
      slots: [
        { role: 'base', amountMl: 4, label: '4 mL base' },
        { role: 'support', amountMl: 4, label: '4 mL support' },
        { role: 'support', amountMl: 2, label: '2 mL support' }
      ]
    }
  };

  var BOTTLES = {
    cylinder: {
      id: 'cylinder',
      label: 'cylinder',
      src: root.getAttribute('data-bottle-cylinder') || '',
      // top / right / bottom / left - cavity inside clear glass body
      // top / right / bottom / left - glass cavity only (under the blend layer)
      fillInset: '27% 36% 11% 36%',
      finish: 'silver sprayer'
    },
    round: {
      id: 'round',
      label: 'round',
      src: root.getAttribute('data-bottle-round') || '',
      fillInset: '29% 24% 13% 24%',
      finish: 'silver sprayer'
    }
  };

  var FIXED_PACKS = {
    oil: {
      id: 'oil',
      label: 'airless pump',
      src: root.getAttribute('data-bottle-oil') || '',
      fillInset: '29% 30% 13% 30%',
      finish: 'white pump � clear cap'
    },
    rollon: {
      id: 'rollon',
      label: 'roll-on',
      src: root.getAttribute('data-bottle-rollon') || '',
      fillInset: '29% 34% 13% 34%',
      finish: 'white cap � rollerball'
    }
  };

  var variants = {
    perfume: Number(root.getAttribute('data-variant-perfume') || 0),
    oil: Number(root.getAttribute('data-variant-oil') || 0),
    rollon: Number(root.getAttribute('data-variant-rollon') || 0),
    trio: Number(root.getAttribute('data-variant-trio') || 0)
  };
  var money = {
    perfume: root.getAttribute('data-money-perfume') || '$49.00',
    oil: root.getAttribute('data-money-oil') || '$35.00',
      rollon: root.getAttribute('data-money-rollon') || '$28.00',
    trio: root.getAttribute('data-money-trio') || '$99.00'
  };
  var titles = {
    perfume: root.getAttribute('data-title-perfume') || 'The Lab @ Home - 30 mL Custom Perfume',
    oil: root.getAttribute('data-title-oil') || 'The Lab @ Home - 30 mL Custom Body Oil',
    rollon: root.getAttribute('data-title-rollon') || 'The Lab @ Home - 10 mL Custom Roll-On',
    trio: root.getAttribute('data-title-trio') || 'The Lab @ Home Trio'
  };
  var state = {
    screen: 'setup',
    mode: 'perfume',
    trioStep: 'perfume',
    filter: 'all',
    query: '',
    picks: [],
    activeSlot: 0,
    bottle: 'cylinder',
    trioFormulas: { perfume: null, oil: null, rollon: null }
  };

  var SCREEN_TITLES = {
    setup: 'LAB.HOME.EXE - Setup Wizard',
    welcome: 'LAB.HOME.EXE - Welcome',
    build: 'LAB.HOME.EXE - Customize'
  };

  var TRIO_ORDER = ['perfume', 'oil', 'rollon'];
  var TRIO_LABELS = { perfume: 'perfume', oil: 'body oil', rollon: 'roll-on' };

  var els = {
    kits: root.querySelector('[data-lah-kits]'),
    selected: root.querySelector('[data-lah-selected]'),
    trioTrack: root.querySelector('[data-lah-trio-track]'),
    trioSteps: root.querySelector('[data-lah-trio-steps]'),
    recipe: root.querySelector('[data-lah-recipe]'),
    slotHint: root.querySelector('[data-lah-slot-hint]'),
    bottlePick: root.querySelector('[data-lah-bottle-pick]'),
    bottleOptions: root.querySelector('[data-lah-bottle-options]'),
    slots: root.querySelector('[data-lah-slots]'),
    search: root.querySelector('[data-lah-search]'),
    filters: root.querySelector('[data-lah-filters]'),
    notes: root.querySelector('[data-lah-notes]'),
    vials: root.querySelector('[data-lah-vials]'),
    shipsPick: root.querySelector('[data-lah-ships-pick]'),
    statusbar: root.querySelector('[data-lah-statusbar]'),
    appTitle: root.querySelector('[data-lah-app-title]'),
    pourToast: root.querySelector('[data-lah-pour-toast]'),
    sparkles: root.querySelector('[data-lah-sparkles]'),
    vialsWrap: root.querySelector('[data-lah-vials-wrap]'),
    noteCount: root.querySelector('[data-lah-note-count]'),
    bottle: root.querySelector('[data-lah-bottle]'),
    bottleCard: root.querySelector('.suas-lah-bottle-card'),
    photoBottle: root.querySelector('[data-lah-photo-bottle]'),
    photoFill: root.querySelector('[data-lah-photo-fill]'),
    liquid: root.querySelector('[data-lah-liquid]'),
    fillStatus: root.querySelector('[data-lah-fill-status]'),
    name: root.querySelector('[data-lah-name]'),
    atc: root.querySelector('[data-lah-atc]'),
    sticky: document.querySelector('[data-lah-sticky]'),
    stickyBottle: document.querySelector('[data-lah-sticky-bottle]'),
    stickyLiquid: document.querySelector('[data-lah-sticky-liquid]'),
    stickyStatus: document.querySelector('[data-lah-sticky-status]'),
    stickyCoach: document.querySelector('[data-lah-sticky-coach]'),
    stickyAtc: document.querySelector('[data-lah-sticky-atc]'),
    error: root.querySelector('[data-lah-error]'),
    live: root.querySelector('[data-lah-live]')
  };

  var trioPackSrc = root.getAttribute('data-bottle-trio') || '';

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function activeKitKey() {
    return state.mode === 'trio' ? state.trioStep : state.mode;
  }

  function activeKit() {
    return KITS[activeKitKey()];
  }

  function needsPerfumeBottle() {
    return activeKitKey() === 'perfume';
  }

  function activeBottle() {
    var key = activeKitKey();
    if (key === 'oil') return FIXED_PACKS.oil;
    if (key === 'rollon') return FIXED_PACKS.rollon;
    return BOTTLES[state.bottle] || BOTTLES.cylinder;
  }

  function trioStepIndex() {
    return TRIO_ORDER.indexOf(state.trioStep);
  }

  function trioStepUnlocked(key) {
    var idx = TRIO_ORDER.indexOf(key);
    if (idx <= 0) return true;
    // unlock if previous saved, or this/after is current
    for (var i = 0; i < idx; i++) {
      if (!state.trioFormulas[TRIO_ORDER[i]]) return key === state.trioStep;
    }
    return true;
  }

  function loadTrioStep(key) {
    if (!trioStepUnlocked(key)) return;
    // stash current work if partially filled
    if (state.trioStep !== key) {
      var currentComplete = activeKit().slots.every(function (_s, i) { return !!state.picks[i]; });
      if (currentComplete) {
        state.trioFormulas[state.trioStep] = snapshotFormula();
      }
    }
    state.trioStep = key;
    var saved = state.trioFormulas[key];
    var kit = KITS[key];
    if (saved) {
      state.picks = saved.picks.slice();
      state.picks.length = kit.slots.length;
      if (els.name) els.name.value = saved.name || '';
      if (saved.bottle === 'round') state.bottle = 'round';
      if (saved.bottle === 'cylinder') state.bottle = 'cylinder';
    } else {
      state.picks = new Array(kit.slots.length);
      state.activeSlot = 0;
      if (els.name) els.name.value = '';
    }
    state.activeSlot = 0;
    setError('');
    paint();
    announce('Trio step: ' + (TRIO_LABELS[key] || key));
  }

  function totalMl(kit) {
    return kit.slots.reduce(function (sum, slot) { return sum + slot.amountMl; }, 0);
  }

  function filledMl() {
    var kit = activeKit();
    var sum = 0;
    for (var i = 0; i < kit.slots.length; i++) {
      if (state.picks[i]) sum += kit.slots[i].amountMl;
    }
    return sum;
  }

  function firstEmptySlot() {
    var kit = activeKit();
    for (var i = 0; i < kit.slots.length; i++) {
      if (!state.picks[i]) return i;
    }
    return Math.max(0, kit.slots.length - 1);
  }

  function tubesLeft() {
    var kit = activeKit();
    var left = 0;
    for (var i = 0; i < kit.slots.length; i++) {
      if (!state.picks[i]) left += 1;
    }
    return left;
  }

  function kitComplete() {
    var kit = activeKit();
    return kit.slots.every(function (_slot, index) { return !!state.picks[index]; });
  }

  function supportSlots() {
    return activeKit().slots.filter(function (s) { return s.role !== 'base'; });
  }

  function supportFilledCount() {
    var kit = activeKit();
    var n = 0;
    for (var i = 0; i < kit.slots.length; i++) {
      if (kit.slots[i].role !== 'base' && state.picks[i]) n += 1;
    }
    return n;
  }

  function baseLocked() {
    return !!state.picks[0];
  }

  function coachLine() {
    var kit = activeKit();
    var total = kit.slots.length;
    var left = tubesLeft();
    var trioPrefix = state.mode === 'trio'
      ? ((TRIO_LABELS[state.trioStep] || 'bottle') + ' ' + (trioStepIndex() + 1) + '/3 � ')
      : '';

    if (left === 0) {
      if (state.mode === 'trio' && state.trioStep !== 'rollon') {
        return trioPrefix + 'kit locked � save & continue';
      }
      return trioPrefix + 'kit locked � name it';
    }

    var idx = state.activeSlot;
    if (idx < 0 || idx >= total || state.picks[idx]) idx = firstEmptySlot();
    var slot = kit.slots[idx];
    if (slot.role === 'base') {
      return trioPrefix + 'tap a note to fill tube 1 � ' + slot.amountMl + ' mL base';
    }
    return trioPrefix + 'tap a note to fill tube ' + (idx + 1) + ' � ' + slot.amountMl + ' mL';
  }

  function statusBarText() {
    var kit = activeKit();
    var supports = supportSlots().length;
    var filledSupports = supportFilledCount();
    if (!baseLocked()) return 'Select your ' + kit.slots[0].amountMl + ' mL base (favorite)';
    if (kitComplete()) {
      if (state.mode === 'trio' && state.trioStep !== 'rollon') {
        return 'Base locked � notes complete - save & continue';
      }
      return 'Base locked � ' + filledSupports + '/' + supports + ' scent notes - ready';
    }
    return 'Base locked � ' + filledSupports + '/' + supports + ' scent notes';
  }

  function celebratePour(note, slotIndex) {
    var kit = activeKit();
    var slot = kit.slots[slotIndex];
    var label = (note && note.label) || 'note';
    var amount = slot ? slot.amountMl : '';
    var isBase = slot && slot.role === 'base';
    var msg = isBase
      ? ('? ' + label + ' ' + amount + ' mL BASE')
      : ('? ' + label + ' � ' + amount + ' mL');

    if (els.pourToast) {
      els.pourToast.hidden = false;
      els.pourToast.textContent = msg;
      els.pourToast.classList.remove('is-show');
      void els.pourToast.offsetWidth;
      els.pourToast.classList.add('is-show');
      clearTimeout(celebratePour._t);
      celebratePour._t = setTimeout(function () {
        if (els.pourToast) {
          els.pourToast.classList.remove('is-show');
          els.pourToast.hidden = true;
        }
      }, 1200);
    }

    var vialEl = els.vials && els.vials.querySelector('[data-vial-slot="' + slotIndex + '"]');
    if (vialEl) {
      vialEl.classList.remove('is-pop');
      void vialEl.offsetWidth;
      vialEl.classList.add('is-pop');
      clearTimeout(celebratePour._pop);
      celebratePour._pop = setTimeout(function () {
        if (vialEl) vialEl.classList.remove('is-pop');
      }, 400);
    }

    if (kitComplete() && els.sparkles) {
      els.sparkles.innerHTML = '';
      for (var i = 0; i < 8; i++) {
        var s = document.createElement('i');
        s.style.setProperty('--x', (12 + Math.random() * 76) + '%');
        s.style.setProperty('--d', (0.1 + Math.random() * 0.45) + 's');
        els.sparkles.appendChild(s);
      }
      els.sparkles.classList.add('is-pop');
      clearTimeout(celebratePour._spark);
      celebratePour._spark = setTimeout(function () {
        if (els.sparkles) {
          els.sparkles.classList.remove('is-pop');
          els.sparkles.innerHTML = '';
        }
      }, 1000);
    }
  }

  function fillStatusText() {
    var kit = activeKit();
    var vol = totalMl(kit);
    var filled = filledMl();
    if (kitComplete()) return filled + ' / ' + vol + ' mL - ready';
    return filled + ' / ' + vol + ' mL';
  }

  function recipeLine() {
    var kit = activeKit();
    var base = kit.slots[0];
    var supports = supportSlots();
    if (!supports.length) return '1) pick your notes';
    if (supports.length === 1) {
      return '1) ' + base.amountMl + ' mL base (your favorite) ? 2) ' + supports[0].amountMl + ' mL note';
    }
    var same = supports.every(function (s) { return s.amountMl === supports[0].amountMl; });
    if (same) {
      return '1) ' + base.amountMl + ' mL base (your favorite) ? 2) ' + supports.length + ' � ' + supports[0].amountMl + ' mL notes';
    }
    return '1) ' + base.amountMl + ' mL base ? 2) ' + supports.map(function (s) { return s.amountMl + ' mL'; }).join(' + ') + ' notes';
  }

  function atcLabel(ready) {
    var kit = activeKit();
    if (!baseLocked()) {
      return 'Select your ' + kit.slots[0].amountMl + ' mL base (favorite)';
    }
    if (!ready) {
      var left = tubesLeft();
      return 'pick ' + left + ' more note' + (left === 1 ? '' : 's');
    }
    if (state.mode === 'trio' && state.trioStep !== 'rollon') {
      var nextKey = TRIO_ORDER[trioStepIndex() + 1];
      return 'save ' + (TRIO_LABELS[state.trioStep] || '') + ' ? ' + (TRIO_LABELS[nextKey] || 'next');
    }
    if (state.mode === 'trio') return 'add trio - ' + money.trio;
    return 'add to cart - ' + money[state.mode];
  }

  function showScreen(name) {
    if (!SCREEN_TITLES[name]) return;
    state.screen = name;
    var screens = root.querySelectorAll('[data-lah-screen]');
    for (var i = 0; i < screens.length; i++) {
      var on = screens[i].getAttribute('data-lah-screen') === name;
      screens[i].classList.toggle('is-on', on);
      screens[i].hidden = !on;
    }
    if (els.appTitle) els.appTitle.textContent = SCREEN_TITLES[name];
    if (name === 'build') {
      paint();
      try { root.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (_e) {}
    }
    announce(SCREEN_TITLES[name]);
  }

  function announce(msg) {
    if (els.live) els.live.textContent = msg;
  }

  function setError(msg) {
    if (els.error) els.error.textContent = msg || '';
  }

  function noteById(id) {
    for (var i = 0; i < NOTES.length; i++) {
      if (NOTES[i].id === id) return NOTES[i];
    }
    return null;
  }

  function blendHex(a, b, t) {
    function parse(h) {
      h = String(h || '#888888').replace('#', '');
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    var A = parse(a);
    var B = parse(b);
    return 'rgb(' +
      Math.round(A[0] + (B[0] - A[0]) * t) + ',' +
      Math.round(A[1] + (B[1] - A[1]) * t) + ',' +
      Math.round(A[2] + (B[2] - A[2]) * t) + ')';
  }

  function renderKits() {
    if (!els.kits) return;
    var options = [
      { id: 'perfume', label: 'perfume', meta: '30 mL', price: money.perfume, bg: '#ffe8ef' },
      { id: 'oil', label: 'body oil', meta: '30 mL', price: money.oil, bg: '#c9e7ff' },
      { id: 'rollon', label: 'roll-on', meta: '10 mL', price: money.rollon, bg: '#fff1a8' },
      { id: 'trio', label: 'the trio', meta: 'all 3', price: money.trio, bg: '#d9ff78' }
    ];
    els.kits.innerHTML = options.map(function (opt) {
      var pressed = state.mode === opt.id;
      var thumb = opt.id === 'trio' && trioPackSrc
        ? '<img class="suas-lah-kit-thumb" src="' + escapeHtml(trioPackSrc) + '" alt="" width="54" height="36">'
        : '';
      return (
        '<button type="button" class="suas-lah-kit' + (pressed ? ' is-selected' : '') + (opt.id === 'trio' ? ' is-trio' : '') + '" style="--kit-bg:' + opt.bg + '" data-kit="' + opt.id + '" aria-pressed="' + pressed + '">' +
          thumb +
          '<strong>' + escapeHtml(opt.label) + '</strong>' +
          '<span>' + escapeHtml(opt.meta) + ' � ' + escapeHtml(opt.price) + '</span>' +
        '</button>'
      );
    }).join('');

    if (els.selected) {
      var kit = activeKit();
      var priceKey = state.mode === 'trio' ? 'trio' : state.mode;
      els.selected.textContent = state.mode === 'trio'
        ? ('Trio ' + money.trio + ' � ' + (TRIO_LABELS[state.trioStep] || '') + ' ' + (trioStepIndex() + 1) + '/3')
        : ('Building ' + kit.label + ' � ' + money[priceKey]);
    }
  }

  function renderTrioTrack() {
    var show = state.mode === 'trio';
    if (els.trioTrack) els.trioTrack.hidden = !show;
    if (els.bottle) els.bottle.hidden = false;
    if (els.recipe) els.recipe.textContent = recipeLine();

    var nameLabel = root.querySelector('label[for="LahFormulaName"]');
    if (nameLabel) {
      var labelCore = show
        ? ('3) name this ' + (TRIO_LABELS[state.trioStep] || 'formula'))
        : '3) name your formula';
      nameLabel.innerHTML = escapeHtml(labelCore) +
        ' <span class="suas-lah-optional">(optional)</span>';
    }

    if (!show || !els.trioSteps) return;

    els.trioSteps.innerHTML = TRIO_ORDER.map(function (key, index) {
      var saved = !!state.trioFormulas[key];
      var current = state.trioStep === key;
      var unlocked = trioStepUnlocked(key);
      var classes = 'suas-lah-trio-step';
      if (current) classes += ' is-current';
      if (saved) classes += ' is-saved';
      if (!unlocked) classes += ' is-locked';
      return (
        '<button type="button" class="' + classes + '" data-trio-step="' + key + '" role="tab" aria-selected="' + current + '" ' +
          (unlocked ? '' : 'disabled ') + '>' +
          '<em>' + (index + 1) + '</em>' +
          '<strong>' + escapeHtml(TRIO_LABELS[key]) + '</strong>' +
        '</button>'
      );
    }).join('');
  }

  function renderBottlePick() {
    if (!els.bottlePick || !els.bottleOptions) return;
    var show = needsPerfumeBottle();
    els.bottlePick.hidden = !show;
    if (!show) return;
    els.bottleOptions.innerHTML = Object.keys(BOTTLES).map(function (key) {
      var bottle = BOTTLES[key];
      var on = state.bottle === key;
      return (
        '<button type="button" class="suas-lah-bottle-opt' + (on ? ' is-selected' : '') + '" data-bottle="' + key + '" aria-pressed="' + on + '">' +
          escapeHtml(bottle.label) +
        '</button>'
      );
    }).join('');
  }

  function renderSlots() {
    if (!els.slots) return;
    var kit = activeKit();
    var coach = coachLine();
    if (els.slotHint) els.slotHint.textContent = coach;
    if (els.stickyCoach) els.stickyCoach.textContent = coach;

    els.slots.innerHTML = kit.slots.map(function (slot, index) {
      var pick = state.picks[index];
      var note = pick ? noteById(pick) : null;
      var active = index === state.activeSlot;
      var classes = 'suas-lah-slot';
      if (active) classes += ' is-active';
      if (note) classes += ' is-filled';
      if (active && !note) classes += ' is-next';
      var color = note ? note.hex : '#ddd';
      var role = slot.role === 'base' ? 'base' : 'support';
      var text = note
        ? (slot.amountMl + ' mL - ' + note.label)
        : ((active ? 'tap here - ' : '') + slot.amountMl + ' mL ' + role);
      return (
        '<button type="button" class="' + classes + '" style="--slot-color:' + color + '" data-slot="' + index + '" aria-pressed="' + active + '">' +
          '<em aria-hidden="true">' + (index + 1) + '</em>' +
          '<i aria-hidden="true"></i><span>' + escapeHtml(text) + '</span>' +
        '</button>'
      );
    }).join('');
  }

  function renderFilters() {
    if (!els.filters) return;
    var families = ['all', 'fruit', 'gourmand', 'green', 'sparkle'];
    els.filters.innerHTML = families.map(function (fam) {
      return (
        '<button type="button" class="suas-lah-filter" data-filter="' + fam + '" aria-pressed="' + (state.filter === fam) + '">' +
          escapeHtml(fam) +
        '</button>'
      );
    }).join('');
  }

  function renderNotes() {
    if (!els.notes) return;
    var q = String(state.query || '').trim().toLowerCase();
    var list = NOTES.filter(function (note) {
      if (state.filter !== 'all' && note.family !== state.filter) return false;
      if (!q) return true;
      return note.label.toLowerCase().indexOf(q) !== -1 || note.family.toLowerCase().indexOf(q) !== -1;
    });
    if (!list.length) {
      els.notes.innerHTML = '<p class="suas-lah-notes-empty">No notes match that filter.</p>';
      return;
    }
    if (els.noteCount) els.noteCount.textContent = list.length + ' notes';

    els.notes.innerHTML = list.map(function (note) {
      var usedCount = state.picks.filter(function (id) { return id === note.id; }).length;
      var isCurrent = state.picks[state.activeSlot] === note.id;
      var isBase = state.picks[0] === note.id;
      var supportIdx = -1;
      for (var i = 1; i < state.picks.length; i++) {
        if (state.picks[i] === note.id) { supportIdx = i; break; }
      }
      var classes = 'suas-lah-note';
      if (isCurrent) classes += ' is-current';
      else if (usedCount) classes += ' is-used';
      var meta = note.family;
      if (isBase) meta += ' � BASE';
      else if (supportIdx >= 0) meta += ' � NOTE ' + supportIdx;
      return (
        '<button type="button" class="' + classes + '" data-note="' + escapeHtml(note.id) + '" data-family="' + escapeHtml(note.family) + '" aria-pressed="' + (usedCount > 0) + '" aria-label="' + escapeHtml(note.label + ' � ' + meta) + '" style="--n1:' + note.hex + ';--n2:' + (note.hex2 || note.hex) + '">' +
          '<span class="suas-lah-note-blob" aria-hidden="true"></span>' +
          '<b>' + escapeHtml(note.label) + '</b>' +
          '<small>' + escapeHtml(meta) + '</small>' +
          (usedCount ? '<span class="suas-lah-note-check" aria-hidden="true">?</span>' : '') +
        '</button>'
      );
    }).join('');
  }

  function renderVials() {
    if (!els.vials) return;
    var kit = activeKit();
    var nextEmpty = firstEmptySlot();
    els.vials.style.gridTemplateColumns = 'repeat(' + kit.slots.length + ', minmax(0, 1fr))';
    els.vials.innerHTML = kit.slots.map(function (slot, index) {
      var note = state.picks[index] ? noteById(state.picks[index]) : null;
      var isBase = slot.role === 'base';
      var active = index === state.activeSlot;
      var classes = 'suas-lah-vial';
      if (isBase) classes += ' is-base';
      if (note) classes += ' is-filled';
      if (active) classes += ' is-active';
      if (!note && index === nextEmpty) classes += ' is-waiting';
      var color = note ? (note.hex2 || note.hex) : '#dddddd';
      var tag = note
        ? (note.label + ' � ' + slot.amountMl + 'mL')
        : (isBase ? ('base ' + slot.amountMl + 'mL') : ('tube ' + (index + 1)));
      return (
        '<button type="button" class="' + classes + '" style="--vial:' + color + '" data-vial-slot="' + index + '" aria-pressed="' + active + '" aria-label="' + escapeHtml(tag) + '">' +
          '<span class="suas-lah-vial-glass" aria-hidden="true"><span class="suas-lah-vial-fill"></span></span>' +
          '<span class="suas-lah-vial-tag">' + escapeHtml(tag) + '</span>' +
        '</button>'
      );
    }).join('');
  }

  function renderShipsPick() {
    if (!els.shipsPick) return;
    var base = state.picks[0] ? noteById(state.picks[0]) : null;
    if (!base) {
      els.shipsPick.hidden = true;
      els.shipsPick.textContent = '';
      return;
    }
    var amount = activeKit().slots[0] ? activeKit().slots[0].amountMl : 15;
    els.shipsPick.hidden = false;
    els.shipsPick.textContent = '? ' + base.label + ' ' + amount + ' mL BASE';
  }

  function renderBottle() {
    var kit = activeKit();
    var bottle = activeBottle();
    var vol = totalMl(kit);
    var filled = filledMl();
    // Keep a tiny empty headspace so full never looks clipped into the neck.
    var pct = filled <= 0 ? 0 : Math.min(96, Math.max(8, (filled / vol) * 96));

    var mixed = '#f4c4d8';
    if (state.picks.length) {
      var first = null;
      for (var i = 0; i < state.picks.length; i++) {
        if (!state.picks[i]) continue;
        var n = noteById(state.picks[i]);
        if (!n) continue;
        if (!first) {
          first = n.hex;
          mixed = n.hex;
        } else {
          mixed = blendHex(mixed, n.hex, 0.35);
        }
      }
    }

    if (els.bottle) {
      els.bottle.setAttribute('data-shape', kit.shape);
      els.bottle.setAttribute('data-bottle', bottle.id);
    }
    if (els.photoBottle) {
      els.photoBottle.src = bottle.src;
      els.photoBottle.style.opacity = '1';
    }
    if (els.photoFill) {
      els.photoFill.style.inset = bottle.fillInset;
    }
    if (els.liquid) {
      els.liquid.style.setProperty('--liquid', mixed);
      els.liquid.style.height = pct + '%';
      els.liquid.style.background =
        'linear-gradient(180deg, ' + blendHex(mixed, '#ffffff', 0.35) + ' 0%, ' + mixed + ' 38%, ' + blendHex(mixed, '#000000', 0.18) + ' 100%)';
    }
    if (els.bottleCard) {
      els.bottleCard.style.setProperty('--liquid', mixed);
      if (filled) els.bottleCard.classList.add('is-filling');
      else els.bottleCard.classList.remove('is-filling');
    }
    var status = fillStatusText();
    if (els.fillStatus) els.fillStatus.textContent = status;
    if (els.stickyStatus) els.stickyStatus.textContent = status;
    if (els.statusbar) {
      els.statusbar.textContent = statusBarText();
      els.statusbar.classList.toggle('is-ready', kitComplete());
    }

    var complete = kitComplete();
    var ready = complete;
    if (state.mode === 'trio') {
      if (state.trioStep === 'rollon') ready = complete && !!variants.trio;
    } else {
      ready = complete && !!variants[state.mode];
    }
    var label = atcLabel(complete);
    if (els.atc) {
      els.atc.textContent = label;
      els.atc.disabled = !ready;
      els.atc.classList.toggle('is-ready', ready);
    }
    if (els.stickyAtc) {
      els.stickyAtc.textContent = label;
      els.stickyAtc.disabled = !ready;
      els.stickyAtc.classList.toggle('is-ready', ready);
    }
    if (els.sticky) {
      els.sticky.classList.toggle('is-ready', ready);
      els.sticky.classList.toggle('is-filling', filled > 0);
    }
    if (els.stickyBottle && bottle.src) els.stickyBottle.src = bottle.src;
    if (els.stickyLiquid) {
      els.stickyLiquid.style.height = pct + '%';
      els.stickyLiquid.style.background =
        'linear-gradient(180deg, ' + blendHex(mixed, '#ffffff', 0.35) + ' 0%, ' + mixed + ' 38%, ' + blendHex(mixed, '#000000', 0.18) + ' 100%)';
    }
  }

  function snapshotFormula() {
    var kit = activeKit();
    var bottle = activeBottle();
    return {
      kit: kit.key,
      label: kit.label,
      name: (els.name && els.name.value.trim()) || 'untitled formula',
      bottle: bottle.label,
      finish: bottle.finish || '',
      picks: state.picks.slice(),
      slots: kit.slots.map(function (slot, index) {
        var note = noteById(state.picks[index]);
        return {
          role: slot.role,
          amountMl: slot.amountMl,
          noteId: state.picks[index],
          noteLabel: note ? note.label : ''
        };
      })
    };
  }

  function formulaLine(formula) {
    return formula.slots.map(function (slot) {
      return slot.amountMl + ' mL ' + slot.noteLabel;
    }).join(' + ');
  }

  function propertiesForFormula(formula) {
    var props = {
      Kit: formula.label,
      'Formula name': formula.name,
      'Base note': formula.slots[0] ? formula.slots[0].noteLabel : '',
      'Base amount': formula.slots[0] ? (formula.slots[0].amountMl + ' mL') : ''
    };
    for (var i = 1; i < formula.slots.length; i++) {
      props['Support ' + i] = formula.slots[i].noteLabel;
      props['Support ' + i + ' amount'] = formula.slots[i].amountMl + ' mL';
    }
    props.Protocol = formulaLine(formula);
    if (formula.bottle) props.Bottle = formula.bottle;
    if (formula.finish) props.Finish = formula.finish;
    return props;
  }

  function paint() {
    renderKits();
    renderTrioTrack();
    renderBottlePick();
    renderSlots();
    renderFilters();
    renderNotes();
    renderVials();
    renderShipsPick();
    renderBottle();
  }

  function pickNote(id, opts) {
    opts = opts || {};
    var kit = activeKit();
    var slotIndex = typeof opts.slotIndex === 'number' ? opts.slotIndex : state.activeSlot;
    if (slotIndex < 0 || slotIndex >= kit.slots.length || (state.picks[slotIndex] && opts.preferEmpty)) {
      slotIndex = firstEmptySlot();
    }
    if (slotIndex < 0 || slotIndex >= kit.slots.length) slotIndex = firstEmptySlot();

    state.picks[slotIndex] = id;
    state.picks.length = kit.slots.length;
    state.activeSlot = slotIndex;

    var note = noteById(id);
    setError('');
    celebratePour(note, slotIndex);

    if (!kitComplete()) {
      var advanced = false;
      for (var i = 1; i < kit.slots.length; i++) {
        var idx = slotIndex + i;
        if (idx < kit.slots.length && !state.picks[idx]) {
          state.activeSlot = idx;
          advanced = true;
          break;
        }
      }
      if (!advanced) {
        for (var j = 0; j < slotIndex; j++) {
          if (!state.picks[j]) {
            state.activeSlot = j;
            break;
          }
        }
      }
    }
    paint();
    announce((note ? note.label : id) + ' selected. ' + coachLine());
    if (kitComplete() && els.sticky && window.matchMedia('(max-width: 620px)').matches) {
      try { els.sticky.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (_e) {}
      if (els.stickyAtc) els.stickyAtc.focus();
    }
  }

  function resetPicks() {
    var kit = activeKit();
    state.picks = new Array(kit.slots.length);
    state.activeSlot = 0;
    if (els.name) els.name.value = '';
    setError('');
    paint();
    announce('Bottle cleared.');
  }

  async function addToCart() {
    setError('');
    var kit = activeKit();
    var complete = kit.slots.every(function (_s, i) { return !!state.picks[i]; });
    if (!complete) {
      setError('Fill every tube - reuse a note if you only want 2-3 scents.');
      return;
    }

    if (state.mode === 'trio' && state.trioStep !== 'rollon') {
      state.trioFormulas[state.trioStep] = snapshotFormula();
      var next = TRIO_ORDER[trioStepIndex() + 1];
      state.trioStep = next;
      var savedNext = state.trioFormulas[next];
      if (savedNext) {
        state.picks = savedNext.picks.slice();
        state.picks.length = KITS[next].slots.length;
        if (els.name) els.name.value = savedNext.name || '';
      } else {
        state.picks = new Array(KITS[next].slots.length);
        if (els.name) els.name.value = '';
      }
      state.activeSlot = 0;
      paint();
      announce('Saved. Now build your ' + (TRIO_LABELS[next] || next) + ' formula.');
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    els.atc.disabled = true;
    var original = els.atc.textContent;
    els.atc.textContent = 'adding.';

    try {
      var items = [];
      if (state.mode === 'trio') {
        state.trioFormulas.rollon = snapshotFormula();
        if (!variants.trio) throw new Error('missing trio variant');
        var perfumeF = state.trioFormulas.perfume;
        var oilF = state.trioFormulas.oil;
        var rollF = state.trioFormulas.rollon;
        items.push({
          id: variants.trio,
          quantity: 1,
          properties: {
            Kit: titles.trio,
            'Formula name': rollF.name,
            'Perfume formula': perfumeF.name + ' - ' + formulaLine(perfumeF),
            'Body oil formula': oilF.name + ' - ' + formulaLine(oilF),
            'Roll-on formula': rollF.name + ' - ' + formulaLine(rollF),
            'Perfume bottle': perfumeF.bottle || '',
            'Perfume finish': perfumeF.finish || 'silver sprayer',
            'Body oil bottle': oilF.bottle || '',
            'Roll-on bottle': rollF.bottle || '',
            Price: money.trio
          }
        });
      } else {
        if (!variants[state.mode]) throw new Error('missing variant ' + state.mode);
        var formula = snapshotFormula();
        var props = propertiesForFormula(formula);
        props.Price = money[state.mode];
        props.Product = titles[state.mode];
        items.push({ id: variants[state.mode], quantity: 1, properties: props });
      }

      var response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ items: items })
      });
      if (!response.ok) throw new Error('cart');
      window.location.assign('/cart');
    } catch (err) {
      els.atc.disabled = false;
      els.atc.textContent = original;
      setError('Could not add that formula. Try again.');
    }
  }

  root.addEventListener('click', function (event) {
    var gotoBtn = event.target.closest('[data-lah-goto]');
    if (gotoBtn && root.contains(gotoBtn)) {
      showScreen(gotoBtn.getAttribute('data-lah-goto'));
      return;
    }

    var kitBtn = event.target.closest('[data-kit]');
    if (kitBtn && root.contains(kitBtn)) {
      state.mode = kitBtn.getAttribute('data-kit');
      state.trioStep = 'perfume';
      state.trioFormulas = { perfume: null, oil: null, rollon: null };
      var kit = activeKit();
      state.picks = new Array(kit.slots.length);
      state.activeSlot = 0;
      if (els.name) els.name.value = '';
      setError('');
      paint();
      if (els.kits) {
        els.kits.classList.remove('is-pop');
        void els.kits.offsetWidth;
        els.kits.classList.add('is-pop');
      }
      announce(state.mode === 'trio'
        ? 'Trio selected - build perfume, then oil, then roll-on.'
        : ('Selected ' + kit.label));
      return;
    }

    var vialBtn = event.target.closest('[data-vial-slot]');
    if (vialBtn && root.contains(vialBtn)) {
      state.activeSlot = Number(vialBtn.getAttribute('data-vial-slot'));
      setError('');
      paint();
      announce('Slot ' + (state.activeSlot + 1) + ' selected - pick a note.');
      if (els.notes) {
        try { els.notes.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (_e) {}
      }
      return;
    }

    var trioStepBtn = event.target.closest('[data-trio-step]');
    if (trioStepBtn && root.contains(trioStepBtn) && state.mode === 'trio') {
      loadTrioStep(trioStepBtn.getAttribute('data-trio-step'));
      return;
    }

    var bottleBtn = event.target.closest('[data-bottle]');
    if (bottleBtn && root.contains(bottleBtn)) {
      state.bottle = bottleBtn.getAttribute('data-bottle');
      paint();
      announce('Bottle: ' + (BOTTLES[state.bottle] || {}).label);
      return;
    }

    var slotBtn = event.target.closest('[data-slot]');
    if (slotBtn && root.contains(slotBtn)) {
      state.activeSlot = Number(slotBtn.getAttribute('data-slot'));
      setError('');
      paint();
      return;
    }

    var filterBtn = event.target.closest('[data-filter]');
    if (filterBtn && root.contains(filterBtn)) {
      state.filter = filterBtn.getAttribute('data-filter');
      paint();
      return;
    }

    var noteBtn = event.target.closest('[data-note]');
    if (noteBtn && root.contains(noteBtn)) {
      pickNote(noteBtn.getAttribute('data-note'), { preferEmpty: true });
      return;
    }

    if (event.target.closest('[data-lah-atc]') || event.target.closest('[data-lah-sticky-atc]')) {
      addToCart();
      return;
    }
    if (event.target.closest('[data-lah-reset]')) {
      if (state.mode === 'trio') {
        state.trioStep = 'perfume';
        state.trioFormulas = { perfume: null, oil: null, rollon: null };
      }
      resetPicks();
    }
  });

  if (els.search) {
    els.search.addEventListener('input', function () {
      state.query = els.search.value || '';
      renderNotes();
    });
  }

  if (els.name) {
    els.name.addEventListener('input', function () {
      renderBottle();
    });
  }

  state.picks = new Array(activeKit().slots.length);

  // Deep-link: bookings CTA + filming shortcuts jump into customize.
  // Fresh /pages/the-lab opens the XP setup wizard first.
  var params = new URLSearchParams(window.location.search || '');
  var hash = String(window.location.hash || '').toLowerCase();
  if (
    params.get('build') === '1' ||
    hash === '#lab-at-home' ||
    hash === '#lab-at-home-build' ||
    hash === '#customize'
  ) {
    showScreen('build');
  } else {
    showScreen('setup');
  }
})();
