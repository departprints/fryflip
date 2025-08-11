"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Printer, RefreshCw, Share2, Timer as TimerIcon, Info } from "lucide-react";
import AdSlot from "@/components/AdSlot";
import { convertToAirFryer, formatMinutes, parseTime } from "@/lib/conversion";

type Doneness = "lighter" | "standard" | "darker";
type Thickness = "thin" | "normal" | "thick";

function sendMetric(name: string, data?: Record<string, unknown>) {
  try { const blob = new Blob([JSON.stringify({ name, ...data, t: Date.now() })], { type: "application/json" });
    navigator.sendBeacon("/api/metrics", blob); } catch {}
}

const PRESETS = [
  { key: "Fries", tF: 400, m: 16, don: "standard", th: "thin", conv: false },
  { key: "Wings", tF: 390, m: 22, don: "darker", th: "thick", conv: false },
  { key: "Nuggets", tF: 400, m: 12, don: "standard", th: "normal", conv: false },
  { key: "Broccoli", tF: 380, m: 10, don: "lighter", th: "normal", conv: true },
] as const;

export default function Page() {
  const [tempUnit, setTempUnit] = useState<"F" | "C">("F");
  const [ovenTemp, setOvenTemp] = useState<number | "">(400);
  const [ovenTime, setOvenTime] = useState<string>("25");
  const [isConvectionRecipe, setIsConvectionRecipe] = useState(false);
  const [doneness, setDoneness] = useState<Doneness>("standard");
  const [thickness, setThickness] = useState<Thickness>("normal");

  const [timerSec, setTimerSec] = useState<number | null>(null);
  const [timerStart, setTimerStart] = useState<number>(0);
  const [halfAnnounced, setHalfAnnounced] = useState(false);
  const [showMini, setShowMini] = useState(false);

  useEffect(() => { const onScroll = () => setShowMini(window.scrollY > 220);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cardRef = useRef<HTMLDivElement>(null);

  // compute result
  const result = useMemo(() => {
    const minutes = parseTime(ovenTime);
    return convertToAirFryer({
      ovenTemp: ovenTemp === "" ? 0 : Number(ovenTemp),
      tempUnit, ovenMinutes: minutes, convectionRecipe: isConvectionRecipe, doneness, thickness
    });
  }, [ovenTemp, tempUnit, ovenTime, isConvectionRecipe, doneness, thickness]);

  function fToC(f: number) { return Math.round(((f - 32) * 5) / 9); }
  function applyPreset(label: string) {
    const p = PRESETS.find(x=>x.key===label); if (!p) return;
    const t = tempUnit==="F" ? p.tF : fToC(p.tF);
    setOvenTemp(t); setOvenTime(String(p.m)); setIsConvectionRecipe(p.conv);
    setDoneness(p.don as Doneness); setThickness(p.th as Thickness);
    sendMetric("preset", { label });
  }
  function resetAll() {
    setTempUnit("F"); setOvenTemp(400); setOvenTime("25"); setIsConvectionRecipe(false);
    setDoneness("standard"); setThickness("normal");
  }

  // timer
  function startTimer(){ const totalSec = Math.max(1, Math.round(parseTime(ovenTime)*60*0.9));
    setTimerSec(totalSec); setTimerStart(totalSec); setHalfAnnounced(false); }
  function stopTimer(){ setTimerSec(null); setHalfAnnounced(false); }
  useEffect(()=>{
    if (timerSec===null) return;
    const id = setInterval(()=>{
      setTimerSec(s=>{
        if (s===null) return s;
        const next = s-1;
        if (!halfAnnounced && timerStart>0 && next<=Math.floor(timerStart/2)) setHalfAnnounced(true);
        return next<=0? null: next;
      });
    },1000); return ()=>clearInterval(id);
  },[timerSec, timerStart, halfAnnounced]);

  useEffect(()=>{ try{
    const w = window as unknown as { adsbygoogle: Array<Record<string, unknown>> };
    w.adsbygoogle = w.adsbygoogle || []; w.adsbygoogle.push({});
  }catch{} },[]);

  const mm = timerSec!==null? Math.floor(timerSec/60):0;
  const ss = timerSec!==null? String(timerSec%60).padStart(2,"0"):"00";

  return (
    <main>
      {/* Green brand header */}
      <div className="w-full bg-[#0f7a42] text-white">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="text-2xl font-semibold"><span className="font-bold">Fry</span>Flip</div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="text-2xl font-semibold text-[#0f7a42]">Air‑Fryer Converter — Express</h1>

        {/* Tabs look (non-functional, just anchors) */}
        <div className="mt-4 flex flex-wrap gap-2">
          {["Temperature", "Time", "Thickness", "Doneness"].map((t,i)=>(
            <a key={t} href={`#${t.toLowerCase()}`} className={`rounded-sm border border-[#0f7a42] px-3 py-1.5 text-sm ${i===0? "bg-[#0f7a42] text-white":"bg-white text-[#0f7a42] hover:bg-[#eaf6ef]"}`}>
              {t}
            </a>
          ))}
        </div>

        {/* Main converter panel */}
        <div className="mt-4 rounded border border-[#9ac7a9] bg-[#f4fbf6] p-2 shadow">
          {/* Panel header (From / To) */}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {/* FROM */}
            <div className="rounded border border-[#9ac7a9] bg-white p-3">
              <div className="text-base font-semibold text-[#0f7a42]">From:</div>
              <div className="mt-2 space-y-3">
                {/* Temp */}
                <div id="temperature">
                  <label className="mb-1 block text-sm font-medium">Oven Temperature</label>
                  <div className="grid grid-cols-[auto,1fr] gap-2">
                    <div className="flex overflow-hidden rounded-sm">
                      {(["F","C"] as const).map(u => (
                        <button key={u} onClick={()=>setTempUnit(u)} className={`px-3 py-2 text-sm border border-[#9ac7a9] ${tempUnit===u? "bg-[#e6f4ea]":"bg-[#d7ecdf]"} hover:bg-[#eaf6ef]`}>°{u}</button>
                      ))}
                    </div>
                    <input
                      inputMode="numeric" pattern="[0-9]*"
                      value={ovenTemp} onChange={(e)=>setOvenTemp(e.target.value===""? "": Number(e.target.value))}
                      className="rounded-sm border border-[#9ac7a9] bg-[#d7ecdf] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f7a42]"
                      placeholder={tempUnit==="F"?"e.g., 400":"e.g., 200"}
                    />
                  </div>
                </div>

                {/* Time */}
                <div id="time">
                  <label className="mb-1 block text-sm font-medium">Oven Time</label>
                  <input
                    value={ovenTime} onChange={(e)=>setOvenTime(e.target.value)}
                    className="w-full rounded-sm border border-[#9ac7a9] bg-[#d7ecdf] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f7a42]"
                    placeholder="e.g., 25 or 1:15"
                  />
                </div>

                <label className="flex items-center gap-2 rounded-sm border border-[#9ac7a9] bg-[#d7ecdf] px-3 py-2 text-sm">
                  <input type="checkbox" checked={isConvectionRecipe} onChange={(e)=>setIsConvectionRecipe(e.target.checked)} />
                  Original recipe already uses convection (fan)
                </label>

                <div id="thickness" className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <select value={doneness} onChange={(e)=>setDoneness(e.target.value as Doneness)}
                    className="rounded-sm border border-[#9ac7a9] bg-[#d7ecdf] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f7a42]">
                    <option value="lighter">Lighter</option>
                    <option value="standard">Standard</option>
                    <option value="darker">Darker / extra‑crisp</option>
                  </select>
                  <select value={thickness} onChange={(e)=>setThickness(e.target.value as Thickness)}
                    className="rounded-sm border border-[#9ac7a9] bg-[#d7ecdf] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f7a42]">
                    <option value="thin">Thin</option>
                    <option value="normal">Normal</option>
                    <option value="thick">Thick</option>
                  </select>
                </div>

                {/* Action buttons mimic keys */}
                <div className="flex flex-wrap gap-2">
                  <button onClick={()=>applyPreset("Fries")} className="rounded-sm border border-[#9ac7a9] bg-[#d7ecdf] px-3 py-2 text-sm hover:bg-[#eaf6ef]">Fries</button>
                  <button onClick={()=>applyPreset("Wings")} className="rounded-sm border border-[#9ac7a9] bg-[#d7ecdf] px-3 py-2 text-sm hover:bg-[#eaf6ef]">Wings</button>
                  <button onClick={()=>applyPreset("Nuggets")} className="rounded-sm border border-[#9ac7a9] bg-[#d7ecdf] px-3 py-2 text-sm hover:bg-[#eaf6ef]">Nuggets</button>
                  <button onClick={resetAll} className="rounded-sm border border-[#9ac7a9] bg-[#d7ecdf] px-3 py-2 text-sm hover:bg-[#eaf6ef]">AC</button>
                </div>
              </div>
            </div>

            {/* TO */}
            <div className="rounded border border-[#9ac7a9] bg-white p-3" ref={cardRef}>
              <div className="text-base font-semibold text-[#0f7a42]">To:</div>

              <div className="mt-2 grid grid-cols-1 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Air‑Fryer Temperature</label>
                  <input readOnly value={result.tempDisplay} className="w-full rounded-sm border border-[#9ac7a9] bg-[#f5fbf7] px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Air‑Fryer Time</label>
                  <input readOnly value={formatMinutes(result.minutes)} className="w-full rounded-sm border border-[#9ac7a9] bg-[#f5fbf7] px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Method</label>
                  <input readOnly value="Preheat if required. Shake/turn halfway." className="w-full rounded-sm border border-[#9ac7a9] bg-[#f5fbf7] px-3 py-2 text-sm" />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={()=>{ if(!cardRef.current) return; navigator.clipboard.writeText(cardRef.current.innerText); }} className="rounded-sm border border-[#9ac7a9] bg-[#d7ecdf] px-3 py-2 text-sm hover:bg-[#eaf6ef]"><Copy className="mr-1 inline h-4 w-4" />Copy</button>
                <button onClick={()=>window.print()} className="rounded-sm border border-[#9ac7a9] bg-[#d7ecdf] px-3 py-2 text-sm hover:bg-[#eaf6ef]"><Printer className="mr-1 inline h-4 w-4" />Print</button>
                {timerSec===null ? (
                  <button onClick={startTimer} className="rounded-sm border border-[#9ac7a9] bg-[#d7ecdf] px-3 py-2 text-sm hover:bg-[#eaf6ef]"><TimerIcon className="mr-1 inline h-4 w-4" />Start</button>
                ) : (
                  <button onClick={stopTimer} className="rounded-sm border border-[#9ac7a9] bg-[#d7ecdf] px-3 py-2 text-sm hover:bg-[#eaf6ef]">Stop</button>
                )}
                <button onClick={()=>{ try{navigator.clipboard.writeText(window.location.href);}catch{}}} className="rounded-sm border border-[#9ac7a9] bg-[#d7ecdf] px-3 py-2 text-sm hover:bg-[#eaf6ef]"><Share2 className="mr-1 inline h-4 w-4" />Share</button>
              </div>
            </div>
          </div>
        </div>

        {/* Mid ad */}
        <AdSlot id="ad-mid" slot="fryflip-mid" />

        {/* Finder box */}
        <div className="mt-4 rounded border border-[#9ac7a9] bg-[#e9f6ee] p-4">
          <h3 className="text-xl font-semibold text-[#0f7a42]">Find a preset</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <input className="rounded border border-[#9ac7a9] bg-white px-3 py-2 text-sm" placeholder="e.g., fries, wings" />
            <input className="rounded border border-[#9ac7a9] bg-white px-3 py-2 text-sm" placeholder="e.g., veggies, salmon" />
          </div>
          <p className="mt-2 text-xs text-slate-700">Tip: click a chip above or use your own recipe in the left panel.</p>
        </div>

        {/* FAQ / Explainer */}
        <div className="mt-6 rounded border border-[#9ac7a9] bg-white p-4">
          <h3 className="text-base font-semibold text-[#0f7a42]">How it works</h3>
          <p className="mt-2 text-sm text-slate-800">
            FryFlip reduces oven temperature by ~{tempUnit === "F" ? "25°F" : "15°C"} and time by ~20% as a starting point.
            If your recipe already used a convection/fan oven, adjustments are smaller. Thickness & doneness tweak time by ~±5%.
          </p>
          <div className="mt-3 flex items-start gap-2 rounded border border-[#9ac7a9] bg-[#f5fbf7] p-3 text-xs text-slate-800">
            <Info className="mt-0.5 h-4 w-4 text-[#0f7a42]" />
            Always follow food-safety guidance for internal temperatures. Appliances vary—check early.
          </div>
        </div>

        {/* Footer ad */}
        <AdSlot id="ad-footer" slot="fryflip-footer" />

        <footer className="mt-6 text-center text-xs text-slate-700">
          Not affiliated with any appliance brands. Estimates only. © {new Date().getFullYear()} FryFlip.
        </footer>
      </div>

      {/* Sticky mini result bar */}
      <div className={`mini-bar fixed inset-x-0 bottom-0 z-40 md:hidden transition-transform duration-300 ${showMini? "translate-y-0":"translate-y-full"}`}>
        <div className="mx-auto max-w-5xl px-3 pb-3">
          <div className="flex items-center justify-between rounded border border-[#9ac7a9] bg-[#f4fbf6]/95 px-3 py-2 shadow backdrop-blur">
            <div className="text-sm">
              <span className="font-semibold">{result.tempDisplay}</span>
              <span className="mx-2">•</span>
              <span className="font-semibold">{formatMinutes(result.minutes)}</span>
              <span className="mx-2">•</span>
              <span>Shake halfway</span>
            </div>
            {timerSec===null ? (
              <button onClick={startTimer} className="rounded bg-[#0f7a42] px-3 py-1.5 text-sm text-white">Start</button>
            ) : (
              <span className="text-sm font-semibold tabular-nums">{mm}:{ss}</span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
