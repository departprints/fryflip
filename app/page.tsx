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
  { key: "fries", label: "Fries", tF: 400, m: 16, don: "standard", th: "thin", conv: false },
  { key: "wings", label: "Wings", tF: 390, m: 22, don: "darker", th: "thick", conv: false },
  { key: "nuggets", label: "Nuggets", tF: 400, m: 12, don: "standard", th: "normal", conv: false },
  { key: "broccoli", label: "Broccoli", tF: 380, m: 10, don: "lighter", th: "normal", conv: true },
  { key: "salmon", label: "Salmon", tF: 390, m: 10, don: "standard", th: "thick", conv: false },
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

  useEffect(() => {
    try {
      const hash = new URL(window.location.href).hash.replace(/^#/, "");
      if (!hash) return;
      const params = new URLSearchParams(hash);
      const u = params.get("u");
      const t = params.get("t");
      const time = params.get("time");
      const conv = params.get("conv");
      const don = params.get("don") as Doneness | null;
      const th = params.get("th") as Thickness | null;
      if (u === "F" || u === "C") setTempUnit(u);
      if (t) setOvenTemp(Number(t));
      if (time) setOvenTime(time);
      if (conv === "1" || conv === "0") setIsConvectionRecipe(conv === "1");
      if (don === "lighter" || don === "standard" || don === "darker") setDoneness(don);
      if (th === "thin" || th === "normal" || th === "thick") setThickness(th);
    } catch {}
  }, []);

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
    const text = cardRef.current.innerText;
    navigator.clipboard.writeText(text).then(() => sendMetric("copy_result")).catch(() => {});
  }
  function copyShareLink() { try { navigator.clipboard.writeText(window.location.href); sendMetric("share_link"); } catch {} }
  function resetAll() {
    setTempUnit("F"); setOvenTemp(400); setOvenTime("30"); setIsConvectionRecipe(false);
    setDoneness("standard"); setThickness("normal"); sendMetric("reset");
  }
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
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* HERO */}
      <header className="mb-8">
        <div className="card-gradient shadow-lg">
          <div className="card-inner p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-white font-bold">FF</div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">FryFlip</h1>
            </div>
            <p className="mt-2 text-slate-700">Turn any oven recipe into air-fryer settings in one click. Rule-of-thumb estimates—always check doneness early.</p>

            {/* Quick presets */}
            <div className="mt-4 -mx-1 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button key={p.key} onClick={() => applyPreset(p.key)} className="brand-chip">
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* INPUT + RESULT */}
      <section className="card-gradient">
        <div className="card-inner p-5 md:p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Temp Unit */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Temperature unit</label>
              <div className="inline-flex overflow-hidden rounded-xl border border-slate-300">
                {(["F", "C"] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setTempUnit(u)}
                    className={`px-3 py-2 text-sm ${tempUnit === u ? "bg-slate-900 text-white" : "bg-white text-slate-800"}`}
                  >
                    °{u}
                  </button>
                ))}
              </div>
            </div>
            {/* Oven Temp */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Oven temperature</label>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                value={ovenTemp}
                onChange={(e) => setOvenTemp(e.target.value === "" ? "" : Number(e.target.value))}
                className="brand-input"
                placeholder={tempUnit === "F" ? "e.g., 400" : "e.g., 200"}
              />
            </div>
            {/* Oven Time */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Oven time</label>
              <input
                value={ovenTime}
                onChange={(e) => setOvenTime(e.target.value)}
                className="brand-input"
                placeholder="minutes (e.g., 30 or 1:15)"
              />
              <p className="mt-1 text-xs text-slate-500">Accepts <strong>30</strong> (min), <strong>30:00</strong>, or <strong>1:15</strong>.</p>
            </div>
            {/* Convection recipe? */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Recipe type</label>
              <div className="flex items-center gap-3 rounded-xl border border-slate-300 p-3">
                <input
                  id="conv"
                  type="checkbox"
                  checked={isConvectionRecipe}
                  onChange={(e) => setIsConvectionRecipe(e.target.checked)}
                  className="h-4 w-4 accent-rose-500"
                />
                <label htmlFor="conv" className="text-sm text-slate-700">This oven recipe already uses <strong>convection (fan)</strong></label>
              </div>
            </div>
            {/* Doneness */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Doneness preference</label>
              <select
                value={doneness}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDoneness(e.target.value as Doneness)}
                className="brand-input"
              >
                <option value="lighter">Lighter</option>
                <option value="standard">Standard</option>
                <option value="darker">Darker / extra-crisp</option>
              </select>
            </div>
            {/* Thickness */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Food thickness</label>
              <select
                value={thickness}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setThickness(e.target.value as Thickness)}
                className="brand-input"
              >
                <option value="thin">Thin (e.g., fries)</option>
                <option value="normal">Normal (e.g., nuggets, veg)</option>
                <option value="thick">Thick (e.g., chicken breast)</option>
              </select>
            </div>
          </div>

          {/* Result Card */}
          <div ref={cardRef} className="mt-6 card">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-semibold">Your Air-Fryer Settings</h2>
              <div className="flex items-center gap-2">
                <button onClick={copyCard} className="brand-btn" title="Copy"><Copy className="h-4 w-4" /><span>Copy</span></button>
                <button onClick={() => window.print()} className="brand-btn" title="Print"><Printer className="h-4 w-4" /><span>Print</span></button>
                <button onClick={resetAll} className="brand-btn" title="Reset"><RefreshCw className="h-4 w-4" /><span>Reset</span></button>
                <button onClick={copyShareLink} className="brand-btn" title="Share link"><Share2 className="h-4 w-4" /><span>Share</span></button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div><div className="text-xs uppercase text-slate-500">Temperature</div><div className="text-2xl font-bold">{result.tempDisplay}</div></div>
              <div><div className="text-xs uppercase text-slate-500">Time</div><div className="text-2xl font-bold">{formatMinutes(result.minutes)}</div></div>
              <div><div className="text-xs uppercase text-slate-500">Method</div><div className="text-base">Preheat if your model requires it. Shake/turn halfway.</div></div>
            </div>

            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>These are rule-of-thumb estimates. Check doneness early, especially for thick foods.</li>
              <li>If your oven recipe already used convection, adjustments are smaller.</li>
              {result.notes.map((n, i) => (<li key={i}>{n}</li>))}
            </ul>

            {/* Timer controls */}
            <div className="mt-4 flex items-center gap-3">
              {timerSec === null ? (
                <button onClick={startTimer} className="brand-btn"><TimerIcon className="h-4 w-4" /> Start check timer</button>
              ) : (
                <>
                  <span className="text-sm text-slate-700">Time left: <span className="font-semibold">{mm}:{ss}</span>{!halfAnnounced && timerStart>0 && timerSec <= Math.floor(timerStart/2) ? " • Shake now" : ""}</span>
                  <button onClick={stopTimer} className="brand-btn">Stop</button>
                </>
              )}
            </div>
          </div>

          {/* Ad #1 */}
          <AdSlot id="ad-top" slot="fryflip-top" />
        </div>
      </section>

      {/* Explainer */}
      <section className="mt-10">
        <div className="card">
          <h3 className="text-xl font-semibold">How FryFlip calculates</h3>
          <p className="mt-2 text-slate-700">
            FryFlip applies common kitchen heuristics: reduce oven temperature by ~{tempUnit === "F" ? "25°F" : "15°C"} and reduce time by ~20%. If your original recipe already
            used a convection (fan) oven, we use smaller adjustments. Doneness and thickness nudge for preference and size.
          </p>
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-slate-200 bg-rose-50 p-3 text-sm text-slate-700">
            <Info className="mt-0.5 h-4 w-4 text-rose-500" />
            <p>Always follow food-safety guidance for internal temperatures. This tool provides estimates only; appliances vary widely.</p>
          </div>
        </div>

        {/* Ad #2 */}
        <AdSlot id="ad-mid" slot="fryflip-mid" />
      </section>

      {/* FAQ */}
      <section className="mt-10">
        <div className="card">
          <h3 className="text-xl font-semibold">FAQ</h3>
          <details className="mt-3 rounded-xl border border-slate-200 p-4 open:bg-orange-50/60">
            <summary className="cursor-pointer font-medium">Can I convert 425°F for 25 minutes to air fryer?</summary>
            <p className="mt-2 text-slate-700">As a rule of thumb, try ~400°F for ~20 minutes, check early at 10 minutes and shake halfway. Use the tool for your unit/time.</p>
          </details>
          <details className="mt-3 rounded-xl border border-slate-200 p-4 open:bg-orange-50/60">
            <summary className="cursor-pointer font-medium">Do I need to preheat?</summary>
            <p className="mt-2 text-slate-700">Some models recommend it. If yours does, preheat briefly before starting. Otherwise, start the timer and check early.</p>
          </details>
          <details className="mt-3 rounded-xl border border-slate-200 p-4 open:bg-orange-50/60">
            <summary className="cursor-pointer font-medium">Why are times different from my friend’s?</summary>
            <p className="mt-2 text-slate-700">Model wattage, basket size, food thickness, and load size affect results. Our adjustments are a starting point.</p>
          </details>
          <details className="mt-3 rounded-xl border border-slate-200 p-4 open:bg-orange-50/60">
            <summary className="cursor-pointer font-medium">What about baking (cakes, breads)?</summary>
            <p className="mt-2 text-slate-700">Air fryers behave differently from ovens for delicate bakes. Use caution and check early.</p>
          </details>
        </div>

        {/* Ad #3 */}
        <AdSlot id="ad-footer" slot="fryflip-footer" />
      </section>

      {/* JSON-LD */}
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context":"https://schema.org","@type":"SoftwareApplication",name:"FryFlip",
        applicationCategory:"Calculator",operatingSystem:"Web",
        description:"Turn any oven recipe into air-fryer settings in one click.",url:"https://fryflip.xyz"
      })}} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context":"https://schema.org","@type":"FAQPage",mainEntity:[
          {"@type":"Question","name":"Can I convert 425°F for 25 minutes to air fryer?","acceptedAnswer":{"@type":"Answer","text":"Try ~400°F for ~20 minutes; check early and shake halfway. Use the tool for specifics."}},
          {"@type":"Question","name":"Do I need to preheat?","acceptedAnswer":{"@type":"Answer","text":"Some models recommend it; preheat briefly if so."}},
          {"@type":"Question","name":"Why are times different from my friend’s?","acceptedAnswer":{"@type":"Answer","text":"Model wattage, basket size, thickness, and load size vary; our numbers are a starting point."}},
          {"@type":"Question","name":"What about baking (cakes, breads)?","acceptedAnswer":{"@type":"Answer","text":"Air fryers differ for delicate bakes—use caution and check early."}}
        ]
      })}} />

      <footer className="mt-16 border-t pt-8 text-sm text-slate-500">
        <p>Not affiliated with any appliance brands. Estimates only. © {new Date().getFullYear()} FryFlip.</p>
        <p className="mt-2">Made by <a className="underline" href="https://your-network.example">Your Micro-lab</a></p>
      </footer>
    </main>
  );
}
