// ---------- 하단 UI ----------
const memoryLine = document.getElementById('memoryLine');
const gH = document.getElementById('gH'), gE = document.getElementById('gE'), gB = document.getElementById('gB');
document.getElementById('feedBtn').addEventListener('click', () => {
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
document.getElementById('restBtn').addEventListener('click', () => {
  if (input.mode === 'drag') return;
  requestRest();
});
document.getElementById('playBtn').addEventListener('click', () => {
  requestPlayBall();
});
document.getElementById('battleBtn').addEventListener('click', () => {
  requestBattle();
});
function setButtonLocked(button, locked) {
  button.classList.toggle('is-locked', locked);
  button.dataset.locked = locked ? 'true' : 'false';
}
function updateGauges() {
  const stage = currentStage();
  const memoryText = careStats.lastCareLine || '오늘 아직 아무 일 없음';
  document.body.dataset.stage = stage;
  gH.style.width = needs.hunger * 100 + '%';
  gH.style.background = needs.hunger < 0.3 ? 'var(--care-low)' : 'var(--care-hunger)';
  gE.style.width = needs.energy * 100 + '%';
  gE.style.background = needs.energy < 0.3 ? 'var(--care-low)' : 'var(--care-energy)';
  gB.style.width = needs.bond * 100 + '%';
  gB.style.background = needs.bond < 0.25 ? 'var(--care-bond-low)' : 'var(--care-bond)';
  memoryLine.textContent = stage !== 'egg' && memoryText === '아직 세상 구경 전' ? '오늘 아직 아무 일 없음' : memoryText;
  setButtonLocked(document.getElementById('feedBtn'), stage === 'egg');
  setButtonLocked(document.getElementById('restBtn'), stage === 'egg');
  setButtonLocked(document.getElementById('playBtn'), stage !== 'adult');
  const battleBtn = document.getElementById('battleBtn');
  battleBtn.textContent = battle ? '응원' : '전투';
  setButtonLocked(battleBtn, stage !== 'adult');
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
