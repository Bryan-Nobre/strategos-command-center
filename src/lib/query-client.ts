import { QueryClient } from "@tanstack/react-query";
import { isAuthError } from "@/lib/api-errors";

let browserQueryClient: QueryClient | undefined;

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: (failureCount, error) => {
          if (isAuthError(error)) return false;
          return failureCount < 2;
        },
      },
      mutations: {
        onError: (error) => {
          // Segurança real deve ser validada no backend/API.
          if (isAuthError(error) && typeof window !== "undefined") {
            window.location.href = "/login";
          }
        },
      },
    },
  });
}

export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    return createQueryClient();
  }

  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }

  return browserQueryClient;
}
