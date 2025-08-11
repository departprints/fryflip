# FryFlip — Minimal 2025 UI

**What’s new**
- Clean, modern layout (2025 feel): lots of white space, neutral palette, crisp borders
- Two‑column layout on desktop; stacked on mobile
- Sticky mini‑result bar on mobile
- Three CLS‑safe AdSense slots (top/mid/bottom)
- No Tailwind `@apply` usage; inline classes only
- Type‑safe AdSense trigger; relaxed ESLint

## Apply
```bash
cd ~/fryflip
unzip -o ~/Downloads/fryflip_theme_2025_min.zip -d .
npm install lucide-react
npm run build
git add -A
git commit -m "Minimal 2025 UI refresh"
git push
vercel --prod
```

Set Vercel env var:
  NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx

Update `public/ads.txt` with your publisher ID.
