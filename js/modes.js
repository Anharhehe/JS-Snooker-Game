// Mark modes module as loaded
console.log('*** modes.js loaded ***');
if (typeof window !== 'undefined') window.MODES_MODULE_LOADED = true;

let currentMode = 1;

function setMode(mode) {
  currentMode = mode;
  clearBalls();

  if (typeof resetCueBallState === 'function') {
    resetCueBallState();
  }

  if (typeof gameOnModeReset === 'function') {
    gameOnModeReset();
  }

  if (mode === 1) {
    buildMode1();
  } else if (mode === 2) {
    buildMode2();
  } else if (mode === 3) {
    buildMode3();
  }
}

function buildMode1() {
  createColoredBallsOnSpots();

  const maxApexX = SPOTS.black.x - BALL_DIAMETER * 6;
  const apexX = Math.min(SPOTS.pink.x + BALL_DIAMETER * 1.2, maxApexX);
  const apexY = TABLE_CENTER_Y;

  const dx = BALL_DIAMETER * 0.87;
  const dy = BALL_DIAMETER;

  for (let i = 0; i < 5; i++) {
    for (let j = 0; j <= i; j++) {
      const x = apexX + i * dx;
      const y = apexY + (j - i / 2) * dy;
      reds.push(new Ball(x, y, BALL_DIAMETER, COLORS.balls.red, null, { type: 'red', colorName: 'red', points: 1 }));
    }
  }
}

function buildMode2() {
  createColoredBallsOnSpots();

  const clusters = 3;
  const redsPerCluster = 5;
  const clusterRadius = BALL_DIAMETER * 3.5;

  for (let c = 0; c < clusters; c++) {
    const cx = random(BAULK_LINE_X + D_RADIUS + BALL_DIAMETER * 2, SPOTS.pink.x - BALL_DIAMETER * 6);
    const cy = random(TABLE_Y + BALL_DIAMETER * 3, TABLE_Y + TABLE_WIDTH - BALL_DIAMETER * 3);

    for (let i = 0; i < redsPerCluster; i++) {
      const placed = tryPlaceRed({
        minX: cx - clusterRadius,
        maxX: cx + clusterRadius,
        minY: cy - clusterRadius,
        maxY: cy + clusterRadius
      });

      if (!placed) {
        tryPlaceRed(getPlayAreaBounds());
      }
    }
  }
}

function buildMode3() {
  createColoredBallsOnSpots();

  for (let i = 0; i < 15; i++) {
    tryPlaceRed(getPlayAreaBounds());
  }
}

function createColoredBallsOnSpots() {
  coloredBalls.push(new Ball(SPOTS.yellow.x, SPOTS.yellow.y, BALL_DIAMETER, COLORS.balls.yellow, null, { type: 'colour', colorName: 'yellow', points: 2 }));
  coloredBalls.push(new Ball(SPOTS.green.x, SPOTS.green.y, BALL_DIAMETER, COLORS.balls.green, null, { type: 'colour', colorName: 'green', points: 3 }));
  coloredBalls.push(new Ball(SPOTS.brown.x, SPOTS.brown.y, BALL_DIAMETER, COLORS.balls.brown, null, { type: 'colour', colorName: 'brown', points: 4 }));
  coloredBalls.push(new Ball(SPOTS.blue.x, SPOTS.blue.y, BALL_DIAMETER, COLORS.balls.blue, null, { type: 'colour', colorName: 'blue', points: 5 }));
  coloredBalls.push(new Ball(SPOTS.pink.x, SPOTS.pink.y, BALL_DIAMETER, COLORS.balls.pink, null, { type: 'colour', colorName: 'pink', points: 6 }));
  coloredBalls.push(new Ball(SPOTS.black.x, SPOTS.black.y, BALL_DIAMETER, COLORS.balls.black, null, { type: 'colour', colorName: 'black', points: 7 }));
}

function getPlayAreaBounds() {
  const inset = Math.max(POCKET_RADIUS * 1.1, BALL_RADIUS * 2.1);
  return {
    minX: TABLE_X + inset,
    maxX: TABLE_X + TABLE_LENGTH - inset,
    minY: TABLE_Y + inset,
    maxY: TABLE_Y + TABLE_WIDTH - inset
  };
}

function tryPlaceRed(bounds) {
  const maxAttempts = 250;
  const minDist = BALL_DIAMETER * 1.05;

  for (let a = 0; a < maxAttempts; a++) {
    const x = random(bounds.minX, bounds.maxX);
    const y = random(bounds.minY, bounds.maxY);

    let ok = true;
    for (const b of reds) {
      const p = b.body.position;
      if (dist(x, y, p.x, p.y) < minDist) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;

    for (const b of coloredBalls) {
      const p = b.body.position;
      if (dist(x, y, p.x, p.y) < minDist) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;

    reds.push(new Ball(x, y, BALL_DIAMETER, COLORS.balls.red, null, { type: 'red', colorName: 'red', points: 1 }));
    return true;
  }

  return false;
}
