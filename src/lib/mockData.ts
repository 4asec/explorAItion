import { Opportunity, UserProfile, TeamRequest } from "@/types/schema";

/**
 * 12 Peluang Terverifikasi sebagai Fallback Data
 * Jika koneksi Supabase terputus saat demo hackathon
 */
export const mockOpportunities: Opportunity[] = [
  {
    id: "opp-001",
    title: "GEMASTIK XIX 2026 — Divisi Pengembangan Perangkat Lunak",
    category: "Lomba",
    organizer: "Puspresnas Kemendikbudristek",
    deadline: "2026-12-15",
    description: "Kompetisi nasional teknologi informasi dan komunikasi bergengsi antarmahasiswa se-Indonesia untuk menciptakan solusi perangkat lunak inovatif berdampak sosial.",
    requirements: [
      "Mahasiswa aktif D3/D4/S1 perguruan tinggi di Indonesia",
      "Tim beranggotakan 3 orang dari perguruan tinggi yang sama",
      "Proposal solusi perangkat lunak dan video demonstrasi prototipe"
    ],
    required_skills: ["Next.js", "TypeScript", "System Design", "Git", "RESTful API"],
    registration_url: "https://gemastik.kemdikbud.go.id",
    is_verified: true,
  },
  {
    id: "opp-002",
    title: "Hackathon Polinema Explor[AI]tion 2026",
    category: "Lomba",
    organizer: "Himpunan Mahasiswa Teknologi Informasi Polinema",
    deadline: "2026-11-28",
    description: "Ajang adu inovasi teknologi berbasis Artificial Intelligence dan Full-stack web untuk memecahkan problem nyata mahasiswa dan perguruan tinggi vokasi.",
    requirements: [
      "Mahasiswa aktif diploma/sarjana seluruh Indonesia",
      "Maksimal 3 orang per tim (Hacker, Hipster, Hustler)",
      "MVP fungsional siap didemokan di hadapan juri industri"
    ],
    required_skills: ["GenAI Prompting", "React/Next.js", "Tailwind CSS", "Supabase", "Pitching"],
    registration_url: "https://hackathon.polinema.ac.id",
    is_verified: true,
  },
  {
    id: "opp-003",
    title: "Google Solution Challenge 2026",
    category: "Lomba",
    organizer: "Google Developer Groups on Campus",
    deadline: "2027-01-31",
    description: "Kompetisi global tahunan Google bagi mahasiswa untuk membangun solusi dari satu atau lebih dari 17 United Nations Sustainable Development Goals menggunakan teknologi Google.",
    requirements: [
      "Anggota GDSC / GDG on Campus di universitas terdaftar",
      "Maksimal 4 mahasiswa per tim",
      "Solusi memanfaatkan setidaknya satu teknologi Google (Gemini API, Firebase, GCP)"
    ],
    required_skills: ["Gemini API", "Cloud Architecture", "Mobile/Web Development", "SDGs Knowledge"],
    registration_url: "https://developers.google.com/community/gdsc-solution-challenge",
    is_verified: true,
  },
  {
    id: "opp-004",
    title: "Djarum Beasiswa Plus Angkatan 42",
    category: "Beasiswa",
    organizer: "Djarum Foundation",
    deadline: "2026-12-20",
    description: "Program beasiswa prestasi dengan pelatihan soft skills komprehensif (Character Building, Leadership Development, Nation Building) dan dana tunai bulanan selama 1 tahun.",
    requirements: [
      "Mahasiswa S1/D4 semester 4 di perguruan tinggi mitra",
      "IPK minimum 3.00 pada semester 3",
      "Aktif dalam organisasi kemahasiswaan atau kegiatan sosial"
    ],
    required_skills: ["Leadership", "Public Speaking", "Critical Thinking", "Teamwork"],
    registration_url: "https://djarumbeasiswaplus.org",
    is_verified: true,
  },
  {
    id: "opp-005",
    title: "Beasiswa Unggulan Kemendikbudristek 2026",
    category: "Beasiswa",
    organizer: "Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi",
    deadline: "2026-12-31",
    description: "Bantuan biaya pendidikan penuh bagi putra-putri berprestasi tingkat nasional maupun internasional untuk menempuh jenjang sarjana, magister, atau doktoral.",
    requirements: [
      "Warga Negara Indonesia dengan sertifikat prestasi minimal tingkat nasional",
      "Mendapat LoA Unconditional dari perguruan tinggi terakreditasi minimal B",
      "Surat rekomendasi dari akademisi atau instansi terkait"
    ],
    required_skills: ["Academic Writing", "Research Methodology", "Bahasa Inggris (TOEFL/IELTS)"],
    registration_url: "https://beasiswaunggulan.kemdikbud.go.id",
    is_verified: true,
  },
  {
    id: "opp-006",
    title: "Indonesian International Student Mobility Awards (IISMA) 2026",
    category: "Beasiswa",
    organizer: "Ditjen Diktiristek & LPDP",
    deadline: "2027-01-15",
    description: "Skema beasiswa mobilitas internasional bergengsi untuk berkuliah selama 1 semester di universitas ternama dunia dengan pembiayaan penuh dari Kemendikbudristek.",
    requirements: [
      "Mahasiswa aktif S1 semester 4-6 atau D3/D4 semester 4-5",
      "IPK minimum 3.00",
      "Skor bahasa Inggris minimum: TOEFL iBT 78 / IELTS 6.0 / Duolingo 100"
    ],
    required_skills: ["Intercultural Communication", "English Fluency", "Adaptability", "Essay Writing"],
    registration_url: "https://iisma.kemdikbud.go.id",
    is_verified: true,
  },
  {
    id: "opp-007",
    title: "Sea Scholarship Indonesia 2026",
    category: "Beasiswa",
    organizer: "Sea Group (Shopee & Garena)",
    deadline: "2026-12-10",
    description: "Beasiswa penuh uang kuliah + uang saku bulanan serta jaminan program magang eksklusif di Shopee, Garena, atau SeaMoney bagi mahasiswa teknologi dan bisnis.",
    requirements: [
      "Mahasiswa S1 semester 1-4 di universitas mitra terpilih",
      "Jurusan Ilmu Komputer, Teknik Informatika, Sistem Informasi, atau Bisnis",
      "Tidak sedang menerima beasiswa ikatan dinas lain"
    ],
    required_skills: ["Problem Solving", "Data Structures", "Analytical Thinking", "Algorithmic Logic"],
    registration_url: "https://careers.sea.com/scholarship",
    is_verified: true,
  },
  {
    id: "opp-008",
    title: "Microsoft Imagine Cup 2026 Indonesia",
    category: "Lomba",
    organizer: "Microsoft Indonesia",
    deadline: "2027-01-20",
    description: "Kompetisi teknologi global untuk pelajar dan mahasiswa guna mengubah ide bisnis rintisan teknologi menjadi kenyataan dengan memanfaatkan ekosistem Microsoft Azure & AI.",
    requirements: [
      "Pelajar atau mahasiswa usia minimal 16 tahun",
      "Tim 1-4 orang dengan ide startup teknologi terukur",
      "Prototipe memanfaatkan layanan Microsoft Cloud atau OpenAI on Azure"
    ],
    required_skills: ["Cloud Computing", "Azure AI Services", "Business Model Canvas", "Product Prototyping"],
    registration_url: "https://imaginecup.microsoft.com",
    is_verified: true,
  },
  {
    id: "opp-009",
    title: "National Seminar: GenAI & Edge Computing Revolution",
    category: "Seminar",
    organizer: "Pusat Studi AI & IEEE Indonesia Section",
    deadline: "2026-12-05",
    description: "Seminar nasional dan workshop interaktif membahas arsitektur model AI lokal, efisiensi inferensi Edge AI, serta masa depan talenta tech di Indonesia.",
    requirements: [
      "Terbuka untuk mahasiswa, akademisi, praktisi industri, dan umum",
      "Membawa laptop pribadi untuk sesi hands-on workshop",
      "Mendaftar sebelum kuota 250 peserta terpenuhi"
    ],
    required_skills: ["Machine Learning Basics", "Python", "API Integration"],
    registration_url: "https://ai-seminar.ieee.id",
    is_verified: true,
  },
  {
    id: "opp-010",
    title: "Tech Career Summit 2026: Navigating Software Engineering 3.0",
    category: "Seminar",
    organizer: "Indonesia Technology Forum",
    deadline: "2026-11-30",
    description: "Konferensi karir teknologi interaktif bersama engineering leader dari decacorn dan unicorn ternama, membahas strategi portofolio dan hiring tech terkini.",
    requirements: [
      "Mahasiswa tingkat akhir atau fresh graduate bidang teknologi/STEM",
      "Menyiapkan CV / resume untuk sesi instant review dengan tech recruiter"
    ],
    required_skills: ["Career Planning", "Personal Branding", "Portfolio Development"],
    registration_url: "https://techsummit.id/career-2026",
    is_verified: true,
  },
  {
    id: "opp-011",
    title: "COMPFEST 18 — Competitive Programming & Business-IT Case",
    category: "Lomba",
    organizer: "Fakultas Ilmu Komputer Universitas Indonesia",
    deadline: "2027-02-14",
    description: "Event IT tahunan terbesar yang diselenggarakan mahasiswa Fasilkom UI yang menguji ketajaman logika pemrograman kompetitif dan pemecahan kasus bisnis digital.",
    requirements: [
      "Mahasiswa aktif S1/D4/D3 seluruh Indonesia",
      "Kategori Individu untuk Competitive Programming, tim 3 orang untuk Business-IT Case",
      "Lolos tahap penyisihan daring"
    ],
    required_skills: ["Algorithms & Data Structures", "C++ / Java / Python", "Business Strategy"],
    registration_url: "https://compfest.id",
    is_verified: true,
  },
  {
    id: "opp-012",
    title: "Cloud Native & DevOps Summit Indonesia 2026",
    category: "Seminar",
    organizer: "Cloud Native Computing Foundation (CNCF) Community Surabaya-Malang",
    deadline: "2026-12-18",
    description: "Seminar dan workshop mendalam seputar Kubernetes, CI/CD pipeline automation, observability, dan cloud security standar enterprise.",
    requirements: [
      "Mahasiswa, developer, atau sysadmin yang ingin mendalami cloud native",
      "Memiliki pemahaman dasar sistem operasi Linux dan Docker"
    ],
    required_skills: ["Linux", "Docker", "Kubernetes", "CI/CD Concepts"],
    registration_url: "https://cloudnative.id/summit2026",
    is_verified: true,
  },
];

/**
 * Alias konvensi huruf kapital untuk konsistensi tim
 */
export const MOCK_OPPORTUNITIES = mockOpportunities;

/**
 * Mock Profil Pengguna Default untuk Demo Mode
 */
export const mockUserProfile: UserProfile = {
  id: "a9559a6d-f025-47b0-8203-662f58418699",
  full_name: "Raffa Danendra",
  email: "dummy123@gmail.com",
  username: "raffa_angkasa",
  institution: "Politeknik Negeri Malang",
  birth_date: "2007-08-17",
  education_level: "D4 Teknik Informatika",
  province: "Jawa Timur",
  city: "Malang",
  profiling: [
    "Cybersecurity",
    "Python",
    "Next.js",
    "AI Engineering",
    "Hackathon",
  ],
  avatar_url: null,
};

/**
 * Mock Request Kolaborasi Tim untuk Demo Matchmaking
 */
export const mockTeamRequests: TeamRequest[] = [
  {
    id: "team-req-001",
    opportunity_id: "opp-002",
    creator_id: "user-iqbal-002",
    creator_name: "Muhammad Iqbal",
    team_name: "Garuda ExplorAI",
    role_needed: "Backend & AI Engineer",
    hasRequested: false,
  },
  {
    id: "team-req-002",
    opportunity_id: "opp-001",
    creator_id: "user-revaldo-003",
    creator_name: "Revaldo Putra",
    team_name: "Nusantara Innovate",
    role_needed: "UI/UX Designer & Researcher",
    hasRequested: true,
  },
  {
    id: "team-req-003",
    opportunity_id: "opp-001",
    creator_id: "a9559a6d-f025-47b0-8203-662f58418699",
    creator_name: "Raffa Danendra",
    team_name: "CyberAI Guardians",
    role_needed: "Security Researcher & Data Analyst",
    hasRequested: false,
  },
];
