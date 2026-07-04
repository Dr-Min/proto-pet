// ---------- 하단 UI ----------
const gH = document.getElementById('gH'), gE = document.getElementById('gE');
document.getElementById('feedBtn').addEventListener('click', () => {
  if (food) return;
  food = {
    x: clamp(pet.x + rand(-170, 170), 90, W - 90),
    y: clamp(pet.y + rand(-70, 70), H * 0.45, H * 0.82),
  };
  if (input.mode !== 'drag') setBehavior('eat');
});
function updateGauges() {
  gH.style.width = needs.hunger * 100 + '%';
  gH.style.background = needs.hunger < 0.3 ? '#d9776b' : '#a8c686';
  gE.style.width = needs.energy * 100 + '%';
  gE.style.background = needs.energy < 0.3 ? '#d9776b' : '#8fb7d9';
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
