"use client";

import {
  AlertTriangle,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Clipboard,
  Copy,
  Home,
  ImageUp,
  Leaf,
  LoaderCircle,
  RefreshCw,
  SearchCheck,
  ShoppingBag,
  Sprout,
  Tag,
  X,
} from "lucide-react";
import type { ChangeEvent, ReactNode, RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type AppState =
  | "idle"
  | "camera_open"
  | "photo_selected"
  | "model_loading"
  | "analyzing"
  | "result_ready"
  | "error";

type NavState = "home" | "analysis" | "price";
type PredictionLabel = "Bagus" | "Sedang" | "Busuk";
type Tone = "success" | "warning" | "alert";

type PriceResult = {
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

type ModelType = {
  predict: (image: HTMLImageElement) => Promise<Array<{ className: string; probability: number }>>;
};

const MODEL_URL = "/model/tomato/model.json";
const METADATA_URL = "/model/tomato/metadata.json";
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const labels: PredictionLabel[] = ["Bagus", "Sedang", "Busuk"];
const analysisSteps = [
  "Membaca warna dan kematangan",
  "Memeriksa risiko busuk",
  "Menghitung estimasi grade",
  "Menghitung harga wajar",
];

export default function TaniCheckPage() {
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

  async function loadModelOnce() {
    if (modelRef.current) return modelRef.current;
    await import("@tensorflow/tfjs");
    const tmImage = await import("@teachablemachine/image");
    modelRef.current = await tmImage.load(MODEL_URL, METADATA_URL);
    return modelRef.current;
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
      const model = await loadModelOnce();
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

function AppShell({
  activeNav,
  children,
  hasResult,
  onGoHome,
  onOpenCamera,
  onOpenUpload,
}: {
  activeNav: NavState;
  children: ReactNode;
  hasResult: boolean;
  onGoHome: () => void;
  onOpenCamera: () => void;
  onOpenUpload: () => void;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
      <AppHeader onGoHome={onGoHome} onOpenCamera={onOpenCamera} onOpenUpload={onOpenUpload} />
      <main className="mx-auto w-full max-w-[1120px] px-4 pb-28 pt-5 sm:px-6 md:pb-10 lg:px-8">
        {children}
      </main>
      <BottomNav
        active={activeNav}
        hasResult={hasResult}
        onGoHome={onGoHome}
        onOpenUpload={onOpenUpload}
      />
    </div>
  );
}

function AppHeader({
  onGoHome,
  onOpenCamera,
  onOpenUpload,
}: {
  onGoHome: () => void;
  onOpenCamera: () => void;
  onOpenUpload: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(190,202,184,0.45)] bg-[#f6fbef]/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-[72px] w-full max-w-[1120px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <button className="flex items-center gap-2 text-left text-[var(--primary)]" type="button" onClick={onGoHome}>
          <Leaf className="h-8 w-8 fill-current stroke-[2.25]" aria-hidden="true" />
          <span>
            <span className="block text-[24px] font-bold leading-[1.05]">TaniCheck</span>
            <span className="hidden text-[12px] font-semibold leading-[1.35] text-[var(--secondary)] sm:block">
              Cek kualitas. Hitung harga wajar.
            </span>
          </span>
        </button>
        <div className="hidden items-center gap-2 md:flex">
          <HeaderButton icon={<Camera className="h-4 w-4" />} onClick={onOpenCamera}>
            Kamera
          </HeaderButton>
          <HeaderButton icon={<ImageUp className="h-4 w-4" />} onClick={onOpenUpload}>
            Upload Foto
          </HeaderButton>
        </div>
      </div>
    </header>
  );
}

function HeaderButton({
  children,
  icon,
  onClick,
}: {
  children: ReactNode;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className="flex h-11 items-center gap-2 rounded-full border border-[rgba(0,98,20,0.18)] bg-white px-4 text-[14px] font-bold text-[var(--primary)] shadow-sm transition hover:bg-[var(--leaf-mist)] active:scale-[0.98]"
      type="button"
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}

function HomeScreen({
  cameraStarting,
  onCamera,
  onUpload,
}: {
  cameraStarting: boolean;
  onCamera: () => void;
  onUpload: () => void;
}) {
  return (
    <section className="grid min-h-[calc(100vh-120px)] items-center gap-6 md:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:gap-10">
      <div className="rounded-[28px] bg-[var(--warm-white)] p-6 shadow-[0_12px_32px_rgba(20,60,20,0.08)] sm:p-8 lg:bg-transparent lg:p-0 lg:shadow-none">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(190,202,184,0.35)] bg-[var(--leaf-mist)] text-[var(--primary)] shadow-sm">
          <SearchCheck className="h-12 w-12 stroke-[2.2]" aria-hidden="true" />
        </div>
        <p className="mb-2 text-[13px] font-semibold leading-[1.35] text-[var(--secondary)]">
          Cek kualitas. Hitung harga wajar.
        </p>
        <h1 className="max-w-[620px] text-[32px] font-bold leading-[1.15] text-[var(--primary)] sm:text-[40px] lg:text-[48px]">
          Cek harga wajar sebelum membeli
        </h1>
        <p className="mt-4 max-w-[640px] text-[16px] font-medium leading-[1.55] text-[var(--soil-gray)] sm:text-[18px]">
          Ambil atau upload foto tomat, masukkan harga pasar, lalu TaniCheck memberi rekomendasi
          harga tawar berdasarkan kualitas visual.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--leaf-mist)] px-4 py-2 text-[13px] font-semibold text-[var(--secondary)]">
          <Sprout className="h-4 w-4" aria-hidden="true" />
          Saat ini dioptimalkan untuk tomat.
        </div>
      </div>

      <div className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--warm-white)] p-5 shadow-[0_10px_34px_rgba(20,60,20,0.10)] sm:p-6">
        <div className="mb-6 flex aspect-[1.18] w-full items-center justify-center overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#f0f7ec,#fefffb)]">
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-[var(--leaf-mist)] text-[var(--primary)] shadow-inner">
            <div className="absolute inset-0 scale-[1.16] rounded-full border border-[rgba(0,98,20,0.10)]" />
            <Camera className="h-12 w-12 stroke-[2.25]" aria-hidden="true" />
          </div>
        </div>
        <div className="grid gap-3">
          <PrimaryButton
            disabled={cameraStarting}
            icon={cameraStarting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
            onClick={onCamera}
          >
            {cameraStarting ? "Membuka Kamera" : "Kamera"}
          </PrimaryButton>
          <SecondaryButton icon={<ImageUp className="h-5 w-5" />} onClick={onUpload}>
            Upload Foto
          </SecondaryButton>
        </div>
      </div>
    </section>
  );
}

function CameraScreen({
  onCapture,
  onClose,
  refVideo,
}: {
  onCapture: () => void;
  onClose: () => void;
  refVideo: RefObject<HTMLVideoElement | null>;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
      <div className="rounded-[28px] bg-white p-4 shadow-[0_10px_32px_rgba(20,60,20,0.10)]">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[24px] bg-black md:aspect-[16/11]">
          <video
            ref={refVideo}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
            aria-label="Pratinjau kamera langsung"
          />
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/20" />
        </div>
      </div>
      <div className="flex flex-col justify-center gap-4 rounded-[28px] bg-white p-5 shadow-[0_10px_32px_rgba(20,60,20,0.08)] sm:p-6">
        <StepIndicator activeStep={1} />
        <div>
          <h1 className="text-[24px] font-bold leading-[1.25] text-[var(--foreground)]">
            Kamera siap
          </h1>
          <p className="mt-2 text-[16px] font-medium leading-[1.5] text-[var(--soil-gray)]">
            Arahkan kamera ke tomat dengan pencahayaan cukup agar estimasi kualitas lebih mudah
            dibaca.
          </p>
        </div>
        <PrimaryButton icon={<Camera className="h-5 w-5" />} onClick={onCapture}>
          Ambil Foto
        </PrimaryButton>
        <SecondaryButton icon={<X className="h-5 w-5" />} onClick={onClose}>
          Tutup Kamera
        </SecondaryButton>
      </div>
    </section>
  );
}

function PhotoSelectedScreen({
  imageReady,
  imageRef,
  marketLocation,
  marketPrice,
  photoName,
  photoUrl,
  quantityKg,
  onAnalyze,
  onCamera,
  onImageReady,
  onMarketLocationChange,
  onMarketPriceChange,
  onQuantityChange,
  onUpload,
}: {
  imageReady: boolean;
  imageRef: RefObject<HTMLImageElement | null>;
  marketLocation: string;
  marketPrice: string;
  photoName: string;
  photoUrl: string;
  quantityKg: string;
  onAnalyze: () => void;
  onCamera: () => void;
  onImageReady: () => void;
  onMarketLocationChange: (value: string) => void;
  onMarketPriceChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onUpload: () => void;
}) {
  return (
    <WorkspaceGrid
      left={
        <PhotoPanel
          imageRef={imageRef}
          photoName={photoName}
          photoUrl={photoUrl}
          onImageReady={onImageReady}
        />
      }
      right={
        <section className="flex flex-col gap-5 rounded-[28px] bg-white p-5 shadow-[0_10px_32px_rgba(20,60,20,0.09)] sm:p-6">
          <StepIndicator activeStep={1} />
          <div>
            <h1 className="text-[24px] font-bold leading-[1.25] text-[var(--foreground)]">
              Hitung harga wajar
            </h1>
            <p className="mt-2 text-[16px] font-medium leading-[1.5] text-[var(--soil-gray)]">
              Isi harga pasar dan jumlah beli agar rekomendasi tawar sesuai kebutuhan transaksi.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <SoftField
              label="Harga pasar hari ini"
              prefix="Rp"
              suffix="/kg"
              type="number"
              value={marketPrice}
              onChange={onMarketPriceChange}
            />
            <SoftField
              label="Estimasi jumlah beli"
              suffix="kg"
              type="number"
              value={quantityKg}
              onChange={onQuantityChange}
            />
            <div className="sm:col-span-2 lg:col-span-1">
              <SoftField
                label="Lokasi/pasar"
                value={marketLocation}
                onChange={onMarketLocationChange}
              />
            </div>
          </div>
          <PrimaryButton
            disabled={!imageReady}
            icon={<ArrowRight className="h-5 w-5" />}
            iconRight
            onClick={onAnalyze}
          >
            Hitung Harga Wajar
          </PrimaryButton>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <SecondaryButton icon={<ImageUp className="h-5 w-5" />} onClick={onUpload}>
              Ganti Foto
            </SecondaryButton>
            <SecondaryButton icon={<Camera className="h-5 w-5" />} onClick={onCamera}>
              Kamera Ulang
            </SecondaryButton>
          </div>
        </section>
      }
    />
  );
}

function PhotoPanel({
  imageRef,
  photoName,
  photoUrl,
  onImageReady,
}: {
  imageRef: RefObject<HTMLImageElement | null>;
  photoName: string;
  photoUrl: string;
  onImageReady: () => void;
}) {
  return (
    <section className="rounded-[28px] bg-white p-4 shadow-[0_10px_32px_rgba(20,60,20,0.09)] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <h2 className="text-[18px] font-bold leading-[1.3] text-[var(--foreground)]">
          Foto tomat
        </h2>
        <span className="max-w-[45%] truncate text-right text-[12px] font-medium text-[var(--muted-soil)]">
          {photoName}
        </span>
      </div>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[22px] bg-[var(--leaf-mist)] shadow-inner md:aspect-[16/11] lg:aspect-[4/3]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          alt="Foto tomat yang akan dianalisis kualitas visualnya"
          className="h-full w-full object-cover"
          src={photoUrl}
          onLoad={onImageReady}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/16 to-transparent" />
      </div>
    </section>
  );
}

function AnalysisScreen({ isLoadingModel, photoUrl }: { isLoadingModel: boolean; photoUrl: string }) {
  const activeIndex = isLoadingModel ? 1 : 2;
  return (
    <section className="grid min-h-[calc(100vh-130px)] items-center gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(340px,1fr)]">
      <div className="rounded-[28px] bg-white p-4 shadow-[0_10px_32px_rgba(20,60,20,0.08)]">
        <div className="aspect-[4/3] overflow-hidden rounded-[22px] bg-[var(--leaf-mist)] md:aspect-[16/11]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Foto tomat yang sedang dianalisis"
            className="h-full w-full object-cover"
            src={photoUrl}
          />
        </div>
      </div>
      <div className="relative flex flex-col items-center overflow-hidden rounded-[28px] bg-[var(--warm-white)] p-6 text-center shadow-[0_12px_28px_rgba(20,60,20,0.10)]">
        <div className="mb-6 flex h-32 w-32 items-center justify-center">
          <svg className="absolute h-32 w-32 text-[#e4eade]" viewBox="0 0 100 100">
            <circle className="fill-transparent stroke-current stroke-[6]" cx="50" cy="50" r="44" />
          </svg>
          <svg
            className="absolute h-32 w-32 -rotate-90 transform text-[var(--primary-container)] drop-shadow-md"
            viewBox="0 0 100 100"
          >
            <circle
              className="fill-transparent stroke-current stroke-[6] [animation:ring-fill_2.4s_ease-in-out_infinite_alternate]"
              cx="50"
              cy="50"
              r="44"
              strokeDasharray="276.46"
              strokeLinecap="round"
            />
          </svg>
          <LoaderCircle className="z-10 h-10 w-10 animate-spin text-[var(--primary-container)]" aria-hidden="true" />
        </div>

        <h1 className="mb-2 text-[24px] font-bold leading-[1.25] text-[var(--foreground)]">
          {isLoadingModel ? "Memuat Model AI" : "Menghitung Harga"}
        </h1>
        <p className="mb-6 max-w-[420px] text-[16px] font-medium leading-[1.5] text-[var(--muted-soil)]">
          {isLoadingModel
            ? "TaniCheck sedang menyiapkan model lokal di browser."
            : "TaniCheck sedang membaca kualitas visual dan menghitung harga wajar."}
        </p>

        <div className="flex w-full flex-col gap-2 text-left">
          {analysisSteps.map((step, index) => (
            <AnalysisStep
              key={step}
              active={index === activeIndex}
              completed={index < activeIndex}
              label={step}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ResultScreen({
  copied,
  copyFallbackOpen,
  imageRef,
  marketLocation,
  marketPrice,
  message,
  photoName,
  photoUrl,
  quantityKg,
  result,
  onCopy,
  onImageReady,
  onReset,
}: {
  copied: boolean;
  copyFallbackOpen: boolean;
  imageRef: RefObject<HTMLImageElement | null>;
  marketLocation: string;
  marketPrice: number;
  message: string;
  photoName: string;
  photoUrl: string;
  quantityKg: number;
  result: PriceResult;
  onCopy: () => void;
  onImageReady: () => void;
  onReset: () => void;
}) {
  return (
    <WorkspaceGrid
      left={
        <div className="flex flex-col gap-5">
          <PhotoPanel
            imageRef={imageRef}
            photoName={photoName}
            photoUrl={photoUrl}
            onImageReady={onImageReady}
          />
          <DisclaimerCard />
        </div>
      }
      right={
        <div className="flex flex-col gap-5">
          <StepIndicator activeStep={3} />
          <PriceRecommendationCard
            marketLocation={marketLocation}
            marketPrice={marketPrice}
            quantityKg={quantityKg}
            result={result}
          />
          <QualityResultCard result={result} />
          <BuyerMessageCard fallbackOpen={copyFallbackOpen} message={message} />
          <div className="grid gap-3 sm:grid-cols-2">
            <PrimaryButton icon={<Copy className="h-5 w-5" />} onClick={onCopy}>
              Copy Pesan
            </PrimaryButton>
            <SecondaryButton icon={<RefreshCw className="h-5 w-5" />} onClick={onReset}>
              Analisis Foto Lain
            </SecondaryButton>
          </div>
          {copied && (
            <p className="rounded-[18px] bg-[var(--leaf-mist)] p-3 text-center text-[13px] font-semibold text-[var(--primary-container)]">
              Pesan berhasil disalin.
            </p>
          )}
        </div>
      }
    />
  );
}

function QualityResultCard({ result }: { result: PriceResult }) {
  return (
    <section className="rounded-[28px] border border-[rgba(190,202,184,0.3)] bg-white p-5 shadow-[0_10px_28px_rgba(20,60,20,0.08)] sm:p-6">
      <header className="mb-5 flex items-center gap-4 border-b border-[#dfe4d8] pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--leaf-mist)] text-[var(--primary-container)]">
          <ShoppingBag className="h-7 w-7" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-[24px] font-bold leading-[1.25] text-[var(--foreground)]">
            Ringkasan Kualitas
          </h1>
          <p className="text-[12px] font-medium leading-[1.35] text-[var(--muted-soil)]">
            Estimasi berdasarkan kualitas visual
          </p>
        </div>
      </header>

      {result.topConfidence < 0.45 && <ConfidenceWarningCard />}
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <MetricCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Risiko Kualitas"
          value={result.riskLevel}
          tone={result.tone}
        />
        <MetricCard
          icon={<SearchCheck className="h-5 w-5" />}
          label="Prediksi AI"
          value={result.topLabel}
          suffix={formatPercent(result.topConfidence)}
          tone="success"
        />
      </div>
      <p className={["mb-5 rounded-[18px] p-4 text-[15px] font-semibold leading-[1.45]", toneSurfaceClass(result.tone), toneTextClass(result.tone)].join(" ")}>
        {result.riskText}
      </p>
      <ProbabilityList probabilities={result.probabilities} />
      <div className="mt-6">
        <GradeDistribution result={result} />
      </div>
      <div className="mt-6 rounded-[18px] bg-[var(--leaf-mist)] p-4">
        <h2 className="text-[18px] font-bold leading-[1.3] text-[var(--foreground)]">
          Alasan rekomendasi harga
        </h2>
        <p className="mt-2 text-[15px] font-medium leading-[1.5] text-[#3f4a3c]">
          {result.reason}
        </p>
      </div>
    </section>
  );
}

function WorkspaceGrid({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-start">
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}

function PriceRecommendationCard({
  marketLocation,
  marketPrice,
  quantityKg,
  result,
}: {
  marketLocation: string;
  marketPrice: number;
  quantityKg: number;
  result: PriceResult;
}) {
  return (
    <section className="rounded-[28px] bg-[var(--primary)] p-5 text-white shadow-[0_12px_28px_rgba(0,98,20,0.18)] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold leading-[1.35] text-[#bdffb3]">
            Harga wajar
          </p>
          <h1 className="mt-1 break-words text-[34px] font-bold leading-[1.08] sm:text-[42px]">
            {formatRupiah(result.fairPrice)}/kg
          </h1>
        </div>
        <div className="rounded-full bg-white/12 p-3">
          <Tag className="h-7 w-7" aria-hidden="true" />
        </div>
      </div>
      <div className="mb-5 rounded-[20px] bg-white/10 p-4 text-[13px] font-semibold leading-[1.5] text-[#e6ffe0]">
        Harga pasar acuan {formatRupiah(marketPrice)}/kg di {marketLocation}. Skor kualitas visual{" "}
        {formatPercent(result.qualityScore)}.
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <DarkMetric label="Rekomendasi tawar awal" value={`${formatRupiah(result.openingBid)}/kg`} />
        <DarkMetric label="Batas maksimal beli" value={`${formatRupiah(result.maxBuyPrice)}/kg`} />
      </div>
      <div className="mt-4 rounded-[20px] bg-white p-4 text-[var(--foreground)]">
        <p className="text-[12px] font-medium leading-[1.35] text-[var(--soil-gray)]">
          Estimasi total wajar untuk {quantityKg} kg
        </p>
        <p className="mt-1 text-[28px] font-bold leading-[1.1] text-[var(--primary-container)]">
          {formatRupiah(result.totalFairPrice)}
        </p>
        <p className="mt-2 text-[12px] font-medium leading-[1.35] text-[var(--soil-gray)]">
          Tawar awal total {formatRupiah(result.totalOpeningBid)} dan batas maksimal{" "}
          {formatRupiah(result.totalMaxBuyPrice)}
        </p>
      </div>
    </section>
  );
}

function DarkMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-white/12 p-4">
      <p className="text-[12px] font-semibold leading-[1.35] text-[#bdffb3]">{label}</p>
      <p className="mt-1 break-words text-[22px] font-bold leading-[1.12] text-white">{value}</p>
    </div>
  );
}

function ProbabilityList({ probabilities }: { probabilities: Record<PredictionLabel, number> }) {
  return (
    <div>
      <h3 className="mb-3 text-[13px] font-semibold uppercase leading-[1.35] tracking-[0.08em] text-[var(--soil-gray)]">
        Probabilitas AI
      </h3>
      <div className="grid gap-3">
        {labels.map((label) => {
          const tone: Tone = label === "Bagus" ? "success" : label === "Sedang" ? "warning" : "alert";
          return (
            <div key={label}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[13px] font-semibold leading-[1.35] text-[var(--soil-gray)]">
                  {label}
                </span>
                <span className={["text-[13px] font-bold leading-[1.35]", toneTextClass(tone)].join(" ")}>
                  {formatPercent(probabilities[label])}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--leaf-mist)]">
                <div
                  className={["h-full rounded-full", toneBarClass(tone)].join(" ")}
                  style={{ width: formatPercent(probabilities[label]) }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ErrorScreen({
  message,
  onBack,
  onReset,
  onUpload,
}: {
  message: string;
  onBack: () => void;
  onReset: () => void;
  onUpload: () => void;
}) {
  return (
    <div className="flex min-h-[calc(100vh-150px)] items-center justify-center">
      <section className="w-full max-w-[560px] rounded-[28px] border border-[#E9C9BA] bg-white p-6 text-center shadow-[0_10px_28px_rgba(20,60,20,0.08)]">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ripe-blush)] text-[var(--ripe-alert)]">
          <AlertTriangle className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 className="mb-2 text-[24px] font-bold leading-[1.25] text-[var(--foreground)]">
          Proses tertunda
        </h1>
        <p className="mb-6 text-[16px] font-medium leading-[1.5] text-[var(--soil-gray)]">
          {message}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <PrimaryButton icon={<ArrowRight className="h-5 w-5" />} onClick={onBack}>
            Coba Lagi
          </PrimaryButton>
          <SecondaryButton icon={<ImageUp className="h-5 w-5" />} onClick={onUpload}>
            Upload Foto
          </SecondaryButton>
          <SecondaryButton icon={<Home className="h-5 w-5" />} onClick={onReset}>
            Beranda
          </SecondaryButton>
        </div>
      </section>
    </div>
  );
}

function StepIndicator({ activeStep }: { activeStep: 1 | 2 | 3 }) {
  const steps = ["Foto", "Analisis", "Harga"];
  return (
    <div className="flex w-full items-center justify-between">
      {steps.map((step, index) => {
        const stepNumber = (index + 1) as 1 | 2 | 3;
        const isActive = activeStep === stepNumber;
        const isDone = activeStep > stepNumber;
        return (
          <div className="contents" key={step}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold shadow-sm",
                  isActive || isDone
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[#dfe4d8] text-[var(--muted-soil)]",
                ].join(" ")}
              >
                {isDone ? <Check className="h-4 w-4" aria-hidden="true" /> : stepNumber}
              </div>
              <span
                className={[
                  "text-[13px] font-semibold leading-[1.35]",
                  isActive || isDone ? "text-[var(--primary)]" : "text-[var(--muted-soil)]",
                ].join(" ")}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={[
                  "mx-2 h-0.5 flex-1",
                  activeStep > stepNumber ? "bg-[var(--primary)]" : "bg-[var(--outline-variant)]",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function AnalysisStep({
  active,
  completed,
  label,
}: {
  active: boolean;
  completed: boolean;
  label: string;
}) {
  if (completed) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-[var(--leaf-mist)] p-3">
        <CheckCircle2 className="h-6 w-6 fill-[var(--primary)] text-[var(--primary)]" aria-hidden="true" />
        <span className="text-[13px] font-semibold leading-[1.35] text-[#3f4a3c]">{label}</span>
      </div>
    );
  }

  if (active) {
    return (
      <div className="relative flex items-center gap-3 overflow-hidden rounded-xl border border-[rgba(0,98,20,0.2)] bg-[#f6fbef] p-3 shadow-sm">
        <div className="absolute inset-0 w-[200%] bg-gradient-to-r from-transparent via-[rgba(0,98,20,0.05)] to-transparent [animation:shimmer_2s_infinite]" />
        <LoaderCircle className="relative z-10 h-6 w-6 animate-spin text-[var(--primary)]" aria-hidden="true" />
        <span className="relative z-10 text-[13px] font-bold leading-[1.35] text-[var(--foreground)]">
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl p-3 opacity-60">
      <span className="h-3 w-3 rounded-full bg-[var(--muted-soil)]" />
      <span className="text-[13px] font-semibold leading-[1.35] text-[var(--muted-soil)]">
        {label}
      </span>
    </div>
  );
}

function SoftField({
  label,
  onChange,
  prefix,
  suffix,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="block rounded-[18px] border border-[rgba(190,202,184,0.45)] bg-[var(--leaf-mist)] px-4 py-3">
      <span className="block text-[12px] font-medium leading-[1.35] text-[var(--soil-gray)]">
        {label}
      </span>
      <span className="mt-1 flex min-h-[30px] items-center gap-2">
        {prefix && (
          <span className="text-[13px] font-semibold leading-[1.35] text-[var(--muted-soil)]">
            {prefix}
          </span>
        )}
        <input
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[16px] font-bold leading-[1.5] text-[var(--foreground)] outline-none"
          inputMode={type === "number" ? "decimal" : undefined}
          min={type === "number" ? 1 : undefined}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix && (
          <span className="text-[13px] font-semibold leading-[1.35] text-[var(--muted-soil)]">
            {suffix}
          </span>
        )}
      </span>
    </label>
  );
}

function PrimaryButton({
  children,
  disabled,
  icon,
  iconRight,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
  iconRight?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[18px] bg-gradient-to-b from-[#1E9A32] to-[var(--primary-container)] px-5 py-4 text-[17px] font-bold leading-[1.2] text-white shadow-[0_8px_18px_rgba(19,125,34,0.22)] transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55"
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {!iconRight && icon}
      <span className="min-w-0 break-words">{children}</span>
      {iconRight && icon}
    </button>
  );
}

function SecondaryButton({
  children,
  disabled,
  icon,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[18px] border-2 border-[var(--primary)] bg-[var(--warm-white)] px-5 py-4 text-[17px] font-bold leading-[1.2] text-[var(--primary)] transition-all hover:bg-[var(--leaf-mist)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {icon}
      <span className="min-w-0 break-words">{children}</span>
    </button>
  );
}

function MetricCard({
  icon,
  label,
  suffix,
  tone,
  value,
}: {
  icon: ReactNode;
  label: string;
  suffix?: string;
  tone: Tone;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-4 rounded-[18px] bg-[#F4F5F1] p-4">
      <div
        className={[
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          toneSurfaceClass(tone),
          toneTextClass(tone),
        ].join(" ")}
      >
        {icon}
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="text-[12px] font-medium leading-[1.35] text-[var(--soil-gray)]">
          {label}
        </span>
        <div className={["break-words text-[28px] font-bold leading-[1.1]", toneTextClass(tone)].join(" ")}>
          {value}{" "}
          {suffix && (
            <span className="text-[18px] font-medium leading-[1.45] text-[var(--foreground)]">
              {suffix}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function GradeDistribution({ result }: { result: PriceResult }) {
  const grades = [
    { label: "Grade A (Premium)", letter: "A", tone: "success" as Tone, value: result.gradeA },
    { label: "Grade B (Standar)", letter: "B", tone: "warning" as Tone, value: result.gradeB },
    { label: "Grade C (Perlu Diskon)", letter: "C", tone: "alert" as Tone, value: result.gradeC },
  ];

  return (
    <div>
      <h3 className="mb-3 text-[13px] font-semibold uppercase leading-[1.35] tracking-[0.08em] text-[var(--soil-gray)]">
        Estimasi Grade
      </h3>
      <div className="flex flex-col gap-3">
        {grades.map((grade) => (
          <div
            className={["flex items-center gap-4 rounded-xl p-3", toneSurfaceClass(grade.tone)].join(" ")}
            key={grade.letter}
          >
            <div
              className={[
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[18px] font-bold leading-[1.3] shadow-sm",
                toneTextClass(grade.tone),
              ].join(" ")}
            >
              {grade.letter}
            </div>
            <div className="min-w-0 flex-grow">
              <div className="mb-1 flex items-end justify-between gap-2">
                <span className="text-[16px] font-medium leading-[1.5] text-[#3f4a3c]">
                  {grade.label}
                </span>
                <span className={["text-[18px] font-bold leading-[1.3]", toneTextClass(grade.tone)].join(" ")}>
                  {grade.value}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white">
                <div
                  className={["h-full rounded-full", toneBarClass(grade.tone)].join(" ")}
                  style={{ width: `${grade.value}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BuyerMessageCard({
  fallbackOpen,
  message,
}: {
  fallbackOpen: boolean;
  message: string;
}) {
  return (
    <section className="rounded-[24px] border border-[rgba(190,202,184,0.2)] bg-white p-5 shadow-[0_6px_18px_rgba(20,60,20,0.06)]">
      <header className="mb-3 flex items-center gap-3">
        <Clipboard className="h-5 w-5 text-[var(--primary-container)]" aria-hidden="true" />
        <h2 className="text-[18px] font-bold leading-[1.3] text-[var(--foreground)]">
          Pesan Negosiasi
        </h2>
      </header>
      <p className="rounded-[18px] bg-[var(--leaf-mist)] p-4 text-[15px] font-medium leading-[1.5] text-[#3f4a3c]">
        {message}
      </p>
      <CopyFallbackTextArea fallbackOpen={fallbackOpen} message={message} />
    </section>
  );
}

function CopyFallbackTextArea({
  fallbackOpen,
  message,
}: {
  fallbackOpen: boolean;
  message: string;
}) {
  if (!fallbackOpen) return null;

  return (
    <div className="mt-3 rounded-[18px] border border-[#E8D6AE] bg-[var(--caution-mist)] p-3">
      <label className="block text-[13px] font-semibold leading-[1.35] text-[var(--amber-warning)]">
        Salin pesan dari kotak ini jika clipboard otomatis dibatasi browser.
      </label>
      <textarea
        className="mt-2 min-h-[132px] w-full resize-none rounded-[14px] border border-[#E8D6AE] bg-white p-3 text-[14px] font-medium leading-[1.45] text-[var(--foreground)] outline-none"
        readOnly
        value={message}
        onFocus={(event) => event.currentTarget.select()}
      />
    </div>
  );
}

function DisclaimerCard() {
  return (
    <p className="rounded-[18px] border border-[var(--border-soft)] bg-[#F4F5F1] p-3 text-center text-[12px] font-medium leading-[1.35] text-[var(--muted-soil)]">
      Harga pasar diisi manual dan rekomendasi harga hanya estimasi berdasarkan kualitas visual.
      Hasil AI perlu tetap dicek langsung sebelum transaksi.
    </p>
  );
}

function ConfidenceWarningCard() {
  return (
    <p className="mb-5 rounded-[18px] border border-[#E8D6AE] bg-[var(--caution-mist)] p-3 text-[13px] font-semibold leading-[1.35] text-[var(--amber-warning)]">
      Keyakinan model rendah. Foto mungkin kurang jelas atau objek bukan tomat.
    </p>
  );
}

function BottomNav({
  active,
  hasResult,
  onGoHome,
  onOpenUpload,
}: {
  active: NavState;
  hasResult: boolean;
  onGoHome: () => void;
  onOpenUpload: () => void;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[rgba(190,202,184,0.35)] bg-[#f6fbef]/94 px-3 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] backdrop-blur-md md:hidden">
      <div className="mx-auto grid max-w-[430px] grid-cols-3 gap-2">
        <BottomNavItem active={active === "home"} icon={<Home className="h-6 w-6" />} label="Beranda" onClick={onGoHome} />
        <BottomNavItem active={active === "analysis"} icon={<Camera className="h-6 w-6" />} label="Analisis" onClick={onOpenUpload} />
        <BottomNavItem
          active={active === "price"}
          disabled={!hasResult}
          icon={<Tag className="h-6 w-6" />}
          label="Harga"
          onClick={() => undefined}
        />
      </div>
    </nav>
  );
}

function BottomNavItem({
  active,
  disabled,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={[
        "flex min-h-[62px] flex-col items-center justify-center rounded-[22px] px-2 py-2 transition-all duration-200",
        active ? "bg-[var(--primary-container)] text-[#bdffb3]" : "text-[var(--muted-soil)]",
        disabled ? "cursor-not-allowed opacity-45" : "",
      ].join(" ")}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {icon}
      <span className="mt-1 text-[13px] font-semibold leading-[1.35]">{label}</span>
    </button>
  );
}

function buildPriceDecision(
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

function normalizeLabel(label: string): PredictionLabel | null {
  const lower = label.trim().toLowerCase();
  if (lower.includes("bagus")) return "Bagus";
  if (lower.includes("sedang")) return "Sedang";
  if (lower.includes("busuk")) return "Busuk";
  return null;
}

function validateImageFile(file: File) {
  if (!file.type.startsWith("image/")) {
    return "File bukan gambar. Pilih foto tomat dengan format gambar.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Ukuran foto terlalu besar. Gunakan gambar maksimal 8 MB.";
  }
  return null;
}

function validateInputs(marketPrice: string, quantityKg: string, marketLocation: string) {
  const price = Number(marketPrice);
  const quantity = Number(quantityKg);

  if (!marketPrice.trim() || Number.isNaN(price) || price <= 0) {
    return "Harga pasar hari ini harus diisi dengan angka lebih dari 0.";
  }
  if (price > 1000000) {
    return "Harga pasar terlalu besar. Periksa kembali harga per kilogram.";
  }
  if (!quantityKg.trim() || Number.isNaN(quantity) || quantity <= 0) {
    return "Estimasi jumlah beli harus diisi dengan angka lebih dari 0 kg.";
  }
  if (quantity > 100000) {
    return "Jumlah beli terlalu besar. Periksa kembali estimasi kilogram.";
  }
  if (!marketLocation.trim()) {
    return "Lokasi atau pasar perlu diisi sebagai konteks harga.";
  }
  return null;
}

function safePrice(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function safeQuantity(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function roundPrice(value: number) {
  const step = value >= 10000 ? 500 : 100;
  return Math.max(step, Math.round(value / step) * step);
}

function formatRupiah(value: number) {
  return `Rp${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function stripTrailingPeriod(value: string) {
  return value.trim().replace(/\.+$/u, "");
}

function toneSurfaceClass(tone: Tone) {
  if (tone === "success") return "bg-[var(--leaf-mist)]";
  if (tone === "warning") return "bg-[var(--caution-mist)]";
  return "bg-[var(--ripe-blush)]";
}

function toneTextClass(tone: Tone) {
  if (tone === "success") return "text-[var(--primary-container)]";
  if (tone === "warning") return "text-[var(--amber-warning)]";
  return "text-[var(--ripe-alert)]";
}

function toneBarClass(tone: Tone) {
  if (tone === "success") return "bg-[var(--primary-container)]";
  if (tone === "warning") return "bg-[var(--amber-warning)]";
  return "bg-[var(--ripe-alert)]";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function loadPredictionImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image failed to load for prediction"));
    image.src = src;
  });
}
