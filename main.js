
function max(a, b) {
  return a > b ? a : b;
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

// calculates the physical path of primes, represented as an array of [x,y] coordinates
function calcPath({ bound, turnAngle }, { padding }) {
  isPrime(bound);  // top-up the sieve

  const path = [];

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  let x = 0.0;
  let y = 0.0;
  let theta = 0;
  let prevprime = 0n;

  for (let n = 1n; n <= bound + 1n; n++) {
    path.push([x, y]);

    minX = Math.min(x, minX);
    maxX = Math.max(x, maxX);
    minY = Math.min(y, minY);
    maxY = Math.max(y, maxY);

    if (isPrime(n) || n === bound) {
      x += Math.cos(theta) * Number(n - prevprime);
      y += Math.sin(theta) * Number(n - prevprime);
      prevprime = n;
      theta = mod(theta + turnAngle, 2 * Math.PI);
    }
  }

  minX -= padding;
  maxX += padding;
  minY -= padding;
  maxY += padding;

  return {
    path,
    summ: {
      minX, maxX, rangeX: maxX - minX,
      minY, maxY, rangeY: maxY - minY,
    },
  };
}

function render(c, state) {
  const { path, summ } = calcPath(state, { padding: 1 });

  const scale = Math.min(
    1 / summ.rangeX * state.canvasWidth,
    1 / summ.rangeY * state.canvasHeight,
  );

  // maps a physical coordinate to a pixel coordinate
  let T;
  {
    const phyOffsetX = -summ.minX;
    const phyOffsetY = -summ.minY;
    const pixOffsetX = (state.canvasWidth - summ.rangeX * scale) / 2;
    const pixOffsetY = (state.canvasHeight - summ.rangeY * scale) / 2;
    T = (x, y) =>
      [ (x + phyOffsetX) * scale + pixOffsetX
      , (y + phyOffsetY) * scale + pixOffsetY
      ];
  }

  if (state.drawLinesWide)
    c.lineWidth = scale;

  if (state.drawColor) {
    c.lineCap = 'square';

    let [prevPx, prevPy] = T(...path[0]);
    for (let i = 0; i < path.length; i++) {
      const [px, py] = T(...path[i]);

      const p = new Path2D();
      p.moveTo(prevPx, prevPy);
      p.lineTo(px, py);
      const completion = i / (path.length - 1);
      c.strokeStyle = `hsl(${Math.floor(completion * 360)}, 100%, 50%)`;
      c.stroke(p);

      [prevPx, prevPy] = [px, py];
    }

  } else {

    c.beginPath();
    c.moveTo(...T(0, 0));
    for (const [x, y] of path) {
      c.lineTo(...T(x, y));
    }
    c.stroke();

  }
}


function main() {
  const $optBound = document.getElementById('opt-bound');
  const $optAngle = document.getElementById('opt-angle');
  const $optColor = document.getElementById('opt-color');
  const $optWidth = document.getElementById('opt-width');

  [$optBound, $optAngle, $optColor, $optWidth]
    .forEach($o => $o.addEventListener('input', () => run()));

  window.addEventListener('resize', () => run());

  run();

  function run() {
    const $canv = document.getElementById('canvas');

    $canv.width = $canv.offsetWidth;
    $canv.height = $canv.offsetHeight;

    const state = {
      bound: BigInt($optBound.value),
      turnAngle: Number($optAngle.value) * Math.PI,
      drawColor: $optColor.checked,
      drawLinesWide: $optWidth.checked,
      canvasWidth: $canv.width,
      canvasHeight: $canv.height,
    };

    const ctx = $canv.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, $canv.width, $canv.height);

    render(ctx, state);
  }
}

document.addEventListener('DOMContentLoaded', () => main());
