import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Admin credentials
    const adminEmail = 'admin@aimsportal.com';
    const adminPassword = 'Admin@123';
    const adminName = 'System Administrator';

    // Check if admin exists
    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
    });

    if (existingAdmin) {
        console.log('Admin user already exists.');
    } else {
        // Hash password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Create admin user
        await prisma.user.create({
            data: {
                email: adminEmail,
                name: adminName,
                password: hashedPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
            },
        });

        console.log(`✅ Admin user created: ${adminEmail} / ${adminPassword}`);
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
