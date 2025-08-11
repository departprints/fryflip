# FryFlip UI v2 — Two-Column + Sticky Mini Bar

**What's new**
- Two-column **From → To** layout (inputs left, result right)
- **Sticky mini-result bar** on mobile (shows temp, time, quick Start)
- **Toned-down palette**: white + indigo accent; fast and readable
- Type-safe AdSense trigger; relaxed ESLint for painless builds

## Install & Deploy
```bash
cd ~/fryflip
unzip -o ~/Downloads/fryflip_ui_v2.zip -d .
npm install lucide-react
npm run build        # optional local check
git add -A
git commit -m "UI v2: two-column + sticky mini bar"
git push
vercel --prod
```

**Vercel env var** (Project → Settings → Environment Variables):
```
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
```

**Notes**
- Keep Auto ads ON in AdSense; these manual slots are optional and CLS-safe.
- `public/ads.txt` — replace with your publisher ID.
- No PII collected; `/api/metrics` only logs simple events to server console.
