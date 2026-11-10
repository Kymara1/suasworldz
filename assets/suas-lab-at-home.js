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
      priceKey: 'perfume',
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
      priceKey: 'oil',
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
      priceKey: 'rollon',
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
  var noteAssets = {};
  try {
    noteAssets = JSON.parse(root.getAttribute('data-note-assets') || '{}');
  } catch (e) {
    noteAssets = {};
  }

  var state = {
    mode: 'perfume', // perfume | oil | rollon | trio
    trioStep: 'perfume', // perfume | oil | rollon
    filter: 'all',
    picks: [],
    formulaName: '',
    trioFormulas: { perfume: null, oil: null, rollon: null }
  };

  var els = {
    kits: root.querySelector('[data-lah-kits]'),
    protocol: root.querySelector('[data-lah-protocol]'),
    slots: root.querySelector('[data-lah-slots]'),
    filters: root.querySelector('[data-lah-filters]'),
    notes: root.querySelector('[data-lah-notes]'),
    bottle: root.querySelector('[data-lah-bottle]'),
    layers: root.querySelector('[data-lah-layers]'),
    liquid: root.querySelector('[data-lah-liquid]'),
    fillStatus: root.querySelector('[data-lah-fill-status]'),
    recipe: root.querySelector('[data-lah-recipe]'),
    name: root.querySelector('[data-lah-name]'),
    atc: root.querySelector('[data-lah-atc]'),
    reset: root.querySelector('[data-lah-reset]'),
    error: root.querySelector('[data-lah-error]'),
    trioProgress: root.querySelector('[data-lah-trio-progress]'),
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
    if (state.mode === 'trio') return state.trioStep;
    return state.mode;
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
    for (var i = 0; i < state.picks.length; i++) {
      sum += kit.slots[i].amountMl;
    }
    return sum;
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

  function renderKits() {
    if (!els.kits) return;
    var options = [
      { id: 'perfume', label: 'perfume', meta: '30 mL · 15 + 5 + 5 + 5', price: '$49', bg: '#ffe8ef' },
      { id: 'oil', label: 'body oil', meta: '30 mL · 15 + 5 + 5 + 5', price: '$35', bg: '#c9e7ff' },
      { id: 'rollon', label: 'roll-on', meta: '10 mL · 4 + 4 + 2', price: '$24', bg: '#fff1a8' },
      { id: 'trio', label: 'the trio', meta: 'all three kits · save $9', price: '$99', bg: '#d9ff78' }
    ];
    els.kits.innerHTML = options.map(function (opt) {
      var pressed = state.mode === opt.id;
      return (
        '<button type="button" class="suas-lah-kit" style="--kit-bg:' + opt.bg + '" data-kit="' + opt.id + '" aria-pressed="' + pressed + '">' +
          '<strong>' + escapeHtml(opt.label) + '</strong>' +
          '<span>' + escapeHtml(opt.meta) + '</span>' +
          '<em>' + escapeHtml(opt.price) + '</em>' +
        '</button>'
      );
    }).join('');
  }

  function renderProtocol() {
    if (!els.protocol) return;
    var kit = activeKit();
    var trioBit = '';
    if (state.mode === 'trio') {
      trioBit = '<p class="suas-lah-trio-progress" data-lah-trio-progress>trio step: ' + escapeHtml(state.trioStep) + ' · 3 formulas for $99</p>';
    }
    var nextSlot = kit.slots[state.picks.length];
    var tip = nextSlot
      ? (nextSlot.role === 'base'
        ? 'Pick your favorite scent first — that is your ' + nextSlot.amountMl + ' mL base.'
        : 'Add a supporting note (' + nextSlot.amountMl + ' mL). Same protocol as in The Lab.')
      : 'All tubes filled. Name it and add to cart.';
    els.protocol.innerHTML =
      '<b>' + escapeHtml(kit.label) + '</b>' +
      '<span>' + escapeHtml(tip) + '</span>' +
      trioBit;
  }

  function renderSlots() {
    if (!els.slots) return;
    var kit = activeKit();
    els.slots.innerHTML = kit.slots.map(function (slot, index) {
      var pick = state.picks[index];
      var note = pick ? noteById(pick) : null;
      var classes = 'suas-lah-slot';
      if (index === state.picks.length) classes += ' is-active';
      if (note) classes += ' is-filled';
      var color = note ? note.hex : '#ddd';
      var text = note
        ? slot.amountMl + ' mL · ' + note.label
        : slot.label;
      return (
        '<span class="' + classes + '" style="--slot-color:' + color + '">' +
          '<i aria-hidden="true"></i>' + escapeHtml(text) +
        '</span>'
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
    var kit = activeKit();
    var full = state.picks.length >= kit.slots.length;
    var list = NOTES.filter(function (note) {
      if (state.filter !== 'all' && note.family !== state.filter) return false;
      return true;
    });
    els.notes.innerHTML = list.map(function (note) {
      var selected = state.picks.indexOf(note.id) !== -1;
      var disabled = full && !selected;
      var photo = note.photo && noteAssets[note.photo] ? noteAssets[note.photo] : '';
      var img = photo
        ? '<img src="' + escapeHtml(photo) + '" alt="" loading="lazy" width="120" height="100">'
        : '';
      return (
        '<button type="button" class="suas-lah-note" data-note="' + escapeHtml(note.id) + '" aria-pressed="' + selected + '"' +
          (disabled ? ' disabled' : '') +
          ' style="--n1:' + note.hex + ';--n2:' + note.hex2 + '">' +
          '<span class="suas-lah-note-swatch" aria-hidden="true">' + img + '</span>' +
          '<b>' + escapeHtml(note.label) + '<small>' + escapeHtml(note.family) + '</small></b>' +
        '</button>'
      );
    }).join('');
  }

  function renderBottle() {
    var kit = activeKit();
    if (els.bottle) els.bottle.setAttribute('data-shape', kit.shape);

    var vol = totalMl(kit);
    var filled = filledMl();
    var pct = Math.min(100, Math.round((filled / vol) * 100));

    if (els.liquid) {
      els.liquid.style.height = pct + '%';
      if (state.picks.length) {
        var first = noteById(state.picks[0]);
        var last = noteById(state.picks[state.picks.length - 1]);
        els.liquid.style.setProperty('--liq-top', first ? first.hex2 : '#ff9fc2');
        els.liquid.style.setProperty('--liq-bot', last ? last.hex : '#ff5ab4');
      }
    }

    if (els.layers) {
      var cursor = 0;
      els.layers.innerHTML = state.picks.map(function (id, index) {
        var note = noteById(id);
        var slot = kit.slots[index];
        var h = (slot.amountMl / vol) * 100;
        var from = cursor;
        cursor += h;
        return (
          '<span class="suas-lah-layer" style="--from:' + from + '%;--h:' + h + '%;--c1:' +
          (note ? note.hex2 : '#fff') + ';--c2:' + (note ? note.hex : '#ccc') + '"></span>'
        );
      }).join('');
    }

    if (els.fillStatus) {
      els.fillStatus.textContent = filled + ' / ' + vol + ' mL filled';
    }

    if (els.recipe) {
      if (!state.picks.length) {
        els.recipe.innerHTML = '<li>empty bottle — pick your base scent</li>';
      } else {
        els.recipe.innerHTML = state.picks.map(function (id, index) {
          var note = noteById(id);
          var slot = kit.slots[index];
          return '<li><strong>' + escapeHtml(slot.amountMl + ' mL') + '</strong> ' + escapeHtml(note ? note.label : id) +
            (slot.role === 'base' ? ' <em>(base)</em>' : '') + '</li>';
        }).join('');
      }
    }

    if (els.atc) {
      var ready = state.picks.length === kit.slots.length && (els.name && els.name.value.trim().length > 0);
      if (state.mode === 'trio' && state.trioStep !== 'rollon') {
        els.atc.textContent = 'save formula · next kit';
        els.atc.disabled = state.picks.length !== kit.slots.length || !(els.name && els.name.value.trim());
      } else if (state.mode === 'trio') {
        els.atc.textContent = 'add trio to cart · $99';
        els.atc.disabled = !ready;
      } else {
        var prices = { perfume: '$49', oil: '$35', rollon: '$24' };
        els.atc.textContent = 'add to cart · ' + (prices[state.mode] || '');
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

  function propertiesForFormula(formula, kitLabel) {
    var props = {
      Kit: kitLabel || formula.label,
      'Formula name': formula.name,
      'Base note': formula.slots[0] ? formula.slots[0].noteLabel : '',
      'Base amount': formula.slots[0] ? (formula.slots[0].amountMl + ' mL') : ''
    };
    for (var i = 1; i < formula.slots.length; i++) {
      var n = i;
      props['Support ' + n] = formula.slots[i].noteLabel;
      props['Support ' + n + ' amount'] = formula.slots[i].amountMl + ' mL';
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
    var idx = state.picks.indexOf(id);
    if (idx !== -1) {
      // allow unpicking only the last pick to keep pour order sane
      if (idx === state.picks.length - 1) {
        state.picks.pop();
        announce('Removed note. Bottle drained one pour.');
      } else {
        setError('Undo from the last pour only — keep the layer order.');
        return;
      }
    } else {
      if (state.picks.length >= kit.slots.length) return;
      state.picks.push(id);
      var note = noteById(id);
      var slot = kit.slots[state.picks.length - 1];
      announce((note ? note.label : id) + ' poured · ' + slot.amountMl + ' mL');
      setError('');
    }
    paint();
  }

  function resetPicks() {
    state.picks = [];
    if (els.name) els.name.value = '';
    setError('');
    paint();
    announce('Bottle cleared.');
  }

  async function addToCart() {
    setError('');
    var kit = activeKit();
    if (state.picks.length !== kit.slots.length) {
      setError('Finish filling every tube first.');
      return;
    }
    if (!els.name || !els.name.value.trim()) {
      setError('Name your formula.');
      return;
    }

    if (state.mode === 'trio' && state.trioStep !== 'rollon') {
      state.trioFormulas[state.trioStep] = snapshotFormula();
      var order = ['perfume', 'oil', 'rollon'];
      var next = order[order.indexOf(state.trioStep) + 1];
      state.trioStep = next;
      state.picks = [];
      if (els.name) els.name.value = '';
      paint();
      announce('Saved. Now build your ' + next + ' formula.');
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
            Kit: 'The Lab @ Home Trio',
            'Formula name': rollF.name,
            'Perfume formula': perfumeF.name + ' — ' + formulaLine(perfumeF),
            'Body oil formula': oilF.name + ' — ' + formulaLine(oilF),
            'Roll-on formula': rollF.name + ' — ' + formulaLine(rollF),
            'Perfume base': perfumeF.slots[0].noteLabel,
            'Body oil base': oilF.slots[0].noteLabel,
            'Roll-on base': rollF.slots[0].noteLabel
          }
        });
      } else {
        if (!variants[state.mode]) throw new Error('missing variant');
        var formula = snapshotFormula();
        items.push({
          id: variants[state.mode],
          quantity: 1,
          properties: propertiesForFormula(formula)
        });
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
    var kitBtn = event.target.closest('[data-kit]');
    if (kitBtn && root.contains(kitBtn)) {
      state.mode = kitBtn.getAttribute('data-kit');
      state.trioStep = 'perfume';
      state.trioFormulas = { perfume: null, oil: null, rollon: null };
      state.picks = [];
      if (els.name) els.name.value = '';
      setError('');
      paint();
      announce('Selected ' + state.mode);
      return;
    }

    var filterBtn = event.target.closest('[data-filter]');
    if (filterBtn && root.contains(filterBtn)) {
      state.filter = filterBtn.getAttribute('data-filter');
      paint();
      return;
    }

    var noteBtn = event.target.closest('[data-note]');
    if (noteBtn && root.contains(noteBtn) && !noteBtn.disabled) {
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
    els.name.addEventListener('input', function () {
      renderBottle();
    });
  }

  paint();
})();
