---
name: codevideo-composition
description: Write JavaScript canvas 2D compositions for the Code → Video app, which renders canvas code to MP4 with FFmpeg. Use when the user asks for a composition, animation, or video code for Code → Video, or asks to recreate a reference image, poster, or design as an animated video in this app.
---

# Code → Video Composition Skill

Skill ini mengajarkan cara menulis composition untuk aplikasi Code → Video dan cara
menerjemahkan gambar referensi menjadi composition yang visualnya sangat mirip.

---

## 1. Runtime

Composition adalah **body fungsi JavaScript** yang menggambar satu frame pada canvas 2D.
Aplikasi membungkusnya seperti ini:

```js
new Function('ctx', 't', 'W', 'H', 'D', 'P', code)
```

- **Preview**: `t` mengikuti waktu nyata dan berulang setiap `D` detik.
- **Render**: untuk setiap frame `i`, aplikasi memanggil fungsi dengan `t = i / fps`,
  lalu mengambil piksel dengan `getImageData` dan mengirimnya ke FFmpeg.
  Frame terakhir memiliki `t = (total - 1) / fps`, yaitu selalu kurang dari `D`.
- Sebelum setiap pemanggilan, aplikasi memanggil `ctx.setTransform(1, 0, 0, 1, 0, 0)`.
  Transformasi tidak perlu di-reset manual di awal composition.
- Setiap frame dimulai dari konteks yang bersih, tetapi state seperti `globalAlpha`,
  `shadowBlur`, dan `filter` dapat terbawa ke frame berikutnya bila tidak di-reset.

Karena render harus deterministik, **hasil untuk `t` yang sama harus selalu identik**.

---

## 2. Variabel yang tersedia

| Nama  | Tipe   | Arti                                                       |
|-------|--------|------------------------------------------------------------|
| `ctx` | object | `CanvasRenderingContext2D`                                 |
| `t`   | number | Waktu dalam detik, dari `0` sampai mendekati `D`           |
| `W`   | number | Lebar frame dalam piksel (genap)                           |
| `H`   | number | Tinggi frame dalam piksel (genap)                          |
| `D`   | number | Durasi total dalam detik                                   |
| `P`   | object | Nilai props dari panel kontrol (lihat bagian 4)            |

**Larangan nama:** jangan mendeklarasikan ulang `ctx`, `t`, `W`, `H`, `D`, atau `P`
dengan `const`, `let`, `var`, atau `function`. Hal ini menghasilkan SyntaxError.
Nama lain seperti `U`, `X`, `S`, `lerp`, `rnd` aman digunakan.

---

## 3. Aturan wajib

1. **Animasi hanya bergantung pada `t`.** Dilarang memakai `Date.now()`, `performance.now()`,
   `Math.random()`, atau sumber waktu/acak lain. Untuk angka acak gunakan hash berbasis seed (bagian 7).
2. **Gambar seluruh frame setiap kali.** Mulai dengan latar `ctx.fillRect(0, 0, W, H)`.
   Jangan bergantung pada isi frame sebelumnya.
3. **Dilarang:** `import`, `require`, `fetch`, `XMLHttpRequest`, akses DOM (`document`, `window`),
   dan `new Image()` dengan sumber luar.
4. **Tidak ada pemuatan gambar.** Aplikasi tidak menyediakan cara memuat gambar atau font.
   Gunakan bentuk dasar, gradien, teks, dan font sistem.
5. **Semua ukuran relatif.** Hitung dari `W`, `H`, atau `U = Math.min(W, H)`.
   Angka piksel mutlak hanya boleh muncul sebagai pengali pada satuan relatif.
6. **Body fungsi saja.** Jangan membungkus dengan `function render() {}` dan jangan memakai
   blok kode ``` di dalam composition.
7. **Reset state canvas.** Setiap perubahan `globalAlpha`, `shadow*`, `filter`,
   `globalCompositeOperation`, `letterSpacing`, dan `lineDash` harus dikembalikan ke nilai awal
   atau diapit `ctx.save()` dan `ctx.restore()`.
8. **Gunakan `try`-tidak-perlu.** Composition tidak boleh melempar error pada `t` mana pun.
   Hindari pembagian dengan nol dan `Math.sqrt` dari angka negatif.

---

## 4. Props (panel kontrol)

Props dideklarasikan di baris pertama sebagai `/* props [...] */` yang isinya **JSON array valid**.
JSON harus memakai tanda kutip ganda dan tanpa koma berlebih di akhir.

```js
/* props [
  {"key":"judul","label":"Judul","type":"text","value":"Halo Dunia"},
  {"key":"warna","label":"Warna","type":"color","value":"#f472b6"},
  {"key":"ukuran","label":"Ukuran","type":"range","min":10,"max":200,"step":1,"value":80},
  {"key":"jumlah","label":"Jumlah","type":"number","min":1,"max":50,"step":1,"value":10},
  {"key":"aktif","label":"Tampilkan bayangan","type":"checkbox","value":true}
] */
```

| type       | Field tambahan       | Nilai di `P`      |
|------------|----------------------|-------------------|
| `text`     | —                    | string            |
| `color`    | —                    | string `#rrggbb`  |
| `range`    | `min`, `max`, `step` | number            |
| `number`   | `step` (opsional)    | number            |
| `checkbox` | —                    | boolean           |

- Setiap item wajib memiliki `key`, `type`, dan `value`. `label` opsional.
- `key` harus unik. Akses dengan `P.key`.
- Props tidak wajib. Jika tidak ada, tulis `/* props [] */`.
- Gunakan props untuk elemen yang mungkin ingin diubah pengguna: warna, teks, dan kecepatan.
  Jangan jadikan props posisi piksel mutlak.

---

## 5. Timeline dan animasi

Composition yang mirip referensi biasanya dibangun dari **timeline**: setiap elemen punya
waktu masuk, durasi, dan kurva easing. Catat timeline ini sebelum menulis kode.

### 5.1 Helper waktu dan easing

```js
const clamp01 = v => Math.max(0, Math.min(1, v));
const lerp = (a, b, k) => a + (b - a) * k;
// Progres 0..1 dalam jendela [start, start + dur]
const seg = (t, start, dur) => clamp01((t - start) / dur);
const easeInOutCubic = p => p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const easeOutCubic = p => 1 - Math.pow(1 - p, 3);
const easeOutBack = p => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};
const easeOutElastic = p => {
  if (p === 0 || p === 1) return p;
  return Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
};
```

### 5.2 Satuan relatif

```js
const U = Math.min(W, H);       // satuan dasar
const X = fx => fx * W;         // fraksi lebar  (0..1)
const Y = fy => fy * H;         // fraksi tinggi (0..1)
const S = fs => fs * U;         // ukuran relatif terhadap sisi terkecil
```

### 5.3 Pola umum

- Muncul bertahap: `ctx.globalAlpha = easeOutCubic(seg(t, 0.4, 0.6));` lalu reset ke `1`.
- Geser masuk: `const dx = lerp(S(0.08), 0, easeOutCubic(seg(t, a, d)));`
- Membesar lalu memantul: `const sc = easeOutBack(seg(t, a, d));` dan skala elemen dengan `sc`.
- Mengetik: `const n = Math.floor(seg(t, a, d) * text.length);` lalu `text.slice(0, n)`.
- Berulang: `const loop = (t % period) / period;`.
- Hilang di akhir: kalikan opacity dengan `1 - seg(t, D - 0.5, 0.5)`.

---

## 6. Mereplikasi gambar referensi

Ikuti langkah ini secara berurutan saat pengguna memberikan gambar.

### Langkah 1: Tentukan format
- **Rasio** gambar. Pilih rasio yang sama di app: 1:1, 16:9, 9:16, atau 4:5.
  Jika rasio gambar tidak ada di app, pilih yang paling dekat dan beri tahu pengguna.
- **Durasi** dan **FPS**. Jika tidak disebutkan, gunakan 5 detik dan 30 FPS.
- **Gerak**: apakah gambar statis atau sudah berupa keyframe. Jika statis dan pengguna tidak
  menyebut animasi, usulkan animasi yang masuk akal dan jelaskan singkat.

### Langkah 2: Ukur elemen
Untuk setiap elemen, catat dalam tabel:

| Elemen | Jenis      | Pusat (fx, fy) | Lebar/tinggi (fraksi) | Warna        | Catatan              |
|--------|------------|----------------|-----------------------|--------------|----------------------|
| Latar  | gradien    | —              | —                     | #0b0d14→#1d2440 | arah vertikal   |
| Logo   | lingkaran  | 0.50, 0.42     | r = 0.12 × U          | #f472b6      | bayangan lembut      |
| Judul  | teks       | 0.50, 0.70     | tinggi 0.07 × H       | #ffffff      | bold, sans-serif     |

- Koordinat dihitung sebagai fraksi dari ukuran gambar: `x_piksel / lebar_gambar`.
- Warna diambil dari gambar sebagai hex. Perkirakan dengan teliti: latar, warna aksen,
  warna teks, dan bayangan. Jangan mengandalkan warna "terkenal" dari memori.
- Ukuran teks dinyatakan sebagai tinggi huruf kapital relatif terhadap `H` atau `U`.

### Langkah 3: Tentukan tipografi
- Teks harus persis sama dengan gambar, termasuk huruf besar, tanda baca, dan spasi.
- Font di aplikasi berasal dari sistem perangkat. Pilih famili generik:
  - Sans-serif modern: `sans-serif`
  - Serif: `serif`
  - Monospace: `monospace`
- Pilih bobot dengan `bold`, `600`, atau `normal`. Font yang persis dengan gambar tidak tersedia.
- Lebar teks: pastikan teks tidak melebihi area yang diukur. Gunakan `fitText` (bagian 7).
- Spasi huruf: `ctx.letterSpacing = '0.2em'` didukung di Chrome modern. Reset ke `'0px'` setelahnya.

### Langkah 4: Tentukan bentuk dan efek
- Radius sudut, lebar garis, dan panjang dash dinyatakan relatif terhadap `U`.
- Gradien: gunakan `createLinearGradient` atau `createRadialGradient`.
- Bayangan: `shadowColor`, `shadowBlur`, `shadowOffsetX/Y`. Reset setelah dipakai.
- Transparansi: gunakan `globalAlpha` atau alfa pada warna `rgba()`.
- Blur atau glow: `ctx.filter = 'blur(12px)'` didukung di Chrome, tetapi lambat pada resolusi tinggi.
  Gunakan seperlunya.
- Blend mode: `globalCompositeOperation = 'screen'` atau `'lighter'` untuk efek cahaya.

### Langkah 5: Susun timeline
Untuk setiap elemen dengan gerak, tulis baris timeline:
`Elemen: mulai 0.4 dtk, durasi 0.6 dtk, easeOutBack, geser dari kiri 8% lebar`.

### Langkah 6: Batas kecocokan
Sampaikan batas ini kepada pengguna jika relevan:
- Font persis dan foto bitmap tidak bisa direproduksi. Ganti foto dengan bentuk atau gradien
  yang mendekati warna dominannya, lalu sebutkan penggantian itu.
- Piksel bisa sedikit berbeda karena rasterisasi dan antialiasing perangkat.
- Ikon kompleks dapat didekati dengan `Path2D` dari path SVG yang ditulis manual. Ini memerlukan
  koordinat yang akurat dan biasanya membutuhkan iterasi.

---

## 7. Pustaka helper siap pakai

Tempel helper ini di awal composition bila dibutuhkan. Helper hanya menggunakan parameter yang tersedia.

```js
// Hash deterministik untuk angka acak berbasis seed
function rnd(i, k) { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); }

// Gradien linear dari daftar [offset, warna]
function lin(x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}

// Persegi panjang bersudut. Gunakan roundRect jika tersedia, jika tidak gunakan manual.
function rr(x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Kecilkan ukuran font agar teks muat di maxW. Panggil setelah ctx.font diatur.
function fitText(str, maxW, size, weight = 'bold', family = 'sans-serif') {
  ctx.font = `${weight} ${size}px ${family}`;
  const w = ctx.measureText(str).width;
  const s = w > maxW ? size * (maxW / w) : size;
  ctx.font = `${weight} ${s}px ${family}`;
  return s;
}

// Tulis teks dengan bayangan lalu reset state
function text(str, x, y, { size, weight = 'bold', family = 'sans-serif', color = '#fff',
  align = 'center', baseline = 'middle', maxW = null, shadow = null } = {}) {
  ctx.save();
  ctx.font = `${weight} ${size}px ${family}`;
  if (maxW) fitText(str, maxW, size, weight, family);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (shadow) {
    ctx.shadowColor = shadow.color;
    ctx.shadowBlur = shadow.blur;
    ctx.shadowOffsetX = shadow.x || 0;
    ctx.shadowOffsetY = shadow.y || 0;
  }
  ctx.fillText(str, x, y);
  ctx.restore();
}

// Lingkaran dengan opsi isi dan garis
function circle(x, y, r, { fill = null, stroke = null, lw = 0 } = {}) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
```

Helper di atas menggunakan `ctx.save()` dan `ctx.restore()`, sehingga state tidak bocor ke pemanggilan berikutnya.
Jika `text()` dipanggil di dalam composition, pastikan nama `text` tidak bentrok dengan variabel lain.

---

## 8. Batasan canvas dan font

- Ukuran maksimum frame 3840 × 2160. Semua dimensi genap.
- Tidak ada pemuatan gambar atau font eksternal. `drawImage` hanya bisa memakai canvas yang dibuat
  dalam composition itu sendiri, misalnya `document.createElement` tidak tersedia, sehingga praktisnya tidak dipakai.
- Teks memakai font sistem. Gunakan `sans-serif`, `serif`, atau `monospace` sebagai famili.
- Nilai `ctx.font` harus valid. Gunakan ukuran dalam piksel, misalnya `bold 48px sans-serif`.
- `ctx.letterSpacing`, `ctx.roundRect`, dan `ctx.filter` didukung di Chrome modern. Sediakan fallback bila perlu.

---

## 9. Performa

- Render berjalan di browser per frame. Jumlah elemen besar, blur, dan shadow pada 1440p atau 2160p
  dapat membuat render sangat lama.
- Batasi partikel sekitar 100 sampai 300 untuk resolusi tinggi.
- Hindari `ctx.filter` pada loop elemen. Terapkan sekali bila memungkinkan.
- Untuk operasi per piksel (seperti template torus), gunakan `ImageData` dan kurangi resolusi perhitungan bila memungkinkan.

---

## 10. Checklist verifikasi sebelum output

Periksa semua poin sebelum mengirim composition:

1. Baris pertama adalah `/* props [...] */` dengan JSON valid, atau `/* props [] */`.
2. Tidak ada `Math.random`, `Date`, `performance`, `import`, `require`, `fetch`, atau `document`.
3. Tidak ada deklarasi ulang `ctx`, `t`, `W`, `H`, `D`, atau `P`.
4. Latar digambar di awal setiap frame.
5. `globalAlpha`, shadow, `filter`, dan `letterSpacing` selalu direset atau dibungkus `save`/`restore`.
6. Semua koordinat dan ukuran dihitung dari `W`, `H`, `U`, atau `D`.
7. Teks sama persis dengan referensi dan muat di area yang ditentukan (`fitText`).
8. Warna diambil dari referensi dan dituliskan sebagai hex atau `rgba`.
9. Tidak ada `NaN`, `Infinity`, atau nilai negatif pada `arc` dan `lineWidth`.
10. Pada `t = 0` dan `t` mendekati `D`, hasilnya tampak benar.
11. Timeline sesuai referensi dan durasi `D` cukup untuk menampilkan semua gerak.

---

## 11. Format output

Saat diminta membuat composition:

1. Keluarkan **satu blok kode JavaScript** saja.
2. Baris pertama adalah blok props.
3. Tambahkan komentar singkat di dalam kode untuk timeline utama.
4. Jika ada penggantian elemen karena batas platform (misalnya foto), tulis satu baris komentar di kode yang menjelaskannya.
5. Jika informasi penting belum jelas (rasio, durasi, gerak), tanyakan sebelum menulis kode,
   kecuali pengguna meminta langsung hasilnya.

---

## 12. Contoh singkat

Referensi: lingkaran berwarna di tengah, membesar dengan pantulan, lalu teks judul muncul dari bawah.

```js
/* props [
  {"key":"bg","label":"Warna latar","type":"color","value":"#0b0d14"},
  {"key":"accent","label":"Warna lingkaran","type":"color","value":"#f472b6"},
  {"key":"judul","label":"Judul","type":"text","value":"NAMA PERUSAHAAN"}
] */
// Timeline:
// 0.0 - 0.8 dtk : lingkaran membesar dengan easeOutBack
// 0.6 - 1.4 dtk : teks naik 6% tinggi dan muncul
// 1.4 - D       : diam

const U = Math.min(W, H);
const X = fx => fx * W, Y = fy => fy * H, S = fs => fs * U;
const lerp = (a, b, k) => a + (b - a) * k;
const clamp01 = v => Math.max(0, Math.min(1, v));
const seg = (t, s, d) => clamp01((t - s) / d);
const easeOutBack = p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
const easeOutCubic = p => 1 - Math.pow(1 - p, 3);

ctx.fillStyle = P.bg;
ctx.fillRect(0, 0, W, H);

// Lingkaran
const sc = easeOutBack(seg(t, 0, 0.8));
ctx.beginPath();
ctx.arc(X(0.5), Y(0.42), Math.max(0, S(0.14) * sc), 0, Math.PI * 2);
ctx.fillStyle = P.accent;
ctx.fill();

// Teks
const k = easeOutCubic(seg(t, 0.6, 0.8));
ctx.save();
ctx.globalAlpha = k;
ctx.font = `bold ${S(0.07)}px sans-serif`;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillStyle = '#ffffff';
ctx.fillText(P.judul, X(0.5), Y(0.72) + lerp(S(0.06), 0, k));
ctx.restore();
```
