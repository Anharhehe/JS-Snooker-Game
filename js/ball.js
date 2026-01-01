// Mark Ball module as loaded
console.log('*** ball.js loaded ***');
if (typeof window !== 'undefined') window.BALL_MODULE_LOADED = true;

class Ball {
  constructor(x, y, diameter, rgb, bodyOptions, meta) {
    this.diameter = diameter;
    this.radius = diameter / 2;
    this.rgb = rgb;
    this.meta = meta || null;

    // Spin properties
    this.topspin = 0; // -1 (backspin) to +1 (topspin)
    this.sidespin = 0; // -1 (left) to +1 (right)
    this.spinDecay = 0.97; // Spin decays each frame

    const opts = {
      restitution: BALL_RESTITUTION,
      friction: BALL_FRICTION,
      frictionStatic: BALL_FRICTION_STATIC,
      frictionAir: BALL_FRICTION_AIR
    };

    if (bodyOptions && typeof bodyOptions === 'object') {
      Object.assign(opts, bodyOptions);
    }

    this.body = Matter.Bodies.circle(x, y, this.radius, opts);
    this.body.ballRef = this;
    this.body.topspin = 0;
    this.body.sidespin = 0;

    Matter.World.add(world, this.body);
  }

  setSpin(spinX, spinY, magnitude) {
    // Apply spin to the ball
    // spinY: positive = topspin (follow), negative = backspin (draw)
    // spinX: positive = right spin, negative = left spin
    
    this.topspin = spinY * magnitude;
    this.sidespin = spinX * magnitude;
    
    // Also store on Matter body for collision handling
    this.body.topspin = this.topspin;
    this.body.sidespin = this.sidespin;
  }

  draw() {
    const p = this.body.position;
    push();
    
    // Draw shadow beneath ball for depth
    noStroke();
    fill(0, 0, 0, 30);
    ellipse(p.x + 3, p.y + this.radius + 2, this.diameter * 0.8, this.diameter * 0.2);
    
    // Draw ball with gradient effect (fake 3D sphere)
    // Create a radial gradient effect using multiple circles
    const [r, g, b] = this.rgb;
    
    // Dark shadow on bottom-right
    fill(Math.max(r - 40, 0), Math.max(g - 40, 0), Math.max(b - 40, 0));
    ellipse(p.x + this.radius * 0.3, p.y + this.radius * 0.3, this.diameter * 0.7);
    
    // Main ball color
    fill(...this.rgb);
    ellipse(p.x, p.y, this.diameter, this.diameter);
    
    // Bright highlight on top-left for lighting
    fill(255, 255, 255, 80);
    ellipse(p.x - this.radius * 0.4, p.y - this.radius * 0.4, this.radius * 0.5);
    
    // Subtle mid-tone
    fill(255, 255, 255, 20);
    ellipse(p.x - this.radius * 0.2, p.y - this.radius * 0.2, this.radius * 0.8);
    
    // Draw spin indicator stripe
    const angle = this.body.angle || 0;
    
    // Draw topspin/backspin indicator (top/bottom line)
    if (Math.abs(this.topspin) > 0.1) {
      if (this.topspin > 0) {
        stroke(0, 200, 0); // Green for topspin
      } else {
        stroke(200, 0, 0); // Red for backspin
      }
      strokeWeight(2);
      const lineLen = this.radius * 0.5;
      line(
        p.x + Math.cos(angle) * lineLen,
        p.y + Math.sin(angle) * lineLen,
        p.x - Math.cos(angle) * lineLen,
        p.y - Math.sin(angle) * lineLen
      );
    }
    
    // Draw sidespin indicator (side line)
    if (Math.abs(this.sidespin) > 0.1) {
      if (this.sidespin > 0) {
        stroke(0, 0, 200); // Blue for right
      } else {
        stroke(200, 200, 0); // Yellow for left
      }
      strokeWeight(2);
      const perpAngle = angle + Math.PI / 2;
      const lineLen = this.radius * 0.4;
      line(
        p.x + Math.cos(perpAngle) * lineLen,
        p.y + Math.sin(perpAngle) * lineLen,
        p.x - Math.cos(perpAngle) * lineLen,
        p.y - Math.sin(perpAngle) * lineLen
      );
    }
    
    pop();
  }

  update() {
    const body = this.body;
    const speed = body.speed;

    // Apply topspin effects
    if (this.topspin > 0.05 && speed > 0.5) {
      // Topspin: follow through - ball continues forward
      const angle = Math.atan2(body.velocity.y, body.velocity.x);
      const followForce = this.topspin * 0.00003; // Small continuous force
      
      Matter.Body.applyForce(body, body.position, {
        x: Math.cos(angle) * followForce,
        y: Math.sin(angle) * followForce
      });
    }

    // Apply backspin effects
    if (this.topspin < -0.05 && speed > 0.5) {
      // Backspin: friction effect - decelerates
      Matter.Body.applyForce(body, body.position, {
        x: -body.velocity.x * Math.abs(this.topspin) * 0.0001,
        y: -body.velocity.y * Math.abs(this.topspin) * 0.0001
      });
    }

    // Apply sidespin curve effect
    if (Math.abs(this.sidespin) > 0.05 && speed > 0.8) {
      // Side spin causes ball to curve slightly
      const angle = Math.atan2(body.velocity.y, body.velocity.x);
      const perpAngle = angle + Math.PI / 2; // Perpendicular direction
      const curveForce = this.sidespin * speed * 0.00001;
      
      Matter.Body.applyForce(body, body.position, {
        x: Math.cos(perpAngle) * curveForce,
        y: Math.sin(perpAngle) * curveForce
      });
    }

    // Decay spin over time
    this.topspin *= this.spinDecay;
    this.sidespin *= this.spinDecay;
    
    // Stop updating when spin is negligible
    if (Math.abs(this.topspin) < 0.01) this.topspin = 0;
    if (Math.abs(this.sidespin) < 0.01) this.sidespin = 0;

    // Update body spin values for collision handling
    this.body.topspin = this.topspin;
    this.body.sidespin = this.sidespin;
  }
}


