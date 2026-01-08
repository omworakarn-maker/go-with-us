# 🚀 GoWithUs - Full Stack Setup Guide

แอพหาเพื่อนเที่ยวที่ใช้ AI ช่วยวิเคราะห์และแนะนำกิจกรรม

---

## 📋 Tech Stack

### **Frontend**
- React 18 + TypeScript
- Vite
- React Router v6
- Tailwind CSS (inline)
- Google Gemini AI

### **Backend**
- Node.js + Express
- Prisma ORM
- PostgreSQL (Supabase)
- JWT Authentication
- bcryptjs

---

## 🛠️ การติดตั้งและรันโปรเจค

### **1. Clone Repository**
```bash
git clone <your-repo-url>
cd go-with-us
```

### **2. Setup Backend**

#### **2.1 ติดตั้ง Dependencies**
```bash
cd go-with-us-backend
npm install
```

#### **2.2 Setup Database (Supabase)**
1. ไปที่ [Supabase](https://supabase.com) และสร้างบัญชี
2. สร้าง Project ใหม่ (เลือก Region: Southeast Asia - Singapore)
3. คัดลอก Database URL จาก Settings > Database > Connection String
4. อ่านรายละเอียดเพิ่มเติมใน `DATABASE_SETUP.md`

#### **2.3 สร้างไฟล์ .env**
สร้างไฟล์ `.env` ใน folder `go-with-us-backend`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
FRONTEND_URL="http://localhost:5173"
PORT=3000
```

#### **2.4 Run Prisma Migrations**
```bash
npx prisma generate
npx prisma migrate dev --name init
```

#### **2.5 เริ่มต้น Backend Server**
```bash
npm run dev
```

✅ Backend กำลังรันที่: `http://localhost:3000`

---

### **3. Setup Frontend**

#### **3.1 ติดตั้ง Dependencies**
```bash
cd .. # กลับไปที่ root directory
npm install
```

#### **3.2 สร้างไฟล์ .env.local**
สร้างไฟล์ `.env.local` ใน root directory:

```env
VITE_API_URL=http://localhost:3000/api
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

**หา Gemini API Key:**
1. ไปที่ [Google AI Studio](https://makersuite.google.com/app/apikey)
2. คลิก "Create API Key"
3. คัดลอกมาใส่ใน `.env.local`

#### **3.3 เริ่มต้น Frontend**
```bash
npm run dev
```

✅ Frontend กำลังรันที่: `http://localhost:5173`

---

## 🎯 การทดสอบระบบ

### **1. ทดสอบ Backend API**
เปิดเบราว์เซอร์ไปที่ `http://localhost:3000` ควรเห็น:
```json
{
  "message": "Go With Us Backend API",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/auth",
    "trips": "/api/trips"
  }
}
```

### **2. ทดสอบ Frontend**
1. เปิดเบราว์เซอร์ไปที่ `http://localhost:5173`
2. คลิก "สมัครสมาชิก" เพื่อสร้างบัญชีใหม่
3. ลอง Login
4. สร้างกิจกรรมใหม่

---

## 📁 โครงสร้างโปรเจค

```
go-with-us/
├── go-with-us-backend/
│   ├── src/
│   │   ├── controllers/       # Business logic
│   │   ├── middleware/        # JWT auth, error handling
│   │   ├── routes/           # API routes
│   │   └── index.js          # Main server
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── .env                  # Environment variables
│   └── package.json
├── src/
│   ├── components/           # React components
│   ├── pages/               # Route pages
│   ├── services/            # API service layer
│   │   └── api.ts          # Backend API calls
│   ├── types.ts            # TypeScript types
│   └── AppRouter.tsx       # Route configuration
├── .env.local              # Frontend environment
└── package.json
```

---

## 🔑 API Endpoints

### **Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### **Trips**
- `GET /api/trips` - Get all trips (with filters)
- `GET /api/trips/:id` - Get single trip
- `POST /api/trips` - Create trip (protected)
- `PUT /api/trips/:id` - Update trip (protected)
- `DELETE /api/trips/:id` - Delete trip (protected)
- `POST /api/trips/:id/join` - Join trip (protected)
- `DELETE /api/trips/:id/leave` - Leave trip (protected)

---

## 🐛 Troubleshooting

### **Backend ไม่สามารถเชื่อมต่อ Database**
- ตรวจสอบ `DATABASE_URL` ใน `.env` ว่าถูกต้อง
- ตรวจสอบว่า password ใน URL ไม่มีอักขระพิเศษ (ถ้ามีต้อง encode)
- ลองรัน `npx prisma studio` เพื่อทดสอบการเชื่อมต่อ

### **Frontend ไม่สามารถเรียก API**
- ตรวจสอบว่า Backend กำลังรันอยู่ที่ `localhost:3000`
- ตรวจสอบ `VITE_API_URL` ใน `.env.local`
- เปิด Developer Console ดู CORS errors

### **CORS Error**
- ตรวจสอบว่า `FRONTEND_URL` ใน backend `.env` ตรงกับ URL ของ frontend
- ตรวจสอบว่า backend มี `cors` middleware

---

## 🚀 Deploy to Vercel

### **1. Deploy Backend**
```bash
cd go-with-us-backend
vercel
```

Environment Variables ที่ต้องตั้งใน Vercel:
- `DATABASE_URL` - Supabase database URL
- `JWT_SECRET` - Secret key for JWT
- `FRONTEND_URL` - Your frontend URL

### **2. Deploy Frontend**
```bash
cd .. # root directory
vercel
```

Environment Variables ที่ต้องตั้งใน Vercel:
- `VITE_API_URL` - Your backend API URL
- `VITE_GEMINI_API_KEY` - Gemini API key

---

## 📚 Additional Resources

- **Database Setup**: อ่านเพิ่มเติมใน `go-with-us-backend/DATABASE_SETUP.md`
- **Progress**: ดูความคืบหน้าใน `PROGRESS.md`
- **TODO**: ดูสิ่งที่ต้องทำต่อใน `TODO.md`

---

## 🤝 Contributing

ยินดีรับ Pull Requests! สำหรับการเปลี่ยนแปลงที่สำคัญ โปรด open issue ก่อน

---

## 📄 License

MIT License

---

**สร้างด้วย ❤️ โดย GoWithUs Team**
