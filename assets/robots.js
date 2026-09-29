import { SIZE, SPEED, layoutZones, createFleet, stepFleet } from './fleet.js';

// Faint robots in the side margins, drawn in the page blue behind the content.
// Decorative only: hidden on narrow screens and in print. They move by default, including
// under the system reduced-motion setting; the footer toggle pauses them (remembered per browser).
const OPACITY = 0.07;
const BLUE = '36,92,131';
const TAU = Math.PI * 2;
const color = k => `rgba(${BLUE},${Math.min(1, OPACITY * k)})`;
const toggle = document.querySelector('.motion-toggle');
const canvas = document.createElement('canvas');
canvas.className = 'robot-fleet';
canvas.setAttribute('aria-hidden', 'true');
document.body.prepend(canvas);
const ctx = canvas.getContext('2d');

let width = 0, height = 0, dpr = 1, zones = [], robots = [], frame = 0, last = 0, paused = false;
try { paused = localStorage.getItem('robots-paused') === 'true'; } catch {}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
const dot = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
const line = points => { ctx.beginPath(); ctx.moveTo(...points[0]); for (const p of points.slice(1)) ctx.lineTo(...p); ctx.stroke(); };
const shape = (x, y, w, h, r) => { roundRect(x, y, w, h, r); ctx.fill(); ctx.stroke(); };

// Both robots are drawn in units of SIZE around their center.
function drawClassic(r, moving) {
  line([[0, -0.3], [0, -0.42]]);
  ctx.fillStyle = color(1.5); dot(0, -0.46, 0.05);
  ctx.fillStyle = color(0.18);
  shape(-0.36, -0.19, 0.07, 0.14, 0.03); shape(0.29, -0.19, 0.07, 0.14, 0.03);
  shape(-0.3, -0.3, 0.6, 0.36, 0.1);
  line([[-0.22, 0.17], [-0.33, 0.3]]); line([[0.22, 0.17], [0.33, 0.3]]);
  shape(-0.22, 0.1, 0.44, 0.3, 0.08);
  const step = Math.sin(r.travel / (SIZE * 0.12)) * 0.02 * moving;
  shape(-0.18, 0.42 - step, 0.12, 0.06, 0.03); shape(0.06, 0.42 + step, 0.12, 0.06, 0.03);
  ctx.fillStyle = color(1.5);
  dot(-0.12 + r.lookX * 0.04, -0.12 + r.lookY * 0.03, 0.05);
  dot(0.12 + r.lookX * 0.04, -0.12 + r.lookY * 0.03, 0.05);
  dot(0, 0.22, 0.035);
}

function drawDog(r, moving) {
  ctx.scale(r.dir, 1);
  const gait = r.travel / (SIZE * 0.1), swing = 0.05 * moving;
  const leg = (x, phase, far) => {
    const dx = Math.sin(gait + phase) * swing;
    ctx.save();
    if (far) ctx.globalAlpha = 0.6;
    line([[x, 0.1], [x - 0.07 + dx / 2, 0.27], [x + dx, 0.42]]);
    ctx.fillStyle = color(1.5); dot(x + dx, 0.43, 0.025);
    ctx.restore();
  };
  ctx.lineWidth *= 1.2;
  leg(0.16, Math.PI, true); leg(-0.17, 0, true);
  ctx.lineWidth /= 1.2;
  ctx.fillStyle = color(0.18);
  shape(-0.32, -0.08, 0.54, 0.2, 0.08);
  line([[0.22, -0.22], [0.18, -0.33]]);
  ctx.fillStyle = '#fff'; roundRect(0.13, -0.23, 0.28, 0.18, 0.07); ctx.fill();
  ctx.fillStyle = color(0.18); shape(0.13, -0.23, 0.28, 0.18, 0.07);
  ctx.lineWidth *= 1.2;
  leg(0.12, 0, false); leg(-0.21, Math.PI, false);
  ctx.fillStyle = color(1.5); dot(0.32 + Math.abs(r.lookX) * 0.02, -0.15 + r.lookY * 0.02, 0.035);
}

function drawRobot(r) {
  const moving = Math.min(1, Math.hypot(r.vx, r.vy) / (SPEED * 0.3));
  ctx.save();
  ctx.translate(r.x, r.y);
  ctx.fillStyle = color(0.25);
  ctx.beginPath(); ctx.ellipse(0, SIZE * 0.54, SIZE * 0.26, SIZE * 0.045, 0, 0, TAU); ctx.fill();
  ctx.rotate(Math.max(-1, Math.min(1, r.vx / SPEED)) * 0.08);
  ctx.scale(SIZE, SIZE);
  ctx.strokeStyle = color(1);
  ctx.lineWidth = 1.3 / SIZE; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  (r.kind === 'dog' ? drawDog : drawClassic)(r, moving);
  ctx.restore();
}

function draw() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  robots.forEach(drawRobot);
}

function tick(now) {
  frame = requestAnimationFrame(tick);
  if (now - last < 1000 / 30) return;
  stepFleet(robots, zones, Math.min(0.1, (now - last) / 1000), now / 1000);
  last = now;
  draw();
}

function update() {
  if (toggle) {
    toggle.hidden = !robots.length;
    toggle.textContent = paused ? 'Resume animation' : 'Pause animation';
  }
  if (paused || document.hidden || !robots.length) {
    cancelAnimationFrame(frame); frame = 0; draw();
  } else if (!frame) {
    last = performance.now(); frame = requestAnimationFrame(tick);
  }
}

function layout() {
  dpr = Math.min(2, devicePixelRatio || 1);
  width = innerWidth; height = innerHeight;
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  const content = document.querySelector('main').getBoundingClientRect();
  const next = layoutZones(width, height, content.left, content.right);
  if (JSON.stringify(next) !== JSON.stringify(zones)) { zones = next; robots = createFleet(zones); }
  update();
}

toggle?.addEventListener('click', () => {
  paused = !paused;
  try { localStorage.setItem('robots-paused', String(paused)); } catch {}
  update();
});
let resizeTimer;
addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(layout, 150); });
document.addEventListener('visibilitychange', update);
layout();
