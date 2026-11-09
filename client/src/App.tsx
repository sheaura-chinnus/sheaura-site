import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Page loader placeholder
function PageLoader() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="animate-spin h-8 w-8 rounded-full border-4 border-amber-600 border-t-transparent" />
    </div>
  )
}

// Critical public pages (loaded eagerly for instant LCP)
import { HomePage } from '@/pages/HomePage'
import { ShopPage } from '@/pages/ShopPage'
import { ProductDetailPage } from '@/pages/ProductDetailPage'
import { LoginPage } from '@/pages/LoginPage'

// Lazy-loaded public & policy pages
const EnquiryPage = lazy(() => import('@/pages/EnquiryPage').then(m => ({ default: m.EnquiryPage })))
const AboutPage = lazy(() => import('@/pages/AboutPage').then(m => ({ default: m.AboutPage })))
const ContactPage = lazy(() => import('@/pages/ContactPage').then(m => ({ default: m.ContactPage })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })))
const TermsPage = lazy(() => import('@/pages/TermsPage').then(m => ({ default: m.TermsPage })))
const ShippingPolicyPage = lazy(() => import('@/pages/ShippingPolicyPage').then(m => ({ default: m.ShippingPolicyPage })))
const PaymentPolicyPage = lazy(() => import('@/pages/PaymentPolicyPage').then(m => ({ default: m.PaymentPolicyPage })))
const RefundPolicyPage = lazy(() => import('@/pages/RefundPolicyPage').then(m => ({ default: m.RefundPolicyPage })))
const WarrantyPolicyPage = lazy(() => import('@/pages/WarrantyPolicyPage').then(m => ({ default: m.WarrantyPolicyPage })))
const AccountPolicyPage = lazy(() => import('@/pages/AccountPolicyPage').then(m => ({ default: m.AccountPolicyPage })))
const AccountPage = lazy(() => import('@/pages/AccountPage').then(m => ({ default: m.AccountPage })))
const StaffPortalPage = lazy(() => import('@/pages/StaffPortalPage').then(m => ({ default: m.StaffPortalPage })))

// Admin pages (lazy-loaded to keep public bundle light & secure)
import { AdminLayout } from '@/components/layout/AdminLayout'
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })))
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage').then(m => ({ default: m.AdminProductsPage })))
const AdminProductCreatePage = lazy(() => import('@/pages/admin/AdminProductCreatePage').then(m => ({ default: m.AdminProductCreatePage })))
const AdminProductEditPage = lazy(() => import('@/pages/admin/AdminProductEditPage').then(m => ({ default: m.AdminProductEditPage })))
const AdminCategoriesPage = lazy(() => import('@/pages/admin/AdminCategoriesPage').then(m => ({ default: m.AdminCategoriesPage })))
const AdminEnquiriesPage = lazy(() => import('@/pages/admin/AdminEnquiriesPage').then(m => ({ default: m.AdminEnquiriesPage })))
const AdminEnquiryDetailPage = lazy(() => import('@/pages/admin/AdminEnquiryDetailPage').then(m => ({ default: m.AdminEnquiryDetailPage })))
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })))
const AdminLogoMediaPage = lazy(() => import('@/pages/admin/AdminLogoMediaPage').then(m => ({ default: m.AdminLogoMediaPage })))
const AdminHomepageContentPage = lazy(() => import('@/pages/admin/AdminHomepageContentPage').then(m => ({ default: m.AdminHomepageContentPage })))
const AdminNavigationFooterPage = lazy(() => import('@/pages/admin/AdminNavigationFooterPage').then(m => ({ default: m.AdminNavigationFooterPage })))
const AdminPoliciesPage = lazy(() => import('@/pages/admin/AdminPoliciesPage').then(m => ({ default: m.AdminPoliciesPage })))
const AdminAuditLogsPage = lazy(() => import('@/pages/admin/AdminAuditLogsPage').then(m => ({ default: m.AdminAuditLogsPage })))
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })))

import { useAuth } from '@/hooks/useAuth'

function PublicLayout(): React.ReactElement {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pt-16"><Outlet /></main>
      <Footer />
    </div>
  )
}

export function AdminRouteGuard() {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-amber-600 border-t-transparent" />
      </div>
    )
  }

  // If not authenticated, redirect to dedicated staff portal
  if (!isAuthenticated) {
    return <Navigate to="/staff-portal" replace />
  }

  // If authenticated but not authorized staff/admin, redirect immediately to Home
  if (user?.role !== 'admin' && user?.role !== 'shop_order_receiver') {
    return <Navigate to="/" replace />
  }

  return <AdminLayout />
}

export function App() {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/rental-ornaments" element={<Navigate to="/shop" replace />} />
            <Route path="/product/:slug" element={<ProductDetailPage />} />
            <Route path="/enquiry" element={<EnquiryPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/rental-policy" element={<Navigate to="/shipping-policy" replace />} />
            <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
            <Route path="/payment-policy" element={<PaymentPolicyPage />} />
            <Route path="/refund-policy" element={<RefundPolicyPage />} />
            <Route path="/warranty-policy" element={<WarrantyPolicyPage />} />
            <Route path="/care-guide" element={<WarrantyPolicyPage />} />
            <Route path="/account-policy" element={<AccountPolicyPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/my-orders" element={<Navigate to="/account" replace />} />
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Dedicated Staff & Administrator Authentication Portal */}
          <Route path="/staff-portal" element={<StaffPortalPage />} />
          <Route path="/staff" element={<Navigate to="/staff-portal" replace />} />
          <Route path="/admin/login" element={<Navigate to="/staff-portal" replace />} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminRouteGuard />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="logo-media" element={<AdminLogoMediaPage />} />
            <Route path="homepage" element={<AdminHomepageContentPage />} />
            <Route path="navigation" element={<AdminNavigationFooterPage />} />
            <Route path="policies" element={<AdminPoliciesPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="products/create" element={<AdminProductCreatePage />} />
            <Route path="products/:id/edit" element={<AdminProductEditPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="enquiries" element={<AdminEnquiriesPage />} />
            <Route path="enquiries/:id" element={<AdminEnquiryDetailPage />} />
            <Route path="audit-logs" element={<AdminAuditLogsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}