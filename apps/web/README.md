# PetOmi Web — Frontend

## Tech Stack

| Category | Library | Purpose |
|---|---|---|
| Framework | React 19 + TypeScript | UI |
| Routing | React Router v7 | SPA routing |
| Styling | Tailwind CSS v4 + CSS Custom Properties | Design system |
| UI Components | shadcn/ui (base-ui) | Accessible primitives |
| Forms | React Hook Form + Zod v4 | Validation |
| HTTP | Axios + Interceptors | API calls + token refresh |
| Server State | TanStack Query v5 | Caching, loading, error states |
| Icons | Lucide React | Consistent icon set |

## Setup

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev      # chạy local (http://localhost:5173)
npm run build    # build production
npm run preview  # xem bản production build
npm run lint     # lint code
```

## Environment Variables

Tạo `.env` ở thư mục `apps/web/`:

```bash
VITE_API_BASE_URL=http://localhost:7297/api  # API base URL
VITE_USE_MOCK_AUTH=true                     # dùng mock auth thay vì gọi API thật
```

## Folder Structure

```
src/
├── main.tsx                    # Entry point, QueryClientProvider, AuthProvider
├── App.tsx                     # Root layout (Outlet)
├── index.css                   # Tailwind config, CSS variables, animations
│
├── components/
│   ├── ui/                    # shadcn/ui primitives (Button, Accordion...)
│   ├── guards/
│   │   └── RequireAuth.tsx   # Protected route wrapper
│   ├── landing/               # Landing page sections (Hero, Navbar, FAQ...)
│   └── dashboard/             # Dashboard layout components
│
├── pages/
│   ├── LandingPage.tsx
│   ├── AuthPage.tsx           # Login / Register container
│   ├── LoginPage.tsx          # Login form (pure UI)
│   ├── RegisterPage.tsx       # Register form (pure UI)
│   ├── VerifyEmailPage.tsx
│   ├── CompleteProfilePage.tsx
│   ├── ForgotPasswordPage.tsx
│   ├── ErrorPage.tsx
│   ├── NotFoundPage.tsx
│   └── dashboard/             # Role-specific dashboard pages
│
├── hooks/
│   ├── index.ts
│   ├── useInView.ts          # Intersection observer
│   ├── useMounted.ts         # Mount guard (hydration)
│   ├── useLoginForm.ts
│   ├── useRegisterForm.ts
│   ├── useCompleteProfileForm.ts
│   ├── useForgotPasswordForm.ts
│   └── useAuthQueries.ts      # TanStack Query mutations
│
├── services/
│   ├── auth.service.ts        # Login, register, logout, forgot-password, verify-email
│   └── profile.service.ts     # Profile CRUD
│
├── contexts/
│   └── AuthContext.tsx        # user, isAuthenticated, logout
│
├── lib/
│   ├── axios.ts               # Axios instance + interceptors
│   ├── tokenStorage.ts        # localStorage token helpers
│   ├── device.ts              # Device fingerprint (ua-parser-js)
│   └── utils.ts               # cn(), getErrorMessage()
│
├── types/
│   ├── index.ts
│   ├── auth.types.ts          # User, AuthContextType, LoginResponse, VerifyEmailResponse...
│   ├── page.types.ts          # AuthMode, FormStatus
│   ├── profile.types.ts       # ProfileResponse, CompleteProfileResponse...
│   ├── device.types.ts         # DeviceInfo
│   ├── landing.types.ts        # NavLink, Testimonial, FaqItem...
│   └── dashboard.types.ts      # StatCardProps, DashboardSectionProps
│
├── schemas/
│   ├── auth.schema.ts         # Zod schemas for auth forms
│   ├── profile.schema.ts      # Zod schemas for profile forms
│   └── dashboard.schema.ts     # Zod schemas for dashboard forms
│
└── routes/
    └── index.tsx              # React Router setup
```

## Architecture

### Pages — Pure UI

Pages chỉ render JSX, không chứa logic nghiệp vụ. Logic được tách vào `hooks/`.

```tsx
// LoginPage.tsx — chỉ render, không có logic
const { register, handleSubmit, errors, isSubmitting, message, onSubmit } = useLoginForm()
return <form onSubmit={handleSubmit(onSubmit)}>...</form>
```

### Hooks — Business Logic

| Hook | Purpose |
|---|---|
| `useLoginForm` | form state + API call + token storage + navigation |
| `useRegisterForm` | form state + register API call |
| `useCompleteProfileForm` | form state + auth guard + complete profile API |
| `useForgotPasswordForm` | form state + forgot password API |
| `useVerifyEmail` | TanStack Query mutation cho email verification |
| `useProfile` | TanStack Query query cho profile fetch |
| `useInView` | Intersection Observer cho scroll animations |
| `useMounted` | Trì hoãn mount để tránh hydration mismatch |

### Services — API Layer

Tất cả gọi API phải qua `services/`. Interceptors trong `lib/axios.ts` tự động:

- Gắn `Authorization: Bearer <token>` vào request
- Refresh token khi nhận 401

### Types — Single Source of Truth

- **Interface thuần túy** (User, DeviceInfo...) → `types/`
- **Zod-inferred types** (LoginRequest, CompleteProfileForm...) → `schemas/`
- **Auth domain types** (VerifyEmailResponse, LoginResponse...) → `types/auth.types.ts`
- **Profile domain types** (ProfileResponse...) → `types/profile.types.ts`

### Protected Routes

```tsx
<RequireAuth redirectTo="/login">
  <OwnerDashboardLayout />
</RequireAuth>
```

### TanStack Query

- Setup ở `main.tsx` với `staleTime: 5 phút`, `retry: 1`
- Dùng cho mutations (verify email, profile fetch)

## API Conventions

| Pattern | Example |
|---|---|
| Method naming | `loginApi`, `registerApi`, `getProfileApi`, `verifyEmailApi` |
| Response unwrap | Service unwraps `response.data.data` → trả về body trực tiếp |
| Error handling | Dùng `getErrorMessage()` từ `lib/utils.ts` |
| Token refresh | Axios interceptor tự động refresh khi 401 |

## Error Handling

Mọi lỗi từ API được xử lý tập trung theo từng HTTP status code:

| Status Code | Behavior |
|---|---|
| 400 / 404 / 409 | Interceptor trả nguyên `error.response.data.message` cho component hiển thị |
| 401 | Interceptor tự động refresh token; nếu refresh thất bại → redirect `/auth` |
| 500 | Redirect `/error-page` |

## Code Style

- **Identifier**: Tiếng Anh
- **Comments**: Tiếng Anh (chỉ khi cần thiết, không commentary hiển nhiên)
- **Naming conventions**:
  - Hooks: `useCamelCase` (e.g. `useLoginForm`)
  - Types/Interfaces: `PascalCase` (e.g. `UserProfile`)
  - Services: `camelCase` (e.g. `loginApi`)
  - CSS classes: kebab-case (e.g. `bg-po-primary`)
- **Imports**: Dùng `@/` alias cho `src/`

## Running

```bash
npm run dev       # development
npm run build     # production build
npm run preview   # preview production build
```
