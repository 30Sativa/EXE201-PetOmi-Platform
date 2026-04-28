# My React App

## 🚀 Tech Stack

- React + TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand
- React Hook Form + Zod
- Axios

## 📦 Setup

```bash
npm install
npm run dev
```

## 🔧 Scripts

```bash
npm run dev      # chạy local
npm run build    # build production
npm run preview  # xem bản build
npm run lint     # lint
```

## ⚙️ Environment

- Tạo file `.env` nếu cần cấu hình API hoặc biến môi trường khác.
- Ví dụ (tùy dự án):

```bash
VITE_API_BASE_URL=https://api.example.com
```

## 📁 Structure

```
src/
  components/
  pages/
  stores/
  services/
  schemas/
```

## 🧩 Folder Details

- `components/`: UI dùng lại (button, modal, table, form field...).
- `pages/`: màn hình chính (route level).
- `stores/`: global state với Zustand.
- `services/`: gọi API qua Axios, tách theo domain.
- `schemas/`: validation schema dùng Zod.

## 🔌 API Conventions

- Mỗi domain tách một file service riêng.
- Không gọi API trực tiếp trong component UI, luôn đi qua `services/`.
- Trả dữ liệu đã được normalize nếu cần.

## 🧠 State Management

- Zustand chỉ dùng cho global state (auth, user, settings, cart...).
- Local state nên dùng `useState` hoặc `useReducer` trong component.

## 📝 Forms

- Form dùng React Hook Form + Zod.
- Schema đặt tại `schemas/` và import vào form.
- Ưu tiên `zodResolver` để validate.

## 🧠 Notes

- Zustand chi dung cho global state
- API goi qua services/
- Form dung RHF + Zod
