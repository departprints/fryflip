# FryFlip — Vivid Color Theme (Two-Column + Sticky Bar)

This bundle upgrades FryFlip to a **colorful gradient theme** while keeping:
- Two-column **From → To** layout
- **Sticky mini-result bar** on mobile
- CLS-safe responsive ad slots
- Type-safe AdSense trigger and relaxed ESLint

## Apply
```bash
cd ~/fryflip
ls -lh ~/Downloads/fryflip_theme_vivid.zip
unzip -o ~/Downloads/fryflip_theme_vivid.zip -d .
npm install lucide-react
npm run build
git add -A
git commit -m "Vivid theme: gradient hero, colorful chips, sticky bar"
git push
vercel --prod
```

**Remember:** set Vercel env var `NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxx` and update `public/ads.txt` with your publisher ID.
