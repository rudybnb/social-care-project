import pkg from 'pg';
const { Pool } = pkg;
import * as dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';

// Import compiled schema
import { staff, sites } from './dist/schema.js';

dotenv.config();

const restoreStaff = async () => {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com') ? {
            rejectUnauthorized: false
        } : false
    });

    const db = drizzle(pool);

    console.log('🚀 Starting staff restoration...');

    try {
        // 1. Create test staff account (username: tom, password: jones123)
        console.log('👤 Checking test staff account...');
        const hashedPassword = await bcrypt.hash('jones123', 10);

        const existingStaff = await db.select().from(staff).where(eq(staff.username, 'tom'));

        if (existingStaff.length === 0) {
            await db.insert(staff).values({
                name: 'Tom Jones',
                username: 'tom',
                password: hashedPassword,
                role: 'Worker',
                site: 'Kent Care Home',
                status: 'Active',
                rates: '£12.50/hr',
                standardRate: '12.50',
            });
            console.log('✅ Test staff account created (username: tom)');
        } else {
            console.log('ℹ️  Test staff account already exists');
        }

        // 2. Create Admin User
        console.log('👤 Checking Admin account...');
        const existingAdmin = await db.select().from(staff).where(eq(staff.username, 'admin'));
        if (existingAdmin.length === 0) {
            await db.insert(staff).values({
                name: 'Admin User',
                username: 'admin',
                password: await bcrypt.hash('admin123', 10),
                role: 'Admin',
                site: 'All Sites',
                status: 'Active',
                rates: '£15.00/hr',
                standardRate: '15.00',
            });
            console.log('✅ Admin staff account created (username: admin)');
        }

        // 3. Create Site Manager
        console.log('👤 Checking Site Manager account...');
        const existingManager = await db.select().from(staff).where(eq(staff.username, 'manager'));
        if (existingManager.length === 0) {
            await db.insert(staff).values({
                name: 'Site Manager',
                username: 'manager',
                password: await bcrypt.hash('manager123', 10),
                role: 'Site Manager',
                site: 'Thamesmead Care Home',
                status: 'Active',
                rates: '£14.00/hr',
                standardRate: '14.00',
            });
            console.log('✅ Manager staff account created (username: manager)');
        }

        // 4. Generate QR codes for sites
        console.log('🔲 Checking QR codes for sites...');
        const allSites = await db.select().from(sites);

        for (const site of allSites) {
            if (!site.qrCode) {
                // Generate a unique QR code for each site
                const qrCodeData = `SITE:${site.id}:${Date.now()}`;
                await db.update(sites)
                    .set({
                        qrCode: qrCodeData,
                        qrGenerated: true
                    })
                    .where(eq(sites.id, site.id));
                console.log(`✅ QR code generated for ${site.name}`);
            }
        }

        console.log('🎉 Staff restoration completed successfully!');
    } catch (error) {
        console.error('❌ Restoration failed:', error);
        process.exit(1);
    }

    await pool.end();
    process.exit(0);
};

restoreStaff();
