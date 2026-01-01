// HTML-based cue ball spin control
let spinSelector = {
  spinX: 0, // -1 (left) to +1 (right)
  spinY: 0, // -1 (bottom/backspin) to +1 (top/topspin)
  isDragging: false,
  svgElement: null,
  dotElement: null,
  displayElement: null,
  center: { x: 60, y: 60 },
  radius: 50,

  init: function() {
    this.svgElement = document.getElementById('spin-svg');
    this.dotElement = document.getElementById('spin-dot');
    this.displayElement = document.getElementById('spin-display');

    if (this.svgElement) {
      this.svgElement.addEventListener('mousedown', (e) => this.handleMouseDown(e));
      this.svgElement.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      this.svgElement.addEventListener('mouseup', (e) => this.handleMouseUp(e));
      this.svgElement.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
      this.svgElement.addEventListener('touchstart', (e) => this.handleTouchStart(e));
      this.svgElement.addEventListener('touchmove', (e) => this.handleTouchMove(e));
      this.svgElement.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }
  },

  handleMouseDown: function(e) {
    e.stopPropagation();
    e.preventDefault();
    this.isDragging = true;
    this.updateSpinFromEvent(e);
  },

  handleMouseMove: function(e) {
    if (this.isDragging) {
      e.stopPropagation();
      e.preventDefault();
      this.updateSpinFromEvent(e);
    }
  },

  handleMouseUp: function(e) {
    e.stopPropagation();
    e.preventDefault();
    this.isDragging = false;
  },

  handleTouchStart: function(e) {
    e.stopPropagation();
    e.preventDefault();
    this.isDragging = true;
    this.updateSpinFromEvent(e.touches[0]);
  },

  handleTouchMove: function(e) {
    if (this.isDragging) {
      e.stopPropagation();
      e.preventDefault();
      this.updateSpinFromEvent(e.touches[0]);
    }
  },

  handleTouchEnd: function(e) {
    e.stopPropagation();
    e.preventDefault();
    this.isDragging = false;
  },

  updateSpinFromEvent: function(e) {
    if (!this.svgElement) return;

    const rect = this.svgElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to SVG coordinates (SVG viewBox is 0 0 120 120)
    const svgX = (x / rect.width) * 120;
    const svgY = (y / rect.height) * 120;

    // Calculate relative to center
    let dx = svgX - this.center.x;
    let dy = svgY - this.center.y;

    const dist = Math.hypot(dx, dy);

    // Constrain to circle
    if (dist > this.radius) {
      const scale = this.radius / dist;
      dx *= scale;
      dy *= scale;
    }

    // Normalize to -1 to 1
    this.spinX = dx / this.radius; // left (-1) to right (+1)
    this.spinY = -dy / this.radius; // top (+1) to bottom (-1) - inverted Y

    this.updateDisplay();
  },

  updateDisplay: function() {
    if (this.dotElement) {
      const dotX = this.center.x + this.spinX * this.radius * 0.8;
      const dotY = this.center.y - this.spinY * this.radius * 0.8;
      this.dotElement.setAttribute('cx', dotX);
      this.dotElement.setAttribute('cy', dotY);
    }

    if (this.displayElement) {
      let spinLabel = 'Center';

      if (Math.abs(this.spinX) > 0.3 || Math.abs(this.spinY) > 0.3) {
        let parts = [];

        if (this.spinY > 0.3) {
          parts.push('Top');
        } else if (this.spinY < -0.3) {
          parts.push('Back');
        }

        if (this.spinX > 0.3) {
          parts.push('Right');
        } else if (this.spinX < -0.3) {
          parts.push('Left');
        }

        spinLabel = parts.length > 0 ? parts.join(' ') : 'Center';
      }

      this.displayElement.textContent = spinLabel;
    }
  },

  getSpin: function() {
    return {
      x: this.spinX,
      y: this.spinY,
      magnitude: Math.hypot(this.spinX, this.spinY)
    };
  },

  reset: function() {
    this.spinX = 0;
    this.spinY = 0;
    this.updateDisplay();
  }
};
