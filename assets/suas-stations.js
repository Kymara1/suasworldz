const $ = (id) => document.getElementById(id);
const store = {
  get(key, fallback = null) {
    try { return JSON.parse(localStorage.getItem(`suas-station:${key}`)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(`suas-station:${key}`, JSON.stringify(value)); },
  remove(key) { localStorage.removeItem(`suas-station:${key}`); }
};

const productChoices = [
  { id: 'self-perfume', mode: 'self', name: 'Eau De Parfum', label: '30 mL Perfume / Cologne', volume: 30, source: '24 finished perfume-bar notes', size: 'round175' },
  { id: 'self-rollon', mode: 'self', name: 'Roll-On Perfume Oil', label: '10 mL Roll-On', volume: 10, source: '12 finished body-oil-bar notes', size: 'round125' },
  { id: 'self-oil', mode: 'self', name: 'Body Oil', label: '1 oz Body Oil', volume: 30, source: '12 finished body-oil-bar notes', size: 'rect13' },
  { id: 'guided-perfume', mode: 'guided', name: 'Eau De Parfum', label: '30 mL Perfume From Scratch', source: 'scent organ + perfumer base', size: 'round175' },
  { id: 'guided-oil', mode: 'guided', name: 'Body Oil', label: '1 oz Body Oil From Scratch', source: 'scent organ + chosen oil base', size: 'rect13' },
  { id: 'guided-butter', mode: 'guided', name: 'Butter Creme', label: '4 oz Butter Creme', source: 'pre-portioned creation kit', size: 'round175' },
  { id: 'guided-collection', mode: 'guided', name: 'Eau De Parfum', label: 'Signature Collection', source: 'perfume + body oil + butter creme', size: 'round175' }
];

const defaultScentCatalog = {
  perfume: ['JASMINE', 'MANDARIN', 'PLUM', 'VANILLA', 'AMBER', 'MUSK', 'ROSE', 'LAVENDER', 'BERGAMOT', 'LEMON', 'ORANGE BLOSSOM', 'PEAR', 'APPLE', 'PEACH', 'STRAWBERRY', 'COCONUT', 'CARAMEL', 'SANDALWOOD', 'CEDARWOOD', 'PATCHOULI', 'VETIVER', 'MINT', 'PINK PEPPER', 'TONKA BEAN'],
  oil: ['JASMINE', 'MANDARIN', 'PLUM', 'VANILLA', 'AMBER', 'MUSK', 'ROSE', 'PEAR', 'PEACH', 'STRAWBERRY', 'COCONUT', 'SANDALWOOD']
};
function getScentCatalog() {
  const saved = store.get('scentCatalog', defaultScentCatalog);
  return {
    perfume: Array.isArray(saved.perfume) && saved.perfume.length ? saved.perfume : defaultScentCatalog.perfume,
    oil: Array.isArray(saved.oil) && saved.oil.length ? saved.oil : defaultScentCatalog.oil
  };
}
function currentScentChoices() {
  const catalog = getScentCatalog();
  if (guideState.labMode === 'self') return guideState.product === 'self-perfume' ? catalog.perfume : catalog.oil;
  return [...new Set([...catalog.perfume, ...catalog.oil])];
}
const pieceChoices = [
  ['BRACELET', '$28'], ['NECKLACE', '$42'], ['BAG TAG', '$24'],
  ['BAG CHAIN', '$35'], ['KEYCHAIN', '$25'], ['NAME CHAIN', '$27']
];

const guides = {
  lab: {
    kicker: 'THE LAB / VISUAL GUIDE',
    label: 'THE LAB',
    steps: [
      { title: 'CHOOSE YOUR SESSION.', copy: 'Self-guided is beginner-friendly with finished dispenser notes. Guided classes create products from scratch with a specialist.', art: 'options', panel: 'mode' },
      { title: 'CHOOSE YOUR PRODUCT.', copy: 'Pick what you are making today. Your session determines which products and tools are available.', art: 'options', panel: 'product' },
      { title: 'BUILD YOUR FORMULA.', copy: 'Select up to four notes and record your choices before measuring.', art: 'notes', panel: 'notes' },
      { title: 'MEASURE + DISPENSE.', copy: 'Follow the measurement plan for your session and chosen bottle.', art: 'tools', panel: 'measure' },
      { title: 'MIX + FINISH.', copy: 'Combine, finish, and inspect the product using the process shown for your session.', art: 'bottle', panel: 'finish' },
      { title: 'NAME IT. LABEL IT.', copy: 'Give the creation a name, check the product type, and send it to Label Studio.', art: 'label', panel: 'label' }
    ]
  },
  charm: {
    kicker: 'THE CHARM BAR / VISUAL GUIDE',
    label: 'CHARM BAR',
    steps: [
      { title: 'PICK YOUR PIECE.', copy: 'Choose the base that fits your little extra. Each piece starts with five charms.', art: 'options', panel: 'piece' },
      { title: 'BROWSE + PICK ANY FIVE.', copy: 'Take a tray and choose any five charms from the full charm wall. No theme or charm list required.', art: 'tray', panel: 'browse' },
      { title: 'LAY THEM OUT.', copy: 'Keep the piece flat. Place each charm beside an attachment point and move them until the spacing feels balanced.', art: 'layout', panel: 'layout' },
      { title: 'OPEN. ATTACH. CLOSE.', copy: 'Twist each pre-attached jump ring sideways, hook it onto the piece, then twist it fully closed.', art: 'pliers', panel: 'attach' },
      { title: 'TUG TEST + WEAR.', copy: 'Gently tug every charm. Each jump ring should be fully closed with no visible gap.', art: 'check', panel: 'check' }
    ]
  }
};

let guideState = store.get('guide', { type: 'lab', step: 0, labMode: 'self', product: 'self-perfume', base: 'Glow Base', notes: [], piece: 'BRACELET', charms: [] });
guideState.labMode ||= 'self';
if (!productChoices.some((item) => item.id === guideState.product)) guideState.product = 'self-perfume';
guideState.notes = (guideState.notes || []).filter((note) => [...getScentCatalog().perfume, ...getScentCatalog().oil].includes(note));
let activeTemplate = store.get('labelTemplate', 'white');
let staffUnlocked = false;
let staffSetupMode = false;

function showView(id) {
  if (id === 'admin' && !staffUnlocked) { openStaffGate(); return; }
  document.querySelectorAll('.view').forEach((view) => view.classList.toggle('is-visible', view.id === id));
  document.querySelectorAll('[data-view]').forEach((button) => button.classList.toggle('is-active', button.dataset.view === id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (id === 'guide') renderGuide();
  if (id === 'accounts') renderAccountPanel();
  if (id === 'admin') updateAdminSettings();
}

document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
document.querySelectorAll('[data-staff-login]').forEach((button) => button.addEventListener('click', () => openStaffGate()));
document.querySelectorAll('[data-start-guide]').forEach((button) => button.addEventListener('click', () => {
  if (button.disabled) return;
  guideState.type = button.dataset.startGuide;
  guideState.step = 0;
  saveGuide();
  showView('guide');
}));

function saveGuide() {
  store.set('guide', guideState);
  updateAdminProgress();
}

async function hashPassword(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function openStaffGate(forceSetup = false) {
  staffSetupMode = forceSetup || !store.get('staffPasswordHash');
  $('staffGateTitle').innerHTML = staffSetupMode ? 'CREATE STAFF<br>PASSWORD.' : 'UNLOCK<br>SETTINGS.';
  $('staffGateCopy').textContent = staffSetupMode ? 'Create a password with at least six characters. It will protect Staff Settings on this iPad.' : 'Enter the station password to continue.';
  $('staffConfirmLabel').hidden = !staffSetupMode;
  $('staffPassword').value = '';
  $('staffPasswordConfirm').value = '';
  $('staffGateError').textContent = '';
  $('staffUnlock').innerHTML = staffSetupMode ? 'SAVE + UNLOCK <span>-></span>' : 'UNLOCK SETTINGS <span>-></span>';
  showView('staff-login');
}

$('staffLoginForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = $('staffPassword').value;
  if (staffSetupMode) {
    if (password.length < 6) { $('staffGateError').textContent = 'Use at least six characters.'; return; }
    if (password !== $('staffPasswordConfirm').value) { $('staffGateError').textContent = 'The passwords do not match.'; return; }
    store.set('staffPasswordHash', await hashPassword(password));
    staffSetupMode = false;
    staffUnlocked = true;
    showView('admin');
    return;
  }
  const enteredHash = await hashPassword(password);
  if (enteredHash !== store.get('staffPasswordHash')) { $('staffGateError').textContent = 'That password is not correct.'; return; }
  staffUnlocked = true;
  showView('admin');
});

function renderStageArt(type, step) {
  if (type === 'lab' && step.panel === 'mode') {
    return '<div class="art-options"><div class="art-card">SELF-GUIDED<small>FINISHED NOTES</small></div><div class="art-card">GUIDED CLASS<small>FROM SCRATCH</small></div></div>';
  }
  if (type === 'lab' && step.art === 'options') {
    return `<div class="art-options">${productChoices.filter((item) => item.mode === guideState.labMode).slice(0, 4).map((item) => `<div class="art-card">${item.label}<small>${item.source}</small></div>`).join('')}</div>`;
  }
  if (type === 'charm' && step.art === 'options') {
    return `<div class="art-options">${pieceChoices.slice(0, 4).map((item) => `<div class="art-card">${item[0]}<small>${item[1]}</small></div>`).join('')}</div>`;
  }
  if (step.art === 'notes') return `<div class="art-formula-flow"><div class="formula-notes">${(guideState.notes.length ? guideState.notes : ['NOTE 1', 'NOTE 2', 'NOTE 3']).map((note) => `<span>${note}</span>`).join('<b>+</b>')}</div><i>-&gt;</i><div class="formula-card"><small>WRITE IT DOWN</small><b>MY FORMULA</b><span>1 - 4 NOTES MAX</span></div></div>`;
  if (step.art === 'tools') return guideState.labMode === 'self'
    ? '<div class="art-measure-flow"><div class="measure-picture dispenser-picture"><b>1</b><span>PRESS DISPENSER</span></div><i>-&gt;</i><div class="measure-picture fill-picture"><b>2</b><span>STOP AT FILL LINE</span></div><i>-&gt;</i><div class="measure-picture cap-picture"><b>3</b><span>CAP BOTTLE</span></div></div>'
    : '<div class="art-measure-flow"><div class="measure-picture scale-picture"><b>1</b><span>TARE SCALE</span></div><i>-&gt;</i><div class="measure-picture drops-picture"><b>2</b><span>MEASURE DROPS</span></div><i>-&gt;</i><div class="measure-picture base-picture"><b>3</b><span>ADD BASE</span></div></div>';
  if (step.art === 'bottle') return '<div class="art-bottle"><div class="mix-vessel"><span>MIX</span></div><b class="mix-arrow">-&gt;</b><div class="finish-product"><span>FINISH</span></div></div>';
  if (step.art === 'label') return `<div class="art-label"><img src="${window.SUAS_STATION_LOGO || ''}" alt=""><b>${productChoices.find((item) => item.id === guideState.product)?.label || 'YOUR BLEND'}</b></div>`;
  if (step.art === 'tray') return '<div class="art-tray"><b>YOUR TRAY</b><div class="tray-spots"><i>1</i><i>2</i><i>3</i><i>4</i><i>5</i></div><small>ANY FIVE CHARMS FROM THE WALL</small></div>';
  if (step.art === 'layout') return `<div class="art-layout">${[1,2,3,4,5].map((number) => `<div class="layout-slot"><i>${number}</i><b>&darr;</b><span></span></div>`).join('')}</div>`;
  if (step.art === 'pliers') return '<div class="art-pliers"><div class="plier-step"><div class="plier-icon"></div><b>1. OPEN</b><small>TWIST SIDEWAYS</small></div><div class="plier-step"><div class="ring-icon is-open">+</div><b>2. ATTACH</b><small>HOOK ONTO PIECE</small></div><div class="plier-step"><div class="ring-icon is-closed">&#10003;</div><b>3. CLOSE</b><small>ENDS TOUCH / NO GAP</small></div></div>';
  return '<div class="art-chain"><div class="chain-check"><i>&#10003;</i><b>RING CLOSED</b></div><div class="chain-check"><i>&harr;</i><b>GENTLE TUG</b></div><div class="chain-check"><i>*</i><b>READY TO WEAR</b></div></div>';
}

function choiceButton(label, selected, attrs = '') {
  return `<button class="selection-choice${selected ? ' is-selected' : ''}" ${attrs} type="button">${label}</button>`;
}

function numberedBoard(title, items) {
  return `<div class="measure-board"><strong>${title}</strong>${items.map((item, index) => `<span><i>${String(index + 1).padStart(2, '0')}</i>${item}</span>`).join('')}</div>`;
}

function renderLabMeasurePanel() {
  const product = productChoices.find((item) => item.id === guideState.product) || productChoices[0];
  if (guideState.labMode === 'self') {
    const noteCount = Math.max(1, guideState.notes.length);
    const eachAmount = Math.round((product.volume / noteCount) * 10) / 10;
    return numberedBoard(`${product.volume} mL / ${noteCount}-NOTE PLAN`, [
      `Start with the clean ${product.label} bottle supplied for your experiment.`,
      `Use only the finished notes at the ${product.id === 'self-perfume' ? 'perfume bar' : 'body oil bar'}; the product base is already included.`,
      `For an equal blend, dispense ${eachAmount} mL of each selected note. Your total target is ${product.volume} mL.`,
      'Stop at the marked fill line. If the dispenser is pump-counted, use the conversion label posted at the bar.'
    ]);
  }
  const guidedPlans = {
    'guided-perfume': ['Tare the mixing vessel on the scale.', 'Measure each fragrance oil from the scent organ using the live formula worksheet.', 'Add your perfumer base from the squeeze bottle to the specialist-provided 30 mL target.', 'Mix, check, and transfer into the finishing bottle.'],
    'guided-oil': ['Choose Glow, Silky Dry, or Rich Body Oil Base.', 'Tare the mixing vessel and measure fragrance oils from the scent organ using the live formula worksheet.', 'Add the selected oil base to the specialist-provided 1 oz / 30 mL target.', 'Mix completely, then transfer to the finishing bottle.'],
    'guided-butter': ['Open the pre-portioned 4 oz butter creme creation kit.', 'Measure fragrance oils using the live formula worksheet and scale.', 'Fold the measured scent into the butter creme until completely even.', 'Pipe or spoon the finished butter creme into the finishing jar.'],
    'guided-collection': ['Complete the 30 mL perfume worksheet with the scent organ and perfumer base.', 'Choose and complete the 1 oz body oil base formula.', 'Scent the pre-portioned 4 oz butter creme kit.', 'Finish and label all three pieces as one signature collection.']
  };
  return numberedBoard('SPECIALIST-GUIDED MEASUREMENT', guidedPlans[product.id] || guidedPlans['guided-perfume']);
}

function renderLabFinishPanel() {
  const product = productChoices.find((item) => item.id === guideState.product) || productChoices[0];
  if (guideState.labMode === 'self') {
    const directions = product.id === 'self-rollon'
      ? ['Press in the roller fitment and tighten the cap.', 'Gently roll the bottle between your palms to combine.', 'Check for leaks and wipe the bottle clean.']
      : ['Secure the cap before mixing.', 'Shake until the finished notes look completely even.', 'Check the fill line, leaks, and bottle exterior.'];
    return numberedBoard('BEGINNER FINISH', directions);
  }
  if (product.id === 'guided-butter') return numberedBoard('PIPE + JAR', ['Confirm the scent is evenly mixed.', 'Pipe or spoon into the finishing jar.', 'Smooth the top, close the jar, and wipe it clean.']);
  return numberedBoard('SPECIALIST FINAL CHECK', ['Mix the from-scratch formula until fully uniform.', 'Transfer into the correct finishing bottle or jar.', 'Close securely and review the finished product with your specialist.']);
}

function renderSelectionPanel(step) {
  const panel = $('selectionPanel');
  if (!panel) return;
  if (step.panel === 'mode') {
    const available = store.get('experienceAvailability', { self: true, guided: true, charm: true });
    panel.innerHTML = `<p class="selection-title">HOW ARE YOU CREATING?</p><div class="selection-grid">${choiceButton(`SELF-GUIDED<small>${available.self ? 'BEGINNER / NO EXPERIENCE NEEDED' : 'CURRENTLY UNAVAILABLE'}</small>`, guideState.labMode === 'self', `data-mode="self"${available.self ? '' : ' disabled'}`)}${choiceButton(`GUIDED CLASS<small>${available.guided ? '90 MIN / BOOKING ONLY' : 'CURRENTLY UNAVAILABLE'}</small>`, guideState.labMode === 'guided', `data-mode="guided"${available.guided ? '' : ' disabled'}`)}</div><p class="selection-message">Self-guided uses finished scent notes. Guided classes make products from scratch with you or a scent specialist.</p>`;
    panel.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => {
      guideState.labMode = button.dataset.mode;
      guideState.product = button.dataset.mode === 'self' ? 'self-perfume' : 'guided-perfume';
      guideState.notes = [];
      saveGuide(); renderGuide();
    }));
    return;
  }
  if (step.panel === 'product') {
    const availableProducts = productChoices.filter((item) => item.mode === guideState.labMode);
    panel.innerHTML = `<p class="selection-title">WHAT ARE YOU MAKING?</p><div class="selection-grid">${availableProducts.map((item) => choiceButton(`${item.label}<small>${item.source}</small>`, guideState.product === item.id, `data-product="${item.id}"`)).join('')}</div>`;
    panel.querySelectorAll('[data-product]').forEach((button) => button.addEventListener('click', () => { guideState.product = button.dataset.product; guideState.notes = []; saveGuide(); renderGuide(); }));
    return;
  }
  if (step.panel === 'notes') {
    const guidedOil = guideState.product === 'guided-oil' || guideState.product === 'guided-collection';
    const selfSource = guideState.product === 'self-perfume' ? 'Choose from the 24 finished perfume-bar notes. No alcohol or perfume-base mixing is needed.' : 'Choose from the 12 finished body-oil-bar notes. The body oil base is already blended.';
    const guidedSource = guideState.product === 'guided-butter' ? 'Your specialist presents the history, fun facts, and mixology lesson before you scent the pre-portioned butter creme kit.' : 'Your specialist presents the history, fun facts, and mixology lesson before you build a formula from the scent organ.';
    const scentChoices = currentScentChoices();
    panel.innerHTML = `${guidedOil ? `<p class="selection-title">CHOOSE YOUR BODY OIL BASE</p><div class="selection-grid compact">${['Glow Base', 'Silky Dry Oil Base', 'Rich Body Oil'].map((base) => choiceButton(base, guideState.base === base, `data-base="${base}"`)).join('')}</div>` : ''}<div class="track-note">${guideState.labMode === 'self' ? selfSource : guidedSource}</div><p class="selection-title">SCENT NAMES <span>${guideState.notes.length}/4</span></p><div class="selection-grid compact scent-name-grid">${scentChoices.map((note) => choiceButton(note, guideState.notes.includes(note), `data-note="${note}"`)).join('')}</div><p class="selection-message" id="selectionMessage">Choose the exact names used in this creation. Select up to four.</p>`;
    panel.querySelectorAll('[data-base]').forEach((button) => button.addEventListener('click', () => { guideState.base = button.dataset.base; saveGuide(); renderGuide(); }));
    panel.querySelectorAll('[data-note]').forEach((button) => button.addEventListener('click', () => {
      const note = button.dataset.note;
      if (guideState.notes.includes(note)) guideState.notes = guideState.notes.filter((item) => item !== note);
      else if (guideState.notes.length < 4) guideState.notes.push(note);
      else { $('selectionMessage').textContent = 'Four notes is the maximum. Remove one before choosing another.'; return; }
      saveGuide(); renderGuide();
    }));
    return;
  }
  if (step.panel === 'piece') {
    panel.innerHTML = `<p class="selection-title">CHOOSE YOUR BASE PIECE</p><div class="selection-grid">${pieceChoices.map((item) => choiceButton(`${item[0]}<small>${item[1]}</small>`, guideState.piece === item[0], `data-piece="${item[0]}"`)).join('')}</div>`;
    panel.querySelectorAll('[data-piece]').forEach((button) => button.addEventListener('click', () => { guideState.piece = button.dataset.piece; saveGuide(); renderGuide(); }));
    return;
  }
  if (step.panel === 'browse') {
    panel.innerHTML = numberedBoard('BROWSE THE FULL CHARM WALL', ['Take one empty tray.', 'Choose any five charms you love. There is no required theme.', 'Place each choice in your tray. Do not attach anything yet.', 'Additional charms can be added after your included five.']);
    return;
  }
  if (guideState.type === 'lab' && step.panel ===…686 tokens truncated…aveGuideFormula').textContent = guideState.type === 'lab' ? 'SAVE FORMULA' : 'SAVE PLAN';
  saveGuide();
}

$('previousStep')?.addEventListener('click', () => { guideState.step = Math.max(0, guideState.step - 1); saveGuide(); renderGuide(); });
$('nextStep')?.addEventListener('click', () => {
  const guide = guides[guideState.type];
  if (guideState.step < guide.steps.length - 1) { guideState.step += 1; saveGuide(); renderGuide(); return; }
  if (guideState.type === 'lab') { sendGuideToStudio(); showView('studio'); }
  else { store.remove('guide'); guideState.step = 0; showView('home'); }
});
$('restartGuide')?.addEventListener('click', () => { guideState.step = 0; guideState.notes = []; guideState.charms = []; saveGuide(); renderGuide(); });
$('saveGuideFormula')?.addEventListener('click', () => {
  if (!getActiveAccount()) {
    store.set('pendingFormulaSave', true);
    store.set('accountNotice', 'Sign in or create an account to save this formula.');
    showView('accounts');
    return;
  }
  saveCurrentCreation();
  showView('accounts');
});

function sendGuideToStudio() {
  const product = productChoices.find((item) => item.id === guideState.product) || productChoices[0];
  $('labelProductType').value = product.name;
  $('sizeSelect').value = product.size;
  $('scentNotes').value = guideState.notes.length ? guideState.notes.join(' / ') : 'YOUR SCENT NOTES';
  syncLabelPreview();
}

const oilBases = [
  { name: 'Glow Base', feel: 'balanced + luminous', ingredients: ['Jojoba Oil', 'Sunflower Oil', 'Rice Bran Oil', 'Castor Oil', 'Fractionated Coconut Oil', 'Vitamin E Oil'] },
  { name: 'Silky Dry Oil Base', feel: 'light + quick-dry feel', ingredients: ['Jojoba Oil', 'Grapeseed Oil', 'Fractionated Coconut Oil', 'IPM', 'Vitamin E Oil'] },
  { name: 'Rich Body Oil', feel: 'cushiony + deeply conditioned', ingredients: ['Sunflower Oil', 'Jojoba Oil', 'Rice Bran Oil', 'Vitamin E Oil'] }
];
const oilDetails = {
  'Jojoba Oil': 'A lightweight liquid wax that gives the blend smooth slip and skin-friendly moisture without a heavy finish.',
  'Sunflower Oil': 'A light emollient that supports softness and gives body oil an easy, comfortable glide.',
  'Rice Bran Oil': 'Adds richer slip and a conditioned feel, making the blend feel plush on dry skin.',
  'Castor Oil': 'A thicker oil that adds gloss, cushion, and structure to the finished blend.',
  'Fractionated Coconut Oil': 'A lightweight carrier that spreads easily and helps fragrance distribute evenly.',
  'Vitamin E Oil': 'Adds conditioning and antioxidant support to help maintain the oil blend.',
  'Grapeseed Oil': 'A light-feeling oil that contributes silky glide without much weight.',
  'IPM': 'A dry-touch cosmetic ester used to reduce a greasy feel and improve spreadability.'
};
let activeBase = 0;
function renderOilBook() {
  const base = oilBases[activeBase];
  $('baseTabs').innerHTML = oilBases.map((item, index) => `<button class="${index === activeBase ? 'is-active' : ''}" data-base-index="${index}" type="button">${item.name}</button>`).join('');
  $('oilName').textContent = base.name.toUpperCase();
  $('oilFeel').textContent = base.feel;
  $('ingredientList').innerHTML = base.ingredients.map((item, index) => `<button data-ingredient="${item}" class="${index === 0 ? 'is-active' : ''}" type="button">${item}</button>`).join('');
  showIngredient(base.ingredients[0]);
  $('baseTabs').querySelectorAll('[data-base-index]').forEach((button) => button.addEventListener('click', () => { activeBase = Number(button.dataset.baseIndex); renderOilBook(); }));
  $('ingredientList').querySelectorAll('[data-ingredient]').forEach((button) => button.addEventListener('click', () => {
    $('ingredientList').querySelectorAll('button').forEach((item) => item.classList.remove('is-active'));
    button.classList.add('is-active'); showIngredient(button.dataset.ingredient);
  }));
}
function showIngredient(name) { $('ingredientDetail').innerHTML = `<small>INGREDIENT ENCYCLOPEDIA</small><h3>${name.toUpperCase()}</h3><p>${oilDetails[name]}</p>`; }

function syncLabelPreview() {
  const preview = $('labelPreview');
  const isRect = $('sizeSelect').value === 'rect13';
  preview.classList.toggle('is-rect', isRect);
  preview.classList.toggle('is-round', !isRect);
  preview.classList.remove('theme-white', 'theme-pink', 'theme-black');
  preview.classList.add(`theme-${activeTemplate}`);
  $('previewProduct').textContent = $('productName').value.trim().toUpperCase() || 'YOUR BLEND';
  $('previewProductType').textContent = $('labelProductType').value.toUpperCase();
  $('previewCustomer').textContent = $('customerName').value.trim().toUpperCase() || 'MIXED BY GUEST';
  $('previewNotes').textContent = $('scentNotes').value.trim().toUpperCase() || 'YOUR SCENT NOTES';
  $('previewCustomer').style.fontFamily = $('customerFont').value === 'casual' ? 'CasualHuman' : 'Futura, Arial, sans-serif';
  $('previewNotes').style.fontFamily = $('notesFont').value === 'casual' ? 'CasualHuman' : 'Futura, Arial, sans-serif';
}

['labelProductType', 'sizeSelect', 'productName', 'customerName', 'scentNotes', 'customerFont', 'notesFont'].forEach((id) => $(id)?.addEventListener('input', syncLabelPreview));
document.querySelectorAll('[data-template]').forEach((button) => button.addEventListener('click', () => {
  activeTemplate = button.dataset.template;
  document.querySelectorAll('[data-template]').forEach((item) => item.classList.toggle('is-active', item === button));
  store.set('labelTemplate', activeTemplate); syncLabelPreview();
}));
$('saveLabel')?.addEventListener('click', () => {
  store.set('labelDraft', { productType: $('labelProductType').value, size: $('sizeSelect').value, name: $('productName').value, customer: $('customerName').value, notes: $('scentNotes').value, customerFont: $('customerFont').value, notesFont: $('notesFont').value, template: activeTemplate });
  $('studioStatus').textContent = 'Draft saved on this iPad.';
});
$('printLabel')?.addEventListener('click', () => { $('studioStatus').textContent = 'Opening the iPad print dialog...'; window.print(); });

function loadLabelDraft() {
  const draft = store.get('labelDraft');
  if (!draft) return;
  $('labelProductType').value = draft.productType || 'Eau De Parfum';
  $('sizeSelect').value = draft.size || 'round175';
  $('productName').value = draft.name || 'MIDNIGHT HONEY';
  $('customerName').value = draft.customer || 'MIXED BY AMARA';
  $('scentNotes').value = draft.notes || 'VANILLA / AMBER / SOFT MUSK';
  $('customerFont').value = draft.customerFont || 'futura';
  $('notesFont').value = draft.notesFont || 'futura';
  activeTemplate = draft.template || 'white';
  document.querySelectorAll('[data-template]').forEach((item) => item.classList.toggle('is-active', item.dataset.template === activeTemplate));
}

function updateAdminProgress() {
  if (!$('savedProgress')) return;
  const guide = guides[guideState.type];
  $('savedProgress').textContent = guide ? `${guide.label} / STEP ${guideState.step + 1} OF ${guide.steps.length}` : 'NO ACTIVE GUIDE';
}

function getAccounts() { return store.get('accounts', []); }
function getActiveAccount() {
  const email = store.get('activeAccount');
  return getAccounts().find((account) => account.email === email) || null;
}
function accountTabs(active) {
  return `<div class="account-tabs"><button class="${active === 'create' ? 'is-active' : ''}" data-account-mode="create" type="button">CREATE ACCOUNT</button><button class="${active === 'signin' ? 'is-active' : ''}" data-account-mode="signin" type="button">SIGN IN</button></div>`;
}
function bindAccountTabs() {
  $('accountPanel')?.querySelectorAll('[data-account-mode]').forEach((button) => button.addEventListener('click', () => renderAccountPanel(button.dataset.accountMode)));
}
function renderAccountPanel(mode = 'signin') {
  const panel = $('accountPanel');
  if (!panel) return;
  const active = getActiveAccount();
  if (active) {
    const creations = active.creations || [];
    panel.innerHTML = `<div class="account-dashboard"><div class="account-userbar"><div><i>${active.name.slice(0, 1).toUpperCase()}</i></div><button class="secondary-command" id="accountSignOut" type="button">SIGN OUT</button></div><p class="eyebrow">SIGNED IN AS ${active.email}</p><h3>HEY, ${active.name.toUpperCase()}.</h3><p>Your saved formulas and Charm Bar plans live on this station.</p><div class="creation-list">${creations.length ? creations.map((item) => `<article class="creation-card"><b>${item.title}</b><span>${item.type}</span><small>${item.details} / ${item.date}</small><button class="creation-delete" data-delete-creation="${item.id}" type="button">DELETE</button></article>`).join('') : '<div class="empty-creations">NO SAVED CREATIONS YET.</div>'}</div><button class="primary-command" id="saveCreation" type="button">SAVE CURRENT CREATION <span>+</span></button><p class="account-error" id="accountMessage"></p></div>`;
    $('accountSignOut').addEventListener('click', () => { store.remove('activeAccount'); renderAccountPanel('signin'); updateAdminSettings(); });
    $('saveCreation').addEventListener('click', saveCurrentCreation);
    panel.querySelectorAll('[data-delete-creation]').forEach((button) => button.addEventListener('click', () => {
      if (button.dataset.armed !== 'true') {
        button.dataset.armed = 'true'; button.textContent = 'DELETE?';
        setTimeout(() => { if (button.isConnected) { button.dataset.armed = 'false'; button.textContent = 'DELETE'; } }, 4000);
        return;
      }
      const accounts = getAccounts();
      const saved = accounts.find((item) => item.email === active.email);
      saved.creations = (saved.creations || []).filter((item) => item.id !== button.dataset.deleteCreation);
      store.set('accounts', accounts); renderAccountPanel(); updateAdminSettings();
    }));
    if (store.get('pendingFormulaSave', false)) {
      store.remove('pendingFormulaSave');
      setTimeout(() => saveCurrentCreation(), 0);
    } else {
      const savedNotice = store.get('accountNotice', '');
      if (savedNotice) { $('accountMessage').textContent = savedNotice; store.remove('accountNotice'); }
    }
    return;
  }
  const notice = store.get('accountNotice', '');
  if (mode === 'create') {
    panel.innerHTML = `${accountTabs('create')}<form class="account-form" id="createAccountForm"><p class="account-notice">${notice}</p><p class="eyebrow">NEW STATION PROFILE</p><h3>START YOUR<br>FORMULA BOOK.</h3><p>This profile is stored on this iPad. Use a four-digit PIN you can remember.</p><label>NAME<input id="newAccountName" autocomplete="name" required></label><label>EMAIL<input id="newAccountEmail" type="email" autocomplete="email" required></label><label>4-DIGIT PIN<input id="newAccountPin" type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" required></label><label>CONFIRM PIN<input id="newAccountConfirm" type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" required></label><p class="account-error" id="accountError"></p><button class="primary-command" type="submit">CREATE + SIGN IN <span>-&gt;</span></button></form>`;
    bindAccountTabs();
    $('createAccountForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = $('newAccountName').value.trim();
      const email = $('newAccountEmail').value.trim().toLowerCase();
      const pin = $('newAccountPin').value;
      if (!/^\d{4}$/.test(pin)) { $('accountError').textContent = 'Use exactly four numbers.'; return; }
      if (pin !== $('newAccountConfirm').value) { $('accountError').textContent = 'The PINs do not match.'; return; }
      const accounts = getAccounts();
      if (accounts.some((account) => account.email === email)) { $('accountError').textContent = 'An account with that email already exists on this iPad.'; return; }
      accounts.push({ id: crypto.randomUUID(), name, email, pinHash: await hashPassword(pin), creations: [] });
      store.set('accounts', accounts); store.set('activeAccount', email); renderAccountPanel(); updateAdminSettings();
    });
    return;
  }
  panel.innerHTML = `${accountTabs('signin')}<form class="account-form" id="signInAccountForm"><p class="account-notice">${notice}</p><p class="eyebrow">WELCOME BACK</p><h3>OPEN YOUR<br>FORMULA BOOK.</h3><p>Sign in to save today's creation with your others.</p><label>EMAIL<input id="accountEmail" type="email" autocomplete="email" required></label><label>4-DIGIT PIN<input id="accountPin" type="password" inputmode="numeric" maxlength="4" required></label><p class="account-error" id="accountError"></p><button class="primary-command" type="submit">SIGN IN <span>-&gt;</span></button></form>`;
  bindAccountTabs();
  $('signInAccountForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = $('accountEmail').value.trim().toLowerCase();
    const account = getAccounts().find((item) => item.email === email);
    if (!account || account.pinHash !== await hashPassword($('accountPin').value)) { $('accountError').textContent = 'That email or PIN is not correct.'; return; }
    store.set('activeAccount', email); renderAccountPanel(); updateAdminSettings();
  });
}
function saveCurrentCreation() {
  const account = getActiveAccount();
  if (!account) return;
  const product = productChoices.find((item) => item.id === guideState.product);
  const isCharm = guideState.type === 'charm';
  const title = isCharm ? `${guideState.piece} PLAN` : ($('productName')?.value.trim() || product?.label || 'MY FORMULA').toUpperCase();
  const details = isCharm ? 'Any five charms / DIY attachment' : `${guideState.notes.length ? guideState.notes.join(' + ') : 'Notes not entered'}${guideState.base ? ` / ${guideState.base}` : ''}`;
  const accounts = getAccounts();
  const saved = accounts.find((item) => item.email === account.email);
  saved.creations ||= [];
  saved.creations.unshift({ id: crypto.randomUUID(), title, type: isCharm ? 'CHARM BAR' : (product?.label || 'THE LAB'), details, date: new Date().toLocaleDateString() });
  store.set('accounts', accounts);
  renderAccountPanel();
  $('accountMessage').textContent = 'Saved to your formula book.';
}

function updateScentCatalogFields() {
  const catalog = getScentCatalog();
  if ($('perfumeScentCatalog')) $('perfumeScentCatalog').value = catalog.perfume.join('\n');
  if ($('oilScentCatalog')) $('oilScentCatalog').value = catalog.oil.join('\n');
}

function updateAdminSettings() {
  updateAdminProgress();
  const availability = store.get('experienceAvailability', { self: true, guided: true, charm: true });
  if ($('enableSelfGuided')) $('enableSelfGuided').checked = availability.self;
  if ($('enableGuided')) $('enableGuided').checked = availability.guided;
  if ($('enableCharm')) $('enableCharm').checked = availability.charm;
  const open = store.get('stationOpen', true);
  if ($('stationModeText')) $('stationModeText').textContent = open ? 'OPEN + READY' : 'CLOSED / STAFF PAUSED';
  if ($('toggleStationMode')) $('toggleStationMode').textContent = open ? 'CLOSE STATION' : 'OPEN STATION';
  if ($('guestAccountCount')) $('guestAccountCount').textContent = `${getAccounts().length} SAVED`;
  updateScentCatalogFields();
  const status = document.querySelector('.lab-status b');
  if (status) status.textContent = open ? 'OPEN + MIXING' : 'STAFF PAUSED';
  applyExperienceAvailability();
}
function applyExperienceAvailability() {
  const available = store.get('experienceAvailability', { self: true, guided: true, charm: true });
  const open = store.get('stationOpen', true);
  document.querySelectorAll('[data-start-guide]').forEach((button) => {
    const enabled = button.dataset.startGuide === 'charm' ? available.charm : (available.self || available.guided);
    button.disabled = !open || !enabled;
    button.title = button.disabled ? (open ? 'This experience is unavailable right now.' : 'This station is currently closed by staff.') : '';
  });
}
$('saveExperiences')?.addEventListener('click', () => {
  store.set('experienceAvailability', { self: $('enableSelfGuided').checked, guided: $('enableGuided').checked, charm: $('enableCharm').checked });
  applyExperienceAvailability(); $('saveExperiences').textContent = 'SAVED'; setTimeout(() => { $('saveExperiences').textContent = 'SAVE AVAILABILITY'; }, 1200);
});
$('toggleStationMode')?.addEventListener('click', () => { store.set('stationOpen', !store.get('stationOpen', true)); updateAdminSettings(); });
$('signOutGuest')?.addEventListener('click', () => { store.remove('activeAccount'); updateAdminSettings(); });
$('clearLabelDraft')?.addEventListener('click', () => { store.remove('labelDraft'); $('clearLabelDraft').textContent = 'DRAFT CLEARED'; });
$('saveScentCatalog')?.addEventListener('click', () => {
  const cleanNames = (value, limit) => [...new Set(value.split(/\r?\n|,/).map((name) => name.trim().toUpperCase()).filter(Boolean))].slice(0, limit);
  const perfume = cleanNames($('perfumeScentCatalog').value, 24);
  const oil = cleanNames($('oilScentCatalog').value, 12);
  if (!perfume.length || !oil.length) { $('saveScentCatalog').textContent = 'ADD NAMES FIRST'; return; }
  store.set('scentCatalog', { perfume, oil });
  guideState.notes = guideState.notes.filter((note) => [...perfume, ...oil].includes(note));
  saveGuide(); $('saveScentCatalog').textContent = 'SCENT NAMES SAVED';
  setTimeout(() => { if ($('saveScentCatalog')) $('saveScentCatalog').textContent = 'SAVE SCENT NAMES'; }, 1400);
});
$('exportAccounts')?.addEventListener('click', () => {
  const rows = [['Account ID', 'Guest Name', 'Email', 'Saved Item ID', 'Saved Item Name', 'Type', 'Formula / Details', 'Saved Date']];
  getAccounts().forEach((account) => {
    const creations = account.creations?.length ? account.creations : [{}];
    creations.forEach((item) => rows.push([account.id, account.name, account.email, item.id || '', item.title || '', item.type || '', item.details || '', item.date || '']));
  });
  const csv = '\ufeff' + rows.map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `suas-saved-accounts-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(link.href);
});
let clearAccountsArmed = false;
$('clearAllGuestData')?.addEventListener('click', () => {
  if (!clearAccountsArmed) { clearAccountsArmed = true; $('clearAllGuestData').textContent = 'TAP AGAIN TO CONFIRM'; setTimeout(() => { clearAccountsArmed = false; if ($('clearAllGuestData')) $('clearAllGuestData').textContent = 'CLEAR ALL GUEST ACCOUNTS'; }, 5000); return; }
  store.remove('accounts'); store.remove('activeAccount'); clearAccountsArmed = false; $('clearAllGuestData').textContent = 'ALL ACCOUNTS CLEARED'; updateAdminSettings();
});
const stationName = store.get('stationName', 'MIXING STATION 01');
if ($('stationName')) $('stationName').value = stationName;
$('saveStation')?.addEventListener('click', () => { store.set('stationName', $('stationName').value.trim() || 'MIXING STATION 01'); $('saveStation').textContent = 'SAVED'; setTimeout(() => { $('saveStation').textContent = 'SAVE STATION'; }, 1400); });
$('clearProgress')?.addEventListener('click', () => { store.remove('guide'); guideState = { type: 'lab', step: 0, labMode: 'self', product: 'self-perfume', base: 'Glow Base', notes: [], piece: 'BRACELET', charms: [] }; updateAdminProgress(); });
$('testPrint')?.addEventListener('click', () => showView('studio'));
$('lockStaff')?.addEventListener('click', () => { staffUnlocked = false; showView('home'); });
$('resetStaffPassword')?.addEventListener('click', () => { store.remove('staffPasswordHash'); staffUnlocked = false; openStaffGate(true); });

renderOilBook();
loadLabelDraft();
syncLabelPreview();
updateAdminProgress();
updateAdminSettings();
showView('home');
