'use strict';
// 마우스와 터치를 포인터 이벤트 하나로 처리 (모바일 대응)
const mouse = { x: -999, y: -999, px: -999, py: -999, moveAmt: 0 };
window.addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

const input = {
  active: false,
  pointerId: null,
  pointerType: '',
  mode: 'idle',
  startX: 0, startY: 0,
  x: -999, y: -999,
  px: -999, py: -999,
  downAt: 0,
  lastMoveAt: 0,
  dragOffsetX: 0, dragOffsetY: 0,
  furnitureId: '',
  furnitureCancelled: false,
  dragTalkT: 0,
  releaseVX: 0, releaseVY: 0,
  tapCooldown: 0,
};


// ---------- 상호작용 ----------
function petHitTest(x, y, scale = 1.7) {
  const s = depthScale();
  if (currentStage() === 'egg') {
    const rx = pet.r * s * 0.62 * scale;
    const ry = pet.r * s * 0.82 * scale;
    const dx = (x - pet.x) / rx;
    const dy = (y - (pet.y + pet.jy - pet.r * s * 0.68)) / ry;
    return dx * dx + dy * dy < 1;
  }
  const r = stagedRadius();
  return dist(x, y, pet.x, pet.y + pet.jy - r) < r * scale;
}

function isTouchPointer(e) { return e.pointerType === 'touch' || e.pointerType === 'pen'; }
function isTouchType(type) { return type === 'touch' || type === 'pen'; }
function dragThreshold(e) { return isTouchPointer(e) ? 18 : 12; }
function rubThreshold(e) { return isTouchPointer(e) ? 7 : 4; }
function furniturePressThreshold() { return isTouchType(input.pointerType) ? 24 : 18; }

function surprisePet() {
  if (isEggStage()) {
    nudgeEgg();
    return;
  }
  if (input.tapCooldown > 0) return;
  input.tapCooldown = 0.16;
  const wokeAtNight = pet.behavior === 'sleep' && typeof isNightPeriod === 'function' && isNightPeriod();
  if (pet.jy > -4) pet.jvy = -240;
  else pet.jvy = Math.max(pet.jvy, -80);
  pet.squashVel = clamp(pet.squashVel - 4, -10, 10);
  pet.dizzy = Math.min(pet.dizzy + 1, 3);
  affectNeed('energy', -0.012);
  pet.caption = wokeAtNight ? '…밤임' : pet.dizzy >= 3 ? '@_@ 그만…' : '깜짝!?';
  pet.captionT = 0;
  recordRoughPlay(ROUGHNESS_SURPRISE_GAIN);
  if (pet.behavior === 'sleep' || pet.behavior === 'plop') {
    setTimeout(() => {
      setBehavior('stare');
      if (wokeAtNight) {
        pet.caption = '…밤임';
        pet.captionT = 0;
      }
    }, 0);
  }
  pet.behaviorT = Math.max(pet.behaviorT, 1.2);
  for (let i = 0; i < 4; i++) spawn('dust', pet.x + rand(-20, 20), pet.y);
}

function startDrag(e) {
  if (input.mode === 'drag') return;
  const wasFetching = pet.behavior === 'fetch';
  input.mode = 'drag';
  const liftForFinger = isTouchPointer(e) ? 28 : 8;
  input.dragOffsetX = pet.x - e.clientX;
  input.dragOffsetY = pet.y + pet.jy - e.clientY - liftForFinger;
  input.dragTalkT = rand(0.6, 1.2);
  pet.jvy = 0;
  pet.vx = 0;
  pet.vy = 0;
  pet.tripT = 0;
  if (ball && wasFetching) ball.fetchState = ball.phase === 'carried' ? 'waiting' : ball.fetchState;
  pet.behavior = 'stare';
  pet.behaviorT = Math.max(pet.behaviorT, 1.5);
  pet.caption = randomLine(PICKUP_LINES);
  pet.captionT = 0;
  pet.landCaption = '';
  pet.landingT = 0;
  reanchorFeetToBody(1);
}

function updateDrag(dt) {
  const s = depthScale();
  const targetX = clamp(input.x + input.dragOffsetX, 70, W - 70);
  const minAirGap = isTouchType(input.pointerType) ? 62 : 46;
  const airGap = isTouchType(input.pointerType) ? 96 : 72;
  let targetVisualGroundY = clamp(input.y + input.dragOffsetY, H * 0.16, H * 0.78);
  const targetGroundY = clamp(targetVisualGroundY + airGap, H * 0.4, H * 0.85);
  targetVisualGroundY = Math.min(targetVisualGroundY, targetGroundY - minAirGap);
  const prevX = pet.x, prevY = pet.y;
  const t = 1 - Math.exp(-22 * dt);
  pet.x = lerp(pet.x, targetX, t);
  pet.y = lerp(pet.y, targetGroundY, t);
  pet.jy = lerp(pet.jy, targetVisualGroundY - pet.y, 1 - Math.exp(-26 * dt));
  pet.vx = clamp((pet.x - prevX) / Math.max(dt, 0.001), -420, 420);
  pet.vy = clamp((pet.y - prevY) / Math.max(dt, 0.001), -420, 420);
  pet.dir = pet.vx < -6 ? -1 : pet.vx > 6 ? 1 : pet.dir;
  pet.squashVel = clamp(pet.squashVel + Math.sin(pet.wobblePhase * 6) * 0.04 * s, -8, 8);
  input.dragTalkT -= dt;
  if (input.dragTalkT <= 0 && pet.captionT > 0.7) {
    pet.caption = randomLine(CARRY_LINES);
    pet.captionT = 0;
    input.dragTalkT = rand(0.9, 1.8);
  }
}

function startFurnitureDrag() {
  if (!input.furnitureId || input.mode !== 'furniture-pending') return;
  const anchor = furnitureAnchor(input.furnitureId);
  input.mode = 'furniture-drag';
  input.dragOffsetX = anchor.x - input.x;
  input.dragOffsetY = anchor.y - input.y;
  furnitureMotion.heldId = input.furnitureId;
  furnitureMotion.x = anchor.x;
  furnitureMotion.y = anchor.y;
  pet.behavior = 'stare';
  pet.behaviorT = Math.max(pet.behaviorT, 1.4);
  pet.vx = 0;
  pet.vy = 0;
  if (!furnitureMotion.sessionCaptionShown) {
    furnitureMotion.sessionCaptionShown = true;
    pet.caption = '그거 옮기나';
    pet.captionT = 0;
  }
}

function updateFurnitureInput(dt) {
  if (furnitureMotion.settleT > 0) {
    furnitureMotion.settleT = Math.max(0, furnitureMotion.settleT - dt);
    if (furnitureMotion.settleT <= 0) furnitureMotion.settleId = '';
  }
  if (!input.active || !input.furnitureId) return;
  if (input.mode === 'furniture-pending') {
    const elapsed = performance.now() - input.downAt;
    const moved = dist(input.startX, input.startY, input.x, input.y);
    if (moved > furniturePressThreshold() * 1.5 && elapsed < 350) {
      input.furnitureCancelled = true;
      return;
    }
    if (!input.furnitureCancelled && elapsed >= 350) startFurnitureDrag();
  } else if (input.mode === 'furniture-drag') {
    const target = constrainedFurniturePoint(input.furnitureId, input.x + input.dragOffsetX, input.y + input.dragOffsetY);
    furnitureMotion.x = lerp(furnitureMotion.x, target.x, 1 - Math.exp(-24 * dt));
    furnitureMotion.y = lerp(furnitureMotion.y, target.y, 1 - Math.exp(-24 * dt));
    pet.dir = furnitureMotion.x > pet.x ? 1 : -1;
  }
}

function bounceReact({ lines, strength, x, y }) {
  if (pet.captionT > 0.14) {
    pet.caption = randomLine(lines);
    pet.captionT = 0;
  }
  pet.landingT = Math.max(pet.landingT, clamp(strength / 1200, 0.22, 0.65));
  affectNeed('energy', -clamp(strength / 18000, 0.006, 0.06));
  pet.squashVel = clamp(pet.squashVel - clamp(strength / 180, 1.5, 7.5), -12, 12);
  const count = clamp(Math.floor(strength / 180), 2, 7);
  for (let i = 0; i < count; i++) spawn('dust', x + rand(-14, 14), y + rand(-4, 6));
}

function finishPointer(e) {
  if (!input.active || input.pointerId !== e.pointerId) return;
  const elapsed = performance.now() - input.downAt;
  const moved = dist(input.startX, input.startY, e.clientX, e.clientY);
  const wasDrag = input.mode === 'drag';
  const wasPetting = input.mode === 'pet';
  const wasFurnitureDrag = input.mode === 'furniture-drag';
  const wasFurniturePending = input.mode === 'furniture-pending';
  if (wasDrag) {
    if (isEggStage()) {
      pet.vx = 0;
      pet.vy = 0;
      pet.jvy = 0;
      pet.jy = 0;
      nudgeEgg('여기 놓임');
    } else {
    const releaseAge = performance.now() - (input.lastMoveAt || input.downAt);
    const fresh = clamp(1 - releaseAge / 320, 0, 1);
    const throwVX = input.releaseVX * fresh;
    const throwVY = input.releaseVY * fresh;
    pet.vx = clamp(throwVX * 0.92, -1100, 1100);
    pet.vy = 0;
    pet.jy = Math.min(pet.jy, -44);
    pet.jvy = clamp(throwVY * 0.9 + 60, -1050, 1120);
    pet.squashVel = clamp(pet.squashVel - 2.4, -8, 8);
    pet.caption = randomLine(DROP_LINES);
    pet.captionT = 0;
    affectNeed('energy', -0.025);
    pet.landCaption = randomLine(LAND_LINES);
    if (recordRoughPlay(ROUGHNESS_THROW_GAIN)) pet.landCaption = '';
    pet.behavior = 'stare';
    pet.behaviorT = Math.max(pet.behaviorT, 2.2);
    }
  } else if (wasFurnitureDrag) {
    finishFurniturePlacement(input.furnitureId, furnitureMotion.x, furnitureMotion.y);
  } else if (wasFurniturePending && !input.furnitureCancelled && elapsed < 300 && moved < furniturePressThreshold()) {
    cheerWheelAt(e.clientX, e.clientY);
  } else if (!wasPetting && elapsed < 260 && moved < rubThreshold(e) * 1.4 && petHitTest(e.clientX, e.clientY, 1.8)) {
    surprisePet();
  }
  input.active = false;
  input.pointerId = null;
  input.pointerType = '';
  input.mode = 'idle';
  input.furnitureId = '';
  input.furnitureCancelled = false;
  try { cv.releasePointerCapture(e.pointerId); } catch (_) {}
}

cv.addEventListener('pointerdown', e => {
  mouse.x = e.clientX; mouse.y = e.clientY;
  const hitsPet = petHitTest(e.clientX, e.clientY, 1.85);
  const hitFurniture = hitsPet || currentPlace() !== 'home' || isTraveling() ? '' : furnitureHitTest(e.clientX, e.clientY);
  if (!hitsPet && !hitFurniture) return;
  input.active = true;
  input.pointerId = e.pointerId;
  input.pointerType = e.pointerType;
  input.mode = hitsPet ? 'pending' : 'furniture-pending';
  input.furnitureId = hitFurniture;
  input.furnitureCancelled = false;
  input.startX = e.clientX; input.startY = e.clientY;
  input.x = e.clientX; input.y = e.clientY;
  input.px = e.clientX; input.py = e.clientY;
  input.downAt = performance.now();
  input.lastMoveAt = e.timeStamp || input.downAt;
  input.releaseVX = 0; input.releaseVY = 0;
  try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  e.preventDefault();
});

cv.addEventListener('pointermove', e => {
  mouse.x = e.clientX; mouse.y = e.clientY;
  if (!input.active || input.pointerId !== e.pointerId) return;
  const elapsed = performance.now() - input.downAt;
  const fromStart = dist(input.startX, input.startY, e.clientX, e.clientY);
  const frameMove = dist(input.x, input.y, e.clientX, e.clientY);
  input.releaseVX = (e.clientX - input.x) / Math.max((e.timeStamp || performance.now()) - (input.lastMoveAt || input.downAt), 16) * 1000;
  input.releaseVY = (e.clientY - input.y) / Math.max((e.timeStamp || performance.now()) - (input.lastMoveAt || input.downAt), 16) * 1000;
  input.px = input.x; input.py = input.y;
  input.x = e.clientX; input.y = e.clientY;
  input.lastMoveAt = e.timeStamp || performance.now();

  if (input.mode === 'furniture-pending' || input.mode === 'furniture-drag') {
    if (input.mode === 'furniture-pending' && fromStart > furniturePressThreshold() * 1.5 && elapsed < 350) {
      input.furnitureCancelled = true;
    }
    e.preventDefault();
    return;
  }
  if (input.mode === 'pending' && (fromStart > dragThreshold(e) || (elapsed > 180 && fromStart > rubThreshold(e)))) startDrag(e);
  else if (input.mode === 'pending' && frameMove > rubThreshold(e)) input.mode = 'pet';
  else if (input.mode === 'pet' && fromStart > dragThreshold(e) * 1.45 && elapsed > 120) startDrag(e);
  e.preventDefault();
});

cv.addEventListener('pointerup', finishPointer);
cv.addEventListener('pointercancel', finishPointer);

function updatePetting(dt) {
  const s = depthScale();
  if (input.mode === 'drag' || input.mode === 'furniture-drag' || input.mode === 'furniture-pending') {
    mouse.px = mouse.x; mouse.py = mouse.y;
    return;
  }
  const over = Math.hypot(mouse.x - pet.x, mouse.y - (pet.y + pet.jy - pet.r * s)) < pet.r * s * 1.5;
  const moved = Math.hypot(mouse.x - mouse.px, mouse.y - mouse.py);
  if (over && moved > 2 && pet.behavior !== 'zoomies') {
    if (isEggStage()) {
      warmEgg(moved);
      if (pet.captionT > 1) {
        pet.caption = '따뜻함 저장 중';
        pet.captionT = 0;
      }
      mouse.px = mouse.x; mouse.py = mouse.y;
      return;
    }
    pet.happy = clamp(pet.happy + moved * 0.004, 0, 1);
    affectNeed('bond', moved * 0.00011);
    affectNeed('energy', moved * 0.000025);
    recordPetting(moved);
    if (pet.happy > 0.5 && Math.random() < dt * (3 + needs.bond * 2)) spawn('heart', pet.x + rand(-24, 24), pet.y - pet.r * s * 1.6);
    if (pet.happy > 0.5 && pet.captionT > 1) { pet.caption = randomLine(needs.bond > 0.45 ? PETTING_LINES : ['기분좋아…']); pet.captionT = 0; }
  }
  pet.happy = Math.max(0, pet.happy - dt * 0.12);
  pet.dizzy = Math.max(0, pet.dizzy - dt * 0.5);
  mouse.px = mouse.x; mouse.py = mouse.y;
}
