export type Inputs = {
  ovenTemp: number;
  tempUnit: "F" | "C";
  ovenMinutes: number;
  convectionRecipe: boolean;
  doneness: "lighter" | "standard" | "darker";
  thickness: "thin" | "normal" | "thick";
};

export function convertToAirFryer(i: Inputs) {
  const ovenTemp = clamp(i.ovenTemp, 100, i.tempUnit === "F" ? 550 : 290);
  const minutes = clamp(i.ovenMinutes, 1, 240);

  const tempDropF = i.convectionRecipe ? 10 : 25;
  let timeFactor = i.convectionRecipe ? 0.9 : 0.8;

  if (i.doneness === "lighter") timeFactor *= 0.95;
  if (i.doneness === "darker") timeFactor *= 1.05;

  if (i.thickness === "thin") timeFactor *= 0.95;
  if (i.thickness === "thick") timeFactor *= 1.05;

  let airTemp: number;
  if (i.tempUnit === "F") {
    airTemp = Math.round(ovenTemp - tempDropF);
  } else {
    const ovenF = cToF(ovenTemp);
    const targetF = ovenF - tempDropF;
    airTemp = Math.round(fToC(targetF));
  }

  const airMinutes = Math.max(1, Math.round(minutes * timeFactor));

  const tempDisplay = `~${airTemp}°${i.tempUnit}`;
  const notes: string[] = [];
  if (!i.convectionRecipe) notes.push("Original recipe was conventional oven—bigger adjustment applied.");
  if (i.convectionRecipe) notes.push("Original recipe used convection—smaller adjustment applied.");
  return { minutes: airMinutes, tempDisplay, notes };
}

export function parseTime(input: string): number {
  const str = input.trim();
  if (str.includes(":")) {
    const parts = str.split(":").map((p) => p.trim());
    if (parts.length === 2) {
      const m = toNum(parts[0]);
      const s = toNum(parts[1]);
      return clamp(m + s / 60, 0, 600);
    }
  }
  const hMatch = /([0-9]+)h/i.exec(str);
  const mMatch = /([0-9]+)m/i.exec(str);
  if (hMatch || mMatch) {
    const h = hMatch ? Number(hMatch[1]) : 0;
    const m = mMatch ? Number(mMatch[1]) : 0;
    return clamp(h * 60 + m, 0, 600);
  }
  return clamp(Number(str) || 0, 0, 600);
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `~${h} hr ${m} min`;
}

function clamp(n: number, min: number, max: number) { return Math.min(Math.max(n, min), max); }
function toNum(s: string) { const n = Number(s.replace(/[^0-9.]/g, "")); return isNaN(n) ? 0 : n; }
function cToF(c: number) { return (c * 9) / 5 + 32; }
function fToC(f: number) { return ((f - 32) * 5) / 9; }
