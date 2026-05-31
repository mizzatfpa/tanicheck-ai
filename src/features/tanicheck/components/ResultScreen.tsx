import { AlertTriangle, Clipboard, Copy, RefreshCw, SearchCheck, ShoppingBag, Tag } from "lucide-react";
import type { RefObject } from "react";

import { labels } from "../constants";
import { formatPercent, formatRupiah } from "../lib/formatting";
import type { PredictionLabel, PriceResult, Tone } from "../types";
import {
  MetricCard,
  PhotoPanel,
  PrimaryButton,
  SecondaryButton,
  StepIndicator,
  WorkspaceGrid,
  toneBarClass,
  toneSurfaceClass,
  toneTextClass,
} from "./shared-ui";

export function ResultScreen({
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
