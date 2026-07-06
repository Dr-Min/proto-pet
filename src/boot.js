// ---------- 하단 UI ----------
const memoryLine = document.getElementById('memoryLine');
const gH = document.getElementById('gH'), gE = document.getElementById('gE'), gB = document.getElementById('gB');
const feedBtn = document.getElementById('feedBtn');
const restBtn = document.getElementById('restBtn');
const playBtn = document.getElementById('playBtn');
const moreBtn = document.getElementById('moreBtn');
const returnBtn = document.getElementById('returnBtn');
const walkBtn = document.getElementById('walkBtn');
const battleBtn = document.getElementById('battleBtn');
const notebookBtn = document.getElementById('notebookBtn');
const sheetScrim = document.getElementById('sheetScrim');
const moreSheet = document.getElementById('moreSheet');
const notebookScrim = document.getElementById('notebookScrim');
const notebookPanel = document.getElementById('notebookPanel');
const notebookCloseBtn = document.getElementById('notebookCloseBtn');
const notebookStage = document.getElementById('notebookStage');
const notebookTraitsSection = document.getElementById('notebookTraitsSection');
const notebookTraits = document.getElementById('notebookTraits');
const notebookMemories = document.getElementById('notebookMemories');
const STAGE_NOTEBOOK_LABELS = { egg: '알', baby: '아기', adult: '어른' };
const TRAIT_NOTEBOOK_LABELS = {
  cuddly: '손길 좋아함',
  foodie: '밥 기억 좋음',
  mellow: '느긋함',
};
closeMoreSheet();
closeNotebook();
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
notebookBtn.addEventListener('click', () => {
  openNotebook();
});
sheetScrim.addEventListener('click', closeMoreSheet);
notebookScrim.addEventListener('click', closeNotebook);
notebookCloseBtn.addEventListener('click', closeNotebook);
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
function appendNotebookItem(list, text) {
  const item = document.createElement('li');
  item.textContent = text;
  list.appendChild(item);
}
function renderNotebook() {
  notebookStage.textContent = STAGE_NOTEBOOK_LABELS[currentStage()] || '알';
  notebookTraits.textContent = '';
  const traits = careTraitNames();
  notebookTraitsSection.hidden = traits.length === 0;
  for (const trait of traits) appendNotebookItem(notebookTraits, TRAIT_NOTEBOOK_LABELS[trait] || trait);
  notebookMemories.textContent = '';
  const memories = careStats.memoryLog.length ? careStats.memoryLog : [careStats.lastCareLine];
  for (const line of memories.slice().reverse()) appendNotebookItem(notebookMemories, line);
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
