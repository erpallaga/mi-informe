"use client";

import { useState } from "react";
import PageTitle from "@/components/shared/PageTitle";
import ProgressSection from "@/components/panel/ProgressSection";
import NewEntrySheet from "@/components/panel/NewEntrySheet";

export default function PanelPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <PageTitle title="Panel" />
      <ProgressSection key={refreshKey} />

      {/* FAB */}
      <button
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-24 right-6 z-30 w-14 h-14 bg-primary text-on-primary text-2xl font-light flex items-center justify-center shadow-ambient"
        aria-label="Nueva entrada"
      >
        +
      </button>

      <NewEntrySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </>
  );
}
