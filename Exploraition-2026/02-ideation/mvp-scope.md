# 🎯 MVP Scope & Batasan Pengembangan

> Membatasi cakupan prototipe agar realistis diselesaikan dalam 2 hari hackathon dengan dampak demo maksimal.

---

## 🏆 3 Fitur Inti MVP (Core Hackathon Prototype)

Maksimal 3 fitur yang wajib berfungsi mulus saat demo di depan dewan juri:

1. **Fitur 1: [Nama Fitur Utama 1]**
   - **Deskripsi:** [e.g., AI Smart Skill Gap & Resume Analyzer]
   - **Fungsi:** Menganalisis dokumen pengguna dan mencocokkan dengan kualifikasi pekerjaan target, mengeluarkan skor kecocokan dan rekomendasi perbaikan instan.
   - **Alasan Wajib:** Memberikan *wow-factor* pertama dan membuktikan nilai guna AI langsung.

2. **Fitur 2: [Nama Fitur Utama 2]**
   - **Deskripsi:** [e.g., Personalized Career Path & Actionable Upskilling Plan]
   - **Fungsi:** Memberikan kurikulum mikro dan langkah taktis untuk menutup kekurangan skill dalam hitungan minggu.
   - **Alasan Wajib:** Menyelesaikan masalah setelah gap ditemukan (actionable step).

3. **Fitur 3: [Nama Fitur Utama 3]**
   - **Deskripsi:** [e.g., Interactive AI Mock Interviewer / Pitch Assistant]
   - **Fungsi:** Simulasi tanya-jawab interaktif dengan AI yang memberikan evaluasi instan atas jawaban kandidat.
   - **Alasan Wajib:** Sangat menarik didemonstrasikan secara live di panggung presentasi.

---

## 🟢 Fitur Wajib (Must-Have Checklist)
- [ ] Formulir input data pengguna (resume / job title target)
- [ ] Engine pemrosesan AI (prompt teruji & respons cepat)
- [ ] Tampilan antarmuka (dashboard / hasil) yang responsif dan rapi
- [ ] Handling state loading dan error sederhana yang elegan

---

## 🔴 Fitur Dibuang / Out-of-Scope (Won't-Have untuk Hackathon)
Fitur-fitur ini **sengaja tidak dibuat** selama 2 hari hackathon demi menghindari kegagalan demo:
- ❌ **Sistem Otentikasi Lengkap (Auth0 / Social Login kompleks):** Cukup gunakan mock user atau guest session.
- ❌ **Integrasi Payment Gateway:** Ditampilkan sebagai roadmap masa depan di slide deck.
- ❌ **Sistem Messaging / Realtime Chat Recruiter-Talent:** Cukup simulasikan alur notifikasi.
- ❌ **Database Relasional Kompleks & Multi-tenant:** Cukup simpan di state lokal / Supabase sederhana / mock JSON.
- ❌ **Integrasi Kalender Eksternal:** Tidak esensial untuk membuktikan konsep utama.
