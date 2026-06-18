import { QueryClient } from "@tanstack/react-query";

// Single shared QueryClient for the dashboard SPA.
// Injected into the router context (see src/router.tsx) so route
// loaders can call `context.queryClient.ensureQueryData(...)`.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
