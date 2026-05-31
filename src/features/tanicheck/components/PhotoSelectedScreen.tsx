import { ArrowRight, Camera, ImageUp } from "lucide-react";
import type { RefObject } from "react";

import { PhotoPanel, PrimaryButton, SecondaryButton, SoftField, StepIndicator, WorkspaceGrid } from "./shared-ui";

export function PhotoSelectedScreen({
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
