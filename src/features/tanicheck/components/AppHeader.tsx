import { Camera, ImageUp, Leaf } from "lucide-react";
import type { ReactNode } from "react";

export function AppHeader({
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
