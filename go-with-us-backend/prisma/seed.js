import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
        where: { email: 'admin@gowithus.com' },
    });

    if (existingAdmin) {
        console.log('⚠️  Admin account already exists. Skipping...');
        console.log('📧 Email:', existingAdmin.email);
        console.log('👤 Name:', existingAdmin.name);
        console.log('🔑 Role:', existingAdmin.role);
        return;
    }

    // Hash default password
    const hashedPassword = await bcrypt.hash('admin123456', 10);

    // Create admin user
    const admin = await prisma.user.create({
        data: {
            name: 'Admin',
            email: 'admin@gowithus.com',
            password: hashedPassword,
            role: 'admin',
        },
    });

    console.log('✅ Admin account created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    admin@gowithus.com');
    console.log('🔒 Password: admin123456');
    console.log('👤 Name:     Admin');
    console.log('🔑 Role:     admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  Don\'t forget to change the password after first login!');
    console.log('');

    // Optional: Create a sample regular user
    const hashedUserPassword = await bcrypt.hash('user123456', 10);

    const existingUser = await prisma.user.findUnique({
        where: { email: 'user@gowithus.com' },
    });

    if (!existingUser) {
        const user = await prisma.user.create({
            data: {
                name: 'Test User',
                email: 'user@gowithus.com',
                password: hashedUserPassword,
                role: 'user',
            },
        });

        console.log('✅ Sample user account created!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email:    user@gowithus.com');
        console.log('🔒 Password: user123456');
        console.log('👤 Name:     Test User');
        console.log('🔑 Role:     user');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
