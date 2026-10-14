# Nexora AI

Coding aur study ke liye AI assistant. Stack: Next.js 14, Supabase (login + database), Claude API.

## Setup (10 minute)

1. **Node.js 18+** install karo.
2. **Supabase project** banao (supabase.com, free). Phir:
   - SQL Editor mein `supabase/schema.sql` ka poora code paste karke Run karo.
   - Project Settings -> API se `Project URL` aur `anon public key` copy karo.
   - Authentication -> Providers mein Email on rakho. Testing ke liye Authentication -> Sign In / Up mein "Confirm email" off kar sakte ho.
3. **Claude API key** console.anthropic.com se lo.
4. `.env.local` file kholo aur teeno values bharo (`.env.example` dekho).
5. Terminal mein:
   ```
   npm install
   npm run dev
   ```
6. Browser mein http://localhost:3000 kholo, sign up karo aur chat shuru karo.

## Deploy (Vercel)
Project GitHub par daalo, Vercel mein import karo, aur `.env.local` ke chaaron variables Vercel ke Environment Variables mein add karo.

## Features
- Email login/signup (Supabase Auth)
- Coding, Study, General mode
- Live streaming jawab, markdown aur code blocks (Copy button ke saath)
- Chat history save, purani chat kholna aur delete karna
- Har user ki daily message limit (`DAILY_MESSAGE_LIMIT`)
- Row Level Security: har user sirf apna data dekh sakta hai
- Mobile responsive

## Folder structure
- `app/page.js` chat screen, `app/login/page.js` login
- `app/api/chat/route.js` backend (auth check, limit, Claude streaming, DB save)
- `lib/prompts.js` modes ke system prompts (yahan se Nexora ki personality badlo)
- `supabase/schema.sql` database tables

## Mongo/MySQL?
Ye project Supabase (PostgreSQL) par bana hai, kyunki login aur database dono ek saath milte hain.
