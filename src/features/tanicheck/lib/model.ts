import type { RefObject } from "react";

import { METADATA_URL, MODEL_URL } from "../constants";
import type { ModelType } from "../types";

export async function loadModelOnce(modelRef: RefObject<ModelType | null>) {
  if (modelRef.current) return modelRef.current;
  await import("@tensorflow/tfjs");
  const tmImage = await import("@teachablemachine/image");
  modelRef.current = await tmImage.load(MODEL_URL, METADATA_URL);
  return modelRef.current;
}

export function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function loadPredictionImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image failed to load for prediction"));
    image.src = src;
  });
}
