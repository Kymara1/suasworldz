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
 finish: 'white pump - clear cap'
 },
 rollon: {
 id: 'rollon',
 label: 'roll-on',
 src: root.getAttribute('data-bottle-rollon') || '',
 fillInset: '29% 34% 13% 34%',
 finish: 'white cap - rollerball'
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
 screen: 'build',
 installStep: 'kit',
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
 build: 'Step 1 of 5'
 };

 var INSTALL_STEPS = ['kit', 'bottle', 'notes', 'name', 'process'];
 var INSTALL_TITLES = {
 kit: 'Step 1 of 5',
 bottle: 'Step 2 of 5',
 notes: 'Step 3 of 5',
 name: 'Step 4 of 5',
 process: 'Step 5 of 5'
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
 copyBar: root.querySelector('[data-lah-copy-bar]'),
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
 fly: root.querySelector('[data-lah-fly]'),
 vialsWrap: root.querySelector('[data-lah-vials-wrap]'),
 noteCount: root.querySelector('[data-lah-note-count]'),
 deskbar: root.querySelector('[data-lah-deskbar]'),
 crtPrice: root.querySelector('[data-lah-crt-price]'),
 installSteps: root.querySelector('[data-lah-install-steps]'),
 installNext: root.querySelector('[data-lah-install-next]'),
 installBack: root.querySelector('[data-lah-install-back]'),
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

 function installPath() {
 return INSTALL_STEPS.slice();
 }

 function installIndex() {
 return installPath().indexOf(state.installStep);
 }

 function setInstallStep(id) {
 var path = installPath();
 if (path.indexOf(id) === -1) id = path[0] || 'kit';
 state.installStep = id;
 var panels = root.querySelectorAll('[data-lah-step]');
 for (var i = 0; i < panels.length; i++) {
 var on = panels[i].getAttribute('data-lah-step') === id;
 panels[i].classList.toggle('is-on', on);
 panels[i].hidden = !on;
 }
 if (els.appTitle && state.screen === 'build') {
 els.appTitle.textContent = INSTALL_TITLES[id] || SCREEN_TITLES.build;
 }
 renderInstallRail();
 renderInstallNav();
 if (id === 'notes' || id === 'process') paint();
 announce(INSTALL_TITLES[id] || id);
 }

 function renderInstallRail() {
 if (!els.installSteps) return;
 var path = installPath();
 var idx = installIndex();
 var items = els.installSteps.querySelectorAll('[data-step-id]');
 for (var i = 0; i < items.length; i++) {
 var id = items[i].getAttribute('data-step-id');
 var pathIdx = path.indexOf(id);
 items[i].classList.toggle('is-skip', pathIdx === -1);
 items[i].classList.toggle('is-current', id === state.installStep);
 items[i].classList.toggle('is-done', pathIdx !== -1 && pathIdx < idx);
 }
 }

 function renderInstallNav() {
 var path = installPath();
 var idx = installIndex();
 var onProcess = state.installStep === 'process';
 root.classList.toggle('is-process-step', onProcess);
 if (els.installBack) {
 els.installBack.disabled = idx <= 0;
 els.installBack.hidden = false;
 }
 if (els.installNext) {
 var last = idx >= path.length - 1;
 els.installNext.hidden = last;
 els.installNext.textContent = 'Next >';
 if (state.installStep === 'kit') els.installNext.textContent = 'Next >';
 if (state.installStep === 'bottle') els.installNext.textContent = 'Next >';
 if (state.installStep === 'notes') {
 els.installNext.disabled = !kitComplete();
 els.installNext.textContent = kitComplete() ? 'Next >' : 'fill all tubes';
 } else if (els.installNext) {
 els.installNext.disabled = false;
 }
 }
 if (els.atc) els.atc.hidden = !onProcess;
 }

 function installNext() {
 var path = installPath();
 var idx = installIndex();
 if (state.installStep === 'notes' && !kitComplete()) {
 setError('Fill every tube before continuing.');
 return;
 }
 setError('');
 if (idx < path.length - 1) setInstallStep(path[idx + 1]);
 }

 function installBack() {
 var path = installPath();
 var idx = installIndex();
 setError('');
 if (idx > 0) setInstallStep(path[idx - 1]);
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
 ? ((TRIO_LABELS[state.trioStep] || 'bottle') + ' ' + (trioStepIndex() + 1) + '/3 - ')
 : '';

 if (left === 0) {
 if (state.mode === 'trio' && state.trioStep !== 'rollon') {
 return trioPrefix + 'kit locked - save & continue';
 }
 return trioPrefix + 'kit locked - name it';
 }

 var idx = state.activeSlot;
 if (idx < 0 || idx >= total || state.picks[idx]) idx = firstEmptySlot();
 var slot = kit.slots[idx];
 if (slot.role === 'base') {
 return trioPrefix + 'note 1/' + total + ' - tap for ' + slot.amountMl + ' mL base';
 }
 return trioPrefix + 'note ' + (idx + 1) + '/' + total + ' - tap for ' + slot.amountMl + ' mL';
 }

 function notesFilledCount() {
 var kit = activeKit();
 var n = 0;
 for (var i = 0; i < kit.slots.length; i++) {
 if (state.picks[i]) n += 1;
 }
 return n;
 }

 function statusBarText() {
 var kit = activeKit();
 var total = kit.slots.length;
 var filled = notesFilledCount();
 if (!baseLocked()) {
 return 'Pick note 1 / ' + total + ' - ' + kit.slots[0].amountMl + ' mL base (favorite)';
 }
 if (kitComplete()) {
 if (state.mode === 'trio' && state.trioStep !== 'rollon') {
 return filled + '/' + total + ' scent notes - save & continue';
 }
 return filled + '/' + total + ' scent notes - ready';
 }
 return filled + '/' + total + ' scent notes (base included)';
 }

 function flyNoteToVial(fromEl, note, slotIndex) {
 if (!els.fly || !fromEl || !note) return;
 var vialEl = els.vials && els.vials.querySelector('[data-vial-slot="' + slotIndex + '"] .suas-lah-vial-glass');
 if (!vialEl) return;
 if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

 var from = fromEl.getBoundingClientRect();
 var to = vialEl.getBoundingClientRect();
 var startX = from.left + from.width / 2 - 14;
 var startY = from.top + from.height / 2 - 17;
 var endX = to.left + to.width / 2 - 14;
 var endY = to.top + to.height / 2 - 17;

 els.fly.style.setProperty('--n1', note.hex);
 els.fly.style.setProperty('--n2', note.hex2 || note.hex);
 els.fly.style.left = '0px';
 els.fly.style.top = '0px';
 els.fly.style.transform = 'translate(' + startX + 'px,' + startY + 'px) scale(1)';
 els.fly.classList.add('is-fly');
 void els.fly.offsetWidth;
 els.fly.style.transform = 'translate(' + endX + 'px,' + endY + 'px) scale(.55)';
 clearTimeout(flyNoteToVial._t);
 flyNoteToVial._t = setTimeout(function () {
 if (els.fly) {
 els.fly.classList.remove('is-fly');
 els.fly.style.transform = '';
 }
 }, 480);
 }

 function celebratePour(note, slotIndex, fromEl) {
 var kit = activeKit();
 var slot = kit.slots[slotIndex];
 var label = (note && note.label) || 'note';
 var amount = slot ? slot.amountMl : '';
 var isBase = slot && slot.role === 'base';
 var msg = isBase
 ? (label + ' ' + amount + ' mL BASE')
 : (label + ' - ' + amount + ' mL');

 if (fromEl) flyNoteToVial(fromEl, note, slotIndex);

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
 var total = kit.slots.length;
 var base = kit.slots[0];
 var supports = supportSlots();
 if (!supports.length) return total + ' scent notes - pick them';
 if (supports.length === 1) {
 return total + ' scent notes - ' + base.amountMl + ' mL base + ' + supports[0].amountMl + ' mL';
 }
 var same = supports.every(function (s) { return s.amountMl === supports[0].amountMl; });
 if (same) {
 return total + ' scent notes (base included) - ' + base.amountMl + ' mL + ' + supports.length + ' x ' + supports[0].amountMl + ' mL';
 }
 return total + ' scent notes (base included) - ' + base.amountMl + ' mL + ' + supports.map(function (s) { return s.amountMl + ' mL'; }).join(' + ');
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
 return 'save ' + (TRIO_LABELS[state.trioStep] || 'kit') + ', next: ' + (TRIO_LABELS[nextKey] || 'next');
 }
 if (state.mode === 'trio') return 'add trio to bag - ' + money.trio;
 return 'add to bag - ' + money[state.mode];
 }

 function showScreen(name) {
 // Intro slides removed - always open the install flow.
 name = 'build';
 state.screen = name;
 var screens = root.querySelectorAll('[data-lah-screen]');
 for (var i = 0; i < screens.length; i++) {
 var on = screens[i].getAttribute('data-lah-screen') === name;
 screens[i].classList.toggle('is-on', on);
 screens[i].hidden = !on;
 }
 if (els.appTitle) els.appTitle.textContent = INSTALL_TITLES[state.installStep] || SCREEN_TITLES.build;
 paint();
 setInstallStep(state.installStep || 'kit');
 try { root.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (_e) {}
 announce(els.appTitle ? els.appTitle.textContent : 'Lab @ Home');
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
 { id: 'perfume', label: 'perfume', meta: '30 mL - ' + money.perfume },
 { id: 'oil', label: 'body oil', meta: '30 mL - ' + money.oil },
 { id: 'rollon', label: 'roll-on', meta: '10 mL - ' + money.rollon },
 { id: 'trio', label: 'the trio', meta: 'all 3 - ' + money.trio }
 ];
 els.kits.innerHTML = options.map(function (opt) {
 var pressed = state.mode === opt.id;
 var thumbSrc = '';
 if (opt.id === 'trio') thumbSrc = trioPackSrc;
 else if (opt.id === 'oil') thumbSrc = FIXED_PACKS.oil.src;
 else if (opt.id === 'rollon') thumbSrc = FIXED_PACKS.rollon.src;
 else if (opt.id === 'perfume') thumbSrc = (BOTTLES.cylinder && BOTTLES.cylinder.src) || '';
 var thumb = thumbSrc
 ? '<img class="suas-lah-kit-thumb" src="' + escapeHtml(thumbSrc) + '" alt="" width="72" height="40">'
 : '';
 return (
 '<button type="button" class="suas-lah-kit' + (pressed ? ' is-selected' : '') + (opt.id === 'trio' ? ' is-trio' : '') + '" data-kit="' + opt.id + '" aria-pressed="' + pressed + '">' +
 thumb +
 '<strong>' + escapeHtml(opt.label) + '</strong>' +
 '<span>' + escapeHtml(opt.meta) + '</span>' +
 '</button>'
 );
 }).join('');

 var priceKey = state.mode === 'trio' ? 'trio' : state.mode;
 var crtKicker = root.querySelector('[data-lah-crt-kicker]');
 if (state.mode === 'trio' && state.trioStep !== 'rollon') {
 if (els.crtPrice) els.crtPrice.textContent = (trioStepIndex() + 1) + ' / 3 kits';
 if (crtKicker) crtKicker.textContent = 'trio in progress - not checkout yet';
 } else {
 if (els.crtPrice) els.crtPrice.textContent = money[priceKey] || '';
 if (crtKicker) crtKicker.textContent = 'ready to ship';
 }
 if (els.selected) {
 var nameVal = (els.name && els.name.value.trim()) || 'untitled formula';
 els.selected.textContent = nameVal;
 }
 }

 function renderTrioTrack() {
 var show = state.mode === 'trio';
 if (els.trioTrack) els.trioTrack.hidden = !show;
 if (els.bottle) els.bottle.hidden = false;
 if (els.recipe) els.recipe.textContent = recipeLine();

 if (els.name) {
 els.name.placeholder = show
 ? ('name this ' + (TRIO_LABELS[state.trioStep] || 'formula') + '...')
 : 'name it...';
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

 function renderCopyBar() {
 if (!els.copyBar) return;
 var showBar = state.mode === 'trio' && state.trioStep !== 'perfume';
 var hasPerfume = !!(state.trioFormulas.perfume && state.trioFormulas.perfume.picks && state.trioFormulas.perfume.picks.length);
 var hasOil = !!(state.trioFormulas.oil && state.trioFormulas.oil.picks && state.trioFormulas.oil.picks.length);
 var btnPerfume = els.copyBar.querySelector('[data-lah-copy-from="perfume"]');
 var btnOil = els.copyBar.querySelector('[data-lah-copy-from="oil"]');
 if (btnPerfume) btnPerfume.hidden = !hasPerfume;
 if (btnOil) btnOil.hidden = !(state.trioStep === 'rollon' && hasOil);
 els.copyBar.hidden = !(showBar && (hasPerfume || (state.trioStep === 'rollon' && hasOil)));
 }

 function copyFormulaFrom(sourceKey) {
 var src = state.trioFormulas[sourceKey];
 if (!src || !src.picks || !src.picks.length) return;
 var kit = activeKit();
 state.picks = new Array(kit.slots.length);
 for (var i = 0; i < kit.slots.length; i++) {
 state.picks[i] = src.picks[i] || undefined;
 }
 state.activeSlot = Math.max(0, kit.slots.length - 1);
 setError('');
 paint();
 var srcLabel = TRIO_LABELS[sourceKey] || sourceKey;
 announce('Copied notes from ' + srcLabel);
 }

 function syncBottleCopy() {
 var title = root.querySelector('[data-lah-bottle-title]');
 var copy = root.querySelector('[data-lah-bottle-copy]');
 var key = activeKitKey();
 if (key === 'oil') {
 if (title) title.textContent = 'Step 2 - Your bottle';
 if (copy) copy.textContent = 'Body oil ships in the airless pump.';
 } else if (key === 'rollon') {
 if (title) title.textContent = 'Step 2 - Your bottle';
 if (copy) copy.textContent = 'Roll-on ships in the 10 mL tube.';
 } else {
 if (title) title.textContent = 'Step 2 - Choose your perfume bottle';
 if (copy) copy.textContent = 'Cylinder or round - same juice, different silhouette.';
 }
 }

 function renderBottlePick() {
 if (!els.bottleOptions) return;
 syncBottleCopy();
 var key = activeKitKey();
 if (key === 'oil' || key === 'rollon') {
 var pack = FIXED_PACKS[key];
 els.bottleOptions.classList.add('is-fixed');
 els.bottleOptions.innerHTML =
 '<button type="button" class="suas-lah-bottle-opt is-selected is-fixed" data-bottle="' + pack.id + '" aria-pressed="true">' +
 (pack.src ? '<img src="' + escapeHtml(pack.src) + '" alt="" width="140" height="160">' : '') +
 '<strong>' + escapeHtml(pack.label) + '</strong>' +
 '</button>';
 return;
 }
 els.bottleOptions.classList.remove('is-fixed');
 els.bottleOptions.innerHTML = Object.keys(BOTTLES).map(function (key) {
 var bottle = BOTTLES[key];
 var on = state.bottle === key;
 var src = bottle.src || '';
 return (
 '<button type="button" class="suas-lah-bottle-opt' + (on ? ' is-selected' : '') + '" data-bottle="' + key + '" aria-pressed="' + on + '">' +
 (src ? '<img src="' + escapeHtml(src) + '" alt="" width="140" height="160">' : '') +
 '<strong>' + escapeHtml(bottle.label) + '</strong>' +
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
  var families = ['all', 'fruit', 'floral', 'gourmand', 'green', 'sparkle'];
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
 if (isBase) meta = 'BASE';
 else if (supportIdx >= 0) meta = 'NOTE ' + supportIdx;
 return (
 '<button type="button" class="' + classes + '" data-note="' + escapeHtml(note.id) + '" data-family="' + escapeHtml(note.family) + '" aria-pressed="' + (usedCount > 0) + '" aria-label="' + escapeHtml(note.label + ' - ' + meta) + '" style="--n1:' + note.hex + ';--n2:' + (note.hex2 || note.hex) + '">' +
 '<span class="suas-lah-note-blob" aria-hidden="true"></span>' +
 '<span class="suas-lah-note-copy"><b>' + escapeHtml(note.label) + '</b><small>' + escapeHtml(meta) + '</small></span>' +
 (usedCount ? '<span class="suas-lah-note-check" aria-hidden="true">*</span>' : '') +
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
 var title = note ? note.label : (isBase ? 'BASE' : ('TUBE ' + (index + 1)));
 var sub = slot.amountMl + ' mL';
 var aria = title + ' - ' + sub;
 return (
 '<button type="button" class="' + classes + '" style="--vial:' + color + '" data-vial-slot="' + index + '" aria-pressed="' + active + '" aria-label="' + escapeHtml(aria) + '">' +
 '<span class="suas-lah-vial-glass" aria-hidden="true"><span class="suas-lah-vial-fill"></span></span>' +
 '<span class="suas-lah-vial-tag"><b>' + escapeHtml(title) + '</b><small>' + escapeHtml(sub) + '</small></span>' +
 '</button>'
 );
 }).join('');
 }

 function renderShipsPick() {
 if (!els.shipsPick) return;
 els.shipsPick.hidden = true;
 els.shipsPick.textContent = '';
 els.shipsPick.setAttribute('aria-hidden', 'true');
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
 if (els.deskbar) els.deskbar.textContent = coachLine();

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
 // Keep cart lines short - one mix line, optional bottle. No duplicate note/amount rows.
 var props = {
 Formula: formula.name || 'untitled formula',
 Mix: formulaLine(formula)
 };
 if (formula.bottle) {
 props.Bottle = formula.bottle;
 }
 return props;
 }

 function paint() {
 renderKits();
 renderTrioTrack();
 renderCopyBar();
 renderBottlePick();
 renderSlots();
 renderFilters();
 renderNotes();
 renderVials();
 renderShipsPick();
 renderBottle();
 renderInstallRail();
 renderInstallNav();
 if (els.recipe && kitComplete()) {
 var snap = snapshotFormula();
 els.recipe.textContent = snap.name + ' - ' + formulaLine(snap);
 } else if (els.recipe) {
 els.recipe.textContent = recipeLine();
 }
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
 var fromEl = opts.fromEl || null;
 setError('');

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
 celebratePour(note, slotIndex, fromEl);
 if (els.deskbar) els.deskbar.textContent = coachLine();
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
 setInstallStep('notes');
 announce('Saved. Now build your ' + (TRIO_LABELS[next] || next) + ' formula.');
 root.scrollIntoView({ behavior: 'smooth', block: 'start' });
 return;
 }

 els.atc.disabled = true;
 var original = els.atc.textContent;
 els.atc.textContent = 'adding...';

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
 Perfume: perfumeF.name + ' - ' + formulaLine(perfumeF),
 'Body oil': oilF.name + ' - ' + formulaLine(oilF),
 'Roll-on': rollF.name + ' - ' + formulaLine(rollF),
 Bottle: perfumeF.bottle || 'cylinder'
 }
 });
 } else {
 if (!variants[state.mode]) throw new Error('missing variant ' + state.mode);
 var formula = snapshotFormula();
 items.push({ id: variants[state.mode], quantity: 1, properties: propertiesForFormula(formula) });
 }

 var response = await fetch('/cart/add.js', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
 credentials: 'same-origin',
 body: JSON.stringify({ items: items })
 });
 if (!response.ok) {
 var detail = '';
 try {
 var errBody = await response.json();
 detail = errBody.description || errBody.message || '';
 } catch (_e) {}
 throw new Error(detail || ('cart ' + response.status));
 }
 window.location.assign('/cart');
 } catch (err) {
 els.atc.disabled = false;
 els.atc.textContent = original;
 var msg = (err && err.message) ? String(err.message) : '';
 if (/sold out|unavailable|not available/i.test(msg)) {
 setError('That kit is marked sold out in Shopify. Restock Lab @ Home, then try again.');
 } else if (msg && msg !== 'cart') {
 setError(msg);
 } else {
 setError('Could not add that formula. Try again.');
 }
 }
 }

 root.addEventListener('click', function (event) {
 var gotoBtn = event.target.closest('[data-lah-goto]');
 if (gotoBtn && root.contains(gotoBtn)) {
 showScreen(gotoBtn.getAttribute('data-lah-goto'));
 return;
 }

 if (event.target.closest('[data-lah-install-next]')) {
 installNext();
 return;
 }
 if (event.target.closest('[data-lah-install-back]')) {
 installBack();
 return;
 }

 var stepRail = event.target.closest('[data-step-id]');
 if (stepRail && els.installSteps && els.installSteps.contains(stepRail)) {
 var want = stepRail.getAttribute('data-step-id');
 var path = installPath();
 var wantIdx = path.indexOf(want);
 var curIdx = installIndex();
 if (wantIdx !== -1 && wantIdx <= curIdx) setInstallStep(want);
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
 renderInstallRail();
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

 var copyBtn = event.target.closest('[data-lah-copy-from]');
 if (copyBtn && root.contains(copyBtn)) {
 copyFormulaFrom(copyBtn.getAttribute('data-lah-copy-from'));
 return;
 }

 var bottleBtn = event.target.closest('[data-bottle]');
 if (bottleBtn && root.contains(bottleBtn)) {
 var bottleId = bottleBtn.getAttribute('data-bottle');
 if (BOTTLES[bottleId]) {
 state.bottle = bottleId;
 paint();
 announce('Bottle: ' + BOTTLES[bottleId].label);
 }
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
 pickNote(noteBtn.getAttribute('data-note'), { preferEmpty: true, fromEl: noteBtn });
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
 setInstallStep('kit');
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
 if (els.selected) els.selected.textContent = els.name.value.trim() || 'untitled formula';
 renderBottle();
 });
 }

 state.picks = new Array(activeKit().slots.length);

 showScreen('build');
})();
