import { Pool } from "pg";
import { hash } from "bcryptjs";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");

  const pool = new Pool({ connectionString: url, max: 1 });

  console.log("Dropping old tables...");
  await pool.query(`
    DROP TABLE IF EXISTS ai_messages CASCADE;
    DROP TABLE IF EXISTS ai_conversations CASCADE;
    DROP TABLE IF EXISTS reflections CASCADE;
    DROP TABLE IF EXISTS annotations CASCADE;
    DROP TABLE IF EXISTS reading_sessions CASCADE;
    DROP TABLE IF EXISTS stories CASCADE;
    DROP TABLE IF EXISTS students CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS media_sources CASCADE;
  `);

  console.log("Creating new tables...");
  await pool.query(`
    CREATE TABLE media_sources (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
      website_url TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE users (
      id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'mahasiswa',
      program_study TEXT NOT NULL DEFAULT '', university TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE stories (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
      author TEXT NOT NULL DEFAULT '', media_source_id TEXT NOT NULL REFERENCES media_sources(id),
      published_at TEXT NOT NULL DEFAULT '', publication_month TEXT NOT NULL,
      source_url TEXT NOT NULL DEFAULT '', cover_image_url TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '', content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE reading_sessions (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
      story_id TEXT NOT NULL REFERENCES stories(id),
      started_at TEXT NOT NULL DEFAULT '', completed_at TEXT NOT NULL DEFAULT '',
      last_step TEXT NOT NULL DEFAULT 'reading', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE annotations (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
      story_id TEXT NOT NULL REFERENCES stories(id),
      reading_session_id TEXT NOT NULL REFERENCES reading_sessions(id),
      quote_text TEXT NOT NULL, critique_text TEXT NOT NULL,
      perspective TEXT NOT NULL DEFAULT 'general', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE reflections (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
      story_id TEXT NOT NULL REFERENCES stories(id),
      reading_session_id TEXT NOT NULL REFERENCES reading_sessions(id),
      prompt_text TEXT NOT NULL, answer_text TEXT NOT NULL,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE ai_conversations (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
      story_id TEXT NOT NULL REFERENCES stories(id),
      reading_session_id TEXT NOT NULL REFERENCES reading_sessions(id),
      annotation_id TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE ai_messages (
      id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES ai_conversations(id),
      role TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL
    );
  `);

  console.log("Seeding data...");
  const now = new Date().toISOString();
  const dosenHash = await hash("kritisa123", 10);
  const mhsHash = await hash("kritisa123", 10);

  await pool.query(`
    INSERT INTO media_sources (id, name, slug, website_url, created_at, updated_at) VALUES
      ('media_1', 'Kompas', 'kompas', 'https://www.kompas.id', '${now}', '${now}'),
      ('media_2', 'Tempo', 'tempo', 'https://www.tempo.co', '${now}', '${now}'),
      ('media_3', 'Media Indonesia', 'media-indonesia', 'https://mediaindonesia.com', '${now}', '${now}');

    INSERT INTO users (id, email, name, password_hash, role, program_study, university, created_at, updated_at) VALUES
      ('user_dosen_01', 'dosen@kritisa.com', 'Dosen Pengampu', '${dosenHash}', 'dosen', '', '', '${now}', '${now}'),
      ('user_mhs_01', 'mahasiswa@kritisa.com', 'Mahasiswa Contoh', '${mhsHash}', 'mahasiswa', 'Sastra Indonesia', 'Universitas Indonesia', '${now}', '${now}');

    INSERT INTO stories (id, title, slug, author, media_source_id, published_at, publication_month, source_url, cover_image_url, summary, content, status, created_at, updated_at) VALUES
      ('story_1', 'Senja di Halte Tua', 'senja-di-halte-tua', 'Penulis Contoh', 'media_1', '2026-08-04', '2026-08', 'https://example.com/senja-di-halte-tua', '',
       'Cerpen contoh tentang seorang mahasiswa yang mengamati perubahan kota dari halte tua.',
       'Sore itu, halte tua di ujung jalan tampak lebih sunyi dari biasanya. Orang-orang datang dan pergi tanpa saling menatap, seolah setiap wajah hanya menjadi bayangan singkat di kaca yang mulai buram. Di antara deru kendaraan, seorang mahasiswa duduk memegang buku catatan kecil. Ia menulis tentang kota yang terus tumbuh, tetapi perlahan kehilangan ruang untuk mengingat.\n\nLampu jalan menyala sebelum langit benar-benar gelap. Di kaca halte, wajahnya memantul bersama bayangan gedung-gedung baru yang menjulang. Ia teringat cerita ayahnya tentang lapangan kecil di belakang halte, tempat anak-anak pernah bermain sampai azan magrib. Kini lapangan itu sudah menjadi deretan toko yang selalu tutup terlalu cepat.\n\nSeorang perempuan tua datang membawa tas kain. Ia berdiri dekat papan jadwal yang hurufnya sudah pudar, lalu bertanya apakah bus ke pasar lama masih lewat. Mahasiswa itu tidak segera menjawab. Ia tahu rute itu sudah dihapus sejak jalan layang dibuka. Tetapi di mata perempuan itu, pasar lama tampak belum benar-benar hilang.',
       'published', '${now}', '${now}'),
      ('story_2', 'Bunyi Hujan di Atap Seng', 'bunyi-hujan-di-atap-seng', 'Penulis Contoh', 'media_2', '2026-08-12', '2026-08', 'https://example.com/bunyi-hujan-di-atap-seng', '',
       'Cerpen contoh tentang keluarga kecil yang menghadapi percakapan sulit saat hujan turun.',
       'Hujan turun sejak siang, memukul atap seng dengan bunyi yang tidak pernah benar-benar sama. Di ruang tengah, ibu melipat pakaian yang belum sepenuhnya kering. Anak sulungnya berdiri di dekat pintu, menatap halaman yang berubah menjadi genangan. Tidak ada yang segera bicara. Kadang-kadang, diam di rumah itu lebih keras daripada suara hujan.\n\nAyah belum pulang sejak pagi. Di meja, ada amplop cokelat dari kantor kecamatan, beberapa lembar tagihan, dan secangkir teh yang sudah dingin. Ibu tidak menyentuh amplop itu. Ia hanya melipat kemeja dengan gerakan yang sangat rapi, seolah ketertiban kecil bisa menahan kabar buruk agar tidak masuk ke rumah.\n\nAnak sulung itu akhirnya bertanya tentang sekolah adiknya. Ibu berhenti melipat, tetapi tidak menoleh. Dari luar, suara air jatuh dari talang terdengar seperti seseorang sedang menghitung mundur.',
       'published', '${now}', '${now}');
  `);

  console.log("✅ Migration complete!");
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
