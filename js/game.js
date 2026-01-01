// Mark game module as loaded
console.log('*** game.js loaded ***');
if (typeof window !== 'undefined') window.GAME_MODULE_LOADED = true;

let game;

function gameInit() {
  game = {
    players: [
      { name: 'Player 1', score: 0 },
      { name: 'Player 2', score: 0 }
    ],
    current: 0,
    message: 'Place the cue ball in the D to start.',

    phase: 'reds',
    ballOn: 'red',
    clearanceIndex: 0,

    shotActive: false,
    firstContact: null,
    pottedThisShot: [],
    cueBallPottedThisShot: false
  };
}

function gameResetFrame() {
  game.players[0].score = 0;
  game.players[1].score = 0;
  game.current = 0;
  game.message = 'Place the cue ball in the D to start.';
  game.phase = 'reds';
  game.ballOn = 'red';
  game.clearanceIndex = 0;
  game.shotActive = false;
  game.firstContact = null;
  game.pottedThisShot = [];
  game.cueBallPottedThisShot = false;
}

function gameOnModeReset() {
  if (!game) gameInit();

  game.phase = 'reds';
  game.ballOn = 'red';
  game.clearanceIndex = 0;

  game.shotActive = false;
  game.firstContact = null;
  game.pottedThisShot = [];
  game.cueBallPottedThisShot = false;

  game.message = 'Place the cue ball in the D to start.';
}

function gameStartShot() {
  if (!game) gameInit();
  if (game.shotActive) return;

  game.shotActive = true;
  game.firstContact = null;
  game.pottedThisShot = [];
  game.cueBallPottedThisShot = false;
}

function gameRecordPottedBall(ball) {
  if (!game || !game.shotActive) return;

  if (ball && ball.meta && ball.meta.type === 'cue') {
    game.cueBallPottedThisShot = true;
    return;
  }

  game.pottedThisShot.push(ball);
}

function gameHandleCollisionStart(event) {
  if (!game || !game.shotActive) return;
  if (game.firstContact) return;

  for (const pair of event.pairs) {
    const a = pair.bodyA;
    const b = pair.bodyB;

    const ballA = a && a.ballRef ? a.ballRef : null;
    const ballB = b && b.ballRef ? b.ballRef : null;

    if (!ballA || !ballB) continue;

    const aIsCue = ballA.meta && ballA.meta.type === 'cue';
    const bIsCue = ballB.meta && ballB.meta.type === 'cue';

    if (aIsCue && !bIsCue) {
      game.firstContact = ballB;
      return;
    }
    if (bIsCue && !aIsCue) {
      game.firstContact = ballA;
      return;
    }
  }
}

function gameUpdate() {
  if (!game) return;
  if (!game.shotActive) return;
  if (typeof cueBallsAreAtRest !== 'function') return;

  if (!cueBallsAreAtRest()) return;

  gameEvaluateShot();
  game.shotActive = false;
  game.firstContact = null;
  game.pottedThisShot = [];
  game.cueBallPottedThisShot = false;
}

function gameEvaluateShot() {
  const opponent = 1 - game.current;
  const player = game.players[game.current];
  
  const expectedBall = game.ballOn; // 'red', 'colour', or color name (yellow, green, etc)
  const potted = game.pottedThisShot.slice();
  const first = game.firstContact;
  
  let pottedReds = 0;
  let pottedColours = [];

  // ============================================
  // CHECK: CUE BALL POTTED (immediate foul)
  // ============================================
  if (game.cueBallPottedThisShot) {
    const foulPoints = 4;
    gameAwardPoints(opponent, foulPoints);
    game.current = opponent;
    game.ballOn = 'red'; // Next player starts with red
    game.message = `${player.name} potted the cue ball! Foul. ${game.players[opponent].name} plays. +${foulPoints} points.`;
    
    // Respot any colours that were potted
    const coloursToRespot = new Set();
    for (const b of potted) {
      if (b && b.meta && b.meta.type === 'colour') coloursToRespot.add(b.meta.colorName);
    }
    for (const c of coloursToRespot) gameRespotColour(c);
    return;
  }

  // ============================================
  // CHECK: NO BALL HIT (foul)
  // ============================================
  if (!first) {
    const foulPoints = 4;
    gameAwardPoints(opponent, foulPoints);
    game.current = opponent;
    game.ballOn = 'red'; // Next player starts with red
    game.message = `${player.name} missed all balls! Foul. ${game.players[opponent].name} plays. +${foulPoints} points.`;
    return;
  }

  // Separate potted balls by type
  for (const b of potted) {
    if (b && b.meta) {
      if (b.meta.type === 'red') {
        pottedReds++;
      } else if (b.meta.type === 'colour') {
        pottedColours.push(b.meta.colorName);
      }
    }
  }

  // ============================================
  // REDS PHASE: Expected ball is 'red'
  // ============================================
  if (game.ballOn === 'red' && gameCountRedsRemaining() > 0) {
    // MUST hit a red ball first
    if (!first || !first.meta || first.meta.type !== 'red') {
      // Hit wrong ball (a colour)
      const wrongBallValue = (first && first.meta) ? first.meta.points : 4;
      const foulPoints = Math.max(4, wrongBallValue);
      gameAwardPoints(opponent, foulPoints);
      game.current = opponent;
      game.ballOn = 'red'; // Next player starts with red
      game.message = `${player.name} hit a colour instead of red! Foul. ${game.players[opponent].name} plays. +${foulPoints} points.`;
      
      // Respot any colours that were potted
      const coloursToRespot = new Set();
      for (const c of pottedColours) coloursToRespot.add(c);
      for (const c of coloursToRespot) gameRespotColour(c);
      return;
    }

    // Hit a red - check if it was potted
    if (pottedReds === 0) {
      // Hit red but didn't pot it - turn ends
      game.current = opponent;
      game.ballOn = 'red'; // Next player starts with red
      game.message = `${player.name} hit red but didn't pot it. ${game.players[opponent].name} plays.`;
      return;
    }

    // Potted one or more reds
    if (pottedReds > 1) {
      // Multiple reds potted in one shot - foul
      const foulPoints = Math.max(4, pottedReds);
      gameAwardPoints(opponent, foulPoints);
      game.current = opponent;
      game.ballOn = 'red';
      game.message = `${player.name} potted ${pottedReds} reds in one shot! Foul. ${game.players[opponent].name} plays. +${foulPoints} points.`;
      return;
    }

    // Check if any colours were potted along with the red
    if (pottedColours.length > 0) {
      // Potted a colour when shooting for red - foul
      const colourValue = (pottedColours[0] && gameBallValue(pottedColours[0])) || 4;
      const foulPoints = Math.max(4, colourValue);
      gameAwardPoints(opponent, foulPoints);
      game.current = opponent;
      game.ballOn = 'red';
      game.message = `${player.name} potted a colour with the red! Foul. ${game.players[opponent].name} plays. +${foulPoints} points.`;
      
      // Respot colours
      for (const c of pottedColours) gameRespotColour(c);
      return;
    }

    // VALID: Exactly 1 red potted, no colours
    gameAwardPoints(game.current, 1);
    
    // Check if all reds are now gone
    const redsLeft = gameCountRedsRemaining();
    if (redsLeft === 0) {
      // All reds gone - switch to colour phase
      game.phase = 'colours';
      game.ballOn = 'yellow';
      game.clearanceIndex = 0;
      game.message = `${player.name} potted red (+1). All reds gone! Now pot colours in order: Yellow first.`;
    } else {
      // Still reds on table - now must pot a colour
      game.ballOn = 'colour';
      game.message = `${player.name} potted red (+1). Now pot any colour.`;
    }
    return;
  }

  // ============================================
  // COLOUR PHASE (reds still on table): Expected ball is 'colour'
  // ============================================
  if (game.ballOn === 'colour' && gameCountRedsRemaining() > 0) {
    // MUST hit a colour ball first
    if (!first || !first.meta || first.meta.type !== 'colour') {
      // Hit a red when should hit colour
      const foulPoints = Math.max(4, 1); // Minimum 4
      gameAwardPoints(opponent, foulPoints);
      game.current = opponent;
      game.ballOn = 'red'; // Next player starts with red
      game.message = `${player.name} hit red when should hit colour! Foul. ${game.players[opponent].name} plays. +${foulPoints} points.`;
      return;
    }

    // Hit a colour - check if it was potted
    if (pottedColours.length === 0) {
      // Hit colour but didn't pot it - turn ends
      game.current = opponent;
      game.ballOn = 'red'; // Next player starts with red
      game.message = `${player.name} hit colour but didn't pot it. ${game.players[opponent].name} plays.`;
      return;
    }

    // Check if any reds were potted
    if (pottedReds > 0) {
      // Potted a red when shooting for colour - foul
      const foulPoints = Math.max(4, 1);
      gameAwardPoints(opponent, foulPoints);
      game.current = opponent;
      game.ballOn = 'red';
      game.message = `${player.name} potted a red with the colour! Foul. ${game.players[opponent].name} plays. +${foulPoints} points.`;
      return;
    }

    // Check if multiple colours were potted
    if (pottedColours.length > 1) {
      // Multiple colours potted - foul
      const foulPoints = Math.max(4, gameBallValue(pottedColours[0]));
      gameAwardPoints(opponent, foulPoints);
      game.current = opponent;
      game.ballOn = 'red';
      game.message = `${player.name} potted multiple colours! Foul. ${game.players[opponent].name} plays. +${foulPoints} points.`;
      
      // Respot all colours
      for (const c of pottedColours) gameRespotColour(c);
      return;
    }

    // VALID: Exactly 1 colour potted, no reds
    const colour = pottedColours[0];
    const colourPoints = gameBallValue(colour);
    gameAwardPoints(game.current, colourPoints);
    
    // Respot the colour
    gameRespotColour(colour);
    
    // Go back to red for this player's next shot
    game.ballOn = 'red';
    game.message = `${player.name} potted ${colour.charAt(0).toUpperCase() + colour.slice(1)} (+${colourPoints}). Continue with red.`;
    return;
  }

  // ============================================
  // CLEARANCE PHASE: Colours in strict order
  // ============================================
  if (game.phase === 'colours' && gameCountRedsRemaining() === 0) {
    const clearanceOrder = gameClearanceOrder();
    const requiredColour = clearanceOrder[game.clearanceIndex];
    
    // MUST hit the required colour
    if (!first || !first.meta || first.meta.type !== 'colour' || first.meta.colorName !== requiredColour) {
      // Hit wrong colour
      const wrongValue = (first && first.meta) ? first.meta.points : 4;
      const foulPoints = Math.max(4, wrongValue);
      gameAwardPoints(opponent, foulPoints);
      game.current = opponent;
      game.ballOn = clearanceOrder[game.clearanceIndex]; // Next player must pot the same colour
      game.message = `${player.name} hit wrong colour! Must pot ${requiredColour}. Foul. ${game.players[opponent].name} plays. +${foulPoints} points.`;
      
      // Respot any colours that were potted
      for (const c of pottedColours) gameRespotColour(c);
      return;
    }

    // Hit the correct colour - check if it was potted
    if (pottedColours.length === 0) {
      // Hit correct colour but didn't pot it - turn ends
      game.current = opponent;
      game.ballOn = requiredColour; // Next player must pot the same colour
      game.message = `${player.name} hit ${requiredColour} but didn't pot it. ${game.players[opponent].name} plays.`;
      return;
    }

    // Check if any reds were potted (shouldn't be any left)
    if (pottedReds > 0) {
      const foulPoints = 4;
      gameAwardPoints(opponent, foulPoints);
      game.current = opponent;
      game.ballOn = requiredColour;
      game.message = `${player.name} potted a red in clearance! Foul. ${game.players[opponent].name} plays. +${foulPoints} points.`;
      return;
    }

    // Check if multiple colours were potted
    if (pottedColours.length > 1) {
      const foulPoints = Math.max(4, gameBallValue(requiredColour));
      gameAwardPoints(opponent, foulPoints);
      game.current = opponent;
      game.ballOn = requiredColour;
      game.message = `${player.name} potted multiple colours! Foul. ${game.players[opponent].name} plays. +${foulPoints} points.`;
      
      for (const c of pottedColours) gameRespotColour(c);
      return;
    }

    // VALID: Correct colour potted
    const colourPoints = gameBallValue(requiredColour);
    gameAwardPoints(game.current, colourPoints);
    
    // Remove colour (don't respot in clearance)
    gameRemoveColourFromTable(requiredColour);
    game.clearanceIndex++;

    if (game.clearanceIndex >= clearanceOrder.length) {
      // All colours cleared - game over
      game.message = `${player.name} cleared the table! Frame won with ${game.players[game.current].score} points.`;
      return;
    }

    const nextColour = clearanceOrder[game.clearanceIndex];
    game.ballOn = nextColour;
    game.message = `${player.name} potted ${requiredColour} (+${colourPoints}). Continue with ${nextColour}.`;
    return;
  }
}

function gameSwitchTurn(msg) {
  game.current = 1 - game.current;
  game.message = msg;
}

function gameAwardPoints(playerIndex, pts) {
  game.players[playerIndex].score += pts;
}

function gameGetExpectedBallOn() {
  if (game.phase === 'clearance') {
    return gameClearanceOrder()[game.clearanceIndex] || 'black';
  }
  return game.ballOn;
}

function gameIsBallAllowed(ball, expected) {
  if (!ball || !ball.meta) return false;

  if (game.phase === 'clearance') {
    return ball.meta.type === 'colour' && ball.meta.colorName === expected;
  }

  if (expected === 'red') return ball.meta.type === 'red';
  if (expected === 'colour') return ball.meta.type === 'colour';
  return false;
}

function gameBallValue(expected) {
  if (expected === 'red') return 1;
  if (expected === 'colour') return 7;

  const map = {
    yellow: 2,
    green: 3,
    brown: 4,
    blue: 5,
    pink: 6,
    black: 7
  };
  return map[expected] || 4;
}

function gameCountRedsRemaining() {
  if (!Array.isArray(reds)) return 0;
  return reds.length;
}

function gameClearanceOrder() {
  return ['yellow', 'green', 'brown', 'blue', 'pink', 'black'];
}

function gameRespotColour(colorName) {
  if (!colorName || !SPOTS[colorName]) return;

  const spot = SPOTS[colorName];
  const rgb = COLORS.balls[colorName];
  const points = gameBallValue(colorName);

  const pos = gameFindFreeSpot(spot.x, spot.y);
  coloredBalls.push(new Ball(pos.x, pos.y, BALL_DIAMETER, rgb, null, {
    type: 'colour',
    colorName,
    points
  }));
}

function gameRemoveColourFromTable(colorName) {
  for (let i = coloredBalls.length - 1; i >= 0; i--) {
    const b = coloredBalls[i];
    if (b && b.meta && b.meta.type === 'colour' && b.meta.colorName === colorName) {
      coloredBalls.splice(i, 1);
    }
  }
}

function gameFindFreeSpot(x, y) {
  const all = [];
  if (Array.isArray(reds)) all.push(...reds);
  if (Array.isArray(coloredBalls)) all.push(...coloredBalls);
  if (typeof cueBall !== 'undefined' && cueBall) all.push(cueBall);

  const minD = BALL_DIAMETER * 1.05;
  const isFree = (px, py) => {
    for (const b of all) {
      if (!b || !b.body) continue;
      const p = b.body.position;
      if (dist(px, py, p.x, p.y) < minD) return false;
    }
    return true;
  };

  if (isFree(x, y)) return { x, y };

  for (let r = BALL_DIAMETER * 0.6; r < BALL_DIAMETER * 4; r += BALL_DIAMETER * 0.6) {
    for (let a = 0; a < TWO_PI; a += PI / 6) {
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (isFree(px, py)) return { x: px, y: py };
    }
  }

  return { x, y };
}

function gameDrawHUD() {
  if (!game) return;

  // Update Player 1
  const p1Name = document.getElementById('player1-name');
  const p1Score = document.getElementById('player1-score');
  const p1BallsOn = document.getElementById('player1-balls-on');
  const p1Turn = document.getElementById('player1-turn');
  
  if (p1Name) p1Name.textContent = game.players[0].name;
  if (p1Score) p1Score.textContent = game.players[0].score;
  
  const on = gameGetExpectedBallOn();
  if (p1BallsOn) p1BallsOn.textContent = on;
  
  // Update Player 2
  const p2Name = document.getElementById('player2-name');
  const p2Score = document.getElementById('player2-score');
  const p2BallsOn = document.getElementById('player2-balls-on');
  const p2Turn = document.getElementById('player2-turn');
  
  if (p2Name) p2Name.textContent = game.players[1].name;
  if (p2Score) p2Score.textContent = game.players[1].score;
  if (p2BallsOn) p2BallsOn.textContent = on;

  // Update turn indicators
  if (p1Turn) {
    if (game.current === 0) {
      p1Turn.textContent = 'YOUR TURN';
      p1Turn.classList.add('active');
    } else {
      p1Turn.textContent = 'WAITING';
      p1Turn.classList.remove('active');
    }
  }

  if (p2Turn) {
    if (game.current === 1) {
      p2Turn.textContent = 'YOUR TURN';
      p2Turn.classList.add('active');
    } else {
      p2Turn.textContent = 'WAITING';
      p2Turn.classList.remove('active');
    }
  }

  // Update status panel
  const statusMessage = document.getElementById('status-message');
  const statusPhase = document.getElementById('status-phase');
  
  if (statusMessage) statusMessage.textContent = game.message;
  if (statusPhase) statusPhase.textContent = `Phase: ${game.phase} | Ball On: ${on}`;
}
