FryFlip — One-Page MVP (fryflip.xyz)
=====================================

This zip contains the latest FryFlip code with TypeScript/ESLint fixes and your domain (fryflip.xyz) set.

Install once:
- Node.js LTS
- VS Code
- (Project) run: npm install lucide-react

Create project & run locally:
  npx create-next-app@latest fryflip --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*"
  cd fryflip
  npm install lucide-react
  # copy files from this zip into the matching paths, then:
  npm run dev

Deploy with Vercel CLI (recommended):
  npm i -g vercel
  vercel login
  vercel link   # select/create project "fryflip"
  vercel --prod

Domain (Namecheap → Advanced DNS → Host Records):
  A     @     76.76.21.21    TTL: Automatic
  CNAME www   cname.vercel-dns.com.    TTL: Automatic

After AdSense approval (in Vercel → Project → Settings → Environment Variables):
  NEXT_PUBLIC_ADSENSE_CLIENT = ca-pub-xxxxxxxxxxxxxxxx

Files included:
  app/layout.tsx
  app/page.tsx
  app/globals.css
  components/AdSlot.tsx
  lib/conversion.ts
  app/robots.ts
  app/sitemap.ts
  app/api/metrics/route.ts
  types/ads.d.ts

Generated: 2025-08-11T12:48:43.544961Z
