'use client';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from '@/store';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAppStore';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  useAuth();
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 min
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthInitializer>{children}</AuthInitializer>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(222 47% 11%)',
              color: 'hsl(213 31% 91%)',
              border: '1px solid hsl(216 34% 18%)',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: 'hsl(222 47% 11%)' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: 'hsl(222 47% 11%)' },
            },
          }}
        />
      </QueryClientProvider>
    </Provider>
  );
}
