// ---------- 하단 UI ----------
const memoryLine = document.getElementById('memoryLine');
const gH = document.getElementById('gH'), gE = document.getElementById('gE'), gB = document.getElementById('gB');
document.getElementById('feedBtn').addEventListener('click', () => {
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
  food = {
    x: clamp(pet.x + rand(-170, 170), 90, W - 90),
    y: clamp(pet.y + rand(-70, 70), H * 0.45, H * 0.82),
  };
  pet.caption = mealCaption();
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
function updateGauges() {
  gH.style.width = needs.hunger * 100 + '%';
  gH.style.background = needs.hunger < 0.3 ? '#d9776b' : '#a8c686';
  gE.style.width = needs.energy * 100 + '%';
  gE.style.background = needs.energy < 0.3 ? '#d9776b' : '#8fb7d9';
  gB.style.width = needs.bond * 100 + '%';
  gB.style.background = needs.bond < 0.25 ? '#d9a36b' : '#e78aa1';
  memoryLine.textContent = careStats.lastCareLine || '오늘은 아직 조용해';
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
