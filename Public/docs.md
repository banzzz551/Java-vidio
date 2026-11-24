# Code → Video: Dokumentasi Composition

Dokumen ini menjelaskan cara menulis composition untuk aplikasi **Code → Video**.
Composition adalah kode JavaScript yang menggambar setiap frame video pada canvas 2D.

---

## 1. Gambaran Umum

Composition adalah **body fungsi JavaScript** yang menggambar satu frame pada canvas 2D
berdasarkan waktu `t`. Aplikasi memanggil fungsi ini berulang kali:

- Di **Preview**, `t` mengikuti waktu nyata dan berulang setiap `D` detik.
- Di **Render**, `t` dihitung per frame: `t = frame / fps`. Setiap frame dikirim ke FFmpeg
  untuk dijadikan MP4.

Karena render harus **deterministik**, nilai `t` yang sama harus selalu menghasilkan gambar yang sama.

---

## 2. Variabel yang Tersedia

| Nama  | Tipe   | Arti                                                        |
|-------|--------|-------------------------------------------------------------|
| `ctx` | object | Context canvas 2D (`CanvasRenderingContext2D`)              |
| `t`   | number | Waktu saat ini dalam detik, dari `0` hingga mendekati `D`   |
| `W`   | number | Lebar frame dalam piksel (selalu genap)                     |
| `H`   | number | Tinggi frame dalam piksel (selalu genap)                    |
| `D`   | number | Durasi total video dalam detik                              |
| `P`   | object | Nilai props dari panel kontrol (lihat bagian 4)             |

Composition **tidak** perlu mendeklarasikan `ctx`, `t`, `W`, `H`, `D`, atau `P`.
Semua variabel tersebut sudah tersedia sebagai parameter.

---

## 3. Aturan Wajib

1. **Gunakan hanya `t` untuk animasi.** Jangan memakai `Date.now()`, `performance.now()`,
   atau `Math.random()`. Jika membutuhkan angka acak, gunakan fungsi hash berbasis seed:
   ```js
   function rnd(i, k) { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); }
   ```
2. **Gambar seluruh frame setiap kali.** Mulai dengan `ctx.fillRect(0, 0, W, H)` sebagai latar.
   Jangan bergantung pada frame sebelumnya.
3. **Jangan memakai `import`, `require`, `fetch`, atau akses DOM.** Hanya `ctx` dan variabel di atas yang tersedia.
4. **Gambar eksternal tidak didukung.** Memuat gambar dari URL luar membuat canvas tidak bisa dirender.
   Gunakan bentuk dasar, gradien, dan teks.
5. **Gunakan ukuran relatif.** Hitung posisi dan ukuran dari `W` dan `H`, misalnya
   `W * 0.5` atau `Math.min(W, H) * 0.1`, agar composition cocok di semua resolusi dan rasio.
6. **Tulis body fungsi saja.** Jangan membungkus kode dengan `function render() { ... }`
   dan jangan menyertakan blok kode Markdown (```) di dalam composition.
7. **Escape template literal di `templates.js`.** Di dalam file tersebut, tulis backtick sebagai `\`` dan
   interpolasi sebagai `\${...}`. Pada composition yang ditempel langsung ke Editor, template literal
   tidak perlu di-escape.

---

## 4. Props (Panel Kontrol Otomatis)

Props membuat kontrol di panel tanpa perlu menulis HTML. Deklarasikan props di **baris pertama**
composition sebagai blok komentar `/* props [...] */` yang berisi **JSON array**.

```js
/* props [
  {"key":"judul","label":"Judul","type":"text","value":"Halo Dunia"},
  {"key":"warna","label":"Warna","type":"color","value":"#f472b6"},
  {"key":"ukuran","label":"Ukuran","type":"range","min":10,"max":200,"step":1,"value":80},
  {"key":"jumlah","label":"Jumlah","type":"number","min":1,"max":50,"step":1,"value":10},
  {"key":"bayangan","label":"Tampilkan bayangan","type":"checkbox","value":true}
] */
```

Tipe yang didukung:

| Tipe       | Field tambahan        | Nilai di `P`      |
|------------|-----------------------|-------------------|
| `text`     | —                     | string            |
| `color`    | —                     | string `#rrggbb`  |
| `range`    | `min`, `max`, `step`  | number            |
| `number`   | `step` (opsional)     | number            |
| `checkbox` | —                     | boolean           |

Setiap item wajib memiliki `key` (nama variabel di `P`), `type`, dan `value` (nilai awal).
`label` bersifat opsional. Akses nilainya dengan `P.key`, misalnya `P.warna`.

Jika blok props tidak ada, `P` tetap tersedia sebagai objek kosong.

---

## 5. Contoh Lengkap

Composition berupa bola yang memantul, dengan props.

```js
/* props [
  {"key":"warna","label":"Warna bola","type":"color","value":"#f472b6"},
  {"key":"kecepatan","label":"Kecepatan","type":"range","min":0.2,"max":3,"step":0.1,"value":1},
  {"key":"judul","label":"Judul","type":"text","value":"Bola Memantul"}
] */
ctx.fillStyle = '#0b0d14';
ctx.fillRect(0, 0, W, H);

const R = Math.min(W, H) * 0.05;
const fase = (t * P.kecepatan) / (D / 2);
const pantul = Math.abs(((fase % 2) + 2) % 2 - 1);  // gelombang segitiga 0..1..0
const x = R + (W - 2 * R) * pantul;
const y = H * 0.6;

ctx.fillStyle = P.warna;
ctx.beginPath();
ctx.arc(x, y, R, 0, Math.PI * 2);
ctx.fill();

ctx.fillStyle = '#fff';
ctx.font = `bold ${Math.min(W, H) / 16}px sans-serif`;
ctx.textAlign = 'center';
ctx.fillText(P.judul, W / 2, H * 0.2);
```

---

## 6. Pola Animasi yang Umum

Progres dari 0 sampai 1 selama durasi video:
```js
const p = t / D;
```

Easing (awal lambat, tengah cepat, akhir lambat):
```js
const ease = p => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
```

Berulang setiap 1 detik (berguna untuk kedip atau denyut):
```js
const loop = t % 1;  // berulang 0..1
```

Muncul bertahap (fade in dari detik 0 sampai 1):
```js
ctx.globalAlpha = Math.min(1, t / 1);
// ... gambar ...
ctx.globalAlpha = 1;
```

Proyeksi 3D sederhana (perspektif):
```js
function project(x, y, z) {
  const f = (Math.min(W, H) * 1.2) / (z + 4);
  return [W / 2 + x * f, H / 2 + y * f];
}
```

---

## 7. Template Bawaan

Editor sudah menyediakan template berikut yang bisa dijadikan acuan:

- **Partikel (2D):** titik yang bergerak dengan nilai seed dari `rnd(i, k)`.
- **Bar chart (2D):** batang yang tumbuh seiring waktu dengan `Math.min(1, t / (D * 0.6))`.
- **Ketik (2D):** teks yang muncul bertahap dengan `full.slice(0, n)`, `n` dihitung dari `t / D`.
- **Gelombang (2D):** `Math.sin(x * k + t * speed)` untuk setiap kolom piksel.
- **Denyut (2D):** lingkaran yang membesar dengan `phase = (t / periode + i / N) % 1`.
- **Kubus (3D):** kubus kawat yang berputar dengan proyeksi perspektif manual.
- **Bola titik (3D):** bola titik yang berputar.
- **Torus (3D):** donat yang berputar, dirender per piksel dengan depth buffer.

---

## 8. Meminta Composition dari AI Agent

Saat meminta AI membuat composition, gunakan format keluaran berikut:

1. **Kode saja** dalam satu blok, tanpa penjelasan panjang.
2. Baris pertama berisi blok `/* props [...] */`. Gunakan `/* props [] */` jika tidak ada props.
3. Tidak memakai `import`, `require`, `Math.random()`, `Date`, atau `fetch`.
4. Semua ukuran relatif terhadap `W`, `H`, atau `D`.
5. Animasi hanya bergantung pada `t`.

Contoh prompt:

> Buatkan composition untuk aplikasi Code → Video sesuai dokumentasi terlampir.
> Tema: logo lingkaran perusahaan yang membesar, lalu nama perusahaan muncul sebagai teks.
> Buat props untuk warna latar, warna lingkaran, dan teks. Kode saja, tanpa penjelasan.

Untuk membuat composition yang meniru gambar tertentu, unduh **SKILL.md** dari tab ini
dan berikan file tersebut bersama gambar referensi ke AI agent.

---

## 9. Cara Menggunakan Hasil dari AI

1. Buka tab **Editor**, hapus kode yang ada, lalu tempel composition baru.
2. Panel **Props** akan muncul otomatis. Atur nilainya.
3. Buka tab **Render**, tekan **Preview** untuk memeriksa hasilnya.
4. Pilih resolusi, rasio, kualitas, FPS, dan durasi, lalu tekan **Render**.
5. Buka tab **Galeri** untuk memutar, memindahkan, atau menghapus video.
6. Simpan composition di tab **Simpan** agar bisa dipakai lagi.

---

## 10. Penyimpanan Video dan Composition

- Video hasil render disimpan di folder `output/` pada server dan muncul di tab **Galeri**.
- Untuk memindahkan video ke penyimpanan perangkat, gunakan tombol **Pindah**. Tujuan default-nya
  `~/storage/shared/Movies/CodeVideo`, yang tampil sebagai folder **Movies/CodeVideo** di perangkat
  dan langsung terlihat di aplikasi galeri.
- Jalankan `termux-setup-storage` sekali di Termux untuk mengaktifkan fitur ini.
- Video yang sudah dipindahkan tidak lagi muncul di Galeri aplikasi.
- Composition yang disimpan di tab **Simpan** tersimpan di `localStorage` browser, bukan di server.
  Gunakan **Ekspor** untuk memindahkannya ke perangkat atau browser lain.
