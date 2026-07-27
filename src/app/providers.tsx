import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

// Pulls in three.js (~1MB+); split into its own chunk (SPEC.md §10.4).
const Background = lazy(() => import('@/components/Background').then((m) => ({ default: m.Background })));

const queryClient = new QueryClient();

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={null}>
          <Background />
        </Suspense>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}
