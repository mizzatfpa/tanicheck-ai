import { Camera, Home, Tag } from "lucide-react";
import type { ReactNode } from "react";

import type { NavState } from "../types";

export function BottomNav({
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
