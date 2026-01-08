# Go With Us Backend

## Stack
- Node.js (Express)
- Prisma ORM
- PostgreSQL

## Getting Started

1. ติดตั้ง dependencies
   ```
npm install
   ```
2. ตั้งค่า DATABASE_URL ในไฟล์ .env
3. สร้างและ migrate database
   ```
npx prisma migrate dev --name init
   ```
4. เริ่มเซิร์ฟเวอร์
   ```
npm run dev
   ```

## โครงสร้างโฟลเดอร์
- src/         // โค้ด backend (Express)
- prisma/      // schema และ migration ของ Prisma
- .env         // ตัวแปรเชื่อมต่อฐานข้อมูล
