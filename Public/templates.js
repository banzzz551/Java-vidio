const TEMPLATES = {
  particles: `/* props [] */
// Partikel 2D bergerak dengan seed tetap (deterministik)
const N = 80;
ctx.fillStyle = '#070912';
ctx.fillRect(0, 0, W, H);
function rnd(i, k) { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); }
for (let i = 0; i < N; i++) {
  const sp = 0.3 + rnd(i, 1) * 0.7;
  const x = ((rnd(i, 2) * W + t * sp * W * 0.2) % W + W) % W;
  const y = ((rnd(i, 3) * H + Math.sin(t * 2 + i) * 20) % H + H) % H;
  const r = 1 + rnd(i, 4) * 4;
  ctx.fillStyle = \`hsla(\${(i * 7 + t * 30) % 360}, 80%, 65%, 0.9)\`;
  ctx.beginPath(); ctx.arc(x, y, r * Math.min(W, H) / 400, 0, Math.PI * 2); ctx.fill();
}`,

  bars: `/* props [] */
// Bar chart animasi
ctx.fillStyle = '#0d1020';
ctx.fillRect(0, 0, W, H);
const data = [30, 70, 45, 90, 60, 80];
const p = Math.min(1, t / (D * 0.6));
const bw = W / (data.length * 1.6);
const base = H * 0.85;
data.forEach((v, i) => {
  const h = (v / 100) * H * 0.65 * p;
  ctx.fillStyle = \`hsl(\${i * 55 + 200}, 70%, 60%)\`;
  ctx.fillRect(W * 0.1 + i * bw * 1.5, base - h, bw, h);
});
ctx.fillStyle = '#fff';
ctx.font = \`bold \${Math.min(W, H) / 18}px sans-serif\`;
ctx.textAlign = 'center';
ctx.fillText('Statistik', W / 2, H * 0.12);`,

  typewriter: `/* props [
  {"key":"text","label":"Teks","type":"text","value":"Video ini dibuat dari kode JavaScript."},
  {"key":"color","label":"Warna teks","type":"color","value":"#4ade80"},
  {"key":"speed","label":"Kecepatan ketik","type":"range","min":0.2,"max":3,"step":0.1,"value":1}
] */
ctx.fillStyle = '#000';
ctx.fillRect(0, 0, W, H);
const full = String(P.text);
const n = Math.min(full.length, Math.floor((t / D) * full.length * P.speed));
ctx.fillStyle = P.color;
ctx.font = \`\${Math.min(W, H) / 20}px monospace\`;
ctx.textAlign = 'left';
const cursor = Math.floor(t * 2) % 2 ? '_' : ' ';
ctx.fillText(full.slice(0, n) + cursor, W * 0.08, H / 2);`,

  wave: `/* props [] */
// Gelombang sinus berlapis
ctx.fillStyle = '#0a0f1e';
ctx.fillRect(0, 0, W, H);
for (let k = 0; k < 4; k++) {
  ctx.beginPath();
  for (let x = 0; x <= W; x += 4) {
    const y = H / 2 + Math.sin(x * 0.02 + t * (2 + k) + k) * H * (0.08 + k * 0.03);
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.strokeStyle = \`hsla(\${200 + k * 30}, 85%, 65%, \${0.9 - k * 0.2})\`;
  ctx.lineWidth = Math.max(2, W / 200);
  ctx.stroke();
}`,

  pulse: `/* props [] */
// Lingkaran konsentris berdenyut
ctx.fillStyle = '#100818';
ctx.fillRect(0, 0, W, H);
const cx = W / 2, cy = H / 2, maxR = Math.min(W, H) * 0.45;
for (let i = 0; i < 6; i++) {
  const phase = ((t / 1.5) + i / 6) % 1;
  ctx.beginPath();
  ctx.arc(cx, cy, phase * maxR, 0, Math.PI * 2);
  ctx.strokeStyle = \`hsla(\${320 - i * 15}, 85%, 65%, \${1 - phase})\`;
  ctx.lineWidth = Math.max(2, W / 150);
  ctx.stroke();
}`,

  cube: `/* props [
  {"key":"color","label":"Warna garis","type":"color","value":"#60a5fa"},
  {"key":"speed","label":"Kecepatan putar","type":"range","min":0.1,"max":4,"step":0.1,"value":1},
  {"key":"dots","label":"Tampilkan titik sudut","type":"checkbox","value":true}
] */
// Kubus 3D berputar (proyeksi perspektif manual)
ctx.fillStyle = '#0b0d14';
ctx.fillRect(0, 0, W, H);
const s = Math.min(W, H) * 0.22;
const V = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(v => v.map(c => c * s));
const E = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
const ax = t * 0.9 * P.speed, ay = t * 1.3 * P.speed, az = t * 0.5 * P.speed;
function rot([x, y, z]) {
  const y1 = y * Math.cos(ax) - z * Math.sin(ax), z1 = y * Math.sin(ax) + z * Math.cos(ax);
  const x2 = x * Math.cos(ay) + z1 * Math.sin(ay), z2 = -x * Math.sin(ay) + z1 * Math.cos(ay);
  const x3 = x2 * Math.cos(az) - y1 * Math.sin(az), y3 = x2 * Math.sin(az) + y1 * Math.cos(az);
  return [x3, y3, z2];
}
const PP = V.map(v => {
  const [x, y, z] = rot(v);
  const f = (Math.min(W, H) * 1.2) / (z + s * 4);
  return [W / 2 + x * f, H / 2 + y * f];
});
ctx.strokeStyle = P.color;
ctx.lineWidth = Math.max(2, W / 150);
ctx.lineCap = 'round';
E.forEach(([a, b]) => {
  ctx.beginPath(); ctx.moveTo(...PP[a]); ctx.lineTo(...PP[b]); ctx.stroke();
});
if (P.dots) PP.forEach(([x, y]) => {
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x, y, Math.max(3, W / 120), 0, Math.PI * 2); ctx.fill();
});`,

  globe: `/* props [
  {"key":"color","label":"Warna titik","type":"color","value":"#60a5fa"},
  {"key":"count","label":"Jumlah titik","type":"range","min":100,"max":1200,"step":50,"value":400},
  {"key":"tilt","label":"Kemiringan","type":"range","min":-1,"max":1,"step":0.05,"value":0.35}
] */
// Bola titik 3D berputar
ctx.fillStyle = '#04060d';
ctx.fillRect(0, 0, W, H);
const R = Math.min(W, H) * 0.36;
const rotY = t * 0.8, tilt = P.tilt;
const N = Math.round(P.count);
const golden = Math.PI * (3 - Math.sqrt(5));
const cyy = Math.cos(tilt), syy = Math.sin(tilt);
const pts = [];
for (let i = 0; i < N; i++) {
  const y = 1 - (i / (N - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const th = golden * i;
  const x = Math.cos(th) * r, z = Math.sin(th) * r;
  const x1 = x * Math.cos(rotY) + z * Math.sin(rotY);
  const z1 = -x * Math.sin(rotY) + z * Math.cos(rotY);
  const y2 = y * cyy - z1 * syy;
  const z2 = y * syy + z1 * cyy;
  pts.push({ x: W / 2 + x1 * R, y: H / 2 + y2 * R, z: z2 });
}
pts.sort((a, b) => a.z - b.z);
ctx.fillStyle = P.color;
pts.forEach(p => {
  const d = (p.z + 1) / 2;
  ctx.globalAlpha = 0.2 + d * 0.8;
  ctx.beginPath();
  ctx.arc(p.x, p.y, (1.5 + d * 2.5) * Math.min(W, H) / 400, 0, Math.PI * 2);
  ctx.fill();
});
ctx.globalAlpha = 1;`,

  torus: `/* props [] */
// Torus (donat) 3D berputar dengan z-buffer per piksel
ctx.fillStyle = '#0a0812';
ctx.fillRect(0, 0, W, H);
const R1 = Math.min(W, H) * 0.22, R2 = Math.min(W, H) * 0.09;
const A = t * 1.0, B = t * 0.6;
const cA = Math.cos(A), sA = Math.sin(A), cB = Math.cos(B), sB = Math.sin(B);
const K2 = 5, K1 = Math.min(W, H) * 0.9;
const zb = new Float32Array(W * H);
const img = ctx.createImageData(W, H);
const data = img.data;
for (let th = 0; th < 6.28; th += 0.07) {
  const ct = Math.cos(th), st = Math.sin(th);
  for (let ph = 0; ph < 6.28; ph += 0.02) {
    const cp = Math.cos(ph), sp = Math.sin(ph);
    const cx = R2 + R1 * ct;
    const x = cx * (cB * cp + sA * sB * sp);
    const y = cx * (sB * cp - sA * cB * sp);
    const z = K2 + cA * cx * sp;
    const ooz = 1 / z;
    const xp = Math.floor(W / 2 + K1 * ooz * x);
    const yp = Math.floor(H / 2 - K1 * ooz * y);
    if (xp < 0 || xp >= W || yp < 0 || yp >= H) continue;
    const idx = yp * W + xp;
    if (ooz <= zb[idx]) continue;
    zb[idx] = ooz;
    const L = Math.max(0, cp * ct * sB - cA * ct * sp - sA * st + cB * (cA * st - ct * sA * sp));
    const bright = Math.max(0, Math.min(1, L));
    const o = idx * 4;
    const v = 60 + bright * 195;
    data[o] = v * 0.4; data[o + 1] = v * 0.7; data[o + 2] = v; data[o + 3] = 255;
  }
}
ctx.putImageData(img, 0, 0);`
};