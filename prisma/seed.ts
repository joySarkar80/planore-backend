import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    const adminEmail = 'admin@gmail.com';
    const adminPassword = '123456';
    const saltRounds = 12; // Defaulting to 12 if config is tricky to import, but could use process.env

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
    });


    if (existingAdmin) {
        console.log('Admin already exists!');
        return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    const admin = await prisma.user.create({
        data: {
            name: 'Super Admin',
            email: adminEmail,
            password: hashedPassword,
            role: 'ADMIN',
            // img: 'https://i.ibb.co/4pDNDk1/avatar.png',
        },
    });

    console.log('Admin created successfully:', admin);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });