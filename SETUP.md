# CarbonTrack – Setup

## 1. Supabase projekt

1. Ustvari nov projekt na https://supabase.com
2. V SQL Editor zaženi: `supabase/migrations/001_initial.sql`
3. Nato zaženi seed: `supabase/seed.sql`
4. V Settings → API skopiraj URL in anon key

## 2. Environment variables

Izpolni `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  (samo server-side)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. Lokalni razvoj

```bash
npm install
npm run dev
```

Odpri http://localhost:3000 → redirect na /login

## 4. Auth setup (Supabase dashboard)

- Authentication → Email → Enable "Confirm email": OFF (za razvoj)
- Ali nastavi potrditveni email
