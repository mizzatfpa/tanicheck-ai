import { Check, CheckCircle2, LoaderCircle } from "lucide-react";
import type { ReactNode, RefObject } from "react";

import type { Tone } from "../types";

export function PhotoPanel({
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

export function WorkspaceGrid({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-start">
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}

export function StepIndicator({ activeStep }: { activeStep: 1 | 2 | 3 }) {
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

export function AnalysisStep({
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

export function SoftField({
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

export function PrimaryButton({
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

export function SecondaryButton({
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

export function MetricCard({
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

export function toneSurfaceClass(tone: Tone) {
  if (tone === "success") return "bg-[var(--leaf-mist)]";
  if (tone === "warning") return "bg-[var(--caution-mist)]";
  return "bg-[var(--ripe-blush)]";
}

export function toneTextClass(tone: Tone) {
  if (tone === "success") return "text-[var(--primary-container)]";
  if (tone === "warning") return "text-[var(--amber-warning)]";
  return "text-[var(--ripe-alert)]";
}

export function toneBarClass(tone: Tone) {
  if (tone === "success") return "bg-[var(--primary-container)]";
  if (tone === "warning") return "bg-[var(--amber-warning)]";
  return "bg-[var(--ripe-alert)]";
}
