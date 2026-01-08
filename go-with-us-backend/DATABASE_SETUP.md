# 🗄️ Database Setup Guide - Supabase

## ขั้นตอนการติดตั้ง Supabase Database

### **1. สร้าง Supabase Account**
1. ไปที่ https://supabase.com
2. คลิก **"Start your project"**
3. Sign up ด้วย GitHub (แนะนำ) หรือ Email

### **2. สร้าง Project ใหม่**
1. คลิก **"New Project"**
2. กรอกข้อมูล:
   - **Name**: `go-with-us` (หรือชื่อที่ชอบ)
   - **Database Password**: สร้าง password ที่แข็งแรง (เก็บไว้ดีๆ!)
   - **Region**: `Southeast Asia (Singapore)` (ใกล้ไทยสุด)
   - **Pricing Plan**: **Free** (เพียงพอสำหรับ MVP)
3. คลิก **"Create new project"**
4. รอประมาณ 2-3 นาที (กำลังสร้าง database ให้)

### **3. หา Database URL**
1. เมื่อสร้างเสร็จ จะเห็น Dashboard
2. ไปที่ **Settings** (เมนูด้านซ้าย)
3. คลิก **Database**
4. Scroll ลงมาที่ **Connection String**
5. เลือกแท็บ **URI**
6. คัดลอก Connection String ที่ให้มา (จะเป็นแบบนี้):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
7. **เปลี่ยน `[YOUR-PASSWORD]`** ให้เป็น password ที่ตั้งไว้ตอน step 2

### **4. เพิ่ม Database URL ลงใน Backend**
1. เปิดไฟล์ `go-with-us-backend/.env`
2. แทนที่บรรทัด `DATABASE_URL` ด้วย URL ที่คัดลอกมา:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
   ```

### **5. Run Database Migrations**
เปิด Terminal ใน folder `go-with-us-backend` และรันคำสั่ง:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations (สร้างตาราง Users, Trips, Participants)
npx prisma migrate dev --name init

# (Optional) เปิด Prisma Studio เพื่อดู database
npx prisma studio
```

### **6. ตรวจสอบว่าสำเร็จ**
- ✅ ถ้า migration สำเร็จ จะเห็นข้อความ **"Your database is now in sync with your schema"**
- ✅ กลับไปที่ Supabase Dashboard > **Table Editor** จะเห็นตาราง 3 ตัว:
  - `users`
  - `trips`
  - `participants`

---

## 🎉 เสร็จแล้ว!

Database Setup เสร็จสมบูรณ์! ตอนนี้:
- ✅ มี PostgreSQL database บน cloud (Supabase)
- ✅ มีตารางทั้งหมดพร้อมใช้งาน
- ✅ Prisma Client พร้อมเชื่อมต่อ

**Next Steps:**
1. ทดสอบ Backend API ด้วย `npm run dev`
2. เชื่อม Frontend กับ Backend
3. Deploy ทั้งหมดบน Vercel

---

## 🔧 คำสั่งที่ใช้บ่อย

```bash
# Start Backend Server
cd go-with-us-backend
npm run dev

# View Database (Prisma Studio)
npx prisma studio

# Reset Database (ระวัง! จะลบข้อมูลทั้งหมด)
npx prisma migrate reset

# Update schema and migrate
npx prisma migrate dev
```

---

## 📊 Supabase Free Tier Limits

- **Database**: 500 MB
- **Bandwidth**: 5 GB/month
- **API Requests**: Unlimited
- **Auth Users**: Unlimited

เพียงพอสำหรับ MVP และ testing! 🚀
