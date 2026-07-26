// Batch import cerpen dari folder .docx ke tabel `stories`.
//
//   node scripts/import-cerpen-batch.mjs                 # dry-run: parse + laporan, TANPA tulis DB / upload
//   node scripts/import-cerpen-batch.mjs --commit         # jalan sungguhan: upload gambar + insert DB
//   node scripts/import-cerpen-batch.mjs --limit 5        # proses 5 file pertama tiap media (uji cepat)
//   node scripts/import-cerpen-batch.mjs --dir "CERPEN KRITISA"
//
// Lihat spec: docs/superpowers/specs/2026-07-17-batch-import-cerpen-design.md
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import mammoth from "mammoth";
import pg from "pg";

const { Pool } = pg;
const ROOT = process.cwd();

// ── Argumen ─────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const COMMIT = argv.includes("--commit");
const DEBUG = argv.includes("--debug");
const LIMIT = readNumFlag("--limit", Infinity);
const SRC_DIR = readStrFlag("--dir", "CERPEN KRITISA");
const OUT_DIR = readStrFlag("--out", process.env.SCRATCH_DIR || ROOT);
const IMG_MIN_BYTES = 3000; // gambar < 3KB dianggap logo/ikon, bukan ilustrasi

function readNumFlag(name, def) {
  const i = argv.indexOf(name);
  if (i === -1 || i + 1 >= argv.length) return def;
  const n = parseInt(argv[i + 1], 10);
  return Number.isFinite(n) ? n : def;
}
function readStrFlag(name, def) {
  const i = argv.indexOf(name);
  return i === -1 || i + 1 >= argv.length ? def : argv[i + 1];
}

// ── Env ──────────────────────────────────────────────────────────────────────
function loadEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const s = line.trimStart();
    if (!s || s.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}
const env = loadEnv(path.join(ROOT, ".env"));
const DATABASE_URL = env.DATABASE_URL;
const IK_PUBLIC = env.IMAGEKIT_PUBLIC_KEY;
const IK_PRIVATE = env.IMAGEKIT_PRIVATE_KEY;

// ── Konstanta ─────────────────────────────────────────────────────────────────
const MONTHS = {
  januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6,
  juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12,
  // Sebagian file (Republika) memakai nama bulan Inggris.
  january: 1, february: 2, march: 3, may: 5, june: 6, july: 7,
  august: 8, october: 10, december: 12,
  // Singkatan (Media Indonesia: "Min, 31 Mar 2024"). WAJIB di urutan terakhir:
  // MONTHS_RE dipakai sebagai alternasi regex, dan alternasi JS memilih yang
  // paling kiri — kalau "mar" ditaruh sebelum "maret", "Maret" ikut terpotong.
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7,
  agu: 8, ags: 8, agt: 8, sept: 9, sep: 9, okt: 10, nov: 11, des: 12,
};
const MONTHS_RE = Object.keys(MONTHS).join("|");
// Nama folder -> nama media kanonik di DB.
const MEDIA_CANON = {
  "JAWA POS": "Jawa Pos",
  KOMPAS: "Kompas",
  REPUBLIKA: "Republika",
  TEMPO: "Tempo",
  "MEDIA INDONESIA": "Media Indonesia",
};
// Penanda kuat bio penulis — nyaris tak pernah muncul di narasi cerita.
const BIO_STRONG =
  /(lahir di|lahir pada|lahir tahun|\bkelahiran\b|ber-?ktp|kumpulan cerpen|kumpulan puisi|kumpulan sajak|antologi|alumnus|alumni|finalis|memenangkan|meraih (penghargaan|juara|hadiah|anugerah)|pemenang (ke|pertama|kedua|ketiga|utama)|bermukim di|menetap di|sehari-hari (bekerja|mengajar)|mengajar di|aktif di (komunitas|flp|sanggar)|bergiat di|tergabung dalam|karyanya (telah|pernah|banyak|sudah)|cerpennya (telah|pernah|dimuat|tersiar|banyak)|puisinya (telah|pernah|dimuat)|bukunya|buku (pertama|kedua|ketiga|terbaru)(nya)?|novel(nya)? (pertama|terbaru|berjudul)|dapat dihubungi|bisa disapa)/i;
// Penanda lemah — perlu didukung nama penulis untuk dianggap bio.
const BIO_WEAK =
  /(penulis|pengarang|penyair|sastrawan|cerpenis|esais|novelis|dosen|mahasiswa|menekuni|pameran|melukis|perupa|redaktur|editor)/i;

// ── Util (selaras src/lib/utils.ts) ──────────────────────────────────────────
function slugify(v) {
  return String(v)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}
function makeId(prefix) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 18)}`;
}
function nowIso() {
  return new Date().toISOString();
}
function collapse(s) {
  return String(s).replace(/[ \t]+/g, " ").trim();
}
function toTitleCaseIfCaps(s) {
  // Hanya ubah kalau seluruhnya kapital (judul header). Kalau sudah campur, biarkan.
  const letters = s.replace(/[^A-Za-z]/g, "");
  if (!letters || letters !== letters.toUpperCase()) return s.trim();
  const small = new Set(["di", "ke", "dari", "dan", "yang", "untuk", "pada", "atau", "dengan", "the", "of", "in", "a", "an"]);
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) =>
      i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(" ")
    .trim();
}

// ── Parsing metadata ──────────────────────────────────────────────────────────
function parseDate(text) {
  const full = text.match(
    new RegExp(`(\\d{1,2})\\s+(${MONTHS_RE})\\s+(\\d{4})`, "i"),
  );
  if (full) {
    const d = full[1].padStart(2, "0");
    const mo = String(MONTHS[full[2].toLowerCase()]).padStart(2, "0");
    return { publishedAt: `${full[3]}-${mo}-${d}`, publicationMonth: `${full[3]}-${mo}`, flagged: false };
  }
  const my = text.match(new RegExp(`(${MONTHS_RE})\\s+(\\d{4})`, "i"));
  if (my) {
    const mo = String(MONTHS[my[1].toLowerCase()]).padStart(2, "0");
    return { publishedAt: "", publicationMonth: `${my[2]}-${mo}`, flagged: false };
  }
  return null;
}
function parseNumericDate(text) {
  const m = text.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4,5})/);
  if (!m) return null;
  const d = m[1].padStart(2, "0");
  const mo = m[2].padStart(2, "0");
  let y = m[3];
  let flagged = false;
  if (y.length === 5) {
    flagged = true;
    y = "20" + y.slice(-2); // "20025" -> "2025"
  }
  if (+mo < 1 || +mo > 12 || +d < 1 || +d > 31) return null;
  return { publishedAt: `${y}-${mo}-${d}`, publicationMonth: `${y}-${mo}`, flagged };
}

// Judul dari nama file: buang nomor urut, nama media, tanggal, pemisah.
function parseTitleFromFile(fileBase, mediaCanon) {
  let t = fileBase.replace(/\.\s*docx$/i, "");
  t = t.replace(/^\s*\d+\s*[.)]\s*/, ""); // "10. " / "11) "
  // buang nama media (varian folder + kanonik)
  t = t.replace(new RegExp(`^\\s*${mediaCanon}\\b[\\s,–-]*`, "i"), "");
  t = t.replace(/^\s*(JAWA POS|KOMPAS|REPUBLIKA|TEMPO)\b[\s,–-]*/i, "");
  // buang tanggal (indo / numerik dalam kurung)
  // `\s*,?\s*` sebelum tahun: sebagian nama file memakai "25 Februari, 2024".
  t = t.replace(new RegExp(`\\(?\\b\\d{1,2}\\s+(${MONTHS_RE})\\s*,?\\s*\\d{4}\\)?`, "i"), "");
  t = t.replace(/\(?\b\d{1,2}[-/.]\d{1,2}[-/.]\d{4,5}\)?/, "");
  // buang pemisah sisa di depan
  t = t.replace(/^[\s–—\-_,:|]+/, "");
  t = collapse(t.replace(/[_]+/g, " "));
  if (mediaCanon === "Tempo") t = t.replace(/^cerpen\s+/i, "");
  // Titik tunggal di ekor berasal dari nama file ("...Santai..docx"), bukan
  // bagian judul. Elipsis (`...`) sengaja dipertahankan.
  t = t.replace(/(?<!\.)\.$/, "");
  // Judul nama file kadang seluruhnya kapital ("PROTES") — samakan gayanya.
  return toTitleCaseIfCaps(t);
}

// Pisahkan blok header dari isi. Header kontigu di atas: media-tanggal, url,
// judul, penulis (baik "oleh X" maupun nama telanjang ala Tempo), kredit
// ilustrasi, pemisah. Isi dimulai di baris naratif pertama.
function splitHeaderBody(lines, titleHint) {
  const titleSlug = slugify(titleHint || "");
  let bodyStart = 0;
  let author = "";
  for (let i = 0; i < lines.length && i < 15; i++) {
    const l = lines[i];
    if (l === "") { bodyStart = i + 1; continue; }
    // "Oleh: X" (Kompas/Republika) maupun "Penulis: X" (Media Indonesia).
    const om = l.match(/^\s*(?:oleh|penulis)\s*:?\s*(.+)$/i);
    if (om) { author = collapse(om[1].replace(/^[:\s]+/, "")); bodyStart = i + 1; continue; }
    // Baris judul (cocok dengan judul dari nama file) -> lewati sebagai judul,
    // JANGAN dijadikan penulis (penting untuk Tempo yang judulnya mixed-case).
    const lslug = slugify(l);
    if (
      titleSlug &&
      lslug.length >= 6 &&
      l.length < 120 &&
      (lslug === titleSlug || lslug.includes(titleSlug) || titleSlug.includes(lslug))
    ) {
      bodyStart = i + 1;
      continue;
    }
    if (
      /^https?:\/\//i.test(l) ||
      isIllustration(l) ||
      isSeparator(l) ||
      isCapsTitle(l) ||
      /^(jawa pos|kompas|republika|tempo|cerpen)\b/i.test(l) ||
      (new RegExp(`\\b(${MONTHS_RE})\\b.*\\d{4}`, "i").test(l) && l.length < 80)
    ) {
      bodyStart = i + 1;
      continue;
    }
    // Nama penulis telanjang (tanpa "oleh"): pendek, huruf-dominan, bukan kalimat.
    if (
      !author &&
      l.length <= 60 &&
      l.split(/\s+/).length <= 6 &&
      /^[A-Za-zÀ-ÿ.'’\- ]+$/.test(l) &&
      !/[.!?]$/.test(l)
    ) {
      author = collapse(l);
      bodyStart = i + 1;
      continue;
    }
    break; // baris naratif pertama = awal isi
  }
  return { bodyStart, author };
}

// ── Pembersihan isi ───────────────────────────────────────────────────────────
function isIllustration(line) {
  return (
    /^(ilustrasi|ilustrator|foto|dok\.|sumber|caption|editor|infografi|grafis)\b/i.test(line) ||
    // Kredit ilustrator Media Indonesia: "MI/Ebet", "MI/Seno", "IM/Tiyok".
    /^(mi|im)\s*\/\s*[\w'’.-]+$/i.test(line.trim())
  );
}
function isCapsTitle(line) {
  const letters = line.replace(/[^A-Za-z]/g, "");
  return letters.length >= 3 && letters === letters.toUpperCase();
}
function isSeparator(line) {
  return /^[-–—*=_.\s]{1,}$/.test(line) || /^\(\*\)$/.test(line);
}
// Paragraf pemisah adegan tunggal (* * *, ---, ***) — bukan akhir cerita.
function isSceneBreak(p) {
  const t = p.trim();
  return /^[-–—*=_.]{2,}$/.test(t) || /^(\*\s*){2,}\*?$/.test(t) || /^[•●▪]$/.test(t);
}
// Tanda tangan tempat+tanggal di ekor, mis. "Ciputat, 14 Maret 2018" /
// "Alenquer, Amazon-Brasil, November 2025" / "Purwokerto, 2025".
function isDateline(p) {
  const t = p.trim().replace(/\s+/g, " ");
  if (t.length > 60) return false;
  return (
    new RegExp(
      `^[A-Za-zÀ-ÿ.,'\\-/ ]{2,45},\\s*(\\d{1,2}\\s+)?(${MONTHS_RE})\\s+\\d{4}\\.?$`,
      "i",
    ).test(t) || /^[A-Za-zÀ-ÿ.,'\-/ ]{2,45},\s*\d{4}\.?$/.test(t)
  );
}
function reEsc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
// Paragraf catatan kaki bernomor (khas Tempo): "1) danchi = ..." / "5. Term: ...".
function isFootnotePara(p) {
  const t = p.trim();
  return /^\d{1,2}[).]\s+\S/.test(t) && t.length < 800;
}
// Label blok catatan kaki/glosarium: "Keterangan:" (Tempo), "Catatan:" (Kompas),
// "Glosarium:". Anchor andal untuk memotong blok penjelasan istilah di ekor.
function isKeteranganPara(p) {
  return /^(keterangan|catatan(\s+kaki)?|glosarium)\s*:/i.test(p.trim());
}
// Paragraf bio (penulis ATAU ilustrator): diawali nama, penanda kuat, atau
// penanda lemah + nama penulis.
function isBioParagraph(p, author) {
  if (p.length > 800) return false;
  const t = p.trim();
  if (author) {
    const first2 = author.split(/\s+/).slice(0, 2).join(" ");
    if (first2.replace(/[^A-Za-zÀ-ÿ]/g, "").length >= 5 && new RegExp(`^${reEsc(first2)}\\b`, "i").test(t)) {
      return true; // bio hampir selalu diawali nama penulis
    }
  }
  // "Nama Nama, <deskriptor bio>" — pola bio penulis maupun ilustrator di ekor.
  if (
    p.length < 400 &&
    /^[A-ZÀ-Þ][a-zà-ÿ.'’-]+(\s+[A-ZÀ-Þ][a-zà-ÿ.'’-]+){1,3},/.test(t) &&
    (BIO_WEAK.test(p) || BIO_STRONG.test(p))
  ) {
    return true;
  }
  if (BIO_STRONG.test(p)) return true;
  if (author && BIO_WEAK.test(p) && p.length < 500) {
    const names = author.split(/\s+/).filter((w) => w.replace(/[^A-Za-zÀ-ÿ]/g, "").length >= 3);
    const hit = names.some((w) => new RegExp(`\\b${reEsc(w)}\\b`, "i").test(p));
    if (hit) return true;
  }
  return false;
}

function cleanContent(rawText, titleHint) {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim());
  const { bodyStart, author: rawAuthor } = splitHeaderBody(lines, titleHint);
  const author = toTitleCaseIfCaps(rawAuthor);
  let body = lines.slice(bodyStart);

  // Buang baris ilustrasi / pemisah yang nyasar di dalam isi.
  body = body.filter((l) => !(isIllustration(l) || /^-+$/.test(l)));

  // Susun jadi paragraf (dipisah baris kosong).
  const paras = [];
  let cur = [];
  for (const l of body) {
    if (l === "") {
      if (cur.length) { paras.push(cur.join(" ")); cur = []; }
    } else {
      cur.push(l);
    }
  }
  if (cur.length) paras.push(cur.join(" "));

  const flags = [];

  // 1) Buang paragraf pemisah adegan (***/---) — ini bukan akhir cerita,
  //    jadi TIDAK boleh dipakai untuk memotong isi.
  let scenes = paras.filter((p) => !isSceneBreak(p));

  // 2) Buang ekor: bio penulis, dateline, dan paragraf catatan kaki bernomor.
  //    Bisa muncul dalam urutan apa pun; loop sampai paragraf naratif asli.
  let removedBio = 0;
  let cutFootnote = false;
  for (let guard = 0; guard < 20 && scenes.length > 1; guard++) {
    const last = scenes[scenes.length - 1];
    if (isFootnotePara(last) || isKeteranganPara(last)) { scenes.pop(); cutFootnote = true; continue; }
    if (isBioParagraph(last, author) || isDateline(last)) { scenes.pop(); removedBio++; continue; }
    break;
  }

  // 3) Rapikan penanda "(*)" & pemisah adegan yang menempel, lalu gabung.
  let content = scenes
    .map((p) =>
      p
        .replace(/\s*\(\*\)\s*$/, "")
        .replace(/\s*(?:\*\s*){2,}\*?\s*$/, "") // "*** " di ujung paragraf
        .replace(/\s*[-–—=•●▪]{2,}\s*$/, "")
        .trim(),
    )
    .filter(Boolean)
    .join("\n")
    .replace(/\n{2,}/g, "\n")
    .trim();

  // 4) Jaring pengaman: kalau label glosarium ("Keterangan:"/"Catatan:") masih
  //    tersisa (mis. lini glosarium "Term: def" tanpa nomor yang tak ter-pop),
  //    potong dari label itu ke bawah. Hanya di bagian ekor teks.
  const ket = content.search(/(?:^|\n)\s*(keterangan|catatan(\s+kaki)?|glosarium)\s*:/i);
  if (ket > content.length * 0.6) {
    content = content.slice(0, ket).trim();
    cutFootnote = true;
  }
  if (cutFootnote) flags.push("catatan-kaki-dipotong");

  // Flag: bio mungkin masih nyangkut (penanda lemah tanpa nama, tak terbuang).
  if (removedBio === 0 && scenes.length) {
    const lastPara = scenes[scenes.length - 1];
    if (lastPara.length < 320 && BIO_WEAK.test(lastPara)) flags.push("cek-bio-ekor");
  }

  return { content, author, flags };
}

function makeSummary(content) {
  const flat = collapse(content.replace(/\n/g, " "));
  const parts = flat.split(/(?<=[.!?"”])\s+/);
  let s = "";
  for (const p of parts) {
    if ((s + " " + p).trim().length > 180) break;
    s = (s + " " + p).trim();
    if (s.length >= 100) break;
  }
  if (!s) s = flat.slice(0, 180);
  if (s.length > 180) {
    const t = s.slice(0, 180);
    const sp = t.lastIndexOf(" ");
    s = (sp > 100 ? t.slice(0, sp) : t) + "...";
  }
  if (s.length < 20) s = flat.slice(0, 180);
  return s;
}

// ── Gambar ────────────────────────────────────────────────────────────────────
async function extractImages(buffer) {
  const imgs = [];
  try {
    await mammoth.convertToHtml(
      { buffer },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          try {
            const b64 = await image.read("base64");
            const data = Buffer.from(b64, "base64");
            imgs.push({ data, contentType: image.contentType || "image/png", size: data.length });
          } catch {
            /* skip gambar rusak */
          }
          return { src: "" };
        }),
      },
    );
  } catch {
    /* dokumen tanpa gambar / gagal konversi html */
  }
  imgs.sort((a, b) => b.size - a.size);
  return imgs;
}

function extFor(contentType) {
  if (/png/i.test(contentType)) return "png";
  if (/webp/i.test(contentType)) return "webp";
  if (/gif/i.test(contentType)) return "gif";
  if (/jpe?g/i.test(contentType)) return "jpg";
  return "jpg";
}

async function uploadToImageKit(img, baseName) {
  if (!IK_PUBLIC || !IK_PRIVATE) throw new Error("IMAGEKIT_* belum diset di .env");
  const token = crypto.randomUUID();
  const expire = String(Math.floor(Date.now() / 1000) + 1800);
  const signature = crypto
    .createHmac("sha1", IK_PRIVATE)
    .update(token + expire)
    .digest("hex");
  const ext = extFor(img.contentType);
  const fd = new FormData();
  fd.append("file", new Blob([img.data], { type: img.contentType }), `${baseName}.${ext}`);
  fd.append("publicKey", IK_PUBLIC);
  fd.append("token", token);
  fd.append("expire", expire);
  fd.append("signature", signature);
  fd.append("fileName", `${slugify(baseName) || "cover"}.${ext}`);
  fd.append("folder", "/kritisa/covers");
  fd.append("useUniqueFileName", "true");
  const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new Error(`ImageKit ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  if (!data.url) throw new Error("ImageKit tidak mengembalikan url");
  return data.url;
}

// ── DB ────────────────────────────────────────────────────────────────────────
const mediaCache = new Map();
const batchSlugs = new Set();

async function ensureMedia(pool, name) {
  if (mediaCache.has(name)) return mediaCache.get(name);
  const sel = await pool.query(
    "SELECT id FROM media_sources WHERE lower(name) = lower($1) LIMIT 1",
    [name],
  );
  if (sel.rows[0]) {
    mediaCache.set(name, sel.rows[0].id);
    return sel.rows[0].id;
  }
  if (!COMMIT) return null; // dry-run: jangan buat media
  const id = makeId("media");
  let slug = slugify(name) || "media";
  let i = 2;
  while ((await pool.query("SELECT 1 FROM media_sources WHERE slug=$1", [slug])).rowCount) {
    slug = `${slugify(name)}-${i++}`;
  }
  const now = nowIso();
  await pool.query(
    "INSERT INTO media_sources (id,name,slug,website_url,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6)",
    [id, name, slug, "", now, now],
  );
  mediaCache.set(name, id);
  console.log(`  + media dibuat: ${name}`);
  return id;
}

async function storyExists(pool, title, mediaId) {
  if (!mediaId) return false;
  const r = await pool.query(
    "SELECT 1 FROM stories WHERE lower(title)=lower($1) AND media_source_id=$2 LIMIT 1",
    [title, mediaId],
  );
  return r.rowCount > 0;
}

async function uniqueStorySlug(pool, base, dbAvailable) {
  base = base || "cerpen";
  let cand = base;
  let i = 2;
  while (true) {
    if (!batchSlugs.has(cand)) {
      let taken = false;
      if (dbAvailable) {
        const r = await pool.query("SELECT 1 FROM stories WHERE slug=$1 LIMIT 1", [cand]);
        taken = r.rowCount > 0;
      }
      if (!taken) {
        batchSlugs.add(cand);
        return cand;
      }
    }
    cand = `${base}-${i++}`;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
function listDocx(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const folder of fs.readdirSync(dir)) {
    const full = path.join(dir, folder);
    if (!fs.statSync(full).isDirectory()) continue;
    const canon = MEDIA_CANON[folder.toUpperCase()] || toTitleCaseIfCaps(folder);
    const files = fs
      .readdirSync(full)
      // `\.\s*docx$`, bukan `\.docx$`: sebagian nama file punya spasi sebelum
      // ekstensi (mis. "... Tanah Perawan. docx") dan akan terlewat diam-diam.
      .filter((f) => /\.\s*docx$/i.test(f) && !f.startsWith("~$"))
      .sort()
      .slice(0, LIMIT);
    for (const f of files) out.push({ media: canon, folder, file: f, fullPath: path.join(full, f) });
  }
  return out;
}

function csvEscape(v) {
  const t = String(v ?? "");
  return /[",\n\r]/.test(t) ? `"${t.replaceAll('"', '""')}"` : t;
}

async function main() {
  const srcAbs = path.isAbsolute(SRC_DIR) ? SRC_DIR : path.join(ROOT, SRC_DIR);
  console.log(`\nMode      : ${COMMIT ? "COMMIT (tulis DB + upload gambar)" : "DRY-RUN (tanpa tulis)"}`);
  console.log(`Folder    : ${srcAbs}`);
  if (LIMIT !== Infinity) console.log(`Limit     : ${LIMIT} file/media`);

  const items = listDocx(srcAbs);
  console.log(`Ditemukan : ${items.length} file .docx\n`);
  if (!items.length) {
    console.log("Tidak ada file. Cek --dir.");
    return;
  }

  // Koneksi DB (commit: wajib; dry-run: opsional untuk deteksi duplikat/slug).
  let pool = null;
  let dbAvailable = false;
  if (DATABASE_URL) {
    try {
      pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 4 });
      await pool.query("SELECT 1");
      dbAvailable = true;
    } catch (e) {
      if (COMMIT) throw new Error(`Gagal konek DB: ${e.message}`);
      console.log(`(Peringatan) DB tidak terhubung, dry-run lanjut tanpa cek duplikat: ${e.message}\n`);
    }
  } else if (COMMIT) {
    throw new Error("DATABASE_URL tidak ada di .env");
  }

  const report = [];
  let ok = 0, flag = 0, skip = 0, err = 0;

  for (const it of items) {
    const rec = { file: it.file, media: it.media, title: "", date: "", author: "", len: 0, img: "", status: "", notes: "" };
    try {
      const buffer = fs.readFileSync(it.fullPath);
      const { value: rawText } = await mammoth.extractRawText({ buffer });
      const header = rawText.split(/\r?\n/).slice(0, 8).join("\n");

      // Metadata
      let title = parseTitleFromFile(it.file, it.media);
      if (title.length < 3) {
        // fallback: judul kapital di header
        const capsLine = rawText.split(/\r?\n/).map((l) => l.trim()).find((l) => isCapsTitle(l) && l.length > 3);
        if (capsLine) title = toTitleCaseIfCaps(capsLine);
      }
      const d = parseDate(header) || parseNumericDate(it.file) || { publishedAt: "", publicationMonth: "", flagged: false };
      const sourceUrl = (rawText.match(/https?:\/\/\S+/) || [""])[0].replace(/[)\].,]+$/, "");

      const { content, author, flags } = cleanContent(rawText, title);
      const summary = makeSummary(content);

      if (DEBUG) {
        console.log(`\n──── ${it.media} · ${title} ────`);
        console.log(`  penulis : ${author || "(kosong)"}`);
        console.log(`  tanggal : ${d.publishedAt || d.publicationMonth || "(kosong)"} | url: ${sourceUrl || "-"}`);
        console.log(`  ringkas : ${summary}`);
        console.log(`  KEPALA  : ${content.slice(0, 200).replace(/\n/g, "⏎")}`);
        console.log(`  EKOR    : ${content.slice(-200).replace(/\n/g, "⏎")}`);
        console.log(`  panjang : ${content.length} char, ${content.split("\n").length} paragraf\n`);
      }

      // Gambar
      const imgs = await extractImages(buffer);
      const cover = imgs[0] && imgs[0].size >= IMG_MIN_BYTES ? imgs[0] : null;

      rec.title = title;
      rec.date = d.publishedAt || d.publicationMonth || "";
      rec.author = author;
      rec.len = content.length;
      rec.img = cover ? `${(cover.size / 1024).toFixed(0)}KB ${cover.contentType}` : "-";

      // Lewati file yang jelas BUKAN cerpen (dokumen pribadi/template yang nyasar):
      // URL bukan dari domain media, TANPA penulis, dan TANPA tanggal.
      const isMediaUrl =
        /(jawapos\.com|kompas\.(id|com)|tempo\.co|republika\.(id|co\.id)|mediaindonesia\.com)/i.test(
          sourceUrl,
        );
      if (!isMediaUrl && !author && !d.publishedAt && !d.publicationMonth) {
        rec.status = "SKIP";
        rec.notes = "bukan-cerpen (tanpa url media/penulis/tanggal)";
        skip++;
        report.push(rec);
        console.log(`SKIP  ${it.media} · ${title || it.file} (bukan cerpen)`);
        continue;
      }

      const localFlags = [...flags];
      if (!title || title.length < 3) localFlags.push("judul-invalid");
      if (!d.publishedAt && !d.publicationMonth) localFlags.push("tanpa-tanggal");
      if (d.flagged) localFlags.push("tanggal-typo");
      if (!author) localFlags.push("tanpa-penulis");
      if (content.length < 80) localFlags.push("isi-terlalu-pendek");
      if (content.length > 20000) localFlags.push("isi-terlalu-panjang");
      if (!cover) localFlags.push("tanpa-gambar");
      if (summary.length < 20) localFlags.push("ringkasan-pendek");

      // Blokir hanya kalau data inti tak valid. Isi panjang (>20000) TIDAK
      // diblokir: kolom DB `text` tak berbatas; hanya form edit yang membatasi.
      const blocking = localFlags.some((f) =>
        ["judul-invalid", "isi-terlalu-pendek", "ringkasan-pendek"].includes(f),
      );

      const mediaId = pool ? await ensureMedia(pool, it.media) : null;

      if (dbAvailable && mediaId && (await storyExists(pool, title, mediaId))) {
        rec.status = "SKIP";
        rec.notes = "sudah ada di DB";
        skip++;
        report.push(rec);
        console.log(`SKIP  ${it.media} · ${title} (sudah ada)`);
        continue;
      }

      if (blocking) {
        rec.status = "FLAG";
        rec.notes = localFlags.join(";");
        flag++;
        report.push(rec);
        console.log(`FLAG  ${it.media} · ${title || "(judul?)"} [${localFlags.join(",")}]`);
        continue; // jangan insert data yang gagal validasi
      }

      if (COMMIT) {
        let coverUrl = "";
        if (cover) {
          try {
            coverUrl = await uploadToImageKit(cover, `${it.media}-${slugify(title)}`);
          } catch (e) {
            localFlags.push("upload-gambar-gagal");
            console.log(`  ! gambar gagal upload: ${e.message}`);
          }
        }
        const slug = await uniqueStorySlug(pool, slugify(title), dbAvailable);
        const finalPublishedAt = d.publishedAt || (d.publicationMonth ? `${d.publicationMonth}-01` : "");
        const id = makeId("story");
        const now = nowIso();
        await pool.query(
          `INSERT INTO stories
             (id,title,slug,author,media_source_id,published_at,publication_month,source_url,cover_image_url,summary,content,status,created_at,updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
          [id, title, slug, author, mediaId, finalPublishedAt, d.publicationMonth, sourceUrl, coverUrl, summary, content, "published", now, now],
        );
        rec.status = localFlags.length ? "OK*" : "OK";
        rec.notes = localFlags.join(";");
        rec.img = coverUrl ? "uploaded" : rec.img;
      } else {
        rec.status = localFlags.length ? "OK*" : "OK";
        rec.notes = localFlags.join(";");
      }
      if (localFlags.length) flag++; else ok++;
      report.push(rec);
      console.log(`${rec.status.padEnd(5)} ${it.media} · ${title}${localFlags.length ? " [" + localFlags.join(",") + "]" : ""}`);
    } catch (e) {
      rec.status = "ERROR";
      rec.notes = e.message;
      err++;
      report.push(rec);
      console.log(`ERROR ${it.file}: ${e.message}`);
    }
  }

  if (pool) await pool.end();

  // Laporan CSV
  const outDir = OUT_DIR;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const csvPath = path.join(outDir, `import-cerpen-report-${COMMIT ? "commit" : "dryrun"}-${stamp}.csv`);
  const head = "status,media,title,date,author,content_len,image,notes,file";
  const rows = report.map((r) =>
    [r.status, r.media, r.title, r.date, r.author, r.len, r.img, r.notes, r.file].map(csvEscape).join(","),
  );
  fs.writeFileSync(csvPath, [head, ...rows].join("\n"), "utf8");

  console.log(`\n──────── RINGKASAN ────────`);
  console.log(`OK (bersih)      : ${ok}`);
  console.log(`OK* / FLAG       : ${flag}  (masuk tapi perlu dicek, atau diblokir)`);
  console.log(`SKIP (duplikat)  : ${skip}`);
  console.log(`ERROR            : ${err}`);
  console.log(`Total            : ${report.length}`);
  console.log(`Laporan CSV      : ${csvPath}`);
  if (!COMMIT) console.log(`\nIni DRY-RUN. Jalankan ulang dengan --commit untuk benar-benar import.`);
}

main().catch((e) => {
  console.error("\nGAGAL:", e.message);
  process.exit(1);
});
