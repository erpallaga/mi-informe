"use client";

import { useState } from "react";
import PageTitle from "@/components/shared/PageTitle";
import QuickEntryForm from "@/components/panel/QuickEntryForm";
import ProgressSection from "@/components/panel/ProgressSection";

export default function PanelPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <PageTitle title="Panel" />
      <ProgressSection key={refreshKey} />
      <div className="mt-8">
        <p className="mb-4 text-xs font-medium uppercase tracking-widest text-on-surface-variant">
          Nueva entrada
        </p>
        <QuickEntryForm onSuccess={() => setRefreshKey((k) => k + 1)} />
      </div>
    </>
  );
}
