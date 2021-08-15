
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

// calculates the physical path of primes, represented as a generator of [x,y] coordinates
function* calcPath({ bound, turnAngle }) {
  let x = 0.0;
  let y = 0.0;
  let theta = Math.PI / 2;

  let prevprime = 0n;
  for (let n = 1n; n <= bound + 1n; n++) {
    yield [x, y];

    if (isPrime(n) || n === bound) {
      x += Math.cos(theta) * Number(n - prevprime);
      y += Math.sin(theta) * Number(n - prevprime);
      prevprime = n;
      theta = mod(theta + turnAngle, 2 * Math.PI);
    }
  }

  function mod(x, n) {
    return ((x % n) + n) % n;
  }
}

function render(c, state) {
  c.fillStyle = 'black';
  c.beginPath();
  c.moveTo(...T(0, 0));
  for (const [x, y] of calcPath(state)) {
    c.lineTo(...T(x, y));
  }
  c.stroke();

  function T(x, y) {
    return [ (x + state.panX) * state.scale + state.canvasWidth / 2
           , (y + state.panY) * state.scale + state.canvasHeight / 2
           ];
  }
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
      panX: 0.0,
      panY: 0.0,
      scale: 3.0,
    };

    const ctx = $canv.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, $canv.width, $canv.height);

    render(ctx, state);
  }
}

document.addEventListener('DOMContentLoaded', () => main());
