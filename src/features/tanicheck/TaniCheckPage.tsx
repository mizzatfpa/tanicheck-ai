"use client";

import type { ChangeEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { AppShell } from "./components/AppShell";
import { AnalysisScreen } from "./components/AnalysisScreen";
import { CameraScreen } from "./components/CameraScreen";
import { ErrorScreen } from "./components/ErrorScreen";
import { HomeScreen } from "./components/HomeScreen";
import { PhotoSelectedScreen } from "./components/PhotoSelectedScreen";
import { ResultScreen } from "./components/ResultScreen";
import { formatRupiah, stripTrailingPeriod } from "./lib/formatting";
import { loadModelOnce, loadPredictionImage, delay } from "./lib/model";
import { buildPriceDecision, safePrice, safeQuantity } from "./lib/pricing";
import { validateImageFile, validateInputs } from "./lib/validation";
import type { AppState, ModelType, NavState, PriceResult } from "./types";

export function TaniCheckPage() {
  const [state, setState] = useState<AppState>("idle");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [imageReady, setImageReady] = useState(false);
  const [marketPrice, setMarketPrice] = useState("12000");
  const [quantityKg, setQuantityKg] = useState("10");
  const [marketLocation, setMarketLocation] = useState("Pasar lokal");
  const [result, setResult] = useState<PriceResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyFallbackOpen, setCopyFallbackOpen] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const modelRef = useRef<ModelType | null>(null);

  useEffect(() => () => stopCamera(), []);

  useEffect(() => {
    if (state === "camera_open" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [state]);

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const isBusy = state === "model_loading" || state === "analyzing";
  const navState: NavState =
    state === "result_ready" ? "price" : state === "idle" ? "home" : "analysis";

  const negotiationMessage = useMemo(() => {
    if (!result) return "";
    return `Halo, saya tertarik beli tomat sekitar ${safeQuantity(
      quantityKg,
    )} kg. Harga pasar yang saya pakai ${formatRupiah(
      safePrice(marketPrice),
    )}/kg. Setelah cek kualitas visual, harga wajar menurut TaniCheck sekitar ${formatRupiah(
      result.fairPrice,
    )}/kg. Saya ingin menawar di ${formatRupiah(
      result.openingBid,
    )}/kg. Alasannya: ${stripTrailingPeriod(result.reason)}.`;
  }, [marketPrice, quantityKg, result]);

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) selectPhoto(file);
  }

  function selectPhoto(file: File) {
    const validationError = validateImageFile(file);
    if (validationError) {
      showError(validationError);
      return;
    }

    stopCamera();
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(URL.createObjectURL(file));
    setPhotoName(file.name || "Foto tomat");
    setImageReady(false);
    setResult(null);
    setCopied(false);
    setCopyFallbackOpen(false);
    setErrorMessage("");
    setState("photo_selected");
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      showError("Browser tidak mendukung kamera langsung. Gunakan Upload Foto sebagai alternatif.");
      cameraInputRef.current?.click();
      return;
    }

    try {
      setCameraStarting(true);
      setErrorMessage("");
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setState("camera_open");
    } catch {
      showError("Kamera tidak diizinkan atau tidak tersedia. Gunakan Upload Foto sebagai alternatif.");
    } finally {
      setCameraStarting(false);
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function closeCamera() {
    stopCamera();
    setState(photoUrl ? "photo_selected" : "idle");
  }

  async function capturePhoto() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      showError("Gambar kamera belum siap. Tunggu pratinjau live muncul, lalu ambil foto lagi.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      showError("Browser gagal menyiapkan foto dari kamera.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );
    if (!blob) {
      showError("Foto kamera gagal dibuat. Coba ulangi pengambilan gambar.");
      return;
    }

    stopCamera();
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(URL.createObjectURL(blob));
    setPhotoName("Foto kamera");
    setImageReady(false);
    setResult(null);
    setCopied(false);
    setCopyFallbackOpen(false);
    setErrorMessage("");
    setState("photo_selected");
  }

  async function startAnalysis() {
    const validationError = validateInputs(marketPrice, quantityKg, marketLocation);

    if (validationError) {
      showError(validationError);
      return;
    }

    if (!photoUrl || !imageReady) {
      showError("Gambar belum siap dibaca. Tunggu pratinjau foto muncul, lalu coba lagi.");
      return;
    }

    try {
      setCopied(false);
      setCopyFallbackOpen(false);
      setErrorMessage("");
      setState("model_loading");
      const predictionImage = await loadPredictionImage(photoUrl);
      const model = await loadModelOnce(modelRef);
      setState("analyzing");
      await delay(650);
      const predictions = await model.predict(predictionImage);
      setResult(buildPriceDecision(predictions, safePrice(marketPrice), safeQuantity(quantityKg)));
      setState("result_ready");
    } catch (error) {
      modelRef.current = null;
      console.error(error);
      showError(
        "Model AI gagal dimuat atau prediksi gagal. Pastikan file model ada di public/model/tomato.",
      );
    }
  }

  async function copyNegotiationMessage() {
    let didCopy = false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(negotiationMessage);
        didCopy = true;
      }
    } catch {
      didCopy = false;
    }

    if (!didCopy) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = negotiationMessage;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        didCopy = document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch {
        didCopy = false;
      }
    }

    if (didCopy) {
      setCopied(true);
      setCopyFallbackOpen(false);
      window.setTimeout(() => setCopied(false), 2400);
    } else {
      setCopied(false);
      setCopyFallbackOpen(true);
    }
  }

  function resetFlow() {
    stopCamera();
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
    setPhotoName("");
    setImageReady(false);
    setResult(null);
    setErrorMessage("");
    setCopied(false);
    setCopyFallbackOpen(false);
    setState("idle");
  }

  function showError(message: string) {
    stopCamera();
    setErrorMessage(message);
    setState("error");
  }

  return (
    <AppShell
      activeNav={navState}
      hasResult={Boolean(result)}
      onGoHome={resetFlow}
      onOpenCamera={startCamera}
      onOpenUpload={() => uploadInputRef.current?.click()}
    >
      <input
        ref={cameraInputRef}
        className="hidden"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
      />
      <input
        ref={uploadInputRef}
        className="hidden"
        type="file"
        accept="image/*"
        onChange={handleFileInput}
      />

      {state === "idle" && (
        <HomeScreen
          cameraStarting={cameraStarting}
          onCamera={startCamera}
          onUpload={() => uploadInputRef.current?.click()}
        />
      )}

      {state === "camera_open" && (
        <CameraScreen refVideo={videoRef} onCapture={capturePhoto} onClose={closeCamera} />
      )}

      {state === "photo_selected" && photoUrl && (
        <PhotoSelectedScreen
          imageReady={imageReady}
          imageRef={imageRef}
          marketLocation={marketLocation}
          marketPrice={marketPrice}
          photoName={photoName}
          photoUrl={photoUrl}
          quantityKg={quantityKg}
          onAnalyze={startAnalysis}
          onCamera={startCamera}
          onImageReady={() => setImageReady(true)}
          onMarketLocationChange={setMarketLocation}
          onMarketPriceChange={setMarketPrice}
          onQuantityChange={setQuantityKg}
          onUpload={() => uploadInputRef.current?.click()}
        />
      )}

      {isBusy && photoUrl && (
        <AnalysisScreen isLoadingModel={state === "model_loading"} photoUrl={photoUrl} />
      )}

      {state === "result_ready" && result && photoUrl && (
        <ResultScreen
          copied={copied}
          copyFallbackOpen={copyFallbackOpen}
          imageRef={imageRef}
          marketLocation={marketLocation}
          marketPrice={safePrice(marketPrice)}
          message={negotiationMessage}
          photoName={photoName}
          photoUrl={photoUrl}
          quantityKg={safeQuantity(quantityKg)}
          result={result}
          onCopy={copyNegotiationMessage}
          onImageReady={() => setImageReady(true)}
          onReset={resetFlow}
        />
      )}

      {state === "error" && (
        <ErrorScreen
          message={errorMessage}
          onBack={() => (photoUrl ? setState("photo_selected") : setState("idle"))}
          onReset={resetFlow}
          onUpload={() => uploadInputRef.current?.click()}
        />
      )}
    </AppShell>
  );
}
