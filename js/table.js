function drawTable() {
  noStroke();
  fill(...COLORS.border);
  rect(
    TABLE_X - TABLE_BORDER,
    TABLE_Y - TABLE_BORDER,
    TABLE_LENGTH + TABLE_BORDER * 2,
    TABLE_WIDTH + TABLE_BORDER * 2,
    TABLE_CORNER_RADIUS
  );

  noFill();
  stroke(...COLORS.borderInner);
  strokeWeight(Math.max(2, TABLE_BORDER * 0.12));
  rect(
    TABLE_X - TABLE_BORDER * 0.55,
    TABLE_Y - TABLE_BORDER * 0.55,
    TABLE_LENGTH + TABLE_BORDER * 1.1,
    TABLE_WIDTH + TABLE_BORDER * 1.1,
    Math.max(10, TABLE_CORNER_RADIUS * 0.85)
  );

  noStroke();
  fill(...COLORS.cloth);
  rect(TABLE_X, TABLE_Y, TABLE_LENGTH, TABLE_WIDTH, Math.max(8, TABLE_CORNER_RADIUS * 0.55));

  drawMarkings();
  drawSpots();
  drawPockets();
}

function drawPockets() {
  fill(...COLORS.pocket);
  noStroke();

  for (const p of POCKETS) {
    ellipse(p.x, p.y, POCKET_DIAMETER, POCKET_DIAMETER);
  }
}

function drawMarkings() {
  stroke(...COLORS.line);
  strokeWeight(MARK_LINE_WIDTH);
  noFill();

  line(BAULK_LINE_X, TABLE_Y, BAULK_LINE_X, TABLE_Y + TABLE_WIDTH);

  arc(BAULK_LINE_X, TABLE_CENTER_Y, D_RADIUS * 2, D_RADIUS * 2, -HALF_PI, HALF_PI);
}

function drawSpots() {
  noStroke();

  fill(...COLORS.spots.black);
  ellipse(SPOTS.black.x, SPOTS.black.y, SPOT_RADIUS * 2, SPOT_RADIUS * 2);

  fill(...COLORS.spots.pink);
  ellipse(SPOTS.pink.x, SPOTS.pink.y, SPOT_RADIUS * 2, SPOT_RADIUS * 2);

  fill(...COLORS.spots.blue);
  ellipse(SPOTS.blue.x, SPOTS.blue.y, SPOT_RADIUS * 2, SPOT_RADIUS * 2);

  fill(...COLORS.spots.brown);
  ellipse(SPOTS.brown.x, SPOTS.brown.y, SPOT_RADIUS * 2, SPOT_RADIUS * 2);

  fill(...COLORS.spots.green);
  ellipse(SPOTS.green.x, SPOTS.green.y, SPOT_RADIUS * 2, SPOT_RADIUS * 2);

  fill(...COLORS.spots.yellow);
  ellipse(SPOTS.yellow.x, SPOTS.yellow.y, SPOT_RADIUS * 2, SPOT_RADIUS * 2);
}
