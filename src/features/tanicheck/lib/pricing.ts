import type { PredictionLabel, PriceResult, Tone } from "../types";

export function buildPriceDecision(
  predictions: Array<{ className: string; probability: number }>,
  marketPrice: number,
  quantityKg: number,
): PriceResult {
  const probabilities: Record<PredictionLabel, number> = {
    Bagus: 0,
    Sedang: 0,
    Busuk: 0,
  };

  for (const prediction of predictions) {
    const label = normalizeLabel(prediction.className);
    if (label) probabilities[label] = clamp(prediction.probability, 0, 1);
  }

  const entries = Object.entries(probabilities) as Array<[PredictionLabel, number]>;
  const [topLabel, topConfidence] = entries.reduce((best, current) =>
    current[1] > best[1] ? current : best,
  );

  let riskLevel: PriceResult["riskLevel"] = "Rendah";
  let tone: Tone = "success";
  let riskText = "Barang terlihat cukup baik dan mendekati kualitas pasar normal.";
  let reason = "AI mendeteksi tomat dominan dalam kondisi bagus.";

  if (probabilities.Busuk >= 0.55) {
    riskLevel = "Tinggi";
    tone = "alert";
    riskText = "Kualitas berisiko turun cepat. Jangan membeli di harga pasar penuh.";
    reason =
      "AI mendeteksi indikasi busuk cukup dominan, sehingga harga wajar perlu diturunkan.";
  } else if (probabilities.Sedang >= 0.45 || probabilities.Busuk >= 0.25) {
    riskLevel = "Sedang";
    tone = "warning";
    riskText = "Barang masih bisa dibeli, tetapi perlu ditawar karena kualitas tidak seragam.";
    reason = "AI mendeteksi sebagian tomat berada di kualitas sedang atau mulai menurun.";
  }

  const qualityScore =
    probabilities.Bagus * 1.0 + probabilities.Sedang * 0.7 + probabilities.Busuk * 0.3;
  const fairPrice = roundPrice(marketPrice * qualityScore);
  const openingBid = roundPrice(fairPrice * 0.95);
  const maxBuyPrice = roundPrice(fairPrice * 1.03);

  let gradeA = clamp(Math.round(probabilities.Bagus * 70 + probabilities.Sedang * 25), 0, 100);
  let gradeC = clamp(Math.round(probabilities.Busuk * 80 + probabilities.Sedang * 10), 0, 100);
  if (gradeA + gradeC > 100) {
    const scale = 100 / (gradeA + gradeC);
    gradeA = Math.round(gradeA * scale);
    gradeC = Math.round(gradeC * scale);
  }
  const gradeB = clamp(100 - gradeA - gradeC, 0, 100);

  return {
    probabilities,
    topLabel,
    topConfidence,
    gradeA,
    gradeB,
    gradeC: 100 - gradeA - gradeB,
    qualityScore,
    fairPrice,
    openingBid,
    maxBuyPrice,
    totalFairPrice: roundPrice(fairPrice * quantityKg),
    totalOpeningBid: roundPrice(openingBid * quantityKg),
    totalMaxBuyPrice: roundPrice(maxBuyPrice * quantityKg),
    riskLevel,
    tone,
    riskText,
    reason,
  };
}

export function normalizeLabel(label: string): PredictionLabel | null {
  const lower = label.trim().toLowerCase();
  if (lower.includes("bagus")) return "Bagus";
  if (lower.includes("sedang")) return "Sedang";
  if (lower.includes("busuk")) return "Busuk";
  return null;
}

export function safePrice(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function safeQuantity(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function roundPrice(value: number) {
  const step = value >= 10000 ? 500 : 100;
  return Math.max(step, Math.round(value / step) * step);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
