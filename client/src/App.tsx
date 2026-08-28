import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Public pages
import { HomePage } from '@/pages/HomePage'
import { ShopPage } from '@/pages/ShopPage'
import { ProductDetailPage } from '@/pages/ProductDetailPage'
import { EnquiryPage } from '@/pages/EnquiryPage'
import { AboutPage } from '@/pages/AboutPage'
import { ContactPage } from '@/pages/ContactPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PrivacyPage } from '@/pages/PrivacyPage'
import { TermsPage } from '@/pages/TermsPage'
import { ShippingPolicyPage } from '@/pages/ShippingPolicyPage'
import { PaymentPolicyPage } from '@/pages/PaymentPolicyPage'
import { RefundPolicyPage } from '@/pages/RefundPolicyPage'
import { WarrantyPolicyPage } from '@/pages/WarrantyPolicyPage'
import { AccountPolicyPage } from '@/pages/AccountPolicyPage'
import { AccountPage } from '@/pages/AccountPage'
import { LoginPage } from '@/pages/LoginPage'
import { StaffPortalPage } from '@/pages/StaffPortalPage'

// Admin pages
import { AdminLayout } from '@/components/layout/AdminLayout'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminProductsPage } from '@/pages/admin/AdminProductsPage'
import { AdminProductCreatePage } from '@/pages/admin/AdminProductCreatePage'
import { AdminProductEditPage } from '@/pages/admin/AdminProductEditPage'
import { AdminCategoriesPage } from '@/pages/admin/AdminCategoriesPage'
import { AdminEnquiriesPage } from '@/pages/admin/AdminEnquiriesPage'
import { AdminEnquiryDetailPage } from '@/pages/admin/AdminEnquiryDetailPage'
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage'
import { AdminLogoMediaPage } from '@/pages/admin/AdminLogoMediaPage'
import { AdminHomepageContentPage } from '@/pages/admin/AdminHomepageContentPage'
import { AdminNavigationFooterPage } from '@/pages/admin/AdminNavigationFooterPage'
import { AdminPoliciesPage } from '@/pages/admin/AdminPoliciesPage'
import { AdminAuditLogsPage } from '@/pages/admin/AdminAuditLogsPage'

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

function AdminRoute() {
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

  // If authenticated but not staff role, show 404 Not Found
  if (user?.role !== 'admin' && user?.role !== 'shop_order_receiver') {
    return <NotFoundPage />
  }

  return <AdminLayout />
}

export function App() {
  return (
    <ErrorBoundary>
      <ScrollToTop />
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
        <Route path="/admin" element={<AdminRoute />}>
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
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  )
}