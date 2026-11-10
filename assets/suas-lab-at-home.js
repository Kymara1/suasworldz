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
      fillInset: '36% 39% 15% 39%',
      finish: 'silver sprayer'
    },
    round: {
      id: 'round',
      label: 'round',
      src: root.getAttribute('data-bottle-round') || '',
      fillInset: '36% 24% 15% 24%',
      finish: 'silver sprayer'
    }
  };

  var FIXED_PACKS = {
    oil: {
      id: 'oil',
      label: 'airless pump',
      src: root.getAttribute('data-bottle-oil') || '',
      fillInset: '35% 31% 15% 31%',
      finish: 'white pump · clear cap'
    },
    rollon: {
      id: 'rollon',
      label: 'roll-on',
      src: root.getAttribute('data-bottle-rollon') || '',
      fillInset: '35% 36% 15% 36%',
      finish: 'white cap · rollerball'
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
    bottle: 'cylinder',
    trioFormulas: { perfume: null, oil: null, rollon: null }
  };

  var TRIO_ORDER = ['perfume', 'oil', 'rollon'];
  var TRIO_LABELS = { perfume: 'perfume', oil: 'body oil', rollon: 'roll-on' };

  var els = {
    kits: root.querySelector('[data-lah-kits]'),
    selected: root.querySelector('[data-lah-selected]'),
    trioTrack: root.querySelector('[data-lah-trio-track]'),
    trioSteps: root.querySelector('[data-lah-trio-steps]'),
    notesLabel: root.querySelector('[data-lah-notes-label]'),
    slotHint: root.querySelector('[data-lah-slot-hint]'),
    bottlePick: root.querySelector('[data-lah-bottle-pick]'),
    bottleOptions: root.querySelector('[data-lah-bottle-options]'),
    slots: root.querySelector('[data-lah-slots]'),
    filters: root.querySelector('[data-lah-filters]'),
    notes: root.querySelector('[data-lah-notes]'),
    bottle: root.querySelector('[data-lah-bottle]'),
    bottleCard: root.querySelector('.suas-lah-bottle-card'),
    photoBottle: root.querySelector('[data-lah-photo-bottle]'),
    photoFill: root.querySelector('[data-lah-photo-fill]'),
    liquid: root.querySelector('[data-lah-liquid]'),
    fillStatus: root.querySelector('[data-lah-fill-status]'),
    recipe: root.querySelector('[data-lah-recipe]'),
    name: root.querySelector('[data-lah-name]'),
    atc: root.querySelector('[data-lah-atc]'),
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
          '<span>' + escapeHtml(opt.meta) + ' · ' + escapeHtml(opt.price) + '</span>' +
        '</button>'
      );
    }).join('');

    if (els.selected) {
      var kit = activeKit();
      var priceKey = state.mode === 'trio' ? 'trio' : state.mode;
      els.selected.textContent = state.mode === 'trio'
        ? ('Trio ' + money.trio + ' · ' + (TRIO_LABELS[state.trioStep] || '') + ' ' + (trioStepIndex() + 1) + '/3')
        : ('Building ' + kit.label + ' · ' + money[priceKey]);
    }
  }

  function renderTrioTrack() {
    var show = state.mode === 'trio';
    if (els.trioTrack) els.trioTrack.hidden = !show;
    if (els.bottle) els.bottle.hidden = false;

    if (els.notesLabel) {
      els.notesLabel.textContent = show
        ? ('02 · ' + (TRIO_LABELS[state.trioStep] || 'notes'))
        : '02 · notes';
    }
    if (els.slotHint) {
      els.slotHint.textContent = show
        ? ('Notes for this ' + (TRIO_LABELS[state.trioStep] || 'bottle') + ' only. Next bottle can be different.')
        : 'Tap a tube. Same note can fill more than one.';
    }
    var nameLabel = root.querySelector('label[for="LahFormulaName"]');
    if (nameLabel) {
      nameLabel.textContent = show
        ? ('name this ' + (TRIO_LABELS[state.trioStep] || 'formula'))
        : 'name your formula';
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
    els.slots.innerHTML = kit.slots.map(function (slot, index) {
      var pick = state.picks[index];
      var note = pick ? noteById(pick) : null;
      var classes = 'suas-lah-slot';
      if (index === state.activeSlot) classes += ' is-active';
      if (note) classes += ' is-filled';
      var color = note ? note.hex : '#ddd';
      var text = note ? slot.amountMl + ' mL · ' + note.label : slot.label;
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
      var usedCount = state.picks.filter(function (id) { return id === note.id; }).length;
      var isCurrent = state.picks[state.activeSlot] === note.id;
      var classes = 'suas-lah-note';
      if (isCurrent) classes += ' is-current';
      else if (usedCount) classes += ' is-used';
      return (
        '<button type="button" class="' + classes + '" data-note="' + escapeHtml(note.id) + '" aria-pressed="' + (usedCount > 0) + '" style="--n1:' + note.hex + ';--n2:' + note.hex2 + '">' +
          '<span class="suas-lah-note-drop" aria-hidden="true"></span>' +
          '<span class="suas-lah-note-copy"><b>' + escapeHtml(note.label) + '</b><small>' + escapeHtml(note.family) + '</small></span>' +
          (usedCount ? '<em>×' + usedCount + '</em>' : '') +
        '</button>'
      );
    }).join('');
  }

  function renderBottle() {
    var kit = activeKit();
    var bottle = activeBottle();
    var vol = totalMl(kit);
    var filled = filledMl();
    var pct = Math.min(100, (filled / vol) * 100);

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
    if (els.fillStatus) {
      els.fillStatus.textContent = filled + ' / ' + vol + ' mL filled';
    }
    if (els.recipe) {
      if (!filled) {
        els.recipe.innerHTML = '';
      } else {
        els.recipe.innerHTML = kit.slots.map(function (slot, index) {
          if (!state.picks[index]) return '';
          var note = noteById(state.picks[index]);
          return '<li><strong>' + escapeHtml(slot.amountMl + ' mL') + '</strong> ' + escapeHtml(note ? note.label : '') +
            (slot.role === 'base' ? ' <em>(base)</em>' : '') + '</li>';
        }).join('');
        els.recipe.innerHTML += '<li><em>bottle:</em> ' + escapeHtml(bottle.label) +
          (bottle.finish ? ' · ' + escapeHtml(bottle.finish) : '') + '</li>';
      }
      if (state.mode === 'trio') {
        TRIO_ORDER.forEach(function (key) {
          if (key === state.trioStep) return;
          var saved = state.trioFormulas[key];
          if (!saved) return;
          els.recipe.innerHTML += '<li><em>' + escapeHtml(TRIO_LABELS[key]) + ':</em> ' +
            escapeHtml(saved.name) + ' · ' + escapeHtml(formulaLine(saved)) + '</li>';
        });
      }
    }

    if (els.atc) {
      var complete = kit.slots.every(function (_slot, index) { return !!state.picks[index]; });
      var ready = complete;
      if (state.mode === 'trio' && state.trioStep !== 'rollon') {
        var nextKey = TRIO_ORDER[trioStepIndex() + 1];
        els.atc.textContent = 'save ' + (TRIO_LABELS[state.trioStep] || '') + ' · next: ' + (TRIO_LABELS[nextKey] || 'next');
        els.atc.disabled = !ready;
      } else if (state.mode === 'trio') {
        els.atc.textContent = 'add trio · ' + money.trio;
        els.atc.disabled = !ready || !variants.trio;
      } else {
        els.atc.textContent = 'add to cart · ' + money[state.mode];
        els.atc.disabled = !ready || !variants[state.mode];
      }
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
    renderBottle();
  }

  function pickNote(id) {
    var kit = activeKit();
    var slotIndex = state.activeSlot;
    if (slotIndex < 0 || slotIndex >= kit.slots.length) slotIndex = firstEmptySlot();

    // Same note can fill multiple tubes (2–3 note formulas).
    state.picks[slotIndex] = id;
    state.picks.length = kit.slots.length;

    var note = noteById(id);
    announce((note ? note.label : id) + ' set on ' + kit.slots[slotIndex].amountMl + ' mL tube');
    setError('');

    // Always jump to the next empty tube so picking feels like a pour sequence.
    if (!state.picks.every(Boolean)) {
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
      setError('Fill every tube — reuse a note if you only want 2–3 scents.');
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
      announce(state.mode === 'trio'
        ? 'Trio selected — build perfume, then oil, then roll-on.'
        : ('Selected ' + kit.label));
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

  state.picks = new Array(activeKit().slots.length);
  paint();
})();
