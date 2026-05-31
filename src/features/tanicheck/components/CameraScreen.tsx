import { Camera, X } from "lucide-react";
import type { RefObject } from "react";

import { PrimaryButton, SecondaryButton, StepIndicator } from "./shared-ui";

export function CameraScreen({
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
