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

  var variants = {
    perfume: Number(root.getAttribute('data-variant-perfume') || 0),
    oil: Number(root.getAttribute('data-variant-oil') || 0),
    rollon: Number(root.getAttribute('data-variant-rollon') || 0),
    trio: Number(root.getAttribute('data-variant-trio') || 0)
  };
  var money = {
    perfume: root.getAttribute('data-money-perfume') || '$49.00',
    oil: root.getAttribute('data-money-oil') || '$35.00',
    rollon: root.getAttribute('data-money-rollon') || '$24.00',
    trio: root.getAttribute('data-money-trio') || '$99.00'
  };
  var titles = {
    perfume: root.getAttribute('data-title-perfume') || 'The Lab @ Home — 30 mL Custom Perfume',
    oil: root.getAttribute('data-title-oil') || 'The Lab @ Home — 30 mL Custom Body Oil',
    rollon: root.getAttribute('data-title-rollon') || 'The Lab @ Home — 10 mL Custom Roll-On',
    trio: root.getAttribute('data-title-trio') || 'The Lab @ Home Trio'
  };

  var state = {
    mode: 'perfume',
    trioStep: 'perfume',
    filter: 'all',
    picks: [],
    activeSlot: 0,
    trioFormulas: { perfume: null, oil: null, rollon: null }
  };

  var els = {
    kits: root.querySelector('[data-lah-kits]'),
    selected: root.querySelector('[data-lah-selected]'),
    protocol: root.querySelector('[data-lah-protocol]'),
    slots: root.querySelector('[data-lah-slots]'),
    filters: root.querySelector('[data-lah-filters]'),
    notes: root.querySelector('[data-lah-notes]'),
    bottle: root.querySelector('[data-lah-bottle]'),
    layers: root.querySelector('[data-lah-layers]'),
    liquid: root.querySelector('[data-lah-liquid]'),
    meniscus: root.querySelector('[data-lah-meniscus]'),
    fillStatus: root.querySelector('[data-lah-fill-status]'),
    recipe: root.querySelector('[data-lah-recipe]'),
    name: root.querySelector('[data-lah-name]'),
    atc: root.querySelector('[data-lah-atc]'),
    reset: root.querySelector('[data-lah-reset]'),
    error: root.querySelector('[data-lah-error]'),
    live: root.querySelector('[data-lah-live]')
  };

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
    var r = Math.round(A[0] + (B[0] - A[0]) * t);
    var g = Math.round(A[1] + (B[1] - A[1]) * t);
    var bl = Math.round(A[2] + (B[2] - A[2]) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  function renderKits() {
    if (!els.kits) return;
    var options = [
      { id: 'perfume', label: 'perfume', meta: '30 mL DIY kit · 15 + 5 + 5 + 5', price: money.perfume, bg: '#ffe8ef' },
      { id: 'oil', label: 'body oil', meta: '30 mL DIY kit · 15 + 5 + 5 + 5', price: money.oil, bg: '#c9e7ff' },
      { id: 'rollon', label: 'roll-on', meta: '10 mL DIY kit · 4 + 4 + 2', price: money.rollon, bg: '#fff1a8' },
      { id: 'trio', label: 'the trio', meta: 'perfume + oil + roll-on · save $9', price: money.trio, bg: '#d9ff78' }
    ];
    els.kits.innerHTML = options.map(function (opt) {
      var pressed = state.mode === opt.id;
      return (
        '<button type="button" class="suas-lah-kit' + (pressed ? ' is-selected' : '') + '" style="--kit-bg:' + opt.bg + '" data-kit="' + opt.id + '" aria-pressed="' + pressed + '">' +
          '<span class="suas-lah-kit-check" aria-hidden="true">' + (pressed ? '✓' : '') + '</span>' +
          '<strong>' + escapeHtml(opt.label) + '</strong>' +
          '<span>' + escapeHtml(opt.meta) + '</span>' +
          '<em>' + escapeHtml(opt.price) + '</em>' +
        '</button>'
      );
    }).join('');

    if (els.selected) {
      var kit = activeKit();
      var priceKey = state.mode === 'trio' ? 'trio' : state.mode;
      els.selected.innerHTML =
        'Building: <strong>' + escapeHtml(kit.label) + '</strong> · <strong>' + escapeHtml(money[priceKey]) + '</strong>' +
        (state.mode === 'trio' ? ' <span>(trio step ' + escapeHtml(state.trioStep) + ')</span>' : '');
    }
  }

  function renderProtocol() {
    if (!els.protocol) return;
    var kit = activeKit();
    var slot = kit.slots[state.activeSlot] || kit.slots[0];
    var tip = state.picks[state.activeSlot]
      ? 'Editing the ' + slot.amountMl + ' mL tube — pick a different note to replace it.'
      : (slot.role === 'base'
        ? 'Choose your ' + slot.amountMl + ' mL base note (your favorite).'
        : 'Choose a ' + slot.amountMl + ' mL supporting note.');
    els.protocol.innerHTML =
      '<b>' + escapeHtml(kit.label) + '</b>' +
      '<span>' + escapeHtml(tip) + '</span>';
  }

  function renderSlots() {
    if (!els.slots) return;
    var kit = activeKit();
    els.slots.innerHTML = kit.slots.map(function (slot, index) {
      var pick = state.picks[index];
      var note = pick ? noteById(pick) : null;
      var classes = 'suas-lah-slot';
      if (index === state.activeSlot) classes += ' is-active';
      if (note) classes += ' is-filled';
      var color = note ? note.hex : '#ddd';
      var text = note
        ? slot.amountMl + ' mL · ' + note.label
        : slot.label;
      return (
        '<button type="button" class="' + classes + '" style="--slot-color:' + color + '" data-slot="' + index + '" aria-pressed="' + (index === state.activeSlot) + '">' +
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
    var list = NOTES.filter(function (note) {
      return state.filter === 'all' || note.family === state.filter;
    });
    els.notes.innerHTML = list.map(function (note) {
      var selectedIn = state.picks.indexOf(note.id);
      var isActivePick = state.picks[state.activeSlot] === note.id;
      var classes = 'suas-lah-note';
      if (isActivePick) classes += ' is-current';
      else if (selectedIn !== -1) classes += ' is-used';
      return (
        '<button type="button" class="' + classes + '" data-note="' + escapeHtml(note.id) + '" aria-pressed="' + (selectedIn !== -1) + '" style="--n1:' + note.hex + ';--n2:' + note.hex2 + '">' +
          '<span class="suas-lah-note-drop" aria-hidden="true"></span>' +
          '<span class="suas-lah-note-copy"><b>' + escapeHtml(note.label) + '</b><small>' + escapeHtml(note.family) + '</small></span>' +
          (selectedIn !== -1 ? '<em>' + (selectedIn === 0 ? 'base' : 's' + selectedIn) + '</em>' : '') +
        '</button>'
      );
    }).join('');
  }

  function renderBottle() {
    var kit = activeKit();
    if (els.bottle) els.bottle.setAttribute('data-shape', kit.shape);

    var vol = totalMl(kit);
    var filled = filledMl();
    var pct = Math.min(100, (filled / vol) * 100);
    var bodyTop = 66;
    var bodyBottom = 286;
    var bodyH = bodyBottom - bodyTop;
    var fillH = (pct / 100) * bodyH;
    var fillY = bodyBottom - fillH;

    var mixed = '#f4c4d8';
    if (state.picks.length) {
      mixed = noteById(state.picks[0]).hex;
      for (var i = 1; i < state.picks.length; i++) {
        if (!state.picks[i]) continue;
        var n = noteById(state.picks[i]);
        if (n) mixed = blendHex(mixed, n.hex, 0.35);
      }
    }

    if (els.liquid) {
      els.liquid.setAttribute('y', String(fillY));
      els.liquid.setAttribute('height', String(fillH));
      els.liquid.setAttribute('fill', mixed);
    }
    if (els.meniscus) {
      els.meniscus.setAttribute('cy', String(fillY));
      els.meniscus.setAttribute('opacity', fillH > 2 ? '1' : '0');
      els.meniscus.setAttribute('fill', blendHex(mixed, '#ffffff', 0.45));
    }

    if (els.layers) {
      var cursor = 0;
      var parts = [];
      for (var s = 0; s < kit.slots.length; s++) {
        if (!state.picks[s]) continue;
        var note = noteById(state.picks[s]);
        var h = (kit.slots[s].amountMl / vol) * bodyH;
        var y = bodyBottom - cursor - h;
        cursor += h;
        parts.push(
          '<rect x="48" y="' + y + '" width="64" height="' + h + '" fill="' + (note ? note.hex : mixed) + '" opacity="0.92">' +
          '<animate attributeName="height" dur="0.45s" fill="freeze"/>' +
          '</rect>' +
          '<rect x="48" y="' + y + '" width="64" height="' + Math.min(10, h) + '" fill="' + (note ? note.hex2 : '#fff') + '" opacity="0.35"/>'
        );
      }
      els.layers.innerHTML = parts.join('');
    }

    if (els.fillStatus) {
      els.fillStatus.textContent = filled + ' / ' + vol + ' mL filled';
    }

    if (els.recipe) {
      if (!filled) {
        els.recipe.innerHTML = '<li>empty bottle — choose your base scent</li>';
      } else {
        els.recipe.innerHTML = kit.slots.map(function (slot, index) {
          if (!state.picks[index]) return '';
          var note = noteById(state.picks[index]);
          return '<li><strong>' + escapeHtml(slot.amountMl + ' mL') + '</strong> ' + escapeHtml(note ? note.label : '') +
            (slot.role === 'base' ? ' <em>(base)</em>' : '') + '</li>';
        }).join('');
      }
    }

    if (els.atc) {
      var complete = kit.slots.every(function (_slot, index) { return !!state.picks[index]; });
      var named = !!(els.name && els.name.value.trim());
      var ready = complete && named;
      if (state.mode === 'trio' && state.trioStep !== 'rollon') {
        els.atc.textContent = 'save · next kit';
        els.atc.disabled = !ready;
      } else if (state.mode === 'trio') {
        els.atc.textContent = 'add trio to cart · ' + money.trio;
        els.atc.disabled = !ready || !variants.trio;
      } else {
        els.atc.textContent = 'add to cart · ' + money[state.mode];
        els.atc.disabled = !ready || !variants[state.mode];
      }
    }
  }

  function snapshotFormula() {
    var kit = activeKit();
    return {
      kit: kit.key,
      label: kit.label,
      name: (els.name && els.name.value.trim()) || 'untitled formula',
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
    return props;
  }

  function paint() {
    renderKits();
    renderProtocol();
    renderSlots();
    renderFilters();
    renderNotes();
    renderBottle();
  }

  function pickNote(id) {
    var kit = activeKit();
    var slotIndex = state.activeSlot;
    if (slotIndex < 0 || slotIndex >= kit.slots.length) slotIndex = firstEmptySlot();

    // if this note is already in another slot, swap/move it to active
    var existing = state.picks.indexOf(id);
    if (existing !== -1 && existing !== slotIndex) {
      var displaced = state.picks[slotIndex] || null;
      state.picks[slotIndex] = id;
      state.picks[existing] = displaced;
    } else {
      state.picks[slotIndex] = id;
    }

    // compact? no — keep sparse until filled in order for amounts; but amounts are per slot index so sparse is OK
    // ensure array length
    state.picks.length = kit.slots.length;

    var note = noteById(id);
    announce((note ? note.label : id) + ' set on ' + kit.slots[slotIndex].amountMl + ' mL tube');
    setError('');

    // advance to next empty slot if current filled
    var next = firstEmptySlot();
    if (state.picks[slotIndex] && !state.picks.every(Boolean)) {
      // prefer next empty after current
      next = slotIndex;
      for (var i = 1; i <= kit.slots.length; i++) {
        var idx = (slotIndex + i) % kit.slots.length;
        if (!state.picks[idx]) { next = idx; break; }
      }
      state.activeSlot = next;
    }
    paint();
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
      setError('Fill every tube first — tap an empty tube, then a note.');
      return;
    }
    if (!els.name || !els.name.value.trim()) {
      setError('Name your formula.');
      return;
    }

    if (state.mode === 'trio' && state.trioStep !== 'rollon') {
      state.trioFormulas[state.trioStep] = snapshotFormula();
      var order = ['perfume', 'oil', 'rollon'];
      state.trioStep = order[order.indexOf(state.trioStep) + 1];
      state.picks = new Array(KITS[state.trioStep].slots.length);
      state.activeSlot = 0;
      if (els.name) els.name.value = '';
      paint();
      announce('Saved. Now build your ' + state.trioStep + ' formula.');
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    els.atc.disabled = true;
    var original = els.atc.textContent;
    els.atc.textContent = 'adding…';

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
            'Perfume formula': perfumeF.name + ' — ' + formulaLine(perfumeF),
            'Body oil formula': oilF.name + ' — ' + formulaLine(oilF),
            'Roll-on formula': rollF.name + ' — ' + formulaLine(rollF),
            'Perfume base': perfumeF.slots[0].noteLabel,
            'Body oil base': oilF.slots[0].noteLabel,
            'Roll-on base': rollF.slots[0].noteLabel,
            Price: money.trio
          }
        });
      } else {
        if (!variants[state.mode]) throw new Error('missing variant ' + state.mode);
        var formula = snapshotFormula();
        var props = propertiesForFormula(formula);
        props.Price = money[state.mode];
        props.Product = titles[state.mode];
        items.push({
          id: variants[state.mode],
          quantity: 1,
          properties: props
        });
      }

      var response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ items: items })
      });
      if (!response.ok) {
        var errText = await response.text();
        throw new Error(errText || 'cart');
      }
      window.location.assign('/cart');
    } catch (err) {
      els.atc.disabled = false;
      els.atc.textContent = original;
      setError('Could not add that formula. Try again.');
    }
  }

  root.addEventListener('click', function (event) {
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
      announce('Selected ' + kit.label + ' · ' + money[state.mode === 'trio' ? 'trio' : state.mode]);
      return;
    }

    var slotBtn = event.target.closest('[data-slot]');
    if (slotBtn && root.contains(slotBtn)) {
      state.activeSlot = Number(slotBtn.getAttribute('data-slot'));
      setError('');
      paint();
      announce('Editing tube ' + (state.activeSlot + 1));
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
      pickNote(noteBtn.getAttribute('data-note'));
      return;
    }

    if (event.target.closest('[data-lah-atc]')) {
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

  if (els.name) {
    els.name.addEventListener('input', function () { renderBottle(); });
  }

  state.picks = new Array(activeKit().slots.length);
  paint();
})();
