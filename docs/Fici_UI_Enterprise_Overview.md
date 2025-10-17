# Fici UI – Enterprise Overview and Page Catalog (v1.0)

Last updated: 2025-10-15

## Table of Contents
- [Executive Summary](#executive-summary)
- [System Overview](#system-overview)
- [Architecture & Routing](#architecture--routing)
- [Page Catalog](#page-catalog)
- [Key User Journeys](#key-user-journeys)
- [Data Model Overview](#data-model-overview)
- [Security & Access Control](#security--access-control)
- [Operational Excellence](#operational-excellence)
- [Admin Operations (Order Management)](#admin-operations-order-management)
- [Update & Maintenance Guidelines](#update--maintenance-guidelines)
- [Risks & Mitigations](#risks--mitigations)
- [Glossary](#glossary)
- [Appendix A – Route-to-File Mapping](#appendix-a--route-to-file-mapping)
- [Appendix B – Order Status Definitions](#appendix-b--order-status-definitions)

---

## Executive Summary
Fici UI is a React + TypeScript single-page e-commerce application backed by Supabase (PostgreSQL + Auth + Storage). The app serves both consumers (browsing, cart, checkout, order tracking) and internal users (admin operations for order management). This document provides a stakeholder-friendly overview of pages, user journeys, data model, security, and operational practices to support decision-making, onboarding, and future enhancements.

---

## System Overview
- Frontend: React (TypeScript), React Router, Suspense-based code splitting, Zustand (state), TailwindCSS-like utilities, lucide-react icons.
- Backend: Supabase (Postgres, Auth, RLS policies, Storage).
- SEO & Analytics: `react-helmet-async` via `HelmetProvider` and `SEOHead`.
- UX: Async loading with `FiciLoader`, `ErrorBoundary`, `ScrollToTop`, and `FloatingWhatsApp` for support.

Key components:
- `src/App.tsx` (routing and bootstrapping)
- `component/Header`, `component/Footer`
- `@lib/components/SEOHead`
- `@auth/ProtectedRoute`
- `src/features/...` per domain

---

## Architecture & Routing

### Application Shell
- `App.tsx` wraps the app with `HelmetProvider`, `Router`, `ScrollToTop`, `ErrorBoundary`, global `Header` and `Footer`, `Suspense` fallback loader (`FiciLoader`) and `FloatingWhatsApp`.

### Route Map (from `src/App.tsx`)
- `/` → `@features/home/HomePage`
- `/contact` → `@features/contact/ContactPage`
- `/cart` → `@features/cart/CartPage`
- `/about` → `@features/about/AboutPage`
- `/auth/signin` → `@auth/components/SignIn`
- `/auth/signup` → `@auth/components/Register`
- `/auth/callback` → `@auth/components/AuthCallback`
- `/auth/forgot-password` → `@auth/components/ForgotPassword`
- `/auth/reset-password` → `@auth/components/ResetPassword`
- `/profile` → `@features/profile/ProfilePage` (Protected)
- `/admin` → `@features/admin/AdminPanel.refactored` (Protected)
- `/products` → `@features/product/ProductPage`
- `/products/:article_id` → `@features/product/components/ProductDetailPage`
- `/shoe-care` → `@features/shoe-care/ShoeCarePage`
- `/wishlist` → `@features/wishlist/WishlistPage`
- `/privacy` → `@features/policy/PrivacyPolicy`
- `/terms` → `@features/policy/TermsOfService`
- `/shipping` → `@features/policy/ShippingReturnsPolicy`
- `/orders` → `@features/orders/OrderHistoryPage`
- `/orders/:orderId` → `@features/orders/OrderDetailsPage` (Registered)
- `/guest/orders` → `@features/orders/GuestOrderLookup`
- `/guest/orders/:orderId` → `@features/orders/OrderDetailsPage` (Guest)
- `/checkout` → `@features/checkout/CheckoutPage` (with custom `ErrorBoundary` fallback)
- `*` → `@features/error/NotFoundPage`

---

## Page Catalog

- **Home (`/`)**
  - Brand entry, featured products, discovery.
  - KPIs: CTR to PDP, add-to-cart rate.

- **Products (`/products`)**
  - Catalogue listing, filters, sorting.
  - KPIs: PDP click-through, filter usage.

- **Product Details (`/products/:article_id`)**
  - Detailed product info, variants, price/stock.
  - Actions: add to cart, wishlist.
  - KPIs: add-to-cart conversion, wishlist adds.

- **Cart (`/cart`)**
  - Review items, quantities, removal.
  - KPI: checkout initiations, cart abandonment.

- **Checkout (`/checkout`)**
  - Shipping details, payment selection, order summary.
  - KPI: conversion, payment success rate.

- **Auth (`/auth/...`)**
  - Sign in, sign up, password, callback flows.
  - KPI: registration rate, error rate.

- **Profile (`/profile`) [Protected]**
  - Account details, saved addresses, order shortcuts.

- **Wishlist (`/wishlist`)**
  - Saved items.
  - KPI: wishlist → cart transitions.

- **Shoe Care (`/shoe-care`)**
  - Content/accessories; AOV driver.

- **Policies (`/privacy`, `/terms`, `/shipping`)**
  - Compliance and trust.

- **Orders – History (`/orders`)**
  - Registered user’s orders.

- **Orders – Details (Registered) (`/orders/:orderId`)**
  - Item-level statuses, tracking, cancel/return.

- **Guest Orders – Lookup (`/guest/orders`)**
  - Self-service for guests (email/TPIN as applicable).

- **Orders – Details (Guest) (`/guest/orders/:orderId`)**
  - Same, scoped by guest session.

- **Admin Panel (`/admin`) [Protected]**
  - Backoffice ops: ship/deliver/refund/cancel at item level, bulk actions, tracking, returns management.

- **Contact (`/contact`), About (`/about`)**
  - Brand and support funnels.

- **Not Found (`*`)**
  - Graceful invalid route handling.

---

## Key User Journeys
- Browse → PDP → Cart → Checkout → Confirmation
- Post-purchase tracking (Registered/Guest)
- Returns/Refunds from item level with admin workflow

---

## Data Model Overview

- `orders`
  - Status: `pending`, `paid`, `shipped`, `delivered`, `cancelled`, `partially_delivered`, `partially_cancelled`, `partially_refunded`
  - Payment: `payment_status`, `payment_method`
  - Guest fields: `order_type`, `guest_session_id`, guest contact
  - Tracking: `shipping_partner`, `tracking_id`, `tracking_url` + timestamps
  - Governance: `updated_by`, `order_status`, `comments`

- `order_items`
  - Item lifecycle: `item_status` (`pending`, `shipped`, `delivered`, `cancelled`, `returned`, `refunded`)
  - Reasons/amounts: `cancel_reason`, `return_reason`, `refund_amount`, timestamps
  - Product snapshot: `product_name`, `product_thumbnail_url`, `size`, `color`, `quantity`, `price_at_purchase`, `mrp`

- Aggregate logic (order status derived from item statuses).

---

## Security & Access Control
- Frontend protected routes via `ProtectedRoute`.
- Supabase RLS restricts reads/writes by user or guest session; separate admin policies for broad access.
- Item updates scoped by both `order_id` and `order_item_id`.

---

## Operational Excellence
- Resilience: `ErrorBoundary` wrappers, friendly fallbacks.
- Performance: Route-level code splitting via `React.lazy` and `Suspense`.
- SEO: `HelmetProvider` + `SEOHead`.
- Observability: Console logs; recommend adding Sentry/GA4.

---

## Admin Operations (Order Management)
- Item-level actions: Ship, Deliver, Cancel, Refund; bulk actions.
- Tracking details: `shipping_partner`, `tracking_id`, `tracking_url`.
- Recalculate aggregate order status after every item update.

---

## Update & Maintenance Guidelines
- New page: create under `src/features/<domain>/`, lazy-import in `App.tsx`, add `<Route/>`, update SEO.
- Data flows: update Zustand stores and `src/types/`, ensure RLS and migrations align.
- Documentation: keep this file under `docs/` and update Route Map, Page Catalog, and Data Model upon changes.

---

## Risks & Mitigations
- RLS misconfig → zero-row updates. Mitigate with admin/user/guest policies for both `orders` and `order_items`.
- Partial updates → out-of-sync status. Always recalc and persist aggregate order status.
- Mixed states confusion. Use clear item-level badges and summaries.

---

## Glossary
- PDP: Product Detail Page.
- RLS: Row Level Security.
- SLA: Service Level Agreement.

---

## Appendix A – Route-to-File Mapping
- `/` → `@features/home/HomePage`
- `/products` → `@features/product/ProductPage`
- `/products/:article_id` → `@features/product/components/ProductDetailPage`
- `/cart` → `@features/cart/CartPage`
- `/checkout` → `@features/checkout/CheckoutPage`
- `/orders` → `@features/orders/OrderHistoryPage`
- `/orders/:orderId` → `@features/orders/OrderDetailsPage`
- `/guest/orders` → `@features/orders/GuestOrderLookup`
- `/guest/orders/:orderId` → `@features/orders/OrderDetailsPage` (guest)
- `/profile` → `@features/profile/ProfilePage` (Protected)
- `/admin` → `@features/admin/AdminPanel.refactored` (Protected)
- `/wishlist` → `@features/wishlist/WishlistPage`
- `/shoe-care` → `@features/shoe-care/ShoeCarePage`
- `/contact` → `@features/contact/ContactPage`
- `/about` → `@features/about/AboutPage`
- Policies → `@features/policy/*`
- Errors → `@features/error/NotFoundPage`

---

## Appendix B – Order Status Definitions
- Order.status: `pending`, `paid`, `shipped`, `delivered`, `cancelled`, `partially_delivered`, `partially_cancelled`, `partially_refunded`
- OrderItems.item_status: `pending`, `shipped`, `delivered`, `cancelled`, `returned`, `refunded`
