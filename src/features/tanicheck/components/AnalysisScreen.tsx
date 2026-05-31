import { LoaderCircle } from "lucide-react";

import { analysisSteps } from "../constants";
import { AnalysisStep } from "./shared-ui";

export function AnalysisScreen({ isLoadingModel, photoUrl }: { isLoadingModel: boolean; photoUrl: string }) {
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
