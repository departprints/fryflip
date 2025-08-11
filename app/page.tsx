"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Info, Copy, Printer, RefreshCw, Share2, Timer as TimerIcon } from "lucide-react";
import AdSlot from "@/components/AdSlot";
import { convertToAirFryer, formatMinutes, parseTime } from "@/lib/conversion";

function sendMetric(name: string, data?: Record<string, unknown>) {
  try { const blob = new Blob([JSON.stringify({ name, ...data, t: Date.now() })], { type: "application/json" });
    navigator.sendBeacon("/api/metrics", blob); } catch {}
}

const PRESETS = [
  { key: "ex1", label: "425°F • 25m", tF: 425, m: 25, don: "standard", th: "normal", conv: false },
  { key: "ex2", label: "375°F • 40m", tF: 375, m: 40, don: "standard", th: "normal", conv: false },
  { key: "fries", label: "Fries", tF: 400, m: 16, don: "standard", th: "thin", conv: false },
  { key: "wings", label: "Wings", tF: 390, m: 22, don: "darker", th: "thick", conv: false },
  { key: "broccoli", label: "Broccoli", tF: 380, m: 10, don: "lighter", th: "normal", conv: true },
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

  useEffect(() => {
    const onScroll = () => setShowMini(window.scrollY > 220);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Read hash on first load
  useEffect(() => {
    try {
      const hash = new URL(window.location.href).hash.replace(/^#/, "");
      if (!hash) return;
      const params = new URLSearchParams(hash);
      const u = params.get("u"); const t = params.get("t"); const time = params.get("time");
      const conv = params.get("conv"); const don = params.get("don") as Doneness | null;
      const th = params.get("th") as Thickness | null;
      if (u === "F" || u === "C") setTempUnit(u);
      if (t) setOvenTemp(Number(t));
      if (time) setOvenTime(time);
      if (conv === "1" || conv === "0") setIsConvectionRecipe(conv === "1");
      if (don === "lighter" || don === "standard" || don === "darker") setDoneness(don);
      if (th === "thin" || th === "normal" || th === "thick") setThickness(th);
    } catch {}
  }, []);

  // Keep hash in sync
  useEffect(() => {
    try {
      const params = new URLSearchParams({
        u: tempUnit, t: String(ovenTemp === "" ? 0 : ovenTemp), time: ovenTime,
        conv: isConvectionRecipe ? "1" : "0", don: doneness, th: thickness,
      });
      history.replaceState(null, "", `#${params.toString()}`);
    } catch {}
  }, [tempUnit, ovenTemp, ovenTime, isConvectionRecipe, doneness, thickness]);

  const result = useMemo(() => {
    const minutes = parseTime(ovenTime);
    return convertToAirFryer({
      ovenTemp: ovenTemp === "" ? 0 : Number(ovenTemp),
      tempUnit, ovenMinutes: minutes, convectionRecipe: isConvectionRecipe,
      doneness, thickness,
    });
  }, [ovenTemp, tempUnit, ovenTime, isConvectionRecipe, doneness, thickness]);

  const cardRef = useRef<HTMLDivElement>(null);

  function copyCard() {
    if (!cardRef.current) return;
    const text = cardRef.current.innerText;
    navigator.clipboard.writeText(text).then(() => sendMetric("copy_result")).catch(() => {});
  }
  function copyShareLink() { try { navigator.clipboard.writeText(window.location.href); sendMetric("share_link"); } catch {} }
  function resetAll() { setTempUnit("F"); setOvenTemp(400); setOvenTime("30"); setIsConvectionRecipe(false); setDoneness("standard"); setThickness("normal"); sendMetric("reset"); }
  function fToC(f: number) { return Math.round(((f - 32) * 5) / 9); }
  function applyPreset(key: string) {
    const p = PRESETS.find((x) => x.key === key); if (!p) return;
    const t = tempUnit === "F" ? p.tF : fToC(p.tF);
    setOvenTemp(t); setOvenTime(String(p.m)); setIsConvectionRecipe(p.conv);
    setDoneness(p.don as Doneness); setThickness(p.th as Thickness);
    sendMetric("preset_apply", { key });
  }
  function startTimer() {
    const totalSec = Math.max(1, Math.round(parseTime(ovenTime) * 60 * 0.9));
    setTimerSec(totalSec); setTimerStart(totalSec); setHalfAnnounced(false);
    sendMetric("timer_start", { totalSec });
  }
  function stopTimer() { setTimerSec(null); setHalfAnnounced(false); sendMetric("timer_stop"); }

  useEffect(() => {
    if (timerSec === null) return;
    const id = setInterval(() => {
      setTimerSec((s) => {
        if (s === null) return s;
        const next = s - 1;
        if (!halfAnnounced && timerStart > 0 && next <= Math.floor(timerStart / 2)) { setHalfAnnounced(true); sendMetric("timer_half"); }
        if (next <= 0) { sendMetric("timer_done"); return null; }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerSec, timerStart, halfAnnounced]);

  useEffect(() => {
    try {
      const w = window as unknown as { adsbygoogle: Array<Record<string, unknown>> };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
    } catch {}
  }, []);

  const mm = timerSec !== null ? Math.floor(timerSec / 60) : 0;
  const ss = timerSec !== null ? String(timerSec % 60).padStart(2, "0") : "00";

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* HERO */}
      <header className="mb-8">
        <div className="frame shadow-lg">
          <div className="frame-inner p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-white font-bold">FF</div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">FryFlip</h1>
            </div>
            <p className="mt-2 text-slate-700">Turn any oven recipe into air-fryer settings in one click. Rule‑of‑thumb estimates—always check doneness early.</p>

            <div className="mt-4 -mx-1 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button key={p.key} onClick={() => applyPreset(p.key)} className="chip">
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Two-column */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left: Inputs */}
        <div className="card p-5">
          <h2 className="mb-4 text-lg font-semibold">From oven</h2>
          <div className="grid grid-cols-1 gap-5">
            <div className="grid grid-cols-[auto,1fr] items-center gap-3">
              <div className="inline-flex overflow-hidden rounded-xl border border-slate-300">
                {(["F", "C"] as const).map((u) => (
                  <button key={u} onClick={() => setTempUnit(u)} className={`px-3 py-2 text-sm ${tempUnit === u ? "bg-slate-900 text-white" : "bg-white text-slate-800"}`}>
                    °{u}
                  </button>
                ))}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Oven temperature</label>
                <input inputMode="numeric" pattern="[0-9]*" value={ovenTemp}
                  onChange={(e) => setOvenTemp(e.target.value === "" ? "" : Number(e.target.value))}
                  className="input" placeholder={tempUnit === "F" ? "e.g., 400" : "e.g., 200"} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Oven time</label>
              <input value={ovenTime} onChange={(e) => setOvenTime(e.target.value)} className="input" placeholder="minutes (e.g., 30 or 1:15)" />
              <p className="mt-1 text-xs text-slate-500">Accepts <strong>30</strong>, <strong>30:00</strong>, or <strong>1:15</strong>.</p>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-300 p-3">
              <input id="conv" type="checkbox" checked={isConvectionRecipe} onChange={(e) => setIsConvectionRecipe(e.target.checked)} className="h-4 w-4 accent-rose-500" />
              <label htmlFor="conv" className="text-sm">This oven recipe already uses <strong>convection (fan)</strong></label>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Doneness</label>
                <select value={doneness} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDoneness(e.target.value as Doneness)} className="input">
                  <option value="lighter">Lighter</option>
                  <option value="standard">Standard</option>
                  <option value="darker">Darker / extra‑crisp</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Thickness</label>
                <select value={thickness} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setThickness(e.target.value as Thickness)} className="input">
                  <option value="thin">Thin (e.g., fries)</option>
                  <option value="normal">Normal (e.g., nuggets, veg)</option>
                  <option value="thick">Thick (e.g., chicken breast)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Result */}
        <div className="card p-5" ref={cardRef}>
          <h2 className="mb-4 text-lg font-semibold">Your Air‑Fryer Settings</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div><div className="text-xs uppercase text-slate-500">Temperature</div><div className="text-2xl font-bold">{result.tempDisplay}</div></div>
            <div><div className="text-xs uppercase text-slate-500">Time</div><div className="text-2xl font-bold">{formatMinutes(result.minutes)}</div></div>
            <div><div className="text-xs uppercase text-slate-500">Method</div><div className="text-base">Preheat if needed. Shake/turn halfway.</div></div>
          </div>

          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>These are rule‑of‑thumb estimates. Check doneness early, especially for thick foods.</li>
            <li>If your oven recipe already used convection, adjustments are smaller.</li>
            {result.notes.map((n, i) => (<li key={i}>{n}</li>))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={copyCard} className="btn"><Copy className="h-4 w-4" />Copy</button>
            <button onClick={() => window.print()} className="btn"><Printer className="h-4 w-4" />Print</button>
            <button onClick={resetAll} className="btn"><RefreshCw className="h-4 w-4" />Reset</button>
            <button onClick={copyShareLink} className="btn"><Share2 className="h-4 w-4" />Share</button>
            {timerSec === null ? (
              <button onClick={startTimer} className="btn"><TimerIcon className="h-4 w-4" />Start check timer</button>
            ) : (
              <button onClick={stopTimer} className="btn">Stop timer</button>
            )}
          </div>

          <AdSlot id="ad-under-result" slot="fryflip-top" />
        </div>
      </section>

      {/* Calculator Use / Explainer */}
      <section className="mt-10 frame">
        <div className="frame-inner p-5 md:p-6">
          <h3 className="text-lg font-semibold">Calculator Use</h3>
          <p className="mt-2 text-slate-700">
            FryFlip reduces oven temperature by ~{tempUnit === "F" ? "25°F" : "15°C"} and time by ~20% as a starting point. If your recipe already uses a convection/fan oven,
            adjustments are smaller. Thickness & doneness settings nudge time by about ±5%.
          </p>
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-slate-200 bg-rose-50 p-3 text-sm text-slate-700">
            <Info className="mt-0.5 h-4 w-4 text-rose-500" />
            <p>Always follow food-safety guidance for internal temperatures. Appliances vary—check early.</p>
          </div>
          <AdSlot id="ad-after-use" slot="fryflip-mid" />
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-10 frame">
        <div className="frame-inner p-5 md:p-6">
          <h3 className="text-lg font-semibold">FAQ</h3>
          <details className="mt-3 rounded-xl border border-slate-200 p-4 open:bg-amber-50/60">
            <summary className="cursor-pointer font-medium">Can I convert 425°F for 25 minutes to air fryer?</summary>
            <p className="mt-2 text-slate-700">Try ~400°F for ~20 minutes; check early and shake halfway. Use the inputs above to personalize.</p>
          </details>
          <details className="mt-3 rounded-xl border border-slate-200 p-4 open:bg-amber-50/60">
            <summary className="cursor-pointer font-medium">Do I need to preheat?</summary>
            <p className="mt-2 text-slate-700">Some models recommend it. If yours does, preheat briefly before starting. Otherwise, start and check early.</p>
          </details>
          <details className="mt-3 rounded-xl border border-slate-200 p-4 open:bg-amber-50/60">
            <summary className="cursor-pointer font-medium">Why are times different from my friend’s?</summary>
            <p className="mt-2 text-slate-700">Model wattage, basket size, thickness, and load size vary. Our numbers are a starting point.</p>
          </details>
          <AdSlot id="ad-footer" slot="fryflip-footer" />
        </div>
      </section>

      {/* Sticky mini-result bar (mobile) */}
      <div className={`mini-bar fixed inset-x-0 bottom-0 z-40 md:hidden transition-transform duration-300 ${showMini ? "translate-y-0" : "translate-y-full"}`}>
        <div className="mx-auto max-w-5xl px-3 pb-3">
          <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-gradient-to-r from-amber-100 via-rose-100 to-fuchsia-100 px-3 py-2 shadow-lg backdrop-blur">
            <div className="text-sm">
              <span className="font-semibold">{result.tempDisplay}</span>
              <span className="mx-2">•</span>
              <span className="font-semibold">{formatMinutes(result.minutes)}</span>
              <span className="mx-2">•</span>
              <span>Shake halfway</span>
            </div>
            {timerSec === null ? (
              <button onClick={startTimer} className="btn px-2 py-1.5"><TimerIcon className="h-4 w-4" />Start</button>
            ) : (
              <span className="text-sm font-semibold tabular-nums">{mm}:{ss}</span>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-16 border-t pt-8 text-sm text-slate-600">
        <p>Not affiliated with any appliance brands. Estimates only. © {new Date().getFullYear()} FryFlip.</p>
        <p className="mt-2">Made by <a className="underline" href="https://your-network.example">Your Micro-lab</a></p>
      </footer>

      {/* JSON-LD */}
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context":"https://schema.org","@type":"SoftwareApplication",name:"FryFlip",
        applicationCategory:"Calculator",operatingSystem:"Web",
        description:"Turn any oven recipe into air-fryer settings in one click.",url:"https://fryflip.xyz"
      })}} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context":"https://schema.org","@type":"FAQPage",mainEntity:[
          {"@type":"Question","name":"Can I convert 425°F for 25 minutes to air fryer?","acceptedAnswer":{"@type":"Answer","text":"Try ~400°F for ~20 minutes; check early and shake halfway. Use the inputs."}},
          {"@type":"Question","name":"Do I need to preheat?","acceptedAnswer":{"@type":"Answer","text":"Some models recommend it; preheat briefly if so."}},
          {"@type":"Question","name":"Why are times different from my friend’s?","acceptedAnswer":{"@type":"Answer","text":"Model wattage, basket size, thickness, and load size vary; our numbers are a starting point."}}
        ]
      })}} />
    </main>
  );
}
