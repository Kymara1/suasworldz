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
  return operationDemo('OPEN. ATTACH. CLOSE.', 'Keep the seam at 12 o’clock. With one plier on each side, rotate one hand toward you and the other away. Add both pieces, then reverse the motion until the ends meet.', `<div class="jump-photo-demo" aria-label="Three close-up photos showing the correct forward-and-back twist for opening and closing a jump ring">
    <img src="${"data:image/webp;base64,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"}" alt="Three-step jump ring guide: seam at the top, twist one side forward and one side back, attach both pieces, then reverse the twist until the seam closes flush">
    <div class="jump-photo-demo__labels"><span><b>01</b> SEAM UP / ONE HAND FORWARD + ONE BACK</span><span><b>02</b> SLIDE THE CHARM + PIECE ON</span><span><b>03</b> REVERSE THE TWIST / ENDS FLUSH</span></div>
    <div class="jump-demo__warning"><b>TWIST FRONT TO BACK.</b> <strong>NEVER PULL THE ENDS LEFT AND RIGHT.</strong></div>
    <details class="jump-video">
      <summary>WATCH THE HAND MOTION</summary>
      <div class="jump-video__frame"><iframe src="https://www.youtube-nocookie.com/embed/uhGrTfSGfGA?rel=0" title="How to open and close a jump ring correctly" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>
      <a href="https://youtu.be/uhGrTfSGfGA" target="_blank" rel="noopener">OPEN VIDEO IN YOUTUBE</a>
    </details>
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
  return `<button class="selection-choice${selected ? ' is-selected' : ''}" ${attrs} type="button"><span class="selection-choice-copy">${label}</span></button>`;
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
    attach: ['OPEN. ATTACH. CLOSE.', 'Each charm already has a jump ring attached.', 'Point the seam to 12 o’clock. Grip immediately beside it with two pliers. Rotate one hand toward you and the other away.', 'Slide both the charm loop and the piece onto the opening. Reverse the twist until the cut ends meet flush. Never pull the ring left and right.'],
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

