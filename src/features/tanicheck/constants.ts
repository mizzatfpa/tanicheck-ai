import type { PredictionLabel } from "./types";

export const MODEL_URL = "/model/tomato/model.json";
export const METADATA_URL = "/model/tomato/metadata.json";
export const MAX_FILE_SIZE = 8 * 1024 * 1024;
export const labels: PredictionLabel[] = ["Bagus", "Sedang", "Busuk"];
export const analysisSteps = [
  "Membaca warna dan kematangan",
  "Memeriksa risiko busuk",
  "Menghitung estimasi grade",
  "Menghitung harga wajar",
];
