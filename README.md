# Q-net

Aplikasi media sosial multi-user untuk berbagi karya. Dibangun dengan Next.js, Turso, dan Drizzle ORM.

## Fitur

- Register, login, logout (password di-hash, session JWT via cookie httpOnly)
- Feed dengan tab For You / Following / Popular
- Buat, edit, hapus postingan (teks + gambar via Cloudinary)
- Like, komentar, follow/unfollow
- Profil pengguna (avatar, bio, statistik followers/following)
- Pencarian user, postingan, dan hashtag
- Trending hashtag dari data database asli

## Setup

### 1. Clone dan install

```bash
npm install
```

### 2. Buat database Turso

Install Turso CLI dulu: https://docs.turso.dev/cli/install

```bash
turso db create qnet
turso db show qnet --url
turso db tokens create qnet
```

Simpan URL dan token yang muncul.

### 3. Buat Cloudinary account

Daftar di https://cloudinary.com, buka Dashboard, salin:
- Cloud Name
- API Key
- API Secret

### 4. Buat AUTH_SECRET

```bash
openssl rand -base64 32
```

Atau pakai generator acak lain. Minimal 32 karakter.

### 5. Isi environment variables

```bash
cp .env.example .env
```

Lalu isi `.env`:

```
TURSO_DATABASE_URL=libsql://qnet-<your-org>.turso.io
TURSO_AUTH_TOKEN=<token dari langkah 2>
AUTH_SECRET=<hasil langkah 4>
CLOUDINARY_CLOUD_NAME=<cloud name>
CLOUDINARY_API_KEY=<api key>
CLOUDINARY_API_SECRET=<api secret>
```

### 6. Buat tabel di database

```bash
npm run db:push
```

### 7. Jalankan

```bash
npm run dev
```

Buka http://localhost:3000.

## Deploy ke Vercel

1. Push project ke GitHub.
2. Buka https://vercel.com, klik "Add New" > "Project", pilih repo.
3. Sebelum deploy, buka "Environment Variables" dan tambahkan semua 6 variabel dari `.env`.
4. Klik Deploy.
5. Setelah deploy, jalankan `npm run db:push` sekali dari lokal (dengan `TURSO_DATABASE_URL` dan `TURSO_AUTH_TOKEN` produksi) untuk membuat tabel di database produksi. Atau jalankan `turso db shell qnet < drizzle/migrations.sql` jika sudah punya file migrasi.

## Struktur

```
app/
  api/          API routes (auth, posts, comments, likes, follow, search, trending, upload)
  explore/      Halaman feed utama
  login/        Halaman login
  register/     Halaman register
  profile/      Profil sendiri
  u/[username]/ Profil pengguna lain
  search/       Hasil pencarian
components/     Komponen React (AppShell, Feed, PostCard, dll)
lib/            Schema Drizzle, koneksi DB, auth, validasi, Cloudinary
```

## Catatan

- Upload gambar butuh Cloudinary. Tanpa credential, fitur upload akan error dengan pesan yang jelas, tapi fitur teks tetap jalan.
- Jangan commit `.env`. Sudah masuk `.gitignore`.
