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
let pendingGuideType = 'lab';
let activeGuest = store.get('activeGuest', null);
let currentView = 'home';
let pendingStaffView = 'admin';

function showView(id) {
  if (['admin', 'instructor'].includes(id) && !staffUnlocked) { pendingStaffView = id; openStaffGate(); return; }
  currentView = id;
  document.querySelectorAll('.view').forEach((view) => view.classList.toggle('is-visible', view.id === id));
  document.querySelectorAll('[data-view]').forEach((button) => button.classList.toggle('is-active', button.dataset.view === id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (id === 'guide') renderGuide();
  if (id === 'summary') renderSummary();
  if (id === 'accounts') renderAccountPanel();
  if (id === 'admin') { updateAdminSettings(); populateGuidedSettings(); }
  if (id === 'guided') renderGuidedExperience();
  if (id === 'instructor') renderInstructorDashboard();
  if ($('needHelp')) $('needHelp').hidden = ['home', 'checkin', 'staff-login', 'admin', 'instructor', 'finish'].includes(id);
  updateHelpButton();
  resetIdleTimer();
}

document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => {
  const destination = button.dataset.view;
  showView(destination === 'checkin' && activeGuest ? 'guides' : destination);
}));
document.querySelectorAll('[data-staff-login]').forEach((button) => button.addEventListener('click', () => openStaffGate()));
document.querySelectorAll('[data-staff-view]').forEach((button) => button.addEventListener('click', () => { pendingStaffView = button.dataset.staffView; showView(button.dataset.staffView); }));
document.querySelectorAll('[data-start-guide]').forEach((button) => button.addEventListener('click', () => {
  if (button.disabled) return;
  pendingGuideType = button.dataset.startGuide;
  if (pendingGuideType === 'charm') {
    if (guideState.type !== 'charm') {
      guideState.type = 'charm';
      guideState.step = 0;
      guideState.charms = [];
      saveGuide();
    }
    showView('guide');
    return;
  }
  if (activeGuest) {
    if (pendingGuideType === 'lab' && activeGuest.experience === 'lab-guided' && guidedState) {
      showView('guided');
      return;
    }
    if (guideState.type !== pendingGuideType) {
      guideState.type = pendingGuideType;
      guideState.labMode = pendingGuideType === 'lab' ? 'self' : guideState.labMode;
      guideState.product = pendingGuideType === 'lab' ? 'self-perfume' : guideState.product;
      guideState.step = 0;
      guideState.notes = [];
      guideState.charms = [];
      saveGuide();
    }
    showView('guide');
    return;
  }
  if ($('checkinExperience')) $('checkinExperience').value = pendingGuideType === 'charm' ? 'charm' : 'lab-self';
  syncGuidedCheckin();
  showView('checkin');
}));

function syncGuidedCheckin() {
  const guided = $('checkinExperience')?.value === 'lab-guided';
  if ($('guidedCheckinFields')) $('guidedCheckinFields').hidden = !guided;
  if (!$('reservationSummary')) return;
  const selected = guidedExperiences[$('guidedPurchase')?.value] || guidedExperiences['guided-perfume'];
  const candle = getGuidedSettings().candle;
  $('reservationSummary').innerHTML = guided ? `<small>RESERVATION FILE</small><b>${selected.name}</b><span>${selected.products.map(moduleLabel).join(' + ')}${selected.products.includes('candle') ? ` / ${dayName(candle.day)} ONLY / $${candle.price}` : ''}</span>` : '';
}
$('checkinExperience')?.addEventListener('change', syncGuidedCheckin);
$('guidedPurchase')?.addEventListener('change', syncGuidedCheckin);

$('checkinForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = $('checkinName').value.trim();
  const experience = $('checkinExperience').value;
  const party = Math.max(1, Math.min(12, Number($('checkinParty').value) || 1));
  if (!name) { $('checkinError').textContent = 'Add your first name to begin.'; return; }
  activeGuest = { name, email: $('checkinEmail').value.trim().toLowerCase(), party, experience, startedAt: new Date().toISOString() };
  store.set('activeGuest', activeGuest);
  guideState.type = experience === 'charm' ? 'charm' : 'lab';
  guideState.labMode = experience === 'lab-guided' ? 'guided' : 'self';
  guideState.product = guideState.labMode === 'guided' ? 'guided-perfume' : 'self-perfume';
  guideState.step = 0;
  guideState.notes = [];
  guideState.charms = [];
  saveGuide();
  if ($('customerName')) $('customerName').value = `MIXED BY ${name.toUpperCase()}`;
  if (experience === 'lab-guided') {
    startGuidedSession({
      guest: name,
      email: activeGuest.email,
      party,
      station: Number($('guidedStation')?.value || 1),
      purchase: $('guidedPurchase')?.value || 'guided-perfume'
    });
    showView('guided');
  } else showView('guide');
});

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
    showView(pendingStaffView);
    return;
  }
  const enteredHash = await hashPassword(password);
  if (enteredHash !== store.get('staffPasswordHash')) { $('staffGateError').textContent = 'That password is not correct.'; return; }
  staffUnlocked = true;
  showView(pendingStaffView);
});

function operationDemo(title, instruction, body, className = '') {
  return `<div class="operation-demo ${className}">
    <div class="operation-demo__bar"><span>WATCH IT HAPPEN</span><b>LOOPING DEMO</b></div>
    <div class="operation-demo__stage">${body}</div>
    <div class="operation-demo__caption"><strong>${title}</strong><span>${instruction}</span></div>
  </div>`;
}

function charmLayoutDemo() {
  return operationDemo('LAY IT OUT BEFORE YOU ATTACH', 'Keep the piece flat. Slide each loose charm beside an attachment point until the spacing looks balanced.', `<div class="layout-demo">
    <div class="layout-demo__base">${[1,2,3,4,5].map((n) => `<i><small>${n}</small></i>`).join('')}</div>
    <div class="layout-demo__charms">${['★','♥','S','✿','◆'].map((mark, index) => `<b style="--move:${index}">${mark}</b>`).join('')}</div>
    <span>MOVE FIRST</span><em>ATTACH SECOND</em>
  </div>`, 'layout-operation');
}

function jumpRingDemo() {
  return operationDemo('OPEN. ATTACH. CLOSE.', 'Use two pliers. Twist the seam sideways, hook the charm and piece onto the ring, then reverse the twist until both cut ends touch.', `<div class="jump-photo-demo" aria-label="Three close-up photos showing how to open, attach, and close a jump ring with two pliers">
    <img src="${"data:image/webp;base64,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"}" alt="Three-step jump ring guide: twist open sideways, hook onto both pieces, then twist closed with no gap">
    <div class="jump-photo-demo__labels"><span><b>01</b> TWIST OPEN SIDEWAYS</span><span><b>02</b> HOOK ON BOTH PIECES</span><span><b>03</b> TWIST CLOSED / NO GAP</span></div>
    <div class="jump-demo__warning"><b>TWIST SIDEWAYS.</b> <strong>DO NOT PULL THE RING WIDER.</strong></div>
  </div>`, 'jump-operation');
}

function charmWallDemo() {
  return operationDemo('BROWSE, THEN BUILD A TRAY', 'Choose any five charms from the wall. Place them loose on your tray; nothing is attached yet.', `<div class="wall-demo"><div class="wall-demo__grid">${['★','♥','✿','◆','S','☻','●','✦'].map((x,i)=>`<i style="--i:${i}">${x}</i>`).join('')}</div><b>→</b><div class="wall-demo__tray">${[1,2,3,4,5].map(n=>`<span>${n}</span>`).join('')}</div></div>`, 'wall-operation');
}

function finalCharmDemo() {
  return operationDemo('CHECK EVERY CONNECTION', 'Look closely: the cut ends touch with no gap. Give each charm one gentle tug before wearing it.', `<div class="final-demo"><div class="final-demo__seam"><i></i><b>NO GAP</b></div><div class="final-demo__tug"><i>★</i><span>↕</span><b>GENTLE TUG</b></div><div class="final-demo__done"><i>✓</i><b>READY</b></div></div>`, 'final-operation');
}

function labMeasureDemo(guided) {
  if (guided) return operationDemo('MEASURE FROM SCRATCH', 'Tare the scale, add only the displayed fragrance amount, then add the predetermined SUAS base.', `<div class="measure-demo guided-measure"><div><i class="scale-shape"><b>0.00</b></i><span>1. TARE</span></div><b>→</b><div><i class="dropper-shape"><em></em></i><span>2. MEASURE</span></div><b>→</b><div><i class="base-shape"><em></em></i><span>3. ADD BASE</span></div></div>`, 'measure-operation');
  return operationDemo('DISPENSE YOUR FINISHED NOTES', 'Hold the bottle upright under each dispenser. Use the on-screen amounts and stop when the measured amount is reached.', `<div class="dispense-demo"><div class="dispenser-shape"><i></i><b></b></div><div class="dispense-drops"><i></i><i></i><i></i></div><div class="fill-bottle"><em></em><span>MEASURED AMOUNT</span></div><strong>PRESS → WATCH → STOP</strong></div>`, 'dispense-operation');
}

function formulaDemo() {
  const notes = guideState.notes.length ? guideState.notes : ['JASMINE','MANDARIN','PLUM'];
  return operationDemo('SMELL, COMPARE, RECORD', 'Smell from blotters one at a time. Record every chosen note and its amount so the scent can be recreated.', `<div class="formula-demo"><div class="blotter-fan">${notes.slice(0,4).map((note,index)=>`<i style="--i:${index}"><b>${index+1}</b><span>${note}</span></i>`).join('')}</div><b>→</b><div class="record-card"><small>MASTER SCENT FORMULA</small>${notes.slice(0,4).map((note,index)=>`<span>${String(index+1).padStart(2,'0')} / ${note}</span>`).join('')}</div></div>`, 'formula-operation');
}

function finishBottleDemo() {
  return operationDemo('MIX, FIT, AND FINISH', 'Mix gently until even. Fit the correct cap, spray top, or roll-on insert securely. Staff can help if the fitment is tight.', `<div class="finish-demo"><div class="finish-demo__bottle"><i></i><em></em></div><div class="finish-demo__motion">↻<small>GENTLE MIX</small></div><div class="finish-demo__fit"><i></i><b>PRESS STRAIGHT</b><span>CAP / SPRAYER / ROLL-ON</span></div></div>`, 'finish-operation');
}

function labelDemo() {
  const product = productChoices.find((item) => item.id === guideState.product)?.label || 'YOUR CREATION';
  return operationDemo('CENTER, PRESS, SMOOTH', 'Center the label before it touches the container. Press through the middle, then smooth outward to remove bubbles.', `<div class="label-demo"><div class="label-demo__bottle"></div><div class="label-demo__sticker"><b>${product}</b><span>${guideState.notes.join(' / ') || 'YOUR SCENT NOTES'}</span></div><div class="label-demo__hands"><i></i><i></i></div></div>`, 'label-operation');
}

function renderStageArt(type, step) {
  if (type === 'lab' && step.panel === 'mode') {
    return '<div class="art-options experience-options"><div class="art-card"><i class="process-icon dispenser-icon"><b></b><b></b><b></b></i><strong>SELF-GUIDED</strong><small>DISPENSE FINISHED NOTES</small></div><div class="art-card"><i class="process-icon organ-icon"><b></b><b></b><b></b></i><strong>GUIDED CLASS</strong><small>MEASURE FROM THE SCENT ORGAN</small></div></div>';
  }
  if (type === 'lab' && step.art === 'options') {
    return `<div class="art-options">${productChoices.filter((item) => item.mode === guideState.labMode).slice(0, 4).map((item) => `<div class="art-card">${item.label}<small>${item.source}</small></div>`).join('')}</div>`;
  }
  if (type === 'charm' && step.art === 'options') {
    return `<div class="art-options">${pieceChoices.slice(0, 4).map((item) => `<div class="art-card">${item[0]}<small>${item[1]}</small></div>`).join('')}</div>`;
  }
  if (step.art === 'notes') return formulaDemo();
  if (step.art === 'tools') return labMeasureDemo(guideState.labMode !== 'self');
  if (step.art === 'bottle') return finishBottleDemo();
  if (step.art === 'label') return labelDemo();
  if (step.art === 'tray') return charmWallDemo();
  if (step.art === 'layout') return charmLayoutDemo();
  if (step.art === 'pliers') return jumpRingDemo();
  return finalCharmDemo();
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
      ? ['Fill only to the marked line so the roller fitment has room.', 'Press in the roller fitment and tighten the cap.', 'Gently roll the bottle between your palms, then check for leaks and wipe it clean.']
      : ['Secure the cap before mixing.', 'Shake until the finished notes look completely even.', 'Check the fill line, leaks, and bottle exterior.'];
    return numberedBoard('BEGINNER FINISH', directions);
  }
  if (product.id === 'guided-butter') return numberedBoard('PIPE + JAR', ['Confirm the scent is evenly mixed.', 'Pipe or spoon into the finishing jar.', 'Smooth the top, close the jar, and wipe it clean.']);
  return numberedBoard('SPECIALIST FINAL CHECK', ['Mix the from-scratch formula until fully uniform.', 'Transfer into the correct finishing bottle only to its marked fill line.', 'Leave the required headspace, close securely, and review the finished product with your specialist.']);
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
  if (guideState.type === 'lab' && step.panel === 'measure') {
    panel.innerHTML = renderLabMeasurePanel();
    return;
  }
  if (guideState.type === 'lab' && step.panel === 'finish') {
    panel.innerHTML = renderLabFinishPanel();
    return;
  }
  const messages = {
    label: ['READY FOR LABEL STUDIO', 'Choose a blend name.', 'Double-check product type and notes.', 'Print one test before applying the label.'],
    layout: ['LAY IT OUT BEFORE ATTACHING', 'Keep the base piece flat on the mat.', 'Set one charm beside each possible attachment point.', 'Move them until the spacing feels balanced. Nothing is attached yet.'],
    attach: ['OPEN. ATTACH. CLOSE.', 'Each charm already has a jump ring attached.', 'Hold each side with the provided pliers and twist the ring sideways. Do not pull it wider.', 'Hook it onto the piece, then twist it closed until both ends touch. Ask staff if it will not close.'],
    check: ['FINAL SAFETY CHECK', 'Look for a completely closed ring with no gap.', 'Gently tug each charm once.', 'If anything moves or opens, stop and ask staff to re-close it.']
  };
  const copy = messages[step.panel];
  panel.innerHTML = `<p class="selection-title">${copy[0]}</p><div class="check-list">${copy.slice(1).map((item) => `<span><i></i>${item}</span>`).join('')}</div>`;
}

function renderGuide() {
  const guide = guides[guideState.type] || guides.lab;
  guideState.step = Math.max(0, Math.min(guideState.step, guide.steps.length - 1));
  const step = guide.steps[guideState.step];
  $('guideKicker').textContent = guide.kicker;
  $('stageLabel').textContent = guide.label;
  $('stageNumber').textContent = String(guideState.step + 1).padStart(2, '0');
  $('stageTitle').textContent = step.title;
  $('stageCopy').textContent = step.copy;
  $('guideProgressText').textContent = `${guideState.step + 1} / ${guide.steps.length}`;
  $('guideProgressBar').style.width = `${((guideState.step + 1) / guide.steps.length) * 100}%`;
  $('stageArt').innerHTML = renderStageArt(guideState.type, step);
  $('stepList').innerHTML = guide.steps.map((item, index) => `<button class="step-chip${index === guideState.step ? ' is-active' : ''}" data-step="${index}" type="button"><span>${String(index + 1).padStart(2, '0')}</span>${item.title}</button>`).join('');
  $('stepList').querySelectorAll('[data-step]').forEach((button) => button.addEventListener('click', () => { guideState.step = Number(button.dataset.step); saveGuide(); renderGuide(); }));
  renderSelectionPanel(step);
  $('previousStep').disabled = guideState.step === 0;
  const finalStep = guideState.step === guide.steps.length - 1;
  $('nextStep').innerHTML = finalStep ? 'REVIEW CREATION <span>-></span>' : 'NEXT STEP <span>-></span>';
  $('saveGuideFormula').textContent = guideState.type === 'lab' ? 'SAVE FORMULA' : 'SAVE PLAN';
  saveGuide();
}

$('previousStep')?.addEventListener('click', () => { guideState.step = Math.max(0, guideState.step - 1); saveGuide(); renderGuide(); });
$('nextStep')?.addEventListener('click', () => {
  const guide = guides[guideState.type];
  if (guideState.step < guide.steps.length - 1) { guideState.step += 1; saveGuide(); renderGuide(); return; }
  showView('summary');
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

function renderSummary() {
  const guest = activeGuest || store.get('activeGuest', { name: 'GUEST', party: 1 });
  if (guidedState?.status === 'COMPLETE') {
    const experience = guidedExperiences[guidedState.purchase];
    const formula = guidedState.masterFormula?.map((item) => `${item.note} ${Math.round(item.ratio * 100)}%`).join(' / ') || 'MASTER FORMULA SAVED';
    const rows = [
      ['EXPERIENCE', experience?.name || 'GUIDED LAB'],
      ['PRODUCT MODULES', guidedState.products.map(moduleLabel).join(' + ')],
      ['MASTER SCENT', guidedState.notes.join(' + ') || 'NOT SELECTED'],
      ['FORMULA', formula],
      ['GUEST', guidedState.guest],
      ['LAB STATION', `STATION ${String(guidedState.station).padStart(2, '0')}`]
    ];
    $('summaryGrid').innerHTML = rows.map(([label, value]) => `<div><small>${label}</small><b>${value}</b></div>`).join('');
    $('summaryTicket').innerHTML = `<small>SUAS OS / GUIDED LAB RECORD</small><h3>EXPERIMENT COMPLETE ✓</h3><p>${guidedState.products.map(moduleLabel).join(' / ')}</p><div><span>${new Date().toLocaleDateString()}</span><span>STATION ${String(guidedState.station).padStart(2, '0')}</span></div>`;
    $('summaryContinue').textContent = 'CREATE LABEL ->';
    return;
  }
  const isCharm = guideState.type === 'charm';
  const product = productChoices.find((item) => item.id === guideState.product) || productChoices[0];
  const rows = isCharm
    ? [['EXPERIENCE', 'CHARM BAR'], ['BASE PIECE', guideState.piece], ['CHARMS', 'ANY FIVE / DIY ATTACHMENT'], ['GUEST', guest.name], ['PARTY', guest.party]]
    : [['PRODUCT', product.label], ['SESSION', guideState.labMode === 'guided' ? 'GUIDED / FROM SCRATCH' : 'SELF-GUIDED / FINISHED NOTES'], ['SCENT NOTES', guideState.notes.length ? guideState.notes.join(' + ') : 'NOT SELECTED'], ...(guideState.product.includes('oil') || guideState.product === 'guided-collection' ? [['OIL BASE', guideState.base]] : []), ['GUEST', guest.name], ['PARTY', guest.party]];
  $('summaryGrid').innerHTML = rows.map(([label, value]) => `<div><small>${label}</small><b>${value}</b></div>`).join('');
  $('summaryTicket').innerHTML = `<small>SUAS OS / CREATION TICKET</small><h3>${isCharm ? guideState.piece : product.name}</h3><p>${isCharm ? 'LAY OUT / ATTACH / TUG TEST' : (guideState.notes.join(' / ') || 'ADD YOUR SCENT NOTES')}</p><div><span>${new Date().toLocaleDateString()}</span><span>${store.get('stationName', 'MIXING STATION 01')}</span></div>`;
  $('summaryContinue').textContent = isCharm ? 'FINISH SESSION ->' : 'CREATE LABEL ->';
}

$('summaryBack')?.addEventListener('click', () => showView(guidedState?.status === 'COMPLETE' ? 'guided' : 'guide'));
$('summarySave')?.addEventListener('click', () => {
  if (!getActiveAccount()) {
    store.set('pendingFormulaSave', true);
    store.set('accountNotice', 'Sign in or create an account to save this creation.');
    showView('accounts');
    return;
  }
  if (guidedState?.status === 'COMPLETE') saveGuidedFormulaToAccount();
  else saveCurrentCreation();
  $('summarySave').textContent = 'SAVED TO FORMULA BOOK';
});
$('summaryContinue')?.addEventListener('click', () => {
  if (guidedState?.status === 'COMPLETE') {
    const primary = guidedState.products[0];
    const productName = primary === 'bodyoil' ? 'Body Oil' : primary === 'buttercreme' ? 'Butter Creme' : 'Eau De Parfum';
    if (primary !== 'candle') $('labelProductType').value = productName;
    $('scentNotes').value = guidedState.notes.join(' / ') || 'YOUR SCENT NOTES';
    syncLabelPreview();
    showView('studio');
    return;
  }
  if (guideState.type === 'charm') { showView('finish'); return; }
  sendGuideToStudio();
  showView('studio');
});

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
$('printLabel')?.addEventListener('click', () => {
  $('studioStatus').textContent = 'Opening the iPad print dialog...';
  window.print();
  $('studioStatus').textContent = 'Print sent. Finish the session when the label is ready.';
  showView('finish');
});

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
  const help = store.get('helpRequest');
  const helpCount = store.get('helpLog', []).length;
  if ($('helpRequestStatus')) $('helpRequestStatus').textContent = help ? `${help.station} / ${help.guest} / ${help.time}` : `NO ACTIVE REQUEST / ${helpCount} LOGGED`;
  const helpWebhook = store.get('helpWebhookUrl', '');
  if ($('helpWebhookUrl')) $('helpWebhookUrl').value = helpWebhook;
  if ($('helpConnectionStatus')) $('helpConnectionStatus').textContent = helpWebhook ? 'SHARED ALERT ENDPOINT CONNECTED' : 'LOCAL TO THIS IPAD';
  if ($('privacyTimeout')) $('privacyTimeout').value = store.get('privacyTimeout', 8);
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
$('clearProgress')?.addEventListener('click', () => { resetGuestSession(false); updateAdminProgress(); });
$('testPrint')?.addEventListener('click', () => showView('studio'));
$('lockStaff')?.addEventListener('click', () => { staffUnlocked = false; showView('home'); });
$('resetStaffPassword')?.addEventListener('click', () => { store.remove('staffPasswordHash'); staffUnlocked = false; openStaffGate(true); });
$('clearHelpRequest')?.addEventListener('click', () => { store.remove('helpRequest'); updateHelpButton(); updateAdminSettings(); });
$('saveHelpWebhook')?.addEventListener('click', () => {
  const url = $('helpWebhookUrl').value.trim();
  if (url && !/^https:\/\//i.test(url)) { $('saveHelpWebhook').textContent = 'USE A SECURE HTTPS URL'; return; }
  url ? store.set('helpWebhookUrl', url) : store.remove('helpWebhookUrl');
  updateAdminSettings();
  $('saveHelpWebhook').textContent = url ? 'ALERT CONNECTION SAVED' : 'LOCAL MODE SAVED';
  setTimeout(() => { if ($('saveHelpWebhook')) $('saveHelpWebhook').textContent = 'SAVE ALERT CONNECTION'; }, 1400);
});
$('savePrivacyTimeout')?.addEventListener('click', () => {
  store.set('privacyTimeout', Math.max(2, Math.min(30, Number($('privacyTimeout').value) || 8)));
  $('savePrivacyTimeout').textContent = 'AUTO RESET SAVED';
  setTimeout(() => { $('savePrivacyTimeout').textContent = 'SAVE AUTO RESET'; }, 1200);
  resetIdleTimer();
});

function resetGuestSession(goHome = true) {
  if (guidedState) {
    const sessions = store.get('stationSessions', []).filter((item) => item.id !== guidedState.id);
    store.set('stationSessions', sessions);
  }
  store.remove('guide');
  store.remove('guidedState');
  store.remove('activeGuest');
  store.remove('activeAccount');
  store.remove('labelDraft');
  store.remove('helpRequest');
  activeGuest = null;
  guidedState = null;
  guideState = { type: 'lab', step: 0, labMode: 'self', product: 'self-perfume', base: 'Glow Base', notes: [], piece: 'BRACELET', charms: [] };
  if ($('checkinForm')) $('checkinForm').reset();
  if ($('checkinParty')) $('checkinParty').value = 1;
  if (goHome) showView('home');
}

$('makeAnother')?.addEventListener('click', () => {
  guideState.step = 0;
  guideState.notes = [];
  guideState.charms = [];
  saveGuide();
  showView('guides');
});
$('finishSession')?.addEventListener('click', () => resetGuestSession(true));

$('needHelp')?.addEventListener('click', async () => {
  const existing = store.get('helpRequest');
  if (existing) { showHelpNotice(existing); return; }
  const request = {
    station: store.get('stationName', 'MIXING STATION 01'),
    guest: activeGuest?.name || 'GUEST',
    view: currentView,
    step: guideState?.type ? `${guideState.type.toUpperCase()} / STEP ${String((guideState.step || 0) + 1).padStart(2, '0')}` : currentView.toUpperCase(),
    time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    delivery: 'local'
  };
  store.set('helpRequest', request);
  const helpLog = store.get('helpLog', []);
  helpLog.unshift(request);
  store.set('helpLog', helpLog.slice(0, 100));
  updateHelpButton();
  const webhook = store.get('helpWebhookUrl', '');
  if (webhook) {
    request.delivery = 'sending'; store.set('helpRequest', request); updateHelpButton();
    try {
      await fetch(webhook, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ event: 'SUAS_HELP_REQUEST', ...request }) });
      request.delivery = 'sent';
    } catch (error) { request.delivery = 'local'; }
    store.set('helpRequest', request); updateHelpButton();
  }
  showHelpNotice(request);
});

function updateHelpButton() {
  if (!$('needHelp')) return;
  const request = store.get('helpRequest');
  const requested = Boolean(request);
  $('needHelp').classList.toggle('is-requested', requested);
  $('needHelp').setAttribute('aria-label', requested ? 'View staff help request status' : 'Request help from a staff member');
  $('needHelp').innerHTML = requested
    ? '<span class="help-icon is-sent" aria-hidden="true"><i></i></span><span class="help-button-copy"><b>SENT</b><small>HELP REQUEST</small></span>'
    : '<span class="help-icon" aria-hidden="true"><i></i></span><span class="help-button-copy"><b>HELP</b><small>ASK STAFF</small></span>';
}

function showHelpNotice(request) {
  if (!$('helpNotice')) return;
  const shared = request?.delivery === 'sent';
  $('helpNoticeTitle').textContent = shared ? 'ALERT SENT' : 'REQUEST SAVED';
  $('helpNoticeCopy').textContent = shared ? `${request.station} was sent to the connected staff alert.` : 'This request is currently stored on this iPad only.';
  $('helpNotice').hidden = false;
}
$('closeHelpNotice')?.addEventListener('click', () => { $('helpNotice').hidden = true; });

let idleTimer;
let countdownTimer;
function resetIdleTimer() {
  clearTimeout(idleTimer);
  clearInterval(countdownTimer);
  if ($('timeoutModal')) $('timeoutModal').hidden = true;
  if (!activeGuest || ['home', 'checkin', 'staff-login', 'admin', 'finish'].includes(currentView)) return;
  const minutes = store.get('privacyTimeout', 8);
  idleTimer = setTimeout(showTimeoutWarning, minutes * 60 * 1000);
}
function showTimeoutWarning() {
  let seconds = 60;
  $('timeoutCountdown').textContent = seconds;
  $('timeoutModal').hidden = false;
  countdownTimer = setInterval(() => {
    seconds -= 1;
    $('timeoutCountdown').textContent = seconds;
    if (seconds <= 0) { clearInterval(countdownTimer); resetGuestSession(true); }
  }, 1000);
}
['pointerdown', 'keydown', 'touchstart'].forEach((eventName) => document.addEventListener(eventName, resetIdleTimer, { passive: true }));
$('continueSession')?.addEventListener('click', resetIdleTimer);

/* Guided Lab OS ---------------------------------------------------------- */
const guidedExperiences = {
  'guided-perfume': { name: 'GUIDED CUSTOM PERFUME', products: ['perfume'] },
  'guided-candle': { name: 'CANDLE EXPERIMENT', products: ['candle'] },
  'guided-perfume-oil': { name: 'PERFUME + BODY OIL', products: ['perfume', 'bodyoil'] },
  'guided-perfume-butter': { name: 'PERFUME + BUTTER CREME', products: ['perfume', 'buttercreme'] },
  'guided-collection': { name: 'SIGNATURE COLLECTION', products: ['perfume', 'bodyoil', 'buttercreme'] }
};
const defaultGuidedSettings = {
  candle: { price: 85, day: 6, waxGrams: 200, maxLoadPercent: 10, cureDays: 7, coolingMinutes: 45, labDrop: 'IRIDESCENT', approvedNotes: ['VANILLA', 'AMBER', 'JASMINE', 'MANDARIN', 'PLUM', 'ROSE', 'BERGAMOT', 'COCONUT', 'CARAMEL', 'SANDALWOOD', 'CEDARWOOD', 'TONKA BEAN'] },
  formula: { perfumeFragranceMl: 6, bodyOilLoadPercent: 3, butterLoadPercent: 1 }
};
const guidedSharedSteps = [
  { code: '01', exe: 'WELCOME.EXE', title: 'WELCOME TO THE LAB.', copy: 'Your Lab Guide leads this shared introduction. Learn the rules, the 90-minute flow, and how to use the Scent Organ safely.', time: '00–08 MIN' },
  { code: '02', exe: 'SCENT.EXE', title: 'LEARN. SMELL. SELECT.', copy: 'Explore fragrance fundamentals, scent families, and proper blotter testing. Then choose up to four notes for your signature scent.', time: '08–20 MIN' },
  { code: '03', exe: 'FORMULA.EXE', title: 'BUILD THE MASTER FORMULA.', copy: 'Set the proportions for your selected notes. SUAS.OS saves one master scent formula and converts it for every product in your reservation.', time: '20–32 MIN' }
];
const guidedModules = {
  perfume: {
    label: 'PERFUME.EXE', color: 'pink',
    steps: [
      ['01','REVIEW FORMULA','Review every selected note and its calculated amount.'],['02','MEASURE','Measure each fragrance component and check it off as it enters the vessel.'],['03','BUILD PERFUME','Combine the fragrance concentrate with the predetermined SUAS perfume base.'],['04','BLEND','Mix for the displayed time until the perfume is fully uniform.'],['05','BOTTLE','Transfer the finished perfume into the selected 30 mL bottle.'],['06','NAME','Give the fragrance a name.'],['07','LABEL','Review the information prepared for the custom label.'],['08','SAVE FORMULA','Save the final formula to the guest and session record.'],['09','COMPLETE','Review resting, maceration, storage, and care instructions.']
    ]
  },
  candle: {
    label: 'CANDLE.EXE', color: 'yellow',
    steps: [
      ['01','SELECT MODE','Choose Flame Mode or Warmer Mode.'],['02','SELECT VESSEL','Choose Black, White, or today\'s rotating LAB DROP.'],['03','BUILD HOME FRAGRANCE','Review the candle-approved notes selected from the Scent Organ.'],['04','FORMULA','Blend proportions within the tested fragrance-load limit.'],['05','PREP VESSEL','Prepare the vessel. Flame Mode includes wick placement and centering.'],['06','WAX','Wait while staff dispenses the predetermined hot-wax amount.'],['07','TEMPERATURE CHECKPOINT','Pause until a Lab Guide approves the wax temperature.'],['08','ADD FRAGRANCE','Add the exact fragrance amounts and stir for the required time.'],['09','POUR','Pour carefully into the prepared vessel.'],['10','COOLING','Assign the numbered cooling location and begin the setting timer.'],['11','NAME','Name the candle.'],['12','LABEL','Review the custom candle label information.'],['13','FORMULA CARD','Save vessel, mode, notes, formula, batch, and session data.'],['14','CURE','Calculate the candle ready-to-use date.'],['15','COMPLETE','Review care instructions for the selected candle mode.']
    ]
  },
  bodyoil: {
    label: 'BODYOIL.EXE', color: 'blue',
    steps: [
      ['01','IMPORT MASTER FORMULA','Import the signature scent. No second scent-building step needed.'],['02','CHOOSE BASE','Choose Glow, Silky Dry, or Rich Body Oil Base.'],['03','CONVERT FORMULA','Convert the master ratios to the approved body-oil load.'],['04','MEASURE + BLEND','Measure the scent and body-oil base, then blend until uniform.'],['05','BOTTLE + LABEL','Transfer, name, and prepare the product label.'],['06','COMPLETE','Save the converted formula and review use instructions.']
    ]
  },
  buttercreme: {
    label: 'BUTTERCREME.EXE', color: 'lime',
    steps: [
      ['01','IMPORT MASTER FORMULA','Import the signature scent into the Butter Creme module.'],['02','OPEN CREATION KIT','Confirm the pre-portioned 4 oz Butter Creme and finishing jar.'],['03','CONVERT FORMULA','Convert the master ratios to the approved Butter Creme load.'],['04','MEASURE + FOLD','Measure the scent, then fold it into the base until completely even.'],['05','PIPE + JAR','Pipe or spoon the finished Butter Creme into its jar.'],['06','LABEL + COMPLETE','Save the formula and finish the product label.']
    ]
  }
};

function getGuidedSettings() {
  const saved = store.get('guidedSettings', {});
  return {
    candle: { ...defaultGuidedSettings.candle, ...(saved.candle || {}) },
    formula: { ...defaultGuidedSettings.formula, ...(saved.formula || {}) }
  };
}
function dayName(day) { return ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'][Number(day)] || 'SATURDAY'; }
function moduleLabel(key) { return guidedModules[key]?.label || key.toUpperCase(); }
function newGuidedState(data) {
  const experience = guidedExperiences[data.purchase] || guidedExperiences['guided-perfume'];
  return {
    id: crypto.randomUUID(), guest: data.guest, email: data.email || '', party: data.party || 1,
    station: data.station || 1, purchase: data.purchase, products: experience.products,
    phase: 'shared', sharedStep: 0, moduleIndex: 0, moduleStep: 0,
    notes: [], formulaParts: {}, masterFormula: null, productData: {}, completedModules: [],
    status: 'IN PROGRESS', startedAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
}
let guidedState = store.get('guidedState', null);
function startGuidedSession(data) {
  guidedState = newGuidedState(data);
  saveGuidedState();
}
function saveGuidedState() {
  if (!guidedState) return;
  guidedState.updatedAt = new Date().toISOString();
  store.set('guidedState', guidedState);
  const sessions = store.get('stationSessions', []).filter((item) => item.id !== guidedState.id && item.station !== guidedState.station);
  sessions.push({ ...guidedState });
  store.set('stationSessions', sessions.slice(-24));
}
function currentGuidedModule() { return guidedState?.products?.[guidedState.moduleIndex] || null; }
function currentGuidedStep() {
  if (!guidedState) return null;
  if (guidedState.phase === 'shared') return guidedSharedSteps[guidedState.sharedStep];
  const module = guidedModules[currentGuidedModule()];
  const raw = module?.steps[guidedState.moduleStep];
  return raw ? { code: raw[0], exe: module.label, title: raw[1], copy: raw[2], time: '32–70 MIN' } : null;
}
function approvedGuidedNotes() {
  if (guidedState?.products?.includes('candle')) return getGuidedSettings().candle.approvedNotes;
  return getScentCatalog().perfume;
}
function calculatedFormula(total) {
  const formula = guidedState?.masterFormula || [];
  return formula.map((item) => ({ ...item, amount: Number((item.ratio * total).toFixed(2)) }));
}
function formatFormula(total, unit) {
  const rows = calculatedFormula(total);
  return rows.length ? rows.map((item) => `<span><b>${item.note}</b><em>${item.amount} ${unit}</em></span>`).join('') : '<p class="guided-alert">Complete FORMULA.EXE first.</p>';
}
function guidedChecklist(items, key) {
  const checked = guidedState.productData[key] || [];
  return `<div class="guided-checklist">${items.map((item, index) => `<label><input type="checkbox" data-guided-check="${key}" value="${index}" ${checked.includes(index) ? 'checked' : ''}><span>${item}</span></label>`).join('')}</div>`;
}
function bindGuidedChecks() {
  $('guidedControls')?.querySelectorAll('[data-guided-check]').forEach((input) => input.addEventListener('change', () => {
    const key = input.dataset.guidedCheck;
    guidedState.productData[key] = [...$('guidedControls').querySelectorAll(`[data-guided-check="${key}"]:checked`)].map((item) => Number(item.value));
    saveGuidedState();
  }));
}
function guidedWelcomeControls() {
  return `<div class="guided-info-card"><b>90-MINUTE LAB MAP</b><span>15–20 MIN / SHARED SCENT EDUCATION</span><span>~50 MIN / PERSONAL .EXE MODULES</span><span>FINAL 20 MIN / LABELS + PACKAGING</span></div>${guidedChecklist(['Wear required protective gear and keep the station clear.','Smell from blotters, never directly from an ingredient bottle.','Ask the Lab Guide before changing any displayed measurement.','Hot wax and the central wax melter are staff-controlled.'],'welcome')}`;
}
function guidedScentControls() {
  const notes = approvedGuidedNotes();
  return `<div class="family-strip"><span>FRESH<br><small>bright / airy</small></span><span>FLORAL<br><small>soft / blooming</small></span><span>GOURMAND<br><small>sweet / edible</small></span><span>WOODY<br><small>warm / grounded</small></span></div><div class="smell-procedure"><b>SMELLING PROCEDURE</b><p>Dip or spray one blotter. Label it. Fan twice. Smell at a little distance. Reset between notes. Compare no more than four at once.</p></div><p class="selection-title">SELECT NOTES <span>${guidedState.notes.length}/4</span></p><div class="guided-note-grid">${notes.map((note) => `<button type="button" data-guided-note="${note}" class="${guidedState.notes.includes(note) ? 'is-selected' : ''}">${note}</button>`).join('')}</div>`;
}
function guidedFormulaControls() {
  if (!guidedState.notes.length) return '<p class="guided-alert">Go back and choose at least one scent note.</p>';
  const totalParts = guidedState.notes.reduce((sum, note) => sum + Math.max(0, Number(guidedState.formulaParts[note] || 1)), 0) || 1;
  return `<div class="master-formula"><b>MASTER SCENT FORMULA</b><p>Use parts to set the balance. SUAS.OS converts the ratios for each product.</p>${guidedState.notes.map((note) => `<label><span>${note}</span><input type="number" min="0.25" max="10" step="0.25" value="${guidedState.formulaParts[note] || 1}" data-formula-note="${note}"><em>${Math.round((Number(guidedState.formulaParts[note] || 1) / totalParts) * 100)}%</em></label>`).join('')}</div><button class="secondary-command" id="saveMasterFormula" type="button">SAVE MASTER FORMULA</button>`;
}
function moduleNameInput(key, label) {
  const value = guidedState.productData[key] || '';
  return `<label class="guided-field">${label}<input data-product-field="${key}" value="${value}" placeholder="TYPE A NAME"></label>`;
}
function guidedModuleControls(moduleKey, stepIndex) {
  const settings = getGuidedSettings();
  const step = guidedModules[moduleKey].steps[stepIndex][1];
  const perfumeTotal = settings.formula.perfumeFragranceMl;
  const bodyOilTotal = Number((30 * settings.formula.bodyOilLoadPercent / 100).toFixed(2));
  const butterTotal = Number((113.4 * settings.formula.butterLoadPercent / 100).toFixed(2));
  if (moduleKey === 'perfume') {
    if (step === 'REVIEW FORMULA') return `<div class="formula-output">${formatFormula(perfumeTotal,'mL')}</div><p class="guided-result">SUAS PERFUME BASE: ${(30 - perfumeTotal).toFixed(2)} mL</p>`;
    if (step === 'MEASURE') return guidedChecklist(calculatedFormula(perfumeTotal).map((item) => `Measure ${item.amount} mL ${item.note}`), 'perfumeMeasure');
    if (step === 'BUILD PERFUME') return guidedChecklist([`Add ${perfumeTotal.toFixed(2)} mL fragrance concentrate.`,`Add ${(30 - perfumeTotal).toFixed(2)} mL predetermined SUAS perfume base.`,'Confirm the total reaches 30 mL.'],'perfumeBuild');
    if (step === 'BLEND') return '<div class="mix-timer"><b>02:00</b><span>CAP + MIX GENTLY</span></div>';
    if (step === 'BOTTLE') return guidedChecklist(['Place funnel in the clean 30 mL bottle.','Transfer slowly below the fill line.','Cap, wipe, and inspect for leaks.'],'perfumeBottle');
    if (step === 'NAME') return moduleNameInput('perfumeName','FRAGRANCE NAME');
    if (step === 'LABEL') return `<div class="label-file"><small>LABEL FILE</small><b>${guidedState.productData.perfumeName || 'UNNAMED FORMULA'}</b><span>EAU DE PARFUM / 30 mL</span><span>${guidedState.notes.join(' / ')}</span><span>MIXED BY ${guidedState.guest.toUpperCase()}</span></div>`;
    if (step === 'SAVE FORMULA') return '<button class="primary-command" data-save-guided-formula type="button">SAVE TO FORMULA BOOK <span>+</span></button><p class="guided-result">The session record is saved even if the guest does not create an account.</p>';
    return '<div class="complete-file"><b>EXPERIMENT COMPLETE ✓</b><p>Let the perfume rest in a cool, dark place for at least 48 hours. The scent will continue to marry as it macerates. Keep tightly capped and away from heat or direct sunlight.</p></div>';
  }
  if (moduleKey === 'bodyoil') {
    if (step === 'IMPORT MASTER FORMULA') return `<div class="import-arrow"><b>MASTER SCENT FORMULA</b><i>↓</i><strong>BODYOIL.EXE</strong></div><div class="formula-output">${formatFormula(bodyOilTotal,'g')}</div>`;
    if (step === 'CHOOSE BASE') return `<div class="option-row">${['GLOW BASE','SILKY DRY OIL BASE','RICH BODY OIL'].map((base) => `<button type="button" data-product-option="oilBase" data-value="${base}" class="${guidedState.productData.oilBase === base ? 'is-selected' : ''}">${base}</button>`).join('')}</div>`;
    if (step === 'CONVERT FORMULA') return `<div class="formula-output">${formatFormula(bodyOilTotal,'g')}</div><p class="guided-result">APPROVED TOTAL SCENT LOAD: ${bodyOilTotal} g / ${settings.formula.bodyOilLoadPercent}%</p>`;
    if (step === 'MEASURE + BLEND') return guidedChecklist([...calculatedFormula(bodyOilTotal).map((item) => `Measure ${item.amount} g ${item.note}`),`Add ${(30 - bodyOilTotal).toFixed(2)} g ${guidedState.productData.oilBase || 'selected body oil base'}.`,'Blend slowly until completely uniform.'],'oilBuild');
    if (step === 'BOTTLE + LABEL') return `${moduleNameInput('oilName','BODY OIL NAME')}${guidedChecklist(['Transfer into the clean 1 oz bottle only to the marked fill line.','Leave room for the closure, then cap, wipe, and inspect.','Send the product file to Label Studio.'],'oilBottle')}`;
    return '<div class="complete-file"><b>BODYOIL.EXE COMPLETE ✓</b><p>Apply to clean, slightly damp skin. Store closed and away from heat. Formula conversion saved to this session.</p></div>';
  }
  if (moduleKey === 'buttercreme') {
    if (step === 'IMPORT MASTER FORMULA') return `<div class="import-arrow"><b>MASTER SCENT FORMULA</b><i>↓</i><strong>BUTTERCREME.EXE</strong></div><div class="formula-output">${formatFormula(butterTotal,'g')}</div>`;
    if (step === 'OPEN CREATION KIT') return guidedChecklist(['Confirm sealed pre-portioned 4 oz Butter Creme.','Confirm clean mixing vessel, spatula, piping bag, and finishing jar.','Do not add fragrance until measurements are ready.'],'butterKit');
    if (step === 'CONVERT FORMULA') return `<div class="formula-output">${formatFormula(butterTotal,'g')}</div><p class="guided-result">APPROVED TOTAL SCENT LOAD: ${butterTotal} g / ${settings.formula.butterLoadPercent}%</p>`;
    if (step === 'MEASURE + FOLD') return guidedChecklist([...calculatedFormula(butterTotal).map((item) => `Measure ${item.amount} g ${item.note}`),'Add scent to the pre-portioned Butter Creme.','Fold from bottom to top until color and texture are even.'],'butterBuild');
    if (step === 'PIPE + JAR') return guidedChecklist(['Fill the piping bag without trapping air.','Pipe or spoon into the finishing jar.','Smooth, cap, wipe, and inspect.'],'butterJar');
    return `${moduleNameInput('butterName','BUTTER CREME NAME')}<div class="complete-file"><b>BUTTERCREME.EXE COMPLETE ✓</b><p>Label information and converted formula are saved to this session.</p></div>`;
  }
  return guidedCandleControls(step, settings);
}
function guidedCandleControls(step, settings) {
  const candle = settings.candle;
  const candleFragrance = Number((candle.waxGrams * candle.maxLoadPercent / 100).toFixed(2));
  if (step === 'SELECT MODE') return `<div class="option-row">${['FLAME MODE','WARMER MODE'].map((value) => `<button type="button" data-product-option="candleMode" data-value="${value}" class="${guidedState.productData.candleMode === value ? 'is-selected' : ''}">${value}</button>`).join('')}</div>`;
  if (step === 'SELECT VESSEL') return `<div class="vessel-row">${['BLACK','WHITE',candle.labDrop].map((value) => `<button type="button" data-product-option="vessel" data-value="${value}" class="${guidedState.productData.vessel === value ? 'is-selected' : ''}"><i class="vessel-${value === 'BLACK' ? 'black' : value === 'WHITE' ? 'white' : 'drop'}"></i>${value}${value === candle.labDrop ? '<small>LAB DROP</small>' : ''}</button>`).join('')}</div>`;
  if (step === 'BUILD HOME FRAGRANCE') return `<div class="formula-output">${formatFormula(candleFragrance,'g')}</div><p class="guided-result">ONLY CANDLE-APPROVED NOTES ARE ACTIVE.</p>`;
  if (step === 'FORMULA') return `<div class="formula-output">${formatFormula(candleFragrance,'g')}</div><p class="guided-result">TESTED MAXIMUM: ${candle.maxLoadPercent}% / ${candleFragrance} g TOTAL. DO NOT EXCEED.</p>`;
  if (step === 'PREP VESSEL') return guidedState.productData.candleMode === 'WARMER MODE' ? guidedChecklist(['Confirm the wickless vessel is clean and dry.','Place the vessel on a level protected surface.'],'candlePrep') : guidedChecklist(['Center the wick tab on the vessel base.','Press firmly until secure.','Add the centering tool and confirm the wick is straight.'],'candlePrep');
  if (step === 'WAX') return `<div class="staff-only"><b>STAFF CONTROLLED</b><p>Central bulk wax melter. Guest does not operate.</p><strong>${candle.waxGrams} g PRE-MEASURED HOT WAX</strong></div>`;
  if (step === 'TEMPERATURE CHECKPOINT') return '<div class="checkpoint-card"><b>LAB GUIDE CHECKPOINT</b><p>Do not continue until your Lab Guide approves your wax temperature.</p><button class="primary-command" id="requestTempApproval" type="button">REQUEST APPROVAL</button></div>';
  if (step === 'ADD FRAGRANCE') return `${guidedChecklist(calculatedFormula(candleFragrance).map((item) => `Add ${item.amount} g ${item.note}`),'candleFragrance')}<div class="mix-timer"><b>02:00</b><span>STIR SLOWLY / SCRAPE SIDES</span></div>`;
  if (step === 'POUR') return '<div class="hot-warning"><b>HOT WAX</b><p>Keep the vessel level. Pour slowly and steadily. Stop below the approved fill line. Ask for help immediately if wax spills.</p></div>';
  if (step === 'COOLING') {
    const end = guidedState.productData.coolingEndsAt;
    return `<label class="guided-field">COOLING LOCATION<input data-product-field="coolingLocation" value="${guidedState.productData.coolingLocation || `STATION ${String(guidedState.station).padStart(2,'0')}`}" placeholder="LOCATION NUMBER"></label><div class="cooling-timer"><b id="coolingClock">${end ? coolingTime(end) : `${candle.coolingMinutes}:00`}</b><span>CANDLE COOLING / EST. ${candle.coolingMinutes} MIN</span><button class="secondary-command" id="startCooling" type="button">${end ? 'TIMER RUNNING' : 'START COOLING'}</button></div>`;
  }
  if (step === 'NAME') return moduleNameInput('candleName','CANDLE NAME');
  if (step === 'LABEL') return `<div class="label-file"><small>CANDLE LABEL FILE</small><b>${guidedState.productData.candleName || 'UNNAMED CANDLE'}</b><span>${guidedState.productData.candleMode || 'MODE NOT SELECTED'} / ${guidedState.productData.vessel || 'VESSEL NOT SELECTED'}</span><span>${guidedState.notes.join(' / ')}</span></div>`;
  if (step === 'FORMULA CARD') return `<div class="formula-card-os"><b>${guidedState.productData.candleName || 'CANDLE FORMULA'}</b><span>VESSEL / ${guidedState.productData.vessel || '—'}</span><span>MODE / ${guidedState.productData.candleMode || '—'}</span><span>BATCH / ${guidedState.id.slice(0,8).toUpperCase()}</span><span>FORMULA / ${guidedState.masterFormula?.map((item) => `${item.note} ${Math.round(item.ratio*100)}%`).join(' / ') || '—'}</span></div>`;
  if (step === 'CURE') {
    const ready = new Date(); ready.setDate(ready.getDate() + candle.cureDays);
    guidedState.productData.readyDate ||= ready.toISOString().slice(0,10);
    return `<div class="cure-card"><b>YOUR CANDLE IS CURING</b><span>READY TO USE</span><strong>${new Date(`${guidedState.productData.readyDate}T12:00:00`).toLocaleDateString([], {month:'long',day:'numeric',year:'numeric'}).toUpperCase()}</strong></div>`;
  }
  return `<div class="complete-file"><b>EXPERIMENT COMPLETE ✓</b><p>${guidedState.productData.candleMode === 'WARMER MODE' ? 'Use only on an approved candle warmer. Keep the wax vessel level, dry, and away from children or pets.' : 'Trim the wick to 1/4 inch before every burn. Allow a full melt pool, never burn longer than four hours, and never leave a flame unattended.'}</p></div>`;
}
function coolingTime(iso) {
  const seconds = Math.max(0, Math.ceil((new Date(iso) - Date.now()) / 1000));
  return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
}
function guidedVisual(step, moduleKey) {
  if (guidedState.phase === 'shared' && guidedState.sharedStep === 0) return `<div class="guided-demo guided-map-demo">
    <div class="guided-map-step pink"><b>01</b><i class="demo-person"></i><strong>WELCOME</strong><span>Meet your Lab Guide</span></div>
    <i class="guided-arrow">→</i><div class="guided-map-step blue"><b>02</b><i class="demo-blotter"></i><strong>SMELL</strong><span>Test one note at a time</span></div>
    <i class="guided-arrow">→</i><div class="guided-map-step yellow"><b>03</b><i class="demo-drop-scale"></i><strong>FORMULA</strong><span>Measure + record</span></div>
    <i class="guided-arrow">→</i><div class="guided-map-step lime"><b>04</b><i class="demo-product"></i><strong>BUILD</strong><span>Follow your product file</span></div>
  </div>`;
  if (guidedState.phase === 'shared' && guidedState.sharedStep === 1) return `<div class="guided-demo scent-test-demo">
    <div class="scent-test-organ">${approvedGuidedNotes().slice(0,6).map((note,index) => `<i style="--note:${index}"><small>${String(index + 1).padStart(2,'0')}</small><b>${note}</b></i>`).join('')}</div>
    <div class="scent-test-actions"><span><i class="dip-blotter"></i><b>1 / DIP</b><small>Touch only the scented tip.</small></span><span><i class="wave-blotter"></i><b>2 / WAVE</b><small>Move it through the air twice.</small></span><span><i class="smell-blotter"></i><b>3 / SMELL</b><small>Hold below your nose. Do not touch.</small></span></div>
  </div>`;
  if (guidedState.phase === 'shared') return `<div class="guided-demo formula-branch-demo"><div class="master-formula-visual"><i></i><b>MASTER SCENT FORMULA</b><span>${guidedState.notes.join(' + ') || 'YOUR SELECTED NOTES'}</span></div><i class="branch-line"></i><div class="branch-products">${guidedState.products.map((item) => `<span><i></i><b>${moduleLabel(item)}</b><small>IMPORT FORMULA</small></span>`).join('')}</div></div>`;
  if (moduleKey === 'candle') return candleGuideVisual(step.title);
  return productGuideVisual(step.title, moduleKey);
}

function candleGuideVisual(title) {
  const scenes = {
    'SELECT MODE': ['CHOOSE HOW IT WORKS','FLAME = WICK / WARMER = NO WICK','mode'],
    'SELECT VESSEL': ['PICK ONE TESTED VESSEL','BLACK / WHITE / LAB DROP','vessel'],
    'BUILD HOME FRAGRANCE': ['SMELL CANDLE-SAFE NOTES','ONLY ACTIVE NOTES MAY BE USED','notes'],
    'FORMULA': ['WEIGH THE FRAGRANCE','STOP AT THE APPROVED TOTAL','scale'],
    'PREP VESSEL': ['CENTER THE WICK','PRESS TAB DOWN / ADD CENTERING BAR','wick'],
    'WAX': ['STAFF DISPENSES HOT WAX','GUESTS DO NOT TOUCH THE BULK MELTER','staff'],
    'TEMPERATURE CHECKPOINT': ['STOP HERE','WAIT FOR YOUR LAB GUIDE TO APPROVE','temp'],
    'ADD FRAGRANCE': ['ADD + STIR SLOWLY','USE THE DISPLAYED GRAMS / SCRAPE SIDES','stir'],
    'POUR': ['POUR SLOWLY','KEEP THE VESSEL LEVEL / HOT WAX','pour'],
    'COOLING': ['MOVE TO YOUR NUMBER','DO NOT MOVE AGAIN UNTIL SET','cool'],
    'NAME': ['NAME YOUR CANDLE','WRITE IT EXACTLY AS IT SHOULD PRINT','name'],
    'LABEL': ['CENTER + SMOOTH','PRESS FROM THE MIDDLE OUT','label'],
    'FORMULA CARD': ['SAVE THE BUILD FILE','MODE / VESSEL / NOTES / BATCH','card'],
    'CURE': ['WAIT BEFORE USE','READY DATE APPEARS ON YOUR FILE','cure'],
    'COMPLETE': ['EXPERIMENT COMPLETE','FOLLOW YOUR MODE-SPECIFIC CARE CARD','done']
  };
  const scene = scenes[title] || [title,'FOLLOW THE DISPLAYED INSTRUCTION','candle'];
  return `<div class="guided-demo practical-step-demo"><div class="practical-visual visual-${scene[2]}"><div class="candle-tool"><i></i><b></b><em></em></div><div class="action-hand"><i></i></div><span class="action-path">→</span><strong class="approval-stamp">${scene[2] === 'staff' || scene[2] === 'temp' ? 'LAB GUIDE' : 'YOUR STEP'}</strong></div><div class="practical-copy"><b>${scene[0]}</b><span>${scene[1]}</span></div></div>`;
}

function productGuideVisual(title, moduleKey) {
  const action = /MEASURE|REVIEW FORMULA/.test(title) ? 'measure' : /BUILD|BLEND|MIX/.test(title) ? 'mix' : /BOTTLE|PIPE|TRANSFER/.test(title) ? 'transfer' : /LABEL/.test(title) ? 'label' : /NAME/.test(title) ? 'name' : /SAVE/.test(title) ? 'save' : /COMPLETE/.test(title) ? 'complete' : 'review';
  const copy = {
    measure:['WEIGH EACH DISPLAYED AMOUNT','Check off every note as it reaches the vessel.'],
    mix:['COMBINE + MIX','Add the prepared base, then mix for the displayed time.'],
    transfer:['TRANSFER CLEANLY','Keep the bottle or jar steady and work slowly.'],
    label:['CENTER + SMOOTH','Apply the label from the center outward.'],
    name:['NAME YOUR CREATION','Enter the name exactly as it should print.'],
    save:['SAVE YOUR FORMULA','Keep this file for future recreation.'],
    complete:['EXPERIMENT COMPLETE','Review care instructions before leaving.'],
    review:['CHECK YOUR MASTER FORMULA','Confirm the selected notes before measuring.']
  }[action];
  return `<div class="guided-demo practical-step-demo product-step-demo"><div class="practical-visual visual-${action}"><div class="formula-cup"><i></i><b>${moduleLabel(moduleKey)}</b></div><span class="action-path">→</span><div class="finished-product product-${moduleKey}"><i></i><b>SUAS</b></div><strong class="approval-stamp">${title}</strong></div><div class="practical-copy"><b>${copy[0]}</b><span>${copy[1]}</span></div></div>`;
}
function renderGuidedTimeline() {
  const items = [{ label:'00 CHECK-IN', done:true }, ...guidedSharedSteps.map((step,index) => ({ label:`${step.code} ${step.exe}`, active:guidedState.phase==='shared'&&guidedState.sharedStep===index, done:guidedState.phase==='module'||guidedState.sharedStep>index })), ...guidedState.products.map((key,index) => ({ label:moduleLabel(key), active:guidedState.phase==='module'&&guidedState.moduleIndex===index, done:guidedState.completedModules.includes(key) }))];
  $('guidedTimeline').innerHTML = items.map((item) => `<span class="${item.active ? 'is-active' : ''} ${item.done ? 'is-done' : ''}"><i>${item.done ? '✓' : ''}</i>${item.label}</span>`).join('');
}
function renderGuidedExperience() {
  if (!guidedState) { showView('checkin'); return; }
  const step = currentGuidedStep();
  const moduleKey = currentGuidedModule();
  if (!step) return;
  $('guidedModuleTitle').textContent = step.exe;
  $('guidedStationLabel').textContent = `STATION ${String(guidedState.station).padStart(2,'0')}`;
  $('guidedGuestName').textContent = guidedState.guest.toUpperCase();
  $('guidedStatusChip').textContent = guidedState.status;
  $('guidedStatusChip').className = `status-${guidedState.status.toLowerCase().replaceAll(' ','-').replaceAll('/','')}`;
  $('guidedWindowTitle').textContent = guidedState.phase === 'shared' ? 'SHARED LAB FILE' : `${moduleLabel(moduleKey)} / DIGITAL LAB MANUAL`;
  $('guidedTimeGuide').textContent = step.time;
  $('guidedStepCode').textContent = step.code;
  $('guidedStepTitle').textContent = step.title;
  $('guidedStepCopy').textContent = step.copy;
  $('guidedConsoleKicker').textContent = guidedState.phase === 'shared' ? 'INSTRUCTOR-LED / SHARED' : `${moduleLabel(moduleKey)} / STATION WORK`;
  $('guidedVisual').innerHTML = guidedVisual(step, moduleKey);
  $('guidedControls').innerHTML = guidedState.phase === 'shared' ? (guidedState.sharedStep === 0 ? guidedWelcomeControls() : guidedState.sharedStep === 1 ? guidedScentControls() : guidedFormulaControls()) : guidedModuleControls(moduleKey, guidedState.moduleStep);
  $('guidedBack').disabled = guidedState.phase === 'shared' && guidedState.sharedStep === 0;
  $('guidedNext').innerHTML = guidedState.phase === 'module' && guidedState.moduleStep === guidedModules[moduleKey].steps.length - 1 ? (guidedState.moduleIndex === guidedState.products.length - 1 ? 'FINISH SESSION <span>✓</span>' : 'NEXT PRODUCT <span>-&gt;</span>') : 'NEXT <span>-&gt;</span>';
  renderGuidedTimeline();
  bindGuidedControls();
  saveGuidedState();
}
function bindGuidedControls() {
  bindGuidedChecks();
  $('guidedControls')?.querySelectorAll('[data-guided-note]').forEach((button) => button.addEventListener('click', () => {
    const note = button.dataset.guidedNote;
    if (guidedState.notes.includes(note)) { guidedState.notes = guidedState.notes.filter((item) => item !== note); delete guidedState.formulaParts[note]; }
    else if (guidedState.notes.length < 4) { guidedState.notes.push(note); guidedState.formulaParts[note] = 1; }
    saveGuidedState(); renderGuidedExperience();
  }));
  $('guidedControls')?.querySelectorAll('[data-formula-note]').forEach((input) => input.addEventListener('input', () => { guidedState.formulaParts[input.dataset.formulaNote] = Number(input.value) || 1; saveGuidedState(); }));
  $('saveMasterFormula')?.addEventListener('click', () => { saveMasterFormula(); renderGuidedExperience(); });
  $('guidedControls')?.querySelectorAll('[data-product-option]').forEach((button) => button.addEventListener('click', () => { guidedState.productData[button.dataset.productOption] = button.dataset.value; saveGuidedState(); renderGuidedExperience(); }));
  $('guidedControls')?.querySelectorAll('[data-product-field]').forEach((input) => input.addEventListener('input', () => { guidedState.productData[input.dataset.productField] = input.value; saveGuidedState(); }));
  $('requestTempApproval')?.addEventListener('click', () => { guidedState.status = 'WAITING FOR LAB GUIDE'; saveGuidedState(); $('checkpointPassword').value = ''; $('checkpointError').textContent = ''; $('checkpointModal').hidden = false; renderGuidedExperience(); });
  $('startCooling')?.addEventListener('click', () => { if (!guidedState.productData.coolingEndsAt) guidedState.productData.coolingEndsAt = new Date(Date.now() + getGuidedSettings().candle.coolingMinutes * 60000).toISOString(); guidedState.status = 'COOLING / RESTING'; saveGuidedState(); renderGuidedExperience(); startCoolingTicker(); });
  $('guidedControls')?.querySelectorAll('[data-save-guided-formula]').forEach((button) => button.addEventListener('click', () => saveGuidedFormulaToAccount()));
}
function saveMasterFormula() {
  const parts = guidedState.notes.map((note) => ({ note, parts: Math.max(.25, Number(guidedState.formulaParts[note] || 1)) }));
  const total = parts.reduce((sum,item) => sum + item.parts, 0) || 1;
  guidedState.masterFormula = parts.map((item) => ({ note:item.note, parts:item.parts, ratio:item.parts/total }));
  saveGuidedState();
}
function guidedCanAdvance() {
  if (guidedState.phase === 'shared' && guidedState.sharedStep === 1 && !guidedState.notes.length) return 'Choose at least one scent note.';
  if (guidedState.phase === 'shared' && guidedState.sharedStep === 2 && !guidedState.masterFormula) return 'Save the master formula before continuing.';
  if (guidedState.phase === 'shared') return '';
  const moduleKey = currentGuidedModule();
  const step = guidedModules[moduleKey]?.steps[guidedState.moduleStep]?.[1];
  if (moduleKey === 'candle' && step === 'SELECT MODE' && !guidedState.productData.candleMode) return 'Choose Flame Mode or Warmer Mode.';
  if (moduleKey === 'candle' && step === 'SELECT VESSEL' && !guidedState.productData.vessel) return 'Choose a vessel.';
  if (moduleKey === 'candle' && step === 'TEMPERATURE CHECKPOINT' && !guidedState.productData.tempApprovedAt) return 'A Lab Guide must approve the wax temperature.';
  return '';
}
$('guidedNext')?.addEventListener('click', () => {
  const error = guidedCanAdvance();
  if (error) { $('guidedControls').insertAdjacentHTML('afterbegin', `<p class="guided-alert">${error}</p>`); return; }
  if (guidedState.phase === 'shared') {
    if (guidedState.sharedStep < guidedSharedSteps.length - 1) guidedState.sharedStep += 1;
    else { guidedState.phase = 'module'; guidedState.moduleStep = 0; }
  } else {
    const key = currentGuidedModule();
    if (guidedState.moduleStep < guidedModules[key].steps.length - 1) guidedState.moduleStep += 1;
    else {
      if (!guidedState.completedModules.includes(key)) guidedState.completedModules.push(key);
      if (guidedState.moduleIndex < guidedState.products.length - 1) { guidedState.moduleIndex += 1; guidedState.moduleStep = 0; }
      else { guidedState.status = 'COMPLETE'; saveGuidedState(); showView('summary'); return; }
    }
  }
  if (!['COOLING / RESTING'].includes(guidedState.status)) guidedState.status = 'IN PROGRESS';
  saveGuidedState(); renderGuidedExperience();
});
$('guidedBack')?.addEventListener('click', () => {
  if (guidedState.phase === 'shared') guidedState.sharedStep = Math.max(0,guidedState.sharedStep-1);
  else if (guidedState.moduleStep > 0) guidedState.moduleStep -= 1;
  else if (guidedState.moduleIndex > 0) { guidedState.moduleIndex -= 1; guidedState.moduleStep = guidedModules[currentGuidedModule()].steps.length - 1; }
  else { guidedState.phase = 'shared'; guidedState.sharedStep = guidedSharedSteps.length - 1; }
  saveGuidedState(); renderGuidedExperience();
});
function saveGuidedFormulaToAccount() {
  const account = getActiveAccount();
  if (!account) { store.set('pendingFormulaSave', true); store.set('accountNotice','Sign in or create an account to save this master scent formula.'); showView('accounts'); return; }
  const accounts = getAccounts();
  const saved = accounts.find((item) => item.email === account.email);
  saved.creations ||= [];
  saved.creations.unshift({ id:crypto.randomUUID(), title:guidedState.productData.perfumeName || 'GUIDED MASTER FORMULA', type:'GUIDED LAB', details:guidedState.masterFormula.map((item) => `${item.note} ${Math.round(item.ratio*100)}%`).join(' / '), date:new Date().toLocaleDateString() });
  store.set('accounts',accounts); store.set('accountNotice','Guided formula saved to your formula book.');
}
let coolingInterval;
function startCoolingTicker() { clearInterval(coolingInterval); coolingInterval = setInterval(() => { if ($('coolingClock') && guidedState?.productData?.coolingEndsAt) { $('coolingClock').textContent = coolingTime(guidedState.productData.coolingEndsAt); if (new Date(guidedState.productData.coolingEndsAt) <= Date.now()) { guidedState.status='IN PROGRESS'; saveGuidedState(); clearInterval(coolingInterval); } } },1000); }
$('checkpointForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (await hashPassword($('checkpointPassword').value) !== store.get('staffPasswordHash')) { $('checkpointError').textContent='That staff password is not correct.'; return; }
  guidedState.productData.tempApprovedAt = new Date().toISOString(); guidedState.status='IN PROGRESS'; saveGuidedState(); $('checkpointModal').hidden=true; renderGuidedExperience();
});
$('cancelCheckpoint')?.addEventListener('click', () => { $('checkpointModal').hidden=true; });
function renderInstructorDashboard() {
  const sessions = store.get('stationSessions', []).sort((a,b) => a.station-b.station);
  const active = sessions.filter((item) => item.status !== 'COMPLETE');
  const waiting = active.filter((item) => item.status === 'WAITING FOR LAB GUIDE').length;
  const cooling = active.filter((item) => item.status === 'COOLING / RESTING').length;
  $('floorSummary').innerHTML = `<span><b>${active.length}</b> ACTIVE</span><span><b>${waiting}</b> WAITING</span><span><b>${cooling}</b> COOLING</span>`;
  $('stationDashboard').innerHTML = Array.from({length:6},(_,index) => {
    const station = index+1; const item = sessions.find((session) => session.station===station && session.status!=='COMPLETE') || sessions.find((session) => session.station===station);
    if (!item) return `<article class="station-card is-empty"><header><b>STATION ${String(station).padStart(2,'0')}</b><span>AVAILABLE</span></header><p>READY FOR CHECK-IN</p></article>`;
    const key = item.phase === 'shared' ? null : item.products[item.moduleIndex];
    const rawStep = key ? guidedModules[key]?.steps[item.moduleStep] : null;
    const step = item.phase === 'shared' ? guidedSharedSteps[item.sharedStep]?.exe : rawStep?.[1];
    const coolingClock = item.productData?.coolingEndsAt ? coolingTime(item.productData.coolingEndsAt) : '';
    return `<article class="station-card status-card-${item.status.toLowerCase().replaceAll(' ','-').replaceAll('/','')}"><header><b>STATION ${String(station).padStart(2,'0')}</b><span>${item.status}</span></header><h3>${key ? moduleLabel(key) : 'SHARED LAB'}</h3><p>${step || 'SESSION FILE'}${coolingClock ? ` / ${coolingClock}` : ''}</p><small>${item.guest.toUpperCase()} / ${guidedExperiences[item.purchase]?.name || item.purchase}</small><div><button type="button" data-open-station="${item.id}">OPEN STATION</button>${item.status === 'WAITING FOR LAB GUIDE' ? `<button type="button" data-approve-station="${item.id}">APPROVE CHECKPOINT</button>` : ''}</div></article>`;
  }).join('');
  $('stationDashboard').querySelectorAll('[data-open-station]').forEach((button) => button.addEventListener('click', () => { guidedState = sessions.find((item)=>item.id===button.dataset.openStation); store.set('guidedState',guidedState); showView('guided'); }));
  $('stationDashboard').querySelectorAll('[data-approve-station]').forEach((button) => button.addEventListener('click', () => { const item=sessions.find((session)=>session.id===button.dataset.approveStation); if(item){item.productData.tempApprovedAt=new Date().toISOString();item.status='IN PROGRESS';store.set('stationSessions',sessions);if(guidedState?.id===item.id){guidedState=item;store.set('guidedState',item);}renderInstructorDashboard();} }));
}
$('refreshDashboard')?.addEventListener('click', renderInstructorDashboard);
function populateGuidedSettings() {
  const settings=getGuidedSettings(); const candle=settings.candle; const formula=settings.formula;
  if($('candlePrice')) $('candlePrice').value=candle.price;
  if($('candleDay')) $('candleDay').value=candle.day;
  if($('candleWaxGrams')) $('candleWaxGrams').value=candle.waxGrams;
  if($('candleLoad')) $('candleLoad').value=candle.maxLoadPercent;
  if($('candleCureDays')) $('candleCureDays').value=candle.cureDays;
  if($('candleCoolingMinutes')) $('candleCoolingMinutes').value=candle.coolingMinutes;
  if($('candleLabDrop')) $('candleLabDrop').value=candle.labDrop;
  if($('candleScentCatalog')) $('candleScentCatalog').value=candle.approvedNotes.join('\n');
  if($('perfumeFragranceMl')) $('perfumeFragranceMl').value=formula.perfumeFragranceMl;
  if($('bodyOilLoad')) $('bodyOilLoad').value=formula.bodyOilLoadPercent;
  if($('butterLoad')) $('butterLoad').value=formula.butterLoadPercent;
}
$('saveCandleSettings')?.addEventListener('click', () => { const settings=getGuidedSettings(); settings.candle={ price:Number($('candlePrice').value)||85, day:Number($('candleDay').value), waxGrams:Number($('candleWaxGrams').value)||200, maxLoadPercent:Number($('candleLoad').value)||10, cureDays:Number($('candleCureDays').value)||7, coolingMinutes:Number($('candleCoolingMinutes').value)||45, labDrop:$('candleLabDrop').value.trim().toUpperCase()||'IRIDESCENT', approvedNotes:[...new Set($('candleScentCatalog').value.split(/\r?\n|,/).map((item)=>item.trim().toUpperCase()).filter(Boolean))] }; store.set('guidedSettings',settings); $('saveCandleSettings').textContent='CANDLE SETTINGS SAVED'; syncGuidedCheckin(); });
$('saveFormulaSettings')?.addEventListener('click', () => { const settings=getGuidedSettings(); settings.formula={ perfumeFragranceMl:Number($('perfumeFragranceMl').value)||6, bodyOilLoadPercent:Number($('bodyOilLoad').value)||3, butterLoadPercent:Number($('butterLoad').value)||1 }; store.set('guidedSettings',settings); $('saveFormulaSettings').textContent='FORMULA LIMITS SAVED'; });

renderOilBook();
loadLabelDraft();
syncLabelPreview();
updateAdminProgress();
updateAdminSettings();
populateGuidedSettings();
syncGuidedCheckin();
showView('home');

