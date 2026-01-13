# Jagat Clone - Frontend

Frontend React application cho ứng dụng Jagat Clone.

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Cấu hình Environment Variables:

Copy file `env.example` thành `.env`:
```bash
# Linux/Mac
cp env.example .env

# Windows
copy env.example .env
```

File `.env` mặc định sẽ sử dụng Railway API:
```env
VITE_API_URL=https://web-production-ba422.up.railway.app
```

Để phát triển local, sửa thành:
```env
VITE_API_URL=http://localhost:8000
```

3. Chạy development server:
```bash
npm run dev
```

Ứng dụng sẽ chạy tại: http://localhost:3000

## Environment Variables

- `VITE_API_URL`: URL của backend API
  - Production: `https://web-production-ba422.up.railway.app`
  - Local: `http://localhost:8000`

**Lưu ý**: File `.env` không được commit lên Git (đã có trong .gitignore)

## Cấu trúc

- `src/components/` - Các React components
  - `App.tsx` - Component chính
  - `Login.tsx` - Màn hình đăng nhập
  - `MapView.tsx` - Hiển thị bản đồ với vị trí real-time
  - `ChatPanel.tsx` - Panel chat
  - `StickerPicker.tsx` - Chọn sticker
  - `VideoCall.tsx` - Video call component
  - `MusicSync.tsx` - Nghe nhạc đồng bộ
  - `MovieSync.tsx` - Xem phim đồng bộ với screen sharing
  - `Sidebar.tsx` - Sidebar navigation
  - `Profile.tsx` - Profile component
  - `AddFriend.tsx` - Add friend component

- `src/config/` - Configuration
  - `api.ts` - API URL configuration và helper functions

## Features

- 📍 Real-time location tracking trên bản đồ
- 💬 Chat real-time
- 🎨 Sticker support (emoji tạm thời, sẽ thay bằng SVG)
- 📹 Video call với WebRTC
- 🎵 Music sync (đang phát triển)
- 🎬 Movie sync với screen sharing
- 👤 User profiles và friends management

## Theme

Theme hiện đại và cute với:
- Gradient backgrounds (pink, lavender, peach)
- Rounded corners
- Smooth animations (Framer Motion)
- Modern UI components

## API Configuration

Tất cả API calls sử dụng `src/config/api.ts`:
- `getApiUrl(path)`: Tạo API URL từ path
- `getWebSocketUrl(path)`: Tạo WebSocket URL từ path (tự động convert http→ws, https→wss)
