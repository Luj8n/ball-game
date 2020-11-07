const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let minimized = true;

const minimizeBtn = document.querySelector("#minimize");
const settingsMenu = document.querySelector("#settings");
const form = document.querySelector("form");

// Global variables

function reloadGlobalVariables() {
  function sel(key) {
    return document.querySelector(key).value * 1;
  }

  canvas.style.backgroundColor = document.querySelector(
    "#background-color"
  ).value;
  G = sel("#gravity"); // gravity
  FRICTION = sel("#friction"); // >= 1
  FRICTION_MULTIPLIER = sel("#friction-multiplier"); // >= 1
  THROWING_POWER = sel("#throwing-power"); // >= 0
  DISTORTION_EFFECT = sel("#distortion-effect");
  RADIUS = sel("#radius"); //normal ball radius
  MIN_RADIUS = RADIUS < sel("#min-radius") ? RADIUS : sel("#min-radius"); //oval thickness | can't be bigger than RADIUS
  COLOR = document.querySelector("#color").value; //ball color
  // PARTICLE_COLORS = ["#d1dbfa"];
  PARTICLE_SENSITIVITY = sel("#particle-sensitivity"); // > 0
  PARTICLE_COUNT = sel("#particle-count"); //whole number | > 0
  PARTICLE_LENGTH = sel("#particle-length"); // > 0
  PARTICLE_THICKNESS = sel("#particle-thickness"); // > 0
  PARTICLE_DESPAWN_TIME = sel("#particle-despawn-time"); // > 0 (ms)
  PARTICLE_GRAVITY_EFFECT = sel("#particle-gravity-effect"); // > 0 | the lower, the bigger effect
  BALL_COUNT = sel("#ball-count"); //whole number | > 0
  CIRCLE_SPEED = sel("#circle-speed"); //background particle speed
  CIRCLE_COUNT = sel("#circle-count"); //background particle count
  MAX_CIRCLE_RADIUS = sel("#max-circle-radius"); // > 0
  MIN_CIRCLE_RADIUS = sel("#min-circle-radius"); // > 0
  // CIRCLE_COLORS = [
  //   //background particle colors
  //   "#ed092e",
  //   "#f51430",
  //   "#f62739",
  //   "#f63942",
  //   "#f74c4e",
  //   "#f8635e",
  //   "#f97970",
  //   "#f98f83",
  //   "#faa395",
  //   "#fbb6a7",
  // ];
}

canvas.style.backgroundColor = "#020008";
let G = 0.2; // gravity
let FRICTION = 1.01; // >= 1
let FRICTION_MULTIPLIER = 1.05; // >= 1
let THROWING_POWER = 5; // >= 0
let DISTORTION_EFFECT = 0.7;
let RADIUS = 50; //normal ball radius
let MIN_RADIUS = RADIUS < 20 ? RADIUS : 20; //oval thickness | can't be bigger than RADIUS
let COLOR = "#6a8cf0"; //ball color
let PARTICLE_COLORS = ["#d1dbfa"];
let PARTICLE_SENSITIVITY = 8; // > 0
let PARTICLE_COUNT = 1; //whole number | > 0
let PARTICLE_LENGTH = 5; // > 0
let PARTICLE_THICKNESS = 0.5; // > 0
let PARTICLE_DESPAWN_TIME = 7000; // > 0 (ms)
let PARTICLE_GRAVITY_EFFECT = 100; // > 0 | the lower, the bigger effect
let BALL_COUNT = 1; //whole number | > 0
let CIRCLE_SPEED = 0.5; //background particle speed
let CIRCLE_COUNT = 200; //background particle count
let MAX_CIRCLE_RADIUS = 5; // > 0
let MIN_CIRCLE_RADIUS = 0.1; // > 0
let CIRCLE_COLORS = [
  //background particle colors
  "#ed092e",
  "#f51430",
  "#f62739",
  "#f63942",
  "#f74c4e",
  "#f8635e",
  "#f97970",
  "#f98f83",
  "#faa395",
  "#fbb6a7",
];

// Event Listeners
addEventListener("resize", () => {
  // Sets canvas' size according to the window
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  // Resets the objects
  init();
});

minimizeBtn.addEventListener("click", () => {
  if (minimized) {
    settingsMenu.classList.remove("minimized-menu");
    form.classList.remove("faded");
  } else {
    settingsMenu.classList.add("minimized-menu");
    form.classList.add("faded");
  }

  minimized = !minimized;
});

// Objects

class Object {
  hitDetection(isParticle, useFriction, friction, frictionMultiplier) {
    const hitEngine = (side) => {
      if (!isParticle) {
        switch (side) {
          case "floor":
            this.y = canvas.height - this.radius;
            this.velocity.y = -this.velocity.y;
            if (useFriction) {
              this.velocity.y /= friction * frictionMultiplier;
              this.velocity.x /= friction;
              addParticles(this.x, this.y + this.radius, this.speed, side);
            }
            break;
          case "ceiling":
            this.y = this.radius;
            this.velocity.y = -this.velocity.y;
            if (useFriction) {
              this.velocity.y /= friction * frictionMultiplier;
              this.velocity.x /= friction;
              addParticles(this.x, this.y - this.radius, this.speed, side);
            }
            break;
          case "left":
            this.x = this.radius;
            this.velocity.x = -this.velocity.x;
            if (useFriction) {
              this.velocity.y /= friction;
              this.velocity.x /= friction * frictionMultiplier;
              addParticles(this.x - this.radius, this.y, this.speed, side);
            }
            break;
          case "right":
            this.x = canvas.width - this.radius;
            this.velocity.x = -this.velocity.x;
            if (useFriction) {
              this.velocity.y /= friction;
              this.velocity.x /= friction * frictionMultiplier;
              addParticles(this.x + this.radius, this.y, this.speed, side);
            }
            break;
        }
      }
    };

    // Floor
    if (this.y + this.radius > canvas.height) hitEngine("floor");

    // Ceiling
    if (this.y - this.radius < 0) hitEngine("ceiling");

    // Left
    if (this.x - this.radius < 0) hitEngine("left");

    // Right
    if (this.x + this.radius > canvas.width) hitEngine("right");
  }

  gravityEffect(gravity) {
    // Makes Y velocity bigger
    this.velocity.y += gravity;
  }

  updateVariables() {
    this.previousTime = this.time;
    this.time = new Date().getTime();
    this.dx = this.x - this.previousX;
    this.dy = this.y - this.previousY;
    this.previousX = this.x;
    this.previousY = this.y;
    this.dt = this.time - this.previousTime;

    this.speed =
      DISTORTION_EFFECT *
      (Math.abs(this.velocity.x) + Math.abs(this.velocity.y));

    if (this.velocity.x != 0 && this.velocity.y != 0) {
      this.rotation = Math.atan(this.velocity.y / this.velocity.x);
    } else if (this.velocity.x != 0) {
      this.rotation = 0;
    } else {
      this.rotation = Math.PI * 0.5;
    }
  }

  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
    c.closePath();
  }

  move() {
    this.x += this.velocity.x; // Move x coordinate
    this.y += this.velocity.y; // Move y coordinate
  }

  update() {
    this.hitDetection(false, false, FRICTION, FRICTION_MULTIPLIER);
    this.move();
    this.draw();
  }
}

class Ball extends Object {
  constructor(x, y, radius, color) {
    super();
    this.x = x;
    this.y = y;
    this.time = new Date().getTime();
    this.radius = radius;
    this.color = color;
    this.velocity = {
      x: 0,
      y: 0,
    };
    this.offset = {
      x: undefined,
      y: undefined,
    };
    this.heldDown = false;

    // Handles events
    this.handleEvent = (event) => {
      switch (event.type) {
        case "mousedown":
          if (
            circlePointCollision(event.clientX, event.clientY, {
              x: this.x,
              y: this.y,
              radius: this.radius,
            })
          ) {
            this.heldDown = true;
            this.velocity = { x: 0, y: 0 };
            addEventListener("mousemove", this);
            addEventListener("mouseup", this);
            this.offset.x = event.clientX - this.x;
            this.offset.y = event.clientY - this.y;
          }
          break;
        case "touchstart":
          if (
            circlePointCollision(
              event.touches[0].clientX,
              event.touches[0].clientY,
              {
                x: this.x,
                y: this.y,
                radius: this.radius,
              }
            )
          ) {
            console.log("yes");
            this.heldDown = true;
            this.velocity = { x: 0, y: 0 };
            addEventListener("touchmove", this);
            addEventListener("touchend", this);
            this.offset.x = event.touches[0].clientX - this.x;
            this.offset.y = event.touches[0].clientY - this.y;
          }
          break;
        case "mousemove":
          this.x = event.clientX - this.offset.x;
          this.y = event.clientY - this.offset.y;
          this.velocity.x = (this.dx / this.dt) * THROWING_POWER;
          this.velocity.y = (this.dy / this.dt) * THROWING_POWER;
          break;
        case "touchmove":
          this.x = event.touches[0].clientX - this.offset.x;
          this.y = event.touches[0].clientY - this.offset.y;
          this.velocity.x = (this.dx / this.dt) * THROWING_POWER;
          this.velocity.y = (this.dy / this.dt) * THROWING_POWER;
          break;
        case "mouseup":
          this.velocity.x = (this.dx / this.dt) * THROWING_POWER;
          this.velocity.y = (this.dy / this.dt) * THROWING_POWER;
          this.heldDown = false;
          removeEventListener("mousemove", this);
          removeEventListener("mouseup", this);
          break;
        case "touchend":
          this.velocity.x = (this.dx / this.dt) * THROWING_POWER;
          this.velocity.y = (this.dy / this.dt) * THROWING_POWER;
          this.heldDown = false;
          removeEventListener("touchmove", this);
          removeEventListener("touchend", this);
          break;
      }
    };

    // For PC users
    addEventListener("mousedown", this);
    // For mobile users
    addEventListener("touchstart", this);
  }

  draw() {
    let smallerRadius =
      this.radius - this.speed < MIN_RADIUS
        ? MIN_RADIUS
        : this.radius - this.speed;
    c.beginPath();
    c.ellipse(
      this.x,
      this.y,
      this.radius,
      smallerRadius,
      this.rotation,
      0,
      Math.PI * 2
    );
    c.fillStyle = this.color;
    c.fill();
    c.closePath();
  }

  update() {
    // Chech if the ball is being held down
    if (!this.heldDown) {
      this.hitDetection(false, true, FRICTION, FRICTION_MULTIPLIER);

      this.gravityEffect(G);

      // If the speed is low, stop the ball
      if (Math.abs(this.velocity.x) < 0.1) {
        this.velocity.x = 0;
      }

      this.move();
    }
    // Update variables
    this.updateVariables();

    // Draw the ball
    this.draw();
  }
}

class Circle extends Object {
  constructor(x, y, radius, color) {
    super();
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = {
      x: (Math.random() - 0.5) * CIRCLE_SPEED,
      y: (Math.random() - 0.5) * CIRCLE_SPEED,
    };
  }
}

class Particle extends Object {
  constructor(x, y, radius, color, side) {
    super();
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.alpha = 1;
    switch (side) {
      case "floor":
        this.velocity = {
          x: (Math.random() - 0.5) * 4,
          y: -(Math.random() + 0.1),
        };
        break;
      case "ceiling":
        this.velocity = {
          x: (Math.random() - 0.5) * 4,
          y: Math.random() + 0.1,
        };
        break;
      case "left":
        this.velocity = {
          x: Math.random() + 0.1,
          y: (Math.random() - 0.5) * 4,
        };
        break;
      case "right":
        this.velocity = {
          x: -(Math.random() + 0.1),
          y: (Math.random() - 0.5) * 4,
        };
        break;
    }

    setTimeout(() => {
      particles.shift();
    }, PARTICLE_DESPAWN_TIME);
  }

  updateVariables() {
    this.previousTime = this.time;
    this.time = new Date().getTime();
    this.dx = this.x - this.previousX;
    this.dy = this.y - this.previousY;
    this.previousX = this.x;
    this.previousY = this.y;
    this.dt = this.time - this.previousTime;

    this.speed =
      DISTORTION_EFFECT *
      (Math.abs(this.velocity.x) + Math.abs(this.velocity.y));

    if (this.velocity.x != 0 && this.velocity.y != 0) {
      this.rotation = Math.atan(this.velocity.y / this.velocity.x);
    } else if (this.velocity.x != 0) {
      this.rotation = 0;
    } else {
      this.rotation = Math.PI * 0.5;
    }
  }

  draw() {
    c.beginPath();
    c.ellipse(
      this.x,
      this.y,
      this.radius,
      PARTICLE_THICKNESS,
      this.rotation,
      0,
      Math.PI * 2
    );
    c.fillStyle = this.color;
    c.fill();
    c.closePath();
  }

  update() {
    this.hitDetection(true, true, FRICTION, FRICTION_MULTIPLIER);
    this.gravityEffect(G / PARTICLE_GRAVITY_EFFECT);
    this.move();
    this.updateVariables();
    this.draw();
  }
}

// Functions

let particles = [];
// Adds particles
function addParticles(x, y, speed, side) {
  if (speed > PARTICLE_SENSITIVITY) {
    for (
      let i = 0;
      i < Math.floor(speed - PARTICLE_SENSITIVITY + PARTICLE_COUNT);
      i++
    ) {
      particles.push(
        new Particle(
          x,
          y,
          PARTICLE_LENGTH,
          PARTICLE_COLORS[
            Math.floor(Math.random() * (PARTICLE_COLORS.length - 0.1))
          ],
          side
        )
      );
    }
  }
}

// Calculates distance between two points in 2D
function distanceXY(x0, y0, x1, y1) {
  let dx = x1 - x0;
  let dy = y1 - y0;
  return Math.sqrt(dx * dx + dy * dy);
}

// Checks if the point is in the circle
function circlePointCollision(x, y, circle) {
  return distanceXY(x, y, circle.x, circle.y) < circle.radius;
}

function resetGame() {
  reloadGlobalVariables();
  init();
}

let objects = [];
// Pushes all objects to arrays
function init() {
  // Reset the objects array
  objects = [];
  particles = [];
  for (let i = 0; i < CIRCLE_COUNT; i++) {
    objects.push(
      new Circle(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * MAX_CIRCLE_RADIUS + MIN_CIRCLE_RADIUS,
        CIRCLE_COLORS[Math.floor(Math.random() * (CIRCLE_COLORS.length - 0.1))]
      )
    );
  }
  for (let i = 0; i < BALL_COUNT; i++) {
    objects.push(
      new Ball(Math.random() * (canvas.width - RADIUS), canvas.height - RADIUS, RADIUS, COLOR)
    );
  }
}

// Animation Loop
function animate() {
  requestAnimationFrame(animate); // Create an animation loop
  c.clearRect(0, 0, canvas.width, canvas.height); // Erase whole canvas
  objects.forEach((object) => object.update()); // Update each object
  particles.forEach((particle) => particle.update()); // Update each particle
}

init();
animate();
