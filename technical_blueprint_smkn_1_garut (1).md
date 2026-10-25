# CETAK BIRU TEKNIS & ARSITEKTUR SISTEM (REACT + SUPABASE + VERCEL STACK)
## Ekosistem Digital SMKN 1 Garut (Jabar Juara Lahir Batin)

---

## 1. PRD (Product Requirements Document)

### 1.1 Background & Context
SMKN 1 Garut merupakan salah satu Sekolah Menengah Kejuruan unggulan di Jawa Barat. Untuk mewujudkan visi *"Terwujudnya Sekolah Kejuruan juara lahir dan bathin dengan inovasi dan kolaborasi untuk terbentuknya lulusan yang berakhlak mulia, kompeten, mampu beradaptasi, berjiwa entrepreneur, berprilaku hidup bersih dan sehat serta peduli lingkungan"*, dibutuhkan platform digital terpadu yang dapat diakses secara cepat, responsif, dan scalable.

Arsitektur sistem dibangun di atas SPA (Single Page Application) modern berbasis **React (Vite)**, **Vercel Platform**, dan backend-as-a-service **Supabase** untuk memfasilitasi:
1. **Pendidikan Berbasis Karakter & Jabar Masagi**: Modul pencatatan & pembiasaan karakter (akhlak mulia, hidup bersih, peduli lingkungan) dengan penyimpanan bukti foto real-time di Supabase Storage.
2. **Teaching Factory (TeFa) Storefront**: Hub komersialisasi produk dan jasa hasil karya siswa & unit usaha sekolah untuk melatih jiwa *entrepreneurship*.
3. **Link and Match DUDIKA Hub**: Platform kolaborasi industri, lowongan magang/kerja (BKK), serta submit portofolio siswa dengan proteksi Row Level Security (RLS).
4. **Portal Informasi & Layanan Publik**: Portal informasi interaktif berkecepatan tinggi memanfaatkan React Router dan Vercel CDN.

### 1.2 Project Objectives
* **Awwwards-Grade User Experience**: Tampilan visual kelas dunia (*Avant-Garde Vanguard UI*) yang modern, elegan, dan estetik untuk merepresentasikan sekolah kejuruan digital percontohan.
* **Performa & Responsivitas High-Speed**: Skor Google PageSpeed Insights $> 90$ pada Mobile & Desktop dengan *client-side caching* & Vercel Edge Network CDN.
* **Monetisasi TeFa**: Katalog interaktif produk/jasa TeFa SMKN 1 Garut dengan integrasi langsung ke WhatsApp Business Center.
* **Penyerapan Lulusan (Tracer & DUDIKA)**: Memfasilitasi proses pelamaran magang/kerja hingga $85\%$ penyerapan lulusan ke DUDIKA partner.
* **Digitalisasi Karakter**: Sistem logging akuntabel berbasis pembiasaan Jabar Masagi (Surti, Harti, Bukti, Bakti).

### 1.3 User Personas
1. **Calon Siswa & Pengunjung Umum**: Mengakses berita, profile jurusan, prestasi, dan informasi PPDB secara cepat.
2. **Siswa SMKN 1 Garut**: Mengakses portal, mengunggah bukti jurnal karakter harian, memantau poin Masagi, dan melamar lowongan DUDIKA.
3. **Mitra Industri (DUDIKA)**: Mempublikasikan info lowongan magang/kerja dan meninjau portofolio digital siswa.
4. **Guru / Pembimbing Karakter & TeFa**: Memverifikasi poin karakter siswa, mengelola produk TeFa, dan memantau lamaran siswa.
5. **Administrator Sekolah**: Mengelola konten portal, manajemen pengguna via Supabase Auth, dan analitik ekosistem.

### 1.4 Core Scope (In-Scope vs Out-of-Scope)

#### In-Scope Modules
* **Portal Publik Modern (React + Vite + Tailwind CSS + Framer Motion)**: Hero section interaktif, profil jurusan, berita/agenda, dan showcase prestasi.
* **TeFa E-Commerce Showcase**: Katalog produk/jasa reaktif, filter instan, dan checkout payload WhatsApp API.
* **DUDIKA Kemitraan & BKK Portal**: Manajemen lowongan kerja/magang, submit CV/portofolio PDF (Supabase Storage), dan peninjauan berkas.
* **Karakter Masagi Tracker**: Modul pencatatan poin kebersihan & ibadah siswa, verifikasi guru, dan Leaderboard statistik.
* **Dashboard Management (Shadcn UI / Lucide React)**: Control panel reaktif untuk admin dan instruktur berbasis React State & Supabase Client.

#### Out-of-Scope (Fase 1)
* Payment Gateway otomatis Midtrans/Xendit (diganti dengan invoice generator & direct link WhatsApp Business).
* Real-time video conferencing (menggunakan integrasi link Google Meet / Zoom).

### 1.5 Key Performance Indicators (KPIs)
* **Performance**: First Contentful Paint (FCP) $\le 1.0$ detik di jaringan 4G.
* **Security**: Zero leaks pada data siswa dengan penerapan $100\%$ Supabase Row Level Security (RLS) Policies.
* **Operational**: $100\%$ produk TeFa terdaftar secara digital dan dapat diorder instan via WhatsApp Gateway.

---

## 2. SRS (Software Requirements Specification)

### 2.1 Functional Requirements

| ID | Modul | Deskripsi Fungsi | User / Role |
| :--- | :--- | :--- | :--- |
| **FR-01** | Content Portal | Sistem menampilkan profil jurusan, visi-misi, berita, dan pengumuman secara reaktif. | Pengunjung, Siswa |
| **FR-02** | TeFa Catalog | Directori interaktif produk/jasa TeFa lengkap dengan varian harga, stok, dan generator checkout WhatsApp. | Umum, Siswa, Guru |
| **FR-03** | DUDIKA Matching | Industri memposting lowongan; siswa mengunggah CV ke Supabase Bucket dan mengajukan lamaran. | DUDIKA, Siswa |
| **FR-04** | Karakter Masagi | Siswa mengunggah foto kegiatan harian ke Supabase Storage, Guru mereview dan memberikan poin. | Siswa, Guru |
| **FR-05** | Auth & Security | Autentikasi terpusat berbasis Supabase Auth (Email/Password & Magic Link) dengan Role-Based Access Control (RBAC). | All Roles |

### 2.2 Non-Functional Requirements
1. **Performance & Infrastructure**:
   * Deploy SPA via Vercel Network untuk latensi $\le 50\text{ms}$ di wilayah Indonesia.
   * Supabase Client SDK dengan persistent session storage & auto-refresh token JWT.
2. **Security & Data Protection**:
   * Enforced Row Level Security (RLS) pada seluruh tabel PostgreSQL Supabase.
   * Encrypted File Storage untuk CV dan dokumen sensitif siswa.
   * Strict TypeScript Type Safety dari Supabase generated types.
3. **PWA & Mobile Responsiveness**:
   * Design Mobile-First dengan viewport adaptif (`100dvh`).
   * Service worker PWA untuk caching halaman static offline.

### 2.3 User Stories & Acceptance Criteria

#### User Story US-01: Upload Jurnal Karakter Masagi
* **As a** Siswa SMKN 1 Garut,
* **I want to** mengunggah foto bukti kegiatan kebersihan/ibadah harian melalui HP,
* **So that** saya mendapatkan akumulasi poin karakter Jabar Masagi dari Guru Pembimbing.

```gherkin
Feature: Pencatatan Jurnal Karakter Masagi
  Scenario: Siswa berhasil mengirimkan jurnal aktivitas harian
    Given Siswa telah terautentikasi melalui Supabase Auth
    When Siswa membuka form "Tambah Jurnal Masagi"
    And Siswa memilih kategori "PEDULI_LINGKUNGAN"
    And Siswa mengambil foto bukti kegiatan dan mengisi deskripsi
    And Siswa menekan tombol "Kirim Jurnal"
    Then Sistem mengunggah foto ke Supabase Bucket "masagi-proofs"
    And Sistem menyisipkan record baru ke tabel "masagi_character_logs" dengan status "PENDING"
    And Siswa melihat indikator "Menunggu Verifikasi Guru" pada dashboard
```

---

## 3. SDD (Software Design Description)

### 3.1 System Architecture

Sistem memanfaatkan arsitektur **Client-Side Rendering (SPA)** modern berbasis **React + Vite** yang dideploy pada **Vercel Network**, berkomunikasi secara langsung dengan **Supabase Backend Services** menggunakan OOP Repository/Service pattern.

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                      |
|    Browsers / PWA (React 18/19 + Vite + Tailwind CSS v4 + Framer Motion)         |
|    - React Router v6/v7 (SPA Client Routing)                                      |
|    - TanStack React Query (State Management & Cache Layer)                       |
+-----------------------------------------------------------------------------------+
                                         |
                                         v (HTTPS / Supabase Client SDK)
+-----------------------------------------------------------------------------------+
|                              SUPABASE BACKEND CLOUD                               |
|                                                                                   |
|  +-----------------------+ +-----------------------+ +-------------------------+  |
|  | Supabase Auth (JWT)   | | PostgreSQL + RLS      | | Supabase Storage        |  |
|  +-----------------------+ +-----------------------+ +-------------------------+  |
|  | Role-Based Policies   | | Realtime Subscriptions| | CDN Asset Hosting       |  |
|  +-----------------------+ +-----------------------+ +-------------------------+  |
+-----------------------------------------------------------------------------------+
```

### 3.2 Database Schema & Supabase SQL Migrations (Production-Grade DDL + RLS)

Berikut adalah berkas eksekusi SQL Migration lengkap yang siap di-run pada Supabase SQL Editor.

```sql
-- ============================================================================
-- EKOSISTEM DIGITAL SMKN 1 GARUT - SUPABASE SCHEMA MIGRATION
-- ============================================================================

-- 1. ENUMS SETUP
CREATE TYPE user_role AS ENUM ('STUDENT', 'TEACHER', 'DUDIKA_PARTNER', 'ADMIN');
CREATE TYPE mou_status_type AS ENUM ('ACTIVE', 'EXPIRED', 'PENDING');
CREATE TYPE tefa_type AS ENUM ('PRODUCT', 'SERVICE');
CREATE TYPE masagi_category AS ENUM ('AKHLAK_MULIA', 'HIDUP_BERSIH', 'PEDULI_LINGKUNGAN', 'ENTREPRENEUR');
CREATE TYPE verification_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- 2. USER PROFILES TABLE (Extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    role user_role NOT NULL DEFAULT 'STUDENT',
    nisn_or_nip VARCHAR(50) UNIQUE,
    phone_number VARCHAR(30),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. DEPARTMENTS TABLE (Jurusan SMKN 1 Garut)
CREATE TABLE public.departments (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    icon_path TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. DUDIKA PARTNERS TABLE
CREATE TABLE public.dudika_partners (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL,
    slug VARCHAR(170) UNIQUE NOT NULL,
    industry_sector VARCHAR(100) NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    contact_email VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(30) NOT NULL,
    address TEXT NOT NULL,
    mou_status mou_status_type NOT NULL DEFAULT 'PENDING',
    mou_start_date DATE,
    mou_end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TEFA PRODUCTS TABLE
CREATE TABLE public.tefa_products (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    department_id BIGINT NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(170) UNIQUE NOT NULL,
    type tefa_type NOT NULL DEFAULT 'PRODUCT',
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    specifications JSONB DEFAULT '{}'::jsonb,
    image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. MASAGI CHARACTER LOGS TABLE
CREATE TABLE public.masagi_character_logs (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category masagi_category NOT NULL,
    title VARCHAR(150) NOT NULL,
    activity_description TEXT NOT NULL,
    proof_image_url TEXT NOT NULL,
    points_earned INT NOT NULL DEFAULT 10,
    status verification_status NOT NULL DEFAULT 'PENDING',
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR OPTIMAL QUERY PERFORMANCE
CREATE INDEX idx_departments_active_slug ON public.departments(is_active, slug);
CREATE INDEX idx_tefa_dept_available ON public.tefa_products(department_id, is_available, is_featured);
CREATE INDEX idx_masagi_user_status ON public.masagi_character_logs(user_id, status);
CREATE INDEX idx_dudika_mou_sector ON public.dudika_partners(mou_status, industry_sector);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dudika_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tefa_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.masagi_character_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles, but edit only their own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update short profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Departments & TeFa: Publicly readable by everyone
CREATE POLICY "Departments are public" ON public.departments FOR SELECT USING (true);
CREATE POLICY "TeFa Products are public" ON public.tefa_products FOR SELECT USING (true);

-- Masagi Logs: Students view/insert own, Teachers view/update all
CREATE POLICY "Students see own masagi logs" ON public.masagi_character_logs 
    FOR SELECT USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('TEACHER', 'ADMIN')
    ));

CREATE POLICY "Students can insert own masagi logs" ON public.masagi_character_logs 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Teachers can verify masagi logs" ON public.masagi_character_logs 
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('TEACHER', 'ADMIN')
    ));
```

### 3.3 React OOP Service Layer Architecture

Sistem menggunakan pola **Object-Oriented Service Repository Pattern** di frontend React untuk memastikan enkapsulasi logika bisnis yang rapi, *testable*, dan *reusable*.

#### 1. Contract / Interface Definition (`src/types/masagi.ts`)
```typescript
export interface IMasagiLog {
  id?: number;
  userId: string;
  category: 'AKHLAK_MULIA' | 'HIDUP_BERSIH' | 'PEDULI_LINGKUNGAN' | 'ENTREPRENEUR';
  title: string;
  activityDescription: string;
  proofImageUrl: string;
  pointsEarned?: number;
  status?: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface IMasagiService {
  createLog(data: IMasagiLog, imageFile: File): Promise<{ success: boolean }>;
  getUserLogs(userId: string): Promise<IMasagiLog[]>;
  verifyLog(logId: number, status: 'VERIFIED' | 'REJECTED', teacherId: string): Promise<boolean>;
}
```

#### 2. OOP Service Implementation (`src/services/MasagiService.ts`)
```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { IMasagiLog, IMasagiService } from '../types/masagi';

export class MasagiService implements IMasagiService {
  private client: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.client = supabaseClient;
  }

  public async createLog(data: IMasagiLog, imageFile: File): Promise<{ success: boolean }> {
    // 1. Upload Gambar Bukti ke Supabase Storage
    const fileExt = imageFile.name.split('.').pop();
    const filePath = `masagi/${data.userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await this.client.storage
      .from('masagi-proofs')
      .upload(filePath, imageFile);

    if (uploadError) {
      throw new Error(`Gagal mengunggah foto bukti: ${uploadError.message}`);
    }

    const { data: publicUrlData } = this.client.storage
      .from('masagi-proofs')
      .getPublicUrl(filePath);

    // 2. Insert Data Log ke Database PostgreSQL via Supabase RLS
    const { error: insertError } = await this.client
      .from('masagi_character_logs')
      .insert({
        user_id: data.userId,
        category: data.category,
        title: data.title,
        activity_description: data.activityDescription,
        proof_image_url: publicUrlData.publicUrl,
        points_earned: 10,
        status: 'PENDING',
      });

    if (insertError) {
      throw new Error(`Gagal menyimpan data jurnal: ${insertError.message}`);
    }

    return { success: true };
  }

  public async getUserLogs(userId: string): Promise<IMasagiLog[]> {
    const { data, error } = await this.client
      .from('masagi_character_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return data.map((item) => ({
      id: item.id,
      userId: item.user_id,
      category: item.category,
      title: item.title,
      activityDescription: item.activity_description,
      proofImageUrl: item.proof_image_url,
      pointsEarned: item.points_earned,
      status: item.status,
    }));
  }

  public async verifyLog(logId: number, status: 'VERIFIED' | 'REJECTED', teacherId: string): Promise<boolean> {
    const { error } = await this.client
      .from('masagi_character_logs')
      .update({
        status,
        verified_by: teacherId,
        verified_at: new Date().toISOString(),
      })
      .eq('id', logId);

    if (error) throw new Error(error.message);
    return true;
  }
}
```

#### 3. TeFa WhatsApp Order Generator (`src/utils/tefaOrder.ts`)
```typescript
export interface ITeFaOrderItem {
  productName: string;
  qty: number;
  buyerName: string;
  buyerPhone: string;
  notes?: string;
}

export class TeFaOrderGenerator {
  private static TARGET_WA_NUMBER = '628123456789';

  public static generateWhatsAppUrl(order: ITeFaOrderItem): string {
    const message = 
      `*PESANAN TEFA SMKN 1 GARUT*\n\n` +
      `*Produk/Jasa:* ${order.productName}\n` +
      `*Jumlah:* ${order.qty}\n` +
      `*Nama Pemesan:* ${order.buyerName}\n` +
      `*No. HP:* ${order.buyerPhone}\n` +
      `*Catatan:* ${order.notes || '-'}\n\n` +
      `_Pesan ini dikirim otomatis via Portal Digital SMKN 1 Garut_`;

    return `https://wa.me/${this.TARGET_WA_NUMBER}?text=${encodeURIComponent(message)}`;
  }
}
```

---

## 4. UI/UX Flow & Design System Specs

### 4.1 Aesthetic Direction (Avant-Garde Vanguard Standard)
Sesuai standar *Vanguard UI Architect*, portal SMKN 1 Garut memadukan warna khas Pendidikan Jawa Barat dengan estetika SaaS modern:
* **Color Palette**:
  * Base Background: Deep Emerald Obsidian (`#021812`) & Dark Slate (`#060D0B`).
  * Accent Glow: Vibrant Jabar Gold (`#F5B027`) & Neon Emerald (`#10B981`).
  * Surface Cards: Glassmorphism Translucent (`rgba(255, 255, 255, 0.03)` + `backdrop-blur-2xl`).
* **Typography**:
  * Headings: **Plus Jakarta Sans** / **Clash Display** (Variable, Tight tracking $-0.03\text{em}$).
  * Body: **Geist Sans** (Clean, high contrast legibility).
* **Double-Bezel Card Architecture**:
  * Outer Enclosure: `rounded-[2rem] p-2 bg-white/5 border border-white/10 shadow-2xl`
  * Inner Core: `rounded-[calc(2rem-0.5rem)] bg-emerald-950/30 p-6 backdrop-blur-xl`

### 4.2 User Journey Flow: Pengiriman Jurnal Masagi (Siswa)
```
[Siswa Login via Supabase Auth / Magic Link]
                    │
                    ▼
[Masuk Dashboard Siswa -> Klik "Tambah Activity Masagi"]
                    │
                    ▼
[Pilih Kategori (Akhlak Mulia / Peduli Lingkungan)]
                    │
                    ▼
[Upload Foto Bukti via HP + Deskripsi Kegiatan]
                    │
                    ▼
[MasagiService Mengunggah File ke Supabase Storage & Insert Database]
                    │
                    ▼
[Status "PENDING" Berubah Realtime saat Guru Menekan "Approve"]
```

---

## 5. Task Breakdown (Agile/Scrum Sprints)

Pengerjaan diproyeksikan dalam **5 Sprint (Total 10 Minggu)**.

```
+-----------------------------------------------------------------------------------+
| SPRINT 1: Setup Supabase Project, Schema DDL, RLS Policies & Vite React Init      |
| SPRINT 2: Auth Engine, User Profiles & Dashboard Layout Architecture              |
| SPRINT 3: TeFa Storefront & Direct WhatsApp Checkout Engine                       |
| SPRINT 4: Vanguard UI Public Portal, Masagi Tracker & DUDIKA Link-and-Match       |
| SPRINT 5: Vercel SPA Routing, Security Audit, PWA & Production Launch             |
+-----------------------------------------------------------------------------------+
```

### Sprint 1: Supabase Infrastructure & Vite React Setup
* [x] **TSK-101**: Inisialisasi Project Supabase & Konfigurasi Region Singapore. (2 SP)
* [x] **TSK-102**: Eksekusi DDL Migrations untuk `profiles`, `departments`, `tefa_products`, `masagi_logs`, `dudika_partners`. (3 SP)
* [x] **TSK-103**: Implementasi & Testing Row Level Security (RLS) Policies. (3 SP)
* [x] **TSK-104**: Setup Supabase Storage Buckets (`masagi-proofs`, `dudika-resumes`, `tefa-assets`). (2 SP)

### Sprint 2: Core React Architecture & Auth
* [x] **TSK-201**: Setup Vite React + TypeScript, Tailwind CSS v4, & Shadcn UI. (3 SP)
* [x] **TSK-202**: Integrasi `@supabase/supabase-js` dengan Auth Context / Provider & React Router Protection. (5 SP)
* [x] **TSK-203**: Construct Shell Layout Dashboard (Double-Bezel Architecture & Floating Island Nav). (5 SP)

### Sprint 3: TeFa Showcase & DUDIKA BKK Portal
* [x] **TSK-301**: Build Katalog Produk TeFa dengan React Query & Infinite Scroll. (5 SP)
* [x] **TSK-302**: Build Class Utility Generator Payload WhatsApp Order. (2 SP)
* [x] **TSK-303**: Build Portal Lowongan DUDIKA & System Submit CV ke Supabase Bucket. (5 SP)

### Sprint 4: Vanguard UI Public Portal & Masagi Module
* [x] **TSK-401**: Build Landing Page Utama (Hero Motion Section, Jabar Masagi Branding). (8 SP)
* [x] **TSK-402**: Construct Module Jurnal Masagi (`MasagiService` Class + Upload Component + Leaderboard). (5 SP)
* [x] **TSK-403**: Implementasi Micro-interactions (Framer Motion cubic-bezier curves). (5 SP)

### Sprint 5: Deployment, Testing & Launch
* [x] **TSK-501**: Konfigurasi Deploy Vercel Platform (Rewrites SPA configuration) & Custom Domain SSL. (2 SP)
* [x] **TSK-502**: Security Hardening Audit (RLS Leak Check & Input Sanitization). (3 SP)
* [x] **TSK-503**: Optimasi Caching Asset & PWA Offline Service Worker. (3 SP)

---
*Cetak Biru Teknis berbasis React & Supabase ini siap dieksekusi oleh tim developer SMKN 1 Garut.*