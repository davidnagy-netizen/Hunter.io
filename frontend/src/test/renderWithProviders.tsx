import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router";

/**
 * Test-only render wrapper: a fresh `QueryClient` per test (no retries, no
 * caching between tests) plus a `MemoryRouter` for components that use
 * `react-router` hooks/components. Feature tests that need React Query or
 * routing should use this instead of RTL's bare `render`.
 */
export function renderWithProviders(
  ui: ReactElement,
  { route = "/", queryClient = createTestQueryClient() }: { route?: string; queryClient?: QueryClient } = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }

  return { queryClient, ...render(ui, { wrapper: Wrapper }) };
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
}
