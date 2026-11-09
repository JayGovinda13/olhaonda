import { lazy } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { Layout } from './layout/Layout'
import ForecastPage from './pages/ForecastPage'

// Fórum e fotos carregam sob demanda: a previsão abre mais rápido.
const ForumPage = lazy(() => import('./pages/forum/ForumPage'))
const ThreadPage = lazy(() => import('./pages/forum/ThreadPage'))
const PhotosPage = lazy(() => import('./pages/photos/PhotosPage'))
const SessionPage = lazy(() => import('./pages/photos/SessionPage'))
const SellPage = lazy(() => import('./pages/photos/SellPage'))
const PurchasesPage = lazy(() => import('./pages/photos/PurchasesPage'))

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <ForecastPage /> },
      { path: 'forum', element: <ForumPage /> },
      { path: 'forum/:id', element: <ThreadPage /> },
      { path: 'fotos', element: <PhotosPage /> },
      { path: 'fotos/sessao/:id', element: <SessionPage /> },
      { path: 'fotos/vender', element: <SellPage /> },
      { path: 'fotos/compras', element: <PurchasesPage /> },
      { path: '*', element: <ForecastPage /> },
    ],
  },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
