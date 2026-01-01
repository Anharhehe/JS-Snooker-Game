// Stores per-body trail points so moving balls leave a fading streak.
let trailByBodyId = new Map();

// One-shot effects spawned by cue hits (expanding rings).
let impactEffects = [];

// Pocket/potting effects (shrink + fade at pocket).
let potEffects = [];

function animationsUpdate(allBalls) {
  updateBallTrails(allBalls);
  updateImpactEffects();
  updatePotEffects();
  checkPocketedBalls(allBalls);
}

function animationsDrawUnderlay() {
  drawBallTrails();
}

function animationsDrawOverlay() {
  drawImpactEffects();
  drawPotEffects();
}

function spawnCueImpact(x, y) {
  impactEffects.push({
    x,
    y,
    age: 0,
    ttl: IMPACT_TTL
  });
}

function updateBallTrails(allBalls) {
  const seen = new Set();

  for (const ball of allBalls) {
    if (!ball || !ball.body) continue;

    const id = ball.body.id;
    seen.add(id);

    let trail = trailByBodyId.get(id);
    if (!trail) {
      trail = [];
      trailByBodyId.set(id, trail);
    }

    const p = ball.body.position;
    const speed = ball.body.speed;

    if (speed > TRAIL_MIN_SPEED) {
      trail.push({ x: p.x, y: p.y, a: 255 });
      if (trail.length > TRAIL_MAX_POINTS) trail.shift();
    }
  }

  for (const [id, trail] of trailByBodyId.entries()) {
    if (!seen.has(id)) {
      trailByBodyId.delete(id);
      continue;
    }

    for (const pt of trail) {
      pt.a -= TRAIL_FADE_PER_FRAME;
    }

    while (trail.length > 0 && trail[0].a <= 0) trail.shift();
  }
}

function drawBallTrails() {
  push();
  noFill();
  strokeWeight(Math.max(1, BALL_DIAMETER * 0.12));

  for (const trail of trailByBodyId.values()) {
    if (trail.length < 2) continue;

    for (let i = 1; i < trail.length; i++) {
      const p0 = trail[i - 1];
      const p1 = trail[i];
      const a = Math.max(0, Math.min(255, p1.a));
      stroke(TRAIL_COLOR[0], TRAIL_COLOR[1], TRAIL_COLOR[2], a);
      line(p0.x, p0.y, p1.x, p1.y);
    }
  }

  pop();
}

function updateImpactEffects() {
  for (const e of impactEffects) {
    e.age++;
  }
  impactEffects = impactEffects.filter(e => e.age <= e.ttl);
}

function drawImpactEffects() {
  push();
  noFill();

  for (const e of impactEffects) {
    const t = e.age / e.ttl;
    const r = IMPACT_MIN_R + (IMPACT_MAX_R - IMPACT_MIN_R) * t;
    const a = 255 * (1 - t);

    stroke(IMPACT_COLOR[0], IMPACT_COLOR[1], IMPACT_COLOR[2], a);
    strokeWeight(Math.max(1, BALL_DIAMETER * 0.12));
    ellipse(e.x, e.y, r * 2, r * 2);

    stroke(IMPACT_COLOR[0], IMPACT_COLOR[1], IMPACT_COLOR[2], a * 0.6);
    strokeWeight(Math.max(1, BALL_DIAMETER * 0.06));
    ellipse(e.x, e.y, r * 1.2, r * 1.2);
  }

  pop();
}

function startPotEffect(x, y, rgb) {
  potEffects.push({
    x,
    y,
    rgb,
    age: 0,
    ttl: POT_TTL
  });
}

function updatePotEffects() {
  for (const e of potEffects) {
    e.age++;
  }
  potEffects = potEffects.filter(e => e.age <= e.ttl);
}

function drawPotEffects() {
  push();
  noStroke();

  for (const e of potEffects) {
    const t = e.age / e.ttl;
    const d = BALL_DIAMETER * (1 - t);
    const a = 255 * (1 - t);

    fill(e.rgb[0], e.rgb[1], e.rgb[2], a);
    ellipse(e.x, e.y, Math.max(0, d), Math.max(0, d));
  }

  pop();
}

function checkPocketedBalls(allBalls) {
  if (!Array.isArray(POCKETS)) return;

  for (const ball of allBalls) {
    if (!ball || !ball.body) continue;
    if (ball._potted) continue;

    const p = ball.body.position;
    for (const pocket of POCKETS) {
      if (dist(p.x, p.y, pocket.x, pocket.y) <= POCKET_CAPTURE_RADIUS) {
        pocketBall(ball, pocket);
        break;
      }
    }
  }
}

function pocketBall(ball, pocket) {
  if (!ball || !ball.body) return;
  if (ball._potted) return;
  ball._potted = true;

  startPotEffect(pocket.x, pocket.y, ball.rgb || [255, 255, 255]);

  if (typeof gameRecordPottedBall === 'function') {
    gameRecordPottedBall(ball);
  }

  if (typeof cueBall !== 'undefined' && cueBall === ball) {
    resetCueBallState();
    return;
  }

  if (Array.isArray(reds)) removeBallFromArray(reds, ball);
  if (Array.isArray(coloredBalls)) removeBallFromArray(coloredBalls, ball);

  Matter.World.remove(world, ball.body);
  trailByBodyId.delete(ball.body.id);
}

function removeBallFromArray(arr, ball) {
  const i = arr.indexOf(ball);
  if (i >= 0) arr.splice(i, 1);
}
