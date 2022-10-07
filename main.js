
function max(a, b) {
  return a > b ? a : b;
}

function min(a, b) {
  return a > b ? b : a;
}

function mod(x, n) {
  return ((x % n) + n) % n;
}

// computes if a number is prime or not
let isPrime;
{
  const nonprimes = new Set([1n]);
  let hi = 1n;  // current sieve upper bound (inclusive)

  isPrime = n => {
    if (n > hi) {
      for (let p = 2n; p * p <= n; p++)
        if (!nonprimes.has(p))
          for (let c = p * max(hi / p, 2n); c <= n; c += p)
            nonprimes.add(c);
      hi = n;
    }
    return !nonprimes.has(n);
  };
}

// Calculates the physical path of primes
//
// Returns the path as an array of objects
//   { x, y, p }
// where x,y are the coordinates and p is the associated prime
function calcPath({ bound, turnAngle }) {
  isPrime(bound);  // top-up the sieve

  const path = [
    { x: 0, y: 0, p: 1 },
  ];

  let minX = 0;
  let maxX = 0;
  let minY = 0;
  let maxY = 0;

  let x = 0.0;
  let y = 0.0;
  let theta = 0;
  let prevprime = 1n;

  for (let n = 2n; n <= bound; n++) {
    if (isPrime(n) || n === bound) {
      // Increment x,y
      const dist = Number(n - prevprime);
      x += Math.cos(theta) * dist;
      y += Math.sin(theta) * dist;

      // Update stats
      path.push({ x, y, p: n });
      minX = Math.min(x, minX);
      maxX = Math.max(x, maxX);
      minY = Math.min(y, minY);
      maxY = Math.max(y, maxY);
      prevprime = n;
      theta = mod(theta + turnAngle, 2 * Math.PI);
    }
  }

  return { path, summ: { minX, maxX, minY, maxY } };
}

// Like calcPath, but:
//
// - Not parameterized by turn angle. Turn angle is always π/2
// - Never traverses the same coordinate twice; skips over already-seen
//   coordinates in order to avoid doing so.
//
// The implementation is not terribly efficient
function calcPathSkipping({ bound }) {
  isPrime(bound);

  const path = [
    { x: 0, y: 0, p: 1 },
  ];

  let minX = 0n;
  let maxX = 0n;
  let minY = 0n;
  let maxY = 0n;

  const seen = [[0, 0]];  // seen coords as [x,y]
  let x = 0n;
  let y = 0n;
  let direction = 0;  // coefficient on π/2
  let prevprime = 1n;

  for (let n = 2n; n <= bound; n++) {
    if (isPrime(n) || n === bound) {

      // Increment x,y

      let dist = n - prevprime;
      if (direction % 2 === 0) {
        const d = direction === 0 ? 1n : -1n;
        const seenXs = new Set(seen.filter(([px, py]) => py === y).map(([x, y]) => x));
        while (dist--) {
          x += d;
          if (seenXs.has(x)) dist++;
        }
      } else {
        const d = direction === 1 ? 1n : -1n;
        const seenYs = new Set(seen.filter(([px, py]) => px === x).map(([x, y]) => y));
        while (dist--) {
          y += d;
          if (seenYs.has(y)) dist++;
        }
      }

      // Update stats

      prevprime = n;
      direction = mod(direction + 1, 4);

      {
        const prev = path[path.length - 1];
        const x0 = min(prev.x, x);
        const y0 = min(prev.y, y);
        const xf = max(prev.x, x);
        const yf = max(prev.y, y);
        for (let a = x0; a <= xf; a++)
          for (let b = y0; b <= yf; b++)
            seen.push([a, b]);
      }

      path.push({ x, y, p: n });

      minX = min(x, minX);
      maxX = max(x, maxX);
      minY = min(y, minY);
      maxY = max(y, maxY);
    }
  }

  return {
    path: path.map(pt => ({ ...pt, x: Number(pt.x), y: Number(pt.y) })),
    summ: {
      minX: Number(minX),
      maxX: Number(maxX),
      minY: Number(minY),
      maxY: Number(maxY),
    }
  };
}

function calcColor(part, whole, { colorType }) {
  switch (colorType) {
    case 'none':
      return 'black';

    case 'percentage':
      return `hsl(${Math.floor(part / whole * 360)}, 100%, 50%)`;

    case 'cyclic':
      return `hsl(${Math.floor(part * Math.pow(whole, 1/8) / whole * 360)}, 100%, 50%)`;

    default:
      console.warn(`Unknown color type '${colorType}'`);
      return 'black';
  }
}

function render(c, state) {
  const { path, summ } = !state.skipDuplicates ? calcPath(state) : calcPathSkipping(state);

  // Pad for good measure
  const minX = summ.minX - (summ.maxX - summ.minX) * 0.05 - 1;
  const maxX = summ.maxX + (summ.maxX - summ.minX) * 0.05 + 1;
  const minY = summ.minY - (summ.maxY - summ.minY) * 0.05 - 1;
  const maxY = summ.maxY + (summ.maxY - summ.minY) * 0.05 + 1;

  const rangeX = maxX - minX;
  const rangeY = maxY - minY;

  const scale = Math.min(
    1 / rangeX * state.canvasWidth,
    1 / rangeY * state.canvasHeight,
  );

  // maps a physical coordinate to a pixel coordinate
  let T;
  {
    const phyOffsetX = -minX;
    const phyOffsetY = -minY;
    const pixOffsetX = (state.canvasWidth - rangeX * scale) / 2;
    const pixOffsetY = (state.canvasHeight - rangeY * scale) / 2;
    T = (x, y) =>
      [ (x + phyOffsetX) * scale + pixOffsetX
      , (y + phyOffsetY) * scale + pixOffsetY
      ];
  }

  c.lineCap = 'square';

  let prev = path[0];
  for (let i = 0; i < path.length; i++) {
    const curr = path[i];

    c.strokeStyle = c.fillStyle = calcColor(i, path.length - 1, state);

    if (state.drawLines) {
      if (state.wideStroke)
        c.lineWidth = scale;
      const path = new Path2D();
      path.moveTo(...T(prev.x, prev.y));
      path.lineTo(...T(curr.x, curr.y));
      c.stroke(path);
    } else {
      if (state.wideStroke)
        c.fillRect(px - scale / 2, py - scale / 2, scale, scale);
      else
        c.fillRect(px, py, 1, 1);
    }

    prev = curr;
  }

  if (state.doLabels) {
    c.fillStyle = 'white';
    c.textAlign = 'center';
    c.textBaseline = 'center';
    const fontSize = 400 / rangeX;
    c.font = fontSize + 'px sans-serif';
    for (const pt of path) {
      const [px, py] = T(pt.x, pt.y);
      c.fillText(pt.p, px, py + fontSize / 3);
    }
  }

}


function main() {
  const $optBound = document.getElementById('opt-bound');
  const $optAngle = document.getElementById('opt-angle');
  const $optColor = document.getElementById('opt-color');
  const $optLines = document.getElementById('opt-lines');
  const $optWidth = document.getElementById('opt-width');
  const $optUnits = document.getElementById('opt-units');
  const $optNodup = document.getElementById('opt-nodup');
  const $optLabel = document.getElementById('opt-label');

  [$optBound, $optAngle, $optColor, $optLines, $optWidth, $optUnits, $optNodup, $optLabel]
    .forEach($o => $o.addEventListener('input', () => run()));

  window.addEventListener('resize', () => run());

  run();

  function run() {
    const $canv = document.getElementById('canvas');

    {
      $canv.width = '';
      $canv.height = '';
      $canv.style.width = '100%';
      $canv.style.height = 'auto';
      $canv.width = $canv.offsetWidth;
      $canv.height = $canv.offsetHeight;
    }

    const state = {
      bound: BigInt($optBound.value),
      turnAngle: Number($optAngle.value) * {'pi-rad': Math.PI, 'rad': 1, 'deg': 1 / 180 * Math.PI}[$optUnits.value],
      colorType: $optColor.value,
      drawLines: $optLines.checked,
      wideStroke: $optWidth.checked,
      canvasWidth: $canv.width,
      canvasHeight: $canv.height,
      skipDuplicates: $optNodup.checked,
      doLabels: $optLabel.checked,
    };

    const ctx = $canv.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, $canv.width, $canv.height);

    render(ctx, state);
  }
}

document.addEventListener('DOMContentLoaded', () => main());
