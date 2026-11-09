import { lazy } from 'react'
import { createBrowserRouter, Navigate, RouterProvider, type RouteObject } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { FEATURES } from './config/env'
import { Layout } from './layout/Layout'
import ForecastPage from './pages/ForecastPage'
import HomePage from './pages/HomePage'

// Fórum e fotos carregam sob demanda: a previsão abre mais rápido.
const ForumPage = lazy(() => import('./pages/forum/ForumPage'))
const ThreadPage = lazy(() => import('./pages/forum/ThreadPage'))
const PhotosPage = lazy(() => import('./pages/photos/PhotosPage'))
const SessionPage = lazy(() => import('./pages/photos/SessionPage'))
const SellPage = lazy(() => import('./pages/photos/SellPage'))
const PurchasesPage = lazy(() => import('./pages/photos/PurchasesPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))

// Rotas desligadas no ambiente (ex.: fórum e fotos em produção) nem entram no roteador.
const routes: RouteObject[] = [
  { index: true, element: <HomePage /> },
  { path: 'pico/:id', element: <ForecastPage /> },
  { path: 'privacidade', element: <PrivacyPage /> },
  ...(FEATURES.forum
    ? [
        { path: 'forum', element: <ForumPage /> },
        { path: 'forum/:id', element: <ThreadPage /> },
      ]
    : []),
  ...(FEATURES.photos
    ? [
        { path: 'fotos', element: <PhotosPage /> },
        { path: 'fotos/sessao/:id', element: <SessionPage /> },
        { path: 'fotos/vender', element: <SellPage /> },
        { path: 'fotos/compras', element: <PurchasesPage /> },
      ]
    : []),
  // qualquer outro endereço volta para a previsão
  { path: '*', element: <Navigate to="/" replace /> },
]

const router = createBrowserRouter([{ element: <Layout />, children: routes }])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
