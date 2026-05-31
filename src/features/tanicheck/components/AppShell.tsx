import type { ReactNode } from "react";

import type { NavState } from "../types";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";

export function AppShell({
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
