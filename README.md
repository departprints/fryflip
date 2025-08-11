# FryFlip — Vivid Theme (No @apply)

Purpose: fix Tailwind error `Cannot apply unknown utility class 'gap-2'` by removing all `@apply` usage.
All styling is inline via className. Includes two‑column layout, colorful gradients, and sticky mobile bar.

## Install
```bash
cd ~/fryflip
unzip -o ~/Downloads/fryflip_theme_vivid_noapply.zip -d .
npm install lucide-react
npm run build
git add -A
git commit -m "Vivid theme without @apply (fix Tailwind gap-2 error)"
git push
vercel --prod
```

Make sure Vercel env var is set:
  NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx

And update public/ads.txt with your publisher ID.
