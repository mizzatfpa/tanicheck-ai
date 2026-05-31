export type AppState =
  | "idle"
  | "camera_open"
  | "photo_selected"
  | "model_loading"
  | "analyzing"
  | "result_ready"
  | "error";

export type NavState = "home" | "analysis" | "price";
export type PredictionLabel = "Bagus" | "Sedang" | "Busuk";
export type Tone = "success" | "warning" | "alert";

export type PriceResult = {
  probabilities: Record<PredictionLabel, number>;
  topLabel: PredictionLabel;
  topConfidence: number;
  gradeA: number;
  gradeB: number;
  gradeC: number;
  qualityScore: number;
  fairPrice: number;
  openingBid: number;
  maxBuyPrice: number;
  totalFairPrice: number;
  totalOpeningBid: number;
  totalMaxBuyPrice: number;
  riskLevel: "Rendah" | "Sedang" | "Tinggi";
  tone: Tone;
  riskText: string;
  reason: string;
};

export type ModelType = {
  predict: (image: HTMLImageElement) => Promise<Array<{ className: string; probability: number }>>;
};
