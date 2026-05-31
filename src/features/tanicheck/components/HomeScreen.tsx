import { Camera, ImageUp, LoaderCircle, SearchCheck, Sprout } from "lucide-react";

import { PrimaryButton, SecondaryButton } from "./shared-ui";

export function HomeScreen({
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
