import { AlertTriangle, ArrowRight, Home, ImageUp } from "lucide-react";

import { PrimaryButton, SecondaryButton } from "./shared-ui";

export function ErrorScreen({
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
