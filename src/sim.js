// ---------- 메인 업데이트 ----------
function update(dt) {
  input.tapCooldown = Math.max(0, input.tapCooldown - dt);
  if (typeof updateFurnitureInput === 'function') updateFurnitureInput(dt);
  const dragging = input.mode === 'drag';
  const airborne = !dragging && (Math.abs(pet.jy) > 0.01 || Math.abs(pet.jvy) > 0.01);
  const eggStage = currentStage() === 'egg';

  if (!dragging) pet.behaviorT -= dt;
  pet.captionT += dt;
  if (!dragging && pet.behaviorT <= 0) nextBehavior();

  // 이동
  let desiredVX = 0, desiredVY = 0;
  const movingToPlace = !eggStage && !dragging && !airborne && typeof travelTarget === 'function' ? travelTarget() : null;
  const movingToBattleDefeat = !movingToPlace && !eggStage && !dragging && !airborne && typeof battleDefeatReturnTarget === 'function' ? battleDefeatReturnTarget() : null;
  const movingToHomecoming = !movingToPlace && !movingToBattleDefeat && !eggStage && !dragging && !airborne && typeof homecomingTarget === 'function' ? homecomingTarget() : null;
  const movingToFurniture = !movingToPlace && !movingToBattleDefeat && !movingToHomecoming && !eggStage && !dragging && !airborne && typeof furnitureMoveTarget === 'function' ? furnitureMoveTarget() : null;
  if (!movingToPlace && !movingToBattleDefeat && !eggStage && !dragging && pet.behavior === 'fetch' && food && needs.hunger < 0.98) {
    if (ball && ball.phase === 'carried') {
      const mouth = carriedBallPoint();
      ball.x = mouth.x;
      ball.y = mouth.y;
      ball.phase = 'settled';
      ball.fetchState = 'waiting';
    }
    setBehavior('eat');
  }
  if (!movingToPlace && !movingToBattleDefeat && !eggStage && !dragging && !airborne && pet.behavior === 'eat' && pet.tripT <= 0) {
    if (!food) setBehavior('stare');
    else {
      const dx = food.x - pet.x, dy = food.y - pet.y, d = Math.hypot(dx, dy);
      if (d > 34) {
        desiredVX = dx / d * 150 * stageScale('speed');
        desiredVY = dy / d * 150 * stageScale('speed');
        pet.munchT = 0;
      } else {
        pet.munchT += dt;
        if (pet.munchT % 0.4 < dt) {
          pet.squashVel = clamp(pet.squashVel - 1.6, -12, 12);
          spawn('dust', food.x + rand(-10, 10), food.y - 10);
        }
        if (pet.munchT > 2.4) {
          const eatenFood = foodTypeById(food.kind);
          const likedFood = isFavoriteFood(eatenFood);
          const hungerGain = clamp(0.56 - needs.hunger * 0.14 + (likedFood ? 0.06 : 0), 0.36, 0.62);
          affectNeed('hunger', hungerGain);
          affectNeed('energy', likedFood ? 0.05 : 0.04);
          affectNeed('bond', likedFood ? 0.032 : 0.015);
          const routineCompleted = recordMeal(eatenFood);
          food = null;
          for (let i = 0; i < (likedFood ? 5 : 3); i++) spawn('heart', pet.x + rand(-20, 20), pet.y - pet.r);
          setBehavior('stare');
          pet.caption = routineCompleted ? '나 챙겨줬네' : likedFood ? '이거 좋아!' : '다 먹어버림';
          pet.captionT = 0;
        }
      }
    }
  }
  if (!movingToPlace && !movingToBattleDefeat && !eggStage && !dragging && !airborne && pet.behavior === 'fetch' && pet.tripT <= 0 && !food) {
    if (!ball) {
      setBehavior('stare');
    } else if (ball.fetchState === 'chase') {
      const dx = ball.x - pet.x, dy = ball.y - pet.y, d = Math.hypot(dx, dy);
      if (d > 30) {
        desiredVX = dx / d * ball.fetchSpeed * stageScale('speed');
        desiredVY = dy / d * ball.fetchSpeed * stageScale('speed');
      } else {
        catchBall();
      }
    } else if (ball.fetchState === 'return') {
      if (needs.energy < 0.3) {
        abandonFetchBall();
      } else {
        const owner = ownerPlayPoint(0.8);
        const dx = owner.x - pet.x, dy = owner.y - pet.y, d = Math.hypot(dx, dy);
        if (d > 34) {
          desiredVX = dx / d * 220 * stageScale('speed');
          desiredVY = dy / d * 220 * stageScale('speed');
        } else {
          const mouth = carriedBallPoint();
          ball.x = mouth.x;
          ball.y = mouth.y;
          dropFetchedBall();
          pet.behavior = 'stare';
          pet.behaviorT = Math.max(pet.behaviorT, 2.2);
        }
      }
    }
  }
  if (!movingToPlace && !movingToBattleDefeat && !eggStage && !dragging && !airborne && pet.behavior === 'butterfly' && pet.tripT <= 0) {
    if (!butterfly || !butterfly.active) {
      setBehavior('stare');
    } else {
      const dx = butterfly.x - pet.x;
      const dy = butterfly.y - pet.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > 30) {
        const chaseSpeed = typeof fetchChaseSpeed === 'function' ? fetchChaseSpeed(190) : 190;
        desiredVX = dx / d * chaseSpeed * stageScale('speed');
        desiredVY = dy / d * chaseSpeed * stageScale('speed');
      } else if (typeof missButterfly === 'function') {
        missButterfly(Math.random() < 0.22);
      }
    }
  }
	  if (movingToPlace && pet.tripT <= 0) {
	    const dx = movingToPlace.x - pet.x, dy = movingToPlace.y - pet.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > 18) {
      desiredVX = dx / d * 168 * stageScale('speed');
      desiredVY = dy / d * 148 * stageScale('speed');
    } else {
	      completeTravelStep();
	    }
	  }
  if (movingToBattleDefeat) {
    const dx = movingToBattleDefeat.x - pet.x, dy = movingToBattleDefeat.y - pet.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > 20) {
      const rollSpeed = typeof battleDefeatReturnSpeed === 'function' ? battleDefeatReturnSpeed() : 250;
      desiredVX = dx / d * rollSpeed;
      desiredVY = dy / d * rollSpeed * 0.82;
      pet.rollSpin = (pet.rollSpin || 0) + Math.sign(desiredVX || pet.dir) * dt * 8.5;
    } else if (typeof completeBattleDefeatReturnStep === 'function') {
      completeBattleDefeatReturnStep();
    }
  }
	  if (movingToHomecoming && pet.tripT <= 0) {
	    const dx = movingToHomecoming.x - pet.x, dy = movingToHomecoming.y - pet.y;
	    const d = Math.hypot(dx, dy) || 1;
	    if (d > 22) {
	      desiredVX = dx / d * 260 * stageScale('speed');
	      desiredVY = dy / d * 220 * stageScale('speed');
	    } else {
	      completeHomecoming();
	    }
	  }
	  if (movingToFurniture && pet.tripT <= 0) {
	    const dx = movingToFurniture.x - pet.x, dy = movingToFurniture.y - pet.y;
	    const d = Math.hypot(dx, dy) || 1;
	    if (d > 18) {
	      const targetSpeed = pet.behavior === 'wheel' ? 132 : pet.behavior === 'sleep' ? 74 : 58;
	      desiredVX = dx / d * targetSpeed * stageScale('speed');
	      desiredVY = dy / d * targetSpeed * stageScale('speed');
	    } else if (pet.behavior === 'wheel') {
	      desiredVX = Math.sin(pet.wobblePhase * 10) * 10;
	      desiredVY = Math.cos(pet.wobblePhase * 8) * 4;
	    } else if (pet.behavior === 'stare') {
	      pet.dir = furnitureAnchor('window').x > pet.x ? 1 : -1;
	    }
	  }
	  const moving = !movingToPlace && !movingToBattleDefeat && !movingToHomecoming && !eggStage && !dragging && !airborne && (pet.behavior === 'wander' || pet.behavior === 'zoomies' || pet.behavior === 'sniff');
  if (moving && pet.tripT <= 0) {
    const speed = (pet.behavior === 'zoomies' ? 260 : pet.behavior === 'sniff' ? 26 : 62) * stageScale('speed');
    const dx = pet.target.x - pet.x, dy = pet.target.y - pet.y;
    const d = Math.hypot(dx, dy);
    if (d > 14) { desiredVX = dx / d * speed; desiredVY = dy / d * speed; }
    else if (pet.behavior === 'zoomies') pickTarget();
    else if (pet.behavior === 'wander' && Math.random() < dt * 0.4) pickTarget();
  }
  if (dragging) {
    updateDrag(dt);
  } else if (airborne) {
    pet.vx *= Math.exp(-0.45 * dt);
    pet.vy = 0;
    pet.x += pet.vx * dt;
  } else {
    pet.vx = lerp(pet.vx, desiredVX, 1 - Math.exp(-8 * dt));
    pet.vy = lerp(pet.vy, desiredVY, 1 - Math.exp(-8 * dt));
    pet.x += pet.vx * dt; pet.y += pet.vy * dt;
  }
  pet.y = clamp(pet.y, H * 0.4, H * 0.85);
  if (airborne) {
    const sideLimit = stagedRadius() * 1.05;
    if (pet.x < sideLimit) {
      pet.x = sideLimit;
      pet.vx = Math.abs(pet.vx) * 0.84;
      bounceReact({ lines: BOUNCE_LINES, strength: Math.abs(pet.vx), x: pet.x, y: pet.y + pet.jy });
    } else if (pet.x > W - sideLimit) {
      pet.x = W - sideLimit;
      pet.vx = -Math.abs(pet.vx) * 0.84;
      bounceReact({ lines: BOUNCE_LINES, strength: Math.abs(pet.vx), x: pet.x, y: pet.y + pet.jy });
    }
  } else if (movingToPlace || movingToBattleDefeat) {
    pet.x = clamp(pet.x, -90, W + 90);
  } else {
    pet.x = clamp(pet.x, 80, W - 80);
  }
  if (Math.abs(pet.vx) > 6) pet.dir = Math.sign(pet.vx);

  // 가끔 자빠짐 (하찮음의 핵심)
  const sp = Math.hypot(pet.vx, pet.vy);
  const fetchTrip = pet.behavior === 'fetch' && typeof fetchTripMultiplier === 'function' ? fetchTripMultiplier() : 1;
  if (!movingToPlace && !movingToBattleDefeat && !eggStage && !dragging && pet.jy === 0 && sp > 40 && pet.tripT <= 0 && Math.random() < dt * (pet.behavior === 'zoomies' ? 0.35 : 0.07) * stageScale('trip') * fetchTrip) {
    pet.tripT = 0.9;
    pet.squashVel -= 5;
    pet.vx *= 0.15; pet.vy *= 0.15;
    pet.caption = '아이쿠;;'; pet.captionT = 0;
    for (let i = 0; i < 5; i++) spawn('dust', pet.x + rand(-24, 24), pet.y);
  }
  pet.tripT = Math.max(0, pet.tripT - dt);

  // 말랑 스프링 (부피 보존: 세로로 찌부되면 가로로 퍼짐)
  const stiff = 110, damp = 7.5;
  pet.squashVel += (1 - pet.squash) * stiff * dt - pet.squashVel * damp * dt;
  pet.squashVel = clamp(pet.squashVel, -12, 12);
  pet.squash = clamp(pet.squash + pet.squashVel * dt, 0.42, 1.5);

  // 점프
  if (!dragging && (pet.jvy !== 0 || pet.jy !== 0)) {
    pet.jvy += 900 * dt; pet.jy += pet.jvy * dt;
    const s = depthScale();
    const top = pet.y + pet.jy - stagedRadius();
    const topLimit = topBounceLimit();
    if (top < topLimit && pet.jvy < 0) {
      pet.jy = topLimit + stagedRadius() - pet.y;
      pet.jvy = Math.abs(pet.jvy) * 0.72;
      bounceReact({ lines: BOUNCE_LINES, strength: Math.abs(pet.jvy), x: pet.x, y: pet.y + pet.jy - stagedRadius() });
    }
    if (pet.jy >= 0) {
      const impact = pet.jvy;
      pet.jy = 0;
      const shouldBounce = impact > 170 || Math.abs(pet.vx) > 260;
      if (shouldBounce) {
        const bounce = clamp(0.58 + Math.min(Math.abs(pet.vx) / 1100, 1) * 0.18, 0.58, 0.76);
        pet.jvy = -Math.max(95, impact * bounce);
        pet.vx *= 0.86;
        bounceReact({ lines: BOUNCE_LINES, strength: impact + Math.abs(pet.vx) * 0.35, x: pet.x, y: pet.y });
      } else {
        pet.jvy = 0;
        pet.vx *= 0.55;
        pet.squashVel -= 3;
        if (pet.landCaption) {
          pet.caption = pet.landCaption;
          pet.captionT = 0;
          pet.landCaption = '';
        }
        pet.landingT = 1.05;
        pet.behaviorT = Math.max(pet.behaviorT, 1.35);
        for (let i = 0; i < 3; i++) spawn('dust', pet.x + rand(-18, 18), pet.y);
      }
    }
  } else if (dragging) {
    pet.jvy = 0;
  }

  // 걷기 리듬 & 잔출렁임
  pet.walkPhase += sp * dt * 0.09;
  pet.wobblePhase += dt * (2.2 + sp * 0.02);
  updateCare(dt, { airborne, speed: sp });

  // 시선: 커서가 가까우면 커서를, 아니면 허공을 본다
  const md = Math.hypot(mouse.x - pet.x, mouse.y - pet.y);
  let gx, gy;
  if (typeof furnitureMotion !== 'undefined' && furnitureMotion.heldId) {
    gx = clamp((furnitureMotion.x - pet.x) / 200, -1, 1);
    gy = clamp((furnitureMotion.y - pet.y + 60) / 200, -1, 1);
  } else if (md < 300 && pet.behavior !== 'sleep') {
    gx = clamp((mouse.x - pet.x) / 200, -1, 1); gy = clamp((mouse.y - pet.y + 60) / 200, -1, 1);
  } else {
    gx = Math.sin(pet.wobblePhase * 0.23) * 0.6; gy = Math.cos(pet.wobblePhase * 0.31) * 0.3;
  }
  pet.gazeX = lerp(pet.gazeX, gx, 1 - Math.exp(-5 * dt));
  pet.gazeY = lerp(pet.gazeY, gy, 1 - Math.exp(-5 * dt));

  // 눈 깜빡임
  pet.nextBlink -= dt;
  if (pet.nextBlink <= 0) { pet.blink = 0.14; pet.nextBlink = rand(1.5, 4.5); }
  pet.blink = Math.max(0, pet.blink - dt);
  pet.landingT = Math.max(0, pet.landingT - dt);

  // 귀 움찔
  pet.nextTwitch -= dt;
  if (pet.nextTwitch <= 0) {
    pet.earTwitch = { side: Math.random() < 0.5 ? -1 : 1, t: 0 };
    pet.nextTwitch = rand(2.5, 7);
  }
  pet.earTwitch.t += dt;

  // 잠: Zzz
  if (pet.behavior === 'sleep') {
    pet.zTimer -= dt;
    if (pet.zTimer <= 0) { spawn('z', pet.x + 30 * depthScale(), pet.y - pet.r * 1.6 * depthScale()); pet.zTimer = 1.3; }
  }

  updateFeet(dt);
  updatePetPose(dt);
  const ts = depthScale(), tr = stagedRadius();
  const tailBob = Math.abs(Math.sin(pet.walkPhase)) * -4 * (sp > 10 ? 1 : 0);
  // 기분 좋으면 살랑살랑 흔들림
  const wag = Math.sin(pet.wobblePhase * 5) * (120 + pet.happy * 1600 + needs.bond * 260);
  updateChain(tail, pet.x - pet.dir * tr * 0.8, pet.y + pet.jy + tailBob - tr * 0.6, dt, 520, wag);
  updateParticles(dt);
  updatePetting(dt);
  updateBall(dt);
}

function updateBall(dt) {
  if (!ball) return;
  ball.age += dt;
  if (clearBallIfTimedOut()) return;
  if (ball.phase === 'carried') {
    const mouth = carriedBallPoint();
    ball.x = mouth.x;
    ball.y = mouth.y;
    return;
  }
  if (ball.phase === 'fading') {
    if (ball.pendingComplete) {
      ball.pendingComplete = false;
      recordFetchComplete();
    }
    ball.fadeT -= dt;
    if (ball.fadeT <= 0) ball = null;
    return;
  }
  if (ball.phase === 'flying') {
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.jvy += 900 * dt;
    ball.jy += ball.jvy * dt;
    if (ball.jy >= 0) {
      const impact = ball.jvy;
      ball.jy = 0;
      ball.bounces += 1;
      if (ball.bounces < ball.maxBounces) {
        ball.jvy = -impact * ball.rebound;
        ball.vx *= 0.78;
        ball.vy *= 0.78;
        ball.rebound *= 0.72;
        spawn('dust', ball.x, ball.y);
      } else {
        ball.jvy = 0;
        ball.phase = 'rolling';
      }
    }
  } else if (ball.phase === 'rolling') {
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    const friction = Math.exp(-3.8 * dt);
    ball.vx *= friction;
    ball.vy *= friction;
    if (Math.hypot(ball.vx, ball.vy) < 12) {
      ball.vx = 0;
      ball.vy = 0;
      ball.phase = 'settled';
      startFetchBall();
    }
  } else if (ball.phase === 'settled') {
    if (!ball.declined && !ball.abandoned && ball.fetchState === 'waiting' && !food) startFetchBall();
  }
  if (ball) {
    ball.x = clamp(ball.x, 40, W - 40);
    ball.y = clamp(ball.y, H * 0.42, H * 0.86);
  }
}
