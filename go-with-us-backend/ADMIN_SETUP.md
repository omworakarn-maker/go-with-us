# 👑 Admin Account Setup Guide

## 📋 วิธีสร้าง Admin Account

### ขั้นตอนที่ 1: รัน Seed Script

เปิด Terminal ใหม่และไปที่ Backend folder:

```bash
cd go-with-us-backend
npm run seed
```

### ขั้นตอนที่ 2: Login ด้วย Admin Account

**ข้อมูลเข้าสู่ระบบ:**
```
📧 Email:    admin@gowithus.com
🔒 Password: admin123456
🔑 Role:     admin
```

### ขั้นตอนที่ 3: Login ในเว็บไซต์

1. เปิด browser ไปที่: `http://localhost:5173/login`
2. กรอก Email: `admin@gowithus.com`
3. กรอก Password: `admin123456`
4. กดปุ่ม "เข้าสู่ระบบ"

---

## 🧪 Test User Account (ผู้ใช้ทั่วไป)

Seed script จะสร้าง Test User ให้ด้วย:

```
📧 Email:    user@gowithus.com
🔒 Password: user123456
🔑 Role:     user
```

---

## ⚠️ หมายเหตุสำคัญ

1. **เปลี่ยนรหัสผ่าน** - หลังจาก login ครั้งแรก ควรเปลี่ยนรหัสผ่านทันที
2. **Production** - ใน production อย่าใช้รหัสผ่านง่ายๆ แบบนี้
3. **Email ไม่ซ้ำ** - หากรัน seed หลายครั้ง จะไม่สร้าง admin ซ้ำ (มีการเช็คก่อนสร้าง)

---

## 🔧 คำสั่งเพิ่มเติม

### ดู Admin ทั้งหมดใน Database:
```bash
cd go-with-us-backend
npx prisma studio
```

จากนั้นไปที่ตาราง `users` และกรอง `role = "admin"`

### ลบ Admin Account (ถ้าต้องการ):
ใช้ Prisma Studio หรือรันคำสั่ง:
```bash
npx prisma studio
```
แล้วลบ user ที่มี email `admin@gowithus.com`

---

## 🎯 การใช้งาน Admin Account

Admin account จะมีสิทธิ์พิเศษ เช่น:
- ✅ ลบทริปของคนอื่นได้
- ✅ แก้ไขทริปทั้งหมด
- ✅ จัดการผู้ใช้
- ✅ เข้าถึงหน้า Admin Dashboard (ถ้ามี)

**Role ใน JWT Token:**
เมื่อ login แล้ว JWT token จะมีข้อมูล:
```json
{
  "userId": "xxx",
  "email": "admin@gowithus.com",
  "role": "admin"
}
```

Frontend สามารถใช้ `role` เพื่อแสดง/ซ่อน feature ได้
