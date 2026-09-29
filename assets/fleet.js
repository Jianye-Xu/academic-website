// Motion of the background robots; pure logic shared by robots.js and the tests.
// Each side margin holds a small zone with one Classic robot and one robot dog. A nominal
// controller wanders or visits the neighbor, and a control barrier function (CBF) safety
// filter keeps the pair SAFE_DISTANCE apart and every robot inside its zone.
export const SIZE = 60;
export const SPEED = 4;
export const SAFE_DISTANCE = SIZE * 1.5;
const ZONE_WIDTH = SIZE * 2.5;
// The robots, drawn in full (antenna tip to shadow), stay within a band this tall, and their
// centers stop BOTTOM_GAP above the window edge, which leaves the shadows about 5px clear.
const BAND_HEIGHT = 250;
const BOTTOM_GAP = 40;
const EXTENT_UP = SIZE * 0.52, EXTENT_DOWN = SIZE * 0.59;
const CBF_RATE = 1.5;

const rand = (a, b) => a + Math.random() * (b - a);

// Zones sit at the bottom of each side margin of the window. They bound robot centers;
// the padding keeps each outline inside its margin and clear of the content.
export function layoutZones(width, height, contentLeft, contentRight, top = 64) {
  const padX = SIZE * 0.45, y1 = height - BOTTOM_GAP, y0 = y1 - (BAND_HEIGHT - EXTENT_UP - EXTENT_DOWN);
  if (y0 - EXTENT_UP < top) return [];
  return [[12, contentLeft - 16], [contentRight + 16, width - 12]]
    .map(([a, b]) => [a + padX, b - padX])
    .filter(([a, b]) => b - a >= SIZE)
    .map(([a, b]) => {
      const cx = (a + b) / 2, zoneWidth = Math.min(ZONE_WIDTH, b - a);
      return { x0:cx - zoneWidth / 2, x1:cx + zoneWidth / 2, y0, y1 };
    });
}

function pickGoal(r, zone, peers) {
  r.friend = peers.length && Math.random() < 0.5 ? peers[Math.floor(Math.random() * peers.length)] : null;
  // Wander goals lean away from the neighbor, so meetings stay distinct episodes.
  const goals = Array.from({ length:3 }, () => ({ x:rand(zone.x0, zone.x1), y:rand(zone.y0, zone.y1) }));
  const room = g => Math.min(Infinity, ...peers.map(o => Math.hypot(g.x - o.x, g.y - o.y)));
  r.goal = goals.reduce((best, g) => room(g) > room(best) ? g : best);
  r.waiting = false;
  r.stuck = 0;
}

export function createFleet(zones) {
  const robots = zones.flatMap((zone, index) => ['classic', 'dog'].map(kind => ({
    kind, zone:index, x:0, y:0, ux:0, uy:0, vx:0, vy:0, lookX:0, lookY:0, travel:0, dir:1, pause:0
  })));
  zones.forEach((zone, index) => {
    const pair = robots.filter(r => r.zone === index);
    for (let k = 0; k === 0 || (k < 50 && Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y) < SAFE_DISTANCE * 1.2); k++) {
      for (const r of pair) { r.x = rand(zone.x0, zone.x1); r.y = rand(zone.y0, zone.y1); }
    }
    for (const r of pair) pickGoal(r, zone, pair.filter(o => o !== r));
  });
  return robots;
}

export function stepFleet(robots, zones, dt, t) {
  const D = SAFE_DISTANCE;
  for (const r of robots) {
    const zone = zones[r.zone], peers = robots.filter(o => o !== r && o.zone === r.zone);
    const gx = r.friend ? r.friend.x : r.goal.x, gy = r.friend ? r.friend.y : r.goal.y;
    const dx = gx - r.x, dy = gy - r.y, dist = Math.hypot(dx, dy) || 1;

    // Arrive, pause for a moment (facing the neighbor when visiting), then choose a new goal.
    if (!r.waiting && dist < (r.friend ? D * 1.25 : SIZE * 0.3)) { r.waiting = true; r.pause = t + rand(1.5, 4); }
    if (r.waiting && t >= r.pause) pickGoal(r, zone, peers);

    // Nominal controller: saturated proportional control toward the goal, acceleration-limited.
    let nx = 0, ny = 0;
    if (!r.waiting) { const k = Math.min(SPEED, dist * 0.8) / dist; nx = dx * k; ny = dy * k; }
    const ax = nx - r.ux, ay = ny - r.uy, an = Math.hypot(ax, ay), amax = SPEED * 1.2 * dt;
    if (an > amax) { r.ux += ax / an * amax; r.uy += ay / an * amax; } else { r.ux = nx; r.uy = ny; }
    let ux = r.ux, uy = r.uy;

    // CBF constraints a·u ≥ b: zone walls first, then pairwise barriers h = |p|² − D² with
    // responsibility shared equally, so safety wins when constraints conflict. Heading straight
    // at a neighbor gets a small right-hand nudge against deadlock.
    const constraints = [
      [1, 0, -CBF_RATE * (r.x - zone.x0)], [-1, 0, -CBF_RATE * (zone.x1 - r.x)],
      [0, 1, -CBF_RATE * (r.y - zone.y0)], [0, -1, -CBF_RATE * (zone.y1 - r.y)]
    ];
    let near = Infinity, nearest = null;
    for (const o of peers) {
      const px = r.x - o.x, py = r.y - o.y, d = Math.hypot(px, py);
      if (d < near) { near = d; nearest = o; }
      if (d > D * 2.5) continue;
      constraints.push([2 * px, 2 * py, -CBF_RATE * (d * d - D * D) / 2]);
      const un = Math.hypot(ux, uy);
      if (un > 0 && -(px * ux + py * uy) > 0.9 * d * un) {
        const c = Math.cos(0.35), s = Math.sin(0.35);
        [ux, uy] = [ux * c - uy * s, ux * s + uy * c];
      }
    }
    for (let pass = 0; pass < 8; pass++) for (const [a1, a2, b] of constraints) {
      const au = a1 * ux + a2 * uy;
      if (au < b) { const f = (b - au) / (a1 * a1 + a2 * a2); ux += f * a1; uy += f * a2; }
    }
    const un = Math.hypot(ux, uy);
    if (un > SPEED * 1.2) { ux *= SPEED * 1.2 / un; uy *= SPEED * 1.2 / un; }

    // Give up on a goal the safety filter keeps blocking.
    r.stuck = Math.hypot(nx, ny) > SPEED * 0.5 && un < SPEED * 0.15 ? r.stuck + dt : 0;
    if (r.stuck > 3) pickGoal(r, zone, peers);

    // Eyes look at a close neighbor, otherwise where the robot is heading.
    let lx = r.lookX, ly = r.lookY;
    if (nearest && near < D * 1.7) { lx = (nearest.x - r.x) / near; ly = (nearest.y - r.y) / near; }
    else if (un > SPEED * 0.2) { lx = ux / un; ly = uy / un; }
    r.lookX += (lx - r.lookX) * Math.min(1, dt * 4);
    r.lookY += (ly - r.lookY) * Math.min(1, dt * 4);
    r.vx = ux; r.vy = uy; r.travel += un * dt;
    if (Math.abs(ux) > SPEED * 0.1) r.dir = Math.sign(ux);
  }
  for (const r of robots) {
    const zone = zones[r.zone];
    r.x = Math.min(zone.x1, Math.max(zone.x0, r.x + r.vx * dt));
    r.y = Math.min(zone.y1, Math.max(zone.y0, r.y + r.vy * dt));
  }
}
