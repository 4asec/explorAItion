# SPESIFIKASI PERSYARATAN & ARSITEKTUR SISTEM: APLIKASI ANGKASA
**Proyek:** Explor[AI]tion Hackathon — Career & Opportunity Intelligence Platform  
**Status:** Dokumen Acuan Wajib Agen AI & Tim Pengembang (Single Source of Truth)  
**Terakhir Diperbarui:** November 2026

---

## 1. Ringkasan Produk (Framework PACT)

### 1.1 Problem (Latar Belakang Masalah)
Fragmentasi informasi kompetisi (lomba), beasiswa, dan seminar untuk pelajar dan mahasiswa di Indonesia tersebar sporadis di media sosial (Instagram, Telegram, LinkedIn, WhatsApp). Hal ini menimbulkan:
1. **Information Overload & Ketiadaan Kurasi:** Mahasiswa kewalahan membedakan peluang kredibel vs penipuan atau peluang kedaluwarsa.
2. **Ketiadaan Personalisasi:** Informasi tidak disesuaikan dengan kompetensi teknis (*skills*), minat (*interests*), maupun potensi unik (*talents*).
3. **Kebingungan Eksekusi:** Tidak tersedianya panduan persiapan bertahap (*roadmap*) menuju batas waktu pendaftaran.
4. **Hambatan Matchmaking Tim:** Mahasiswa sering gagal berpartisipasi dalam ajang beregu karena sulit menemukan rekan dengan keahlian komplementer (Hacker, Hipster, Hustler).

### 1.2 Actor (Pengguna Sistem)
1. **Pelajar / Mahasiswa (Primary User):** 
   - Menjelajahi peluang terverifikasi.
   - Mendapatkan skor relevansi dan alasan personalisasi dari AI.
   - Menghasilkan panduan persiapan (*AI Preparation Roadmap*).
   - Membentuk atau melamar tim kolaborasi tanpa risiko duplikasi.
2. **Kurator Internal (Developer / Admin):**
   - Memverifikasi keabsahan data peluang (`is_verified = true`) langsung via Supabase Dashboard.

### 1.3 Capability (Fitur Utama P1 – P8)
| ID | Fitur | Deskripsi Fungsional & Aturan Teknis |
| :--- | :--- | :--- |
| **P1** | **Login & Register** | • **Login:** Autentikasi menggunakan Email dan Password.<br>• **Register:** Mengumpulkan Nama Lengkap, Email, Password, Username, Institusi, Tanggal Lahir, Jenjang Pendidikan, Asal Provinsi, dan Asal Kota.<br>• **Fitur Demo:** Tombol **1-Klik Akun Demo** untuk pengujian instan oleh juri tanpa registrasi manual. |
| **P2** | **Profiling** | Input data kualitatif pengguna mencakup keahlian (`skills`: string[]), minat (`interests`: string[]), dan potensi/bakat (`talents`: string) sebelum dialihkan ke halaman Feed. |
| **P3** | **AI Personalized Feed** | Mengonsumsi endpoint `POST /api/feed` (Google GenAI Gemini). Menampilkan kartu peluang yang diurutkan menurun berdasarkan skor kecocokan (`matchPercentage` 0–100%), tepat 1 kalimat alasan rekomendasi personal berbahasa Indonesia, serta lencana `Verified`. |
| **P4** | **Katalog & Detail Informasi** | Menampilkan informasi lengkap peluang: judul, kategori (`Lomba`, `Beasiswa`, `Seminar`), penyelenggara, tenggat waktu (kolom `caption`), deskripsi mendalam (kolom `description_roadmap`), daftar syarat, dan tautan resmi (`registration_url`). |
| **P5** | **AI Preparation Roadmap** | Mengonsumsi endpoint `POST /api/roadmap` (Gemini AI). Menghasilkan 3 komponen taktis: checklist berkas (`document_checklist`), strategi kelolosan 3 poin (`winning_strategy`), dan lini masa bertahap (`timeline`) hingga tenggat waktu. |
| **P6** | **Team Finding Anti-Duplikasi** | Mengonsumsi endpoint `GET /api/team` dan `POST /api/team`. Memungkinkan inisiasi tim baru (`action: 'create'`) atau pengiriman ajakan kolaborasi (`action: 'invite'`) dengan pencegahan duplikasi pada kompetisi yang sama (Error 409). |
| **P7** | **Bookmark** | Menyimpan dan mencabut peluang favorit ke daftar simpan pribadi pada tabel `bookmarks`. |
| **P8** | **Logout** | Mengakhiri sesi aktif pengguna dan mengembalikan status tampilan ke Landing View. |

### 1.4 Target MVP vs Di Luar Cakupan
- **Target MVP (In-Scope):**
  - 100% peluang yang tampil berstatus terverifikasi (`is_verified = true`).
  - Rekomendasi terpersonalisasi secara instan dengan proteksi fallback offline.
  - Roadmap persiapan otomatis dan interaktif.
  - Validasi ketat anti-duplikasi pada ajakan kolaborasi tim.
  - Siap dideploy dan live stabil di platform Vercel.
- **Di Luar Cakupan MVP (Out-of-Scope):**
  - Admin Dashboard CMS terpisah (kurasi langsung dari Supabase Table Editor).
  - Halaman pelaporan keluhan / Report Page.
  - Halaman pencarian terpisah dengan query kompleks (cukup filter kategori di Feed).
  - Halaman edit profil pengguna multi-tab yang rumit.
  - Push notification / Notification Page terpisah.

---

## 2. Skema Database Supabase & Kontrak Data

### 2.1 Struktur Tabel Database Supabase
Semua tabel berada pada schema `public` di Supabase.

#### A. Tabel `profiles`
Menyimpan identitas lengkap dan atribut kompetensi mahasiswa.
- `id` (uuid, Primary Key, references `auth.users.id` on delete cascade)
- `full_name` (text, not null)
- `email` (text, unique, not null)
- `username` (text, unique, not null)
- `institution` (text, not null)
- `birth_date` (date, not null)
- `education_level` (text, not null)
- `province` (text, not null)
- `city` (text, not null)
- `skills` (text[], default '{}')
- `interests` (text[], default '{}')
- `talents` (text, default '')
- `created_at` (timestamptz, default now())

#### B. Tabel `opportunities`
> **PERINGATAN PENTING ARSITEKTUR:**  
> Sesuai kontrak database Supabase yang aktif, kolom tenggat waktu dinamakan **`caption`** dan kolom deskripsi utama dinamakan **`description_roadmap`**.
- `id` (text / uuid, Primary Key)
- `title` (text, not null)
- `category` (text, not null — nilai: `'Lomba' | 'Beasiswa' | 'Seminar'`)
- `organizer` (text, not null)
- `caption` (text / timestamptz, not null) — *Mewakili tanggal deadline/tenggat waktu informasi*
- `description_roadmap` (text, not null) — *Mewakili deskripsi rinci dan panduan awal peluang*
- `requirements` (text[], default '{}')
- `required_skills` (text[], default '{}')
- `registration_url` (text, not null)
- `is_verified` (boolean, default false, not null)
- `created_at` (timestamptz, default now())

#### C. Tabel `bookmarks`
Menyimpan riwayat penyimpanan peluang oleh pengguna.
- `id` (uuid, Primary Key, default gen_random_uuid())
- `user_id` (uuid, not null, references `profiles.id` on delete cascade)
- `opportunity_id` (text / uuid, not null, references `opportunities.id` on delete cascade)
- `created_at` (timestamptz, default now())
- *Constraint:* Unique `(user_id, opportunity_id)`

#### D. Tabel `roadmaps`
Menyimpan riwayat roadmap persiapan yang dihasilkan AI untuk tiap pengguna.
- `id` (uuid, Primary Key, default gen_random_uuid())
- `user_id` (uuid, not null, references `profiles.id`)
- `opportunity_id` (text / uuid, not null, references `opportunities.id`)
- `document_checklist` (jsonb, not null)
- `winning_strategy` (text[] / jsonb, not null)
- `timeline` (jsonb, not null)
- `created_at` (timestamptz, default now())

#### E. Tabel `team_requests`
Pendaftaran lowongan atau pembentukan tim untuk ajang tertentu.
- `id` (text / uuid, Primary Key)
- `opportunity_id` (text / uuid, not null, references `opportunities.id`)
- `creator_id` (uuid / text, not null)
- `creator_name` (text, not null)
- `team_name` (text, not null)
- `role_needed` (text, not null)
- `created_at` (timestamptz, default now())

#### F. Tabel `team_invites`
Permintaan bergabung atau ajakan kolaborasi antarpengguna pada tim tertentu.
- `id` (text / uuid, Primary Key)
- `team_request_id` (text / uuid, not null, references `team_requests.id` on delete cascade)
- `opportunity_id` (text / uuid, not null)
- `applicant_id` (uuid / text, not null)
- `applicant_name` (text, not null)
- `role_applied` (text, not null)
- `message` (text, default '')
- `status` (text, default 'pending' — nilai: `'pending' | 'accepted' | 'rejected'`)
- `created_at` (timestamptz, default now())
- *Constraint Anti-Duplikasi:* Unique `(applicant_id, team_request_id)` (Kode Postgres: `23505`)

---

### 2.2 Ringkasan Endpoint Server API (Next.js App Router)

| Method | Endpoint | Fungsi | Payload Utama / Query | Respon Sukses |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/feed` | Menghitung kecocokan AI dan mengurutkan peluang | `{ userProfile, opportunities? }` | `PersonalizedOpportunity[]` |
| **POST** | `/api/roadmap` | Menghasilkan panduan persiapan bertahap | `{ userProfile, opportunity }` | `RoadmapResponse` |
| **GET** | `/api/team` | Mengambil tim yang terdaftar pada kompetisi | `?opportunityId=<id>` | `TeamRequest[]` |
| **POST** | `/api/team` | Membuat tim (`create`) atau mengajukan kolaborasi (`invite`) | `{ action: 'create' \| 'invite', ...payload }` | Status `201 Created` / `409 Conflict` |

---

## 3. Aturan Bisnis & Keamanan (RLS)

1. **Proteksi Autentikasi Halaman:**
   - Pengguna yang belum login/terautentikasi dilarang mengakses tampilan Feed, Roadmap Generator, maupun fitur Team Finding. Sistem wajib menahannya di Landing View atau Auth View.
2. **Kewajiban Pengisian Profil Minat & Bakat:**
   - Endpoint `/api/feed` mewajibkan profil pengguna memiliki minimal 1 keahlian (`skills`) atau minat (`interests`). Jika kosong, sistem merespon status `400 Bad Request`:
     > *"Silakan lengkapi profil minat dan bakat terlebih dahulu sebelum melihat rekomendasi AI."*
3. **Integritas Kurasi Peluang:**
   - Hanya peluang dengan atribut `is_verified = true` yang boleh disajikan ke pengguna. Peluang yang belum diverifikasi disembunyikan secara otomatis.
4. **Pencegahan Duplikasi Ajakan Tim (Anti-Duplication Constraint):**
   - Seorang pengguna dilarang mengirimkan permintaan kolaborasi lebih dari 1 kali pada tim yang sama untuk peluang yang sama.
   - Database menolak via kode error `23505` dan endpoint `/api/team` mengembalikan status `409 Conflict` dengan pesan:
     > *"Anda sudah mengirimkan permintaan kolaborasi ke tim ini pada kompetisi yang sama."*
5. **Penanganan Error Elegan & Zero Crash:**
   - Seluruh error API wajib disajikan dalam Bahasa Indonesia yang santun dan jelas.
   - Jika koneksi API AI Gemini mengalami *rate limit* atau gangguan jaringan, sistem wajib mengaktifkan fallback lokal secara transparan tanpa menampilkan halaman crash ke pengguna.

---

## 4. Standar Desain UI/UX (Wajib Dipatuhi Frontend)

### 4.1 Responsivitas & Tata Letak
- Menganut prinsip **Mobile-First**: Tampilan harus nyaman dibaca pada layar smartphone (lebar 360px–420px) dan proporsional saat dibuka di layar tablet maupun desktop monitor.
- Navigasi tetap simpel, intuitif, dan tidak menumpuk modal yang membingungkan.

### 4.2 Larangan Penggunaan Emoji
- **DILARANG MENGGUNAKAN EMOJI** sebagai ikon representasi UI (misal: 🚀, 💡, 🔥, dsb).
- **WAJIB** menggunakan pustaka resmi **`lucide-react`** (seperti `<CheckCircle2 />`, `<Sparkles />`, `<Users />`, `<Calendar />`, `<ArrowRight />`, `<Bookmark />`).

### 4.3 Proporsi Pewarnaan 60-30-10
Desain antarmuka wajib menerapkan proporsi warna estetis:
- **60% Primary (Warna Dominan / Kanvas):**  
  Nuansa gelap modern (`bg-slate-950`, latar belakang utama, `text-slate-100`).
- **30% Secondary (Permukaan Kartu & Elemen Penunjang):**  
  Nuansa kontainer netral (`bg-slate-900`, `border-slate-800`, `text-slate-300`, `text-slate-400`).
- **10% Tertiary (Aksen Kontras Penarik Perhatian):**  
  Nuansa Emerald cerah (`text-emerald-400`, `bg-emerald-500`, `hover:bg-emerald-400`, `border-emerald-500`) khusus untuk tombol CTA, skor kecocokan AI, dan lencana penting.

### 4.4 Ciri Khas Visual & Komponen
- Sudut membulat modern (`rounded-2xl` pada kartu dan kontainer utama).
- *Whitespace* yang lega antar-seksi agar konten tidak terasa sesak.
- Kartu peluang memuat:
  - Lencana kategori (`Lomba`, `Beasiswa`, `Seminar`).
  - Lencana **Verified** dengan ikon centang terkurasi.
  - Indikator persentase kecocokan AI (`matchPercentage%`).
  - Tepat 1 kalimat alasan rekomendasi personal di bawah skor.
- Tampilan status pemrosesan (*loading skeleton* atau spinner halus) saat AI sedang memproses rekomendasi atau roadmap.

---

## 5. Pembagian Wilayah File Tim (Anti-Konflik Git)

Untuk mencegah konflik merge antar-agen AI dan anggota tim pada sesi pengerjaan hackathon, wilayah kerja dibagi secara tegas:

```
src/
├── app/
│   ├── api/             --> [RAFFA] Endpoint Server (feed, roadmap, team, analyze)
│   ├── globals.css      --> [IQBAL] Styling Tailwind, tokens & font imports
│   ├── layout.tsx       --> [IQBAL] Root layout & metadata
│   └── page.tsx         --> [RAFFA] Orkestrasi state & perakitan akhir komponen
├── components/
│   ├── LandingView.tsx  --> [IQBAL] Halaman awal pengenalan & hero section
│   ├── AuthView.tsx     --> [IQBAL] Form login, register & tombol 1-klik akun demo
│   ├── ProfilingView.tsx--> [IQBAL] Wizard input skills, interests & talents
│   ├── FeedDashboard.tsx--> [ALDO]  Daftar kartu peluang personalisasi AI & filter
│   └── OpportunityDetail.tsx --> [ALDO] Detail peluang, AI roadmap & team finding
├── lib/                 --> [RAFFA] supabaseClient.ts, mockData.ts
└── types/
    └── schema.ts        --> [RAFFA] Single source of truth interface TypeScript
```

### Tanggung Jawab Anggota Tim:
1. **Raffa (Hacker - AI & Backend):**
   - Menguasai `src/app/api/**`, `src/lib/**`, `src/types/schema.ts`.
   - Mengintegrasikan state global dan merakit alur navigasi utama pada `src/app/page.tsx`.
2. **Iqbal (Hipster - UI/UX & Frontend):**
   - Menguasai `src/app/globals.css`.
   - Mengembangkan komponen antarmuka awal: `LandingView.tsx`, `AuthView.tsx`, dan `ProfilingView.tsx`.
3. **Aldo / Revaldo (Hustler - Product Experience & Frontend):**
   - Mengembangkan komponen penampil konten inti: `FeedDashboard.tsx` dan `OpportunityDetail.tsx`.
   - Menjaga keselarasan presentasi informasi dan narasi solusi produk.

### Aturan Kolaborasi Lintas File:
- Jangan pernah mengedit file milik anggota tim lain tanpa persetujuan eksplisit.
- Perubahan tipe data wajib dilakukan oleh Raffa di `src/types/schema.ts` terlebih dahulu sebelum dikonsumsi oleh komponen frontend milik Iqbal dan Aldo.
- Pastikan seluruh kode lolos kompilasi lokal (`npx tsc --noEmit` dan `npm run build`) sebelum menggabungkan cabang ke `main`.
