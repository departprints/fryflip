"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Info, Copy, Printer, RefreshCw, Share2, Timer as TimerIcon } from "lucide-react";
import AdSlot from "@/components/AdSlot";
import { convertToAirFryer, formatMinutes, parseTime } from "@/lib/conversion";

function sendMetric(name: string, data?: Record<string, unknown>) {
  try {
    const blob = new Blob([JSON.stringify({ name, ...data, t: Date.now() })], { type: "application/json" });
    navigator.sendBeacon("/api/metrics", blob);
  } catch {}
}

const PRESETS = [
  { key: "Fries", tF: 400, m: 16, don: "standard", th: "thin", conv: false },
  { key: "Wings", tF: 390, m: 22, don: "darker", th: "thick", conv: false },
  { key: "Nuggets", tF: 400, m: 12, don: "standard", th: "normal", conv: false },
  { key: "Broccoli", tF: 380, m: 10, don: "lighter", th: "normal", conv: true },
] as const;

type Doneness = "lighter" | "standard" | "darker";
type Thickness = "thin" | "normal" | "thick";

export default function Page() {
  const [tempUnit, setTempUnit] = useState<"F" | "C">("F");
  const [ovenTemp, setOvenTemp] = useState<number | "">(400);
  const [ovenTime, setOvenTime] = useState<string>("30");
  const [isConvectionRecipe, setIsConvectionRecipe] = useState(false);
  const [doneness, setDoneness] = useState<Doneness>("standard");
  const [thickness, setThickness] = useState<Thickness>("normal");

  const [timerSec, setTimerSec] = useState<number | null>(null);
  const [timerStart, setTimerStart] = useState<number>(0);
  const [halfAnnounced, setHalfAnnounced] = useState(false);
  const [showMini, setShowMini] = useState(false);

  // sticky mini bar visibility
  useEffect(() => {
    const onScroll = () => setShowMini(window.scrollY > 240);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // sync hash
  useEffect(() => {
    try {
      const params = new URLSearchParams({
        u: tempUnit,
        t: String(ovenTemp === "" ? 0 : ovenTemp),
        time: ovenTime,
        conv: isConvectionRecipe ? "1" : "0",
        don: doneness,
        th: thickness,
      });
      history.replaceState(null, "", `#${params.toString()}`);
    } catch {}
  }, [tempUnit, ovenTemp, ovenTime, isConvectionRecipe, doneness, thickness]);

  // read hash on load
  useEffect(() => {
    try {
      const hash = new URL(window.location.href).hash.replace(/^#/, "");
      if (!hash) return;
      const p = new URLSearchParams(hash);
      const u = p.get("u");
      const t = p.get("t");
      const time = p.get("time");
      const conv = p.get("conv");
      const don = p.get("don") as Doneness | null;
      const th = p.get("th") as Thickness | null;
      if (u === "F" || u === "C") setTempUnit(u);
      if (t) setOvenTemp(Number(t));
      if (time) setOvenTime(time);
      if (conv === "1" || conv === "0") setIsConvectionRecipe(conv === "1");
      if (don === "lighter" || don === "standard" || don === "darker") setDoneness(don);
      if (th === "thin" || th === "normal" || th === "thick") setThickness(th);
    } catch {}
  }, []);

  const result = useMemo(() => {
    const minutes = parseTime(ovenTime);
    return convertToAirFryer({
      ovenTemp: ovenTemp === "" ? 0 : Number(ovenTemp),
      tempUnit,
      ovenMinutes: minutes,
      convectionRecipe: isConvectionRecipe,
      doneness,
      thickness,
    });
  }, [ovenTemp, tempUnit, ovenTime, isConvectionRecipe, doneness, thickness]);

  const cardRef = useRef<HTMLDivElement>(null);
  function copyCard() {
    if (!cardRef.current) return;
    navigator.clipboard.writeText(cardRef.current.innerText).then(()=>sendMetric("copy")).catch(()=>{});
  }
  function copyShareLink() { try { navigator.clipboard.writeText(window.location.href); sendMetric("share"); } catch {} }
  function resetAll() {
    setTempUnit("F"); setOvenTemp(400); setOvenTime("30"); setIsConvectionRecipe(false);
    setDoneness("standard"); setThickness("normal"); sendMetric("reset");
  }
  function fToC(f: number) { return Math.round(((f - 32) * 5) / 9); }
  function applyPreset(label: string) {
    const p = PRESETS.find(x => x.key === label); if (!p) return;
    const t = tempUnit === "F" ? p.tF : fToC(p.tF);
    setOvenTemp(t); setOvenTime(String(p.m)); setIsConvectionRecipe(p.conv);
    setDoneness(p.don as Doneness); setThickness(p.th as Thickness);
    sendMetric("preset", { label });
  }

  // Timer
  function startTimer() {
    const totalSec = Math.max(1, Math.round(parseTime(ovenTime) * 60 * 0.9));
    setTimerSec(totalSec); setTimerStart(totalSec); setHalfAnnounced(false);
  }
  function stopTimer() { setTimerSec(null); setHalfAnnounced(false); }
  useEffect(() => {
    if (timerSec === null) return;
    const id = setInterval(() => {
      setTimerSec(s => {
        if (s === null) return s;
        const next = s - 1;
        if (!halfAnnounced && timerStart > 0 && next <= Math.floor(timerStart/2)) setHalfAnnounced(true);
        if (next <= 0) return null;
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerSec, timerStart, halfAnnounced]);

  // Trigger AdSense once
  useEffect(() => {
    try {
      const w = window as unknown as { adsbygoogle: Array<Record<string, unknown>> };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
    } catch {}
  }, []);

  const mm = timerSec !== null ? Math.floor(timerSec/60) : 0;
  const ss = timerSec !== null ? String(timerSec % 60).padStart(2, "0") : "00";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight">FryFlip</h1>
        <p className="mt-2 text-slate-600">Simple oven → air‑fryer conversion. Instant results, 100% free.</p>
      </header>

      {/* Presets */}
      <div className="mb-6 flex flex-wrap gap-2">
        {PRESETS.map(p => (
          <button key={p.key} onClick={()=>applyPreset(p.key)} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50">
            {p.key}
          </button>
        ))}
      </div>

      {/* Main card */}
      <section className="rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Temperature unit</label>
              <div className="inline-flex overflow-hidden rounded-xl border border-slate-300">
                {(["F","C"] as const).map(u => (
                  <button key={u} onClick={()=>setTempUnit(u)} className={`px-3 py-2 text-sm ${tempUnit===u? "bg-slate-900 text-white":"bg-white text-slate-800"}`}>°{u}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Oven temperature</label>
              <input inputMode="numeric" pattern="[0-9]*" value={ovenTemp}
                onChange={(e)=>setOvenTemp(e.target.value===""? "": Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-slate-900"
                placeholder={tempUnit==="F"?"e.g., 400":"e.g., 200"} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Oven time</label>
              <input value={ovenTime} onChange={(e)=>setOvenTime(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="minutes (e.g., 30 or 1:15)" />
              <p className="mt-1 text-xs text-slate-500">Accepts <strong>30</strong>, <strong>30:00</strong>, or <strong>1:15</strong>.</p>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-300 p-3">
              <input id="conv" type="checkbox" checked={isConvectionRecipe} onChange={(e)=>setIsConvectionRecipe(e.target.checked)} className="h-4 w-4" />
              <label htmlFor="conv" className="text-sm">Original oven recipe already uses <strong>convection (fan)</strong></label>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Doneness</label>
                <select value={doneness} onChange={(e)=>setDoneness(e.target.value as Doneness)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-slate-900">
                  <option value="lighter">Lighter</option>
                  <option value="standard">Standard</option>
                  <option value="darker">Darker / extra‑crisp</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Thickness</label>
                <select value={thickness} onChange={(e)=>setThickness(e.target.value as Thickness)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-slate-900">
                  <option value="thin">Thin (e.g., fries)</option>
                  <option value="normal">Normal (e.g., veg, nuggets)</option>
                  <option value="thick">Thick (e.g., chicken breast)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Result */}
          <div ref={cardRef} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-lg font-semibold">Your air‑fryer settings</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div><div className="text-xs uppercase text-slate-500">Temperature</div><div className="text-2xl font-bold">{result.tempDisplay}</div></div>
              <div><div className="text-xs uppercase text-slate-500">Time</div><div className="text-2xl font-bold">{formatMinutes(result.minutes)}</div></div>
              <div><div className="text-xs uppercase text-slate-500">Method</div><div className="text-base">Preheat if needed. Shake halfway.</div></div>
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>Estimates only—check doneness early.</li>
              <li>Convection recipes need smaller adjustments.</li>
              {result.notes.map((n,i)=>(<li key={i}>{n}</li>))}
            </ul>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button onClick={copyCard} className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-white"><Copy className="mr-1 inline h-4 w-4" />Copy</button>
              <button onClick={()=>window.print()} className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-white"><Printer className="mr-1 inline h-4 w-4" />Print</button>
              <button onClick={resetAll} className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-white"><RefreshCw className="mr-1 inline h-4 w-4" />Reset</button>
              <button onClick={copyShareLink} className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-white"><Share2 className="mr-1 inline h-4 w-4" />Share</button>
              {timerSec === null ? (
                <button onClick={startTimer} className="rounded-xl border border-slate-900 px-3 py-2 text-sm font-medium hover:bg-slate-900 hover:text-white"><TimerIcon className="mr-1 inline h-4 w-4" />Start check timer</button>
              ) : (
                <span className="text-sm text-slate-700">Time left: <span className="font-semibold tabular-nums">{mm}:{ss}</span>{(!halfAnnounced and timerStart>0 and timerSec<=Math.floor(timerStart/2))? " • Shake now": ""}</span>
              )}
            </div>
            {/* Top ad (under results) */}
            <AdSlot id="ad-top" slot="fryflip-top" />
          </div>
        </div>
      </section>

      {/* Explainer + Ad */}
      <section className="mt-10 space-y-4">
        <h3 className="text-lg font-semibold">Calculator use</h3>
        <p className="text-slate-700">
          FryFlip reduces oven temperature by ~{tempUnit==="F"?"25°F":"15°C"} and time by ~20% as a starting point.
          For convection (fan) oven recipes, adjustments are smaller. Doneness & thickness tweak time by about ±5%.
        </p>
        <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <Info className="mt-0.5 h-4 w-4" />
          Always follow food‑safety guidance for internal temperatures. Appliances vary widely.
        </div>
        <AdSlot id="ad-mid" slot="fryflip-mid" />
      </section>

      {/* FAQ + bottom ad */}
      <section className="mt-10 space-y-3">
        <h3 className="text-lg font-semibold">FAQ</h3>
        <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer font-medium">Can I convert 425°F for 25 minutes to air fryer?</summary><p className="mt-2 text-slate-700">Try ~400°F for ~20 minutes; check early and shake halfway. Use the inputs above to personalize.</p></details>
        <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer font-medium">Do I need to preheat?</summary><p className="mt-2 text-slate-700">Some models recommend it—preheat briefly if yours does.</p></details>
        <details className="rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer font-medium">Why do times vary?</summary><p className="mt-2 text-slate-700">Model wattage, basket size, load, and thickness differ. Use these numbers as a starting point.</p></details>
        <AdSlot id="ad-footer" slot="fryflip-footer" />
      </section>

      {/* Sticky mini bar (mobile) */}
      <div className={`mini-bar fixed inset-x-0 bottom-0 z-40 md:hidden transition-transform duration-300 ${showMini? "translate-y-0":"translate-y-full"}`}>
        <div className="mx-auto max-w-3xl px-3 pb-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
            <div className="text-sm">
              <span className="font-semibold">{result.tempDisplay}</span>
              <span className="mx-2">•</span>
              <span className="font-semibold">{formatMinutes(result.minutes)}</span>
              <span className="mx-2">•</span>
              <span>Shake halfway</span>
            </div>
            {timerSec === null ? (
              <button onClick={startTimer} className="rounded-lg border border-slate-900 px-3 py-1.5 text-sm font-medium">Start</button>
            ) : (
              <span className="text-sm font-semibold tabular-nums">{mm}:{ss}</span>
            )}
          </div>
        </div>
      </div>

      {/* Schema */}
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context":"https://schema.org","@type":"SoftwareApplication",name:"FryFlip",applicationCategory:"Calculator","operatingSystem":"Web",
        description:"Turn any oven recipe into air‑fryer settings in one click.",url:"https://fryflip.xyz"
      }) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context":"https://schema.org","@type":"FAQPage",mainEntity:[
          {"@type":"Question","name":"Can I convert 425°F for 25 minutes to air fryer?","acceptedAnswer":{"@type":"Answer","text":"Try ~400°F for ~20 minutes; check early and shake halfway."}},
          {"@type":"Question","name":"Do I need to preheat?","acceptedAnswer":{"@type":"Answer","text":"Some models recommend it; preheat briefly if so."}},
          {"@type":"Question","name":"Why do times vary?","acceptedAnswer":{"@type":"Answer","text":"Model wattage, basket size, load size, and thickness differ; use these as a starting point."}}
        ]
      }) }} />
    </main>
  );
}
