let reds = [];
let coloredBalls = [];
let cueBall = null;
let guideEnabled = true;
let divergenceEnabled = true;

let gameState = 'menu';
let isGameRunning = false; // NEW: Hard block for menu rendering
let startButton;
let instructionsButton;
let backButton;

function setup() {
  const container = document.getElementById('p5-container');
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  pixelDensity(1);
  if (container) {
    let p5Canvas = document.querySelector('#p5-container canvas');
    if (p5Canvas && p5Canvas.parentElement !== container) {
      container.appendChild(p5Canvas);
    }
  }

  console.log('Setup: initializing game systems...');

  // Initialize sound manager
  if (typeof soundManager !== 'undefined' && soundManager.init) {
    console.log('Setup: initializing sound manager');
    soundManager.init();
  }

  // Initialize spin selector (HTML-based)
  if (typeof spinSelector !== 'undefined' && spinSelector.init) {
    console.log('Setup: initializing spin selector');
    spinSelector.init();
  }

  initPhysics();
  console.log('Setup: physics initialized');

  // Create menu UI buttons
  console.log('Setup: creating menu UI');
  createMenuUI();
  console.log('Setup complete');
}

function draw() {
  background(...COLORS.background);
  drawTable();

  // Debug: log gameState every 30 frames
  if (frameCount % 30 === 0) {
    console.log('Draw frame ' + frameCount + ', gameState: ' + gameState + ', isGameRunning: ' + isGameRunning);
  }

  // HARD BLOCK: if game is running, skip menu entirely
  if (isGameRunning) {
    updatePhysics();
    animationsUpdate(getAllBalls());
    animationsDrawUnderlay();
    drawAllBalls();
    cueDraw();
    animationsDrawOverlay();

    if (typeof gameUpdate === 'function') {
      gameUpdate();
    }

    if (typeof gameDrawHUD === 'function') {
      gameDrawHUD();
    }
    return;
  }

  if (gameState === 'menu') {
    drawMenuScreen();
    positionMenuButtons(); // Keep repositioning in case canvas moves
    return;
  }

  if (gameState === 'instructions') {
    drawInstructionsScreen();
    return;
  }

  updatePhysics();
  animationsUpdate(getAllBalls());
  animationsDrawUnderlay();
  drawAllBalls();
  cueDraw();
  animationsDrawOverlay();

  if (typeof gameUpdate === 'function') {
    gameUpdate();
  }

  if (typeof gameDrawHUD === 'function') {
    gameDrawHUD();
  }
}

function keyPressed() {
  if (gameState !== 'game') {
    if (gameState === 'instructions' && keyCode === 27) {
      showMenu();
    }
    return;
  }

  if (key === '1') setMode(1);
  if (key === '2') setMode(2);
  if (key === '3') setMode(3);

  if (key === 'g' || key === 'G') {
    guideEnabled = !guideEnabled;
  }

  if (key === 'd' || key === 'D') {
    divergenceEnabled = !divergenceEnabled;
  }

  if (keyCode === 32) {
    cueShoot();
  }
}

function getAllBalls() {
  const all = [];
  all.push(...reds);
  all.push(...coloredBalls);
  if (cueBall) all.push(cueBall);
  return all;
}

function mousePressed() {
  if (gameState !== 'game') return;
  cueMousePressed();
}

function mouseDragged() {
  if (gameState !== 'game') return;
  cueMouseDragged();
}

function mouseReleased() {
  if (gameState !== 'game') return;
  cueMouseReleased();
}

function drawAllBalls() {
  // Update and draw all red balls
  for (const b of reds) {
    if (b.update && typeof b.update === 'function') b.update();
    b.draw();
  }
  // Update and draw all colored balls
  for (const b of coloredBalls) {
    if (b.update && typeof b.update === 'function') b.update();
    b.draw();
  }
  // Update and draw cue ball
  if (cueBall) {
    if (cueBall.update && typeof cueBall.update === 'function') cueBall.update();
    cueBall.draw();
  }
}

function createMenuUI() {
  try {
    console.log('Creating Start button...');
    startButton = createButton('Start Game');
    startButton.mousePressed(function() {
      console.log('Start button clicked');
      startGame();
    });

    console.log('Creating Instructions button...');
    instructionsButton = createButton('Instructions');
    instructionsButton.mousePressed(function() {
      console.log('Instructions button clicked');
      showInstructions();
    });

    console.log('Creating Back button...');
    backButton = createButton('Back');
    backButton.mousePressed(function() {
      console.log('Back button clicked');
      showMenu();
    });

    // Set size
    startButton.size(180, 44);
    instructionsButton.size(180, 44);
    backButton.size(180, 44);

    console.log('All buttons created successfully');
    showMenu();
    
    // Use multiple timing attempts
    setTimeout(() => positionMenuButtons(), 50);
    setTimeout(() => positionMenuButtons(), 200);
    setTimeout(() => positionMenuButtons(), 500);
  } catch (e) {
    console.error('Error creating menu UI:', e);
  }
}

function positionMenuButtons() {
  if (!startButton || !instructionsButton || !backButton) {
    console.warn('Buttons not ready for positioning');
    return;
  }
  
  const canvas = document.querySelector('canvas');
  if (!canvas) {
    console.warn('Canvas not found');
    return;
  }
  
  const r = canvas.getBoundingClientRect();
  const centerX = r.left + r.width / 2;
  const centerY = r.top + r.height / 2;

  const w = 180;
  const h = 44;

  try {
    startButton.position(Math.round(centerX - w / 2), Math.round(centerY - 10));
    instructionsButton.position(Math.round(centerX - w / 2), Math.round(centerY + 50));
    backButton.position(Math.round(centerX - w / 2), Math.round(centerY + 115));
    console.log('Menu buttons positioned');
  } catch (e) {
    console.error('Error positioning buttons:', e);
  }
}

function showMenu() {
  gameState = 'menu';
  isGameRunning = false;
  
  // Recreate buttons if they were removed
  if (!startButton || !startButton.elt || !startButton.elt.parentNode) {
    createMenuUI();
  } else {
    if (startButton && startButton.elt) startButton.elt.style.display = 'block';
    if (instructionsButton && instructionsButton.elt) instructionsButton.elt.style.display = 'block';
    if (backButton && backButton.elt) backButton.elt.style.display = 'none';
  }
  setTimeout(() => positionMenuButtons(), 50);
}

function showInstructions() {
  gameState = 'instructions';
  isGameRunning = false;
  if (startButton && startButton.elt) startButton.elt.style.display = 'none';
  if (instructionsButton && instructionsButton.elt) instructionsButton.elt.style.display = 'none';
  if (backButton && backButton.elt) backButton.elt.style.display = 'block';
  setTimeout(() => positionMenuButtons(), 50);
}

let startGameRetries = 0;
const MAX_START_GAME_RETRIES = 50;

function startGame() {
  console.log('========================================');
  console.log('START GAME CALLED!!!');
  console.log('========================================');
  console.log('=== STARTING GAME (attempt ' + (startGameRetries + 1) + ') ===');
  
  // Check all required modules are loaded
  const ballLoaded = typeof Ball !== 'undefined' && window.BALL_MODULE_LOADED;
  const modesLoaded = typeof setMode !== 'undefined' && window.MODES_MODULE_LOADED;
  const gameLoaded = typeof gameInit !== 'undefined' && window.GAME_MODULE_LOADED;

  console.log('Module status:', { ballLoaded, modesLoaded, gameLoaded });

  if (!ballLoaded || !modesLoaded || !gameLoaded) {
    startGameRetries++;
    
    if (startGameRetries > MAX_START_GAME_RETRIES) {
      console.error('FAILED: Modules did not load after ' + MAX_START_GAME_RETRIES + ' attempts');
      console.log('Available:', {
        Ball: typeof Ball,
        setMode: typeof setMode,
        gameInit: typeof gameInit
      });
      return;
    }
    
    console.log('Retrying in 100ms... (attempt ' + (startGameRetries + 1) + ')');
    setTimeout(startGame, 100);
    return;
  }

  // Reset retry counter
  startGameRetries = 0;
  
  console.log('>>> ALL MODULES READY <<<');
  console.log('>>> SETTING gameState to GAME <<<');
  gameState = 'game';
  isGameRunning = true; // Hard flag to completely block menu rendering
  console.log('>>> gameState is now: ' + gameState);
  console.log('>>> isGameRunning is now: ' + isGameRunning);
  
  try {
    // COMPLETELY REMOVE buttons from DOM instead of hiding
    if (startButton && startButton.elt && startButton.elt.parentNode) {
      startButton.elt.parentNode.removeChild(startButton.elt);
      console.log('Start button REMOVED from DOM');
    }
    if (instructionsButton && instructionsButton.elt && instructionsButton.elt.parentNode) {
      instructionsButton.elt.parentNode.removeChild(instructionsButton.elt);
      console.log('Instructions button REMOVED from DOM');
    }
    if (backButton && backButton.elt && backButton.elt.parentNode) {
      backButton.elt.parentNode.removeChild(backButton.elt);
      console.log('Back button REMOVED from DOM');
    }
  } catch (e) {
    console.error('Error removing buttons:', e);
  }

  console.log('Initializing game');
  gameInit();

  console.log('Resetting game frame');
  gameResetFrame();

  console.log('Setting mode to 1');
  setMode(1);
  
  console.log('========================================');
  console.log('GAME FULLY STARTED! gameState = ' + gameState);
  console.log('========================================');
}

function drawMenuScreen() {
  // Safety check: if gameState is not 'menu', don't draw menu
  if (gameState !== 'menu') {
    console.log('WARNING: drawMenuScreen called but gameState is ' + gameState + ', SKIPPING menu draw');
    return;
  }
  
  push();
  fill(0, 0, 0, 120);
  rect(0, 0, width, height);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(54);
  text('Snooker Game', width / 2, height * 0.28);
  textSize(18);
  text('Click Start Game to begin', width / 2, height * 0.36);
  pop();
}

function drawInstructionsScreen() {
  push();
  fill(0, 0, 0, 160);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER, TOP);
  textSize(44);
  text('Instructions', width / 2, 70);

  textAlign(LEFT, TOP);
  textSize(18);
  const x = width * 0.15;
  const y = 150;
  const lh = 30;

  text('Controls:', x, y);
  text('1 = Standard setup (reds triangle + colours on spots)', x, y + lh);
  text('2 = Random clustered reds (colours on spots)', x, y + lh * 2);
  text('3 = Practice mode (scattered reds)', x, y + lh * 3);
  text('Click/drag inside the D to place the cue ball, then release to set it.', x, y + lh * 5);
  text('Aim with the mouse. Power depends on mouse distance from cue ball.', x, y + lh * 6);
  text('Shoot: Space OR mouse release.', x, y + lh * 7);
  text('G = Toggle cushion shot guide', x, y + lh * 9);
  text('D = Toggle divergence guide (predicted directions after contact)', x, y + lh * 10);
  text('2 Player Rules:', x, y + lh * 12);
  text('If you pot a legal ball you continue. If you miss, turn switches.', x, y + lh * 13);
  text('Fouls (e.g., hit wrong ball first, pot wrong ball, or pot cue ball) give points to opponent.', x, y + lh * 14);
  text('Ball values: Red=1, Yellow=2, Green=3, Brown=4, Blue=5, Pink=6, Black=7 (foul min = 4).', x, y + lh * 15);
  text('Rule note: potting removes balls and plays an animation.', x, y + lh * 17);

  textAlign(CENTER, TOP);
  textSize(14);
  text('Press ESC to go back', width / 2, height - 80);
  pop();
}
