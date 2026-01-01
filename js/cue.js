let isPlacingCueBall = true;
let isDraggingCueBall = false;

function resetCueBallState() {
  isPlacingCueBall = true;
  isDraggingCueBall = false;

  if (typeof cueBall !== 'undefined' && cueBall) {
    Matter.World.remove(world, cueBall.body);
    cueBall = null;
  }
}

function cueIsPointInD(x, y) {
  if (x < BAULK_LINE_X) return false;
  return dist(x, y, BAULK_LINE_X, TABLE_CENTER_Y) <= D_RADIUS;
}

function cueEnsureCueBallAt(x, y) {
  const clampedX = constrain(x, BAULK_LINE_X, BAULK_LINE_X + D_RADIUS);
  const clampedY = constrain(y, TABLE_Y + BALL_RADIUS, TABLE_Y + TABLE_WIDTH - BALL_RADIUS);

  if (!cueIsPointInD(clampedX, clampedY)) return;

  if (!cueBall) {
    cueBall = new Ball(
      clampedX,
      clampedY,
      BALL_DIAMETER,
      COLORS.balls.white,
      { isStatic: true },
      { type: 'cue', colorName: 'white', points: 0 }
    );
  } else {
    Matter.Body.setPosition(cueBall.body, { x: clampedX, y: clampedY });
    Matter.Body.setVelocity(cueBall.body, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(cueBall.body, 0);
  }
}

function cueBallsAreAtRest() {
  const threshold = 0.08;
  const allBalls = [];
  if (typeof reds !== 'undefined') allBalls.push(...reds);
  if (typeof coloredBalls !== 'undefined') allBalls.push(...coloredBalls);
  if (typeof cueBall !== 'undefined' && cueBall) allBalls.push(cueBall);

  for (const b of allBalls) {
    if (b.body.speed > threshold) return false;
  }
  return true;
}

function cueDraw() {
  if (!cueBall) {
    cueDrawPlaceHint();
    return;
  }

  cueBall.draw();

  if (isPlacingCueBall) {
    cueDrawPlaceHint();
    return;
  }

  if (!cueBallsAreAtRest()) return;

  const p = cueBall.body.position;
  const dx = mouseX - p.x;
  const dy = mouseY - p.y;
  const len = Math.hypot(dx, dy);
  if (len < 0.001) return;

  const dirX = dx / len;
  const dirY = dy / len;

  if (typeof guideEnabled !== 'undefined' && guideEnabled) {
    cueDrawShotGuide(p.x, p.y, dirX, dirY);
  }

  if (typeof divergenceEnabled !== 'undefined' && divergenceEnabled) {
    cueDrawDivergenceGuide(p.x, p.y, dirX, dirY);
  }

  const powerDist = constrain(len, 0, CUE_POWER_MAX_DIST);
  const powerT = powerDist / CUE_POWER_MAX_DIST;
  const pullBack = CUE_MIN_PULL + (CUE_MAX_PULL - CUE_MIN_PULL) * powerT;

  const cueStartX = p.x - dirX * (BALL_RADIUS + CUE_GAP + pullBack);
  const cueStartY = p.y - dirY * (BALL_RADIUS + CUE_GAP + pullBack);
  const cueEndX = cueStartX - dirX * CUE_LENGTH;
  const cueEndY = cueStartY - dirY * CUE_LENGTH;

  push();
  stroke(...COLORS.cue);
  strokeWeight(CUE_THICKNESS);
  line(cueStartX, cueStartY, cueEndX, cueEndY);

  stroke(...COLORS.line);
  strokeWeight(Math.max(1, MARK_LINE_WIDTH * 0.7));
  const aimLen = Math.min(CUE_AIM_LINE_LENGTH, len);
  line(p.x, p.y, p.x + dirX * aimLen, p.y + dirY * aimLen);
  pop();
}

function cueDrawDivergenceGuide(x, y, dirX, dirY) {
  if (!cueBall) return;

  const hit = cueFindFirstBallHit(x, y, dirX, dirY);
  if (!hit) return;

  const impactX = x + dirX * hit.t;
  const impactY = y + dirY * hit.t;

  const nx0 = hit.cx - impactX;
  const ny0 = hit.cy - impactY;
  const nLen = Math.hypot(nx0, ny0) || 1;
  const nx = nx0 / nLen;
  const ny = ny0 / nLen;

  const dotIn = dirX * nx + dirY * ny;
  const tx0 = dirX - nx * dotIn;
  const ty0 = dirY - ny * dotIn;
  const tLen = Math.hypot(tx0, ty0);

  push();
  noFill();

  stroke(255, 255, 255, DIVERGENCE_GHOST_ALPHA);
  strokeWeight(Math.max(1, BALL_DIAMETER * 0.08));
  ellipse(impactX, impactY, BALL_DIAMETER, BALL_DIAMETER);

  stroke(DIVERGENCE_TARGET_COLOR[0], DIVERGENCE_TARGET_COLOR[1], DIVERGENCE_TARGET_COLOR[2], 190);
  strokeWeight(Math.max(1, BALL_DIAMETER * 0.09));
  line(hit.cx, hit.cy, hit.cx + nx * DIVERGENCE_LINE_LEN, hit.cy + ny * DIVERGENCE_LINE_LEN);

  if (tLen > 0.0001) {
    const tx = tx0 / tLen;
    const ty = ty0 / tLen;
    stroke(DIVERGENCE_CUE_COLOR[0], DIVERGENCE_CUE_COLOR[1], DIVERGENCE_CUE_COLOR[2], 190);
    line(impactX, impactY, impactX + tx * DIVERGENCE_LINE_LEN, impactY + ty * DIVERGENCE_LINE_LEN);
  }

  pop();
}

function cueFindFirstBallHit(x, y, dirX, dirY) {
  const candidates = [];
  if (typeof reds !== 'undefined' && Array.isArray(reds)) candidates.push(...reds);
  if (typeof coloredBalls !== 'undefined' && Array.isArray(coloredBalls)) candidates.push(...coloredBalls);

  const r = BALL_RADIUS * 2;
  const r2 = r * r;

  let best = null;
  let bestT = Infinity;

  for (const b of candidates) {
    if (!b || !b.body) continue;
    if (b._potted) continue;

    const c = b.body.position;
    const vx = c.x - x;
    const vy = c.y - y;
    const proj = vx * dirX + vy * dirY;
    if (proj <= 0) continue;

    const px = x + dirX * proj;
    const py = y + dirY * proj;
    const dx = c.x - px;
    const dy = c.y - py;
    const d2 = dx * dx + dy * dy;
    if (d2 > r2) continue;

    const thc = Math.sqrt(Math.max(0, r2 - d2));
    const tHit = proj - thc;
    if (tHit <= 0) continue;

    if (tHit < bestT) {
      bestT = tHit;
      best = { t: tHit, cx: c.x, cy: c.y };
    }
  }

  return best;
}

function cueDrawShotGuide(x, y, dirX, dirY) {
  const inset = Math.max(POCKET_RADIUS * 0.9, BALL_RADIUS * 0.8);

  const left = TABLE_X + inset;
  const right = TABLE_X + TABLE_LENGTH - inset;
  const top = TABLE_Y + inset;
  const bottom = TABLE_Y + TABLE_WIDTH - inset;

  const hit = cueRayToCushion(x, y, dirX, dirY, left, right, top, bottom);
  if (!hit) return;

  const len2 = BALL_DIAMETER * 12;
  const bx = hit.x + hit.rdx * len2;
  const by = hit.y + hit.rdy * len2;

  push();
  stroke(GUIDE_COLOR[0], GUIDE_COLOR[1], GUIDE_COLOR[2], 170);
  strokeWeight(Math.max(1, BALL_DIAMETER * 0.08));
  line(x, y, hit.x, hit.y);

  stroke(GUIDE_COLOR[0], GUIDE_COLOR[1], GUIDE_COLOR[2], 110);
  line(hit.x, hit.y, bx, by);
  pop();
}

function cueRayToCushion(x, y, dx, dy, left, right, top, bottom) {
  let tMin = Infinity;
  let hitAxis = null;

  if (dx > 0) {
    const t = (right - x) / dx;
    if (t > 0 && t < tMin) {
      tMin = t;
      hitAxis = 'x';
    }
  } else if (dx < 0) {
    const t = (left - x) / dx;
    if (t > 0 && t < tMin) {
      tMin = t;
      hitAxis = 'x';
    }
  }

  if (dy > 0) {
    const t = (bottom - y) / dy;
    if (t > 0 && t < tMin) {
      tMin = t;
      hitAxis = 'y';
    }
  } else if (dy < 0) {
    const t = (top - y) / dy;
    if (t > 0 && t < tMin) {
      tMin = t;
      hitAxis = 'y';
    }
  }

  if (!isFinite(tMin) || !hitAxis) return null;

  const hx = x + dx * tMin;
  const hy = y + dy * tMin;

  if (hx < left - 0.001 || hx > right + 0.001 || hy < top - 0.001 || hy > bottom + 0.001) {
    return null;
  }

  const rdx = hitAxis === 'x' ? -dx : dx;
  const rdy = hitAxis === 'y' ? -dy : dy;

  return { x: hx, y: hy, rdx, rdy };
}

function cueDrawPlaceHint() {
  push();
  noFill();
  stroke(...COLORS.line);
  strokeWeight(Math.max(1, MARK_LINE_WIDTH * 0.8));
  arc(BAULK_LINE_X, TABLE_CENTER_Y, D_RADIUS * 2, D_RADIUS * 2, -HALF_PI, HALF_PI);
  line(BAULK_LINE_X, TABLE_Y, BAULK_LINE_X, TABLE_Y + TABLE_WIDTH);
  pop();
}

function cueMousePressed() {
  if (!cueBall) {
    if (cueIsPointInD(mouseX, mouseY)) {
      cueEnsureCueBallAt(mouseX, mouseY);
      isPlacingCueBall = true;
      isDraggingCueBall = true;
    }
    return;
  }

  if (isPlacingCueBall) {
    const p = cueBall.body.position;
    if (dist(mouseX, mouseY, p.x, p.y) <= BALL_DIAMETER * 0.75) {
      isDraggingCueBall = true;
    }
  }
}

function cueMouseDragged() {
  if (!isDraggingCueBall) return;
  cueEnsureCueBallAt(mouseX, mouseY);
}

function cueMouseReleased() {
  if (!cueBall) return;

  if (isDraggingCueBall) {
    isDraggingCueBall = false;

    if (isPlacingCueBall && cueIsPointInD(cueBall.body.position.x, cueBall.body.position.y)) {
      isPlacingCueBall = false;
      Matter.Body.setStatic(cueBall.body, false);
    }

    return;
  }

  if (isPlacingCueBall) {
    if (cueIsPointInD(cueBall.body.position.x, cueBall.body.position.y)) {
      isPlacingCueBall = false;
      Matter.Body.setStatic(cueBall.body, false);
    }
    return;
  }

  cueShoot();
}

function cueShoot() {
  if (!cueBall) return;
  if (isPlacingCueBall) return;
  if (!cueBallsAreAtRest()) return;

  if (typeof gameStartShot === 'function') {
    gameStartShot();
  }

  const p = cueBall.body.position;
  const dx = mouseX - p.x;
  const dy = mouseY - p.y;
  const len = Math.hypot(dx, dy);
  if (len < CUE_MIN_SHOT_DIST) return;

  const dirX = dx / len;
  const dirY = dy / len;

  const powerDist = constrain(len, CUE_MIN_SHOT_DIST, CUE_POWER_MAX_DIST);
  const powerT = (powerDist - CUE_MIN_SHOT_DIST) / (CUE_POWER_MAX_DIST - CUE_MIN_SHOT_DIST);
  const forceMag = CUE_FORCE_MIN + (CUE_FORCE_MAX - CUE_FORCE_MIN) * powerT;

  if (typeof spawnCueImpact === 'function') {
    spawnCueImpact(p.x, p.y);
  }

  // Apply force from cue shot
  Matter.Body.applyForce(cueBall.body, p, {
    x: dirX * forceMag,
    y: dirY * forceMag
  });

  // Apply spin from spin selector immediately
  if (typeof spinSelector !== 'undefined' && cueBall) {
    const spin = spinSelector.getSpin();
    // 20x sensitivity
    const spinMagnitude = Math.max(spin.magnitude * 20, 0.1);
    cueBall.setSpin(spin.x, spin.y, spinMagnitude);
    console.log('Spin applied:', { x: spin.x, y: spin.y, magnitude: spinMagnitude });
  }

  // Reset spin selector
  if (typeof spinSelector !== 'undefined' && spinSelector.reset) {
    spinSelector.reset();
  }
}

