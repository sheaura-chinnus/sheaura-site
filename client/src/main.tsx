import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from 'next-themes'
import { App } from './App'
import { trpc } from './lib/trpc'
import './styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const trpcClient = trpc.createClient({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: '/trpc',
      headers() {
        const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/)
        const token = match ? decodeURIComponent(match[1]) : ''
        return {
          'x-csrf-token': token,
        }
      },
    }),
  ],
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <BrowserRouter>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <App />
            <Toaster position="bottom-right" />
          </ThemeProvider>
        </BrowserRouter>
      </trpc.Provider>
    </QueryClientProvider>
  </React.StrictMode>
)