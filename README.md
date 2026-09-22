# Frontend - Banking Management System

React + Vite + React Router + Axios.

## Run

```bash
npm install
copy .env.example .env
npm run dev
```

`VITE_API_URL` mặc định là `http://localhost:3000/api`.

Axios tự gắn JWT vào request và tự xóa phiên/chuyển về `/login` khi API trả `401`.
