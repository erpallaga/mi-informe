import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is reused across screens for a minute (Panel and Historial share
        // the service-year query), then refetched on mount / window focus. A
        // refetch never shows a skeleton: `isPending` is only true without data.
        staleTime: 60_000,
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  });
}
