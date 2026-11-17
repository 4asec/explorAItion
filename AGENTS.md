# Project Rules: Explor[AI]tion Hackathon MVP

## Tech Stack & Architecture
- Framework: Next.js (App Router), TypeScript, Tailwind CSS.
- AI SDK: `@google/genai` (NEVER use legacy `@google/generative-ai`).
- Primary Model: `gemini-3.5-flash-lite` (500 RPD quota), with fallback to `gemini-3.6-flash` and `gemini-3.8-flash`, plus an offline JSON mock fallback.
- API Key: Read strictly from `process.env.GEMINI_API_KEY` (never hardcode keys).

## Strict Constraints (Hackathon Mode)
1. **No Real Auth / No Database:** Do NOT install NextAuth, Clerk, Supabase, or Prisma. Use client-side state or a 1-click Role-Switcher toggle (`Mahasiswa` vs `Mitra`) for demo purposes.
2. **Keep It Simple:** Maintain a clean single-page workflow. Do not create unnecessary nested routes or over-engineered abstractions.
3. **Structured Output:** Always enforce `responseMimeType: "application/json"` with strict `responseSchema` in `src/app/api/analyze/route.ts`.
4. **File Boundaries:** Only modify files explicitly mentioned with `@` in the user's prompt. Never touch `.env.local` or `package.json` without explicit permission.
5. **UI Style:** Clean dark-mode aesthetic (`bg-slate-950`, `emerald-400`/`500` accents), responsive, with clear loading states and graceful error cards.