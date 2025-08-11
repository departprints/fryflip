"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Info, Copy, Printer, RefreshCw } from "lucide-react";
import AdSlot from "@/components/AdSlot";
import { convertToAirFryer, formatMinutes, parseTime } from "@/lib/conversion";

export default function Page() {
  const [tempUnit, setTempUnit] = useState<"F" | "C">("F");
  const [ovenTemp, setOvenTemp] = useState<number | "">(400);
  const [ovenTime, setOvenTime] = useState<string>("30");
  const [isConvectionRecipe, setIsConvectionRecipe] = useState(false);
  const [doneness, setDoneness] = useState<"lighter" | "standard" | "darker">("standard");
  const [thickness, setThickness] = useState<"thin" | "normal" | "thick">("normal");

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
    navigator.clipboard.writeText(text).catch(() => {});
  }

  function resetAll() {
    setTempUnit("F");
    setOvenTemp(400);
    setOvenTime("30");
    setIsConvectionRecipe(false);
    setDoneness("standard");
    setThickness("normal");
  }

  useEffect(() => {
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {}
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">FryFlip</h1>
        <p className="mt-2 text-gray-600">Turn any oven recipe into air-fryer settings in one click. Rule-of-thumb estimates—always check doneness early.</p>
      </header>

      <section className="grid gap-6 rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Temperature unit</label>
            <div className="inline-flex overflow-hidden rounded-xl border border-gray-300">
              {(["F", "C"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setTempUnit(u)}
                  className={`px-3 py-2 text-sm ${tempUnit === u ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}
                >
                  °{u}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Oven temperature</label>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={ovenTemp}
              onChange={(e) => setOvenTemp(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-gray-900"
              placeholder={tempUnit === "F" ? "e.g., 400" : "e.g., 200"}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Oven time</label>
            <input
              value={ovenTime}
              onChange={(e) => setOvenTime(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="minutes (e.g., 30 or 1:15)"
            />
            <p className="mt-1 text-xs text-gray-500">Accepts <strong>30</strong> (min), <strong>30:00</strong>, or <strong>1:15</strong>.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Recipe type</label>
            <div className="flex items-center gap-3 rounded-xl border border-gray-300 p-3">
              <input
                id="conv"
                type="checkbox"
                checked={isConvectionRecipe}
                onChange={(e) => setIsConvectionRecipe(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="conv" className="text-sm">This oven recipe already uses <strong>convection (fan)</strong></label>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Doneness preference</label>
            <select
              value={doneness}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setDoneness(e.target.value as "lighter" | "standard" | "darker")
              }
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="lighter">Lighter</option>
              <option value="standard">Standard</option>
              <option value="darker">Darker / extra-crisp</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Food thickness</label>
            <select
              value={thickness}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setThickness(e.target.value as "thin" | "normal" | "thick")
              }
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-base outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="thin">Thin (e.g., fries)</option>
              <option value="normal">Normal (e.g., nuggets, veg)</option>
              <option value="thick">Thick (e.g., chicken breast)</option>
            </select>
          </div>
        </div>

        <div ref={cardRef} className="rounded-2xl border border-gray-300 bg-gray-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-semibold">Your Air-Fryer Settings</h2>
            <div className="flex items-center gap-2">
              <button onClick={copyCard} className="rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-white" title="Copy">
                <Copy className="inline h-4 w-4" />
              </button>
              <button onClick={() => window.print()} className="rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-white" title="Print">
                <Printer className="inline h-4 w-4" />
              </button>
              <button onClick={resetAll} className="rounded-xl border border-gray-300 px-3 py-2 text-sm hover:bg-white" title="Reset">
                <RefreshCw className="inline h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <div className="text-xs uppercase text-gray-500">Temperature</div>
              <div className="text-2xl font-bold">{result.tempDisplay}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-500">Time</div>
              <div className="text-2xl font-bold">{formatMinutes(result.minutes)}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-500">Method</div>
              <div className="text-base">Preheat if your model requires it. Shake/turn halfway.</div>
            </div>
          </div>

          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
            <li>These are rule-of-thumb estimates. Check doneness early, especially for thick foods.</li>
            <li>If your oven recipe already used convection, adjustments are smaller.</li>
            {result.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>

        <AdSlot id="ad-top" slot="fryflip-top" />
      </section>

      <section className="mt-10 space-y-4">
        <h3 className="text-xl font-semibold">How FryFlip calculates</h3>
        <p className="text-gray-700">
          FryFlip applies common kitchen heuristics: reduce oven temperature by ~{tempUnit === "F" ? "25°F" : "15°C"} and reduce time by ~20%. If your original recipe already
          used a convection (fan) oven, we use smaller adjustments. Doneness and thickness nudges fine-tune for preference and food size.
        </p>
        <div className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          <Info className="mt-0.5 h-4 w-4" />
          <p>
            Always follow food-safety guidance for internal temperatures. This tool provides estimates only; appliances vary widely.
          </p>
        </div>

        <AdSlot id="ad-mid" slot="fryflip-mid" />
      </section>

      <section className="mt-10 space-y-4">
        <h3 className="text-xl font-semibold">FAQ</h3>
        <details className="rounded-xl border border-gray-200 p-4">
          <summary className="cursor-pointer font-medium">Does this work for baking (cakes, breads)?</summary>
          <p className="mt-2 text-gray-700">Air fryers behave differently from ovens for delicate bakes. Use caution and check early.</p>
        </details>
        <details className="rounded-xl border border-gray-200 p-4">
          <summary className="cursor-pointer font-medium">What about preheating?</summary>
          <p className="mt-2 text-gray-700">Some air fryers recommend preheating. If yours does, preheat briefly before starting the timer.</p>
        </details>
        <details className="rounded-xl border border-gray-200 p-4">
          <summary className="cursor-pointer font-medium">Why do my results differ?</summary>
          <p className="mt-2 text-gray-700">Model wattage, basket size, food thickness, and load size can change results. Our adjustments are a starting point.</p>
        </details>

        <AdSlot id="ad-footer" slot="fryflip-footer" />
      </section>

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "FryFlip",
            applicationCategory: "Calculator",
            operatingSystem: "Web",
            description: "Turn any oven recipe into air-fryer settings in one click.",
            url: "https://fryflip.xyz",
          }),
        }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Does this work for baking?",
                acceptedAnswer: { "@type": "Answer", text: "Use caution and check early; appliances vary." },
              },
              {
                "@type": "Question",
                name: "What about preheating?",
                acceptedAnswer: { "@type": "Answer", text: "Preheat briefly if your model recommends it." },
              },
              {
                "@type": "Question",
                name: "Why do my results differ?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Model wattage, basket size, thickness, and load size vary; our numbers are a starting point.",
                },
              },
            ],
          }),
        }}
      />

      <footer className="mt-16 border-t pt-8 text-sm text-gray-500">
        <p>Not affiliated with any appliance brands. Estimates only. © {new Date().getFullYear()} FryFlip.</p>
        <p className="mt-2">Made by <a className="underline" href="https://your-network.example">Your Micro-lab</a></p>
      </footer>
    </main>
  );
}
