// ---------- 하단 UI ----------
const memoryLine = document.getElementById('memoryLine');
const gH = document.getElementById('gH'), gE = document.getElementById('gE'), gB = document.getElementById('gB');
const feedBtn = document.getElementById('feedBtn');
const restBtn = document.getElementById('restBtn');
const playBtn = document.getElementById('playBtn');
const memoryBtn = document.getElementById('memoryBtn');
const moreBtn = document.getElementById('moreBtn');
const returnBtn = document.getElementById('returnBtn');
const walkBtn = document.getElementById('walkBtn');
const battleBtn = document.getElementById('battleBtn');
const shopBtn = document.getElementById('shopBtn');
const notebookBtn = document.getElementById('notebookBtn');
const sheetScrim = document.getElementById('sheetScrim');
const moreSheet = document.getElementById('moreSheet');
const notebookScrim = document.getElementById('notebookScrim');
const notebookPanel = document.getElementById('notebookPanel');
const notebookCloseBtn = document.getElementById('notebookCloseBtn');
const notebookTogether = document.getElementById('notebookTogether');
const notebookStage = document.getElementById('notebookStage');
const notebookTraitsSection = document.getElementById('notebookTraitsSection');
const notebookTraits = document.getElementById('notebookTraits');
const notebookPebbles = document.getElementById('notebookPebbles');
const notebookBodyStats = document.getElementById('notebookBodyStats');
const memoryScrim = document.getElementById('memoryScrim');
const memoryPanel = document.getElementById('memoryPanel');
const memoryCloseBtn = document.getElementById('memoryCloseBtn');
const memoryGroups = document.getElementById('memoryGroups');
const shopScrim = document.getElementById('shopScrim');
const shopPanel = document.getElementById('shopPanel');
const shopCloseBtn = document.getElementById('shopCloseBtn');
const shopBalance = document.getElementById('shopBalance');
const shopList = document.getElementById('shopList');
const STAGE_NOTEBOOK_LABELS = { egg: '알', baby: '아기', adult: '어른' };
const TRAIT_NOTEBOOK_LABELS = {
  cuddly: '손길 좋아함',
  foodie: '밥 기억 좋음',
  mellow: '느긋함',
};
closeMoreSheet();
closeNotebook();
closeMemory();
closeShop();
feedBtn.addEventListener('click', () => {
  if (isTraveling()) {
    pet.caption = '가는 중이라 안 됨';
    pet.captionT = 0;
    return;
  }
  if (currentPlace() !== 'home') {
    pet.caption = '집 가서 먹을래';
    pet.captionT = 0;
    return;
  }
  if (isEggStage()) {
    nudgeEgg('아직 밥 몰라');
    return;
  }
  if (food) {
    pet.caption = '밥 여기 있어';
    pet.captionT = 0;
    if (input.mode !== 'drag' && needs.hunger < 0.98) setBehavior('eat');
    return;
  }
  if (needs.hunger > 0.9) {
    rejectFoodWhenFull();
    return;
  }
  const nextFood = nextFoodType();
  food = {
    x: clamp(pet.x + rand(-170, 170), 90, W - 90),
    y: clamp(pet.y + rand(-70, 70), H * 0.45, H * 0.82),
    kind: nextFood.id,
  };
  pet.caption = mealCaption(nextFood);
  pet.captionT = 0;
  pet.munchT = 0;
  if (input.mode !== 'drag') {
    pet.behavior = 'eat';
    pet.behaviorT = rand(BEHAVIORS.eat.dur[0], BEHAVIORS.eat.dur[1]);
  }
});
restBtn.addEventListener('click', () => {
  if (input.mode === 'drag') return;
  requestRest();
});
playBtn.addEventListener('click', () => {
  requestPlayBall();
});
memoryBtn.addEventListener('click', () => {
  openMemory();
});
moreBtn.addEventListener('click', () => {
  if (moreSheet.hidden) openMoreSheet();
  else closeMoreSheet();
});
returnBtn.addEventListener('click', () => {
  if (isTraveling()) return;
  requestWalk();
});
walkBtn.addEventListener('click', () => {
  requestWalk();
  closeMoreSheet();
});
battleBtn.addEventListener('click', () => {
  requestBattle();
  closeMoreSheet();
});
shopBtn.addEventListener('click', () => {
  openShop();
});
notebookBtn.addEventListener('click', () => {
  openNotebook();
});
sheetScrim.addEventListener('click', closeMoreSheet);
notebookScrim.addEventListener('click', closeNotebook);
notebookCloseBtn.addEventListener('click', closeNotebook);
memoryScrim.addEventListener('click', closeMemory);
memoryCloseBtn.addEventListener('click', closeMemory);
shopScrim.addEventListener('click', closeShop);
shopCloseBtn.addEventListener('click', closeShop);
function openMoreSheet() {
  if (currentPlace() !== 'home' || isTraveling()) return;
  sheetScrim.hidden = false;
  moreSheet.hidden = false;
  moreSheet.classList.add('is-open');
  moreBtn.setAttribute('aria-expanded', 'true');
}
function closeMoreSheet() {
  sheetScrim.hidden = true;
  moreSheet.classList.remove('is-open');
  moreSheet.hidden = true;
  moreBtn.setAttribute('aria-expanded', 'false');
}
function openNotebook() {
  closeMoreSheet();
  renderNotebook();
  notebookScrim.hidden = false;
  notebookPanel.hidden = false;
}
function closeNotebook() {
  notebookScrim.hidden = true;
  notebookPanel.hidden = true;
}
function openMemory() {
  closeMoreSheet();
  renderMemoryPanel();
  memoryScrim.hidden = false;
  memoryPanel.hidden = false;
  memoryBtn.setAttribute('aria-expanded', 'true');
}
function closeMemory() {
  memoryScrim.hidden = true;
  memoryPanel.hidden = true;
  memoryBtn.setAttribute('aria-expanded', 'false');
}
function openShop() {
  closeMoreSheet();
  renderShop();
  shopScrim.hidden = false;
  shopPanel.hidden = false;
}
function closeShop() {
  shopScrim.hidden = true;
  shopPanel.hidden = true;
}
function appendNotebookItem(list, text) {
  const item = document.createElement('li');
  item.textContent = text;
  list.appendChild(item);
}
function renderPawScale(value) {
  const scale = document.createElement('div');
  scale.className = 'paw-scale';
  const filled = Math.round(clamp(value, 0, 5));
  for (let i = 0; i < 5; i++) {
    const mark = document.createElement('span');
    mark.className = `paw-mark${i < filled ? ' is-filled' : ''}`;
    scale.appendChild(mark);
  }
  return scale;
}
function statObservation(key, value) {
  const lines = STAT_OBSERVATIONS[key];
  if (value <= 1) return lines[0];
  if (value <= 3) return lines[1];
  return lines[2];
}
function memoryEntriesNewestFirst() {
  return careStats.memoryLog
    .map((entry, index) => {
      if (typeof entry === 'string') return { text: entry, at: 0, index };
      if (!entry || typeof entry !== 'object') return { text: '', at: 0, index };
      const at = Number(entry.at);
      return { text: entry.text, at: Math.max(0, Number.isFinite(at) ? at : 0), index };
    })
    .filter(entry => typeof entry.text === 'string' && entry.text.trim())
    .sort((a, b) => b.at - a.at || b.index - a.index);
}
function memoryGroupTitle(at) {
  if (!at) return '예전';
  const age = dayStamp(nowTime()) - dayStamp(at);
  if (age <= 0) return '오늘';
  if (age === 1) return '어제';
  if (age <= 6) return `${age}일 전`;
  return '예전';
}
function appendMemoryGroup(title, entries) {
  const section = document.createElement('section');
  const heading = document.createElement('h3');
  const list = document.createElement('ul');
  heading.textContent = title;
  for (const entry of entries) appendNotebookItem(list, entry.text);
  section.appendChild(heading);
  section.appendChild(list);
  memoryGroups.appendChild(section);
}
function renderMemoryPanel() {
  memoryGroups.textContent = '';
  const groups = new Map();
  for (const entry of memoryEntriesNewestFirst()) {
    const title = memoryGroupTitle(entry.at);
    if (!groups.has(title)) groups.set(title, []);
    groups.get(title).push(entry);
  }
  for (const title of ['오늘', '어제', '2일 전', '3일 전', '4일 전', '5일 전', '6일 전', '예전']) {
    const entries = groups.get(title);
    if (entries && entries.length) appendMemoryGroup(title, entries);
  }
}
function renderNotebook() {
  notebookTogether.textContent = `함께한 지 ${togetherDays()}일`;
  notebookStage.textContent = STAGE_NOTEBOOK_LABELS[currentStage()] || '알';
  notebookTraits.textContent = '';
  const traits = careTraitNames();
  notebookTraitsSection.hidden = traits.length === 0;
  for (const trait of traits) appendNotebookItem(notebookTraits, TRAIT_NOTEBOOK_LABELS[trait] || trait);
  notebookPebbles.textContent = `주워온 반짝 ${careStats.pebbles}개`;
  notebookBodyStats.textContent = '';
  for (const key of STAT_KEYS) {
    const row = document.createElement('div');
    row.className = 'body-stat';
    const label = document.createElement('div');
    label.textContent = STAT_LABELS[key];
    const observation = document.createElement('div');
    observation.className = 'body-observation';
    observation.textContent = statObservation(key, careStats.stats[key]);
    const hint = document.createElement('div');
    hint.className = 'body-stat-hint';
    hint.textContent = STAT_HINTS[key];
    row.appendChild(label);
    row.appendChild(renderPawScale(careStats.stats[key]));
    row.appendChild(observation);
    row.appendChild(hint);
    notebookBodyStats.appendChild(row);
  }
}
function renderShop() {
  shopBalance.textContent = `주워온 반짝 ${careStats.pebbles}개`;
  shopList.textContent = '';
  for (const item of FURNITURE_ITEMS) {
    const row = document.createElement('div');
    row.className = 'shop-item';
    const preview = document.createElement('canvas');
    preview.className = 'shop-preview';
    preview.setAttribute('aria-hidden', 'true');
    if (typeof preview.getContext === 'function') drawFurniturePreviewCanvas(preview, item.id);
    const text = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'shop-name';
    name.textContent = item.name;
    const note = document.createElement('div');
    note.className = 'shop-note';
    note.textContent = item.note;
    text.appendChild(name);
    text.appendChild(note);
    const button = document.createElement('button');
    button.className = 'shop-buy';
    const owned = hasFurniture(item.id);
    button.textContent = owned ? '집에 있음' : `${item.price}개`;
    button.disabled = owned || careStats.pebbles < item.price;
    button.addEventListener('click', () => {
      if (buyFurniture(item.id)) renderShop();
    });
    row.appendChild(preview);
    row.appendChild(text);
    row.appendChild(button);
    shopList.appendChild(row);
  }
}
function setButtonLocked(button, locked) {
  button.classList.toggle('is-locked', locked);
  button.dataset.locked = locked ? 'true' : 'false';
  button.setAttribute('aria-disabled', locked ? 'true' : 'false');
}
function updateGauges() {
  const stage = currentStage();
  const place = currentPlace();
  const traveling = isTraveling();
  const memoryText = careStats.lastCareLine || '오늘 아직 아무 일 없음';
  document.body.dataset.stage = stage;
  document.body.dataset.place = place;
  document.body.dataset.away = place !== 'home' || traveling ? 'true' : 'false';
  gH.style.width = needs.hunger * 100 + '%';
  gH.style.background = needs.hunger < 0.3 ? 'var(--care-low)' : 'var(--care-hunger)';
  gE.style.width = needs.energy * 100 + '%';
  gE.style.background = needs.energy < 0.3 ? 'var(--care-low)' : 'var(--care-energy)';
  gB.style.width = needs.bond * 100 + '%';
  gB.style.background = needs.bond < 0.25 ? 'var(--care-bond-low)' : 'var(--care-bond)';
  memoryLine.textContent = stage !== 'egg' && memoryText === '아직 세상 구경 전' ? '오늘 아직 아무 일 없음' : memoryText;
  setButtonLocked(feedBtn, stage === 'egg');
  setButtonLocked(restBtn, stage === 'egg');
  setButtonLocked(playBtn, stage !== 'adult');
  setButtonLocked(walkBtn, stage === 'egg' || Boolean(battle));
  setButtonLocked(battleBtn, stage !== 'adult');
  setButtonLocked(shopBtn, false);
  setButtonLocked(notebookBtn, false);
  returnBtn.textContent = traveling ? '이동중' : '귀가';
  setButtonLocked(returnBtn, traveling);
  if (place !== 'home' || traveling) closeMoreSheet();
}

// ---------- 루프 ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  update(dt);
  draw(now / 1000);
  updateGauges();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
