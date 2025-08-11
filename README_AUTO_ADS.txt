FryFlip — Auto Ads build (no manual slots)
========================================

This package switches FryFlip to **AdSense Auto ads** (you chose Automatic in AdSense).
What you do:

1) In Vercel → Project → *Settings → Environment Variables* add:
   NEXT_PUBLIC_ADSENSE_CLIENT = ca-pub-xxxxxxxxxxxxxxxx   (your Publisher ID)

2) Replace the files in this ZIP at the **same paths** in your project.
   We removed AdSlot.tsx and any manual ad tags.

3) (Recommended) In AdSense → *Ads → Auto ads → Edit*:
   - Turn **on** Auto ads for fryflip.xyz
   - Turn **off** anchor/vignette formats if you prefer standard placements only

4) Add `public/ads.txt` with your ID (already included here as a placeholder).
   After deploy, verify: https://fryflip.xyz/ads.txt

Deploy:
  git add -A && git commit -m "Switch to Auto ads" && git push
  vercel --prod

Files included:
  app/layout.tsx        (adds Auto ads loader + meta)
  app/page.tsx          (no manual ad slots)
  app/globals.css
  lib/conversion.ts
  app/robots.ts
  app/sitemap.ts
  app/api/metrics/route.ts
  public/ads.txt        (replace pub-XXXXXXXXXXXXXXXX)

Generated: 2025-08-11T13:57:56.687221Z
