
// maps n to floor(sqrt(n))
let isqrt;
{
  const table = { 0n: 0n };  // map n^2 -> n  (actually, map n -> floor(sqrt(n)))
  let n2 = 0n;  // the highest n^2 in the table
  let n1 = 0n;  // the highest n^1 in the table

  isqrt = x2 => {
    if (typeof x2 !== 'bigint' || x2 < 0n)
      throw Error('Expected nonnegative BigInt');

    while (n2 < x2) {
      const sq = (n1 + 1n) * (n1 + 1n);
      table[sq] = n1 + 1n;
      for (let i = n2; i < sq; i++)
        table[i] = n1;
      n1++;
      n2 = sq;
    }
    return table[x2];
  }
}

// computes if a number is prime or not
let isPrime;
{
  const nonprimes = new Set([1]);
  let hi = 1n;  // current sieve upper bound (inclusive)

  isPrime = n => {
    if (typeof n !== 'bigint' || n <= 0n)
      throw Error('Expected positive BigInt');

    if (n > hi) {
      for (let p = 2n; p <= isqrt(n); p++)
        for (let c = max(hi / p * p, p * 2n); c <= n; c += p)
          nonprimes.add(c);
      hi = n;
    }
    return !nonprimes.has(n);
  };

  function max(a, b) {
    return a > b ? a : b;
  }
}

// calculates the physical path of primes, represented as an array of [x,y] coordinates
function calcPath({ bound, turnAngle }) {
  const path = [];

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let sumX = 0;
  let cntX = 0;
  let sumY = 0;
  let cntY = 0;

  let x = 0.0;
  let y = 0.0;
  let theta = Math.PI / 2;
  let prevprime = 0n;

  for (let n = 1n; n <= bound + 1n; n++) {
    path.push([x, y]);

    minX = Math.min(x, minX);
    maxX = Math.max(x, maxX);
    minY = Math.min(y, minY);
    maxY = Math.max(y, maxY);
    sumX += x;
    cntX += 1;
    sumY += y;
    cntY += 1;

    if (isPrime(n) || n === bound) {
      x += Math.cos(theta) * Number(n - prevprime);
      y += Math.sin(theta) * Number(n - prevprime);
      prevprime = n;
      theta = mod(theta + turnAngle, 2 * Math.PI);
    }
  }

  return {
    path,
    summ: {
      minX, maxX, rangeX: maxX - minX, avgX: sumX / cntX,
      minY, maxY, rangeY: maxY - minY, avgY: sumY / cntY,
    },
  };

  function mod(x, n) {
    return ((x % n) + n) % n;
  }
}

function render(c, state) {
  const { path, summ } = calcPath(state);

  // maps a physical coordinate to a pixel coordinate
  let T;
  {
    const scale = Math.min(
      1 / summ.rangeX * state.canvasWidth,
      1 / summ.rangeY * state.canvasHeight,
    );
    const phyOffsetX = -summ.minX;
    const phyOffsetY = -summ.minY;
    const pixOffsetX = (state.canvasWidth - summ.rangeX * scale) / 2;
    const pixOffsetY = (state.canvasHeight - summ.rangeY * scale) / 2;
    T = (x, y) =>
      [ (x + phyOffsetX) * scale + pixOffsetX
      , (y + phyOffsetY) * scale + pixOffsetY
      ];
  }

  c.fillStyle = 'black';
  c.beginPath();
  c.moveTo(...T(0, 0));
  for (const [x, y] of path) {
    c.lineTo(...T(x, y));
  }
  c.stroke();
}


function main() {
  const $optBound = document.getElementById('opt-bound');
  const $optAngle = document.getElementById('opt-angle');

  [$optBound, $optAngle].forEach($o => $o.addEventListener('input', () => run()));
  window.addEventListener('resize', () => run());
  run();

  function run() {
    const $canv = document.getElementById('canvas');

    $canv.width = $canv.offsetWidth;
    $canv.height = $canv.offsetHeight;

    const state = {
      bound: BigInt($optBound.value),
      turnAngle: Number($optAngle.value) * Math.PI,
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
