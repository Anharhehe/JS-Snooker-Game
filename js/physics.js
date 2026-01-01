let engine;
let world;
let tableWalls = [];

function initPhysics() {
  engine = Matter.Engine.create();
  world = engine.world;
  world.gravity.y = 0;

  Matter.Events.on(engine, 'collisionStart', (event) => {
    try {
      // Apply pending spin on first cue ball contact with another ball
      if (typeof pendingSpinData !== 'undefined' && pendingSpinData && !cueBallHasHitBall && cueBall && cueBall.body) {
        if (event && event.pairs) {
          for (const pair of event.pairs) {
            if (!pair || !pair.bodyA || !pair.bodyB) continue;
            
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;
            
            // Check if cue ball is involved
            if ((bodyA && bodyA === cueBall.body) || (bodyB && bodyB === cueBall.body)) {
              const otherBody = (bodyA && bodyA === cueBall.body) ? bodyB : bodyA;
              // Check if hitting another ball (has ballRef property)
              if (otherBody && otherBody.ballRef) {
                console.log('Cue ball hit another ball! Applying pending spin:', pendingSpinData);
                cueBall.setSpin(pendingSpinData.x, pendingSpinData.y, pendingSpinData.magnitude);
                cueBallHasHitBall = true;
                pendingSpinData = null;
              }
            }
          }
        }
      }
      
      // Only handle collision sound
      if (event && event.pairs) {
        handleCollisionSound(event);
      }
      
      if (typeof gameHandleCollisionStart === 'function') {
        gameHandleCollisionStart(event);
      }
    } catch (e) {
      console.error('Collision error (safely ignored):', e);
    }
  });

  createTableWalls();
}

function updatePhysics() {
  if (!engine) return;
  Matter.Engine.update(engine, 1000 / 60);
}

function createTableWalls() {
  if (!world) return;

  if (tableWalls.length > 0) {
    Matter.World.remove(world, tableWalls);
    tableWalls.length = 0;
  }

  const t = Math.max(30, BALL_DIAMETER * 2);
  const gapHalf = POCKET_RADIUS * 1.25;

  const leftEdge = TABLE_X;
  const rightEdge = TABLE_X + TABLE_LENGTH;
  const topEdge = TABLE_Y;
  const bottomEdge = TABLE_Y + TABLE_WIDTH;

  const opts = {
    isStatic: true,
    restitution: CUSHION_RESTITUTION,
    friction: CUSHION_FRICTION,
    frictionStatic: CUSHION_FRICTION_STATIC
  };

  const addHWall = (x1, x2, yCenter) => {
    const w = x2 - x1;
    if (w <= 1) return;
    tableWalls.push(Matter.Bodies.rectangle((x1 + x2) / 2, yCenter, w, t, opts));
  };

  const addVWall = (y1, y2, xCenter) => {
    const h = y2 - y1;
    if (h <= 1) return;
    tableWalls.push(Matter.Bodies.rectangle(xCenter, (y1 + y2) / 2, t, h, opts));
  };

  const top0 = POCKETS[0].x;
  const top1 = POCKETS[1].x;
  const top2 = POCKETS[2].x;
  const bot0 = POCKETS[3].x;
  const bot1 = POCKETS[4].x;
  const bot2 = POCKETS[5].x;

  const yTopCenter = topEdge - t / 2;
  const yBottomCenter = bottomEdge + t / 2;
  const xLeftCenter = leftEdge - t / 2;
  const xRightCenter = rightEdge + t / 2;

  addHWall(Math.max(leftEdge, top0 + gapHalf), top1 - gapHalf, yTopCenter);
  addHWall(top1 + gapHalf, Math.min(rightEdge, top2 - gapHalf), yTopCenter);

  addHWall(Math.max(leftEdge, bot0 + gapHalf), bot1 - gapHalf, yBottomCenter);
  addHWall(bot1 + gapHalf, Math.min(rightEdge, bot2 - gapHalf), yBottomCenter);

  const yTopPocket = POCKETS[0].y;
  const yBottomPocket = POCKETS[3].y;
  addVWall(yTopPocket + gapHalf, yBottomPocket - gapHalf, xLeftCenter);
  addVWall(yTopPocket + gapHalf, yBottomPocket - gapHalf, xRightCenter);

  Matter.World.add(world, tableWalls);
}

function clearBalls() {
  if (!world) return;
  if (Array.isArray(reds)) {
    for (const b of reds) Matter.World.remove(world, b.body);
    reds.length = 0;
  }
  if (Array.isArray(coloredBalls)) {
    for (const b of coloredBalls) Matter.World.remove(world, b.body);
    coloredBalls.length = 0;
  }

  if (typeof cueBall !== 'undefined' && cueBall) {
    Matter.World.remove(world, cueBall.body);
    cueBall = null;
  }
}

function handleCollisionSound(event) {
  try {
    if (!soundManager || typeof soundManager.playCollisionSound !== 'function') {
      return;
    }

    if (!event || !event.pairs) return;

    // Calculate collision intensity based on velocities
    let maxSpeed = 0;

    for (const pair of event.pairs) {
      if (!pair || !pair.bodyA || !pair.bodyB) continue;
      
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;

      // Get velocities safely
      const speedA = (bodyA && bodyA.velocity) ? Math.sqrt(bodyA.velocity.x ** 2 + bodyA.velocity.y ** 2) : 0;
      const speedB = (bodyB && bodyB.velocity) ? Math.sqrt(bodyB.velocity.x ** 2 + bodyB.velocity.y ** 2) : 0;

      maxSpeed = Math.max(maxSpeed, speedA, speedB);
    }

    // Normalize speed to 0-1 intensity (assuming max ball speed is around 20)
    const intensity = Math.min(1, maxSpeed / 20);

    // Only play sound if intensity is noticeable
    if (intensity > 0.05) {
      soundManager.playCollisionSound(intensity);
    }
  } catch (e) {
    console.error('Error in handleCollisionSound:', e);
  }
}

