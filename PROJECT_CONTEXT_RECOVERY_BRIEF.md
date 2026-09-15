# PROJECT CONTEXT RECOVERY BRIEF

## 1. Executive Summary

Roastery adalah aplikasi e-commerce kopi “Kopi Gajahmada” berbasis Laravel + React/Inertia. Sistem mencakup katalog, cart, checkout multi-item, pembayaran manual via bukti transfer, fulfillment courier, review produk, laporan, serta role customer/admin/courier/super admin.

Implementasi inti cukup matang dan test coverage backend relatif baik. Namun working tree saat ini memiliki perubahan besar yang belum dikomit, termasuk fitur komplain, kategori produk, dan pre-registered staff access. Runtime lokal belum dapat dijalankan dengan PHP XAMPP saat audit karena dependensi membutuhkan PHP >= 8.4.1, sedangkan binary XAMPP menyediakan PHP 8.2.4.

## 2. Technology Stack

- Backend: Laravel 13, PHP.
- Frontend: React 18, Inertia.js, Vite, Tailwind CSS.
- Database: Laravel database drivers; environment mengonfigurasi database eksternal.
- Auth: Laravel session auth, email verification, password reset, Google OAuth/Socialite.
- Export: DomPDF untuk PDF dan PhpSpreadsheet untuk XLSX.
- UI: `lucide-react` dan `framer-motion`.
- JS route helper: Ziggy.

## 3. Repository Map

- `app/Http/Controllers/`: HTTP handlers dan orchestration bisnis.
- `app/Services/`: fulfillment, analytics, laporan, Google linking, redirect role.
- `app/Models/`: Eloquent entities.
- `app/Policies/`: ownership order dan report.
- `app/Http/Middleware/`: role middleware dan shared Inertia props.
- `routes/web.php`: seluruh application route; tidak ada API domain khusus.
- `resources/js/Pages/`: React page per respons Inertia.
- `resources/js/Components/`: navigasi/admin/report presentation.
- `database/migrations/`: evolusi schema.
- `tests/Feature/`: regression suite utama.

## 4. System Architecture

```text
Browser
  -> Laravel web route + middleware
  -> Controller
  -> Model / Service / DB transaction
  -> Inertia::render() atau redirect + flash
  -> React page menerima props dan merender UI
```

Aplikasi memakai server-driven Inertia, bukan REST API. React mengirim `router.post/patch/delete` atau `useForm`; Laravel mengembalikan redirect, validation error, atau props Inertia.

Boundary utama:

- Controller: authorization, validation, page props, redirect.
- `OrderFulfillmentService`: state machine fulfillment.
- `RevenueAnalyticsService`: definisi revenue-valid KPI.
- `ReportGeneratorService` dan `ReportExportService`: snapshot report dan export.
- Model/policy: relationship dan ownership.

## 5. End-to-End Runtime Flow

1. `public/index.php` mem-bootstrap Laravel.
2. `bootstrap/app.php` mendaftarkan `routes/web.php`, middleware Inertia, dan alias `role`.
3. Route memeriksa `auth`, `verified`, dan bila perlu `role:*`.
4. Controller mengambil/memvalidasi data, memakai model/service.
5. Data dikembalikan lewat `Inertia::render('PageName', props)`.
6. `resources/js/app.jsx` memuat `resources/js/Pages/<PageName>.jsx`.
7. `HandleInertiaRequests` menyertakan user, jumlah cart, notifikasi admin, dan flash success.

## 6. Major User Flows

### Katalog dan produk

`GET /` atau `/dashboard` -> `HomeController::index/dashboard()` -> `catalogProps()` -> `Product` plus aggregate review dan `ProductCategory` -> `Index.jsx` / `Dashboard.jsx`.

`GET /products/{id}` -> `HomeController::show()` -> produk dengan aggregate review -> `Show.jsx`.

### Cart dan checkout

Tambah cart: UI katalog/produk -> `POST /cart/products/{product}` -> `CartController::store()` -> transaction DB, lock produk, merge item berdasarkan `(cart_id, product_id, brew_method)` -> redirect.

Checkout: `Cart/Index.jsx` memilih item -> `GET /checkout?items[]=...` -> `OrderController::checkout()` memastikan ownership -> `Checkout.jsx`.

Submit: `Checkout.jsx` -> `POST /orders/checkout` -> `OrderController::store()` -> lock cart item dan produk, cek stok, snapshot harga/nama/produk pada `order_items`, decrement stock, hapus cart item terpilih -> payment page.

### Pembayaran manual

`Payment.jsx` -> `POST /orders/{order}/proof` -> `OrderController::uploadProof()` -> proof disimpan di `local/payment-proof`, `payment_status` menjadi `pending_confirmation` -> `PaymentSubmitted.jsx`.

Admin memakai `approvePayment()` / `rejectPayment()` untuk mengubah status menjadi `paid` / `rejected`.

Tidak ada payment gateway atau callback bank nyata. Nomor “Virtual Account” adalah rekening dari `payment_settings` yang disalin ke order.

### Fulfillment dan delivery

Admin: `awaiting_payment + paid` -> `processOrder()` -> `processing` -> `markPacked()` -> `packed` -> `requestPickup(courier)` -> `pickup_requested`.

Courier: `pickup_requested` -> `confirmPickup()` -> `picked_up` -> `generateTracking()` / `saveTracking()` -> `startShipping()` -> `shipped` -> `markDelivered()` -> `delivered`.

Customer: `delivered` -> `complete()` -> `completed`.

State machine berada di `app/Services/OrderFulfillmentService.php`.

### Review produk

`OrderDetail.jsx` untuk order `completed` -> `POST /orders/{order}/items/{orderItem}/review` -> `ProductReviewController::store()` -> satu review per `order_item_id`, dijaga aplikasi dan unique constraint.

### Komplain — belum dikomit

Customer maksimal satu hari setelah delivery: `OrderDetail.jsx` -> `POST /orders/{order}/complaints` -> `ComplaintController::store()` -> complaint, optional order item, maksimum tiga private image evidence.

Customer/admin dapat membuka thread dan membalas. Admin memperbarui status pada `/admin/complaints`. Model, migration, dan controller utamanya masih untracked.

### Laporan

Admin: `Admin/Reports/Form.jsx` -> `POST /admin/reports` -> `ReportController::store()` -> `ReportGeneratorService::generate()` -> snapshot JSON di `reports.summary_data`.

PDF/XLSX dibuat on-demand oleh `ReportExportService`. Super admin dapat mengubah report `generated -> reviewed`.

### Staff access dan Google login — belum dikomit

Super admin mendaftarkan email admin/courier -> `POST /super-admin/staff-accesses` -> `StaffAccess(status=pending)`.

Saat pemilik email login Google: `GoogleController::handleGoogleCallback()` -> `GoogleAccountLinker::link()` -> cocokkan email -> ubah role akun dan buat `RoleChangeLog`.

## 7. Backend/API Flow

Tidak ada endpoint `/api/*` untuk domain aplikasi; semuanya adalah web/Inertia route dalam `routes/web.php`.

Endpoint sensitif memakai `auth`, `verified`, role middleware, `OrderPolicy`, serta `ReportPolicy`. Validation umumnya berada inline dalam controller. Error bisnis memakai `abort_unless(..., 422, message)` atau `ValidationException`.

## 8. Frontend Flow

- Halaman di-resolve otomatis dari nama Inertia.
- Tidak ada Redux/Zustand/global state aplikasi.
- Form state bersifat lokal via `useForm`, `useState`, dan Inertia router.
- Wishlist di `resources/js/utils/wishlist.js` memakai `localStorage`, bukan database.
- Status order dilabelkan di `resources/js/utils/orderStatus.js`.
- `resources/js/SuperAdmin/Dashboard.jsx` dan `Users.jsx` top-level tampak legacy/dead; controller memakai `Pages/SuperAdmin/*`.

Catatan: route koleksi Espresso/Filter aktif, tetapi `CollectionPageShell.jsx` merender `<main />` kosong. Kedua collection page saat ini praktis shell kosong.

## 9. Database / Domain Model

| Entitas | Peran dan relasi penting |
|---|---|
| `User` | Akun dengan role customer/admin/courier/super_admin. |
| `Product` | Katalog, harga, stok, kategori string, berat; PK `product_id`. |
| `ProductCategory` | Daftar kategori canonical; produk menyimpan nama kategori. |
| `Cart` / `CartItem` | Satu cart per user; item unique per cart/product/brew method. |
| `Order` | Snapshot transaksi dan lifecycle pembayaran/fulfillment; PK `order_id`. |
| `OrderItem` | Snapshot produk/harga/qty; tetap historis bila produk terhapus. |
| `PaymentSetting` | Rekening bisnis aktif; nilainya disalin ke order. |
| `PaymentSettingChangeRequest` | Approval perubahan rekening admin ke super admin. |
| `ProductReview` | Satu review per `order_item_id`. |
| `Report` | Snapshot report JSON, review, dan archive metadata. |
| `Complaint` | Komplain, evidence private, message thread; uncommitted. |
| `StaffAccess` | Pra-registrasi staf melalui Google OAuth; uncommitted. |
| `RoleChangeLog` | Audit perubahan role. |

Invarian:

- Revenue valid = `payment_status = paid` dan `status != cancelled`.
- Stok berkurang pada checkout, bukan pembayaran.
- Cancel hanya untuk `awaiting_payment` dengan `unpaid/rejected`; stock dikembalikan satu kali menggunakan `stock_released_at`.
- Tracking number unik dan dikunci setelah terset.
- Registrasi publik selalu customer.

## 10. Authentication / Authorization

- Laravel session auth untuk password login.
- Registrasi customer belum verified dan memicu event `Registered`.
- Business route utama membutuhkan verified email.
- Google OAuth memakai Socialite; akun linked ditandai verified.
- `RoleRedirector` memilih dashboard setelah login.
- `EnsureUserHasRole` memakai allow-list role exact.
- `OrderPolicy` membatasi customer pada order sendiri; admin/super admin dapat melihat semua; courier dicek melalui `courier_id`.
- `ReportPolicy` membatasi admin pada report buatannya dan review pada super admin.

## 11. External Integrations

- Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
- Email Laravel untuk verification/reset.
- DomPDF dan PhpSpreadsheet.
- Produk memakai public disk; payment proof dan complaint evidence memakai local/private disk melalui endpoint berotorisasi.
- Tidak ditemukan webhook, external courier API, payment gateway API, broadcast, atau HTTP client integration.

## 12. Feature Inventory

- Implemented: auth, verification, guards, produk, cart, checkout, payment proof, tracking, review, reports/export, analytics.
- Fragile: manual payment, inventory reservation/refund, admin notifications, analytics semantics, category rename.
- Partial: collection Espresso/Filter kosong.
- In progress: complaints, staff access, UX/dashboard/category changes.
- Legacy/dead: top-level `resources/js/SuperAdmin/*`.
- Uncertain: deployment target dan status migration production.

## 13. Important Architectural Conventions

- Pertahankan convention `Inertia::render('X')` -> `resources/js/Pages/X.jsx`.
- Gunakan role middleware lalu policy untuk object ownership.
- Letakkan state transition order dalam `OrderFulfillmentService`.
- Gunakan transaction + `lockForUpdate` pada stok, cart merge, payment approval, dan staff activation.
- Perlakukan `OrderItem` sebagai immutable historical snapshot.
- Gunakan `Order::revenueValid()` untuk seluruh analytics revenue.

## 14. Historical Scars / Likely Previous Hotfixes

- `OrderController::paymentProofDisk()` mencoba private `local` sebelum `public`, sebagai compatibility layer bukti lama.
- Migration `2026_09_02_000001_simplify_report_statuses.php` menormalisasi status report lama.
- Migration `2026_09_03_000005_create_complaint_messages_table.php` memakai `Schema::hasTable()` untuk database existing.
- Checkout lock produk menurut urutan `product_id`, mengurangi deadlock.
- Review memakai pre-check dan unique DB constraint untuk race condition.
- Payment-setting submission memakai lock untuk mencegah pending request paralel.
- Analytics memakai timezone `Asia/Jakarta` secara eksplisit.
- `admin_seen_at` bukan satu-satunya dasar badge; order tetap tampil bila butuh aksi.

## 15. High-Risk Modules

| Risiko | Modul | Validasi aman |
|---|---|---|
| HIGH | `OrderController.php` | `CheckoutTest`, `CartTest`, `OrderFulfillmentTest`, `PaymentSettingTest`. |
| HIGH | `OrderFulfillmentService.php` | Semua state transition dan stock release. |
| HIGH | `GoogleAccountLinker.php` | `RoleSecurityTest` dan Google password tests. |
| HIGH | Migration complaint/staff access | Backup DB dan cek migration status sebelum deploy. |
| MEDIUM | `RevenueAnalyticsService.php` | Regression analytics, timezone WIB, scope revenue. |
| MEDIUM | Product category controller | Category rename dan relasi string. |
| MEDIUM | `HandleInertiaRequests.php` | Shared props di setiap request. |
| MEDIUM | Report generator/export | Snapshot lama vs perubahan semantik baru. |

Jangan mengubah secara kasual: status order/payment, `revenueValid`, fallback private/public proof, lock ordering checkout, unique cart key, snapshot fields order/order item, serta migration compatibility guard.

## 16. Known or Suspected Technical Debt

Terbukti:

- README masih default Laravel.
- Tidak ditemukan CI atau deployment manifest.
- Validation tidak sepenuhnya konsisten memakai request class.
- Kategori terhubung via nama string.
- Collection page kosong.
- PHP XAMPP lokal tidak kompatibel dengan dependency.
- Queue/cache dikonfigurasi tetapi tidak ditemukan job dispatch atau cache usage aplikasi.

Perlu verifikasi:

- Frontend merujuk asset `category-espresso.jpg`, `category-filter.jpg`, dan `placeholder-coffee.png`; asset tersebut tidak terlihat pada inventory `public/images` audit.
- Product delete berpotensi memengaruhi FK review; order history aman lewat snapshot dan `nullOnDelete` pada item.

## 17. Current Git State

- Branch: `part-2-checkout-flow`.
- HEAD: `dae9778` — `Complete Rupiah formatting and business analytics` (3 Sep 2026).
- Riwayat memperlihatkan iterasi auth/security, checkout, payment proof, courier, review, reports, email verification, Google password setup, cart, dan analytics/UI.
- Working tree kotor: 35 file modified unstaged, 14 file staged, beberapa mixed staged/unstaged, dan banyak file untracked.
- Tidak ada conflict marker yang ditemukan.

Perubahan uncommitted adalah pekerjaan aktif; jangan direvert/bersihkan tanpa koordinasi.

## 18. Testing / Validation Map

Feature tests meliputi auth, registration, password lifecycle, email verification, cart, multi-item checkout, payment settings/proof, fulfillment, courier, role security, Google linking, review, category, report, analytics, dan complaints.

`phpunit.xml` memakai SQLite in-memory, array mail, queue sync, cache/session array.

Tests tidak dijalankan pada audit karena PHP CLI tidak tersedia, dan PHP XAMPP 8.2.4 gagal mem-bootstrap dependencies yang membutuhkan PHP >= 8.4.1.

## 19. Safe Hotfix Procedure

1. Pastikan perubahan tidak overlap dengan working tree aktif.
2. Identifikasi role, policy, route, status order/payment yang terlibat.
3. Ikuti service boundary; jangan bypass `OrderFulfillmentService`.
4. Pertahankan transaction dan locks untuk cart/checkout/inventory.
5. Gunakan `Order::revenueValid()` dan timezone WIB untuk analytics/report.
6. Pertahankan private storage serta authorization untuk upload.
7. Tambahkan test success, invalid transition, dan unauthorized access.
8. Jalankan test suite setelah PHP runtime kompatibel tersedia.
9. Cek database existing sebelum migration baru, khususnya complaint migration.
10. Pisahkan commit pekerjaan aktif dari hotfix baru.

## 20. Unknowns

- Status migration database aktual tidak dapat dibuktikan karena Artisan gagal bootstrap.
- PHP >= 8.4 yang seharusnya dipakai/deployment runtime tidak diketahui.
- Credential Google OAuth dan mail belum dapat diverifikasi secara runtime.
- Keberadaan `public/storage` symlink tidak dapat dibuktikan.
- Tidak ditemukan dokumentasi deployment, observability, SLA, atau kontrak payment/courier provider.
- Status uji migration complaint/staff-access di database non-test tidak diketahui.

## 21. Quick Mental Model

### IF YOU ONLY REMEMBER 10 THINGS ABOUT THIS PROJECT

1. Laravel + React/Inertia; bukan SPA dengan REST API terpisah.
2. `routes/web.php` adalah peta perilaku utama.
3. Business route memakai auth, verified email, dan role guard.
4. Checkout membuat satu order dari cart item terpilih, snapshot harga, lalu mengurangi stok.
5. Payment adalah proof upload manual, bukan gateway bank.
6. Lifecycle fulfillment harus lewat `OrderFulfillmentService`.
7. Revenue valid berarti paid dan tidak cancelled; analytics memakai WIB.
8. Order item adalah historical snapshot meski produk berubah/hilang.
9. Working tree berisi fitur aktif yang belum dikomit, khususnya complaint/staff access.
10. PHP XAMPP 8.2.4 tidak dapat menjalankan dependency saat ini; butuh PHP >= 8.4.1.
