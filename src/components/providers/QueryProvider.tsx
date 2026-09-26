"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/query/client";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // One client per browser session (per full page load: login/logout reload
  // the page, so no data survives between accounts).
  const [client] = useState(makeQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
