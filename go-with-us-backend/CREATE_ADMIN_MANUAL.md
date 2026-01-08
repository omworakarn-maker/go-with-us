# 🎯 วิธีสร้าง Admin Account ด้วยตัวเอง

มี **3 วิธี** ในการสร้าง Admin Account:

---

## ✅ **วิธีที่ 1: Register แล้วแก้ Role** (ง่ายที่สุด - แนะนำ)

### ขั้นตอน:

1. **Register บัญชีผ่านเว็บ:**
   - เปิด: http://localhost:5173/register
   - กรอกข้อมูล: ชื่อ, Email, Password
   - กดปุ่ม "สมัครสมาชิก"

2. **เปิด Prisma Studio:**
   ```bash
   cd go-with-us-backend
   npx prisma studio
   ```
   
3. **แก้ไข Role:**
   - เว็บจะเปิดที่: http://localhost:5555
   - ไปที่ตาราง **`users`**
   - หา user ที่เพิ่งสร้าง (ดูจาก email)
   - คลิกที่ช่อง **`role`**
   - เปลี่ยนจาก `user` เป็น `admin`
   - กดปุ่ม **"Save 1 change"** (สีเขียว)

4. **Logout และ Login ใหม่:**
   - Logout จากเว็บ
   - Login ใหม่
   - ✅ ตอนนี้คุณมีสิทธิ์ Admin แล้ว!

---

## ✅ **วิธีที่ 2: สร้างด้วยคำสั่ง Interactive** (ง่ายและปลอดภัย)

### ขั้นตอน:

```bash
cd go-with-us-backend
npm run create-admin
```

จากนั้นกรอกข้อมูลตามที่ถาม:
- ชื่อ (Name)
- อีเมล (Email)
- รหัสผ่าน (Password)

Script จะสร้าง Admin Account ให้อัตโนมัติ!

**ข้อดี:**
- ✅ กรอกข้อมูลเอง
- ✅ เช็คว่า email ซ้ำหรือไม่
- ✅ สามารถแก้ไข role ของ user เดิมได้

---

## ✅ **วิธีที่ 3: ใช้ SQL โดยตรง**

### ถ้าคุณมี user อยู่แล้ว และต้องการเปลี่ยน role:

1. **เปิด Prisma Studio:**
   ```bash
   cd go-with-us-backend
   npx prisma studio
   ```

2. **รัน SQL Query:**
   - ไปที่แท็บ **"Query"** หรือ **"SQL Editor"**
   - รันคำสั่ง:
   ```sql
   UPDATE users 
   SET role = 'admin' 
   WHERE email = 'youremail@example.com';
   ```
   (เปลี่ยน `youremail@example.com` เป็น email ของคุณ)

3. **Logout และ Login ใหม่**

---

## 📝 **สรุป**

| วิธี | ความยาก | เหมาะสำหรับ |
|------|---------|-------------|
| วิธีที่ 1: Register + Prisma Studio | ⭐ ง่าย | มือใหม่ |
| วิธีที่ 2: npm run create-admin | ⭐⭐ ง่าย | ทุกคน (แนะนำ) |
| วิธีที่ 3: SQL Query | ⭐⭐⭐ ปานกลาง | คนที่คุ้นเคยกับ SQL |

---

## ⚠️ **หมายเหตุสำคัญ**

1. **รหัสผ่าน** - ควรมีอย่างน้อย 6 ตัวอักษร
2. **Email ไม่ซ้ำ** - แต่ละ email ใช้ได้แค่ครั้งเดียว
3. **Logout/Login** - หลังแก้ไข role ต้อง logout และ login ใหม่เท่านั้น

---

## 🎯 **ตัวอย่างการใช้งาน**

### ตัวอย่างวิธีที่ 2 (Interactive):

```bash
$ npm run create-admin

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👑 สร้าง Admin Account
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 ชื่อ (Name): John Admin
📧 อีเมล (Email): john@gowithus.com
🔒 รหัสผ่าน (Password): mypassword123

⏳ กำลังสร้างบัญชี...

✅ สร้าง Admin Account สำเร็จ!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email:    john@gowithus.com
👤 Name:     John Admin
🔑 Role:     admin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 ตอนนี้คุณสามารถ Login ด้วยบัญชีนี้ได้แล้ว!
```

---

## 🔍 **เช็ค Admin ใน Database**

```bash
cd go-with-us-backend
npx prisma studio
```

จากนั้น:
1. ไปที่ตาราง **`users`**
2. กรองด้วย `role = "admin"`
3. ดู Admin ทั้งหมดในระบบ
